import type { Team } from '../../types/game';

interface TeamScoreProps {
  team: Team;
  revealed: boolean;
  awardedTeamId: string | null;
  onAward: (teamId: string) => void;
  onUndo: () => void;
}

export function TeamScore({ team, revealed, awardedTeamId, onAward, onUndo }: TeamScoreProps) {
  const awarded = awardedTeamId === team.id;
  const blocked = Boolean(awardedTeamId) && !awarded;

  return (
    <article className="score-card" style={{ borderColor: team.color }}>
      <div className="score-main">
        <span className="swatch" style={{ background: team.color }} />
        <h3>{team.name}</h3>
        <p key={team.score} className="points" style={{ color: team.color }}>
          {team.score}
        </p>
      </div>
      {revealed ? (
        awarded ? (
          <button type="button" className="btn btn-undo" onClick={onUndo}>
            Отменить
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-point"
            style={{ background: team.color, color: team.ink }}
            disabled={blocked}
            onClick={() => onAward(team.id)}
          >
            +1 балл
          </button>
        )
      ) : (
        <p className="score-wait">Балл после ответа</p>
      )}
    </article>
  );
}
