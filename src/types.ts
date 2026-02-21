export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatarUrl?: string;
  bannerUrl?: string;
  createdAt: number;
}

export interface Server {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  channels: Channel[];
  createdAt: number;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
}

export interface DirectMessage {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  roomId: string;
  roomType: 'dm' | 'channel';
  text?: string;
  imageUrl?: string;
  voiceUrl?: string;
  createdAt: number;
  readBy: string[];
}

export interface ChatRoom {
  id: string;
  type: 'dm' | 'channel';
  name: string;
  dmUserId?: string;
  serverId?: string;
  serverName?: string;
}
