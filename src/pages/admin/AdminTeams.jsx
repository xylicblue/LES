import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ManageTeamModal from '../../components/admin/ManageTeamModal';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';

function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    const { data: teamsData, error: teamsError } = await supabase.from('profiles').select('*').eq('role', 'delegate').order('team_name', { ascending: true });
    if (teamsError) { setError(teamsError.message); setLoading(false); return; }
    setTeams(teamsData);
    const { data: modulesData, error: modulesError } = await supabase.from('modules').select('*').order('day', { ascending: true }).order('name', { ascending: true });
    if (modulesError) { setError(modulesError.message); setLoading(false); return; }
    setModules(modulesData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (team) => { setSelectedTeam(team); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedTeam(null); fetchData(); };

  if (loading) return <div className="p-8 text-text-secondary">Loading teams...</div>;
  if (error) return <div className="p-8 text-error bg-red-900/20 border border-red-900 rounded">Error: {error}</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Manage Team Progress & Fines</h1>
        <p className="text-text-secondary">
          Click "Manage" on a team to update their progress or add a fine.
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-text-secondary font-semibold">
              <tr>
                <th className="px-6 py-4">Team Name</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-white/5 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-white">{team.team_name}</td>
                  <td className={`px-6 py-4 font-mono font-bold ${team.current_balance < 0 ? 'text-error' : 'text-success'}`}>
                    ${team.current_balance}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => openModal(team)} 
                      className="px-4 py-2 text-sm bg-transparent border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-all duration-200"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedTeam && (
        <Modal 
          open={isModalOpen} 
          onClose={closeModal} 
          center
          classNames={{
            modal: 'bg-surface rounded-xl border border-white/10 shadow-2xl p-0',
            closeButton: 'fill-white'
          }}
          styles={{
            modal: { backgroundColor: '#1e1e1e', borderRadius: '1rem', padding: 0 }
          }}
        >
          <ManageTeamModal 
            team={selectedTeam} 
            modules={modules} 
          />
        </Modal>
      )}
    </div>
  );
}

export default AdminTeams;