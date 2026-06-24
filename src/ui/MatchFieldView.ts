import Phaser from 'phaser';
import { MATCH_SCREEN_HEIGHT, MATCH_SCREEN_WIDTH } from './matchScreenLayout';
import { FIELD_VIEW_HEIGHT, FIELD_VIEW_WIDTH } from './fieldDimensions';

export const FIELD_GRASS_STRIPE_COUNT = 14;
export const FIELD_GRASS_BASE_COLOR = 0x157a43;
export const FIELD_GRASS_LIGHT_STRIPE_COLOR = 0x19864a;
export const FIELD_GRASS_DARK_STRIPE_COLOR = 0x126d3c;

const FIELD_MARKING_COLOR = 0xe2efe6;
const FIELD_MARKING_ALPHA = 0.42;
const FIELD_MARKING_WIDTH = 2;
const FIELD_GOAL_DEPTH = 42;
const FIELD_GOAL_HEIGHT = 131;
const FIELD_GOAL_FRAME_WIDTH = 4;
const FIELD_GOAL_FRAME_ALPHA = 0.55;
const FIELD_GOAL_NET_WIDTH = 1;
const FIELD_GOAL_NET_ALPHA = 0.24;
const FIELD_GOAL_NET_CELL_SIZE = 7;
const FIELD_CORNER_ARC_RADIUS = 22;

/** Shared match-screen grass, pitch markings and goals. */
export class MatchFieldView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const centerLine = scene.add.rectangle(0, 0, 2, FIELD_VIEW_HEIGHT, FIELD_MARKING_COLOR, FIELD_MARKING_ALPHA);
    const centerCircle = scene.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(FIELD_MARKING_WIDTH, FIELD_MARKING_COLOR, 0.45);

    this.add([this.createStripedPitch(scene, x, y), this.createPitchMarkings(scene), this.createGoals(scene), centerLine, centerCircle]);
    scene.add.existing(this);
  }

  private createStripedPitch(scene: Phaser.Scene, centerX: number, centerY: number): Phaser.GameObjects.Graphics {
    const pitch = scene.add.graphics();
    const pitchLeft = -FIELD_VIEW_WIDTH / 2;
    const pitchTop = -FIELD_VIEW_HEIGHT / 2;
    const grassLeft = -centerX;
    const grassTop = -centerY;
    const stripeWidth = FIELD_VIEW_WIDTH / FIELD_GRASS_STRIPE_COUNT;
    const firstStripeIndex = Math.floor((grassLeft - pitchLeft) / stripeWidth);
    const lastStripeIndex = Math.ceil((grassLeft + MATCH_SCREEN_WIDTH - pitchLeft) / stripeWidth);

    pitch.fillStyle(FIELD_GRASS_BASE_COLOR, 1);
    pitch.fillRect(grassLeft, grassTop, MATCH_SCREEN_WIDTH, MATCH_SCREEN_HEIGHT);

    for (let stripeIndex = firstStripeIndex; stripeIndex < lastStripeIndex; stripeIndex += 1) {
      const stripeColor = stripeIndex % 2 === 0 ? FIELD_GRASS_LIGHT_STRIPE_COLOR : FIELD_GRASS_DARK_STRIPE_COLOR;
      pitch.fillStyle(stripeColor, 0.28);
      pitch.fillRect(pitchLeft + stripeIndex * stripeWidth, grassTop, stripeWidth, MATCH_SCREEN_HEIGHT);
    }

    pitch.lineStyle(3, FIELD_MARKING_COLOR, 1);
    pitch.strokeRect(pitchLeft, pitchTop, FIELD_VIEW_WIDTH, FIELD_VIEW_HEIGHT);

    return pitch;
  }

  private createPitchMarkings(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const markings = scene.add.graphics();
    const pitchLeft = -FIELD_VIEW_WIDTH / 2;
    const pitchRight = FIELD_VIEW_WIDTH / 2;
    const pitchTop = -FIELD_VIEW_HEIGHT / 2;
    const pitchBottom = FIELD_VIEW_HEIGHT / 2;

    markings.lineStyle(FIELD_MARKING_WIDTH, FIELD_MARKING_COLOR, FIELD_MARKING_ALPHA);
    markings.strokeRect(pitchLeft, -180, 150, 360);
    markings.strokeRect(pitchRight - 150, -180, 150, 360);
    markings.strokeRect(pitchLeft, -95, 70, 190);
    markings.strokeRect(pitchRight - 70, -95, 70, 190);
    markings.strokeCircle(-450, 0, 4);
    markings.strokeCircle(450, 0, 4);

    markings.beginPath();
    markings.arc(-450, 0, 72, Phaser.Math.DegToRad(-56), Phaser.Math.DegToRad(56), false);
    markings.strokePath();
    markings.beginPath();
    markings.arc(450, 0, 72, Phaser.Math.DegToRad(124), Phaser.Math.DegToRad(236), false);
    markings.strokePath();

    drawCornerArc(markings, pitchLeft, pitchTop, 0, 90);
    drawCornerArc(markings, pitchRight, pitchTop, 90, 180);
    drawCornerArc(markings, pitchRight, pitchBottom, 180, 270);
    drawCornerArc(markings, pitchLeft, pitchBottom, 270, 360);

    return markings;
  }

  private createGoals(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const goals = scene.add.graphics();
    const pitchLeft = -FIELD_VIEW_WIDTH / 2;
    const pitchRight = FIELD_VIEW_WIDTH / 2;
    const goalTop = -FIELD_GOAL_HEIGHT / 2;

    drawGoal(goals, pitchLeft - FIELD_GOAL_DEPTH, goalTop, FIELD_GOAL_DEPTH, FIELD_GOAL_HEIGHT);
    drawGoal(goals, pitchRight, goalTop, FIELD_GOAL_DEPTH, FIELD_GOAL_HEIGHT);

    return goals;
  }
}

function drawCornerArc(graphics: Phaser.GameObjects.Graphics, x: number, y: number, start: number, end: number): void {
  graphics.beginPath();
  graphics.arc(x, y, FIELD_CORNER_ARC_RADIUS, Phaser.Math.DegToRad(start), Phaser.Math.DegToRad(end), false);
  graphics.strokePath();
}

function drawGoal(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
  graphics.lineStyle(FIELD_GOAL_NET_WIDTH, FIELD_MARKING_COLOR, FIELD_GOAL_NET_ALPHA);

  for (let netX = x + FIELD_GOAL_NET_CELL_SIZE; netX < x + width; netX += FIELD_GOAL_NET_CELL_SIZE) {
    graphics.lineBetween(netX, y, netX, y + height);
  }
  for (let netY = y + FIELD_GOAL_NET_CELL_SIZE; netY < y + height; netY += FIELD_GOAL_NET_CELL_SIZE) {
    graphics.lineBetween(x, netY, x + width, netY);
  }

  graphics.lineStyle(FIELD_GOAL_FRAME_WIDTH, FIELD_MARKING_COLOR, FIELD_GOAL_FRAME_ALPHA);
  graphics.strokeRect(x, y, width, height);
}
