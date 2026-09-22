import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PiMagnifyingGlass, PiStethoscope, PiX, PiCaretRight } from 'react-icons/pi';
import { consultationsApi, usersApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { formatDate, formatTime, fullName, TYPE_LABEL } from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Badge from '../components/ui/Badge.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { SkeletonRows, EmptyState, ErrorState, Spinner } from '../components/ui/States.jsx';

// /doctors/:id/activity — every patient this doctor has seen, most recent first
export default function DoctorActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounce(search.trim(), 300);

  useEffect(() => setPage(1), [term]);

  const usersQ = useFetch(() => usersApi.list(), []);
  const doctor = usersQ.data?.users.find((u) => u.id === id);

  const { data, loading, error, reload } = useFetch(
    () => consultationsApi.list({ doctorId: id, search: term || undefined, page, limit: 10 }),
    [id, term, page],
    { keepPrevious: true }
  );
  const rows = data?.consultations || [];

  if (usersQ.loading) return <Spinner />;
  if (usersQ.error) return <ErrorState message={usersQ.error} onRetry={usersQ.reload} />;
  if (!doctor) return <ErrorState message="This account could not be found." onRetry={usersQ.reload} />;

  return (
    <>
      <PageHeader
        back={{ to: '/doctors', label: 'Doctors' }}
        title={`${doctor.name}’s activity`}
        subtitle={data ? `${data.total} patients seen` : `IMC ${doctor.imcNumber || '—'}`}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line p-4">
          <label htmlFor="activity-search" className="sr-only">
            Search this doctor's patients
          </label>
          <div className="relative max-w-md">
            <PiMagnifyingGlass
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="activity-search"
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
            title={term ? 'No consultations match your search' : 'No patients seen yet'}
            message={term ? 'Try a different name, complaint or diagnosis.' : 'Consultations this doctor records will show up here.'}
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Desktop table */}
            <table className="hidden w-full text-left md:table">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-[13px] text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">Date & time</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Patient</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Main complaint</th>
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
                    <td className="max-w-[18rem] truncate px-3 py-3 text-[15px]">{c.mainComplaint}</td>
                    <td className="px-3 py-3 text-muted">
                      <PiCaretRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
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
                      {formatDate(c.consultationDate)} · {formatTime(c.consultationDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} noun="patients seen" />
          </div>
        )}
      </div>
    </>
  );
}