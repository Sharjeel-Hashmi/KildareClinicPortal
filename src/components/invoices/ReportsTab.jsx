import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiCaretRight, PiChartBar, PiTrendDown, PiTrendUp, PiCoins } from 'react-icons/pi';
import { financeApi } from '../../api/services.js';
import useFetch from '../../hooks/useFetch.js';
import { eur } from '../../utils/money.js';
import Panel from '../ui/Panel.jsx';
import { Spinner, ErrorState, EmptyState } from '../ui/States.jsx';
import PeriodPicker, { initialPeriod, periodLabel, periodRange, MONTHS } from './PeriodPicker.jsx';
import ProfitChart from './ProfitChart.jsx';

function Figure({ icon: Icon, label, value, tone = '' }) {
  return (
    <div className="flex items-center gap-4 bg-white px-5 py-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-600">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={`font-display text-[26px] font-bold leading-none tabular-nums ${tone}`}>{value}</p>
        <p className="mt-1.5 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

// Super Admin: income, expenses and profit for a month or a year, and what each doctor brought in.
export default function ReportsTab() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(initialPeriod);
  const { data, loading, error, reload } = useFetch(
    () => financeApi.summary({ year: period.year, month: period.mode === 'month' ? period.month : undefined }),
    [period.year, period.mode, period.month],
    { keepPrevious: true }
  );

  const openDoctor = (d) => {
    const { from, to } = periodRange(period);
    const q = new URLSearchParams({ from, to, doctorName: d.name });
    if (d.id) q.set('doctorId', d.id);
    navigate(`/invoices?${q.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-4">
        <PeriodPicker value={period} onChange={setPeriod} idPrefix="rep" />
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Spinner />
      ) : (
        <div className={`space-y-6 ${loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}`}>
          <section aria-label={`Summary for ${periodLabel(period)}`}>
            <h2 className="mb-2 text-[15px] font-bold">{periodLabel(period)}</h2>
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              <Figure icon={PiTrendUp} label={`Income · ${data.period.invoiceCount} invoices`} value={eur(data.period.income)} />
              <Figure icon={PiTrendDown} label={`Expenses · ${data.period.expenseCount} recorded`} value={eur(data.period.expenses)} />
              <Figure icon={PiCoins} label="Profit" value={eur(data.period.profit)} tone={data.period.profit < 0 ? 'text-danger' : 'text-ok'} />
            </div>
          </section>

          <Panel title={`Monthly profit · ${data.year}`} icon={PiChartBar}>
            <ProfitChart
              months={data.months}
              selectedMonth={period.mode === 'month' ? period.month : null}
              onSelectMonth={(m) => setPeriod({ ...period, mode: 'month', month: m })}
            />
            <p className="mt-3 text-[13px] text-muted">Click a month to see its figures and doctors. Profit = income − expenses.</p>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title="Income by doctor" bodyClassName="p-0">
              {data.doctors.length === 0 ? (
                <EmptyState icon={PiCoins} title="No invoices in this period" message="Income by doctor appears here once invoices are recorded." />
              ) : (
                <ul className="divide-y divide-line">
                  {data.doctors.map((d) => (
                    <li key={d.id || d.name}>
                      <button
                        type="button"
                        onClick={() => openDoctor(d)}
                        className="block w-full px-5 py-3.5 text-left transition-colors hover:bg-gold-50/60"
                      >
                        <span className="flex items-center gap-3">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{d.name}</span>
                            <span className="block text-sm text-muted">
                              {d.invoices} {d.invoices === 1 ? 'invoice' : 'invoices'} · {d.share}% of income
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">{eur(d.income)}</span>
                          <PiCaretRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
                        </span>
                        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-paper" aria-hidden="true">
                          <span className="block h-full rounded-full bg-gold-500" style={{ width: `${Math.max(d.share, 2)}%` }} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Expenses by category" bodyClassName="p-0">
              {data.expenseByCategory.length === 0 ? (
                <EmptyState icon={PiTrendDown} title="No expenses in this period" message={`Nothing recorded for ${period.mode === 'month' ? MONTHS[period.month - 1] : period.year}.`} />
              ) : (
                <ul className="divide-y divide-line">
                  {data.expenseByCategory.map((c) => (
                    <li key={c.name} className="flex items-center gap-3 px-5 py-3">
                      <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{eur(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}