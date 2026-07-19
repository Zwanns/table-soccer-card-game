import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialDealSteps, INITIAL_DEAL_CARD_DURATION_MS } from '../ui/initialDealFlow';

const positions = [
  'goalkeeper',
  'defender-1',
  'defender-2',
  'midfielder-1',
  'midfielder-2',
  'midfielder-3'
] as const;

describe('synchronized initial deal flow', () => {
  it('pairs corresponding left and right cards in the existing position order', () => {
    const entries = [
      ...positions.map((positionId) => ({ playerId: 'left', positionId, cardId: `left-${positionId}` })),
      ...positions.map((positionId) => ({ playerId: 'right', positionId, cardId: `right-${positionId}` }))
    ];

    const steps = createInitialDealSteps(entries, ['left', 'right']);

    expect(steps).toHaveLength(positions.length);
    expect(steps.map((step) => step.map((entry) => entry.cardId))).toEqual(
      positions.map((positionId) => [`left-${positionId}`, `right-${positionId}`])
    );
    expect(steps.every((step) => step.length === 2)).toBe(true);
    expect(steps.flat()).toHaveLength(entries.length);
    expect(new Set(steps.flat()).size).toBe(entries.length);
  });

  it('keeps unmatched post-attack restores as safe single-card steps', () => {
    const entries = [
      { playerId: 'left', positionId: 'midfielder-1' as const },
      { playerId: 'left', positionId: 'midfielder-2' as const }
    ];

    expect(createInitialDealSteps(entries, ['left', 'right'])).toEqual([[entries[0]], [entries[1]]]);
  });

  it('uses one shared duration for every card in a synchronized step', () => {
    expect(INITIAL_DEAL_CARD_DURATION_MS).toBe(420);
  });

  it('waits for both cards before scheduling the next step and enabling gameplay', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8').replace(/\r\n/g, '\n');

    expect(source).toContain('let pendingAnimations = step.length;');
    expect(source).toContain('for (const entry of step) {');
    expect(source).toContain('duration: INITIAL_DEAL_CARD_DURATION_MS');
    expect(source).toContain('pendingAnimations -= 1;');
    expect(source).toContain('if (pendingAnimations > 0) {\n          return;\n        }');
    expect(source).toContain('this.animateRestoredCards(state, steps, index + 1, flowId)');
    expect(source).toContain('this.completeAutomaticCardFlow(flowId);\n        this.markInitialDealComplete();');
    expect(source).toContain('this.isGameplayReady = false;');
    expect(source).toContain('this.isGameplayReady = true;');
  });

  it('shares the GameScene flow across match modes, layouts, and the Dev Lab preview', () => {
    const gameSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const devLabSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'DevLabScene.ts'), 'utf8');

    expect(gameSource).toContain("this.matchMode = data.matchMode ?? 'quick'");
    expect(gameSource).toContain("launchContext.mode === 'tournament'");
    expect(gameSource).toContain('createInitialDealSteps(pendingRestores');
    expect(gameSource).not.toContain('isMobile');
    expect(devLabSource).toContain("'Initial deal preview'");
    expect(devLabSource).toContain("this.startGamePreview('initial-deal')");
    expect(devLabSource).toContain("this.scene.start('GameScene'");
  });

  it('retains tracked tween, callback, pause, and shutdown cleanup guards', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');

    expect(source).toContain('this.activeCardRestoreTweens.add(dealTween)');
    expect(source).toContain('this.pendingCardRestoreCallbacks.add(timer)');
    expect(source).toContain('flowId === this.cardRestoreFlowId');
    expect(source).toContain('tween.pause()');
    expect(source).toContain('tween.resume()');
    expect(source).toContain('this.cancelAutomaticCardFlow()');
    expect(source).toContain('this.events.once(Phaser.Scenes.Events.SHUTDOWN');
  });
});
