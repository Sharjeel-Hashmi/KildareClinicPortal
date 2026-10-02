import { useMemo, useState } from 'react';
import { medicinesApi, medicineCategoriesApi } from '../../api/services.js';
import useFetch from '../../hooks/useFetch.js';
import Button from '../ui/Button.jsx';
import { SelectField } from '../ui/Field.jsx';

// Medicines with no category belong to the built-in "Uncategorised" group
export const UNCATEGORISED = 'uncategorised';
export const UNCATEGORISED_LABEL = 'Uncategorised';
export const categoryKey = (medicine) => medicine.category || UNCATEGORISED;

// Appends a line to a textarea value, on its own line
export const appendLine = (current = '', line) =>
  current && !current.endsWith('\n') ? `${current}\n${line}` : `${current}${line}`;

// Category → Medicine → Dosage → "Add to prescription"
// Shared by the Prescription form and the Consultation form (section 6).
export default function MedicineSelector({ onAdd }) {
  const medicinesQ = useFetch(() => medicinesApi.list(), []);
  const categoriesQ = useFetch(() => medicineCategoriesApi.list(), []);
  const medicines = medicinesQ.data?.medicines || [];
  const storedCategories = categoriesQ.data?.categories || [];

  const [category, setCategory] = useState('');
  const [medicineId, setMedicineId] = useState('');
  const [dosage, setDosage] = useState('');

  // Only offer categories that actually contain medicines
  const categories = useMemo(() => {
    const used = new Set(medicines.map(categoryKey));
    const list = storedCategories.filter((c) => used.has(c._id)).map((c) => ({ value: c._id, label: c.name }));
    if (used.has(UNCATEGORISED)) list.push({ value: UNCATEGORISED, label: UNCATEGORISED_LABEL });
    return list;
  }, [medicines, storedCategories]);

  const inCategory = category ? medicines.filter((m) => categoryKey(m) === category) : [];
  const selected = inCategory.find((m) => m._id === medicineId);

  const add = () => {
    if (!selected) return;
    onAdd(dosage ? `${selected.name} — ${dosage}` : selected.name);
    setMedicineId('');
    setDosage('');
  };

  if (medicinesQ.loading || categoriesQ.loading || medicines.length === 0) return null;

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-paper p-3.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
      <SelectField
        label="Category"
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setMedicineId('');
          setDosage('');
        }}
      >
        <option value="">Select category…</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Insert medicine"
        value={medicineId}
        disabled={!category}
        onChange={(e) => {
          setMedicineId(e.target.value);
          setDosage('');
        }}
      >
        <option value="">Select medicine…</option>
        {inCategory.map((m) => (
          <option key={m._id} value={m._id}>
            {m.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Dosage"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        disabled={!selected?.dosages?.length}
      >
        <option value="">Dosage…</option>
        {(selected?.dosages || []).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </SelectField>
      <Button type="button" variant="secondary" onClick={add} disabled={!selected}>
        Add to prescription
      </Button>
    </div>
  );
}