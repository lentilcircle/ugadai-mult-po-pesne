import { useCallback, useRef, useState } from 'react';
import { MainMenu } from './components/MainMenu/MainMenu';
import { Countdown } from './components/Countdown/Countdown';
import { GameScreen } from './components/GameScreen/GameScreen';
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen';
import { TEAM_PRESETS } from './data/catalog';
import songsData from './data/songs.json';
import type { GameSettings, Screen, Song, Team } from './types/game';
import { DEFAULT_SETTINGS, validateSettings } from './utils/settings';
import { buildPlaylist, songsInCategory } from './utils/songs';

const songs = songsData as Song[];

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [awardedTeamId, setAwardedTeamId] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const awardedRef = useRef<string | null>(null);

  const beginRound = useCallback((nextSettings: GameSettings, nextTeams: Team[]) => {
    const playlistNext = buildPlaylist(songs, nextSettings.category, nextSettings.songCount);
    if (!playlistNext) {
      setMenuError('Не удалось собрать список песен.');
      setScreen('menu');
      return;
    }
    setTeams(nextTeams.map((team) => ({ ...team, score: 0 })));
    setPlaylist(playlistNext);
    setQuestionIndex(0);
    setRevealed(false);
    awardedRef.current = null;
    setAwardedTeamId(null);
    setMenuError(null);
    setScreen('countdown');
  }, []);

  const startFromMenu = useCallback(() => {
    const available = songsInCategory(songs, settings.category).length;
    const problem = validateSettings(settings, available);
    if (problem) {
      setMenuError(problem);
      return;
    }
    const names = settings.teamNames.map((name) => name.trim());
    const nextTeams = TEAM_PRESETS.slice(0, settings.teamCount).map((preset, index) => ({
      id: preset.id,
      name: names[index] || preset.name,
      color: preset.color,
      ink: preset.ink,
      score: 0,
    }));
    setSettings({ ...settings, teamNames: names });
    beginRound({ ...settings, teamNames: names }, nextTeams);
  }, [beginRound, settings]);

  const finishCountdown = useCallback(() => {
    setScreen('game');
  }, []);

  const reveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const award = useCallback((teamId: string) => {
    if (!revealed || awardedRef.current) return;
    awardedRef.current = teamId;
    setAwardedTeamId(teamId);
    setTeams((current) =>
      current.map((team) => (team.id === teamId ? { ...team, score: team.score + 1 } : team)),
    );
  }, [revealed]);

  const undo = useCallback(() => {
    const teamId = awardedRef.current;
    if (!teamId) return;
    awardedRef.current = null;
    setAwardedTeamId(null);
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId ? { ...team, score: Math.max(0, team.score - 1) } : team,
      ),
    );
  }, []);

  const nextQuestion = useCallback(() => {
    if (!revealed) return;
    if (questionIndex + 1 >= playlist.length) {
      setScreen('results');
      return;
    }
    setQuestionIndex((index) => index + 1);
    setRevealed(false);
    awardedRef.current = null;
    setAwardedTeamId(null);
  }, [playlist.length, questionIndex, revealed]);

  const playAgain = useCallback(() => {
    beginRound(settings, teams);
  }, [beginRound, settings, teams]);

  const currentSong = playlist[questionIndex];

  return (
    <main className="stage">
      {screen === 'menu' ? (
        <MainMenu
          settings={settings}
          error={menuError}
          onChange={(patch) => {
            setSettings((current) => ({ ...current, ...patch }));
            setMenuError(null);
          }}
          onStart={startFromMenu}
        />
      ) : null}
      {screen === 'countdown' ? <Countdown onComplete={finishCountdown} /> : null}
      {screen === 'game' && currentSong ? (
        <GameScreen
          key={currentSong.id}
          song={currentSong}
          questionNumber={questionIndex + 1}
          questionTotal={playlist.length}
          teams={teams}
          revealed={revealed}
          awardedTeamId={awardedTeamId}
          onReveal={reveal}
          onAward={award}
          onUndo={undo}
          onNext={nextQuestion}
        />
      ) : null}
      {screen === 'results' ? (
        <ResultsScreen teams={teams} onReplay={playAgain} onMenu={() => setScreen('menu')} />
      ) : null}
    </main>
  );
}
