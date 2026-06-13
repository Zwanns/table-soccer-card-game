import type { PlayerControllerType } from '../ai';
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
  controllerTypes: PlayerControllerType[];
};

export function createTournamentSetupDraft(formatId: TournamentFormatId): TournamentSetupDraft {
  return {
    formatId,
    slots: createEmptySlots(formatId),
    controllerTypes: createDefaultControllerTypes(formatId)
  };
}

export function changeTournamentSetupFormat(
  draft: TournamentSetupDraft,
  formatId: TournamentFormatId
): TournamentSetupDraft {
  const format = getTournamentFormat(formatId);
  const selectedEntries = getSelectedTournamentSetupEntries(draft).slice(0, format.teamCount);
  const missingCount = format.teamCount - selectedEntries.length;

  return {
    formatId,
    slots: [...selectedEntries.map((entry) => entry.teamId), ...Array.from<TournamentSetupSlot>({ length: missingCount }).fill(null)],
    controllerTypes: [
      ...selectedEntries.map((entry) => entry.controllerType),
      ...Array.from<PlayerControllerType>({ length: missingCount }).fill('HUMAN')
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
    slots: draft.slots.map((slotTeamId, index) => (index === slotIndex ? teamId : slotTeamId)),
    controllerTypes: draft.controllerTypes.map((controllerType, index) => (index === slotIndex ? 'HUMAN' : controllerType))
  };
}

export function removeTournamentSetupTeam(draft: TournamentSetupDraft, slotIndex: number): TournamentSetupDraft {
  assertSlotIndex(draft, slotIndex);

  return {
    ...draft,
    slots: draft.slots.map((slotTeamId, index) => (index === slotIndex ? null : slotTeamId)),
    controllerTypes: draft.controllerTypes.map((controllerType, index) => (index === slotIndex ? 'HUMAN' : controllerType))
  };
}

export function clearTournamentSetupDraft(draft: TournamentSetupDraft): TournamentSetupDraft {
  return {
    ...draft,
    slots: createEmptySlots(draft.formatId),
    controllerTypes: createDefaultControllerTypes(draft.formatId)
  };
}

export function fillTournamentSetupRandom(draft: TournamentSetupDraft, seed: string): TournamentSetupDraft {
  return {
    ...draft,
    slots: fillTournamentTeamsRandom(draft.formatId, seed),
    controllerTypes: createDefaultControllerTypes(draft.formatId)
  };
}

export function fillEmptyTournamentSetupSlots(draft: TournamentSetupDraft, seed: string): TournamentSetupDraft {
  const filledSlots = fillEmptyTournamentSlots(draft.formatId, draft.slots, seed);

  return {
    ...draft,
    slots: filledSlots,
    controllerTypes: filledSlots.map((teamId, index) => (draft.slots[index] === null || teamId === undefined ? 'HUMAN' : draft.controllerTypes[index] ?? 'HUMAN'))
  };
}

export function shuffleTournamentSetupGroups(draft: TournamentSetupDraft, seed: string): TournamentSetupDraft {
  if (!isTournamentSetupComplete(draft)) {
    throw new Error('All slots must be filled before shuffling groups.');
  }

  return {
    ...draft,
    ...shuffleTournamentSetupEntries(draft, seed)
  };
}

export function toggleTournamentSetupTeamControllerType(
  draft: TournamentSetupDraft,
  slotIndex: number
): TournamentSetupDraft {
  assertSlotIndex(draft, slotIndex);

  if (draft.slots[slotIndex] === null) {
    return draft;
  }

  return {
    ...draft,
    controllerTypes: draft.controllerTypes.map((controllerType, index) =>
      index === slotIndex ? toggleControllerType(controllerType) : controllerType
    )
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

  const teamIds: TournamentTeamId[] = [...draft.slots];

  return createTournamentState({
    formatId: draft.formatId,
    teamIds,
    participants: teamIds.map((flagCode, index) => ({
      flagCode,
      controllerType: draft.controllerTypes[index] ?? 'HUMAN'
    })),
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

function createDefaultControllerTypes(formatId: TournamentFormatId): PlayerControllerType[] {
  return Array.from<PlayerControllerType>({ length: getTournamentFormat(formatId).teamCount }).fill('HUMAN');
}

function getSelectedTournamentSetupEntries(
  draft: TournamentSetupDraft
): Array<{ teamId: TournamentTeamId; controllerType: PlayerControllerType }> {
  return draft.slots.flatMap((teamId, index) =>
    teamId === null
      ? []
      : [
          {
            teamId,
            controllerType: draft.controllerTypes[index] ?? 'HUMAN'
          }
        ]
  );
}

function shuffleTournamentSetupEntries(draft: TournamentSetupDraft, seed: string): Pick<TournamentSetupDraft, 'slots' | 'controllerTypes'> {
  const completeSlots = draft.slots.filter((teamId): teamId is TournamentTeamId => teamId !== null);
  const shuffledSlots = shuffleTournamentTeams(completeSlots, seed);
  const controllerTypeByTeamId = new Map(
    draft.slots.map((teamId, index) => [teamId, draft.controllerTypes[index] ?? 'HUMAN'])
  );

  return {
    slots: shuffledSlots,
    controllerTypes: shuffledSlots.map((teamId) => controllerTypeByTeamId.get(teamId) ?? 'HUMAN')
  };
}

function toggleControllerType(controllerType: PlayerControllerType): PlayerControllerType {
  return controllerType === 'AI' ? 'HUMAN' : 'AI';
}

function assertSlotIndex(draft: TournamentSetupDraft, slotIndex: number): void {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= draft.slots.length) {
    throw new Error(`Tournament setup slot "${slotIndex}" does not exist.`);
  }
}
