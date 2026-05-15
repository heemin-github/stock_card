import { AlertTriangle, CheckCircle2, PauseCircle, ShieldCheck } from 'lucide-react';

const ACTION_STYLE = {
  READY: {
    icon: CheckCircle2,
    wrap: 'border-green-100 bg-green-50/40',
    badge: 'bg-green-100 text-green-700',
    label: 'READY',
  },
  WAIT: {
    icon: PauseCircle,
    wrap: 'border-amber-100 bg-amber-50/40',
    badge: 'bg-amber-100 text-amber-700',
    label: 'WAIT',
  },
  BLOCKED: {
    icon: AlertTriangle,
    wrap: 'border-red-100 bg-red-50/40',
    badge: 'bg-red-100 text-red-700',
    label: 'BLOCKED',
  },
};

function formatMoney(v, currency) {
  if (v == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(v);
}

function SignalList({ title, items, tone }) {
  if (!items?.length) return null;
  const color = tone === 'bad' ? 'text-red-600' : tone === 'warn' ? 'text-amber-700' : 'text-green-700';
  const mark = tone === 'bad' ? '!' : tone === 'warn' ? '-' : '+';
  return (
    <div>
      <div className={`text-[10px] font-semibold mb-1 ${color}`}>{title}</div>
      <ul className="space-y-0.5">
        {items.slice(0, 3).map((item, i) => (
          <li key={`${title}-${i}`} className="flex gap-1.5 text-[11px] leading-snug text-gray-700">
            <span className={color}>{mark}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TradeSignalPanel({ signal, currency = 'USD' }) {
  if (!signal) return null;
  const style = ACTION_STYLE[signal.action] ?? ACTION_STYLE.BLOCKED;
  const Icon = style.icon;
  const plan = signal.orderPlan;

  return (
    <section className={`rounded-xl border p-3 flex flex-col gap-3 ${style.wrap}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Icon size={17} className="mt-0.5 shrink-0 text-gray-500" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">{signal.headline}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              안전 필터까지 반영한 최종 신호입니다.
            </div>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {plan ? (
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/70 border border-white p-2 text-center">
          <div>
            <div className="text-[10px] text-gray-400">기준가</div>
            <div className="text-xs font-semibold text-gray-800">
              {formatMoney(plan.referencePrice, currency)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">익절</div>
            <div className="text-xs font-semibold text-green-700">
              {formatMoney(plan.takeProfit, currency)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">손절</div>
            <div className="text-xs font-semibold text-red-600">
              {formatMoney(plan.stopLoss, currency)}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 rounded-lg bg-white/70 border border-white px-2.5 py-2 text-[11px] text-gray-500">
        <ShieldCheck size={13} className="text-gray-400" />
        <span>실거래 전에는 모의매매, 수동 승인, 일일 손실 제한이 필요합니다.</span>
      </div>

      <SignalList title="확인" items={signal.confirmations} tone="good" />
      <SignalList title="주의" items={signal.cautions} tone="warn" />
      <SignalList title="차단" items={signal.blockers} tone="bad" />
    </section>
  );
}
