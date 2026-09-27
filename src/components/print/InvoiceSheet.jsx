import { LogoMark } from '../ui/Logo.jsx';
import { formatDate, formatDateTime, fullName } from '../../utils/format.js';

const METHOD_LABEL = { cash: 'Cash', card: 'Card', online: 'Online' };

export default function InvoiceSheet({ invoice: inv }) {
  const p = inv.patient || {};
  const clinician = inv.createdBy?.name || inv.takenBy;

  return (
    <article className="font-sans text-[11pt] text-ink">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between rounded-lg bg-ink px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <LogoMark className="h-9 w-auto" />
          <div>
            <p className="text-[14pt] font-bold leading-tight">KILDARE GP Walk-In CLINIC</p>
            <p className="text-[8.5pt] uppercase tracking-wide text-gold-200">Private Practice · Card Receipt</p>
          </div>
        </div>
        <div className="text-right text-[9pt] leading-relaxed text-[#d8d6cc]">
          <p>Claregate Street, Kildare, R51 P635</p>
          <p>Tel (085) 867 8192</p>
          <p>info@kildaredoc.ie</p>
        </div>
      </header>

      {/* Title row */}
      <div className="mb-5 flex items-start justify-between">
        <h1 className="text-[22pt] font-bold">RECEIPT</h1>
        <div className="text-right">
          <p className="text-[8.5pt] uppercase tracking-wide text-muted">Receipt number</p>
          <p className="text-[13pt] font-bold">{inv.receiptNumber}</p>
        </div>
      </div>

      {/* Patient + Paid-at boxes */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-gold-50/60 p-4">
          <p className="mb-1.5 text-[8.5pt] font-bold uppercase tracking-wide text-gold-700">Patient</p>
          <p className="mb-2 text-[13pt] font-bold">{fullName(p)}</p>
          <div className="space-y-0.5 text-[9.5pt]">
            <p>Chart no. {p.patientNo}</p>
            <p>DOB {formatDate(p.dob)}</p>
            <p>Visit {formatDate(inv.date)}</p>
            {clinician && <p>Clinician {clinician}</p>}
          </div>
        </div>
        <div className="rounded-lg border border-line p-4">
          <table className="w-full text-[9.5pt]">
            <tbody>
              <tr>
                <td className="py-0.5 pr-3 text-muted">Paid at</td>
                <td className="py-0.5 text-right font-semibold">{formatDateTime(inv.createdAt)}</td>
              </tr>
              <tr>
                <td className="py-0.5 pr-3 text-muted">Taken by</td>
                <td className="py-0.5 text-right font-semibold">{inv.takenBy}</td>
              </tr>
              <tr>
                <td className="py-0.5 pr-3 text-muted">Method</td>
                <td className="py-0.5 text-right font-semibold">
                  {METHOD_LABEL[inv.paymentMethod]}
                  {inv.paymentMethod === 'card' && inv.cardLast4 ? ` · **** ${inv.cardLast4}` : ''}
                </td>
              </tr>
              {inv.paymentMethod === 'card' && inv.cardAuthCode && (
                <tr>
                  <td className="py-0.5 pr-3 text-muted">Auth code</td>
                  <td className="py-0.5 text-right font-semibold">{inv.cardAuthCode}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line items */}
      <table className="mb-5 w-full border-collapse text-[10pt]">
        <thead>
          <tr className="bg-ink text-white">
            <th className="px-3 py-2 text-left text-[8.5pt] font-semibold uppercase tracking-wide">Description</th>
            <th className="px-3 py-2 text-right text-[8.5pt] font-semibold uppercase tracking-wide">Amount €</th>
          </tr>
        </thead>
        <tbody>
          {inv.lineItems.map((it, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gold-50/40' : ''}>
              <td className="border-b border-line px-3 py-2.5">{it.description}</td>
              <td className="border-b border-line px-3 py-2.5 text-right tabular-nums">{it.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mb-6 ml-auto w-64 space-y-1.5 text-[10.5pt]">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{inv.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">VAT (exempt medical services)</span>
          <span>0.00</span>
        </div>
        <div className="flex justify-between border-t border-gold-500 pt-1.5 text-[13pt] font-bold text-gold-700">
          <span>AMOUNT PAID</span>
          <span>€{inv.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[9pt] text-muted">
          <span>Balance due</span>
          <span>€0.00</span>
        </div>
      </div>

      {inv.paymentMethod === 'card' && (
        <div className="mb-6 rounded-lg border border-line bg-paper/60 p-4">
          <p className="mb-2 text-[8.5pt] font-bold uppercase tracking-wide text-gold-700">Card Payment</p>
          <div className="flex items-center justify-between text-[10pt]">
            <div>
              <p>Card Debit **** **** **** {inv.cardLast4}</p>
              <p className="text-[9pt] text-muted">
                {inv.cardAuthCode && `Approved · Auth ${inv.cardAuthCode}`}
              </p>
            </div>
            <p className="font-bold">€{inv.subtotal.toFixed(2)}</p>
          </div>
        </div>
      )}

      <p className="mb-6 text-[9pt] leading-relaxed text-muted">
        Thank you. This receipt confirms payment taken in person before or at the end of the visit.
        <br />
        Refunds (if any) are returned to the same method of payment. Queries: info@kildaredoc.ie
      </p>

      <footer className="rounded-lg bg-gold-500 px-5 py-3 text-[8.5pt] text-ink">
        <p>Medical services supplied by a registered medical practitioner are exempt from VAT (VATCA 2010, Sch. 1).</p>
        <p className="mt-0.5">Kildare GP Walk-In CLINIC</p>
      </footer>
    </article>
  );
}