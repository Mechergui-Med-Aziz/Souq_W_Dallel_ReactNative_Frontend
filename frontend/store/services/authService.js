import axiosInstance from '../../lib/axios';

export const authService = {
  login: (email, password) => {
    return axiosInstance.post('/auth/login', { email, password });
  },
  
  register: (userData) => {
    return axiosInstance.post('/users/add', userData);
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};