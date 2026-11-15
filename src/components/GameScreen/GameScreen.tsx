import { useEffect, useState } from 'react';
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
  noOneGuessed: boolean;
  hardcore: boolean;
  pointsPerAnswer: number;
  onReveal: () => void;
  onAward: (teamId: string) => void;
  onUndo: () => void;
  onNoGuess: () => void;
  onUndoNoGuess: () => void;
  onNext: () => void;
  onExitToMenu: () => void;
}

export function GameScreen({
  song,
  questionNumber,
  questionTotal,
  teams,
  revealed,
  awardedTeamId,
  noOneGuessed,
  hardcore,
  pointsPerAnswer,
  onReveal,
  onAward,
  onUndo,
  onNoGuess,
  onUndoNoGuess,
  onNext,
  onExitToMenu,
}: GameScreenProps) {
  const clip = useAudioClip(song, hardcore ? 1 : 10);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const roundResolved = Boolean(awardedTeamId) || noOneGuessed;
  const pointLabel = `+${pointsPerAnswer} ${pointsPerAnswer === 1 ? 'балл' : 'балла'}`;

  useEffect(() => {
    setHasStarted(false);
  }, [song.id]);

  useEffect(() => {
    if (clip.status === 'playing') {
      setHasStarted(true);
    }
  }, [clip.status]);

  useEffect(() => {
    if (revealed) clip.halt();
  }, [clip.halt, revealed, song.id]);

  useEffect(() => {
    if (!confirmExitOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmExitOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmExitOpen]);

  const handleConfirmExit = () => {
    clip.halt();
    setConfirmExitOpen(false);
    onExitToMenu();
  };

  return (
    <section className="screen game-screen">
      <header className="game-bar">
        <div className="game-bar-meta">
          <p>
            Песня <strong>{questionNumber}</strong> из {questionTotal}
          </p>
          <p>Вопрос {questionNumber}</p>
          {hardcore ? <span className="hardcore-badge">HARDCORE · 1 СЕК · {pointLabel}</span> : null}
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-compact"
          onClick={() => setConfirmExitOpen(true)}
        >
          В меню
        </button>
      </header>

      <div className="game-layout">
        <div className="game-stage">
          <AudioPlayer
            status={clip.status}
            error={clip.error}
            progress={clip.progress}
            duration={clip.duration}
            revealed={revealed}
            canReveal={hasStarted}
            onToggle={clip.toggle}
            onReplay={clip.replay}
            onReveal={onReveal}
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
          {revealed ? (
            <div
              className={roundResolved ? 'score-hint is-awarded' : 'score-hint'}
              role="status"
              aria-live="polite"
            >
              <span className="score-hint-label">Подсказка</span>
              <p>
                {awardedTeamId
                  ? `Начислено ${pointLabel}! Нажмите «Далее», чтобы перейти к следующему вопросу.`
                  : noOneGuessed
                    ? 'Баллы не начислены. Нажмите «Далее», чтобы перейти к следующему вопросу.'
                    : teams.length === 1
                      ? `Теперь нажмите «${pointLabel}», если угадали, или «Не угадал», чтобы открыть кнопку «Далее».`
                      : `Теперь выберите команду и нажмите «${pointLabel}» или нажмите «Никто не угадал», чтобы открыть кнопку «Далее».`}
              </p>
            </div>
          ) : null}

          {teams.map((team) => (
            <TeamScore
              key={team.id}
              team={team}
              revealed={revealed}
              awardedTeamId={awardedTeamId}
              noOneGuessed={noOneGuessed}
              pointsPerAnswer={pointsPerAnswer}
              onAward={onAward}
              onUndo={onUndo}
            />
          ))}

          {revealed ? (
            noOneGuessed ? (
              <div className="score-card no-guess-card is-selected">
                <div className="no-guess-row">
                  <span>{teams.length === 1 ? 'Не угадал' : 'Никто не угадал'}</span>
                  <button type="button" className="btn btn-undo btn-compact" onClick={onUndoNoGuess}>
                    Отменить
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-no-guess"
                disabled={Boolean(awardedTeamId)}
                onClick={onNoGuess}
              >
                {teams.length === 1 ? 'Не угадал' : 'Никто не угадал'}
              </button>
            )
          ) : null}
        </aside>
      </div>

      <div className="game-actions">
        <button type="button" className="btn btn-primary" onClick={onNext} disabled={!roundResolved}>
          Далее
        </button>
      </div>

      {confirmExitOpen ? (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmExitOpen(false);
            }
          }}
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-dialog-title"
          >
            <p className="kicker">Выход из игры</p>
            <h2 id="exit-dialog-title">Вы уверены, что хотите вернуться в главное меню?</h2>
            <p className="modal-copy">
              Текущая партия остановится, а набранный счёт команд будет сброшен.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleConfirmExit}>
                Выйти в меню
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setConfirmExitOpen(false)}
              >
                Остаться
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
