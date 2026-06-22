import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { GAME_LANGUAGES, getLanguageCode, type GameLanguage } from '../i18n/languageStore';
import { getTutorialText } from '../tutorial/tutorialTexts';
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
  language: GameLanguage;
  highlightRects?: readonly TutorialHighlightRect[];
  onContinue: () => void;
  onLanguageChange: (language: GameLanguage) => void;
}

const OVERLAY_DEPTH = 5000;
const PANEL_WIDTH = 840;
const PANEL_HEIGHT = 230;
const PANEL_BOTTOM_MARGIN = 26;
const PANEL_PADDING_X = 34;
const TITLE_TOP = 24;
const TITLE_WORD_WRAP_WIDTH = PANEL_WIDTH - 260;
const MESSAGE_TOP = 76;
const MESSAGE_WORD_WRAP_WIDTH = PANEL_WIDTH - PANEL_PADDING_X * 2;
const LANGUAGE_SELECTOR_RIGHT = 118;
const LANGUAGE_SELECTOR_TOP = 34;

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
  const panel = scene.add.container(SCENE_WIDTH / 2, SCENE_HEIGHT - PANEL_BOTTOM_MARGIN - PANEL_HEIGHT / 2);
  const background = scene.add.rectangle(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 0x0b2118, 0.94);
  const titleText =
    options.step.titleKey === undefined
      ? getTutorialText(options.language, 'tutorial.welcome.title')
      : getTutorialText(options.language, options.step.titleKey);

  const title = scene.add
    .text(-PANEL_WIDTH / 2 + PANEL_PADDING_X, -PANEL_HEIGHT / 2 + TITLE_TOP, titleText, {
      color: '#f0c95a',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '700',
      fixedWidth: TITLE_WORD_WRAP_WIDTH,
      wordWrap: { width: TITLE_WORD_WRAP_WIDTH }
    })
    .setOrigin(0, 0);

  const languageSelector = createLanguageSelector(scene, options);
  const message = scene.add
    .text(
      -PANEL_WIDTH / 2 + PANEL_PADDING_X,
      -PANEL_HEIGHT / 2 + MESSAGE_TOP,
      getTutorialText(options.language, options.step.messageKey),
      {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        lineSpacing: 6,
        fixedWidth: MESSAGE_WORD_WRAP_WIDTH,
        wordWrap: { width: MESSAGE_WORD_WRAP_WIDTH }
      }
    )
    .setOrigin(0, 0);

  panel.add([background, title, languageSelector, message]);

  if (options.step.waitFor === 'next') {
    panel.add(
      new Button(
        scene,
        PANEL_WIDTH / 2 - 126,
        PANEL_HEIGHT / 2 - 36,
        getTutorialText(options.language, 'tutorial.button.continue'),
        options.onContinue,
        {
          fontSize: '18px',
          height: 42,
          width: 190
        }
      )
    );
  }

  return panel;
}

function createLanguageSelector(scene: Phaser.Scene, options: TutorialOverlayOptions): Phaser.GameObjects.Container {
  const selector = scene.add.container(
    PANEL_WIDTH / 2 - LANGUAGE_SELECTOR_RIGHT,
    -PANEL_HEIGHT / 2 + LANGUAGE_SELECTOR_TOP
  );
  const startX = -54;

  GAME_LANGUAGES.forEach((language, index) => {
    const isActive = language === options.language;
    const label = scene.add
      .text(startX + index * 48, 0, getLanguageCode(language), {
        align: 'center',
        color: isActive ? '#f0c95a' : '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    if (!isActive) {
      label.setInteractive({ useHandCursor: true });
      label.on('pointerover', () => label.setColor('#ffffff'));
      label.on('pointerout', () => label.setColor('#d9eadf'));
      label.on('pointerdown', () => options.onLanguageChange(language));
    }

    selector.add(label);

    if (index < GAME_LANGUAGES.length - 1) {
      selector.add(
        scene.add
          .text(startX + index * 48 + 24, 0, '|', {
            color: '#5f9572',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: '700'
          })
          .setOrigin(0.5)
      );
    }
  });

  return selector;
}
