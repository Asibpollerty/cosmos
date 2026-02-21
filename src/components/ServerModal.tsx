import { useState } from 'react';
import { Server } from '../types';

interface ServerModalProps {
  servers: Server[];
  onClose: () => void;
  onCreate: (name: string) => void;
  onJoin: (serverId: string) => void;
}

export function ServerModal({ servers, onClose, onCreate, onJoin }: ServerModalProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (name.length < 2 || name.length > 32) {
      alert('Server name must be 2-32 characters');
      return;
    }
    onCreate(name.trim());
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="glass-panel rounded-2xl w-full max-w-md overflow-hidden animate-fade-in"
        role="dialog"
        aria-labelledby="server-title"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="server-title" className="text-xl font-bold text-white">
              {tab === 'create' ? 'Create Server' : 'Join Server'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'create' 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Create New
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'join' 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Join Existing
            </button>
          </div>

          {tab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="serverName" className="block text-sm text-gray-400 mb-1">
                  Server Name
                </label>
                <input
                  id="serverName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Server"
                  maxLength={32}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-white/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Server
              </button>
            </form>
          )}

          {tab === 'join' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {servers.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>No available servers to join</p>
                </div>
              ) : (
                servers.map(server => (
                  <button
                    key={server.id}
                    onClick={() => {
                      onJoin(server.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <span className="font-bold">{server.name[0].toUpperCase()}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white">{server.name}</p>
                        <p className="text-xs text-gray-400">
                          {server.members.length} member{server.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
