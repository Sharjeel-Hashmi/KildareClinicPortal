import api from './client.js';

const data = (res) => res.data;

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(data),
  me: () => api.get('/auth/me').then(data),
  updateMe: (body) => api.put('/auth/me', body).then(data),
  logout: (reason) => api.post('/auth/logout', reason ? { reason } : {}).then(data),
};

export const patientsApi = {
  list: (params) => api.get('/patients', { params }).then(data),
  get: (id) => api.get(`/patients/${id}`).then(data),
  create: (body) => api.post('/patients', body).then(data),
  update: (id, body) => api.put(`/patients/${id}`, body).then(data),
  remove: (id) => api.delete(`/patients/${id}`).then(data),
  consultations: (id) => api.get(`/patients/${id}/consultations`).then(data),
  createConsultation: (id, body) => api.post(`/patients/${id}/consultations`, body).then(data),
  prescriptions: (id) => api.get(`/patients/${id}/prescriptions`).then(data),
  createPrescription: (id, body) => api.post(`/patients/${id}/prescriptions`, body).then(data),
  referrals: (id) => api.get(`/patients/${id}/referrals`).then(data),
  createReferral: (id, body) => api.post(`/patients/${id}/referrals`, body).then(data),
  certificates: (id) => api.get(`/patients/${id}/certificates`).then(data),
  createCertificate: (id, body) => api.post(`/patients/${id}/certificates`, body).then(data),
  reports: (id) => api.get(`/patients/${id}/reports`).then(data),
  createReport: (id, body) => api.post(`/patients/${id}/reports`, body).then(data),
  invoices: (id) => api.get(`/patients/${id}/invoices`).then(data),
  createInvoice: (id, body) => api.post(`/patients/${id}/invoices`, body).then(data),
};

export const consultationsApi = {
  list: (params) => api.get('/consultations', { params }).then(data),
  get: (id) => api.get(`/consultations/${id}`).then(data),
  update: (id, body) => api.put(`/consultations/${id}`, body).then(data),
  remove: (id) => api.delete(`/consultations/${id}`).then(data),
};

export const prescriptionsApi = {
  get: (id) => api.get(`/prescriptions/${id}`).then(data),
  remove: (id) => api.delete(`/prescriptions/${id}`).then(data),
};

export const referralsApi = {
  get: (id) => api.get(`/referrals/${id}`).then(data),
  remove: (id) => api.delete(`/referrals/${id}`).then(data),
};

export const certificatesApi = {
  get: (id) => api.get(`/certificates/${id}`).then(data),
  remove: (id) => api.delete(`/certificates/${id}`).then(data),
};

export const medicinesApi = {
  list: () => api.get('/medicines').then(data),
  create: (body) => api.post('/medicines', body).then(data),
  update: (id, body) => api.put(`/medicines/${id}`, body).then(data),
  remove: (id) => api.delete(`/medicines/${id}`).then(data),
};

export const medicineCategoriesApi = {
  list: () => api.get('/medicine-categories').then(data),
  create: (body) => api.post('/medicine-categories', body).then(data),
  update: (id, body) => api.put(`/medicine-categories/${id}`, body).then(data),
  remove: (id) => api.delete(`/medicine-categories/${id}`).then(data),
};

export const labsApi = {
  list: () => api.get('/labs').then(data),
  create: (body) => api.post('/labs', body).then(data),
  remove: (id) => api.delete(`/labs/${id}`).then(data),
};

export const reportsApi = {
  get: (id) => api.get(`/reports/${id}`).then(data),
  remove: (id) => api.delete(`/reports/${id}`).then(data),
};

export const invoicesApi = {
  list: (params) => api.get('/invoices', { params }).then(data),
  get: (id) => api.get(`/invoices/${id}`).then(data),
  update: (id, body) => api.put(`/invoices/${id}`, body).then(data),
  remove: (id) => api.delete(`/invoices/${id}`).then(data),
};

export const servicesApi = {
  list: () => api.get('/services').then(data),
  create: (body) => api.post('/services', body).then(data),
  update: (id, body) => api.put(`/services/${id}`, body).then(data),
  remove: (id) => api.delete(`/services/${id}`).then(data),
};

export const usersApi = {
  list: () => api.get('/users').then(data),
  create: (body) => api.post('/users', body).then(data),
  update: (id, body) => api.put(`/users/${id}`, body).then(data),
  remove: (id) => api.delete(`/users/${id}`).then(data),
};

export const statsApi = {
  get: (params) => api.get('/stats', { params }).then(data),
};

// Active doctors (any signed-in user can read this: the booking form needs it)
export const doctorsApi = {
  list: () => api.get('/doctors').then(data),
};

export const appointmentsApi = {
  list: (params) => api.get('/appointments', { params }).then(data),
  get: (id) => api.get(`/appointments/${id}`).then(data),
  create: (body) => api.post('/appointments', body).then(data),
  setStatus: (id, status, reason) => api.patch(`/appointments/${id}/status`, { status, reason }).then(data),
  linkPatient: (id, patientId) => api.patch(`/appointments/${id}/patient`, { patientId }).then(data),
};

// doctorId is a doctor's id, or 'me'
export const availabilityApi = {
  get: (doctorId) => api.get(`/availability/${doctorId}`).then(data),
  save: (doctorId, body) => api.put(`/availability/${doctorId}`, body).then(data),
  slots: (doctorId, params) => api.get(`/availability/${doctorId}/slots`, { params }).then(data),
  dates: (doctorId, params) => api.get(`/availability/${doctorId}/dates`, { params }).then(data),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then(data),
  markRead: (body) => api.post('/notifications/read', body).then(data),
};

export const auditApi = {
  list: (params) => api.get('/audit', { params }).then(data),
  print: (body) => api.post('/audit/print', body).then(data),
};

// Clinic-wide settings (the print stamp). Everyone reads; only a Super Admin saves.
export const clinicSettingsApi = {
  get: () => api.get('/clinic-settings').then(data),
  update: (body) => api.put('/clinic-settings', body).then(data),
};

// Super Admin only: clinic expenses, their categories, and the income / profit summary
export const expensesApi = {
  list: (params) => api.get('/expenses', { params }).then(data),
  create: (body) => api.post('/expenses', body).then(data),
  update: (id, body) => api.put(`/expenses/${id}`, body).then(data),
  remove: (id) => api.delete(`/expenses/${id}`).then(data),
};

export const expenseCategoriesApi = {
  list: () => api.get('/expenses/categories').then(data),
  create: (body) => api.post('/expenses/categories', body).then(data),
  update: (id, body) => api.put(`/expenses/categories/${id}`, body).then(data),
  remove: (id) => api.delete(`/expenses/categories/${id}`).then(data),
};

export const financeApi = {
  summary: (params) => api.get('/finance/summary', { params }).then(data),
};