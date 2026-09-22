import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiWarningCircle } from 'react-icons/pi';
import useForm from '../../hooks/useForm.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validateCertificate } from '../../utils/validators.js';
import { todayInput } from '../../utils/format.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField, TextAreaField, ChoiceGroup } from '../ui/Field.jsx';

const CERTIFICATION = [
  { value: 'unfit', label: 'Unfit for work' },
  { value: 'fit', label: 'Fit for work' },
];

export const newCertificate = () => ({
  dateOfConsultation: todayInput(),
  diagnosis: '',
  certification: '',
  periodFrom: '',
  periodTo: '',
});

export default function CertificateForm({ submitLabel = 'Save & print', onSave, onCancel }) {
  const { user } = useAuth();
  const form = useForm(newCertificate());
  const { values, set, bind } = form;
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const missingImc = !user?.imcNumber;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateCertificate(values);
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      form.focusFirstError(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    const payload = {
      dateOfConsultation: new Date(values.dateOfConsultation).toISOString(),
      diagnosis: values.diagnosis.trim(),
      certification: values.certification,
      periodFrom: values.periodFrom ? new Date(values.periodFrom).toISOString() : '',
      periodTo: values.periodTo ? new Date(values.periodTo).toISOString() : '',
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

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {missingImc && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-50 px-3.5 py-3 text-sm font-medium text-danger"
        >
          <PiWarningCircle size={20} className="mt-px shrink-0" aria-hidden="true" />
          Add your IMC number to your profile before issuing a medical certificate. Go to My profile to add it.
        </div>
      )}

      <Panel title="Medical certificate">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Date of consultation" type="date" required {...bind('dateOfConsultation')} />
          <TextAreaField label="Diagnosis" className="sm:col-span-2" {...bind('diagnosis')} />
          <div className="sm:col-span-2">
            <ChoiceGroup
              legend="Certification"
              name="certification"
              value={values.certification}
              onChange={(v) => set('certification', v)}
              options={CERTIFICATION}
              error={form.errors.certification}
              required
            />
          </div>
          <TextField label="Period from" type="date" {...bind('periodFrom')} />
          <TextField label="Period to" type="date" {...bind('periodTo')} />
        </div>
        <div className="mt-5 grid gap-1.5 rounded-lg border border-line bg-paper px-4 py-3 text-sm text-muted sm:grid-cols-2">
          <p>
            <span className="font-medium text-ink">Doctor:</span> {user?.name}
          </p>
          <p>
            <span className="font-medium text-ink">IMC No.:</span> {user?.imcNumber || '—'}
          </p>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button variant="secondary" onClick={() => setConfirmCancel(true)} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={missingImc}>
          {submitLabel}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this certificate?"
        message="Are you sure you want to cancel? Anything you have entered will not be saved."
        confirmLabel="Yes, cancel"
        cancelLabel="No, keep editing"
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </form>
  );
}
