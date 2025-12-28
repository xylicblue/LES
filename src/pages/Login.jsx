import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const email = username.toLowerCase() + '@investo.local';

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      console.log('Login successful!');
    } catch (error) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-gradient-to-br from-[#1a0e14] via-[#121212] to-[#2d1b69] px-4">
      <div className="w-full max-w-md p-4 sm:p-8 rounded-2xl bg-surface/60 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">YLES Login</h2>
          <p className="text-sm sm:text-base text-text-secondary">Sign in with your assigned team credentials</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              id="username"
              type="text"
              placeholder="Team Username (e.g., YLES-001)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              disabled={loading}
              required
            />
          </div>

          <div>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3.5 mt-4 rounded-lg font-bold text-white bg-gradient-to-r from-[#e52e71] to-[#ff8a00] hover:-translate-y-0.5 transform transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && (
            <div className="p-3 text-sm text-center text-red-200 bg-red-900/30 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;