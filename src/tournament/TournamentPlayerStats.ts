import type { CardRank } from '../cards';
import { resolveActiveGoalkeeper, resolveSquadPlayerByCardRank, type GameState, type Player } from '../game';
import type { FieldSquadMember, GoalkeeperSquadMember } from '../data/squadTypes';
import type { MatchTeamSetup } from '../game/MatchTeamSetup';
import type { TournamentMatchPlayerStats, TournamentTeamId } from './tournamentTypes';

type PlayerStatIdentity = {
  teamId: TournamentTeamId;
  playerId: string;
  playerName: string;
  shirtNumber: number;
};

export function createTournamentMatchPlayerStatsFromGameState(
  gameState: Readonly<GameState>,
  homeTeamId: TournamentTeamId,
  awayTeamId: TournamentTeamId
): TournamentMatchPlayerStats[] {
  const stats = new Map<string, TournamentMatchPlayerStats>();
  const assistCandidates = new Map<Player['id'], PlayerStatIdentity>();

  for (const event of gameState.log) {
    if (event.type === 'CARD_DEFEATED') {
      if (event.positionId !== 'goalkeeper') {
        assistCandidates.set(
          event.playerId,
          createFieldPlayerIdentity(
            getSetup(gameState, event.playerId),
            getTournamentTeamId(gameState, event.playerId, homeTeamId, awayTeamId),
            event.attackerCard.rank
          )
        );
      }
      continue;
    }

    if (event.type === 'GOAL_SCORED') {
      const scorer = createScorerIdentity(event.scorer.teamId, event.scorer.rank, event.scorer.playerName, event.scorer.shirtNumber);
      getOrCreatePlayerStats(stats, scorer).goals += 1;

      const assistCandidate = assistCandidates.get(event.playerId);

      if (assistCandidate !== undefined && assistCandidate.playerId !== scorer.playerId) {
        getOrCreatePlayerStats(stats, assistCandidate).assists += 1;
      }

      assistCandidates.delete(event.playerId);
      continue;
    }

    if (event.type === 'GOALKEEPER_SAVE') {
      const goalkeeperPlayerId = getOpponentPlayerId(gameState, event.playerId);
      const goalkeeper = createGoalkeeperIdentity(
        getSetup(gameState, goalkeeperPlayerId),
        getTournamentTeamId(gameState, goalkeeperPlayerId, homeTeamId, awayTeamId)
      );

      getOrCreatePlayerStats(stats, goalkeeper).goalkeeperSaves += 1;
      assistCandidates.delete(event.playerId);
      continue;
    }

    if (event.type === 'GOALPOST_HIT' || event.type === 'ATTACK_MISSED' || event.type === 'TURN_ENDED') {
      if ('playerId' in event && event.playerId !== undefined) {
        assistCandidates.delete(event.playerId);
      }
    }
  }

  return [...stats.values()].sort(compareMatchPlayerStats);
}

function createFieldPlayerIdentity(
  setup: MatchTeamSetup,
  teamId: TournamentTeamId,
  rank: CardRank
): PlayerStatIdentity {
  const player = resolveSquadPlayerByCardRank(setup, rank);

  return createFieldIdentity(teamId, player);
}

function createScorerIdentity(
  teamId: TournamentTeamId,
  rank: CardRank,
  playerName: string | undefined,
  shirtNumber: number | undefined
): PlayerStatIdentity {
  return {
    teamId,
    playerId: createFieldPlayerId(rank),
    playerName: playerName?.trim() || `Rank ${rank}`,
    shirtNumber: shirtNumber ?? 0
  };
}

function createGoalkeeperIdentity(setup: MatchTeamSetup, teamId: TournamentTeamId): PlayerStatIdentity {
  const goalkeeper = resolveActiveGoalkeeper(setup);

  return createGoalkeeperStatIdentity(teamId, goalkeeper);
}

function createFieldIdentity(teamId: TournamentTeamId, player: FieldSquadMember): PlayerStatIdentity {
  return {
    teamId,
    playerId: createFieldPlayerId(player.rank),
    playerName: player.name,
    shirtNumber: player.shirtNumber
  };
}

function createGoalkeeperStatIdentity(teamId: TournamentTeamId, goalkeeper: GoalkeeperSquadMember): PlayerStatIdentity {
  return {
    teamId,
    playerId: createGoalkeeperPlayerId(goalkeeper.id),
    playerName: goalkeeper.name,
    shirtNumber: goalkeeper.shirtNumber
  };
}

function createFieldPlayerId(rank: CardRank): string {
  return `field:${rank}`;
}

function createGoalkeeperPlayerId(goalkeeperId: string): string {
  return `goalkeeper:${goalkeeperId}`;
}

function getSetup(gameState: Readonly<GameState>, playerId: Player['id']): MatchTeamSetup {
  return gameState.matchSetups[playerId];
}

function getTournamentTeamId(
  gameState: Readonly<GameState>,
  playerId: Player['id'],
  homeTeamId: TournamentTeamId,
  awayTeamId: TournamentTeamId
): TournamentTeamId {
  return gameState.players[0].id === playerId ? homeTeamId : awayTeamId;
}

function getOpponentPlayerId(gameState: Readonly<GameState>, playerId: Player['id']): Player['id'] {
  const opponent = gameState.players.find((player) => player.id !== playerId);

  if (opponent === undefined) {
    throw new Error('Opponent player is not available.');
  }

  return opponent.id;
}

function getOrCreatePlayerStats(
  stats: Map<string, TournamentMatchPlayerStats>,
  identity: PlayerStatIdentity
): TournamentMatchPlayerStats {
  const key = createPlayerStatsKey(identity.teamId, identity.playerId);
  const existingStats = stats.get(key);

  if (existingStats !== undefined) {
    return existingStats;
  }

  const createdStats: TournamentMatchPlayerStats = {
    ...identity,
    goals: 0,
    assists: 0,
    goalkeeperSaves: 0,
    penaltyGoals: 0,
    penaltyGoalkeeperSaves: 0
  };

  stats.set(key, createdStats);
  return createdStats;
}

function createPlayerStatsKey(teamId: TournamentTeamId, playerId: string): string {
  return `${teamId}:${playerId}`;
}

function compareMatchPlayerStats(first: TournamentMatchPlayerStats, second: TournamentMatchPlayerStats): number {
  return (
    second.goals - first.goals ||
    second.assists - first.assists ||
    second.goalkeeperSaves - first.goalkeeperSaves ||
    first.teamId.localeCompare(second.teamId) ||
    first.playerId.localeCompare(second.playerId)
  );
}
