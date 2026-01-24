import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadToken } from './slices/authSlice';

export const initAuth = async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      dispatch(loadToken({ token, user }));
    }
  } catch (error) {
    console.log('Error loading auth state:', error);
  }
};