import type { CardRank } from '../cards';
import { FIELD_SQUAD_RANKS } from './defaultSquads';
import type {
  GoalkeeperSquadMember,
  NationalTeamSquad,
  SquadValidationIssue,
  SquadValidationResult
} from './squadTypes';

type UnknownRecord = Record<string, unknown>;

export function validatePlayerName(name: string): boolean {
  const trimmedName = name.trim();

  return trimmedName.length >= 1 && trimmedName.length <= 24;
}

export function validateShirtNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 99;
}

export function validateSquad(squad: NationalTeamSquad): SquadValidationResult {
  const issues: SquadValidationIssue[] = [];
  const shirtNumbers = new Map<number, string>();

  if (!validatePlayerName(squad.teamId)) {
    addIssue(issues, 'INVALID_TEAM_ID', 'teamId', 'Team id must be a non-empty string.');
  }

  for (const rank of FIELD_SQUAD_RANKS) {
    const player = squad.fieldPlayers[rank];
    const path = `fieldPlayers.${rank}`;

    if (player === undefined) {
      addIssue(issues, 'MISSING_FIELD_PLAYER', path, `Missing field player for rank ${rank}.`);
      continue;
    }

    if (player.rank !== rank) {
      addIssue(issues, 'INVALID_FIELD_PLAYER_RANK', `${path}.rank`, `Field player rank must be ${rank}.`);
    }

    validateSquadMember(issues, shirtNumbers, path, player.name, player.shirtNumber);
  }

  const goalkeepers = squad.goalkeepers;

  if (goalkeepers.length !== 2) {
    addIssue(issues, 'INVALID_GOALKEEPER_COUNT', 'goalkeepers', 'Squad must contain exactly two goalkeepers.');
  }

  goalkeepers.forEach((goalkeeper, index) => {
    const path = `goalkeepers.${index}`;

    if (!validatePlayerName(goalkeeper.id)) {
      addIssue(issues, 'INVALID_GOALKEEPER_ID', `${path}.id`, 'Goalkeeper id must be a non-empty string.');
    }

    if (hasRank(goalkeeper)) {
      addIssue(issues, 'GOALKEEPER_HAS_RANK', `${path}.rank`, 'Goalkeeper must not store a personal rank.');
    }

    validateSquadMember(issues, shirtNumbers, path, goalkeeper.name, goalkeeper.shirtNumber);
  });

  if (!goalkeepers.some((goalkeeper) => goalkeeper.id === squad.defaultStartingGoalkeeperId)) {
    addIssue(
      issues,
      'INVALID_STARTING_GOALKEEPER',
      'defaultStartingGoalkeeperId',
      'Default starting goalkeeper id must exist in goalkeepers.'
    );
  }

  return issues.length === 0 ? { ok: true, issues: [] } : { ok: false, issues };
}

function validateSquadMember(
  issues: SquadValidationIssue[],
  shirtNumbers: Map<number, string>,
  path: string,
  name: string,
  shirtNumber: number
): void {
  if (!validatePlayerName(name)) {
    addIssue(issues, 'INVALID_PLAYER_NAME', `${path}.name`, 'Player name must be 1-24 characters after trim.');
  }

  if (!validateShirtNumber(shirtNumber)) {
    addIssue(issues, 'INVALID_SHIRT_NUMBER', `${path}.shirtNumber`, 'Shirt number must be an integer from 0 to 99.');
    return;
  }

  const previousPath = shirtNumbers.get(shirtNumber);

  if (previousPath !== undefined) {
    addIssue(
      issues,
      'DUPLICATE_SHIRT_NUMBER',
      `${path}.shirtNumber`,
      `Shirt number ${shirtNumber} duplicates ${previousPath}.`
    );
    return;
  }

  shirtNumbers.set(shirtNumber, `${path}.shirtNumber`);
}

function hasRank(goalkeeper: GoalkeeperSquadMember): boolean {
  return Object.prototype.hasOwnProperty.call(goalkeeper as UnknownRecord, 'rank');
}

function addIssue(
  issues: SquadValidationIssue[],
  code: SquadValidationIssue['code'],
  path: string,
  message: string
): void {
  issues.push({
    code,
    path,
    message
  });
}
