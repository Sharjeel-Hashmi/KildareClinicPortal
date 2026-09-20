import { PiCaretLeft, PiCaretRight } from 'react-icons/pi';
import Button from './Button.jsx';

export default function Pagination({ page, pages, total, onChange, noun = 'results' }) {
  if (!total) return null;
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3"
    >
      <p className="text-sm text-muted">
        {total} {total === 1 ? noun.replace(/s$/, '') : noun} · page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={PiCaretLeft} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
          <PiCaretRight size={18} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
