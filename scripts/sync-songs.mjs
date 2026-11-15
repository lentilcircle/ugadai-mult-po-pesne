import { promises as fs } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT_DIR = process.cwd();
const AUDIO_DIR = path.join(ROOT_DIR, 'public', 'audio');
const SONGS_PATH = path.join(ROOT_DIR, 'src', 'data', 'songs.json');
const AUDIO_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac', '.webm']);
const KNOWN_CATEGORIES = new Set(['soviet', 'russian', 'jetix', 'disney', 'other']);

const args = new Set(process.argv.slice(2));
const autoAccept = args.has('--yes') || args.has('-y') || !input.isTTY;

async function collectAudioFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectAudioFiles(fullPath)));
    } else if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function formatTitle(raw) {
  const cleaned = raw
    .replace(/^\d+[\s._-]+/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function inferMetadata(filePath) {
  const relative = path.relative(AUDIO_DIR, filePath).split(path.sep).join('/');
  const segments = relative.split('/');
  const inferredCategory =
    segments.length > 1 && KNOWN_CATEGORIES.has(segments[0].toLowerCase())
      ? segments[0].toLowerCase()
      : 'soviet';

  const baseName = path.basename(filePath, path.extname(filePath));
  const parts = baseName.split(/\s+[—-]\s+|_-_/);

  if (parts.length >= 2) {
    return {
      category: inferredCategory,
      cartoon_title: formatTitle(parts[0]),
      song_title: formatTitle(parts.slice(1).join(' — ')),
      audio_file: `/audio/${relative}`,
    };
  }

  return {
    category: inferredCategory,
    cartoon_title: formatTitle(baseName),
    song_title: '',
    audio_file: `/audio/${relative}`,
  };
}

async function main() {
  const audioFiles = await collectAudioFiles(AUDIO_DIR);
  let songs = [];

  try {
    const rawJson = await fs.readFile(SONGS_PATH, 'utf8');
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      throw new Error('src/data/songs.json должен содержать JSON-массив.');
    }
    songs = parsed;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      songs = [];
    } else {
      throw error;
    }
  }

  const existingPaths = new Set(
    songs
      .map((song) => (typeof song.audio_file === 'string' ? song.audio_file.trim() : ''))
      .filter(Boolean),
  );

  const missingFiles = [];
  for (const song of songs) {
    if (typeof song.audio_file !== 'string') continue;
    const rel = song.audio_file.replace(/^\/+/, '');
    const diskPath = path.join(ROOT_DIR, 'public', rel);
    try {
      await fs.access(diskPath);
    } catch {
      missingFiles.push(song.audio_file);
    }
  }

  if (missingFiles.length > 0) {
    console.warn(`Внимание: не найдены файлы для записей:\n- ${missingFiles.join('\n- ')}\n`);
  }

  const newFiles = audioFiles.filter((filePath) => {
    const relative = path.relative(AUDIO_DIR, filePath).split(path.sep).join('/');
    return !existingPaths.has(`/audio/${relative}`);
  });

  if (newFiles.length === 0) {
    console.log('Все аудиофайлы из public/audio уже добавлены в src/data/songs.json.');
    return;
  }

  console.log(`Найдено новых аудиофайлов: ${newFiles.length}\n`);

  const rl = autoAccept ? null : readline.createInterface({ input, output });
  const added = [];

  try {
    for (const filePath of newFiles) {
      const suggestion = inferMetadata(filePath);
      if (!rl) {
        const entry = {
          category: suggestion.category,
          cartoon_title: suggestion.cartoon_title,
          ...(suggestion.song_title ? { song_title: suggestion.song_title } : {}),
          audio_file: suggestion.audio_file,
        };
        songs.push(entry);
        added.push(entry);
        continue;
      }

      console.log(`Файл: ${suggestion.audio_file}`);
      const categoryInput = (
        await rl.question(`  Категория (soviet/russian/jetix/disney/other) [${suggestion.category}]: `)
      ).trim();
      const cartoonInput = (
        await rl.question(`  Название мультфильма [${suggestion.cartoon_title}]: `)
      ).trim();
      const songInput = (
        await rl.question(
          `  Название песни${suggestion.song_title ? ` [${suggestion.song_title}]` : ' (Enter — пропустить)'}: `,
        )
      ).trim();
      const startInput = (
        await rl.question('  Начало фрагмента в секундах (Enter — случайные 10 сек): ')
      ).trim();

      const entry = {
        category: categoryInput || suggestion.category,
        cartoon_title: cartoonInput || suggestion.cartoon_title,
      };

      const finalSongTitle = songInput || suggestion.song_title;
      if (finalSongTitle) {
        entry.song_title = finalSongTitle;
      }

      entry.audio_file = suggestion.audio_file;

      if (startInput !== '') {
        const parsedStart = Number(startInput);
        if (Number.isFinite(parsedStart) && parsedStart >= 0) {
          entry.start_time = parsedStart;
        }
      }

      songs.push(entry);
      added.push(entry);
      console.log('');
    }
  } finally {
    rl?.close();
  }

  await fs.writeFile(SONGS_PATH, `${JSON.stringify(songs, null, 2)}\n`, 'utf8');
  console.log(`Добавлено в src/data/songs.json: ${added.length}`);
  for (const item of added) {
    console.log(`  + [${item.category}] ${item.cartoon_title} (${item.audio_file})`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
