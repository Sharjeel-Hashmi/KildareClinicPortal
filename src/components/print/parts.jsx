import { LogoFull } from '../ui/Logo.jsx';

// Paper-form building blocks that mirror the clinic's Word templates.
export const Box = ({ checked }) => <span className="mr-1 inline-block w-[1.1em]">{checked ? '☒' : '☐'}</span>;

export function SheetHeader({ title }) {
  return (
    <header className="mb-5 text-center">
      <LogoFull size={44} />
      <h1 className="mt-3 text-[16pt] font-bold">{title}</h1>
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
  <footer className="mt-6 text-center text-[10pt] italic">Nua Healthcare Limited</footer>
);