import Phaser from 'phaser';

export interface TeamStatsViewOptions {
  align: 'left' | 'right';
  scorers: readonly string[];
}

export class TeamStatsView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: TeamStatsViewOptions) {
    super(scene, x, y);

    const width = 200;
    const height = 126;
    const viewportTop = -16;
    const viewportHeight = 78;
    const viewportWidth = width - 32;
    const textOriginX = options.align === 'left' ? 0 : 1;
    const textX = options.align === 'left' ? -width / 2 + 16 : width / 2 - 16;
    const textAlign = options.align;
    const scorersText = options.scorers.length === 0 ? '-' : options.scorers.join('\n');

    const background = scene.add.rectangle(0, 0, width, height, 0x143f2d, 0.82);

    const title = scene.add
      .text(textX, -42, 'Goals', {
        align: textAlign,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(textOriginX, 0.5);

    const scorersContent = scene.add.container(0, viewportTop);
    const scorers = scene.add
      .text(textX, 0, scorersText, {
        align: textAlign,
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        lineSpacing: 3,
        wordWrap: { width: viewportWidth }
      })
      .setOrigin(textOriginX, 0);
    scorersContent.add(scorers);

    const maskGraphics = scene.add.graphics();
    const maskLeft = -width / 2 + 16;
    const maskTop = viewportTop;
    const mask = maskGraphics.fillStyle(0xffffff).fillRect(maskLeft, maskTop, viewportWidth, viewportHeight).createGeometryMask();
    const scrollZone = scene.add
      .zone(0, viewportTop + viewportHeight / 2, viewportWidth, viewportHeight)
      .setInteractive({ useHandCursor: scorers.height > viewportHeight });
    const scrollbarTrack = scene.add.rectangle(width / 2 - 7, viewportTop + viewportHeight / 2, 3, viewportHeight, 0xd9eadf, 0.2);
    const thumbHeight =
      scorers.height <= viewportHeight ? viewportHeight : Math.max(18, (viewportHeight / scorers.height) * viewportHeight);
    const scrollbarThumb = scene.add.rectangle(width / 2 - 7, viewportTop + thumbHeight / 2, 5, thumbHeight, 0xf0c95a, 0.88);
    const maxScroll = Math.max(0, scorers.height - viewportHeight);
    let scrollY = 0;

    scorersContent.setMask(mask);
    maskGraphics.setVisible(false);

    if (maxScroll === 0) {
      scrollbarTrack.setVisible(false);
      scrollbarThumb.setVisible(false);
    } else {
      const setScroll = (value: number): void => {
        scrollY = Phaser.Math.Clamp(value, 0, maxScroll);
        scorersContent.y = viewportTop - scrollY;
        scrollbarThumb.y = viewportTop + thumbHeight / 2 + (scrollY / maxScroll) * (viewportHeight - thumbHeight);
      };

      scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        setScroll(scrollY + deltaY * 0.35);
      });
    }

    this.add([background, title, maskGraphics, scorersContent, scrollZone, scrollbarTrack, scrollbarThumb]);
    scene.add.existing(this);
  }
}
