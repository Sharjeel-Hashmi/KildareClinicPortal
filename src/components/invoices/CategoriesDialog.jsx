import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PiTrash, PiPlus, PiX } from 'react-icons/pi';
import { expenseCategoriesApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';

const input =
  'h-10 rounded-lg border border-line-strong bg-white px-3 text-[15px] focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/30';

// Manage the expense types (Rent, Electricity ...) and the amount each one usually costs.
export default function CategoriesDialog({ open, categories, onClose, onChanged }) {
  const ref = useRef(null);
  const [rows, setRows] = useState([]);
  const [fresh, setFresh] = useState({ name: '', defaultAmount: '' });
  const [busy, setBusy] = useState(null);
  const [removeId, setRemoveId] = useState(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) setRows(categories.map((c) => ({ ...c, defaultAmount: String(c.defaultAmount ?? 0) })));
  }, [open, categories]);

  const setRow = (id, patch) => setRows((r) => r.map((x) => (x._id === id ? { ...x, ...patch } : x)));

  const saveRow = async (row) => {
    setBusy(row._id);
    try {
      await expenseCategoriesApi.update(row._id, { name: row.name, defaultAmount: row.defaultAmount });
      toast.success('Category saved');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!fresh.name.trim()) return;
    setBusy('new');
    try {
      await expenseCategoriesApi.create({ name: fresh.name, defaultAmount: fresh.defaultAmount });
      setFresh({ name: '', defaultAmount: '' });
      toast.success('Category added');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy(removeId);
    try {
      await expenseCategoriesApi.remove(removeId);
      toast.success('Category removed');
      setRemoveId(null);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const target = rows.find((r) => r._id === removeId);

  return (
    <>
      <dialog
        ref={ref}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        onClick={(e) => e.target === ref.current && onClose()}
        aria-labelledby="cat-title"
        className="m-auto max-h-[90vh] w-[min(94vw,36rem)] overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/55 print:hidden"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="cat-title" className="text-lg font-semibold">
            Expense categories
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg hover:bg-paper">
            <PiX size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-paper/50 p-3">
            <label className="min-w-40 flex-1 text-sm font-medium">
              New category
              <input className={`${input} mt-1 w-full`} placeholder="e.g. Clinic Expenses" value={fresh.name} maxLength={80} onChange={(e) => setFresh((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="w-32 text-sm font-medium">
              Usual amount €
              <input className={`${input} mt-1 w-full`} type="number" min="0" step="0.01" placeholder="0.00" value={fresh.defaultAmount} onChange={(e) => setFresh((f) => ({ ...f, defaultAmount: e.target.value }))} />
            </label>
            <Button type="submit" icon={PiPlus} loading={busy === 'new'} disabled={!fresh.name.trim()}>
              Add
            </Button>
          </form>

          {rows.length === 0 ? (
            <p className="text-center text-sm text-muted">No categories yet. Add the first one above.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2.5">
                  <input aria-label="Category name" className={`${input} min-w-36 flex-1`} value={r.name} maxLength={80} onChange={(e) => setRow(r._id, { name: e.target.value })} />
                  <input aria-label={`Usual amount for ${r.name}`} className={`${input} w-28`} type="number" min="0" step="0.01" value={r.defaultAmount} onChange={(e) => setRow(r._id, { defaultAmount: e.target.value })} />
                  <Button size="sm" variant="secondary" loading={busy === r._id} onClick={() => saveRow(r)}>
                    Save
                  </Button>
                  <button type="button" aria-label={`Remove ${r.name}`} onClick={() => setRemoveId(r._id)} className="grid size-9 place-items-center rounded-lg text-danger hover:bg-danger-50">
                    <PiTrash size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[13px] text-muted">The usual amount fills in automatically when you pick the category for a new expense.</p>
        </div>
      </dialog>

      <ConfirmDialog
        open={Boolean(removeId)}
        title="Remove this category?"
        message={`"${target?.name || ''}" will no longer be offered for new expenses. Expenses already recorded under it keep their name.`}
        confirmLabel="Remove"
        loading={busy === removeId}
        onConfirm={remove}
        onCancel={() => setRemoveId(null)}
      />
    </>
  );
}