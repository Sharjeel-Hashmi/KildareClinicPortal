import { useEffect, useState, useCallback } from 'react';
import { getErrorMessage } from '../api/client.js';

// Tiny data-fetching hook: { data, loading, error, reload }
// keepPrevious keeps the old data on screen while a new page / search loads (no flicker).
export default function useFetch(fetcher, deps = [], { keepPrevious = false } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ data: keepPrevious ? s.data : null, loading: true, error: null }));

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({
            data: keepPrevious ? s.data : null,
            loading: false,
            error: getErrorMessage(err),
          }));
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
