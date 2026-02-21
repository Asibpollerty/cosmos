import { User, Server, DirectMessage, Channel, ChatRoom } from '../types';

interface SidebarProps {
  currentUser: User;
  servers: Server[];
  dms: DirectMessage[];
  users: User[];
  activeRoom: ChatRoom | null;
  onlineUsers: Set<string>;
  onSelectDM: (userId: string) => void;
  onSelectChannel: (server: Server, channel: Channel) => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  onCreateServer: () => void;
  onLogout: () => void;
}

export function Sidebar({
  currentUser,
  servers,
  dms,
  users,
  activeRoom,
  onlineUsers,
  onSelectDM,
  onSelectChannel,
  onOpenProfile,
  onOpenSearch,
  onCreateServer,
  onLogout
}: SidebarProps) {
  const getOtherUser = (dm: DirectMessage) => {
    const otherId = dm.userAId === currentUser.id ? dm.userBId : dm.userAId;
    return users.find(u => u.id === otherId);
  };

  return (
    <aside className="hidden lg:flex w-64 lg:w-72 h-full glass-panel flex-col relative z-10 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-semibold">{currentUser.displayName[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-semibold text-white truncate">{currentUser.displayName}</p>
            <p className="text-xs text-gray-400 truncate">@{currentUser.username}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500" title="Online" />
        </button>
      </div>

      {/* Search button */}
      <div className="p-3 border-b border-white/10">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="text-sm">Search users...</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Direct Messages */}
        <div className="p-3">
          <h2 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Direct Messages
          </h2>
          <div className="space-y-1">
            {dms.map(dm => {
              const otherUser = getOtherUser(dm);
              if (!otherUser) return null;
              
              const isActive = activeRoom?.id === dm.id;
              const isOnline = onlineUsers.has(otherUser.id);
              
              return (
                <button
                  key={dm.id}
                  onClick={() => onSelectDM(otherUser.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      {otherUser.avatarUrl ? (
                        <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold">{otherUser.displayName[0].toUpperCase()}</span>
                      )}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                    )}
                  </div>
                  <span className="text-sm truncate">{otherUser.displayName}</span>
                </button>
              );
            })}
            {dms.length === 0 && (
              <p className="px-2 py-4 text-sm text-gray-500 text-center">
                No conversations yet
              </p>
            )}
          </div>
        </div>

        {/* Servers */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Servers
            </h2>
            <button
              onClick={onCreateServer}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Create or join server"
            >
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {servers.map(server => (
              <div key={server.id} className="space-y-1">
                <div className="px-2 py-1 text-sm font-medium text-gray-300 truncate">
                  {server.name}
                </div>
                {server.channels.map(channel => {
                  const isActive = activeRoom?.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => onSelectChannel(server, channel)}
                      className={`w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-gray-500">#</span>
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {servers.length === 0 && (
              <p className="px-2 py-4 text-sm text-gray-500 text-center">
                No servers yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
