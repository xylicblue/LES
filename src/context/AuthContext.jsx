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
    const getProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (mounted && !error) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    // 2. Setup Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Handle explicit sign-outs or refreshed tokens immediately
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
          setLoading(false);
        } else if (session) {
          setSession(session);
          await getProfile(session.user.id);
          setLoading(false);
        }
      }
    );

    // 3. Initial Load
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        if (session) {
          await getProfile(session.user.id);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    // 4. THE FIX: Revalidate on Tab Focus
    const handleFocus = async () => {
      // Force a session check when user comes back to the tab
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session) {
         setSession(session);
         // Optional: Refresh profile if needed, but session is key
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const value = {
    session,
    profile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}