import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PiPrinter, PiTrash } from 'react-icons/pi';
import { prescriptionsApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { usePrint } from '../context/PrintContext.jsx';
import { formatDate, fullName } from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { DetailList, DetailItem } from '../components/ui/Detail.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';

export default function PrescriptionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { print } = usePrint();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => prescriptionsApi.get(id), [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rx = data.prescription;
  const p = rx.patient;

  const remove = async () => {
    setDeleting(true);
    try {
      await prescriptionsApi.remove(id);
      toast.success('Prescription deleted');
      navigate(`/patients/${p._id}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: `/patients/${p._id}`, label: fullName(p) }}
        title="Prescription"
        subtitle={formatDate(rx.date)}
        actions={
          <>
            <Button variant="secondary" icon={PiPrinter} onClick={() => print('prescription', rx)}>
              Print
            </Button>
            <Button variant="dangerGhost" icon={PiTrash} onClick={() => setConfirmDelete(true)} aria-label="Delete prescription">
              <span className="sr-only sm:not-sr-only">Delete</span>
            </Button>
          </>
        }
      />

      <PatientBar patient={p} className="mb-5" />

      <Panel title="Prescription">
        <DetailList cols={2}>
          <DetailItem label="Date">{formatDate(rx.date)}</DetailItem>
          <DetailItem label="Medication" wide multiline>
            {rx.medication}
          </DetailItem>
          <DetailItem label="Doctor">{rx.doctorName}</DetailItem>
          <DetailItem label="IMC No.">{rx.doctorImc}</DetailItem>
        </DetailList>
      </Panel>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this prescription?"
        message="This permanently removes the prescription record. This cannot be undone."
        confirmLabel="Delete prescription"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
