import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

function InfoHub() {
  const { profile } = useAuth(); 
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Basic Modules
        const { data: modulesData, error: modError } = await supabase
          .from('modules')
          .select('*')
          .order('day', { ascending: true })
          .order('start_time', { ascending: true, nullsFirst: false });
        if (modError) throw modError;

        // 2. Fetch Assignments for this user's team
        // We get everything and filter in JS to handle the JSON array safely
        const { data: assignmentsData, error: assignError } = await supabase
          .from('module_assignments')
          .select('*');
          
        if (assignError) console.error("Assignment fetch error (non-critical):", assignError);

        // 3. Merge Logic
        const myTeamName = profile?.team_name; 

        const mergedModules = modulesData.map(mod => {
          // Check for assignment (Using == for loose equality safe for int/string IDs)
          const myAssignment = assignmentsData?.find(a => 
            a.module_id == mod.id && 
            a.assigned_team_names && 
            a.assigned_team_names.includes(myTeamName)
          );

          if (myAssignment) {
            // Override default values only if custom value exists
            return {
              ...mod,
              venue: myAssignment.custom_venue || mod.venue,
              venue_map_url: myAssignment.custom_venue_map_url || mod.venue_map_url,
              description: myAssignment.custom_case_study || mod.description,
              round_guidelines: myAssignment.custom_round_guidelines || mod.round_guidelines,
              submission_link: myAssignment.custom_submission_link || mod.submission_link,
              note: myAssignment.custom_note || mod.note
            };
          }
          return mod;
        });

        setModules(mergedModules);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchEventData();
    }
  }, [profile]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "Time TBD";
    return new Date(timeStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white underline break-all transition-colors">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) return <div className="animate-pulse text-text-secondary">Loading event info...</div>;
  if (error) return <div className="p-4 bg-error/10 text-error border border-error/20 rounded-lg">Error: {error}</div>;

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Event Information</h1>
        <p className="text-sm md:text-base text-text-secondary">All the details you need for your modules and venues.</p>
      </div>

      <div className="grid gap-6">
        {modules.map(module => (
          <div key={module.id} className="bg-surface rounded-2xl border border-white/10 p-6 md:p-8 hover:border-primary/30 transition-all duration-300 shadow-lg">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{module.name}</h2>
                <div className="flex gap-2">
                  <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-text-secondary uppercase tracking-widest border border-white/10">
                    Day {module.day}
                  </span>
                  {module.venue && (
                     <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-text-secondary border border-white/10">
                     📍 {module.venue}
                   </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-background/50 px-4 py-2 rounded-lg border border-white/5">
                <div className="text-right">
                  <div className="text-xs text-text-secondary uppercase">Start Time</div>
                  <div className="font-mono text-primary font-bold">{formatTime(module.start_time)}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {module.round_guidelines && (
                <div className="p-5 bg-background/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📋</span>
                    <strong className="text-white text-sm uppercase tracking-wider">Round Guidelines</strong>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-1">
                    {renderWithLinks(module.round_guidelines)}
                  </p>
                </div>
              )}

              {module.submission_link && (
                <div className="p-5 bg-background/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📤</span>
                    <strong className="text-white text-sm uppercase tracking-wider">Submission</strong>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-1">
                    {renderWithLinks(module.submission_link)}
                  </p>
                </div>
              )}

              {module.description && (
                <div className="p-5 bg-background/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                   <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📖</span>
                    <strong className="text-white text-sm uppercase tracking-wider">Case Study</strong>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-1">
                    {renderWithLinks(module.description)}
                  </p>
                </div>
              )}

              {module.note && (
                <div className="p-5 bg-background/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                   <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">💡</span>
                    <strong className="text-white text-sm uppercase tracking-wider">Note</strong>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-1">
                    {renderWithLinks(module.note)}
                  </p>
                </div>
              )}
            </div>
            
            {module.venue_map_url && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <a 
                  href={module.venue_map_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/10 text-secondary hover:bg-secondary hover:text-black font-bold rounded-lg transition-all duration-200"
                >
                  📍 View Venue Map
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default InfoHub;