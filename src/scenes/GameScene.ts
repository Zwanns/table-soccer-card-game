import Phaser from 'phaser';
import type { Card } from '../cards';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { GameEngine, type FieldPositionId, type GameEvent, type GameState, type Player } from '../game';
import { Button } from '../ui/Button';
import { CardView } from '../ui/CardView';
import { DeckView } from '../ui/DeckView';
import { EventLogView } from '../ui/EventLogView';
import { FieldView, getFieldCardPosition } from '../ui/FieldView';
import { ScoreView } from '../ui/ScoreView';
import { TeamStatsView } from '../ui/TeamStatsView';

const FIELD_WIDTH = 1120;
const FIELD_TOP = 100;
const FIELD_CENTER_Y = 400;
const DECK_Y = 560;

interface RestoreAnimationEntry {
  playerId: Player['id'];
  positionId: FieldPositionId;
  card: Card;
}

interface RenderOptions {
  hiddenRestoredCards?: readonly RestoreAnimationEntry[];
  interactive?: boolean;
}

export class GameScene extends Phaser.Scene {
  private engine: GameEngine | null = null;
  private dynamicLayer: Phaser.GameObjects.Container | null = null;
  private message: Phaser.GameObjects.Container | null = null;
  private animatedRestoreCount = 0;

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

    if (state.phase === 'ENDING_TURN') {
      const missedAttack = state.log.slice(-3).some((event) => event.type === 'ATTACK_MISSED');
      this.startTurn();

      if (missedAttack) {
        this.showFlyingMessage('Мяч потерян...', 'out');
      }

      return;
    }

