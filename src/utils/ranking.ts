import type { Team } from '../types/game';

export interface RankedTeam {
  team: Team;
  place: number;
}

export interface PlaceGroup {
  place: number;
  teams: Team[];
}

export function groupByPlace(teams: Team[]): PlaceGroup[] {
  const sorted = [...teams].sort((left, right) => right.score - left.score);
  const groups: PlaceGroup[] = [];

  sorted.forEach((team) => {
    const last = groups[groups.length - 1];
    if (last && last.teams[0].score === team.score) {
      last.teams.push(team);
      return;
    }
    groups.push({ place: groups.length + 1, teams: [team] });
  });

  return groups;
}

export function flattenRanking(groups: PlaceGroup[]): RankedTeam[] {
  return groups.flatMap((group) => group.teams.map((team) => ({ team, place: group.place })));
}
