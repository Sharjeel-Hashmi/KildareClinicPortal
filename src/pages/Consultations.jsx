import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiMagnifyingGlass, PiStethoscope, PiX, PiCaretRight } from 'react-icons/pi';
import { consultationsApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { formatDate, formatTime, fullName, TYPE_LABEL } from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States.jsx';

export default function Consultations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounce(search.trim(), 300);

  useEffect(() => setPage(1), [term]);

  const { data, loading, error, reload } = useFetch(
    () => consultationsApi.list({ search: term || undefined, page, limit: 10 }),
    [term, page],
    { keepPrevious: true }
  );
  const rows = data?.consultations || [];

  return (
    <>
      <PageHeader
        title="Consultations"
        subtitle={data ? `${data.total} recorded` : 'Every recorded visit'}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line p-4">
          <label htmlFor="consult-search" className="sr-only">
            Search consultations
          </label>
          <div className="relative max-w-md">
            <PiMagnifyingGlass
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="consult-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, complaint or diagnosis"
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
            icon={PiStethoscope}
            title={term ? 'No consultations match your search' : 'No consultations yet'}
            message={
              term
                ? 'Try a different name, complaint or diagnosis.'
                : 'Open a patient and choose New consultation to record the first visit.'
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
                  <th scope="col" className="px-5 py-3 font-semibold">Date & time</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Patient</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Main complaint</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Clinician</th>
                  <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => navigate(`/consultations/${c._id}`)}
                    className="group cursor-pointer transition-colors hover:bg-gold-50/60"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-[15px]">
                      <Link
                        to={`/consultations/${c._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold underline-offset-2 hover:underline"
                      >
                        {formatDate(c.consultationDate)}
                      </Link>
                      <span className="ml-2 tabular-nums text-muted">{formatTime(c.consultationDate)}</span>
                    </td>
                    <td className="px-3 py-3 text-[15px]">
                      <span className="block font-medium">{fullName(c.patient)}</span>
                      <span className="block text-sm text-muted">{c.patient?.patientNo}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={c.consultationType === 'new' ? 'gold' : 'neutral'}>
                        {TYPE_LABEL[c.consultationType]}
                      </Badge>
                    </td>
                    <td className="max-w-[16rem] truncate px-3 py-3 text-[15px]">{c.mainComplaint}</td>
                    <td className="px-3 py-3 text-[15px] text-muted">{c.clinician}</td>
                    <td className="px-3 py-3 text-muted">
                      <PiCaretRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {rows.map((c) => (
                <li key={c._id}>
                  <Link to={`/consultations/${c._id}`} className="block px-4 py-3.5 active:bg-gold-50">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold">{fullName(c.patient)}</span>
                      <Badge tone={c.consultationType === 'new' ? 'gold' : 'neutral'}>
                        {TYPE_LABEL[c.consultationType]}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-sm">{c.mainComplaint}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {formatDate(c.consultationDate)} · {formatTime(c.consultationDate)} · {c.clinician}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} noun="consultations" />
          </div>
        )}
      </div>
    </>
  );
}
