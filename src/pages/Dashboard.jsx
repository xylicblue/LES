import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    eliminated: 'bg-red-500/20 text-red-400 border border-red-500/30',
    upcoming: 'bg-gray-700/50 text-gray-400 border border-gray-600',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wider ${styles[status] || styles.upcoming}`}>
      {status}
    </span>
  );
};

function Dashboard() {
  const { profile } = useAuth();
  const [modules, setModules] = useState([]);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: modulesData, error: modulesError } = await supabase.from('modules').select('*').order('day', { ascending: true }).order('name', { ascending: true });
        if (modulesError) throw modulesError;
        const { data: progressData, error: progressError } = await supabase.from('team_progress').select('*').eq('team_id', profile.id);
        if (progressError) throw progressError;
        const { data: finesData, error: finesError } = await supabase.from('fines').select('*').eq('team_id', profile.id).order('created_at', { ascending: false });
        if (finesError) throw finesError;
        setFines(finesData);
        const progressMap = progressData.reduce((acc, p) => { acc[p.module_id] = p.status; return acc; }, {});
        const combinedModules = modulesData.map(module => ({ ...module, status: progressMap[module.id] || 'upcoming' }));
        setModules(combinedModules);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  if (loading || !profile) return <div className="animate-pulse text-text-secondary">Loading your dashboard...</div>;
  if (error) return <div className="p-4 bg-error/10 text-error border border-error/20 rounded-lg">Error: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Wholesome Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-indigo-900 via-purple-900 to-background border border-white/10 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Welcome, {profile.team_name}! 👋
          </h1>
          <p className="text-lg text-gray-300 font-light max-w-2xl">
            You're doing great! Stay focused, check your modules, and let's conquer YLES together.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Section */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📅</span> Your Journey
          </h2>
          <div className="grid gap-4">
            {modules.map(module => (
              <div key={module.id} className="group bg-surface hover:bg-surface-hover p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">{module.name}</h3>
                    <p className="text-text-secondary text-sm">Day {module.day}</p>
                  </div>
                  <StatusBadge status={module.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sidebar / Stats Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💳</span> Wallet & Status
          </h2>
          
          {/* Balance Card */}
          <div className="bg-surface p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[50px] rounded-full"></div>
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Current Balance</h3>
            
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-4xl font-mono font-bold ${profile.current_balance > 0 ? 'text-white' : 'text-error'}`}>
                 ${profile.current_balance}
              </span>
              <span className="text-sm text-text-secondary mb-1">/ ${profile.security_deposit_initial}</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 text-sm flex justify-between">
              <span className="text-text-secondary">Fines Incurred:</span>
              <span className="text-error font-bold">-${profile.security_deposit_initial - profile.current_balance}</span>
            </div>
          </div>

          {/* Fine History */}
          <div className="bg-surface/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Recent Deductions</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {fines.length > 0 ? (
                fines.map(fine => (
                  <div key={fine.id} className="p-3 rounded-lg bg-background/50 border border-white/5 flex justify-between items-start">
                    <span className="text-gray-300 text-sm">{fine.reason}</span>
                    <strong className="text-error font-mono text-sm whitespace-nowrap">-${fine.amount}</strong>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <span className="text-2xl block mb-2">✨</span>
                  <p className="text-sm">Clean record! Keep it up!</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;