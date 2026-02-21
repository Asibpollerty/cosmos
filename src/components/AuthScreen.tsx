import { supabase } from '../supabaseClient';
import { useState } from 'react';
import { User } from '../types';
import { generateId, hashPassword, findUserByUsername, saveUser } from '../utils/storage';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedUsername = username.trim().toLowerCase();

    // Базовые проверки полей
    if (!normalizedUsername || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      setError('Username must be 3-20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      setError('Username can only contain letters, numbers and underscores');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const passwordHash = hashPassword(password);

    if (isRegister) {
      try {
        // 1) Проверка в Supabase: занят ли ник
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', normalizedUsername)
          .maybeSingle();

        if (checkError) {
          setError('Database error: ' + checkError.message);
          return;
        }

        if (existingUser) {
          setError('Username already taken');
          return;
        }

        const user: User = {
          id: generateId(),
          username: normalizedUsername,
          displayName: displayName.trim() || normalizedUsername,
          passwordHash,
          createdAt: Date.now(),
        };

        // 2) Запись в Supabase
        const { error: dbError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, username: user.username }]);

        if (dbError) {
          setError('Database error: ' + dbError.message);
          return;
        }

        // Локально сохраняем и входим
        saveUser(user);
        onLogin(user);
      } catch {
        setError('Connection error. Please try again.');
      }
    } else {
      // ЛОГИКА ВХОДА
      const user = findUserByUsername(normalizedUsername);
      if (!user || user.passwordHash !== passwordHash) {
        setError('Invalid username or password');
        return;
      }
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Stellar Messenger</h1>
          <p className="text-gray-400 text-sm">
            {isRegister ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-gray-300 mb-1">
              @Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-white/50 transition-colors"
              placeholder="your_username"
              autoComplete="username"
            />
          </div>

          {isRegister && (
            <div>
              <label htmlFor="displayName" className="block text-sm text-gray-300 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-white/50 transition-colors"
                placeholder="Your Name"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-white/50 transition-colors"
              placeholder="••••••••"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center animate-fade-in" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-white/50"
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister((v) => !v);
              setError('');
              setPassword('');
              setDisplayName('');
            }}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}