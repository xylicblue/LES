// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

// Create the context
const AuthContext = createContext();

// Create the provider component
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // <-- NEW: Store user profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function fetches the user's profile from our 'profiles' table
    const getProfile = async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      }
      
      setProfile(data);
    };

    // Get the initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        await getProfile(session.user.id); // <-- NEW: Fetch profile if session exists
      }
      setLoading(false);
    });

    // Listen for changes in auth state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await getProfile(session.user.id); // <-- NEW: Fetch profile on login
        } else {
          setProfile(null); // <-- NEW: Clear profile on logout
        }
      }
    );

    // Clean up the subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Updated value to provide session AND profile
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

// Create a custom hook to use the context
export function useAuth() {
  return useContext(AuthContext);
}