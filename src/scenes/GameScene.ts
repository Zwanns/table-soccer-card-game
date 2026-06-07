import Phaser from 'phaser';
import type { Card } from '../cards';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { GameEngine, type FieldPositionId, type GameEvent, type GameState, type Player } from '../game';
import { Button } from '../ui/Button';
import { CardView } from '../ui/CardView';
import { DeckView } from '../ui/DeckView';
import { FieldView, getFieldCardPosition } from '../ui/FieldView';
import { ScoreView } from '../ui/ScoreView';
import { TeamStatsView } from '../ui/TeamStatsView';
import type { TeamSelectionData } from './TeamSelectScene';

const FIELD_WIDTH = 1120;
const FIELD_TOP = 100;
const FIELD_CENTER_Y = 400;
const DECK_Y = 560;
const OUT_BUTTON_Y = 673;

interface RestoreAnimationEntry {
  playerId: Player['id'];
  positionId: FieldPositionId;
  card: Card;
}

interface RenderOptions {
  hiddenRestoredCards?: readonly RestoreAnimationEntry[];
  interactive?: boolean;
}

interface AttackAnimationContext {
  attackerId: Player['id'];
  defenderId: Player['id'];
  positionId: FieldPositionId;
  attackerCard: Card;
}

type AttackAnimationOutcome = 'defeat' | 'goal' | 'post' | 'save';

export class GameScene extends Phaser.Scene {
  private engine: GameEngine | null = null;
  private dynamicLayer: Phaser.GameObjects.Container | null = null;
  private message: Phaser.GameObjects.Container | null = null;
  private animatedRestoreCount = 0;
  private startWhistlePlayed = false;
  private player1Name = 'France';
  private player2Name = 'Spain';
  private player1FlagCode = 'fr';
  private player2FlagCode = 'es';

  public constructor() {
    super('GameScene');
  }

  public init(data: Partial<TeamSelectionData>): void {
    this.player1Name = data.player1Name ?? 'France';
    this.player2Name = data.player2Name ?? 'Spain';
    this.player1FlagCode = data.player1FlagCode ?? 'fr';
    this.player2FlagCode = data.player2FlagCode ?? 'es';
    this.animatedRestoreCount = 0;
    this.startWhistlePlayed = false;
  }

