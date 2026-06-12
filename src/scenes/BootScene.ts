import Phaser from 'phaser';
import {
  AVAILABLE_TEAM_COVER_FLAG_CODES,
  getFallbackCoverPath,
  getFallbackCoverTextureKey,
  getTeamCoverPath,
  getTeamCoverTextureKey
} from '../assets/teamCover';
import { MENU_ASSETS, MENU_ASSET_PATHS } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS } from '../data/nationalTeams';
import { getRegisteredKitAssetsToLoad } from './bootKitAssets';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.load.image(MENU_ASSETS.background, MENU_ASSET_PATHS.background);
    this.load.image(MENU_ASSETS.logo, MENU_ASSET_PATHS.logo);
    this.load.image('turn-ball', 'cards/ball.webp');
    this.load.image(getFallbackCoverTextureKey(), getFallbackCoverPath());
    for (const flagCode of AVAILABLE_TEAM_COVER_FLAG_CODES) {
      this.load.image(getTeamCoverTextureKey(flagCode), getTeamCoverPath(flagCode));
    }

    for (const team of NATIONAL_TEAMS) {
      this.load.svg(getFlagAssetKey(team.flagCode), `flags/${team.flagCode}.svg`, { width: 96, height: 72 });
    }

    this.load.audio('sound-whistle-start', 'Sounds/referees-whistle_start.mp3');
    this.load.audio('sound-whistle-finish', 'Sounds/referees-whistle_finish.mp3');
    this.load.audio('sound-goal', 'Sounds/bolely-goal.mp3');
    this.load.audio('sound-penalty-goal', 'Sounds/penalty-goal.mp3');
    this.load.audio('sound-goalkeeper-save', 'Sounds/bolely-net.mp3');
    this.load.audio('sound-goalpost', 'Sounds/shtanga.mp3');

    for (const asset of getRegisteredKitAssetsToLoad()) {
      this.load.image(asset.assetKey, asset.path);
    }
  }

  public create(): void {
    void this.startMenuWhenFontsAreReady();
  }

  private async startMenuWhenFontsAreReady(): Promise<void> {
    try {
      await Promise.all([
        document.fonts.load('64px DS-Digital'),
        document.fonts.load('400 42px Anton'),
        document.fonts.load('600 18px Oswald'),
        document.fonts.load('400 76px Bangers')
      ]);
      await document.fonts.ready;
    } finally {
      this.scene.start('MenuScene');
    }
  }
}
