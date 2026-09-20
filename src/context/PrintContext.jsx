import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const PrintContext = createContext(null);

// print({ kind: 'patient' | 'consultation', data }) → renders the sheet, opens the print dialog
export function PrintProvider({ children }) {
  const [job, setJob] = useState(null);

  const print = useCallback((kind, data) => setJob({ kind, data }), []);

  useEffect(() => {
    if (!job) return undefined;
    const clear = () => setJob(null);
    window.addEventListener('afterprint', clear);
    // wait a frame so the sheet is in the DOM before the dialog opens
    const id = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('afterprint', clear);
    };
  }, [job]);

  const value = useMemo(() => ({ job, print }), [job, print]);
  return <PrintContext.Provider value={value}>{children}</PrintContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePrint = () => useContext(PrintContext);
