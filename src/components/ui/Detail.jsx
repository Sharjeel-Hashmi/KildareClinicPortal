// Read-only label/value rows used on the patient profile and consultation view.
export function DetailList({ children, cols = 1, className = '' }) {
  return (
    <dl className={`grid gap-x-8 gap-y-4 ${cols === 2 ? 'sm:grid-cols-2' : ''} ${className}`}>{children}</dl>
  );
}

export function DetailItem({ label, children, wide = false, multiline = false }) {
  const empty = children === undefined || children === null || children === '' || children === false;
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd className={`mt-0.5 text-[15px] leading-relaxed text-ink ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {empty ? <span className="text-muted">—</span> : children}
      </dd>
    </div>
  );
}
