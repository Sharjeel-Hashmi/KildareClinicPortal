import { SheetHeader, Section, Row, SheetFooter } from './parts.jsx';
import { formatDate, fullName, REFERRAL_LABEL } from '../../utils/format.js';

export default function ReferralSheet({ referral: rf }) {
  const p = rf.patient || {};

  return (
    <article className="font-sans">
      <SheetHeader title="Referral Letter" />

      <Section n={1} title="Referral Details">
        <Row label="Patient Name">{fullName(p)}</Row>
        <Row label="Date of Birth">{formatDate(p.dob)}</Row>
        <Row label="Date">{formatDate(rf.date)}</Row>
        <Row label="Referred To">
          {REFERRAL_LABEL[rf.referralType]}
          {rf.referredTo ? ` — ${rf.referredTo}` : ''}
        </Row>
      </Section>

      <section className="mb-4 break-inside-avoid">
        <h2 className="mb-1.5 text-[12.5pt] font-bold">Letter</h2>
        <div className="min-h-[9cm] whitespace-pre-wrap border border-neutral-500 px-3 py-2.5 text-[11pt] leading-relaxed">
          {rf.letter}
        </div>
      </section>

      <p className="mt-6 text-[10.5pt]">
        <strong>Doctor&rsquo;s Name:</strong> {rf.doctorName}
      </p>
      <p className="mt-1.5 text-[10.5pt]">
        <strong>IMC No.:</strong> {rf.doctorImc}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-[10.5pt]">
        <strong>Signature &amp; Date:</strong>
        {rf.doctorSignatureUrl ? (
          <img src={rf.doctorSignatureUrl} alt="Doctor's signature" className="h-10 w-auto object-contain" />
        ) : (
          rf.doctorName
        )}
        &nbsp;&mdash;&nbsp; {formatDate(rf.date)}
      </p>

      <SheetFooter />
    </article>
  );
}