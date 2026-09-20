import { Link } from 'react-router-dom';
import { PiCaretLeft } from 'react-icons/pi';

export default function PageHeader({ title, subtitle, back, actions, children }) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          to={back.to}
          className="mb-3 inline-flex items-center gap-1 rounded text-sm font-medium text-muted hover:text-ink"
        >
          <PiCaretLeft size={16} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight text-ink sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
