import { useColorScheme } from 'react-native';
import { Tabs } from "expo-router";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import { Provider, useDispatch } from "react-redux";
import { store } from "../store";
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadToken, clearError } from '../store/slices/authSlice';
import { Ionicons } from "@expo/vector-icons";

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
        <Tabs 
          screenOptions={{ 
            headerShown: false, 
            tabBarStyle: {
              backgroundColor: theme.navBackground,
              paddingTop: 10,
              height: 90
            },
            tabBarActiveTintColor: theme.iconColorFocused,
            tabBarInactiveTintColor: theme.iconColor
          }}  
        >
          <Tabs.Screen 
            name="index" 
            options={{
              title: 'Home',
              tabBarIcon: ({ focused }) => (
                <Ionicons 
                  size={24}
                  name={focused ? 'home' : 'home-outline'}
                  color={focused ? theme.iconColorFocused : theme.iconColor}
                />
              )
            }}
          />
          
          <Tabs.Screen 
            name="(auth)" 
            options={{ 
              href: null,
            }} 
          />
          
          <Tabs.Screen 
            name="(dashboard)/profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ focused }) => (
                <Ionicons 
                  size={24}
                  name={focused ? 'person' : 'person-outline'}
                  color={focused ? theme.iconColorFocused : theme.iconColor}
                />
              )
            }}
          />
          
          {/* Hidden screens */}
          <Tabs.Screen 
            name="(dashboard)/edit-profile" 
            options={{ href: null }}
          />
          <Tabs.Screen 
            name="verify-account" 
            options={{ href: null }}
          />
          <Tabs.Screen 
            name="reset-password" 
            options={{ href: null }}
          />
          <Tabs.Screen 
            name="reset-password-verify" 
            options={{ href: null }}
          />
        </Tabs>
      </AuthInitializer>
    </Provider>
  );
};

export default RootLayout;