import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  createTournamentState,
  fillEmptyTournamentSlots,
  fillTournamentTeamsRandom,
  getTournamentFormat,
  shuffleTournamentTeams,
  type TournamentFormatId,
  type TournamentState,
  type TournamentTeamId
} from '../tournament';

export type TournamentSetupSlot = TournamentTeamId | null;

export type TournamentSetupDraft = {
  formatId: TournamentFormatId;
  slots: TournamentSetupSlot[];
};

export function createTournamentSetupDraft(formatId: TournamentFormatId): TournamentSetupDraft {
  return {
    formatId,
    slots: createEmptySlots(formatId)
  };
}

export function changeTournamentSetupFormat(
  draft: TournamentSetupDraft,
  formatId: TournamentFormatId
): TournamentSetupDraft {
  const format = getTournamentFormat(formatId);
  const selectedTeamIds = getSelectedTournamentTeamIds(draft).slice(0, format.teamCount);

  return {
    formatId,
    slots: [
      ...selectedTeamIds,
      ...Array.from<TournamentSetupSlot>({ length: format.teamCount - selectedTeamIds.length }).fill(null)
    ]
  };
}

export function selectTournamentSetupTeam(
  draft: TournamentSetupDraft,
  slotIndex: number,
  teamId: TournamentTeamId
): TournamentSetupDraft {
  assertSlotIndex(draft, slotIndex);

  if (draft.slots.some((slotTeamId, index) => slotTeamId === teamId && index !== slotIndex)) {
    throw new Error('This team is already selected.');
  }

  return {
    ...draft,
    slots: draft.slots.map((slotTeamId, index) => (index === slotIndex ? teamId : slotTeamId))
  };
}

export function removeTournamentSetupTeam(draft: TournamentSetupDraft, slotIndex: number): TournamentSetupDraft {
  assertSlotIndex(draft, slotIndex);

  return {
    ...draft,
    slots: draft.slots.map((slotTeamId, index) => (index === slotIndex ? null : slotTeamId))
  };
}

export function clearTournamentSetupDraft(draft: TournamentSetupDraft): TournamentSetupDraft {
  return {
    ...draft,
    slots: createEmptySlots(draft.formatId)
  };
}

export function fillTournamentSetupRandom(draft: TournamentSetupDraft, seed: string): TournamentSetupDraft {
  return {
    ...draft,
    slots: fillTournamentTeamsRandom(draft.formatId, seed)
  };
}

export function fillEmptyTournamentSetupSlots(draft: TournamentSetupDraft, seed: string): TournamentSetupDraft {
  return {
    ...draft,
    slots: fillEmptyTournamentSlots(draft.formatId, draft.slots, seed)
  };
}

export function shuffleTournamentSetupGroups(draft: TournamentSetupDraft, seed: string): TournamentSetupDraft {
  if (!isTournamentSetupComplete(draft)) {
    throw new Error('All slots must be filled before shuffling groups.');
  }

  return {
    ...draft,
    slots: shuffleTournamentTeams(draft.slots, seed)
  };
}

export function isTournamentSetupComplete(draft: TournamentSetupDraft): draft is TournamentSetupDraft & {
  slots: TournamentTeamId[];
} {
  return draft.slots.every((teamId): teamId is TournamentTeamId => teamId !== null);
}

export function getSelectedTournamentTeamIds(draft: TournamentSetupDraft): TournamentTeamId[] {
  return draft.slots.flatMap((teamId) => (teamId === null ? [] : [teamId]));
}

export function createTournamentFromSetupDraft(draft: TournamentSetupDraft, seed: string): TournamentState {
  if (!isTournamentSetupComplete(draft)) {
    throw new Error('Cannot start tournament until all slots are filled.');
  }

  return createTournamentState({
    formatId: draft.formatId,
    teamIds: draft.slots,
    seed
  });
}

export function getTournamentSetupSlotCount(formatId: TournamentFormatId): number {
  return getTournamentFormat(formatId).teamCount;
}

export function getDefaultTournamentSetupTeamIds(): TournamentTeamId[] {
  return NATIONAL_TEAMS.map((team) => team.flagCode);
}

function createEmptySlots(formatId: TournamentFormatId): TournamentSetupSlot[] {
  return Array.from<TournamentSetupSlot>({ length: getTournamentFormat(formatId).teamCount }).fill(null);
}

function assertSlotIndex(draft: TournamentSetupDraft, slotIndex: number): void {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= draft.slots.length) {
    throw new Error(`Tournament setup slot "${slotIndex}" does not exist.`);
  }
}
