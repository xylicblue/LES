// src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; //
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InfoHub from './pages/InfoHub';

// Import Layouts
import DelegateLayout from './components/common/DelegateLayout';
import AdminLayout from './components/common/AdminLayout';

// Import Admin components
import AdminRoute from './components/routing/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeams from './pages/admin/AdminTeams';
import AdminModules from './pages/admin/AdminModules';

function App() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  // Define who gets sent to the Admin Dashboard
  const adminRoles = ['admin', 'fnr', 'dc', 'events', 'sc'];

  return (
    <Routes>
      {/* === Public Route === */}
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/" replace />}
      />
      
      {/* === Delegate Routes === */}
      {/* This logic acts as the "Traffic Cop" */}
      <Route
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : profile && adminRoles.includes(profile.role) ? ( 
            // ^ FIX: Check if role is ANY of the admin types
            <Navigate to="/admin" replace />
          ) : (
            // If strictly a delegate, show Delegate Layout
            <DelegateLayout /> 
          )
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/info-hub" element={<InfoHub />} />
      </Route>

      {/* === Admin Routes === */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/teams" element={<AdminTeams />} />
        <Route path="/admin/modules" element={<AdminModules />} />
      </Route>

    </Routes>
  );
}

export default App;