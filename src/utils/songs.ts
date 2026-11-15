import type { CategoryId, Song, SongEntry } from '../types/game';
import { shuffle } from './shuffle';

function slugFromPath(audioFile: string, index: number): string {
  const base = audioFile
    .replace(/^\/audio\//, '')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return base || `song-${index + 1}`;
}

export function normalizeSongs(entries: SongEntry[]): Song[] {
  const seen = new Set<string>();
  return entries.map((entry, index) => {
    const rawId = entry.id?.trim();
    const baseId = rawId && rawId.length > 0 ? rawId : slugFromPath(entry.audio_file, index);
    let uniqueId = baseId;
    let suffix = 2;
    while (seen.has(uniqueId)) {
      uniqueId = `${baseId}-${suffix}`;
      suffix += 1;
    }
    seen.add(uniqueId);

    return {
      ...entry,
      id: uniqueId,
      song_title: entry.song_title?.trim() ?? '',
    };
  });
}

export function songsInCategory(songs: Song[], category: CategoryId | string): Song[] {
  return songs.filter((song) => song.category === category);
}

export function buildPlaylist(songs: Song[], category: CategoryId | string, count: number): Song[] | null {
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
