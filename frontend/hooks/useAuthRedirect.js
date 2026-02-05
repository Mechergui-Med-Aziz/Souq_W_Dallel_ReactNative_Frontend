import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';

export const useAuthRedirect = () => {
  const router = useRouter();
  const { token, loading, user } = useAuth();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (!loading) {
        // Check both Redux state and AsyncStorage
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        const currentPath = router.pathname || '';
        
        console.log('Auth redirect check:', {
          reduxToken: token,
          storedToken,
          currentPath,
          userStatus: user?.status
        });
        
        // If we have a token (either in Redux or storage)
        if (token || storedToken) {
          // Check if user needs verification
          const userData = user || (storedUser ? JSON.parse(storedUser) : null);
          
          if (userData?.status === 'Waiting for validation') {
            // Redirect to verification if not already there
            if (!currentPath.includes('verify-account')) {
              console.log('  Redirecting to verification (waiting for validation)');
              router.replace('/verify-account');
            }
          } else if (currentPath.includes('auth') || currentPath === '/' || currentPath.includes('verify-account')) {
            // If authenticated and on auth pages, go to dashboard
            console.log('  Redirecting to dashboard (authenticated)');
            router.replace('/(dashboard)');
          }
        } else if (!currentPath.includes('auth') && currentPath !== '/') {
          // If not authenticated and not on auth pages, go to login
          console.log('  Redirecting to login (not authenticated)');
          router.replace('/login');
        }
      }
    };
    
    checkAuthAndRedirect();
  }, [token, loading, user, router.pathname]);
};