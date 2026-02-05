import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email, password) => {
    console.log('Attempting login to:', API_ENDPOINTS.AUTH.LOGIN);
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, { 
      email, 
      password 
    });
    console.log('Login response:', response.data);
    return response;
  },
  
  register: async (userData) => {
    console.log('Attempting registration with data:', userData);
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, {
      firstname: userData.firstname,
      lastname: userData.lastname,
      cin: parseInt(userData.cin) || 0,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'USER'
    });
    console.log('Registration response:', response.data);
    return response;
  },

  verifyAccount: async (email) => {
    console.log('Verifying account for email:', email);
    const response = await axiosInstance.post(`/api/auth/confirmation/${email}`);
    console.log('Verification response:', response.data);
    return response;
  },

  verifyAndLogin: async (email, password) => {
    console.log('Verifying and logging in:', email);
    // First verify
    await axiosInstance.post(`/api/auth/confirmation/${email}`);
    // Then login
    const loginResponse = await axiosInstance.post('/api/auth/login', { 
      email, 
      password 
    });
    return loginResponse;
  },
  
  resendCode: async (email) => {
    return await axiosInstance.post('/api/auth/resend-code', { email });
  },
  
  resetPassword: async (cin, email) => {
    return await axiosInstance.post('/api/reset-password', { cin, email });
  },
  
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },
};