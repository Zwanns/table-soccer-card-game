import type { CardRank, GoalkeeperRank } from '../cards';
import type { FieldSquadMember, GoalkeeperSquadMember } from '../data/squadTypes';
import { loadSquad } from '../services/squadStorage';

export type FieldCardPlayerProfile = {
  teamId: string;
  rank: CardRank;
  playerName: string;
  shirtNumber: number;
};

export type GoalkeeperCardPlayerProfile = {
  role: 'goalkeeper';
  teamId: string;
  goalkeeperRank: GoalkeeperRank;
  playerName: string;
  shirtNumber: number;
};

export type CardPlayerProfile = FieldCardPlayerProfile | GoalkeeperCardPlayerProfile;

export function getFieldCardPlayerProfile(teamId: string, rank: CardRank): CardPlayerProfile {
  const squad = loadSquad(teamId);

  return createCardPlayerProfile(teamId, squad.fieldPlayers[rank]);
}

export function createCardPlayerProfile(teamId: string, player: FieldSquadMember): CardPlayerProfile {
  return {
    teamId,
    rank: player.rank,
    playerName: player.name,
    shirtNumber: player.shirtNumber
  };
}

export function createGoalkeeperCardProfile(
  teamId: string,
  player: GoalkeeperSquadMember,
  goalkeeperRank: GoalkeeperRank
): CardPlayerProfile {
  return {
    role: 'goalkeeper',
    teamId,
    goalkeeperRank,
    playerName: player.name,
    shirtNumber: player.shirtNumber
  };
}

export function getCardTooltipText(profile: CardPlayerProfile): string {
  if (isGoalkeeperCardPlayerProfile(profile)) {
    return `${profile.playerName}\n№${profile.shirtNumber}\nGK: ${profile.goalkeeperRank}`;
  }

  return `${profile.playerName}\n№${profile.shirtNumber}\nНоминал: ${profile.rank}`;
}

function isGoalkeeperCardPlayerProfile(profile: CardPlayerProfile): profile is GoalkeeperCardPlayerProfile {
  return 'role' in profile && profile.role === 'goalkeeper';
}
