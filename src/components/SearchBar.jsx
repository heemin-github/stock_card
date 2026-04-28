import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSymbolSearch } from '../hooks/useSymbolSearch.js';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef(null);

  const { loading, error, results } = useSymbolSearch(query);

  useEffect(() => {
    setHighlight(0);
  }, [results]);

  useEffect(() => {
    function onClickOutside(e) {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function commit(item) {
    if (!item) return;
    onSelect?.(item.symbol);
    setQuery(item.symbol);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) setOpen(true);
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto mb-4">
      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-blue-400">
        <Search size={16} className="text-gray-400 mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="종목 검색 (예: AAPL, 삼성전자, tesla)"
          className="flex-1 outline-none text-sm bg-transparent"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="text-gray-300 hover:text-gray-500"
            aria-label="clear"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && query.trim().length > 0 ? (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-400">검색 중…</div>
          ) : error ? (
            <div className="px-3 py-2 text-xs text-red-500">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">결과 없음</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <li key={`${r.symbol}-${r.exchange}-${i}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => commit(r)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 ${
                      i === highlight ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {r.symbol}
                        <span className="ml-1 text-[10px] text-gray-400 font-normal">
                          {r.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{r.instrument_name}</div>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{r.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
