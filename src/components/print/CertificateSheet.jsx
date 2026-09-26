import { SheetHeader, Section, Row, Box, SheetFooter } from './parts.jsx';
import { formatDate, fullName } from '../../utils/format.js';

export default function CertificateSheet({ certificate: c }) {
  const p = c.patient || {};

  return (
    <article className="font-sans">
      <SheetHeader title="Medical Certificate" />

      <Section n={1} title="Certificate Details">
        <Row label="Patient Name">{fullName(p)}</Row>
        <Row label="Date of Birth">{formatDate(p.dob)}</Row>
        <Row label="Date of Consultation">{formatDate(c.dateOfConsultation)}</Row>
        <Row label="Diagnosis">{c.diagnosis}</Row>
        <Row label="Certification">
          <span className="mr-4 inline-block">
            <Box checked={c.certification === 'unfit'} />
            Unfit for work
          </span>
          <span className="inline-block">
            <Box checked={c.certification === 'fit'} />
            Fit for work
          </span>
        </Row>
        <Row label="Period">
          From {formatDate(c.periodFrom)} &nbsp;&nbsp; To {formatDate(c.periodTo)}
        </Row>
      </Section>

      <p className="mt-6 text-[10.5pt]">
        <strong>Doctor&rsquo;s Name:</strong> {c.doctorName}
      </p>
      <p className="mt-1.5 text-[10.5pt]">
        <strong>IMC Registration No.:</strong> {c.doctorImc}
      </p>
      <p className="mt-1.5 text-[10.5pt]">
        <strong>Doctor&rsquo;s Signature:</strong>
      </p>
      {c.doctorSignatureUrl ? (
        <img src={c.doctorSignatureUrl} alt="Doctor's signature" className="mt-1 h-10 w-auto object-contain" />
      ) : (
        <p className="mt-1 text-[10.5pt]">{c.doctorName}</p>
      )}
      <p className="mt-1.5 text-[10.5pt]">
        <strong>Date:</strong> {formatDate(c.dateOfConsultation)}
      </p>

      <SheetFooter />
    </article>
  );
}