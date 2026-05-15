import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import SearchBar from './components/SearchBar.jsx';
import StockCard from './components/StockCard.jsx';
import LandingView from './components/LandingView.jsx';

const RECENT_KEY = 'stockcard.recent';
const WATCHLIST_KEY = 'stockcard.watchlist';
const RECENT_MAX = 8;
const WATCHLIST_MAX = 12;
const SYMBOL_PARAM = 'symbol';

function normalizeSymbol(symbol) {
  return symbol?.trim().toUpperCase() || null;
}

function getSymbolFromUrl() {
  if (typeof window === 'undefined') return null;
  return normalizeSymbol(new URLSearchParams(window.location.search).get(SYMBOL_PARAM));
}

function updateUrlSymbol(symbol, replace = false) {
  const url = new URL(window.location.href);
  if (symbol) url.searchParams.set(SYMBOL_PARAM, symbol);
  else url.searchParams.delete(SYMBOL_PARAM);
  const next = `${url.pathname}${url.search}${url.hash}`;
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', next);
}

function loadStoredList(key, max) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, max) : [];
  } catch (_e) {
    return [];
  }
}

function saveStoredList(key, list, max) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, max)));
  } catch (_e) {
    /* ignore quota errors */
  }
}

export default function App() {
  const [ticker, setTicker] = useState(() => getSymbolFromUrl());
  const [recent, setRecent] = useState(() => loadStoredList(RECENT_KEY, RECENT_MAX));
  const [watchlist, setWatchlist] = useState(() =>
    loadStoredList(WATCHLIST_KEY, WATCHLIST_MAX)
  );

  useEffect(() => {
    const handlePopState = () => setTicker(getSymbolFromUrl());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!ticker) return;
    setRecent((prev) => {
      const next = [ticker, ...prev.filter((s) => s !== ticker)].slice(0, RECENT_MAX);
      saveStoredList(RECENT_KEY, next, RECENT_MAX);
      return next;
    });
  }, [ticker]);

  const handleSelect = useCallback((symbol) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return;
    setTicker(normalized);
    updateUrlSymbol(normalized);
  }, []);

  const handleHome = useCallback(() => {
    setTicker(null);
    updateUrlSymbol(null);
  }, []);
  const handleClearRecent = useCallback(() => {
    setRecent([]);
    saveStoredList(RECENT_KEY, [], RECENT_MAX);
  }, []);
  const handleToggleWatchlist = useCallback((symbol) => {
    const normalized = symbol.toUpperCase();
    setWatchlist((prev) => {
      const exists = prev.includes(normalized);
      const next = exists
        ? prev.filter((s) => s !== normalized)
        : [normalized, ...prev.filter((s) => s !== normalized)].slice(0, WATCHLIST_MAX);
      saveStoredList(WATCHLIST_KEY, next, WATCHLIST_MAX);
      return next;
    });
  }, []);
  const handleRemoveWatchlist = useCallback((symbol) => {
    setWatchlist((prev) => {
      const next = prev.filter((s) => s !== symbol);
      saveStoredList(WATCHLIST_KEY, next, WATCHLIST_MAX);
      return next;
    });
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
        <StockCard
          key={ticker}
          ticker={ticker}
          isWatchlisted={watchlist.includes(ticker)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      ) : (
        <LandingView
          recent={recent}
          watchlist={watchlist}
          onSelect={handleSelect}
          onClearRecent={handleClearRecent}
          onRemoveWatchlist={handleRemoveWatchlist}
        />
      )}
    </div>
  );
}
