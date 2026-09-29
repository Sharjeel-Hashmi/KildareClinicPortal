import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../ui/States.jsx';
import { isAdminLike, isSuperAdmin } from '../../utils/roles.js';

// <AdminRoute />           → Admin + Super Admin
// <AdminRoute superOnly />  → Super Admin only
export default function AdminRoute({ superOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = superOnly ? isSuperAdmin(user) : isAdminLike(user);
  if (!allowed) return <Navigate to="/" replace />;

  return <Outlet />;
}