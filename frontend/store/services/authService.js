import axiosInstance from '../../lib/axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      let errorMessage = 'Registration failed';
      
      // Handle different status codes
      switch (response.status) {
        case 409:
          errorMessage = 'Un utilisateur avec cet email ou ce CIN existe déjà !';
          break;
        case 400:
          errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${response.status}: ${responseText}`;
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
    try {
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
      
      // 200 OK means success
      if (response.status === 200) {
        return { success: true };
      } else {
        throw new Error('Échec de la vérification');
      }
    } catch (error) {
      let errorMessage = 'Échec de la vérification';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Utilisateur non trouvé ou compte déjà activé.';
            break;
          case 404:
            errorMessage = 'Utilisateur non trouvé.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer.';
            break;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur.';
      }
      
      throw new Error(errorMessage);
    }
  },

  resendCode: async (email) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RESEND_CODE(email));
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Échec de l\'envoi du code');
      }
    } catch (error) {
      let errorMessage = 'Échec de l\'envoi du code';
      
      if (error.response?.status === 400) {
        errorMessage = 'Utilisateur non trouvé.';
      }
      
      throw new Error(errorMessage);
    }
  },
  
  resetPassword: async (cin, email) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, { 
        cin: parseInt(cin),
        email 
      });
      
      // 200 OK means success (code sent via email)
      if (response.status === 200) {
        return { 
          success: true,
          message: 'Un code de vérification a été envoyé à votre adresse email.'
        };
      } else {
        throw new Error('Échec de la demande de réinitialisation');
      }
    } catch (error) {
      let errorMessage = 'Échec de la demande de réinitialisation';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Aucun utilisateur trouvé avec ce CIN et cet email.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer.';
            break;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur.';
      }
      
      throw new Error(errorMessage);
    }
  },

  updatePassword: async (email, cin, newPassword, code) => {
    try {
      const response = await axiosInstance.put(
        `/api/users/update-password/${newPassword}`,
        { 
          email,
          cin: parseInt(cin)
        }
      );
      
      if (response.status === 200) {
        return { 
          success: true,
          message: 'Mot de passe mis à jour avec succès !'
        };
      } else {
        throw new Error('Échec de la mise à jour du mot de passe');
      }
    } catch (error) {
      console.error('Update password error details:', error.response || error);
      
      let errorMessage = 'Échec de la mise à jour du mot de passe';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Code invalide ou utilisateur non trouvé.';
            break;
          case 404:
            errorMessage = 'Utilisateur non trouvé.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer.';
            break;
          default:
            errorMessage = `Erreur ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
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