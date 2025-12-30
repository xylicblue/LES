// src/components/routing/AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { profile, loading } = useAuth();

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  const allowedRoles = ['admin', 'fnr', 'dc', 'events', 'sc'];

  if (profile && allowedRoles.includes(profile.role)) {
    return children ? children : <Outlet />;
  }

  return <Navigate to="/" replace />;
};

export default AdminRoute;