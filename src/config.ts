export const GAME_TITLE = 'Total Soccer: Mundial';
export const GAME_VERSION = '1.3.8';
export const GAME_AUTHOR = 'Oleh Myronchuk';
export const GAME_AUTHOR_URL = 'https://www.linkedin.com/in/myronczuk-oleg/';
export const SCENE_WIDTH = 1600;
export const SCENE_HEIGHT = 720;

export const MENU_ASSETS = {
  background: 'menu-bg',
  teamsBackground: 'teams-bg',
  teamSelectBackground: 'team-select-bg',
  resultDrawBackground: 'result-draw-bg',
  resultWinBackground: 'result-win-bg',
  logoOn: 'menu-logo-on',
  logoOff: 'menu-logo-off',
  flags: 'menu-flags'
} as const;

export const MENU_ASSET_PATHS = {
  background: 'menu/menu-bg.webp',
  teamsBackground: 'menu/teams-bg.webp',
  teamSelectBackground: 'menu/menu-2-bg.webp',
  resultDrawBackground: 'menu/remis-bg.webp',
  resultWinBackground: 'menu/gamestat-bg.webp',
  logoOn: 'menu/menu-logo1.png',
  logoOff: 'menu/menu-logo2.png',
  flags: 'menu/menu-flags.png'
} as const;

export const TOURNAMENT_ASSETS = {
  background: 'tournaments-bg',
  statsBackground: 'cup-stats-bg',
  winnerBackground: 'cup-win-bg'
} as const;

export const TOURNAMENT_ASSET_PATHS = {
  background: '/menu/tournaments-bg.webp',
  statsBackground: '/menu/cup-stats-bg.webp',
  winnerBackground: '/menu/cup-win-bg.webp'
} as const;
