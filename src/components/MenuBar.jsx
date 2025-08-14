import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import '../App.css';

const LANGS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

const MenuBar = ({ onSearch, user = null, onLogout = () => {} }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 검색 디바운스
  const debouncedSearch = debounce((searchTerm) => {
    setDebouncedQuery(searchTerm);
  }, 500);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  useEffect(() => {
    if (debouncedQuery) onSearch(debouncedQuery);
    else onSearch('');
  }, [debouncedQuery, onSearch]);

  // 언어 팝오버
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const cur = i18n.language.split('-')[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!panelRef.current || !btnRef.current) return;
      if (!panelRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const changeLang = async (lng) => {
    await i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <>
      <div className="Menu-bar">
        <Link
          to="/"
          onClick={() => {
            setQuery('');
            setDebouncedQuery('');
            onSearch(''); // 부모 검색 결과도 초기화
          }}
        >
          <h1 className="Main">全然分からない</h1>
        </Link>

        <div className="Menu-button">
          <div className="Menu-button-list">
            <p>{t('genre')}</p>
            <p>{t('actor')}</p>
          </div>

          <div>
            <input
              className="search-box"
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder={t('searchPlaceholder')}
            />
            <button className="search" type="submit">
              {t('search')}
            </button>
          </div>
        </div>

        <div className="Menu-setting">
          <div className="lang-wrapper">
            <button
              className="language"
              ref={btnRef}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              🌐 {cur.toUpperCase()}
            </button>

            {open && (
              <div className="lang-popover" ref={panelRef} role="menu" aria-label="Select language" tabIndex={-1}>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    role="menuitemradio"
                    aria-checked={cur === l.code}
                    onClick={() => changeLang(l.code)}
                    className={`lang-item ${cur === l.code ? 'active' : ''}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {user ? (
            <div className="auth-box">
              <p>{user.name}</p>
              <button onClick={onLogout}>{t('logout') || 'Logout'}</button>
            </div>
          ) : (
            <>
              {location.pathname === '/login' ? (
                <Link to="/signup">
                  <p>{t('signUp')}</p>
                </Link>
              ) : (
                <Link to="/login">
                  <p>{t('login')}</p>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <Outlet />
    </>
  );
};

export default MenuBar;
