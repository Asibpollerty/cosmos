import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { StarryBackground } from './components/StarryBackground';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ProfileModal } from './components/ProfileModal';
import { SearchModal } from './components/SearchModal';
import { MobileMenu } from './components/MobileMenu';
import { User } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Проверка авторизации через Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedUser(null);
  };

  if (loading) return <div className="h-screen bg-black" />;

  // Если не залогинен — показываем экран входа
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <StarryBackground />
        <AuthScreen /> 
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-black text-white relative overflow-hidden flex">
      <StarryBackground />
      
      {/* Боковая панель */}
      <Sidebar
        currentUser={currentUser}
        onSelectUser={(u: User) => setSelectedUser(u)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenSearch={() => setShowSearch(true)}
        onLogout={handleLogout}
      />
      
      {/* ТВОЙ НОВЫЙ ЧАТ (Supabase) */}
      <ChatArea
        selectedUser={selectedUser}
        currentUser={currentUser}
      />
      
      {showProfile && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfile(false)}
        />
      )}
      
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSelectUser={(u: User) => {
            setSelectedUser(u);
            setShowSearch(false);
          }}
        />
      )}

      {/* Кнопка мобильного меню */}
      <button
        onClick={() => setShowMobileMenu(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-3 bg-white/10 rounded-lg"
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      
      {showMobileMenu && (
        <MobileMenu
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          currentUser={currentUser}
          onSelectUser={(u: User) => {
            setSelectedUser(u);
            setShowMobileMenu(false);
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
