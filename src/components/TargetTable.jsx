export default function TargetTable({ targets, highlight, currency = 'USD' }) {
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left font-medium px-3 py-2">기간</th>
            <th className="text-right font-medium px-3 py-2">목표가</th>
            <th className="text-right font-medium px-3 py-2">기대수익</th>
            <th className="text-right font-medium px-3 py-2">손절</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => {
            const isHi = t.label === highlight;
            return (
              <tr
                key={t.label}
                className={`border-t border-gray-100 ${isHi ? 'bg-blue-50/60' : ''}`}
              >
                <td className={`px-3 py-2 ${isHi ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                  {t.label}
                  {isHi ? <span className="ml-1 text-[10px] text-blue-500">강조</span> : null}
                </td>
                <td className="px-3 py-2 text-right text-gray-900">{fmt.format(t.target)}</td>
                <td className="px-3 py-2 text-right text-green-600">+{t.upsidePct}%</td>
                <td className="px-3 py-2 text-right text-red-500">{t.stopPct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
