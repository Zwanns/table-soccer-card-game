import type { CardRank } from '../cards/Card';

export type FieldSquadMember = {
  rank: CardRank;
  name: string;
  shirtNumber: number;
};

export type GoalkeeperSquadMember = {
  id: string;
  name: string;
  shirtNumber: number;
};

export type NationalTeamSquad = {
  flagCode: string;
  /**
   * Compatibility alias for code that still calls this value teamId.
   * The Stage 3 squad contract uses flagCode as the source of truth.
   */
  teamId: string;
  fieldPlayers: Record<CardRank, FieldSquadMember>;
  goalkeepers: [GoalkeeperSquadMember, GoalkeeperSquadMember];
  defaultStartingGoalkeeperId: string;
};

export type SquadValidationErrorCode =
  | 'INVALID_FLAG_CODE'
  | 'INVALID_FIELD_PLAYER_COUNT'
  | 'MISSING_FIELD_PLAYER'
  | 'INVALID_FIELD_PLAYER_RANK'
  | 'INVALID_PLAYER_NAME'
  | 'INVALID_SHIRT_NUMBER'
  | 'INVALID_GOALKEEPER_COUNT'
  | 'INVALID_GOALKEEPER_ID'
  | 'GOALKEEPER_HAS_RANK'
  | 'INVALID_STARTING_GOALKEEPER'
  | 'DUPLICATE_SHIRT_NUMBER';

export type SquadValidationIssue = {
  code: SquadValidationErrorCode;
  path: string;
  message: string;
};

export type SquadValidationResult =
  | {
      ok: true;
      issues: [];
    }
  | {
      ok: false;
      issues: SquadValidationIssue[];
    };
