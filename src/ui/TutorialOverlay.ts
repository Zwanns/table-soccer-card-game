import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { GAME_LANGUAGES, getLanguageCode, type GameLanguage } from '../i18n/languageStore';
import { getTutorialText } from '../tutorial/tutorialTexts';
import type { TutorialStep } from '../tutorial/tutorialTypes';
import { Button } from './Button';
import {
  formatTutorialOverlayMessage,
  getTutorialOverlayLayout,
  resolveTutorialPanelY,
  type TutorialOverlayLayout
} from './tutorialOverlayLayout';

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

export class TutorialOverlay extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, options: TutorialOverlayOptions) {
    super(scene, 0, 0);

    const layout = getTutorialOverlayLayout(SCENE_WIDTH, SCENE_HEIGHT);
    const dim = scene.add.rectangle(
      SCENE_WIDTH / 2,
      SCENE_HEIGHT / 2,
      SCENE_WIDTH,
      SCENE_HEIGHT,
      0x06130e,
      layout.mobile ? 0.26 : 0.48
    );
    this.add(dim);

    for (const rect of options.highlightRects ?? []) {
      this.add(createHighlight(scene, rect));
    }

    this.add(createPanel(scene, options, layout));
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

function createPanel(
  scene: Phaser.Scene,
  options: TutorialOverlayOptions,
  layout: TutorialOverlayLayout
): Phaser.GameObjects.Container {
  const panel = scene.add.container(
    layout.panelX,
    resolveTutorialPanelY(layout, options.highlightRects ?? [])
  );
  const panelBackground = scene.add.rectangle(0, 0, layout.panelWidth, layout.panelHeight, 0x0b2118, 0.97);
  const titleText =
    options.step.titleKey === undefined
      ? getTutorialText(options.language, 'tutorial.welcome.title')
      : getTutorialText(options.language, options.step.titleKey);

  const title = scene.add
    .text(-layout.panelWidth / 2 + layout.panelPaddingX, -layout.panelHeight / 2 + layout.titleTop, titleText, {
      color: '#f0c95a',
      fontFamily: 'Arial, sans-serif',
      fontSize: `${layout.titleFontSize}px`,
      fontStyle: '700',
      fixedWidth: layout.titleWordWrapWidth,
      wordWrap: { width: layout.titleWordWrapWidth }
    })
    .setOrigin(0, 0);

  const languageSelector = createLanguageSelector(scene, options, layout);
  const message = scene.add
    .text(
      -layout.panelWidth / 2 + layout.panelPaddingX,
      -layout.panelHeight / 2 + layout.messageTop,
      formatTutorialOverlayMessage(getTutorialText(options.language, options.step.messageKey), layout.mobile),
      {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${layout.messageFontSize}px`,
        lineSpacing: layout.messageLineSpacing,
        fixedWidth: layout.messageWordWrapWidth,
        wordWrap: { width: layout.messageWordWrapWidth }
      }
    )
    .setOrigin(0, 0);

  panel.add([panelBackground, title, languageSelector, message]);

  if (options.step.waitFor === 'next') {
    panel.add(
      new Button(
        scene,
        layout.buttonX,
        layout.buttonY,
        getTutorialText(options.language, 'tutorial.button.continue'),
        options.onContinue,
        {
          fontSize: `${layout.buttonFontSize}px`,
          height: layout.buttonHeight,
          width: layout.buttonWidth
        }
      )
    );
  }

  return panel;
}

function createLanguageSelector(
  scene: Phaser.Scene,
  options: TutorialOverlayOptions,
  layout: TutorialOverlayLayout
): Phaser.GameObjects.Container {
  const selector = scene.add.container(layout.languageSelectorX, layout.languageSelectorY);

  GAME_LANGUAGES.forEach((language, index) => {
    const isActive = language === options.language;
    const itemX = layout.languageStartX + index * layout.languageItemSpacing;

    if (layout.mobile) {
      const touchTarget = scene.add.container(itemX, 0);
      const touchBackground = scene.add.rectangle(
        0,
        0,
        layout.languageHitWidth,
        layout.languageHitHeight,
        isActive ? 0xf0c95a : 0x163c2c,
        isActive ? 0.2 : 0.72
      );
      touchBackground.setStrokeStyle(1, isActive ? 0xf0c95a : 0x5f9572, isActive ? 0.9 : 0.55);

      const label = scene.add
        .text(0, 0, getLanguageCode(language), {
          align: 'center',
          color: isActive ? '#f0c95a' : '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: `${layout.languageFontSize}px`,
          fontStyle: '700'
        })
        .setOrigin(0.5);

      touchTarget.add([touchBackground, label]);
      touchTarget.setSize(layout.languageHitWidth, layout.languageHitHeight);

      if (!isActive) {
        touchTarget.setInteractive({ useHandCursor: true });
        touchTarget.on('pointerover', () => label.setColor('#ffffff'));
        touchTarget.on('pointerout', () => label.setColor('#d9eadf'));
        touchTarget.on('pointerdown', () => options.onLanguageChange(language));
      }

      selector.add(touchTarget);
      return;
    }

    const label = scene.add
      .text(itemX, 0, getLanguageCode(language), {
        align: 'center',
        color: isActive ? '#f0c95a' : '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${layout.languageFontSize}px`,
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
          .text(itemX + layout.languageItemSpacing / 2, 0, '|', {
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
