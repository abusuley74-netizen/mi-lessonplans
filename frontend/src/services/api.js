import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: add Authorization header from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Also set up interceptor on global axios for components importing axios directly
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for native fetch() calls that need auth
export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('session_token');
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

export default api;
