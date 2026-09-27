import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from './Button';
import { MATCH_OVERLAY_DEPTH } from './matchPauseOverlay';

export function createMatchRestartConfirmation(
  scene: Phaser.Scene,
  onCancel: () => void,
  onRestart: () => void
): Phaser.GameObjects.Container {
  const modal = scene.add.container(0, 0).setDepth(MATCH_OVERLAY_DEPTH + 1);
  const overlay = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
  overlay.setInteractive();
  const panel = scene.add.container(SCENE_WIDTH / 2, SCENE_HEIGHT / 2);
  const background = scene.add.rectangle(0, 0, 620, 260, 0x0b2118, 0.98).setStrokeStyle(2, 0xf0c95a, 0.95);
  const title = scene.add.text(0, -82, 'Restart match?', {
    fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffffff', align: 'center'
  }).setOrigin(0.5);
  const body = scene.add.text(0, -22, 'Current match progress will be lost.', {
    fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#d9eadf', align: 'center'
  }).setOrigin(0.5);
  panel.add([background, title, body,
    new Button(scene, -145, 76, 'Cancel', onCancel, { width: 260 }),
    new Button(scene, 145, 76, 'Restart', onRestart, { width: 260 })]);
  modal.add([overlay, panel]);
  return modal;
}
