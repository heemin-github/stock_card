import { calcScores } from './indicators.js';

// Market environment threshold uses SPY ATR% (replacing VIX, which the free
// Twelve Data plan blocks). Rough mapping: VIX 25/30/35 ≈ SPY ATR% 1.0/1.5/2.0.
const swingRules = {
  weights: { structure: 0.4, execution: 0.3, supply: 0.3 },
  entry: { structureMin: 70, executionMin: 50, rsiRange: [30, 70], marketAtrMax: 1.0 },
  watch: { structureMin: 70, rsiBand: [70, 80] },
  reject: { structureMin: 70, rsiHard: 80, marketAtrHard: 1.0 },
  highlightHorizon: '7D',
  label: '스윙 (7~14일)',
};

const midRules = {
  weights: { structure: 0.45, execution: 0.3, supply: 0.25 },
  entry: { structureMin: 65, executionMin: 40, rsiMax: 85, marketAtrMax: 1.5, requireUp: true },
  watch: { structureMin: 65, rsiBand: [80, 85], marketAtrBand: [1.0, 1.5] },
  reject: { structureMin: 65, rsiHard: 85, marketAtrHard: 1.5, rejectDown: true },
  highlightHorizon: '1M',
  label: '중장기 (1~3개월)',
};

const longRules = {
  weights: { structure: 0.5, execution: 0.2, supply: 0.3 },
  entry: { structureMin: 60, marketAtrMax: 2.0, requireUp: true },
  watch: { structureMin: 60, allowSideways: true },
  reject: { structureMin: 60, marketAtrHard: 2.0, rejectDown: true },
  highlightHorizon: '3M',
  label: '장기 (3개월+)',
};

const RULES = { swing: swingRules, mid: midRules, long: longRules };

export function getRule(mode) {
  return RULES[mode] ?? swingRules;
}

export function judgeStock(indicators, structure, mode = 'swing') {
  const rule = getRule(mode);
  const scores = calcScores({ ...indicators, structure });
  const rejectFails = countRejectFails(scores, indicators, structure, rule);
  const entryStage = calcEntryStage(scores, indicators, structure, rule, rejectFails);
  const finalGrade = calcGrade(scores, indicators, structure, mode, rejectFails);
  const strategy =
    entryStage === 'ENTRY' ? 'BUY' : entryStage === 'WATCH_ONLY' ? 'WATCH_ONLY' : 'REJECT';
  const reason = buildReason(scores, indicators, structure, rule, entryStage);

  return { mode, rule, scores, entryStage, finalGrade, strategy, reason };
}

function countRejectFails(scores, ind, structure, rule) {
  const fails = [];
  if (scores.structureScore < rule.reject.structureMin)
    fails.push(`구조 ${scores.structureScore.toFixed(0)} < ${rule.reject.structureMin}`);
  if (rule.reject.rsiHard != null && ind.rsi != null && ind.rsi >= rule.reject.rsiHard)
    fails.push(`RSI ${ind.rsi.toFixed(0)} ≥ ${rule.reject.rsiHard}`);
  if (
    rule.reject.marketAtrHard != null &&
    ind.marketAtrPct != null &&
    ind.marketAtrPct >= rule.reject.marketAtrHard
  )
    fails.push(`시장 ATR ${ind.marketAtrPct.toFixed(2)}% ≥ ${rule.reject.marketAtrHard}%`);
  if (rule.reject.rejectDown && structure?.trend === 'down') fails.push('추세 하락');
  return fails;
}

