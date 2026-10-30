import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { availabilityApi, doctorsApi, servicesApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdminLike } from '../utils/roles.js';
import { DAY_NAMES, formatDay, nextRange, rangesProblem, servicesForDoctor, time12, todayDublin } from '../utils/booking.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import { Spinner, ErrorState, EmptyState } from '../components/ui/States.jsx';
import { TextField, SelectField } from '../components/ui/Field.jsx';
import BookingCalendar from '../components/appointments/BookingCalendar.jsx';

const SLOT_LENGTHS = [10, 15, 20, 30];
const BUFFERS = [0, 5, 10, 15];

const emptyDraft = () => ({
  slotLengthMinutes: 15,
  bufferMinutes: 0,
  weekly: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, enabled: false, ranges: [] })),
  exceptions: [],
  blocks: [],
});

const toDraft = (a) => ({
  slotLengthMinutes: a.slotLengthMinutes || 15,
  bufferMinutes: a.bufferMinutes || 0,
  weekly: [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const d = (a.weekly || []).find((x) => x.day === day);
    return { day, enabled: Boolean(d?.enabled), ranges: (d?.ranges || []).map((r) => ({ start: r.start, end: r.end })) };
  }),
  exceptions: (a.exceptions || []).map((e) => ({
    date: e.date,
    type: e.type,
    ranges: (e.ranges || []).map((r) => ({ start: r.start, end: r.end })),
    note: e.note || '',
  })),
  blocks: (a.blocks || []).map((b) => ({ date: b.date, start: b.start, end: b.end, note: b.note || '' })),
});

const timeInput =
  'h-10 w-28 rounded-lg border border-line-strong bg-white px-2.5 text-[15px] focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/30';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-gold-500 justify-end' : 'bg-line-strong justify-start'}`}
    >
      <span className="size-5 rounded-full bg-white shadow" />
    </button>
  );
}

function RangesEditor({ ranges, onChange, label }) {
  const update = (i, key, value) => onChange(ranges.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  return (
    <div className="space-y-2">
      {ranges.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input type="time" step="300" className={timeInput} value={r.start} onChange={(e) => update(i, 'start', e.target.value)} aria-label={`${label} start time ${i + 1}`} />
          <span className="text-sm text-muted">to</span>
          <input type="time" step="300" className={timeInput} value={r.end} onChange={(e) => update(i, 'end', e.target.value)} aria-label={`${label} end time ${i + 1}`} />
          <button
            type="button"
            onClick={() => onChange(ranges.filter((_, idx) => idx !== i))}
            aria-label={`Remove ${label} time range ${i + 1}`}
            className="grid size-10 place-items-center rounded-lg text-danger hover:bg-danger-50"
          >
            <PiTrash size={18} />
          </button>
        </div>
      ))}
      <Button size="sm" variant="secondary" icon={PiPlus} onClick={() => onChange([...ranges, nextRange(ranges)])}>
        Add hours
      </Button>
    </div>
  );
}

