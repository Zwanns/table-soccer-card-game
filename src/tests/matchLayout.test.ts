import { describe, expect, it } from 'vitest';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import {
  createMatchLayout,
  isMobileLandscapeViewport,
  MATCH_CARD_HEIGHT,
  MATCH_CARD_WIDTH,
  MATCH_DECK_VISUAL_OVERHANG,
  MATCH_FIELD_HEIGHT,
  MATCH_FIELD_WIDTH,
  MATCH_TEAM_STATS_HEIGHT,
  MATCH_TEAM_STATS_WIDTH,
  type MatchLayout
} from '../ui/matchLayout';

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const TEST_VIEWPORTS = [
  { width: 1600, height: 720 },
  { width: 1280, height: 720 },
  { width: 1024, height: 576 },
  { width: 932, height: 430 },
  { width: 915, height: 412 },
  { width: 844, height: 390 }
] as const;

describe('match layout helper', () => {
  it('preserves the desktop 1600x720 baseline coordinates', () => {
    const layout = createMatchLayout({ width: 1600, height: 720 });

    expect(layout.mode).toBe('desktop');
    expect(layout.scene).toMatchObject({ width: SCENE_WIDTH, height: SCENE_HEIGHT, centerX: 800, centerY: 360 });
    expect(layout.scoreboard).toMatchObject({ x: 800, y: 42, width: 520, height: 78 });
    expect(layout.advantage).toMatchObject({ x: 800, y: 94, width: 520, height: 22 });
    expect(layout.actionButtons).toMatchObject({
      leftX: 383,
      rightX: 1217,
      top: 6,
      width: 286,
      height: 38,
      gap: 10,
      fontSize: '16px'
    });
    expect(layout.field).toMatchObject({ x: 800, y: 400, width: 1120, height: 600, scale: 1 });
    expect(layout.decks).toMatchObject({ playerOneX: 115, playerTwoX: 1485, y: 560, scale: 1 });
    expect(layout.teamStats).toMatchObject({ playerOneX: 120, playerTwoX: 1485, y: 244, scale: 1 });
    expect(layout.info.modal).toMatchObject({ width: 960, height: 600 });
    expect(layout.info.viewport).toMatchObject({ x: -390, y: -150, width: 780, height: 360 });
  });

  it('enables compact mobile landscape only for small landscape display sizes', () => {
    expect(isMobileLandscapeViewport({ width: 1600, height: 720 })).toBe(false);
    expect(isMobileLandscapeViewport({ width: 1280, height: 720 })).toBe(false);
    expect(isMobileLandscapeViewport({ width: 1024, height: 576 })).toBe(true);
    expect(isMobileLandscapeViewport({ width: 932, height: 430 })).toBe(true);
    expect(isMobileLandscapeViewport({ width: 915, height: 412 })).toBe(true);
    expect(isMobileLandscapeViewport({ width: 844, height: 390 })).toBe(true);
    expect(isMobileLandscapeViewport({ width: 430, height: 932 })).toBe(false);
  });

  it.each(TEST_VIEWPORTS)('keeps key match UI inside the base canvas for $width x $height', (viewport) => {
    const layout = createMatchLayout(viewport);

    expectInsideCanvas(boundsFromCenter(layout.scoreboard.x, layout.scoreboard.y, layout.scoreboard.width, layout.scoreboard.height));
    expectInsideCanvas(boundsFromCenter(layout.advantage.x, layout.advantage.y, layout.advantage.width, layout.advantage.height));
    expectInsideCanvas(fieldBounds(layout));
    expectInsideCanvas(deckBounds(layout, 'playerOne'));
    expectInsideCanvas(deckBounds(layout, 'playerTwo'));
    expectInsideCanvas(teamStatsBounds(layout, 'playerOne'));
    expectInsideCanvas(teamStatsBounds(layout, 'playerTwo'));
    expectInsideCanvas(infoModalBounds(layout));
    expectInsideCanvas(infoViewportBounds(layout));
  });

  it.each(TEST_VIEWPORTS)('keeps top buttons clear of the scoreboard for $width x $height', (viewport) => {
    const layout = createMatchLayout(viewport);
    const scoreboard = boundsFromCenter(layout.scoreboard.x, layout.scoreboard.y, layout.scoreboard.width, layout.scoreboard.height);
    const leftButton = actionButtonBounds(layout, 'left', 'top');
    const rightButton = actionButtonBounds(layout, 'right', 'top');

    expect(leftButton.right).toBeLessThanOrEqual(scoreboard.left - 8);
    expect(rightButton.left).toBeGreaterThanOrEqual(scoreboard.right + 8);
  });

  it('uses a larger field and deck scale in compact landscape without changing base canvas size', () => {
    const desktop = createMatchLayout({ width: 1600, height: 720 });
    const compact = createMatchLayout({ width: 932, height: 430 });

    expect(compact.mode).toBe('mobile-landscape');
    expect(compact.scene).toEqual(desktop.scene);
    expect(compact.field.scale).toBeGreaterThan(desktop.field.scale);
    expect(compact.decks.scale).toBeGreaterThan(desktop.decks.scale);
    expect(fieldBounds(compact).bottom).toBeLessThanOrEqual(SCENE_HEIGHT);
  });
});

