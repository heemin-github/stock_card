import Tooltip from './Tooltip.jsx';

function fmtMcap(v) {
  if (v == null) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(0)}`;
}

function fmtPct(v) {
  if (v == null) return '—';
  // Twelve Data sometimes returns yields as 0.0145 (=1.45%) and sometimes 1.45.
  // Normalise: if absolute < 1 assume fraction, else already percent.
  const pct = Math.abs(v) < 1 ? v * 100 : v;
  return `${pct.toFixed(2)}%`;
}

function fmtNum(v, digits = 2) {
  if (v == null) return '—';
  return Number(v).toFixed(digits);
}

function Row({ label, value, tooltip }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500 inline-flex items-center gap-1">
        {label}
        {tooltip ? <Tooltip iconOnly content={tooltip} /> : null}
      </span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

export default function FundamentalsPanel({ fundamentals }) {
  if (!fundamentals) {
    return (
      <section className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-400">
        펀더멘탈 데이터 없음 (API 미지원 또는 응답 비어있음)
      </section>
    );
  }
  const f = fundamentals;
  return (
    <section className="bg-gray-50 rounded-lg p-3 flex flex-col gap-1.5">
      <div className="text-xs text-gray-500 font-medium mb-1">펀더멘탈</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Row
          label="P/E"
          value={fmtNum(f.pe, 1)}
          tooltip={`주가수익비율 (Trailing).
업종 평균 대비 비교 필요.
Forward P/E: ${f.forwardPe != null ? fmtNum(f.forwardPe, 1) : '—'}`}
        />
        <Row
          label="시가총액"
          value={fmtMcap(f.marketCap)}
          tooltip="기업 가치 (주가 × 발행주식수)"
        />
        <Row
          label="베타"
          value={fmtNum(f.beta, 2)}
          tooltip={`시장(SPY) 대비 변동성.
1.0 = 시장과 동일, > 1 시장보다 변동 큼,
< 1 안정적.`}
        />
        <Row
          label="EPS (TTM)"
          value={fmtNum(f.eps, 2)}
          tooltip="최근 12개월 주당순이익"
        />
        <Row
          label="배당수익률"
          value={fmtPct(f.dividendYield)}
          tooltip={`연간 배당 / 주가.
배당성향: ${f.payoutRatio != null ? fmtPct(f.payoutRatio) : '—'}`}
        />
        <Row label="ROE" value={fmtPct(f.roe)} tooltip="자기자본이익률 (수익성 핵심 지표)" />
        {f.peg != null ? (
          <Row
            label="PEG"
            value={fmtNum(f.peg, 2)}
            tooltip={`P/E ÷ EPS 성장률.
< 1: 저평가 가능, > 2: 고평가 우려.`}
          />
        ) : null}
        {f.profitMargin != null ? (
          <Row label="순이익률" value={fmtPct(f.profitMargin)} tooltip="순이익 / 매출" />
        ) : null}
      </div>
    </section>
  );
}
