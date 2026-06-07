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

    this.add
      .text(centerX, 186, `${playerOne?.name ?? 'France'} ${playerOneGoals} : ${playerTwoGoals} ${playerTwo?.name ?? 'Spain'}`, {
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

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
    const width = 760;
    const height = 290;
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

    const playerOneHeader = this.createTeamHeader(-250, -88, playerOne.name, playerOne.flagCode);
    const playerTwoHeader = this.createTeamHeader(250, -88, playerTwo.name, playerTwo.flagCode);

    panel.add([background, title, playerOneHeader, playerTwoHeader]);

    const rows: Array<[string, string, string]> = [
      ['Голы', String(playerOneStats.goals), String(playerTwoStats.goals)],
      ['Удары', String(playerOneStats.shots), String(playerTwoStats.shots)],
      ['Штанги', String(playerOneStats.goalpostHits), String(playerTwoStats.goalpostHits)],
      ['Сэйвы GK', String(playerOneStats.goalkeeperSaves), String(playerTwoStats.goalkeeperSaves)],
      ['Реализация', formatPercent(playerOneStats.shotAccuracy), formatPercent(playerTwoStats.shotAccuracy)]
    ];

    rows.forEach(([label, playerOneValue, playerTwoValue], index) => {
      const rowY = -34 + index * 36;
      panel.add(this.createStatsValue(-250, rowY, playerOneValue));
      panel.add(this.createStatsLabel(rowY, label));
      panel.add(this.createStatsValue(250, rowY, playerTwoValue));
    });
  }

  private createTeamHeader(x: number, y: number, name: string, flagCode: string): Phaser.GameObjects.Container {
    const header = this.add.container(x, y);
    const flag = this.add.image(-58, 0, getFlagAssetKey(flagCode));
    flag.setDisplaySize(48, 34);
    const text = this.add
      .text(-22, 0, name, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        wordWrap: { width: 180 }
      })
      .setOrigin(0, 0.5);

    header.add([flag, text]);
    return header;
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
}

function formatPercent(value: PlayerMatchStats['shotAccuracy']): string {
  return `${value}%`;
}
