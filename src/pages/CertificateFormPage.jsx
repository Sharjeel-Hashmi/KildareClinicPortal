import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientsApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';
import CertificateForm from '../components/forms/CertificateForm.jsx';
import { fullName } from '../utils/format.js';

// /patients/:patientId/certificates/new
export default function CertificateFormPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const { data: patient, loading, error, reload } = useFetch(
    () => patientsApi.get(patientId).then((r) => r.patient),
    [patientId]
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const backTo = `/patients/${patient._id}`;

  const save = async (payload) => {
    const res = await patientsApi.createCertificate(patient._id, payload);
    toast.success('Medical certificate saved');
    navigate(`/certificates/${res.certificate._id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: backTo, label: fullName(patient) }}
        title="New medical certificate"
        subtitle="Doctor's name and IMC number are added automatically"
      />
      <PatientBar patient={patient} className="mb-5" />
      <CertificateForm onSave={save} onCancel={() => navigate(backTo)} />
    </div>
  );
}
