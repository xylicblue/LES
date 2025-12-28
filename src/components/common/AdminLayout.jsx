import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function AdminLayout() {
  const { profile } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const showTeamsTab = ['admin', 'fnr', 'dc', 'events'].includes(profile?.role);
  const showModulesTab = ['admin', 'events'].includes(profile?.role);

  // Helper to check active state for styling
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Hamburger Menu Button (Mobile Only) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface rounded-lg border border-white/10 shadow-lg hover:bg-surface/80 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed lg:relative
        w-64 h-full
        bg-surface border-r border-white/10
        flex flex-col p-4
        z-40
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <h2 className="text-xl font-bold text-white mb-1">Admin Panel</h2>
        
        <div className="text-xs font-mono text-text-secondary mb-6 uppercase tracking-wider">
          Role: <span className="text-primary">{profile?.role}</span>
        </div>

        <ul className="flex flex-col gap-2">
          <li>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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

      {/* Main Content Area - Updated padding to fix overlap */}
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8 md:pt-20 lg:p-8 relative">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;