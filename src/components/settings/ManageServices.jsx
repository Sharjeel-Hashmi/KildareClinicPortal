import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus } from 'react-icons/pi';
import { servicesApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { isAdminLike } from '../../utils/roles.js';
import { TextField } from '../ui/Field.jsx';
import { Spinner, ErrorState, EmptyState } from '../ui/States.jsx';

export default function ManageServices() {
  const { user } = useAuth();
  const canRemove = isAdminLike(user); // a doctor with Settings access can add/edit but not remove
  const { data, loading, error, reload } = useFetch(() => servicesApi.list(), []);
  const services = data?.services || [];

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [removing, setRemoving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;
    setAdding(true);
    try {
      await servicesApi.create({ name: name.trim(), price: Number(price) });
      setName('');
      setPrice('');
      toast.success('Service added');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const removeService = async () => {
    setRemoving(true);
    try {
      await servicesApi.remove(confirmId);
      toast.success('Service removed');
      setConfirmId(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const target = services.find((s) => s._id === confirmId);

  return (
    <Panel title="Manage Services">
      <form onSubmit={add} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <TextField
          label="Service name"
          placeholder="e.g. Private GP Consultation — New visit"
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Default price €"
          placeholder="0.00"
          type="number"
          step="0.01"
          min="0"
          className="sm:w-36"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Button type="submit" icon={PiPlus} loading={adding} disabled={!name.trim() || !price.trim()}>
          Add Service
        </Button>
      </form>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : services.length === 0 ? (
        <EmptyState icon={PiPlus} title="No services yet" message="Add the clinic's billable services above." />
      ) : (
        <ul className="space-y-2.5">
          {services.map((s) => (
            <li
              key={s._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5"
            >
              <span className="font-medium text-ink">{s.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[15px] tabular-nums text-muted">€{s.price.toFixed(2)}</span>
                {canRemove && (
                  <Button size="sm" variant="dangerGhost" onClick={() => setConfirmId(s._id)}>
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Remove this service?"
        message={`This removes "${target?.name}" from the service list. It will no longer appear when creating an invoice.`}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={removeService}
        onCancel={() => setConfirmId(null)}
      />
    </Panel>
  );
}