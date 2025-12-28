import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const role = profile?.role;

  const renderContent = () => {
    switch (role) {
      case 'events':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-3xl border border-white/10 shadow-2xl">
            <div className="text-7xl mb-6 animate-bounce">🎭✨</div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-6">
              To the Architects of Experience
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed font-light">
              "Every great event is a work of art, and you are the artists. <br />
              Thank you for making YLES spectacular!"
            </p>
            <div className="mt-10 pt-6 border-t border-white/10 w-full max-w-md mx-auto">
              <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">
                With ❤️ from I-Tea & Automations
              </p>
            </div>
          </div>
        );

      case 'fnr':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-3xl border border-white/10 shadow-2xl">
            <div className="text-7xl mb-6 animate-pulse">💰📉</div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-6">
              The Vault Keepers
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed font-light">
              "Counting the coin and keeping the books. <br />May your spreadsheets always balance!"
            </p>
            <div className="mt-10 pt-6 border-t border-white/10 w-full max-w-md mx-auto">
              <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">
                With ❤️ from I-Tea & Automations
              </p>
            </div>
          </div>
        );

      case 'dc':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-3xl border border-white/10 shadow-2xl">
            <div className="text-7xl mb-6">🛡️⚖️</div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-400 mb-6">
              To the Guardians of Order
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed font-light">
              "Hope the DC rounds are going good! <br />
              Your vigilance keeps the chaos at bay. You got this! ✨"
            </p>
            <div className="mt-10 pt-6 border-t border-white/10 w-full max-w-md mx-auto">
              <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">
                With ❤️ from I-Tea & Automations
              </p>
            </div>
          </div>
        );

      case 'admin':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link 
              to="/admin/teams"
              className="group relative overflow-hidden rounded-3xl bg-surface p-10 hover:scale-[1.02] transition-all duration-300 border border-white/10 shadow-lg hover:border-primary/50"
            >
              <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-9xl">👥</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">Manage Teams</h3>
                <p className="text-gray-400 text-lg">Control balances, issue fines, and track delegate status.</p>
              </div>
            </Link>

            <Link 
              to="/admin/modules"
              className="group relative overflow-hidden rounded-3xl bg-surface p-10 hover:scale-[1.02] transition-all duration-300 border border-white/10 shadow-lg hover:border-secondary/50"
            >
               <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-9xl">📅</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-secondary transition-colors">Manage Modules</h3>
                <p className="text-gray-400 text-lg">Update venues, timings, and event descriptions.</p>
              </div>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Welcome back to the command center.</p>
        </div>
        
        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Logged in as </span>
          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 uppercase">
            {role || 'Loading...'} 🚀
          </span>
        </div>
      </div>

      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;