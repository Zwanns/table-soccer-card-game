import { getTickerLayout } from './matchEventPresentation';
import { createTeamIdentityImage } from './teamIdentityImage';
import Phaser from 'phaser';
import { getTeamScoreboardCode } from '../data/nationalTeams';
import { MATCH_FIELD_WIDTH } from './matchScreenLayout';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_FONT_FAMILY,
  MATCH_HEADER_BORDER_ALPHA,
  MATCH_HEADER_BORDER_COLOR,
  MATCH_HEADER_BORDER_WIDTH
} from './scoreboardStyle';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

export const SCORE_CONTENT_WIDTH = 520;
export const SCORE_VIEW_WIDTH = MATCH_FIELD_WIDTH;
export const SCORE_VIEW_HEIGHT = 78;
export const SCORE_CONTENT_CENTER_X = 0;
export const SCORE_VIEW_DIVIDER_X = SCORE_CONTENT_CENTER_X + SCORE_CONTENT_WIDTH / 2;
export const SCORE_STEP_CENTER_X = (SCORE_VIEW_DIVIDER_X + SCORE_VIEW_WIDTH / 2) / 2;
export const SCORE_VIEW_BACKGROUND_COLOR = SCOREBOARD_BACKGROUND_COLOR;
export const SCORE_VIEW_BACKGROUND_ALPHA = SCOREBOARD_BACKGROUND_ALPHA;
export const SCORE_VIEW_BORDER_COLOR = MATCH_HEADER_BORDER_COLOR;
export const SCORE_VIEW_BORDER_ALPHA = MATCH_HEADER_BORDER_ALPHA;
export const SCORE_VIEW_BORDER_WIDTH = MATCH_HEADER_BORDER_WIDTH;
export const SCORE_VIEW_FONT_FAMILY = SCOREBOARD_FONT_FAMILY;

export const SCORE_CONTEXT_DIVIDER_X = -SCORE_VIEW_DIVIDER_X;
export const SCORE_CONTEXT_CENTER_X = -SCORE_STEP_CENTER_X;
export const SCORE_CONTEXT_TEXT_WIDTH = SCORE_VIEW_WIDTH / 2 - SCORE_VIEW_DIVIDER_X - 24;

export interface ScoreViewOptions {
  matchContext?: string;
  onScoreTap?: () => void;
  stepCounter?: {
    count: number;
    limit: number;
  };
  penaltyScore?: {
    playerOne: number;
    playerTwo: number;
  };
}

export class ScoreView extends Phaser.GameObjects.Container {
  private contextLabel?: Phaser.GameObjects.Text;
  private tickerCopy?: Phaser.GameObjects.Text;
  private tickerTween?: Phaser.Tweens.Tween;
  private contextText = '';

