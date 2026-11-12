import axios from 'axios';

// Default to production cloud backend, but allow environment variable override
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://vantrack-lk.onrender.com/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vantrack_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401 Unauthorized
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vantrack_admin_token');
      localStorage.removeItem('vantrack_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
