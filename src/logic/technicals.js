// Technical analysis primitives derived from a daily close series.
// All functions return arrays aligned with the input (null where the window
// hasn't filled yet) so they can be attached point-by-point to chart data.

export function calcSMA(closes, period) {
  const out = new Array(closes.length).fill(null);
  if (closes.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  out[period - 1] = sum / period;
  for (let i = period; i < closes.length; i++) {
    sum += closes[i] - closes[i - period];
    out[i] = sum / period;
  }
  return out;
}

export function calcEMA(closes, period) {
  const out = new Array(closes.length).fill(null);
  if (closes.length < period) return out;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = ema;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

// MACD(12, 26, 9). Returns aligned arrays.
export function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const efast = calcEMA(closes, fast);
  const eslow = calcEMA(closes, slow);
  const macd = closes.map((_, i) =>
    efast[i] != null && eslow[i] != null ? efast[i] - eslow[i] : null
  );
  // Signal EMA over the macd series (skipping nulls at the start)
  const firstIdx = macd.findIndex((v) => v != null);
  const macdValid = macd.slice(firstIdx);
  const sigValid = calcEMA(macdValid, signal);
  const sigLine = new Array(closes.length).fill(null);
  sigValid.forEach((v, i) => {
    sigLine[firstIdx + i] = v;
  });
  const hist = macd.map((m, i) => (m != null && sigLine[i] != null ? m - sigLine[i] : null));
  return { macd, signal: sigLine, hist };
}

// Bollinger Bands (20-day SMA ± k * stddev).
export function calcBollinger(closes, period = 20, k = 2) {
  const sma = calcSMA(closes, period);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  const std = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    std[i] = sd;
    upper[i] = mean + k * sd;
    lower[i] = mean - k * sd;
  }
  return { upper, middle: sma, lower, std };
}

// Detect the most recent crossover between two aligned series.
// Returns { type: 'golden'|'dead', daysAgo } or null.
export function lastCross(short, long) {
  const n = short.length;
  for (let i = n - 1; i > 0; i--) {
    const a1 = short[i - 1];
    const a2 = short[i];
    const b1 = long[i - 1];
    const b2 = long[i];
    if (a1 == null || a2 == null || b1 == null || b2 == null) continue;
    const prev = a1 - b1;
    const curr = a2 - b2;
    if (prev <= 0 && curr > 0) return { type: 'golden', daysAgo: n - 1 - i };
    if (prev >= 0 && curr < 0) return { type: 'dead', daysAgo: n - 1 - i };
  }
  return null;
}

// 52-week (252 trading days) high/low + current position 0..1.
export function fiftyTwoWeek(closes, highs, lows) {
  const window = closes.slice(-252);
  const wHighs = highs.slice(-252);
  const wLows = lows.slice(-252);
  if (!window.length) return null;
  const high = Math.max(...wHighs);
  const low = Math.min(...wLows);
  const last = window[window.length - 1];
  const range = high - low;
  const pos = range > 0 ? (last - low) / range : 0.5;
  return {
    high,
    low,
    last,
    posPct: +(pos * 100).toFixed(1),
    fromHighPct: +(((last - high) / high) * 100).toFixed(2),
    fromLowPct: +(((last - low) / low) * 100).toFixed(2),
  };
}

// Bollinger position as percent of band width (0=lower, 1=upper).
export function bollingerPos(close, upper, lower) {
  if (close == null || upper == null || lower == null || upper === lower) return null;
  return +(((close - lower) / (upper - lower)) * 100).toFixed(1);
}
