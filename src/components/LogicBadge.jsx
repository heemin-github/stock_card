import Tooltip from './Tooltip.jsx';

const TONE_STYLE = {
  good: { wrap: 'bg-green-50 border border-green-200', value: 'text-green-700' },
  bad: { wrap: 'bg-red-50 border border-red-200', value: 'text-red-600' },
  neutral: { wrap: 'bg-gray-50 border border-transparent', value: 'text-gray-900' },
};

export default function LogicBadge({ icon: Icon, label, value, hint, tooltip, tone = 'neutral' }) {
  const style = TONE_STYLE[tone] ?? TONE_STYLE.neutral;
  return (
    <div className={`rounded-lg p-3 flex flex-col gap-1 ${style.wrap}`}>
      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
        {Icon ? <Icon size={14} /> : null}
        <span>{label}</span>
        {tooltip ? <Tooltip content={tooltip} iconOnly /> : null}
      </div>
      <div className={`text-base font-semibold ${style.value}`}>{value}</div>
      {hint ? <div className="text-[11px] text-gray-400">{hint}</div> : null}
    </div>
  );
}
