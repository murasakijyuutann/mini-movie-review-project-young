import i18n from 'i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      genre: 'Genre',
      actor: 'Actor',
      searchPlaceholder: 'Please write the movie',
      signUp: 'Sign Up',
      login: 'Login',
    },
  },
  ja: {
    translation: {
      genre: 'ジャンル',
      actor: '俳優',
      searchPlaceholder: '映画を書いてください',
      signUp: '登録',
      login: 'ログイン',
    },
  },
  ko: {
    translation: {
      genre: '장르',
      actor: '배우',
      searchPlaceholder: '영화를 입력하세요',
      signUp: '회원가입',
      login: '로그인',
    },
  },
};
i18n
  .use(I18nextBrowserLanguageDetector)
  .use(initReactI18next)
  .init({ resources, fallbackLng: 'en', interpolation: { escapeValue: false } });

export default i18n;