  public create(): void {
    this.engine = new GameEngine();
    this.engine.startNewGame({
      player1Name: this.player1Name,
      player2Name: this.player2Name,
      player1FlagCode: this.player1FlagCode,
      player2FlagCode: this.player2FlagCode
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
    this.dynamicLayer.add(
      new ScoreView(
        this,
        centerX,
        42,
        state.players[0].name,
        state.players[1].name,
        state.players[0].flagCode,
        state.players[1].flagCode,
        state.players[0].goals,
        state.players[1].goals
      )
    );
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
    this.dynamicLayer.add(createPlayerDeck(this, 115, DECK_Y, state, state.players[0], 'right', interactive, () => this.drawAttackCard()));
    this.dynamicLayer.add(
      createPlayerDeck(this, 1485, DECK_Y, state, state.players[1], 'left', interactive, () => this.drawAttackCard())
    );
    this.dynamicLayer.add(
      new Button(this, getDeckX(state), OUT_BUTTON_Y, 'OUT', () => this.declareOut(), {
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
      return;
    }

    if (interactive) {
      this.playStartWhistleIfReady(state);
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
    const animationContext = this.createAttackAnimationContext(positionId);
    let state: GameState;

    try {
      state = engine.selectTarget(positionId);
    } catch (error) {
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Недопустимая цель.');
      return;
    }

    if (animationContext !== null) {
      this.animateAttackSelection(state, animationContext, getAttackAnimationOutcome(state, positionId), () =>
        this.handleSelectedTargetState(state)
      );
      return;
    }

    this.handleSelectedTargetState(state);
  }

  private handleSelectedTargetState(state: GameState): void {
    if (state.phase === 'GAME_OVER') {
      this.openResult(state);
      return;
    }

    if (state.phase === 'ENDING_TURN') {
      const scoredGoal = state.log.slice(-4).some((event) => event.type === 'GOAL_SCORED');
      const goalkeeperSave = state.log.slice(-4).some((event) => event.type === 'GOALKEEPER_SAVE');

      if (scoredGoal) {
        this.render(state, { interactive: false });
        this.playSound('sound-goal', 0.72);
        this.showFlyingMessage('GOAL!!', 'goal', () => this.startTurn());
      } else if (goalkeeperSave) {
        this.render(state, { interactive: false });
        this.playSound('sound-goalkeeper-save', 0.72);
        this.showFlyingMessage('Goalkeeper!!', 'save', () => this.startTurn());
      } else {
        this.startTurn();
      }

      return;
    }

    const goalpostHit = state.log.at(-1)?.type === 'GOALPOST_HIT';
    this.render(state);

    if (goalpostHit) {
      this.playSound('sound-goalpost', 0.72);
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

  private showFlyingMessage(message: string, tone: 'goal' | 'out' | 'post' | 'save', onComplete?: () => void): void {
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
      duration: tone === 'goal' || tone === 'save' ? 1900 : 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        text.destroy();
        onComplete?.();
      }
    });
  }

  private createAttackAnimationContext(positionId: FieldPositionId): AttackAnimationContext | null {
    const state = this.requireEngine().getState();
    const attacker = state.players.find((player) => player.id === state.activePlayerId);
    const defender = state.players.find((player) => player.id !== state.activePlayerId);

    if (attacker === undefined || defender === undefined || state.attackCard === null) {
      return null;
    }

    if (defender.field[positionId] === null) {
      return null;
    }

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      positionId,
      attackerCard: { ...state.attackCard }
    };
  }

  private animateAttackSelection(
    state: Readonly<GameState>,
    context: AttackAnimationContext,
    outcome: AttackAnimationOutcome,
    onComplete: () => void
  ): void {
    this.input.enabled = false;

    const target = getFieldCardPosition(SCENE_WIDTH / 2, FIELD_CENTER_Y, state, context.defenderId, context.positionId);
    const startX = getPlayerDeckX(state, context.attackerId);
    const card = new CardView(this, startX, DECK_Y, { rank: context.attackerCard.rank, color: context.attackerCard.color });
    card.setScale(0.92);
    card.setRotation(context.attackerId === state.players[0].id ? -0.1 : 0.1);

    this.tweens.add({
      targets: card,
      x: target.x,
      y: target.y,
      scale: 1.04,
      rotation: 0,
      duration: 340,
      ease: 'Cubic.easeIn',
      onComplete: () => this.finishAttackAnimation(state, context, card, target, outcome, onComplete)
    });
  }

  private finishAttackAnimation(
    state: Readonly<GameState>,
    context: AttackAnimationContext,
    card: CardView,
    target: { x: number; y: number },
    outcome: AttackAnimationOutcome,
    onComplete: () => void
  ): void {
    this.showImpactPulse(target.x, target.y, outcome);

    if (outcome === 'post' || outcome === 'save') {
      const activeOnLeft = context.attackerId === state.players[0].id;
      const reboundX = target.x + (activeOnLeft ? -180 : 180);
      const reboundY = outcome === 'post' ? target.y - 145 : target.y + 84;

      this.tweens.add({
        targets: card,
        x: reboundX,
        y: reboundY,
        alpha: 0,
        rotation: activeOnLeft ? -0.7 : 0.7,
        duration: 260,
        ease: 'Cubic.easeOut',
        onComplete: () => this.finishAnimationObject(card, onComplete)
      });
      return;
    }

    this.tweens.add({
      targets: card,
      alpha: 0,
      scale: 1.12,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => this.finishAnimationObject(card, onComplete)
    });
  }

  private showImpactPulse(x: number, y: number, outcome: AttackAnimationOutcome): void {
    const color = outcome === 'save' ? 0xffffff : outcome === 'post' ? 0xf0c95a : 0x93f0b2;
    const pulse = this.add.circle(x, y, 20, color, 0.2);
    pulse.setStrokeStyle(4, color, 0.86);

    this.tweens.add({
      targets: pulse,
      scale: outcome === 'goal' ? 2.4 : 1.8,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => pulse.destroy()
    });
  }

  private finishAnimationObject(card: CardView, onComplete: () => void): void {
    card.destroy();
    this.input.enabled = true;
    onComplete();
  }

  private playStartWhistleIfReady(state: Readonly<GameState>): void {
    if (this.startWhistlePlayed || state.turnNumber !== 1) {
      return;
    }

    this.startWhistlePlayed = true;
    this.playSound('sound-whistle-start', 0.65);
  }

  private playSound(key: string, volume: number): void {
    this.sound.play(key, { volume });
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
    const card = new CardView(this, startX, DECK_Y, { rank: entry.card.rank, color: entry.card.color });
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
    attackCardColor: isActive ? state.attackCard?.color : undefined,
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

function getAttackAnimationOutcome(state: Readonly<GameState>, positionId: FieldPositionId): AttackAnimationOutcome {
  if (positionId !== 'goalkeeper') {
    return 'defeat';
  }

  const recentEvents = state.log.slice(-5);

  if (recentEvents.some((event) => event.type === 'GOALPOST_HIT')) {
    return 'post';
  }

  if (recentEvents.some((event) => event.type === 'GOALKEEPER_SAVE')) {
    return 'save';
  }

  if (recentEvents.some((event) => event.type === 'GOAL_SCORED')) {
    return 'goal';
  }

  return 'defeat';
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
