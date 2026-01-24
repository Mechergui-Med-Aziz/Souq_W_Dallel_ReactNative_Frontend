import { useColorScheme } from 'react-native';
import { Stack } from "expo-router";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import { Provider, useDispatch } from "react-redux";
import { store } from "../store";
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadToken } from '../store/slices/authSlice';

// Component to initialize auth from AsyncStorage
function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch(loadToken({ token, user }));
          console.log('Auth state loaded from storage');
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
        </Stack>
      </AuthInitializer>
    </Provider>
  );
};

export default RootLayout;