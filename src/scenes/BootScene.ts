import Phaser from 'phaser';
import {
  AVAILABLE_TEAM_COVER_FLAG_CODES,
  getFallbackCoverPath,
  getFallbackCoverTextureKey,
  getTeamCoverPath,
  getTeamCoverTextureKey
} from '../assets/teamCover';
import { MENU_ASSETS, MENU_ASSET_PATHS, TOURNAMENT_ASSETS, TOURNAMENT_ASSET_PATHS } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS } from '../data/nationalTeams';
import { getRegisteredKitAssetsToLoad } from './bootKitAssets';

const ASSET_PATHS = {
  ball: '/cards/ball.webp',
  goalNotificationGoalkeepers: [
    { textureKey: 'gk-goals', path: '/menu/gk-goals.webp' },
    { textureKey: 'gk-goals-2', path: '/menu/gk-goals-2.webp' },
    { textureKey: 'gk-goals-3', path: '/menu/gk-goals-3.webp' },
    { textureKey: 'gk-goals-4', path: '/menu/gk-goals-4.webp' },
    { textureKey: 'gk-goals-5', path: '/menu/gk-goals-5.webp' }
  ],
  goalkeeperSaveNotifications: [
    { textureKey: 'gk-save', path: '/menu/gk-save.webp' },
    { textureKey: 'gk-save-2', path: '/menu/gk-save-2.webp' },
    { textureKey: 'gk-save-3', path: '/menu/gk-save-3.webp' },
    { textureKey: 'gk-save-4', path: '/menu/gk-save-4.webp' },
    { textureKey: 'gk-save-5', path: '/menu/gk-save-5.webp' }
  ],
  matchFinishedReferee: '/menu/arbitr-end.webp',
  sounds: {
    whistleStart: '/sounds/referees-whistle-start.mp3',
    whistleFinish: '/sounds/referees-whistle-finish.mp3',
    goal: '/sounds/bolely-goal.mp3',
    penaltyGoal: '/sounds/penalty-goal.mp3',
    goalkeeperSave: '/sounds/bolely-net.mp3',
    goalpost: '/sounds/shtanga.mp3'
  }
} as const;

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.load.image(MENU_ASSETS.background, MENU_ASSET_PATHS.background);
    this.load.image(MENU_ASSETS.teamsBackground, MENU_ASSET_PATHS.teamsBackground);
    this.load.image(MENU_ASSETS.teamSelectBackground, MENU_ASSET_PATHS.teamSelectBackground);
    this.load.image(MENU_ASSETS.resultDrawBackground, MENU_ASSET_PATHS.resultDrawBackground);
    this.load.image(MENU_ASSETS.resultWinBackground, MENU_ASSET_PATHS.resultWinBackground);
    this.load.image(TOURNAMENT_ASSETS.background, TOURNAMENT_ASSET_PATHS.background);
    this.load.image(TOURNAMENT_ASSETS.statsBackground, TOURNAMENT_ASSET_PATHS.statsBackground);
    this.load.image(TOURNAMENT_ASSETS.winnerBackground, TOURNAMENT_ASSET_PATHS.winnerBackground);
    this.load.image(MENU_ASSETS.logoOn, MENU_ASSET_PATHS.logoOn);
    this.load.image(MENU_ASSETS.logoOff, MENU_ASSET_PATHS.logoOff);
    this.load.image('turn-ball', ASSET_PATHS.ball);
    for (const asset of ASSET_PATHS.goalNotificationGoalkeepers) {
      this.load.image(asset.textureKey, asset.path);
    }
    for (const asset of ASSET_PATHS.goalkeeperSaveNotifications) {
      this.load.image(asset.textureKey, asset.path);
    }
    this.load.image('arbitr-end', ASSET_PATHS.matchFinishedReferee);
    this.load.image(getFallbackCoverTextureKey(), getFallbackCoverPath());
    for (const flagCode of AVAILABLE_TEAM_COVER_FLAG_CODES) {
      this.load.image(getTeamCoverTextureKey(flagCode), getTeamCoverPath(flagCode));
    }

    for (const team of NATIONAL_TEAMS) {
      this.load.svg(getFlagAssetKey(team.flagCode), `flags/${team.flagCode}.svg`, { width: 96, height: 72 });
    }

    this.load.audio('sound-whistle-start', ASSET_PATHS.sounds.whistleStart);
    this.load.audio('sound-whistle-finish', ASSET_PATHS.sounds.whistleFinish);
    this.load.audio('sound-goal', ASSET_PATHS.sounds.goal);
    this.load.audio('sound-penalty-goal', ASSET_PATHS.sounds.penaltyGoal);
    this.load.audio('sound-goalkeeper-save', ASSET_PATHS.sounds.goalkeeperSave);
    this.load.audio('sound-goalpost', ASSET_PATHS.sounds.goalpost);

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
