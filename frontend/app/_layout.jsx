import { useColorScheme } from 'react-native';
import { Stack } from "expo-router";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import { Provider, useDispatch } from "react-redux";
import { store } from "../store";
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadToken, clearError } from '../store/slices/authSlice';

// Component to initialize auth from AsyncStorage
function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // Clear any previous errors
        dispatch(clearError());
        
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        
        // Only load if we have both token and user data
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.token && user.email) {
              dispatch(loadToken({ token, user }));
              console.log('Auth state loaded from storage');
            } else {
              console.log('Invalid user data in storage, clearing...');
              await AsyncStorage.multiRemove(['token', 'user']);
            }
          } catch (parseError) {
            console.log('Error parsing user data, clearing...');
            await AsyncStorage.multiRemove(['token', 'user']);
          }
        } else {
          // If we have one but not the other, clear both
          if (token || userStr) {
            console.log('Incomplete auth data, clearing...');
            await AsyncStorage.multiRemove(['token', 'user']);
          }
        }
      } catch (error) {
        console.log('Error loading auth state:', error);
      }
    };
    
    loadAuthState();
  }, [dispatch]);
  
  return children;
}

const RootLayout = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <Provider store={store}>
      <AuthInitializer>
        <StatusBar value="auto"/>
        <Stack screenOptions={{
          headerStyle: { backgroundColor: theme.navBackground },
          headerTintColor: theme.title,
        }}>
          <Stack.Screen name="index" options={{title: 'Home'}}/> 
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(dashboard)" options={{ headerShown: false }} /> 
          <Stack.Screen name="verify-account" options={{ title: 'Verify Account', headerShown: false}} />
          <Stack.Screen name="reset-password" options={{ title: 'Reset Password', headerShown: false}} />
          <Stack.Screen name="reset-password-verify" options={{ title: 'Reset Password Verification', headerShown: false }} />

        </Stack>
      </AuthInitializer>
    </Provider>
  );
};

export default RootLayout;