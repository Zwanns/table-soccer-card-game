import Phaser from 'phaser';
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
import { createCardPlayerProfile, createGoalkeeperCardProfile } from '../ui/cardPlayerProfile';
import { CardView } from '../ui/CardView';
import { ScoreView } from '../ui/ScoreView';

interface TournamentPenaltySceneData {
  tournamentId?: string;
  matchResult?: TournamentMatchResult;
  standalone?: boolean;
}

const PENALTY_FIELD_CENTER_X = SCENE_WIDTH / 2;
const PENALTY_FIELD_CENTER_Y = 400;
const PENALTY_FIELD_WIDTH = 1120;
const PENALTY_FIELD_HEIGHT = 600;
const PENALTY_GOALKEEPER_HOME_X = -490;
const PENALTY_GOALKEEPER_AWAY_X = 490;
const PENALTY_GOALKEEPER_FIELD_Y = 0;
const PENALTY_ATTACK_CARD_Y = 0;
const PENALTY_CARD_SCALE = 0.78;
const PENALTY_SELECTED_CARD_SCALE = 0.9;
const PENALTY_ATTACK_COLUMN_X = 92;
const PENALTY_ATTACK_CARD_GAP = 60;
const PENALTY_ATTACK_CARD_ROTATION = Math.PI / 2;
const PENALTY_STATUS_Y = 124;
const PENALTY_PHASE_MESSAGE_Y = 662;
const SHOOTOUT_MARKER_Y = 148;
const PENALTY_COMPLETE_PANEL_X = SCENE_WIDTH / 2;
const PENALTY_COMPLETE_PANEL_Y = 442;
const PENALTY_COMPLETE_PANEL_WIDTH = 900;
const PENALTY_COMPLETE_PANEL_HEIGHT = 338;
const SHOOTOUT_MARKER_COUNT = 5;
const SHOOTOUT_MARKER_GAP = 36;
const SHOOTOUT_SEPARATOR_GAP = 34;
const MATCH_STATS_VIEWPORT = {
  x: -360,
  y: -132,
  width: 720,
  height: 242
} as const;

type PenaltyAnimationOutcome = 'goal' | 'post' | 'save';

interface PenaltyAnimationContext {
  attackerRank: CardRank;
  outcome: PenaltyAnimationOutcome;
  shooterSide: PenaltyShootoutState['nextShooter'];
  shooterTeamId: TournamentTeamId;
  startPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

export class TournamentPenaltyScene extends Phaser.Scene {
  private tournamentId: string | null = null;
  private matchResult: TournamentMatchResult | null = null;
  private shootoutState: PenaltyShootoutState | null = null;
  private message: string | null = null;
  private inputLocked = false;
  private standalone = false;
  private homeCoverTextureKey = getFallbackCoverTextureKey();
  private awayCoverTextureKey = getFallbackCoverTextureKey();

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
    this.homeCoverTextureKey = getFallbackCoverTextureKey();
    this.awayCoverTextureKey = getFallbackCoverTextureKey();
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

    if (this.matchResult !== null && (this.tournamentId !== null || this.standalone)) {
      this.homeCoverTextureKey = this.resolvePenaltyCoverTextureKey(this.matchResult.homeTeamId);
      this.awayCoverTextureKey = this.resolvePenaltyCoverTextureKey(this.matchResult.awayTeamId);
      this.shootoutState = createPenaltyShootoutState({
        matchId: this.matchResult.matchId,
        homeTeamId: this.matchResult.homeTeamId,
        awayTeamId: this.matchResult.awayTeamId,
        seed: `${this.tournamentId ?? 'standalone'}:${this.matchResult.matchId}:penalties`
      });
    }

    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);

    if ((this.tournamentId === null && !this.standalone) || this.matchResult === null || this.shootoutState === null) {
      this.renderMissingPenaltyData();
      return;
    }

