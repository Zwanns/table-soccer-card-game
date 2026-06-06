import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { GameEngine, type FieldPositionId, type GameEvent, type GameState, type Player } from '../game';
import { Button } from '../ui/Button';
import { DeckView } from '../ui/DeckView';
import { EventLogView } from '../ui/EventLogView';
import { FieldView } from '../ui/FieldView';
import { ScoreView } from '../ui/ScoreView';
import { TeamStatsView } from '../ui/TeamStatsView';

const FIELD_WIDTH = 1120;
const FIELD_TOP = 100;
const FIELD_CENTER_Y = 400;

export class GameScene extends Phaser.Scene {
  private engine: GameEngine | null = null;
  private dynamicLayer: Phaser.GameObjects.Container | null = null;
  private overlay: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('GameScene');
  }

  public create(): void {
    this.engine = new GameEngine();
    this.engine.startNewGame({
      player1Name: 'Игрок 1',
      player2Name: 'Игрок 2'
    });
    this.startTurn();
  }

  private startTurn(): void {
    const engine = this.requireEngine();
    const state = engine.startNextTurn();

    if (state.phase === 'GAME_OVER') {
      this.openResult(state);
      return;
    }

    this.render(state);
  }

  private render(state: Readonly<GameState>): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;

    this.dynamicLayer?.destroy();
    this.overlay?.destroy();
    this.dynamicLayer = this.add.container(0, 0);

    this.dynamicLayer.add(this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a));
    this.dynamicLayer.add(new Button(this, centerX - FIELD_WIDTH / 2 + 110, 42, 'В меню', () => this.scene.start('MenuScene')));
    this.dynamicLayer.add(new ScoreView(this, centerX, 42, state.players[0].goals, state.players[1].goals));
    this.dynamicLayer.add(
      new Button(this, centerX + FIELD_WIDTH / 2 - 110, 42, 'Результат', () => this.openResult(state))
    );
    this.dynamicLayer.add(new TeamStatsView(this, 115, FIELD_TOP + 63, {
      align: 'left',
      shots: getShotsForPlayer(state.log, state.players[0].id),
      scorers: getGoalScorers(state.log, state.players, state.players[0].id)
    }));
    this.dynamicLayer.add(new TeamStatsView(this, 1485, FIELD_TOP + 63, {
      align: 'right',
      shots: getShotsForPlayer(state.log, state.players[1].id),
      scorers: getGoalScorers(state.log, state.players, state.players[1].id)
    }));
    this.dynamicLayer.add(new EventLogView(this, 115, 360, state.log, state.players));
    this.dynamicLayer.add(createPlayerDeck(this, 115, 560, state, state.players[0]));
    this.dynamicLayer.add(createPlayerDeck(this, 1485, 560, state, state.players[1]));
    this.dynamicLayer.add(new FieldView(this, centerX, FIELD_CENTER_Y, state, (positionId) => this.selectTarget(positionId)));

    if (state.phase === 'ENDING_TURN') {
      this.showPassOverlay(state);
    }
  }

  private selectTarget(positionId: FieldPositionId): void {
    const engine = this.requireEngine();
    const state = engine.selectTarget(positionId);

    if (state.phase === 'GAME_OVER') {
      this.openResult(state);
      return;
    }

    this.render(state);
  }

  private showPassOverlay(state: Readonly<GameState>): void {
    const nextPlayer = state.players.find((player) => player.id === state.activePlayerId);
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;

    this.overlay?.destroy();
    this.overlay = this.add.container(0, 0);
    this.overlay.add(this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x0b1712, 0.92));
    this.overlay.add(
      this.add
        .text(centerX, centerY - 70, 'Ход завершен', {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '42px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.overlay.add(
      this.add
        .text(centerX, centerY - 18, `Передайте устройство: ${nextPlayer?.name ?? 'следующий игрок'}`, {
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px'
        })
        .setOrigin(0.5)
    );
    this.overlay.add(new Button(this, centerX, centerY + 70, 'Продолжить', () => this.startTurn()));
  }

  private openResult(state: Readonly<GameState>): void {
    this.scene.start('ResultScene', { state });
  }

  private requireEngine(): GameEngine {
    if (this.engine === null) {
      throw new Error('Game engine is not initialized.');
    }

    return this.engine;
  }
}

function createPlayerDeck(scene: Phaser.Scene, x: number, y: number, state: Readonly<GameState>, player: Player): DeckView {
  const isActive = state.activePlayerId === player.id;

  return new DeckView(scene, x, y, player.deck.cards.length, {
    active: isActive,
    attackCardRank: isActive ? state.attackCard?.rank : undefined
  });
}

function getShotsForPlayer(events: readonly GameEvent[], playerId: Player['id']): number {
  return events.filter((event) => event.type === 'ATTACK_CARD_DRAWN' && event.playerId === playerId).length;
}

function getGoalScorers(events: readonly GameEvent[], players: readonly Player[], playerId: Player['id']): string[] {
  const player = players.find((item) => item.id === playerId);

  return events
    .filter((event) => event.type === 'GOAL_SCORED' && event.playerId === playerId)
    .map(() => player?.name ?? playerId);
}
