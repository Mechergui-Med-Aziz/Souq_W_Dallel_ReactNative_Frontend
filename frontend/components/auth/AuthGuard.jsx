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

    // Guest only protection
    if (guestOnly && token) {
      router.replace(redirectTo);
      return;
    }

    if (userOnly && !token) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles.length > 0 && token && user?.role) {
      if (!allowedRoles.includes(user.role)) {
        router.replace(redirectTo);
      }
    }
  }, [user, token, loading, guestOnly, userOnly, allowedRoles, redirectTo]);

  if (loading) {
    return <ThemedLoader />;
  }

  if (guestOnly && token) {
    return null;
  }

  if (userOnly && !token) {
    return null;
  }

  if (userOnly && user?.status === 'Waiting for validation') {
    return null;
  }

  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return null;
  }

  return children;
};

export default AuthGuard;