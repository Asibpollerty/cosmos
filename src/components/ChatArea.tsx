import { useState, useRef, useEffect } from 'react';
import { User, Message, ChatRoom } from '../types';
import { MessageBubble } from './MessageBubble';
import { supabase } from '../supabaseClient';

interface ChatAreaProps {
  currentUser: User;
  users: User[];
  room: ChatRoom | null;
  onlineUsers: Set<string>;
}

export function ChatArea({ currentUser, users, room, onlineUsers }: ChatAreaProps) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Загрузка сообщений и подписка на новые
  useEffect(() => {
    if (!room) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.room_id === room.id) {
          setMessages((prev) => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !room) return;

    const newMessage = {
      content: text.trim(),
      sender_id: currentUser.id,
      room_id: room.id,
    };

    const { error } = await supabase.from('messages').insert([newMessage]);
    if (error) console.error(error);
    setText('');
  };

  if (!room) return <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat</div>;

  return (
    <main className="flex-1 flex flex-col relative z-10 min-w-0 bg-black/20">
      <header className="px-6 py-4 border-b border-white/10 flex items-center gap-4">
        <h1 className="font-semibold text-white">{room.name}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-white text-black rounded-xl font-bold">Send</button>
        </div>
      </form>
    </main>
  );
}