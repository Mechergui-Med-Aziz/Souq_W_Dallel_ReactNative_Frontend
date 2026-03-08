import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import ThemedLoader from '../ThemedLoader';

const AuthGuard = ({ 
  children, 
  guestOnly = false, 
  userOnly = false, 
  allowedRoles = [],
  redirectTo = '/'
}) => {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Guest only protection (pages like login, register)
    if (guestOnly) {
      if (token) {
        // If user is logged in, redirect to home
        router.replace(redirectTo);
      }
      return;
    }

    // User only protection (pages that require authentication)
    if (userOnly) {
      if (!token) {
        // If not logged in, redirect to login
        router.replace('/(auth)/login');
        return;
      }

      // Check if user status is waiting for validation
      if (user?.status === 'Waiting for validation') {
        router.replace('/verify-account');
        return;
      }

      // Check if user has required role
      if (allowedRoles.length > 0) {
        const userRole = user?.role?.toUpperCase() || '';
        const hasRequiredRole = allowedRoles.some(role => 
          role.toUpperCase() === userRole
        );
        
        if (!hasRequiredRole) {
          console.log('Access denied - user role:', userRole, 'required roles:', allowedRoles);
          router.replace(redirectTo);
          return;
        }
      }
    }
  }, [user, token, loading, guestOnly, userOnly, allowedRoles, redirectTo]);

  if (loading) {
    return <ThemedLoader />;
  }

  // For guestOnly pages, don't render if token exists
  if (guestOnly && token) {
    return null;
  }

  // For userOnly pages, don't render if no token
  if (userOnly && !token) {
    return null;
  }

  // For role-based pages, check role again before rendering
  if (userOnly && allowedRoles.length > 0 && token && user) {
    const userRole = user?.role?.toUpperCase() || '';
    const hasRequiredRole = allowedRoles.some(role => 
      role.toUpperCase() === userRole
    );
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  return children;
};

export default AuthGuard;