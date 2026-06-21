import Phaser from 'phaser';
import { playSoundSafe } from '../audio/playSoundSafe';
import {
  getFallbackCoverTextureKey,
  markTeamCoverLoadFailed,
  queueTeamCoverLoad,
  resolveTeamCoverLoadResult
} from '../assets/teamCover';
import { AiTurnController, type AiAction, type AiTurnCheckReason, type PlayerControllerType } from '../ai';
import type { Card } from '../cards';
import { GAME_AUTHOR, GAME_TITLE, GAME_VERSION, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { QUICK_MATCH_CONTEXT, type MatchLaunchContext } from '../tournament';
import {
  GameEngine,
  getFieldPlayerForCard,
  formatGoalScorerMatchLabel,
  getMatchStats,
  getStartingGoalkeeper,
  getTeamAdvantage,
  type FieldCard,
  type FieldPositionId,
  type GameEvent,
  type GameState,
  type MidfielderPositionId,
  type Player
} from '../game';
import type { GoalkeeperCard } from '../cards';
import { getGoalkeeperKitAssetKey, getTeamKitAssetKey } from '../data/teamKits';
import { AdvantageView } from '../ui/AdvantageView';
import { Button } from '../ui/Button';
import { createCardPlayerProfile, createGoalkeeperCardProfile, type CardPlayerProfile } from '../ui/cardPlayerProfile';
import { CardView } from '../ui/CardView';
import { clearDeckTurnBallMarker, DeckView, getDeckTurnBallWorldPosition } from '../ui/DeckView';
import { FieldView, getFieldCardPosition } from '../ui/FieldView';
import { MATCH_CARD_SCALE } from '../ui/matchCardScale';
import { SCORE_VIEW_HEIGHT, SCORE_VIEW_WIDTH, ScoreView } from '../ui/ScoreView';
import { TEAM_STATS_VIEW_HEIGHT, TeamStatsView } from '../ui/TeamStatsView';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';
import { ABOUT_CONTENT, ABOUT_LANGUAGES, RULES_CONTENT, type AboutLanguage, type InfoModalKind } from './MenuScene';
import type { TeamSelectionData } from './TeamSelectScene';
import { getGoalkeeperShotSceneEffect, getNextGoalScoredSceneEffect } from './gameSceneEventEffects';

const FIELD_WIDTH = 1120;
const FIELD_LEFT = (SCENE_WIDTH - FIELD_WIDTH) / 2;
const FIELD_RIGHT = FIELD_LEFT + FIELD_WIDTH;
const FIELD_TOP = 100;
const FIELD_CENTER_Y = 400;
const DECK_Y = 560;
const SCOREBOARD_CENTER_Y = 42;
const SCOREBOARD_LEFT = SCENE_WIDTH / 2 - SCORE_VIEW_WIDTH / 2;
const SCOREBOARD_RIGHT = SCENE_WIDTH / 2 + SCORE_VIEW_WIDTH / 2;
const ADVANTAGE_CENTER_Y = 94;
const SIDE_ACTION_BUTTON_HORIZONTAL_GAP = 14;
const LEFT_ACTION_BUTTONS_LEFT = FIELD_LEFT;
const LEFT_ACTION_BUTTONS_RIGHT = SCOREBOARD_LEFT - SIDE_ACTION_BUTTON_HORIZONTAL_GAP;
const RIGHT_ACTION_BUTTONS_LEFT = SCOREBOARD_RIGHT + SIDE_ACTION_BUTTON_HORIZONTAL_GAP;
const RIGHT_ACTION_BUTTONS_RIGHT = FIELD_RIGHT;
const LEFT_ACTION_BUTTONS_WIDTH = LEFT_ACTION_BUTTONS_RIGHT - LEFT_ACTION_BUTTONS_LEFT;
const RIGHT_ACTION_BUTTONS_WIDTH = RIGHT_ACTION_BUTTONS_RIGHT - RIGHT_ACTION_BUTTONS_LEFT;
const SIDE_ACTION_BUTTON_WIDTH = Math.min(LEFT_ACTION_BUTTONS_WIDTH, RIGHT_ACTION_BUTTONS_WIDTH);
const LEFT_ACTION_BUTTON_X = LEFT_ACTION_BUTTONS_LEFT + SIDE_ACTION_BUTTON_WIDTH / 2;
const RIGHT_ACTION_BUTTON_X = RIGHT_ACTION_BUTTONS_RIGHT - SIDE_ACTION_BUTTON_WIDTH / 2;
const MATCH_ACTION_BUTTON_HEIGHT = 38;
const MATCH_ACTION_BUTTON_FONT_SIZE = '28px';
const MATCH_ACTION_BUTTON_GAP = 10;
const MATCH_ACTION_BUTTON_TOP = SCOREBOARD_CENTER_Y - SCORE_VIEW_HEIGHT / 2 + 3;
const MATCH_ACTION_BUTTON_STACK_HEIGHT = MATCH_ACTION_BUTTON_HEIGHT * 2 + MATCH_ACTION_BUTTON_GAP;
const MATCH_ACTION_BUTTON_CENTER_Y = MATCH_ACTION_BUTTON_TOP + MATCH_ACTION_BUTTON_STACK_HEIGHT / 2;
const TEAM_STATS_CENTER_Y = FIELD_TOP + TEAM_STATS_VIEW_HEIGHT / 2;
const INFO_MODAL = {
  width: 960,
  height: 600
} as const;
const INFO_MODAL_BACKGROUND_COLOR = 0x000000;
const INFO_MODAL_BACKGROUND_ALPHA = 0.82;
const INFO_VIEWPORT = {
  x: -390,
  y: -150,
  width: 780,
  height: 360
} as const;
const INFO_BACK_BUTTON = {
  y: 258,
  width: 190,
  height: 42,
  fontSize: '18px'
} as const;
const PAUSE_MODAL = {
  width: 460,
  height: 500
} as const;
const PAUSE_BUTTON = {
  width: 300,
  height: 64,
  fontSize: '26px',
  gap: 20
} as const;
const TURN_BALL_TEXTURE_KEY = 'turn-ball';
const GOALKEEPER_SHOT_BALL_SIZE = 42;
const GOALKEEPER_SHOT_BALL_FLIGHT_MS = 320;
const GOALKEEPER_SHOT_BALL_ARC_HEIGHT = 58;
const GOALKEEPER_SHOT_BALL_OUTCOME_MS = 220;
const GOALKEEPER_SHOT_GOAL_SPIN_DEGREES = 1080;
const SHOT_SOURCE_KICK_FORWARD_MS = 90;
const SHOT_SOURCE_KICK_RETURN_MS = 80;
const SHOT_SOURCE_KICK_DISTANCE = 16;
const SHOT_SOURCE_KICK_ROTATION = Phaser.Math.DegToRad(9);
const GOALKEEPER_SHOT_SOURCE_SNAPSHOT_DEPTH = 840;
const GOALKEEPER_RANK_ROLL_DURATION_MS = 820;
const GOALKEEPER_RANK_ROLL_MIN_STEPS = 8;
const GOALKEEPER_RANK_ROLL_SEQUENCE: readonly GoalkeeperCard['rank'][] = [
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A'
];

interface CardVisualTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
}

interface RestoreAnimationEntry {
  playerId: Player['id'];
  positionId: FieldPositionId;
  card: FieldCard;
}

