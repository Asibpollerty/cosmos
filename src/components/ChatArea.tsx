import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { User, Message } from '../types';

interface ChatAreaProps {
  selectedUser: User | null;
  currentUser: User;
}

export function ChatArea({ selectedUser, currentUser }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Загрузка истории сообщений при выборе пользователя
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // 2. Подписка на новые сообщения в реальном времени (Realtime)
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          const msg = payload.new as Message;
          // Проверяем, что это сообщение касается текущего чата
          if (
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id) ||
            (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUser.id]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Функция отправки сообщения в базу
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageToSend = {
      content: newMessage.trim(),
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
    };

    const { error } = await supabase.from('messages').insert([messageToSend]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Выберите пользователя, чтобы начать общение
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent relative h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
            {selectedUser.username[0].toUpperCase()}
          </div>
          <div>
            <div className="text-white font-medium">@{selectedUser.username}</div>
            <div className="text-green-500 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-2xl ${
                msg.sender_id === currentUser.id
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white/10 text-white rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-black/20">
        <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10 focus-within:border-blue-500 transition-all">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 bg-transparent text-white outline-none px-2"
          />
          <button
            type="submit"
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Отправить
          </button>
        </div>
      </form>
    </div>
  );
}
