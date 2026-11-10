import type { CategoryId, Song } from '../types/game';
import { shuffle } from './shuffle';

export function songsInCategory(songs: Song[], category: CategoryId): Song[] {
  return songs.filter((song) => song.category === category);
}

export function buildPlaylist(songs: Song[], category: CategoryId, count: number): Song[] | null {
  const pool = songsInCategory(songs, category);
  if (pool.length < count) return null;
  const picked: Song[] = [];
  const used = new Set<string>();
  for (const song of shuffle(pool)) {
    if (used.has(song.id)) continue;
    used.add(song.id);
    picked.push(song);
    if (picked.length === count) break;
  }
  return picked;
}
