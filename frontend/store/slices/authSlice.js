import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('Login thunk called for email:', email);
      const response = await authService.login(email, password);
      
      if (response.data && response.data.token) {
        // Save user data from response
        const userData = {
          id: response.data.id,
          email: response.data.email,
          token: response.data.token
        };
        
        console.log('Saving to AsyncStorage:', userData);
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        return userData;
      } else {
        console.error('No token in response:', response.data);
        return rejectWithValue('Invalid response from server');
      }
    } catch (error) {
      console.error('Login thunk error:', error);
      
      let errorMessage = 'Login failed';
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // No response received
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        // Request setup error
        errorMessage = error.message || 'Network error';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Create async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Logout thunk called');
      // Clear all auth data from AsyncStorage
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('All auth data cleared from storage');
      return true;
    } catch (error) {
      console.error('Logout thunk error:', error);
      // Even if storage fails, we should still logout locally
      return rejectWithValue(error.message || 'Failed to clear storage');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Register thunk called with data:', userData);
      const response = await authService.register(userData);
      console.log('Registration successful:', response.data);
      
      // Return the registered user data WITH the verification code
      return {
        user: response.data.user,
        code: response.data.code 
      };
    } catch (error) {
      console.error('Register thunk error:', error);
      
      let errorMessage = 'Registration failed';
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = error.message || 'Network error';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyAccount = createAsyncThunk(
  'auth/verify',
  async ({ email }, { rejectWithValue }) => {
    try {
      console.log('Verifying account with email:', email);
      const response = await authService.verifyAccount(email);
      
      // Update local storage if verification is successful
      if (response.data) {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.status = 'Activated';
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Verification failed';
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = error.message || 'Network error';
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
      console.log('Sync logout action dispatched');
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
      console.log('Loading token from storage:', action.payload);
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        console.log('Login pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('Login fulfilled:', action.payload);
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('Login rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.token = null;
        state.user = null;
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        console.log('Logout pending');
        state.logoutLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('Logout fulfilled');
        state.logoutLoading = false;
        state.token = null;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.log('Logout rejected:', action.payload);
        state.logoutLoading = false;
        state.error = action.payload;
        // Still clear local state even if storage clearing failed
        state.token = null;
        state.user = null;
      })
      
      // Register cases
      .addCase(registerUser.pending, (state) => {
        console.log('Register pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log('Register fulfilled:', action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        console.log('Register rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, status: 'Activated' };
        state.error = null;
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });     
  },
});

export const { logout, clearError, loadToken, setLoading } = authSlice.actions;
export default authSlice.reducer;