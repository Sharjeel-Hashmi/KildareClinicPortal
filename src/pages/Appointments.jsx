import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PiCalendarPlus,
  PiCalendarCheck,
  PiCheckCircle,
  PiProhibit,
  PiUserCheck,
  PiUserPlus,
  PiLinkSimple,
} from 'react-icons/pi';
import { appointmentsApi, doctorsApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { isAdminLike } from '../utils/roles.js';
import { addDays, formatDayLong, SOURCE_LABEL, STATUS_META, time12, todayDublin } from '../utils/booking.js';
import { fullName } from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { TextField, SelectField } from '../components/ui/Field.jsx';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States.jsx';
import PatientPicker from '../components/appointments/PatientPicker.jsx';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'month', label: 'Next 30 days' },
  { id: 'custom', label: 'Pick dates' },
];

const STATUS_FILTERS = [
  { id: 'active', label: 'Active', statuses: 'confirmed,pending_payment' },
  { id: 'all', label: 'All', statuses: '' },
  { id: 'completed', label: 'Completed', statuses: 'completed' },
  { id: 'cancelled', label: 'Cancelled / no-show', statuses: 'cancelled,no_show' },
];

const chip = (on) =>
  `h-10 rounded-lg border px-3.5 text-sm font-semibold transition-colors ${
    on ? 'border-gold-600 bg-gold-500 text-ink' : 'border-line-strong bg-white text-ink hover:bg-paper'
  }`;

