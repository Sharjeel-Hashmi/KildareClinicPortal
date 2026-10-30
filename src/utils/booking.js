// Helpers for the booking screens. All booking dates are plain "YYYY-MM-DD" strings in Irish time
// (the clinic's timezone), so date maths is done on those strings and never depends on the
// browser's own timezone.
const ZONE = 'Europe/Dublin';

export const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Today's date in Ireland, e.g. "2026-10-21"
export const todayDublin = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(new Date());

const utc = (iso) => new Date(`${iso}T00:00:00Z`);

export const addDays = (iso, n) => {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// 1 = Monday ... 7 = Sunday
export const isoWeekday = (iso) => {
  const d = utc(iso).getUTCDay();
  return d === 0 ? 7 : d;
};

export const monthOf = (iso) => iso.slice(0, 7); // "2026-10"
export const addMonths = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};
export const daysInMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

// "21/10/2026" (the portal shows every date as DD/MM/YYYY)
export const dmy = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');

export const formatDay = (iso) =>
  utc(iso).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
export const formatDayLong = (iso) =>
  utc(iso).toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const formatMonth = (ym) =>
  utc(`${ym}-01`).toLocaleDateString('en-IE', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// "13:00" -> "1:00 pm". Anything that is not HH:MM (e.g. a label that already reads "1:00 pm") is returned as it is.
export const time12 = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
  if (!m) return t;
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h >= 12 ? 'pm' : 'am'}`;
};

// ---- time ranges ("09:00") ----
export const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const fromMinutes = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// Returns a message when the ranges are not valid, otherwise "" (same rules the server enforces)
export const rangesProblem = (ranges) => {
  for (const r of ranges) {
    if (!r.start || !r.end) return 'Fill in both times';
    if (toMinutes(r.end) <= toMinutes(r.start)) return 'The end time must be after the start time';
  }
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 1; i < sorted.length; i += 1) {
    if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) return 'Time ranges overlap';
  }
  return '';
};

// A sensible next range to offer when "Add hours" is pressed
export const nextRange = (ranges) => {
  if (!ranges.length) return { start: '09:00', end: '13:00' };
  const lastEnd = Math.max(...ranges.map((r) => toMinutes(r.end)));
  const start = Math.min(lastEnd, 22 * 60);
  return { start: fromMinutes(start), end: fromMinutes(Math.min(start + 180, 23 * 60 + 59)) };
};

// ---- appointment status ----
export const STATUS_META = {
  confirmed: { label: 'Confirmed', tone: 'ok' },
  pending_payment: { label: 'Awaiting payment', tone: 'gold' },
  completed: { label: 'Completed', tone: 'info' },
  no_show: { label: 'No-show', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const SOURCE_LABEL = { website: 'Website', dashboard: 'Booked by staff' };

// Services a given doctor can be booked for
export const servicesForDoctor = (services = [], doctorId) =>
  services.filter(
    (s) => s.isBookable && s.durationMinutes > 0 && (s.doctors || []).some((d) => String(d._id || d) === String(doctorId))
  );