    this.render(state);
  }

  private render(state: Readonly<GameState>, options: RenderOptions = {}): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const interactive = options.interactive !== false;

    this.dynamicLayer?.destroy();
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
    this.dynamicLayer.add(createPlayerDeck(this, 115, DECK_Y, state, state.players[0], 'right', interactive, () => this.drawAttackCard()));
    this.dynamicLayer.add(
      createPlayerDeck(this, 1485, DECK_Y, state, state.players[1], 'left', interactive, () => this.drawAttackCard())
    );
    this.dynamicLayer.add(
      new Button(this, getDeckX(state), 686, 'OUT', () => this.declareOut(), {
        disabled: !interactive || state.phase !== 'WAITING_FOR_TARGET' || isGoalkeeperTargetLine(state.legalTargetPositionIds)
      })
    );
    this.dynamicLayer.add(
      new FieldView(this, centerX, FIELD_CENTER_Y, state, (positionId) => this.selectTarget(positionId), {
        hiddenCards: options.hiddenRestoredCards,
        interactive
      })
    );

    const pendingRestores = getRestoreAnimationEntries(state.log).slice(this.animatedRestoreCount);

    if (interactive && pendingRestores.length > 0) {
      this.render(state, {
        hiddenRestoredCards: pendingRestores,
        interactive: false
      });
      this.animateRestoredCards(state, pendingRestores);
    }
  }

  private drawAttackCard(): void {
    const engine = this.requireEngine();
    const state = engine.drawAttackCard();

    if (state.phase === 'GAME_OVER') {
      this.openResult(state);
      return;
    }

    this.render(state);
  }

  private selectTarget(positionId: FieldPositionId): void {
    const engine = this.requireEngine();
    let state: GameState;

    try {
      state = engine.selectTarget(positionId);
    } catch (error) {
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Недопустимая цель.');
      return;
    }

    if (state.phase === 'GAME_OVER') {
      this.openResult(state);
      return;
    }

    if (state.phase === 'ENDING_TURN') {
      const scoredGoal = state.log.slice(-4).some((event) => event.type === 'GOAL_SCORED');
      const goalkeeperSave = state.log.slice(-4).some((event) => event.type === 'GOALKEEPER_SAVE');
      this.startTurn();

      if (scoredGoal) {
        this.showFlyingMessage('GOAL!!', 'goal');
      } else if (goalkeeperSave) {
        this.showFlyingMessage('Голкипер!!', 'save');
      }

      return;
    }

    const goalpostHit = state.log.at(-1)?.type === 'GOALPOST_HIT';
    this.render(state);

    if (goalpostHit) {
      this.showFlyingMessage('Штанга!', 'post');
    }
  }

  private declareOut(): void {
    const engine = this.requireEngine();
    engine.declareOut();
    this.startTurn();
    this.showFlyingMessage('Мяч потерян...', 'out');
  }

  private showTemporaryMessage(message: string): void {
    const centerX = SCENE_WIDTH / 2;

    this.message?.destroy();
    this.message = this.add.container(centerX, 112);

    const background = this.add.rectangle(0, 0, 640, 46, 0x2d1f1f, 0.94);
    background.setStrokeStyle(2, 0xf0c95a);
    const text = this.add
      .text(0, 0, message, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        wordWrap: { width: 600 }
      })
      .setOrigin(0.5);

    this.message.add([background, text]);
    this.time.delayedCall(1600, () => {
      this.message?.destroy();
      this.message = null;
    });
  }

  private showFlyingMessage(message: string, tone: 'goal' | 'out' | 'post' | 'save'): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const fontSize = tone === 'goal' ? '76px' : tone === 'post' || tone === 'save' ? '48px' : '38px';
    const color = tone === 'goal' || tone === 'post' ? '#f0c95a' : '#ffffff';

    const text = this.add
      .text(centerX, centerY - 40, message, {
        color,
        fontFamily: 'Arial, sans-serif',
        fontSize,
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 82,
      alpha: 0,
      duration: tone === 'goal' ? 1200 : 900,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private animateRestoredCards(
    state: Readonly<GameState>,
    entries: readonly RestoreAnimationEntry[],
    index = 0
  ): void {
    const entry = entries[index];

    if (entry === undefined) {
      this.render(state);
      return;
    }

    const target = getFieldCardPosition(SCENE_WIDTH / 2, FIELD_CENTER_Y, state, entry.playerId, entry.positionId);
    const startX = getPlayerDeckX(state, entry.playerId);
    const card = new CardView(this, startX, DECK_Y, { rank: entry.card.rank });
    card.setScale(0.92);
    card.setAlpha(0.92);
    card.setRotation(entry.playerId === state.players[0].id ? -0.12 : 0.12);

    this.tweens.add({
      targets: card,
      x: target.x,
      y: target.y,
      scale: 1,
      alpha: 1,
      rotation: 0,
      duration: 420,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        card.destroy();
        this.animatedRestoreCount += 1;

        const hiddenRestoredCards = entries.slice(index + 1);

        if (hiddenRestoredCards.length > 0) {
          this.render(state, {
            hiddenRestoredCards,
            interactive: false
          });
          this.time.delayedCall(45, () => this.animateRestoredCards(state, entries, index + 1));
          return;
        }

        this.render(state);
      }
    });
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

function createPlayerDeck(
  scene: Phaser.Scene,
  x: number,
  y: number,
  state: Readonly<GameState>,
  player: Player,
  countSide: 'left' | 'right',
  interactive: boolean,
  onDeckClick: () => void
): DeckView {
  const isActive = state.activePlayerId === player.id;

  return new DeckView(scene, x, y, player.deck.cards.length, {
    active: isActive,
    attackCardRank: isActive ? state.attackCard?.rank : undefined,
    countSide,
    onClick: interactive && isActive && state.phase === 'WAITING_FOR_ATTACK_CARD' ? onDeckClick : undefined
  });
}

function getDeckX(state: Readonly<GameState>): number {
  return state.activePlayerId === state.players[0].id ? 115 : 1485;
}

function getPlayerDeckX(state: Readonly<GameState>, playerId: Player['id']): number {
  return playerId === state.players[0].id ? 115 : 1485;
}

function getRestoreAnimationEntries(events: readonly GameEvent[]): RestoreAnimationEntry[] {
  return events.flatMap((event) =>
    event.type === 'FIELD_CARD_RESTORED'
      ? [
          {
            playerId: event.playerId,
            positionId: event.positionId,
            card: event.card
          }
        ]
      : []
  );
}

function isGoalkeeperTargetLine(positionIds: readonly string[]): boolean {
  return positionIds.length === 1 && positionIds[0] === 'goalkeeper';
}

function getShotsForPlayer(events: readonly GameEvent[], playerId: Player['id']): number {
  return events.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === playerId).length;
}

function getGoalScorers(events: readonly GameEvent[], players: readonly Player[], playerId: Player['id']): string[] {
  const player = players.find((item) => item.id === playerId);

  return events
    .filter((event) => event.type === 'GOAL_SCORED' && event.playerId === playerId)
    .map(() => player?.name ?? playerId);
}
