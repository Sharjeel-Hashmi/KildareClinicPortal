import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { appointmentsApi, availabilityApi, doctorsApi, patientsApi, servicesApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdminLike } from '../utils/roles.js';
import { formatDayLong, servicesForDoctor, time12, todayDublin } from '../utils/booking.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import { TextField, TextAreaField, SelectField, ChoiceGroup, CheckChoice, Field } from '../components/ui/Field.jsx';
import BookingCalendar from '../components/appointments/BookingCalendar.jsx';
import PatientPicker from '../components/appointments/PatientPicker.jsx';

const PATIENT_MODES = [
  { value: 'existing', label: 'Existing patient' },
  { value: 'new', label: 'New patient' },
];

// /appointments/new — phone / walk-in booking. Admin / Super Admin choose the doctor; a doctor books for themselves.
export default function AppointmentFormPage() {
  const { user } = useAuth();
  const admin = isAdminLike(user);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetPatientId = params.get('patientId') || '';

  const lists = useFetch(() => Promise.all([servicesApi.list(), admin ? doctorsApi.list() : Promise.resolve(null)]), [admin]);
  const services = lists.data?.[0]?.services || [];
  const doctors = lists.data?.[1]?.doctors || [];

  const [doctorId, setDoctorId] = useState(admin ? '' : String(user.id));
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayDublin());
  const [slots, setSlots] = useState(null);
  const [slotsError, setSlotsError] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [mode, setMode] = useState('existing');
  const [picked, setPicked] = useState(null);
  const [fields, setFields] = useState({ fullName: '', phone: '', email: '', reason: '' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Opened from a patient's page: pick that patient straight away
  useEffect(() => {
    if (!presetPatientId) return;
    patientsApi
      .get(presetPatientId)
      .then((d) => choosePatient(d.patient))
      .catch(() => {});
  }, [presetPatientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Admins: default to the first doctor once the list is here
  useEffect(() => {
    if (admin && !doctorId && doctors.length) setDoctorId(String(doctors[0].id));
  }, [admin, doctorId, doctors]);

  const offered = useMemo(() => servicesForDoctor(services, doctorId), [services, doctorId]);

  // keep the chosen service valid when the doctor changes
  useEffect(() => {
    if (!offered.some((s) => s._id === serviceId)) setServiceId(offered[0]?._id || '');
  }, [offered]); // eslint-disable-line react-hooks/exhaustive-deps

  // free slots for the chosen doctor / service / day (staff rules: no minimum-notice window)
  useEffect(() => {
    setStartTime('');
    if (!doctorId || !serviceId || !date) {
      setSlots(null);
      return undefined;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError('');
    availabilityApi
      .slots(doctorId, { date, serviceId, staff: '1' })
      .then((d) => !cancelled && setSlots(d))
      .catch((e) => {
        if (cancelled) return;
        setSlots(null);
        setSlotsError(getErrorMessage(e));
      })
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctorId, serviceId, date, refreshKey]);

  const set = (key, value) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const choosePatient = (p) => {
    setPicked(p);
    setErrors((e) => ({ ...e, patient: undefined }));
    setFields((f) => ({ ...f, phone: p?.phone || '', email: p?.email || '' }));
  };

  const validate = () => {
    const e = {};
    if (!doctorId) e.doctor = 'Choose a doctor';
    if (!serviceId) e.service = 'Choose a service';
    if (!startTime) e.time = 'Choose a time for the appointment';
    if (mode === 'existing') {
      if (!picked) e.patient = 'Choose a registered patient, or switch to New patient';
    } else if (!fields.fullName.trim()) e.fullName = "Enter the patient's full name";
    if (!fields.phone.trim()) e.phone = 'Enter a contact phone number';
    if (fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) e.email = 'Enter a valid email address';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }
    setSaving(true);
    try {
      const res = await appointmentsApi.create({
        doctorId,
        serviceId,
        startTime,
        patientId: mode === 'existing' ? picked._id : undefined,
        patient: {
          fullName: fields.fullName.trim(),
          phone: fields.phone.trim(),
          email: fields.email.trim(),
          reason: fields.reason.trim(),
        },
        gdprConsent: consent,
      });
      toast.success(res.patientEmailed ? 'Appointment booked and confirmation emailed' : 'Appointment booked');
      navigate(`/appointments?date=${res.appointment.startLocal.date}`);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      if (err.response?.status === 409) setRefreshKey((k) => k + 1); // slot just taken: reload the free times
      setSaving(false);
    }
  };

  if (lists.loading) return <Spinner />;
  if (lists.error) return <ErrorState message={lists.error} onRetry={lists.reload} />;

  const doctorName = doctors.find((d) => String(d.id) === String(doctorId))?.name;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader back={{ to: '/appointments', label: 'Appointments' }} title="New appointment" subtitle="Book a phone or walk-in appointment" />

      <form onSubmit={submit} noValidate className="space-y-5">
        <Panel step={1} title="Doctor and service">
          <div className="grid gap-5 sm:grid-cols-2">
            {admin ? (
              <SelectField
                id="doctor"
                label="Doctor"
                required
                value={doctorId}
                error={errors.doctor}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                {doctors.length === 0 && <option value="">No doctors yet</option>}
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </SelectField>
            ) : (
              <Field label="Doctor" htmlFor="doctor">
                <p id="doctor" className="flex h-11 items-center text-[15px] font-medium">{user.name}</p>
              </Field>
            )}
            <SelectField
              id="service"
              label="Service"
              required
              value={serviceId}
              error={errors.service}
              onChange={(e) => setServiceId(e.target.value)}
              disabled={offered.length === 0}
            >
              {offered.length === 0 && <option value="">No bookable services</option>}
              {offered.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.durationMinutes} min)
                </option>
              ))}
            </SelectField>
          </div>
          {offered.length === 0 && doctorId && (
            <p className="mt-3 text-sm text-muted">
              {admin ? `${doctorName || 'This doctor'} has` : 'You have'} no bookable services yet. Add a duration and tick “Bookable” for a
              service in Settings, and choose the doctors who offer it.
            </p>
          )}
        </Panel>

        <Panel step={2} title="Date and time">
          {doctorId && serviceId ? (
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <BookingCalendar
                doctorId={doctorId}
                serviceId={serviceId}
                selected={date}
                onSelect={setDate}
                refreshKey={refreshKey}
                onlyFree
                staff
              />
              <div>
                <p className="mb-2.5 font-semibold">{formatDayLong(date)}</p>
                {slotsLoading && <p className="text-sm text-muted">Loading times…</p>}
                {slotsError && <p className="text-[13px] font-medium text-danger">{slotsError}</p>}
                {slots && !slotsLoading && slots.slots.length === 0 && (
                  <p className="text-sm text-muted">No free times on this day. Pick a highlighted day in the calendar.</p>
                )}
                {slots && slots.slots.length > 0 && (
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Appointment time">
                    {slots.slots.map((sl) => (
                      <button
                        key={sl.start}
                        type="button"
                        role="radio"
                        aria-checked={startTime === sl.start}
                        onClick={() => {
                          setStartTime(sl.start);
                          setErrors((e) => ({ ...e, time: undefined }));
                        }}
                        className={`h-10 rounded-lg border px-3.5 text-[14px] font-semibold transition-colors ${
                          startTime === sl.start
                            ? 'border-gold-600 bg-gold-500 text-ink'
                            : 'border-line-strong bg-white text-ink hover:bg-gold-50'
                        }`}
                      >
                        {time12(sl.label)}
                      </button>
                    ))}
                  </div>
                )}
                {errors.time && <p className="mt-2 text-[13px] font-medium text-danger">{errors.time}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Choose a doctor and a service first.</p>
          )}
        </Panel>

        <Panel step={3} title="Patient">
          <div className="space-y-5">
            <ChoiceGroup
              legend="Is this patient already registered?"
              name="patientMode"
              value={mode}
              onChange={(v) => {
                setMode(v);
                setErrors({});
              }}
              options={PATIENT_MODES}
            />

            {mode === 'existing' ? (
              <PatientPicker value={picked} onChange={choosePatient} error={errors.patient} />
            ) : (
              <TextField
                id="fullName"
                label="Full name"
                required
                value={fields.fullName}
                error={errors.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                maxLength={120}
              />
            )}

            {(mode === 'new' || picked) && (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  id="phone"
                  label="Contact phone"
                  type="tel"
                  required
                  value={fields.phone}
                  error={errors.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  maxLength={30}
                />
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  value={fields.email}
                  error={errors.email}
                  onChange={(e) => set('email', e.target.value)}
                  hint="Optional. A confirmation with a cancel link is emailed when set."
                />
              </div>
            )}

            <TextAreaField
              id="reason"
              label="Reason for visit"
              rows={2}
              maxLength={300}
              value={fields.reason}
              onChange={(e) => set('reason', e.target.value)}
              hint="Optional, short. No medical history."
            />

            {mode === 'new' && (
              <CheckChoice checked={consent} onChange={setConsent}>
                Patient agrees to the clinic storing their details to manage this appointment
              </CheckChoice>
            )}
          </div>
        </Panel>

        <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Button variant="secondary" to="/appointments" disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Book appointment
          </Button>
        </div>
      </form>
    </div>
  );
}
