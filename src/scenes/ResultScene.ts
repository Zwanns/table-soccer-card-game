import Phaser from 'phaser';
import { playSoundSafe } from '../audio/playSoundSafe';
import type { PlayerControllerType } from '../ai';
import { GAME_TITLE, GAME_VERSION, MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { formatGoalScorerLabel, getMatchStats, type GameState, type GoalScorerStat, type PlayerMatchStats } from '../game';
import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams';
import {
  RESULT_ACTION_BUTTON_HEIGHT,
  RESULT_ACTION_BUTTON_Y,
  createResultActionButtons
} from '../ui/resultActionButtons';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_ALPHA,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_FONT_FAMILY
} from '../ui/scoreboardStyle';
import { TEAM_CARD_STYLE } from '../ui/teamCardStyle';
import { px, SHARP_TEXT_RESOLUTION } from '../ui/textRendering';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';
import { formatPenaltyAttempt, getPenaltyAttemptsForTeam, getPenaltyAttemptSummaries } from '../ui/penaltyAttempts';
import {
  createTournamentMatchResultFromGameState,
  getTournamentTeamControllerType,
  QUICK_MATCH_CONTEXT,
  saveTournament,
  submitTournamentMatchResultObject,
  type MatchLaunchContext,
  type PenaltyAttemptSummary,
  type TournamentMatchResult,
  type TournamentState
} from '../tournament';

const RESULT_SCOREBOARD_WIDTH = 840;
const RESULT_SCREEN_VERTICAL_MARGIN = SCENE_HEIGHT - (RESULT_ACTION_BUTTON_Y + RESULT_ACTION_BUTTON_HEIGHT / 2);
const RESULT_SCOREBOARD_TOP_Y = RESULT_SCREEN_VERTICAL_MARGIN;
const RESULT_SCOREBOARD_HEIGHT = RESULT_ACTION_BUTTON_Y - RESULT_ACTION_BUTTON_HEIGHT / 2 - RESULT_SCOREBOARD_TOP_Y;
const RESULT_SCOREBOARD_CENTER_Y = RESULT_SCOREBOARD_TOP_Y + RESULT_SCOREBOARD_HEIGHT / 2;
const RESULT_STATS_FONT_FAMILY = 'Arial, sans-serif';
const RESULT_TEAM_CODE_FONT_SIZE = '38px';
const RESULT_TEAM_FLAG_WIDTH = 70;
const RESULT_TEAM_FLAG_HEIGHT = 52;
const RESULT_TEAM_CODE_OFFSET_X = 52;
const RESULT_MOBILE_AI_BADGE_WIDTH = 34;
const RESULT_MOBILE_AI_BADGE_HEIGHT = 16;
const RESULT_MOBILE_AI_BADGE_RADIUS = 4;
const RESULT_MOBILE_AI_TEAM_CODE_OFFSET_Y = -10;
const RESULT_MOBILE_AI_BADGE_TOP_Y = 12;
const RESULT_VERSION_MARGIN = 18;

interface ResultSceneData {
  state?: Readonly<GameState>;
  launchContext?: MatchLaunchContext;
}

export class ResultScene extends Phaser.Scene {
  private state: Readonly<GameState> | null = null;
  private launchContext: MatchLaunchContext = QUICK_MATCH_CONTEXT;
  private message: Phaser.GameObjects.Text | null = null;

  public constructor() {
    super('ResultScene');
  }

  public init(data: ResultSceneData): void {
    this.state = data.state ?? null;
    this.launchContext = data.launchContext ?? QUICK_MATCH_CONTEXT;
  }

  public create(): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const playerOne = this.state?.players[0];
    const playerTwo = this.state?.players[1];
    const playerOneGoals = playerOne?.goals ?? 0;
    const playerTwoGoals = playerTwo?.goals ?? 0;

    if (this.state?.phase === 'GAME_OVER') {
      playSoundSafe(this, 'sound-whistle-finish', { volume: 0.68 });
    }

    this.createResultBackground(centerX, centerY, playerOneGoals, playerTwoGoals);

    if (this.state !== null) {
      this.createMatchStatsPanel(centerX, RESULT_SCOREBOARD_CENTER_Y, this.state, this.getPostMatchPenaltyAttempts());
    }

