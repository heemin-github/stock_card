import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

const RANGES = ['1D', '1W', '1M', '3M', '1Y'];
const MA_DEFS = [
  { key: 'ma5', label: 'MA5', color: '#f97316' },
  { key: 'ma20', label: 'MA20', color: '#22c55e' },
  { key: 'ma60', label: 'MA60', color: '#a855f7' },
  { key: 'ma200', label: 'MA200', color: '#64748b' },
];

function fmtAxisLabel(t, range) {
  const d = new Date(t);
  if (range === '1D' || range === '1W') {
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  }
  return `${d.getFullYear() % 100}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function MiniChart({ chart, onRangeSelect }) {
  const [range, setRange] = useState('1M');
  const [activeMAs, setActiveMAs] = useState({ ma20: true });

  useEffect(() => {
    if ((range === '1D' || range === '1W') && onRangeSelect) {
      onRangeSelect(range);
    }
  }, [range, onRangeSelect]);

  const series = chart?.[range] ?? [];
  const data = series.map((d) => ({
    t: d.t,
    v: d.close,
    ma5: d.ma5 ?? null,
    ma20: d.ma20 ?? null,
    ma60: d.ma60 ?? null,
    ma200: d.ma200 ?? null,
  }));

  // Build value list including the toggled MAs so axis range reflects overlays.
  const allValues = [];
  data.forEach((d) => {
    allValues.push(d.v);
    MA_DEFS.forEach(({ key }) => {
      if (activeMAs[key] && d[key] != null) allValues.push(d[key]);
    });
  });
  const min = allValues.length ? Math.min(...allValues) : 0;
  const max = allValues.length ? Math.max(...allValues) : 1;
  const pad = (max - min) * 0.05 || 1;
  const isDaily = range !== '1D' && range !== '1W';
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          {data.length}pt
          {first && last
            ? ` · ${fmtAxisLabel(first.t, range)} → ${fmtAxisLabel(last.t, range)}`
            : ''}
        </span>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2 py-0.5 text-xs rounded ${
                r === range ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-36">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-xs text-gray-400">
            데이터 없음 (이 구간은 API 응답이 비어있음)
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <XAxis
                dataKey="t"
                tickFormatter={(t) => fmtAxisLabel(t, range)}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis hide domain={[min - pad, max + pad]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v, name) => [Number(v).toFixed(2), name]}
                labelFormatter={(t) => new Date(t).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey="v"
                name="종가"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {isDaily
                ? MA_DEFS.map(({ key, color, label }) =>
                    activeMAs[key] ? (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={label}
                        stroke={color}
                        strokeWidth={1.2}
                        strokeDasharray="4 3"
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                      />
                    ) : null
                  )
                : null}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {isDaily ? (
        <div className="flex flex-wrap gap-1 mt-2">
          {MA_DEFS.map(({ key, label, color }) => {
            const on = !!activeMAs[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMAs((s) => ({ ...s, [key]: !s[key] }))}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                  on ? 'border-transparent text-white' : 'border-gray-200 text-gray-400'
                }`}
                style={on ? { backgroundColor: color } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-[10px] text-gray-300 mt-2">MA 오버레이는 1M 이상 일봉에서 표시</div>
      )}
    </div>
  );
}
