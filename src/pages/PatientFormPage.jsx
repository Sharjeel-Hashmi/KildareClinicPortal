import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientsApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientForm, { emptyPatient, patientToForm } from '../components/patients/PatientForm.jsx';
import { fullName } from '../utils/format.js';

// One page for both "Add patient" (/patients/new) and "Edit patient" (/patients/:id/edit)
export default function PatientFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const { data, loading, error, reload } = useFetch(
    () => (editing ? patientsApi.get(id) : Promise.resolve(null)),
    [id]
  );

  if (editing && loading) return <Spinner />;
  if (editing && error) return <ErrorState message={error} onRetry={reload} />;

  const patient = data?.patient;
  const cancelTo = editing ? `/patients/${id}` : '/patients';

  const save = async (payload) => {
    if (editing) {
      await patientsApi.update(id, payload);
      toast.success('Patient details updated');
      navigate(`/patients/${id}`);
    } else {
      const res = await patientsApi.create(payload);
      toast.success(`Patient registered · ${res.patient.patientNo}`);
      navigate(`/patients/${res.patient._id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ to: cancelTo, label: editing ? fullName(patient) : 'Patients' }}
        title={editing ? 'Edit patient' : 'New patient'}
        subtitle={editing ? `${fullName(patient)} · ${patient.patientNo}` : 'Patient registration form'}
      />
      <PatientForm
        initial={editing ? patientToForm(patient) : emptyPatient()}
        patientNo={patient?.patientNo}
        submitLabel={editing ? 'Save changes' : 'Save patient'}
        onSave={save}
        onCancel={() => navigate(cancelTo)}
      />
    </div>
  );
}
