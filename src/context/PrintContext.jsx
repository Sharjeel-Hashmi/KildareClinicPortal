import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auditApi, clinicSettingsApi } from '../api/services.js';
import defaultStamp from '../assets/kildare-stamp.png';
import PrintOptionsDialog from '../components/print/PrintOptionsDialog.jsx';

const PrintContext = createContext(null);

// Signed documents ask "add the clinic stamp?" first. The patient registration sheet prints straight away.
const STAMP_KINDS = new Set(['consultation', 'prescription', 'referral', 'certificate', 'invoice']);
const PREF_KEY = 'kc:print-stamp'; // 'off' once the person has unticked the stamp

const readPref = () => {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
};

// print(kind, data) → (asks about the stamp for signed documents) → renders the sheet → opens the print dialog
export function PrintProvider({ children }) {
  const [job, setJob] = useState(null); // what is being printed: { kind, data, stamp }
  const [pending, setPending] = useState(null); // waiting for the "add stamp?" answer: { kind, data }
  const [stampUrl, setStampUrl] = useState(defaultStamp);
  const [useStamp, setUseStamp] = useState(readPref);

  const start = useCallback((kind, data, stamp) => {
    // Leave a note in the audit log that this document was printed (who / which patient / which record).
    // Best effort only: a problem here must never stop the print.
    try {
      const isPatient = kind === 'patient';
      const patientId = isPatient ? data?._id : data?.patient?._id || data?.patient;
      auditApi
        .print({
          kind: isPatient ? 'registration' : kind,
          patientId: patientId ? String(patientId) : undefined,
          recordId: !isPatient && data?._id ? String(data._id) : undefined,
        })
        .catch(() => {});
    } catch {
      /* ignore */
    }
    setJob({ kind, data, stamp: stamp || null });
  }, []);

  const print = useCallback(
    (kind, data) => {
      if (!STAMP_KINDS.has(kind)) return start(kind, data, null);
      setUseStamp(readPref());
      setPending({ kind, data });
      return undefined;
    },
    [start]
  );

  // fetch the clinic's current stamp (Super Admin may have replaced it) each time the dialog opens
  useEffect(() => {
    if (!pending) return undefined;
    let cancelled = false;
    clinicSettingsApi
      .get()
      .then((d) => !cancelled && setStampUrl(d.settings?.stampUrl || defaultStamp))
      .catch(() => !cancelled && setStampUrl(defaultStamp));
    return () => {
      cancelled = true;
    };
  }, [pending]);

  const confirmPrint = () => {
    try {
      localStorage.setItem(PREF_KEY, useStamp ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    const { kind, data } = pending;
    setPending(null);
    start(kind, data, useStamp ? stampUrl : null);
  };

  useEffect(() => {
    if (!job) return undefined;
    let cancelled = false;
    const clear = () => setJob(null);
    window.addEventListener('afterprint', clear);
    // wait a frame so the sheet is in the DOM, then until its images (signature, stamp) have loaded
    const id = requestAnimationFrame(async () => {
      const images = [...(document.getElementById('print-root')?.querySelectorAll('img') || [])];
      const loaded = Promise.all(images.map((img) => (img.complete ? null : img.decode().catch(() => {}))));
      await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, 3000))]);
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      window.removeEventListener('afterprint', clear);
    };
  }, [job]);

  const value = useMemo(() => ({ job, print }), [job, print]);
  return (
    <PrintContext.Provider value={value}>
      {children}
      <PrintOptionsDialog
        job={pending}
        stampUrl={stampUrl}
        useStamp={useStamp}
        onUseStampChange={setUseStamp}
        onPrint={confirmPrint}
        onCancel={() => setPending(null)}
      />
    </PrintContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePrint = () => useContext(PrintContext);