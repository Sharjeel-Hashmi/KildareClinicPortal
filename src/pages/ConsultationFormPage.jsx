import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientsApi, consultationsApi } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';
import ConsultationForm, {
  newConsultation,
  consultationToForm,
} from '../components/consultations/ConsultationForm.jsx';
import { fullName } from '../utils/format.js';

// /patients/:patientId/consultations/new  → create
// /consultations/:id/edit                 → edit
export default function ConsultationFormPage() {
  const { patientId, id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, error, reload } = useFetch(async () => {
    if (editing) {
      const { consultation } = await consultationsApi.get(id);
      return { consultation, patient: consultation.patient };
    }
    const [{ patient }, { consultations }] = await Promise.all([
      patientsApi.get(patientId),
      patientsApi.consultations(patientId),
    ]);
    return { patient, hasHistory: consultations.length > 0 };
  }, [patientId, id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { patient, consultation, hasHistory } = data;
  const backTo = editing ? `/consultations/${id}` : `/patients/${patient._id}`;

  const save = async (payload) => {
    if (editing) {
      await consultationsApi.update(id, payload);
      toast.success('Consultation updated');
      navigate(`/consultations/${id}`);
    } else {
      const res = await patientsApi.createConsultation(patient._id, payload);
      toast.success('Consultation saved');
      navigate(`/consultations/${res.consultation._id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ to: backTo, label: editing ? 'Consultation' : fullName(patient) }}
        title={editing ? 'Edit consultation' : 'New consultation'}
        subtitle="GP consultation & assessment form"
      />
      <PatientBar patient={patient} className="mb-5" />
      <ConsultationForm
        initial={
          editing
            ? consultationToForm(consultation)
            : newConsultation({ patient, clinician: user?.name || '', hasHistory })
        }
        submitLabel={editing ? 'Save changes' : 'Save consultation'}
        onSave={save}
        onCancel={() => navigate(backTo)}
      />
    </div>
  );
}
