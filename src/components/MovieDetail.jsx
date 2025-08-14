import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MovieDetail.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // ⭐ 추가

const MovieDetail = ({ searchQuery }) => {
  const { i18n } = useTranslation(); // ⭐ 현재 언어
  const langKey = i18n.language.split('-')[0]; // 'ko' | 'en' | 'ja'
  const LMAP = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' };
  const apiLang = LMAP[langKey] ?? 'en-US'; // ⭐ TMDb용 언어코드

  // 다국어 검색 대상(현재 언어 우선)
  const SEARCH_LANGS = useMemo(() => {
    const base = ['ja-JP', 'ko-KR', 'en-US'];
    return [apiLang, ...base.filter((l) => l !== apiLang)];
  }, [apiLang]);

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef(null);
  const sentinelRef = useRef(null);

  // 공백/대소문자 정리 + 디바운스
  const q = useMemo(() => String(searchQuery ?? '').trim(), [searchQuery]);
  const [qDebounced, setQDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchMovies = useCallback(
    async (query = '', pageNum = 1) => {
      const apiKey = import.meta.env.VITE_MOVIE_API_KEY;
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        if (query) {
          // 🔎 검색 모드: 현재 언어 우선 + 다른 언어 보조
          const requests = SEARCH_LANGS.map((lang) =>
            axios.get('https://api.themoviedb.org/3/search/movie', {
              params: {
                api_key: apiKey,
                query,
                language: lang,
                include_adult: false,
                page: pageNum,
              },
              signal: abortRef.current.signal,
            })
          );

          const responses = await Promise.allSettled(requests);
          const pagesInfo = [];
          const merged = [];

          for (const r of responses) {
            if (r.status !== 'fulfilled') continue;
            const { data } = r.value;
            pagesInfo.push({ page: data.page, total_pages: data.total_pages });
            merged.push(...(data.results ?? []));
          }

          // 중복 제거 (id 기준)
          setMovies((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            for (const m of merged) if (!map.has(m.id)) map.set(m.id, m);
            return Array.from(map.values());
          });

          const anyHasMore = pagesInfo.some((p) => p.page < p.total_pages);
          setHasMore(anyHasMore);
        } else {
          // 🏠 기본 모드: 현재 언어로 인기작
          const res = await axios.get('https://api.themoviedb.org/3/movie/popular', {
            params: { api_key: apiKey, language: apiLang, page: pageNum }, // ⭐ 여기
            signal: abortRef.current.signal,
          });

          const list = res.data.results ?? [];
          setMovies((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            for (const m of list) if (!map.has(m.id)) map.set(m.id, m);
            return Array.from(map.values());
          });
          setHasMore(res.data.page < res.data.total_pages);
        }
      } catch (err) {
        if (axios.isCancel?.(err) || err.name === 'CanceledError') return;
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [SEARCH_LANGS, apiLang] // ⭐ 언어 바뀌면 새 로직 사용
  );

  // 페이지 변경 시 이어서 불러오기
  useEffect(() => {
    if (page === 1) return;
    fetchMovies(qDebounced, page);
  }, [page, qDebounced, fetchMovies]);

  // 검색어 or 언어 바뀌면 초기화 후 1페이지 로드
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    fetchMovies(qDebounced, 1);
    return () => abortRef.current?.abort();
  }, [qDebounced, apiLang, fetchMovies]); // ⭐ apiLang 추가

  // IntersectionObserver로 무한스크롤
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((p) => p + 1);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading, hasMore]);

  return (
    <>
      <div className="movie">
        {movies.length === 0 && loading && <p>Loading...</p>}
        {movies.map((movieData) => (
          <Link key={movieData.id} to={`/${movieData.id}`} className="movie-card">
            {movieData.poster_path ? (
              <img
                className="image"
                src={`https://image.tmdb.org/t/p/w342${movieData.poster_path}`}
                alt={movieData.title || movieData.original_title}
                loading="lazy"
              />
            ) : (
              <div className="image placeholder">No Image</div>
            )}
            <p className="card-name">
              {movieData.title || movieData.original_title /* title은 요청 언어로 로컬라이즈됨 */}
            </p>
          </Link>
        ))}
        {loading && movies.length > 0 && <p>Loading...</p>}
      </div>
      <div ref={sentinelRef} style={{ height: 1 }} />
      {!hasMore && movies.length > 0 && <p>No more movies</p>}
    </>
  );
};

export default MovieDetail;
