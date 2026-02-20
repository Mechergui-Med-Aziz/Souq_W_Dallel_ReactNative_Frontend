import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.data.status === 'Waiting for validation') {
        if (response.data.code) {
          await AsyncStorage.setItem('verificationCode', response.data.code);
          await AsyncStorage.setItem('pendingVerificationEmail', email);
        }
        
        return {
          needsVerification: true,
          email: email,
          code: response.data.code
        };
      }
      
      if (response.data && response.data.token) {
        const userData = {
          id: response.data.id,
          email: response.data.email,
          token: response.data.token,
          role: response.data.role,
          status: response.data.status
        };
        
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        return userData;
      } else {
        return rejectWithValue('Réponse invalide du serveur');
      }
    } catch (error) {
      let errorMessage = 'Échec de la connexion';
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Email ou mot de passe incorrect';
            break;
          case 403:
            errorMessage = 'Compte bloqué. Contactez l\'administrateur.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer.';
            break;
          default:
            errorMessage = error.response.data?.error || 
                          `Erreur ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est en cours d\'exécution.';
      } else {
        errorMessage = error.message || 'Erreur réseau';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'Échec de la déconnexion');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      
      const responseData = response.data;
      
      if (!responseData) {
        throw new Error('Aucune donnée reçue du serveur');
      }
      
      return {
        user: responseData.user || responseData,
        code: responseData.code 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Échec de l\'inscription');
    }
  }
);

export const verifyAccount = createAsyncThunk(
  'auth/verify',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const verifyResponse = await authService.verifyAccount(email);
      
      if (!verifyResponse.success) {
        throw new Error('Échec de la vérification');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!password || password.trim() === '') {
        throw new Error('Auto-connexion impossible : mot de passe non disponible');
      }
      
      try {
        const loginResponse = await authService.login(email, password);
        
        if (loginResponse.data && loginResponse.data.token) {
          const userData = {
            id: loginResponse.data.id,
            email: loginResponse.data.email,
            token: loginResponse.data.token,
            role: loginResponse.data.role,
            status: loginResponse.data.status || 'Activated',
            firstname: loginResponse.data.firstname || '',
            lastname: loginResponse.data.lastname || '',
            cin: loginResponse.data.cin || 0
          };
          
          await AsyncStorage.setItem('token', loginResponse.data.token);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          
          await AsyncStorage.multiRemove([
            'verificationCode', 
            'pendingVerificationEmail', 
            'pendingRegistrationPassword'
          ]);
          
          return userData;
        } else {
          throw new Error('Auto-connexion impossible : pas de token reçu');
        }
        
      } catch (loginError) {
        if (loginError.response && loginError.response.status === 401) {
          throw new Error('Compte activé mais auto-connexion impossible. Veuillez vous connecter manuellement.');
        }
        
        throw loginError;
      }
      
    } catch (error) {
      let errorMessage = 'Échec de la vérification';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Utilisateur non trouvé ou déjà activé.';
            break;
          case 404:
            errorMessage = 'Utilisateur non trouvé.';
            break;
          default:
            errorMessage = `Erreur ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    user: null,
    loading: false,
    error: null,
    logoutLoading: false,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.error = null;
      state.loading = false;
      state.logoutLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    loadToken: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.token = null;
        state.user = null;
      })
      
      .addCase(logoutUser.pending, (state) => {
        state.logoutLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.logoutLoading = false;
        state.token = null;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logoutLoading = false;
        state.error = action.payload;
        state.token = null;
        state.user = null;
      })
      
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAccount.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload && action.payload.token) {
          state.token = action.payload.token;
          state.user = action.payload;
          state.error = null;
        }
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });  
  },
});

export const { logout, clearError, loadToken, setLoading } = authSlice.actions;
export default authSlice.reducer;