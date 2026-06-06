import type { CardColor, Deck } from '../cards';
import type { PlayerField } from './PlayerField';

export interface Player {
  id: string;
  name: string;
  teamColor: Exclude<CardColor, 'JOKER'>;
  goals: number;
  deck: Deck;
  field: PlayerField;
}
