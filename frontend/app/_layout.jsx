import { useColorScheme } from 'react-native';
import { Tabs, Stack } from "expo-router";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import { Provider, useSelector } from "react-redux";
import { store } from "../store";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadToken } from '../store/slices/authSlice';
import { useDispatch } from 'react-redux';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <InitializeAuth />
      <StatusBar style="auto" />
      <AppContent />
    </Provider>
  );
}

function InitializeAuth() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch(loadToken({ token, user }));
        }
      } catch (error) {
        console.error('❌ Error loading auth state:', error);
        await AsyncStorage.multiRemove(['token', 'user']);
      }
    };
    
    loadAuth();
  }, []);
  
  return null;
}

function AppContent() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { token } = useSelector((state) => state.auth);
  
  // Not authenticated - show auth screens
  if (!token) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="verify-account" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="reset-password-verify" />
        <Stack.Screen name="index" options={{ href: null }} />
        <Stack.Screen name="create-auction" options={{ href: null }} />
        <Stack.Screen name="(dashboard)" options={{ href: null }} />
      </Stack>
    );
  }
  
  // Authenticated - show main app with tabs
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.navBackground,
          paddingTop: 10,
          height: 90,
        },
        tabBarActiveTintColor: theme.iconColorFocused,
        tabBarInactiveTintColor: theme.iconColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen 
        name="create-auction" 
        options={{ 
          title: 'Create Auction',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={24}
              color={color}
            />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="(dashboard)/my-auctions" 
        options={{ 
          title: 'My Auctions',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={24}
              color={color}
            />
          )
        }} 
      />
      
      <Tabs.Screen
        name="(dashboard)/profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden screens - not in tab bar */}
      <Tabs.Screen name="(dashboard)/edit-profile" options={{ href: null }}/>
      <Tabs.Screen name="edit-auction/[id]" options={{ href: null }}/>
      <Tabs.Screen name="auction-details/[id]" options={{ href: null }}/>
      <Tabs.Screen name="(auth)" options={{ href: null }} />
      <Stack.Screen name="verify-account" options={{ href: null }}  />
      <Stack.Screen name="reset-password" options={{ href: null }}  />
      <Stack.Screen name="reset-password-verify" options={{ href: null }}  />
    </Tabs>
  );
}