import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readTeamStatsViewSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'ui', 'TeamStatsView.ts'), 'utf8');
}

describe('TeamStatsView scorer list', () => {
  it('renders a visible empty state and scorer entries', () => {
    const source = readTeamStatsViewSource();

    expect(source).toContain("options.scorers.length === 0 ? '-' : options.scorers.join('\\n')");
    expect(source).not.toContain('No goals yet');
  });

  it('builds the scorer viewport mask in scene coordinates', () => {
    const source = readTeamStatsViewSource();

    expect(source).toContain('scene.make.graphics()');
    expect(source).toContain('fillRect(x + maskLeft, y + maskTop, viewportWidth, viewportHeight)');
    expect(source).not.toContain('this.add([background, title, maskGraphics');
  });
});
