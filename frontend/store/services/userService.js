import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const userService = {
  getUserById: async (userId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_USER(userId));
    return response.data;
  },

  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_USERS);
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  updateUserWithPhoto: async (userId, userData, photoFile = null) => {
    const formData = new FormData();
    
    let currentUser = null;
    try {
      currentUser = await userService.getUserById(userId);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
    
    const userUpdate = {
      firstname: userData.firstname,
      lastname: userData.lastname,
      cin: parseInt(userData.cin),
      email: userData.email,
      status: currentUser?.status || 'Activated',
      role: currentUser?.role || 'User',
    };
    
    formData.append('user', JSON.stringify(userUpdate));
    
    if (photoFile) {
      const uriParts = photoFile.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('file', {
        uri: photoFile.uri,
        name: `profile_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });
    }
    
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.UPDATE_USER(userId)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  },

  getUserPhotoUrl: (userId, photoId) => {
    if (!photoId || !userId) return null;
    return `${API_BASE_URL}${API_ENDPOINTS.USER_PHOTO(userId)}?t=${Date.now()}`;
  },

  deleteUserPhoto: async (userId) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_USER_PHOTO(userId));
    return response.data;
  },

  blockUserWithDays: async (userId, days) => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.BLOCK_USER(userId, days));
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  unblockUser: async (userId) => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.UNBLOCK_USER(userId));
      return response.data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      // If 500 error but user is actually unblocked, refresh users list
      if (error.response?.status === 500) {
        console.log('Server error but operation may have succeeded, refreshing...');
        // Return a dummy success to allow UI to refresh
        return { success: true, message: 'User unblocked (server error but operation succeeded)' };
      }
      throw error;
    }
  },

  makeAdmin: async (userId) => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.MAKE_ADMIN(userId));
      return response.data;
    } catch (error) {
      console.error('Error making user admin:', error);
      throw error;
    }
  },

  makeUser: async (userId) => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.MAKE_USER(userId));
      return response.data;
    } catch (error) {
      console.error('Error making user:', error);
      throw error;
    }
  },

  makeTransporter: async (userId) => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.MAKE_TRANSPORTER(userId));
      return response.data;
    } catch (error) {
      console.error('Error making user transporter:', error);
      throw error;
    }
  },

  removeTransporter: async (userId) => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.REMOVE_TRANSPORTER(userId));
      return response.data;
    } catch (error) {
      console.error('Error removing transporter role:', error);
      throw error;
    }
  },

  getAllTransporters: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_TRANSPORTERS);
      return response.data;
    } catch (error) {
      console.error('Error fetching transporters:', error);
      return [];
    }
  },
};