import { Link } from 'react-router-dom';
import {
  PiUsersThree,
  PiUserPlus,
  PiStethoscope,
  PiCalendarCheck,
  PiArrowRight,
  PiClipboardText,
  PiCaretRight,
  PiIdentificationCard,
} from 'react-icons/pi';
import { statsApi } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import useFetch from '../hooks/useFetch.js';
import {
  greeting,
  formatLongDate,
  formatTime,
  formatDate,
  formatAge,
  fullName,
  dayStartISO,
  monthStartISO,
  TYPE_LABEL,
} from '../utils/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Spinner, ErrorState, EmptyState } from '../components/ui/States.jsx';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-start gap-3 bg-white p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-600">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-[32px] font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1.5 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(
    () => statsApi.get({ dayStart: dayStartISO(), monthStart: monthStartISO() }),
    []
  );

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name}`}
        subtitle={formatLongDate()}
        actions={
          <Button to="/patients/new" icon={PiUserPlus} className="lg:hidden">
            New patient
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <section
            aria-label="Clinic summary"
            className="grid gap-px overflow-hidden rounded-xl border border-line bg-line grid-cols-2 lg:grid-cols-4"
          >
            <Stat icon={PiUsersThree} label="Total patients" value={data.totalPatients} />
            <Stat icon={PiUserPlus} label="Registered this month" value={data.newPatientsThisMonth} />
            <Stat icon={PiCalendarCheck} label="Consultations today" value={data.consultationsToday} />
            <Stat icon={PiStethoscope} label="Consultations this month" value={data.consultationsThisMonth} />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel
              title="Today’s consultations"
              icon={PiClipboardText}
              bodyClassName="p-0"
              action={
                <Link to="/consultations" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:underline">
                  View all <PiArrowRight size={16} aria-hidden="true" />
                </Link>
              }
            >
              {data.todaysConsultations.length === 0 ? (
                <EmptyState
                  icon={PiStethoscope}
                  title="Nothing recorded today"
                  message="Open a patient and choose New consultation to record a visit."
                  action={
                    <Button variant="secondary" to="/patients">
                      Go to patients
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {data.todaysConsultations.map((c) => (
                    <li key={c._id}>
                      <Link
                        to={`/consultations/${c._id}`}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gold-50/60"
                      >
                        <span className="w-12 shrink-0 font-display text-lg font-semibold tabular-nums">
                          {formatTime(c.consultationDate)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{fullName(c.patient)}</span>
                          <span className="block truncate text-sm text-muted">
                            {c.mainComplaint} · Seen by {c.clinician}
                          </span>
                        </span>
                        <Badge tone={c.consultationType === 'new' ? 'gold' : 'neutral'}>
                          {TYPE_LABEL[c.consultationType]}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Recently registered"
              icon={PiUserPlus}
              bodyClassName="p-0"
              action={
                <Link to="/patients" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:underline">
                  View all <PiArrowRight size={16} aria-hidden="true" />
                </Link>
              }
            >
              {data.recentPatients.length === 0 ? (
                <EmptyState icon={PiUsersThree} title="No patients yet" message="New registrations will show up here." />
              ) : (
                <ul className="divide-y divide-line">
                  {data.recentPatients.map((p) => (
                    <li key={p._id}>
                      <Link
                        to={`/patients/${p._id}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gold-50/60"
                      >
                        <Avatar patient={p} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{fullName(p)}</span>
                          <span className="block truncate text-sm text-muted">
                            {p.patientNo} · {formatAge(p.dob)} · {formatDate(p.registrationDate)}
                          </span>
                        </span>
                        <PiCaretRight size={16} className="text-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {user?.role === 'admin' && data.teamActivity && (
            <Panel
              title="Team activity"
              icon={PiIdentificationCard}
              bodyClassName="p-0"
              action={
                <Link to="/doctors" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:underline">
                  All doctors <PiArrowRight size={16} aria-hidden="true" />
                </Link>
              }
            >
              {data.teamActivity.length === 0 ? (
                <EmptyState
                  icon={PiIdentificationCard}
                  title="No doctors yet"
                  message="Add doctor accounts from the Doctors page."
                  action={
                    <Button variant="secondary" to="/doctors/new">
                      Add doctor
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {data.teamActivity.map((d) => (
                    <li key={d.id}>
                      <Link
                        to={`/doctors/${d.id}/activity`}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gold-50/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{d.name}</span>
                          <span className="block truncate text-sm text-muted">IMC {d.imcNumber || '—'}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-gold-700">
                          {d.count} {d.count === 1 ? 'patient' : 'patients'} this month
                        </span>
                        <PiCaretRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      )}
    </>
  );
}