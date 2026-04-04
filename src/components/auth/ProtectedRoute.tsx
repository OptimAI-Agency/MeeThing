import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLoadingScreen from '@/components/loading/AppLoadingScreen';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
