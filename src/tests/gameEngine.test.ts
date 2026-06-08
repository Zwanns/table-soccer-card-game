import { describe, expect, it } from 'vitest';
import { GoalkeeperDeck, type Card, type CardRank, type Deck, type GoalkeeperRank } from '../cards';
import {
  createMatchTeamSetup,
  createEmptyField,
  GameEngine,
  getMatchStats,
  getTeamAdvantage,
  type FieldPositionId,
  type GameState,
  type Player,
  type PlayerField
} from '../game';
import { createDefaultSquad } from '../data/defaultSquads';

function card(rank: CardRank, id: string = rank): Card {
  return {
    id: `ENGINE_${id}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

function deck(ranks: CardRank[]): Deck {
  return {
    cards: ranks.map((rank, index) => card(rank, `${rank}_${index}`))
  };
}

function goalkeeperCard(rank: GoalkeeperRank): { kind: 'goalkeeper'; rank: GoalkeeperRank } {
  return {
    kind: 'goalkeeper',
    rank
  };
}

function goalkeeperDeck(ranks: GoalkeeperRank[] = ['3', '4', '5', '6', '7', '8']): GoalkeeperDeck {
  return new GoalkeeperDeck(ranks.map((rank) => goalkeeperCard(rank)));
}

function player(id: string, ranks: CardRank[]): Player {
  return {
    id,
    name: id,
    flagCode: id === 'PLAYER_1' ? 'fr' : 'es',
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals: 0,
    deck: deck(ranks),
    goalkeeperDeck: goalkeeperDeck(),
    field: createEmptyField()
  };
}

function state(playerOneDeck: CardRank[], playerTwoDeck: CardRank[]): GameState {
  const players: [Player, Player] = [player('PLAYER_1', playerOneDeck), player('PLAYER_2', playerTwoDeck)];

  return {
    players,
    matchSetups: {
      PLAYER_1: createMatchTeamSetup({
        teamId: 'fr',
        squad: createDefaultSquad('fr'),
        goalkeeperKitId: 'gk-1'
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: 'es',
        squad: createDefaultSquad('es'),
        goalkeeperKitId: 'gk-2'
      })
    },
    activePlayerId: 'PLAYER_1',
    phase: 'ENDING_TURN',
    attackCard: null,
    attackBank: [],
    legalTargetPositionIds: [],
    winnerId: null,
    isDraw: false,
    turnNumber: 0,
    log: []
  };
}

function fillField(field: PlayerField): void {
  field.goalkeeper = goalkeeperCard('3');
  field['defender-1'] = card('3', 'FIELD_D1');
  field['defender-2'] = card('4', 'FIELD_D2');
  field['midfielder-1'] = card('5', 'FIELD_M1');
  field['midfielder-2'] = card('6', 'FIELD_M2');
  field['midfielder-3'] = card('7', 'FIELD_M3');
}

function setPositions(field: PlayerField, entries: Partial<Record<FieldPositionId, CardRank>>): void {
  for (const [positionId, rank] of Object.entries(entries) as Array<[FieldPositionId, CardRank]>) {
    if (positionId === 'goalkeeper') {
      field.goalkeeper = goalkeeperCard(rank as GoalkeeperRank);
      continue;
    }

    field[positionId] = card(rank, `${positionId}_${rank}`);
  }
}

function createReadyEngine(playerOneDeck: CardRank[], playerTwoDeck: CardRank[] = []): GameEngine {
  const gameState = state(playerOneDeck, playerTwoDeck);
  fillField(gameState.players[0].field);

  return new GameEngine(gameState);
}

describe('game engine attacks', () => {
  it('scenario 1: successful hit exposes the current opponent midfield line without beat hints', () => {
    const engine = createReadyEngine(['7']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '6',
      'midfielder-2': 'J',
      'midfielder-3': 'Q'
    });

    expect(engine.startNextTurn().phase).toBe('WAITING_FOR_ATTACK_CARD');
    const result = engine.drawAttackCard();

    expect(result.phase).toBe('WAITING_FOR_TARGET');
    expect(engine.getLegalTargets()).toEqual(['midfielder-1', 'midfielder-2', 'midfielder-3']);

    const afterSelection = engine.selectTarget('midfielder-1');

    expect(afterSelection.log.some((event) => event.type === 'CARD_DEFEATED')).toBe(true);
    expect(afterSelection.log.some((event) => event.type === 'SHOT_ON_GOAL')).toBe(false);
  });

  it('logs the attacking player and turn number when a card is defeated', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('midfielder-1');

    expect(result.log.find((event) => event.type === 'CARD_DEFEATED')).toMatchObject({
      type: 'CARD_DEFEATED',
      playerId: 'PLAYER_1',
      turnNumber: 1,
      positionId: 'midfielder-1',
      defenderCard: { rank: '6' }
    });
  });

  it('scenario 2: special hit 6 beats A during an attack without revealing that hint in targets', () => {
    const engine = createReadyEngine(['6']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': 'A',
      'midfielder-2': 'Q',
      'midfielder-3': 'J'
    });

    engine.startNextTurn();
    engine.drawAttackCard();

    expect(engine.getLegalTargets()).toEqual(['midfielder-1', 'midfielder-2', 'midfielder-3']);
    expect(engine.selectTarget('midfielder-1').log.some((event) => event.type === 'CARD_DEFEATED')).toBe(true);
  });

  it('scenario 3: failing to beat a midfield card returns the attack card and switches turn', () => {
    const engine = createReadyEngine(['3']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '10',
      'midfielder-2': 'J',
      'midfielder-3': 'Q'
    });

    expect(engine.startNextTurn().phase).toBe('WAITING_FOR_ATTACK_CARD');
    const waitingState = engine.drawAttackCard();

    expect(waitingState.phase).toBe('WAITING_FOR_TARGET');
    expect(waitingState.activePlayerId).toBe('PLAYER_1');
    expect(waitingState.attackCard?.rank).toBe('3');

    const result = engine.selectTarget('midfielder-1');
    const attacker = result.players[0];

    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(result.players[1].field['midfielder-1']?.rank).toBe('10');
    expect(attacker.deck.cards.map((deckCard) => deckCard.rank)).toEqual(['3']);
    expect(result.log.at(-2)).toMatchObject({
      type: 'ATTACK_MISSED',
      card: card('3', '3_0'),
      playerId: 'PLAYER_1',
      turnNumber: 1,
      positionId: 'midfielder-1',
      attackerCard: card('3', '3_0'),
      defenderCard: card('10', 'midfielder-1_10')
    });
  });

  it('ends the attack when a defender cannot be beaten', () => {
    const engine = createReadyEngine(['5']);
    setPositions(engine.getState().players[1].field, {
      'defender-1': 'K',
      'defender-2': 'Q'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('defender-1');

    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(result.players[1].field['defender-1']?.rank).toBe('K');
    expect(result.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['5']);
    expect(result.log.at(-2)).toMatchObject({
      type: 'ATTACK_MISSED',
      playerId: 'PLAYER_1',
      turnNumber: 1,
      positionId: 'defender-1',
      defenderCard: { rank: 'K' }
    });
  });

  it('lets the selected card determine success or possession loss within a mixed line', () => {
    const successEngine = createReadyEngine(['8']);
    setPositions(successEngine.getState().players[1].field, {
      'midfielder-1': '5',
      'midfielder-2': '9',
      'midfielder-3': 'K'
    });

    successEngine.startNextTurn();
    successEngine.drawAttackCard();
    const afterSuccess = successEngine.selectTarget('midfielder-1');

    expect(afterSuccess.phase).toBe('ENDING_TURN');
    expect(afterSuccess.players[1].field['midfielder-1']).toBeNull();
    expect(afterSuccess.log.some((event) => event.type === 'CARD_DEFEATED')).toBe(true);

    const failNineEngine = createReadyEngine(['8']);
    setPositions(failNineEngine.getState().players[1].field, {
      'midfielder-1': '5',
      'midfielder-2': '9',
      'midfielder-3': 'K'
    });

    failNineEngine.startNextTurn();
    failNineEngine.drawAttackCard();
    const afterNineFail = failNineEngine.selectTarget('midfielder-2');

    expect(afterNineFail.players[1].field['midfielder-2']?.rank).toBe('9');
    expect(afterNineFail.log.at(-2)).toMatchObject({ type: 'ATTACK_MISSED', positionId: 'midfielder-2' });

    const failKingEngine = createReadyEngine(['8']);
    setPositions(failKingEngine.getState().players[1].field, {
      'midfielder-1': '5',
      'midfielder-2': '9',
      'midfielder-3': 'K'
    });

    failKingEngine.startNextTurn();
    failKingEngine.drawAttackCard();
    const afterKingFail = failKingEngine.selectTarget('midfielder-3');

    expect(afterKingFail.players[1].field['midfielder-3']?.rank).toBe('K');
    expect(afterKingFail.log.at(-2)).toMatchObject({ type: 'ATTACK_MISSED', positionId: 'midfielder-3' });
  });

  it('does not allow another target selection after a failed field duel ends the turn', () => {
    const engine = createReadyEngine(['3']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '10',
      'midfielder-2': 'J'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    engine.selectTarget('midfielder-1');

    expect(() => engine.selectTarget('midfielder-2')).toThrow(
      'Cannot select a target because the game is not waiting for target selection.'
    );
  });

  it('scenario 4: target line moves from midfield to defense to goalkeeper', () => {
    const engine = createReadyEngine(['A', 'A', 'A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: 'Q',
      'defender-1': 'K',
      'midfielder-1': '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    expect(engine.getLegalTargets()).toEqual(['midfielder-1']);

    engine.selectTarget('midfielder-1');
    engine.drawAttackCard();
    expect(engine.getLegalTargets()).toEqual(['defender-1']);

    engine.selectTarget('defender-1');
    engine.drawAttackCard();
    expect(engine.getLegalTargets()).toEqual(['goalkeeper']);
  });

  it('scenario 5: beating the goalkeeper scores a goal and ends the turn', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('goalkeeper');

    expect(result.players[0].goals).toBe(1);
    expect(result.log.some((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toBe(true);
    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(Object.values(result.players[1].field)).toEqual([null, null, null, null, null, null]);
    expect(result.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A']);
    expect(result.players[0].deck.cards.some((deckCard) => deckCard.rank === '6')).toBe(false);
  });

  it('recycles a beaten goalkeeper to the bottom of the defending goalkeeper deck', () => {
    const gameState = state(['A'], ['2', '3', '4', '5', '6']);
    fillField(gameState.players[0].field);
    gameState.players[1].goalkeeperDeck = goalkeeperDeck(['Q', 'K']);
    gameState.players[1].field.goalkeeper = goalkeeperCard('6');
    const engine = new GameEngine(gameState);

    engine.startNextTurn();
    engine.drawAttackCard();
    const afterGoal = engine.selectTarget('goalkeeper');

    expect(afterGoal.players[1].field.goalkeeper).toBeNull();
    expect(afterGoal.players[1].goalkeeperDeck.toArray().map((deckCard) => deckCard.rank)).toEqual(['Q', 'K', '6']);
    expect(afterGoal.attackBank).toEqual([]);
    expect(afterGoal.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A']);
    expect(afterGoal.log).toContainEqual({
      type: 'GOALKEEPER_CARD_RECYCLED',
      playerId: 'PLAYER_2',
      turnNumber: 1,
      goalkeeperRank: '6'
    });

    const restored = engine.startNextTurn();

    expect(restored.players[1].field.goalkeeper?.rank).toBe('Q');
    expect(restored.players[1].goalkeeperDeck.toArray().map((deckCard) => deckCard.rank)).toEqual(['K', '6']);
  });

  it('counts a shot on goal when the goalkeeper card is selected', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });

    engine.startNextTurn();
    const waitingForShot = engine.drawAttackCard();

    expect(waitingForShot.phase).toBe('WAITING_FOR_TARGET');
    expect(waitingForShot.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(0);

    const result = engine.selectTarget('goalkeeper');

    expect(result.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
  });

  it('treats equal 3-10 goalkeeper ranks as a goalpost hit after selecting the goalkeeper', () => {
    const engine = createReadyEngine(['6', 'A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });
    const originalGoalkeeper = engine.getState().players[1].field.goalkeeper;
    const originalGoalkeeperDeck = engine.getState().players[1].goalkeeperDeck.toArray();

    engine.startNextTurn();
    const waitingForShot = engine.drawAttackCard();

    expect(waitingForShot.phase).toBe('WAITING_FOR_TARGET');
    expect(waitingForShot.attackCard?.rank).toBe('6');

    const afterPost = engine.selectTarget('goalkeeper');

    expect(afterPost.phase).toBe('WAITING_FOR_ATTACK_CARD');
    expect(afterPost.attackCard).toBeNull();
    expect(afterPost.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A']);
    expect(afterPost.players[1].field.goalkeeper).toEqual(originalGoalkeeper);
    expect(afterPost.players[1].goalkeeperDeck.toArray()).toEqual(originalGoalkeeperDeck);
    expect(afterPost.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
    expect(afterPost.log.at(-1)?.type).toBe('GOALPOST_HIT');

    const nextShot = engine.drawAttackCard();

    expect(nextShot.phase).toBe('WAITING_FOR_TARGET');
    expect(nextShot.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
  });

  it('ends the attack with a goalkeeper save when the selected shot cannot beat the goalkeeper', () => {
    const engine = createReadyEngine(['5']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });
    const originalGoalkeeper = engine.getState().players[1].field.goalkeeper;
    const originalGoalkeeperDeck = engine.getState().players[1].goalkeeperDeck.toArray();

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('goalkeeper');

    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(result.players[1].field.goalkeeper).toEqual(originalGoalkeeper);
    expect(result.players[1].goalkeeperDeck.toArray()).toEqual(originalGoalkeeperDeck);
    expect(result.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
    expect(result.log.some((event) => event.type === 'GOALKEEPER_SAVE')).toBe(true);
  });

  it('scenario 6: not enough cards to restore the field ends the game', () => {
    const gameState = state(['2', '3', '4'], []);
    gameState.players[0].field.goalkeeper = goalkeeperCard('A');
    gameState.players[0].field['defender-1'] = card('K');
    const engine = new GameEngine(gameState);

    const result = engine.startNextTurn();

    expect(result.phase).toBe('GAME_OVER');
    expect(result.isDraw).toBe(true);
    expect(result.log.at(-1)).toEqual({ type: 'GAME_OVER', winnerId: null });
  });

  it('logs every card restored from the deck to the field', () => {
    const engine = createReadyEngine(['9']);
    engine.getState().players[0].field['defender-1'] = null;

    const result = engine.startNextTurn();

    expect(result.players[0].field['defender-1']?.rank).toBe('9');
    expect(result.log).toContainEqual({
      type: 'FIELD_CARD_RESTORED',
      playerId: 'PLAYER_1',
      turnNumber: 1,
      positionId: 'defender-1',
      card: card('9', '9_0'),
      cardKind: 'outfield',
      cardRank: '9'
    });
  });

  it('scenario 7: using the last attack card ends the attack but not the game', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('midfielder-1');

    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(result.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A', '6']);
    expect(result.winnerId).toBeNull();
    expect(result.isDraw).toBe(false);
  });

  it('recolors defeated opponent cards to the attacking player color when ownership changes', () => {
    const engine = createReadyEngine(['A']);
    engine.getState().players[1].field['midfielder-1'] = {
      ...card('6', 'BLACK_TARGET'),
      color: 'BLACK',
      suit: 'SPADES'
    };

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('midfielder-1');

    expect(result.players[0].deck.cards.map((deckCard) => deckCard.color)).toEqual(['RED', 'RED']);
    expect(result.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A', '6']);
  });

  it('scenario 8: first player selection uses base rank values without special hits', () => {
    const gameState = state(['6'], ['A']);
    const engine = new GameEngine(gameState);

    (engine as unknown as { determineFirstPlayer: () => void }).determineFirstPlayer();

    expect(engine.getState().activePlayerId).toBe('PLAYER_2');
    expect(engine.getState().players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['6']);
    expect(engine.getState().players[1].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A']);
    expect(engine.getState().log.at(-1)).toEqual({
      type: 'FIRST_PLAYER_SELECTED',
      playerId: 'PLAYER_2'
    });
  });

  it('summarizes final match statistics from the event log', () => {
    const gameState = state([], []);
    gameState.players[0].goals = 1;
    gameState.players[1].goals = 0;
    gameState.log.push(
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
      { type: 'GOAL_SCORED', playerId: 'PLAYER_1' },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_2', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
      { type: 'GOALPOST_HIT', playerId: 'PLAYER_2', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_2', attackerCard: card('5'), goalkeeperCard: goalkeeperCard('8') },
      { type: 'GOALKEEPER_SAVE', playerId: 'PLAYER_2', attackerCard: card('5'), goalkeeperCard: goalkeeperCard('8') }
    );

    const [playerOneStats, playerTwoStats] = getMatchStats(gameState);

    expect(playerOneStats).toEqual({
      playerId: 'PLAYER_1',
      goals: 1,
      shots: 1,
      goalpostHits: 0,
      goalkeeperSaves: 1,
      shotAccuracy: 100,
      possession: 50
    });
    expect(playerTwoStats).toEqual({
      playerId: 'PLAYER_2',
      goals: 0,
      shots: 2,
      goalpostHits: 1,
      goalkeeperSaves: 0,
      shotAccuracy: 0,
      possession: 50
    });
  });

  it('summarizes whole-match possession from max attack depth per turn', () => {
    const gameState = state([], []);
    gameState.turnNumber = 6;
    gameState.log.push(
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 1,
        positionId: 'midfielder-1',
        attackerCard: card('6'),
        defenderCard: card('5')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 1,
        positionId: 'defender-1',
        attackerCard: card('8'),
        defenderCard: card('7')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_2',
        turnNumber: 2,
        positionId: 'midfielder-2',
        attackerCard: card('7'),
        defenderCard: card('6')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 5,
        positionId: 'goalkeeper',
        attackerCard: card('A'),
        defenderCard: card('K')
      }
    );

    const [playerOneStats, playerTwoStats] = getMatchStats(gameState);

    expect(playerOneStats.possession).toBe(61);
    expect(playerTwoStats.possession).toBe(39);
  });

  it('calculates team advantage from max attack depth per turn in the last five turns', () => {
    const gameState = state([], []);
    gameState.turnNumber = 6;
    gameState.log.push(
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 1,
        positionId: 'goalkeeper',
        attackerCard: card('JOKER'),
        defenderCard: card('JOKER')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_2',
        turnNumber: 2,
        positionId: 'midfielder-1',
        attackerCard: card('10'),
        defenderCard: card('10')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 3,
        positionId: 'midfielder-2',
        attackerCard: card('Q'),
        defenderCard: card('Q')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 3,
        positionId: 'defender-1',
        attackerCard: card('K'),
        defenderCard: card('K')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 5,
        positionId: 'goalkeeper',
        attackerCard: card('A'),
        defenderCard: card('A')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_2',
        turnNumber: 6,
        positionId: 'defender-2',
        attackerCard: card('K'),
        defenderCard: card('K')
      }
    );

    expect(getTeamAdvantage(gameState)).toEqual({
      playerOnePoints: 5,
      playerTwoPoints: 3,
      difference: 2,
      balance: 2 / 15,
      playerOneShare: 0.5 + (2 / 15) * 0.5,
      leadingPlayerId: 'PLAYER_1',
      windowStartTurn: 2,
      windowEndTurn: 6
    });
  });

  it('keeps advantage close to neutral for shallow pressure against no progress', () => {
    const gameState = state([], []);
    gameState.turnNumber = 5;
    gameState.log.push(
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 1,
        positionId: 'midfielder-1',
        attackerCard: card('6'),
        defenderCard: card('5')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 3,
        positionId: 'midfielder-2',
        attackerCard: card('7'),
        defenderCard: card('6')
      },
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 5,
        positionId: 'midfielder-3',
        attackerCard: card('8'),
        defenderCard: card('7')
      }
    );

    expect(getTeamAdvantage(gameState)).toMatchObject({
      playerOnePoints: 3,
      playerTwoPoints: 0,
      difference: 3,
      balance: 3 / 15,
      playerOneShare: 0.6
    });
  });
});
