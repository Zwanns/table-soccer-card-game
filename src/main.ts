import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SCENE_HEIGHT, SCENE_WIDTH } from './config';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultScene } from './scenes/ResultScene';
import { SquadEditorScene } from './scenes/SquadEditorScene';
import { SquadSelectScene } from './scenes/SquadSelectScene';
import { TeamSelectScene } from './scenes/TeamSelectScene';
import './styles/main.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: SCENE_WIDTH,
  height: SCENE_HEIGHT,
  backgroundColor: '#0b5f3a',
  scene: [BootScene, MenuScene, TeamSelectScene, SquadSelectScene, SquadEditorScene, GameScene, ResultScene],
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
