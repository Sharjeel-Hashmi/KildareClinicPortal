import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PiPaperclip, PiPlus, PiX, PiSpinnerGap } from 'react-icons/pi';
import { expensesApi, expenseCategoriesApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import { uploadFile } from '../../utils/upload.js';
import { todayDublin } from '../../utils/booking.js';
import Button from '../ui/Button.jsx';
import { TextField, TextAreaField, SelectField } from '../ui/Field.jsx';

const blank = () => ({ category: '', name: '', detail: '', amount: '', date: todayDublin(), receiptUrl: '', receiptName: '' });

// Add or edit one expense. `expense` = null → new. The category list can be extended on the spot.
export default function ExpenseDialog({ open, expense, categories, onClose, onSaved, onCategoriesChanged }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState(blank());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCat, setNewCat] = useState(null); // { name, defaultAmount } while the "new category" row is open
  const [catBusy, setCatBusy] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setNewCat(null);
    setForm(
      expense
        ? {
            category: expense.category || '',
            name: expense.name,
            detail: expense.detail || '',
            amount: String(expense.amount),
            date: expense.dateLocal,
            receiptUrl: expense.receiptUrl || '',
            receiptName: expense.receiptName || '',
          }
        : blank()
    );
  }, [open, expense]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  // choosing a category fills in its usual amount when the amount is still empty
  const pickCategory = (id) => {
    const cat = categories.find((c) => c._id === id);
    setForm((f) => ({ ...f, category: id, amount: !f.amount && cat?.defaultAmount ? String(cat.defaultAmount) : f.amount }));
    setErrors((e) => ({ ...e, category: undefined }));
  };

  const addCategory = async () => {
    if (!newCat?.name.trim()) return;
    setCatBusy(true);
    try {
      const { category } = await expenseCategoriesApi.create({ name: newCat.name, defaultAmount: newCat.defaultAmount });
      await onCategoriesChanged();
      setNewCat(null);
      setForm((f) => ({ ...f, category: category._id, amount: !f.amount && category.defaultAmount ? String(category.defaultAmount) : f.amount }));
      toast.success('Category added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCatBusy(false);
    }
  };

  const onFile = async (file) => {
    if (!file) return;
    if (!/^(image\/(png|jpeg|webp)|application\/pdf)$/.test(file.type)) {
      toast.error('Attach a PDF, PNG, JPG or WebP file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('The file is too large (10 MB maximum)');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file, 'expense');
      setForm((f) => ({ ...f, receiptUrl: url, receiptName: file.name }));
    } catch (err) {
      toast.error(err?.response ? getErrorMessage(err) : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.category) errs.category = 'Choose a category';
    if (!form.name.trim()) errs.name = 'Enter the expense name';
    if (!(Number(form.amount) > 0)) errs.amount = 'Enter the amount';
    if (!form.date) errs.date = 'Choose the date';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const body = { ...form, amount: Number(form.amount) };
      if (expense) await expensesApi.update(expense._id, body);
      else await expensesApi.create(body);
      toast.success(expense ? 'Expense updated' : 'Expense added');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="exp-title"
      className="m-auto max-h-[92vh] w-[min(94vw,34rem)] overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/55 print:hidden"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="exp-title" className="text-lg font-semibold">
          {expense ? 'Edit expense' : 'Add expense'}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg hover:bg-paper">
          <PiX size={20} />
        </button>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4 p-6">
        <div>
          <SelectField id="exp-category" label="Category" required value={form.category} error={errors.category} onChange={(e) => pickCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {c.defaultAmount ? ` (€${c.defaultAmount})` : ''}
              </option>
            ))}
          </SelectField>
          {newCat ? (
            <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-paper/50 p-3">
              <TextField id="new-cat-name" label="New category" className="min-w-36 flex-1" maxLength={80} value={newCat.name} onChange={(e) => setNewCat((n) => ({ ...n, name: e.target.value }))} placeholder="e.g. Clinic Expenses" />
              <TextField id="new-cat-amount" label="Usual amount" className="w-32" type="number" min="0" step="0.01" suffix="€" value={newCat.defaultAmount} onChange={(e) => setNewCat((n) => ({ ...n, defaultAmount: e.target.value }))} />
              <Button size="sm" loading={catBusy} disabled={!newCat.name.trim()} onClick={addCategory}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNewCat(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setNewCat({ name: '', defaultAmount: '' })} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:underline">
              <PiPlus size={15} aria-hidden="true" /> New category
            </button>
          )}
        </div>

        <TextField id="exp-name" label="Expense name" required placeholder="e.g. Clinic Expenses" maxLength={150} value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} />
        <TextAreaField id="exp-detail" label="Detail (optional)" rows={2} maxLength={500} value={form.detail} onChange={(e) => set('detail', e.target.value)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="exp-amount" label="Amount" required type="number" min="0" step="0.01" suffix="€" placeholder="0.00" value={form.amount} error={errors.amount} onChange={(e) => set('amount', e.target.value)} />
          <TextField id="exp-date" label="Date" required type="date" value={form.date} error={errors.date} onChange={(e) => set('date', e.target.value)} />
        </div>

        <div>
          <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          {form.receiptUrl ? (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-paper/50 px-3 py-2 text-sm">
              <PiPaperclip size={17} className="shrink-0 text-gold-700" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{form.receiptName || 'Receipt attached'}</span>
              <button type="button" onClick={() => setForm((f) => ({ ...f, receiptUrl: '', receiptName: '' }))} className="font-semibold text-danger hover:underline">
                Remove
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 text-sm font-semibold text-gold-700 hover:underline disabled:opacity-60">
              {uploading ? <PiSpinnerGap size={17} className="animate-spin" aria-hidden="true" /> : <PiPaperclip size={17} aria-hidden="true" />}
              {uploading ? 'Uploading…' : 'Attach receipt (image / PDF)'}
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={uploading}>
            {expense ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}