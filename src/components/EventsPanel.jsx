import { CalendarDays, Coins } from 'lucide-react';

function dayBadge(daysAway) {
  if (daysAway == null) return null;
  let cls = 'bg-gray-100 text-gray-600';
  if (daysAway <= 7) cls = 'bg-red-100 text-red-600';
  else if (daysAway <= 14) cls = 'bg-orange-100 text-orange-600';
  else if (daysAway <= 30) cls = 'bg-amber-50 text-amber-700';
  return (
    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      D-{daysAway}
    </span>
  );
}

export default function EventsPanel({ events, currency = 'USD' }) {
  const earn = events?.nextEarnings;
  const div = events?.dividend;
  if (!earn && !div) {
    return (
      <section className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-400">
        예정 이벤트 없음 (또는 API 미지원)
      </section>
    );
  }
  const fmtMoney = (v) =>
    v == null
      ? '—'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 4,
        }).format(v);

  return (
    <section className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3 text-xs">
      <span className="text-gray-500 font-medium">예정 이벤트</span>
      {earn ? (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-gray-700">
            <CalendarDays size={13} className="text-gray-400" /> 다음 실적
          </span>
          <span className="flex items-center gap-2">
            <span className="text-gray-700">{earn.date}</span>
            {earn.time ? <span className="text-[10px] text-gray-400">{earn.time}</span> : null}
            {earn.epsEstimate != null ? (
              <span className="text-[10px] text-gray-400">EPS {earn.epsEstimate.toFixed(2)}</span>
            ) : null}
            {dayBadge(earn.daysAway)}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} /> 다음 실적
          </span>
          <span className="text-[11px]">정보 없음</span>
        </div>
      )}
      {div ? (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-gray-700">
            <Coins size={13} className="text-gray-400" />
            {div.isFuture ? '배당락' : '최근 배당'}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-gray-700">{div.exDate}</span>
            {div.amount ? (
              <span className="text-[10px] text-gray-400">{fmtMoney(div.amount)}/주</span>
            ) : null}
            {div.isFuture ? dayBadge(div.daysAway) : null}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <Coins size={13} /> 배당
          </span>
          <span className="text-[11px]">정보 없음</span>
        </div>
      )}
    </section>
  );
}
