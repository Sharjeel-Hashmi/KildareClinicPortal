import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PiPrinter, PiTrash } from 'react-icons/pi';
import { certificatesApi } from '../api/services.js';
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

const CERT_LABEL = { unfit: 'Unfit for work', fit: 'Fit for work' };

export default function CertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { print } = usePrint();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => certificatesApi.get(id), [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const c = data.certificate;
  const p = c.patient;

  const remove = async () => {
    setDeleting(true);
    try {
      await certificatesApi.remove(id);
      toast.success('Medical certificate deleted');
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
        title="Medical certificate"
        subtitle={formatDate(c.dateOfConsultation)}
        actions={
          <>
            <Button variant="secondary" icon={PiPrinter} onClick={() => print('certificate', c)}>
              Print
            </Button>
            <Button variant="dangerGhost" icon={PiTrash} onClick={() => setConfirmDelete(true)} aria-label="Delete certificate">
              <span className="sr-only sm:not-sr-only">Delete</span>
            </Button>
          </>
        }
      />

      <PatientBar patient={p} className="mb-5" />

      <Panel title="Medical certificate">
        <DetailList cols={2}>
          <DetailItem label="Date of consultation">{formatDate(c.dateOfConsultation)}</DetailItem>
          <DetailItem label="Certification">{CERT_LABEL[c.certification]}</DetailItem>
          <DetailItem label="Diagnosis" wide multiline>
            {c.diagnosis}
          </DetailItem>
          <DetailItem label="Period from">{c.periodFrom ? formatDate(c.periodFrom) : ''}</DetailItem>
          <DetailItem label="Period to">{c.periodTo ? formatDate(c.periodTo) : ''}</DetailItem>
          <DetailItem label="Doctor">{c.doctorName}</DetailItem>
          <DetailItem label="IMC Registration No.">{c.doctorImc}</DetailItem>
        </DetailList>
      </Panel>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this medical certificate?"
        message="This permanently removes the certificate record. This cannot be undone."
        confirmLabel="Delete certificate"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
