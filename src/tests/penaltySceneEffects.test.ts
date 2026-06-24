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

  it('starts sound, flying message, and pulse together at impact without late duplicates', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');
    const impactBlock = source.slice(source.indexOf('private showPenaltyImpact('), source.indexOf('private showImpactPulse('));
    const outcomeBlock = source.slice(source.indexOf('private showPenaltyOutcome('), source.indexOf('private showFlyingMessage('));
    const kickCompletionBlock = source.slice(
      source.indexOf('this.animatePenaltyKick('),
      source.indexOf('private completeTournamentMatch()')
    );
    const animationBlock = source.slice(
      source.indexOf('private finishPenaltyKickAnimation('),
      source.indexOf('private showPenaltyImpact(')
    );

    expect(source).toContain('this.showPenaltyImpact(target.x, target.y, outcome, () => {');
    expect(impactBlock.indexOf('this.playPenaltyImpactSound(effect)')).toBeLessThan(
      impactBlock.indexOf('this.showPenaltyOutcome(effect, onMessageComplete)')
    );
    expect(impactBlock.indexOf('this.showPenaltyOutcome(effect, onMessageComplete)')).toBeLessThan(
      impactBlock.indexOf('this.showImpactPulse(x, y, outcome)')
    );
    expect(outcomeBlock).toContain('this.showFlyingMessage(effect.flyingMessage, effect.flyingMessageTone, onComplete)');
    expect(source).toContain('return playSoundSafe(this, effect.soundKey, { volume: 0.72 })');
    expect(outcomeBlock).not.toContain('playSoundSafe');
    expect(source.match(/playSoundSafe\(this/g)).toHaveLength(1);
    expect(kickCompletionBlock).not.toContain('this.showPenaltyOutcome(kick.outcome)');
    expect(animationBlock).toContain('let cardAnimationComplete = false');
    expect(animationBlock).toContain('let impactMessageComplete = false');
    expect(animationBlock).toContain('if (!cardAnimationComplete || !impactMessageComplete || resultFlowContinued)');
    expect(animationBlock.indexOf('this.showPenaltyImpact(')).toBeLessThan(animationBlock.indexOf("if (outcome === 'post'"));
    expect(animationBlock).toContain('onComplete();');
  });
});
