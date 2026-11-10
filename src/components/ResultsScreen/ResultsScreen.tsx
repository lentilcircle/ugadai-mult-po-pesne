import { useMemo } from 'react';
import type { Team } from '../../types/game';
import { groupByPlace } from '../../utils/ranking';

interface ResultsScreenProps {
  teams: Team[];
  onReplay: () => void;
  onMenu: () => void;
}

export function ResultsScreen({ teams, onReplay, onMenu }: ResultsScreenProps) {
  const groups = useMemo(() => groupByPlace(teams), [teams]);
  const winners = groups[0];
  const second = groups[1];
  const third = groups[2];
  const rest = groups.slice(3);
  const sharedWin = winners.teams.length > 1;
  const confetti = useMemo(() => createConfetti(28), []);

  return (
    <section className="screen results-screen">
      <div className="confetti" aria-hidden="true">
        {confetti.map((piece) => (
          <i
            key={piece.id}
            style={{
              left: `${piece.left}%`,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          />
        ))}
      </div>

      <p className="kicker">Итог партии</p>
      <div className="winner-block">
        <Trophy />
        <p className="place-label">{sharedWin ? '1 место · ничья' : '1 место'}</p>
        <div className={sharedWin ? 'winner-names are-shared' : 'winner-names'}>
          {winners.teams.map((team) => (
            <h2 key={team.id} style={{ borderColor: team.color }}>
              {team.name}
              <span style={{ color: team.color }}>{team.score}</span>
            </h2>
          ))}
        </div>
      </div>

      {second ? <PlaceRow label="2 место" teams={second.teams} /> : null}
      {third ? <PlaceRow label="3 место" teams={third.teams} /> : null}

      {rest.length > 0 ? (
        <ol className="rest-list">
          {rest.flatMap((group) =>
            group.teams.map((team) => (
              <li key={team.id}>
                <span>{group.place} место</span>
                <strong>{team.name}</strong>
                <em style={{ color: team.color }}>{team.score}</em>
              </li>
            )),
          )}
        </ol>
      ) : null}

      <div className="results-actions">
        <button type="button" className="btn btn-primary" onClick={onReplay}>
          Играть ещё раз
        </button>
        <button type="button" className="btn btn-secondary" onClick={onMenu}>
          В главное меню
        </button>
      </div>
    </section>
  );
}

function PlaceRow({ label, teams }: { label: string; teams: Team[] }) {
  return (
    <div className="place-row">
      <p>{teams.length > 1 ? `${label} · вместе` : label}</p>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            <span className="swatch" style={{ background: team.color }} />
            <strong>{team.name}</strong>
            <em style={{ color: team.color }}>{team.score}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Trophy() {
  return (
    <svg className="trophy" viewBox="0 0 88 88" aria-hidden="true">
      <path d="M24 14h40v18c0 12-8 22-20 24-12-2-20-12-20-24V14z" fill="#D5A644" />
      <path d="M24 20H14c0 12 6 18 12 20M64 20h10c0 12-6 18-12 20" fill="none" stroke="#BD493B" strokeWidth="4" />
      <path d="M38 56h12v8H38zM30 68h28v6H30z" fill="#382D26" />
    </svg>
  );
}

function createConfetti(count: number): { id: number; left: number; delay: number; duration: number; color: string }[] {
  const colors = ['#BD493B', '#456B8B', '#D5A644', '#382D26', '#3E6A4D'];
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.round((id * 37) % 100),
    delay: (id % 8) * 0.05,
    duration: 1.35 + (id % 5) * 0.12,
    color: colors[id % colors.length],
  }));
}