  public setContext(text: string): void {
    if (!this.contextLabel || this.contextText === text) return;
    this.contextText = text;
    this.tickerTween?.remove();
    this.contextLabel.setText(text);
    this.tickerCopy?.setText(text);
    const layout = getTickerLayout(this.contextLabel.width, SCORE_CONTEXT_TEXT_WIDTH);
    const left = SCORE_CONTEXT_CENTER_X - SCORE_CONTEXT_TEXT_WIDTH / 2;
    this.contextLabel.setX(layout.marquee ? left : SCORE_CONTEXT_CENTER_X - this.contextLabel.width / 2);
    this.tickerCopy?.setVisible(layout.marquee).setX(left + layout.distance);
    if (layout.marquee && this.tickerCopy) {
      this.tickerTween = this.scene.tweens.add({ targets: [this.contextLabel, this.tickerCopy],
        x: `-=${layout.distance}`, duration: layout.duration, ease: 'Linear', repeat: -1 });
    }
  }

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerOneName: string,
    playerTwoName: string,
    playerOneFlagCode: string,
    playerTwoFlagCode: string,
    playerOneGoals: number,
    playerTwoGoals: number,
    options: ScoreViewOptions = {}
  ) {
    super(scene, px(x), px(y));

    const background = scene.add.rectangle(0, 0, SCORE_VIEW_WIDTH, SCORE_VIEW_HEIGHT, SCORE_VIEW_BACKGROUND_COLOR, SCORE_VIEW_BACKGROUND_ALPHA);
    background.setStrokeStyle(SCORE_VIEW_BORDER_WIDTH, SCORE_VIEW_BORDER_COLOR, SCORE_VIEW_BORDER_ALPHA);

    const scoreContent = scene.add.container(SCORE_CONTENT_CENTER_X, 0);
    const divider = scene.add.rectangle(
      SCORE_VIEW_DIVIDER_X, 0, 1, SCORE_VIEW_HEIGHT - 20, SCORE_VIEW_BORDER_COLOR, SCORE_VIEW_BORDER_ALPHA
    );
    const stepText = options.stepCounter === undefined ? '' : `${options.stepCounter.count} / ${options.stepCounter.limit}`;
    const stepLabel = scene.add.text(SCORE_STEP_CENTER_X, -1, stepText, {
      color: '#f6e06e',
      fontFamily: SCORE_VIEW_FONT_FAMILY,
      fontSize: '34px',
      fontStyle: '400',
      resolution: SHARP_TEXT_RESOLUTION
    }).setOrigin(0.5);

    const playerOneFlag = this.createFlag(scene, -221, playerOneFlagCode);
    const playerTwoFlag = this.createFlag(scene, 221, playerTwoFlagCode);
    const playerOneLabel = this.createPlayerLabel(scene, -126, getTeamScoreboardCode(playerOneFlagCode), 'right');
    const playerTwoLabel = this.createPlayerLabel(scene, 126, getTeamScoreboardCode(playerTwoFlagCode), 'left');
    playerOneLabel.setX(playerOneFlag.x + playerOneFlag.displayWidth / 2 + 10 + playerOneLabel.displayWidth);
    playerTwoLabel.setX(playerTwoFlag.x - playerTwoFlag.displayWidth / 2 - 10 - playerTwoLabel.displayWidth);

    const label = scene.add
      .text(0, -1, `${playerOneGoals}:${playerTwoGoals}`, {
        color: '#f6e06e',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '64px',
        fontStyle: '400',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    if (options.onScoreTap) label.setInteractive({ useHandCursor: true }).on('pointerdown', options.onScoreTap);

    scoreContent.add([playerOneFlag, playerOneLabel, label, playerTwoLabel, playerTwoFlag]);
    this.add([background, scoreContent, divider, stepLabel]);

    const leftDivider = scene.add.rectangle(SCORE_CONTEXT_DIVIDER_X, 0, 1, SCORE_VIEW_HEIGHT - 20, SCORE_VIEW_BORDER_COLOR, SCORE_VIEW_BORDER_ALPHA);
    const style = { color: '#d9eadf', fontFamily: SCORE_VIEW_FONT_FAMILY,
      fontSize: '22px', fontStyle: '400', resolution: SHARP_TEXT_RESOLUTION };
    this.contextLabel = scene.add.text(0, 0, '', style).setOrigin(0, 0.5);
    this.tickerCopy = scene.add.text(0, 0, '', style).setOrigin(0, 0.5).setVisible(false);
    const maskGraphics = scene.make.graphics();
    maskGraphics.fillStyle(0xffffff).fillRect(x + SCORE_CONTEXT_CENTER_X - SCORE_CONTEXT_TEXT_WIDTH / 2, y - 29, SCORE_CONTEXT_TEXT_WIDTH, 58);
    const mask = maskGraphics.createGeometryMask();
    maskGraphics.setVisible(false);
    this.contextLabel.setMask(mask);
    this.tickerCopy.setMask(mask);
    this.add([leftDivider, this.contextLabel, this.tickerCopy]);
    this.setContext(options.matchContext ?? '');
    this.once('destroy', () => { this.tickerTween?.remove(); mask.destroy(); maskGraphics.destroy(); });

    if (options.penaltyScore !== undefined) {
      scoreContent.add(
        scene.add
          .text(0, 29, `PEN ${options.penaltyScore.playerOne}:${options.penaltyScore.playerTwo}`, {
            align: 'center',
            color: '#f0c95a',
            fontFamily: SCORE_VIEW_FONT_FAMILY,
            fontSize: '16px',
            fontStyle: '700',
            resolution: SHARP_TEXT_RESOLUTION
          })
          .setOrigin(0.5)
      );
    }

    scene.add.existing(this);
  }

  private createFlag(scene: Phaser.Scene, x: number, flagCode: string): Phaser.GameObjects.Image {
    const flag = createTeamIdentityImage(scene, px(x), 0, flagCode, 64, 48);
    return flag;
  }

  private createPlayerLabel(scene: Phaser.Scene, x: number, text: string, align: 'left' | 'right'): Phaser.GameObjects.Text {
    return scene.add
      .text(px(x), 0, text, {
        align,
        color: '#d9eadf',
        fontFamily: SCORE_VIEW_FONT_FAMILY,
        fontSize: '35px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width: 102 }
      })
      .setOrigin(align === 'left' ? 0 : 1, 0.5);
  }
}
