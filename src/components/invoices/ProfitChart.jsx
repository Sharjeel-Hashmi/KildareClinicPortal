import { useState } from 'react';
import { eur, eurShort } from '../../utils/money.js';
import { MONTHS } from './PeriodPicker.jsx';

const W = 760;
const H = 320;
const PAD = { top: 16, right: 12, bottom: 30, left: 56 };

// A "nice" round step so the axis reads €0, €500, €1k ...
const niceStep = (range, ticks) => {
  const raw = range / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

// Income and Expenses as bars for each month of the year, and Profit as a line. Click a month to look at it.
//   months: [{ month: 1..12, income, expenses, profit }]
export default function ProfitChart({ months, selectedMonth, onSelectMonth }) {
  const [hover, setHover] = useState(null);

  const maxVal = Math.max(...months.map((m) => Math.max(m.income, m.expenses, m.profit)), 0);
  const minVal = Math.min(...months.map((m) => m.profit), 0);
  const step = niceStep(Math.max(maxVal - minVal, 1), 4);
  const top = Math.ceil(maxVal / step) * step || step;
  const bottom = Math.floor(minVal / step) * step;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v) => PAD.top + ((top - v) / (top - bottom)) * plotH;
  const slot = plotW / 12;
  const bar = Math.min(18, slot / 3);
  const cx = (i) => PAD.left + slot * i + slot / 2;

  const ticks = [];
  for (let v = bottom; v <= top + 1e-9; v += step) ticks.push(v);

  const line = months.map((m, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(m.profit).toFixed(1)}`).join(' ');
  const shown = hover !== null ? months[hover] : null;
  const empty = months.every((m) => m.income === 0 && m.expenses === 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-gold-500" aria-hidden="true" /> Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-danger/60" aria-hidden="true" /> Expenses
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-ok" aria-hidden="true" /> Profit
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Monthly income, expenses and profit">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? 'stroke-line-strong' : 'stroke-line'} strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">
                {eurShort(t)}
              </text>
            </g>
          ))}

          {months.map((m, i) => {
            const active = selectedMonth === m.month;
            return (
              <g key={m.month}>
                {(active || hover === i) && (
                  <rect x={PAD.left + slot * i + 2} y={PAD.top} width={slot - 4} height={plotH} rx="6" className={active ? 'fill-gold-50' : 'fill-paper'} />
                )}
                <rect x={cx(i) - bar - 1} y={Math.min(y(m.income), y(0))} width={bar} height={Math.max(Math.abs(y(0) - y(m.income)), m.income ? 1 : 0)} rx="2" className="fill-gold-500" />
                <rect x={cx(i) + 1} y={Math.min(y(m.expenses), y(0))} width={bar} height={Math.max(Math.abs(y(0) - y(m.expenses)), m.expenses ? 1 : 0)} rx="2" className="fill-danger/60" />
                <text x={cx(i)} y={H - 10} textAnchor="middle" className={`text-[11px] ${active ? 'fill-ink font-bold' : 'fill-muted'}`}>
                  {MONTHS[i].slice(0, 3)}
                </text>
              </g>
            );
          })}

          <path d={line} fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="stroke-ok" />
          {months.map((m, i) => (
            <circle key={m.month} cx={cx(i)} cy={y(m.profit)} r="3.5" className="fill-white stroke-ok" strokeWidth="2" />
          ))}

          {/* one clickable / hoverable column per month */}
          {months.map((m, i) => (
            <rect
              key={`hit-${m.month}`}
              x={PAD.left + slot * i}
              y={PAD.top}
              width={slot}
              height={plotH + PAD.bottom}
              fill="transparent"
              className="cursor-pointer"
              tabIndex={0}
              role="button"
              aria-label={`${MONTHS[i]}: income ${eur(m.income)}, expenses ${eur(m.expenses)}, profit ${eur(m.profit)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => onSelectMonth?.(m.month)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelectMonth?.(m.month))}
            />
          ))}
        </svg>

        {shown && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-44 rounded-lg border border-line bg-white p-3 text-[13px] shadow-lg"
            style={{ left: `${Math.min(Math.max((cx(hover) / W) * 100, 14), 86)}%`, transform: 'translateX(-50%)' }}
          >
            <p className="mb-1.5 font-bold text-ink">{MONTHS[hover]}</p>
            <p className="flex justify-between"><span className="text-muted">Income</span><span className="font-semibold tabular-nums">{eur(shown.income)}</span></p>
            <p className="flex justify-between"><span className="text-muted">Expenses</span><span className="font-semibold tabular-nums">{eur(shown.expenses)}</span></p>
            <p className="mt-1 flex justify-between border-t border-line pt-1">
              <span className="text-muted">Profit</span>
              <span className={`font-bold tabular-nums ${shown.profit < 0 ? 'text-danger' : 'text-ok'}`}>{eur(shown.profit)}</span>
            </p>
          </div>
        )}
      </div>
      {empty && <p className="mt-2 text-center text-sm text-muted">No invoices or expenses recorded in this year yet.</p>}
    </div>
  );
}