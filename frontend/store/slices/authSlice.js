import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Login thunk called for email:', email);
      const response = await authService.login(email, password);
      
      // Check if user status is "Waiting for validation"
      if (response.data.status === 'Waiting for validation') {
        // Store the verification code if sent
        if (response.data.code) {
          await AsyncStorage.setItem('verificationCode', response.data.code);
          await AsyncStorage.setItem('pendingVerificationEmail', email);
        }
        
        // Return special flag to indicate verification needed
        return {
          needsVerification: true,
          email: email,
          code: response.data.code
        };
      }
      
      // If status is not "Waiting for validation", proceed with normal login
      if (response.data && response.data.token) {
        const userData = {
          id: response.data.id,
          email: response.data.email,
          token: response.data.token,
          role: response.data.role,
          status: response.data.status
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
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
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

export const sendVerificationCode = createAsyncThunk(
  'auth/sendVerificationCode',
  async (email, { rejectWithValue }) => {
    try {
      console.log('Sending verification code for email:', email);
      const response = await authService.login(email, 'dummyPassword'); 
      
      // If the user is "Waiting for validation", the backend will send a code
      // and return it in the response
      return response.data;
    } catch (error) {
      console.error('Send verification code error:', error);
      
      let errorMessage = 'Failed to send verification code';
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || 'Network error';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyAccount = createAsyncThunk(
  'auth/verify',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Verifying account and logging in for email:', email);
      
      // First, verify the account
      const verifyResponse = await authService.verifyAccount(email);
      console.log('Account verification response:', verifyResponse.data);
      
      // Then, login with the provided password
      if (password) {
        const loginResponse = await authService.login(email, password);
        
        if (loginResponse.data && loginResponse.data.token) {
          const userData = {
            id: loginResponse.data.id,
            email: loginResponse.data.email,
            token: loginResponse.data.token,
            role: loginResponse.data.role,
            status: 'Activated'
          };
          
          console.log('Saving authenticated user to storage:', userData);
          
          // Save to AsyncStorage
          await AsyncStorage.setItem('token', loginResponse.data.token);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          
          // Clear verification data
          await AsyncStorage.multiRemove(['verificationCode', 'pendingVerificationEmail', 'pendingRegistrationPassword']);
          
          // IMPORTANT: Return the full user data
          return userData;
        }
      }
      
      // If no password provided or login failed
      await AsyncStorage.multiRemove(['verificationCode', 'pendingVerificationEmail', 'pendingRegistrationPassword']);
      return { verified: true, email: email };
      
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
        console.log('VerifyAccount fulfilled:', action.payload);
        state.loading = false;
        
        // Check if we have a full user object with token
        if (action.payload && action.payload.token) {
          state.token = action.payload.token;
          state.user = action.payload;
          state.error = null;
          console.log('User authenticated and state updated');
        } else {
          // Just verification success, no login
          console.log('Account verified but no login performed');
        }
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        console.log('verifyAccount rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      });  
  },
});

export const { logout, clearError, loadToken, setLoading } = authSlice.actions;
export default authSlice.reducer;