import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PiEye, PiMagnifyingGlass, PiPencilSimple, PiPlus, PiReceipt, PiTag, PiTrash, PiX } from 'react-icons/pi';
import { expensesApi, expenseCategoriesApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import { formatDate } from '../../utils/format.js';
import { eur } from '../../utils/money.js';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { SelectField } from '../ui/Field.jsx';
import { SkeletonRows, EmptyState, ErrorState } from '../ui/States.jsx';
import ReportViewer from '../reports/ReportViewer.jsx';
import PeriodPicker, { initialPeriod, periodRange } from './PeriodPicker.jsx';
import ExpenseDialog from './ExpenseDialog.jsx';
import CategoriesDialog from './CategoriesDialog.jsx';

// Super Admin: the clinic's monthly expenses, with receipts.
export default function ExpensesTab() {
  const [period, setPeriod] = useState(initialPeriod);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const term = useDebounce(search.trim(), 300);
  const { from, to } = periodRange(period);

  const cats = useFetch(() => expenseCategoriesApi.list(), []);
  const categories = cats.data?.categories || [];

  const { data, loading, error, reload } = useFetch(
    () => expensesApi.list({ from, to, categoryId: categoryId || undefined, search: term || undefined }),
    [from, to, categoryId, term],
    { keepPrevious: true }
  );
  const rows = data?.expenses || [];

  const [dialog, setDialog] = useState({ open: false, expense: null });
  const [catsOpen, setCatsOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  // a category filter that no longer exists would hide everything
  useEffect(() => {
    if (categoryId && cats.data && !categories.some((c) => c._id === categoryId)) setCategoryId('');
  }, [categoryId, cats.data, categories]);

  const remove = async () => {
    setRemoving(true);
    try {
      await expensesApi.remove(removeTarget._id);
      toast.success('Expense removed');
      setRemoveTarget(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <div className="mb-5 space-y-4 rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PeriodPicker value={period} onChange={setPeriod} idPrefix="exp" />
          <div className="flex gap-2">
            <Button variant="secondary" icon={PiTag} onClick={() => setCatsOpen(true)}>
              Categories
            </Button>
            <Button icon={PiPlus} onClick={() => setDialog({ open: true, expense: null })}>
              Add expense
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <SelectField id="exp-filter" label="Category" className="w-52" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <div className="relative min-w-52 flex-1">
            <label htmlFor="exp-search" className="sr-only">
              Search expenses
            </label>
            <PiMagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="exp-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses…"
              className="h-11 w-full rounded-lg border border-line-strong bg-white pl-10 pr-10 text-[15px] placeholder:text-[#7c7a71] focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink">
                <PiX size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={PiReceipt}
            title="No expenses found for this period"
            message={categories.length === 0 ? 'Add a category first (for example Clinic Expenses), then record the expense.' : 'Change the month or filters, or add an expense.'}
            action={
              <Button icon={PiPlus} onClick={() => (categories.length === 0 ? setCatsOpen(true) : setDialog({ open: true, expense: null }))}>
                {categories.length === 0 ? 'Add a category' : 'Add expense'}
              </Button>
            }
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <div className="flex items-center justify-between border-b border-line bg-paper/60 px-5 py-3 text-sm">
              <span className="text-muted">{data.count} {data.count === 1 ? 'expense' : 'expenses'}</span>
              <span className="font-bold tabular-nums">Total {eur(data.total)}</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((e) => (
                <li key={e._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                  <span className="w-24 shrink-0 text-[15px] font-semibold tabular-nums">{formatDate(e.date)}</span>
                  <span className="min-w-0 flex-1 basis-48">
                    <span className="block truncate font-semibold">{e.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <Badge tone="gold">{e.categoryName}</Badge>
                      {e.detail && <span className="truncate">{e.detail}</span>}
                    </span>
                  </span>
                  <span className="w-24 shrink-0 text-right font-semibold tabular-nums">{eur(e.amount)}</span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    {e.receiptUrl ? (
                      <button type="button" aria-label={`View receipt for ${e.name}`} title="View receipt" onClick={() => setViewing(e)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-gold-50 hover:text-ink">
                        <PiEye size={18} />
                      </button>
                    ) : (
                      <span className="size-9" />
                    )}
                    <button type="button" aria-label={`Edit ${e.name}`} title="Edit" onClick={() => setDialog({ open: true, expense: e })} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-gold-50 hover:text-ink">
                      <PiPencilSimple size={18} />
                    </button>
                    <button type="button" aria-label={`Delete ${e.name}`} title="Delete" onClick={() => setRemoveTarget(e)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-50 hover:text-danger">
                      <PiTrash size={18} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ExpenseDialog
        open={dialog.open}
        expense={dialog.expense}
        categories={categories}
        onClose={() => setDialog({ open: false, expense: null })}
        onSaved={() => {
          setDialog({ open: false, expense: null });
          reload();
        }}
        onCategoriesChanged={cats.reload}
      />
      <CategoriesDialog open={catsOpen} categories={categories} onClose={() => setCatsOpen(false)} onChanged={cats.reload} />
      <ReportViewer report={viewing && { labName: viewing.name, date: viewing.date, fileUrl: viewing.receiptUrl, fileName: viewing.receiptName }} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Delete this expense?"
        message={removeTarget ? `${removeTarget.name} · ${eur(removeTarget.amount)} will be removed from the records and the profit figures.` : ''}
        confirmLabel="Delete"
        loading={removing}
        onConfirm={remove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
}