    this.createActions(centerX);
    this.createVersionLabel();
  }

  private createActions(centerX: number): void {
    if (this.launchContext.mode === 'tournament') {
      createResultActionButtons(this, centerX, [
        { label: 'Play Again', onClick: () => this.startReplayMatch() },
        { label: 'Continue', onClick: () => this.returnToTournament() }
      ], { attachedToPanel: true });
      return;
    }

    createResultActionButtons(this, centerX, [
      { label: 'Play Again', onClick: () => this.startReplayMatch() },
      { label: 'New Match', onClick: () => this.scene.start('TeamSelectScene', { mode: 'match' }) }
    ], { attachedToPanel: true });
  }

  private createVersionLabel(): void {
    this.add
      .text(SCENE_WIDTH - RESULT_VERSION_MARGIN, SCENE_HEIGHT - RESULT_VERSION_MARGIN, `${GAME_TITLE} | v${GAME_VERSION}`, {
        align: 'right',
        color: '#b8d2c1',
        fontFamily: RESULT_STATS_FONT_FAMILY,
        fontSize: '16px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(1, 1);
  }

  private createResultBackground(centerX: number, centerY: number, playerOneGoals: number, playerTwoGoals: number): void {
    const textureKey =
      playerOneGoals === playerTwoGoals ? MENU_ASSETS.resultDrawBackground : MENU_ASSETS.resultWinBackground;

    if (!this.textures.exists(textureKey)) {
      this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x142231);
      return;
    }

    const background = this.add.image(centerX, centerY, textureKey);
    background.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT);

    if (playerOneGoals > playerTwoGoals) {
      background.setFlipX(true);
    }
  }

  private needsPenaltyShootout(): boolean {
    const launchContext = this.launchContext;

    if (launchContext.mode !== 'tournament' || this.state === null) {
      return false;
    }

    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;

    if (tournament === undefined || tournament.id !== launchContext.tournamentId) {
      return false;
    }

    const match = tournament.matches.find((candidate) => candidate.id === launchContext.tournamentMatchId);

    if (
      match === undefined ||
      match.status === 'completed' ||
      match.stage === 'group' ||
      match.homeTeamId === undefined ||
      match.awayTeamId === undefined
    ) {
      return false;
    }

    const result = createTournamentMatchResultFromGameState(match.id, this.state, match.homeTeamId, match.awayTeamId);

    return result.winnerTeamId === undefined;
  }

  private returnToTournament(): void {
    const launchContext = this.launchContext;

    if (launchContext.mode !== 'tournament' || this.state === null) {
      this.scene.start('TournamentHubScene');
      return;
    }

    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;

    if (tournament === undefined || tournament.id !== launchContext.tournamentId) {
      this.scene.start('TournamentHubScene');
      return;
    }

    const match = tournament.matches.find((candidate) => candidate.id === launchContext.tournamentMatchId);

    if (match === undefined || match.homeTeamId === undefined || match.awayTeamId === undefined) {
      this.scene.start('TournamentHubScene');
      return;
    }

    if (match.status !== 'completed') {
      const result = createTournamentMatchResultFromGameState(match.id, this.state, match.homeTeamId, match.awayTeamId);

      if (match.stage !== 'group' && result.winnerTeamId === undefined) {
        this.startPenaltyShootout(tournament, result);
        return;
      }

      try {
        const updatedTournament = submitTournamentMatchResultObject(tournament, result);
        this.registry.set('currentTournament', updatedTournament);
        saveTournament(updatedTournament);
        if (updatedTournament.stage === 'complete') {
          this.scene.start('TournamentCompleteScene');
          return;
        }
      } catch (error) {
        this.showMessage(error instanceof Error ? error.message : 'Could not save tournament result.');
        return;
      }
    }

    this.scene.start('TournamentHubScene');
  }

  private startPenaltyShootout(tournament: TournamentState, matchResult: TournamentMatchResult): void {
    this.scene.start('TournamentPenaltyScene', {
      tournamentId: tournament.id,
      matchResult,
      homeControllerType: getTournamentTeamControllerType(tournament, matchResult.homeTeamId),
      awayControllerType: getTournamentTeamControllerType(tournament, matchResult.awayTeamId)
    });
  }

  private showMessage(text: string): void {
    this.message?.destroy();
    this.message = this.add
      .text(px(SCENE_WIDTH / 2), 604, text, {
        align: 'center',
        color: '#f7a6a6',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION,
        stroke: '#142231',
        strokeThickness: 4,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);
  }

  private getPostMatchPenaltyAttempts(): PenaltyAttemptSummary[] {
    const launchContext = this.launchContext;

    if (launchContext.mode !== 'tournament') {
      return [];
    }

    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;
    const match = tournament?.matches.find((candidate) => candidate.id === launchContext.tournamentMatchId);
    const penaltyShootout = match?.result?.penaltyShootout;

    return penaltyShootout === undefined ? [] : getPenaltyAttemptSummaries(penaltyShootout);
  }

  private createMatchStatsPanel(
    x: number,
    y: number,
    state: Readonly<GameState>,
    penaltyAttempts: readonly PenaltyAttemptSummary[]
  ): void {
    const [playerOne, playerTwo] = state.players;
    const [playerOneStats, playerTwoStats] = getMatchStats(state);
    const width = RESULT_SCOREBOARD_WIDTH;
    const height = RESULT_SCOREBOARD_HEIGHT;
    const panelX = px(x);
    const panelY = px(y);
    const panel = this.add.container(panelX, panelY);
    const background = this.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
    background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA);

    const finalScore = this.createScoreLine(
      0,
      -height / 2 + 72,
      playerOne.flagCode,
      playerTwo.flagCode,
      state.matchSetups[playerOne.id]?.controllerType ?? 'HUMAN',
      state.matchSetups[playerTwo.id]?.controllerType ?? 'HUMAN',
      playerOneStats.goals,
      playerTwoStats.goals
    );

    const title = this.add
      .text(0, px(-height / 2 + 112), 'Match statistics', {
        color: '#ffffff',
        fontFamily: RESULT_STATS_FONT_FAMILY,
        fontSize: '24px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    panel.add([background, finalScore, title]);
    this.addStatsScrollContent(
      panel,
      panelX,
      panelY,
      width,
      height,
      playerOneStats,
      playerTwoStats,
      playerOne.flagCode,
      playerTwo.flagCode,
      penaltyAttempts
    );
  }

  private addStatsScrollContent(
    panel: Phaser.GameObjects.Container,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    playerOneStats: PlayerMatchStats,
    playerTwoStats: PlayerMatchStats,
    playerOneTeamId: string,
    playerTwoTeamId: string,
    penaltyAttempts: readonly PenaltyAttemptSummary[]
  ): void {
    const rows: Array<[string, string, string]> = [
      ['Goals', String(playerOneStats.goals), String(playerTwoStats.goals)],
      ['Shots', String(playerOneStats.shots), String(playerTwoStats.shots)],
      ['Possession', formatPercent(playerOneStats.possession), formatPercent(playerTwoStats.possession)]
    ];
    const timelineRows = createScorerTimeline(playerOneStats, playerTwoStats);
    const penaltyRows = createPenaltyTimeline(penaltyAttempts, playerOneTeamId, playerTwoTeamId);
    const viewportTop = -132;
    const viewportHeight = 392;
    const viewportLeft = -panelWidth / 2 + 56;
    const viewportWidth = panelWidth - 112;
    const content = this.add.container(0, viewportTop);
    const statsStartY = 18;
    const statsRowGap = 32;
    const scorersTitleY = statsStartY + rows.length * statsRowGap + 18;
    const scorersStartY = scorersTitleY + 34;
    const rowHeight = 24;
    const scorerColumnWidth = 280;
    const playerOneScorerX = viewportLeft;
    const playerTwoScorerX = panelWidth / 2 - 56 - scorerColumnWidth;
    const penaltyTitleY = scorersStartY + Math.max(1, timelineRows.length) * rowHeight + 12;
    const penaltySectionHeight = penaltyRows.length === 0 ? 0 : 34 + penaltyRows.length * rowHeight;
    const contentHeight = Math.max(
      viewportHeight,
      scorersStartY + Math.max(1, timelineRows.length) * rowHeight + penaltySectionHeight
    );
    const maxScroll = Math.max(0, contentHeight - viewportHeight);

    rows.forEach(([label, playerOneValue, playerTwoValue], index) => {
      const rowY = statsStartY + index * statsRowGap;
      content.add(this.createStatsValue(-285, rowY, playerOneValue));
      content.add(this.createStatsLabel(rowY, label));
      content.add(this.createStatsValue(285, rowY, playerTwoValue));
    });

    content.add(this.createStatsLabel(scorersTitleY, 'Goalscorers'));
    timelineRows.forEach((row, index) => {
      const rowY = scorersStartY + index * rowHeight;
      content.add(this.createScorersList(playerOneScorerX, rowY, row.playerOneText, scorerColumnWidth));
      content.add(this.createScorersList(playerTwoScorerX, rowY, row.playerTwoText, scorerColumnWidth));
    });

    if (timelineRows.length === 0) {
      content.add(this.createScorersList(playerOneScorerX, scorersStartY, '-', scorerColumnWidth));
      content.add(this.createScorersList(playerTwoScorerX, scorersStartY, '-', scorerColumnWidth));
    }

    if (penaltyRows.length > 0) {
      content.add(
        this.add
          .text(0, penaltyTitleY, 'Penalties', {
            align: 'center',
            color: '#ffffff',
            fontFamily: RESULT_STATS_FONT_FAMILY,
            fontSize: '20px',
            fontStyle: '700',
            resolution: SHARP_TEXT_RESOLUTION
          })
          .setOrigin(0.5, 0)
      );

      penaltyRows.forEach((row, index) => {
        const rowY = penaltyTitleY + 30 + index * rowHeight;
        content.add(this.createScorersList(playerOneScorerX, rowY, row.playerOneText, scorerColumnWidth));
        content.add(this.createScorersList(playerTwoScorerX, rowY, row.playerTwoText, scorerColumnWidth));
      });
    }

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(panelX + viewportLeft, panelY + viewportTop, viewportWidth, viewportHeight)
      .createGeometryMask();
    const scrollZone = this.add
      .zone(0, viewportTop + viewportHeight / 2, viewportWidth, viewportHeight)
      .setInteractive({ useHandCursor: maxScroll > 0 });
    const scrollbarTrack = this.add.rectangle(
      panelWidth / 2 - 32,
      viewportTop + viewportHeight / 2,
      4,
      viewportHeight,
      0x5f9572,
      0.28
    );
    const thumbHeight = maxScroll === 0 ? viewportHeight : Math.max(24, (viewportHeight / contentHeight) * viewportHeight);
    const scrollbarThumb = this.add.rectangle(
      panelWidth / 2 - 32,
      viewportTop + thumbHeight / 2,
      6,
      thumbHeight,
      0xf0c95a,
      0.88
    );
    let scrollY = 0;

    maskGraphics.setVisible(false);
    content.setMask(mask);
    panel.add([content, scrollZone]);

    if (maxScroll === 0) {
      scrollbarTrack.setVisible(false);
      scrollbarThumb.setVisible(false);
      return;
    }

    panel.add([scrollbarTrack, scrollbarThumb]);

    const setScroll = (value: number): void => {
      scrollY = clampScroll(value, maxScroll);
      content.y = viewportTop - scrollY;
      scrollbarThumb.y = viewportTop + thumbHeight / 2 + (scrollY / maxScroll) * (viewportHeight - thumbHeight);
    };
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: panelX + viewportLeft,
        y: panelY + viewportTop,
        width: viewportWidth,
        height: viewportHeight
      },
      maxScroll,
      getScroll: () => scrollY,
      setScroll
    });

    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(scrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);
  }

  private createScoreLine(
    x: number,
    y: number,
    playerOneFlagCode: string,
    playerTwoFlagCode: string,
    playerOneControllerType: PlayerControllerType,
    playerTwoControllerType: PlayerControllerType,
    playerOneGoals: number,
    playerTwoGoals: number
  ): Phaser.GameObjects.Container {
    const scoreLine = this.add.container(px(x), px(y));
    const playerOneTeam = this.createResultTeamCodeBlock(-285, 0, playerOneFlagCode, playerOneControllerType);

    const score = this.add
      .text(0, 0, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f0c95a',
        fontFamily: SCOREBOARD_FONT_FAMILY,
        fontSize: '58px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    const playerTwoTeam = this.createResultTeamCodeBlock(180, 0, playerTwoFlagCode, playerTwoControllerType);
    scoreLine.add([playerOneTeam, score, playerTwoTeam]);

    return scoreLine;
  }

  private createResultTeamCodeBlock(
    x: number,
    y: number,
    flagCode: string,
    controllerType: PlayerControllerType
  ): Phaser.GameObjects.Container {
    const block = this.add.container(px(x), px(y));
    const isAi = controllerType === 'AI';
    const teamCodeX = RESULT_TEAM_CODE_OFFSET_X;
    const teamCodeY = isAi ? RESULT_MOBILE_AI_TEAM_CODE_OFFSET_Y : 0;
    const flag = this.add.image(0, 0, getFlagAssetKey(flagCode));
    flag.setDisplaySize(RESULT_TEAM_FLAG_WIDTH, RESULT_TEAM_FLAG_HEIGHT);

    const teamCode = this.add
      .text(teamCodeX, teamCodeY, getTeamScoreboardCode(flagCode), {
        color: TEAM_CARD_STYLE.normal.textColor,
        fontFamily: RESULT_STATS_FONT_FAMILY,
        fontSize: RESULT_TEAM_CODE_FONT_SIZE,
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0, 0.5);

    block.add([flag, teamCode]);

    if (isAi) {
      this.addResultAiBadge(block, teamCodeX, RESULT_MOBILE_AI_BADGE_TOP_Y);
    }

    return block;
  }

  private addResultAiBadge(container: Phaser.GameObjects.Container, x: number, topY: number): void {
    const badge = this.add.graphics();

    badge
      .fillStyle(0xf0c95a, 1)
      .fillRoundedRect(x, topY, RESULT_MOBILE_AI_BADGE_WIDTH, RESULT_MOBILE_AI_BADGE_HEIGHT, RESULT_MOBILE_AI_BADGE_RADIUS);
    container.add(badge);
    container.add(
      this.add
        .text(x + RESULT_MOBILE_AI_BADGE_WIDTH / 2, topY + RESULT_MOBILE_AI_BADGE_HEIGHT / 2, 'AI', {
          color: '#1f2a2e',
          fontFamily: RESULT_STATS_FONT_FAMILY,
          fontSize: '12px',
          fontStyle: '700',
          resolution: SHARP_TEXT_RESOLUTION
        })
        .setOrigin(0.5)
    );
  }

  private createStatsLabel(y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(0, px(y), text, {
        align: 'center',
        color: '#ffffff',
        fontFamily: RESULT_STATS_FONT_FAMILY,
        fontSize: '20px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);
  }

  private createStatsValue(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(px(x), px(y), text, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: RESULT_STATS_FONT_FAMILY,
        fontSize: '24px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);
  }

  private createScorersList(x: number, y: number, text: string, width: number): Phaser.GameObjects.Text {
    return this.add
      .text(px(x), px(y), text, {
        align: 'left',
        color: '#f0c95a',
        fontFamily: RESULT_STATS_FONT_FAMILY,
        fontSize: '17px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width }
      })
      .setOrigin(0, 0.5);
  }

  private startReplayMatch(): void {
    if (this.state === null) {
      this.scene.start('TeamSelectScene', { mode: 'match' });
      return;
    }

    const [playerOne, playerTwo] = this.state.players;

    this.scene.start('GameScene', {
      player1Name: playerOne.name,
      player2Name: playerTwo.name,
      player1FlagCode: playerOne.flagCode,
      player2FlagCode: playerTwo.flagCode,
      player1ControllerType: this.state.matchSetups[playerOne.id]?.controllerType ?? 'HUMAN',
      player2ControllerType: this.state.matchSetups[playerTwo.id]?.controllerType ?? 'HUMAN',
      launchContext: this.launchContext
    });
  }
}

function formatPercent(value: PlayerMatchStats['shotAccuracy']): string {
  return `${value}%`;
}

type ScorerTimelineRow = {
  turnNumber: number;
  playerOneText: string;
  playerTwoText: string;
};

function createScorerTimeline(
  playerOneStats: PlayerMatchStats,
  playerTwoStats: PlayerMatchStats
): ScorerTimelineRow[] {
  return [
    ...playerOneStats.scorers.map((scorer) => createScorerTimelineEntry('PLAYER_1', scorer)),
    ...playerTwoStats.scorers.map((scorer) => createScorerTimelineEntry('PLAYER_2', scorer))
  ]
    .sort((first, second) => first.turnNumber - second.turnNumber)
    .map((entry) => ({
      turnNumber: entry.turnNumber,
      playerOneText: entry.playerId === 'PLAYER_1' ? entry.text : '',
      playerTwoText: entry.playerId === 'PLAYER_2' ? entry.text : ''
    }));
}

function createScorerTimelineEntry(playerId: 'PLAYER_1' | 'PLAYER_2', scorer: GoalScorerStat): {
  playerId: 'PLAYER_1' | 'PLAYER_2';
  text: string;
  turnNumber: number;
} {
  return {
    playerId,
    text: `${formatGoalScorerLabel(scorer)} (turn ${scorer.turnNumber})`,
    turnNumber: scorer.turnNumber
  };
}

function createPenaltyTimeline(
  attempts: readonly PenaltyAttemptSummary[],
  playerOneTeamId: string,
  playerTwoTeamId: string
): Array<{ playerOneText: string; playerTwoText: string }> {
  const playerOneAttempts = getPenaltyAttemptsForTeam(attempts, playerOneTeamId);
  const playerTwoAttempts = getPenaltyAttemptsForTeam(attempts, playerTwoTeamId);
  const rowCount = Math.max(playerOneAttempts.length, playerTwoAttempts.length);

  return Array.from({ length: rowCount }, (_unused, index) => ({
    playerOneText: playerOneAttempts[index] === undefined ? '' : formatPenaltyAttempt(playerOneAttempts[index]),
    playerTwoText: playerTwoAttempts[index] === undefined ? '' : formatPenaltyAttempt(playerTwoAttempts[index])
  }));
}
