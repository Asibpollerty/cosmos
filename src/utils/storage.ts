import { User, Server, DirectMessage, Message } from '../types';

const USERS_KEY = 'messenger_users';
const SERVERS_KEY = 'messenger_servers';
const DMS_KEY = 'messenger_dms';
const MESSAGES_KEY = 'messenger_messages';
const CURRENT_USER_KEY = 'messenger_current_user';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function hashPassword(password: string): string {
  // Simple hash for demo purposes - in production use bcrypt on backend
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByUsername(username: string): User | undefined {
  return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getServers(): Server[] {
  const data = localStorage.getItem(SERVERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveServer(server: Server): void {
  const servers = getServers();
  const index = servers.findIndex(s => s.id === server.id);
  if (index >= 0) {
    servers[index] = server;
  } else {
    servers.push(server);
  }
  localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
}

export function getDMs(): DirectMessage[] {
  const data = localStorage.getItem(DMS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveDM(dm: DirectMessage): void {
  const dms = getDMs();
  const index = dms.findIndex(d => d.id === dm.id);
  if (index >= 0) {
    dms[index] = dm;
  } else {
    dms.push(dm);
  }
  localStorage.setItem(DMS_KEY, JSON.stringify(dms));
}

export function getMessages(): Message[] {
  const data = localStorage.getItem(MESSAGES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveMessage(message: Message): void {
  const messages = getMessages();
  messages.push(message);
  // Keep last 1000 messages
  const trimmed = messages.slice(-1000);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(trimmed));
}

export function searchUsers(query: string): User[] {
  const q = query.toLowerCase();
  return getUsers().filter(u => 
    u.username.toLowerCase().includes(q) || 
    u.displayName.toLowerCase().includes(q)
  );
}
