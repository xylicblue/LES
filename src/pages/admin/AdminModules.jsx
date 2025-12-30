import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';

// Helper: Converts "1-5, 10" into ["YLES-001", "YLES-002"...]
// Improved to prevent errors with empty strings or bad math
const parseTeamInput = (input) => {
  if (!input || typeof input !== 'string') return [];
  const teamNames = new Set();
  const parts = input.split(',').map(s => s.trim()).filter(s => s);
  
  parts.forEach(part => {
    try {
      if (part.includes('-')) {
        const ranges = part.split('-').map(n => parseInt(n, 10));
        if (ranges.length === 2) {
          const [start, end] = ranges;
          // Limit range size to prevent browser crash on typo (e.g. 1-100000)
          if (!isNaN(start) && !isNaN(end) && start <= end && (end - start) < 500) {
            for (let i = start; i <= end; i++) {
              teamNames.add(`YLES-${i.toString().padStart(3, '0')}`);
            }
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num)) {
          teamNames.add(`YLES-${num.toString().padStart(3, '0')}`);
        }
      }
    } catch (err) {
      console.warn("Error parsing part:", part, err);
    }
  });
  return Array.from(teamNames);
};

const defaultModuleState = { 
  id: null, name: '', day: 1, start_time: '', venue: '', venue_map_url: '', 
  description: '', round_guidelines: '', submission_link: '', note: '' 
};

