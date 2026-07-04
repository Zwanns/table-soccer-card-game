import Phaser from 'phaser';
import { Button } from './Button';
import { isMobileLandscapeLayout } from './mobileLayout';
import { SCOREBOARD_BACKGROUND_ALPHA, SCOREBOARD_BACKGROUND_COLOR } from './scoreboardStyle';

export const MATCH_FINISHED_MODAL = {
  width: 620,
  height: 430,
  imageWidth: 372,
  imageHeight: 310,
  imageY: -114,
  titleY: 38,
  bodyY: 104,
  buttonY: 174,
  buttonWidth: 524,
  buttonHeight: 58
} as const;

export const MATCH_FINISHED_MOBILE_LANDSCAPE_MODAL = {
  width: 760,
  height: 520,
  imageWidth: 468,
  imageHeight: 390,
  imageY: -72,
  titleY: 28,
  bodyY: 112,
  buttonY: 198,
  buttonWidth: 664,
  buttonHeight: 86,
  titleFontSize: '42px',
  bodyFontSize: '32px',
  buttonFontSize: '34px',
  panelOffsetY: 52,
  panelFadeHeight: 174,
  contentPaddingX: 70
} as const;

export interface MatchFinishedModalLayoutOverrides {
  refereeWidth?: number;
  refereeHeight?: number;
  refereeOffsetY?: number;
  titleAboveReferee?: boolean;
  okButtonFullWidth?: boolean;
  okButtonWidth?: number;
  contentPaddingX?: number;
}

export interface MatchFinishedModalOptions {
  centerX: number;
  centerY: number;
  overlayWidth: number;
  overlayHeight: number;
  bodyText: string;
  onOk: () => void;
  depth?: number;
  layout?: MatchFinishedModalLayoutOverrides;
}

export function createMatchFinishedModal(
  scene: Phaser.Scene,
  options: MatchFinishedModalOptions
): Phaser.GameObjects.Container {
  const layout = resolveMatchFinishedModalLayout(scene, options.layout);
  const modal = scene.add.container(0, 0).setDepth(options.depth ?? 1100);
  const overlay = scene.add.rectangle(
    options.centerX,
    options.centerY,
    options.overlayWidth,
    options.overlayHeight,
    0x06140f,
    0.74
  );
  overlay.setInteractive();

  const panel = scene.add.container(options.centerX, options.centerY + layout.panelOffsetY);
  const background = createMatchFinishedPanelBackground(scene, layout);
  const refereeVisual = createMatchFinishedRefereeVisual(scene, layout);
  const title = scene.add
    .text(0, layout.titleY, 'Final whistle', {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: layout.titleFontSize,
      fontStyle: '700'
    })
    .setOrigin(0.5);
  const body = scene.add
    .text(0, layout.bodyY, options.bodyText, {
      align: 'center',
      color: '#d9eadf',
      fontFamily: 'Arial, sans-serif',
      fontSize: layout.bodyFontSize,
      wordWrap: { width: layout.contentWidth }
    })
    .setOrigin(0.5);
  const okButton = new Button(scene, 0, layout.buttonY, 'OK', options.onOk, {
    borderRadius: 8,
    borderWidth: 0,
    fontSize: layout.buttonFontSize,
    height: layout.buttonHeight,
    width: layout.okButtonWidth
  });

  panel.add(
    layout.titleAboveReferee
      ? [background, refereeVisual, title, body, okButton]
      : [background, title, refereeVisual, body, okButton]
  );
  modal.add([overlay, panel]);

  return modal;
}

