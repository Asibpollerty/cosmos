import { useState } from 'react';
import { supabase } from '../supabaseClient';

export function AuthScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false); // переключатель режима

  // ============ РЕГИСТРАЦИЯ ============
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Проверяем что ник не пустой
      if (!username.trim() || !password.trim()) {
        setError('Заполни все поля');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Пароль минимум 6 символов');
        setLoading(false);
        return;
      }

      // Проверяем, не занят ли ник
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (existingUser) {
        setError('Этот ник уже занят');
        setLoading(false);
        return;
      }

      // Создаём пользователя в Supabase Auth
      const email = `${username.trim().toLowerCase()}@chatapp.local`;

      const { data, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Создаём профиль в таблице profiles
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            username: username.trim().toLowerCase(),
            display_name: username.trim(),
          },
        ]);

        if (profileError) {
          setError('Ошибка создания профиля: ' + profileError.message);
          setLoading(false);
          return;
        }
      }

      // После успешной регистрации — автоматически логинимся
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        setError('Регистрация прошла, но не удалось войти: ' + loginError.message);
      }

      // Если всё ок — supabase сам обновит сессию,
      // и onAuthStateChange в App.tsx переключит экран
    } catch (err: any) {
      setError('Что-то пошло не так: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============ ВХОД ============
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username.trim() || !password.trim()) {
        setError('Заполни все поля');
        setLoading(false);
        return;
      }

      const email = `${username.trim().toLowerCase()}@chatapp.local`;

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        // Человекопонятные ошибки
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Неверный ник или пароль');
        } else {
          setError(loginError.message);
        }
      }

      // Если ок — сессия обновится автоматически
    } catch (err: any) {
      setError('Что-то пошло не так: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl">
        {/* Заголовок */}
        <h1 className="text-white text-2xl font-bold text-center mb-2">
          {isLoginMode ? '👋 Вход' : '🚀 Регистрация'}
        </h1>
        <p className="text-gray-400 text-center mb-6 text-sm">
          {isLoginMode
            ? 'Введи свой ник и пароль'
            : 'Придумай ник и пароль'}
        </p>

        {/* Форма */}
        <form onSubmit={isLoginMode ? handleLogin : handleSignUp}>
          {/* Ник */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm mb-1 block">Никнейм</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Например: player123"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 
                         outline-none focus:ring-2 focus:ring-blue-500 
                         placeholder-gray-500 transition"
              autoComplete="username"
            />
          </div>

          {/* Пароль */}
          <div className="mb-6">
            <label className="text-gray-300 text-sm mb-1 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 
                         outline-none focus:ring-2 focus:ring-blue-500 
                         placeholder-gray-500 transition"
              autoComplete={isLoginMode ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Кнопка */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 
                       disabled:cursor-not-allowed text-white font-semibold 
                       rounded-lg py-3 transition duration-200"
          >
            {loading
              ? '⏳ Загрузка...'
              : isLoginMode
                ? 'Войти'
                : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Переключатель режима */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isLoginMode ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              {isLoginMode ? 'Зарегистрируйся' : 'Войди'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
