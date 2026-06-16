import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readResultSceneSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');
}

describe('result scene score line layout', () => {
  it('uses post-match background images based on the result winner', () => {
    const source = readResultSceneSource();

    expect(source).toContain('MENU_ASSETS.resultDrawBackground');
    expect(source).toContain('MENU_ASSETS.resultWinBackground');
    expect(source).toContain('private createResultBackground');
    expect(source).toContain('playerOneGoals === playerTwoGoals ? MENU_ASSETS.resultDrawBackground : MENU_ASSETS.resultWinBackground');
    expect(source).toContain('background.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT)');
    expect(source).toContain('if (playerOneGoals > playerTwoGoals)');
    expect(source).toContain('background.setFlipX(true)');
  });

  it('keeps both team labels the same distance from the centered score', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const teamNameInnerGap = 96');
    expect(source).toContain('const playerOneNameX = -teamNameInnerGap');
    expect(source).toContain('const playerTwoNameX = teamNameInnerGap');
    expect(source).toContain("align: 'left'");
    expect(source).toContain('.setOrigin(1, 0.5)');
    expect(source).toContain('.setOrigin(0, 0.5)');
  });

  it('places enlarged final-score flags next to the rendered country names', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const flagGap = 18');
    expect(source).toContain('const flagWidth = 88');
    expect(source).toContain('const flagHeight = 60');
    expect(source).toContain("fontSize: '48px'");
    expect(source).toContain('playerOneText.x - playerOneText.width - flagGap - flagWidth / 2');
    expect(source).toContain('playerTwoText.x + playerTwoText.width + flagGap + flagWidth / 2');
  });

  it('raises and enlarges the final result statistics panel', () => {
    const source = readResultSceneSource();

    expect(source).toContain('this.createScoreLine(\n      centerX,\n      116,');
    expect(source).toContain('this.createMatchStatsPanel(centerX, 372, this.state)');
    expect(source).toContain('const height = 384');
    expect(source).toContain('const viewportHeight = 112');
  });

  it('uses a translucent black final statistics card with gold frame and white section labels', () => {
    const source = readResultSceneSource();

    expect(source).toContain('this.add.rectangle(0, 0, width, height, 0x000000, 0.68)');
    expect(source).toContain('background.setStrokeStyle(2, 0xf0c95a, 0.95)');
    expect(source).toContain("color: '#ffffff'");
    expect(source).not.toContain('const background = this.add.rectangle(0, 0, width, height, 0x0b2118, 0.88)');
    expect(source).not.toContain('background.setStrokeStyle(2, 0x5f9572, 0.95)');
    expect(source).not.toContain("color: '#a9c7b3'");
  });

  it('left-aligns final match goal scorers inside both scorer columns', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const scorerColumnWidth = 280');
    expect(source).toContain('const playerOneScorerX = viewportLeft');
    expect(source).toContain('const playerTwoScorerX = panelWidth / 2 - 56 - scorerColumnWidth');
    expect(source).toContain("align: 'left'");
    expect(source).toContain('.setOrigin(0, 0.5)');
    expect(source).toContain('this.createScorersList(playerOneScorerX, y, row.playerOneText, scorerColumnWidth)');
    expect(source).toContain('this.createScorersList(playerTwoScorerX, y, row.playerTwoText, scorerColumnWidth)');
    expect(source).not.toContain("this.createScorersList(285, y, row.playerTwoText, 'right')");
    expect(source).not.toContain("align: side");
    expect(source).not.toContain("setOrigin(side === 'left' ? 0 : 1, 0.5)");
  });
});