interface RenderOptions {
  hiddenRestoredCards?: readonly RestoreAnimationEntry[];
  interactive?: boolean;
  aiCheckReason?: AiTurnCheckReason;
  hideActiveTurnBall?: boolean;
}

interface AttackAnimationContext {
  attackerId: Player['id'];
  defenderId: Player['id'];
  positionId: FieldPositionId;
  sourcePositionId?: MidfielderPositionId;
  attackerCard: Card;
  defenderCard: FieldCard;
  defenderCardColor: Player['teamColor'] | Card['color'];
  defenderKitTextureKey?: string;
  defenderProfile?: CardPlayerProfile;
  startX?: number;
  startY?: number;
  attackerKitTextureKey?: string;
  attackerProfile?: CardPlayerProfile;
}

type AttackAnimationOutcome = 'defeat' | 'miss' | 'goal' | 'post' | 'save';
type GoalkeeperShotAnimationOutcome = Extract<AttackAnimationOutcome, 'goal' | 'post' | 'save'>;
type GoalkeeperRankChangedSceneEvent = Extract<GameEvent, { type: 'GOALKEEPER_RANK_CHANGED' }>;

export class GameScene extends Phaser.Scene {
  private engine: GameEngine | null = null;
  private aiTurnController: AiTurnController | null = null;
  private dynamicLayer: Phaser.GameObjects.Container | null = null;
  private message: Phaser.GameObjects.Container | null = null;
  private exitConfirmModal: Phaser.GameObjects.Container | null = null;
  private pauseModal: Phaser.GameObjects.Container | null = null;
  private infoModal: Phaser.GameObjects.Container | null = null;
  private activeInfoModal: InfoModalKind | null = null;
  private infoLanguage: AboutLanguage = 'en';
  private animatedRestoreCount = 0;
  private startWhistlePlayed = false;
  private player1Name = 'France';
  private player2Name = 'Spain';
  private player1FlagCode = 'fr';
  private player2FlagCode = 'es';
  private player1ControllerType: PlayerControllerType = 'HUMAN';
  private player2ControllerType: PlayerControllerType = 'HUMAN';
  private aiMatchSeed = 'quick-match';
  private player1CoverTextureKey = getFallbackCoverTextureKey();
  private player2CoverTextureKey = getFallbackCoverTextureKey();
  private launchContext: MatchLaunchContext = QUICK_MATCH_CONTEXT;
  private handledGoalScoredEventCursor = 0;
  private isMatchEffectInProgress = false;
  private isAttackAnimationInProgress = false;
  private isRestoreAnimationInProgress = false;

  public constructor() {
    super('GameScene');
  }

  public init(data: Partial<TeamSelectionData> & { launchContext?: MatchLaunchContext }): void {
    this.player1Name = data.player1Name ?? 'France';
    this.player2Name = data.player2Name ?? 'Spain';
    this.player1FlagCode = data.player1FlagCode ?? 'fr';
    this.player2FlagCode = data.player2FlagCode ?? 'es';
    this.player1ControllerType = data.player1ControllerType ?? 'HUMAN';
    this.player2ControllerType = data.player2ControllerType ?? 'HUMAN';
    this.launchContext = data.launchContext ?? QUICK_MATCH_CONTEXT;
    this.aiMatchSeed = createAiMatchSeed(
      this.launchContext,
      this.player1FlagCode,
      this.player2FlagCode,
      this.player1ControllerType,
      this.player2ControllerType
    );
    this.player1CoverTextureKey = getFallbackCoverTextureKey();
    this.player2CoverTextureKey = getFallbackCoverTextureKey();
    this.animatedRestoreCount = 0;
    this.handledGoalScoredEventCursor = 0;
    this.isMatchEffectInProgress = false;
    this.isAttackAnimationInProgress = false;
    this.isRestoreAnimationInProgress = false;
    this.startWhistlePlayed = false;
    this.exitConfirmModal?.destroy();
    this.exitConfirmModal = null;
    this.pauseModal?.destroy();
    this.pauseModal = null;
    this.infoModal?.destroy();
    this.infoModal = null;
    this.activeInfoModal = null;
  }

