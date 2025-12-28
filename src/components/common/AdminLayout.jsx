import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function AdminLayout() {
  const { profile } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const showTeamsTab = ['admin', 'fnr', 'dc', 'events'].includes(profile?.role);
  const showModulesTab = ['admin', 'events'].includes(profile?.role);

  // Helper to check active state for styling
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <nav className="w-64 bg-surface border-r border-white/10 flex flex-col p-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-white mb-1">Admin Panel</h2>
        
        <div className="text-xs font-mono text-text-secondary mb-6 uppercase tracking-wider">
          Role: <span className="text-primary">{profile?.role}</span>
        </div>

        <ul className="flex flex-col gap-2">
          <li>
            <Link 
              to="/admin" 
              className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive('/admin') 
                  ? 'bg-primary/20 text-primary border border-primary/20' 
                  : 'text-text-secondary hover:bg-white/5 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
          </li>
          
          {showTeamsTab && (
            <li>
              <Link 
                to="/admin/teams" 
                className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive('/admin/teams') 
                    ? 'bg-primary/20 text-primary border border-primary/20' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }`}
              >
                Manage Teams
              </Link>
            </li>
          )}

          {showModulesTab && (
            <li>
              <Link 
                to="/admin/modules" 
                className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive('/admin/modules') 
                    ? 'bg-primary/20 text-primary border border-primary/20' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }`}
              >
                Manage Modules
              </Link>
            </li>
          )}
        </ul>
        
        <div className="mt-auto">
          <button 
            onClick={handleSignOut} 
            className="w-full px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area - This fixes the overlapping/corner issue */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;