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
  
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },
};