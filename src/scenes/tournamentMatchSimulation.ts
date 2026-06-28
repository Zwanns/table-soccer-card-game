import { GoalkeeperDeck, type Card, type CardRank, type GoalkeeperCard } from '../cards';
import type { PlayerControllerType } from '../ai';
import { createDefaultSquad } from '../data/defaultSquads';
import type { NationalTeam } from '../data/nationalTeams';
import {
  createEmptyField,
  createMatchTeamSetup,
  type GameEvent,
  type GameState,
  type Player
} from '../game';
import {
  createTournamentMatchResultFromGameState,
  createTournamentRandom,
  getTournamentTeamControllerType,
  submitTournamentMatchResultObject,
  type TournamentMatch,
  type TournamentStage,
  type TournamentState
} from '../tournament';

type SimulatedTournamentMatchOptions = {
  match: TournamentMatch;
  homeTeam: NationalTeam;
  awayTeam: NationalTeam;
  tournamentSeed: string;
  homeControllerType?: PlayerControllerType;
  awayControllerType?: PlayerControllerType;
};

type SimulatedScore = {
  homeGoals: number;
  awayGoals: number;
  homeShots: number;
  awayShots: number;
};

const GOAL_TABLE = [0, 0, 1, 1, 1, 2, 2, 3, 4] as const;
const SCORER_RANKS: readonly CardRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6'];
const ASSIST_RANKS: readonly CardRank[] = ['K', 'Q', 'J', '10', '9', '8', '7', '6', 'A'];

export function createSimulatedTournamentGameState(options: SimulatedTournamentMatchOptions): GameState {
  const random = createTournamentRandom(`${options.tournamentSeed}:${options.match.id}:simulation`);
  const score = createSimulatedScore(options.match.stage, random);
  const homeSquad = createDefaultSquad(options.homeTeam.flagCode);
  const awaySquad = createDefaultSquad(options.awayTeam.flagCode);
  const players: [Player, Player] = [
    createPlayer('PLAYER_1', options.homeTeam, score.homeGoals),
    createPlayer('PLAYER_2', options.awayTeam, score.awayGoals)
  ];
  const log = createSimulatedLog({
    homeGoals: score.homeGoals,
    awayGoals: score.awayGoals,
    homeShots: score.homeShots,
    awayShots: score.awayShots,
    homeTeamId: options.homeTeam.flagCode,
    awayTeamId: options.awayTeam.flagCode,
    homeSquad,
    awaySquad
  });
  const winnerId =
    score.homeGoals > score.awayGoals ? players[0].id : score.awayGoals > score.homeGoals ? players[1].id : null;

  return {
    players,
    matchSetups: {
      PLAYER_1: createMatchTeamSetup({
        teamId: options.homeTeam.flagCode,
        squad: homeSquad,
        goalkeeperKitId: 'gk1',
        controllerType: options.homeControllerType
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: options.awayTeam.flagCode,
        squad: awaySquad,
        goalkeeperKitId: 'gk2',
        controllerType: options.awayControllerType
      })
    },
    activePlayerId: null,
    phase: 'GAME_OVER',
    attackCard: null,
    attackBank: [],
    legalTargetPositionIds: [],
    winnerId,
    isDraw: winnerId === null,
    turnNumber: Math.max(1, score.homeShots + score.awayShots),
    log: [...log, { type: 'GAME_OVER', winnerId }]
  };
}

export function submitSimulatedTournamentMatch(
  tournament: TournamentState,
  match: TournamentMatch,
  homeTeam: NationalTeam,
  awayTeam: NationalTeam
): TournamentState {
  const gameState = createSimulatedTournamentGameState({
    match,
    homeTeam,
    awayTeam,
    tournamentSeed: tournament.seed,
    homeControllerType: getTournamentTeamControllerType(tournament, homeTeam.flagCode),
    awayControllerType: getTournamentTeamControllerType(tournament, awayTeam.flagCode)
  });
  const result = createTournamentMatchResultFromGameState(match.id, gameState, homeTeam.flagCode, awayTeam.flagCode);

  return submitTournamentMatchResultObject(tournament, result);
}

function createSimulatedScore(stage: TournamentStage, random: () => number): SimulatedScore {
  let homeGoals = pickGoals(random);
  let awayGoals = pickGoals(random);

  if (stage !== 'group' && homeGoals === awayGoals) {
    if (random() < 0.5) {
      homeGoals += 1;
    } else {
      awayGoals += 1;
    }
  }

  return {
    homeGoals,
    awayGoals,
    homeShots: homeGoals + 1 + Math.floor(random() * 4),
    awayShots: awayGoals + 1 + Math.floor(random() * 4)
  };
}

