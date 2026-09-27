import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiMagnifyingGlass, PiReceipt, PiX, PiCaretRight } from 'react-icons/pi';
import { invoicesApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { formatDate, fullName } from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States.jsx';

const METHOD_LABEL = { cash: 'Cash', card: 'Card', online: 'Online' };
const METHOD_TONE = { cash: 'gold', card: 'info', online: 'neutral' };

export default function Invoices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounce(search.trim(), 300);

  useEffect(() => setPage(1), [term]);

  const { data, loading, error, reload } = useFetch(
    () => invoicesApi.list({ search: term || undefined, page, limit: 10 }),
    [term, page],
    { keepPrevious: true }
  );
  const rows = data?.invoices || [];

  return (
    <>
      <PageHeader title="Invoices" subtitle={data ? `${data.total} recorded` : 'Every paid invoice'} />

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line p-4">
          <label htmlFor="invoice-search" className="sr-only">
            Search invoices
          </label>
          <div className="relative max-w-md">
            <PiMagnifyingGlass
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="invoice-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient or receipt number"
              className="h-11 w-full rounded-lg border border-line-strong bg-white pl-10 pr-10 text-[15px] placeholder:text-[#7c7a71] focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink"
              >
                <PiX size={18} />
              </button>
            )}
          </div>
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={PiReceipt}
            title={term ? 'No invoices match your search' : 'No invoices yet'}
            message={
              term
                ? 'Try a different name or receipt number.'
                : 'Open a patient and choose Create invoice to record a payment.'
            }
            action={
              !term && (
                <Button variant="secondary" to="/patients">
                  Go to patients
                </Button>
              )
            }
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <table className="hidden w-full text-left md:table">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-[13px] text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Receipt no.</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Patient</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Method</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Amount €</th>
                  <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((inv) => (
                  <tr
                    key={inv._id}
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                    className="group cursor-pointer transition-colors hover:bg-gold-50/60"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-[15px]">
                      <Link
                        to={`/invoices/${inv._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold underline-offset-2 hover:underline"
                      >
                        {formatDate(inv.date)}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[15px] text-muted">{inv.receiptNumber}</td>
                    <td className="px-3 py-3 text-[15px]">
                      <span className="block font-medium">{fullName(inv.patient)}</span>
                      <span className="block text-sm text-muted">{inv.patient?.patientNo}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={METHOD_TONE[inv.paymentMethod]}>{METHOD_LABEL[inv.paymentMethod]}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right text-[15px] font-semibold tabular-nums">
                      {inv.subtotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      <PiCaretRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {rows.map((inv) => (
                <li key={inv._id}>
                  <Link to={`/invoices/${inv._id}`} className="block px-4 py-3.5 active:bg-gold-50">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold">{fullName(inv.patient)}</span>
                      <Badge tone={METHOD_TONE[inv.paymentMethod]}>{METHOD_LABEL[inv.paymentMethod]}</Badge>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {inv.receiptNumber} · {formatDate(inv.date)}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold">€{inv.subtotal.toFixed(2)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} noun="invoices" />
          </div>
        )}
      </div>
    </>
  );
}