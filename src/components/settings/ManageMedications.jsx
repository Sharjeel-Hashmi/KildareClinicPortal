import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { medicinesApi, medicineCategoriesApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { isAdminLike } from '../../utils/roles.js';
import { TextField, SelectField } from '../ui/Field.jsx';
import MedicineCategories from './MedicineCategories.jsx';
import { UNCATEGORISED, UNCATEGORISED_LABEL, categoryKey } from '../prescription/MedicineSelector.jsx';
import { Spinner, ErrorState, EmptyState } from '../ui/States.jsx';

export default function ManageMedications() {
  const { user } = useAuth();
  const canRemove = isAdminLike(user); // a doctor with Settings access can add/edit but not remove
  const { data, loading, error, reload } = useFetch(() => medicinesApi.list(), []);
  const medicines = data?.medicines || [];
  const categoriesQ = useFetch(() => medicineCategoriesApi.list(), []);
  const categories = categoriesQ.data?.categories || [];
  const categoryName = (key) => categories.find((c) => c._id === key)?.name || UNCATEGORISED_LABEL;
  const reloadAll = () => {
    reload();
    categoriesQ.reload();
  };

  const [name, setName] = useState('');
  const [dosagesText, setDosagesText] = useState('');
  const [category, setCategory] = useState(UNCATEGORISED);
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [removing, setRemoving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const dosages = dosagesText
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    setAdding(true);
    try {
      await medicinesApi.create({ name: name.trim(), dosages, category });
      setName('');
      setDosagesText('');
      toast.success('Medicine added');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const removeDosage = async (medicine, dosage) => {
    try {
      await medicinesApi.update(medicine._id, { dosages: medicine.dosages.filter((d) => d !== dosage) });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const changeCategory = async (medicine, value) => {
    try {
      await medicinesApi.update(medicine._id, { category: value });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const removeMedicine = async () => {
    setRemoving(true);
    try {
      await medicinesApi.remove(confirmId);
      toast.success('Medicine removed');
      setConfirmId(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const target = medicines.find((m) => m._id === confirmId);
  const visible = filter === 'all' ? medicines : medicines.filter((m) => categoryKey(m) === filter);
  const categoryOptions = (
    <>
      {categories.map((c) => (
        <option key={c._id} value={c._id}>
          {c.name}
        </option>
      ))}
      <option value={UNCATEGORISED}>{UNCATEGORISED_LABEL}</option>
    </>
  );

  return (
    <Panel title="Manage Medications">
      <MedicineCategories
        categories={categories}
        medicines={medicines}
        canRemove={canRemove}
        onChanged={reloadAll}
      />

      <form onSubmit={add} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <TextField
          label="Medicine name"
          placeholder="Medicine name"
          hint="Add a medicine name and its dosage options (comma-separated), e.g. Eltroxin — 25mcg, 50mcg, 75mcg"
          className="sm:col-span-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <SelectField
          label="Category"
          className="sm:col-span-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categoryOptions}
        </SelectField>
        <TextField
          label="Dosages"
          placeholder="Dosages, comma-separated"
          className="sm:col-span-2"
          value={dosagesText}
          onChange={(e) => setDosagesText(e.target.value)}
        />
        <Button type="submit" icon={PiPlus} loading={adding} disabled={!name.trim()}>
          Add
        </Button>
      </form>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : medicines.length === 0 ? (
        <EmptyState icon={PiPlus} title="No medicines yet" message="Add the clinic's medicine list above." />
      ) : (
        <>
        <SelectField
          label="Show category"
          className="mb-4 max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categoryOptions}
        </SelectField>
        <ul className="space-y-3">
          {visible.map((m) => (
            <li key={m._id} className="rounded-lg border border-line px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{m.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{categoryName(m.category)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Category for ${m.name}`}
                    value={categoryKey(m)}
                    onChange={(e) => changeCategory(m, e.target.value)}
                    className="h-9 rounded-lg border border-line-strong bg-white px-2 text-sm"
                  >
                    {categoryOptions}
                  </select>
                  {canRemove && (
                    <Button size="sm" variant="dangerGhost" onClick={() => setConfirmId(m._id)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              {m.dosages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.dosages.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 py-1 pl-3 pr-1.5 text-sm font-medium text-ink"
                    >
                      {d}
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => removeDosage(m, d)}
                          aria-label={`Remove dosage ${d}`}
                          className="grid size-5 place-items-center rounded-full text-muted hover:bg-danger-50 hover:text-danger"
                        >
                          <PiTrash size={13} aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Remove this medicine?"
        message={`This removes "${target?.name}" from the medicine list. It will no longer appear when writing a prescription.`}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={removeMedicine}
        onCancel={() => setConfirmId(null)}
      />
    </Panel>
  );
}