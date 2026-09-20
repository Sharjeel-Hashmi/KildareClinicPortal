import { Link } from 'react-router-dom';
import { PiWarning } from 'react-icons/pi';
import Avatar from '../ui/Avatar.jsx';
import { fullName, formatAge, formatDate, SEX_LABEL } from '../../utils/format.js';

// Compact patient summary shown above consultation forms / records.
// Allergy warning is always visible while the doctor is documenting.
export default function PatientBar({ patient, className = '' }) {
  return (
    <div className={`rounded-xl border border-line bg-white p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Avatar patient={patient} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/patients/${patient._id}`}
            className="block truncate text-lg font-semibold leading-tight text-ink underline-offset-2 hover:underline"
          >
            {fullName(patient)}
          </Link>
          <p className="text-sm text-muted">
            {patient.patientNo} · {formatAge(patient.dob)} · Born {formatDate(patient.dob)}
            {patient.sex && <> · {SEX_LABEL[patient.sex]}</>}
          </p>
        </div>
        {patient.allergyStatus === 'yes' && (
          <p className="flex items-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-sm font-semibold text-danger">
            <PiWarning size={18} aria-hidden="true" />
            Allergy: {patient.allergyDetails || 'yes'}
          </p>
        )}
      </div>
    </div>
  );
}
