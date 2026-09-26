import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../ui/States.jsx';

export default function SettingsRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && !user.canManageSettings) return <Navigate to="/" replace />;

  return <Outlet />;
}