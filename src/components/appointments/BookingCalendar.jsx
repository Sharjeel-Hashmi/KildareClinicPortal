import { useEffect, useState } from 'react';
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi';
import { availabilityApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import { addMonths, daysInMonth, formatMonth, isoWeekday, monthOf, todayDublin } from '../../utils/booking.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Month calendar that highlights the days a doctor still has free slots (data comes from the same
// server function the website uses). Used for the availability preview and the booking form.
//   markers:  { "2026-12-25": "off" | "custom" | "block" }  small dots for leave / extra days / blocked times
//   onlyFree: true -> days without free slots cannot be picked (booking form)
//   staff:    true -> staff rules (no minimum-notice window) for the booking form
export default function BookingCalendar({
  doctorId,
  serviceId,
  selected,
  onSelect,
  refreshKey = 0,
  markers = {},
  onlyFree = false,
  staff = false,
}) {
  const today = todayDublin();
  const [month, setMonth] = useState(monthOf(selected || today));
  const [free, setFree] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctorId) return undefined;
    let cancelled = false;
    const first = `${month}-01`;
    const last = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
    if (last < today) {
      setFree({});
      return undefined;
    }
    setLoading(true);
    setError('');
    availabilityApi
      .dates(doctorId, { from: first < today ? today : first, to: last, serviceId: serviceId || undefined, staff: staff ? '1' : undefined })
      .then((d) => {
        if (cancelled) return;
        const map = {};
        (d.dates || []).forEach((x) => {
          map[x.date] = x.freeSlots;
        });
        setFree(map);
      })
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctorId, serviceId, month, refreshKey, staff, today]);

  const lead = isoWeekday(`${month}-01`) - 1;
  const cells = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  const canGoBack = month > monthOf(today);

  const dot = { off: 'bg-danger', custom: 'bg-info', block: 'bg-gold-500' };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="grid size-9 place-items-center rounded-lg border border-line-strong bg-white hover:bg-paper disabled:opacity-40"
        >
          <PiCaretLeft size={16} aria-hidden="true" />
        </button>
        <div className="text-[15px] font-bold">{formatMonth(month)}</div>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
          className="grid size-9 place-items-center rounded-lg border border-line-strong bg-white hover:bg-paper"
        >
          <PiCaretRight size={16} aria-hidden="true" />
        </button>
      </div>

      {error && <p className="mb-2 text-[13px] font-medium text-danger">{error}</p>}

      <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-60' : ''}`}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-0.5 text-center text-[11.5px] font-semibold text-muted">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`b${i}`} />;
          const past = date < today;
          const count = free[date] || 0;
          const isSel = date === selected;
          const marker = markers[date];
          const disabled = past || (onlyFree && !count);
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              aria-pressed={isSel}
              aria-label={`${date}${count ? `, ${count} free slots` : ''}${marker === 'off' ? ', unavailable' : ''}`}
              className={`relative h-11 rounded-lg border text-[13.5px] transition-colors ${
                isSel
                  ? 'border-gold-600 bg-gold-500 font-bold text-ink'
                  : count
                    ? 'border-ok/30 bg-ok-50 font-bold text-ink hover:border-ok'
                    : 'border-line bg-white font-medium text-ink'
              } ${disabled ? 'cursor-default text-[#b4b1a6]' : 'cursor-pointer'}`}
            >
              {Number(date.slice(8))}
              {marker && (
                <span aria-hidden="true" className={`absolute bottom-1 left-1/2 -ml-[3px] size-1.5 rounded-full ${dot[marker]}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <Legend className="rounded border border-ok/30 bg-ok-50" text="Free slots" square />
        {!onlyFree && (
          <>
            <Legend className="bg-danger" text="Leave / unavailable" />
            <Legend className="bg-info" text="Extra clinic day" />
            <Legend className="bg-gold-500" text="Part of day blocked" />
          </>
        )}
      </div>
    </div>
  );
}

function Legend({ className, text, square }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`${square ? 'size-3.5' : 'size-2 rounded-full'} ${className}`} />
      {text}
    </span>
  );
}