function pickGoals(random: () => number): number {
  return GOAL_TABLE[Math.floor(random() * GOAL_TABLE.length)] ?? 1;
}

function createPlayer(id: Player['id'], team: NationalTeam, goals: number): Player {
  return {
    id,
    name: team.name,
    flagCode: team.flagCode,
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals,
    deck: { cards: [] },
    goalkeeperDeck: new GoalkeeperDeck([{ id: 'SIM_GK_DECK_6', kind: 'goalkeeper', rank: '6' }]),
    field: createEmptyField()
  };
}

function createSimulatedLog(options: {
  homeGoals: number;
  awayGoals: number;
  homeShots: number;
  awayShots: number;
  homeTeamId: string;
  awayTeamId: string;
  homeSquad: ReturnType<typeof createDefaultSquad>;
  awaySquad: ReturnType<typeof createDefaultSquad>;
}): GameEvent[] {
  const homeEvents = createShotEvents({
    playerId: 'PLAYER_1',
    teamId: options.homeTeamId,
    goals: options.homeGoals,
    shots: options.homeShots,
    firstTurnNumber: 1,
    squad: options.homeSquad
  });
  const awayEvents = createShotEvents({
    playerId: 'PLAYER_2',
    teamId: options.awayTeamId,
    goals: options.awayGoals,
    shots: options.awayShots,
    firstTurnNumber: options.homeShots + 1,
    squad: options.awaySquad
  });

  return [{ type: 'GAME_STARTED' }, ...homeEvents, ...awayEvents];
}

function createShotEvents(options: {
  playerId: Player['id'];
  teamId: string;
  goals: number;
  shots: number;
  firstTurnNumber: number;
  squad: ReturnType<typeof createDefaultSquad>;
}): GameEvent[] {
  const events: GameEvent[] = [];
  const goalCount = Math.max(0, options.goals);
  const shotCount = Math.max(options.shots, goalCount);
  const savedShotCount = shotCount - goalCount;

  for (let index = 0; index < goalCount; index += 1) {
    const rank = SCORER_RANKS[index % SCORER_RANKS.length] ?? 'A';
    const attackerCard = createCard(rank, index);
    const goalkeeperCard = createGoalkeeperCard(index);
    const turnNumber = options.firstTurnNumber + index;
    const assistRank = getAssistRank(rank, index);
    const assistCard = createCard(assistRank, index + shotCount);
    const scorer = options.squad.fieldPlayers[rank];

    events.push({
      type: 'CARD_DEFEATED',
      playerId: options.playerId,
      turnNumber,
      positionId: 'defender-1',
      attackerCard: assistCard,
      defenderCard: createCard('2', index)
    });
    events.push({ type: 'SHOT_ON_GOAL', playerId: options.playerId, attackerCard, goalkeeperCard });
    events.push({
      type: 'GOAL_SCORED',
      playerId: options.playerId,
      turnNumber,
      attackerCard,
      scorer: {
        playerName: scorer.name,
        shirtNumber: scorer.shirtNumber,
        rank,
        teamId: options.teamId
      }
    });
  }

  for (let index = 0; index < savedShotCount; index += 1) {
    const shotIndex = goalCount + index;
    const rank = SCORER_RANKS[shotIndex % SCORER_RANKS.length] ?? 'A';
    const attackerCard = createCard(rank, shotIndex);
    const goalkeeperCard = createGoalkeeperCard(shotIndex);

    events.push({ type: 'SHOT_ON_GOAL', playerId: options.playerId, attackerCard, goalkeeperCard });
    events.push({ type: 'GOALKEEPER_SAVE', playerId: options.playerId, attackerCard, goalkeeperCard });
  }

  return events;
}

function getAssistRank(scorerRank: CardRank, goalIndex: number): CardRank {
  return ASSIST_RANKS.find((rank, index) => index >= goalIndex && rank !== scorerRank) ?? 'K';
}

function createCard(rank: CardRank, index: number): Card {
  return {
    id: `SIM_${rank}_${index}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : index % 2 === 0 ? 'RED' : 'BLACK',
    suit: rank === 'JOKER' ? null : index % 2 === 0 ? 'HEARTS' : 'SPADES'
  };
}

function createGoalkeeperCard(index: number): GoalkeeperCard {
  const rank = index % 3 === 0 ? '6' : index % 3 === 1 ? '8' : '10';

  return {
    id: `SIM_GK_${rank}_${index}`,
    kind: 'goalkeeper',
    rank
  };
}
