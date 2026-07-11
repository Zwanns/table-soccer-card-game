import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveTeamCoverAsset } from '../assets/teamCover';
import { resolveTeamKitAsset } from '../game/kitAssetResolver';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { getTeamScoreboardCode, NATIONAL_TEAMS } from '../data/nationalTeams';
import { requireRealSquad } from '../data/realSquads';
import { validateSquad } from '../data/squadValidation';

describe('Jamaica national team integration', () => {
  it('registers Jamaica with its stable identity and flag asset', () => {
    expect(NATIONAL_TEAMS.find((team) => team.flagCode === 'jm')).toMatchObject({
      name: 'Jamaica',
      flagCode: 'jm'
    });
    expect(getTeamScoreboardCode('jm')).toBe('JAM');

    const flagPath = join(process.cwd(), 'public', 'flags', 'jm.svg');
    expect(existsSync(flagPath)).toBe(true);
    expect(readFileSync(flagPath, 'utf8')).toContain('flag-icons-jm');
  });

  it('provides a complete valid squad with unique player numbers', () => {
    const squad = requireRealSquad('jm');
    const players = [...FIELD_SQUAD_RANKS.map((rank) => squad.fieldPlayers[rank]), squad.goalkeeper];

    expect(Object.keys(squad.fieldPlayers)).toHaveLength(14);
    expect(squad.goalkeeper).toMatchObject({ id: 'gk', shirtNumber: 1 });
    expect(new Set(players.map((player) => player.shirtNumber)).size).toBe(players.length);
    expect(validateSquad(squad)).toEqual({ ok: true, issues: [] });
  });

  it('uses the manual Jamaica kit and team cover', () => {
    expect(resolveTeamKitAsset('jm')).toMatchObject({
      assetKey: 'kit-jm',
      numberColor: '#000000'
    });
    expect(resolveTeamCoverAsset('jm')).toEqual({
      textureKey: 'cover-jm',
      path: 'covers/jm.webp',
      usedFallback: false
    });
  });
});
