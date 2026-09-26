import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { medicinesApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField } from '../ui/Field.jsx';
import { Spinner, ErrorState, EmptyState } from '../ui/States.jsx';

export default function ManageMedications() {
  const { data, loading, error, reload } = useFetch(() => medicinesApi.list(), []);
  const medicines = data?.medicines || [];

  const [name, setName] = useState('');
  const [dosagesText, setDosagesText] = useState('');
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
      await medicinesApi.create({ name: name.trim(), dosages });
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

  return (
    <Panel title="Manage Medications">
      <form onSubmit={add} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <TextField
          label="Medicine name"
          placeholder="Medicine name"
          hint="Add a medicine name and its dosage options (comma-separated), e.g. Eltroxin — 25mcg, 50mcg, 75mcg"
          className="sm:col-span-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <ul className="space-y-3">
          {medicines.map((m) => (
            <li key={m._id} className="rounded-lg border border-line px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">{m.name}</p>
                <Button size="sm" variant="dangerGhost" onClick={() => setConfirmId(m._id)}>
                  Remove
                </Button>
              </div>
              {m.dosages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.dosages.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 py-1 pl-3 pr-1.5 text-sm font-medium text-ink"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => removeDosage(m, d)}
                        aria-label={`Remove dosage ${d}`}
                        className="grid size-5 place-items-center rounded-full text-muted hover:bg-danger-50 hover:text-danger"
                      >
                        <PiTrash size={13} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
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