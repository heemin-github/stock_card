import { useCallback, useState } from 'react';
import {
  calcRSI,
  calcMFI,
  calcOBVRatio,
  calcATRPct,
  calcAvgDailyValue,
  detectTrend,
} from '../logic/indicators.js';
import { judgeStock, buildTargets, getRule } from '../logic/judgeStock.js';
import { buildTradeSignal } from '../logic/tradeSignal.js';

const CACHE_PREFIX = 'stockcard.quickSignal.';
const TTL_MS = 15 * 60 * 1000;

function parseSeries(payload) {
  if (!payload?.values) return [];
  return payload.values
    .slice()
    .reverse()
    .map((v) => ({
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume ?? '0'),
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

async function tdGet(path, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/td/${path}?${qs}`);
  const json = await res.json();
  if (json?.status === 'error' || json?.code) {
    throw new Error(json.message ?? `Twelve Data ${path} error`);
  }
  return json;
}

function cacheKey(symbol, mode) {
  return `${CACHE_PREFIX}${symbol}.${mode}`;
}

function readCache(symbol, mode) {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey(symbol, mode)) || 'null');
    if (cached?.expires > Date.now()) return cached.value;
  } catch (_e) {
    return null;
  }
  return null;
}

function writeCache(symbol, mode, value) {
  try {
    localStorage.setItem(
      cacheKey(symbol, mode),
      JSON.stringify({ value, expires: Date.now() + TTL_MS })
    );
  } catch (_e) {
    /* ignore quota errors */
  }
}

async function buildQuickSignal(symbol, mode) {
  const [daily, spyDaily] = await Promise.all([
    tdGet('time_series', { symbol, interval: '1day', outputsize: 252 }),
    tdGet('time_series', { symbol: 'SPY', interval: '1day', outputsize: 30 }),
  ]);

  const series = parseSeries(daily);
  const closes = series.map((d) => d.close);
  const highs = series.map((d) => d.high);
  const lows = series.map((d) => d.low);
  const volumes = series.map((d) => d.volume);
  const price = closes[closes.length - 1];
  const spySeries = parseSeries(spyDaily);
  const spyCloses = spySeries.map((d) => d.close);
  const tickerReturn1M = lookbackReturnPct(closes, 21);
  const spyReturn1M = lookbackReturnPct(spyCloses, 21);
  const avg20Vol =
    volumes.length >= 21 ? volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20 : null;

  const indicators = {
    rsi: calcRSI(closes, 14),
    mfi: calcMFI(highs, lows, closes, volumes, 14),
    obv: calcOBVRatio(closes, volumes, 20),
    marketAtrPct: calcATRPct(
      spySeries.map((d) => d.high),
      spySeries.map((d) => d.low),
      spyCloses,
      14
    ),
    rsSpy1M:
      tickerReturn1M != null && spyReturn1M != null
        ? +(tickerReturn1M - spyReturn1M).toFixed(2)
        : null,
    adv20: calcAvgDailyValue(closes, volumes, 20),
    atrPct: calcATRPct(highs, lows, closes, 14),
    volSpike: avg20Vol > 0 ? +(volumes[volumes.length - 1] / avg20Vol).toFixed(2) : null,
  };
  const structure = detectTrend(closes, 20);
  const judgement = judgeStock(indicators, structure, mode);
  const rule = getRule(mode);
  const signal = buildTradeSignal(
    { price, indicators, structure },
    judgement,
    rule,
    buildTargets(price, indicators.atrPct)
  );

  return {
    symbol,
    mode,
    action: signal.action,
    grade: judgement.finalGrade,
    stage: judgement.entryStage,
    label: signal.headline.replace('통합 매매 신호: ', ''),
    checkedAt: new Date().toISOString(),
  };
}

export function useQuickSignal(mode = 'swing') {
  const [results, setResults] = useState({});
  const [loadingSymbol, setLoadingSymbol] = useState(null);

  const check = useCallback(
    async (symbol) => {
      const normalized = symbol.toUpperCase();
      const cached = readCache(normalized, mode);
      if (cached) {
        setResults((prev) => ({ ...prev, [normalized]: cached }));
        return cached;
      }

      setLoadingSymbol(normalized);
      try {
        const next = await buildQuickSignal(normalized, mode);
        writeCache(normalized, mode, next);
        setResults((prev) => ({ ...prev, [normalized]: next }));
        return next;
      } catch (err) {
        const failed = {
          symbol: normalized,
          mode,
          action: 'ERROR',
          label: '확인 실패',
          error: err.message ?? String(err),
          checkedAt: new Date().toISOString(),
        };
        setResults((prev) => ({ ...prev, [normalized]: failed }));
        return failed;
      } finally {
        setLoadingSymbol(null);
      }
    },
    [mode]
  );

  return { results, loadingSymbol, check };
}
