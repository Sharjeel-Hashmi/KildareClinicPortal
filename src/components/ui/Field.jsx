import { useLayoutEffect, useRef, useState } from 'react';
import { PiCalendarBlank, PiCheckBold } from 'react-icons/pi';

/* ── Text inputs ─────────────────────────────────────────── */
const inputBase =
  'w-full rounded-lg border bg-white px-3 text-[15px] text-ink placeholder:text-[#7c7a71] ' +
  'focus:outline-none focus:ring-2 disabled:bg-paper disabled:text-muted';
const inputOk = 'border-line-strong focus:border-gold-600 focus:ring-gold-500/30';
const inputBad = 'border-danger focus:border-danger focus:ring-danger/20';

export function Field({ label, htmlFor, error, hint, required, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          {required && (
            <span className="text-danger" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${htmlFor}-hint`} className="mt-1.5 text-[13px] text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function TextField({ label, hint, error, required, className = '', id, suffix, type, ...props }) {
  // Dates are always typed and shown as DD/MM/YYYY (see DateField below)
  if (type === 'date' || type === 'datetime-local') {
    return (
      <DateField
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={className}
        id={id}
        type={type}
        {...props}
      />
    );
  }

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, error, hint)}
          required={required}
          className={`h-11 ${inputBase} ${error ? inputBad : inputOk} ${suffix ? 'pr-12' : ''}`}
          type={type}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

/* ── Date inputs: always DD/MM/YYYY (and 24h HH:mm) whatever the browser / computer language ──
   The value handed to the form is still 'YYYY-MM-DD' (or 'YYYY-MM-DDTHH:mm'), exactly like a
   native <input type="date" | "datetime-local">, so validators, API and database are unchanged. */
const ISO_RX = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;
const digitsOf = (s) => s.replace(/\D/g, '');

// 'YYYY-MM-DD' | 'YYYY-MM-DDTHH:mm' → 'DD/MM/YYYY' | 'DD/MM/YYYY HH:mm'
const valueToText = (v, withTime) => {
  const m = ISO_RX.exec(v || '');
  if (!m) return '';
  const date = `${m[3]}/${m[2]}/${m[1]}`;
  return withTime ? `${date} ${m[4] ?? '00'}:${m[5] ?? '00'}` : date;
};

// digits typed so far → text with the / and : put in automatically
const maskDigits = (d, withTime) => {
  let out = d.slice(0, 2);
  if (d.length > 2) out += `/${d.slice(2, 4)}`;
  if (d.length > 4) out += `/${d.slice(4, 8)}`;
  if (withTime && d.length > 8) out += ` ${d.slice(8, 10)}`;
  if (withTime && d.length > 10) out += `:${d.slice(10, 12)}`;
  return out;
};

// complete, real calendar date (and time) → ISO value, otherwise ''
const digitsToValue = (d, withTime) => {
  if (d.length !== (withTime ? 12 : 8)) return '';
  const day = Number(d.slice(0, 2));
  const month = Number(d.slice(2, 4));
  const year = Number(d.slice(4, 8));
  if (year < 1000) return '';
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return '';
  const date = `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
  if (!withTime) return date;
  const hour = Number(d.slice(8, 10));
  const minute = Number(d.slice(10, 12));
  if (hour > 23 || minute > 59) return '';
  return `${date}T${d.slice(8, 10)}:${d.slice(10, 12)}`;
};

// position in the masked text just after the n-th digit (used to keep the cursor where the user is editing)
const caretAfterDigits = (masked, n) => {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < masked.length; i += 1) {
    if (/\d/.test(masked[i])) seen += 1;
    if (seen === n) return i + 1;
  }
  return masked.length;
};

function DateField({
  label,
  hint,
  error,
  required,
  className = '',
  id,
  name,
  value = '',
  onChange,
  min,
  max,
  disabled,
  readOnly,
  type,
  ...props
}) {
  const withTime = type === 'datetime-local';
  const textRef = useRef(null);
  const pickerRef = useRef(null);
  const caretRef = useRef(null);
  const [text, setText] = useState(() => valueToText(value, withTime));
  const [prevValue, setPrevValue] = useState(value);
  const [touched, setTouched] = useState(false);

  // The form changed the value from outside (record loaded, "Sign" button, …): refresh the text.
  // Typing never triggers this, because the text already matches the value it produced.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== digitsToValue(digitsOf(text), withTime)) setText(valueToText(value, withTime));
  }

  const emit = (v) => {
    if (v !== value) onChange?.({ target: { id, name, value: v } });
  };

  // put the cursor back where the user was typing (React moves it to the end when the text is re-masked)
  useLayoutEffect(() => {
    const el = textRef.current;
    if (caretRef.current !== null && el && document.activeElement === el) {
      el.setSelectionRange(caretRef.current, caretRef.current);
    }
    caretRef.current = null;
  }, [text]);

  const handleText = (e) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    const iso = ISO_RX.exec(raw.trim());
    let digits;
    let caretDigits;
    if (iso) {
      // pasted an ISO date such as 2026-09-21
      digits = `${iso[3]}${iso[2]}${iso[1]}${iso[4] ?? ''}${iso[5] ?? ''}`;
      caretDigits = digits.length;
    } else {
      digits = digitsOf(raw);
      caretDigits = digitsOf(raw.slice(0, caret)).length;
      // Deleting only a "/" or ":" leaves the digits unchanged, so remove the digit next to it instead
      if (raw.length < text.length && digits === digitsOf(text)) {
        const forward = e.nativeEvent?.inputType === 'deleteContentForward';
        const at = forward ? caretDigits : caretDigits - 1;
        if (at >= 0 && at < digits.length) {
          digits = digits.slice(0, at) + digits.slice(at + 1);
          caretDigits = at;
        }
      }
    }
    digits = digits.slice(0, withTime ? 12 : 8);
    const masked = maskDigits(digits, withTime);
    caretRef.current =
      caret >= raw.length ? masked.length : caretAfterDigits(masked, Math.min(caretDigits, digits.length));
    setText(masked);
    emit(digitsToValue(digits, withTime));
  };

  const handlePicker = (e) => {
    const v = e.target.value;
    setText(valueToText(v, withTime));
    emit(v);
    textRef.current?.focus();
  };

  const openPicker = () => {
    try {
      pickerRef.current.showPicker();
    } catch {
      textRef.current?.focus(); // very old browsers: just type the date
    }
  };

  const invalid = text !== '' && digitsToValue(digitsOf(text), withTime) === '';
  const shownError =
    touched && invalid
      ? `Enter the ${withTime ? 'date and time as DD/MM/YYYY HH:mm' : 'date as DD/MM/YYYY'}`
      : error;

  return (
    <Field label={label} htmlFor={id} error={shownError} hint={hint} required={required} className={className}>
      <div className="relative">
        <input
          {...props}
          ref={textRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={withTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY'}
          maxLength={withTime ? 16 : 10}
          value={text}
          onChange={handleText}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={shownError ? 'true' : undefined}
          aria-describedby={describedBy(id, shownError, hint)}
          className={`h-11 pr-12 tabular-nums ${inputBase} ${shownError ? inputBad : inputOk}`}
        />
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || readOnly}
          title="Open calendar"
          aria-label="Open calendar"
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-gold-600 disabled:pointer-events-none disabled:opacity-50"
        >
          <PiCalendarBlank size={20} aria-hidden="true" />
        </button>
        {/* native picker, only used for its calendar pop-up; never shown or focusable */}
        <input
          ref={pickerRef}
          type={withTime ? 'datetime-local' : 'date'}
          value={value || ''}
          min={min}
          max={max}
          onChange={handlePicker}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-11 opacity-0"
        />
      </div>
    </Field>
  );
}

export function TextAreaField({ label, hint, error, required, className = '', id, rows = 3, ...props }) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`min-h-[5.5rem] resize-y py-2.5 leading-relaxed ${inputBase} ${error ? inputBad : inputOk}`}
        {...props}
      />
    </Field>
  );
}

