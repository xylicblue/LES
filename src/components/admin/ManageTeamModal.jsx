// src/components/admin/ManageTeamModal.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ManageTeamModal({ team, modules }) {
  const { profile } = useAuth();
  const role = profile?.role;

  // --- PERMISSIONS ---
  const showModules = ['admin', 'events'].includes(role);
  const showFines = ['admin', 'fnr', 'dc'].includes(role);
  const canDeleteFine = ['admin', 'fnr'].includes(role);

  // --- STATE ---
  // Initialize local balance state with the prop value
  const [balance, setBalance] = useState(team.current_balance);
  const [progress, setProgress] = useState({});
  const [fines, setFines] = useState([]);
  const [fineAmount, setFineAmount] = useState(0);
  const [fineReason, setFineReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      // 1. Fetch Module Progress
      const { data: progressData, error: progressError } = await supabase
        .from('team_progress')
        .select('*')
        .eq('team_id', team.id);
      if (progressError) throw progressError;

      const progressMap = progressData.reduce((acc, p) => {
        acc[p.module_id] = p.status;
        return acc;
      }, {});
      setProgress(progressMap);

      // 2. Fetch Fines
      const { data: finesData, error: finesError } = await supabase
        .from('fines')
        .select('*')
        .eq('team_id', team.id)
        .order('created_at', { ascending: false });
      if (finesError) throw finesError;

      setFines(finesData);

      // 3. Fetch Fresh Balance (CRITICAL FIX)
      // We must fetch the team's profile again to see the updated balance after a fine is added/removed
      const { data: teamData, error: teamError } = await supabase
        .from('profiles')
        .select('current_balance')
        .eq('id', team.id)
        .single();
        
      if (!teamError && teamData) {
        setBalance(teamData.current_balance);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  // --- HANDLERS ---
  const handleProgressChange = async (moduleId, newStatus) => {
    setMessage(null); setError(null);
    setProgress(prev => ({ ...prev, [moduleId]: newStatus }));
    
    const { error } = await supabase
      .from('team_progress')
      .upsert(
        { team_id: team.id, module_id: moduleId, status: newStatus }, 
        { onConflict: 'team_id, module_id' }
      );
      
    if (error) setError('Error: ' + error.message);
    else setMessage('Progress updated!');
  };

  const handleAddFine = async (e) => {
    e.preventDefault();
    setMessage(null); setError(null);
    if (fineAmount <= 0 || !fineReason) { setError('Invalid input.'); return; }

    // 1. Insert Fine
    const { error: insertError } = await supabase
      .from('fines')
      .insert({ 
        team_id: team.id, 
        amount: fineAmount, 
        reason: fineReason, 
        admin_issuer_id: profile.id 
      });
    if (insertError) { setError(insertError.message); return; }

    // 2. Recalculate Balance
    const { error: rpcError } = await supabase.rpc('recalculate_balance', { p_team_id: team.id });
    
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setMessage('Fine added!');
      setFineAmount(0); 
      setFineReason(''); 
      // 3. Refresh data to show new balance immediately
      fetchData(); 
    }
  };

  const handleDeleteFine = async (fineId) => {
    if (!canDeleteFine) return;
    setMessage(null); setError(null);
    
    // 1. Delete Fine
    const { error: deleteError } = await supabase.from('fines').delete().eq('id', fineId);
    if (deleteError) { setError(deleteError.message); return; }

    // 2. Recalculate Balance (This adds the money back)
    const { error: rpcError } = await supabase.rpc('recalculate_balance', { p_team_id: team.id });
    
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setMessage('Fine removed & balance updated!');
      // 3. Refresh data to show new balance immediately
      fetchData();
    }
  };

  const handleWipeAllFines = async () => {
    if (!canDeleteFine) return;
    if (!window.confirm('Delete ALL fines? This will restore their full deposit.')) return;
    setMessage(null); setError(null);
    
    // 1. Delete All Fines
    const { error: deleteError } = await supabase.from('fines').delete().eq('team_id', team.id);
    if (deleteError) { setError(deleteError.message); return; }

    // 2. Recalculate Balance
    const { error: rpcError } = await supabase.rpc('recalculate_balance', { p_team_id: team.id });
    
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setMessage('All fines wiped & balance restored!');
      // 3. Refresh data
      fetchData();
    }
  };

  if (loading && !balance) return <div className="p-4 text-text-secondary">Loading details...</div>;

  return (
    <div className="w-[500px] max-h-[85vh] overflow-y-auto p-6 bg-surface custom-scrollbar rounded-xl">
      <div className="border-b border-white/10 pb-4 mb-6">
        <h2 className="text-xl font-bold text-white">Manage: <span className="text-primary">{team.team_name}</span></h2>
      </div>
      
      {message && <div className="mb-4 p-3 bg-success/20 border border-success/30 text-green-200 rounded-lg text-sm flex items-center gap-2">✅ {message}</div>}
      {error && <div className="mb-4 p-3 bg-error/20 border border-error/30 text-red-200 rounded-lg text-sm flex items-center gap-2">⚠️ {error}</div>}
      
      {/* 1. BALANCE SECTION */}
      {showFines && (
        <div className="mb-8 p-5 bg-background/50 rounded-xl border border-white/5 flex justify-between items-center shadow-inner">
          <span className="text-text-secondary font-medium">Current Balance</span>
          <div className="text-right">
            <span className={`text-2xl font-mono font-bold block ${balance < 0 ? 'text-error' : 'text-success'}`}>
              ${balance}
            </span>
            <span className="text-xs text-text-secondary">Initial Deposit: ${team.security_deposit_initial}</span>
          </div>
        </div>
      )}

      {/* 2. MODULES SECTION */}
      {showModules && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Module Progress</h3>
          <div className="space-y-3">
            {modules.map(module => {
              const currentStatus = progress[module.id] || 'upcoming';
              return (
                <div key={module.id} className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <strong className="text-white text-sm font-medium">{module.name}</strong>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                      currentStatus === 'completed' ? 'bg-success/20 text-success border border-success/20' : 
                      currentStatus === 'eliminated' ? 'bg-error/20 text-error border border-error/20' : 'bg-white/10 text-gray-400 border border-white/5'
                    }`}>
                      {currentStatus}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleProgressChange(module.id, 'completed')} 
                      disabled={currentStatus === 'completed'} 
                      className={`py-1.5 text-xs font-bold rounded transition-all ${
                        currentStatus === 'completed' 
                          ? 'bg-success text-white cursor-default shadow-lg shadow-success/20' 
                          : 'bg-background border border-success/30 text-success hover:bg-success hover:text-white'
                      }`}
                    >
                      PASS
                    </button>
                    <button 
                      onClick={() => handleProgressChange(module.id, 'eliminated')} 
                      disabled={currentStatus === 'eliminated'} 
                      className={`py-1.5 text-xs font-bold rounded transition-all ${
                        currentStatus === 'eliminated' 
                          ? 'bg-error text-white cursor-default shadow-lg shadow-error/20' 
                          : 'bg-background border border-error/30 text-error hover:bg-error hover:text-white'
                      }`}
                    >
                      FAIL
                    </button>
                    <button 
                      onClick={() => handleProgressChange(module.id, 'upcoming')} 
                      disabled={currentStatus === 'upcoming'} 
                      className="py-1.5 text-xs font-bold rounded bg-background border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FINES SECTION */}
      {showFines && (
        <div className="pt-2">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Issue Fine</h3>
          
          {/* FIX: Using Grid to prevent button overflow */}
          <form onSubmit={handleAddFine} className="grid grid-cols-[100px_1fr_auto] gap-3 mb-8">
            <input 
              type="number" 
              placeholder="$" 
              value={fineAmount} 
              onChange={(e) => setFineAmount(parseFloat(e.target.value))} 
              className="w-full p-2.5 bg-background border border-white/10 rounded-lg text-white text-sm focus:border-error focus:ring-1 focus:ring-error focus:outline-none transition-all"
            />
            <input 
              type="text" 
              placeholder="Reason" 
              value={fineReason} 
              onChange={(e) => setFineReason(e.target.value)} 
              className="w-full p-2.5 bg-background border border-white/10 rounded-lg text-white text-sm focus:border-error focus:ring-1 focus:ring-error focus:outline-none transition-all"
            />
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-error text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-error/20 text-sm whitespace-nowrap"
            >
              Add
            </button>
          </form>

          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Fine History</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar bg-background/30 rounded-lg p-2 border border-white/5">
            {fines.length > 0 ? (
              fines.map(fine => (
                <div key={fine.id} className="flex justify-between items-center bg-surface p-3 rounded border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="text-sm">
                    <strong className="text-error mr-3 font-mono">-${fine.amount}</strong>
                    <span className="text-gray-300">{fine.reason}</span>
                  </div>
                  
                  {canDeleteFine && (
                    <button 
                      onClick={() => handleDeleteFine(fine.id)}
                      className="text-xs text-text-secondary hover:text-red-400 hover:bg-white/5 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary italic text-center py-4">No fines recorded.</p>
            )}
          </div>

          {fines.length > 0 && canDeleteFine && (
            <button 
              onClick={handleWipeAllFines}
              className="w-full mt-4 py-3 text-xs font-bold text-error border border-error/30 rounded-lg hover:bg-error hover:text-white transition-all uppercase tracking-widest"
            >
              Wipe All Fines ({fines.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageTeamModal;