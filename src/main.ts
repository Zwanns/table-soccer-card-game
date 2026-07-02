import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SCENE_HEIGHT, SCENE_WIDTH } from './config';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultScene } from './scenes/ResultScene';
import { SquadEditorScene } from './scenes/SquadEditorScene';
import { SquadSelectScene } from './scenes/SquadSelectScene';
import { TeamSelectScene } from './scenes/TeamSelectScene';
import { TournamentCompleteScene } from './scenes/TournamentCompleteScene';
import { TournamentHubScene } from './scenes/TournamentHubScene';
import { TournamentPenaltyScene } from './scenes/TournamentPenaltyScene';
import { TournamentSetupScene } from './scenes/TournamentSetupScene';
import { appendDevLabScene, isDevLabEnabled } from './devLab';
import '@fontsource/anton/400.css';
import '@fontsource/bangers/400.css';
import '@fontsource/oswald/600.css';
import './styles/main.css';

const CORE_SCENES = [
  BootScene,
  MenuScene,
  TeamSelectScene,
  SquadSelectScene,
  SquadEditorScene,
  TournamentSetupScene,
  TournamentHubScene,
  TournamentPenaltyScene,
  TournamentCompleteScene,
  GameScene,
  ResultScene
] as const;

async function getConfiguredScenes(): Promise<Phaser.Types.Scenes.SceneType[]> {
  if (!import.meta.env.DEV || !isDevLabEnabled()) {
    return [...CORE_SCENES];
  }

  const { DevLabScene } = await import('./scenes/DevLabScene');
  return appendDevLabScene(CORE_SCENES, DevLabScene);
}

async function startGame(): Promise<void> {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    backgroundColor: '#0b5f3a',
    scene: await getConfiguredScenes(),
    dom: {
      createContainer: true
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  const game = new Phaser.Game(config);
  let scaleRefreshTimers: number[] = [];

  function scheduleScaleRefresh() {
    for (const timer of scaleRefreshTimers) {
      window.clearTimeout(timer);
    }

    scaleRefreshTimers = [
      window.setTimeout(() => {
        game.scale.refresh();
      }, 150),
      window.setTimeout(() => {
        game.scale.refresh();
      }, 500)
    ];
  }

  window.addEventListener('orientationchange', scheduleScaleRefresh);
  window.addEventListener('resize', scheduleScaleRefresh);
  window.addEventListener('tsm:landscape-visible', scheduleScaleRefresh);
}

void startGame();
