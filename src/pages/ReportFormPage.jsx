import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientsApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';
import ReportForm from '../components/forms/ReportForm.jsx';
import { fullName } from '../utils/format.js';

// /patients/:patientId/reports/new
export default function ReportFormPage() {
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
    await patientsApi.createReport(patient._id, payload);
    toast.success('Report saved');
    navigate(backTo);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ to: backTo, label: fullName(patient) }} title="Add report" />
      <PatientBar patient={patient} className="mb-5" />
      <ReportForm onSave={save} onCancel={() => navigate(backTo)} />
    </div>
  );
}