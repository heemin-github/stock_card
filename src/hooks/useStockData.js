import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calcRSI,
  calcMFI,
  calcOBVRatio,
  calcATRPct,
  calcAvgDailyValue,
  detectTrend,
} from '../logic/indicators.js';
import {
  calcSMA,
  calcMACD,
  calcBollinger,
  lastCross,
  fiftyTwoWeek,
  bollingerPos,
} from '../logic/technicals.js';

const DAILY_LOOKBACK = 252;
const INTRADAY_PARAMS = {
  '1D': { interval: '5min', outputsize: 78 },
  '1W': { interval: '30min', outputsize: 70 },
};

// Cache TTLs tuned to keep requests within Twelve Data's 8 req/min free tier.
const TTL = {
  spy: 15 * 60 * 1000,
  intraday: 2 * 60 * 1000,
};

const cache = new Map();

async function tdGet(path, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/td/${path}?${qs}`);
  let json;
  try {
    json = await res.json();
  } catch (_e) {
    throw new Error(`Twelve Data ${path} returned non-JSON (${res.status})`);
  }
  if (json?.status === 'error' || json?.code) {
    throw new Error(json.message ?? `Twelve Data ${path} error (${json.code ?? res.status})`);
  }
  return json;
}

async function tdGetCached(path, params, ttlMs) {
  const key = `${path}?${new URLSearchParams(params)}`;
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.value;
  const value = await tdGet(path, params);
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

async function tdGetSoftCached(path, params, ttlMs) {
  try {
    return await tdGetCached(path, params, ttlMs);
  } catch (e) {
    console.warn(`[useStockData] soft cached fetch failed: ${path}`, params, e.message);
    return null;
  }
}

function parseSeries(payload) {
  if (!payload?.values) return [];
  return payload.values
    .slice()
    .reverse()
    .map((v) => ({
      t: new Date(v.datetime).getTime(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume ?? '0'),
    }))
    .filter((d) => Number.isFinite(d.close));
}

function decorateDaily(series) {
  const closes = series.map((d) => d.close);
  const ma5 = calcSMA(closes, 5);
  const ma20 = calcSMA(closes, 20);
  const ma60 = calcSMA(closes, 60);
  const ma200 = calcSMA(closes, 200);
  const bb = calcBollinger(closes, 20, 2);
  return series.map((d, i) => ({
    ...d,
    ma5: ma5[i],
    ma20: ma20[i],
    ma60: ma60[i],
    ma200: ma200[i],
    bbUpper: bb.upper[i],
    bbLower: bb.lower[i],
  }));
}

function sliceTail(series, n) {
  return series.length > n ? series.slice(-n) : series;
}

function lookbackReturnPct(closes, days) {
  if (!closes || closes.length <= days) return null;
  const last = closes[closes.length - 1];
  const ref = closes[closes.length - 1 - days];
  if (!ref) return null;
  return +(((last - ref) / ref) * 100).toFixed(2);
}

export function useStockData(ticker) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const intradayLoading = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, data: null });
    intradayLoading.current = new Set();

    (async () => {
      try {
        // Initial load: only daily + secondary (cached). Intraday is lazy.
        const daily = await tdGet('time_series', {
          symbol: ticker,
          interval: '1day',
          outputsize: DAILY_LOOKBACK,
        });

        const dailyRaw = parseSeries(daily);
        const dailySeries = decorateDaily(dailyRaw);

        const chart = {
          '1D': [], // lazy
          '1W': [], // lazy
          '1M': sliceTail(dailySeries, 22),
          '3M': sliceTail(dailySeries, 63),
          '1Y': dailySeries,
        };

        const closes = dailyRaw.map((d) => d.close);
        const highs = dailyRaw.map((d) => d.high);
        const lows = dailyRaw.map((d) => d.low);
        const volumes = dailyRaw.map((d) => d.volume);

        const price = closes[closes.length - 1];
        const prevClose = closes[closes.length - 2] ?? price;
        const change = price - prevClose;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;

        const spyDaily = await tdGetSoftCached(
          'time_series',
          { symbol: 'SPY', interval: '1day', outputsize: 30 },
          TTL.spy
        );

        // Market context from SPY
        let marketAtrPct = null;
        let rsSpy1M = null;
        const spySeries = parseSeries(spyDaily);
        if (spySeries.length >= 22) {
          const sH = spySeries.map((d) => d.high);
          const sL = spySeries.map((d) => d.low);
          const sC = spySeries.map((d) => d.close);
          marketAtrPct = calcATRPct(sH, sL, sC, 14);
          const tickerR = lookbackReturnPct(closes, 21);
          const spyR = lookbackReturnPct(sC, 21);
          if (tickerR != null && spyR != null) rsSpy1M = +(tickerR - spyR).toFixed(2);
        }

        const todayVol = volumes[volumes.length - 1] ?? 0;
        const avg20Vol =
          volumes.length >= 20 ? volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20 : null;
        const volSpike = avg20Vol > 0 ? +(todayVol / avg20Vol).toFixed(2) : null;

        const returns = {
          '1M': lookbackReturnPct(closes, 21),
          '3M': lookbackReturnPct(closes, 63),
          '1Y': lookbackReturnPct(closes, 252),
        };

        const indicators = {
          rsi: calcRSI(closes, 14),
          mfi: calcMFI(highs, lows, closes, volumes, 14),
          obv: calcOBVRatio(closes, volumes, 20),
          marketAtrPct,
          rsSpy1M,
          adv20: calcAvgDailyValue(closes, volumes, 20),
          atrPct: calcATRPct(highs, lows, closes, 14),
          volSpike,
        };
        const structure = detectTrend(closes, 20);

        const ma5 = calcSMA(closes, 5);
        const ma20 = calcSMA(closes, 20);
        const ma60 = calcSMA(closes, 60);
        const ma200 = calcSMA(closes, 200);
        const macdRes = calcMACD(closes);
        const bb = calcBollinger(closes, 20, 2);
        const lastClose = closes[closes.length - 1];
        const technicals = {
          ma: { ma5: tail(ma5), ma20: tail(ma20), ma60: tail(ma60), ma200: tail(ma200) },
          maAlignment: detectAlignment(tail(ma5), tail(ma20), tail(ma60), tail(ma200)),
          shortCross: lastCross(ma5, ma20),
          longCross: lastCross(ma60, ma200),
          macd: {
            macd: tail(macdRes.macd),
            signal: tail(macdRes.signal),
            hist: tail(macdRes.hist),
            cross: lastCross(macdRes.macd, macdRes.signal),
          },
          bollinger: {
            upper: tail(bb.upper),
            middle: tail(bb.middle),
            lower: tail(bb.lower),
            posPct: bollingerPos(lastClose, tail(bb.upper), tail(bb.lower)),
          },
          fiftyTwoWeek: fiftyTwoWeek(closes, highs, lows),
        };

        const apiStatus = {
          spy: spySeries.length > 0,
        };

        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          data: {
            ticker,
            name: daily?.meta?.symbol ?? ticker,
            currency: daily?.meta?.currency ?? 'USD',
            apiStatus,
            price,
            change,
            changePct,
            chart,
            indicators,
            structure,
            technicals,
            returns,
          },
        });
      } catch (err) {
        if (cancelled) return;
        setState({ loading: false, error: err.message ?? String(err), data: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  // Lazy intraday loader — fired by MiniChart when user clicks 1D/1W tab.
  // Cached so repeated tab switches don't re-fetch.
  const loadIntraday = useCallback(
    async (range) => {
      if (range !== '1D' && range !== '1W') return;
      if (!state.data) return;
      if (state.data.chart[range] && state.data.chart[range].length > 0) return;
      const inflightKey = `${ticker}:${range}`;
      if (intradayLoading.current.has(inflightKey)) return;
      intradayLoading.current.add(inflightKey);

      const params = {
        symbol: ticker,
        interval: INTRADAY_PARAMS[range].interval,
        outputsize: INTRADAY_PARAMS[range].outputsize,
      };
      const payload = await tdGetSoftCached('time_series', params, TTL.intraday);
      intradayLoading.current.delete(inflightKey);
      if (!payload) return;
      const series = parseSeries(payload);
      setState((s) => {
        if (!s.data || s.data.ticker !== ticker) return s;
        return {
          ...s,
          data: {
            ...s.data,
            chart: { ...s.data.chart, [range]: series },
          },
        };
      });
    },
    [ticker, state.data]
  );

  return { ...state, loadIntraday };
}

function tail(arr) {
  return arr[arr.length - 1] ?? null;
}

function detectAlignment(m5, m20, m60, m200) {
  if ([m5, m20, m60, m200].some((v) => v == null)) return null;
  if (m5 > m20 && m20 > m60 && m60 > m200) return 'perfect-up';
  if (m5 < m20 && m20 < m60 && m60 < m200) return 'perfect-down';
  if (m5 > m20 && m20 > m60) return 'short-up';
  if (m5 < m20 && m20 < m60) return 'short-down';
  return 'mixed';
}
