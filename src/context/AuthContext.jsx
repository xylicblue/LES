// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // === NEW: Auto-logout on Tab Switch ===
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Check if the page is hidden (user switched tabs, minimized window, etc.)
      if (document.visibilityState === 'hidden') {
        // Trigger Supabase sign out
        await supabase.auth.signOut();
      }
    };

    // Add the event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  // ======================================

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

    // 2. Initial Session Load
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

    // 3. Listen for Supabase Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession);
          if (!profile) await fetchProfile(currentSession.user.id);
        } else {
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