import Phaser from 'phaser';
import { playSoundSafe } from '../audio/playSoundSafe';
import { GameEngine, type GameState } from '../game';
import { createTournamentState, QUICK_MATCH_CONTEXT, type TournamentState } from '../tournament';
import { GAME_TITLE, GAME_VERSION, MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from '../ui/Button';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_ALPHA,
  SCOREBOARD_BORDER_COLOR
} from '../ui/scoreboardStyle';
import { SHARP_TEXT_RESOLUTION } from '../ui/textRendering';
import { createDevLabLayout, type DevLabLayout } from '../devLabLayout';

const DEV_LAB_SIDE_PANEL_RADIUS = 8;
const DEV_LAB_PREVIEW_RADIUS = 8;

const FINAL_WHISTLE_PREVIEW_TEXT = 'The match is over because Spain has no cards left to attack.';

const MATCH_FINISHED_MODAL = {
  width: 660,
  height: 390,
  imageY: -152,
  imageWidth: 300,
  imageHeight: 250,
  titleY: -46,
  bodyY: 28,
  buttonY: 128,
  buttonWidth: 210,
  buttonHeight: 54
} as const;

type DevLabScenario =
  | 'initial-deal'
  | 'post-attack-restore'
  | 'pause-during-restore';

export class DevLabScene extends Phaser.Scene {
  private previewModal: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('DevLabScene');
  }

  public create(): void {
    const layout = createDevLabLayout();

    this.createBackground(layout);
    this.createHeader(layout);
    this.createScenarioButtons(layout);
    this.createFooter(layout);
  }

  private createBackground(layout: DevLabLayout): void {
    if (this.textures.exists(MENU_ASSETS.background)) {
      const background = this.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, MENU_ASSETS.background);
      background.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT);
    } else {
      this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x0b5f3a);
    }

    this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.52);
    const preview = this.add.graphics();
    preview
      .fillStyle(SCOREBOARD_BACKGROUND_COLOR, 0.14)
      .fillRoundedRect(layout.preview.x, layout.preview.y, layout.preview.width, layout.preview.height, DEV_LAB_PREVIEW_RADIUS)
      .lineStyle(2, SCOREBOARD_BORDER_COLOR, 0.16)
      .strokeRoundedRect(layout.preview.x, layout.preview.y, layout.preview.width, layout.preview.height, DEV_LAB_PREVIEW_RADIUS);

    const sidePanel = this.add.graphics();
    sidePanel
      .fillStyle(SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA)
      .fillRoundedRect(
        layout.sidePanel.x,
        layout.sidePanel.y,
        layout.sidePanel.width,
        layout.sidePanel.height,
        DEV_LAB_SIDE_PANEL_RADIUS
      )
      .lineStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA)
      .strokeRoundedRect(
        layout.sidePanel.x,
        layout.sidePanel.y,
        layout.sidePanel.width,
        layout.sidePanel.height,
        DEV_LAB_SIDE_PANEL_RADIUS
      );
  }

  private createHeader(layout: DevLabLayout): void {
    const panelCenterX = layout.sidePanel.x + layout.sidePanel.width / 2;

    this.add
      .text(panelCenterX, layout.title.y, 'Dev Lab', {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.title.fontSize,
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    this.add
      .text(panelCenterX, layout.subtitle.y, 'Local gameplay preview sandbox', {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.subtitle.fontSize,
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);
  }

  private createScenarioButtons(layout: DevLabLayout): void {
    const scenarios: Array<{ label: string; onClick: () => void }> = [
      { label: 'Goal notification preview', onClick: () => this.showGoalNotificationPreview() },
      { label: 'Final whistle modal preview', onClick: () => this.showFinalWhistleModalPreview() },
      { label: 'Initial deal preview', onClick: () => this.startGamePreview('initial-deal') },
      { label: 'Post-attack restore preview', onClick: () => this.startGamePreview('post-attack-restore') },
      { label: 'Pause during restore test', onClick: () => this.startGamePreview('pause-during-restore') },
      { label: 'Result screen preview', onClick: () => this.openResultPreview() },
      { label: 'Tournament complete preview', onClick: () => this.openTournamentCompletePreview() }
    ];

    scenarios.forEach((scenario, index) => {
      const y = layout.buttons.startY + index * layout.buttons.gap;

      new Button(this, layout.sidePanel.x + layout.sidePanel.width / 2, y, scenario.label, scenario.onClick, {
        borderRadius: 8,
        borderWidth: 0,
        fontSize: layout.buttons.fontSize,
        height: layout.buttons.height,
        width: layout.buttons.width
      });
    });
  }

  private createFooter(layout: DevLabLayout): void {
    new Button(this, layout.sidePanel.x + layout.sidePanel.width / 2, layout.backButton.y, 'Back', () => this.scene.start('MenuScene'), {
      borderRadius: 8,
      borderWidth: 0,
      fontSize: layout.backButton.fontSize,
      height: layout.backButton.height,
      width: layout.backButton.width
    });

    this.add
      .text(SCENE_WIDTH - 24, SCENE_HEIGHT - 20, `${GAME_TITLE} | v${GAME_VERSION}`, {
        align: 'right',
        color: '#b8d2c1',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(1, 1);
  }

  private showGoalNotificationPreview(): void {
    const layout = createDevLabLayout();

    playSoundSafe(this, 'sound-goal', { volume: 0.72 });

    const text = this.add
      .text(layout.preview.centerX, layout.preview.centerY, 'GOAL!!', {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Bangers, Arial, sans-serif',
        fontSize: '88px',
        resolution: SHARP_TEXT_RESOLUTION,
        stroke: '#142231',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(1500)
      .setScale(0.82);

    this.tweens.add({
      targets: text,
      scale: 1.08,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          y: text.y - 54,
          delay: 520,
          duration: 900,
          ease: 'Sine.easeIn',
          onComplete: () => text.destroy()
        });
      }
    });
  }

  private showFinalWhistleModalPreview(): void {
    if (this.previewModal !== null) {
      return;
    }

    const layout = createDevLabLayout();
    const centerX = layout.preview.centerX;
    const centerY = layout.preview.centerY;
    const modal = this.add.container(0, 0).setDepth(1400);
    const overlay = this.add.rectangle(centerX, centerY, layout.preview.width, layout.preview.height, 0x06140f, 0.74);
    overlay.setInteractive();

    const panel = this.add.container(centerX, centerY);
    const background = this.add.rectangle(
      0,
      0,
      MATCH_FINISHED_MODAL.width,
      MATCH_FINISHED_MODAL.height,
      SCOREBOARD_BACKGROUND_COLOR,
      SCOREBOARD_BACKGROUND_ALPHA
    );
    const refereeVisual = this.createMatchFinishedRefereeVisual();
    const title = this.add
      .text(0, MATCH_FINISHED_MODAL.titleY, 'Final whistle', {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);
    const body = this.add
      .text(0, MATCH_FINISHED_MODAL.bodyY, FINAL_WHISTLE_PREVIEW_TEXT, {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width: MATCH_FINISHED_MODAL.width - 96 }
      })
      .setOrigin(0.5);
    const okButton = new Button(this, 0, MATCH_FINISHED_MODAL.buttonY, 'OK', () => this.closePreviewModal(), {
      borderRadius: 8,
      borderWidth: 0,
      fontSize: '24px',
      height: MATCH_FINISHED_MODAL.buttonHeight,
      width: MATCH_FINISHED_MODAL.buttonWidth
    });

    panel.add([background, refereeVisual, title, body, okButton]);
    modal.add([overlay, panel]);
    this.previewModal = modal;
  }

  private createMatchFinishedRefereeVisual(): Phaser.GameObjects.GameObject {
    if (!this.textures.exists('arbitr-end')) {
      const fallback = this.add.container(0, MATCH_FINISHED_MODAL.imageY);
      const placeholder = this.add.graphics();
      placeholder.fillStyle(0x142a21, 1);
      placeholder.fillRoundedRect(
        -MATCH_FINISHED_MODAL.imageWidth / 2,
        -MATCH_FINISHED_MODAL.imageHeight / 2,
        MATCH_FINISHED_MODAL.imageWidth,
        MATCH_FINISHED_MODAL.imageHeight,
        12
      );
      placeholder.lineStyle(2, 0x5f9572, 0.8);
      placeholder.strokeRoundedRect(
        -MATCH_FINISHED_MODAL.imageWidth / 2,
        -MATCH_FINISHED_MODAL.imageHeight / 2,
        MATCH_FINISHED_MODAL.imageWidth,
        MATCH_FINISHED_MODAL.imageHeight,
        12
      );
      fallback.add(placeholder);
      return fallback;
    }

    const image = this.add.image(0, MATCH_FINISHED_MODAL.imageY, 'arbitr-end');
    const source = this.textures.get('arbitr-end').getSourceImage() as { width: number; height: number };
    const scale = Math.min(
      MATCH_FINISHED_MODAL.imageWidth / source.width,
      MATCH_FINISHED_MODAL.imageHeight / source.height
    );
    image.setDisplaySize(source.width * scale, source.height * scale);
    return image;
  }

  private closePreviewModal(): void {
    this.previewModal?.destroy();
    this.previewModal = null;
  }

  private startGamePreview(scenario: DevLabScenario): void {
    this.scene.start('GameScene', {
      player1Name: 'Spain',
      player2Name: 'France',
      player1FlagCode: 'es',
      player2FlagCode: 'fr',
      player1ControllerType: 'HUMAN',
      player2ControllerType: 'AI',
      devMockContext: 'dev-lab',
      devLabScenario: scenario
    });
  }

  private openResultPreview(): void {
    this.scene.start('ResultScene', {
      state: createDevLabResultState(),
      launchContext: QUICK_MATCH_CONTEXT,
      suppressFinalWhistle: true,
      devMockReturnScene: 'DevLabScene'
    });
  }

  private openTournamentCompletePreview(): void {
    this.scene.start('TournamentCompleteScene', {
      devMockTournament: createDevLabCompletedTournament(),
      devMockReturnScene: 'DevLabScene'
    });
  }
}

function createDevLabResultState(): Readonly<GameState> {
  const engine = new GameEngine();
  const state = engine.startNewGame({
    seed: 'dev-lab-result',
    player1Name: 'Spain',
    player2Name: 'France',
    player1FlagCode: 'es',
    player2FlagCode: 'fr',
    player1ControllerType: 'HUMAN',
    player2ControllerType: 'AI'
  }) as GameState;
  const scorerCard = { id: 'dev-lab-ace-hearts', rank: 'A', color: 'RED', suit: 'HEARTS' } as const;
  const goalkeeperCard = { id: 'dev-lab-gk-8', rank: '8', kind: 'goalkeeper' } as const;

  state.players[0].goals = 2;
  state.players[1].goals = 1;
  state.phase = 'GAME_OVER';
  state.winnerId = state.players[0].id;
  state.isDraw = false;
  state.turnNumber = Math.max(state.turnNumber, 6);
  state.log.push(
    { type: 'SHOT_ON_GOAL', playerId: state.players[0].id, attackerCard: scorerCard, goalkeeperCard },
    {
      type: 'GOAL_SCORED',
      playerId: state.players[0].id,
      turnNumber: 4,
      attackerCard: scorerCard,
      scorer: {
        playerName: 'Dev Striker',
        shirtNumber: 9,
        rank: scorerCard.rank,
        teamId: 'es'
      }
    },
    { type: 'GOALKEEPER_SAVE', playerId: state.players[1].id, attackerCard: scorerCard, goalkeeperCard },
    { type: 'GAME_OVER', winnerId: state.winnerId }
  );

  return state;
}

function createDevLabCompletedTournament(): TournamentState {
  const tournament = createTournamentState({
    formatId: 'cup-m',
    seed: 'dev-lab-complete',
    teamIds: ['es', 'fr', 'br', 'de', 'it', 'pt', 'nl', 'ar'],
    participants: [
      { flagCode: 'es', controllerType: 'HUMAN' },
      { flagCode: 'fr', controllerType: 'AI' },
      { flagCode: 'br', controllerType: 'AI' },
      { flagCode: 'de', controllerType: 'AI' },
      { flagCode: 'it', controllerType: 'AI' },
      { flagCode: 'pt', controllerType: 'AI' },
      { flagCode: 'nl', controllerType: 'AI' },
      { flagCode: 'ar', controllerType: 'AI' }
    ]
  });
  const finalMatch = tournament.matches.find((match) => match.id === 'final-1');

  tournament.stage = 'complete';

  if (finalMatch !== undefined) {
    finalMatch.homeTeamId = 'es';
    finalMatch.awayTeamId = 'fr';
    finalMatch.status = 'completed';
    finalMatch.result = {
      matchId: finalMatch.id,
      homeTeamId: 'es',
      awayTeamId: 'fr',
      homeGoals: 3,
      awayGoals: 1,
      winnerTeamId: 'es',
      teamStats: {
        home: { teamId: 'es', goals: 3, shots: 7, goalkeeperSaves: 2 },
        away: { teamId: 'fr', goals: 1, shots: 4, goalkeeperSaves: 3 }
      },
      playerStats: [
        {
          teamId: 'es',
          playerId: 'dev-es-9',
          playerName: 'Dev Striker',
          shirtNumber: 9,
          goals: 2,
          assists: 1,
          goalkeeperSaves: 0,
          penaltyGoals: 0,
          penaltyGoalkeeperSaves: 0
        },
        {
          teamId: 'es',
          playerId: 'dev-es-1',
          playerName: 'Dev Keeper',
          shirtNumber: 1,
          goals: 0,
          assists: 0,
          goalkeeperSaves: 2,
          penaltyGoals: 0,
          penaltyGoalkeeperSaves: 0
        }
      ]
    };
  }

  return tournament;
}
