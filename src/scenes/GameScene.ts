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
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { getLanguageCode, getPreferredLanguage, setPreferredLanguage } from '../i18n/languageStore';
import { QUICK_MATCH_CONTEXT, saveTournament, type MatchLaunchContext, type TournamentState } from '../tournament';
import {
  GameEngine,
  getFieldPlayerForCard,
  formatGoalScorerMatchLabel,
  getCurrentTargetLine,
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
import { CARD_HEIGHT, CARD_WIDTH, CardView } from '../ui/CardView';
import { clearDeckTurnBallMarker, DeckView, getDeckTurnBallWorldPosition } from '../ui/DeckView';
import { FieldView, getFieldCardPosition } from '../ui/FieldView';
import { getGoalkeeperGoalAnimation } from '../ui/goalkeeperGoalAnimation';
import { MATCH_CARD_SCALE } from '../ui/matchCardScale';
import { createMatchControlButtons } from '../ui/matchControlButtons';
import { createMatchPauseOverlay } from '../ui/matchPauseOverlay';
import { createMatchRulesOverlay } from '../ui/MatchRulesOverlay';
import {
  MATCH_SIDE_PANEL_CENTER_Y,
  MATCH_SIDE_PANEL_LEFT_X,
  MATCH_SIDE_PANEL_RIGHT_X
} from '../ui/matchSidePanelStyle';
import {
  MATCH_ADVANTAGE_CENTER_Y,
  MATCH_DECK_Y,
  MATCH_FIELD_CENTER_X,
  MATCH_FIELD_CENTER_Y,
  MATCH_SCOREBOARD_CENTER_Y
} from '../ui/matchScreenLayout';
import { ScoreView } from '../ui/ScoreView';
import { TeamStatsView } from '../ui/TeamStatsView';
import { TUTORIAL_MATCH_V2_SETUP_PRESET } from '../tutorial/tutorialScenario';
import { TutorialController } from '../tutorial/TutorialController';
import { getTutorialText } from '../tutorial/tutorialTexts';
import type { MatchMode, TutorialAction, TutorialHighlightTarget, TutorialMidfielderSlot } from '../tutorial/tutorialTypes';
import { TutorialOverlay, type TutorialHighlightRect } from '../ui/TutorialOverlay';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';
import { ABOUT_CONTENT, ABOUT_LANGUAGES, RULES_CONTENT, type AboutLanguage, type InfoModalKind } from './MenuScene';
import type { TeamSelectionData } from './TeamSelectScene';
import {
  claimGoalkeeperShotImpactEvent,
  getGoalkeeperShotEventIndex,
  getGoalkeeperShotSceneEffect,
  getNextGoalScoredSceneEffect,
  type GoalkeeperShotSceneEffect,
  type GoalScoredSceneEffect
} from './gameSceneEventEffects';
import { submitSimulatedTournamentMatch } from './tournamentMatchSimulation';

const FIELD_CENTER_Y = MATCH_FIELD_CENTER_Y;
const DECK_Y = MATCH_DECK_Y;
const SCOREBOARD_CENTER_Y = MATCH_SCOREBOARD_CENTER_Y;
const ADVANTAGE_CENTER_Y = MATCH_ADVANTAGE_CENTER_Y;
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
const TURN_BALL_TEXTURE_KEY = 'turn-ball';
const GOALKEEPER_SHOT_BALL_SIZE = 42;
const GOALKEEPER_SHOT_BALL_FLIGHT_MS = 320;
const GOALKEEPER_SHOT_BALL_ARC_HEIGHT = 58;
const GOALKEEPER_SHOT_BALL_OUTCOME_MS = 220;
const SHOT_SOURCE_KICK_FORWARD_MS = 90;
const SHOT_SOURCE_KICK_RETURN_MS = 80;
const SHOT_SOURCE_KICK_DISTANCE = 16;
const SHOT_SOURCE_KICK_ROTATION = Phaser.Math.DegToRad(9);
const GOALKEEPER_SHOT_SOURCE_SNAPSHOT_DEPTH = 840;
const FLYING_MESSAGE_DEPTH = 3000;
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

type GameSceneInitData = Partial<TeamSelectionData> & {
  launchContext?: MatchLaunchContext;
  matchMode?: MatchMode;
};

export class GameScene extends Phaser.Scene {
  private engine: GameEngine | null = null;
  private aiTurnController: AiTurnController | null = null;
  private tutorialController: TutorialController | null = null;
  private tutorialOverlay: TutorialOverlay | null = null;
  private dynamicLayer: Phaser.GameObjects.Container | null = null;
  private message: Phaser.GameObjects.Container | null = null;
  private exitConfirmModal: Phaser.GameObjects.Container | null = null;
  private pauseModal: Phaser.GameObjects.Container | null = null;
  private infoModal: Phaser.GameObjects.Container | null = null;
  private activeInfoModal: InfoModalKind | null = null;
  private infoLanguage: AboutLanguage = getPreferredLanguage();
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
  private matchMode: MatchMode = 'quick';
  private handledGoalkeeperShotEventIndexes = new Set<number>();
  private isMatchEffectInProgress = false;
  private isAttackAnimationInProgress = false;
  private isRestoreAnimationInProgress = false;
  private isNavigationAwayInProgress = false;
  private isSceneShutDown = false;
  private pendingInitialDealTimer: Phaser.Time.TimerEvent | null = null;
  private readonly activeInitialDealTweens = new Set<Phaser.Tweens.Tween>();
  private readonly activeInitialDealCards = new Set<CardView>();

  public constructor() {
    super('GameScene');
  }

  public init(data: GameSceneInitData): void {
    this.player1Name = data.player1Name ?? 'France';
    this.player2Name = data.player2Name ?? 'Spain';
    this.player1FlagCode = data.player1FlagCode ?? 'fr';
    this.player2FlagCode = data.player2FlagCode ?? 'es';
    this.player1ControllerType = data.player1ControllerType ?? 'HUMAN';
    this.player2ControllerType = data.player2ControllerType ?? 'HUMAN';
    this.launchContext = data.launchContext ?? QUICK_MATCH_CONTEXT;
    this.matchMode = data.matchMode ?? 'quick';
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
    this.handledGoalkeeperShotEventIndexes.clear();
    this.isMatchEffectInProgress = false;
    this.isAttackAnimationInProgress = false;
    this.isRestoreAnimationInProgress = false;
    this.isNavigationAwayInProgress = false;
    this.isSceneShutDown = false;
    this.startWhistlePlayed = false;
    this.input.enabled = true;
    this.cleanupInitialDealFlow();
    this.exitConfirmModal?.destroy();
    this.exitConfirmModal = null;
    this.pauseModal?.destroy();
    this.pauseModal = null;
    this.infoModal?.destroy();
    this.infoModal = null;
    this.activeInfoModal = null;
    this.infoLanguage = getPreferredLanguage();
    this.tutorialOverlay?.destroy();
    this.tutorialOverlay = null;
    this.tutorialController = this.matchMode === 'tutorial' ? new TutorialController() : null;
  }

  public preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    queueTeamCoverLoad(this, this.player1FlagCode);
    queueTeamCoverLoad(this, this.player2FlagCode);
  }

  public create(): void {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    this.aiTurnController?.dispose();
    this.input.enabled = true;
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
      player2ControllerType: this.player2ControllerType,
      setupPreset: this.matchMode === 'tutorial' ? TUTORIAL_MATCH_V2_SETUP_PRESET : undefined
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
    const centerX = MATCH_FIELD_CENTER_X;
    const interactive = options.interactive !== false;
    const gameInteractive = interactive && !(this.aiTurnController?.isAiTurn(state) ?? false);
    const pendingRestores = this.getPendingRestoreAnimationEntries(state);
    const hiddenRestoredCards = options.hiddenRestoredCards ?? (interactive ? pendingRestores : undefined);

    if (options.hideActiveTurnBall === true) {
      clearDeckTurnBallMarker(this);
    }

    this.dynamicLayer?.destroy();
    this.dynamicLayer = this.add.container(0, 0);

    this.dynamicLayer.add(
      new FieldView(this, centerX, FIELD_CENTER_Y, state, (positionId) => this.selectTarget(positionId), {
        hiddenCards: hiddenRestoredCards,
        interactive: gameInteractive,
        onMidfielderCommit: (positionId) => this.commitMidfielder(positionId),
        onOwnMidfielderSelect:
          this.tutorialController === null || this.tutorialController.isComplete()
            ? undefined
            : (positionId) => this.commitMidfielder(positionId),
        onMidfieldGapSelect: (positionId) => this.useMidfieldGap(positionId)
      })
    );
    const matchControls = createMatchControlButtons({
      scene: this,
      onPause: () => this.openPauseModal(state),
      onRules: () => this.openMatchInfoModal('rules')
    });
    this.dynamicLayer.add([matchControls.pauseButton, matchControls.rulesButton]);
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
        state.players[1].goals
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
      new AdvantageView(this, centerX, ADVANTAGE_CENTER_Y, {
        advantage: getTeamAdvantage(state)
      })
    );
    this.addTeamStats(state);
    this.recordTutorialTargetLine(state);
    this.refreshTutorialOverlay(state);

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
    const drawAction = this.createTutorialDrawAction(engine.getState());

    if (!this.allowTutorialAction(drawAction)) {
      return;
    }

    const previousLogLength = engine.getState().log.length;
    const state = engine.drawAttackCard();

    if (state.phase === 'GAME_OVER') {
      this.openResult(state);
      return;
    }

    this.recordTutorialAction({
      type: 'draw-attack-card',
      rank: state.attackCard?.rank ?? drawAction.rank
    });
    this.recordTutorialEvents(state, previousLogLength);
    this.render(state);
  }

  private commitMidfielder(positionId: MidfielderPositionId): void {
    const engine = this.requireEngine();
    const midfielderAction = this.createTutorialCommitMidfielderAction(engine.getState(), positionId);

    if (!this.allowTutorialAction(midfielderAction)) {
      return;
    }

    if (!engine.canCommitMidfielder(positionId)) {
      return;
    }

    const animationContext = this.createMidfielderCommitAnimationContext(positionId);
    const previousLogLength = engine.getState().log.length;
    let state: GameState;

    try {
      state = engine.commitMidfielder(positionId);
    } catch (error) {
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Invalid midfielder.');
      return;
    }

    this.recordTutorialAction(midfielderAction);
    this.recordTutorialEvents(state, previousLogLength);

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
    const gapAction = this.createTutorialMidfieldGapAction(positionId);

    if (!this.allowTutorialAction(gapAction)) {
      return;
    }

    const animationContext = this.createMidfieldGapAnimationContext(positionId);
    const previousLogLength = engine.getState().log.length;
    let state: GameState;

    try {
      state = engine.useMidfieldGap(positionId);
    } catch (error) {
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Invalid midfield gap.');
      return;
    }

    this.recordTutorialAction(gapAction);
    this.recordTutorialEvents(state, previousLogLength);

    if (animationContext !== null) {
      this.animateAttackSelection(state, animationContext, 'defeat', () => this.handleSelectedTargetState(state));
      return;
    }

    this.handleSelectedTargetState(state);
  }

  private selectTarget(positionId: FieldPositionId): void {
    const engine = this.requireEngine();
    const targetAction = this.createTutorialTargetAction(engine.getState(), positionId);

    if (!this.allowTutorialAction(targetAction)) {
      return;
    }

    const animationContext = this.createAttackAnimationContext(positionId);
    const previousLogLength = engine.getState().log.length;
    let state: GameState;

    try {
      state = engine.selectTarget(positionId);
    } catch (error) {
      this.showTemporaryMessage(error instanceof Error ? error.message : 'Invalid target.');
      return;
    }

    this.recordTutorialAction(targetAction);
    const animationOutcome = getAttackAnimationOutcome(state, positionId);
    const deferTutorialGoalEvent =
      animationContext !== null &&
      animationOutcome === 'goal' &&
      this.tutorialController !== null &&
      !this.tutorialController.isComplete();

    if (!deferTutorialGoalEvent) {
      this.recordTutorialEvents(state, previousLogLength);
    }

    if (animationContext !== null) {
      this.animateAttackSelection(
        state,
        animationContext,
        animationOutcome,
        () => this.handleSelectedTargetState(state),
        deferTutorialGoalEvent
          ? () => {
              this.recordTutorialEvents(state, previousLogLength);
              this.refreshTutorialOverlay(state);
            }
          : undefined
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
      const goalEffect = getNextGoalScoredSceneEffect(state.log, this.handledGoalkeeperShotEventIndexes);
      const hiddenRestoredCards = this.getPendingRestoreAnimationEntries(state);

      if (goalEffect !== null) {
        this.handledGoalkeeperShotEventIndexes.add(goalEffect.eventIndex);
        this.render(state, { hiddenRestoredCards, interactive: false });
        this.isMatchEffectInProgress = true;
        this.playSceneEffectSound(goalEffect);
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

  private allowTutorialAction(action: TutorialAction): boolean {
    const result = this.tutorialController?.checkAction(action) ?? { allowed: true };

    if (result.allowed) {
      return true;
    }

    this.showTemporaryMessage(getTutorialText(this.infoLanguage, result.messageKey));
    return false;
  }

  private blockTutorialUnsupportedAction(): boolean {
    const step = this.tutorialController?.getCurrentStep();

    if (step === undefined || step === null || this.tutorialController?.isComplete() === true) {
      return false;
    }

    if (step.waitFor === 'line-reached') {
      return false;
    }

    this.showTemporaryMessage(
      getTutorialText(this.infoLanguage, step.waitFor === 'next' ? 'tutorial.guard.pressContinue' : 'tutorial.guard.tryCard')
    );
    return true;
  }

  private recordTutorialAction(action: TutorialAction): void {
    this.tutorialController?.recordAction(action);
  }

  private recordTutorialEvents(state: Readonly<GameState>, previousLogLength: number): void {
    this.tutorialController?.recordEvents(state.log.slice(previousLogLength));
  }

  private recordTutorialTargetLine(state: Readonly<GameState>): void {
    const controller = this.tutorialController;

    if (controller === null || controller.isComplete()) {
      return;
    }

    const activePlayer = state.players.find((player) => player.id === state.activePlayerId);
    const opponent = activePlayer === undefined ? undefined : state.players.find((player) => player.id !== activePlayer.id);

    controller.recordTargetLine(opponent === undefined ? null : getCurrentTargetLine(opponent.field));
  }

  private refreshTutorialOverlay(state: Readonly<GameState>): void {
    this.tutorialOverlay?.destroy();
    this.tutorialOverlay = null;

    const step = this.tutorialController?.getCurrentStep();

    if (step === undefined || step === null) {
      return;
    }

    this.tutorialOverlay = new TutorialOverlay(this, {
      step,
      language: this.infoLanguage,
      highlightRects: this.getTutorialHighlightRects(state, step.highlight ?? []),
      onContinue: () => this.continueTutorial(),
      onLanguageChange: (language) => this.switchTutorialLanguage(language)
    });
  }

  private continueTutorial(): void {
    if (this.tutorialController?.continue() !== true || this.engine === null) {
      return;
    }

    this.render(this.engine.getState());
  }

  private switchTutorialLanguage(language: AboutLanguage): void {
    this.infoLanguage = language;
    setPreferredLanguage(language);

    if (this.engine !== null) {
      this.refreshTutorialOverlay(this.engine.getState());
    }
  }

  private getTutorialHighlightRects(
    state: Readonly<GameState>,
    targets: readonly TutorialHighlightTarget[]
  ): TutorialHighlightRect[] {
    return targets.flatMap((target) => {
      const rect = this.getTutorialHighlightRect(state, target);

      return rect === null ? [] : [rect];
    });
  }

  private getTutorialHighlightRect(
    state: Readonly<GameState>,
    target: TutorialHighlightTarget
  ): TutorialHighlightRect | null {
    if (target.type === 'own-midfielder' || target.type === 'opponent-midfielder') {
      const owner = target.type === 'own-midfielder' ? 'active' : 'opponent';
      return this.getTutorialHighlightRect(state, {
        type: 'field-card',
        owner,
        positionId: getMidfielderPositionId(target.slot),
        rank: target.rank
      });
    }

    if (target.type === 'open-zone') {
      const playerId = this.getTutorialTargetPlayerId(state, target.owner);

      if (playerId === null) {
        return null;
      }

      const position = getFieldCardPosition(
        SCENE_WIDTH / 2,
        FIELD_CENTER_Y,
        state,
        playerId,
        getMidfielderPositionId(target.slot)
      );

      return {
        x: position.x,
        y: position.y,
        width: CARD_WIDTH * MATCH_CARD_SCALE,
        height: CARD_HEIGHT * MATCH_CARD_SCALE
      };
    }

    if (target.type === 'active-deck') {
      const activePlayerId = state.activePlayerId;

      if (activePlayerId === null) {
        return null;
      }

      return {
        x: getPlayerDeckX(state, activePlayerId),
        y: DECK_Y,
        width: CARD_WIDTH * MATCH_CARD_SCALE + 28,
        height: CARD_HEIGHT * MATCH_CARD_SCALE + 28
      };
    }

    if (target.type === 'attack-card') {
      const cardView = findCardView(
        this.dynamicLayer,
        (candidate) => candidate.getData('attackDeckSourcePlayerId') === state.activePlayerId
      );

      if (cardView !== null) {
        const position = getCardViewWorldCenter(cardView);

        return {
          x: position.x,
          y: position.y,
          width: CARD_WIDTH * MATCH_CARD_SCALE,
          height: CARD_HEIGHT * MATCH_CARD_SCALE
        };
      }

      return state.activePlayerId === null
        ? null
        : {
            x: getPlayerDeckX(state, state.activePlayerId),
            y: DECK_Y,
            width: CARD_WIDTH * MATCH_CARD_SCALE,
            height: CARD_HEIGHT * MATCH_CARD_SCALE
          };
    }

    const playerId = this.getTutorialTargetPlayerId(state, target.owner);

    if (playerId === null) {
      return null;
    }

    const cardView = this.findFieldCardView(playerId, target.positionId as FieldPositionId);
    const position =
      cardView === null
        ? getFieldCardPosition(SCENE_WIDTH / 2, FIELD_CENTER_Y, state, playerId, target.positionId as FieldPositionId)
        : getCardViewWorldCenter(cardView);

    return {
      x: position.x,
      y: position.y,
      width: CARD_WIDTH * MATCH_CARD_SCALE,
      height: CARD_HEIGHT * MATCH_CARD_SCALE
    };
  }

  private getTutorialTargetPlayerId(state: Readonly<GameState>, owner: 'active' | 'opponent'): Player['id'] | null {
    const activePlayerId = state.activePlayerId;

    if (activePlayerId === null) {
      return null;
    }

    if (owner === 'active') {
      return activePlayerId;
    }

    return state.players.find((player) => player.id !== activePlayerId)?.id ?? null;
  }

  private createTutorialDrawAction(state: Readonly<GameState>): Extract<TutorialAction, { type: 'draw-attack-card' }> {
    const activePlayer = state.players.find((player) => player.id === state.activePlayerId);

    return {
      type: 'draw-attack-card',
      rank: activePlayer?.deck.cards[0]?.rank
    };
  }

  private createTutorialTargetAction(state: Readonly<GameState>, positionId: FieldPositionId): TutorialAction {
    const activePlayer = state.players.find((player) => player.id === state.activePlayerId);
    const opponent = activePlayer === undefined ? undefined : state.players.find((player) => player.id !== activePlayer.id);
    const targetCard = opponent?.field[positionId] ?? null;

    return {
      type: 'select-target',
      positionId,
      rank: targetCard?.rank
    };
  }

  private createTutorialCommitMidfielderAction(
    state: Readonly<GameState>,
    positionId: MidfielderPositionId
  ): TutorialAction {
    const activePlayer = state.players.find((player) => player.id === state.activePlayerId);
    const card = activePlayer?.field[positionId] ?? null;

    return {
      type: 'commit-midfielder',
      positionId,
      slot: getMidfielderSlot(positionId),
      rank: card?.rank
    };
  }

  private createTutorialMidfieldGapAction(positionId: MidfielderPositionId): TutorialAction {
    return {
      type: 'use-midfield-gap',
      positionId,
      slot: getMidfielderSlot(positionId)
    };
  }

  private addTeamStats(state: Readonly<GameState>): void {
    if (this.dynamicLayer === null) {
      return;
    }

    const [playerOneStats, playerTwoStats] = getMatchStats(state);

    this.dynamicLayer.add(
      new TeamStatsView(this, MATCH_SIDE_PANEL_LEFT_X, MATCH_SIDE_PANEL_CENTER_Y, {
        align: 'left',
        scorers: playerOneStats.scorers.map(formatGoalScorerMatchLabel)
      })
    );
    this.dynamicLayer.add(
      new TeamStatsView(this, MATCH_SIDE_PANEL_RIGHT_X, MATCH_SIDE_PANEL_CENTER_Y, {
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

    const leaveButton = new Button(this, -125, 76, 'Menu', () => this.exitToMainMenu());
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
    if (
      this.isTutorialBlockingSystemUi() ||
      this.pauseModal !== null ||
      this.infoModal !== null ||
      this.exitConfirmModal !== null
    ) {
      return;
    }

    this.pauseModal = createMatchPauseOverlay(this, [
      {
        label: 'Sim',
        onClick: () => {
          this.closePauseModal();
          this.simulatePausedMatch(state);
        }
      },
      { label: 'Continue', onClick: () => this.closePauseModal() },
      {
        label: 'Exit to Menu',
        onClick: () => {
          this.closePauseModal();
          this.openExitConfirmModal();
        }
      }
    ], { state });
  }

  private closePauseModal(): void {
    this.pauseModal?.destroy();
    this.pauseModal = null;

    if (this.engine !== null && this.isSceneStableForAi()) {
      this.aiTurnController?.requestTurnCheck('STATE_RENDERED');
    }
  }

  private openMatchInfoModal(kind: InfoModalKind): void {
    if (
      (kind === 'rules' && this.isTutorialBlockingSystemUi()) ||
      this.infoModal !== null ||
      this.pauseModal !== null
    ) {
      return;
    }

    this.activeInfoModal = kind;
    if (kind === 'rules') {
      this.infoModal = createMatchRulesOverlay({
        scene: this,
        language: this.infoLanguage,
        languages: ABOUT_LANGUAGES,
        content: RULES_CONTENT,
        onClose: () => this.closeMatchInfoModal(),
        onLanguageChange: (language) => this.switchMatchInfoLanguage(language)
      });
      return;
    }

    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const aboutContent = ABOUT_CONTENT[this.infoLanguage];
    const titleText = aboutContent.title;
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

    const viewport = this.createMatchAboutViewport(aboutContent);

    panel.add([background, backButton, languageSelector, title, subtitle, author, viewport]);
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
    setPreferredLanguage(language);
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
    const popDuration = isShotOutcomeTone ? 220 : 0;
    const fadeDelay = isShotOutcomeTone ? 520 : 0;
    const fadeDuration = isShotOutcomeTone ? 1900 : 900;

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
      .setOrigin(0.5)
      .setDepth(FLYING_MESSAGE_DEPTH);

    const startFadeTween = (): void => {
      this.tweens.add({
        targets: text,
        y: text.y - 82,
        alpha: 0,
        delay: fadeDelay,
        duration: fadeDuration,
        ease: 'Sine.easeOut',
        onComplete: () => {
          text.destroy();
          onComplete?.();
        }
      });
    };

    if (isShotOutcomeTone) {
      text.setAlpha(0);
      text.setScale(0.82);
      this.tweens.add({
        targets: text,
        alpha: 1,
        scale: 1.08,
        duration: popDuration,
        ease: 'Back.easeOut',
        onComplete: () => startFadeTween()
      });
      return;
    }

    startFadeTween();
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
    onComplete: () => void,
    onEffectStarted?: () => void
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
      this.playGoalkeeperShotBallFlight(
        state,
        context,
        target,
        outcome,
        () => this.finishAttackAnimationSequence(onComplete),
        onEffectStarted
      );
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
    onComplete: () => void,
    onEffectStarted?: () => void
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
        onComplete,
        onEffectStarted
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
    onEffectStarted?: () => void;
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
          options.onEffectStarted,
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
    onEffectStarted: (() => void) | undefined,
    onComplete: () => void
  ): void {
    const shotEffect = getGoalkeeperShotSceneEffect(outcome);
    const shotEventIndex = getGoalkeeperShotEventIndex(this.requireEngine().getState().log, outcome);
    const shouldStartImpactEffects = claimGoalkeeperShotImpactEvent(
      this.handledGoalkeeperShotEventIndexes,
      shotEventIndex
    );

    if (shouldStartImpactEffects) {
      this.playSceneEffectSound(shotEffect);
      this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);
      this.showGoalkeeperShotTargetImpact(target, outcome);
      onEffectStarted?.();
    }

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
    const goalAnimation = getGoalkeeperGoalAnimation(target, activeOnLeft ? 'right' : 'left');

    if (goalkeeperImpactCard !== null) {
      this.tweens.add({
        targets: goalkeeperImpactCard,
        x: goalAnimation.target.x,
        y: goalAnimation.target.y,
        angle: goalAnimation.angle,
        scale: goalAnimation.scale,
        alpha: goalAnimation.alpha,
        duration: goalAnimation.duration,
        ease: goalAnimation.ease
      });
    }

    this.tweens.add({
      targets: ball,
      x: goalAnimation.target.x,
      y: goalAnimation.target.y,
      angle: ball.angle + goalAnimation.angle,
      alpha: 0,
      scaleX: baseScaleX * 0.35,
      scaleY: baseScaleY * 0.35,
      duration: goalAnimation.duration,
      ease: goalAnimation.ease,
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

  private playSceneEffectSound(effect: GoalkeeperShotSceneEffect | GoalScoredSceneEffect): boolean {
    return playSoundSafe(this, effect.soundKey, { volume: 0.72 });
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
    if (!this.canRunInitialDealStep()) {
      this.isRestoreAnimationInProgress = false;
      return;
    }

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
    this.activeInitialDealCards.add(card);

    let dealTween: Phaser.Tweens.Tween;
    dealTween = this.tweens.add({
      targets: card,
      x: target.x,
      y: target.y,
      scale: MATCH_CARD_SCALE,
      alpha: 1,
      rotation: 0,
      duration: 420,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.activeInitialDealTweens.delete(dealTween);
        this.activeInitialDealCards.delete(card);
        card.destroy();

        if (!this.canRunInitialDealStep()) {
          this.isRestoreAnimationInProgress = false;
          return;
        }

        this.animatedRestoreCount += 1;

        const hiddenRestoredCards = entries.slice(index + 1);

        if (hiddenRestoredCards.length > 0) {
          this.render(state, {
            hiddenRestoredCards,
            interactive: false
          });
          this.scheduleInitialDealDelayedCall(45, () => this.animateRestoredCards(state, entries, index + 1));
          return;
        }

        this.isRestoreAnimationInProgress = false;
        this.render(state);
      }
    });
    this.activeInitialDealTweens.add(dealTween);
  }

  private isSceneStableForAi(): boolean {
    return (
      this.input.enabled &&
      !this.isNavigationAwayInProgress &&
      !this.isSceneShutDown &&
      this.exitConfirmModal === null &&
      this.pauseModal === null &&
      this.infoModal === null &&
      (this.tutorialController === null || this.tutorialController.isComplete()) &&
      !this.isAttackAnimationInProgress &&
      !this.isRestoreAnimationInProgress &&
      !this.isMatchEffectInProgress
    );
  }

  private canRunInitialDealStep(): boolean {
    return this.sys.isActive() && this.engine !== null && !this.isSceneShutDown && !this.isNavigationAwayInProgress;
  }

  private scheduleInitialDealDelayedCall(delayMs: number, callback: () => void): void {
    this.pendingInitialDealTimer?.remove(false);
    this.pendingInitialDealTimer = this.time.delayedCall(delayMs, () => {
      this.pendingInitialDealTimer = null;

      if (!this.canRunInitialDealStep()) {
        return;
      }

      callback();
    });
  }

  private cleanupInitialDealFlow(): void {
    this.pendingInitialDealTimer?.remove(false);
    this.pendingInitialDealTimer = null;

    for (const tween of this.activeInitialDealTweens) {
      tween.stop();
    }
    this.activeInitialDealTweens.clear();

    for (const card of this.activeInitialDealCards) {
      card.destroy();
    }
    this.activeInitialDealCards.clear();
    this.isRestoreAnimationInProgress = false;
  }

  private isTutorialBlockingSystemUi(): boolean {
    return (
      this.matchMode === 'tutorial' &&
      this.tutorialController !== null &&
      !this.tutorialController.isComplete()
    );
  }

  private prepareToLeaveMatchScene(): void {
    if (this.isNavigationAwayInProgress) {
      return;
    }

    this.isNavigationAwayInProgress = true;
    this.cleanupInitialDealFlow();
    this.exitConfirmModal?.destroy();
    this.exitConfirmModal = null;
    this.pauseModal?.destroy();
    this.pauseModal = null;
    this.infoModal?.destroy();
    this.infoModal = null;
    this.activeInfoModal = null;
    this.message?.destroy();
    this.message = null;
    this.tutorialOverlay?.destroy();
    this.tutorialOverlay = null;
    this.input.enabled = true;
    clearDeckTurnBallMarker(this);
    this.aiTurnController?.dispose();
  }

  private exitToMainMenu(): void {
    this.prepareToLeaveMatchScene();
    this.scene.start('MenuScene');
  }

  private openResult(state: Readonly<GameState>): void {
    this.prepareToLeaveMatchScene();
    this.scene.start('ResultScene', { state, launchContext: this.launchContext });
  }

  private simulatePausedMatch(state: Readonly<GameState>): void {
    if (this.launchContext.mode !== 'tournament') {
      this.openResult(state);
      return;
    }

    this.prepareToLeaveMatchScene();
    const launchContext = this.launchContext;
    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;

    if (tournament === undefined || tournament.id !== launchContext.tournamentId) {
      this.openResult(state);
      return;
    }

    const match = tournament.matches.find((candidate) => candidate.id === launchContext.tournamentMatchId);

    if (match === undefined || match.homeTeamId === undefined || match.awayTeamId === undefined) {
      this.openResult(state);
      return;
    }

    const homeTeam = findNationalTeam(match.homeTeamId);
    const awayTeam = findNationalTeam(match.awayTeamId);

    if (homeTeam === undefined || awayTeam === undefined) {
      this.openResult(state);
      return;
    }

    let updatedTournament: TournamentState;

    try {
      updatedTournament = submitSimulatedTournamentMatch(tournament, match, homeTeam, awayTeam);
    } catch {
      this.openResult(state);
      return;
    }

    this.registry.set('currentTournament', updatedTournament);
    saveTournament(updatedTournament);

    if (updatedTournament.stage === 'complete') {
      this.scene.start('TournamentCompleteScene');
      return;
    }

    this.scene.start('TournamentHubScene', { initialTab: 'matches' });
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
    this.isSceneShutDown = true;
    this.isNavigationAwayInProgress = true;
    this.cleanupInitialDealFlow();
    this.exitConfirmModal?.destroy();
    this.exitConfirmModal = null;
    this.pauseModal?.destroy();
    this.pauseModal = null;
    this.infoModal?.destroy();
    this.infoModal = null;
    this.activeInfoModal = null;
    this.tutorialOverlay?.destroy();
    this.tutorialOverlay = null;
    this.tutorialController = null;
    this.aiTurnController?.dispose();
    this.aiTurnController = null;
    this.input.enabled = true;
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

function getMidfielderPositionId(slot: TutorialMidfielderSlot): MidfielderPositionId {
  switch (slot) {
    case 'left':
      return 'midfielder-1';
    case 'center':
      return 'midfielder-2';
    case 'right':
      return 'midfielder-3';
  }
}

function getMidfielderSlot(positionId: MidfielderPositionId): TutorialMidfielderSlot {
  switch (positionId) {
    case 'midfielder-1':
      return 'left';
    case 'midfielder-2':
      return 'center';
    case 'midfielder-3':
      return 'right';
  }
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

function getCardViewWorldCenter(cardView: CardView): { x: number; y: number } {
  const position = new Phaser.Math.Vector2();

  cardView.getWorldTransformMatrix().transformPoint(0, 0, position);
  return {
    x: position.x,
    y: position.y
  };
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
    return getGoalkeeperGoalAnimation(target, activeOnLeft ? 'right' : 'left').target;
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

function findNationalTeam(flagCode: string) {
  return NATIONAL_TEAMS.find((team) => team.flagCode === flagCode);
}

function getInfoLanguageCode(language: AboutLanguage): string {
  return getLanguageCode(language);
}
