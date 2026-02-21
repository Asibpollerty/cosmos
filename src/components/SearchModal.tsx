import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface SearchModalProps {
  onSelectUser: (user: User) => void;
  onClose: () => void;
}

export function SearchModal({ onSelectUser, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      // Ищем юзера в таблице profiles по колонке username
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`) // Ищет совпадения в любом месте ника
        .limit(5);

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    };

    const timer = setTimeout(searchUsers, 500); // Задержка, чтобы не спамить базу
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Search users..."
            className="flex-1 bg-transparent text-white outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {loading && <div className="p-4 text-center text-gray-500">Searching...</div>}
          {!loading && results.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user);
                onClose();
              }}
              className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <div className="text-white font-medium">@{user.username}</div>
                <div className="text-gray-500 text-sm">Space Citizen</div>
              </div>
            </button>
          ))}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}