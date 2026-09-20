export default function Panel({ title, icon: Icon, step, action, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <section className={`rounded-xl border border-line bg-white ${className}`}>
      {(title || action) && (
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="flex items-center gap-3 text-[17px] font-semibold text-ink">
            {step ? (
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white"
              >
                {step}
              </span>
            ) : (
              Icon && <Icon size={20} className="text-gold-600" aria-hidden="true" />
            )}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
