import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PiPencilSimple,
  PiPrinter,
  PiTrash,
  PiNotePencil,
  PiAddressBook,
  PiHeartbeat,
  PiPhoneCall,
  PiIdentificationCard,
  PiStethoscope,
  PiWarning,
  PiCaretRight,
  PiCheckCircle,
} from 'react-icons/pi';
import { patientsApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { usePrint } from '../context/PrintContext.jsx';
import {
  formatDate,
  formatTime,
  formatAge,
  fullName,
  SEX_LABEL,
  CONTACT_LABEL,
  TYPE_LABEL,
} from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { DetailList, DetailItem } from '../components/ui/Detail.jsx';
import { Spinner, ErrorState, EmptyState } from '../components/ui/States.jsx';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { print } = usePrint();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patientQ = useFetch(() => patientsApi.get(id), [id]);
  const visitsQ = useFetch(() => patientsApi.consultations(id), [id]);

  if (patientQ.loading) return <Spinner />;
  if (patientQ.error) return <ErrorState message={patientQ.error} onRetry={patientQ.reload} />;

  const p = patientQ.data.patient;
  const visits = visitsQ.data?.consultations || [];
  const address = [p.addressLine1, p.addressLine2, p.eircode].filter(Boolean).join('\n');
  const ec = p.emergencyContact || {};

  const remove = async () => {
    setDeleting(true);
    try {
      await patientsApi.remove(id);
      toast.success('Patient deleted');
      navigate('/patients', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <PageHeader back={{ to: '/patients', label: 'Patients' }} title="Patient record" />

      {/* Identity header */}
      <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar patient={p} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold leading-tight sm:text-[28px]">{fullName(p)}</h2>
              <p className="mt-1 text-[15px] text-muted">
                {p.patientNo}
                {p.dob && <> · {formatAge(p.dob)}</>}
                {p.sex && <> · {SEX_LABEL[p.sex]}</>}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                Born {formatDate(p.dob)} · Registered {formatDate(p.registrationDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button to={`/patients/${id}/consultations/new`} icon={PiNotePencil}>
              New consultation
            </Button>
            <Button variant="secondary" icon={PiPencilSimple} to={`/patients/${id}/edit`}>
              Edit
            </Button>
            <Button variant="secondary" icon={PiPrinter} onClick={() => print('patient', p)}>
              Print
            </Button>
            <Button variant="dangerGhost" icon={PiTrash} onClick={() => setConfirmDelete(true)} aria-label="Delete patient">
              <span className="sr-only sm:not-sr-only">Delete</span>
            </Button>
          </div>
        </div>

        {p.allergyStatus === 'yes' && (
          <div
            role="note"
            className="mt-5 flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-50 px-4 py-3 text-[15px] text-danger"
          >
            <PiWarning size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">Allergies:</span> {p.allergyDetails || 'Yes (details not recorded)'}
            </p>
          </div>
        )}
        {p.allergyStatus === 'none' && (
          <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ok">
            <PiCheckCircle size={18} aria-hidden="true" /> No known allergies
          </p>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Consultation history first on mobile: it is the main working area */}
        <div className="order-1 lg:order-2">
          <Panel
            title={`Consultations${visitsQ.data ? ` (${visits.length})` : ''}`}
            icon={PiStethoscope}
            bodyClassName="p-0"
            action={
              <Button size="sm" to={`/patients/${id}/consultations/new`} icon={PiNotePencil}>
                New
              </Button>
            }
          >
            {visitsQ.loading ? (
              <Spinner />
            ) : visitsQ.error ? (
              <ErrorState message={visitsQ.error} onRetry={visitsQ.reload} />
            ) : visits.length === 0 ? (
              <EmptyState
                icon={PiStethoscope}
                title="No consultations yet"
                message="Record the first visit for this patient."
                action={
                  <Button to={`/patients/${id}/consultations/new`} icon={PiNotePencil}>
                    Start consultation
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {visits.map((c) => (
                  <li key={c._id}>
                    <Link
                      to={`/consultations/${c._id}`}
                      className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gold-50/60"
                    >
                      <span className="w-[4.5rem] shrink-0 text-sm leading-snug text-muted">
                        <span className="block font-semibold text-ink">{formatDate(c.consultationDate)}</span>
                        {formatTime(c.consultationDate)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge tone={c.consultationType === 'new' ? 'gold' : 'neutral'}>
                            {TYPE_LABEL[c.consultationType]}
                          </Badge>
                          <span className="truncate text-sm text-muted">{c.clinician}</span>
                        </span>
                        <span className="mt-1.5 block font-semibold text-ink">{c.mainComplaint}</span>
                        {c.diagnosis && (
                          <span className="mt-0.5 line-clamp-2 block text-sm text-muted">Dx: {c.diagnosis}</span>
                        )}
                      </span>
                      <PiCaretRight
                        size={18}
                        className="mt-1 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="order-2 space-y-6 lg:order-1">
          <Panel title="Contact" icon={PiAddressBook}>
            <DetailList cols={2}>
              <DetailItem label="Mobile / telephone">{p.phone}</DetailItem>
              <DetailItem label="Email">{p.email}</DetailItem>
              <DetailItem label="Address" multiline wide>
                {address}
              </DetailItem>
              <DetailItem label="Preferred contact">
                {p.preferredContact &&
                  (p.preferredContact === 'other'
                    ? `Other: ${p.preferredContactOther || '—'}`
                    : CONTACT_LABEL[p.preferredContact])}
              </DetailItem>
              <DetailItem label="PPSN">{p.ppsn}</DetailItem>
            </DetailList>
          </Panel>

          <Panel title="Medical background" icon={PiHeartbeat}>
            <DetailList>
              <DetailItem label="Usual GP / practice">{p.usualGp}</DetailItem>
              <DetailItem label="Medical conditions" multiline>
                {p.medicalConditions}
              </DetailItem>
              <DetailItem label="Current medication(s)" multiline>
                {p.medications}
              </DetailItem>
            </DetailList>
          </Panel>

          <Panel title="Emergency contact" icon={PiPhoneCall}>
            <DetailList cols={2}>
              <DetailItem label="Name">{ec.name}</DetailItem>
              <DetailItem label="Relationship">{ec.relationship}</DetailItem>
              <DetailItem label="Telephone">{ec.phone}</DetailItem>
            </DetailList>
          </Panel>

          <Panel title="Registration" icon={PiIdentificationCard}>
            <DetailList>
              <DetailItem label="Reason for registration">{p.reasonForRegistration}</DetailItem>
              <DetailItem label="Clinic information provided to patient">
                {p.infoProvided ? 'Yes' : 'Not recorded'}
              </DetailItem>
              <DetailItem label="Additional notes" multiline>
                {p.notes}
              </DetailItem>
            </DetailList>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this patient?"
        message={`This permanently deletes ${fullName(p)} (${p.patientNo}) and all ${visits.length} consultation record${visits.length === 1 ? '' : 's'}. This cannot be undone.`}
        confirmLabel="Delete patient"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
