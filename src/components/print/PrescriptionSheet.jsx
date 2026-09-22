import { SheetHeader, Section, Row, SheetFooter } from './parts.jsx';
import { formatDate, fullName } from '../../utils/format.js';

export default function PrescriptionSheet({ prescription: rx }) {
  const p = rx.patient || {};

  return (
    <article className="font-sans">
      <SheetHeader title="Prescription" />

      <Section n={1} title="Prescription Details">
        <Row label="Patient Name">{fullName(p)}</Row>
        <Row label="Date of Birth">{formatDate(p.dob)}</Row>
        <Row label="Date">{formatDate(rx.date)}</Row>
      </Section>

      <section className="mb-4 break-inside-avoid">
        <h2 className="mb-1.5 text-[12.5pt] font-bold">Medication</h2>
        <div className="min-h-[7.5cm] whitespace-pre-wrap border border-neutral-500 px-3 py-2.5 text-[11pt] leading-relaxed">
          {rx.medication}
        </div>
      </section>

      <p className="mt-6 text-[10.5pt]">
        <strong>Doctor&rsquo;s Name:</strong> {rx.doctorName}
      </p>
      <p className="mt-1.5 text-[10.5pt]">
        <strong>IMC No.:</strong> {rx.doctorImc}
      </p>
      <p className="mt-1.5 text-[10.5pt]">
        <strong>Signature &amp; Date:</strong> {rx.doctorName} &nbsp;&mdash;&nbsp; {formatDate(rx.date)}
      </p>

      <SheetFooter />
    </article>
  );
}
