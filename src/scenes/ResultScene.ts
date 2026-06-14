import Phaser from 'phaser';
import { playSoundSafe } from '../audio/playSoundSafe';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getMatchStats, type GameState, type GoalScorerStat, type PlayerMatchStats } from '../game';
import { getFlagAssetKey } from '../data/nationalTeams';
import { Button } from '../ui/Button';
import {
  createTournamentMatchResultFromGameState,
  getTournamentTeamControllerType,
  QUICK_MATCH_CONTEXT,
  saveTournament,
  submitTournamentMatchResultObject,
  type MatchLaunchContext,
  type TournamentMatchResult,
  type TournamentState
} from '../tournament';

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

    this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x142231);

    this.add
      .text(centerX, 112, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createScoreLine(
      centerX,
      186,
      playerOne?.name ?? 'France',
      playerTwo?.name ?? 'Spain',
      playerOne?.flagCode ?? 'fr',
      playerTwo?.flagCode ?? 'es',
      playerOneGoals,
      playerTwoGoals
    );

    if (this.state !== null) {
      this.createMatchStatsPanel(centerX, 398, this.state);
    }

    this.createActions(centerX);
  }

  private createActions(centerX: number): void {
    if (this.launchContext.mode === 'tournament') {
      const primaryLabel = this.needsPenaltyShootout() ? 'Penalty shootout' : 'Back to tournament';
      new Button(this, centerX - 150, 650, primaryLabel, () => this.returnToTournament(), { width: 270 });
      new Button(this, centerX + 150, 650, 'Menu', () => this.scene.start('MenuScene'), { width: 230 });
      return;
    }

    new Button(this, centerX - 130, 650, 'Play again', () => this.scene.start('TeamSelectScene'));
    new Button(this, centerX + 130, 650, 'Menu', () => this.scene.start('MenuScene'));
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
      .text(SCENE_WIDTH / 2, 604, text, {
        align: 'center',
        color: '#f7a6a6',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        stroke: '#142231',
        strokeThickness: 4,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);
  }

  private createMatchStatsPanel(x: number, y: number, state: Readonly<GameState>): void {
    const [playerOne, playerTwo] = state.players;
    const [playerOneStats, playerTwoStats] = getMatchStats(state);
    const width = 840;
    const height = 320;
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, height, 0x0b2118, 0.88);
    background.setStrokeStyle(2, 0x5f9572, 0.95);

    const title = this.add
      .text(0, -height / 2 + 28, 'Match statistics', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const playerOneHeader = this.createTeamName(-285, -108, playerOne.name);
    const playerTwoHeader = this.createTeamName(285, -108, playerTwo.name);

    panel.add([background, title, playerOneHeader, playerTwoHeader]);

    const rows: Array<[string, string, string]> = [
      ['Goals', String(playerOneStats.goals), String(playerTwoStats.goals)],
      ['Shots', String(playerOneStats.shots), String(playerTwoStats.shots)],
      ['Possession', formatPercent(playerOneStats.possession), formatPercent(playerTwoStats.possession)]
    ];

    rows.forEach(([label, playerOneValue, playerTwoValue], index) => {
      const rowY = -66 + index * 34;
      panel.add(this.createStatsValue(-285, rowY, playerOneValue));
      panel.add(this.createStatsLabel(rowY, label));
      panel.add(this.createStatsValue(285, rowY, playerTwoValue));
    });

    panel.add(this.createStatsLabel(58, 'Goalscorers'));
    this.addScorerTimeline(panel, x, y, width, playerOneStats, playerTwoStats);
  }

  private createScoreLine(
    x: number,
    y: number,
    playerOneName: string,
    playerTwoName: string,
    playerOneFlagCode: string,
    playerTwoFlagCode: string,
    playerOneGoals: number,
    playerTwoGoals: number
  ): void {
    const teamNameInnerGap = 96;
    const teamNameWidth = 260;
    const flagGap = 18;
    const flagWidth = 64;
    const flagHeight = 44;
    const scoreLine = this.add.container(x, y);
    const playerOneNameX = -teamNameInnerGap;
    const playerTwoNameX = teamNameInnerGap;

    const playerOneText = this.add
      .text(playerOneNameX, 0, playerOneName, {
        align: 'right',
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700',
        wordWrap: { width: teamNameWidth }
      })
      .setOrigin(1, 0.5);

    const score = this.add
      .text(0, 0, `${playerOneGoals} : ${playerTwoGoals}`, {
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const playerTwoText = this.add
      .text(playerTwoNameX, 0, playerTwoName, {
        align: 'left',
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700',
        wordWrap: { width: teamNameWidth }
      })
      .setOrigin(0, 0.5);

    const playerOneFlagX = playerOneText.x - playerOneText.width - flagGap - flagWidth / 2;
    const playerTwoFlagX = playerTwoText.x + playerTwoText.width + flagGap + flagWidth / 2;
    const playerOneFlag = this.add.image(playerOneFlagX, 0, getFlagAssetKey(playerOneFlagCode));
    playerOneFlag.setDisplaySize(flagWidth, flagHeight);
    const playerTwoFlag = this.add.image(playerTwoFlagX, 0, getFlagAssetKey(playerTwoFlagCode));
    playerTwoFlag.setDisplaySize(flagWidth, flagHeight);

    scoreLine.add([playerOneFlag, playerOneText, score, playerTwoText, playerTwoFlag]);
  }

  private createTeamName(x: number, y: number, name: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, name, {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        wordWrap: { width: 190 }
      })
      .setOrigin(0.5);
  }

  private createStatsLabel(y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(0, y, text, {
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
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createScorersList(x: number, y: number, text: string, side: 'left' | 'right'): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        align: side,
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        wordWrap: { width: 280 }
      })
      .setOrigin(side === 'left' ? 0 : 1, 0.5);
  }

  private addScorerTimeline(
    panel: Phaser.GameObjects.Container,
    panelX: number,
    panelY: number,
    panelWidth: number,
    playerOneStats: PlayerMatchStats,
    playerTwoStats: PlayerMatchStats
  ): void {
    const rows = createScorerTimeline(playerOneStats, playerTwoStats);
    const viewportTop = 78;
    const viewportHeight = 72;
    const viewportLeft = -panelWidth / 2 + 56;
    const viewportWidth = panelWidth - 112;
    const rowHeight = 24;
    const contentHeight = rows.length * rowHeight;
    const maxScroll = Math.max(0, contentHeight - viewportHeight);
    const timelineContent = this.add.container(0, viewportTop);
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(panelX + viewportLeft, panelY + viewportTop, viewportWidth, viewportHeight)
      .createGeometryMask();
    const scrollZone = this.add
      .zone(0, viewportTop + viewportHeight / 2, viewportWidth, viewportHeight)
      .setInteractive({ useHandCursor: maxScroll > 0 });
    const scrollbarTrack = this.add.rectangle(panelWidth / 2 - 32, viewportTop + viewportHeight / 2, 4, viewportHeight, 0x5f9572, 0.28);
    const thumbHeight = maxScroll === 0 ? viewportHeight : Math.max(18, (viewportHeight / contentHeight) * viewportHeight);
    const scrollbarThumb = this.add.rectangle(panelWidth / 2 - 32, viewportTop + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
    let scrollY = 0;

    maskGraphics.setVisible(false);
    timelineContent.setMask(mask);
    panel.add([timelineContent, scrollZone]);

    rows.forEach((row, index) => {
      const y = 12 + index * rowHeight;

      timelineContent.add(this.createScorersList(-285, y, row.playerOneText, 'left'));
      timelineContent.add(this.createScorersList(285, y, row.playerTwoText, 'right'));
    });

    if (maxScroll === 0) {
      scrollbarTrack.setVisible(false);
      scrollbarThumb.setVisible(false);
      return;
    }

    panel.add([scrollbarTrack, scrollbarThumb]);

    const setScroll = (value: number): void => {
      scrollY = Phaser.Math.Clamp(value, 0, maxScroll);
      timelineContent.y = viewportTop - scrollY;
      scrollbarThumb.y = viewportTop + thumbHeight / 2 + (scrollY / maxScroll) * (viewportHeight - thumbHeight);
    };

    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(scrollY + deltaY * 0.35);
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
    text: `${scorer.playerName} (turn ${scorer.turnNumber})`,
    turnNumber: scorer.turnNumber
  };
}
