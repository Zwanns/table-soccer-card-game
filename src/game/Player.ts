import type { Deck } from '../cards';
import type { PlayerField } from './PlayerField';

export interface Player {
  id: string;
  deck: Deck;
  field: PlayerField;
}
