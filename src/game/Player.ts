import type { Deck } from '../cards';
import type { PlayerField } from './PlayerField';

export interface Player {
  id: string;
  name: string;
  goals: number;
  deck: Deck;
  field: PlayerField;
}
