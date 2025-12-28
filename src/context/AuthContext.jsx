import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (mounted && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    // 1. Initial Session Check
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            await fetchProfile(initialSession.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 2. Event Listener - The Source of Truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log("Auth Event:", event); // Debugging helper

        if (currentSession) {
          setSession(currentSession);
          
          // Only fetch profile if we don't have it, or if the user changed
          // We check 'event' to ensure we don't re-fetch unnecessarily on 'INITIAL_SESSION'
          if (!profile || (profile && profile.id !== currentSession.user.id)) {
            await fetchProfile(currentSession.user.id);
          }
        } else {
          // Logged out
          setSession(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array is correct here

  const value = { session, profile, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}