function fmt(v) {
  if (v == null) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

export default function ReturnsTable({ returns }) {
  const rows = ['1M', '3M', '1Y'];
  return (
    <section className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 font-medium mb-2">기간별 수익률</div>
      <div className="grid grid-cols-3 gap-2">
        {rows.map((k) => {
          const v = returns?.[k];
          const cls = v == null ? 'text-gray-400' : v >= 0 ? 'text-green-600' : 'text-red-500';
          return (
            <div key={k} className="text-center">
              <div className="text-[10px] text-gray-400">{k}</div>
              <div className={`text-sm font-semibold ${cls}`}>{fmt(v)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
