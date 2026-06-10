import Phaser from 'phaser';

export interface TeamStatsViewOptions {
  align: 'left' | 'right';
  shots: number;
  scorers: readonly string[];
}

export class TeamStatsView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: TeamStatsViewOptions) {
    super(scene, x, y);

    const width = 200;
    const height = 126;
    const textOriginX = options.align === 'left' ? 0 : 1;
    const textX = options.align === 'left' ? -width / 2 + 16 : width / 2 - 16;
    const textAlign = options.align;
    const scorersText = options.scorers.length === 0 ? 'None yet' : options.scorers.join(', ');

    const background = scene.add.rectangle(0, 0, width, height, 0x143f2d, 0.82);
    background.setStrokeStyle(2, 0x69a77b, 0.75);

    const title = scene.add
      .text(textX, -42, 'Stats', {
        align: textAlign,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(textOriginX, 0.5);

    const shots = scene.add
      .text(textX, -10, `Shots: ${options.shots}`, {
        align: textAlign,
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px'
      })
      .setOrigin(textOriginX, 0.5);

    const scorers = scene.add
      .text(textX, 26, `Goals: ${scorersText}`, {
        align: textAlign,
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        wordWrap: { width: width - 32 }
      })
      .setOrigin(textOriginX, 0.5);

    this.add([background, title, shots, scorers]);
    scene.add.existing(this);
  }
}
