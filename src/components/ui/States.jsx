import { PiWarningCircle } from 'react-icons/pi';
import Button from './Button.jsx';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-gold-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="divide-y divide-line" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <span className="size-10 animate-pulse rounded-full bg-line" />
          <span className="h-4 w-40 animate-pulse rounded bg-line" />
          <span className="ml-auto hidden h-4 w-24 animate-pulse rounded bg-line sm:block" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid size-14 place-items-center rounded-full bg-gold-50 text-gold-600">
          <Icon size={28} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-[15px] text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role="alert">
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-danger-50 text-danger">
        <PiWarningCircle size={28} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold text-ink">We couldn’t load this</h3>
      <p className="mt-1.5 max-w-sm text-[15px] text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