export default function Appointments() {
  const { user } = useAuth();
  const admin = isAdminLike(user);
  const [searchParams] = useSearchParams();
  const today = todayDublin();
  const dateParam = searchParams.get('date'); // set when a notification is opened

  const [range, setRange] = useState(dateParam ? 'custom' : 'week');
  const [from, setFrom] = useState(dateParam || today);
  const [to, setTo] = useState(dateParam || addDays(today, 6));
  const [statusId, setStatusId] = useState('active');
  const [doctorId, setDoctorId] = useState('');

  const bounds = useMemo(() => {
    if (range === 'today') return { from: today, to: today };
    if (range === 'week') return { from: today, to: addDays(today, 6) };
    if (range === 'month') return { from: today, to: addDays(today, 29) };
    return { from, to: to >= from ? to : from };
  }, [range, from, to, today]);

  const status = STATUS_FILTERS.find((s) => s.id === statusId)?.statuses;
  const { version } = useNotifications(); // new bookings arriving refresh the list

  const doctors = useFetch(() => (admin ? doctorsApi.list() : Promise.resolve(null)), [admin]);
  const { data, loading, error, reload } = useFetch(
    () =>
      appointmentsApi.list({
        from: bounds.from,
        to: bounds.to,
        status: status || undefined,
        doctorId: admin && doctorId ? doctorId : undefined,
      }),
    [bounds.from, bounds.to, status, doctorId, admin, version],
    { keepPrevious: true }
  );

  const days = useMemo(() => {
    const map = new Map();
    (data?.appointments || []).forEach((a) => {
      const key = a.startLocal.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    return [...map.entries()];
  }, [data]);

  // ---- actions ----
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [linkTarget, setLinkTarget] = useState(null);

  const setStatus = async (a, next, reason) => {
    setBusyId(a._id);
    try {
      const res = await appointmentsApi.setStatus(a._id, next, reason);
      toast.success(
        next === 'cancelled'
          ? res.patientNotified
            ? 'Appointment cancelled and the patient was emailed'
            : 'Appointment cancelled'
          : next === 'completed'
            ? 'Marked as completed'
            : 'Marked as no-show'
      );
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmCancel = async () => {
    const target = cancelTarget;
    await setStatus(target, 'cancelled');
    setCancelTarget(null);
  };

  const link = async (a, patient) => {
    setBusyId(a._id);
    try {
      await appointmentsApi.linkPatient(a._id, patient?._id || null);
      toast.success(patient ? 'Linked to the registered patient' : 'Link removed');
      setLinkTarget(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const total = data?.appointments?.length ?? 0;

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle={data ? `${total} in this period` : 'Your diary'}
        actions={
          <>
            <Button variant="secondary" to="/availability" icon={PiCalendarCheck}>
              {admin ? 'Availability' : 'My availability'}
            </Button>
            <Button to="/appointments/new" icon={PiCalendarPlus}>
              New appointment
            </Button>
          </>
        }
      />

      <div className="mb-5 space-y-3 rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button key={r.id} type="button" onClick={() => setRange(r.id)} aria-pressed={range === r.id} className={chip(range === r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="grid gap-4 sm:max-w-md sm:grid-cols-2">
            <TextField id="from" label="From" type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
            <TextField id="to" label="To" type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
            {STATUS_FILTERS.map((s) => (
              <button key={s.id} type="button" onClick={() => setStatusId(s.id)} aria-pressed={statusId === s.id} className={chip(statusId === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          {admin && (doctors.data?.doctors || []).length > 0 && (
            <SelectField
              id="doctor-filter"
              label="Doctor"
              className="min-w-52"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">All doctors</option>
              {doctors.data.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </SelectField>
          )}
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <SkeletonRows />
        </div>
      ) : days.length === 0 ? (
        <div className="rounded-xl border border-line bg-white">
          <EmptyState
            icon={PiCalendarCheck}
            title="No appointments in this period"
            message="Change the dates or filters, or book a new appointment."
            action={
              <Button to="/appointments/new" icon={PiCalendarPlus}>
                New appointment
              </Button>
            }
          />
        </div>
      ) : (
        <div className={`space-y-6 ${loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}`}>
          {days.map(([date, list]) => (
            <section key={date} aria-label={formatDayLong(date)}>
              <h2 className="mb-2 text-[15px] font-bold text-ink">
                {formatDayLong(date)}
                {date === today && <span className="ml-2 text-gold-700">· Today</span>}
              </h2>
              <ul className="space-y-2.5">
                {list.map((a) => {
                  const meta = STATUS_META[a.status] || STATUS_META.confirmed;
                  const active = a.status === 'confirmed' || a.status === 'pending_payment';
                  const busy = busyId === a._id;
                  return (
                    <li key={a._id} className="rounded-xl border border-line bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold tabular-nums">
                            {time12(a.startLocal.time)} – {time12(a.endLocal.time)}
                          </p>
                          <p className="mt-0.5 text-[16px] font-semibold">
                            {a.patientRef ? (
                              <Link to={`/patients/${a.patientRef._id}`} className="underline-offset-2 hover:underline">
                                {fullName(a.patientRef) || a.patient.fullName}
                              </Link>
                            ) : (
                              a.patient.fullName
                            )}
                          </p>
                          <p className="text-sm text-muted">
                            {a.serviceName}
                            {admin && a.doctor?.name ? ` · ${a.doctor.name}` : ''}
                          </p>
                          <p className="text-sm text-muted">
                            {a.patient.phone}
                            {a.patient.email ? ` · ${a.patient.email}` : ''}
                          </p>
                          {a.patient.reason && <p className="mt-1 text-sm">“{a.patient.reason}”</p>}
                          {a.status === 'cancelled' && a.cancelReason && (
                            <p className="mt-1 text-sm text-muted">Reason: {a.cancelReason}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {a.patientRef ? (
                            <Badge tone="gold" icon={PiUserCheck}>
                              {a.patientRef.patientNo}
                            </Badge>
                          ) : (
                            <Badge>{a.patient.isNewPatient ? 'New patient' : 'Not linked'}</Badge>
                          )}
                          <Badge>{SOURCE_LABEL[a.source] || a.source}</Badge>
                          <span className="w-full text-right text-xs text-muted">Ref {a.reference}</span>
                        </div>
                      </div>

                      {(active || a.status === 'completed' || a.status === 'no_show') && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                          {active && (
                            <>
                              <Button size="sm" variant="secondary" icon={PiCheckCircle} disabled={busy} onClick={() => setStatus(a, 'completed')}>
                                Completed
                              </Button>
                              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setStatus(a, 'no_show')}>
                                No-show
                              </Button>
                              <Button size="sm" variant="dangerGhost" icon={PiProhibit} disabled={busy} onClick={() => setCancelTarget(a)}>
                                Cancel
                              </Button>
                            </>
                          )}
                          {(a.status === 'completed' || a.status === 'no_show') && (
                            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setStatus(a, 'confirmed')}>
                              Reopen
                            </Button>
                          )}
                          {!a.patientRef && a.status !== 'cancelled' && (
                            <>
                              <Button size="sm" variant="ghost" icon={PiLinkSimple} onClick={() => setLinkTarget(linkTarget === a._id ? null : a._id)}>
                                Link to patient
                              </Button>
                              <Button size="sm" variant="ghost" icon={PiUserPlus} to="/patients/new">
                                Register patient
                              </Button>
                            </>
                          )}
                          {a.patientRef && a.status !== 'cancelled' && (
                            <Button size="sm" variant="ghost" disabled={busy} onClick={() => link(a, null)}>
                              Unlink patient
                            </Button>
                          )}
                        </div>
                      )}

                      {linkTarget === a._id && !a.patientRef && (
                        <div className="mt-3 rounded-lg border border-line bg-paper/60 p-3">
                          <PatientPicker id={`link-${a._id}`} value={null} onChange={(p) => p && link(a, p)} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this appointment?"
        message={
          cancelTarget
            ? `${cancelTarget.patient.fullName} · ${time12(cancelTarget.startLocal.time)}. The time becomes free again${
                cancelTarget.patient.email ? ' and the patient is emailed.' : '.'
              }`
            : ''
        }
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        loading={busyId === cancelTarget?._id}
        onConfirm={confirmCancel}
        onCancel={() => {
          setCancelTarget(null);
        }}
      />
    </>
  );
}
