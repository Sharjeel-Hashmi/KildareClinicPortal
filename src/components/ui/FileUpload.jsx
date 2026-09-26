import { useRef, useState } from 'react';
import { PiFilePdf, PiImage, PiSpinnerGap, PiTrash, PiUploadSimple } from 'react-icons/pi';
import toast from 'react-hot-toast';
import { uploadFile } from '../../utils/upload.js';

const isImage = (nameOrUrl = '') => /\.(png|jpe?g|webp)$/i.test(nameOrUrl.split('?')[0]);

// value: the current file URL (string) or ''. onChange(url) fires once the upload finishes,
// onChange('') clears it. `kind` is 'signature' or 'report' (see utils/upload.js).
export default function FileUpload({
  label,
  hint,
  error,
  required,
  kind,
  accept,
  value,
  onChange,
  fileName,
  onFileNameChange,
  shape = 'card', // 'card' (signature-style preview box) | 'row' (compact, for forms)
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, kind);
      onChange(url);
      onFileNameChange?.(file.name);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          {required && (
            <span className="text-danger" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {shape === 'card' ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-paper">
            {uploading ? (
              <PiSpinnerGap size={22} className="animate-spin text-muted" aria-hidden="true" />
            ) : value ? (
              <img src={value} alt="Signature preview" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="text-xs text-muted">No signature</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pick}
              disabled={uploading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-3.5 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-60"
            >
              <PiUploadSimple size={17} aria-hidden="true" />
              {value ? 'Replace' : 'Upload'}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-danger hover:bg-danger-50"
              >
                <PiTrash size={17} aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-line-strong bg-paper px-3.5 py-3">
          {uploading ? (
            <PiSpinnerGap size={20} className="shrink-0 animate-spin text-muted" aria-hidden="true" />
          ) : isImage(value || fileName || '') ? (
            <PiImage size={20} className="shrink-0 text-muted" aria-hidden="true" />
          ) : (
            <PiFilePdf size={20} className="shrink-0 text-muted" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-ink">
            {uploading ? 'Uploading…' : value ? fileName || 'File uploaded' : 'No file selected'}
          </span>
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-60"
          >
            <PiUploadSimple size={16} aria-hidden="true" />
            {value ? 'Replace' : 'Choose file'}
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-1.5 text-[13px] font-medium text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
      )}
    </div>
  );
}