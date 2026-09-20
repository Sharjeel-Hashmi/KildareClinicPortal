const tones = {
  neutral: 'bg-ink/[0.06] text-ink',
  gold: 'bg-gold-100 text-gold-700',
  ok: 'bg-ok-50 text-ok',
  danger: 'bg-danger-50 text-danger',
  info: 'bg-info-50 text-info',
};

export default function Badge({ tone = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${tones[tone]} ${className}`}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}
