import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GoalkeeperDeck, type Card, type GoalkeeperCard } from '../cards';
import { createDefaultSquad } from '../data/defaultSquads';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  createEmptyField,
  createMatchTeamSetup,
  type GameState,
  type Player
} from '../game';
import { createSimulatedTournamentGameState } from '../scenes/tournamentMatchSimulation';
import {
  createTournamentMatchResultFromGameState,
  createTournamentState,
  submitTournamentMatchResultObject,
  type TournamentMatch
} from '../tournament';

describe('tournament hub scene integration', () => {
  it('registers tournament setup and hub scenes in Phaser config', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain('TournamentSetupScene');
    expect(mainSource).toContain('TournamentHubScene');
  });

  it('starts the tournament hub after setup creates a tournament', () => {
    const setupSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentSetupScene.ts'), 'utf8');

    expect(setupSource).toContain("this.registry.set('currentTournament'");
    expect(setupSource).toContain("this.scene.start('TournamentHubScene')");
  });

  it('passes tournament launch context through match and result scenes', () => {
    const hubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');
    const gameSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const resultSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');

    expect(hubSource).toContain("mode: 'tournament'");
    expect(hubSource).toContain('tournamentMatchId');
    expect(gameSource).toContain('launchContext');
    expect(resultSource).toContain('Вернуться в турнир');
    expect(resultSource).toContain('submitTournamentMatchResultObject');
  });
});

describe('tournament match result normalization', () => {
  it('creates a tournament match result from a finished game state', () => {
    const gameState = createFinishedGameState();
    const result = createTournamentMatchResultFromGameState('group-A-1', gameState, 'fr', 'es');

    expect(result).toMatchObject({
      matchId: 'group-A-1',
      homeTeamId: 'fr',
      awayTeamId: 'es',
      homeGoals: 1,
      awayGoals: 0,
      winnerTeamId: 'fr'
    });
    expect(result.teamStats.home.shots).toBe(2);
    expect(result.teamStats.away.shots).toBe(1);
  });

  it('submits a normalized group result once and updates standings inputs', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: ['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar'],
      seed: 'tournament-flow'
    });
    const result = createTournamentMatchResultFromGameState('group-A-1', createFinishedGameState(), 'fr', 'es');
    const updatedTournament = submitTournamentMatchResultObject(tournament, result);

    expect(updatedTournament.matches.find((match) => match.id === 'group-A-1')).toMatchObject({
      status: 'completed',
      result: expect.objectContaining({
        homeGoals: 1,
        awayGoals: 0
      })
    });
    expect(() => submitTournamentMatchResultObject(updatedTournament, result)).toThrow('twice');
  });

  it('creates a simulated playoff result with a winner while penalties are not implemented', () => {
    const match: TournamentMatch = {
      id: 'semi-final-1',
      stage: 'semi-final',
      roundIndex: 1,
      orderIndex: 0,
      homeTeamId: 'fr',
      awayTeamId: 'es',
      status: 'available'
    };
    const homeTeam = requireNationalTeam('fr');
    const awayTeam = requireNationalTeam('es');
    const gameState = createSimulatedTournamentGameState({
      match,
      homeTeam,
      awayTeam,
      tournamentSeed: 'simulate-playoff'
    });
    const result = createTournamentMatchResultFromGameState(match.id, gameState, 'fr', 'es');

    expect(gameState.isDraw).toBe(false);
    expect(result.winnerTeamId).toBeDefined();
  });
});

function requireNationalTeam(teamId: string) {
  const team = NATIONAL_TEAMS.find((candidate) => candidate.flagCode === teamId);

  if (team === undefined) {
    throw new Error(`Expected national team "${teamId}".`);
  }

  return team;
}

function createFinishedGameState(): GameState {
  const players: [Player, Player] = [
    createPlayer('PLAYER_1', 'France', 'fr', 1),
    createPlayer('PLAYER_2', 'Spain', 'es', 0)
  ];

  return {
    players,
    matchSetups: {
      PLAYER_1: createMatchTeamSetup({
        teamId: 'fr',
        squad: createDefaultSquad('fr'),
        goalkeeperKitId: 'gk-1'
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: 'es',
        squad: createDefaultSquad('es'),
        goalkeeperKitId: 'gk-2'
      })
    },
    activePlayerId: null,
    phase: 'GAME_OVER',
    attackCard: null,
    attackBank: [],
    legalTargetPositionIds: [],
    winnerId: 'PLAYER_1',
    isDraw: false,
    turnNumber: 6,
    log: [
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
      {
        type: 'GOAL_SCORED',
        playerId: 'PLAYER_1',
        turnNumber: 2,
        scorer: {
          playerName: 'Игрок A',
          shirtNumber: 17,
          rank: 'A',
          teamId: 'fr'
        }
      },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_2', attackerCard: card('K'), goalkeeperCard: goalkeeperCard('8') },
      { type: 'GOALKEEPER_SAVE', playerId: 'PLAYER_2', attackerCard: card('K'), goalkeeperCard: goalkeeperCard('8') },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
      { type: 'GOALPOST_HIT', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
      { type: 'GAME_OVER', winnerId: 'PLAYER_1' }
    ]
  };
}

function createPlayer(id: Player['id'], name: string, flagCode: string, goals: number): Player {
  return {
    id,
    name,
    flagCode,
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals,
    deck: { cards: [] },
    goalkeeperDeck: new GoalkeeperDeck([goalkeeperCard('3')]),
    field: createEmptyField()
  };
}

function card(rank: Card['rank']): Card {
  return {
    id: `FLOW_${rank}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

function goalkeeperCard(rank: GoalkeeperCard['rank']): GoalkeeperCard {
  return {
    kind: 'goalkeeper',
    rank
  };
}
