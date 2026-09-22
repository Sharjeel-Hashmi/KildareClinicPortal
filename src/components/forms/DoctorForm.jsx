import { useState } from 'react';
import toast from 'react-hot-toast';
import useForm from '../../hooks/useForm.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validateDoctorAccount } from '../../utils/validators.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField, ChoiceGroup, PasswordField } from '../ui/Field.jsx';

const ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'Administrator' },
];

export const emptyDoctor = () => ({
  name: '',
  email: '',
  phone: '',
  imcNumber: '',
  role: 'doctor',
  password: '',
});

export default function DoctorForm({ initialValues, editing = false, submitLabel, onSave, onCancel }) {
  const form = useForm(initialValues || emptyDoctor());
  const { values, set, bind } = form;
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateDoctorAccount(values, { editing });
    if (Object.keys(errs).length) {
      form.setErrors(errs);
      form.focusFirstError(errs);
      toast.error('Please check the highlighted fields', { id: 'form-invalid' });
      return;
    }

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      imcNumber: values.imcNumber.trim(),
      role: values.role,
    };
    if (values.password) payload.password = values.password;

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
      <Panel title="Account">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Full name" required {...bind('name')} />
          <TextField label="Email" type="email" required autoComplete="off" {...bind('email')} />
          <TextField label="Phone" type="tel" {...bind('phone')} />
          <TextField
            label="IMC number"
            required={values.role === 'doctor'}
            hint={values.role === 'admin' ? 'Only needed if this admin also sees patients' : undefined}
            {...bind('imcNumber')}
          />
          <div className="sm:col-span-2">
            <ChoiceGroup
              legend="Role"
              name="role"
              value={values.role}
              onChange={(v) => set('role', v)}
              options={ROLES}
              required
            />
          </div>
          <PasswordField
            label={editing ? 'New password' : 'Password'}
            autoComplete="new-password"
            required={!editing}
            hint={editing ? 'Leave blank to keep the current password' : 'At least 8 characters'}
            {...bind('password')}
          />
        </div>
      </Panel>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button variant="secondary" onClick={() => setConfirmCancel(true)} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {submitLabel || (editing ? 'Save changes' : 'Create account')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Discard changes?"
        message="Are you sure you want to cancel? Anything you have entered will not be saved."
        confirmLabel="Yes, discard"
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