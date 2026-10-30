import { useEffect, useRef } from 'react';
import { PiPrinter } from 'react-icons/pi';
import Button from '../ui/Button.jsx';
import { CheckChoice } from '../ui/Field.jsx';

const TITLE = {
  consultation: 'Print consultation',
  prescription: 'Print prescription',
  referral: 'Print referral letter',
  certificate: 'Print medical certificate',
  invoice: 'Print receipt',
};

// Asked before a signed document is printed: add the clinic stamp or not (the choice is remembered).
export default function PrintOptionsDialog({ job, stampUrl, useStamp, onUseStampChange, onPrint, onCancel }) {
  const ref = useRef(null);
  const open = Boolean(job);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/55 print:hidden"
    >
      <div className="p-6">
        <span className="mb-4 grid size-11 place-items-center rounded-full bg-gold-100 text-gold-700">
          <PiPrinter size={22} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold text-ink">{TITLE[job?.kind] || 'Print'}</h2>

        <div className="mt-4">
          <CheckChoice checked={useStamp} onChange={onUseStampChange}>
            Add the clinic stamp next to the signature
          </CheckChoice>
        </div>
        {useStamp && stampUrl && (
          <div className="mt-3 grid place-items-center rounded-lg border border-line bg-paper px-3 py-4">
            <img src={stampUrl} alt="Clinic stamp preview" className="h-20 w-auto object-contain" />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button icon={PiPrinter} onClick={onPrint} autoFocus>
            Print
          </Button>
        </div>
      </div>
    </dialog>
  );
}