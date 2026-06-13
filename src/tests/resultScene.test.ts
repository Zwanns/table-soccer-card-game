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
});
