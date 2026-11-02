import { SelectField } from '../ui/Field.jsx';
import { daysInMonth, todayDublin } from '../../utils/booking.js';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n) => String(n).padStart(2, '0');

// { mode: 'month' | 'year', year, month } — starts on the current Irish month
export const initialPeriod = () => {
  const t = todayDublin();
  return { mode: 'month', year: Number(t.slice(0, 4)), month: Number(t.slice(5, 7)) };
};

// first and last day (YYYY-MM-DD) of the chosen month or year
export const periodRange = ({ mode, year, month }) =>
  mode === 'month'
    ? { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(daysInMonth(`${year}-${pad(month)}`))}` }
    : { from: `${year}-01-01`, to: `${year}-12-31` };

export const periodLabel = ({ mode, year, month }) => (mode === 'month' ? `${MONTHS[month - 1]} ${year}` : String(year));

const chip = (on) =>
  `h-11 rounded-lg border px-4 text-sm font-semibold transition-colors ${
    on ? 'border-gold-600 bg-gold-500 text-ink' : 'border-line-strong bg-white text-ink hover:bg-paper'
  }`;

// Monthly / Yearly switch with a month and year chooser
export default function PeriodPicker({ value, onChange, idPrefix = 'period' }) {
  const thisYear = Number(todayDublin().slice(0, 4));
  const years = Array.from({ length: 6 }, (_, i) => thisYear - i);
  if (!years.includes(value.year)) years.push(value.year);
  years.sort((a, b) => b - a);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex gap-2" role="group" aria-label="Period type">
        <button type="button" aria-pressed={value.mode === 'month'} className={chip(value.mode === 'month')} onClick={() => onChange({ ...value, mode: 'month' })}>
          Monthly
        </button>
        <button type="button" aria-pressed={value.mode === 'year'} className={chip(value.mode === 'year')} onClick={() => onChange({ ...value, mode: 'year' })}>
          Yearly
        </button>
      </div>
      {value.mode === 'month' && (
        <SelectField id={`${idPrefix}-month`} label="Month" className="w-40" value={value.month} onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </SelectField>
      )}
      <SelectField id={`${idPrefix}-year`} label="Year" className="w-28" value={value.year} onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </SelectField>
    </div>
  );
}