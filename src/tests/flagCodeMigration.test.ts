import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeFlagCode, normalizeFlagCodeKeys } from '../data/flagCodes';
import { NATIONAL_TEAMS, getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams';
import { getTeamKitStyle } from '../data/teamKits';
import { loadSquad } from '../services/squadStorage';
import { GameEngine } from '../game/GameEngine';
import {
  createTournamentState, loadActiveTournament, loadStoredTournament, saveTournament,
  submitTournamentMatchResult, TOURNAMENT_STORAGE_KEY, TOURNAMENT_STORAGE_SCHEMA_VERSION,
  type TournamentState, type TournamentMatchResult
} from '../tournament';

const aliases: Record<string, string> = { eng: 'gb-eng', sct: 'gb-sct', wls: 'gb-wls' };
const legacy = (code: string) => aliases[code] ?? code;

function legacyTournament(): TournamentState {
  const state = createTournamentState({ formatId: 'cup-m', seed: 'gb-eng:opaque-seed',
    teamIds: ['eng', 'sct', 'wls', 'al', 'fr', 'es', 'de', 'br'] });
  return {
    ...state,
    teamIds: state.teamIds.map(legacy),
    participants: state.participants.map((participant) => ({ ...participant, flagCode: legacy(participant.flagCode) })),
    groups: state.groups.map((group) => ({ ...group, teamIds: group.teamIds.map(legacy) })),
    matches: state.matches.map((match) => ({ ...match,
      ...(match.homeTeamId === undefined ? {} : { homeTeamId: legacy(match.homeTeamId) }),
      ...(match.awayTeamId === undefined ? {} : { awayTeamId: legacy(match.awayTeamId) })
    })),
    drawOrder: Object.fromEntries(Object.entries(state.drawOrder).map(([code, value]) => [legacy(code), value]))
  };
}

function storageFor(tournament: TournamentState) {
  let raw = JSON.stringify({ schemaVersion: TOURNAMENT_STORAGE_SCHEMA_VERSION, savedAt: '2026-09-30T00:00:00Z', tournament });
  return {
    getItem: (key: string) => key === TOURNAMENT_STORAGE_KEY ? raw : null,
    setItem: (_key: string, value: string) => { raw = value; },
    removeItem: () => { raw = ''; }
  };
}

describe('flag code migration', () => {
  it.each([
    ['England', 'gb-eng', 'eng', 'ENG'], ['Scotland', 'gb-sct', 'sct', 'SCO'], ['Wales', 'gb-wls', 'wls', 'WAL']
  ])('keeps %s master data and assets under its canonical code', (name, oldCode, code, scoreboard) => {
    expect(NATIONAL_TEAMS.find((team) => team.name === name)?.flagCode).toBe(code);
    expect(NATIONAL_TEAMS.some((team) => team.flagCode === oldCode)).toBe(false);
    expect(normalizeFlagCode(oldCode)).toBe(code);
    expect(normalizeFlagCode(code)).toBe(code);
    expect(getTeamScoreboardCode(code)).toBe(scoreboard);
    expect(getFlagAssetKey(code)).toBe(`flag-${code}`);
    expect(getTeamKitStyle(code)?.path).toBe(`kits/images/${code}1.webp`);
    expect(loadSquad(oldCode)).toEqual(loadSquad(code));
    for (const file of [`flags/${code}.svg`, `covers/${code}.webp`, `kits/images/${code}1.webp`]) {
      expect(existsSync(join(process.cwd(), 'public', file))).toBe(true);
    }
    expect(existsSync(join(process.cwd(), 'public', 'flags', `${oldCode}.svg`))).toBe(false);
  });

  it('does not change unrelated codes and safely ignores prototype property names', () => {
    for (const code of ['fr', 'py', 'unknown', 'constructor', 'toString']) expect(normalizeFlagCode(code)).toBe(code);
  });

  it('normalizes match input and new tournament input to canonical runtime identities', () => {
    const state = new GameEngine().startNewGame({ player1FlagCode: 'gb-eng', player2FlagCode: 'gb-sct', seed: 'input-compat' });
    expect(state.players.map((player) => player.flagCode)).toEqual(['eng', 'sct']);
    expect(state.matchSetups.PLAYER_1).toMatchObject({ flagCode: 'eng', teamId: 'eng', squad: { flagCode: 'eng' } });
    const tournament = createTournamentState({ formatId: 'cup-m', teamIds: legacyTournament().teamIds,
      participants: [{ flagCode: 'gb-eng', controllerType: 'AI' }] });
    expect(tournament.teamIds.slice(0, 3)).toEqual(['eng', 'sct', 'wls']);
    expect(tournament.participants[0]).toEqual({ flagCode: 'eng', controllerType: 'AI' });
  });

  it('loads all legacy team identity fields including stats and penalties without rewriting raw storage', () => {
    const state = legacyTournament();
    const result: TournamentMatchResult = {
      matchId: 'gb-eng:opaque-match-id', homeTeamId: 'gb-eng', awayTeamId: 'gb-sct', winnerTeamId: 'gb-eng',
      homeGoals: 0, awayGoals: 0,
      teamStats: {
        home: { teamId: 'gb-eng', goals: 0, shots: 1, goalkeeperSaves: 0 },
        away: { teamId: 'gb-sct', goals: 0, shots: 1, goalkeeperSaves: 0 }
      },
      playerStats: [{ teamId: 'gb-wls', playerId: 'gb-eng:opaque-player-id', playerName: 'gb-eng', shirtNumber: 9,
        goals: 0, assists: 0, goalkeeperSaves: 0, penaltyGoals: 1, penaltyGoalkeeperSaves: 0 }],
      penaltyShootout: { homeGoals: 1, awayGoals: 0, winnerTeamId: 'gb-eng',
        kicks: [{ shooterTeamId: 'gb-eng', attackerRank: 'A', goalkeeperRank: 'K', outcome: 'goal' }],
        attempts: [{ teamId: 'gb-sct', shooterRank: 'A', shooterLabel: 'gb-eng', success: false, outcome: 'save', roundIndex: 0 }] }
    };
    state.matches[0].result = result;
    const storage = storageFor(state);
    const before = storage.getItem(TOURNAMENT_STORAGE_KEY);
    const loaded = loadStoredTournament(storage)!;
    expect(storage.getItem(TOURNAMENT_STORAGE_KEY)).toBe(before);
    expect(loaded.tournament.teamIds).toEqual(['eng', 'sct', 'wls', 'al', 'fr', 'es', 'de', 'br']);
    expect(loaded.tournament.participants.slice(0, 3).map((participant) => participant.flagCode)).toEqual(['eng', 'sct', 'wls']);
    expect(loaded.tournament.groups[0].teamIds).toEqual(['eng', 'sct', 'wls', 'al']);
    expect(loaded.tournament.matches[0]).toMatchObject({ homeTeamId: 'eng', awayTeamId: 'sct' });
    expect(loaded.tournament.drawOrder.eng).toBe(state.drawOrder['gb-eng']);
    expect(loaded.tournament.drawOrder).not.toHaveProperty('gb-eng');
    const normalized = loaded.tournament.matches[0].result!;
    expect(normalized).toMatchObject({ homeTeamId: 'eng', awayTeamId: 'sct', winnerTeamId: 'eng',
      teamStats: { home: { teamId: 'eng' }, away: { teamId: 'sct' } }, playerStats: [{ teamId: 'wls', playerName: 'gb-eng' }],
      penaltyShootout: { winnerTeamId: 'eng', kicks: [{ shooterTeamId: 'eng' }], attempts: [{ teamId: 'sct', shooterLabel: 'gb-eng' }] } });
    expect(normalized.matchId).toBe(result.matchId);
    expect(normalized.playerStats[0].playerId).toBe(result.playerStats[0].playerId);
    expect(loaded.tournament.seed).toBe(state.seed);
    expect(loaded.tournament.id).toBe(state.id);
    expect(loaded.savedAt).toBe('2026-09-30T00:00:00Z');
    expect(saveTournament(state, storage)).toBe(true);
    const saved = JSON.parse(storage.getItem(TOURNAMENT_STORAGE_KEY)!).tournament;
    expect(saved.teamIds).toEqual(loaded.tournament.teamIds);
    expect(saved.matches[0].result).toEqual(normalized);
  });

  it('can finish a legacy tournament containing inactive Scotland, Wales and Albania', () => {
    const storage = storageFor(legacyTournament());
    let tournament = loadActiveTournament(storage)!;
    const teamIds = [...tournament.teamIds];
    for (let played = 0; played < 15; played++) {
      const match = tournament.matches.find((match) => match.status === 'available');
      expect(match).toBeDefined();
      tournament = submitTournamentMatchResult(tournament, match!.id, { homeGoals: 1, awayGoals: 0 });
    }
    expect(tournament.stage).toBe('complete');
    expect(tournament.teamIds).toEqual(teamIds);
    expect(saveTournament(tournament, storage)).toBe(true);
    expect(loadStoredTournament(storage)?.tournament.stage).toBe('complete');
  });

  it('resolves colliding record keys deterministically without mutating or cleaning original saves', () => {
    for (const [canonical, alias] of Object.entries(aliases)) {
      const first = { [alias]: 9, [canonical]: 2 };
      const second = { [canonical]: 2, [alias]: 9 };
      expect(normalizeFlagCodeKeys(first)).toEqual({ [canonical]: 2 });
      expect(normalizeFlagCodeKeys(second)).toEqual({ [canonical]: 2 });
      expect(first[alias]).toBe(9);
    }
    const state = legacyTournament();
    state.drawOrder.eng = 42;
    const storage = storageFor(state);
    const raw = storage.getItem(TOURNAMENT_STORAGE_KEY);
    expect(loadStoredTournament(storage)?.tournament.drawOrder.eng).toBe(42);
    expect(storage.getItem(TOURNAMENT_STORAGE_KEY)).toBe(raw);
  });

  it('preserves completed save history under canonical identities', () => {
    const state = legacyTournament();
    state.stage = 'complete';
    const storage = storageFor(state);
    expect(loadActiveTournament(storage)).toBeNull();
    expect(loadStoredTournament(storage)?.tournament.teamIds).toContain('sct');
    expect(loadStoredTournament(storage)?.tournament.teamIds).toContain('wls');
  });

  it('uses canonical cover and flag conventions without reverse mapping to legacy filenames', () => {
    const covers = readFileSync(join(process.cwd(), 'src/assets/teamCover.ts'), 'utf8');
    expect(covers).not.toMatch(/gb-(eng|sct|wls)/);
    const boot = readFileSync(join(process.cwd(), 'src/scenes/BootScene.ts'), 'utf8');
    expect(boot).toContain('flags/${team.flagCode}.svg');
    const penalties = readFileSync(join(process.cwd(), 'src/scenes/TournamentPenaltyScene.ts'), 'utf8');
    expect(penalties).toContain('normalizeFlagCodeKeys(data.fieldKits ?? {})');
    expect(penalties).toContain('normalizeTournamentMatchResult(data.matchResult)');
  });
});
