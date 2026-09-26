import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiWarningCircle } from 'react-icons/pi';
import useForm from '../../hooks/useForm.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { medicinesApi } from '../../api/services.js';
import { validatePrescription } from '../../utils/validators.js';
import { todayInput } from '../../utils/format.js';
import useFetch from '../../hooks/useFetch.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField, TextAreaField, SelectField } from '../ui/Field.jsx';

export const newPrescription = () => ({ date: todayInput(), medication: '' });

export default function PrescriptionForm({ submitLabel = 'Save & print', onSave, onCancel }) {
  const { user } = useAuth();
  const form = useForm(newPrescription());
  const { values, bind } = form;
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [insertMedicine, setInsertMedicine] = useState('');
  const [insertDosage, setInsertDosage] = useState('');
  const missingImc = !user?.imcNumber;

  const medicinesQ = useFetch(() => medicinesApi.list(), []);
  const medicines = medicinesQ.data?.medicines || [];
  const selectedMedicine = medicines.find((m) => m._id === insertMedicine);

  const insertIntoMedication = () => {
    if (!selectedMedicine) return;
    const line = insertDosage ? `${selectedMedicine.name} — ${insertDosage}` : selectedMedicine.name;
    const current = values.medication;
    const next = current && !current.endsWith('\n') ? `${current}\n${line}` : `${current}${line}`;
    form.set('medication', next);
    setInsertMedicine('');
    setInsertDosage('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validatePrescription(values);
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      form.focusFirstError(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    const payload = {
      date: new Date(values.date).toISOString(),
      medication: values.medication.trim(),
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
          Add your IMC number to your profile before issuing a prescription. Go to My profile to add it.
        </div>
      )}

      <Panel title="Prescription">
        <div className="grid gap-5">
          <TextField label="Date" type="date" required className="max-w-xs" {...bind('date')} />

          {medicines.length > 0 && (
            <div className="grid gap-3 rounded-lg border border-line bg-paper p-3.5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <SelectField
                label="Insert medicine"
                value={insertMedicine}
                onChange={(e) => {
                  setInsertMedicine(e.target.value);
                  setInsertDosage('');
                }}
              >
                <option value="">Select medicine…</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Dosage"
                value={insertDosage}
                onChange={(e) => setInsertDosage(e.target.value)}
                disabled={!selectedMedicine?.dosages?.length}
              >
                <option value="">Dosage…</option>
                {(selectedMedicine?.dosages || []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectField>
              <Button type="button" variant="secondary" onClick={insertIntoMedication} disabled={!selectedMedicine}>
                Add to prescription
              </Button>
            </div>
          )}

          <TextAreaField
            label="Medication"
            required
            rows={10}
            hint="Written exactly as it should appear on the printed prescription"
            {...bind('medication')}
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
        title="Cancel this prescription?"
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