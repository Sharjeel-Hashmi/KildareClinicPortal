import { SheetHeader, Section, Row, Box, SheetFooter } from './parts.jsx';
import { formatDate, formatDateTime, fullName } from '../../utils/format.js';

const Checks = ({ options, values = [], other }) =>
  options.map(([value, label]) => (
    <span key={value} className="mr-4 inline-block">
      <Box checked={values.includes(value)} />
      {label}
      {value === 'other' && values.includes('other') && other ? `: ${other}` : ''}
    </span>
  ));

export default function ConsultationSheet({ consultation: c }) {
  const p = c.patient || {};
  const v = c.vitals || {};
  const rx = c.prescription || {};

  return (
    <article className="font-sans">
      <SheetHeader title="GP Consultation & Assessment Form" />

      <Section n={1} title="Consultation Details">
        <Row label="Patient No. / Ref.">{p.patientNo}</Row>
        <Row label="Patient Name">{fullName(p)}</Row>
        <Row label="Date of Birth">{formatDate(p.dob)}</Row>
        <Row label="Consultation Date & Exact Time">{formatDateTime(c.consultationDate)}</Row>
        <Row label="GP / Clinician">{c.clinician}</Row>
        <Row label="Consultation Type">
          <Checks
            options={[['new', 'New'], ['follow_up', 'Follow-up'], ['other', 'Other']]}
            values={[c.consultationType]}
            other={c.consultationTypeOther}
          />
        </Row>
      </Section>

      <Section n={2} title="Presenting Complaint">
        <Row label="Main Complaint / Reason for Attendance">{c.mainComplaint}</Row>
        <Row label="History of Presenting Complaint">{c.historyOfPresentingComplaint}</Row>
      </Section>

      <Section n={3} title="Relevant History">
        <Row label="Past Medical History">{c.pastMedicalHistory}</Row>
        <Row label="Surgical History">{c.surgicalHistory}</Row>
        <Row label="Current Medications">{c.currentMedications}</Row>
        <Row label="Allergies">
          <span className="mr-4 inline-block">
            <Box checked={c.allergyStatus === 'none'} />
            None known
          </span>
          <span className="inline-block">
            <Box checked={c.allergyStatus === 'yes'} />
            Yes{c.allergyStatus === 'yes' && c.allergyDetails ? `: ${c.allergyDetails}` : ''}
          </span>
        </Row>
        <Row label="Family / Social History">{c.familySocialHistory}</Row>
      </Section>

      <Section n={4} title="Examination & Observations">
        <Row label="Observations / Vitals">
          {`BP: ${v.bp || '—'}   Pulse: ${v.pulse || '—'}   Temp: ${v.temp || '—'}   SpO₂: ${v.spo2 || '—'}\nWeight: ${v.weight || '—'}   Other: ${v.other || '—'}`}
        </Row>
        <Row label="Clinical Examination / Findings">{c.examinationFindings}</Row>
      </Section>

      <Section n={5} title="Assessment & Plan">
        <Row label="Diagnosis / Clinical Impression">{c.diagnosis}</Row>
        <Row label="Treatment / Advice / Management Plan">{c.managementPlan}</Row>
        <Row label="Investigations Requested">
          <Checks
            options={[['none', 'None'], ['bloods', 'Bloods'], ['imaging', 'Imaging'], ['other', 'Other']]}
            values={c.investigations}
            other={c.investigationsOther}
          />
        </Row>
        <Row label="Referral">
          <Checks
            options={[['none', 'None'], ['specialist', 'Specialist'], ['ed_hospital', 'ED/Hospital'], ['other', 'Other']]}
            values={c.referral}
            other={c.referralOther}
          />
        </Row>
        <Row label="Follow-up / Review">{c.followUp}</Row>
      </Section>

      <Section n={6} title="Prescription">
        <Row label="Medication / Prescription">{rx.medication}</Row>
        <Row label="Dose / Frequency / Duration">{rx.dose}</Row>
        <Row label="Prescriber Signature">{rx.prescriberSignature}</Row>
      </Section>

      <Section n={7} title="Additional Notes">
        <Row label="Notes">{c.notes}</Row>
      </Section>

      <p className="mt-4 text-[10.5pt]">
        <strong>Clinician signature:</strong> {c.clinicianSignature || '________________________________'}
        <span className="ml-6">
          <strong>Date:</strong> {c.signatureDate ? formatDate(c.signatureDate) : '____ / ____ / ______'}
        </span>
      </p>

      <SheetFooter />
    </article>
  );
}
