import { useState } from 'react';
import toast from 'react-hot-toast';
import useForm from '../../hooks/useForm.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validatePatient } from '../../utils/validators.js';
import { todayInput, toDateInput } from '../../utils/format.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField, TextAreaField, ChoiceGroup, CheckChoice } from '../ui/Field.jsx';

export const emptyPatient = () => ({
  registrationDate: todayInput(),
  surname: '',
  firstName: '',
  dob: '',
  sex: '',
  ppsn: '',
  addressLine1: '',
  addressLine2: '',
  eircode: '',
  phone: '',
  email: '',
  usualGp: '',
  medicalConditions: '',
  medications: '',
  allergyStatus: '',
  allergyDetails: '',
  emergencyContact: { name: '', relationship: '', phone: '' },
  reasonForRegistration: '',
  infoProvided: false,
  preferredContact: '',
  preferredContactOther: '',
  notes: '',
});

// server record → form values
export const patientToForm = (p) => {
  const base = emptyPatient();
  return {
    ...base,
    ...Object.fromEntries(Object.keys(base).map((k) => [k, p[k] ?? base[k]])),
    registrationDate: toDateInput(p.registrationDate) || base.registrationDate,
    dob: toDateInput(p.dob),
    emergencyContact: { ...base.emergencyContact, ...(p.emergencyContact || {}) },
  };
};

const SEX = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other / Prefer not to say' },
];
const ALLERGY = [
  { value: 'none', label: 'None known' },
  { value: 'yes', label: 'Yes' },
];
const CONTACT = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

export default function PatientForm({ initial, patientNo, submitLabel, onSave, onCancel }) {
  const form = useForm(initial);
  const { values, set, bind } = form;
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState(null); // { message, payload } when the server flags a double registration

  const submit = async (e) => {
    e.preventDefault();
    const errs = validatePatient(values);
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      form.focusFirstError(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    const trim = (s) => (typeof s === 'string' ? s.trim() : s);
    const payload = {
      ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, trim(v)])),
      emergencyContact: Object.fromEntries(
        Object.entries(values.emergencyContact).map(([k, v]) => [k, trim(v)])
      ),
      // clear detail fields that no longer apply
      allergyDetails: values.allergyStatus === 'yes' ? values.allergyDetails.trim() : '',
      preferredContactOther: values.preferredContact === 'other' ? values.preferredContactOther.trim() : '',
    };

    await send(payload);
  };

  // Shared by the normal save and the "Register anyway" confirmation
  async function send(payload) {
    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setSaving(false);
      if (err.response?.data?.code === 'DUPLICATE') {
        setDuplicate({ message: err.response.data.message, payload });
        return;
      }
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) {
        form.setErrors(fieldErrors);
        form.focusFirstError(fieldErrors);
      }
      toast.error(getErrorMessage(err));
    }
  }

  const confirmDuplicate = async () => {
    const { payload } = duplicate;
    setDuplicate(null);
    await send({ ...payload, confirmDuplicate: true });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Panel step={1} title="Patient details">
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <TextField
            id="patientNo"
            label="Patient No. / Ref."
            value={patientNo || ''}
            placeholder="Assigned when saved"
            disabled
            readOnly
          />
          <TextField label="Date of registration" type="date" {...bind('registrationDate')} />
          <TextField label="Surname" required autoComplete="off" {...bind('surname')} />
          <TextField label="First name(s)" required autoComplete="off" {...bind('firstName')} />
          <TextField
            label="Date of birth"
            type="date"
            required
            max={todayInput()}
            {...bind('dob')}
          />
          <TextField
            label="PPSN"
            hint="Only if required"
            placeholder="1234567TA"
            autoComplete="off"
            {...bind('ppsn')}
          />
          <ChoiceGroup
            legend="Sex"
            name="sex"
            className="sm:col-span-2"
            value={values.sex}
            onChange={(v) => set('sex', v)}
            options={SEX}
          />
          <TextField label="Address line 1" className="sm:col-span-2" {...bind('addressLine1')} />
          <TextField label="Address line 2" {...bind('addressLine2')} />
          <TextField label="Eircode" placeholder="W91 XY12" autoComplete="off" {...bind('eircode')} />
          <TextField
            label="Mobile / Telephone"
            type="tel"
            inputMode="tel"
            required
            placeholder="087 123 4567"
            {...bind('phone')}
          />
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            placeholder="name@example.com"
            {...bind('email')}
          />
        </div>
      </Panel>

      <Panel step={2} title="GP & medical information">
        <div className="grid gap-5">
          <TextField label="Usual GP / GP practice" {...bind('usualGp')} />
          <TextAreaField label="Previous / relevant medical conditions" {...bind('medicalConditions')} />
          <TextAreaField label="Current medication(s)" {...bind('medications')} />
          <div className="space-y-3">
            <ChoiceGroup
              legend="Allergies"
              name="allergyStatus"
              value={values.allergyStatus}
              onChange={(v) => set('allergyStatus', v)}
              options={ALLERGY}
            />
            {values.allergyStatus === 'yes' && (
              <TextField
                label="Allergy details"
                required
                placeholder="e.g. Penicillin – rash"
                {...bind('allergyDetails')}
              />
            )}
          </div>
        </div>
      </Panel>

      <Panel step={3} title="Emergency contact">
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label="Name" {...bind('emergencyContact.name')} />
          <TextField label="Relationship" {...bind('emergencyContact.relationship')} />
          <TextField label="Telephone" type="tel" inputMode="tel" {...bind('emergencyContact.phone')} />
        </div>
      </Panel>

      <Panel step={4} title="Registration / administrative">
        <div className="grid gap-5">
          <TextField label="Reason for registration" {...bind('reasonForRegistration')} />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Consent / information provided</p>
            <CheckChoice
              name="infoProvided"
              checked={values.infoProvided}
              onChange={(v) => set('infoProvided', v)}
              className="h-auto min-h-11 py-2.5"
            >
              Relevant clinic information provided to patient
            </CheckChoice>
          </div>
          <div className="space-y-3">
            <ChoiceGroup
              legend="Preferred contact method"
              name="preferredContact"
              value={values.preferredContact}
              onChange={(v) => set('preferredContact', v)}
              options={CONTACT}
            />
            {values.preferredContact === 'other' && (
              <TextField
                label="Other contact method"
                required
                {...bind('preferredContactOther')}
              />
            )}
          </div>
          <TextAreaField label="Additional notes" rows={3} {...bind('notes')} />
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

      <ConfirmDialog
        open={Boolean(duplicate)}
        title="Possible duplicate patient"
        message={`${duplicate?.message || ''} Register this person again anyway?`}
        confirmLabel="Register anyway"
        onConfirm={confirmDuplicate}
        onCancel={() => setDuplicate(null)}
      />
    </form>
  );
}
