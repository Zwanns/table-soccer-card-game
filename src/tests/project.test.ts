import { describe, expect, it } from 'vitest';
import { GAME_TITLE } from '../config';

describe('project scaffold', () => {
  it('uses the required game title', () => {
    expect(GAME_TITLE).toBe('Table Soccer');
  });
});
