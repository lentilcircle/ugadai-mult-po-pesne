import { useCallback, useEffect, useRef, useState } from 'react';
import type { Song } from '../types/game';

export type PlaybackStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

export interface AudioClipController {
  status: PlaybackStatus;
  error: string | null;
  progress: number;
  toggle: () => void;
  replay: () => void;
  halt: () => void;
}

function clipBounds(song: Song): { start: number; end: number } {
  const start = Math.max(0, song.start_time);
  const end = Math.max(start, song.end_time);
  return { start, end };
}

function waitForSeek(audio: HTMLAudioElement, time: number): Promise<void> {
  if (Math.abs(audio.currentTime - time) < 0.05) {
    audio.currentTime = time;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      audio.removeEventListener('seeked', finish);
      resolve();
    };
    audio.addEventListener('seeked', finish);
    try {
      audio.currentTime = time;
    } catch {
      audio.removeEventListener('seeked', finish);
      resolve();
    }
  });
}

export function useAudioClip(song: Song | null): AudioClipController {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const songRef = useRef(song);
  const statusRef = useRef<PlaybackStatus>('loading');
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<PlaybackStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  songRef.current = song;

  const setPlaybackStatus = useCallback((next: PlaybackStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const clearClocks = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishClip = useCallback(() => {
    const audio = audioRef.current;
    const current = songRef.current;
    clearClocks();
    if (!audio || !current) return;
    if (statusRef.current === 'ended') return;
    audio.pause();
    const { end } = clipBounds(current);
    if (Number.isFinite(audio.duration)) {
      try {
        audio.currentTime = Math.min(end, Math.max(0, audio.duration - 0.01));
      } catch {
        /* Метаданные ещё не готовы. */
      }
    }
    setProgress(1);
    setPlaybackStatus('ended');
  }, [clearClocks, setPlaybackStatus]);

  const watchPlayback = useCallback(() => {
    clearClocks();
    const audio = audioRef.current;
    const current = songRef.current;
    if (!audio || !current) return;

    const { start, end } = clipBounds(current);
    const length = Math.max(0.05, end - start);
    const remaining = Math.max(0, (end - audio.currentTime) * 1000);
    timerRef.current = window.setTimeout(() => finishClip(), remaining + 40);

    const frame = () => {
      const live = audioRef.current;
      const liveSong = songRef.current;
      if (!live || !liveSong || live.paused || statusRef.current !== 'playing') return;
      const bounds = clipBounds(liveSong);
      if (live.currentTime >= bounds.end - 0.02) {
        finishClip();
        return;
      }
      const nextProgress = Math.min(1, Math.max(0, (live.currentTime - bounds.start) / length));
      setProgress(nextProgress);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [clearClocks, finishClip]);

  const halt = useCallback(() => {
    const audio = audioRef.current;
    clearClocks();
    if (!audio) return;
    audio.pause();
    if (statusRef.current === 'playing') setPlaybackStatus('paused');
  }, [clearClocks, setPlaybackStatus]);

  const playFromCurrent = useCallback(async () => {
    const audio = audioRef.current;
    const current = songRef.current;
    const state = statusRef.current;
    if (!audio || !current) return;
    if (state === 'ended' || state === 'error' || state === 'loading' || state === 'playing') return;

    const { end } = clipBounds(current);
    if (audio.currentTime >= end - 0.02) {
      finishClip();
      return;
    }

    const { start } = clipBounds(current);
    if (audio.currentTime < start - 0.05) {
      await waitForSeek(audio, start);
    }

    try {
      setError(null);
      await audio.play();
      setPlaybackStatus('playing');
      watchPlayback();
    } catch {
      clearClocks();
      setError('Браузер не разрешил воспроизведение. Нажмите «ПЛЕЙ» ещё раз.');
      setPlaybackStatus(audio.currentTime > start + 0.05 ? 'paused' : 'ready');
    }
  }, [clearClocks, finishClip, setPlaybackStatus, watchPlayback]);

  const toggle = useCallback(() => {
    if (statusRef.current === 'playing') {
      halt();
      return;
    }
    void playFromCurrent();
  }, [halt, playFromCurrent]);

  const replay = useCallback(async () => {
    const audio = audioRef.current;
    const current = songRef.current;
    if (!audio || !current) return;
    if (statusRef.current === 'loading' || statusRef.current === 'error') return;

    clearClocks();
    audio.pause();
    const { start } = clipBounds(current);
    setProgress(0);
    setPlaybackStatus('paused');

    try {
      await waitForSeek(audio, start);
      setError(null);
      await audio.play();
      setPlaybackStatus('playing');
      watchPlayback();
    } catch {
      clearClocks();
      setError('Браузер не разрешил воспроизведение. Нажмите «ПОВТОР» ещё раз.');
      setPlaybackStatus('ready');
    }
  }, [clearClocks, setPlaybackStatus, watchPlayback]);

  useEffect(() => {
    if (!song) return;

    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    setError(null);
    setProgress(0);
    setPlaybackStatus('loading');

    const onReady = () => {
      if (audioRef.current !== audio) return;
      const { start, end } = clipBounds(song);
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        setError('Аудиофайл пустой или повреждён.');
        setPlaybackStatus('error');
        return;
      }
      if (start >= audio.duration) {
        setError('Начало фрагмента указано за пределами аудиофайла. Проверьте start_time в songs.json.');
        setPlaybackStatus('error');
        return;
      }
      try {
        audio.currentTime = Math.min(start, Math.max(0, audio.duration - 0.05));
      } catch {
        /* Повторная установка произойдёт перед воспроизведением. */
      }
      if (end - start < 0.2) {
        setError('Фрагмент слишком короткий. Проверьте границы в songs.json.');
        setPlaybackStatus('error');
        return;
      }
      setPlaybackStatus('ready');
    };

    const onError = () => {
      if (audioRef.current !== audio) return;
      clearClocks();
      setError('Не удалось загрузить аудиофайл. Проверьте путь в songs.json и файл в папке public/audio.');
      setPlaybackStatus('error');
    };

    const onEnded = () => {
      if (audioRef.current !== audio) return;
      finishClip();
    };

    audio.addEventListener('loadedmetadata', onReady);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    audio.src = song.audio_file;
    audio.load();

    return () => {
      clearClocks();
      audio.pause();
      audio.removeEventListener('loadedmetadata', onReady);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      audio.removeAttribute('src');
      audio.load();
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [song, clearClocks, finishClip, setPlaybackStatus]);

  return { status, error, progress, toggle, replay: () => void replay(), halt };
}
