import { useState } from 'react';
import toast from 'react-hot-toast';
import useForm from '../../hooks/useForm.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import { validateDoctorAccount } from '../../utils/validators.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { isSuperAdmin } from '../../utils/roles.js';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { TextField, TextAreaField, ChoiceGroup, CheckChoice, PasswordField } from '../ui/Field.jsx';

const ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'Admin' },
];

export const emptyDoctor = () => ({
  name: '',
  email: '',
  phone: '',
  imcNumber: '',
  role: 'doctor',
  canManageSettings: false,
  isActive: true,
  password: '',
  acceptsOnlineBookings: false,
  slug: '',
  qualifications: '',
  specialties: '',
  bio: '',
  photoUrl: '',
});

export default function DoctorForm({ initialValues, editing = false, submitLabel, onSave, onCancel }) {
  const { user: me } = useAuth();
  const superAdmin = isSuperAdmin(me); // only the Super Admin can pick a role (create Admins)
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
      // An Admin can only ever create/manage doctors; the server enforces this too
      role: superAdmin ? values.role : 'doctor',
      canManageSettings: values.role === 'doctor' ? Boolean(values.canManageSettings) : false,
    };
    if (values.role === 'doctor') {
      payload.acceptsOnlineBookings = Boolean(values.acceptsOnlineBookings);
      payload.slug = values.slug.trim().toLowerCase();
      payload.qualifications = values.qualifications.trim();
      payload.specialties = values.specialties;
      payload.bio = values.bio.trim();
      payload.photoUrl = values.photoUrl.trim();
    }
    if (editing) payload.isActive = Boolean(values.isActive);
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
          {superAdmin && (
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
          )}
          {values.role === 'doctor' && (
            <div className="sm:col-span-2">
              <CheckChoice checked={values.canManageSettings} onChange={(v) => set('canManageSettings', v)}>
                Allow this doctor to manage Settings (add &amp; edit medicines, labs, services)
              </CheckChoice>
            </div>
          )}
          {editing && (
            <div className="sm:col-span-2">
              <CheckChoice checked={values.isActive} onChange={(v) => set('isActive', v)}>
                Account is active (can sign in)
              </CheckChoice>
            </div>
          )}
          <PasswordField
            label={editing ? 'New password' : 'Password'}
            autoComplete="new-password"
            required={!editing}
            hint={editing ? 'Leave blank to keep the current password' : 'At least 8 characters'}
            {...bind('password')}
          />
        </div>
      </Panel>

      {values.role === 'doctor' && (
        <Panel title="Online booking profile">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <CheckChoice checked={values.acceptsOnlineBookings} onChange={(v) => set('acceptsOnlineBookings', v)}>
                Show this doctor on the clinic website for online booking
              </CheckChoice>
            </div>
            {values.acceptsOnlineBookings && (
              <>
                <TextField
                  label="Web address name"
                  hint="Letters, numbers and hyphens. Leave blank to create it from the name."
                  placeholder="dr-jane-murphy"
                  {...bind('slug')}
                />
                <TextField label="Qualifications" placeholder="MB BCh BAO, MICGP" {...bind('qualifications')} />
                <TextField label="Specialties" hint="Separate with commas" placeholder="Family medicine, Women's health" {...bind('specialties')} />
                <TextField label="Photo web link (optional)" type="url" placeholder="https://…" {...bind('photoUrl')} />
                <div className="sm:col-span-2">
                  <TextAreaField label="Short bio" rows={3} maxLength={2000} {...bind('bio')} />
                </div>
              </>
            )}
          </div>
          <p className="mt-3 text-sm text-muted">Set this doctor's hours under Appointments → Availability, and choose the services they offer in Settings.</p>
        </Panel>
      )}

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