import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import ThemedLoader from '../ThemedLoader';

const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && token) {
      if (allowedRoles.length > 0 && user?.role) {
        if (!allowedRoles.includes(user.role)) {
          router.replace('/');
        }
      }
    }
  }, [user, token, loading, allowedRoles]);

  if (loading) {
    return <ThemedLoader />;
  }

  if (!token) {
    return null;
  }

  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
};

export default RoleGuard;