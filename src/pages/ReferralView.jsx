import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PiPrinter, PiTrash } from 'react-icons/pi';
import { referralsApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { usePrint } from '../context/PrintContext.jsx';
import { formatDate, fullName, REFERRAL_LABEL } from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isSuperAdmin } from '../utils/roles.js';
import { DetailList, DetailItem } from '../components/ui/Detail.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';

export default function ReferralView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { print } = usePrint();
  const { user } = useAuth();
  const canDelete = isSuperAdmin(user); // deleting is Super Admin only
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => referralsApi.get(id), [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rx = data.referral;
  const p = rx.patient;

  const remove = async () => {
    setDeleting(true);
    try {
      await referralsApi.remove(id);
      toast.success('Referral deleted');
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
        title="Referral letter"
        subtitle={formatDate(rx.date)}
        actions={
          <>
            <Button variant="secondary" icon={PiPrinter} onClick={() => print('referral', rx)}>
              Print
            </Button>
            {canDelete && (
              <Button variant="dangerGhost" icon={PiTrash} onClick={() => setConfirmDelete(true)} aria-label="Delete referral">
                <span className="sr-only sm:not-sr-only">Delete</span>
              </Button>
            )}
          </>
        }
      />

      <PatientBar patient={p} className="mb-5" />

      <Panel title="Referral letter">
        <DetailList cols={2}>
          <DetailItem label="Date">{formatDate(rx.date)}</DetailItem>
          <DetailItem label="Referred to">
            {REFERRAL_LABEL[rx.referralType]}
            {rx.referredTo ? ` — ${rx.referredTo}` : ''}
          </DetailItem>
          <DetailItem label="Letter" wide multiline>
            {rx.letter}
          </DetailItem>
          <DetailItem label="Doctor">{rx.doctorName}</DetailItem>
          <DetailItem label="IMC No.">{rx.doctorImc}</DetailItem>
        </DetailList>
      </Panel>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this referral?"
        message="This permanently removes the referral record. This cannot be undone."
        confirmLabel="Delete referral"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}