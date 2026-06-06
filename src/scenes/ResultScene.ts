import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import type { GameState } from '../game';
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
      .text(centerX, 220, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '54px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 304, `${playerOne?.name ?? 'France'} ${playerOneGoals} : ${playerTwoGoals} ${playerTwo?.name ?? 'Spain'}`, {
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 358, resultText, {
        color: '#c2d1dc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    new Button(this, centerX - 130, 456, 'Сыграть еще', () => this.scene.start('TeamSelectScene'));
    new Button(this, centerX + 130, 456, 'В меню', () => this.scene.start('MenuScene'));
  }
}
