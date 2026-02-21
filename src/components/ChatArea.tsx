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
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Загрузка сообщений ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),` +
          `and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
        )
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // ─── Realtime подписка ────────────────────────────────────────────────
    const channel = supabase
      .channel(`chat-${currentUser.id}-${selectedUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id) ||
            (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id)
          ) {
            // Защита от дублей — реальтайм может дублировать оптимистичные сообщения
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Очистка таймера при размонтировании ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // ─── Загрузка файла в Supabase Storage ───────────────────────────────────
  const uploadFile = async (file: File | Blob, fileName: string): Promise<string | null> => {
    const ext = fileName.split('.').pop();
    const path = `${currentUser.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('chat-files')
      .upload(path, file, { upsert: false });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from('chat-files').getPublicUrl(path);
    return data.publicUrl;
  };

  // ─── Определение типа файла ───────────────────────────────────────────────
  const getFileType = (file: File): Message['file_type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  };

  // ─── Отправка сообщения в БД ──────────────────────────────────────────────
  const sendMessage = async (payload: {
    content?: string;
    file_url?: string;
    file_type?: Message['file_type'];
    file_name?: string;
  }) => {
    if (!selectedUser) return;

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: payload.content ?? null,
        file_url: payload.file_url ?? null,
        file_type: payload.file_type ?? null,
        file_name: payload.file_name ?? null,
      },
    ]);

    if (error) console.error('Send error:', error);
  };

  // ─── Отправка текста ──────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const text = newMessage.trim();
    setNewMessage('');
    await sendMessage({ content: text });
  };

  // ─── Отправка файла/фото/видео ────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    setIsUploading(true);
    const url = await uploadFile(file, file.name);
    if (url) {
      await sendMessage({
        file_url: url,
        file_type: getFileType(file),
        file_name: file.name,
      });
    }
    setIsUploading(false);
    // Сбрасываем input чтобы можно было выбрать тот же файл повторно
    e.target.value = '';
  };

  // ─── Запись голосового ───────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        setIsUploading(true);
        const url = await uploadFile(blob, 'voice.webm');
        if (url) {
          await sendMessage({ file_url: url, file_type: 'audio', file_name: 'Голосовое сообщение' });
        }
        setIsUploading(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Нет доступа к микрофону');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      // Убираем обработчик чтобы не отправлялось
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── Рендер одного сообщения ──────────────────────────────────────────────
  const renderMessageContent = (msg: Message) => {
    // Только файл
    if (msg.file_url && msg.file_type === 'image') {
      return (
        <div className="space-y-1">
          <img
            src={msg.file_url}
            alt="img"
            className="max-w-[260px] rounded-xl cursor-pointer"
            onClick={() => window.open(msg.file_url!, '_blank')}
          />
          {msg.content && <p className="text-sm">{msg.content}</p>}
        </div>
      );
    }

    if (msg.file_url && msg.file_type === 'video') {
      return (
        <div className="space-y-1">
          <video
            src={msg.file_url}
            controls
            className="max-w-[280px] rounded-xl"
          />
          {msg.content && <p className="text-sm">{msg.content}</p>}
        </div>
      );
    }

    if (msg.file_url && msg.file_type === 'audio') {
      return (
        <div className="flex flex-col gap-1 min-w-[200px]">
          <div className="flex items-center gap-2 text-xs opacity-70">
            <span>🎤</span>
            <span>{msg.file_name ?? 'Голосовое сообщение'}</span>
          </div>
          <audio src={msg.file_url} controls className="w-full" />
        </div>
      );
    }

    if (msg.file_url && msg.file_type === 'file') {
      return (
        <a
          href={msg.file_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 underline text-sm"
        >
          <span>📎</span>
          <span>{msg.file_name ?? 'Файл'}</span>
        </a>
      );
    }

    // Просто текст
    return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Выберите пользователя, чтобы начать общение
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent relative h-full">

      {/* Шапка */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
            {selectedUser.username[0].toUpperCase()}
          </div>
          <div>
            <div className="text-white font-medium">@{selectedUser.username}</div>
            <div className="text-green-500 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] p-3 rounded-2xl ${
                  isMine
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white/10 text-white rounded-tl-none'
                }`}
              >
                {renderMessageContent(msg)}
                <div className="text-[10px] opacity-50 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Индикатор загрузки */}
      {isUploading && (
        <div className="px-4 py-1 text-xs text-blue-400 animate-pulse">
          Загрузка файла...
        </div>
      )}

      {/* Панель записи */}
      {isRecording && (
        <div className="mx-4 mb-2 flex items-center gap-3 bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>
          <span className="text-white/60 text-xs flex-1">Запись...</span>
          <button
            onClick={cancelRecording}
            className="text-white/50 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
          >
            Отмена
          </button>
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg transition-colors"
          >
            Отправить
          </button>
        </div>
      )}

      {/* Форма отправки */}
      <form onSubmit={handleSendMessage} className="p-4 bg-black/20">
        {/* Скрытый файловый input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10 focus-within:border-blue-500 transition-all">

          {/* Кнопка прикрепить файл */}
          <button
            type="button"
            title="Прикрепить файл"
            disabled={isUploading || isRecording}
            onClick={() => fileInputRef.current?.click()}
            className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition disabled:opacity-40"
          >
            {/* Скрепка */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Поле ввода */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isRecording ? 'Идёт запись...' : 'Введите сообщение...'}
            disabled={isRecording}
            className="flex-1 bg-transparent text-white outline-none px-2 disabled:opacity-40"
          />

          {/* Кнопка голоса / остановки */}
          <button
            type="button"
            title={isRecording ? 'Остановить' : 'Голосовое сообщение'}
            disabled={isUploading}
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition disabled:opacity-40 ${
              isRecording
                ? 'text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {isRecording ? (
              // Стоп
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              // Микрофон
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z" />
              </svg>
            )}
          </button>

          {/* Отправить текст */}
          <button
            type="submit"
            disabled={isUploading || isRecording || !newMessage.trim()}
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Отправить
          </button>
        </div>
      </form>
    </div>
  );
}
