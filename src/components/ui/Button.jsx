import { Link } from 'react-router-dom';
import { PiSpinnerGap } from 'react-icons/pi';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap select-none ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-12 px-5 text-base',
};

const variants = {
  primary: 'bg-gold-500 text-ink hover:bg-gold-400 active:bg-gold-600',
  dark: 'bg-ink text-white hover:bg-ink-3',
  secondary: 'border border-line-strong bg-white text-ink hover:bg-paper',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-danger text-white hover:bg-danger-700',
  dangerGhost: 'text-danger hover:bg-danger-50',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  to,
  className = '',
  disabled,
  children,
  ...props
}) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  const content = (
    <>
      {loading ? (
        <PiSpinnerGap size={18} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={18} aria-hidden="true" />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
