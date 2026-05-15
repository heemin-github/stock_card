export function buildTradeSignal(data, judgement, rule, targets) {
  if (!data || !judgement || !rule) return null;

  const blockers = [];
  const cautions = [];
  const confirmations = [];
  const { indicators, structure, events } = data;

  if (judgement.entryStage === 'WATCH_ONLY') {
    cautions.push('기본 판단이 관찰 단계라 신규 매수는 보류합니다.');
  } else if (judgement.entryStage === 'REJECT') {
    blockers.push('기본 판단이 회피 단계라 신규 매수를 차단합니다.');
  }
  if (!['A', 'B'].includes(judgement.finalGrade)) {
    blockers.push(`최종 등급이 ${judgement.finalGrade}라 자동매매 기준에 미달합니다.`);
  }
  if (structure?.trend !== 'up') {
    blockers.push('추세가 상승이 아니라 신규 진입을 막습니다.');
  } else {
    confirmations.push('상승 추세가 확인됐습니다.');
  }

  if (indicators.rsi != null) {
    if (indicators.rsi >= 75) blockers.push(`RSI ${indicators.rsi.toFixed(1)}로 과열 위험이 큽니다.`);
    else if (indicators.rsi >= 65) cautions.push(`RSI ${indicators.rsi.toFixed(1)}로 추격 매수 부담이 있습니다.`);
    else confirmations.push(`RSI ${indicators.rsi.toFixed(1)}로 과열권은 아닙니다.`);
  }

  if (indicators.marketAtrPct != null) {
    if (indicators.marketAtrPct >= rule.reject.marketAtrHard) {
      blockers.push(`시장 ATR ${indicators.marketAtrPct.toFixed(2)}%로 시장 변동성이 높습니다.`);
    } else if (indicators.marketAtrPct >= rule.entry.marketAtrMax) {
      cautions.push(`시장 ATR ${indicators.marketAtrPct.toFixed(2)}%로 변동성 관리가 필요합니다.`);
    } else {
      confirmations.push('시장 변동성이 진입 기준 안에 있습니다.');
    }
  }

  if (indicators.rsSpy1M != null) {
    if (indicators.rsSpy1M < 0) blockers.push(`최근 1개월 시장 대비 성과가 ${indicators.rsSpy1M.toFixed(2)}%p입니다.`);
    else confirmations.push(`최근 1개월 시장 대비 +${indicators.rsSpy1M.toFixed(2)}%p 강합니다.`);
  }

  if (indicators.volSpike != null) {
    if (indicators.volSpike <= 0.5) blockers.push('거래량이 평소보다 크게 줄어 체결 품질이 나쁠 수 있습니다.');
    else if (indicators.volSpike >= 1.5) confirmations.push('거래량 증가로 수급 확인이 붙었습니다.');
  }

  const earningsDays = events?.nextEarnings?.daysAway;
  if (earningsDays != null) {
    if (earningsDays <= 3) blockers.push(`실적 발표가 D-${earningsDays}라 신규 진입을 차단합니다.`);
    else if (earningsDays <= 7) cautions.push(`실적 발표가 D-${earningsDays}라 포지션 축소 기준이 필요합니다.`);
  }

  const target = targets?.find((t) => t.label === rule.highlightHorizon) ?? targets?.[0] ?? null;
  const action = blockers.length > 0 ? 'BLOCKED' : cautions.length > 0 ? 'WAIT' : 'READY';
  const headline =
    action === 'READY'
      ? '통합 매매 신호: 매수 후보'
      : action === 'WAIT'
      ? '통합 매매 신호: 대기'
      : '통합 매매 신호: 제외';

  return {
    action,
    headline,
    confirmations,
    cautions,
    blockers,
    target,
    orderPlan: target
      ? {
          side: 'BUY',
          orderType: 'LIMIT_ONLY',
          horizon: target.label,
          referencePrice: data.price,
          takeProfit: target.target,
          stopLoss: target.stop,
        }
      : null,
  };
}
