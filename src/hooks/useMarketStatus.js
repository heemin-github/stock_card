import { useEffect, useState } from 'react';
import { calcATRPct } from '../logic/indicators.js';

const CACHE_KEY = 'stockcard.marketStatus.spy';
const TTL_MS = 15 * 60 * 1000;

function parseSeries(payload) {
  if (!payload?.values) return [];
  return payload.values
    .slice()
    .reverse()
    .map((v) => ({
      t: new Date(v.datetime).getTime(),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }))
    .filter((d) => Number.isFinite(d.close));
}

function lookbackReturnPct(closes, days) {
  if (!closes || closes.length <= days) return null;
  const last = closes[closes.length - 1];
  const ref = closes[closes.length - 1 - days];
  if (!ref) return null;
  return +(((last - ref) / ref) * 100).toFixed(2);
}

function buildStatus(payload) {
  const series = parseSeries(payload);
  const closes = series.map((d) => d.close);
  const highs = series.map((d) => d.high);
  const lows = series.map((d) => d.low);
  const atrPct = calcATRPct(highs, lows, closes, 14);
  const return1M = lookbackReturnPct(closes, 21);
  const last = series[series.length - 1] ?? null;

  let tone = 'neutral';
  let label = '중립';
  if (atrPct != null && atrPct >= 2) {
    tone = 'bad';
    label = '변동성 높음';
  } else if (return1M != null && return1M > 0 && atrPct != null && atrPct < 1.5) {
    tone = 'good';
    label = '우호적';
  } else if (return1M != null && return1M < -3) {
    tone = 'warn';
    label = '약세 주의';
  }

  return {
    atrPct,
    return1M,
    lastClose: last?.close ?? null,
    lastDate: last ? new Date(last.t).toISOString().slice(0, 10) : null,
    tone,
    label,
  };
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached?.expires > Date.now()) return cached.value;
  } catch (_e) {
    return null;
  }
  return null;
}

function writeCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, expires: Date.now() + TTL_MS }));
  } catch (_e) {
    /* ignore quota errors */
  }
}

export function useMarketStatus() {
  const [state, setState] = useState(() => ({
    loading: !readCache(),
    error: null,
    data: readCache(),
  }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cached = readCache();
        if (cached) {
          setState({ loading: false, error: null, data: cached });
          return;
        }

        const qs = new URLSearchParams({
          symbol: 'SPY',
          interval: '1day',
          outputsize: '30',
        });
        const res = await fetch(`/api/td/time_series?${qs}`);
        const json = await res.json();
        if (json?.status === 'error' || json?.code) {
          throw new Error(json.message ?? 'market status unavailable');
        }

        const next = buildStatus(json);
        writeCache(next);
        if (!cancelled) setState({ loading: false, error: null, data: next });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message ?? String(err), data: null });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
