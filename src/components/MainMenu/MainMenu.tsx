import { CATEGORIES, SONG_COUNTS, TEAM_COUNTS, TEAM_PRESETS } from '../../data/catalog';
import type { GameSettings } from '../../types/game';
import { songsInCategory } from '../../utils/songs';
import songs from '../../data/songs.json';
import type { Song } from '../../types/game';

interface MainMenuProps {
  settings: GameSettings;
  error: string | null;
  onChange: (patch: Partial<GameSettings>) => void;
  onStart: () => void;
}

const catalog = songs as Song[];

export function MainMenu({ settings, error, onChange, onStart }: MainMenuProps) {
  const available = songsInCategory(catalog, settings.category).length;
  const visibleTeams = TEAM_PRESETS.slice(0, settings.teamCount);

  return (
    <section className="screen menu-screen">
      <header className="masthead">
        <p className="kicker">Семейная телевикторина</p>
        <h1>
          Угадай
          <span> мульт </span>
          по песне
        </h1>
        <p className="lede">
          Ведущий включает короткий фрагмент. Команды вслух называют мультфильм. Один балл — той, кто ответила первой.
        </p>
      </header>

      <div className="menu-grid">
        <fieldset className="setting">
          <legend>Количество команд</legend>
          <div className="choice-row">
            {TEAM_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                className={settings.teamCount === count ? 'choice is-selected' : 'choice'}
                onClick={() => onChange({ teamCount: count })}
              >
                {count}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="setting">
          <legend>Количество песен</legend>
          <div className="choice-row">
            {SONG_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                className={settings.songCount === count ? 'choice is-selected' : 'choice'}
                onClick={() => onChange({ songCount: count })}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="hint">В выбранной категории сейчас {available} {songWord(available)}.</p>
        </fieldset>

        <fieldset className="setting setting-wide">
          <legend>Категория мультфильмов</legend>
          <div className="category-list">
            {CATEGORIES.map((category) => {
              const selected = settings.category === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={[
                    'category',
                    selected ? 'is-selected' : '',
                    category.available ? '' : 'is-locked',
                  ].filter(Boolean).join(' ')}
                  disabled={!category.available}
                  aria-pressed={category.available ? selected : undefined}
                  onClick={() => onChange({ category: category.id })}
                >
                  <span>{category.label}</span>
                  {category.available ? <em>открыта</em> : <em>недоступно</em>}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="setting setting-wide">
          <legend>Названия команд</legend>
          <div className="team-names">
            {visibleTeams.map((preset, index) => (
              <label key={preset.id} className="team-name" style={{ borderColor: preset.color }}>
                <span className="swatch" style={{ background: preset.color }} />
                <input
                  value={settings.teamNames[index] ?? ''}
                  maxLength={24}
                  aria-label={`Название команды ${index + 1}`}
                  onChange={(event) => {
                    const teamNames = [...settings.teamNames];
                    teamNames[index] = event.target.value;
                    onChange({ teamNames });
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <button type="button" className="btn btn-primary btn-start" onClick={onStart}>
        Начать игру
      </button>
    </section>
  );
}

function songWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'песня';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'песни';
  return 'песен';
}
