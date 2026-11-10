import { useEffect } from 'react';
import type { Song, Team } from '../../types/game';
import { useAudioClip } from '../../hooks/useAudioClip';
import { AudioPlayer } from '../AudioPlayer/AudioPlayer';
import { TeamScore } from '../TeamScore/TeamScore';

interface GameScreenProps {
  song: Song;
  questionNumber: number;
  questionTotal: number;
  teams: Team[];
  revealed: boolean;
  awardedTeamId: string | null;
  onReveal: () => void;
  onAward: (teamId: string) => void;
  onUndo: () => void;
  onNext: () => void;
}

export function GameScreen({
  song,
  questionNumber,
  questionTotal,
  teams,
  revealed,
  awardedTeamId,
  onReveal,
  onAward,
  onUndo,
  onNext,
}: GameScreenProps) {
  const clip = useAudioClip(song);
  const fragment = Math.max(0, song.end_time - song.start_time);

  useEffect(() => {
    if (revealed) clip.halt();
  }, [clip.halt, revealed, song.id]);

  return (
    <section className="screen game-screen">
      <header className="game-bar">
        <p>
          Песня <strong>{questionNumber}</strong> из {questionTotal}
        </p>
        <p>Вопрос {questionNumber}</p>
      </header>

      <div className="game-layout">
        <div className="game-stage">
          <AudioPlayer
            status={clip.status}
            error={clip.error}
            progress={clip.progress}
            duration={fragment}
            onToggle={clip.toggle}
            onReplay={clip.replay}
          />

          <div className={revealed ? 'answer is-open' : 'answer'} aria-live="polite">
            <span className="answer-label">{revealed ? 'Правильный ответ' : 'Ответ скрыт'}</span>
            {revealed ? (
              <>
                <h2>{song.cartoon_title}</h2>
                {song.song_title ? <p>{song.song_title}</p> : null}
              </>
            ) : (
              <h2 className="answer-hidden">Слушайте фрагмент</h2>
            )}
          </div>
        </div>

        <aside className="scoreboard" aria-label="Счёт команд">
          {teams.map((team) => (
            <TeamScore
              key={team.id}
              team={team}
              revealed={revealed}
              awardedTeamId={awardedTeamId}
              onAward={onAward}
              onUndo={onUndo}
            />
          ))}
        </aside>
      </div>

      <div className="game-actions">
        <button type="button" className="btn btn-secondary" onClick={onReveal} disabled={revealed}>
          {revealed ? 'Ответ открыт' : 'Показать результат'}
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext} disabled={!revealed}>
          Далее
        </button>
      </div>
    </section>
  );
}
