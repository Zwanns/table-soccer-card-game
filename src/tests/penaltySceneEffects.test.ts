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
    expect(animationBlock).toContain("let goalkeeperAnimationComplete = outcome !== 'goal'");
    expect(animationBlock).toContain('let impactMessageComplete = false');
    expect(animationBlock).toContain(
      'if (!cardAnimationComplete || !goalkeeperAnimationComplete || !impactMessageComplete || resultFlowContinued)'
    );
    expect(animationBlock.indexOf('this.showPenaltyImpact(')).toBeLessThan(animationBlock.indexOf("if (outcome === 'post'"));
    expect(animationBlock).toContain('onComplete();');
  });

  it('renders only the temporary attack card while a penalty kick is in flight', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');
    const cardColumnBlock = source.slice(
      source.indexOf('private createPenaltyCardColumn('),
      source.indexOf('private handlePenaltyAiAction(')
    );
    const takeKickBlock = source.slice(
      source.indexOf('private takeKick()'),
      source.indexOf('private completeTournamentMatch()')
    );
    const animationBlock = source.slice(
      source.indexOf('private animatePenaltyKick('),
      source.indexOf('private showPenaltyImpact(')
    );

    expect(source).toContain('private inFlightPenaltyCard: InFlightPenaltyCard | null = null');
    expect(cardColumnBlock).toContain('if (this.isPenaltyCardInFlight(shooterSide, index))');
    expect(cardColumnBlock.indexOf('if (this.isPenaltyCardInFlight(shooterSide, index))')).toBeLessThan(
      cardColumnBlock.indexOf('const card = this.createAttackCardView(')
    );
    expect(takeKickBlock.indexOf('this.render();', takeKickBlock.indexOf('this.inFlightPenaltyCard = {'))).toBeLessThan(
      takeKickBlock.indexOf('this.animatePenaltyKick(')
    );
    expect(takeKickBlock.indexOf('this.inFlightPenaltyCard = null;')).toBeLessThan(
      takeKickBlock.indexOf('this.shootoutState = nextState;')
    );
    expect(animationBlock.match(/card\.destroy\(\)/g)).toHaveLength(2);
  });

  it('flies the active goalkeeper card away only after a goal impact', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');
    const goalkeeperRenderBlock = source.slice(
      source.indexOf('private createPenaltyGoalkeeperCard('),
      source.indexOf('private createPenaltyCardColumns(')
    );
    const finishBlock = source.slice(
      source.indexOf('private finishPenaltyKickAnimation('),
      source.indexOf('private animatePenaltyGoalkeeperDefeat(')
    );
    const defeatBlock = source.slice(
      source.indexOf('private animatePenaltyGoalkeeperDefeat('),
      source.indexOf('private showPenaltyImpact(')
    );

    expect(source).toContain('private activePenaltyGoalkeeperCard: CardView | null = null');
    expect(goalkeeperRenderBlock).toContain('if (goalkeeperIsActive)');
    expect(goalkeeperRenderBlock).toContain('this.activePenaltyGoalkeeperCard = card');
    expect(finishBlock).toContain("let goalkeeperAnimationComplete = outcome !== 'goal'");
    expect(finishBlock).toContain("if (outcome === 'goal') {");
    expect(finishBlock).toContain('this.animatePenaltyGoalkeeperDefeat(() => {');
    expect(finishBlock).toContain('goalkeeperAnimationComplete = true');
    expect(finishBlock).toContain(
      'if (!cardAnimationComplete || !goalkeeperAnimationComplete || !impactMessageComplete || resultFlowContinued)'
    );
    expect(finishBlock.indexOf('this.showPenaltyImpact(')).toBeLessThan(
      finishBlock.indexOf('this.animatePenaltyGoalkeeperDefeat(')
    );
    expect(finishBlock.slice(finishBlock.indexOf("if (outcome === 'post'"))).not.toContain(
      'this.animatePenaltyGoalkeeperDefeat('
    );
    expect(defeatBlock.indexOf('const goalkeeperCard = this.activePenaltyGoalkeeperCard')).toBeLessThan(
      defeatBlock.indexOf('this.tweens.add({')
    );
    expect(defeatBlock).toContain("const goalkeeperSide = goalkeeperCard.x < 0 ? 'left' : 'right'");
    expect(defeatBlock).toContain('const goalAnimation = getGoalkeeperGoalAnimation(goalkeeperCard, goalkeeperSide)');
    expect(defeatBlock).toContain('x: goalAnimation.target.x');
    expect(defeatBlock).toContain('y: goalAnimation.target.y');
    expect(defeatBlock).toContain('angle: goalAnimation.angle');
    expect(defeatBlock).toContain('scale: goalAnimation.scale');
    expect(defeatBlock.indexOf('this.tweens.add({')).toBeLessThan(
      defeatBlock.indexOf('goalkeeperCard.destroy()')
    );
    expect(defeatBlock.replace(/\r\n/g, '\n')).toContain('goalkeeperCard.destroy();\n        onComplete();');
  });
});
