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
import { StyleSheet, View, Text } from "react-native";
import { fetchNotifications } from '../store/slices/notificationSlice';

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
          // Fetch notifications immediately after login
          if (user.id) {
            dispatch(fetchNotifications(user.id));
          }
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
  const { token, user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications || { unreadCount: 0 });
  const dispatch = useDispatch();

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (token && user?.id) {
      dispatch(fetchNotifications(user.id));
    }
  }, [token, user?.id]);
  
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
          title: 'Accueil',
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
          title: 'Créer',
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
          title: 'Mes enchères',
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
        name="(dashboard)/notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ focused, color, size }) => (
            <View>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={24}
                color={color}
              />
              {unreadCount > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: Colors.warning }]}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="(dashboard)/profile"
        options={{
          title: 'Profil',
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
      <Tabs.Screen name="verify-account" options={{ href: null }}  />
      <Tabs.Screen name="reset-password" options={{ href: null }}  />
      <Tabs.Screen name="reset-password-verify" options={{ href: null }}  />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});