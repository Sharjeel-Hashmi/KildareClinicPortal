import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus } from 'react-icons/pi';
import { labsApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField } from '../ui/Field.jsx';
import { Spinner, ErrorState, EmptyState } from '../ui/States.jsx';

export default function ManageLabs() {
  const { data, loading, error, reload } = useFetch(() => labsApi.list(), []);
  const labs = data?.labs || [];

  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [removing, setRemoving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await labsApi.create({ name: name.trim() });
      setName('');
      toast.success('Lab added');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const removeLab = async () => {
    setRemoving(true);
    try {
      await labsApi.remove(confirmId);
      toast.success('Lab removed');
      setConfirmId(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const target = labs.find((l) => l._id === confirmId);

  return (
    <Panel title="Manage Labs">
      <form onSubmit={add} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <TextField
          label="New lab name"
          placeholder="New lab name"
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" icon={PiPlus} loading={adding} disabled={!name.trim()}>
          Add Lab
        </Button>
      </form>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : labs.length === 0 ? (
        <EmptyState icon={PiPlus} title="No labs yet" message="Add the clinic's partner labs above." />
      ) : (
        <ul className="space-y-2.5">
          {labs.map((l) => (
            <li
              key={l._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5"
            >
              <span className="font-medium text-ink">{l.name}</span>
              <Button size="sm" variant="dangerGhost" onClick={() => setConfirmId(l._id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Remove this lab?"
        message={`This removes "${target?.name}" from the lab list. It will no longer appear when uploading a report.`}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={removeLab}
        onCancel={() => setConfirmId(null)}
      />
    </Panel>
  );
}