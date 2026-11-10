import type { CategoryOption, TeamPreset } from '../types/game';

export const TEAM_PRESETS: TeamPreset[] = [
  { id: 'red', name: 'Красные', color: '#BD493B', ink: '#F1E8D6' },
  { id: 'blue', name: 'Синие', color: '#456B8B', ink: '#F1E8D6' },
  { id: 'yellow', name: 'Жёлтые', color: '#D5A644', ink: '#382D26' },
  { id: 'green', name: 'Зелёные', color: '#3E6A4D', ink: '#F1E8D6' },
];

export const CATEGORIES: CategoryOption[] = [
  { id: 'soviet', label: 'Советские мультфильмы', available: true },
  { id: 'russian', label: 'Российские мультфильмы', available: false },
  { id: 'jetix', label: 'Jetix', available: false },
  { id: 'disney', label: 'Disney', available: false },
  { id: 'other', label: 'Другие мультфильмы', available: false },
];

export const TEAM_COUNTS = [2, 3, 4] as const;
export const SONG_COUNTS = [1, 2, 3] as const;
