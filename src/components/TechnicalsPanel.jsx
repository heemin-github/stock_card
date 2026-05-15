import Tooltip from './Tooltip.jsx';

const ALIGNMENT_LABEL = {
  'perfect-up': { text: '완전 정배열', cls: 'bg-green-100 text-green-700' },
  'short-up': { text: '단기 정배열', cls: 'bg-emerald-50 text-emerald-700' },
  'mixed': { text: '혼조', cls: 'bg-gray-100 text-gray-600' },
  'short-down': { text: '단기 역배열', cls: 'bg-orange-50 text-orange-600' },
  'perfect-down': { text: '완전 역배열', cls: 'bg-red-100 text-red-700' },
};

function CrossBadge({ cross, label }) {
  if (!cross) return <span className="text-gray-400 text-[11px]">{label} 신호 없음</span>;
  const isGold = cross.type === 'golden';
  return (
    <span
      className={`text-[11px] px-1.5 py-0.5 rounded ${
        isGold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
      }`}
    >
      {label} {isGold ? '골든' : '데드'} · {cross.daysAgo}일 전
    </span>
  );
}

function bbZoneText(pos) {
  if (pos == null) return '—';
  if (pos >= 95) return '상단 돌파 임박';
  if (pos >= 80) return '상단권';
  if (pos <= 5) return '하단 돌파 임박';
  if (pos <= 20) return '하단권';
  return '중앙권';
}

export default function TechnicalsPanel({ tech, currency = 'USD' }) {
  if (!tech) return null;

  const align = tech.maAlignment ? ALIGNMENT_LABEL[tech.maAlignment] : null;
  const macd = tech.macd;
  const macdAbove = macd?.macd != null && macd?.signal != null && macd.macd > macd.signal;
  const fw = tech.fiftyTwoWeek;
  const bb = tech.bollinger;
  const fmtMoney = (v) =>
    v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);

  return (
    <section className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 font-medium inline-flex items-center gap-1">
          기술적
          <Tooltip
            iconOnly
            content={`이동평균 정배열, MACD, 볼린저밴드, 52주 위치를 종합한 단기 신호.
정배열 = 단기 MA가 장기 MA 위.
MACD > 시그널 = 모멘텀 매수 우위.
BB 상단권 = 과매수, 하단권 = 과매도.`}
          />
        </span>
        {align ? (
          <span className={`px-2 py-0.5 rounded ${align.cls} font-semibold`}>{align.text}</span>
        ) : (
          <span className="text-gray-400">정배열 N/A</span>
        )}
      </div>

      {/* MA cross status */}
      <div className="flex flex-wrap gap-1.5">
        <CrossBadge cross={tech.shortCross} label="MA5/20" />
        <CrossBadge cross={tech.longCross} label="MA60/200" />
      </div>

      {/* MACD */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
        <span className="text-gray-500 inline-flex items-center gap-1">
          MACD
          <Tooltip
            iconOnly
            content={`MACD = EMA12 - EMA26
시그널 = MACD의 EMA9
MACD > 시그널: 매수 모멘텀
히스토그램 양수: 추세 가속`}
          />
        </span>
        <span className="text-gray-700">
          <span className={macdAbove ? 'text-green-600' : 'text-red-500'}>
            {macd?.macd != null ? macd.macd.toFixed(3) : '—'}
          </span>
          <span className="text-gray-300 mx-1">/</span>
          <span>{macd?.signal != null ? macd.signal.toFixed(3) : '—'}</span>
          <span className="ml-2 text-[10px] text-gray-400">
            hist {macd?.hist != null ? macd.hist.toFixed(3) : '—'}
          </span>
        </span>
      </div>
      {macd?.cross ? (
        <div className="flex justify-end -mt-1">
          <CrossBadge cross={macd.cross} label="MACD" />
        </div>
      ) : null}

      {/* Bollinger */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
        <span className="text-gray-500 inline-flex items-center gap-1">
          볼린저(20,2σ)
          <Tooltip
            iconOnly
            content={`20일 SMA ± 2σ 채널.
현재가의 채널 내 위치 (%).
≥80% 상단권 (과매수 가능),
≤20% 하단권 (과매도 가능).`}
          />
        </span>
        <span className="text-gray-700">
          {bb?.posPct != null ? `${bb.posPct}%` : '—'}
          <span className="ml-2 text-[10px] text-gray-400">{bbZoneText(bb?.posPct)}</span>
        </span>
      </div>
      {bb?.upper != null && bb?.lower != null ? (
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>하 {fmtMoney(bb.lower)}</span>
          <span>상 {fmtMoney(bb.upper)}</span>
        </div>
      ) : null}

      {/* 52-week */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
        <span className="text-gray-500 inline-flex items-center gap-1">
          52주 위치
          <Tooltip
            iconOnly
            content={`최근 252거래일 고가/저가 대비 현재가 위치.
고가 근처(95%↑)는 신고가 시도,
저가 근처(5%↓)는 신저가 위험.`}
          />
        </span>
        <span className="text-gray-700">
          {fw?.posPct != null ? `${fw.posPct}%` : '—'}
          <span className="ml-2 text-[10px] text-gray-400">
            고점 {fw?.fromHighPct != null ? `${fw.fromHighPct}%` : '—'}
          </span>
        </span>
      </div>
      {fw ? (
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>저 {fmtMoney(fw.low)}</span>
          <div className="flex-1 mx-2 self-center h-1 rounded-full bg-gray-200 relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"
              style={{ left: `calc(${fw.posPct}% - 4px)` }}
            />
          </div>
          <span>고 {fmtMoney(fw.high)}</span>
        </div>
      ) : null}
    </section>
  );
}