  public preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    queueTeamCoverLoad(this, this.player1FlagCode);
    queueTeamCoverLoad(this, this.player2FlagCode);
  }

  public create(): void {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    this.aiTurnController?.dispose();
    this.player1CoverTextureKey = this.resolvePlayerCoverTextureKey(this.player1Name, this.player1FlagCode);
    this.player2CoverTextureKey = this.resolvePlayerCoverTextureKey(this.player2Name, this.player2FlagCode);
    this.engine = new GameEngine();
    this.aiTurnController = new AiTurnController({
      getState: () => this.engine?.getState() ?? null,
      getMatchSeed: () => this.aiMatchSeed,
      canAct: () => this.isSceneStableForAi(),
      executeAction: (action) => this.executeAiAction(action),
      scheduleDelayedCall: (delayMs, callback) => this.time.delayedCall(delayMs, callback)
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);
    this.engine.startNewGame({
      player1Name: this.player1Name,
      player2Name: this.player2Name,
      player1FlagCode: this.player1FlagCode,
      player2FlagCode: this.player2FlagCode,
      player1ControllerType: this.player1ControllerType,
      player2ControllerType: this.player2ControllerType
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

    this.render(state, { aiCheckReason: 'TURN_STARTED' });
  }

  private render(state: Readonly<GameState>, options: RenderOptions = {}): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const interactive = options.interactive !== false;
    const gameInteractive = interactive && !(this.aiTurnController?.isAiTurn(state) ?? false);
    const pendingRestores = this.getPendingRestoreAnimationEntries(state);
    const hiddenRestoredCards = options.hiddenRestoredCards ?? (interactive ? pendingRestores : undefined);

    if (options.hideActiveTurnBall === true) {
      clearDeckTurnBallMarker(this);
    }

    this.dynamicLayer?.destroy();
    this.dynamicLayer = this.add.container(0, 0);

    this.dynamicLayer.add(this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a));
    this.dynamicLayer.add(
      new Button(this, LEFT_ACTION_BUTTON_X, MATCH_ACTION_BUTTON_CENTER_Y, 'Pause', () => this.openPauseModal(state), {
        fontSize: MATCH_ACTION_BUTTON_FONT_SIZE,
        height: MATCH_ACTION_BUTTON_STACK_HEIGHT,
        width: SIDE_ACTION_BUTTON_WIDTH
      })
    );
    this.dynamicLayer.add(
      new Button(this, RIGHT_ACTION_BUTTON_X, MATCH_ACTION_BUTTON_CENTER_Y, 'Rules', () => this.openMatchInfoModal('rules'), {
        fontSize: MATCH_ACTION_BUTTON_FONT_SIZE,
        height: MATCH_ACTION_BUTTON_STACK_HEIGHT,
        width: SIDE_ACTION_BUTTON_WIDTH
      })
    );
    this.dynamicLayer.add(
      new ScoreView(
        this,
        centerX,
        SCOREBOARD_CENTER_Y,
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
        gameInteractive,
        () => this.drawAttackCard(),
        options.hideActiveTurnBall !== true
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
        gameInteractive,
        () => this.drawAttackCard(),
        options.hideActiveTurnBall !== true
      )
    );
    this.dynamicLayer.add(
      new FieldView(this, centerX, FIELD_CENTER_Y, state, (positionId) => this.selectTarget(positionId), {
        hiddenCards: hiddenRestoredCards,
        interactive: gameInteractive,
        onMidfielderCommit: (positionId) => this.commitMidfielder(positionId),
        onMidfieldGapSelect: (positionId) => this.useMidfieldGap(positionId)
      })
    );
    this.dynamicLayer.add(
      new AdvantageView(this, centerX, ADVANTAGE_CENTER_Y, {
        advantage: getTeamAdvantage(state)
      })
    );
    this.addTeamStats(state);

    if (interactive && pendingRestores.length > 0) {
      this.isRestoreAnimationInProgress = true;
      this.animateRestoredCards(state, pendingRestores);
      return;
    }

    if (interactive && this.isSceneStableForAi()) {
      this.playStartWhistleIfReady(state);
      this.aiTurnController?.requestTurnCheck(options.aiCheckReason);
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

  private commitMidfielder(positionId: MidfielderPositionId): void {
    const engine = this.requireEngine();

    if (!engine.canCommitMidfielder(positionId)) {
      return;
    }

    const animationContext = this.createMidfielderCommitAnimationContext(positionId);
    let state: GameState;

    try {
      state = engine.commitMidfielder(positionId);
    } catch (error) {
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Invalid midfielder.');
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

  private useMidfieldGap(positionId: MidfielderPositionId): void {
    const engine = this.requireEngine();
    const animationContext = this.createMidfieldGapAnimationContext(positionId);
    let state: GameState;

    try {
      state = engine.useMidfieldGap(positionId);
    } catch (error) {
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Invalid midfield gap.');
      return;
    }

    if (animationContext !== null) {
      this.animateAttackSelection(state, animationContext, 'defeat', () => this.handleSelectedTargetState(state));
      return;
    }

    this.handleSelectedTargetState(state);
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
      const goalkeeperSave = state.log.slice(-4).some((event) => event.type === 'GOALKEEPER_SAVE');
      const goalkeeperRankChange = getLastGoalkeeperRankChangedEvent(state.log);
      const attackDeckEmpty = state.log.slice(-5).some((event) => event.type === 'ATTACK_DECK_EMPTY');
      const missedAttack = state.log.slice(-4).some((event) => event.type === 'ATTACK_MISSED');
      const goalEffect = getNextGoalScoredSceneEffect(state.log, this.handledGoalScoredEventCursor);
      const hiddenRestoredCards = this.getPendingRestoreAnimationEntries(state);

      if (goalEffect !== null) {
        this.handledGoalScoredEventCursor = goalEffect.eventIndex + 1;
        this.render(state, { hiddenRestoredCards, interactive: false });
        this.isMatchEffectInProgress = true;
        this.showFlyingMessage(goalEffect.flyingMessage, goalEffect.flyingMessageTone, () => {
          this.isMatchEffectInProgress = false;
          this.startTurn();
        });
      } else if (goalkeeperSave) {
        this.render(state, { hiddenRestoredCards, interactive: false });
        this.animateGoalkeeperRankChange(goalkeeperRankChange, () => this.startTurn());
      } else if (attackDeckEmpty) {
        this.render(state, { hiddenRestoredCards, interactive: false });
        this.showFlyingMessage('No cards!', 'out', () => this.startTurn());
      } else if (missedAttack) {
        this.render(state, { hiddenRestoredCards, interactive: false });
        this.showFlyingMessage('Turnover...', 'out', () => this.startTurn());
      } else {
        this.startTurn();
      }

      return;
    }

    this.render(state);
  }

  private addTeamStats(state: Readonly<GameState>): void {
    if (this.dynamicLayer === null) {
      return;
    }

    const [playerOneStats, playerTwoStats] = getMatchStats(state);

    this.dynamicLayer.add(
      new TeamStatsView(this, 120, TEAM_STATS_CENTER_Y, {
        align: 'left',
        scorers: playerOneStats.scorers.map(formatGoalScorerMatchLabel)
      })
    );
    this.dynamicLayer.add(
      new TeamStatsView(this, 1485, TEAM_STATS_CENTER_Y, {
        align: 'right',
        scorers: playerTwoStats.scorers.map(formatGoalScorerMatchLabel)
      })
    );
  }

  private animateGoalkeeperRankChange(event: GoalkeeperRankChangedSceneEvent | null, onComplete: () => void): void {
    if (event === null) {
      onComplete();
      return;
    }

    const goalkeeperView = this.findFieldCardView(event.playerId, 'goalkeeper');

    if (goalkeeperView === null) {
      onComplete();
      return;
    }

    this.isMatchEffectInProgress = true;
    this.input.enabled = false;
    goalkeeperView.setDisplayRank(event.previousCard.rank);
    goalkeeperView
      .animateDisplayRankRoll(event.nextCard.rank, {
        durationMs: GOALKEEPER_RANK_ROLL_DURATION_MS,
        steps: getGoalkeeperRankRollSteps(event.previousCard.rank, event.nextCard.rank)
      })
      .then(() => {
        this.input.enabled = true;
        this.isMatchEffectInProgress = false;
        onComplete();
      });
  }

  private findFieldCardView(playerId: Player['id'], positionId: FieldPositionId): CardView | null {
    return findCardView(
      this.dynamicLayer,
      (cardView) =>
        cardView.getData('fieldSourcePlayerId') === playerId &&
        cardView.getData('fieldSourcePositionId') === positionId
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

    if (this.engine !== null && this.isSceneStableForAi()) {
      this.aiTurnController?.requestTurnCheck('STATE_RENDERED');
    }
  }

  private openPauseModal(state: Readonly<GameState>): void {
    if (this.pauseModal !== null || this.infoModal !== null || this.exitConfirmModal !== null) {
      return;
    }

    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const modal = this.add.container(0, 0).setDepth(1000);
    const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
    overlay.setInteractive();

    const panel = this.add.container(centerX, centerY);
    const background = this.add.rectangle(
      0,
      0,
      PAUSE_MODAL.width,
      PAUSE_MODAL.height,
      INFO_MODAL_BACKGROUND_COLOR,
      INFO_MODAL_BACKGROUND_ALPHA
    );

    const title = this.add
      .text(0, -160, 'Pause', {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const firstButtonY = -84;
    const buttonStep = PAUSE_BUTTON.height + PAUSE_BUTTON.gap;
    const continueButton = this.createPauseButton(0, firstButtonY, 'Continue', () => this.closePauseModal());
    const menuButton = this.createPauseButton(0, firstButtonY + buttonStep, 'Menu', () => {
      this.closePauseModal();
      this.openExitConfirmModal();
    });
    const resultButton = this.createPauseButton(0, firstButtonY + buttonStep * 2, 'Result', () => {
      this.closePauseModal();
      this.openResult(state);
    });
    const aboutButton = this.createPauseButton(0, firstButtonY + buttonStep * 3, 'About', () => {
      this.closePauseModal();
      this.openMatchInfoModal('about');
    });

    panel.add([background, title, continueButton, menuButton, resultButton, aboutButton]);
    modal.add([overlay, panel]);
    this.pauseModal = modal;
  }

  private closePauseModal(): void {
    this.pauseModal?.destroy();
    this.pauseModal = null;

    if (this.engine !== null && this.isSceneStableForAi()) {
      this.aiTurnController?.requestTurnCheck('STATE_RENDERED');
    }
  }

  private createPauseButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    return new Button(this, x, y, label, onClick, {
      fontSize: PAUSE_BUTTON.fontSize,
      height: PAUSE_BUTTON.height,
      width: PAUSE_BUTTON.width
    });
  }

  private openMatchInfoModal(kind: InfoModalKind): void {
    if (this.infoModal !== null || this.pauseModal !== null) {
      return;
    }

    this.activeInfoModal = kind;
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const aboutContent = ABOUT_CONTENT[this.infoLanguage];
    const rulesContent = RULES_CONTENT[this.infoLanguage];
    const titleText = kind === 'about' ? aboutContent.title : rulesContent.title;
    const modal = this.add.container(0, 0).setDepth(1000);
    const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
    overlay.setInteractive();

    const panel = this.add.container(centerX, centerY);
    const background = this.add.rectangle(
      0,
      0,
      INFO_MODAL.width,
      INFO_MODAL.height,
      INFO_MODAL_BACKGROUND_COLOR,
      INFO_MODAL_BACKGROUND_ALPHA
    );

    const backButton = this.createMatchInfoBackButton();
    const languageSelector = this.createMatchInfoLanguageSelector(336, -258);
    const title = this.add
      .text(0, -252, titleText, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, -214, `${GAME_TITLE} | v${GAME_VERSION}`, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const author = this.add
      .text(0, -184, `${aboutContent.authorLabel}: ${GAME_AUTHOR}`, {
        align: 'center',
        color: '#8fd4ff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const viewport =
      kind === 'about' ? this.createMatchAboutViewport(aboutContent) : this.createMatchRulesViewport(rulesContent);

    panel.add(
      kind === 'about'
        ? [background, backButton, languageSelector, title, subtitle, author, viewport]
        : [background, backButton, languageSelector, title, subtitle, viewport]
    );
    modal.add([overlay, panel]);
    this.infoModal = modal;
  }

  private closeMatchInfoModal(): void {
    this.infoModal?.destroy();
    this.infoModal = null;
    this.activeInfoModal = null;

    if (this.engine !== null && this.isSceneStableForAi()) {
      this.aiTurnController?.requestTurnCheck('STATE_RENDERED');
    }
  }

  private createMatchInfoBackButton(): Phaser.GameObjects.Container {
    return new Button(this, 0, INFO_BACK_BUTTON.y, 'Back', () => this.closeMatchInfoModal(), {
      fontSize: INFO_BACK_BUTTON.fontSize,
      height: INFO_BACK_BUTTON.height,
      width: INFO_BACK_BUTTON.width
    });
  }

  private createMatchInfoLanguageSelector(x: number, y: number): Phaser.GameObjects.Container {
    const selector = this.add.container(x, y);
    const startX = -62;

    ABOUT_LANGUAGES.forEach((language, index) => {
      const isActive = language === this.infoLanguage;
      const label = this.add
        .text(startX + index * 54, 0, getInfoLanguageCode(language), {
          align: 'center',
          color: isActive ? '#f0c95a' : '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5);

      if (!isActive) {
        label.setInteractive({ useHandCursor: true });
        label.on('pointerover', () => label.setColor('#ffffff'));
        label.on('pointerout', () => label.setColor('#d9eadf'));
        label.on('pointerdown', () => this.switchMatchInfoLanguage(language));
      }

      selector.add(label);

      if (index < ABOUT_LANGUAGES.length - 1) {
        selector.add(
          this.add
            .text(startX + index * 54 + 27, 0, '|', {
              color: '#5f9572',
              fontFamily: 'Arial, sans-serif',
              fontSize: '18px',
              fontStyle: '700'
            })
            .setOrigin(0.5)
        );
      }
    });

    return selector;
  }

  private createMatchAboutViewport(content: (typeof ABOUT_CONTENT)[AboutLanguage]): Phaser.GameObjects.Container {
    const wrapper = this.add.container(0, 0);
    const scrollContent = this.add.container(0, INFO_VIEWPORT.y);
    let contentHeight = 0;

    content.paragraphs.forEach((paragraph) => {
      const text = this.add
        .text(INFO_VIEWPORT.x, contentHeight, paragraph, {
          align: 'left',
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          lineSpacing: 12,
          wordWrap: { width: INFO_VIEWPORT.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(text);
      contentHeight += text.height + 28;
    });

    content.sections.forEach((section) => {
      const heading = this.add
        .text(INFO_VIEWPORT.x, contentHeight + 4, section.heading, {
          align: 'left',
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '19px',
          fontStyle: '700',
          wordWrap: { width: INFO_VIEWPORT.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(heading);
      contentHeight += heading.height + 18;

      section.body.forEach((paragraph) => {
        const text = this.add
          .text(INFO_VIEWPORT.x, contentHeight, paragraph, {
            align: 'left',
            color: '#d9eadf',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            lineSpacing: 8,
            wordWrap: { width: INFO_VIEWPORT.width }
          })
          .setOrigin(0, 0);

        scrollContent.add(text);
        contentHeight += text.height + 10;
      });

      contentHeight += 12;
    });

    this.applyMatchInfoScrollableViewport(wrapper, scrollContent, contentHeight);

    return wrapper;
  }

  private createMatchRulesViewport(content: (typeof RULES_CONTENT)[AboutLanguage]): Phaser.GameObjects.Container {
    const wrapper = this.add.container(0, 0);
    const scrollContent = this.add.container(0, INFO_VIEWPORT.y);
    let contentHeight = 0;

    content.sections.forEach((section, index) => {
      const heading = this.add
        .text(INFO_VIEWPORT.x, contentHeight, section.heading, {
          align: 'left',
          color: index === 0 ? '#f0c95a' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: index === 0 ? '22px' : '19px',
          fontStyle: '700',
          wordWrap: { width: INFO_VIEWPORT.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(heading);
      contentHeight += heading.height + 8;

      section.body.forEach((paragraph) => {
        const body = this.add
          .text(INFO_VIEWPORT.x, contentHeight, paragraph, {
            align: 'left',
            color: '#d9eadf',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            lineSpacing: 8,
            wordWrap: { width: INFO_VIEWPORT.width }
          })
          .setOrigin(0, 0);

        scrollContent.add(body);
        contentHeight += body.height + 6;
      });

      contentHeight += 12;
    });

    this.applyMatchInfoScrollableViewport(wrapper, scrollContent, contentHeight);

    return wrapper;
  }

  private applyMatchInfoScrollableViewport(
    wrapper: Phaser.GameObjects.Container,
    scrollContent: Phaser.GameObjects.Container,
    contentHeight: number
  ): void {
    const maxScroll = Math.max(0, contentHeight - INFO_VIEWPORT.height);
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(
        SCENE_WIDTH / 2 + INFO_VIEWPORT.x,
        SCENE_HEIGHT / 2 + INFO_VIEWPORT.y,
        INFO_VIEWPORT.width,
        INFO_VIEWPORT.height
      )
      .createGeometryMask();
    maskGraphics.setVisible(false);
    scrollContent.setMask(mask);
    wrapper.once(Phaser.GameObjects.Events.DESTROY, () => maskGraphics.destroy());

    const scrollZone = this.add
      .zone(0, INFO_VIEWPORT.y + INFO_VIEWPORT.height / 2, INFO_VIEWPORT.width, INFO_VIEWPORT.height)
      .setInteractive();

    wrapper.add([scrollContent, scrollZone]);

    if (maxScroll <= 0) {
      return;
    }

    const trackX = INFO_VIEWPORT.x + INFO_VIEWPORT.width + 16;
    const track = this.add.rectangle(trackX, INFO_VIEWPORT.y + INFO_VIEWPORT.height / 2, 4, INFO_VIEWPORT.height, 0x5f9572, 0.28);
    const thumbHeight = Math.max(28, (INFO_VIEWPORT.height / contentHeight) * INFO_VIEWPORT.height);
    const thumb = this.add.rectangle(trackX, INFO_VIEWPORT.y + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
    let scrollY = 0;

    const setScroll = (value: number): void => {
      scrollY = clampScroll(value, maxScroll);
      scrollContent.y = INFO_VIEWPORT.y - scrollY;
      thumb.y = INFO_VIEWPORT.y + thumbHeight / 2 + (scrollY / maxScroll) * (INFO_VIEWPORT.height - thumbHeight);
    };
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: SCENE_WIDTH / 2 + INFO_VIEWPORT.x,
        y: SCENE_HEIGHT / 2 + INFO_VIEWPORT.y,
        width: INFO_VIEWPORT.width,
        height: INFO_VIEWPORT.height
      },
      maxScroll,
      getScroll: () => scrollY,
      setScroll
    });

    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(scrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);
    wrapper.add([track, thumb]);
  }

  private switchMatchInfoLanguage(language: AboutLanguage): void {
    const activeInfoModal = this.activeInfoModal;
    this.infoLanguage = language;
    this.closeMatchInfoModal();

    if (activeInfoModal !== null) {
      this.openMatchInfoModal(activeInfoModal);
    }
  }

  private showFlyingMessage(message: string, tone: 'goal' | 'out' | 'post' | 'save', onComplete?: () => void): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const fontSize = tone === 'goal' ? '88px' : tone === 'post' || tone === 'save' ? '48px' : '38px';
    const color = tone === 'goal' || tone === 'post' ? '#f0c95a' : '#ffffff';
    const textPadding = tone === 'goal' || tone === 'save' ? 28 : 14;
    const isShotOutcomeTone = tone === 'goal' || tone === 'post' || tone === 'save';
    const fadeDelay = isShotOutcomeTone ? 450 : 0;
    const duration = isShotOutcomeTone ? 2400 : 900;

    const text = this.add
      .text(centerX, centerY - 40, message, {
        color,
        fontFamily: tone === 'goal' || tone === 'save' ? 'Bangers, Arial, sans-serif' : 'Arial, sans-serif',
        fontSize,
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 5
      })
      .setPadding(textPadding, textPadding / 2, textPadding, textPadding / 2)
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 82,
      alpha: 0,
      delay: fadeDelay,
      duration,
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

    const defenderCard = defender.field[positionId];

    if (defenderCard === null) {
      return null;
    }

    const defenderSetup = state.matchSetups[defender.id];
    const defenderIsGoalkeeper = positionId === 'goalkeeper';

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      positionId,
      attackerCard: { ...state.attackCard },
      defenderCard: { ...defenderCard },
      defenderCardColor: defenderIsGoalkeeper ? defender.teamColor : (defenderCard as Card).color,
      defenderKitTextureKey:
        defenderSetup === undefined
          ? undefined
          : defenderIsGoalkeeper
            ? getGoalkeeperKitAssetKey(defenderSetup.goalkeeperKitId)
            : getTeamKitAssetKey(defenderSetup.flagCode),
      defenderProfile:
        defenderSetup === undefined
          ? undefined
          : defenderIsGoalkeeper
            ? createGoalkeeperCardProfile(
                defenderSetup.flagCode,
                getStartingGoalkeeper(defenderSetup),
                (defenderCard as GoalkeeperCard).rank
              )
            : resolveFieldCardProfile(state, defender, defenderCard as Card),
      sourcePositionId:
        state.currentAttackCardSource === 'MIDFIELDER'
          ? state.currentAttackingMidfielderPositionId ?? undefined
          : undefined,
      attackerKitTextureKey: resolveFieldKitTextureKey(state, attacker),
      attackerProfile: resolveFieldCardProfile(state, attacker, state.attackCard)
    };
  }

  private createMidfielderCommitAnimationContext(positionId: MidfielderPositionId): AttackAnimationContext | null {
    const state = this.requireEngine().getState();
    const attacker = state.players.find((player) => player.id === state.activePlayerId);
    const defender = state.players.find((player) => player.id !== state.activePlayerId);

    if (attacker === undefined || defender === undefined) {
      return null;
    }

    const attackerCard = attacker.field[positionId];
    const defenderCard = defender.field[positionId];

    if (attackerCard === null || defenderCard === null) {
      return null;
    }

    const start = getFieldCardPosition(SCENE_WIDTH / 2, FIELD_CENTER_Y, state, attacker.id, positionId);

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      positionId,
      attackerCard: { ...attackerCard },
      defenderCard: { ...defenderCard },
      defenderCardColor: (defenderCard as Card).color,
      defenderKitTextureKey: resolveFieldKitTextureKey(state, defender),
      defenderProfile: resolveFieldCardProfile(state, defender, defenderCard as Card),
      sourcePositionId: positionId,
      startX: start.x,
      startY: start.y,
      attackerKitTextureKey: resolveFieldKitTextureKey(state, attacker),
      attackerProfile: resolveFieldCardProfile(state, attacker, attackerCard)
    };
  }

  private createMidfieldGapAnimationContext(positionId: MidfielderPositionId): AttackAnimationContext | null {
    const state = this.requireEngine().getState();
    const attacker = state.players.find((player) => player.id === state.activePlayerId);
    const defender = state.players.find((player) => player.id !== state.activePlayerId);

    if (attacker === undefined || defender === undefined || state.attackCard === null) {
      return null;
    }

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      positionId,
      attackerCard: { ...state.attackCard },
      defenderCard: { ...state.attackCard },
      defenderCardColor: attacker.teamColor,
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
    this.isAttackAnimationInProgress = true;
    this.input.enabled = false;

    const target = getFieldCardPosition(SCENE_WIDTH / 2, FIELD_CENTER_Y, state, context.defenderId, context.positionId);
    const startX = context.startX ?? getPlayerDeckX(state, context.attackerId);
    const startY = context.startY ?? DECK_Y;

    if (isGoalkeeperShotAnimationOutcome(context, outcome)) {
      const hiddenRestoredCards = this.getPendingRestoreAnimationEntries(state);

      this.render(state, {
        hiddenRestoredCards,
        interactive: false,
        hideActiveTurnBall: true
      });
      this.playGoalkeeperShotBallFlight(state, context, target, outcome, () => this.finishAttackAnimationSequence(onComplete));
      return;
    }

    if (outcome === 'defeat' || (outcome === 'miss' && context.sourcePositionId === undefined)) {
      this.hideAttackAnimationSource(context);
    }

    const card = new CardView(this, startX, startY, {
      rank: context.attackerCard.rank,
      color: context.attackerCard.color,
      kitTextureKey: context.attackerKitTextureKey,
      playerProfile: context.attackerProfile
    });
    card.setScale(MATCH_CARD_SCALE * 0.92);
    card.setRotation(context.attackerId === state.players[0].id ? -0.1 : 0.1);

    this.tweens.add({
      targets: card,
      x: target.x,
      y: target.y,
      scale: MATCH_CARD_SCALE * 1.04,
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
    this.playGoalkeeperImpactSound(context.positionId, outcome);

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
      scale: MATCH_CARD_SCALE * 1.12,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => this.finishAnimationObject(card, onComplete)
    });
  }

  private hideAttackAnimationSource(context: AttackAnimationContext): void {
    const sourceView = this.findAttackAnimationSourceView(context);

    sourceView?.setVisible(false);
  }

  private findAttackAnimationSourceView(context: AttackAnimationContext): CardView | null {
    return findCardView(this.dynamicLayer, (cardView) => {
      if (context.sourcePositionId !== undefined) {
        return (
          cardView.getData('fieldSourcePlayerId') === context.attackerId &&
          cardView.getData('fieldSourcePositionId') === context.sourcePositionId
        );
      }

      return cardView.getData('attackDeckSourcePlayerId') === context.attackerId;
    });
  }

  private playGoalkeeperShotBallFlight(
    state: Readonly<GameState>,
    context: AttackAnimationContext,
    target: { x: number; y: number },
    outcome: GoalkeeperShotAnimationOutcome,
    onComplete: () => void
  ): void {
    const start = this.getTurnBallStartPosition(state, context.attackerId);
    const goalkeeperImpactCard = this.createGoalkeeperShotImpactCard(context, target, outcome);
    const sourceSnapshot = this.createGoalkeeperShotSourceSnapshot(state, context);

    this.playShotSourceKick(state, context, sourceSnapshot, start, () => {
      this.animateBallFlightToGoalkeeper({
        start,
        target,
        activeOnLeft: context.attackerId === state.players[0].id,
        goalkeeperImpactCard,
        sourceSnapshot,
        outcome,
        onComplete
      });
    });
  }

  private createGoalkeeperShotSourceSnapshot(
    state: Readonly<GameState>,
    context: AttackAnimationContext
  ): CardView {
    const sourceTransform = this.getGoalkeeperShotSourceTransform(state, context);
    const sourceSnapshot = new CardView(this, sourceTransform.x, sourceTransform.y, {
      rank: context.attackerCard.rank,
      color: context.attackerCard.color,
      kitTextureKey: context.attackerKitTextureKey,
      playerProfile: context.attackerProfile,
      tooltipEnabled: false
    });

    sourceSnapshot.setRotation(sourceTransform.rotation);
    sourceSnapshot.setScale(sourceTransform.scaleX, sourceTransform.scaleY);
    sourceSnapshot.setAlpha(sourceTransform.alpha);
    sourceSnapshot.setDepth(GOALKEEPER_SHOT_SOURCE_SNAPSHOT_DEPTH);

    return sourceSnapshot;
  }

  private getGoalkeeperShotSourceTransform(
    state: Readonly<GameState>,
    context: AttackAnimationContext
  ): CardVisualTransform {
    const sourceView = this.findAttackAnimationSourceView(context);

    if (sourceView !== null) {
      const transform = sourceView.getWorldTransformMatrix().decomposeMatrix();

      return {
        x: transform.translateX,
        y: transform.translateY,
        rotation: transform.rotation,
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        alpha: sourceView.alpha
      };
    }

    return {
      x: context.startX ?? getPlayerDeckX(state, context.attackerId),
      y: context.startY ?? DECK_Y,
      rotation: 0,
      scaleX: MATCH_CARD_SCALE,
      scaleY: MATCH_CARD_SCALE,
      alpha: 1
    };
  }

  private createGoalkeeperShotImpactCard(
    context: AttackAnimationContext,
    target: { x: number; y: number },
    outcome: GoalkeeperShotAnimationOutcome
  ): CardView | null {
    if (outcome === 'post') {
      return null;
    }

    const card = new CardView(this, target.x, target.y, {
      rank: context.defenderCard.rank,
      color: context.defenderCardColor,
      kitTextureKey: context.defenderKitTextureKey,
      label: 'GK',
      playerProfile: context.defenderProfile,
      tooltipEnabled: false
    });
    card.setDepth(850);
    card.setScale(MATCH_CARD_SCALE);

    return card;
  }

  private playShotSourceKick(
    state: Readonly<GameState>,
    context: AttackAnimationContext,
    sourceSnapshot: CardView,
    ballStart: { x: number; y: number },
    onComplete: () => void
  ): void {
    const source = {
      x: sourceSnapshot.x,
      y: sourceSnapshot.y,
      rotation: sourceSnapshot.rotation,
      scaleX: sourceSnapshot.scaleX,
      scaleY: sourceSnapshot.scaleY
    };
    const kickDirection = new Phaser.Math.Vector2(ballStart.x - source.x, ballStart.y - source.y);

    if (kickDirection.lengthSq() === 0) {
      kickDirection.set(context.attackerId === state.players[0].id ? 1 : -1, 0);
    }

    kickDirection.normalize();

    const kickRotation = (context.attackerId === state.players[0].id ? 1 : -1) * SHOT_SOURCE_KICK_ROTATION;

    this.tweens.chain({
      targets: sourceSnapshot,
      tweens: [
        {
          x: source.x + kickDirection.x * SHOT_SOURCE_KICK_DISTANCE,
          y: source.y + kickDirection.y * SHOT_SOURCE_KICK_DISTANCE,
          rotation: kickRotation,
          scaleX: source.scaleX * 1.04,
          scaleY: source.scaleY * 0.97,
          duration: SHOT_SOURCE_KICK_FORWARD_MS,
          ease: 'Back.easeOut'
        },
        {
          x: source.x,
          y: source.y,
          rotation: source.rotation,
          scaleX: source.scaleX,
          scaleY: source.scaleY,
          duration: SHOT_SOURCE_KICK_RETURN_MS,
          ease: 'Sine.easeIn',
          onComplete: () => {
            onComplete();
          }
        }
      ]
    });
  }

  private animateBallFlightToGoalkeeper(options: {
    start: { x: number; y: number };
    target: { x: number; y: number };
    activeOnLeft: boolean;
    goalkeeperImpactCard: CardView | null;
    sourceSnapshot: CardView;
    outcome: GoalkeeperShotAnimationOutcome;
    onComplete: () => void;
  }): void {
    const ball = this.add.image(options.start.x, options.start.y, TURN_BALL_TEXTURE_KEY);
    ball.setDisplaySize(GOALKEEPER_SHOT_BALL_SIZE, GOALKEEPER_SHOT_BALL_SIZE);
    ball.setDepth(900);

    const baseScaleX = ball.scaleX;
    const baseScaleY = ball.scaleY;
    const rotationSign = options.activeOnLeft ? 1 : -1;
    const flight = { progress: 0 };

    this.tweens.add({
      targets: flight,
      progress: 1,
      duration: GOALKEEPER_SHOT_BALL_FLIGHT_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const progress = flight.progress;
        const arcLift = Math.sin(Math.PI * progress) * GOALKEEPER_SHOT_BALL_ARC_HEIGHT;
        const scale = 1 + Math.sin(Math.PI * progress) * 0.15;

        ball.setPosition(
          Phaser.Math.Linear(options.start.x, options.target.x, progress),
          Phaser.Math.Linear(options.start.y, options.target.y, progress) - arcLift
        );
        ball.setAngle(rotationSign * 720 * progress);
        ball.setScale(baseScaleX * scale, baseScaleY * scale);
      },
      onComplete: () =>
        this.finishGoalkeeperShotBallImpact(
          ball,
          options.target,
          options.outcome,
          options.activeOnLeft,
          options.goalkeeperImpactCard,
          baseScaleX,
          baseScaleY,
          () => this.finishGoalkeeperShotSourceSnapshot(options.sourceSnapshot, options.onComplete)
        )
    });
  }

  private finishGoalkeeperShotSourceSnapshot(sourceSnapshot: CardView, onComplete: () => void): void {
    sourceSnapshot.destroy();
    onComplete();
  }

  private finishGoalkeeperShotBallImpact(
    ball: Phaser.GameObjects.Image,
    target: { x: number; y: number },
    outcome: GoalkeeperShotAnimationOutcome,
    activeOnLeft: boolean,
    goalkeeperImpactCard: CardView | null,
    baseScaleX: number,
    baseScaleY: number,
    onComplete: () => void
  ): void {
    const shotEffect = getGoalkeeperShotSceneEffect(outcome);

    this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);
    if (shotEffect.type === 'GOAL_SCORED') {
      this.handledGoalScoredEventCursor = this.requireEngine().getState().log.length;
    }
    this.showGoalkeeperShotTargetImpact(target, outcome);
    this.playGoalkeeperImpactSound('goalkeeper', outcome);

    if (outcome === 'goal') {
      this.animateGoalkeeperShotGoalDisappear(
        ball,
        target,
        activeOnLeft,
        goalkeeperImpactCard,
        baseScaleX,
        baseScaleY,
        onComplete
      );
      return;
    }

    this.animateGoalkeeperShotImpactCard(goalkeeperImpactCard, outcome, activeOnLeft);

    if (outcome === 'post') {
      this.animateGoalkeeperShotPostForwardDeflection(ball, target, activeOnLeft, baseScaleX, baseScaleY, onComplete);
      return;
    }

    if (outcome === 'save') {
      this.animateGoalkeeperShotSaveDeflection(ball, target, activeOnLeft, baseScaleX, baseScaleY, onComplete);
      return;
    }

    const exit = getGoalkeeperShotBallExit(target, outcome, activeOnLeft);

    this.tweens.add({
      targets: ball,
      x: exit.x,
      y: exit.y,
      alpha: 0,
      scaleX: baseScaleX * 0.5,
      scaleY: baseScaleY * 0.5,
      duration: GOALKEEPER_SHOT_BALL_OUTCOME_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ball.destroy();
        onComplete();
      }
    });
  }

  private animateGoalkeeperShotGoalDisappear(
    ball: Phaser.GameObjects.Image,
    target: { x: number; y: number },
    activeOnLeft: boolean,
    goalkeeperImpactCard: CardView | null,
    baseScaleX: number,
    baseScaleY: number,
    onComplete: () => void
  ): void {
    const exit = getGoalkeeperShotBallExit(target, 'goal', activeOnLeft);
    const spin = (activeOnLeft ? 1 : -1) * GOALKEEPER_SHOT_GOAL_SPIN_DEGREES;

    if (goalkeeperImpactCard !== null) {
      this.tweens.add({
        targets: goalkeeperImpactCard,
        x: exit.x,
        y: exit.y,
        angle: spin,
        scale: 0.18,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.easeIn'
      });
    }

    this.tweens.add({
      targets: ball,
      x: exit.x,
      y: exit.y,
      angle: ball.angle + spin,
      alpha: 0,
      scaleX: baseScaleX * 0.35,
      scaleY: baseScaleY * 0.35,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        ball.destroy();
        goalkeeperImpactCard?.destroy();
        onComplete();
      }
    });
  }

  private animateGoalkeeperShotSaveDeflection(
    ball: Phaser.GameObjects.Image,
    target: { x: number; y: number },
    activeOnLeft: boolean,
    baseScaleX: number,
    baseScaleY: number,
    onComplete: () => void
  ): void {
    const deflection = getGoalkeeperShotSaveDeflection(target, activeOnLeft);
    const rotationSign = activeOnLeft ? -1 : 1;

    this.tweens.add({
      targets: ball,
      x: deflection.x,
      y: deflection.y,
      angle: ball.angle + rotationSign * 420,
      alpha: 0,
      scaleX: baseScaleX * 0.45,
      scaleY: baseScaleY * 0.45,
      duration: 240,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ball.destroy();
        onComplete();
      }
    });
  }

  private animateGoalkeeperShotPostForwardDeflection(
    ball: Phaser.GameObjects.Image,
    target: { x: number; y: number },
    activeOnLeft: boolean,
    baseScaleX: number,
    baseScaleY: number,
    onComplete: () => void
  ): void {
    const deflection = getGoalkeeperShotPostForwardDeflection(target, activeOnLeft);
    const settle = {
      x: deflection.x + (activeOnLeft ? -88 : 88),
      y: deflection.y - 28
    };
    const rotationSign = activeOnLeft ? 1 : -1;

    this.tweens.chain({
      targets: ball,
      tweens: [
        {
          x: deflection.x,
          y: deflection.y,
          angle: ball.angle + rotationSign * 520,
          scaleX: baseScaleX * 0.9,
          scaleY: baseScaleY * 0.9,
          duration: 130,
          ease: 'Cubic.easeOut'
        },
        {
          x: settle.x,
          y: settle.y,
          angle: ball.angle + rotationSign * 760,
          alpha: 0,
          scaleX: baseScaleX * 0.5,
          scaleY: baseScaleY * 0.5,
          duration: 250,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            ball.destroy();
            onComplete();
          }
        }
      ]
    });
  }

  private animateGoalkeeperShotImpactCard(
    card: CardView | null,
    outcome: GoalkeeperShotAnimationOutcome,
    activeOnLeft: boolean
  ): void {
    if (card === null) {
      return;
    }

    if (outcome === 'save') {
      this.tweens.add({
        targets: card,
        scale: MATCH_CARD_SCALE * 1.1,
        duration: GOALKEEPER_SHOT_BALL_OUTCOME_MS / 2,
        ease: 'Sine.easeOut',
        yoyo: true,
        onComplete: () => card.destroy()
      });
      return;
    }

    this.tweens.add({
      targets: card,
      x: card.x + (activeOnLeft ? 8 : -8),
      scale: MATCH_CARD_SCALE * 1.04,
      alpha: 0,
      duration: GOALKEEPER_SHOT_BALL_OUTCOME_MS,
      ease: 'Sine.easeOut',
      onComplete: () => card.destroy()
    });
  }

  private showGoalkeeperShotTargetImpact(target: { x: number; y: number }, outcome: GoalkeeperShotAnimationOutcome): void {
    this.showImpactPulse(target.x, target.y, outcome);
  }

  private getTurnBallStartPosition(state: Readonly<GameState>, playerId: Player['id']): { x: number; y: number } {
    const markerSide = playerId === state.players[0].id ? 'right' : 'left';

    return getDeckTurnBallWorldPosition(getPlayerDeckX(state, playerId), DECK_Y, markerSide);
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

  private playGoalkeeperImpactSound(positionId: FieldPositionId, outcome: AttackAnimationOutcome): void {
    if (positionId !== 'goalkeeper') {
      return;
    }

    switch (outcome) {
      case 'goal':
        this.playSound('sound-goal', 0.72);
        return;
      case 'post':
        this.playSound('sound-goalpost', 0.72);
        return;
      case 'save':
        this.playSound('sound-goalkeeper-save', 0.72);
        return;
      default:
        return;
    }
  }

  private finishAnimationObject(card: CardView, onComplete: () => void): void {
    card.destroy();
    this.finishAttackAnimationSequence(onComplete);
  }

  private finishAttackAnimationSequence(onComplete: () => void): void {
    this.isAttackAnimationInProgress = false;
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
    playSoundSafe(this, key, { volume });
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
      this.isRestoreAnimationInProgress = false;
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
    card.setScale(MATCH_CARD_SCALE * 0.92);
    card.setAlpha(0.92);
    card.setRotation(entry.playerId === state.players[0].id ? -0.12 : 0.12);

    this.tweens.add({
      targets: card,
      x: target.x,
      y: target.y,
      scale: MATCH_CARD_SCALE,
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

        this.isRestoreAnimationInProgress = false;
        this.render(state);
      }
    });
  }

  private isSceneStableForAi(): boolean {
    return (
      this.input.enabled &&
      this.exitConfirmModal === null &&
      this.pauseModal === null &&
      this.infoModal === null &&
      !this.isAttackAnimationInProgress &&
      !this.isRestoreAnimationInProgress &&
      !this.isMatchEffectInProgress
    );
  }

  private openResult(state: Readonly<GameState>): void {
    this.scene.start('ResultScene', { state, launchContext: this.launchContext });
  }

  private executeAiAction(action: AiAction): void {
    switch (action.type) {
      case 'DRAW_FROM_DECK':
        this.drawAttackCard();
        return;
      case 'COMMIT_MIDFIELDER':
        this.commitMidfielder(action.positionId);
        return;
      case 'SELECT_TARGET':
        this.selectTarget(action.positionId);
        return;
      case 'SELECT_MIDFIELD_GAP':
        this.useMidfieldGap(action.positionId);
        return;
    }
  }

  private handleSceneShutdown(): void {
    this.exitConfirmModal?.destroy();
    this.exitConfirmModal = null;
    this.pauseModal?.destroy();
    this.pauseModal = null;
    this.infoModal?.destroy();
    this.infoModal = null;
    this.activeInfoModal = null;
    this.aiTurnController?.dispose();
    this.aiTurnController = null;
  }

  private getPendingRestoreAnimationEntries(state: Readonly<GameState>): RestoreAnimationEntry[] {
    return getRestoreAnimationEntries(state.log).slice(this.animatedRestoreCount);
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
  onDeckClick: () => void,
  showActiveMarker: boolean
): DeckView {
  const isActive = state.activePlayerId === player.id;

  return new DeckView(scene, x, y, player.deck.cards.length, {
    active: isActive,
    attackCardRank: isActive ? state.attackCard?.rank : undefined,
    attackCardColor: isActive ? state.attackCard?.color : undefined,
    attackCardKitTextureKey: isActive ? resolveFieldKitTextureKey(state, player) : undefined,
    attackCardPlayerProfile:
      isActive && state.attackCard !== null ? resolveFieldCardProfile(state, player, state.attackCard) : undefined,
    attackCardSourcePlayerId: isActive && state.attackCard !== null ? player.id : undefined,
    coverTextureKey,
    countSide,
    showActiveMarker,
    onClick: interactive && isActive && state.phase === 'WAITING_FOR_ATTACK_CARD' ? onDeckClick : undefined
  });
}

function getPlayerDeckX(state: Readonly<GameState>, playerId: Player['id']): number {
  return playerId === state.players[0].id ? 115 : 1485;
}

function findCardView(
  container: Phaser.GameObjects.Container | null,
  predicate: (cardView: CardView) => boolean
): CardView | null {
  if (container === null) {
    return null;
  }

  for (const child of container.list) {
    if (child instanceof CardView && predicate(child)) {
      return child;
    }

    if (child instanceof Phaser.GameObjects.Container) {
      const match = findCardView(child, predicate);

      if (match !== null) {
        return match;
      }
    }
  }

  return null;
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

function getLastGoalkeeperRankChangedEvent(events: readonly GameEvent[]): GoalkeeperRankChangedSceneEvent | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event === undefined) {
      continue;
    }

    if (event.type === 'GOALKEEPER_RANK_CHANGED') {
      return event;
    }

    if (event.type === 'TURN_ENDED' || event.type === 'GOALKEEPER_SAVE') {
      continue;
    }

    break;
  }

  return null;
}

function getGoalkeeperRankRollSteps(
  previousRank: GoalkeeperCard['rank'],
  nextRank: GoalkeeperCard['rank']
): GoalkeeperCard['rank'][] {
  const startIndex = GOALKEEPER_RANK_ROLL_SEQUENCE.indexOf(previousRank);
  const steps: GoalkeeperCard['rank'][] = [];
  let currentIndex = startIndex >= 0 ? startIndex : 0;

  while (
    (steps.length < GOALKEEPER_RANK_ROLL_MIN_STEPS || steps.at(-1) !== nextRank) &&
    steps.length < GOALKEEPER_RANK_ROLL_SEQUENCE.length * 2
  ) {
    currentIndex = (currentIndex + 1) % GOALKEEPER_RANK_ROLL_SEQUENCE.length;
    steps.push(GOALKEEPER_RANK_ROLL_SEQUENCE[currentIndex]!);
  }

  if (steps.at(-1) !== nextRank) {
    steps.push(nextRank);
  }

  return steps;
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

function isGoalkeeperShotAnimationOutcome(
  context: AttackAnimationContext,
  outcome: AttackAnimationOutcome
): outcome is GoalkeeperShotAnimationOutcome {
  return context.positionId === 'goalkeeper' && (outcome === 'goal' || outcome === 'save' || outcome === 'post');
}

function getGoalkeeperShotBallExit(
  target: { x: number; y: number },
  outcome: GoalkeeperShotAnimationOutcome,
  activeOnLeft: boolean
): { x: number; y: number } {
  if (outcome === 'goal') {
    return {
      x: target.x + (activeOnLeft ? 120 : -120),
      y: target.y
    };
  }

  const awayFromCenter = new Phaser.Math.Vector2(target.x - SCENE_WIDTH / 2, target.y - FIELD_CENTER_Y);

  if (awayFromCenter.lengthSq() === 0) {
    awayFromCenter.set(1, 0);
  }

  awayFromCenter.normalize();

  return {
    x: target.x + awayFromCenter.x * 170,
    y: target.y + awayFromCenter.y * 112
  };
}

function getGoalkeeperShotSaveDeflection(
  target: { x: number; y: number },
  activeOnLeft: boolean
): { x: number; y: number } {
  return {
    x: target.x + (activeOnLeft ? -155 : 155),
    y: target.y + 104
  };
}

function getGoalkeeperShotPostForwardDeflection(
  target: { x: number; y: number },
  activeOnLeft: boolean
): { x: number; y: number } {
  return {
    x: target.x + (activeOnLeft ? -190 : 190),
    y: target.y - 64
  };
}

function getShotsForPlayer(events: readonly GameEvent[], playerId: Player['id']): number {
  return events.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === playerId).length;
}

function createAiMatchSeed(
  launchContext: MatchLaunchContext,
  player1FlagCode: string,
  player2FlagCode: string,
  player1ControllerType: PlayerControllerType,
  player2ControllerType: PlayerControllerType
): string {
  const contextSeed =
    launchContext.mode === 'tournament'
      ? `${launchContext.tournamentId}:${launchContext.tournamentMatchId}`
      : 'quick-match';

  return `${contextSeed}:${player1FlagCode}:${player2FlagCode}:${player1ControllerType}:${player2ControllerType}`;
}

function getInfoLanguageCode(language: AboutLanguage): string {
  switch (language) {
    case 'en':
      return 'EN';
    case 'pl':
      return 'PL';
    case 'uk':
      return 'UA';
  }
}
