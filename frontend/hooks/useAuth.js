import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { loginUser, registerUser, logout } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { token, user, loading, error } = useAppSelector((state) => state.auth);

  return {
    // Auth state
    token,
    user,
    loading,
    error,
    
    // Auth actions
    login: (email, password) => dispatch(loginUser({ email, password })),
    register: (userData) => dispatch(registerUser(userData)),
    logout: () => dispatch(logout()),
  };
};