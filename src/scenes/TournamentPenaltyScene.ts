import Phaser from 'phaser';
import type { CardColor, CardRank, GoalkeeperRank } from '../cards';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getGoalkeeperKitAssetKey, getTeamKitAssetKey, type GoalkeeperKitId } from '../data/teamKits';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import type { GoalkeeperSquadMember } from '../data/squadTypes';
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
import { Button } from '../ui/Button';
import { createCardPlayerProfile, createGoalkeeperCardProfile } from '../ui/cardPlayerProfile';
import { CardView } from '../ui/CardView';

interface TournamentPenaltySceneData {
  tournamentId?: string;
  matchResult?: TournamentMatchResult;
  standalone?: boolean;
}

const PANEL_X = SCENE_WIDTH / 2;
const PANEL_Y = 442;
const PANEL_WIDTH = 900;
const PANEL_HEIGHT = 338;
const PENALTY_SIDE_HOME_X = -300;
const PENALTY_SIDE_AWAY_X = 300;
const PENALTY_GOALKEEPER_Y = -42;
const PENALTY_ATTACK_CARD_Y = 106;
const PENALTY_CARD_SCALE = 0.58;
const PENALTY_ATTACK_CARD_GAP = 62;
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
    this.input.enabled = true;
  }

  public create(): void {
    if (this.matchResult !== null && (this.tournamentId !== null || this.standalone)) {
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
    this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x142231);

    this.add
      .text(SCENE_WIDTH / 2, 82, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '44px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    if ((this.tournamentId === null && !this.standalone) || this.matchResult === null || this.shootoutState === null) {
      this.renderMissingPenaltyData();
      return;
    }

    this.createScoreHeader(this.matchResult, this.shootoutState);
    this.createShootoutPanel(this.shootoutState, this.matchResult);

    if (this.message !== null && this.shootoutState.status !== 'complete') {
      this.add
        .text(SCENE_WIDTH / 2, 602, this.message, {
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
        this.standalone ? 'В меню' : 'Back to tournament',
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

  private createScoreHeader(matchResult: TournamentMatchResult, shootoutState: PenaltyShootoutState): void {
    const homeTeam = findTeam(matchResult.homeTeamId);
    const awayTeam = findTeam(matchResult.awayTeamId);
    const scoreLine = this.add.container(SCENE_WIDTH / 2, 166);

    this.addPenaltyTeamHeader(scoreLine, -360, homeTeam, matchResult.homeTeamId, 'left');
    scoreLine.add(
      this.add
        .text(0, 0, `${matchResult.homeGoals} : ${matchResult.awayGoals}`, {
          color: '#dfeaf2',
          fontFamily: 'Arial, sans-serif',
          fontSize: '32px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.addPenaltyTeamHeader(scoreLine, 360, awayTeam, matchResult.awayTeamId, 'right');

    this.add
      .text(SCENE_WIDTH / 2, 198, `Penalties ${shootoutState.homeGoals} : ${shootoutState.awayGoals}`, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    if (shootoutState.status === 'complete') {
      this.createShootoutSummary(shootoutState);
    }
  }

  private createShootoutPanel(shootoutState: PenaltyShootoutState, matchResult: TournamentMatchResult): void {
    const panel = this.add.container(PANEL_X, PANEL_Y);
    const background = this.add.rectangle(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 0x0b2118, 0.88);
    background.setStrokeStyle(2, 0x5f9572, 0.95);
    panel.add(background);

    if (shootoutState.status === 'complete') {
      this.createMatchStatsPanel(panel, matchResult);
      return;
    }

    panel.add(
      this.add
        .text(0, -146, getPenaltyPhaseTitle(shootoutState), {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '26px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    panel.add(
      this.add
        .text(0, 38, getPenaltyInstruction(shootoutState), {
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.createPenaltySide(panel, shootoutState, 'home', PENALTY_SIDE_HOME_X);
    this.createPenaltySide(panel, shootoutState, 'away', PENALTY_SIDE_AWAY_X);
  }

  private createPenaltySide(
    panel: Phaser.GameObjects.Container,
    shootoutState: PenaltyShootoutState,
    goalkeeperSide: PenaltyShootoutState['nextShooter'],
    sideX: number
  ): void {
    const shooterSide = getOppositeSide(goalkeeperSide);
    const goalkeeperTeamId = getShooterTeamId(shootoutState, goalkeeperSide);
    const shooterTeamId = getShooterTeamId(shootoutState, shooterSide);
    const goalkeeperIsActive = getGoalkeeperTeamId(shootoutState, shootoutState.nextShooter) === goalkeeperTeamId;
    const shooterIsActive = shootoutState.nextShooter === shooterSide;
    const cards = getPenaltyCardsForSide(shootoutState, shooterSide);

    panel.add(
      this.add
        .text(sideX, -112, `${getTeamName(goalkeeperTeamId)} GK`, {
          align: 'center',
          color: goalkeeperIsActive ? '#f0c95a' : '#a9c7b3',
          fontFamily: 'Arial, sans-serif',
          fontSize: '17px',
          fontStyle: '700',
          wordWrap: { width: 240 }
        })
        .setOrigin(0.5)
    );

    if (goalkeeperIsActive && shootoutState.phase === 'selecting-goalkeeper') {
      panel.add(
        this.createGoalkeeperCardView(sideX, PENALTY_GOALKEEPER_Y, null, goalkeeperTeamId, {
          faceDown: true,
          highlighted: true,
          onClick: () => this.drawGoalkeeperCard(),
          scale: PENALTY_CARD_SCALE
        })
      );
    } else if (goalkeeperIsActive && shootoutState.currentGoalkeeperRank !== null) {
      panel.add(
        this.createGoalkeeperCardView(sideX, PENALTY_GOALKEEPER_Y, shootoutState.currentGoalkeeperRank, goalkeeperTeamId, {
          highlighted: true,
          scale: PENALTY_CARD_SCALE
        })
      );
    } else {
      panel.add(
        this.createGoalkeeperCardView(sideX, PENALTY_GOALKEEPER_Y, null, goalkeeperTeamId, {
          faceDown: true,
          scale: PENALTY_CARD_SCALE
        })
      );
    }

    panel.add(
      this.add
        .text(sideX, 42, `${getTeamName(shooterTeamId)} shots`, {
          align: 'center',
          color: shooterIsActive ? '#ffffff' : '#8fad9a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: '700',
          wordWrap: { width: 260 }
        })
        .setOrigin(0.5)
    );

    this.createPenaltyCardButtons(panel, shootoutState, shooterSide, sideX);
  }

  private createPenaltyCardButtons(
    panel: Phaser.GameObjects.Container,
    shootoutState: PenaltyShootoutState,
    shooterSide: PenaltyShootoutState['nextShooter'],
    sideX: number
  ): void {
    const cards = getPenaltyCardsForSide(shootoutState, shooterSide);
    const startX = sideX - ((cards.length - 1) * PENALTY_ATTACK_CARD_GAP) / 2;
    const shooterTeamId = getShooterTeamId(shootoutState, shooterSide);
    const shooterColor = getSideCardColor(shooterSide);
    const canReveal = shootoutState.phase === 'selecting-attacker' && shootoutState.nextShooter === shooterSide;

    cards.forEach((rank, index) => {
      const localX = startX + index * PENALTY_ATTACK_CARD_GAP;
      const isRevealed = shootoutState.nextShooter === shooterSide && shootoutState.revealedAttackerCardIndex === index;
      const card = this.createAttackCardView(localX, PENALTY_ATTACK_CARD_Y, rank, shooterTeamId, shooterColor, {
        faceDown: !isRevealed,
        highlighted: canReveal || isRevealed,
        onClick: canReveal ? () => this.revealAttackCard(index) : undefined,
        scale: PENALTY_CARD_SCALE
      });

      panel.add(card);
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
    this.time.delayedCall(260, () => this.takeKick());
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

  private addPenaltyTeamHeader(
    container: Phaser.GameObjects.Container,
    x: number,
    team: NationalTeam | undefined,
    fallbackTeamId: TournamentTeamId,
    align: 'left' | 'right'
  ): void {
    if (team !== undefined) {
      const flag = this.add.image(x + (align === 'left' ? -42 : 42), 0, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(52, 36);
      container.add(flag);
    }

    container.add(
      this.add
        .text(x, 0, team?.name ?? fallbackTeamId, {
          align,
          color: '#dfeaf2',
          fontFamily: 'Arial, sans-serif',
          fontSize: '30px',
          fontStyle: '700',
          wordWrap: { width: 250 }
        })
        .setOrigin(align === 'left' ? 0 : 1, 0.5)
    );
  }

  private createShootoutSummary(shootoutState: PenaltyShootoutState): void {
    const summary = this.add.container(SCENE_WIDTH / 2, 232);
    const homeKicks = getPenaltyKicksForTeam(shootoutState, shootoutState.homeTeamId);
    const awayKicks = getPenaltyKicksForTeam(shootoutState, shootoutState.awayTeamId);
    const homeMarkerCount = getPenaltyMarkerCount(homeKicks);
    const awayMarkerCount = getPenaltyMarkerCount(awayKicks);
    const homeWidth = getPenaltyMarkerRowWidth(homeMarkerCount);
    const awayWidth = getPenaltyMarkerRowWidth(awayMarkerCount);
    const totalWidth = homeWidth + SHOOTOUT_SEPARATOR_GAP * 2 + awayWidth;
    const homeStartX = -totalWidth / 2;
    const separatorX = homeStartX + homeWidth + SHOOTOUT_SEPARATOR_GAP;
    const awayStartX = separatorX + SHOOTOUT_SEPARATOR_GAP;

    this.addPenaltyMarkers(summary, homeStartX, homeKicks);
    summary.add(
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
    this.addPenaltyMarkers(summary, awayStartX, awayKicks);
  }

  private addPenaltyMarkers(
    container: Phaser.GameObjects.Container,
    startX: number,
    kicks: readonly PenaltyKickResult[]
  ): void {
    const markerCount = getPenaltyMarkerCount(kicks);

    for (let index = 0; index < markerCount; index += 1) {
      const kick = kicks[index];
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
        PANEL_X + MATCH_STATS_VIEWPORT.x,
        PANEL_Y + MATCH_STATS_VIEWPORT.y,
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
    const goalkeeper = getStartingGoalkeeper(squad.goalkeepers, squad.defaultStartingGoalkeeperId);
    const card = new CardView(this, x, y, {
      rank: rank ?? 'GK',
      color: getTeamSideColor(this.shootoutState, teamId),
      faceDown: options.faceDown,
      highlighted: options.highlighted,
      kitTextureKey: getGoalkeeperKitAssetKey(getGoalkeeperKitId(teamId, this.shootoutState)),
      label: 'GK',
      onClick: options.onClick,
      playerProfile: options.faceDown === true || rank === null ? undefined : createGoalkeeperCardProfile(teamId, goalkeeper, rank),
      tooltipEnabled: false
    });

    card.setScale(options.scale ?? 1);
    return card;
  }

  private animatePenaltyKick(context: PenaltyAnimationContext, onComplete: () => void): void {
    const target = context.targetPosition;
    const card = this.createAttackCardView(
      context.startPosition.x,
      context.startPosition.y,
      context.attackerRank,
      context.shooterTeamId,
      getSideCardColor(context.shooterSide),
      { scale: PENALTY_CARD_SCALE }
    );
    card.setDepth(1000);
    card.setRotation(context.shooterSide === 'home' ? -0.1 : 0.1);

    this.tweens.add({
      targets: card,
      x: target.x,
      y: target.y,
      scale: 0.76,
      rotation: 0,
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
      this.showFlyingMessage('Штанга!', 'post');
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
  const sideX = getPenaltyTargetSideX(getGoalkeeperTeamId(shootoutState, shootoutState.nextShooter), shootoutState);
  const startX = sideX - ((cards.length - 1) * PENALTY_ATTACK_CARD_GAP) / 2;
  const localX = startX + cardIndex * PENALTY_ATTACK_CARD_GAP;

  return {
    x: PANEL_X + localX,
    y: PANEL_Y + PENALTY_ATTACK_CARD_Y
  };
}

function getPenaltyGoalkeeperWorldPosition(shootoutState: PenaltyShootoutState): { x: number; y: number } {
  const sideX = getPenaltyTargetSideX(getGoalkeeperTeamId(shootoutState, shootoutState.nextShooter), shootoutState);

  return {
    x: PANEL_X + sideX,
    y: PANEL_Y + PENALTY_GOALKEEPER_Y
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
  return goalkeeperTeamId === shootoutState.homeTeamId ? PENALTY_SIDE_HOME_X : PENALTY_SIDE_AWAY_X;
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
    return 'gk-1';
  }

  return teamId === shootoutState.homeTeamId ? 'gk-1' : 'gk-2';
}

function getStartingGoalkeeper(
  goalkeepers: readonly [GoalkeeperSquadMember, GoalkeeperSquadMember],
  startingGoalkeeperId: string
): GoalkeeperSquadMember {
  return goalkeepers.find((goalkeeper) => goalkeeper.id === startingGoalkeeperId) ?? goalkeepers[0];
}
