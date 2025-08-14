import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './MovieMore.css';

const MovieMore = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  // i18n → TMDb 언어코드 매핑
  const apiLang = useMemo(() => {
    const key = i18n.language.split('-')[0]; // 'ko' | 'ja' | 'en'
    const L = { ko: 'ko-KR', ja: 'ja-JP', en: 'en-US' };
    return L[key] ?? 'en-US';
  }, [i18n.language]);

  const handleBack = () => navigate(-1);

  useEffect(() => {
    if (!id) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const fetchMovieData = async () => {
      setLoading(true);
      const apiKey = import.meta.env.VITE_MOVIE_API_KEY;

      try {
        const res = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
          params: { api_key: apiKey, language: apiLang },
          signal: abortRef.current.signal,
        });
        setMovie(res.data);
      } catch (error) {
        // 요청 취소는 조용히 무시
        if (axios.isCancel?.(error) || error.name === 'CanceledError') return;
        console.error('Not found movie data:', error);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
    return () => abortRef.current?.abort();
  }, [id, apiLang]); // ✅ 언어 바뀌면 재요청

  if (loading)
    return (
      <div className="More">
        <button onClick={handleBack}>Back</button>
        <div>Loading...</div>
      </div>
    );
  if (!movie)
    return (
      <div className="More">
        <button onClick={handleBack}>Back</button>
        <div>Not found</div>
      </div>
    );

  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/original/${movie.poster_path}` : '';

  return (
    <div className="More">
      <button onClick={handleBack}>Back</button>
      <div className="Movie-more" key={movie.id}>
        {poster ? (
          <img className="Movie-post" src={poster} alt={movie.title || movie.original_title} />
        ) : (
          <div className="Movie-post placeholder">No Image</div>
        )}
        <div className="More-info">
          <div className="menu-title">Title: {movie.title || movie.original_title}</div>
          <div className="menu-average">🤩 {movie.vote_average} 🤩</div>
          <div className="menu-overview">{movie.overview}</div>
        </div>
      </div>
    </div>
  );
};

export default MovieMore;
