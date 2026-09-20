import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PiPencilSimple, PiPrinter, PiTrash } from 'react-icons/pi';
import { consultationsApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { usePrint } from '../context/PrintContext.jsx';
import {
  formatDate,
  formatDateTime,
  fullName,
  TYPE_LABEL,
  INVESTIGATION_LABEL,
  REFERRAL_LABEL,
} from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import Badge from '../components/ui/Badge.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { DetailList, DetailItem } from '../components/ui/Detail.jsx';
import { Spinner, ErrorState } from '../components/ui/States.jsx';
import PatientBar from '../components/consultations/PatientBar.jsx';

const VITALS = [
  ['bp', 'BP', 'mmHg'],
  ['pulse', 'Pulse', 'bpm'],
  ['temp', 'Temp', '°C'],
  ['spo2', 'SpO₂', '%'],
  ['weight', 'Weight', 'kg'],
];

const chips = (values = [], labels, other) =>
  values.length ? (
    <span className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <Badge key={v} tone={v === 'none' ? 'neutral' : 'gold'}>
          {v === 'other' && other ? `Other: ${other}` : labels[v]}
        </Badge>
      ))}
    </span>
  ) : null;

export default function ConsultationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { print } = usePrint();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => consultationsApi.get(id), [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const c = data.consultation;
  const p = c.patient;
  const v = c.vitals || {};
  const rx = c.prescription || {};
  const hasVitals = VITALS.some(([k]) => v[k]) || v.other;

  const remove = async () => {
    setDeleting(true);
    try {
      await consultationsApi.remove(id);
      toast.success('Consultation deleted');
      navigate(`/patients/${p._id}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ to: `/patients/${p._id}`, label: fullName(p) }}
        title="Consultation"
        subtitle={`${formatDateTime(c.consultationDate)} · ${c.clinician}`}
        actions={
          <>
            <Button variant="secondary" icon={PiPencilSimple} to={`/consultations/${id}/edit`}>
              Edit
            </Button>
            <Button variant="secondary" icon={PiPrinter} onClick={() => print('consultation', c)}>
              Print
            </Button>
            <Button variant="dangerGhost" icon={PiTrash} onClick={() => setConfirmDelete(true)} aria-label="Delete consultation">
              <span className="sr-only sm:not-sr-only">Delete</span>
            </Button>
          </>
        }
      />

      <PatientBar patient={p} className="mb-5" />

      <div className="space-y-5">
        <Panel step={1} title="Consultation details">
          <DetailList cols={2}>
            <DetailItem label="Date & time">{formatDateTime(c.consultationDate)}</DetailItem>
            <DetailItem label="GP / clinician">{c.clinician}</DetailItem>
            <DetailItem label="Type">
              {TYPE_LABEL[c.consultationType]}
              {c.consultationType === 'other' && c.consultationTypeOther ? `: ${c.consultationTypeOther}` : ''}
            </DetailItem>
          </DetailList>
        </Panel>

        <Panel step={2} title="Presenting complaint">
          <DetailList>
            <DetailItem label="Main complaint / reason for attendance" multiline>
              {c.mainComplaint}
            </DetailItem>
            <DetailItem label="History of presenting complaint" multiline>
              {c.historyOfPresentingComplaint}
            </DetailItem>
          </DetailList>
        </Panel>

        <Panel step={3} title="Relevant history">
          <DetailList cols={2}>
            <DetailItem label="Past medical history" multiline>
              {c.pastMedicalHistory}
            </DetailItem>
            <DetailItem label="Surgical history" multiline>
              {c.surgicalHistory}
            </DetailItem>
            <DetailItem label="Current medications" multiline>
              {c.currentMedications}
            </DetailItem>
            <DetailItem label="Allergies">
              {c.allergyStatus === 'none' && 'None known'}
              {c.allergyStatus === 'yes' && (
                <span className="font-semibold text-danger">{c.allergyDetails || 'Yes'}</span>
              )}
            </DetailItem>
            <DetailItem label="Family / social history" multiline wide>
              {c.familySocialHistory}
            </DetailItem>
          </DetailList>
        </Panel>

        <Panel step={4} title="Examination & observations">
          <DetailList>
            <DetailItem label="Observations / vitals">
              {hasVitals && (
                <span className="flex flex-wrap gap-x-6 gap-y-2">
                  {VITALS.filter(([k]) => v[k]).map(([k, label, unit]) => (
                    <span key={k}>
                      <span className="text-muted">{label} </span>
                      <span className="font-semibold tabular-nums">{v[k]}</span>
                      <span className="text-sm text-muted"> {unit}</span>
                    </span>
                  ))}
                  {v.other && (
                    <span>
                      <span className="text-muted">Other </span>
                      <span className="font-semibold">{v.other}</span>
                    </span>
                  )}
                </span>
              )}
            </DetailItem>
            <DetailItem label="Clinical examination / findings" multiline>
              {c.examinationFindings}
            </DetailItem>
          </DetailList>
        </Panel>

        <Panel step={5} title="Assessment & plan">
          <DetailList>
            <DetailItem label="Diagnosis / clinical impression" multiline>
              {c.diagnosis}
            </DetailItem>
            <DetailItem label="Treatment / advice / management plan" multiline>
              {c.managementPlan}
            </DetailItem>
            <DetailItem label="Investigations requested">
              {chips(c.investigations, INVESTIGATION_LABEL, c.investigationsOther)}
            </DetailItem>
            <DetailItem label="Referral">{chips(c.referral, REFERRAL_LABEL, c.referralOther)}</DetailItem>
            <DetailItem label="Follow-up / review">{c.followUp}</DetailItem>
          </DetailList>
        </Panel>

        <Panel step={6} title="Prescription">
          <DetailList>
            <DetailItem label="Medication / prescription" multiline>
              {rx.medication}
            </DetailItem>
            <DetailItem label="Dose / frequency / duration">{rx.dose}</DetailItem>
            <DetailItem label="Prescriber signature">{rx.prescriberSignature}</DetailItem>
          </DetailList>
        </Panel>

        <Panel step={7} title="Additional notes">
          <DetailList cols={2}>
            <DetailItem label="Notes" multiline wide>
              {c.notes}
            </DetailItem>
            <DetailItem label="Clinician signature">{c.clinicianSignature}</DetailItem>
            <DetailItem label="Date">{c.signatureDate && formatDate(c.signatureDate)}</DetailItem>
          </DetailList>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this consultation?"
        message="This permanently removes the consultation record. This cannot be undone."
        confirmLabel="Delete consultation"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
