import type { CardColor, Deck, GoalkeeperDeck } from '../cards';
import type { PlayerField } from './PlayerField';

export interface Player {
  id: string;
  name: string;
  flagCode: string;
  teamColor: Exclude<CardColor, 'JOKER'>;
  goals: number;
  deck: Deck;
  goalkeeperDeck: GoalkeeperDeck;
  field: PlayerField;
}
