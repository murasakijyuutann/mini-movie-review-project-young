import './SignUp.css';
import { supabase } from '../supabaseClient.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setOk('');
    setSubmitting(true);

    const form = e.currentTarget; // ✅ await 전에 form 캡처
    const fd = new FormData(form);

    const userid = (fd.get('userid') || '').toString().trim(); // 사용자가 입력하는 아이디(UNIQUE)
    const password = (fd.get('password') || '').toString();
    const confirm = (fd.get('confirm-password') || '').toString();
    const name = (fd.get('name') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();

    // 1) 기본 검증
    if (!userid || !email || !password || !confirm || !name) {
      setError('모든 값을 입력해 주세요.');
      setSubmitting(false);
      return;
    }
    if (password !== confirm) {
      setError('비밀번호와 확인이 일치하지 않습니다.');
      setSubmitting(false);
      return;
    }

    try {
      // 2) Insert
      //  - id(UUID)는 DB에서 default로 자동 생성
      //  - userid/email은 UNIQUE로 설정 가정
      const { error: insertError } = await supabase.from('users').insert({
        userid,
        password, // 연습 전용 평문(실서비스 금지)
        name,
        email,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          const msg = insertError.message || '';
          if (msg.includes('users_email_key')) {
            setError('이미 사용 중인 이메일입니다.');
          } else if (msg.includes('users_userid_key')) {
            setError('이미 사용 중인 아이디입니다.');
          } else {
            setError('중복된 값이 있습니다.');
          }
        } else {
          setError(`등록 실패: ${insertError.message}`);
        }
        setSubmitting(false);
        return;
      }

      alert('success sign up');
      form.reset(); // ✅ 안전하게 리셋
      form.querySelector('#userid')?.focus();
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="SignUp-page">
      <div className="sign-up-container">
        <h2>Sign Up</h2>
        <form className="sign-up-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="userid">Id</label>
            <input type="text" id="userid" name="userid" placeholder="Enter your id" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" />
          </div>
          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" name="confirm-password" placeholder="Confirm your password" />
          </div>
          <div className="input-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Enter your name" />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" />
          </div>

          {error && <p className="error-text">{error}</p>}
          {ok && <p className="ok-text">{ok}</p>}

          <button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
