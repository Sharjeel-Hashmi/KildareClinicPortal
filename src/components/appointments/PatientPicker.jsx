import { useEffect, useState } from 'react';
import { PiMagnifyingGlass, PiX, PiUserCircle } from 'react-icons/pi';
import { patientsApi } from '../../api/services.js';
import useDebounce from '../../hooks/useDebounce.js';
import { formatDate, fullName } from '../../utils/format.js';

// Search the clinic's registered patients and pick one.
//   value: the chosen patient object (or null)   onChange(patient | null)
export default function PatientPicker({ value, onChange, error, id = 'patient-search' }) {
  const [search, setSearch] = useState('');
  const term = useDebounce(search.trim(), 300);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (value || term.length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    patientsApi
      .list({ search: term, limit: 8 })
      .then((d) => !cancelled && setResults(d.patients || []))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [term, value]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gold-600 bg-gold-50 px-3.5 py-2.5">
        <PiUserCircle size={28} className="shrink-0 text-gold-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{fullName(value)}</p>
          <p className="truncate text-sm text-muted">
            {value.patientNo} · DOB {formatDate(value.dob)}
            {value.phone ? ` · ${value.phone}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            onChange(null);
          }}
          className="rounded-md px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-white"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        Search registered patients
      </label>
      <div className="relative">
        <PiMagnifyingGlass
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          id={id}
          type="search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, patient number or phone"
          className={`h-11 w-full rounded-lg border bg-white pl-10 pr-10 text-[15px] placeholder:text-[#7c7a71] focus:outline-none focus:ring-2 [&::-webkit-search-cancel-button]:hidden ${
            error ? 'border-danger focus:ring-danger/20' : 'border-line-strong focus:border-gold-600 focus:ring-gold-500/30'
          }`}
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
      {error && <p className="mt-1.5 text-[13px] font-medium text-danger">{error}</p>}

      {term.length >= 2 && (
        <div className="mt-2 overflow-hidden rounded-lg border border-line bg-white">
          {failed ? (
            <p className="px-4 py-3 text-sm text-danger">Could not search patients. Please try again.</p>
          ) : loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No registered patient matches “{term}”.</p>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => onChange(p)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-gold-50/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{fullName(p)}</span>
                      <span className="block truncate text-sm text-muted">
                        {p.patientNo} · DOB {formatDate(p.dob)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-muted">{p.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
