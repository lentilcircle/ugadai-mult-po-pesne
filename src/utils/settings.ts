import type { GameSettings } from '../types/game';
import { TEAM_PRESETS } from '../data/catalog';

export const DEFAULT_SETTINGS: GameSettings = {
  teamCount: 2,
  songCount: 3,
  category: 'soviet',
  teamNames: TEAM_PRESETS.map((preset) => preset.name),
};

export function validateSettings(settings: GameSettings, availableSongs: number): string | null {
  const names = settings.teamNames.slice(0, settings.teamCount).map((name) => name.trim());
  if (names.some((name) => name.length === 0)) {
    return 'Укажите название каждой команды.';
  }
  if (names.some((name) => name.length > 24)) {
    return 'Название команды должно быть не длиннее 24 символов.';
  }
  if (availableSongs < settings.songCount) {
    return `В этой категории недостаточно песен: есть ${availableSongs}, для игры нужно ${settings.songCount}.`;
  }
  return null;
}
