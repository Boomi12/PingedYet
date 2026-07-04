import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CENTRAL BASE URL CONFIGURATION
const DEV_URL = Platform.select({
  ios: 'http://localhost:5000',
  android: 'http://10.0.2.2:5000',
  default: 'http://localhost:5000',
});

const BASE_URL = __DEV__ ? DEV_URL : 'https://pingedyet.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback hooked up by AuthContext to reset state on 401 errors
api.onUnauthorized = null;

// Interceptor to append Authorization Bearer Token on all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@interview_tracker_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('[API Interceptor] Failed to read auth token:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to intercept expired tokens (401 errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API Interceptor] Token expired or invalid (401). Clearing session...');
      try {
        // Clear session cache
        await AsyncStorage.multiRemove([
          '@interview_tracker_token',
          '@interview_tracker_user_name',
          '@interview_tracker_user_email',
          '@interview_tracker_user_created'
        ]);
        
        // Trigger global log-out transition
        if (api.onUnauthorized) {
          api.onUnauthorized();
        }
      } catch (e) {
        console.error('[API Interceptor] Failed to clear storage on 401:', e);
      }
      throw new Error('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

// ERROR HANDLER HELPER
const handleApiError = (error) => {
  if (error.response) {
    throw new Error(error.response.data?.message || 'Server processed request with an error.');
  } else if (error.request) {
    throw new Error('Could not connect to the server. Please check if the backend is running.');
  } else {
    throw new Error(error.message || 'API request setup failure.');
  }
};

// EXPORTED API METHODS
export const authService = {
  register: async (name, email, password) => {
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export const applicationService = {
  getAll: async () => {
    try {
      const response = await api.get('/api/applications');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (data) => {
    try {
      const response = await api.post('/api/applications', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/api/applications/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/api/applications/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/applications/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default api;
