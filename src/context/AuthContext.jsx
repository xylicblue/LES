import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // --- 1. Helper to fetch profile ---
    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (mounted && !error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    // --- 2. Initial Load ---
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted && initialSession) {
          setSession(initialSession);
          await fetchProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // --- 3. Auth State Listener ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        if (currentSession) {
          setSession(currentSession);
          // Fetch profile if we don't have it yet
          if (!profile) await fetchProfile(currentSession.user.id);
        } else {
          // Logged out
          setSession(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // --- 4. THE FIX: "Ping" Check on Tab Focus ---
    const handleTabFocus = async () => {
      // A. Check if Supabase thinks we have a session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        // If Supabase says "No Session", ensure we are logged out
        setSession(null);
        setProfile(null);
        return;
      }

      // B. REALITY CHECK: Try to read from the DB. 
      // If this fails with 403/401, our token is dead ("Fake Logged In" state).
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentSession.user.id)
        .single();

      if (dbError) {
        console.warn("Stale/Invalid session detected on focus. Forcing logout.");
        
        // 1. Kill the local state immediately (Redirects to Login)
        setSession(null);
        setProfile(null);
        
        // 2. Tell Supabase to cleanup
        await supabase.auth.signOut();
      }
    };

    window.addEventListener('focus', handleTabFocus);
    window.addEventListener('visibilitychange', handleTabFocus);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleTabFocus);
      window.removeEventListener('visibilitychange', handleTabFocus);
    };
  }, []); 

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