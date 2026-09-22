// Mirrors the server-side rules so people get instant feedback (the server re-checks everything)
export const EMAIL_RX = /^\S+@\S+\.\S+$/;

export function validatePatient(v) {
  const e = {};
  if (!v.surname.trim()) e.surname = 'Enter the surname';
  if (!v.firstName.trim()) e.firstName = 'Enter the first name(s)';
  if (!v.dob) e.dob = 'Enter the date of birth';
  else if (new Date(v.dob) > new Date()) e.dob = 'Date of birth cannot be in the future';
  if (!v.phone.trim()) e.phone = 'Enter a mobile or telephone number';
  if (v.email.trim() && !EMAIL_RX.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (v.allergyStatus === 'yes' && !v.allergyDetails.trim()) e.allergyDetails = 'Describe the allergy';
  if (v.preferredContact === 'other' && !v.preferredContactOther.trim())
    e.preferredContactOther = 'Say how to contact the patient';
  return e;
}

export function validateConsultation(v) {
  const e = {};
  if (!v.consultationDate) e.consultationDate = 'Enter the date and time of the consultation';
  if (!v.clinician.trim()) e.clinician = 'Enter the GP / clinician';
  if (!v.mainComplaint.trim()) e.mainComplaint = 'Enter the main complaint or reason for attendance';
  if (v.allergyStatus === 'yes' && !v.allergyDetails.trim()) e.allergyDetails = 'Describe the allergy';
  return e;
}

export function validatePrescription(v) {
  const e = {};
  if (!v.date) e.date = 'Enter the date';
  if (!v.medication.trim()) e.medication = 'Enter the medication';
  return e;
}

export function validateCertificate(v) {
  const e = {};
  if (!v.dateOfConsultation) e.dateOfConsultation = 'Enter the date of consultation';
  if (!v.certification) e.certification = 'Select fit or unfit for work';
  if (v.periodFrom && v.periodTo && v.periodFrom > v.periodTo) e.periodTo = 'End date cannot be before the start date';
  return e;
}

// Doctor account created / edited by the Super Admin
export function validateDoctorAccount(v, { editing }) {
  const e = {};
  if (!v.name.trim()) e.name = 'Enter the full name';
  if (!v.email.trim()) e.email = 'Enter an email address';
  else if (!EMAIL_RX.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (v.role === 'doctor' && !v.imcNumber.trim()) e.imcNumber = 'Enter the IMC registration number';
  if (!editing && (!v.password || v.password.length < 8)) e.password = 'Enter a password of at least 8 characters';
  if (editing && v.password && v.password.length < 8) e.password = 'Password must be at least 8 characters';
  return e;
}

// "My profile" — the signed-in user editing their own account
export function validateProfile(v) {
  const e = {};
  if (!v.name.trim()) e.name = 'Enter your full name';
  if (!v.email.trim()) e.email = 'Enter an email address';
  else if (!EMAIL_RX.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (v.role === 'doctor' && !v.imcNumber.trim()) e.imcNumber = 'Enter your IMC registration number';
  if (v.password && v.password.length < 8) e.password = 'Password must be at least 8 characters';
  return e;
}