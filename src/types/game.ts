export type Screen = 'menu' | 'countdown' | 'game' | 'results';

export type CategoryId = 'soviet' | 'russian' | 'jetix' | 'disney' | 'other';

export interface Song {
  id: string;
  category: CategoryId | string;
  cartoon_title: string;
  song_title: string;
  audio_file: string;
  start_time: number;
  end_time: number;
  duration: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  ink: string;
  score: number;
}

export interface GameSettings {
  teamCount: 2 | 3 | 4;
  songCount: 1 | 2 | 3;
  category: CategoryId;
  teamNames: string[];
}

export interface TeamPreset {
  id: string;
  name: string;
  color: string;
  ink: string;
}

export interface CategoryOption {
  id: CategoryId;
  label: string;
  available: boolean;
}
