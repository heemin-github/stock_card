// Mode-aware tooltip strings derived from the rule object.
// Used by ScorePanel and LogicBadge to display thresholds on hover.

export function scoreTooltips(rule) {
  const w = rule.weights;
  const e = rule.entry;
  const r = rule.reject;
  return {
    structure: `구조 점수 (가중 ${(w.structure * 100).toFixed(0)}%)
추세 방향 + 연속 상승일 + 추세 강도로 산출.

ENTRY ≥ ${e.structureMin}
REJECT < ${r.structureMin}${r.rejectDown ? '\n또는 추세 = 하락' : ''}`,

    execution: `실행 점수 (가중 ${(w.execution * 100).toFixed(0)}%)
RSI 과열도 + ATR% 변동성 평가.
RSI 80↑ 큰 감점, ATR% 6%↑ 페널티.

${e.executionMin != null ? `ENTRY ≥ ${e.executionMin}` : 'ENTRY 임계 없음 (장기는 미사용)'}`,

    supply: `수급 점수 (가중 ${(w.supply * 100).toFixed(0)}%)
MFI + OBV ratio 종합.
MFI ≥ 60 가산, ≤ 40 감점.
OBV ratio > 1.05 가산, < 0.95 감점.

직접 임계는 없음 — 종합 가중 점수에 반영.`,
  };
}

export function indicatorTooltips(rule) {
  const e = rule.entry;
  const w = rule.watch;
  const r = rule.reject;

  const rsiBits = [];
  if (e.rsiRange) rsiBits.push(`ENTRY ${e.rsiRange[0]}~${e.rsiRange[1]}`);
  if (e.rsiMax) rsiBits.push(`ENTRY < ${e.rsiMax}`);
  if (w.rsiBand) rsiBits.push(`WATCH ${w.rsiBand[0]}~${w.rsiBand[1]}`);
  if (r.rsiHard) rsiBits.push(`REJECT ≥ ${r.rsiHard}`);
  const rsiTip = `Relative Strength Index (14)
모멘텀 과열/저열 지표.
${rsiBits.length ? rsiBits.join('\n') : '본 모드에서는 직접 임계 없음'}`;

  const mktBits = [];
  if (e.marketAtrMax) mktBits.push(`ENTRY < ${e.marketAtrMax}%`);
  if (w.marketAtrBand) mktBits.push(`WATCH ${w.marketAtrBand[0]}~${w.marketAtrBand[1]}%`);
  if (r.marketAtrHard) mktBits.push(`REJECT ≥ ${r.marketAtrHard}%`);
  const mktTip = `시장 변동성 (SPY ATR%, 14일)
S&P500 ETF 일일 변동성으로 시장 환경 평가.
높을수록 패닉/리스크 환경.
${mktBits.length ? mktBits.join('\n') : '직접 임계 없음'}`;

  const trendBits = [];
  if (e.requireUp) trendBits.push("ENTRY: trend = 'up' 필수");
  if (r.rejectDown) trendBits.push("REJECT: trend = 'down'");
  if (w.allowSideways) trendBits.push("WATCH: 'sideways' 허용");
  const trendTip = `20일 종가 회귀 기울기 분류
up / down / sideways
${trendBits.length ? trendBits.join('\n') : '본 모드에서 직접 임계 없음'}`;

  return {
    rsi: rsiTip,
    mfi: `Money Flow Index (14)
거래량 가중 RSI 변형 (수급 모멘텀).
60 ↑ 매집, 40 ↓ 분배.`,
    obv: `On-Balance Volume ratio
누적 OBV / 20일 평균 OBV.
> 1.05 매집 우위, < 0.95 분배 우위.`,
    marketAtrPct: mktTip,
    rsSpy1M: `상대강도 vs SPY (1개월)
종목 1M 수익률 - SPY 1M 수익률 (%p).
양수: 시장보다 강함 (모멘텀 우위)
음수: 시장보다 약함 (관망/회피)`,
    volSpike: `오늘 거래량 / 20일 평균 거래량 비율.
> 1.5×: 매집/뉴스 신호
< 0.5×: 거래 부진
1.0× 근처: 평소 수준`,
    atrPct: `Average True Range (14) / 종가 × 100
일 변동성 비율.
4% 이하: 안정 / 6% 이상: 과변동 페널티.`,
    adv20: `20일 평균 거래대금 (close × volume)
유동성 지표. 너무 낮으면 슬리피지 리스크.`,
    trend: trendTip,
    consecutiveUp: `직전 N일 연속 종가 상승 카운트
구조 점수 가산 (최대 +20)`,
  };
}
