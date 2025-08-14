import { Route, Routes } from 'react-router-dom';
import MovieDetail from './components/MovieDetail';
import MovieMore from './components/MovieMore';
import './App.css';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import MenuBar from './components/MenuBar';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const normalizeUser = (u) => {
  if (!u) return null;
  // Supabase Auth user
  if (u.id && typeof u.role !== 'undefined') {
    return {
      id: u.id,
      email: u.email ?? '',
      name: u.user_metadata?.name ?? '',
      provider: 'auth',
    };
  }
  // Local user (your custom table row)
  return {
    id: u.id ?? u.userid ?? '',
    email: u.email ?? '',
    name: u.name ?? '',
    provider: 'local',
  };
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      // 1) Supabase 세션 복구
      const { data } = await supabase.auth.getSession();
      const authUser = data?.session?.user ?? null;
      if (mounted && authUser) {
        setUser(normalizeUser(authUser));
        return;
      }

      // 2) 로컬 로그인 복구
      const raw = localStorage.getItem('app-user');
      if (mounted) setUser(normalizeUser(raw ? JSON.parse(raw) : null));
    };

    hydrate();

    // 3) Auth 상태 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ? normalizeUser(session.user) : null;
      setUser(next);

      // Auth 로그아웃 시 로컬 로그인도 정리(혼선 방지, 필요 없으면 제거)
      if (!session?.user) localStorage.removeItem('app-user');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (query) => setSearchQuery(query);

  // 로컬 로그인 성공 시 (Login 컴포넌트에서 호출)
  const handleLoginSuccess = (row) => {
    const normalized = normalizeUser(row);
    localStorage.setItem('app-user', JSON.stringify(normalized));
    setUser(normalized);
  };

  const handleLogout = async () => {
    try {
      // Auth 사용 중이면 로그아웃; 로컬만 쓰면 no-op
      await supabase.auth.signOut();
    } finally {
      localStorage.removeItem('app-user');
      setUser(null);
    }
  };

  return (
    <div className="Routes-container">
      <Routes>
        <Route path="/" element={<MenuBar onSearch={handleSearch} user={user} onLogout={handleLogout} />}>
          <Route index element={<MovieDetail searchQuery={searchQuery} />} />
          <Route path=":id" element={<MovieMore />} />
          <Route path="login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="signup" element={<SignUp />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
