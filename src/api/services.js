import api from './client.js';

const data = (res) => res.data;

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(data),
  me: () => api.get('/auth/me').then(data),
  updateMe: (body) => api.put('/auth/me', body).then(data),
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
  certificates: (id) => api.get(`/patients/${id}/certificates`).then(data),
  createCertificate: (id, body) => api.post(`/patients/${id}/certificates`, body).then(data),
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

export const certificatesApi = {
  get: (id) => api.get(`/certificates/${id}`).then(data),
  remove: (id) => api.delete(`/certificates/${id}`).then(data),
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
