import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import ThemedLoader from '../ThemedLoader';

const UserOnly = ({ children }) => {
  const { token, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.replace('/login');
      } else if (user?.status === 'Waiting for validation') {
        // Only redirect if we're not already on the verification page
        if (router.pathname !== '/verify-account') {
          router.replace('/verify-account');
        }
      }
    }
  }, [token, loading, user, router.pathname]);

  if (loading) {
    return <ThemedLoader />;
  }

  if (!token || (user?.status === 'Waiting for validation')) {
    return null;
  }

  return children;
};

export default UserOnly;