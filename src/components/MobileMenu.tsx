import { User, Server, DirectMessage, Channel, ChatRoom } from '../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
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

export function MobileMenu({
  isOpen,
  onClose,
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
}: MobileMenuProps) {
  if (!isOpen) return null;

  const getOtherUser = (dm: DirectMessage) => {
    const otherId = dm.userAId === currentUser.id ? dm.userBId : dm.userAId;
    return users.find(u => u.id === otherId);
  };

  const handleSelectDM = (userId: string) => {
    onSelectDM(userId);
    onClose();
  };

  const handleSelectChannel = (server: Server, channel: Channel) => {
    onSelectChannel(server, channel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="absolute inset-y-0 left-0 w-72 glass-panel animate-slide-in overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={() => { onOpenProfile(); onClose(); }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold">{currentUser.displayName[0].toUpperCase()}</span>
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-white truncate">{currentUser.displayName}</p>
              <p className="text-xs text-gray-400">@{currentUser.username}</p>
            </div>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/10">
          <button
            onClick={() => { onOpenSearch(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-gray-400"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="text-sm">Search users...</span>
          </button>
        </div>

        {/* DMs */}
        <div className="p-3">
          <h2 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase">
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
                  onClick={() => handleSelectDM(otherUser.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg ${
                    isActive ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      {otherUser.avatarUrl ? (
                        <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{otherUser.displayName[0].toUpperCase()}</span>
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
          </div>
        </div>

        {/* Servers */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase">Servers</h2>
            <button
              onClick={() => { onCreateServer(); onClose(); }}
              className="p-1 rounded hover:bg-white/10"
            >
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {servers.map(server => (
              <div key={server.id} className="space-y-1">
                <div className="px-2 py-1 text-sm font-medium text-gray-300">
                  {server.name}
                </div>
                {server.channels.map(channel => {
                  const isActive = activeRoom?.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleSelectChannel(server, channel)}
                      className={`w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm ${
                        isActive ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-gray-500">#</span>
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-white/10 mt-auto">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
