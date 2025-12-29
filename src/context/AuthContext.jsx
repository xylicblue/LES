// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Helper to fetch profile
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

    // 2. FORCE LOGOUT on Initial Load / Refresh
    const initializeAuth = async () => {
      try {
        // Instead of getting the session, we force a sign out.
        // This clears any persisted session, forcing the user to log in again.
        await supabase.auth.signOut();
        
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth clear error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 3. Listen for Tab Switching (Visibility Change)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or minimized -> Logout
        await supabase.auth.signOut();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Listen for Supabase Auth Changes (Login events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (currentSession) {
          // User just logged in
          setSession(currentSession);
          if (!profile) await fetchProfile(currentSession.user.id);
        } else {
          // User logged out
          setSession(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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