// Map each indicator to a 'good' (매수 우호) / 'bad' (회피 신호) / 'neutral' tone.
// Mode-aware thresholds use the active rule; the rest are universal heuristics.

export function indicatorTone(key, value, rule) {
  if (value == null || (typeof value === 'number' && Number.isNaN(value))) return 'neutral';

  switch (key) {
    case 'rsi': {
      if (rule.reject.rsiHard && value >= rule.reject.rsiHard) return 'bad';
      if (rule.entry.rsiRange) {
        const [lo, hi] = rule.entry.rsiRange;
        if (value >= lo && value <= hi) return 'good';
      }
      if (rule.entry.rsiMax && value < rule.entry.rsiMax) return 'good';
      if (rule.watch.rsiBand) {
        const [lo, hi] = rule.watch.rsiBand;
        if (value >= lo && value <= hi) return 'neutral';
      }
      return 'bad';
    }

    case 'mfi':
      if (value >= 80 || value <= 20) return 'bad';
      if (value >= 50) return 'good';
      if (value < 40) return 'bad';
      return 'neutral';

    case 'obv':
      if (value > 1.05) return 'good';
      if (value < 0.95) return 'bad';
      return 'neutral';

    case 'marketAtrPct':
      if (rule.reject.marketAtrHard && value >= rule.reject.marketAtrHard) return 'bad';
      if (rule.entry.marketAtrMax && value < rule.entry.marketAtrMax) return 'good';
      return 'neutral';

    case 'rsSpy1M':
      if (value > 0) return 'good';
      if (value < 0) return 'bad';
      return 'neutral';

    case 'atrPct':
      if (value >= 6) return 'bad';
      if (value >= 1 && value <= 4) return 'good';
      if (value > 4 && value < 6) return 'neutral';
      return 'neutral';

    case 'volSpike':
      if (value >= 1.5) return 'good';
      if (value <= 0.5) return 'bad';
      return 'neutral';

    case 'trend':
      if (value === 'up') return 'good';
      if (value === 'down') return 'bad';
      return 'neutral';

    case 'consecutiveUp':
      if (value === 0) return 'bad';
      if (value >= 7) return 'bad'; // overheated, pullback risk
      if (value >= 1 && value <= 5) return 'good';
      return 'neutral';

    default:
      return 'neutral';
  }
}
