import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';

// Updated state to include new fields
const defaultModuleState = { 
  id: null, 
  name: '', 
  day: 1, 
  start_time: '', 
  venue: '', 
  venue_map_url: '', 
  description: '',      // This is now "Case Study"
  round_guidelines: '', // Google Form links etc.
  submission_link: '',  // === NEW FIELD ===
  note: ''              
};

function AdminModules() {
  const { profile } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState(defaultModuleState);

  if (profile && !['admin', 'events'].includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }

  const fetchModules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('modules').select('*').order('day', { ascending: true }).order('start_time', { ascending: true });
    if (error) { setError(error.message); } else { setModules(data); }
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  const openCreateModal = () => { setCurrentModule(defaultModuleState); setIsModalOpen(true); };
  
  const openEditModal = (module) => {
    const formattedTime = module.start_time ? new Date(new Date(module.start_time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';
    // Ensure new fields are not undefined to avoid uncontrolled input warnings
    setCurrentModule({ 
      ...module, 
      start_time: formattedTime,
      round_guidelines: module.round_guidelines || '',
      submission_link: module.submission_link || '', // === NEW FIELD HANDLER ===
      note: module.note || ''
    });
    setIsModalOpen(true);
  };
  
  const closeModal = () => { setIsModalOpen(false); };
  const handleChange = (e) => { const { name, value } = e.target; setCurrentModule(prev => ({ ...prev, [name]: value })); };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const moduleToSubmit = { ...currentModule, start_time: currentModule.start_time ? new Date(currentModule.start_time).toISOString() : null };
    
    if (currentModule.id) {
      const { error } = await supabase.from('modules').update(moduleToSubmit).eq('id', currentModule.id);
      if (error) setError(error.message);
    } else {
      const { id, ...newModule } = moduleToSubmit;
      const { error } = await supabase.from('modules').insert(newModule);
      if (error) setError(error.message);
    }
    closeModal(); fetchModules();
  };
  
  const handleDelete = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
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
                <th className="px-3 md:px-6 py-3 md:py-4">Name</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Day</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Time</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Venue</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {modules.map(module => (
                <tr key={module.id} className="hover:bg-white/5 transition-colors duration-150">
                  <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-white">{module.name}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-text-secondary">{module.day}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-text-secondary text-sm">{module.start_time ? new Date(module.start_time).toLocaleString() : 'TBD'}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-text-secondary">{module.venue}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                    <button onClick={() => openEditModal(module)} className="text-blue-400 hover:text-blue-300 px-3 py-2 mr-2 transition-colors rounded">Edit</button>
                    <button onClick={() => handleDelete(module.id)} className="text-error hover:text-red-400 px-3 py-2 transition-colors rounded">Delete</button>
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
        styles={{ modal: { backgroundColor: '#1e1e1e', borderRadius: '1rem', padding: 0 } }}
      >
        <div className="p-4 md:p-8 w-full max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">{currentModule.id ? 'Edit Module' : 'Create New Module'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Standard Fields */}
            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Module Name</label>
              <input type="text" name="name" value={currentModule.name} onChange={handleChange} required className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-text-secondary">Day</label>
                <input type="number" name="day" min="1" max="3" value={currentModule.day} onChange={handleChange} required className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-text-secondary">Start Time</label>
                <input type="datetime-local" name="start_time" value={currentModule.start_time} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Venue</label>
              <input type="text" name="venue" value={currentModule.venue} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Venue Map URL</label>
              <input type="text" name="venue_map_url" value={currentModule.venue_map_url} onChange={handleChange} className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
            </div>

            {/* --- NEW FIELDS --- */}

            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Round Guidelines (Google Form links etc.)</label>
              <textarea 
                name="round_guidelines" 
                value={currentModule.round_guidelines} 
                onChange={handleChange} 
                placeholder="Paste links and guidelines here..."
                className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none h-24" 
              />
            </div>
            
            {/* === SUBMISSION LINK === */}
            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Submission Link</label>
              <input 
                type="text"
                name="submission_link" 
                value={currentModule.submission_link} 
                onChange={handleChange} 
                placeholder="https://..."
                className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Case Study (Previously Description)</label>
              <textarea 
                name="description" 
                value={currentModule.description} 
                onChange={handleChange} 
                className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none h-24" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Note</label>
              <textarea 
                name="note" 
                value={currentModule.note} 
                onChange={handleChange} 
                placeholder="Important additional info..."
                className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none h-16" 
              />
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