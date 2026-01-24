import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import ThemedLoader from '../ThemedLoader';

const UserOnly = ({ children }) => {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token && !loading) {
      router.replace('/login');
    }
  }, [token, loading]);

  if (loading) {
    return <ThemedLoader />;
  }

  if (!token) {
    return null;
  }

  return children;
};

export default UserOnly;