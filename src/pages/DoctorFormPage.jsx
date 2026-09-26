import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usersApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import DoctorForm, { emptyDoctor } from '../components/forms/DoctorForm.jsx';

// /doctors/new and /doctors/:id/edit
export default function DoctorFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const { data, loading, error, reload } = useFetch(
    () => (editing ? usersApi.list() : Promise.resolve(null)),
    [editing, id]
  );

  if (editing && loading) return <Spinner />;
  if (editing && error) return <ErrorState message={error} onRetry={reload} />;

  const existing = editing ? data?.users.find((u) => u.id === id) : null;
  if (editing && !existing) {
    return <ErrorState message="This account could not be found." onRetry={reload} />;
  }

  const initialValues = existing
    ? {
        name: existing.name,
        email: existing.email,
        phone: existing.phone || '',
        imcNumber: existing.imcNumber || '',
        role: existing.role,
        canManageSettings: Boolean(existing.canManageSettings),
        password: '',
      }
    : emptyDoctor();

  const save = async (payload) => {
    if (editing) {
      await usersApi.update(id, payload);
      toast.success('Account updated');
    } else {
      await usersApi.create(payload);
      toast.success('Doctor account created');
    }
    navigate('/doctors');
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        back={{ to: '/doctors', label: 'Doctors' }}
        title={editing ? `Edit ${existing.name}` : 'Add doctor'}
        subtitle={editing ? undefined : 'Create a sign-in for a doctor or another administrator'}
      />
      <DoctorForm
        key={id || 'new'}
        initialValues={initialValues}
        editing={editing}
        onSave={save}
        onCancel={() => navigate('/doctors')}
      />
    </div>
  );
}