import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { AuthScreen } from './components/AuthScreen';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
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
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Пока проверяем сессию
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">⏳ Загрузка...</p>
      </div>
    );
  }

  // Не авторизован — показываем AuthScreen
  if (!session) {
    return <AuthScreen />;
  }

  // Авторизован — показываем основной контент
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">🏠 Главная</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg 
                       text-sm font-medium transition"
          >
            Выйти
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-gray-300">
            ✅ Ты вошёл как: <span className="text-white font-bold">
              {session.user.email?.replace('@chatapp.local', '')}
            </span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            User ID: {session.user.id}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
