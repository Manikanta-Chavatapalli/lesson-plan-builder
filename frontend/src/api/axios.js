import axios from 'axios';
import { getToken, removeToken } from '../utils/storage.js';
import { auth } from '../config/firebase.js'; // imported firebase auth
import { signOut } from 'firebase/auth'; // imported sign out

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

if (!API_URL) {
  console.warn("⚠️ Warning: Neither VITE_API_URL nor VITE_API_BASE_URL is defined in the environment.");
}

const apiClient = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api', // Fallback to relative path if completely undefined
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request interceptor to check token before sending to server
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // if firebase is loaded and user exists
      if (auth.currentUser) {
        // this will automatically take a new token if the old one expired!
        const freshToken = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${freshToken}`;
      } else {
        // if firebase is not loaded yet, just take token from storage
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // if user session is expired means we catch error here
      console.error("Session completely expired", error);
      removeToken();
      await signOut(auth);
      
      // send user to login page
      if (window.location.pathname !== '/') {
        window.alert('Your session has expired. Please log in again.');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'API request failed';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}: ${errorMessage}`, error.response?.data);

    if (
      error?.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/verify-otp') &&
      !error.config?.url?.includes('/auth/request-otp')
    ) {
      removeToken();
      if (window.location.pathname !== '/') {
        // sign out of firebase completely so it won't auto-login again
        signOut(auth).catch(console.error).finally(() => {
          window.alert('Your session has expired. Please log in again.');
          window.location.href = '/';
        });
      }
    }

    // Attach extracted message to error object for easier frontend consumption
    error.extractedMessage = errorMessage;
    return Promise.reject(error);
  }
);

export default apiClient;