function AdminModules() {
  const { profile } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [currentModule, setCurrentModule] = useState(defaultModuleState);
  
  // Variable Content State
  const [isVariable, setIsVariable] = useState(false);
  const [assignments, setAssignments] = useState([]); 

  if (profile && !['admin', 'events'].includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }

  const fetchModules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('modules').select('*').order('day', { ascending: true }).order('start_time', { ascending: true });
    if (error) setError(error.message); 
    else setModules(data);
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  const openCreateModal = () => { 
    setCurrentModule(defaultModuleState); 
    setIsVariable(false);
    setAssignments([]);
    setIsModalOpen(true); 
  };
  
  const openEditModal = async (module) => {
    const formattedTime = module.start_time ? new Date(new Date(module.start_time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';
    
    setCurrentModule({ 
      ...module, 
      start_time: formattedTime,
      round_guidelines: module.round_guidelines || '',
      submission_link: module.submission_link || '',
      note: module.note || ''
    });

    // Fetch existing assignments for this module
    const { data: assignmentData } = await supabase
      .from('module_assignments')
      .select('*')
      .eq('module_id', module.id);
    
    if (assignmentData && assignmentData.length > 0) {
      setIsVariable(true);
      setAssignments(assignmentData);
    } else {
      setIsVariable(false);
      setAssignments([]);
    }

    setIsModalOpen(true);
  };
  
  const closeModal = () => { setIsModalOpen(false); };

  const handleChange = (e) => { 
    const { name, value } = e.target; 
    setCurrentModule(prev => ({ ...prev, [name]: value })); 
  };
  
  // === GROUP HANDLERS ===
  const addGroup = () => {
    setAssignments([...assignments, {
      id: `temp-${Date.now()}`,
      teams_input: '',
      custom_venue: '',
      custom_venue_map_url: '',
      custom_case_study: '',
      custom_round_guidelines: '',
      custom_submission_link: '',
      custom_note: ''
    }]);
  };

  const removeGroup = (index) => {
    const newGroups = [...assignments];
    newGroups.splice(index, 1);
    setAssignments(newGroups);
  };

  const handleGroupChange = (index, field, value) => {
    const newGroups = [...assignments];
    newGroups[index] = { ...newGroups[index], [field]: value };
    setAssignments(newGroups);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const moduleToSubmit = { ...currentModule, start_time: currentModule.start_time ? new Date(currentModule.start_time).toISOString() : null };
    
    let moduleId = currentModule.id;

    try {
      // 1. Save Module Logic
      if (moduleId) {
        const { error } = await supabase.from('modules').update(moduleToSubmit).eq('id', moduleId);
        if (error) throw new Error("Module Update Error: " + error.message);
      } else {
        const { id, ...newModule } = moduleToSubmit;
        const { data, error } = await supabase.from('modules').insert(newModule).select().single();
        if (error) throw new Error("Module Create Error: " + error.message);
        moduleId = data.id;
      }

      // 2. Save Assignments Logic
      if (moduleId) {
        // Clear old assignments
        await supabase.from('module_assignments').delete().eq('module_id', moduleId);

        if (isVariable && assignments.length > 0) {
          const assignmentsToInsert = assignments.map(a => ({
            module_id: moduleId, // Ensure this matches DB type (bigint)
            teams_input: a.teams_input,
            assigned_team_names: parseTeamInput(a.teams_input), // Convert "1-5" to JSON list
            custom_venue: a.custom_venue || null,
            custom_venue_map_url: a.custom_venue_map_url || null,
            custom_case_study: a.custom_case_study || null,
            custom_round_guidelines: a.custom_round_guidelines || null,
            custom_submission_link: a.custom_submission_link || null,
            custom_note: a.custom_note || null
          }));
          
          // Debug check before sending
          console.log("Saving assignments:", assignmentsToInsert);

          const { error: assignError } = await supabase.from('module_assignments').insert(assignmentsToInsert);
          if (assignError) throw new Error("Assignment Save Error: " + assignError.message);
        }
      }

      closeModal(); 
      fetchModules();

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };
  
  const handleDelete = async (moduleId) => {
    if (window.confirm('Are you sure? This deletes the module and all assignments.')) {
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) { setError(error.message); } else { fetchModules(); }
    }
  };

  if (loading) return <div className="p-8 text-text-secondary">Loading modules...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Manage Modules</h1>
        <button onClick={openCreateModal} className="px-4 py-2 bg-success text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg whitespace-nowrap">
          + Create New Module
        </button>
      </div>

      {error && <div className="p-4 mb-6 bg-error/20 border border-error text-red-200 rounded-lg">Error: {error}</div>}

      <div className="bg-surface rounded-xl border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-text-secondary font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Day</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Venue</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {modules.map(module => (
                <tr key={module.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{module.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{module.day}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{module.start_time ? new Date(module.start_time).toLocaleString() : 'TBD'}</td>
                  <td className="px-6 py-4 text-text-secondary">{module.venue}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => openEditModal(module)} className="text-blue-400 hover:text-blue-300 px-3 py-2 mr-2">Edit</button>
                    <button onClick={() => handleDelete(module.id)} className="text-error hover:text-red-400 px-3 py-2">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        open={isModalOpen} 
        onClose={closeModal} 
        center
        classNames={{ modal: 'bg-surface rounded-xl border border-white/10 shadow-2xl p-0', closeButton: 'fill-white' }}
        styles={{ modal: { backgroundColor: '#1e1e1e', borderRadius: '1rem', padding: 0, maxWidth: '800px' } }}
      >
        <div className="p-4 md:p-8 w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">{currentModule.id ? 'Edit Module' : 'Create New Module'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4 border-b border-white/10 pb-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Default Settings</h3>
              
              <div className="space-y-1">
                <label className="text-sm text-text-secondary">Module Name</label>
                <input type="text" name="name" value={currentModule.name} onChange={handleChange} required className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Day</label>
                  <input type="number" name="day" min="1" max="4" value={currentModule.day} onChange={handleChange} required className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Start Time</label>
                  <input type="datetime-local" name="start_time" value={currentModule.start_time} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Default Venue</label>
                  <input type="text" name="venue" value={currentModule.venue} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Venue Map URL</label>
                  <input type="text" name="venue_map_url" value={currentModule.venue_map_url} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Default Guidelines</label>
                  <textarea name="round_guidelines" value={currentModule.round_guidelines} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none h-20 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Default Case Study</label>
                  <textarea name="description" value={currentModule.description} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none h-20 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Default Submission Link</label>
                  <input type="text" name="submission_link" value={currentModule.submission_link} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none text-sm" />
                </div>
                 <div className="space-y-1">
                  <label className="text-sm text-text-secondary">Default Note</label>
                  <textarea name="note" value={currentModule.note} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none h-20 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Variable Allotments</h3>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={isVariable} onChange={(e) => setIsVariable(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full ${isVariable ? 'bg-success' : 'bg-gray-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${isVariable ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm text-white font-medium">Enable Overrides</div>
                </label>
              </div>

              {isVariable && (
                <div className="space-y-6 bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-text-secondary">
                    Enter team numbers (e.g. "1-20, 55"). These teams will see the custom details below.
                  </p>
                  
                  {assignments.map((group, index) => (
                    <div key={group.id || index} className="p-4 bg-background border border-white/10 rounded-lg relative">
                      <button type="button" onClick={() => removeGroup(index)} className="absolute top-2 right-2 text-xs text-error hover:text-white border border-error/30 hover:bg-error px-2 py-1 rounded transition">Remove Group</button>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs text-success font-bold uppercase">Teams (e.g., 1-10, 15)</label>
                          <input 
                            type="text" 
                            value={group.teams_input} 
                            onChange={(e) => handleGroupChange(index, 'teams_input', e.target.value)} 
                            className="w-full p-2 bg-surface border border-white/20 rounded text-white text-sm focus:border-success focus:outline-none" 
                            placeholder="e.g. 1-20, 25, 30"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div>
                              <label className="text-xs text-text-secondary">Custom Venue</label>
                              <input type="text" value={group.custom_venue} onChange={(e) => handleGroupChange(index, 'custom_venue', e.target.value)} className="w-full p-2 bg-surface border border-white/10 rounded text-white text-sm" placeholder="Leave blank to use default" />
                           </div>
                           <div>
                              <label className="text-xs text-text-secondary">Custom Case Study</label>
                              <textarea value={group.custom_case_study} onChange={(e) => handleGroupChange(index, 'custom_case_study', e.target.value)} className="w-full p-2 bg-surface border border-white/10 rounded text-white text-sm h-10" placeholder="Leave blank to use default" />
                           </div>
                           <div>
                              <label className="text-xs text-text-secondary">Custom Submission Link</label>
                              <input type="text" value={group.custom_submission_link} onChange={(e) => handleGroupChange(index, 'custom_submission_link', e.target.value)} className="w-full p-2 bg-surface border border-white/10 rounded text-white text-sm" placeholder="Leave blank to use default" />
                           </div>
                           <div>
                              <label className="text-xs text-text-secondary">Custom Guidelines</label>
                              <textarea value={group.custom_round_guidelines} onChange={(e) => handleGroupChange(index, 'custom_round_guidelines', e.target.value)} className="w-full p-2 bg-surface border border-white/10 rounded text-white text-sm h-10" placeholder="Leave blank to use default" />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addGroup} className="w-full py-2 bg-white/5 border border-white/10 text-text-secondary hover:text-white rounded hover:bg-white/10 transition text-sm">
                    + Add Assignment Group
                  </button>
                </div>
              )}
            </div>

            <button type="submit" className="w-full py-3 mt-4 bg-primary text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg">
              {currentModule.id ? 'Save Changes' : 'Create Module'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default AdminModules;