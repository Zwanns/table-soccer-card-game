import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getMatchStats, type GameState, type PlayerMatchStats } from '../game';
import { getFlagAssetKey } from '../data/nationalTeams';
import { Button } from '../ui/Button';

interface ResultSceneData {
  state?: Readonly<GameState>;
}

export class ResultScene extends Phaser.Scene {
  private state: Readonly<GameState> | null = null;

  public constructor() {
    super('ResultScene');
  }

  public init(data: ResultSceneData): void {
    this.state = data.state ?? null;
  }

  public create(): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const playerOne = this.state?.players[0];
    const playerTwo = this.state?.players[1];
    const playerOneGoals = playerOne?.goals ?? 0;
    const playerTwoGoals = playerTwo?.goals ?? 0;
    const winner = this.state?.winnerId === null
      ? null
      : this.state?.players.find((player) => player.id === this.state?.winnerId) ?? null;
    const resultText = this.state?.isDraw === true ? 'Ничья' : `Победитель: ${winner?.name ?? 'не определен'}`;

    if (this.state?.phase === 'GAME_OVER') {
      this.sound.play('sound-whistle-finish', { volume: 0.68 });
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

    this.add
      .text(centerX, 236, resultText, {
        color: '#c2d1dc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    if (this.state !== null) {
      this.createMatchStatsPanel(centerX, 420, this.state);
    }

    new Button(this, centerX - 130, 650, 'Сыграть еще', () => this.scene.start('TeamSelectScene'));
    new Button(this, centerX + 130, 650, 'В меню', () => this.scene.start('MenuScene'));
  }

  private createMatchStatsPanel(x: number, y: number, state: Readonly<GameState>): void {
    const [playerOne, playerTwo] = state.players;
    const [playerOneStats, playerTwoStats] = getMatchStats(state);
    const width = 840;
    const height = 340;
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, height, 0x0b2118, 0.88);
    background.setStrokeStyle(2, 0x5f9572, 0.95);

    const title = this.add
      .text(0, -height / 2 + 28, 'Статистика матча', {
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
      ['Голы', String(playerOneStats.goals), String(playerTwoStats.goals)],
      ['Удары', String(playerOneStats.shots), String(playerTwoStats.shots)],
      ['Штанги', String(playerOneStats.goalpostHits), String(playerTwoStats.goalpostHits)],
      ['Сэйвы GK', String(playerOneStats.goalkeeperSaves), String(playerTwoStats.goalkeeperSaves)],
      ['Реализация', formatPercent(playerOneStats.shotAccuracy), formatPercent(playerTwoStats.shotAccuracy)],
      ['Владение мячом', formatPercent(playerOneStats.possession), formatPercent(playerTwoStats.possession)]
    ];

    rows.forEach(([label, playerOneValue, playerTwoValue], index) => {
      const rowY = -70 + index * 30;
      panel.add(this.createStatsValue(-285, rowY, playerOneValue));
      panel.add(this.createStatsLabel(rowY, label));
      panel.add(this.createStatsValue(285, rowY, playerTwoValue));
    });

    panel.add(this.createScorersList(-285, 122, formatFinalScorers(playerOneStats)));
    panel.add(this.createStatsLabel(122, 'ĐĐ˛Ń‚ĐľŃ€Ń‹'));
    panel.add(this.createScorersList(285, 122, formatFinalScorers(playerTwoStats)));
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
    const scoreLine = this.add.container(x, y);
    const playerOneFlag = this.add.image(-280, 0, getFlagAssetKey(playerOneFlagCode));
    playerOneFlag.setDisplaySize(52, 36);
    const playerTwoFlag = this.add.image(280, 0, getFlagAssetKey(playerTwoFlagCode));
    playerTwoFlag.setDisplaySize(52, 36);

    const playerOneText = this.add
      .text(-244, 0, playerOneName, {
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700',
        wordWrap: { width: 210 }
      })
      .setOrigin(0, 0.5);

    const score = this.add
      .text(0, 0, `${playerOneGoals} : ${playerTwoGoals}`, {
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const playerTwoText = this.add
      .text(244, 0, playerTwoName, {
        align: 'right',
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700',
        wordWrap: { width: 210 }
      })
      .setOrigin(1, 0.5);

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

  private createScorersList(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        wordWrap: { width: 250 }
      })
      .setOrigin(0.5);
  }
}

function formatPercent(value: PlayerMatchStats['shotAccuracy']): string {
  return `${value}%`;
}

function formatFinalScorers(stats: PlayerMatchStats): string {
  if (stats.scorers.length === 0) {
    return 'ĐżĐľĐşĐ° Đ˝ĐµŃ‚';
  }

  return stats.scorers
    .map((scorer) => `${scorer.playerName} (#${scorer.shirtNumber}), Ń…ĐľĐ´ ${scorer.turnNumber}`)
    .join('\n');
}
