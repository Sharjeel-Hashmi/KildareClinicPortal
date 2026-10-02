import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { medicineCategoriesApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField } from '../ui/Field.jsx';
import { UNCATEGORISED_LABEL, categoryKey } from '../prescription/MedicineSelector.jsx';

// Add / remove medicine categories. "Uncategorised" is built in: always present, cannot be removed.
export default function MedicineCategories({ categories, medicines, canRemove, onChanged }) {
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [removing, setRemoving] = useState(false);

  const countFor = (key) => medicines.filter((m) => categoryKey(m) === key).length;
  const target = categories.find((c) => c._id === confirmId);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await medicineCategoriesApi.create({ name: name.trim() });
      setName('');
      toast.success('Category added');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await medicineCategoriesApi.remove(confirmId);
      toast.success('Category removed');
      setConfirmId(null);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-line p-4">
      <h3 className="text-sm font-semibold text-ink">Categories</h3>
      <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <TextField
          label="New category"
          placeholder="e.g. Antibiotic, Painkiller, Thyroid"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" icon={PiPlus} loading={adding} disabled={!name.trim()}>
          Add category
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c._id}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 py-1 pl-3 pr-1.5 text-sm font-medium text-ink"
          >
            {c.name} <span className="text-muted">({countFor(c._id)})</span>
            {canRemove && (
              <button
                type="button"
                onClick={() => setConfirmId(c._id)}
                aria-label={`Remove category ${c.name}`}
                className="grid size-5 place-items-center rounded-full text-muted hover:bg-danger-50 hover:text-danger"
              >
                <PiTrash size={13} aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
        <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-sm font-medium text-muted">
          {UNCATEGORISED_LABEL} ({countFor('uncategorised')})
        </span>
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Remove this category?"
        message={`"${target?.name}" will be removed. Its ${countFor(confirmId)} medicine(s) are not deleted — they move to "${UNCATEGORISED_LABEL}".`}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}