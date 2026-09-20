import { useEffect, useRef } from 'react';
import { PiWarning } from 'react-icons/pi';
import Button from './Button.jsx';

// Built on the native <dialog>: focus trapping, ESC and inert background come for free.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const ref = useRef(null);

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
        if (!loading) onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !loading) onCancel();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/55"
    >
      <div className="p-6">
        <span className="mb-4 grid size-11 place-items-center rounded-full bg-danger-50 text-danger">
          <PiWarning size={22} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading} autoFocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
