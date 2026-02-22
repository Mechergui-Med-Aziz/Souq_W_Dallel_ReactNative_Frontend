import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Get token for ALL requests
      const token = await AsyncStorage.getItem('token');
      
      // Always add token if it exists (backend will validate)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Handle FormData
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      
    } catch (error) {
      console.error('Interceptor error:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.multiRemove(['token', 'user']);
      // then redirect to login
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;