function calcEntryStage(scores, ind, structure, rule, rejectFails) {
  if (rejectFails.length > 0) return 'REJECT';

  const e = rule.entry;
  const structOK = scores.structureScore >= e.structureMin;
  const execOK = e.executionMin == null || scores.executionScore >= e.executionMin;
  const rsiOK =
    (e.rsiRange == null || (ind.rsi != null && ind.rsi >= e.rsiRange[0] && ind.rsi <= e.rsiRange[1])) &&
    (e.rsiMax == null || ind.rsi == null || ind.rsi < e.rsiMax);
  const marketOK =
    e.marketAtrMax == null || ind.marketAtrPct == null || ind.marketAtrPct < e.marketAtrMax;
  const trendOK = !e.requireUp || structure?.trend === 'up';

  if (structOK && execOK && rsiOK && marketOK && trendOK) return 'ENTRY';

  const w = rule.watch;
  const watchStruct = scores.structureScore >= w.structureMin;
  const watchExec = w.executionMin != null ? scores.executionScore < w.executionMin : false;
  const watchRsi = w.rsiBand && ind.rsi != null && ind.rsi >= w.rsiBand[0] && ind.rsi <= w.rsiBand[1];
  const watchMarket =
    w.marketAtrBand &&
    ind.marketAtrPct != null &&
    ind.marketAtrPct >= w.marketAtrBand[0] &&
    ind.marketAtrPct <= w.marketAtrBand[1];
  const watchSideways = w.allowSideways && structure?.trend === 'sideways';
  if (watchStruct && (watchExec || watchRsi || watchMarket || watchSideways || !trendOK))
    return 'WATCH_ONLY';

  return 'REJECT';
}

function calcGrade(scores, ind, structure, mode, rejectFails) {
  if (rejectFails.length >= 2) return 'F';
  const s = scores.structureScore;
  const e = scores.executionScore;
  const trend = structure?.trend;

  if (mode === 'swing') {
    if (s >= 80 && e >= 60 && ind.rsi != null && ind.rsi >= 30 && ind.rsi <= 70) return 'A';
    if (s >= 70 && e >= 50) return 'B';
    if (s >= 60) return 'C';
    return 'D';
  }
  if (mode === 'mid') {
    if (s >= 80 && trend === 'up' && (ind.rsi == null || ind.rsi < 75)) return 'A';
    if (s >= 70 && trend === 'up') return 'B';
    if (s >= 65 || trend === 'sideways') return 'C';
    return 'D';
  }
  // long
  if (s >= 80 && trend === 'up' && (structure?.consecutiveUp ?? 0) >= 3) return 'A';
  if (s >= 70 && trend === 'up') return 'B';
  if (s >= 60 || trend === 'sideways') return 'C';
  return 'D';
}

function buildReason(scores, ind, structure, rule, stage) {
  const bits = [];
  bits.push(`구조 ${scores.structureScore.toFixed(0)}`);
  bits.push(`실행 ${scores.executionScore.toFixed(0)}`);
  bits.push(`수급 ${scores.supplyScore.toFixed(0)}`);
  if (ind.rsi != null) bits.push(`RSI ${ind.rsi.toFixed(0)}`);
  if (ind.marketAtrPct != null) bits.push(`시장 ATR ${ind.marketAtrPct.toFixed(2)}%`);
  bits.push(`추세 ${structure?.trend ?? '?'}`);
  const head =
    stage === 'ENTRY'
      ? '진입 조건 충족'
      : stage === 'WATCH_ONLY'
      ? '관찰 — 일부 조건 미달'
      : '거부 — 강제 조건';
  return `${head} · ${bits.join(' · ')}`;
}

// Simple horizon target estimator from ATR%. Not financial advice — used only
// to populate the on-card target table.
export function buildTargets(price, atrPct = 2.5) {
  const horizons = [
    { label: '7D', days: 7, sigma: Math.sqrt(7) },
    { label: '1M', days: 21, sigma: Math.sqrt(21) },
    { label: '3M', days: 63, sigma: Math.sqrt(63) },
  ];
  const sigmaPct = (atrPct ?? 2.5) / 100;
  return horizons.map((h) => {
    const move = price * sigmaPct * h.sigma;
    return {
      label: h.label,
      target: +(price + move).toFixed(2),
      stop: +(price - move * 0.6).toFixed(2),
      upsidePct: +((move / price) * 100).toFixed(2),
      stopPct: +(((move * 0.6) / price) * 100 * -1).toFixed(2),
    };
  });
}
