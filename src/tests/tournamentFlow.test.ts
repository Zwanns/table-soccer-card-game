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
    expect(mainSource).toContain('TournamentPenaltyScene');
    expect(mainSource).toContain('TournamentCompleteScene');
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
    expect(resultSource).toContain('Back to tournament');
    expect(resultSource).toContain('submitTournamentMatchResultObject');
    expect(resultSource).toContain("this.scene.start('TournamentCompleteScene')");
  });

  it('passes tournament participant controller types to visual matches without replacing simulations', () => {
    const hubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');
    const simulationSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'tournamentMatchSimulation.ts'), 'utf8');

    expect(hubSource).toContain('getTournamentTeamControllerType');
    expect(hubSource).toContain('player1ControllerType: getTournamentTeamControllerType(tournament, homeTeam.flagCode)');
    expect(hubSource).toContain('player2ControllerType: getTournamentTeamControllerType(tournament, awayTeam.flagCode)');
    expect(hubSource).toContain('createAiMarker');
    expect(hubSource).toContain('createSimulatedTournamentGameState');
    expect(simulationSource).not.toContain('AiTurnController');
    expect(simulationSource).not.toContain('chooseAiAction');
  });

  it('stores participant controller types in tournament state while preserving team ids', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: ['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar'],
      participants: [
        { flagCode: 'fr', controllerType: 'AI' },
        { flagCode: 'es', controllerType: 'HUMAN' }
      ],
      seed: 'tournament-ai-participants'
    });

    expect(tournament.teamIds).toEqual(['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar']);
    expect(tournament.participants.find((participant) => participant.flagCode === 'fr')?.controllerType).toBe('AI');
    expect(tournament.participants.find((participant) => participant.flagCode === 'pl')?.controllerType).toBe('HUMAN');
  });

  it('routes drawn playoff matches through the tournament penalty scene', () => {
    const resultSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');
    const penaltySource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');

    expect(resultSource).toContain("this.scene.start('TournamentPenaltyScene'");
    expect(resultSource).toContain('Penalty shootout');
    expect(resultSource).toContain('needsPenaltyShootout');
    expect(penaltySource).toContain('createPenaltyShootoutState');
    expect(penaltySource).toContain('submitTournamentMatchResultObject');
    expect(penaltySource).not.toContain('formatKickSummary');
    expect(penaltySource).not.toContain('createLastKickCards');
    expect(penaltySource).not.toContain('createShootoutSummary');
    expect(penaltySource).toContain('createMatchStatsPanel');
    expect(penaltySource).toContain('Match stats');
    expect(penaltySource).toContain('MATCH_STATS_VIEWPORT');
    expect(penaltySource).toContain("scrollZone.on('wheel'");
    expect(penaltySource).toContain('tooltipEnabled: false');
    expect(penaltySource).not.toContain('getPenaltyExtraSymbol');
  });

  it('renders penalty shootouts on the match-style field layout', () => {
    const penaltySource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');
    const bootSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');
    const scoreSource = readFileSync(join(process.cwd(), 'src', 'ui', 'ScoreView.ts'), 'utf8');
    const teamSelectSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TeamSelectScene.ts'), 'utf8');

    expect(penaltySource).toContain('new ScoreView');
    expect(scoreSource).toContain('penaltyScore');
    expect(scoreSource).toContain('`PEN ${options.penaltyScore.playerOne}:${options.penaltyScore.playerTwo}`');
    expect(penaltySource).toContain('penaltyScore: {');
    expect(penaltySource).toContain('new AdvantageView');
    expect(bootSource).toContain("document.fonts.load('64px DS-Digital')");
    expect(bootSource).toContain("document.fonts.load('400 42px Anton')");
    expect(bootSource).toContain("document.fonts.load('600 18px Oswald')");
    expect(bootSource).toContain('document.fonts.ready');
    expect(penaltySource).toContain('createPenaltyField');
    expect(penaltySource).toContain('createMenuButton');
    expect(penaltySource).toContain("new Button(this, 120, 34, 'Menu'");
    expect(penaltySource).toContain("this.scene.start('MenuScene')");
    expect(penaltySource).toContain('const PENALTY_FIELD_CENTER_Y = 400');
    expect(penaltySource).toContain('const PENALTY_GOALKEEPER_HOME_X = -490');
    expect(penaltySource).toContain('const PENALTY_GOALKEEPER_AWAY_X = 490');
    expect(penaltySource).toContain('queueTeamCoverLoad(this, this.matchResult.homeTeamId)');
    expect(penaltySource).toContain('queueTeamCoverLoad(this, this.matchResult.awayTeamId)');
    expect(bootSource).toContain('AVAILABLE_TEAM_COVER_FLAG_CODES');
    expect(bootSource).toContain('getTeamCoverTextureKey(flagCode)');
    expect(bootSource).toContain('getTeamCoverPath(flagCode)');
    expect(teamSelectSource).toContain("mode?: 'match' | 'penalty'");
    expect(teamSelectSource).toContain("'Penalty teams'");
    expect(teamSelectSource).toContain("'Start penalties'");
    expect(teamSelectSource).toContain("this.scene.start('TournamentPenaltyScene'");
    expect(teamSelectSource).toContain('createStandalonePenaltyMatchResult(data)');
    expect(penaltySource).toContain('coverTextureKey: this.getCoverTextureKey(teamId)');
    expect(penaltySource).toContain('createPenaltyCardColumns');
    expect(penaltySource).toContain("this.createPenaltyCardColumn(field, shootoutState, 'home', getPenaltyAttackColumnX(shootoutState, 'home'))");
    expect(penaltySource).toContain("this.createPenaltyCardColumn(field, shootoutState, 'away', getPenaltyAttackColumnX(shootoutState, 'away'))");
    expect(penaltySource).toContain('return targetX < 0 ? -PENALTY_ATTACK_COLUMN_X : PENALTY_ATTACK_COLUMN_X');
    expect(penaltySource).toContain('const PENALTY_ATTACK_CARD_ROTATION = Math.PI / 2');
    expect(penaltySource).toContain('card.setRotation(isRevealed ? 0 : PENALTY_ATTACK_CARD_ROTATION)');
    expect(penaltySource).toContain('.setPadding(24, 18, 24, 20)');
    expect(penaltySource).toContain('const SHOOTOUT_MARKER_Y = 148');
    expect(penaltySource).toContain('this.createShootoutMarkers(this.shootoutState)');
    expect(penaltySource).toContain('PENALTY_SELECTED_CARD_SCALE');
    expect(penaltySource).toContain('const PENALTY_CARD_SCALE = 0.78');
    expect(penaltySource).toContain('const PENALTY_SELECTED_CARD_SCALE = 0.9');
    expect(penaltySource).toContain('const PENALTY_ATTACK_CARD_GAP = 60');
    expect(penaltySource).toContain('markings.strokeRect');
    expect(penaltySource).not.toContain('createPenaltyGoalFrame');
  });

  it('provides a tournament completion scene with champion summary and stats navigation', () => {
    const completeSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentCompleteScene.ts'), 'utf8');
    const hubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');

    expect(completeSource).toContain("super('TournamentCompleteScene')");
    expect(completeSource).toContain('Champion:');
    expect(completeSource).toContain('Champion path');
    expect(completeSource).toContain('Tournament leaders');
    expect(completeSource).toContain('Top scorer');
    expect(completeSource).toContain('Top assist');
    expect(completeSource).toContain('Top goalkeeper');
    expect(completeSource).toContain('View stats');
    expect(completeSource).toContain("initialTab: 'stats'");
    expect(completeSource).toContain('New tournament');
    expect(hubSource).toContain('initialTab?: TournamentHubTab');
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
    expect(result.playerStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamId: 'fr',
          playerId: 'field:A',
          goals: 1
        }),
        expect.objectContaining({
          teamId: 'fr',
          playerId: 'field:Q',
          assists: 1
        }),
        expect.objectContaining({
          teamId: 'fr',
          playerId: 'goalkeeper:gk',
          goalkeeperSaves: 1
        })
      ])
    );
  });

  it('does not carry assist candidates through posts or saves', () => {
    const afterPost = createTournamentMatchResultFromGameState('group-A-1', createPostBeforeGoalGameState(), 'fr', 'es');
    const afterSave = createTournamentMatchResultFromGameState('group-A-1', createSaveBeforeGoalGameState(), 'fr', 'es');

    expect(afterPost.playerStats.find((stats) => stats.playerId === 'field:Q')?.assists ?? 0).toBe(0);
    expect(afterSave.playerStats.find((stats) => stats.playerId === 'field:Q')?.assists ?? 0).toBe(0);
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

  it('uses English tournament hub labels and flag rows in the playoff bracket', () => {
    const hubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');

    expect(hubSource).toContain("matches: 'Matches'");
    expect(hubSource).toContain("tables: 'Group Stage'");
    expect(hubSource).toContain("bracket: 'Playoff'");
    expect(hubSource).toContain("'round-of-16': 'Round of 16'");
    expect(hubSource).toContain("'semi-final': 'Semi-final'");
    expect(hubSource).toContain("final: 'Final'");
    expect(hubSource).toContain('addBracketTeamRow');
    expect(hubSource).toContain('getFlagAssetKey(team.flagCode)');
    expect(hubSource).toContain('BRACKET_CENTER_Y');
    expect(hubSource).toContain('getBracketColumnGap');
    expect(hubSource).toContain('getBracketRoundCenters');
    expect(hubSource).toContain('drawBracketConnectors');
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
        goalkeeperKitId: 'gk1'
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: 'es',
        squad: createDefaultSquad('es'),
        goalkeeperKitId: 'gk2'
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
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 2,
        positionId: 'defender-1',
        attackerCard: card('Q'),
        defenderCard: card('2')
      },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
      {
        type: 'GOAL_SCORED',
        playerId: 'PLAYER_1',
        turnNumber: 2,
        scorer: {
          playerName: 'Mbappe',
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

function createPostBeforeGoalGameState(): GameState {
  return createGameStateWithLog([
    {
      type: 'CARD_DEFEATED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      positionId: 'defender-1',
      attackerCard: card('Q'),
      defenderCard: card('2')
    },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
    { type: 'GOALPOST_HIT', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
    {
      type: 'GOAL_SCORED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      scorer: {
        playerName: 'Mbappe',
        shirtNumber: 17,
        rank: 'A',
        teamId: 'fr'
      }
    },
    { type: 'GAME_OVER', winnerId: 'PLAYER_1' }
  ]);
}

function createSaveBeforeGoalGameState(): GameState {
  return createGameStateWithLog([
    {
      type: 'CARD_DEFEATED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      positionId: 'defender-1',
      attackerCard: card('Q'),
      defenderCard: card('2')
    },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('5'), goalkeeperCard: goalkeeperCard('8') },
    { type: 'GOALKEEPER_SAVE', playerId: 'PLAYER_1', attackerCard: card('5'), goalkeeperCard: goalkeeperCard('8') },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
    {
      type: 'GOAL_SCORED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      scorer: {
        playerName: 'Mbappe',
        shirtNumber: 17,
        rank: 'A',
        teamId: 'fr'
      }
    },
    { type: 'GAME_OVER', winnerId: 'PLAYER_1' }
  ]);
}

function createGameStateWithLog(log: GameState['log']): GameState {
  const state = createFinishedGameState();

  return {
    ...state,
    log
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
    id: `TOURNAMENT_GK_${rank}`,
    kind: 'goalkeeper',
    rank
  };
}
