import { useState } from 'react';
import { supabase } from '../supabaseClient';

export function AuthScreen() {
  const [email, setEmail] = useState(''); // Supabase нужен email для регистрации
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Создаем пользователя в Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: `${username}@example.com`, // Используем ник как часть email для простоты
      password: password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    // 2. Создаем профиль в таблице profiles
    if (data.user) {
      await supabase.from('profiles').insert([
        { id: data.user.id, username: username, display_name: username }
      ]);
    }
  };

  return (
    // ... твой JSX код из скрина, но привяжи onSubmit к handleSignUp ...
    <form onSubmit={handleSignUp}>
       {/* Инпуты для username и password */}
       {error && <p className="text-red-500">{error}</p>}
       <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
