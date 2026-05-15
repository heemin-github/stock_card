// Technical indicator calculations from raw OHLCV series.
// All inputs are arrays in chronological order (oldest -> newest).

export function calcRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calcMFI(highs, lows, closes, volumes, period = 14) {
  if (!closes || closes.length < period + 1) return null;
  const tp = closes.map((_, i) => (highs[i] + lows[i] + closes[i]) / 3);
  const flow = tp.map((v, i) => v * volumes[i]);
  let posFlow = 0;
  let negFlow = 0;
  const start = closes.length - period;
  for (let i = start; i < closes.length; i++) {
    if (tp[i] > tp[i - 1]) posFlow += flow[i];
    else if (tp[i] < tp[i - 1]) negFlow += flow[i];
  }
  if (negFlow === 0) return 100;
  const mr = posFlow / negFlow;
  return 100 - 100 / (1 + mr);
}

// OBV ratio: latest OBV vs N-day rolling baseline (returns ratio centered around 1)
export function calcOBVRatio(closes, volumes, lookback = 20) {
  if (!closes || closes.length < lookback + 1) return null;
  const obv = [0];
  for (let i = 1; i < closes.length; i++) {
    const prev = obv[i - 1];
    if (closes[i] > closes[i - 1]) obv.push(prev + volumes[i]);
    else if (closes[i] < closes[i - 1]) obv.push(prev - volumes[i]);
    else obv.push(prev);
  }
  const recent = obv.slice(-lookback);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (avg === 0) return 1;
  return obv[obv.length - 1] / avg;
}

export function calcATRPct(highs, lows, closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;
  const tr = [];
  for (let i = 1; i < closes.length; i++) {
    const h = highs[i];
    const l = lows[i];
    const pc = closes[i - 1];
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  const recent = tr.slice(-period);
  const atr = recent.reduce((a, b) => a + b, 0) / period;
  return (atr / closes[closes.length - 1]) * 100;
}

// 20-day average traded value (price * volume), in raw currency units
export function calcAvgDailyValue(closes, volumes, period = 20) {
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  const vSlice = volumes.slice(-period);
  const sum = slice.reduce((acc, c, i) => acc + c * vSlice[i], 0);
  return sum / period;
}

// Trend detection via linear regression slope normalised by price.
export function detectTrend(closes, lookback = 20) {
  if (!closes || closes.length < lookback) return { trend: 'sideways', consecutiveUp: 0 };
  const slice = closes.slice(-lookback);
  const n = slice.length;
  const xMean = (n - 1) / 2;
  const yMean = slice.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (slice[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const slopePct = (slope / yMean) * 100;

  let trend = 'sideways';
  if (slopePct > 0.15) trend = 'up';
  else if (slopePct < -0.15) trend = 'down';

  let consecutiveUp = 0;
  for (let i = closes.length - 1; i > 0; i--) {
    if (closes[i] > closes[i - 1]) consecutiveUp++;
    else break;
  }
  return { trend, consecutiveUp };
}

// Aggregate scoring used by judgeStock.
// Numbers are 0-100 heuristic blends — they are not financial advice, just
// deterministic translations of the raw indicators above.
export function calcScores({ rsi, mfi, obv, adv20, atrPct, structure }) {
  const trendBoost = structure?.trend === 'up' ? 25 : structure?.trend === 'down' ? -25 : 0;
  const consecBoost = Math.min((structure?.consecutiveUp ?? 0) * 4, 20);
  const structureScore = clamp(60 + trendBoost + consecBoost, 0, 100);

  const rsiPenalty = rsi == null ? 0 : rsi >= 80 ? -25 : rsi <= 20 ? -10 : 0;
  const atrPenalty = atrPct == null ? 0 : atrPct > 6 ? -15 : atrPct > 4 ? -5 : 5;
  const executionScore = clamp(55 + rsiPenalty + atrPenalty, 0, 100);

  const mfiBoost = mfi == null ? 0 : mfi >= 60 ? 15 : mfi <= 40 ? -10 : 0;
  const obvBoost = obv == null ? 0 : obv > 1.05 ? 15 : obv < 0.95 ? -15 : 0;
  const supplyScore = clamp(55 + mfiBoost + obvBoost, 0, 100);

  return { structureScore, executionScore, supplyScore };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
