import { useState, useRef } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => void;
}

export function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl || '');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG and WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!displayName.trim()) {
      alert('Display name cannot be empty');
      return;
    }
    
    onUpdate({
      displayName: displayName.trim(),
      avatarUrl: avatarUrl || undefined,
      bannerUrl: bannerUrl || undefined
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="glass-panel rounded-2xl w-full max-w-md overflow-hidden animate-fade-in"
        role="dialog"
        aria-labelledby="profile-title"
      >
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-gray-800 to-gray-900">
          {bannerUrl && (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleImageUpload(e, setBannerUrl)}
          />
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-2 right-2 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            title="Change banner"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="relative px-6 -mt-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-black flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {displayName[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleImageUpload(e, setAvatarUrl)}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
              title="Change avatar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 space-y-4">
          <h2 id="profile-title" className="text-xl font-bold text-white">
            Edit Profile
          </h2>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <p className="px-4 py-3 bg-white/5 rounded-lg text-gray-400">
              @{user.username}
            </p>
          </div>
          
          <div>
            <label htmlFor="displayName" className="block text-sm text-gray-400 mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-white/50 transition-colors"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
