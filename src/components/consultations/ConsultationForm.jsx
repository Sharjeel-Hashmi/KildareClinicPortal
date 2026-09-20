import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiSignature } from 'react-icons/pi';
import useForm from '../../hooks/useForm.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validateConsultation } from '../../utils/validators.js';
import { toLocalInput, toDateInput, todayInput } from '../../utils/format.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import { TextField, TextAreaField, ChoiceGroup, CheckGroup } from '../ui/Field.jsx';

const TYPES = [
  { value: 'new', label: 'New' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];
const ALLERGY = [
  { value: 'none', label: 'None known' },
  { value: 'yes', label: 'Yes' },
];
const INVESTIGATIONS = [
  { value: 'none', label: 'None', exclusive: true },
  { value: 'bloods', label: 'Bloods' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'other', label: 'Other' },
];
const REFERRALS = [
  { value: 'none', label: 'None', exclusive: true },
  { value: 'specialist', label: 'Specialist' },
  { value: 'ed_hospital', label: 'ED / Hospital' },
  { value: 'other', label: 'Other' },
];

// A new consultation starts with what we already know about the patient
export const newConsultation = ({ patient, clinician, hasHistory }) => ({
  consultationDate: toLocalInput(),
  clinician,
  consultationType: hasHistory ? 'follow_up' : 'new',
  consultationTypeOther: '',
  mainComplaint: '',
  historyOfPresentingComplaint: '',
  pastMedicalHistory: patient.medicalConditions || '',
  surgicalHistory: '',
  currentMedications: patient.medications || '',
  allergyStatus: patient.allergyStatus || '',
  allergyDetails: patient.allergyDetails || '',
  familySocialHistory: '',
  vitals: { bp: '', pulse: '', temp: '', spo2: '', weight: '', other: '' },
  examinationFindings: '',
  diagnosis: '',
  managementPlan: '',
  investigations: [],
  investigationsOther: '',
  referral: [],
  referralOther: '',
  followUp: '',
  prescription: { medication: '', dose: '', prescriberSignature: '' },
  notes: '',
  clinicianSignature: '',
  signatureDate: '',
});

export const consultationToForm = (c) => {
  const base = newConsultation({ patient: {}, clinician: '', hasHistory: false });
  const merged = Object.fromEntries(Object.keys(base).map((k) => [k, c[k] ?? base[k]]));
  return {
    ...merged,
    consultationDate: toLocalInput(c.consultationDate),
    signatureDate: toDateInput(c.signatureDate),
    vitals: { ...base.vitals, ...(c.vitals || {}) },
    prescription: { ...base.prescription, ...(c.prescription || {}) },
    investigations: c.investigations || [],
    referral: c.referral || [],
  };
};

export default function ConsultationForm({ initial, submitLabel, onSave, onCancel }) {
  const { user } = useAuth();
  const form = useForm(initial);
  const { values, set, bind } = form;
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateConsultation(values);
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      form.focusFirstError(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    const trim = (s) => (typeof s === 'string' ? s.trim() : s);
    const trimObj = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, trim(v)]));
    const payload = {
      ...trimObj(values),
      consultationDate: new Date(values.consultationDate).toISOString(),
      vitals: trimObj(values.vitals),
      prescription: trimObj(values.prescription),
      consultationTypeOther: values.consultationType === 'other' ? values.consultationTypeOther.trim() : '',
      allergyDetails: values.allergyStatus === 'yes' ? values.allergyDetails.trim() : '',
      investigationsOther: values.investigations.includes('other') ? values.investigationsOther.trim() : '',
      referralOther: values.referral.includes('other') ? values.referralOther.trim() : '',
      signatureDate: values.signatureDate || '',
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) {
        form.setErrors(fieldErrors);
        form.focusFirstError(fieldErrors);
      }
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  };

  // Signing is a deliberate click — never pre-filled
  const signPrescriber = () => set('prescription.prescriberSignature', user?.name || '');
  const signClinician = () => {
    set('clinicianSignature', user?.name || '');
    set('signatureDate', todayInput());
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Panel step={1} title="Consultation details">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Consultation date & time"
            type="datetime-local"
            required
            {...bind('consultationDate')}
          />
          <TextField label="GP / Clinician" required autoComplete="off" {...bind('clinician')} />
          <div className="space-y-3 sm:col-span-2">
            <ChoiceGroup
              legend="Consultation type"
              name="consultationType"
              value={values.consultationType}
              onChange={(v) => set('consultationType', v)}
              options={TYPES}
            />
            {values.consultationType === 'other' && (
              <TextField label="Other type" {...bind('consultationTypeOther')} />
            )}
          </div>
        </div>
      </Panel>

      <Panel step={2} title="Presenting complaint">
        <div className="grid gap-5">
          <TextAreaField
            label="Main complaint / reason for attendance"
            required
            rows={2}
            {...bind('mainComplaint')}
          />
          <TextAreaField
            label="History of presenting complaint"
            rows={5}
            {...bind('historyOfPresentingComplaint')}
          />
        </div>
      </Panel>

      <Panel step={3} title="Relevant history">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextAreaField label="Past medical history" {...bind('pastMedicalHistory')} />
          <TextAreaField label="Surgical history" {...bind('surgicalHistory')} />
          <TextAreaField label="Current medications" {...bind('currentMedications')} />
          <div className="space-y-3">
            <ChoiceGroup
              legend="Allergies"
              name="allergyStatus"
              value={values.allergyStatus}
              onChange={(v) => set('allergyStatus', v)}
              options={ALLERGY}
            />
            {values.allergyStatus === 'yes' && (
              <TextField label="Allergy details" required {...bind('allergyDetails')} />
            )}
          </div>
          <TextAreaField
            label="Family / social history"
            className="sm:col-span-2"
            {...bind('familySocialHistory')}
          />
        </div>
      </Panel>

      <Panel step={4} title="Examination & observations">
        <div className="grid gap-5">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Observations / vitals</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <TextField label="BP" suffix="mmHg" placeholder="120/80" {...bind('vitals.bp')} />
              <TextField label="Pulse" suffix="bpm" inputMode="numeric" {...bind('vitals.pulse')} />
              <TextField label="Temp" suffix="°C" inputMode="decimal" {...bind('vitals.temp')} />
              <TextField label="SpO₂" suffix="%" inputMode="numeric" {...bind('vitals.spo2')} />
              <TextField label="Weight" suffix="kg" inputMode="decimal" {...bind('vitals.weight')} />
              <TextField label="Other" className="col-span-2 sm:col-span-3 lg:col-span-1" {...bind('vitals.other')} />
            </div>
          </div>
          <TextAreaField label="Clinical examination / findings" rows={5} {...bind('examinationFindings')} />
        </div>
      </Panel>

      <Panel step={5} title="Assessment & plan">
        <div className="grid gap-5">
          <TextAreaField label="Diagnosis / clinical impression" {...bind('diagnosis')} />
          <TextAreaField label="Treatment / advice / management plan" rows={4} {...bind('managementPlan')} />
          <div className="space-y-3">
            <CheckGroup
              legend="Investigations requested"
              value={values.investigations}
              onChange={(v) => set('investigations', v)}
              options={INVESTIGATIONS}
            />
            {values.investigations.includes('other') && (
              <TextField label="Other investigation" {...bind('investigationsOther')} />
            )}
          </div>
          <div className="space-y-3">
            <CheckGroup
              legend="Referral"
              value={values.referral}
              onChange={(v) => set('referral', v)}
              options={REFERRALS}
            />
            {values.referral.includes('other') && <TextField label="Other referral" {...bind('referralOther')} />}
          </div>
          <TextField label="Follow-up / review" placeholder="e.g. Review in 2 weeks" {...bind('followUp')} />
        </div>
      </Panel>

      <Panel step={6} title="Prescription">
        <div className="grid gap-5">
          <TextAreaField label="Medication / prescription" {...bind('prescription.medication')} />
          <TextField label="Dose / frequency / duration" {...bind('prescription.dose')} />
          <div className="flex flex-wrap items-end gap-3">
            <TextField
              label="Prescriber signature"
              className="min-w-[14rem] flex-1"
              hint="Type your full name, or use the sign button"
              {...bind('prescription.prescriberSignature')}
            />
            <Button variant="secondary" icon={PiSignature} onClick={signPrescriber} className="mb-[1.6rem]">
              Sign as {user?.name}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel step={7} title="Additional notes">
        <div className="grid gap-5">
          <TextAreaField label="Notes" rows={4} {...bind('notes')} />
          <div className="flex flex-wrap items-end gap-3">
            <TextField label="Clinician signature" className="min-w-[14rem] flex-1" {...bind('clinicianSignature')} />
            <TextField label="Date" type="date" className="w-44" {...bind('signatureDate')} />
            <Button variant="secondary" icon={PiSignature} onClick={signClinician}>
              Sign as {user?.name}
            </Button>
          </div>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