function actionButtonBounds(layout: MatchLayout, side: 'left' | 'right', row: 'top' | 'bottom'): Bounds {
  const x = side === 'left' ? layout.actionButtons.leftX : layout.actionButtons.rightX;
  const y =
    layout.actionButtons.top +
    layout.actionButtons.height / 2 +
    (row === 'bottom' ? layout.actionButtons.height + layout.actionButtons.gap : 0);

  return boundsFromCenter(x, y, layout.actionButtons.width, layout.actionButtons.height);
}

function fieldBounds(layout: MatchLayout): Bounds {
  return boundsFromCenter(
    layout.field.x,
    layout.field.y,
    MATCH_FIELD_WIDTH * layout.field.scale,
    MATCH_FIELD_HEIGHT * layout.field.scale
  );
}

function deckBounds(layout: MatchLayout, side: 'playerOne' | 'playerTwo'): Bounds {
  const x = side === 'playerOne' ? layout.decks.playerOneX : layout.decks.playerTwoX;
  const visualWidth = (MATCH_CARD_WIDTH + MATCH_DECK_VISUAL_OVERHANG) * layout.decks.scale;
  const visualHeight = (MATCH_CARD_HEIGHT + MATCH_DECK_VISUAL_OVERHANG) * layout.decks.scale;

  return boundsFromCenter(x, layout.decks.y, visualWidth, visualHeight);
}

function teamStatsBounds(layout: MatchLayout, side: 'playerOne' | 'playerTwo'): Bounds {
  const x = side === 'playerOne' ? layout.teamStats.playerOneX : layout.teamStats.playerTwoX;

  return boundsFromCenter(
    x,
    layout.teamStats.y,
    MATCH_TEAM_STATS_WIDTH * layout.teamStats.scale,
    MATCH_TEAM_STATS_HEIGHT * layout.teamStats.scale
  );
}

function infoModalBounds(layout: MatchLayout): Bounds {
  return boundsFromCenter(layout.scene.centerX, layout.scene.centerY, layout.info.modal.width, layout.info.modal.height);
}

function infoViewportBounds(layout: MatchLayout): Bounds {
  return {
    left: layout.scene.centerX + layout.info.viewport.x,
    right: layout.scene.centerX + layout.info.viewport.x + layout.info.viewport.width,
    top: layout.scene.centerY + layout.info.viewport.y,
    bottom: layout.scene.centerY + layout.info.viewport.y + layout.info.viewport.height
  };
}

function boundsFromCenter(x: number, y: number, width: number, height: number): Bounds {
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2
  };
}

function expectInsideCanvas(bounds: Bounds): void {
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(SCENE_WIDTH);
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(SCENE_HEIGHT);
}
