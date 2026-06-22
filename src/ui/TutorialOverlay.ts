import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import type { TutorialStep } from '../tutorial/tutorialTypes';
import { Button } from './Button';

export interface TutorialHighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialOverlayOptions {
  step: TutorialStep;
  highlightRects?: readonly TutorialHighlightRect[];
  onContinue: () => void;
}

const OVERLAY_DEPTH = 5000;
const PANEL_WIDTH = 620;
const PANEL_HEIGHT = 170;

export class TutorialOverlay extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, options: TutorialOverlayOptions) {
    super(scene, 0, 0);

    const dim = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x06130e, 0.48);
    this.add(dim);

    for (const rect of options.highlightRects ?? []) {
      this.add(createHighlight(scene, rect));
    }

    this.add(createPanel(scene, options));
    this.setDepth(OVERLAY_DEPTH);
    scene.add.existing(this);
  }
}

function createHighlight(scene: Phaser.Scene, rect: TutorialHighlightRect): Phaser.GameObjects.Graphics {
  const padding = 10;
  const highlight = scene.add.graphics();

  highlight.lineStyle(5, 0xf0c95a, 0.95);
  highlight.strokeRoundedRect(
    rect.x - rect.width / 2 - padding,
    rect.y - rect.height / 2 - padding,
    rect.width + padding * 2,
    rect.height + padding * 2,
    10
  );
  highlight.fillStyle(0xf0c95a, 0.12);
  highlight.fillRoundedRect(
    rect.x - rect.width / 2 - padding,
    rect.y - rect.height / 2 - padding,
    rect.width + padding * 2,
    rect.height + padding * 2,
    10
  );

  return highlight;
}

function createPanel(scene: Phaser.Scene, options: TutorialOverlayOptions): Phaser.GameObjects.Container {
  const panel = scene.add.container(SCENE_WIDTH / 2, SCENE_HEIGHT - 116);
  const background = scene.add.rectangle(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 0x0b2118, 0.94);
  background.setStrokeStyle(3, 0xf0c95a, 0.92);

  const title = scene.add
    .text(-PANEL_WIDTH / 2 + 28, -PANEL_HEIGHT / 2 + 22, options.step.title ?? 'Tutorial', {
      color: '#f0c95a',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '700'
    })
    .setOrigin(0, 0);

  const message = scene.add
    .text(-PANEL_WIDTH / 2 + 28, -PANEL_HEIGHT / 2 + 62, options.step.message, {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      wordWrap: { width: PANEL_WIDTH - 56 }
    })
    .setOrigin(0, 0);

  panel.add([background, title, message]);

  if (options.step.waitFor === 'next') {
    panel.add(
      new Button(scene, PANEL_WIDTH / 2 - 126, PANEL_HEIGHT / 2 - 38, 'Continue', options.onContinue, {
        fontSize: '18px',
        height: 42,
        width: 190
      })
    );
  }

  return panel;
}
