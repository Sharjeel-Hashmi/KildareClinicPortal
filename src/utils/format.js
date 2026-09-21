const pad = (n) => String(n).padStart(2, '0');

// All dates in the portal are shown as DD/MM/YYYY (built by hand, so the result never
// depends on the browser's or computer's language settings).
// Date-only values (date of birth, registration date) are stored as UTC midnight,
// so they must be read in UTC or they can show as the previous day.
const dmyUTC = (d) => `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
const dmyLocal = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const hmLocal = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const timeOnly = new Intl.DateTimeFormat('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
const longDate = new Intl.DateTimeFormat('en-IE', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

const valid = (v) => v && !Number.isNaN(new Date(v).getTime());

export const formatDate = (v) => (valid(v) ? dmyUTC(new Date(v)) : '—');
export const formatDateTime = (v) => {
  if (!valid(v)) return '—';
  const d = new Date(v);
  return `${dmyLocal(d)} ${hmLocal(d)}`;
};
export const formatTime = (v) => (valid(v) ? timeOnly.format(new Date(v)) : '—');
export const formatLongDate = (v = new Date()) => longDate.format(new Date(v));

export const calcAge = (dob) => {
  if (!valid(dob)) return null;
  const b = new Date(dob);
  const now = new Date();
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < b.getUTCMonth() ||
    (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

export const formatAge = (dob) => {
  const age = calcAge(dob);
  if (age === null) return '';
  if (age >= 2) return `${age} yrs`;
  // babies: show months
  const b = new Date(dob);
  const now = new Date();
  const months = (now.getUTCFullYear() - b.getUTCFullYear()) * 12 + (now.getUTCMonth() - b.getUTCMonth());
  return `${Math.max(months, 0)} mths`;
};

export const fullName = (p) => (p ? `${p.firstName || ''} ${p.surname || ''}`.trim() : '');
export const initials = (p) =>
  p ? `${(p.firstName || '?')[0]}${(p.surname || '')[0] || ''}`.toUpperCase() : '?';

export const SEX_LABEL = { female: 'Female', male: 'Male', other: 'Other / Prefer not to say' };
export const CONTACT_LABEL = { phone: 'Phone', email: 'Email', other: 'Other' };
export const TYPE_LABEL = { new: 'New', follow_up: 'Follow-up', other: 'Other' };
export const INVESTIGATION_LABEL = { none: 'None', bloods: 'Bloods', imaging: 'Imaging', other: 'Other' };
export const REFERRAL_LABEL = { none: 'None', specialist: 'Specialist', ed_hospital: 'ED / Hospital', other: 'Other' };

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

/* ── <input> value helpers ─────────────────────────────────── */
// 'YYYY-MM-DD' in the browser's local time (for <input type="date">)
export const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// server date-only value → 'YYYY-MM-DD' (UTC, matches how it is stored)
export const toDateInput = (v) => (valid(v) ? new Date(v).toISOString().slice(0, 10) : '');

// 'YYYY-MM-DDTHH:mm' in local time (for <input type="datetime-local">)
export const toLocalInput = (v = new Date()) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const dayStartISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
export const monthStartISO = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};