import Phaser from 'phaser';
import type { GameEvent, Player } from '../game';

export class EventLogView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, events: readonly GameEvent[], players: readonly Player[]) {
    super(scene, x, y);

    const width = 220;
    const height = 152;
    const background = scene.add.rectangle(0, 0, width, height, 0x143f2d, 0.82);
    background.setStrokeStyle(2, 0x69a77b, 0.75);

    const title = scene.add
      .text(-width / 2 + 16, -height / 2 + 18, 'События', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    const lines = events
      .slice(-5)
      .map((event) => formatEvent(event, players))
      .filter((line) => line.length > 0);

    const body = scene.add
      .text(-width / 2 + 16, -height / 2 + 42, lines.join('\n'), {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        lineSpacing: 5,
        wordWrap: { width: width - 32 }
      })
      .setOrigin(0, 0);

    this.add([background, title, body]);
    scene.add.existing(this);
  }
}

function formatEvent(event: GameEvent, players: readonly Player[]): string {
  const playerName = 'playerId' in event ? players.find((player) => player.id === event.playerId)?.name : undefined;

  switch (event.type) {
    case 'FIRST_PLAYER_SELECTED':
      return `Первый ход: ${playerName ?? event.playerId}`;
    case 'ATTACK_CARD_DRAWN':
      return `${playerName ?? event.playerId}: атака ${event.card.rank}`;
    case 'CARD_DEFEATED':
      return `${event.attackerCard.rank} побила ${event.defenderCard.rank}`;
    case 'SHOT_ON_GOAL':
      return `Удар по воротам: ${event.attackerCard.rank} vs ${event.goalkeeperCard.rank}`;
    case 'ATTACK_MISSED':
      return `Промах: ${event.card.rank}`;
    case 'GOAL_SCORED':
      return `Гол: ${playerName ?? event.playerId}`;
    case 'TURN_ENDED':
      return `Ход завершен`;
    case 'GAME_OVER':
      return 'Игра окончена';
    default:
      return '';
  }
}
