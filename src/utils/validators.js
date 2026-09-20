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