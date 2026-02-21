import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { AuthScreen } from './components/AuthScreen';
import { Session } from '@supabase/supabase-js';

// Тип для профиля
interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получаем текущую сессию при загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Если вышел — очищаем профиль
        if (!session) {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Загружаем профиль когда появляется сессия
  useEffect(() => {
    if (session?.user) {
      loadProfile(session.user.id);
    }
  }, [session]);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  // ============ ЗАГРУЗКА ============
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent 
                        rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-lg">Загрузка...</p>
      </div>
    );
  }

  // ============ НЕ АВТОРИЗОВАН ============
  if (!session) {
    return <AuthScreen />;
  }

  // ============ АВТОРИЗОВАН — ГЛАВНЫЙ ЭКРАН ============
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ===== HEADER ===== */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          {/* Лого / Название */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center 
                            justify-center text-lg font-bold">
              💬
            </div>
            <h1 className="text-lg font-bold">ChatApp</h1>
          </div>

          {/* Профиль + Выход */}
          <div className="flex items-center gap-3">
            {/* Аватар и ник */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 
                              rounded-full flex items-center justify-center text-sm font-bold">
                {profile?.display_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium text-gray-300 hidden sm:block">
                {profile?.display_name || 'Загрузка...'}
              </span>
            </div>

            {/* Кнопка выхода */}
            <button
              onClick={handleSignOut}
              className="bg-gray-700 hover:bg-red-600 px-3 py-2 rounded-lg 
                         text-xs font-medium transition duration-200"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
      <main className="max-w-2xl mx-auto p-4">
        {/* Приветствие */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 
                        border border-blue-500/30 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Привет, {profile?.display_name || 'друг'}! 👋
          </h2>
          <p className="text-gray-400">
            Добро пожаловать в ChatApp
          </p>
        </div>

        {/* Карточка профиля */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            👤 Твой профиль
          </h3>

          <div className="flex items-center gap-4 mb-4">
            {/* Большой аватар */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 
                            rounded-2xl flex items-center justify-center text-2xl font-bold">
              {profile?.display_name?.charAt(0).toUpperCase() || '?'}
            </div>

            <div>
              <p className="text-white font-bold text-lg">
                {profile?.display_name}
              </p>
              <p className="text-gray-400 text-sm">
                @{profile?.username}
              </p>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">User ID</span>
              <span className="text-gray-300 text-sm font-mono">
                {session.user.id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Никнейм</span>
              <span className="text-gray-300 text-sm">
                {profile?.username}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Статус</span>
              <span className="text-green-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Онлайн
              </span>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-gray-800 hover:bg-gray-750 border border-gray-700 
                             hover:border-blue-500 rounded-2xl p-5 text-left 
                             transition duration-200 group">
            <div className="text-2xl mb-2">💬</div>
            <p className="font-semibold text-white group-hover:text-blue-400 
                          transition">Чаты</p>
            <p className="text-gray-500 text-sm">Открыть сообщения</p>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 border border-gray-700 
                             hover:border-purple-500 rounded-2xl p-5 text-left 
                             transition duration-200 group">
            <div className="text-2xl mb-2">👥</div>
            <p className="font-semibold text-white group-hover:text-purple-400 
                          transition">Друзья</p>
            <p className="text-gray-500 text-sm">Найти людей</p>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 border border-gray-700 
                             hover:border-green-500 rounded-2xl p-5 text-left 
                             transition duration-200 group">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="font-semibold text-white group-hover:text-green-400 
                          transition">Настройки</p>
            <p className="text-gray-500 text-sm">Изменить профиль</p>
          </button>

          <button
            onClick={handleSignOut}
            className="bg-gray-800 hover:bg-red-900/30 border border-gray-700 
                       hover:border-red-500 rounded-2xl p-5 text-left 
                       transition duration-200 group"
          >
            <div className="text-2xl mb-2">🚪</div>
            <p className="font-semibold text-white group-hover:text-red-400 
                          transition">Выход</p>
            <p className="text-gray-500 text-sm">Выйти из аккаунта</p>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
