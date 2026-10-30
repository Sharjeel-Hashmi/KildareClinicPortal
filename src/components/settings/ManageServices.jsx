import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus, PiCalendarCheck } from 'react-icons/pi';
import { servicesApi, doctorsApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { isAdminLike } from '../../utils/roles.js';
import { TextField, CheckChoice } from '../ui/Field.jsx';
import { Spinner, ErrorState, EmptyState } from '../ui/States.jsx';

const blank = () => ({ name: '', price: '', durationMinutes: '', isBookable: false, description: '', doctors: [] });

export default function ManageServices() {
  const { user } = useAuth();
  const canRemove = isAdminLike(user); // a doctor with Settings access can add/edit but not remove
  const { data, loading, error, reload } = useFetch(() => servicesApi.list(), []);
  const doctorsFetch = useFetch(() => doctorsApi.list(), []);
  const services = data?.services || [];
  const doctors = doctorsFetch.data?.doctors || [];

  const [form, setForm] = useState(blank());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [removing, setRemoving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDoctor = (id, on) =>
    setForm((f) => ({ ...f, doctors: on ? [...f.doctors, id] : f.doctors.filter((d) => d !== id) }));

  const startEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name,
      price: String(s.price),
      durationMinutes: s.durationMinutes ? String(s.durationMinutes) : '',
      isBookable: Boolean(s.isBookable),
      description: s.description || '',
      doctors: (s.doctors || []).map((d) => String(d._id || d)),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const reset = () => {
    setEditingId(null);
    setForm(blank());
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : 0,
      isBookable: form.isBookable,
      description: form.description.trim(),
      doctors: form.isBookable ? form.doctors : [],
    };
    try {
      if (editingId) await servicesApi.update(editingId, payload);
      else await servicesApi.create(payload);
      toast.success(editingId ? 'Service updated' : 'Service added');
      reset();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeService = async () => {
    setRemoving(true);
    try {
      await servicesApi.remove(confirmId);
      toast.success('Service removed');
      setConfirmId(null);
      if (editingId === confirmId) reset();
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
      <form onSubmit={save} className="mb-5 space-y-4 rounded-lg border border-line bg-paper/50 p-4">
        <p className="text-sm font-semibold">{editingId ? 'Edit service' : 'Add a service'}</p>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem_9rem]">
          <TextField label="Service name" placeholder="e.g. Private GP Consultation — New visit" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <TextField label="Default price €" placeholder="0.00" type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <TextField label="Appointment length" placeholder="15" type="number" min="0" max="240" suffix="min" value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
        </div>
        <CheckChoice checked={form.isBookable} onChange={(v) => set('isBookable', v)}>
          Can be booked (dashboard and clinic website)
        </CheckChoice>
        {form.isBookable && (
          <>
            <TextField label="Short description (shown on the website)" maxLength={300} value={form.description} onChange={(e) => set('description', e.target.value)} />
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Doctors who offer this service</legend>
              {doctors.length === 0 ? (
                <p className="text-sm text-muted">No doctor accounts yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {doctors.map((d) => (
                    <CheckChoice key={d.id} checked={form.doctors.includes(String(d.id))} onChange={(on) => toggleDoctor(String(d.id), on)}>
                      {d.name}
                    </CheckChoice>
                  ))}
                </div>
              )}
            </fieldset>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" icon={editingId ? undefined : PiPlus} loading={saving} disabled={!form.name.trim() || !form.price.trim()}>
            {editingId ? 'Save service' : 'Add Service'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={reset}>
              Cancel edit
            </Button>
          )}
        </div>
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
            <li key={s._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5">
              <div className="min-w-0">
                <span className="font-medium text-ink">{s.name}</span>
                {s.isBookable && (
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                    <Badge tone="ok" icon={PiCalendarCheck}>
                      Bookable · {s.durationMinutes} min
                    </Badge>
                    {(s.doctors || []).map((d) => d.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] tabular-nums text-muted">€{s.price.toFixed(2)}</span>
                <Button size="sm" variant="secondary" onClick={() => startEdit(s)}>
                  Edit
                </Button>
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
        message={`This removes "${target?.name}" from the service list. It will no longer appear when creating an invoice or booking.`}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={removeService}
        onCancel={() => setConfirmId(null)}
      />
    </Panel>
  );
}
