import { Activity, Gauge, TrendingUp } from 'lucide-react';
import { useMarketStatus } from '../hooks/useMarketStatus.js';

const TONE_STYLE = {
  good: 'bg-green-100 text-green-700',
  warn: 'bg-amber-100 text-amber-700',
  bad: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
};

function fmtPct(v) {
  if (v == null || Number.isNaN(v)) return '-';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

export default function MarketStatusPanel() {
  const { loading, data } = useMarketStatus();

  if (loading) {
    return (
      <section className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-400">
        시장 상태 확인 중...
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Activity size={13} className="text-gray-400" />
          시장 상태
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE_STYLE[data.tone]}`}>
          {data.label}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-md bg-white px-2 py-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
            <Gauge size={12} /> SPY ATR
          </span>
          <span className="text-xs font-semibold text-gray-800">{fmtPct(data.atrPct)}</span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-white px-2 py-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
            <TrendingUp size={12} /> SPY 1M
          </span>
          <span
            className={`text-xs font-semibold ${
              data.return1M >= 0 ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {fmtPct(data.return1M)}
          </span>
        </div>
      </div>
    </section>
  );
}
