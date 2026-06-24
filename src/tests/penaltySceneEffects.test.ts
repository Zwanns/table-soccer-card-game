import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPenaltyImpactSceneEffect } from '../scenes/penaltySceneEffects';

describe('penalty impact scene effects', () => {
  it('maps every outcome to exactly one cached sound and visual message', () => {
    expect(getPenaltyImpactSceneEffect('goal')).toEqual({
      flyingMessage: 'GOAL!!',
      flyingMessageTone: 'goal',
      soundKey: 'sound-penalty-goal'
    });
    expect(getPenaltyImpactSceneEffect('post')).toEqual({
      flyingMessage: 'Post!',
      flyingMessageTone: 'post',
      soundKey: 'sound-goalpost'
    });
    expect(getPenaltyImpactSceneEffect('save')).toEqual({
      flyingMessage: 'Goalkeeper!!',
      flyingMessageTone: 'save',
      soundKey: 'sound-goalkeeper-save'
    });
  });

  it('starts sound in the same impact pipeline as the visual pulse without a late duplicate', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');
    const impactBlock = source.slice(source.indexOf('private showPenaltyImpact('), source.indexOf('private showImpactPulse('));
    const outcomeBlock = source.slice(source.indexOf('private showPenaltyOutcome('), source.indexOf('private showFlyingMessage('));

    expect(source).toContain('this.showPenaltyImpact(target.x, target.y, outcome)');
    expect(impactBlock.indexOf('this.playPenaltyImpactSound(effect)')).toBeLessThan(
      impactBlock.indexOf('this.showImpactPulse(x, y, outcome)')
    );
    expect(source).toContain('return playSoundSafe(this, effect.soundKey, { volume: 0.72 })');
    expect(outcomeBlock).not.toContain('playSoundSafe');
    expect(source.match(/playSoundSafe\(this/g)).toHaveLength(1);
  });
});
