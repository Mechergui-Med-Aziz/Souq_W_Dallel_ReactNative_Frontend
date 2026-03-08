import { useColorScheme } from 'react-native';
import { Tabs, Stack } from "expo-router";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import { Provider, useSelector } from "react-redux";
import { persistor, store } from "../store";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadToken } from '../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { fetchNotifications } from '../store/slices/notificationSlice';
import { PersistGate } from 'redux-persist/integration/react';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <InitializeAuth />
        <StatusBar style="auto" />
        <AppContent />
      </PersistGate>
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
          console.log('Loaded user from storage:', user);
          dispatch(loadToken({ token, user }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const adminCheck = user?.role?.toUpperCase() === 'ADMIN';
    setIsAdmin(adminCheck);
    console.log('User role:', user?.role);
    console.log('Is admin:', adminCheck);
  }, [user]);

  // Fetch notifications periodically
  useEffect(() => {
    if (!token || !user?.id) return;

    const fetchData = () => {
      dispatch(fetchNotifications(user.id));
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [token, user?.id]);
  
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
        <Stack.Screen name="(admin)" options={{ href: null }} />
      </Stack>
    );
  }
  
  return (
    <StripeProvider
      publishableKey="pk_test_51QyUfWH7Cs6mHwoSdAN9wXiSRsKdfvXifEu4gjQwyQNhl2gUNnE6ZANcuJeIRXxMXsB7lAsRZHnbioJpkzzHhxaq00qvXRYf6G"
    >
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
            tabBarIcon: ({ focused, color }) => (
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
            tabBarIcon: ({ focused, color }) => (
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
            tabBarIcon: ({ focused, color }) => (
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
            tabBarIcon: ({ focused, color }) => (
              <View style={{ position: 'relative' }}>
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
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* Admin Dashboard Tab - Only visible for admins */}
        {isAdmin && (
          <Tabs.Screen
            name="(admin)"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ focused, color }) => (
                  <Ionicons
                    name={focused ? 'stats-chart' : 'stats-chart-outline'}
                    size={24}
                    color={color}
                  />
              ),
            }}
          />
        )}

        {/* Hidden screens - keep these as they are */}
        <Tabs.Screen name="(dashboard)/edit-profile" options={{ href: null }}/>
        <Tabs.Screen name="edit-auction/[id]" options={{ href: null }}/>
        <Tabs.Screen name="auction-details/[id]" options={{ href: null }}/>
        <Tabs.Screen name="(auth)" options={{ href: null }} />
        <Tabs.Screen name="(admin)/_layout" options={{ href: null }} />
        <Tabs.Screen name="verify-account" options={{ href: null }}  />
        <Tabs.Screen name="reset-password" options={{ href: null }}  />
        <Tabs.Screen name="reset-password-verify" options={{ href: null }}  />
      </Tabs>
    </StripeProvider>
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
  adminIndicator: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});