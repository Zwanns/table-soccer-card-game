import Phaser from 'phaser';

export const SCROLL_EDGE_FADE_HEIGHT = 52;
export const SCROLL_EDGE_FADE_MIN_ALPHA = 0.22;
export const SCROLL_EDGE_FADE_EPSILON = 0.5;

export interface ScrollEdgeFadeOptions {
  content: Phaser.GameObjects.Container;
  items: readonly Phaser.GameObjects.Container[];
  viewportTop: number;
  viewportHeight: number;
  scrollY: number;
  maxScroll: number;
}

export function updateScrollableItemEdgeAlphas(options: ScrollEdgeFadeOptions): void {
  const viewportBottom = options.viewportTop + options.viewportHeight;
  const shouldFadeTop = options.scrollY > SCROLL_EDGE_FADE_EPSILON;
  const shouldFadeBottom = options.scrollY < options.maxScroll - SCROLL_EDGE_FADE_EPSILON;

  options.items.forEach((item) => {
    const itemCenterY = options.content.y + item.y;
    let alpha = 1;

    if (shouldFadeTop) {
      const distanceToTopEdge = itemCenterY - options.viewportTop;
      const topFadeProgress = Phaser.Math.Clamp(distanceToTopEdge / SCROLL_EDGE_FADE_HEIGHT, 0, 1);
      alpha = Math.min(
        alpha,
        SCROLL_EDGE_FADE_MIN_ALPHA + (1 - SCROLL_EDGE_FADE_MIN_ALPHA) * topFadeProgress
      );
    }

    if (shouldFadeBottom) {
      const distanceToBottomEdge = viewportBottom - itemCenterY;
      const bottomFadeProgress = Phaser.Math.Clamp(distanceToBottomEdge / SCROLL_EDGE_FADE_HEIGHT, 0, 1);
      alpha = Math.min(
        alpha,
        SCROLL_EDGE_FADE_MIN_ALPHA + (1 - SCROLL_EDGE_FADE_MIN_ALPHA) * bottomFadeProgress
      );
    }

    item.setAlpha(alpha);
  });
}
