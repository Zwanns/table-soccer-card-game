import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from './Button';

const PAUSE_MODAL_WIDTH = 460;
const PAUSE_MODAL_BACKGROUND_COLOR = 0x000000;
const PAUSE_MODAL_BACKGROUND_ALPHA = 0.82;
const PAUSE_BUTTON_WIDTH = 300;
const PAUSE_BUTTON_HEIGHT = 64;
const PAUSE_BUTTON_FONT_SIZE = '26px';
const PAUSE_BUTTON_GAP = 20;
export const MATCH_OVERLAY_DEPTH = 1000;

export interface MatchPauseAction {
  label: string;
  onClick: () => void;
}

export function createMatchPauseOverlay(scene: Phaser.Scene, actions: readonly MatchPauseAction[]): Phaser.GameObjects.Container {
  const centerX = SCENE_WIDTH / 2;
  const centerY = SCENE_HEIGHT / 2;
  const panelHeight = Math.max(248, 184 + actions.length * PAUSE_BUTTON_HEIGHT + Math.max(0, actions.length - 1) * PAUSE_BUTTON_GAP);
  const modal = scene.add.container(0, 0).setDepth(MATCH_OVERLAY_DEPTH);
  const overlay = scene.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
  overlay.setInteractive();

  const panel = scene.add.container(centerX, centerY);
  const background = scene.add.rectangle(0, 0, PAUSE_MODAL_WIDTH, panelHeight, PAUSE_MODAL_BACKGROUND_COLOR, PAUSE_MODAL_BACKGROUND_ALPHA);
  const titleY = -panelHeight / 2 + 90;
  const title = scene.add
    .text(0, titleY, 'Pause', {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      fontStyle: '700'
    })
    .setOrigin(0.5);
  const firstButtonY = titleY + 76;
  const buttons = actions.map(
    (action, index) =>
      new Button(scene, 0, firstButtonY + index * (PAUSE_BUTTON_HEIGHT + PAUSE_BUTTON_GAP), action.label, action.onClick, {
        fontSize: PAUSE_BUTTON_FONT_SIZE,
        height: PAUSE_BUTTON_HEIGHT,
        width: PAUSE_BUTTON_WIDTH
      })
  );

  panel.add([background, title, ...buttons]);
  modal.add([overlay, panel]);
  return modal;
}