    this.createPenaltyMatchHeader(this.matchResult, this.shootoutState);
    this.createMenuButton();
    this.createPenaltyField(this.shootoutState);
    this.createShootoutMarkers(this.shootoutState);

    if (this.shootoutState.status === 'complete') {
      this.createCompletedShootoutPanel(this.matchResult);
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

    if (this.shootoutState.status === 'complete') {
      new Button(
        this,
        SCENE_WIDTH / 2,
        660,
        this.standalone ? 'Menu' : 'Back to tournament',
        () => this.scene.start(this.getCompletedShootoutReturnScene()),
        { width: 300 }
      );
    }
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

  private createMenuButton(): void {
    new Button(this, 120, 34, 'Menu', () => this.scene.start('MenuScene'), {
      fontSize: '20px'
    });
  }

  private createPenaltyMatchHeader(matchResult: TournamentMatchResult, shootoutState: PenaltyShootoutState): void {
    const homeTeam = findTeam(matchResult.homeTeamId);
    const awayTeam = findTeam(matchResult.awayTeamId);

    new ScoreView(
      this,
      SCENE_WIDTH / 2,
      42,
      homeTeam?.name ?? matchResult.homeTeamId,
      awayTeam?.name ?? matchResult.awayTeamId,
      matchResult.homeTeamId,
      matchResult.awayTeamId,
      matchResult.homeGoals,
      matchResult.awayGoals,
      matchResult.teamStats.home.shots,
      matchResult.teamStats.away.shots,
      {
        penaltyScore: {
          playerOne: shootoutState.homeGoals,
          playerTwo: shootoutState.awayGoals
        }
      }
    );
    new AdvantageView(this, SCENE_WIDTH / 2, 94, {
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
    });
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
      .setOrigin(0.5);

  }

  private createCompletedShootoutPanel(matchResult: TournamentMatchResult): void {
    const panel = this.add.container(PENALTY_COMPLETE_PANEL_X, PENALTY_COMPLETE_PANEL_Y);
    const background = this.add.rectangle(0, 0, PENALTY_COMPLETE_PANEL_WIDTH, PENALTY_COMPLETE_PANEL_HEIGHT, 0x0b2118, 0.9);
    background.setStrokeStyle(2, 0x5f9572, 0.95);
    panel.add(background);
    this.createMatchStatsPanel(panel, matchResult);
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
    const field = this.add.container(PENALTY_FIELD_CENTER_X, PENALTY_FIELD_CENTER_Y);
    const pitch = this.add.rectangle(0, 0, PENALTY_FIELD_WIDTH, PENALTY_FIELD_HEIGHT, 0x0d6a42, 1);
    pitch.setStrokeStyle(3, 0xe2efe6);

    const centerLine = this.add.rectangle(0, 0, 2, PENALTY_FIELD_HEIGHT - 20, 0xe2efe6, 0.42);
    const centerCircle = this.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(2, 0xe2efe6, 0.45);

    field.add([pitch, this.createPenaltyPitchMarkings(), centerLine, centerCircle]);
    this.createPenaltyGoalkeeperCards(field, shootoutState);
    this.createPenaltyCardColumns(field, shootoutState);
  }

  private createPenaltyPitchMarkings(): Phaser.GameObjects.Graphics {
    const markings = this.add.graphics();
    const lineColor = 0xe2efe6;
    const lineAlpha = 0.42;

    markings.lineStyle(2, lineColor, lineAlpha);
    markings.strokeRect(-560, -180, 150, 360);
    markings.strokeRect(410, -180, 150, 360);
    markings.strokeRect(-560, -95, 70, 190);
    markings.strokeRect(490, -95, 70, 190);
    markings.strokeCircle(-450, 0, 4);
    markings.strokeCircle(450, 0, 4);
    markings.beginPath();
    markings.arc(-450, 0, 72, Phaser.Math.DegToRad(-56), Phaser.Math.DegToRad(56), false);
    markings.strokePath();
    markings.beginPath();
    markings.arc(450, 0, 72, Phaser.Math.DegToRad(124), Phaser.Math.DegToRad(236), false);
    markings.strokePath();

    return markings;
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
    const goalkeeperRank = goalkeeperIsActive ? shootoutState.currentGoalkeeperRank : null;

    field.add(
      this.createGoalkeeperCardView(x, PENALTY_GOALKEEPER_FIELD_Y, goalkeeperRank, goalkeeperTeamId, {
        faceDown: goalkeeperRank === null,
        highlighted: goalkeeperIsActive,
        onClick: canDrawGoalkeeper ? () => this.drawGoalkeeperCard() : undefined
      })
    );
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
    const startY = -((cards.length - 1) * PENALTY_ATTACK_CARD_GAP) / 2;

    cards.forEach((rank, index) => {
      const localY = startY + index * PENALTY_ATTACK_CARD_GAP;
      const isRevealed = shootoutState.nextShooter === shooterSide && shootoutState.revealedAttackerCardIndex === index;
      const card = this.createAttackCardView(x, localY, rank, shooterTeamId, shooterColor, {
        faceDown: !isRevealed,
        highlighted: canReveal || isRevealed,
        onClick: canReveal ? () => this.revealAttackCard(index) : undefined,
        scale: isRevealed ? PENALTY_SELECTED_CARD_SCALE : PENALTY_CARD_SCALE
      });

      card.setRotation(isRevealed ? 0 : PENALTY_ATTACK_CARD_ROTATION);
      field.add(card);
    });
  }

  private drawGoalkeeperCard(): void {
    if (this.shootoutState === null || this.inputLocked) {
      return;
    }

    try {
      this.shootoutState = drawPenaltyGoalkeeperCard(this.shootoutState);
      this.message = null;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not draw the goalkeeper card.';
    }

    this.render();
  }

  private revealAttackCard(cardIndex: number): void {
    if (this.shootoutState === null || this.inputLocked) {
      return;
    }

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
        this.shootoutState = nextState;

        if (this.shootoutState.status === 'complete') {
          this.completeTournamentMatch();
        } else {
          this.message = null;
        }

        this.render();
        this.showPenaltyOutcome(kick.outcome);
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
      const penaltyShootout = createTournamentPenaltyResult(this.shootoutState);
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

    contentHeight += rows.length * 38 + 12;
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

    card.setScale(options.scale ?? 1);
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

    card.setScale(options.scale ?? 1);
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
    outcome: PenaltyAnimationOutcome,
    shooterSide: PenaltyShootoutState['nextShooter'],
    onComplete: () => void
  ): void {
    this.showImpactPulse(target.x, target.y, outcome);

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
          onComplete();
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
        onComplete();
      }
    });
  }

  private showImpactPulse(x: number, y: number, outcome: PenaltyAnimationOutcome): void {
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

  private showPenaltyOutcome(outcome: PenaltyAnimationOutcome): void {
    if (outcome === 'goal') {
      this.sound.play('sound-penalty-goal', { volume: 0.72 });
      this.showFlyingMessage('GOAL!!', 'goal');
      return;
    }

    if (outcome === 'post') {
      this.sound.play('sound-goalpost', { volume: 0.72 });
      this.showFlyingMessage('Post!', 'post');
      return;
    }

    this.sound.play('sound-goalkeeper-save', { volume: 0.72 });
    this.showFlyingMessage('Goalkeeper!!', 'save');
  }

  private showFlyingMessage(message: string, tone: PenaltyAnimationOutcome): void {
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
        this.inputLocked = false;
        this.input.enabled = true;
      }
    });
  }
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
    x: PENALTY_FIELD_CENTER_X + localX,
    y: PENALTY_FIELD_CENTER_Y + localY
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
    x: PENALTY_FIELD_CENTER_X + sideX,
    y: PENALTY_FIELD_CENTER_Y + PENALTY_GOALKEEPER_FIELD_Y
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

