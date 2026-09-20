import { PiCheckBold } from 'react-icons/pi';

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

export function TextField({ label, hint, error, required, className = '', id, suffix, ...props }) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, error, hint)}
          required={required}
          className={`h-11 ${inputBase} ${error ? inputBad : inputOk} ${suffix ? 'pr-12' : ''}`}
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
