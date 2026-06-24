import axios from 'axios';
import { getToken, removeToken } from '../utils/storage.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // ❗ REMOVE fallback
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/verify-otp') &&
      !error.config?.url?.includes('/auth/request-otp')
    ) {
      removeToken();
      if (window.location.pathname !== '/') {
        window.alert('Your session has expired. Please log in again.');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;