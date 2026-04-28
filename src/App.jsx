import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import SearchBar from './components/SearchBar.jsx';
import StockCard from './components/StockCard.jsx';
import LandingView from './components/LandingView.jsx';

const RECENT_KEY = 'stockcard.recent';
const RECENT_MAX = 8;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, RECENT_MAX) : [];
  } catch (_e) {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch (_e) {
    /* ignore quota errors */
  }
}

export default function App() {
  const [ticker, setTicker] = useState(null);
  const [recent, setRecent] = useState(() => loadRecent());

  useEffect(() => {
    if (!ticker) return;
    setRecent((prev) => {
      const next = [ticker, ...prev.filter((s) => s !== ticker)].slice(0, RECENT_MAX);
      saveRecent(next);
      return next;
    });
  }, [ticker]);

  const handleSelect = useCallback((symbol) => {
    setTicker(symbol.toUpperCase());
  }, []);

  const handleHome = useCallback(() => setTicker(null), []);
  const handleClearRecent = useCallback(() => {
    setRecent([]);
    saveRecent([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="w-full max-w-md mx-auto mb-3 flex items-center gap-2">
        {ticker ? (
          <button
            type="button"
            onClick={handleHome}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100"
            aria-label="홈으로"
          >
            <ArrowLeft size={14} /> 홈
          </button>
        ) : null}
        <div className="flex-1">
          <SearchBar onSelect={handleSelect} />
        </div>
      </div>

      {ticker ? (
        <StockCard key={ticker} ticker={ticker} />
      ) : (
        <LandingView recent={recent} onSelect={handleSelect} onClearRecent={handleClearRecent} />
      )}
    </div>
  );
}
