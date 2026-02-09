import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';

export const authService = {
  login: async (email, password) => {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, {
      email,
      password
    });
    return response;
  },
  
  register: async (userData, photoFile = null) => {
    const formData = new FormData();
    
    const userObject = {
      firstname: userData.firstname,
      lastname: userData.lastname,
      cin: parseInt(userData.cin),
      email: userData.email,
      password: userData.password
    };
    
    formData.append('user', JSON.stringify(userObject));
    
    if (photoFile) {
      const uriParts = photoFile.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('file', {
        uri: photoFile.uri,
        name: `profile_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });
    }
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const responseData = JSON.parse(responseText);
    
    return { 
      data: responseData,
      status: response.status,
      statusText: response.statusText
    };
  },

  verifyAccount: async (email) => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.VALIDATE_ACCOUNT(email),
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );
    return response;
  },

  resendCode: async (email) => {
    const response = await axiosInstance.post(API_ENDPOINTS.RESEND_CODE(email));
    return response;
  },
  
  resetPassword: async (cin, email) => {
    const response = await axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, { 
      cin: parseInt(cin),
      email 
    });
    return response.data;
  },

  // For futur use
  updatePassword: async (email, newPassword, code) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/api/update-password`, {
      email,
      newPassword,
      code
    });
    return response.data;
  },
  
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      return true;
    } catch (error) {
      throw error;
    }
  },
};