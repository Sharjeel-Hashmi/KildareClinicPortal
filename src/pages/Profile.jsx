import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/services.js';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useForm from '../hooks/useForm.js';
import { validateProfile } from '../utils/validators.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import FileUpload from '../components/ui/FileUpload.jsx';
import { TextField, PasswordField } from '../components/ui/Field.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    imcNumber: user?.imcNumber || '',
    password: '',
    role: user?.role || 'doctor',
  });
  const { values, bind } = form;
  const [saving, setSaving] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(user?.signatureUrl || '');
  const [savingSignature, setSavingSignature] = useState(false);

  const handleSignatureChange = async (url) => {
    const previous = signatureUrl;
    setSignatureUrl(url);
    setSavingSignature(true);
    try {
      const res = await authApi.updateMe({ signatureUrl: url });
      updateUser(res.user);
      toast.success(url ? 'Signature updated' : 'Signature removed');
    } catch (err) {
      setSignatureUrl(previous);
      toast.error(getErrorMessage(err));
    } finally {
      setSavingSignature(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateProfile(values);
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
    };
    if (values.password) payload.password = values.password;

    setSaving(true);
    try {
      const res = await authApi.updateMe(payload);
      updateUser(res.user);
      form.set('password', '');
      toast.success('Profile updated');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) {
        form.setErrors(fieldErrors);
        form.focusFirstError(fieldErrors);
      }
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="My profile"
        subtitle={
          <span className="inline-flex items-center gap-2">
            <Badge tone={user?.role === 'admin' ? 'gold' : 'neutral'}>
              {user?.role === 'admin' ? 'Administrator' : 'Doctor'}
            </Badge>
          </span>
        }
      />

      <form onSubmit={submit} noValidate className="space-y-5">
        <Panel title="Account details">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Full name" required {...bind('name')} />
            <TextField label="Email" type="email" required autoComplete="off" {...bind('email')} />
            <TextField label="Phone" type="tel" {...bind('phone')} />
            <TextField
              label="IMC number"
              required={user?.role === 'doctor'}
              {...bind('imcNumber')}
            />
            <PasswordField
              label="New password"
              autoComplete="new-password"
              hint="Leave blank to keep your current password"
              className="sm:col-span-2"
              {...bind('password')}
            />
          </div>
        </Panel>

        <Panel title="Signature">
          <FileUpload
            kind="signature"
            accept="image/png,image/jpeg,image/webp"
            shape="card"
            value={signatureUrl}
            onChange={handleSignatureChange}
            hint={
              savingSignature
                ? 'Saving…'
                : 'Used on printed prescriptions and medical certificates. PNG or JPG, ideally with a transparent background.'
            }
          />
        </Panel>

        <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
            Back
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}