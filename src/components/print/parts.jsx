import { LogoMark } from '../ui/Logo.jsx';

// Paper-form building blocks that mirror the clinic's Word templates.
export const Box = ({ checked }) => <span className="mr-1 inline-block w-[1.1em]">{checked ? '☒' : '☐'}</span>;

// Receipt-style letterhead shared by every print sheet.
// `title` is the document name; the line under the clinic name follows it ("Private Practice · Prescription").
export function SheetHeader({ title }) {
  return (
    <header className="mb-5">
      <div className="flex items-center justify-between rounded-lg bg-ink px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <LogoMark className="h-9 w-auto" />
          <div>
            <p className="text-[14pt] font-bold leading-tight">KILDARE GP Walk-In CLINIC</p>
            <p className="text-[8.5pt] uppercase tracking-wide text-gold-200">Private Practice · {title}</p>
          </div>
        </div>
        <div className="text-right text-[9pt] leading-relaxed text-[#d8d6cc]">
          <p>Claregate Street, Kildare, R51 P635</p>
          <p>Tel (085) 867 8192</p>
          <p>info@kildaredoc.ie</p>
        </div>
      </div>
      <h1 className="mt-5 text-[18pt] font-bold">{title}</h1>
    </header>
  );
}

export function Section({ n, title, children }) {
  return (
    <section className="mb-4 break-inside-avoid">
      <h2 className="mb-1.5 text-[12.5pt] font-bold">
        {n}. {title}
      </h2>
      <table className="w-full border-collapse text-[10.5pt]">
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

export function Row({ label, children }) {
  return (
    <tr>
      <th className="w-[32%] border border-neutral-500 bg-neutral-100 px-2.5 py-1.5 text-left align-top font-semibold">
        {label}
      </th>
      <td className="whitespace-pre-wrap border border-neutral-500 px-2.5 py-1.5 align-top">
        {children || '\u00A0'}
      </td>
    </tr>
  );
}

export const SheetFooter = () => (
  <footer className="mt-6 text-center text-[10pt] italic">Kildare GP Walk-In CLINIC</footer>
);