import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const userService = {
  getUserById: async (userId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_USER(userId));
    return response.data;
  },

  updateUserWithPhoto: async (userId, userData, photoFile = null) => {
    const formData = new FormData();
    
    const userUpdate = {
      firstname: userData.firstname,
      lastname: userData.lastname,
      cin: parseInt(userData.cin),
      email: userData.email,
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
    if (!photoId) return null;
    return `${API_BASE_URL}${API_ENDPOINTS.USER_PHOTO(userId)}`;
  },

  deleteUserPhoto: async (userId) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_USER_PHOTO(userId));
    return response.data;
  },
  
  // New method to fetch user photo
  fetchUserPhoto: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PHOTO(userId)}`);
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      console.error('Error fetching user photo:', error);
      return null;
    }
  }
};