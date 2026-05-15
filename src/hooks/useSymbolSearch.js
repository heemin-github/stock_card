import { useEffect, useState } from 'react';

// Debounced symbol search against Twelve Data's /symbol_search.
// Returns { loading, error, results } where results is an array of matches.
export function useSymbolSearch(query, { delay = 300, limit = 8 } = {}) {
  const [state, setState] = useState({ loading: false, error: null, results: [] });

  useEffect(() => {
    const q = (query ?? '').trim();
    if (q.length < 1) {
      setState({ loading: false, error: null, results: [] });
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const url = `/api/td/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=${limit}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json?.status === 'error') throw new Error(json.message ?? 'search failed');
        if (cancelled) return;
        setState({ loading: false, error: null, results: json?.data ?? [] });
      } catch (err) {
        if (cancelled) return;
        setState({ loading: false, error: err.message ?? String(err), results: [] });
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, delay, limit]);

  return state;
}
