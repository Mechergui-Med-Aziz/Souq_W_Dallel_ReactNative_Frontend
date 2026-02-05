import { useAuth } from '../../hooks/useAuth';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';
import ThemedLoader from '../ThemedLoader';

const UserOnly = ({ children }) => {
  const { token, loading, user } = useAuth();
  
  // Use the auth redirect hook
  useAuthRedirect();

  if (loading) {
    return <ThemedLoader />;
  }

  // Only show children if we have a token AND user is not waiting for validation
  if (!token || (user?.status === 'Waiting for validation')) {
    return null;
  }

  return children;
};

export default UserOnly;