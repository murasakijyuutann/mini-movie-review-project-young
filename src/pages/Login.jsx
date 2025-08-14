import { useNavigate } from 'react-router-dom';
import './Login.css';
import { supabase } from '../supabaseClient';
import { useRef, useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const idRef = useRef(null);
  const pwRef = useRef(null);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const userid = (idRef.current?.value || '').trim();
    const password = pwRef.current?.value || '';

    if (!userid || !password) {
      alert('아이디/비밀번호를 입력해 주세요.');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, userid, name, email')
        .eq('userid', userid)
        .eq('password', password)
        .single(); // 한 명만 있어야 하므로

      if (error || !data) {
        alert('failed login');
        setSubmitting(false);
        return;
      }

      localStorage.setItem('app-user', JSON.stringify(data));
      onLoginSuccess?.(data);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="Login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="userid">Id</label>
            <input
              type="text"
              id="userid"
              name="userid"
              placeholder="Enter your id"
              ref={idRef}
              autoComplete="username"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              ref={pwRef}
              autoComplete="current-password"
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="login-footer">
          <div className="sign-up-link" onClick={handleSignUp}>
            Sign Up
          </div>
          <div className="forgot-password">Forgot Password?</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
