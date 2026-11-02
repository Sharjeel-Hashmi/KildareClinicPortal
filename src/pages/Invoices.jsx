import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PiMagnifyingGlass, PiReceipt, PiX, PiCaretRight } from 'react-icons/pi';
import { doctorsApi, invoicesApi } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdminLike, isSuperAdmin } from '../utils/roles.js';
import { eur } from '../utils/money.js';
import { SelectField } from '../components/ui/Field.jsx';
import ExpensesTab from '../components/invoices/ExpensesTab.jsx';
import ReportsTab from '../components/invoices/ReportsTab.jsx';
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

function InvoiceList() {
  const { user } = useAuth();
  const admin = isAdminLike(user);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // filters that can arrive from the Reports tab (a doctor's invoices for a month / year)
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const doctorName = params.get('doctorName') || '';
  const [doctorId, setDoctorId] = useState(params.get('doctorId') || '');
  const doctors = useFetch(() => (admin ? doctorsApi.list() : Promise.resolve(null)), [admin]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounce(search.trim(), 300);

  useEffect(() => setPage(1), [term, doctorId, from, to]);

  const clearRange = () => {
    setDoctorId('');
    setParams({});
  };

  const { data, loading, error, reload } = useFetch(
    () =>
      invoicesApi.list({
        search: term || undefined,
        page,
        limit: 10,
        doctorId: admin && doctorId ? doctorId : undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [term, page, doctorId, from, to, admin],
    { keepPrevious: true }
  );
  const rows = data?.invoices || [];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {(from || to) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-gold-50 px-4 py-2.5 text-sm">
            <span className="font-medium">
              Showing {doctorName ? `${doctorName}’s invoices` : 'invoices'} · {formatDate(from)} – {formatDate(to)}
            </span>
            <button type="button" onClick={clearRange} className="font-semibold text-gold-700 hover:underline">
              Show all invoices
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-4">
          <label htmlFor="invoice-search" className="sr-only">
            Search invoices
          </label>
          <div className="relative min-w-60 max-w-md flex-1">
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
          {admin && (doctors.data?.doctors || []).length > 0 && (
            <SelectField id="invoice-doctor" label="Doctor" className="w-52" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">All doctors</option>
              {doctors.data.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </SelectField>
          )}
          {data && (
            <p className="ml-auto text-sm text-muted">
              {data.total} {data.total === 1 ? 'invoice' : 'invoices'} · <span className="font-bold text-ink tabular-nums">{eur(data.totalAmount ?? 0)}</span>
            </p>
          )}
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
                  {admin && <th scope="col" className="px-3 py-3 font-semibold">Doctor</th>}
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
                    {admin && <td className="px-3 py-3 text-[15px] text-muted">{inv.createdBy?.name || inv.takenBy || '—'}</td>}
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
                      {admin && (inv.createdBy?.name || inv.takenBy) ? ` · ${inv.createdBy?.name || inv.takenBy}` : ''}
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

const TABS = [
  { id: 'invoices', label: 'Invoices' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'reports', label: 'Reports' },
];

// Everyone sees the invoice list. The Super Admin also gets Expenses and Reports (income, expenses, profit).
export default function Invoices() {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = superAdmin && (requested === 'expenses' || requested === 'reports') ? requested : 'invoices';

  const subtitle = {
    invoices: 'Every paid invoice',
    expenses: 'Clinic expenses and receipts',
    reports: 'Income, expenses and profit',
  }[tab];

  return (
    <>
      <PageHeader title="Invoices" subtitle={subtitle} />

      {superAdmin && (
        <div role="tablist" aria-label="Invoices sections" className="mb-5 flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setParams(t.id === 'invoices' ? {} : { tab: t.id })}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[15px] font-semibold transition-colors ${
                tab === t.id ? 'border-gold-600 text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'invoices' ? <InvoiceList /> : tab === 'expenses' ? <ExpensesTab /> : <ReportsTab />}
    </>
  );
}