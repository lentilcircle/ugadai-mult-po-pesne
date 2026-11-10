import type { PlaybackStatus } from '../../hooks/useAudioClip';

interface AudioPlayerProps {
  status: PlaybackStatus;
  error: string | null;
  progress: number;
  duration: number;
  onToggle: () => void;
  onReplay: () => void;
}

export function AudioPlayer({ status, error, progress, duration, onToggle, onReplay }: AudioPlayerProps) {
  const playing = status === 'playing';
  const playDisabled = status === 'loading' || status === 'error' || status === 'ended';
  const replayDisabled = status === 'loading' || status === 'error';
  const elapsed = Math.min(duration, Math.max(0, progress * duration));

  let note = 'Фрагмент остановлен. Нажмите «Плей».';
  if (status === 'loading') note = 'Загрузка фрагмента…';
  if (status === 'playing') note = 'Идёт воспроизведение.';
  if (status === 'paused' && progress > 0) note = 'Пауза. «Плей» продолжит с этого места.';
  if (status === 'ended') note = 'Фрагмент закончился. Чтобы сыграть снова, нажмите «Повтор».';

  return (
    <div className="player">
      <div className="player-top">
        <span>Музыкальный фрагмент</span>
        <strong>{formatSeconds(elapsed)} / {formatSeconds(duration)}</strong>
      </div>
      <div className="track" aria-hidden="true">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="player-actions">
        <button type="button" className="btn btn-primary" onClick={onToggle} disabled={playDisabled}>
          {playing ? 'Пауза' : 'Плей'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReplay} disabled={replayDisabled}>
          Повтор
        </button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : <p className="player-note">{note}</p>}
    </div>
  );
}

function formatSeconds(value: number): string {
  const seconds = Math.min(59, Math.floor(value));
  return `0:${String(seconds).padStart(2, '0')}`;
}
