import { useState, useRef } from 'react';
import { Message, User } from '../types';

interface MessageBubbleProps {
  message: Message;
  sender?: User;
  isOwn: boolean;
}

export function MessageBubble({ message, sender, isOwn }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handlePlayVoice = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div 
      className={`message-bubble flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          {sender?.avatarUrl ? (
            <img src={sender.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">
              {sender?.displayName?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name */}
        {!isOwn && sender && (
          <p className="text-xs text-gray-400 mb-1 px-1">
            {sender.displayName}
          </p>
        )}
        
        <div 
          className={`rounded-2xl overflow-hidden ${
            isOwn 
              ? 'bg-white text-black rounded-tr-sm' 
              : 'glass-panel-light rounded-tl-sm'
          }`}
        >
          {/* Text */}
          {message.text && (
            <p className="px-4 py-2 whitespace-pre-wrap break-words">
              {message.text}
            </p>
          )}
          
          {/* Image */}
          {message.imageUrl && (
            <div className="p-1">
              <img 
                src={message.imageUrl} 
                alt="Shared image" 
                className="max-w-full max-h-64 rounded-xl object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Voice */}
          {message.voiceUrl && (
            <div className="px-4 py-3 flex items-center gap-3 min-w-[200px]">
              <audio
                ref={audioRef}
                src={message.voiceUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <button
                onClick={handlePlayVoice}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isOwn 
                    ? 'bg-black/10 hover:bg-black/20' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <div className={`h-1 rounded-full ${isOwn ? 'bg-black/20' : 'bg-white/20'}`}>
                  <div className={`h-full w-0 rounded-full ${isOwn ? 'bg-black' : 'bg-white'}`} />
                </div>
                <p className={`text-xs mt-1 ${isOwn ? 'text-black/50' : 'text-white/50'}`}>
                  Voice message
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Time */}
        <p className={`text-xs text-gray-500 mt-1 px-1 ${isOwn ? 'text-right' : ''}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
