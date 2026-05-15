import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
} from 'recharts';

const RANGES = ['1D', '1W', '1M', '3M', '1Y'];
const MA_DEFS = [
  { key: 'ma5', label: 'MA5', color: '#f97316' },
  { key: 'ma20', label: 'MA20', color: '#22c55e' },
  { key: 'ma60', label: 'MA60', color: '#a855f7' },
  { key: 'ma200', label: 'MA200', color: '#64748b' },
];
const REF_DEFS = [
  { key: 'prevClose', label: '전일', color: '#cbd5e1' },
  { key: 'high52w', label: '52H', color: '#86efac' },
  { key: 'low52w', label: '52L', color: '#fca5a5' },
  { key: 'target', label: '목표', color: '#93c5fd' },
  { key: 'stop', label: '손절', color: '#fdba74' },
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

export default function MiniChart({ chart, onRangeSelect, referenceLines }) {
  const [range, setRange] = useState('1M');
  const [controlsOpen, setControlsOpen] = useState(false);
  const [activeMAs, setActiveMAs] = useState({
    ma5: true,
    ma20: true,
    ma60: true,
    ma200: true,
  });
  const [activeRefs, setActiveRefs] = useState({
    prevClose: true,
    high52w: false,
    low52w: false,
    target: false,
    stop: false,
  });

  useEffect(() => {
    if ((range === '1D' || range === '1W') && onRangeSelect) {
      onRangeSelect(range);
    }
  }, [range, onRangeSelect]);

  const series = chart?.[range] ?? [];
  const isDaily = range !== '1D' && range !== '1W';
  const data = series.map((d) => ({
    t: d.t,
    open: d.open,
    high: d.high,
    low: d.low,
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
    if (isDaily) {
      if (d.high != null) allValues.push(d.high);
      if (d.low != null) allValues.push(d.low);
    }
    MA_DEFS.forEach(({ key }) => {
      if (activeMAs[key] && d[key] != null) allValues.push(d[key]);
    });
  });
  REF_DEFS.forEach(({ key }) => {
    if (activeRefs[key] && referenceLines?.[key] != null) allValues.push(referenceLines[key]);
  });
  const min = allValues.length ? Math.min(...allValues) : 0;
  const max = allValues.length ? Math.max(...allValues) : 1;
  const pad = (max - min) * 0.05 || 1;
  const first = data[0];
  const last = data[data.length - 1];
  const maCount = MA_DEFS.filter(({ key }) => activeMAs[key]).length;
  const refCount = REF_DEFS.filter(({ key }) => activeRefs[key] && referenceLines?.[key] != null)
    .length;

  const plot = { left: 6, right: 18, top: 8, bottom: 20, width: 360, height: 144 };
  const plotWidth = plot.width - plot.left - plot.right;
  const plotHeight = plot.height - plot.top - plot.bottom;
  const domainMin = min - pad;
  const domainMax = max + pad;
  const toX = (i) =>
    data.length <= 1 ? plot.left + plotWidth / 2 : plot.left + (i / (data.length - 1)) * plotWidth;
  const toY = (v) => plot.top + ((domainMax - v) / (domainMax - domainMin || 1)) * plotHeight;
  const maPath = (key) =>
    data
      .map((d, i) => (d[key] == null ? null : `${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`))
      .filter(Boolean)
      .join(' ');
  const guideIndexes = data.length > 1 ? [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(p * (data.length - 1))) : [0];
  const candleWidth = Math.max(2, Math.min(6, plotWidth / Math.max(data.length, 1) * 0.55));

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
        ) : isDaily ? (
          <svg viewBox={`0 0 ${plot.width} ${plot.height}`} className="h-full w-full">
            {guideIndexes.map((idx) => (
              <g key={`guide-${idx}`}>
                <line
                  x1={toX(idx)}
                  x2={toX(idx)}
                  y1={plot.top}
                  y2={plot.top + plotHeight}
                  stroke="#f1f5f9"
                />
                <text
                  x={toX(idx)}
                  y={plot.height - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#9ca3af"
                >
                  {fmtAxisLabel(data[idx].t, range)}
                </text>
              </g>
            ))}
            {REF_DEFS.map(({ key, label, color }) =>
              activeRefs[key] && referenceLines?.[key] != null ? (
                <g key={key}>
                  <line
                    x1={plot.left}
                    x2={plot.width - plot.right}
                    y1={toY(referenceLines[key])}
                    y2={toY(referenceLines[key])}
                    stroke={color}
                  />
                  <text
                    x={plot.width - plot.right + 2}
                    y={toY(referenceLines[key]) + 3}
                    fontSize="10"
                    fill={color}
                  >
                    {label}
                  </text>
                </g>
              ) : null
            )}
            {data.map((d, i) => {
              const x = toX(i);
              const up = d.v >= d.open;
              const color = up ? '#60a5fa' : '#f87171';
              const openY = toY(d.open);
              const closeY = toY(d.v);
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(2, Math.abs(openY - closeY));
              return (
                <g key={d.t}>
                  <line x1={x} x2={x} y1={toY(d.high)} y2={toY(d.low)} stroke={color} strokeWidth="1" />
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    rx="0.8"
                    fill={up ? '#ffffff' : color}
                    stroke={color}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
            {MA_DEFS.map(({ key, color }) =>
              activeMAs[key] && maPath(key) ? (
                <polyline
                  key={key}
                  points={maPath(key)}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
              ) : null
            )}
          </svg>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid
                horizontal={false}
                vertical
                stroke="#f1f5f9"
              />
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
              {REF_DEFS.map(({ key, label, color }) =>
                activeRefs[key] && referenceLines?.[key] != null ? (
                  <ReferenceLine
                    key={key}
                    y={referenceLines[key]}
                    stroke={color}
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                    label={{
                      value: label,
                      position: 'insideRight',
                      fill: color,
                      fontSize: 10,
                    }}
                  />
                ) : null
              )}
              <Line
                type="monotone"
                dataKey="v"
                name="종가"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {isDaily ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setControlsOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-500 hover:bg-gray-100"
          >
            <span>차트 표시</span>
            <span className="text-gray-400">
              MA {maCount} · 기준선 {refCount}
              <span className="ml-1">{controlsOpen ? '접기' : '설정'}</span>
            </span>
          </button>

          {controlsOpen ? (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-gray-100 p-2">
              <div>
                <div className="mb-1 text-[10px] font-medium text-gray-400">이동평균</div>
                <div className="flex flex-wrap gap-1">
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
              </div>

              <div>
                <div className="mb-1 text-[10px] font-medium text-gray-400">기준선</div>
                <div className="flex flex-wrap gap-1">
                  {REF_DEFS.map(({ key, label, color }) => {
                    const on = !!activeRefs[key];
                    const disabled = referenceLines?.[key] == null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveRefs((s) => ({ ...s, [key]: !s[key] }))}
                        disabled={disabled}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                          on && !disabled
                            ? 'border-transparent text-white'
                            : 'border-gray-200 text-gray-400'
                        } ${disabled ? 'opacity-40' : ''}`}
                        style={on && !disabled ? { backgroundColor: color } : undefined}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-[10px] text-gray-300 mt-2">MA 오버레이는 1M 이상 일봉에서 표시</div>
      )}
    </div>
  );
}
