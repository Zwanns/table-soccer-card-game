import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PlayerControllerType } from '../ai';
import type { Card } from '../cards';
import { createDefaultSquad } from '../data/defaultSquads';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { createMatchTeamSetup, GameEngine, getFieldPlayerForCard, getStartingGoalkeeper } from '../game';
import { createSimulatedTournamentGameState } from '../scenes/tournamentMatchSimulation';
import type { TournamentMatch } from '../tournament';

describe('match team setup snapshot', () => {
  it('supports HUMAN and AI controller types', () => {
    const controllerTypes: PlayerControllerType[] = ['HUMAN', 'AI'];

    expect(controllerTypes).toEqual(['HUMAN', 'AI']);
  });

  it('creates a minimal static setup snapshot at match start', () => {
    const engine = new GameEngine();
    const state = engine.startNewGame({
      seed: 'snapshot',
      player1Name: 'France',
      player2Name: 'Spain',
      player1FlagCode: 'fr',
      player2FlagCode: 'es'
    });
    const setup = state.matchSetups.PLAYER_1;

    expect(setup.flagCode).toBe('fr');
    expect(setup.teamId).toBe('fr');
    expect(setup.controllerType).toBe('HUMAN');
    expect(setup).not.toHaveProperty('fieldKit');
    expect(setup).not.toHaveProperty('startingGoalkeeperId');
    expect(getFieldPlayerForCard(setup, card('Q'))).toMatchObject({
      name: 'Olise',
      shirtNumber: 14
    });
  });

  it('defaults match team setup controller type to HUMAN', () => {
    const setup = createMatchTeamSetup({
      teamId: 'fr',
      squad: createDefaultSquad('fr'),
      goalkeeperKitId: 'gk1'
    });

    expect(setup.controllerType).toBe('HUMAN');
  });

  it('can create match team setup with AI controller type', () => {
    const setup = createMatchTeamSetup({
      teamId: 'fr',
      squad: createDefaultSquad('fr'),
      goalkeeperKitId: 'gk1',
      controllerType: 'AI'
    });

    expect(setup.controllerType).toBe('AI');
  });

  it.each([
    ['HUMAN vs HUMAN', 'HUMAN', 'HUMAN'],
    ['HUMAN vs AI', 'HUMAN', 'AI'],
    ['AI vs HUMAN', 'AI', 'HUMAN'],
    ['AI vs AI', 'AI', 'AI']
  ] as const)('creates %s match controller setup', (_label, player1ControllerType, player2ControllerType) => {
    const state = new GameEngine().startNewGame({
      seed: `controller-${player1ControllerType}-${player2ControllerType}`,
      player1ControllerType,
      player2ControllerType
    });

    expect(state.matchSetups.PLAYER_1.controllerType).toBe(player1ControllerType);
    expect(state.matchSetups.PLAYER_2.controllerType).toBe(player2ControllerType);
  });

  it('keeps legacy quick match setup HUMAN vs HUMAN without explicit controller types', () => {
    const state = new GameEngine().startNewGame({
      seed: 'legacy-quick-match',
      player1Name: 'France',
      player2Name: 'Spain',
      player1FlagCode: 'fr',
      player2FlagCode: 'es'
    });

    expect(state.matchSetups.PLAYER_1.controllerType).toBe('HUMAN');
    expect(state.matchSetups.PLAYER_2.controllerType).toBe('HUMAN');
  });

  it('keeps tournament simulation setup HUMAN by default', () => {
    const match: TournamentMatch = {
      id: 'sim-controller-default',
      stage: 'group',
      roundIndex: 0,
      orderIndex: 0,
      groupId: 'A',
      homeTeamId: 'fr',
      awayTeamId: 'es',
      status: 'available'
    };
    const state = createSimulatedTournamentGameState({
      match,
      homeTeam: NATIONAL_TEAMS.find((team) => team.flagCode === 'fr') ?? NATIONAL_TEAMS[0],
      awayTeam: NATIONAL_TEAMS.find((team) => team.flagCode === 'es') ?? NATIONAL_TEAMS[1],
      tournamentSeed: 'sim-controller'
    });

    expect(state.matchSetups.PLAYER_1.controllerType).toBe('HUMAN');
    expect(state.matchSetups.PLAYER_2.controllerType).toBe('HUMAN');
  });

  it('uses one goalkeeper from the static squad', () => {
    const state = new GameEngine().startNewGame({
      seed: 'setup',
      player1FlagCode: 'fr',
      player2FlagCode: 'es'
    });
    const setup = state.matchSetups.PLAYER_1;

    expect(getStartingGoalkeeper(setup)).toEqual({
      id: 'gk',
      name: 'Maignan',
      shirtNumber: 1
    });
    expect(setup.squad).not.toHaveProperty('goalkeepers');
    expect(setup.squad).not.toHaveProperty('defaultStartingGoalkeeperId');
  });

  it('selects stable goalkeeper kits for the same seed', () => {
    const first = new GameEngine().startNewGame({ seed: 'same-seed' }).matchSetups;
    const second = new GameEngine().startNewGame({ seed: 'same-seed' }).matchSetups;

    expect(first.PLAYER_1.goalkeeperKitId).toBe(second.PLAYER_1.goalkeeperKitId);
    expect(first.PLAYER_2.goalkeeperKitId).toBe(second.PLAYER_2.goalkeeperKitId);
    expect(first.PLAYER_1.goalkeeperKitId).not.toBe(first.PLAYER_2.goalkeeperKitId);
  });

  it('gives team two the remaining goalkeeper kit from team one', () => {
    const state = new GameEngine().startNewGame({ seed: 'goalkeeper-kit-pair' });
    const playerOneKitId = state.matchSetups.PLAYER_1.goalkeeperKitId;
    const playerTwoKitId = state.matchSetups.PLAYER_2.goalkeeperKitId;

    expect(['gk1', 'gk2']).toContain(playerOneKitId);
    expect(['gk1', 'gk2']).toContain(playerTwoKitId);
    expect(playerTwoKitId).toBe(playerOneKitId === 'gk1' ? 'gk2' : 'gk1');
  });

  it('resolves a captured card through the team setup snapshot', () => {
    const franceSquad = createDefaultSquad('fr');
    franceSquad.fieldPlayers.Q.name = 'France Q';
    const spainSquad = createDefaultSquad('es');
    spainSquad.fieldPlayers.Q.name = 'Spain Q';
    const franceSetup = createMatchTeamSetup({
      teamId: 'fr',
      squad: franceSquad,
      goalkeeperKitId: 'gk1'
    });
    const spainSetup = createMatchTeamSetup({
      teamId: 'es',
      squad: spainSquad,
      goalkeeperKitId: 'gk2'
    });
    const capturedCard = card('Q');

    expect(getFieldPlayerForCard(franceSetup, capturedCard).name).toBe('France Q');
    expect(getFieldPlayerForCard(spainSetup, capturedCard).name).toBe('Spain Q');
  });

  it('keeps card rendering tied to matchSetups instead of localStorage reads', () => {
    const fieldViewSource = readSource('src/ui/FieldView.ts');
    const gameSceneSource = readSource('src/scenes/GameScene.ts');

    expect(fieldViewSource).toContain('state.matchSetups[player.id]');
    expect(gameSceneSource).toContain('state.matchSetups[player.id]');
    expect(fieldViewSource).not.toContain('getFieldCardPlayerProfile');
    expect(gameSceneSource).not.toContain('getFieldCardPlayerProfile');
    expect(fieldViewSource).toContain('setup.flagCode');
    expect(gameSceneSource).toContain('setup.flagCode');
  });
});

function card(rank: Card['rank']): Card {
  return {
    id: `MATCH_SETUP_${rank}`,
    rank,
    color: 'RED',
    suit: 'HEARTS'
  };
}

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}
