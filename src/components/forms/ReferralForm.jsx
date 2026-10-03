import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiWarningCircle } from 'react-icons/pi';
import useForm from '../../hooks/useForm.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validateReferral } from '../../utils/validators.js';
import { todayInput } from '../../utils/format.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField, TextAreaField, ChoiceGroup } from '../ui/Field.jsx';

export const REFERRAL_TYPES = [
  { value: 'specialist', label: 'Specialist' },
  { value: 'ed_hospital', label: 'ED / Hospital' },
  { value: 'other', label: 'Other' },
];

export const newReferral = () => ({ date: todayInput(), referralType: '', referredTo: '', letter: '' });

export default function ReferralForm({ submitLabel = 'Save & print', onSave, onCancel }) {
  const { user } = useAuth();
  const form = useForm(newReferral());
  const { values, bind, set } = form;
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const missingImc = !user?.imcNumber;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateReferral(values);
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      form.focusFirstError(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    const payload = {
      date: new Date(values.date).toISOString(),
      referralType: values.referralType,
      referredTo: values.referredTo.trim(),
      letter: values.letter.trim(),
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
          Add your IMC number to your profile before writing a referral. Go to My profile to add it.
        </div>
      )}

      <Panel title="Referral letter">
        <div className="grid gap-5">
          <TextField label="Date" type="date" required className="max-w-xs" {...bind('date')} />
          <ChoiceGroup
            legend="Referred to"
            name="referralType"
            required
            value={values.referralType}
            onChange={(v) => set('referralType', v)}
            options={REFERRAL_TYPES}
            error={form.errors.referralType}
          />
          <TextField
            label="Specialist / hospital name"
            placeholder="e.g. Dr Murphy, Cardiology — St James's Hospital"
            {...bind('referredTo')}
          />
          <TextAreaField
            label="Referral letter"
            required
            rows={10}
            hint="Written exactly as it should appear on the printed letter"
            {...bind('letter')}
          />
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
        title="Cancel this referral?"
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