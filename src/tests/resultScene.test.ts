import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readResultSceneSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');
}

describe('result scene score line layout', () => {
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
    expect(source).toContain('const flagWidth = 64');
    expect(source).toContain('const flagHeight = 44');
    expect(source).toContain("fontSize: '36px'");
    expect(source).toContain('playerOneText.x - playerOneText.width - flagGap - flagWidth / 2');
    expect(source).toContain('playerTwoText.x + playerTwoText.width + flagGap + flagWidth / 2');
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
