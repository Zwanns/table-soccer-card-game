import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Card } from '../cards';
import { createDefaultSquad } from '../data/defaultSquads';
import { saveSquad } from '../services/squadStorage';
import {
  createMatchTeamSetup,
  GameEngine,
  getFieldPlayerForCard,
  getStartingGoalkeeper
} from '../game';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const originalLocalStorage = globalThis.localStorage;

describe('match team setup snapshot', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('creates a setup snapshot once at match start from saved squads', () => {
    const savedSquad = createDefaultSquad('fr');
    savedSquad.fieldPlayers.Q.name = 'Snapshot Q';
    savedSquad.fieldPlayers.Q.shirtNumber = 77;
    saveSquad(savedSquad);

    const engine = new GameEngine();
    const state = engine.startNewGame({
      seed: 'snapshot',
      player1Name: 'France',
      player2Name: 'Spain',
      player1FlagCode: 'fr',
      player2FlagCode: 'es'
    });
    const setup = state.matchSetups.PLAYER_1;

    expect(setup.teamId).toBe('fr');
    expect(getFieldPlayerForCard(setup, card('Q'))).toMatchObject({
      name: 'Snapshot Q',
      shirtNumber: 77
    });

    const changedSquad = createDefaultSquad('fr');
    changedSquad.fieldPlayers.Q.name = 'Changed after start';
    changedSquad.fieldPlayers.Q.shirtNumber = 88;
    saveSquad(changedSquad);

    expect(getFieldPlayerForCard(engine.getState().matchSetups.PLAYER_1, card('Q'))).toMatchObject({
      name: 'Snapshot Q',
      shirtNumber: 77
    });
  });

  it('uses home field kit and the saved default starting goalkeeper', () => {
    const squad = createDefaultSquad('fr');
    squad.defaultStartingGoalkeeperId = squad.goalkeepers[1].id;
    saveSquad(squad);

    const state = new GameEngine().startNewGame({
      seed: 'setup',
      player1FlagCode: 'fr',
      player2FlagCode: 'es'
    });
    const setup = state.matchSetups.PLAYER_1;

    expect(setup.fieldKit).toBe('home');
    expect(setup.startingGoalkeeperId).toBe(squad.goalkeepers[1].id);
    expect(getStartingGoalkeeper(setup)).toEqual(squad.goalkeepers[1]);
  });

  it('selects stable goalkeeper kits for the same seed', () => {
    const first = new GameEngine().startNewGame({ seed: 'same-seed' }).matchSetups;
    const second = new GameEngine().startNewGame({ seed: 'same-seed' }).matchSetups;

    expect(first.PLAYER_1.goalkeeperKitId).toBe(second.PLAYER_1.goalkeeperKitId);
    expect(first.PLAYER_2.goalkeeperKitId).toBe(second.PLAYER_2.goalkeeperKitId);
  });

  it('resolves a captured card through the new team setup', () => {
    const franceSquad = createDefaultSquad('fr');
    franceSquad.fieldPlayers.Q.name = 'France Q';
    const spainSquad = createDefaultSquad('es');
    spainSquad.fieldPlayers.Q.name = 'Spain Q';
    const franceSetup = createMatchTeamSetup({
      teamId: 'fr',
      squad: franceSquad,
      goalkeeperKitId: 'gk-1'
    });
    const spainSetup = createMatchTeamSetup({
      teamId: 'es',
      squad: spainSquad,
      goalkeeperKitId: 'gk-2'
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
