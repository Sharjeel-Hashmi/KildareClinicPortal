import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PiSpinnerGap, PiUploadSimple, PiArrowCounterClockwise } from 'react-icons/pi';
import { clinicSettingsApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import { uploadFile } from '../../utils/upload.js';
import useFetch from '../../hooks/useFetch.js';
import defaultStamp from '../../assets/kildare-stamp.png';
import Panel from '../ui/Panel.jsx';
import { Spinner, ErrorState } from '../ui/States.jsx';

// Super Admin only: the one stamp printed next to the signature on every doctor's documents.
export default function ClinicStamp() {
  const { data, loading, error, reload } = useFetch(() => clinicSettingsApi.get(), []);
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const custom = data?.settings?.stampUrl || '';

  const save = async (stampUrl, message) => {
    setBusy(true);
    try {
      await clinicSettingsApi.update({ stampUrl });
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      toast.error('Choose a PNG, JPG or WebP image');
      return;
    }
    setBusy(true);
    try {
      const url = await uploadFile(file, 'stamp');
      await clinicSettingsApi.update({ stampUrl: url });
      toast.success('Stamp updated. It is used on all new prints.');
      reload();
    } catch (err) {
      toast.error(err?.response ? getErrorMessage(err) : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Panel title="Clinic stamp">
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-32 w-52 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-paper">
            {busy ? (
              <PiSpinnerGap size={24} className="animate-spin text-muted" aria-hidden="true" />
            ) : (
              <img src={custom || defaultStamp} alt="Current clinic stamp" className="h-full w-full object-contain p-2" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-ink">
              {custom ? 'Custom stamp' : 'Standard Kildare Clinic stamp'}
              <span className="text-muted"> — printed next to the doctor's signature when “Add stamp” is ticked.</span>
            </p>
            <p className="mt-1 text-[13px] text-muted">Use a PNG with a transparent background (best), JPG or WebP, up to 3 MB.</p>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-3.5 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-60"
              >
                <PiUploadSimple size={17} aria-hidden="true" />
                Upload new stamp
              </button>
              {custom && (
                <button
                  type="button"
                  onClick={() => save('', 'Back to the standard stamp')}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-60"
                >
                  <PiArrowCounterClockwise size={17} aria-hidden="true" />
                  Use the standard stamp
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}