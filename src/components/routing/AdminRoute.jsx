// src/components/routing/AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { profile, loading } = useAuth();

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  // FIX: Allow all these roles to access the admin layout
  const allowedRoles = ['admin', 'fnr', 'dc', 'events'];

  // If the profile exists and the role is in our allowed list, let them in.
  if (profile && allowedRoles.includes(profile.role)) {
    // If children are provided, render them (for wrapping), otherwise use Outlet
    return children ? children : <Outlet />;
  }

  // Otherwise, kick them back to the main user dashboard
  return <Navigate to="/" replace />;
};

export default AdminRoute;