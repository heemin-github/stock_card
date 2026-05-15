import { useState } from 'react';
import { Sparkles, Clock, TrendingUp, Star, X, RefreshCw } from 'lucide-react';
import MarketStatusPanel from './MarketStatusPanel.jsx';
import SignalLogPanel from './SignalLogPanel.jsx';
import { useQuickSignal } from '../hooks/useQuickSignal.js';

const POPULAR_GROUPS = [
  {
    key: 'ai',
    label: 'AI',
    items: [
      { symbol: 'NVDA', name: 'NVIDIA', tag: '반도체' },
      { symbol: 'MSFT', name: 'Microsoft', tag: 'AI/클라우드' },
      { symbol: 'GOOG', name: 'Alphabet', tag: 'AI/검색' },
      { symbol: 'AVGO', name: 'Broadcom', tag: 'AI인프라' },
    ],
  },
  {
    key: 'platform',
    label: '플랫폼',
    items: [
      { symbol: 'AAPL', name: 'Apple', tag: '하드웨어' },
      { symbol: 'META', name: 'Meta', tag: 'SNS/AI' },
      { symbol: 'NFLX', name: 'Netflix', tag: '스트리밍' },
      { symbol: 'SHOP', name: 'Shopify', tag: '이커머스' },
    ],
  },
  {
    key: 'etf',
    label: 'ETF',
    items: [
      { symbol: 'SPY', name: 'S&P 500', tag: '시장대표' },
      { symbol: 'QQQ', name: 'Nasdaq 100', tag: '나스닥' },
      { symbol: 'IWM', name: 'Russell 2000', tag: '중소형주' },
      { symbol: 'DIA', name: 'Dow Jones', tag: '배당대형주' },
    ],
  },
  {
    key: 'consumer',
    label: '소비',
    items: [
      { symbol: 'AMZN', name: 'Amazon', tag: '커머스/클라우드' },
      { symbol: 'TSLA', name: 'Tesla', tag: '전기차' },
      { symbol: 'COST', name: 'Costco', tag: '리테일' },
      { symbol: 'SBUX', name: 'Starbucks', tag: '소비재' },
    ],
  },
  {
    key: 'finance',
    label: '금융',
    items: [
      { symbol: 'JPM', name: 'JPMorgan', tag: '은행' },
      { symbol: 'BAC', name: 'Bank of America', tag: '은행' },
      { symbol: 'V', name: 'Visa', tag: '결제' },
      { symbol: 'MA', name: 'Mastercard', tag: '결제' },
    ],
  },
  {
    key: 'healthcare',
    label: '헬스케어',
    items: [
      { symbol: 'LLY', name: 'Eli Lilly', tag: '비만/당뇨' },
      { symbol: 'UNH', name: 'UnitedHealth', tag: '보험' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', tag: '제약' },
      { symbol: 'MRK', name: 'Merck', tag: '제약' },
    ],
  },
];

const QUICK_STYLE = {
  READY: 'bg-green-100 text-green-700',
  WAIT: 'bg-amber-100 text-amber-700',
  BLOCKED: 'bg-red-100 text-red-700',
  ERROR: 'bg-gray-100 text-gray-500',
};

export default function LandingView({
  recent,
  watchlist,
  onSelect,
  onClearRecent,
  onRemoveWatchlist,
}) {
  const [popularKey, setPopularKey] = useState(POPULAR_GROUPS[0].key);
  const activePopular =
    POPULAR_GROUPS.find((group) => group.key === popularKey) ?? POPULAR_GROUPS[0];
  const { results: quickSignals, loadingSymbol, check } = useQuickSignal('swing');

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
      <header className="flex flex-col gap-2 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600">
          <Sparkles size={20} />
        </div>
        <div className="text-xl font-semibold text-gray-900">종목 카드 분석</div>
        <p className="text-xs text-gray-500 leading-relaxed">
          미국 주식 / ETF를 검색하면 차트, 기술적 지표,
          <br />
          펀더멘탈, 매매 판단 근거를 한 카드에서 확인할 수 있어요.
        </p>
      </header>

      <MarketStatusPanel />

      {watchlist && watchlist.length > 0 ? (
        <section>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
            <Star size={13} className="fill-amber-400 text-amber-400" /> 관심종목
          </div>
          <div className="grid grid-cols-3 gap-2">
            {watchlist.map((sym) => (
              <div
                key={sym}
                className="group flex items-center justify-between gap-1 rounded-lg border border-amber-100 bg-amber-50/40 px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => onSelect(sym)}
                  className="min-w-0 flex-1 text-left text-xs font-semibold text-gray-900 truncate"
                >
                  {sym}
                </button>
                {quickSignals[sym] ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                      QUICK_STYLE[quickSignals[sym].action] ?? QUICK_STYLE.ERROR
                    }`}
                  >
                    {quickSignals[sym].action}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => check(sym)}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded text-gray-400 hover:bg-amber-100 hover:text-amber-700"
                  aria-label={`${sym} 빠른 신호 확인`}
                  title="빠른 신호 확인"
                  disabled={loadingSymbol === sym}
                >
                  <RefreshCw size={11} className={loadingSymbol === sym ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveWatchlist(sym)}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded text-amber-500 hover:bg-amber-100 hover:text-amber-700"
                  aria-label={`${sym} 관심종목 제거`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <TrendingUp size={13} /> 종목 테마
          </div>
          <div className="flex max-w-[280px] gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-0.5">
            {POPULAR_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setPopularKey(group.key)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                  group.key === popularKey ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {activePopular.items.map((p) => (
            <button
              key={p.symbol}
              type="button"
              onClick={() => onSelect(p.symbol)}
              className="text-left rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 transition px-3 py-2"
            >
              <div className="min-w-0 truncate">
                <span className="text-sm font-semibold text-gray-900">{p.symbol}</span>
                <span className="text-[11px] text-gray-500">({p.name})</span>
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-blue-500">#{p.tag}</div>
            </button>
          ))}
        </div>
      </section>

      {recent && recent.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Clock size={13} /> 최근 검색
            </div>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              전체 지우기
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => onSelect(sym)}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 transition"
              >
                {sym}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <SignalLogPanel onSelect={onSelect} />

      <footer className="text-[10px] text-gray-300 text-center pt-2">
        데이터: Twelve Data · 이 카드는 투자 권유가 아닙니다.
      </footer>
    </div>
  );
}