// /availability — a doctor manages their own weekly hours, leave and blocked times, and sees the slots patients
// would see. Admin / Super Admin can pick any doctor.
export default function Availability() {
  const { user } = useAuth();
  const admin = isAdminLike(user);
  const today = todayDublin();

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(admin ? '' : String(user.id));
  const [draft, setDraft] = useState(emptyDraft());
  const [saved, setSaved] = useState(JSON.stringify(emptyDraft()));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [ex, setEx] = useState({ date: '', type: 'off', ranges: [{ start: '09:00', end: '13:00' }], note: '' });
  const [exError, setExError] = useState('');
  const [bl, setBl] = useState({ date: '', start: '11:00', end: '12:00', note: '' });
  const [blError, setBlError] = useState('');

  const [services, setServices] = useState([]);
  const [previewService, setPreviewService] = useState('');
  const [previewDate, setPreviewDate] = useState(today);
  const [slots, setSlots] = useState(null);
  const [slotsError, setSlotsError] = useState('');

  const dirty = JSON.stringify(draft) !== saved;

  useEffect(() => {
    if (!admin) return;
    doctorsApi
      .list()
      .then((d) => {
        const list = d.doctors || [];
        setDoctors(list);
        setDoctorId(String(list[0]?.id || ''));
        if (!list.length) setLoading(false);
      })
      .catch((e) => {
        setLoadError(getErrorMessage(e));
        setLoading(false);
      });
  }, [admin]);

  useEffect(() => {
    if (!doctorId) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    Promise.all([availabilityApi.get(doctorId), servicesApi.list()])
      .then(([a, sv]) => {
        if (cancelled) return;
        const d = toDraft(a.availability);
        setDraft(d);
        setSaved(JSON.stringify(d));
        setServices(servicesForDoctor(sv.services || [], doctorId));
        setPreviewService('');
        setSlots(null);
      })
      .catch((e) => !cancelled && setLoadError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || !previewDate || loading) return undefined;
    let cancelled = false;
    setSlotsError('');
    availabilityApi
      .slots(doctorId, { date: previewDate, serviceId: previewService || undefined })
      .then((d) => !cancelled && setSlots(d))
      .catch((e) => {
        if (cancelled) return;
        setSlots(null);
        setSlotsError(getErrorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, previewDate, previewService, refreshKey, loading]);

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const dayErrors = useMemo(() => {
    const out = {};
    draft.weekly.forEach((d) => {
      if (d.enabled && d.ranges.length === 0) out[d.day] = 'Add your hours, or switch this day off';
      else {
        const p = rangesProblem(d.ranges);
        if (p) out[d.day] = p;
      }
    });
    return out;
  }, [draft.weekly]);

  const setDay = (day, patch) =>
    setDraft((d) => ({ ...d, weekly: d.weekly.map((x) => (x.day === day ? { ...x, ...patch } : x)) }));
  const toggleDay = (day, enabled) => {
    const current = draft.weekly.find((x) => x.day === day);
    setDay(day, { enabled, ranges: enabled && current.ranges.length === 0 ? [{ start: '09:00', end: '13:00' }] : current.ranges });
  };
  const copyMondayToWeekdays = () => {
    const monday = draft.weekly.find((x) => x.day === 1);
    setDraft((d) => ({
      ...d,
      weekly: d.weekly.map((x) =>
        x.day >= 2 && x.day <= 5 ? { ...x, enabled: monday.enabled, ranges: monday.ranges.map((r) => ({ ...r })) } : x
      ),
    }));
  };

  const addException = () => {
    setExError('');
    if (!ex.date) return setExError('Choose a date');
    if (ex.date < today) return setExError('Choose today or a future date');
    if (draft.exceptions.some((e) => e.date === ex.date)) return setExError('There is already an exception on that date - remove it first');
    if (ex.type === 'custom') {
      if (ex.ranges.length === 0) return setExError('Add the hours for this day');
      const p = rangesProblem(ex.ranges);
      if (p) return setExError(p);
    }
    setDraft((d) => ({
      ...d,
      exceptions: [...d.exceptions, { date: ex.date, type: ex.type, ranges: ex.type === 'custom' ? ex.ranges : [], note: ex.note.trim() }].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    }));
    setEx({ date: '', type: ex.type, ranges: [{ start: '09:00', end: '13:00' }], note: '' });
    return undefined;
  };

  const addBlock = () => {
    setBlError('');
    if (!bl.date) return setBlError('Choose a date');
    if (bl.date < today) return setBlError('Choose today or a future date');
    const p = rangesProblem([{ start: bl.start, end: bl.end }]);
    if (p) return setBlError(p);
    setDraft((d) => ({
      ...d,
      blocks: [...d.blocks, { date: bl.date, start: bl.start, end: bl.end, note: bl.note.trim() }].sort(
        (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)
      ),
    }));
    setBl({ date: '', start: bl.start, end: bl.end, note: '' });
    return undefined;
  };

  const save = async () => {
    if (Object.keys(dayErrors).length) {
      toast.error('Please fix the highlighted days before saving');
      return;
    }
    setSaving(true);
    try {
      const { availability } = await availabilityApi.save(doctorId, draft);
      const d = toDraft(availability);
      setDraft(d);
      setSaved(JSON.stringify(d));
      setRefreshKey((k) => k + 1);
      toast.success('Availability saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const markers = useMemo(() => {
    const m = {};
    draft.blocks.forEach((b) => {
      m[b.date] = 'block';
    });
    draft.exceptions.forEach((e) => {
      m[e.date] = e.type === 'off' ? 'off' : 'custom';
    });
    return m;
  }, [draft.exceptions, draft.blocks]);

  const upcomingExceptions = draft.exceptions.filter((e) => e.date >= today);
  const upcomingBlocks = draft.blocks.filter((b) => b.date >= today);
  const doctorName = doctors.find((d) => String(d.id) === doctorId)?.name;

  if (admin && !loading && !doctors.length && !loadError) {
    return (
      <>
        <PageHeader title="Availability" />
        <div className="rounded-xl border border-line bg-white">
          <EmptyState title="No doctors yet" message="Add a doctor from the Doctors page first." action={<Button to="/doctors/new">Add doctor</Button>} />
        </div>
      </>
    );
  }

  const rowCls = 'flex flex-wrap items-center gap-3 border-t border-line px-3.5 py-2.5 first:border-t-0';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ to: '/appointments', label: 'Appointments' }}
        title={admin ? 'Availability' : 'My availability'}
        subtitle={`Set the hours patients can book with ${admin ? doctorName || 'a doctor' : 'you'}. Times are Irish time.`}
      />

      {admin && (
        <div className="mb-5 max-w-sm">
          <SelectField
            id="avail-doctor"
            label="Doctor"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={dirty}
            hint={dirty ? 'Save your changes before switching doctor' : undefined}
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      {loadError ? (
        <ErrorState message={loadError} />
      ) : loading ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          <Panel
            step={1}
            title="Weekly hours"
            action={
              <Button size="sm" variant="secondary" onClick={copyMondayToWeekdays}>
                Copy Monday to Tue–Fri
              </Button>
            }
          >
            <div className="divide-y divide-line">
              {draft.weekly.map((d) => (
                <div key={d.day} className="grid gap-3 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <div className="flex min-h-10 items-center gap-3">
                    <Toggle checked={d.enabled} onChange={(v) => toggleDay(d.day, v)} label={`${DAY_NAMES[d.day]} available`} />
                    <span className={`font-semibold ${d.enabled ? '' : 'text-muted'}`}>{DAY_NAMES[d.day]}</span>
                  </div>
                  <div>
                    {d.enabled ? (
                      <RangesEditor ranges={d.ranges} onChange={(ranges) => setDay(d.day, { ranges })} label={DAY_NAMES[d.day]} />
                    ) : (
                      <p className="flex min-h-10 items-center text-sm text-muted">Not available</p>
                    )}
                    {dayErrors[d.day] && (
                      <p className="mt-1.5 text-[13px] font-medium text-danger" role="alert">
                        {dayErrors[d.day]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel step={2} title="Appointment slots">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                id="slot-length"
                label="Slot length"
                value={draft.slotLengthMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, slotLengthMinutes: Number(e.target.value) }))}
                hint="Patients can start an appointment every this many minutes"
              >
                {SLOT_LENGTHS.map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="buffer"
                label="Break between appointments"
                value={draft.bufferMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, bufferMinutes: Number(e.target.value) }))}
                hint="Optional gap kept free after each appointment"
              >
                {BUFFERS.map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'No break' : `${m} minutes`}
                  </option>
                ))}
              </SelectField>
            </div>
          </Panel>

          <Panel step={3} title="Leave, holidays and extra days">
            <p className="mb-4 text-sm text-muted">These override the weekly hours for one date.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField id="ex-date" label="Date" type="date" min={today} value={ex.date} onChange={(e) => setEx((x) => ({ ...x, date: e.target.value }))} />
              <SelectField id="ex-type" label="What happens" value={ex.type} onChange={(e) => setEx((x) => ({ ...x, type: e.target.value }))}>
                <option value="off">Unavailable all day</option>
                <option value="custom">Custom hours (extra day)</option>
              </SelectField>
              <TextField id="ex-note" label="Note (optional)" maxLength={200} value={ex.note} onChange={(e) => setEx((x) => ({ ...x, note: e.target.value }))} placeholder="e.g. Annual leave" />
            </div>
            {ex.type === 'custom' && (
              <div className="mt-4">
                <p className="mb-1.5 text-sm font-medium">Hours that day</p>
                <RangesEditor ranges={ex.ranges} onChange={(ranges) => setEx((x) => ({ ...x, ranges }))} label="Extra day" />
              </div>
            )}
            {exError && (
              <p className="mt-3 text-[13px] font-medium text-danger" role="alert">
                {exError}
              </p>
            )}
            <Button className="mt-4" icon={PiPlus} onClick={addException}>
              Add
            </Button>

            {upcomingExceptions.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-lg border border-line">
                {upcomingExceptions.map((e) => (
                  <div key={e.date} className={rowCls}>
                    <span className="min-w-28 font-semibold">{formatDay(e.date)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${e.type === 'off' ? 'bg-danger-50 text-danger' : 'bg-info-50 text-info'}`}>
                      {e.type === 'off' ? 'Unavailable' : e.ranges.map((r) => `${time12(r.start)} - ${time12(r.end)}`).join(', ')}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-muted">{e.note}</span>
                    <button
                      type="button"
                      aria-label={`Remove exception on ${e.date}`}
                      onClick={() => setDraft((d) => ({ ...d, exceptions: d.exceptions.filter((x) => x.date !== e.date) }))}
                      className="grid size-9 place-items-center rounded-lg text-danger hover:bg-danger-50"
                    >
                      <PiTrash size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel step={4} title="Block part of a day">
            <p className="mb-4 text-sm text-muted">For a meeting or an hour away. Slots in that time are hidden from patients.</p>
            <div className="grid gap-4 sm:grid-cols-4">
              <TextField id="bl-date" label="Date" type="date" min={today} value={bl.date} onChange={(e) => setBl((x) => ({ ...x, date: e.target.value }))} />
              <TextField id="bl-start" label="From" type="time" step="300" value={bl.start} onChange={(e) => setBl((x) => ({ ...x, start: e.target.value }))} />
              <TextField id="bl-end" label="Until" type="time" step="300" value={bl.end} onChange={(e) => setBl((x) => ({ ...x, end: e.target.value }))} />
              <TextField id="bl-note" label="Note (optional)" maxLength={200} value={bl.note} onChange={(e) => setBl((x) => ({ ...x, note: e.target.value }))} placeholder="e.g. Team meeting" />
            </div>
            {blError && (
              <p className="mt-3 text-[13px] font-medium text-danger" role="alert">
                {blError}
              </p>
            )}
            <Button className="mt-4" icon={PiPlus} onClick={addBlock}>
              Add
            </Button>

            {upcomingBlocks.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-lg border border-line">
                {upcomingBlocks.map((b, i) => (
                  <div key={`${b.date}-${b.start}-${i}`} className={rowCls}>
                    <span className="min-w-28 font-semibold">{formatDay(b.date)}</span>
                    <span className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-700">
                      {time12(b.start)} - {time12(b.end)}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-muted">{b.note}</span>
                    <button
                      type="button"
                      aria-label={`Remove blocked time on ${b.date}`}
                      onClick={() => setDraft((d) => ({ ...d, blocks: d.blocks.filter((x) => x !== b) }))}
                      className="grid size-9 place-items-center rounded-lg text-danger hover:bg-danger-50"
                    >
                      <PiTrash size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel step={5} title="What patients will see">
            <p className="mb-4 text-sm text-muted">
              {dirty ? 'You have unsaved changes. Save to update this preview.' : 'Free slots from the saved schedule, including existing bookings.'}
            </p>
            {services.length > 0 && (
              <div className="mb-4 max-w-sm">
                <SelectField id="preview-service" label="Appointment type" value={previewService} onChange={(e) => setPreviewService(e.target.value)}>
                  <option value="">Single slot</option>
                  {services.map((sv) => (
                    <option key={sv._id} value={sv._id}>
                      {sv.name} ({sv.durationMinutes} min)
                    </option>
                  ))}
                </SelectField>
              </div>
            )}
            <div className="grid items-start gap-6 md:grid-cols-2">
              <BookingCalendar doctorId={doctorId} serviceId={previewService} selected={previewDate} onSelect={setPreviewDate} refreshKey={refreshKey} markers={markers} />
              <div>
                <p className="mb-2.5 font-semibold">{formatDay(previewDate)}</p>
                {slotsError && <p className="text-[13px] font-medium text-danger">{slotsError}</p>}
                {slots && slots.slots.length === 0 && <p className="text-sm text-muted">No free slots on this day.</p>}
                {slots && slots.slots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {slots.slots.map((sl) => (
                      <span key={sl.start} className="rounded-lg bg-gold-50 px-3 py-1.5 text-[13.5px] font-semibold text-gold-700">
                        {time12(sl.label)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {dirty && <span className="text-sm font-semibold text-gold-700">Unsaved changes</span>}
            <Button loading={saving} disabled={!dirty} onClick={save}>
              Save availability
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
