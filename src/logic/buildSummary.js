// Builds a plain-Korean prose summary of the current judgement.
// Each pro/con is a full sentence — no bare numbers or parenthetical thresholds —
// so users without a finance background can read it like a brief.

export function buildSummary(data, judgement, rule) {
  if (!data || !judgement) return null;
  const { indicators, structure, technicals, events } = data;
  const { scores, entryStage, finalGrade } = judgement;
  const pros = [];
  const cons = [];

  // --- 점수 (구조/실행) ---
  if (scores.structureScore >= rule.entry.structureMin) {
    pros.push('주가 추세와 모멘텀 구조가 매수에 부합하는 수준입니다.');
  } else {
    cons.push('차트 구조(추세·연속 상승 여부)가 약해서 매수 근거가 부족합니다.');
  }
  if (rule.entry.executionMin != null) {
    if (scores.executionScore >= rule.entry.executionMin) {
      pros.push('단기 변동성과 과열도가 거래하기에 적정한 상태입니다.');
    } else {
      cons.push('변동성이 크거나 모멘텀이 과열되어 단기 진입이 부담스러운 구간입니다.');
    }
  }

  // --- RSI ---
  if (indicators.rsi != null) {
    const r = indicators.rsi;
    if (rule.reject.rsiHard && r >= rule.reject.rsiHard) {
      cons.push('RSI가 과열 구간까지 올라와 단기 조정이 나올 위험이 큽니다.');
    } else if (rule.watch.rsiBand && r >= rule.watch.rsiBand[0] && r <= rule.watch.rsiBand[1]) {
      cons.push('RSI가 과열 직전 구간이라 추가 상승 여력이 줄고 있습니다.');
    } else if (rule.entry.rsiRange) {
      const [lo, hi] = rule.entry.rsiRange;
      if (r >= lo && r <= hi) {
        pros.push('RSI가 과열도 침체도 아닌 안정 구간이라 진입에 무리가 없습니다.');
      } else if (r < lo) {
        cons.push('RSI가 과매도권에 가까워 매수보다 반등 확인이 우선입니다.');
      } else {
        cons.push('RSI가 적정 구간을 벗어나 진입 시점으로 적합하지 않습니다.');
      }
    } else if (rule.entry.rsiMax && r < rule.entry.rsiMax) {
      pros.push('RSI가 과열 임계 아래라 모멘텀 부담이 적습니다.');
    }
  }

  // --- 시장 변동성 (SPY ATR%) ---
  if (indicators.marketAtrPct != null) {
    const m = indicators.marketAtrPct;
    if (rule.reject.marketAtrHard && m >= rule.reject.marketAtrHard) {
      cons.push('시장 전체가 출렁이고 있어 개별 종목 매수에는 위험한 환경입니다.');
    } else if (rule.entry.marketAtrMax && m < rule.entry.marketAtrMax) {
      pros.push('시장 전반의 변동성이 낮아 진입하기 좋은 환경입니다.');
    }
  }

  // --- 추세 ---
  if (structure?.trend === 'up') {
    pros.push('일봉 차트가 우상향 추세를 그리고 있습니다.');
  } else if (structure?.trend === 'down') {
    cons.push('일봉 차트가 하락 추세에 있어 매수 시점으로 보기 어렵습니다.');
  } else if (rule.entry.requireUp) {
    cons.push('주가가 횡보 중이라 본격적인 매수 시점이라 보기 어렵습니다.');
  }

  // --- 연속 상승 ---
  if (structure?.consecutiveUp >= 7) {
    cons.push('너무 오래 연속 상승해서 단기 차익실현 매물이 나올 수 있습니다.');
  } else if (structure?.consecutiveUp >= 2) {
    pros.push('며칠 연속 상승해서 매수세가 살아 있는 흐름입니다.');
  }

  // --- 이평선 정배열 ---
  if (technicals?.maAlignment === 'perfect-up') {
    pros.push('단기·장기 이평선이 모두 정배열을 이뤄 추세가 강하게 살아있습니다.');
  } else if (technicals?.maAlignment === 'short-up') {
    pros.push('단기 이평선들이 정배열로 정렬되어 단기 상승 흐름이 좋습니다.');
  } else if (technicals?.maAlignment === 'perfect-down') {
    cons.push('이평선 전체가 역배열이라 장기적으로 약세 국면입니다.');
  } else if (technicals?.maAlignment === 'short-down') {
    cons.push('단기 이평선이 역배열로 정렬되어 단기 약세가 진행 중입니다.');
  }

  // --- 최근 크로스 (5일 이내) ---
  if (technicals?.shortCross?.daysAgo != null && technicals.shortCross.daysAgo <= 5) {
    if (technicals.shortCross.type === 'golden') {
      pros.push('최근 단기 이평선이 장기 이평선을 위로 돌파한 골든크로스가 발생했습니다.');
    } else {
      cons.push('최근 단기 이평선이 장기 이평선 아래로 떨어진 데드크로스가 발생했습니다.');
    }
  }
  if (technicals?.macd?.cross?.daysAgo != null && technicals.macd.cross.daysAgo <= 5) {
    if (technicals.macd.cross.type === 'golden') {
      pros.push('MACD가 시그널선을 위로 돌파해 모멘텀이 매수 쪽으로 전환됐습니다.');
    } else {
      cons.push('MACD가 시그널선 아래로 떨어져 모멘텀이 매도 쪽으로 약해지고 있습니다.');
    }
  }

  // --- 거래량 ---
  if (indicators.volSpike != null) {
    if (indicators.volSpike >= 1.5) {
      pros.push('오늘 거래량이 평소보다 크게 늘어 시장의 관심이 집중되고 있습니다.');
    } else if (indicators.volSpike <= 0.5) {
      cons.push('거래량이 평소 절반 이하로 빠져 매수세가 부족한 상태입니다.');
    }
  }

  // --- 시장 대비 강도 (RS vs SPY) ---
  if (indicators.rsSpy1M != null) {
    if (indicators.rsSpy1M >= 5) {
      pros.push('최근 한 달간 시장 평균보다 뚜렷하게 강한 흐름을 보였습니다.');
    } else if (indicators.rsSpy1M <= -5) {
      cons.push('최근 한 달간 시장 평균을 크게 밑돌아 상대적으로 약한 흐름입니다.');
    }
  }

  // --- 볼린저밴드 위치 ---
  const bbPos = technicals?.bollinger?.posPct;
  if (bbPos != null) {
    if (bbPos >= 95) {
      cons.push('주가가 볼린저밴드 상단을 거의 뚫어 단기 과매수 영역에 들어왔습니다.');
    } else if (bbPos <= 5) {
      cons.push('주가가 볼린저밴드 하단권에 머물러 약세가 이어지고 있습니다.');
    }
  }

  // --- 52주 위치 ---
  const fwPos = technicals?.fiftyTwoWeek?.posPct;
  if (fwPos != null) {
    if (fwPos >= 90) {
      pros.push('주가가 52주 고점 부근까지 올라와 신고가 시도 흐름입니다.');
    } else if (fwPos <= 10) {
      cons.push('주가가 52주 저점 부근에 머물고 있어 약세 흐름이 지속 중입니다.');
    }
  }

  // --- 임박 이벤트 ---
  if (events?.nextEarnings?.daysAway != null && events.nextEarnings.daysAway <= 7) {
    cons.push('일주일 안에 실적 발표가 예정되어 갑작스런 변동 위험이 있습니다.');
  }

  // --- Headline ---
  let headline;
  if (entryStage === 'ENTRY') {
    if (finalGrade === 'A') headline = '매수 환경이 매우 우호적이고 진입 조건도 모두 충족됩니다.';
    else if (finalGrade === 'B') headline = '매수에 부합하는 환경입니다.';
    else headline = '매수는 가능하지만 종합 등급이 낮은 편입니다.';
  } else if (entryStage === 'WATCH_ONLY') {
    headline = '진입 조건 일부가 미달이라 지금은 관망이 권장됩니다.';
  } else {
    headline = '강제 거부 조건이 걸려 지금 매수는 피하는 것이 좋습니다.';
  }

  return { headline, pros, cons };
}
