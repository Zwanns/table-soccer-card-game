import Phaser from 'phaser';
import {
  getFallbackCoverTextureKey,
  markTeamCoverLoadFailed,
  queueTeamCoverLoad,
  resolveTeamCoverLoadResult
} from '../assets/teamCover';
import type { Card } from '../cards';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { QUICK_MATCH_CONTEXT, type MatchLaunchContext } from '../tournament';
import {
  GameEngine,
  getFieldPlayerForCard,
  getMatchStats,
  getStartingGoalkeeper,
  getTeamAdvantage,
  type FieldCard,
  type FieldPositionId,
  type GameEvent,
  type GameState,
  type GoalScorerStat,
  type Player
} from '../game';
import type { GoalkeeperCard } from '../cards';
import { getGoalkeeperKitAssetKey, getTeamKitAssetKey } from '../data/teamKits';
import { AdvantageView } from '../ui/AdvantageView';
import { Button } from '../ui/Button';
import { createCardPlayerProfile, createGoalkeeperCardProfile, type CardPlayerProfile } from '../ui/cardPlayerProfile';
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

interface RestoreAnimationEntry {
  playerId: Player['id'];
  positionId: FieldPositionId;
  card: FieldCard;
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
  attackerKitTextureKey?: string;
  attackerProfile?: CardPlayerProfile;
}

type AttackAnimationOutcome = 'defeat' | 'miss' | 'goal' | 'post' | 'save';

export class GameScene extends Phaser.Scene {
  private engine: GameEngine | null = null;
  private dynamicLayer: Phaser.GameObjects.Container | null = null;
  private message: Phaser.GameObjects.Container | null = null;
  private exitConfirmModal: Phaser.GameObjects.Container | null = null;
  private animatedRestoreCount = 0;
  private startWhistlePlayed = false;
  private player1Name = 'France';
  private player2Name = 'Spain';
  private player1FlagCode = 'fr';
  private player2FlagCode = 'es';
  private player1CoverTextureKey = getFallbackCoverTextureKey();
  private player2CoverTextureKey = getFallbackCoverTextureKey();
  private launchContext: MatchLaunchContext = QUICK_MATCH_CONTEXT;

  public constructor() {
    super('GameScene');
  }

  public init(data: Partial<TeamSelectionData> & { launchContext?: MatchLaunchContext }): void {
    this.player1Name = data.player1Name ?? 'France';
    this.player2Name = data.player2Name ?? 'Spain';
    this.player1FlagCode = data.player1FlagCode ?? 'fr';
    this.player2FlagCode = data.player2FlagCode ?? 'es';
    this.launchContext = data.launchContext ?? QUICK_MATCH_CONTEXT;
    this.player1CoverTextureKey = getFallbackCoverTextureKey();
    this.player2CoverTextureKey = getFallbackCoverTextureKey();
    this.animatedRestoreCount = 0;
    this.startWhistlePlayed = false;
    this.exitConfirmModal?.destroy();
    this.exitConfirmModal = null;
  }

