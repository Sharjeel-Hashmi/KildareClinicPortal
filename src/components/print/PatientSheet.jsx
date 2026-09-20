import { SheetHeader, Section, Row, Box, SheetFooter } from './parts.jsx';
import { formatDate, SEX_LABEL } from '../../utils/format.js';

export default function PatientSheet({ patient: p }) {
  const ec = p.emergencyContact || {};
  const address = [p.addressLine1, p.addressLine2].filter(Boolean).join('\n');

  return (
    <article className="font-sans">
      <SheetHeader title="Patient Registration Form" />

      <Section n={1} title="Patient Details">
        <Row label="Patient No. / Ref.">{p.patientNo}</Row>
        <Row label="Date of Registration">{formatDate(p.registrationDate)}</Row>
        <Row label="Surname">{p.surname}</Row>
        <Row label="First Name(s)">{p.firstName}</Row>
        <Row label="Date of Birth">{formatDate(p.dob)}</Row>
        <Row label="Sex">
          {['female', 'male', 'other'].map((s) => (
            <span key={s} className="mr-4 inline-block">
              <Box checked={p.sex === s} />
              {SEX_LABEL[s]}
            </span>
          ))}
        </Row>
        <Row label="PPSN (if required)">{p.ppsn}</Row>
        <Row label="Address">{address}</Row>
        <Row label="Eircode">{p.eircode}</Row>
        <Row label="Mobile / Telephone">{p.phone}</Row>
        <Row label="Email">{p.email}</Row>
      </Section>

      <Section n={2} title="GP & Medical Information">
        <Row label="Usual GP / GP Practice">{p.usualGp}</Row>
        <Row label="Previous / Relevant Medical Conditions">{p.medicalConditions}</Row>
        <Row label="Current Medication(s)">{p.medications}</Row>
        <Row label="Allergies">
          <span className="mr-4 inline-block">
            <Box checked={p.allergyStatus === 'none'} />
            None known
          </span>
          <span className="inline-block">
            <Box checked={p.allergyStatus === 'yes'} />
            Yes{p.allergyStatus === 'yes' && p.allergyDetails ? `: ${p.allergyDetails}` : ''}
          </span>
        </Row>
      </Section>

      <Section n={3} title="Emergency Contact">
        <Row label="Name">{ec.name}</Row>
        <Row label="Relationship">{ec.relationship}</Row>
        <Row label="Telephone">{ec.phone}</Row>
      </Section>

      <Section n={4} title="Registration / Administrative">
        <Row label="Reason for Registration">{p.reasonForRegistration}</Row>
        <Row label="Consent / Information Provided">
          <Box checked={p.infoProvided} />
          Relevant clinic information provided to patient
        </Row>
        <Row label="Preferred Contact Method">
          <span className="mr-4 inline-block">
            <Box checked={p.preferredContact === 'phone'} />
            Phone
          </span>
          <span className="mr-4 inline-block">
            <Box checked={p.preferredContact === 'email'} />
            Email
          </span>
          <span className="inline-block">
            <Box checked={p.preferredContact === 'other'} />
            Other{p.preferredContact === 'other' && p.preferredContactOther ? `: ${p.preferredContactOther}` : ''}
          </span>
        </Row>
        <Row label="Additional Notes">{p.notes}</Row>
      </Section>

      <SheetFooter />
    </article>
  );
}
