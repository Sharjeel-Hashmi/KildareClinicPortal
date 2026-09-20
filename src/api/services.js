import api from './client.js';

const data = (res) => res.data;

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(data),
  me: () => api.get('/auth/me').then(data),
};

export const patientsApi = {
  list: (params) => api.get('/patients', { params }).then(data),
  get: (id) => api.get(`/patients/${id}`).then(data),
  create: (body) => api.post('/patients', body).then(data),
  update: (id, body) => api.put(`/patients/${id}`, body).then(data),
  remove: (id) => api.delete(`/patients/${id}`).then(data),
  consultations: (id) => api.get(`/patients/${id}/consultations`).then(data),
  createConsultation: (id, body) => api.post(`/patients/${id}/consultations`, body).then(data),
};

export const consultationsApi = {
  list: (params) => api.get('/consultations', { params }).then(data),
  get: (id) => api.get(`/consultations/${id}`).then(data),
  update: (id, body) => api.put(`/consultations/${id}`, body).then(data),
  remove: (id) => api.delete(`/consultations/${id}`).then(data),
};

export const statsApi = {
  get: (params) => api.get('/stats', { params }).then(data),
};
