import Phaser from 'phaser';
import {
  createPenaltyAiRandom,
  PenaltyAiController,
  type PenaltyAiAction,
  type PenaltyAiControllerSide,
  type PlayerControllerType
} from '../ai';
import { playSoundSafe } from '../audio/playSoundSafe';
import {
  getFallbackCoverTextureKey,
  markTeamCoverLoadFailed,
  queueTeamCoverLoad,
  resolveTeamCoverLoadResult
} from '../assets/teamCover';
import type { CardColor, CardRank, GoalkeeperRank } from '../cards';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getGoalkeeperKitAssetKey, getTeamKitAssetKey, type GoalkeeperKitId } from '../data/teamKits';
import { NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { getPreferredLanguage, setPreferredLanguage } from '../i18n/languageStore';
import { loadSquad } from '../services/squadStorage';
import {
  createPenaltyShootoutState,
  createTournamentPenaltyResult,
  drawPenaltyGoalkeeperCard,
  revealPenaltyAttackCard,
  saveTournament,
  submitTournamentMatchResultObject,
  takePenaltyKick,
  type PenaltyShootoutState,
  type PenaltyKickResult,
  type TournamentMatchResult,
  type TournamentState,
  type TournamentTeamId
} from '../tournament';
import { AdvantageView } from '../ui/AdvantageView';
import { Button } from '../ui/Button';
import { createCardPlayerProfile, createGoalkeeperCardProfile, getPlayerSurname } from '../ui/cardPlayerProfile';
import { CardView } from '../ui/CardView';
import { getGoalkeeperGoalAnimation } from '../ui/goalkeeperGoalAnimation';
import { MATCH_CARD_SCALE } from '../ui/matchCardScale';
import { createMatchControlButtons, MATCH_CONTROL_BUTTON_DEPTH } from '../ui/matchControlButtons';
import { MatchFieldView } from '../ui/MatchFieldView';
import { createMatchPauseOverlay } from '../ui/matchPauseOverlay';
import { createMatchRulesOverlay } from '../ui/MatchRulesOverlay';
import {
  PENALTY_ATTEMPT_LIST_TOP_Y,
  PENALTY_ATTEMPT_LIST_LEFT_X,
  PENALTY_ATTEMPT_LIST_RIGHT_X,
  PenaltyAttemptListView
} from '../ui/PenaltyAttemptListView';
import {
  createPenaltyAttemptSummaries,
  getPenaltyAttemptsForTeam
} from '../ui/penaltyAttempts';
import {
  MATCH_ADVANTAGE_CENTER_Y,
  MATCH_FIELD_CENTER_X,
  MATCH_FIELD_CENTER_Y,
  MATCH_SCOREBOARD_CENTER_X,
  MATCH_SCOREBOARD_CENTER_Y
} from '../ui/matchScreenLayout';
import { MATCH_STATS_PANEL_CENTER_Y } from '../ui/MatchStatsPanel';
import { PenaltyPauseStatsPanel } from '../ui/PenaltyPauseStatsPanel';
import { ScoreView } from '../ui/ScoreView';
import { createResultActionButtons } from '../ui/resultActionButtons';
import { ABOUT_LANGUAGES, RULES_CONTENT, type AboutLanguage } from './MenuScene';
import {
  getPenaltyImpactSceneEffect,
  type PenaltyImpactSceneEffect,
  type PenaltySceneOutcome
} from './penaltySceneEffects';

interface TournamentPenaltySceneData {
  tournamentId?: string;
  matchResult?: TournamentMatchResult;
  standalone?: boolean;
  player1ControllerType?: PlayerControllerType;
  player2ControllerType?: PlayerControllerType;
  homeControllerType?: PlayerControllerType;
  awayControllerType?: PlayerControllerType;
}

const PENALTY_GOALKEEPER_HOME_X = -490;
const PENALTY_GOALKEEPER_AWAY_X = 490;
const PENALTY_GOALKEEPER_FIELD_Y = 0;
const PENALTY_ATTACK_CARD_Y = 0;
const PENALTY_CARD_SCALE = MATCH_CARD_SCALE;
const PENALTY_SELECTED_CARD_SCALE = MATCH_CARD_SCALE;
const PENALTY_ATTACK_COLUMN_X = 92;
const PENALTY_ATTACK_CARD_GAP = 60;
const PENALTY_ATTACK_CARD_ROTATION = Math.PI / 2;
const PENALTY_STATUS_Y = 124;
const PENALTY_PHASE_MESSAGE_Y = 662;
const PENALTY_MARKER_SCORE_GAP = 54;
const SHOOTOUT_MARKER_Y = PENALTY_STATUS_Y + PENALTY_MARKER_SCORE_GAP;
const PENALTY_COMPLETE_PANEL_X = SCENE_WIDTH / 2;
export const PENALTY_COMPLETE_PANEL_TOP_Y = PENALTY_ATTEMPT_LIST_TOP_Y;
const PENALTY_COMPLETE_PANEL_WIDTH = 900;
export const PENALTY_COMPLETE_PANEL_HEIGHT = 500;
const PENALTY_COMPLETE_PANEL_Y = PENALTY_COMPLETE_PANEL_TOP_Y + PENALTY_COMPLETE_PANEL_HEIGHT / 2;
const SHOOTOUT_MARKER_COUNT = 5;
const SHOOTOUT_MARKER_GAP = 36;
const SHOOTOUT_SEPARATOR_GAP = 34;
const MATCH_STATS_VIEWPORT = {
  x: -360,
  y: -210,
  width: 720,
  height: 420
} as const;

interface PenaltyAnimationContext {
  attackerRank: CardRank;
  outcome: PenaltySceneOutcome;
  shooterSide: PenaltyShootoutState['nextShooter'];
  shooterTeamId: TournamentTeamId;
  startPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

interface InFlightPenaltyCard {
  cardIndex: number;
  shooterSide: PenaltyShootoutState['nextShooter'];
}

export class TournamentPenaltyScene extends Phaser.Scene {
  private tournamentId: string | null = null;
  private matchResult: TournamentMatchResult | null = null;
  private shootoutState: PenaltyShootoutState | null = null;
  private message: string | null = null;
  private inputLocked = false;
  private standalone = false;
  private homeControllerType: PlayerControllerType = 'HUMAN';
  private awayControllerType: PlayerControllerType = 'HUMAN';
  private penaltyAiController: PenaltyAiController | null = null;
  private pauseModal: Phaser.GameObjects.Container | null = null;
  private rulesModal: Phaser.GameObjects.Container | null = null;
  private infoLanguage: AboutLanguage = getPreferredLanguage();
  private homeCoverTextureKey = getFallbackCoverTextureKey();
  private awayCoverTextureKey = getFallbackCoverTextureKey();
  private inFlightPenaltyCard: InFlightPenaltyCard | null = null;
  private activePenaltyGoalkeeperCard: CardView | null = null;

  public constructor() {
    super('TournamentPenaltyScene');
  }

  public init(data: TournamentPenaltySceneData): void {
    this.tournamentId = data.tournamentId ?? null;
    this.matchResult = data.matchResult ?? null;
    this.shootoutState = null;
    this.message = null;
    this.inputLocked = false;
    this.standalone = data.standalone === true;
    this.homeControllerType = data.homeControllerType ?? data.player1ControllerType ?? 'HUMAN';
    this.awayControllerType = data.awayControllerType ?? data.player2ControllerType ?? 'HUMAN';
    this.pauseModal = null;
    this.rulesModal = null;
    this.infoLanguage = getPreferredLanguage();
    this.homeCoverTextureKey = getFallbackCoverTextureKey();
    this.awayCoverTextureKey = getFallbackCoverTextureKey();
    this.inFlightPenaltyCard = null;
    this.activePenaltyGoalkeeperCard = null;
    this.input.enabled = true;
  }

  public preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);

    if (this.matchResult !== null) {
      queueTeamCoverLoad(this, this.matchResult.homeTeamId);
      queueTeamCoverLoad(this, this.matchResult.awayTeamId);
    }
  }

  public create(): void {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    this.destroyPenaltyAiController();

    if (this.matchResult !== null && (this.tournamentId !== null || this.standalone)) {
      this.homeCoverTextureKey = this.resolvePenaltyCoverTextureKey(this.matchResult.homeTeamId);
      this.awayCoverTextureKey = this.resolvePenaltyCoverTextureKey(this.matchResult.awayTeamId);
      this.shootoutState = createPenaltyShootoutState({
        matchId: this.matchResult.matchId,
        homeTeamId: this.matchResult.homeTeamId,
        awayTeamId: this.matchResult.awayTeamId,
        seed: `${this.tournamentId ?? 'standalone'}:${this.matchResult.matchId}:penalties`
      });
      this.penaltyAiController = new PenaltyAiController({
        getState: () => this.shootoutState,
        getControllerType: (side) => this.getPenaltyControllerType(side),
        random: createPenaltyAiRandom(this.shootoutState.seed, 'home'),
        scheduleTimer: (delayMs, callback) => this.time.delayedCall(delayMs, callback),
        onAction: (action) => this.handlePenaltyAiAction(action)
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyPenaltyAiController, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.destroyPenaltyAiController, this);
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    this.activePenaltyGoalkeeperCard = null;

    if ((this.tournamentId === null && !this.standalone) || this.matchResult === null || this.shootoutState === null) {
      this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);
      this.renderMissingPenaltyData();
      return;
    }

    new MatchFieldView(this, MATCH_FIELD_CENTER_X, MATCH_FIELD_CENTER_Y);
    this.createPenaltyField(this.shootoutState);
    this.createPenaltyAttemptLists(this.shootoutState);
    this.createShootoutMarkers(this.shootoutState);
    this.createPenaltyMatchHeader(this.matchResult, this.shootoutState);
    this.createMatchControls();

    if (this.shootoutState.status === 'complete') {
      this.createCompletedShootoutPanel(this.matchResult);
      this.createCompletedShootoutActions();
    } else {
      this.createPenaltyStatus(this.shootoutState);
    }

    if (this.message !== null && this.shootoutState.status !== 'complete') {
      this.add
        .text(SCENE_WIDTH / 2, 690, this.message, {
          align: 'center',
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          fontStyle: '700',
          wordWrap: { width: 860 }
        })
        .setOrigin(0.5);
    }

    this.schedulePenaltyAiAction();
  }

  private renderMissingPenaltyData(): void {
    this.add
      .text(SCENE_WIDTH / 2, 300, 'Penalty shootout data is missing.', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    new Button(this, SCENE_WIDTH / 2, 420, 'Back to tournament', () => this.scene.start('TournamentHubScene'), {
      width: 300
    });
  }

  private createMatchControls(): void {
    createMatchControlButtons({
      scene: this,
      disabled: this.shootoutState?.status === 'complete',
      onPause: () => this.openPauseModal(),
      onRules: () => this.openRulesModal()
    });
  }

  private openPauseModal(): void {
    if (this.pauseModal !== null || this.rulesModal !== null || this.inputLocked || this.shootoutState?.status === 'complete') {
      return;
    }

    if (this.matchResult === null || this.shootoutState === null) {
      return;
    }

    this.penaltyAiController?.cancelPendingAction();
    const statsPanel = new PenaltyPauseStatsPanel(this, SCENE_WIDTH / 2, MATCH_STATS_PANEL_CENTER_Y, {
      matchResult: this.matchResult,
      shootoutState: this.shootoutState
    });

    this.pauseModal = createMatchPauseOverlay(this, [
      {
        label: 'Results',
        onClick: () => this.completeShootoutFromPause()
      },
      { label: 'Continue', onClick: () => this.closePauseModal() },
      {
        label: 'Exit to Menu',
        onClick: () => {
          this.closePauseModal();
          this.scene.start('MenuScene');
        }
      }
    ], { statsPanel });
  }

  private completeShootoutFromPause(): void {
    if (this.shootoutState === null || this.shootoutState.status === 'complete') {
      return;
    }

    this.pauseModal?.destroy();
    this.pauseModal = null;
    this.penaltyAiController?.cancelPendingAction();

    let simulatedState = this.shootoutState;
    const maxSimulationSteps = 300;

    try {
      for (let step = 0; simulatedState.status !== 'complete' && step < maxSimulationSteps; step += 1) {
        if (simulatedState.phase === 'selecting-goalkeeper') {
          simulatedState = drawPenaltyGoalkeeperCard(simulatedState);
        } else if (simulatedState.phase === 'selecting-attacker') {
          simulatedState = revealPenaltyAttackCard(simulatedState, 0);
        } else {
          simulatedState = takePenaltyKick(simulatedState);
        }
      }

      if (simulatedState.status !== 'complete') {
        throw new Error('Could not simulate the penalty shootout result.');
      }
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not simulate the penalty shootout result.';
      this.inputLocked = false;
      this.input.enabled = true;
      this.render();
      return;
    }

    this.shootoutState = simulatedState;
    this.penaltyAiController?.destroy();
    this.inputLocked = false;
    this.input.enabled = true;
    this.completeTournamentMatch();
    this.render();
  }

  private closePauseModal(): void {
    this.pauseModal?.destroy();
    this.pauseModal = null;
    this.schedulePenaltyAiAction();
  }

  private openRulesModal(): void {
    if (this.rulesModal !== null || this.pauseModal !== null || this.inputLocked || this.shootoutState?.status === 'complete') {
      return;
    }

    this.penaltyAiController?.cancelPendingAction();
    this.rulesModal = createMatchRulesOverlay({
      scene: this,
      language: this.infoLanguage,
      languages: ABOUT_LANGUAGES,
      content: RULES_CONTENT,
      onClose: () => this.closeRulesModal(),
      onLanguageChange: (language) => this.switchRulesLanguage(language)
    });
  }

  private closeRulesModal(): void {
    this.rulesModal?.destroy();
    this.rulesModal = null;
    this.schedulePenaltyAiAction();
  }

  private switchRulesLanguage(language: AboutLanguage): void {
    this.infoLanguage = language;
    setPreferredLanguage(language);
    this.closeRulesModal();
    this.openRulesModal();
  }

  private createPenaltyMatchHeader(matchResult: TournamentMatchResult, shootoutState: PenaltyShootoutState): void {
    const homeTeam = findTeam(matchResult.homeTeamId);
    const awayTeam = findTeam(matchResult.awayTeamId);

    new ScoreView(
      this,
      MATCH_SCOREBOARD_CENTER_X,
      MATCH_SCOREBOARD_CENTER_Y,
      homeTeam?.name ?? matchResult.homeTeamId,
      awayTeam?.name ?? matchResult.awayTeamId,
      matchResult.homeTeamId,
      matchResult.awayTeamId,
      matchResult.homeGoals,
      matchResult.awayGoals,
      {
        penaltyScore: {
          playerOne: shootoutState.homeGoals,
          playerTwo: shootoutState.awayGoals
        }
      }
    ).setDepth(MATCH_CONTROL_BUTTON_DEPTH);
    new AdvantageView(this, MATCH_SCOREBOARD_CENTER_X, MATCH_ADVANTAGE_CENTER_Y, {
      advantage: {
        playerOnePoints: 0,
        playerTwoPoints: 0,
        difference: 0,
        balance: 0,
        playerOneShare: 0.5,
        leadingPlayerId: null,
        windowStartTurn: 1,
        windowEndTurn: 1
      }
    }).setDepth(MATCH_CONTROL_BUTTON_DEPTH);
    this.add
      .text(SCENE_WIDTH / 2, PENALTY_STATUS_Y, `Penalties ${shootoutState.homeGoals}:${shootoutState.awayGoals}`, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(MATCH_CONTROL_BUTTON_DEPTH);

  }

  private createCompletedShootoutPanel(matchResult: TournamentMatchResult): void {
    const panel = this.add.container(PENALTY_COMPLETE_PANEL_X, PENALTY_COMPLETE_PANEL_Y);
    const background = this.add.rectangle(0, 0, PENALTY_COMPLETE_PANEL_WIDTH, PENALTY_COMPLETE_PANEL_HEIGHT, 0x0b2118, 0.9);
    background.setStrokeStyle(2, 0x5f9572, 0.95);
    panel.add(background);
    this.createMatchStatsPanel(panel, matchResult);
  }

  private createCompletedShootoutActions(): void {
    createResultActionButtons(
      this,
      SCENE_WIDTH / 2,
      [
        {
          label: this.standalone ? 'Play Again' : 'Continue',
          onClick: () =>
            this.standalone
              ? this.startStandalonePenaltyReplay()
              : this.scene.start(this.getCompletedShootoutReturnScene())
        },
        {
          label: 'New Match',
          onClick: () => this.scene.start('TeamSelectScene', { mode: this.standalone ? 'penalty' : 'match' })
        },
        { label: 'Menu', onClick: () => this.scene.start('MenuScene') }
      ],
      { totalWidth: PENALTY_COMPLETE_PANEL_WIDTH }
    );
  }

  private startStandalonePenaltyReplay(): void {
    if (this.matchResult === null) {
      this.scene.start('TeamSelectScene', { mode: 'penalty' });
      return;
    }

    this.scene.start('TournamentPenaltyScene', {
      standalone: true,
      matchResult: this.matchResult,
      homeControllerType: this.homeControllerType,
      awayControllerType: this.awayControllerType
    });
  }

  private createPenaltyStatus(shootoutState: PenaltyShootoutState): void {
    this.add
      .text(SCENE_WIDTH / 2, PENALTY_PHASE_MESSAGE_Y, `${getPenaltyPhaseTitle(shootoutState)}. ${getPenaltyInstruction(shootoutState)}`, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 4,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);
  }

  private createPenaltyField(shootoutState: PenaltyShootoutState): void {
    const field = this.add.container(MATCH_FIELD_CENTER_X, MATCH_FIELD_CENTER_Y);
    this.createPenaltyGoalkeeperCards(field, shootoutState);
    this.createPenaltyCardColumns(field, shootoutState);
  }

  private createPenaltyAttemptLists(shootoutState: PenaltyShootoutState): void {
    const attempts = createPenaltyAttemptSummaries(shootoutState.kicks);

    new PenaltyAttemptListView(
      this,
      PENALTY_ATTEMPT_LIST_LEFT_X,
      PENALTY_ATTEMPT_LIST_TOP_Y,
      shootoutState.homeTeamId,
      getPenaltyAttemptsForTeam(attempts, shootoutState.homeTeamId)
    );
    new PenaltyAttemptListView(
      this,
      PENALTY_ATTEMPT_LIST_RIGHT_X,
      PENALTY_ATTEMPT_LIST_TOP_Y,
      shootoutState.awayTeamId,
      getPenaltyAttemptsForTeam(attempts, shootoutState.awayTeamId)
    );
  }

  private createPenaltyGoalkeeperCards(
    field: Phaser.GameObjects.Container,
    shootoutState: PenaltyShootoutState
  ): void {
    this.createPenaltyGoalkeeperCard(field, shootoutState, shootoutState.homeTeamId, PENALTY_GOALKEEPER_HOME_X);
    this.createPenaltyGoalkeeperCard(field, shootoutState, shootoutState.awayTeamId, PENALTY_GOALKEEPER_AWAY_X);
  }

  private createPenaltyGoalkeeperCard(
    field: Phaser.GameObjects.Container,
    shootoutState: PenaltyShootoutState,
    goalkeeperTeamId: TournamentTeamId,
    x: number
  ): void {
    const goalkeeperIsActive = getGoalkeeperTeamId(shootoutState, shootoutState.nextShooter) === goalkeeperTeamId;
    const canDrawGoalkeeper = goalkeeperIsActive && shootoutState.phase === 'selecting-goalkeeper';
    const inputControlledByAi = this.isPenaltyDecisionControlledByAi(shootoutState);
    const goalkeeperRank = goalkeeperIsActive ? shootoutState.currentGoalkeeperRank : null;

    const card = this.createGoalkeeperCardView(x, PENALTY_GOALKEEPER_FIELD_Y, goalkeeperRank, goalkeeperTeamId, {
      faceDown: goalkeeperRank === null,
      highlighted: goalkeeperIsActive,
      onClick: canDrawGoalkeeper && !inputControlledByAi ? () => this.handleGoalkeeperAction() : undefined
    });

    if (goalkeeperIsActive) {
      this.activePenaltyGoalkeeperCard = card;
    }

    field.add(card);
  }

  private createPenaltyCardColumns(
    field: Phaser.GameObjects.Container,
    shootoutState: PenaltyShootoutState
  ): void {
    this.createPenaltyCardColumn(field, shootoutState, 'home', getPenaltyAttackColumnX(shootoutState, 'home'));
    this.createPenaltyCardColumn(field, shootoutState, 'away', getPenaltyAttackColumnX(shootoutState, 'away'));
  }

  private createPenaltyCardColumn(
    field: Phaser.GameObjects.Container,
    shootoutState: PenaltyShootoutState,
    shooterSide: PenaltyShootoutState['nextShooter'],
    x: number
  ): void {
    const cards = getPenaltyCardsForSide(shootoutState, shooterSide);
    const shooterTeamId = getShooterTeamId(shootoutState, shooterSide);
    const shooterColor = getSideCardColor(shooterSide);
    const canReveal = shootoutState.phase === 'selecting-attacker' && shootoutState.nextShooter === shooterSide;
    const inputControlledByAi = this.isPenaltyDecisionControlledByAi(shootoutState);
    const startY = -((cards.length - 1) * PENALTY_ATTACK_CARD_GAP) / 2;

    cards.forEach((rank, index) => {
      if (this.isPenaltyCardInFlight(shooterSide, index)) {
        return;
      }

      const localY = startY + index * PENALTY_ATTACK_CARD_GAP;
      const isRevealed = shootoutState.nextShooter === shooterSide && shootoutState.revealedAttackerCardIndex === index;
      const card = this.createAttackCardView(x, localY, rank, shooterTeamId, shooterColor, {
        faceDown: !isRevealed,
        highlighted: canReveal || isRevealed,
        onClick: canReveal && !inputControlledByAi ? () => this.handleShotAction(index) : undefined,
        scale: isRevealed ? PENALTY_SELECTED_CARD_SCALE : PENALTY_CARD_SCALE
      });

      card.setRotation(isRevealed ? 0 : PENALTY_ATTACK_CARD_ROTATION);
      field.add(card);
    });
  }

  private isPenaltyCardInFlight(
    shooterSide: PenaltyShootoutState['nextShooter'],
    cardIndex: number
  ): boolean {
    return this.inFlightPenaltyCard?.shooterSide === shooterSide && this.inFlightPenaltyCard.cardIndex === cardIndex;
  }

  private handlePenaltyAiAction(action: PenaltyAiAction): void {
    if (action.type === 'DRAW_GOALKEEPER_CARD') {
      this.handleGoalkeeperAction();
      return;
    }

    this.handleShotAction(action.cardIndex);
  }

  private handleGoalkeeperAction(): void {
    if (this.shootoutState === null || this.inputLocked) {
      return;
    }

    this.penaltyAiController?.cancelPendingAction();

    try {
      this.shootoutState = drawPenaltyGoalkeeperCard(this.shootoutState);
      this.message = null;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not draw the goalkeeper card.';
    }

    this.render();
  }

  private handleShotAction(cardIndex: number): void {
    if (this.shootoutState === null || this.inputLocked) {
      return;
    }

    this.penaltyAiController?.cancelPendingAction();

    try {
      this.shootoutState = revealPenaltyAttackCard(this.shootoutState, cardIndex);
      this.message = null;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not reveal the penalty card.';
      this.render();
      return;
    }

    this.inputLocked = true;
    this.input.enabled = false;
    this.render();
    this.time.delayedCall(420, () => this.takeKick());
  }

  private takeKick(): void {
    if (this.shootoutState === null) {
      return;
    }

    const previousState = this.shootoutState;
    const cardIndex = previousState.revealedAttackerCardIndex;

    if (cardIndex === null) {
      this.message = 'Reveal a penalty card before shooting.';
      this.render();
      return;
    }

    const selectedRank = getPenaltyCardsForSide(previousState, previousState.nextShooter)[cardIndex];

    if (selectedRank === undefined) {
      this.message = 'Selected penalty card does not exist.';
      this.render();
      return;
    }

    let nextState: PenaltyShootoutState;

    try {
      nextState = takePenaltyKick(previousState);
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not take the penalty kick.';
      this.inputLocked = false;
      this.input.enabled = true;
      this.render();
      return;
    }

    const kick = nextState.kicks[nextState.kicks.length - 1];

    if (kick === undefined) {
      this.message = 'Could not resolve the penalty kick.';
      this.inputLocked = false;
      this.input.enabled = true;
      this.render();
      return;
    }

    this.inFlightPenaltyCard = {
      cardIndex,
      shooterSide: previousState.nextShooter
    };
    this.render();

    this.animatePenaltyKick(
      {
        attackerRank: selectedRank,
        outcome: kick.outcome,
        shooterSide: previousState.nextShooter,
        shooterTeamId: kick.shooterTeamId,
        startPosition: getPenaltyAttackCardWorldPosition(previousState, cardIndex),
        targetPosition: getPenaltyGoalkeeperWorldPosition(previousState)
      },
      () => {
        this.inFlightPenaltyCard = null;
        this.shootoutState = nextState;

        if (this.shootoutState.status === 'complete') {
          this.penaltyAiController?.destroy();
          this.completeTournamentMatch();
        } else {
          this.message = null;
        }

        this.render();
      }
    );
  }

  private completeTournamentMatch(): void {
    if (this.tournamentId === null || this.matchResult === null || this.shootoutState === null) {
      if (this.standalone && this.shootoutState?.winnerTeamId !== undefined) {
        this.message = `${getTeamName(this.shootoutState.winnerTeamId)} wins on penalties.`;
      }
      return;
    }

    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;

    if (tournament === undefined || tournament.id !== this.tournamentId) {
      this.message = 'Tournament was not found. The penalty result could not be saved.';
      return;
    }

    try {
      const penaltyResult = createTournamentPenaltyResult(this.shootoutState);
      const penaltyShootout = {
        ...penaltyResult,
        attempts: createPenaltyAttemptSummaries(penaltyResult.kicks)
      };
      const updatedTournament = submitTournamentMatchResultObject(tournament, {
        ...this.matchResult,
        winnerTeamId: penaltyShootout.winnerTeamId,
        penaltyShootout
      });

      this.registry.set('currentTournament', updatedTournament);
      saveTournament(updatedTournament);
      this.message = `${getTeamName(penaltyShootout.winnerTeamId)} wins on penalties.`;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not save the penalty shootout.';
    }
  }

  private getCompletedShootoutReturnScene(): string {
    if (this.standalone) {
      return 'MenuScene';
    }

    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;

    return tournament?.stage === 'complete' ? 'TournamentCompleteScene' : 'TournamentHubScene';
  }

  private createShootoutMarkers(shootoutState: PenaltyShootoutState): void {
    const markers = this.add.container(SCENE_WIDTH / 2, SHOOTOUT_MARKER_Y);
    const homeKicks = getPenaltyKicksForTeam(shootoutState, shootoutState.homeTeamId);
    const awayKicks = getPenaltyKicksForTeam(shootoutState, shootoutState.awayTeamId);
    
    // Always show 5 markers for each team
    const homeMarkerCount = SHOOTOUT_MARKER_COUNT;
    const awayMarkerCount = SHOOTOUT_MARKER_COUNT;
    const homeWidth = getPenaltyMarkerRowWidth(homeMarkerCount);
    const awayWidth = getPenaltyMarkerRowWidth(awayMarkerCount);
    const totalWidth = homeWidth + SHOOTOUT_SEPARATOR_GAP * 2 + awayWidth;
    const homeStartX = -totalWidth / 2;
    const separatorX = homeStartX + homeWidth + SHOOTOUT_SEPARATOR_GAP;
    const awayStartX = separatorX + SHOOTOUT_SEPARATOR_GAP;

    this.addPenaltyMarkerRow(markers, homeStartX, homeKicks);
    markers.add(
      this.add
        .text(separatorX, 0, '-', {
          align: 'center',
          color: '#dfeaf2',
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.addPenaltyMarkerRow(markers, awayStartX, awayKicks);
  }

  private addPenaltyMarkerRow(
    container: Phaser.GameObjects.Container,
    startX: number,
    kicks: readonly PenaltyKickResult[]
  ): void {
    // Always show 5 markers: lit ones for completed kicks, dark gray for empty slots
    for (let index = 0; index < SHOOTOUT_MARKER_COUNT; index += 1) {
      const kick = index < kicks.length ? kicks[index] : undefined;
      const x = startX + index * SHOOTOUT_MARKER_GAP;
      const marker = this.add.circle(x, 0, 13, getPenaltyMarkerFill(kick), 1);
      marker.setStrokeStyle(3, getPenaltyMarkerStroke(kick), 0.9);
      container.add(marker);
    }
  }

  private createMatchStatsPanel(panel: Phaser.GameObjects.Container, matchResult: TournamentMatchResult): void {
    const content = this.add.container(0, MATCH_STATS_VIEWPORT.y);
    let contentHeight = 0;
    content.add(
      this.add
        .text(0, contentHeight, 'Match stats', {
          align: 'center',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          fontStyle: '700'
        })
        .setOrigin(0.5, 0)
    );
    contentHeight += 52;
    const rows: Array<[string, number, number]> = [
      ['Goals', matchResult.teamStats.home.goals, matchResult.teamStats.away.goals],
      ['Shots', matchResult.teamStats.home.shots, matchResult.teamStats.away.shots],
      ['GK saves', matchResult.teamStats.home.goalkeeperSaves, matchResult.teamStats.away.goalkeeperSaves]
    ];

    rows.forEach(([label, homeValue, awayValue], index) => {
      const y = contentHeight + index * 38;
      content.add(this.createStatsValue(-220, y, String(homeValue)));
      content.add(this.createStatsLabel(0, y, label));
      content.add(this.createStatsValue(220, y, String(awayValue)));
    });

    contentHeight += rows.length * 38 + 18;
    const homeGoalscorers = formatMatchGoalscorers(matchResult, matchResult.homeTeamId);
    const awayGoalscorers = formatMatchGoalscorers(matchResult, matchResult.awayTeamId);
    content.add(this.createStatsSectionTitle(contentHeight, 'Goalscorers'));
    contentHeight += 30;
    content.add(this.createStatsDetailColumn(-330, contentHeight, homeGoalscorers));
    content.add(this.createStatsDetailColumn(30, contentHeight, awayGoalscorers));
    contentHeight += Math.max(getDetailLineCount(homeGoalscorers), getDetailLineCount(awayGoalscorers)) * 22 + 18;

    const maxScroll = Math.max(0, contentHeight - MATCH_STATS_VIEWPORT.height);
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(
        PENALTY_COMPLETE_PANEL_X + MATCH_STATS_VIEWPORT.x,
        PENALTY_COMPLETE_PANEL_Y + MATCH_STATS_VIEWPORT.y,
        MATCH_STATS_VIEWPORT.width,
        MATCH_STATS_VIEWPORT.height
      )
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(0, MATCH_STATS_VIEWPORT.y + MATCH_STATS_VIEWPORT.height / 2, MATCH_STATS_VIEWPORT.width, MATCH_STATS_VIEWPORT.height)
      .setInteractive();

    panel.add([content, scrollZone]);

    if (maxScroll > 0) {
      const trackX = MATCH_STATS_VIEWPORT.x + MATCH_STATS_VIEWPORT.width + 16;
      const track = this.add.rectangle(
        trackX,
        MATCH_STATS_VIEWPORT.y + MATCH_STATS_VIEWPORT.height / 2,
        4,
        MATCH_STATS_VIEWPORT.height,
        0x5f9572,
        0.28
      );
      const thumbHeight = Math.max(28, (MATCH_STATS_VIEWPORT.height / contentHeight) * MATCH_STATS_VIEWPORT.height);
      const thumb = this.add.rectangle(trackX, MATCH_STATS_VIEWPORT.y + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
      let scrollY = 0;

      const setScroll = (value: number): void => {
        scrollY = Phaser.Math.Clamp(value, 0, maxScroll);
        content.y = MATCH_STATS_VIEWPORT.y - scrollY;
        thumb.y =
          MATCH_STATS_VIEWPORT.y +
          thumbHeight / 2 +
          (scrollY / maxScroll) * (MATCH_STATS_VIEWPORT.height - thumbHeight);
      };

      scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        setScroll(scrollY + deltaY * 0.35);
      });
      panel.add([track, thumb]);
    }
  }

  private createStatsLabel(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        align: 'center',
        color: '#a9c7b3',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createStatsValue(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createStatsSectionTitle(y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(0, y, text, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5, 0);
  }

  private createStatsDetailColumn(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text === '' ? '-' : text, {
        align: 'left',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        lineSpacing: 4,
        wordWrap: { width: 300 }
      })
      .setOrigin(0, 0);
  }

  private createAttackCardView(
    x: number,
    y: number,
    rank: CardRank,
    teamId: TournamentTeamId,
    color: CardColor,
    options: { faceDown?: boolean; highlighted?: boolean; onClick?: () => void; scale?: number } = {}
  ): CardView {
    const squad = loadSquad(teamId);
    const card = new CardView(this, x, y, {
      rank,
      color,
      faceDown: options.faceDown,
      highlighted: options.highlighted,
      coverTextureKey: this.getCoverTextureKey(teamId),
      kitTextureKey: getTeamKitAssetKey(teamId, 'home'),
      onClick: options.onClick,
      playerProfile: options.faceDown === true ? undefined : createCardPlayerProfile(teamId, squad.fieldPlayers[rank]),
      tooltipEnabled: false
    });

    card.setScale(options.scale ?? MATCH_CARD_SCALE);
    return card;
  }

  private createGoalkeeperCardView(
    x: number,
    y: number,
    rank: GoalkeeperRank | null,
    teamId: TournamentTeamId,
    options: { faceDown?: boolean; highlighted?: boolean; onClick?: () => void; scale?: number } = {}
  ): CardView {
    const squad = loadSquad(teamId);
    const goalkeeper = squad.goalkeeper;
    const card = new CardView(this, x, y, {
      rank: rank ?? 'GK',
      color: getTeamSideColor(this.shootoutState, teamId),
      faceDown: options.faceDown,
      highlighted: options.highlighted,
      coverTextureKey: this.getCoverTextureKey(teamId),
      kitTextureKey: getGoalkeeperKitAssetKey(getGoalkeeperKitId(teamId, this.shootoutState)),
      label: 'GK',
      onClick: options.onClick,
      playerProfile: options.faceDown === true || rank === null ? undefined : createGoalkeeperCardProfile(teamId, goalkeeper, rank),
      tooltipEnabled: false
    });

    card.setScale(options.scale ?? MATCH_CARD_SCALE);
    return card;
  }

  private handleLoadError(file: Phaser.Loader.File): void {
    markTeamCoverLoadFailed(file.key);
  }

  private resolvePenaltyCoverTextureKey(teamId: TournamentTeamId): string {
    return resolveTeamCoverLoadResult(this.textures, teamId).textureKey;
  }

  private getCoverTextureKey(teamId: TournamentTeamId): string {
    if (this.shootoutState !== null && teamId === this.shootoutState.homeTeamId) {
      return this.homeCoverTextureKey;
    }

    if (this.shootoutState !== null && teamId === this.shootoutState.awayTeamId) {
      return this.awayCoverTextureKey;
    }

    return getFallbackCoverTextureKey();
  }

  private animatePenaltyKick(context: PenaltyAnimationContext, onComplete: () => void): void {
    const target = context.targetPosition;
    const card = this.createAttackCardView(
      context.startPosition.x,
      context.startPosition.y,
      context.attackerRank,
      context.shooterTeamId,
      getSideCardColor(context.shooterSide),
      { scale: PENALTY_SELECTED_CARD_SCALE }
    );
    card.setDepth(1000);
    card.setRotation(0);

    this.tweens.add({
      targets: card,
      x: target.x,
      y: target.y,
      scale: 0.84,
      rotation: context.shooterSide === 'home' ? -0.06 : 0.06,
      duration: 340,
      ease: 'Cubic.easeIn',
      onComplete: () => this.finishPenaltyKickAnimation(card, target, context.outcome, context.shooterSide, onComplete)
    });
  }

  private finishPenaltyKickAnimation(
    card: CardView,
    target: { x: number; y: number },
    outcome: PenaltySceneOutcome,
    shooterSide: PenaltyShootoutState['nextShooter'],
    onComplete: () => void
  ): void {
    let cardAnimationComplete = false;
    let goalkeeperAnimationComplete = outcome !== 'goal';
    let impactMessageComplete = false;
    let resultFlowContinued = false;
    const continueResultFlow = (): void => {
      if (!cardAnimationComplete || !goalkeeperAnimationComplete || !impactMessageComplete || resultFlowContinued) {
        return;
      }

      resultFlowContinued = true;
      onComplete();
    };

    this.showPenaltyImpact(target.x, target.y, outcome, () => {
      impactMessageComplete = true;
      continueResultFlow();
    });

    if (outcome === 'goal') {
      this.animatePenaltyGoalkeeperDefeat(() => {
        goalkeeperAnimationComplete = true;
        continueResultFlow();
      });
    }

    if (outcome === 'post' || outcome === 'save') {
      const reboundX = target.x + (shooterSide === 'home' ? -180 : 180);
      const reboundY = outcome === 'post' ? target.y - 116 : target.y + 82;

      this.tweens.add({
        targets: card,
        x: reboundX,
        y: reboundY,
        alpha: 0,
        rotation: shooterSide === 'home' ? -0.7 : 0.7,
        duration: 260,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          card.destroy();
          cardAnimationComplete = true;
          continueResultFlow();
        }
      });
      return;
    }

    this.tweens.add({
      targets: card,
      alpha: 0,
      scale: 1.08,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => {
        card.destroy();
        cardAnimationComplete = true;
        continueResultFlow();
      }
    });
  }

  private animatePenaltyGoalkeeperDefeat(onComplete: () => void): void {
    const goalkeeperCard = this.activePenaltyGoalkeeperCard;

    if (goalkeeperCard === null || !goalkeeperCard.active) {
      onComplete();
      return;
    }

    this.activePenaltyGoalkeeperCard = null;
    const goalkeeperSide = goalkeeperCard.x < 0 ? 'left' : 'right';
    const goalAnimation = getGoalkeeperGoalAnimation(goalkeeperCard, goalkeeperSide);

    this.tweens.add({
      targets: goalkeeperCard,
      x: goalAnimation.target.x,
      y: goalAnimation.target.y,
      alpha: goalAnimation.alpha,
      angle: goalAnimation.angle,
      scale: goalAnimation.scale,
      duration: goalAnimation.duration,
      ease: goalAnimation.ease,
      onComplete: () => {
        goalkeeperCard.destroy();
        onComplete();
      }
    });
  }

  private showPenaltyImpact(
    x: number,
    y: number,
    outcome: PenaltySceneOutcome,
    onMessageComplete: () => void
  ): void {
    const effect = getPenaltyImpactSceneEffect(outcome);

    this.playPenaltyImpactSound(effect);
    this.showPenaltyOutcome(effect, onMessageComplete);
    this.showImpactPulse(x, y, outcome);
  }

  private playPenaltyImpactSound(effect: PenaltyImpactSceneEffect): boolean {
    return playSoundSafe(this, effect.soundKey, { volume: 0.72 });
  }

  private showImpactPulse(x: number, y: number, outcome: PenaltySceneOutcome): void {
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

  private showPenaltyOutcome(effect: PenaltyImpactSceneEffect, onComplete: () => void): void {
    this.showFlyingMessage(effect.flyingMessage, effect.flyingMessageTone, onComplete);
  }

  private showFlyingMessage(message: string, tone: PenaltySceneOutcome, onComplete: () => void): void {
    const fontSize = tone === 'goal' ? '76px' : '48px';
    const color = tone === 'save' ? '#ffffff' : '#f0c95a';
    const text = this.add
      .text(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 - 40, message, {
        color,
        fontFamily: tone === 'goal' || tone === 'save' ? 'Bangers, Arial, sans-serif' : 'Arial, sans-serif',
        fontSize,
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 5
      })
      .setPadding(24, 18, 24, 20)
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 82,
      alpha: 0,
      duration: tone === 'goal' || tone === 'save' ? 1900 : 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        text.destroy();
        onComplete();
        this.inputLocked = false;
        this.input.enabled = true;
        this.schedulePenaltyAiAction();
      }
    });
  }

  private schedulePenaltyAiAction(): void {
    if (this.inputLocked || this.pauseModal !== null || this.rulesModal !== null || this.shootoutState?.status === 'complete') {
      return;
    }

    this.penaltyAiController?.scheduleNextAction();
  }

  private destroyPenaltyAiController(): void {
    this.penaltyAiController?.destroy();
    this.penaltyAiController = null;
  }

  private isPenaltyDecisionControlledByAi(shootoutState: PenaltyShootoutState): boolean {
    const side = getPenaltyDecisionSide(shootoutState);

    return side !== null && this.getPenaltyControllerType(side) === 'AI';
  }

  private getPenaltyControllerType(side: PenaltyAiControllerSide): PlayerControllerType {
    return side === 'home' ? this.homeControllerType : this.awayControllerType;
  }
}

function getPenaltyDecisionSide(shootoutState: PenaltyShootoutState): PenaltyAiControllerSide | null {
  if (shootoutState.phase === 'selecting-goalkeeper') {
    return getOppositeSide(shootoutState.nextShooter);
  }

  if (shootoutState.phase === 'selecting-attacker') {
    return shootoutState.nextShooter;
  }

  return null;
}

function getPenaltyPhaseTitle(shootoutState: PenaltyShootoutState): string {
  const shooterTeamId = getShooterTeamId(shootoutState, shootoutState.nextShooter);
  const goalkeeperTeamId = getGoalkeeperTeamId(shootoutState, shootoutState.nextShooter);

  if (shootoutState.phase === 'selecting-goalkeeper') {
    return `${getTeamName(goalkeeperTeamId)} picks goalkeeper`;
  }

  if (shootoutState.phase === 'selecting-attacker') {
    return `${getTeamName(shooterTeamId)} reveals a shot card`;
  }

  return `${getTeamName(shooterTeamId)} to shoot`;
}

function getPenaltyInstruction(shootoutState: PenaltyShootoutState): string {
  if (shootoutState.phase === 'selecting-goalkeeper') {
    return 'Click the hidden goalkeeper card';
  }

  if (shootoutState.phase === 'selecting-attacker') {
    return 'Choose one hidden penalty card';
  }

  return 'Shooting...';
}

function getPenaltyAttackCardWorldPosition(
  shootoutState: PenaltyShootoutState,
  cardIndex: number
): { x: number; y: number } {
  const cards = getPenaltyCardsForSide(shootoutState, shootoutState.nextShooter);
  const localX = getPenaltyAttackColumnX(shootoutState, shootoutState.nextShooter);
  const startY = -((cards.length - 1) * PENALTY_ATTACK_CARD_GAP) / 2;
  const localY = startY + cardIndex * PENALTY_ATTACK_CARD_GAP;

  return {
    x: MATCH_FIELD_CENTER_X + localX,
    y: MATCH_FIELD_CENTER_Y + localY
  };
}

function getPenaltyAttackColumnX(
  shootoutState: PenaltyShootoutState,
  shooterSide: PenaltyShootoutState['nextShooter']
): number {
  const goalkeeperTeamId = getGoalkeeperTeamId(shootoutState, shooterSide);
  const targetX = getPenaltyTargetSideX(goalkeeperTeamId, shootoutState);

  return targetX < 0 ? -PENALTY_ATTACK_COLUMN_X : PENALTY_ATTACK_COLUMN_X;
}

function getPenaltyGoalkeeperWorldPosition(shootoutState: PenaltyShootoutState): { x: number; y: number } {
  const sideX = getPenaltyTargetSideX(getGoalkeeperTeamId(shootoutState, shootoutState.nextShooter), shootoutState);

  return {
    x: MATCH_FIELD_CENTER_X + sideX,
    y: MATCH_FIELD_CENTER_Y + PENALTY_GOALKEEPER_FIELD_Y
  };
}

function findTeam(teamId: TournamentTeamId): NationalTeam | undefined {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId);
}

function getTeamName(teamId: TournamentTeamId): string {
  return findTeam(teamId)?.name ?? teamId;
}

function getPenaltyKicksForTeam(
  shootoutState: PenaltyShootoutState,
  teamId: TournamentTeamId
): PenaltyKickResult[] {
  return shootoutState.kicks.filter((kick) => kick.shooterTeamId === teamId);
}

function getPenaltyMarkerCount(kicks: readonly PenaltyKickResult[]): number {
  return Math.max(SHOOTOUT_MARKER_COUNT, kicks.length);
}

function getPenaltyMarkerRowWidth(markerCount: number): number {
  return Math.max(0, markerCount - 1) * SHOOTOUT_MARKER_GAP;
}

function getPenaltyMarkerFill(kick: PenaltyKickResult | undefined): number {
  if (kick === undefined) {
    return 0x4e5368;
  }

  if (kick.outcome === 'goal') {
    return 0x21b34b;
  }

  return 0xc53655;
}

function getPenaltyMarkerStroke(kick: PenaltyKickResult | undefined): number {
  if (kick === undefined) {
    return 0x777c92;
  }

  if (kick.outcome === 'goal') {
    return 0x6ff08d;
  }

  return 0xff6a7e;
}

function getShooterTeamId(
  shootoutState: PenaltyShootoutState,
  side: PenaltyShootoutState['nextShooter']
): TournamentTeamId {
  return side === 'home' ? shootoutState.homeTeamId : shootoutState.awayTeamId;
}

function getGoalkeeperTeamId(
  shootoutState: PenaltyShootoutState,
  shooterSide: PenaltyShootoutState['nextShooter']
): TournamentTeamId {
  return shooterSide === 'home' ? shootoutState.awayTeamId : shootoutState.homeTeamId;
}

function getOppositeSide(side: PenaltyShootoutState['nextShooter']): PenaltyShootoutState['nextShooter'] {
  return side === 'home' ? 'away' : 'home';
}

function getPenaltyCardsForSide(
  shootoutState: PenaltyShootoutState,
  side: PenaltyShootoutState['nextShooter']
): readonly CardRank[] {
  return side === 'home' ? shootoutState.homeAvailableCards : shootoutState.awayAvailableCards;
}

function getPenaltyTargetSideX(goalkeeperTeamId: TournamentTeamId, shootoutState: PenaltyShootoutState): number {
  return goalkeeperTeamId === shootoutState.homeTeamId ? PENALTY_GOALKEEPER_HOME_X : PENALTY_GOALKEEPER_AWAY_X;
}

function getSideCardColor(side: PenaltyShootoutState['nextShooter']): CardColor {
  return side === 'home' ? 'RED' : 'BLACK';
}

function getTeamSideColor(shootoutState: PenaltyShootoutState | null, teamId: TournamentTeamId): CardColor {
  if (shootoutState === null) {
    return 'BLACK';
  }

  return teamId === shootoutState.homeTeamId ? 'RED' : 'BLACK';
}

function getGoalkeeperKitId(teamId: TournamentTeamId, shootoutState: PenaltyShootoutState | null): GoalkeeperKitId {
  if (shootoutState === null) {
    return 'gk1';
  }

  return teamId === shootoutState.homeTeamId ? 'gk1' : 'gk2';
}

function formatMatchGoalscorers(matchResult: TournamentMatchResult, teamId: TournamentTeamId): string {
  return matchResult.playerStats
    .filter((stats) => stats.teamId === teamId && stats.goals > 0)
    .map((stats) => `${getPlayerSurname(stats.playerName)}${stats.goals > 1 ? ` ×${stats.goals}` : ''}`)
    .join('\n');
}

function getDetailLineCount(text: string): number {
  return text === '' ? 1 : text.split('\n').length;
}

