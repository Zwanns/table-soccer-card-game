import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Card } from '../cards';
import { createDefaultSquad } from '../data/defaultSquads';
import { createMatchTeamSetup, GameEngine, getFieldPlayerForCard, getStartingGoalkeeper } from '../game';

describe('match team setup snapshot', () => {
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
    expect(setup).not.toHaveProperty('fieldKit');
    expect(setup).not.toHaveProperty('startingGoalkeeperId');
    expect(getFieldPlayerForCard(setup, card('Q'))).toMatchObject({
      name: 'Olise',
      shirtNumber: 14
    });
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