  public preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    queueTeamCoverLoad(this, this.player1FlagCode);
    queueTeamCoverLoad(this, this.player2FlagCode);
  }

  public create(): void {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    this.player1CoverTextureKey = this.resolvePlayerCoverTextureKey(this.player1Name, this.player1FlagCode);
    this.player2CoverTextureKey = this.resolvePlayerCoverTextureKey(this.player2Name, this.player2FlagCode);
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
        this.showFlyingMessage('Turnover...', 'out');
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
    this.dynamicLayer.add(
      new Button(this, 120, 34, 'Menu', () => this.openExitConfirmModal(), {
        fontSize: '20px',
        height: 46,
        width: 180
      })
    );
    this.dynamicLayer.add(
      new Button(this, 120, 90, 'Result', () => this.openResult(state), {
        fontSize: '20px',
        height: 46,
        width: 180
      })
    );
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
        state.players[1].goals,
        getShotsForPlayer(state.log, state.players[0].id),
        getShotsForPlayer(state.log, state.players[1].id)
      )
    );
    this.dynamicLayer.add(
      createPlayerDeck(
        this,
        115,
        DECK_Y,
        state,
        state.players[0],
        'right',
        this.player1CoverTextureKey,
        interactive,
        () => this.drawAttackCard()
      )
    );
    this.dynamicLayer.add(
      createPlayerDeck(
        this,
        1485,
        DECK_Y,
        state,
        state.players[1],
        'left',
        this.player2CoverTextureKey,
        interactive,
        () => this.drawAttackCard()
      )
    );
    this.dynamicLayer.add(
      new FieldView(this, centerX, FIELD_CENTER_Y, state, (positionId) => this.selectTarget(positionId), {
        hiddenCards: options.hiddenRestoredCards,
        interactive
      })
    );
    this.dynamicLayer.add(
      new AdvantageView(this, centerX, 94, {
        advantage: getTeamAdvantage(state)
      })
    );
    this.addTeamStats(state);

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
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Invalid target.');
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
      const missedAttack = state.log.slice(-4).some((event) => event.type === 'ATTACK_MISSED');

      if (scoredGoal) {
        this.render(state, { interactive: false });
        this.playSound('sound-goal', 0.72);
        this.showFlyingMessage('GOAL!!', 'goal', () => this.startTurn());
      } else if (goalkeeperSave) {
        this.render(state, { interactive: false });
        this.playSound('sound-goalkeeper-save', 0.72);
        this.showFlyingMessage('Goalkeeper!!', 'save', () => this.startTurn());
      } else if (missedAttack) {
        this.render(state, { interactive: false });
        this.showFlyingMessage('Turnover...', 'out', () => this.startTurn());
      } else {
        this.startTurn();
      }

      return;
    }

    const goalpostHit = state.log.at(-1)?.type === 'GOALPOST_HIT';
    this.render(state);

    if (goalpostHit) {
      this.playSound('sound-goalpost', 0.72);
      this.showFlyingMessage('Post!', 'post');
    }
  }

  private addTeamStats(state: Readonly<GameState>): void {
    if (this.dynamicLayer === null) {
      return;
    }

    const [playerOneStats, playerTwoStats] = getMatchStats(state);

    this.dynamicLayer.add(
      new TeamStatsView(this, 120, 232, {
        align: 'left',
        scorers: playerOneStats.scorers.map(formatShortScorer)
      })
    );
    this.dynamicLayer.add(
      new TeamStatsView(this, 1485, 232, {
        align: 'right',
        scorers: playerTwoStats.scorers.map(formatShortScorer)
      })
    );
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

  private openExitConfirmModal(): void {
    if (this.exitConfirmModal !== null) {
      return;
    }

    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const modal = this.add.container(0, 0);
    const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.68);
    overlay.setInteractive();

    const panel = this.add.container(centerX, centerY);
    const background = this.add.rectangle(0, 0, 620, 260, 0x0b2118, 0.98);
    background.setStrokeStyle(2, 0xf0c95a, 0.95);

    const title = this.add
      .text(0, -82, 'Exit to menu?', {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const text = this.add
      .text(0, -22, 'Current match progress will not be saved. Do you want to leave?', {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        wordWrap: { width: 520 }
      })
      .setOrigin(0.5);

    const leaveButton = new Button(this, -125, 76, 'Menu', () => this.scene.start('MenuScene'));
    const stayButton = new Button(this, 125, 76, 'Stay', () => this.closeExitConfirmModal());

    panel.add([background, title, text, leaveButton, stayButton]);
    modal.add([overlay, panel]);
    this.exitConfirmModal = modal;
  }

  private closeExitConfirmModal(): void {
    this.exitConfirmModal?.destroy();
    this.exitConfirmModal = null;
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
      attackerCard: { ...state.attackCard },
      attackerKitTextureKey: resolveFieldKitTextureKey(state, attacker),
      attackerProfile: resolveFieldCardProfile(state, attacker, state.attackCard)
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
    const card = new CardView(this, startX, DECK_Y, {
      rank: context.attackerCard.rank,
      color: context.attackerCard.color,
      kitTextureKey: context.attackerKitTextureKey,
      playerProfile: context.attackerProfile
    });
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

    if (outcome === 'post' || outcome === 'save' || outcome === 'miss') {
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
    const color = outcome === 'save' || outcome === 'miss' ? 0xffffff : outcome === 'post' ? 0xf0c95a : 0x93f0b2;
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

  private handleLoadError(file: Phaser.Loader.File): void {
    markTeamCoverLoadFailed(file.key);
  }

  private resolvePlayerCoverTextureKey(teamName: string, flagCode: string): string {
    const result = resolveTeamCoverLoadResult(this.textures, flagCode);

    if (result.usedFallback) {
      console.warn(`Cover not found for ${teamName}. Falling back to covers/none.webp.`);
    }

    return result.textureKey;
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
    const player = state.players.find((candidate) => candidate.id === entry.playerId);
    const isGoalkeeper = entry.positionId === 'goalkeeper';
    const profile =
      player === undefined || isGoalkeeper
        ? undefined
        : resolveFieldCardProfile(state, player, entry.card as Card);
    const setup = player === undefined ? undefined : state.matchSetups[player.id];
    const goalkeeperProfile =
      isGoalkeeper && setup !== undefined
        ? createGoalkeeperCardProfile(setup.flagCode, getStartingGoalkeeper(setup), (entry.card as GoalkeeperCard).rank)
        : undefined;
    const card = new CardView(this, startX, DECK_Y, {
      rank: entry.card.rank,
      color: isGoalkeeper || player === undefined ? player?.teamColor ?? 'BLACK' : (entry.card as Card).color,
      playerProfile: isGoalkeeper ? goalkeeperProfile : profile,
      kitTextureKey:
        setup === undefined
          ? undefined
          : isGoalkeeper
            ? getGoalkeeperKitAssetKey(setup.goalkeeperKitId)
            : getTeamKitAssetKey(setup.flagCode)
    });
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
    this.scene.start('ResultScene', { state, launchContext: this.launchContext });
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
  coverTextureKey: string,
  interactive: boolean,
  onDeckClick: () => void
): DeckView {
  const isActive = state.activePlayerId === player.id;

  return new DeckView(scene, x, y, player.deck.cards.length, {
    active: isActive,
    attackCardRank: isActive ? state.attackCard?.rank : undefined,
    attackCardColor: isActive ? state.attackCard?.color : undefined,
    attackCardKitTextureKey: isActive ? resolveFieldKitTextureKey(state, player) : undefined,
    attackCardPlayerProfile:
      isActive && state.attackCard !== null ? resolveFieldCardProfile(state, player, state.attackCard) : undefined,
    coverTextureKey,
    countSide,
    onClick: interactive && isActive && state.phase === 'WAITING_FOR_ATTACK_CARD' ? onDeckClick : undefined
  });
}

function getPlayerDeckX(state: Readonly<GameState>, playerId: Player['id']): number {
  return playerId === state.players[0].id ? 115 : 1485;
}

function resolveFieldCardProfile(state: Readonly<GameState>, player: Player, card: Card): CardPlayerProfile | undefined {
  const setup = state.matchSetups[player.id];

  return setup === undefined ? undefined : createCardPlayerProfile(setup.flagCode, getFieldPlayerForCard(setup, card));
}

function resolveFieldKitTextureKey(state: Readonly<GameState>, player: Player): string | undefined {
  const setup = state.matchSetups[player.id];

  return setup === undefined ? undefined : getTeamKitAssetKey(setup.flagCode);
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
    return state.log.slice(-4).some((event) => event.type === 'ATTACK_MISSED') ? 'miss' : 'defeat';
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

function getShotsForPlayer(events: readonly GameEvent[], playerId: Player['id']): number {
  return events.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === playerId).length;
}

function formatShortScorer(scorer: GoalScorerStat): string {
  return `${scorer.playerName} (#${scorer.shirtNumber})`;
}
