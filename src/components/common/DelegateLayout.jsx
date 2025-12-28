import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// IMPORT YOUR LOGO HERE
// Make sure the file name matches exactly what you put in src/assets/
import ylesLogo from '../../assets/yles-logo.png';

function DelegateLayout() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    navigate('/login');
  };

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

      {/* Sidebar Navigation */}
      <nav className={`
        fixed lg:relative
        w-64 h-full
        bg-surface border-r border-white/10
        flex flex-col p-6
        shadow-2xl
        z-40
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Team Identity */}
        <div className="mb-8 text-center">
          {/* LOGO REPLACEMENT START */}
          <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <img
              src={ylesLogo}
              alt="YLES Logo"
              className="w-full h-full object-contain relative z-10 drop-shadow-lg"
            />
          </div>
          {/* LOGO REPLACEMENT END */}

          <h2 className="text-xl font-bold text-white tracking-wide">
            {profile ? profile.team_name : 'Team'}
          </h2>
          <p className="text-xs text-text-secondary uppercase tracking-widest mt-1">
            Delegate Portal
          </p>
        </div>

        {/* Navigation Links */}
        <ul className="space-y-3 flex-1">
          <li>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive('/')
                  ? 'bg-gradient-to-r from-primary/20 to-transparent text-white border-l-4 border-primary'
                  : 'text-text-secondary hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>📊</span>
              <span className="font-medium">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/info-hub"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive('/info-hub')
                  ? 'bg-gradient-to-r from-secondary/20 to-transparent text-white border-l-4 border-secondary'
                  : 'text-text-secondary hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>ℹ️</span>
              <span className="font-medium">Info Hub</span>
            </Link>
          </li>
        </ul>

        {/* Sign Out */}
        <div>
          <button 
            onClick={handleSignOut} 
            className="w-full py-3 rounded-xl border border-white/10 text-text-secondary hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DelegateLayout;