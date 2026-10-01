import { describe, expect, it, vi } from 'vitest';

// Exercise scene selection handlers without a canvas or graphics mocks.
vi.mock('phaser', () => ({ default: {
  Scene: class {}, GameObjects: { Container: class {} }, Math: { DegToRad: (degrees: number) => degrees * Math.PI / 180 }
} }));

import { ACTIVE_NATIONAL_TEAMS, isActiveTeam } from '../data/activeTeams';
import { NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { SquadSelectScene } from '../scenes/SquadSelectScene';
import { SquadEditorScene } from '../scenes/SquadEditorScene';

describe('active scene selections', () => {
  it.each(['match', 'penalty'] as const)('allows both %s players to select all 32 active teams and rejects inactive input', (mode) => {
    const scene = new TeamSelectScene();
    scene.init({ mode });
    const handlers = scene as unknown as {
      activeSlot: 1 | 2; selectedTeamOne: string; selectedTeamTwo: string;
      selectTeam(name: string): void; getSelectedTeam(slot: 1 | 2): NationalTeam; render(): void;
    };
    handlers.render = vi.fn();
    for (const slot of [1, 2] as const) {
      handlers.activeSlot = slot;
      for (const team of ACTIVE_NATIONAL_TEAMS) {
        const opponent = team.name === 'France' ? 'Spain' : 'France';
        if (slot === 1) handlers.selectedTeamTwo = opponent;
        else handlers.selectedTeamOne = opponent;
        handlers.selectTeam(team.name);
        expect(handlers.getSelectedTeam(slot).flagCode).toBe(team.flagCode);
      }
      const selected = handlers.getSelectedTeam(slot);
      for (const team of NATIONAL_TEAMS.filter((team) => !isActiveTeam(team.flagCode))) {
        handlers.selectTeam(team.name);
        expect(handlers.getSelectedTeam(slot)).toEqual(selected);
      }
    }
  });

  it('keeps Squad Select defaults and all selectable squads active', () => {
    const scene = new SquadSelectScene() as unknown as {
      selectedTeamId: string; squad: { flagCode: string }; selectTeam(team: NationalTeam): void; render(): void;
    };
    scene.render = vi.fn();
    expect(isActiveTeam(scene.selectedTeamId)).toBe(true);
    for (const team of ACTIVE_NATIONAL_TEAMS) {
      scene.selectTeam(team);
      expect(scene.squad.flagCode).toBe(team.flagCode);
    }
    const selected = scene.selectedTeamId;
    for (const team of NATIONAL_TEAMS.filter((team) => !isActiveTeam(team.flagCode))) {
      scene.selectTeam(team);
      expect(scene.selectedTeamId).toBe(selected);
    }
  });

  it('prevents inactive squads from being opened directly in Squad Editor', () => {
    const scene = new SquadEditorScene();
    const state = scene as unknown as { teamId: string; squad: { flagCode: string } };
    for (const team of NATIONAL_TEAMS) {
      scene.init({ teamId: team.flagCode });
      expect(isActiveTeam(state.teamId)).toBe(true);
      expect(state.squad.flagCode).toBe(isActiveTeam(team.flagCode) ? team.flagCode : 'fr');
    }
    scene.init({ teamId: 'gb-eng' });
    expect(state.squad.flagCode).toBe('eng');
  });
});