function createMatchFinishedPanelBackground(
  scene: Phaser.Scene,
  layout: ResolvedMatchFinishedModalLayout
): Phaser.GameObjects.Graphics {
  const background = scene.add.graphics();
  const left = -layout.width / 2;
  const top = -layout.height / 2;

  if (layout.panelFadeHeight <= 0) {
    background.fillStyle(SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
    background.fillRect(left, top, layout.width, layout.height);
    return background;
  }

  const fadeHeight = layout.panelFadeHeight;
  background.fillGradientStyle(
    SCOREBOARD_BACKGROUND_COLOR,
    SCOREBOARD_BACKGROUND_COLOR,
    SCOREBOARD_BACKGROUND_COLOR,
    SCOREBOARD_BACKGROUND_COLOR,
    0,
    0,
    SCOREBOARD_BACKGROUND_ALPHA,
    SCOREBOARD_BACKGROUND_ALPHA
  );
  background.fillRect(left, top, layout.width, fadeHeight);
  background.fillStyle(SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
  background.fillRect(left, top + fadeHeight, layout.width, layout.height - fadeHeight);

  return background;
}

function createMatchFinishedRefereeVisual(
  scene: Phaser.Scene,
  layout: ResolvedMatchFinishedModalLayout
): Phaser.GameObjects.GameObject {
  if (!scene.textures.exists('arbitr-end')) {
    const fallback = scene.add.container(0, layout.refereeY);
    const placeholder = scene.add.graphics();
    placeholder.fillStyle(0x142a21, 1);
    placeholder.fillRoundedRect(
      -layout.refereeWidth / 2,
      -layout.refereeHeight / 2,
      layout.refereeWidth,
      layout.refereeHeight,
      12
    );
    placeholder.lineStyle(2, 0x5f9572, 0.8);
    placeholder.strokeRoundedRect(
      -layout.refereeWidth / 2,
      -layout.refereeHeight / 2,
      layout.refereeWidth,
      layout.refereeHeight,
      12
    );
    fallback.add(placeholder);
    return fallback;
  }

  const image = scene.add.image(0, layout.refereeY, 'arbitr-end');
  const source = scene.textures.get('arbitr-end').getSourceImage() as { width: number; height: number };
  const scale = Math.min(layout.refereeWidth / source.width, layout.refereeHeight / source.height);
  image.setDisplaySize(source.width * scale, source.height * scale);
  return image;
}

interface ResolvedMatchFinishedModalLayout {
  bodyFontSize: string;
  bodyY: number;
  buttonFontSize: string;
  buttonHeight: number;
  buttonY: number;
  contentWidth: number;
  height: number;
  okButtonWidth: number;
  panelFadeHeight: number;
  panelOffsetY: number;
  refereeHeight: number;
  refereeWidth: number;
  refereeY: number;
  titleFontSize: string;
  titleAboveReferee: boolean;
  titleY: number;
  width: number;
}

function resolveMatchFinishedModalLayout(
  scene: Phaser.Scene,
  overrides: MatchFinishedModalLayoutOverrides = {}
): ResolvedMatchFinishedModalLayout {
  const baseLayout = shouldUseMobileLandscapeMatchFinishedLayout(scene)
    ? MATCH_FINISHED_MOBILE_LANDSCAPE_MODAL
    : {
        ...MATCH_FINISHED_MODAL,
        titleFontSize: '30px',
        bodyFontSize: '20px',
        buttonFontSize: '24px',
        panelFadeHeight: 0,
        panelOffsetY: 0,
        contentPaddingX: 48
      };
  const contentPaddingX = overrides.contentPaddingX ?? baseLayout.contentPaddingX;
  const contentWidth = baseLayout.width - contentPaddingX * 2;
  const okButtonWidth =
    overrides.okButtonWidth ??
    (overrides.okButtonFullWidth === true ? contentWidth : baseLayout.buttonWidth);

  return {
    bodyFontSize: baseLayout.bodyFontSize,
    bodyY: baseLayout.bodyY,
    buttonFontSize: baseLayout.buttonFontSize,
    buttonHeight: baseLayout.buttonHeight,
    buttonY: baseLayout.buttonY,
    contentWidth,
    height: baseLayout.height,
    okButtonWidth,
    panelFadeHeight: baseLayout.panelFadeHeight,
    panelOffsetY: baseLayout.panelOffsetY,
    refereeHeight: overrides.refereeHeight ?? baseLayout.imageHeight,
    refereeWidth: overrides.refereeWidth ?? baseLayout.imageWidth,
    refereeY: baseLayout.imageY + (overrides.refereeOffsetY ?? 0),
    titleAboveReferee: overrides.titleAboveReferee ?? true,
    titleFontSize: baseLayout.titleFontSize,
    titleY: baseLayout.titleY,
    width: baseLayout.width
  };
}

function shouldUseMobileLandscapeMatchFinishedLayout(scene: Phaser.Scene): boolean {
  const scale = scene.scale as Phaser.Scale.ScaleManager & {
    displaySize?: { width?: number; height?: number };
    parentSize?: { width?: number; height?: number };
  };
  const browserGlobal = globalThis as typeof globalThis & {
    innerWidth?: number;
    innerHeight?: number;
    matchMedia?: (query: string) => { matches: boolean };
    navigator?: { maxTouchPoints?: number };
    ontouchstart?: unknown;
  };
  const innerWidth = scale.displaySize?.width ?? scale.parentSize?.width ?? browserGlobal.innerWidth;
  const innerHeight = scale.displaySize?.height ?? scale.parentSize?.height ?? browserGlobal.innerHeight;

  return isMobileLandscapeLayout({
    innerWidth,
    innerHeight,
    matchMedia: browserGlobal.matchMedia?.bind(browserGlobal),
    maxTouchPoints: browserGlobal.navigator?.maxTouchPoints,
    ...('ontouchstart' in browserGlobal ? { ontouchstart: browserGlobal.ontouchstart } : {})
  });
}
