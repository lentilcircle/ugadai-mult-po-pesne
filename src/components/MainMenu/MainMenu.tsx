import { CATEGORIES, TEAM_COUNTS, TEAM_PRESETS } from '../../data/catalog';
import type { CategoryId, GameSettings, SongEntry } from '../../types/game';
import { normalizeSongs, songsInCategory } from '../../utils/songs';
import songs from '../../data/songs.json';

interface MainMenuProps {
  settings: GameSettings;
  error: string | null;
  onChange: (patch: Partial<GameSettings>) => void;
  onStart: () => void;
}

const catalog = normalizeSongs(songs as SongEntry[]);
const knownCategoryIds = new Set<string>(CATEGORIES.map((category) => category.id));
const extraCategories = Array.from(
  new Set(catalog.map((song) => song.category).filter((category) => !knownCategoryIds.has(category))),
).map((id) => ({ id: id as CategoryId, label: id, available: true }));
const allCategories = [...CATEGORIES, ...extraCategories];

export function MainMenu({ settings, error, onChange, onStart }: MainMenuProps) {
  const available = songsInCategory(catalog, settings.category).length;
  const songCounts = Array.from({ length: available }, (_, index) => index + 1);
  const visibleTeams = TEAM_PRESETS.slice(0, settings.teamCount);
  const isSolo = settings.teamCount === 1;

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
                aria-label={count === 1 ? '1 — соло-игра' : `${count} команды`}
                onClick={() => onChange({ teamCount: count })}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="hint">
            {isSolo
              ? 'Соло-режим: игра для одного участника.'
              : `Командная игра: ${settings.teamCount} ${teamWord(settings.teamCount)}.`}
          </p>
        </fieldset>

        <fieldset className="setting">
          <legend>Количество песен</legend>
          <div className="choice-row">
            {songCounts.map((count) => (
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
            {allCategories.map((category) => {
              const count = songsInCategory(catalog, category.id).length;
              const categoryAvailable = count > 0;
              const selected = settings.category === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={[
                    'category',
                    selected ? 'is-selected' : '',
                    categoryAvailable ? '' : 'is-locked',
                  ].filter(Boolean).join(' ')}
                  disabled={!categoryAvailable}
                  aria-pressed={categoryAvailable ? selected : undefined}
                  onClick={() => {
                    const clampedCount =
                      count > 0 ? Math.min(Math.max(1, settings.songCount), count) : settings.songCount;
                    onChange({ category: category.id, songCount: clampedCount });
                  }}
                >
                  <span>{category.label}</span>
                  {categoryAvailable ? <em>{count} {songWord(count)}</em> : <em>недоступно</em>}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="setting setting-wide">
          <legend>Режим хардкора</legend>
          <button
            type="button"
            role="switch"
            aria-checked={settings.hardcore}
            className={settings.hardcore ? 'hardcore-toggle is-active' : 'hardcore-toggle'}
            onClick={() => onChange({ hardcore: !settings.hardcore })}
          >
            <span className="hardcore-copy">
              <strong>HARDCORE MODE</strong>
              <span>
                {settings.hardcore
                  ? 'Случайная 1 секунда музыки вместо 10 · +2 балла за ответ (+1 дополнительный)'
                  : 'Включить: случайная 1 сек вместо 10 и +1 дополнительный балл за ответ'}
              </span>
            </span>
            <span className="hardcore-switch" aria-hidden="true">
              <span>{settings.hardcore ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </span>
          </button>
        </fieldset>

        <fieldset className="setting setting-wide">
          <legend>{isSolo ? 'Имя игрока' : 'Названия команд'}</legend>
          <div className="team-names">
            {visibleTeams.map((preset, index) => (
              <label key={preset.id} className="team-name" style={{ borderColor: preset.color }}>
                <span className="swatch" style={{ background: preset.color }} />
                <input
                  value={settings.teamNames[index] ?? ''}
                  maxLength={24}
                  aria-label={isSolo ? 'Имя игрока' : `Название команды ${index + 1}`}
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

function teamWord(count: number): string {
  if (count === 1) return 'команда';
  if (count >= 2 && count <= 4) return 'команды';
  return 'команд';
}

function songWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'песня';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'песни';
  return 'песен';
}
