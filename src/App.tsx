import { useState, useEffect, useCallback } from 'react';
import { StarryBackground } from './components/StarryBackground';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ProfileModal } from './components/ProfileModal';
import { SearchModal } from './components/SearchModal';
import { ServerModal } from './components/ServerModal';
import { MobileMenu } from './components/MobileMenu';
import { User, Server, Channel, DirectMessage, Message, ChatRoom } from './types';
import { 
  getStoredUser, 
  setStoredUser, 
  getUsers, 
  saveUser, 
  getServers, 
  saveServer,
  getMessages,
  saveMessage,
  getDMs,
  saveDM,
  generateId
} from './utils/storage';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [dms, setDms] = useState<DirectMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Load initial data
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
    setUsers(getUsers());
    setServers(getServers());
    setDms(getDMs());
    setMessages(getMessages());
  }, []);

  // Simulate online presence
  useEffect(() => {
    if (currentUser) {
      setOnlineUsers(prev => new Set([...prev, currentUser.id]));
    }
  }, [currentUser]);

  // Broadcast channel for multi-tab communication
  useEffect(() => {
    const channel = new BroadcastChannel('messenger_sync');
    
    channel.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'NEW_MESSAGE':
          setMessages(prev => [...prev, data]);
          break;
        case 'USER_TYPING':
          setTypingUsers(prev => ({
            ...prev,
            [data.roomId]: data.users
          }));
          break;
        case 'USER_ONLINE':
          setOnlineUsers(prev => new Set([...prev, data.userId]));
          break;
        case 'USER_OFFLINE':
          setOnlineUsers(prev => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
          break;
        case 'NEW_SERVER':
          setServers(getServers());
          break;
        case 'NEW_DM':
          setDms(getDMs());
          break;
        case 'USER_UPDATED':
          setUsers(getUsers());
          break;
      }
    };

    return () => channel.close();
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setStoredUser(user);
    setUsers(getUsers());
    
    const channel = new BroadcastChannel('messenger_sync');
    channel.postMessage({ type: 'USER_ONLINE', data: { userId: user.id } });
    channel.close();
  }, []);

  const handleLogout = useCallback(() => {
    if (currentUser) {
      const channel = new BroadcastChannel('messenger_sync');
      channel.postMessage({ type: 'USER_OFFLINE', data: { userId: currentUser.id } });
      channel.close();
    }
    setCurrentUser(null);
    setStoredUser(null);
    setActiveRoom(null);
  }, [currentUser]);

  const handleUpdateProfile = useCallback((updates: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    saveUser(updatedUser);
    setStoredUser(updatedUser);
    setUsers(getUsers());
    
    const channel = new BroadcastChannel('messenger_sync');
    channel.postMessage({ type: 'USER_UPDATED', data: updatedUser });
    channel.close();
  }, [currentUser]);

  const handleSendMessage = useCallback((content: { text?: string; image?: string; voice?: string }) => {
    if (!currentUser || !activeRoom) return;

    const message: Message = {
      id: generateId(),
      senderId: currentUser.id,
      roomId: activeRoom.id,
      roomType: activeRoom.type,
      text: content.text,
      imageUrl: content.image,
      voiceUrl: content.voice,
      createdAt: Date.now(),
      readBy: [currentUser.id]
    };

    saveMessage(message);
    setMessages(prev => [...prev, message]);

    const channel = new BroadcastChannel('messenger_sync');
    channel.postMessage({ type: 'NEW_MESSAGE', data: message });
    channel.close();
  }, [currentUser, activeRoom]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!currentUser || !activeRoom) return;

    const channel = new BroadcastChannel('messenger_sync');
    const roomId = activeRoom.id;
    
    setTypingUsers(prev => {
      const current = prev[roomId] || [];
      let updated: string[];
      
      if (isTyping && !current.includes(currentUser.id)) {
        updated = [...current, currentUser.id];
      } else if (!isTyping) {
        updated = current.filter(id => id !== currentUser.id);
      } else {
        updated = current;
      }
      
      channel.postMessage({ 
        type: 'USER_TYPING', 
        data: { roomId, users: updated } 
      });
      
      return { ...prev, [roomId]: updated };
    });
    
    channel.close();
  }, [currentUser, activeRoom]);

  const handleOpenDM = useCallback((userId: string) => {
    if (!currentUser) return;
    
    // Check if DM already exists
    let dm = dms.find(d => 
      (d.userAId === currentUser.id && d.userBId === userId) ||
      (d.userAId === userId && d.userBId === currentUser.id)
    );
    
    if (!dm) {
      dm = {
        id: generateId(),
        userAId: currentUser.id,
        userBId: userId,
        createdAt: Date.now()
      };
      saveDM(dm);
      setDms(prev => [...prev, dm!]);
      
      const channel = new BroadcastChannel('messenger_sync');
      channel.postMessage({ type: 'NEW_DM', data: dm });
      channel.close();
    }
    
    const otherUser = users.find(u => u.id === userId);
    setActiveRoom({
      id: dm.id,
      type: 'dm',
      name: otherUser?.displayName || otherUser?.username || 'User',
      dmUserId: userId
    });
    setShowSearch(false);
  }, [currentUser, dms, users]);

  const handleCreateServer = useCallback((name: string) => {
    if (!currentUser) return;
    
    const server: Server = {
      id: generateId(),
      name,
      ownerId: currentUser.id,
      members: [currentUser.id],
      channels: [
        { id: generateId(), name: 'general', serverId: '' }
      ],
      createdAt: Date.now()
    };
    server.channels[0].serverId = server.id;
    
    saveServer(server);
    setServers(prev => [...prev, server]);
    
    const channel = new BroadcastChannel('messenger_sync');
    channel.postMessage({ type: 'NEW_SERVER', data: server });
    channel.close();
    
    setShowServerModal(false);
  }, [currentUser]);

  const handleSelectChannel = useCallback((server: Server, channel: Channel) => {
    setActiveRoom({
      id: channel.id,
      type: 'channel',
      name: `#${channel.name}`,
      serverId: server.id,
      serverName: server.name
    });
  }, []);

  const handleJoinServer = useCallback((serverId: string) => {
    if (!currentUser) return;
    
    const serverIndex = servers.findIndex(s => s.id === serverId);
    if (serverIndex === -1) return;
    
    const server = servers[serverIndex];
    if (server.members.includes(currentUser.id)) return;
    
    const updatedServer = {
      ...server,
      members: [...server.members, currentUser.id]
    };
    
    saveServer(updatedServer);
    setServers(prev => prev.map(s => s.id === serverId ? updatedServer : s));
    
    const channel = new BroadcastChannel('messenger_sync');
    channel.postMessage({ type: 'NEW_SERVER', data: updatedServer });
    channel.close();
  }, [currentUser, servers]);

  const roomMessages = messages.filter(m => 
    activeRoom && m.roomId === activeRoom.id
  );

  const roomTypingUsers = activeRoom 
    ? (typingUsers[activeRoom.id] || []).filter(id => id !== currentUser?.id)
    : [];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <StarryBackground />
        <AuthScreen onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-black text-white relative overflow-hidden flex">
      <StarryBackground />
      
      <Sidebar
        currentUser={currentUser}
        servers={servers.filter(s => s.members.includes(currentUser.id))}
        dms={dms.filter(d => d.userAId === currentUser.id || d.userBId === currentUser.id)}
        users={users}
        activeRoom={activeRoom}
        onlineUsers={onlineUsers}
        onSelectDM={handleOpenDM}
        onSelectChannel={handleSelectChannel}
        onOpenProfile={() => setShowProfile(true)}
        onOpenSearch={() => setShowSearch(true)}
        onCreateServer={() => setShowServerModal(true)}
        onLogout={handleLogout}
      />
      
      <ChatArea
        currentUser={currentUser}
        users={users}
        room={activeRoom}
        messages={roomMessages}
        typingUsers={roomTypingUsers}
        onlineUsers={onlineUsers}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />
      
      {showProfile && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
      
      {showSearch && (
        <SearchModal
          users={users.filter(u => u.id !== currentUser.id)}
          onlineUsers={onlineUsers}
          onClose={() => setShowSearch(false)}
          onSelectUser={handleOpenDM}
        />
      )}
      
      {showServerModal && (
        <ServerModal
          servers={servers.filter(s => !s.members.includes(currentUser.id))}
          onClose={() => setShowServerModal(false)}
          onCreate={handleCreateServer}
          onJoin={handleJoinServer}
        />
      )}
      
      {/* Mobile menu button */}
      <button
        onClick={() => setShowMobileMenu(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-3 glass-panel rounded-lg"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        currentUser={currentUser}
        servers={servers.filter(s => s.members.includes(currentUser.id))}
        dms={dms.filter(d => d.userAId === currentUser.id || d.userBId === currentUser.id)}
        users={users}
        activeRoom={activeRoom}
        onlineUsers={onlineUsers}
        onSelectDM={handleOpenDM}
        onSelectChannel={handleSelectChannel}
        onOpenProfile={() => setShowProfile(true)}
        onOpenSearch={() => setShowSearch(true)}
        onCreateServer={() => setShowServerModal(true)}
        onLogout={handleLogout}
      />
    </div>
  );
}
