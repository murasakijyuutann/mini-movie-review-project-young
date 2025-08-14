import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 로그인 유지 핵심 옵션
    persistSession: true, // 로컬에 세션 저장
    autoRefreshToken: true, // 만료 전 토큰 자동 갱신
    detectSessionInUrl: true, // OAuth 리다이렉트 시 세션 감지
  },
});
