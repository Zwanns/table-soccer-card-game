import Phaser from 'phaser';
import { GAME_TITLE, GAME_VERSION, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getLanguageCode, type GameLanguage } from '../i18n/languageStore';
import { Button } from './Button';
import { MATCH_OVERLAY_DEPTH } from './matchPauseOverlay';
import { clampScroll, createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR } from './touchInput';

const MODAL_WIDTH = 960;
const MODAL_HEIGHT = 600;
const VIEWPORT = { x: -390, y: -150, width: 780, height: 360 } as const;

export interface MatchRulesContent {
  title: string;
  sections: readonly { heading: string; body: readonly string[] }[];
}

export interface MatchRulesOverlayConfig {
  scene: Phaser.Scene;
  language: GameLanguage;
  languages: readonly GameLanguage[];
  content: Record<GameLanguage, MatchRulesContent>;
  onClose: () => void;
  onLanguageChange: (language: GameLanguage) => void;
}

export function createMatchRulesOverlay(config: MatchRulesOverlayConfig): Phaser.GameObjects.Container {
  const { scene } = config;
  const centerX = SCENE_WIDTH / 2;
  const centerY = SCENE_HEIGHT / 2;
  const rules = config.content[config.language];
  const modal = scene.add.container(0, 0).setDepth(MATCH_OVERLAY_DEPTH);
  const overlay = scene.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
  overlay.setInteractive();

  const panel = scene.add.container(centerX, centerY);
  const background = scene.add.rectangle(0, 0, MODAL_WIDTH, MODAL_HEIGHT, 0x000000, 0.82);
  const backButton = new Button(scene, 0, 258, 'Back', config.onClose, { fontSize: '18px', height: 42, width: 190 });
  const languageSelector = createLanguageSelector(config, 336, -258);
  const title = scene.add
    .text(0, -252, rules.title, {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      fontStyle: '700'
    })
    .setOrigin(0.5);
  const subtitle = scene.add
    .text(0, -214, `${GAME_TITLE} | v${GAME_VERSION}`, {
      align: 'center',
      color: '#f0c95a',
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: '700'
    })
    .setOrigin(0.5);
  const viewport = createRulesViewport(scene, rules);

  panel.add([background, backButton, languageSelector, title, subtitle, viewport]);
  modal.add([overlay, panel]);
  return modal;
}

function createLanguageSelector(config: MatchRulesOverlayConfig, x: number, y: number): Phaser.GameObjects.Container {
  const { scene } = config;
  const selector = scene.add.container(x, y);
  const startX = -62;

  config.languages.forEach((language, index) => {
    const isActive = language === config.language;
    const label = scene.add
      .text(startX + index * 54, 0, getLanguageCode(language), {
        align: 'center',
        color: isActive ? '#f0c95a' : '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    if (!isActive) {
      label.setInteractive({ useHandCursor: true });
      label.on('pointerover', () => label.setColor('#ffffff'));
      label.on('pointerout', () => label.setColor('#d9eadf'));
      label.on('pointerdown', () => config.onLanguageChange(language));
    }
    selector.add(label);

    if (index < config.languages.length - 1) {
      selector.add(
        scene.add
          .text(startX + index * 54 + 27, 0, '|', {
            color: '#5f9572',
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontStyle: '700'
          })
          .setOrigin(0.5)
      );
    }
  });

  return selector;
}

function createRulesViewport(scene: Phaser.Scene, content: MatchRulesContent): Phaser.GameObjects.Container {
  const wrapper = scene.add.container(0, 0);
  const scrollContent = scene.add.container(0, VIEWPORT.y);
  let contentHeight = 0;

  content.sections.forEach((section, index) => {
    const heading = scene.add
      .text(VIEWPORT.x, contentHeight, section.heading, {
        align: 'left',
        color: index === 0 ? '#f0c95a' : '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: index === 0 ? '22px' : '19px',
        fontStyle: '700',
        wordWrap: { width: VIEWPORT.width }
      })
      .setOrigin(0, 0);
    scrollContent.add(heading);
    contentHeight += heading.height + 8;

    section.body.forEach((paragraph) => {
      const body = scene.add
        .text(VIEWPORT.x, contentHeight, paragraph, {
          align: 'left',
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          lineSpacing: 8,
          wordWrap: { width: VIEWPORT.width }
        })
        .setOrigin(0, 0);
      scrollContent.add(body);
      contentHeight += body.height + 6;
    });
    contentHeight += 12;
  });

  applyScrollableViewport(scene, wrapper, scrollContent, contentHeight);
  return wrapper;
}

function applyScrollableViewport(
  scene: Phaser.Scene,
  wrapper: Phaser.GameObjects.Container,
  scrollContent: Phaser.GameObjects.Container,
  contentHeight: number
): void {
  const maxScroll = Math.max(0, contentHeight - VIEWPORT.height);
  const maskGraphics = scene.make.graphics();
  const mask = maskGraphics
    .fillStyle(0xffffff)
    .fillRect(SCENE_WIDTH / 2 + VIEWPORT.x, SCENE_HEIGHT / 2 + VIEWPORT.y, VIEWPORT.width, VIEWPORT.height)
    .createGeometryMask();
  maskGraphics.setVisible(false);
  scrollContent.setMask(mask);
  wrapper.once(Phaser.GameObjects.Events.DESTROY, () => maskGraphics.destroy());

  const scrollZone = scene.add.zone(0, VIEWPORT.y + VIEWPORT.height / 2, VIEWPORT.width, VIEWPORT.height).setInteractive();
  wrapper.add([scrollContent, scrollZone]);

  if (maxScroll <= 0) {
    return;
  }

  const trackX = VIEWPORT.x + VIEWPORT.width + 16;
  const track = scene.add.rectangle(trackX, VIEWPORT.y + VIEWPORT.height / 2, 4, VIEWPORT.height, 0x5f9572, 0.28);
  const thumbHeight = Math.max(28, (VIEWPORT.height / contentHeight) * VIEWPORT.height);
  const thumb = scene.add.rectangle(trackX, VIEWPORT.y + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
  let scrollY = 0;
  const setScroll = (value: number): void => {
    scrollY = clampScroll(value, maxScroll);
    scrollContent.y = VIEWPORT.y - scrollY;
    thumb.y = VIEWPORT.y + thumbHeight / 2 + (scrollY / maxScroll) * (VIEWPORT.height - thumbHeight);
  };
  const dragScroll = createDragScrollArea({
    scene,
    viewport: {
      x: SCENE_WIDTH / 2 + VIEWPORT.x,
      y: SCENE_HEIGHT / 2 + VIEWPORT.y,
      width: VIEWPORT.width,
      height: VIEWPORT.height
    },
    maxScroll,
    getScroll: () => scrollY,
    setScroll
  });

  scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
    setScroll(scrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
  });
  dragScroll.bindDragTarget(scrollZone);
  wrapper.add([track, thumb]);
}
