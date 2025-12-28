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

    // --- 4. NEW: Auto-Logout on Tab Switch ---
    const handleVisibilityChange = async () => {
      // If the user hides the tab (switches tabs, minimizes window)
      if (document.hidden) {
        console.log("Tab hidden: Auto-logging out for security/connection reset.");
        
        // 1. Clear local state immediately to trigger redirect
        if (mounted) {
          setSession(null);
          setProfile(null);
        }

        // 2. Kill the Supabase session
        await supabase.auth.signOut();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

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