/* ── Choice chips (radio / checkbox) ─────────────────────── */
const chip =
  'group flex h-11 items-center gap-2.5 rounded-lg border border-line-strong bg-white px-3.5 text-[15px] font-medium ' +
  'transition-colors hover:bg-paper has-[input:checked]:border-gold-600 has-[input:checked]:bg-gold-50 ' +
  'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-gold-600 cursor-pointer';

export function ChoiceGroup({ legend, name, value, onChange, options, error, required, className = '' }) {
  return (
    <fieldset className={className}>
      {legend && (
        <legend className="mb-1.5 text-sm font-medium text-ink">
          {legend}
          {required && (
            <span className="text-danger" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </legend>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className={chip}>
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span
              aria-hidden="true"
              className="size-[18px] shrink-0 rounded-full border border-line-strong bg-white ring-inset transition-colors
                         group-has-[input:checked]:border-gold-600 group-has-[input:checked]:bg-gold-500 group-has-[input:checked]:ring-[4px] group-has-[input:checked]:ring-white"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-[13px] font-medium text-danger">{error}</p>}
    </fieldset>
  );
}

export function CheckChoice({ name, checked, onChange, children, className = '' }) {
  return (
    <label className={`${chip} ${className}`}>
      <input type="checkbox" className="sr-only" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-line-strong bg-white text-ink transition-colors
                   group-has-[input:checked]:border-gold-600 group-has-[input:checked]:bg-gold-500"
      >
        <PiCheckBold size={12} className="opacity-0 group-has-[input:checked]:opacity-100" />
      </span>
      {children}
    </label>
  );
}

// Multi-select chips storing an array; an option flagged `exclusive` (e.g. "None") clears the others
export function CheckGroup({ legend, value = [], onChange, options, className = '' }) {
  const toggle = (opt, on) => {
    if (!on) return onChange(value.filter((v) => v !== opt.value));
    if (opt.exclusive) return onChange([opt.value]);
    const exclusiveValues = options.filter((o) => o.exclusive).map((o) => o.value);
    return onChange([...value.filter((v) => !exclusiveValues.includes(v)), opt.value]);
  };
  return (
    <fieldset className={className}>
      {legend && <legend className="mb-1.5 text-sm font-medium text-ink">{legend}</legend>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <CheckChoice key={o.value} checked={value.includes(o.value)} onChange={(on) => toggle(o, on)}>
            {o.label}
          </CheckChoice>
        ))}
      </div>
    </fieldset>
  );
}