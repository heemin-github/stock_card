import { Sparkles, Clock, TrendingUp, Search } from 'lucide-react';

const POPULAR = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOG', name: 'Alphabet' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'AMD', name: 'AMD' },
];

export default function LandingView({ recent, onSelect, onClearRecent }) {
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

      <section className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 flex items-start gap-3">
        <Search size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-[12px] text-gray-700 leading-snug">
          위 검색창에 종목명 또는 티커를 입력하세요. 예: <span className="font-medium">apple</span>,{' '}
          <span className="font-medium">tsla</span>, <span className="font-medium">qqq</span>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
          <TrendingUp size={13} /> 인기 종목
        </div>
        <div className="grid grid-cols-2 gap-2">
          {POPULAR.map((p) => (
            <button
              key={p.symbol}
              type="button"
              onClick={() => onSelect(p.symbol)}
              className="text-left rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 transition px-3 py-2"
            >
              <div className="text-sm font-semibold text-gray-900">{p.symbol}</div>
              <div className="text-[11px] text-gray-500">{p.name}</div>
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

      <footer className="text-[10px] text-gray-300 text-center pt-2">
        데이터: Twelve Data · 이 카드는 투자 권유가 아닙니다.
      </footer>
    </div>
  );
}
