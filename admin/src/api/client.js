import axios from 'axios';

// Default to production cloud backend, but allow environment variable override
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://vantrack-lk.onrender.com/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increased to 60s to comfortably tolerate Render free-tier cold starts (~30-50s)
  timeout: 60000,
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

// Response interceptor with 401 handling + auto-retry on Render cold starts (502, 503, 504, timeout)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle 401 Unauthorized: clear credentials and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('vantrack_admin_token');
      localStorage.removeItem('vantrack_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Auto-retry once if server is cold starting (timeout, network error, or 502/503/504)
    if (config && !config._retry) {
      const isNetworkOrTimeout = error.code === 'ECONNABORTED' || !error.response;
      const isGatewayError = [502, 503, 504].includes(error.response?.status);

      if (isNetworkOrTimeout || isGatewayError) {
        config._retry = true;
        console.warn('[API Client] Backend is waking up from sleep. Auto-retrying request...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return client(config);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
