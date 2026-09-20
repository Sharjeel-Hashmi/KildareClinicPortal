import axios from 'axios';

export const TOKEN_KEY = 'kc_token';

const api = axios.create({
  // '' in dev → Vite proxy; in production VITE_API_URL points at the deployed backend (…/api)
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // An expired / invalid session anywhere → send the user back to the login page
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('kc:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err) {
  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!err.response) return 'Cannot reach the server. Check your internet connection and try again.';
  return err.response.data?.message || 'Something went wrong. Please try again.';
}

export const getFieldErrors = (err) => err.response?.data?.errors || {};

export default api;
