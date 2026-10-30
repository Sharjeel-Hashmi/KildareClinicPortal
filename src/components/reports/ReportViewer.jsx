import { useEffect, useRef, useState } from 'react';
import { PiArrowSquareOut, PiDownloadSimple, PiX } from 'react-icons/pi';
import { formatDate } from '../../utils/format.js';

const isImage = (s = '') => /\.(png|jpe?g|webp|gif)$/i.test(s.split('?')[0]);
const isPdf = (s = '') => /\.pdf$/i.test(s.split('?')[0]);

// "?download=1" makes Vercel Blob send the file as a download instead of showing it
export const downloadHref = (url) => `${url}${url.includes('?') ? '&' : '?'}download=1`;

// Opens a lab report in a pop-up so it can be read without downloading it. PDFs and images show inline.
export default function ReportViewer({ report, onClose }) {
  const ref = useRef(null);
  const open = Boolean(report);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const url = report?.fileUrl || '';
  const image = isImage(report?.fileName) || isImage(url);
  const pdf = isPdf(report?.fileName) || isPdf(url);

  // A PDF is fetched by the portal itself and shown from a local "blob:" copy. Showing the web address
  // directly gets caught by download managers (IDM) and by servers that send PDFs as downloads.
  const [localUrl, setLocalUrl] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | ready | failed
  useEffect(() => {
    setLocalUrl('');
    if (!open || !pdf) {
      setState('idle');
      return undefined;
    }
    let cancelled = false;
    let objectUrl = '';
    setState('loading');
    fetch(url, { credentials: 'omit' })
      .then((r) => {
        if (!r.ok) throw new Error('bad status');
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }));
        setLocalUrl(objectUrl);
        setState('ready');
      })
      .catch(() => !cancelled && setState('failed'));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, pdf, url]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Report viewer"
      className="m-auto h-[90vh] w-[min(96vw,64rem)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/60 print:hidden"
    >
      {report && (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] font-semibold text-ink">{report.labName}</h2>
              <p className="truncate text-sm text-muted">
                {formatDate(report.date)}
                {report.fileName ? ` · ${report.fileName}` : ''}
              </p>
            </div>
            <a
              href={downloadHref(url)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-3.5 text-sm font-semibold text-ink hover:bg-paper"
            >
              <PiDownloadSimple size={17} aria-hidden="true" />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-10 place-items-center rounded-lg text-ink hover:bg-paper"
            >
              <PiX size={22} />
            </button>
          </div>

          <div className="min-h-0 flex-1 bg-paper">
            {image ? (
              <div className="grid h-full place-items-center overflow-auto p-3">
                <img src={url} alt={`Report from ${report.labName}`} className="max-h-full max-w-full object-contain" />
              </div>
            ) : pdf ? (
              state === 'ready' ? (
                <iframe title={`Report from ${report.labName}`} src={localUrl} className="h-full w-full border-0" />
              ) : (
                <div className="grid h-full place-items-center p-6 text-center">
                  <p className="text-[15px] text-muted">
                    {state === 'failed'
                      ? "The report couldn't be shown here. Use Download, or open it in a new tab below."
                      : 'Loading report…'}
                  </p>
                </div>
              )
            ) : (
              <div className="grid h-full place-items-center p-6 text-center">
                <p className="text-[15px] text-muted">This file type can't be previewed here.</p>
              </div>
            )}
          </div>

          <div className="border-t border-line px-5 py-2.5 text-right text-sm text-muted">
            Report not showing?{' '}
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">
              Open in a new tab
              <PiArrowSquareOut size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}