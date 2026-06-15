import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('GameScene visual layout contracts', () => {
  it('uses a bounce chain for the active deck ball instead of yoyo levitation', () => {
    const source = readSource('src/ui/DeckView.ts');

    expect(source).toContain('export const DECK_MARKER_BOUNCE_HEIGHT = 24');
    expect(source).toContain('scene.tweens.chain');
    expect(source).toContain("ease: 'Quad.easeOut'");
    expect(source).toContain("ease: 'Quad.easeIn'");
    expect(source).toContain('scaleX: baseScaleX * 1.08');
    expect(source).toContain('scaleY: baseScaleY * 0.92');
    expect(source).toContain('bounceTween.stop()');
    expect(source).toContain('Phaser.Scenes.Events.SHUTDOWN');
    expect(source).not.toContain("ease: 'Sine.easeInOut'");
    expect(source).not.toContain('repeat: -1');
  });

  it('stretches Menu and Result from the field edge toward the scoreboard', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const layoutSource = readSource('src/ui/matchLayout.ts');

    expect(source).toContain("import { createMatchLayout, type MatchLayout } from '../ui/matchLayout'");
    expect(source).toContain('const firstActionButtonY = layout.actionButtons.top + layout.actionButtons.height / 2');
    expect(source).toContain('const secondActionButtonY = firstActionButtonY + layout.actionButtons.height + layout.actionButtons.gap');
    expect(source).toContain('height: layout.actionButtons.height');
    expect(source).toContain('fontSize: layout.actionButtons.fontSize');
    expect(source).toContain('width: layout.actionButtons.width');
    expect(layoutSource).toContain('const DESKTOP_SIDE_ACTION_BUTTON_HORIZONTAL_GAP = 14');
    expect(layoutSource).toContain("fontSize: '16px'");
    expect(layoutSource).toContain('height: DESKTOP_MATCH_ACTION_BUTTON_HEIGHT');
    expect(layoutSource).toContain('width: sideActionButtonWidth');
    expect(source).not.toContain("new Button(this, 120, 34, 'Menu'");
    expect(source).not.toContain("new Button(this, 120, 90, 'Result'");
  });

  it('adds matching Rules and About buttons that open in-game overlays', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("'Rules', () => this.openMatchInfoModal('rules')");
    expect(source).toContain("'About',");
    expect(source).toContain("() => this.openMatchInfoModal('about')");
    expect(source.match(/width: layout\.actionButtons\.width/g)?.length).toBeGreaterThanOrEqual(4);
    expect(source.match(/height: layout\.actionButtons\.height/g)?.length).toBeGreaterThanOrEqual(4);
    expect(source.match(/fontSize: layout\.actionButtons\.fontSize/g)?.length).toBeGreaterThanOrEqual(4);
    expect(source).not.toContain("this.scene.start('MenuScene', { mode: 'rules' })");
    expect(source).not.toContain("this.scene.start('MenuScene', { mode: 'about' })");
  });

  it('keeps match info overlays localized, scrollable and non-resetting', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');

    expect(menuSource).toContain('export const ABOUT_LANGUAGES');
    expect(menuSource).toContain('export const ABOUT_CONTENT');
    expect(menuSource).toContain('export const RULES_CONTENT');
    expect(source).toContain("import { ABOUT_CONTENT, ABOUT_LANGUAGES, RULES_CONTENT, type AboutLanguage, type InfoModalKind } from './MenuScene'");
    expect(source).toContain('private infoModal: Phaser.GameObjects.Container | null = null');
    expect(source).toContain('private activeInfoModal: InfoModalKind | null = null');
    expect(source).toContain("private infoLanguage: AboutLanguage = 'en'");
    expect(source).toContain('const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72)');
    expect(source).toContain('overlay.setInteractive()');
    expect(source).toContain('private createMatchInfoBackButton(info: MatchInfoLayout)');
    expect(source).toContain("return new Button(this, 0, info.backButton.y, 'Back', () => this.closeMatchInfoModal()");
    expect(source).toContain('wordWrap: { width: viewport.width }');
    expect(source).not.toContain("'Close'");
    expect(source).not.toContain("text(0, -1, '<'");
    expect(source).toContain('this.createMatchAboutViewport(aboutContent, info) : this.createMatchRulesViewport(rulesContent, info)');
    expect(source).toContain("scrollZone.on('wheel'");
    expect(source).toContain('this.infoModal === null');
    expect(source).toContain("this.aiTurnController?.requestTurnCheck('STATE_RENDERED')");
    expect(source).not.toContain("openMatchInfoModal('rules') => this.scene.start");
    expect(source).not.toContain("openMatchInfoModal('about') => this.scene.start");
  });

  it('draws a striped grass pitch under the field markings', () => {
    const source = readSource('src/ui/FieldView.ts');

    expect(source).toContain('export const FIELD_VIEW_WIDTH = 1120');
    expect(source).toContain('export const FIELD_VIEW_HEIGHT = 600');
    expect(source).toContain('export const FIELD_GRASS_STRIPE_COUNT = 14');
    expect(source).toContain('export const FIELD_GRASS_BASE_COLOR = 0x157a43');
    expect(source).toContain('export const FIELD_GRASS_LIGHT_STRIPE_COLOR = 0x19864a');
    expect(source).toContain('export const FIELD_GRASS_DARK_STRIPE_COLOR = 0x126d3c');
    expect(source).toContain('this.add([this.createStripedPitch(scene), this.createPitchMarkings(scene), centerLine, centerCircle])');
    expect(source).toContain('for (let stripeIndex = 0; stripeIndex < FIELD_GRASS_STRIPE_COUNT; stripeIndex += 1)');
    expect(source).toContain('pitch.fillRect(pitchLeft + stripeIndex * stripeWidth, pitchTop, stripeWidth, FIELD_VIEW_HEIGHT)');
    expect(source).toContain('pitch.strokeRect(pitchLeft, pitchTop, FIELD_VIEW_WIDTH, FIELD_VIEW_HEIGHT)');
    expect(source).not.toContain('scene.add.rectangle(0, 0, 1120, 600');
  });

  it('aligns transparent taller Goals panels with the field top', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const layoutSource = readSource('src/ui/matchLayout.ts');
    const statsSource = readSource('src/ui/TeamStatsView.ts');

    expect(layoutSource).toContain('y: DESKTOP_FIELD_TOP + MATCH_TEAM_STATS_HEIGHT / 2');
    expect(gameSceneSource).toContain('new TeamStatsView(this, layout.teamStats.playerOneX, layout.teamStats.y');
    expect(gameSceneSource).toContain('new TeamStatsView(this, layout.teamStats.playerTwoX, layout.teamStats.y');
    expect(gameSceneSource).toContain('playerOneStatsView.setScale(layout.teamStats.scale)');
    expect(statsSource).toContain('export const TEAM_STATS_VIEW_HEIGHT = 288');
    expect(statsSource).toContain('const viewportHeight = height - 56');
    expect(statsSource).toContain('this.add([title, scorersContent, scrollZone, scrollbarTrack, scrollbarThumb])');
    expect(statsSource).not.toContain('scene.add.rectangle(0, 0, width, height');
    expect(statsSource).not.toContain('0x143f2d');
  });

  it('matches the top scoreboard width to the advantage indicator width', () => {
    const scoreSource = readSource('src/ui/ScoreView.ts');
    const advantageSource = readSource('src/ui/AdvantageView.ts');

    expect(advantageSource).toContain('export const ADVANTAGE_VIEW_WIDTH = 520');
    expect(scoreSource).toContain("import { ADVANTAGE_VIEW_WIDTH } from './AdvantageView'");
    expect(scoreSource).toContain('export const SCORE_VIEW_WIDTH = ADVANTAGE_VIEW_WIDTH');
    expect(scoreSource).toContain('export const SCORE_VIEW_BACKGROUND_COLOR = 0x08120f');
    expect(scoreSource).toContain('scene.add.rectangle(0, 0, SCORE_VIEW_WIDTH, SCORE_VIEW_HEIGHT');
    expect(scoreSource).toContain('SCORE_VIEW_BACKGROUND_COLOR, SCORE_VIEW_BACKGROUND_ALPHA');
    expect(advantageSource).toContain('scene.add.rectangle(0, 0, ADVANTAGE_VIEW_WIDTH, ADVANTAGE_VIEW_HEIGHT');
    expect(scoreSource).not.toContain('scene.add.rectangle(0, 0, 620, 78');
  });

  it('uses the scoreboard background color for in-game info panels', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("import { SCORE_VIEW_BACKGROUND_COLOR, ScoreView } from '../ui/ScoreView'");
    expect(source).toContain(
      'this.add.rectangle(0, 0, info.modal.width, info.modal.height, SCORE_VIEW_BACKGROUND_COLOR, 0.98)'
    );
    expect(source).toContain('const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72)');
  });
});
