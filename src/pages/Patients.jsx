import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiUserPlus, PiMagnifyingGlass, PiUsersThree, PiX, PiCaretRight } from 'react-icons/pi';
import { patientsApi } from '../api/services.js';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { formatDate, formatAge, fullName } from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States.jsx';

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounce(search.trim(), 300);

  useEffect(() => setPage(1), [term]);

  const { data, loading, error, reload } = useFetch(
    () => patientsApi.list({ search: term || undefined, page, limit: 10 }),
    [term, page],
    { keepPrevious: true }
  );

  const patients = data?.patients || [];
  const open = (id) => navigate(`/patients/${id}`);

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={data ? `${data.total} registered` : 'All registered patients'}
        actions={
          <Button to="/patients/new" icon={PiUserPlus}>
            Add patient
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line p-4">
          <label htmlFor="patient-search" className="sr-only">
            Search patients
          </label>
          <div className="relative max-w-md">
            <PiMagnifyingGlass
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, patient no. or phone"
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
        ) : patients.length === 0 ? (
          <EmptyState
            icon={PiUsersThree}
            title={term ? 'No patients match your search' : 'No patients yet'}
            message={
              term
                ? 'Check the spelling, or try a phone number or patient no.'
                : 'Register your first patient to start building the clinic’s records.'
            }
            action={
              !term && (
                <Button to="/patients/new" icon={PiUserPlus}>
                  Add patient
                </Button>
              )
            }
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Desktop table */}
            <table className="hidden w-full text-left md:table">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-[13px] font-semibold text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">Patient</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Ref.</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Date of birth</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Phone</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Registered</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Visits</th>
                  <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {patients.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => open(p._id)}
                    className="group cursor-pointer transition-colors hover:bg-gold-50/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar patient={p} size="sm" />
                        <Link
                          to={`/patients/${p._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-ink underline-offset-2 hover:underline"
                        >
                          {fullName(p)}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[15px] tabular-nums text-muted">{p.patientNo}</td>
                    <td className="px-3 py-3 text-[15px]">
                      {formatDate(p.dob)}
                      <span className="ml-1.5 text-muted">({formatAge(p.dob)})</span>
                    </td>
                    <td className="px-3 py-3 text-[15px]">{p.phone || '—'}</td>
                    <td className="px-3 py-3 text-[15px]">{formatDate(p.registrationDate)}</td>
                    <td className="px-3 py-3 text-right">
                      {p.consultationCount ? (
                        <Badge tone="gold">{p.consultationCount}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted">
                      <PiCaretRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {patients.map((p) => (
                <li key={p._id}>
                  <Link to={`/patients/${p._id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-gold-50">
                    <Avatar patient={p} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{fullName(p)}</span>
                      <span className="block truncate text-sm text-muted">
                        {p.patientNo} · {formatAge(p.dob)} · {p.phone || 'No phone'}
                      </span>
                    </span>
                    <PiCaretRight size={18} className="text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} noun="patients" />
          </div>
        )}
      </div>
    </>
  );
}
