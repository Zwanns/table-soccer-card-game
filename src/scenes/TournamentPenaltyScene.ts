import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import {
  createPenaltyShootoutState,
  createTournamentPenaltyResult,
  getCurrentPenaltyCards,
  submitTournamentMatchResultObject,
  takePenaltyKick,
  type PenaltyShootoutState,
  type TournamentMatchResult,
  type TournamentState,
  type TournamentTeamId
} from '../tournament';
import { Button } from '../ui/Button';

interface TournamentPenaltySceneData {
  tournamentId?: string;
  matchResult?: TournamentMatchResult;
}

export class TournamentPenaltyScene extends Phaser.Scene {
  private tournamentId: string | null = null;
  private matchResult: TournamentMatchResult | null = null;
  private shootoutState: PenaltyShootoutState | null = null;
  private message: string | null = null;

  public constructor() {
    super('TournamentPenaltyScene');
  }

  public init(data: TournamentPenaltySceneData): void {
    this.tournamentId = data.tournamentId ?? null;
    this.matchResult = data.matchResult ?? null;
    this.shootoutState = null;
    this.message = null;
  }

  public create(): void {
    if (this.tournamentId !== null && this.matchResult !== null) {
      this.shootoutState = createPenaltyShootoutState({
        matchId: this.matchResult.matchId,
        homeTeamId: this.matchResult.homeTeamId,
        awayTeamId: this.matchResult.awayTeamId,
        seed: `${this.tournamentId}:${this.matchResult.matchId}:penalties`
      });
    }

    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x142231);

    this.add
      .text(SCENE_WIDTH / 2, 82, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '44px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    if (this.tournamentId === null || this.matchResult === null || this.shootoutState === null) {
      this.renderMissingPenaltyData();
      return;
    }

    this.createScoreHeader(this.matchResult, this.shootoutState);
    this.createShootoutPanel(this.shootoutState);

    if (this.message !== null) {
      this.add
        .text(SCENE_WIDTH / 2, 602, this.message, {
          align: 'center',
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          fontStyle: '700',
          wordWrap: { width: 860 }
        })
        .setOrigin(0.5);
    }

    if (this.shootoutState.status === 'complete') {
      new Button(this, SCENE_WIDTH / 2, 660, 'Back to tournament', () => this.scene.start('TournamentHubScene'), {
        width: 300
      });
    }
  }

  private renderMissingPenaltyData(): void {
    this.add
      .text(SCENE_WIDTH / 2, 300, 'Penalty shootout data is missing.', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    new Button(this, SCENE_WIDTH / 2, 420, 'Back to tournament', () => this.scene.start('TournamentHubScene'), {
      width: 300
    });
  }

  private createScoreHeader(matchResult: TournamentMatchResult, shootoutState: PenaltyShootoutState): void {
    const homeTeam = findTeam(matchResult.homeTeamId);
    const awayTeam = findTeam(matchResult.awayTeamId);
    const scoreLine = this.add.container(SCENE_WIDTH / 2, 166);

    this.addPenaltyTeamHeader(scoreLine, -360, homeTeam, matchResult.homeTeamId, 'left');
    scoreLine.add(
      this.add
        .text(0, 0, `${matchResult.homeGoals} : ${matchResult.awayGoals}`, {
          color: '#dfeaf2',
          fontFamily: 'Arial, sans-serif',
          fontSize: '32px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.addPenaltyTeamHeader(scoreLine, 360, awayTeam, matchResult.awayTeamId, 'right');

    this.add
      .text(SCENE_WIDTH / 2, 216, `Penalties ${shootoutState.homeGoals} : ${shootoutState.awayGoals}`, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createShootoutPanel(shootoutState: PenaltyShootoutState): void {
    const panel = this.add.container(SCENE_WIDTH / 2, 394);
    const background = this.add.rectangle(0, 0, 900, 300, 0x0b2118, 0.88);
    background.setStrokeStyle(2, 0x5f9572, 0.95);
    panel.add(background);

    const shooterTeamId = shootoutState.nextShooter === 'home' ? shootoutState.homeTeamId : shootoutState.awayTeamId;
    const shooterTeam = findTeam(shooterTeamId);
    const lastKick = shootoutState.kicks[shootoutState.kicks.length - 1];

    panel.add(
      this.add
        .text(0, -118, shootoutState.status === 'complete' ? 'Shootout complete' : `${getTeamName(shooterTeamId)} to shoot`, {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '26px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );

    if (shooterTeam !== undefined && shootoutState.status === 'active') {
      const flag = this.add.image(-190, -118, getFlagAssetKey(shooterTeam.flagCode));
      flag.setDisplaySize(34, 24);
      panel.add(flag);
    }

    panel.add(
      this.add
        .text(0, -62, `Goalkeeper card: ${shootoutState.currentGoalkeeperRank}`, {
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );

    if (lastKick !== undefined) {
      panel.add(
        this.add
          .text(0, 104, formatKickSummary(lastKick), {
            color: '#d9eadf',
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontStyle: '700'
          })
          .setOrigin(0.5)
      );
    }

    if (shootoutState.status === 'complete') {
      const winnerTeamId = shootoutState.winnerTeamId;

      panel.add(
        this.add
          .text(0, 0, `${winnerTeamId === undefined ? 'Winner' : getTeamName(winnerTeamId)} wins`, {
            color: '#f0c95a',
            fontFamily: 'Arial, sans-serif',
            fontSize: '34px',
            fontStyle: '700'
          })
          .setOrigin(0.5)
      );
      return;
    }

    this.createPenaltyCardButtons(panel, shootoutState);
  }

  private createPenaltyCardButtons(panel: Phaser.GameObjects.Container, shootoutState: PenaltyShootoutState): void {
    const cards = getCurrentPenaltyCards(shootoutState);
    const startX = -((cards.length - 1) * 116) / 2;

    cards.forEach((_rank, index) => {
      panel.add(
        new Button(this, startX + index * 116, 30, `Card ${index + 1}`, () => this.takeKick(index), {
          fontSize: '18px',
          height: 52,
          width: 96
        })
      );
    });
  }

  private takeKick(cardIndex: number): void {
    if (this.shootoutState === null) {
      return;
    }

    try {
      this.shootoutState = takePenaltyKick(this.shootoutState, cardIndex);

      if (this.shootoutState.status === 'complete') {
        this.completeTournamentMatch();
      } else {
        this.message = null;
      }
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not take the penalty kick.';
    }

    this.render();
  }

  private completeTournamentMatch(): void {
    if (this.tournamentId === null || this.matchResult === null || this.shootoutState === null) {
      return;
    }

    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;

    if (tournament === undefined || tournament.id !== this.tournamentId) {
      this.message = 'Tournament was not found. The penalty result could not be saved.';
      return;
    }

    try {
      const penaltyShootout = createTournamentPenaltyResult(this.shootoutState);
      const updatedTournament = submitTournamentMatchResultObject(tournament, {
        ...this.matchResult,
        winnerTeamId: penaltyShootout.winnerTeamId,
        penaltyShootout
      });

      this.registry.set('currentTournament', updatedTournament);
      this.message = `${getTeamName(penaltyShootout.winnerTeamId)} wins on penalties.`;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not save the penalty shootout.';
    }
  }

  private addPenaltyTeamHeader(
    container: Phaser.GameObjects.Container,
    x: number,
    team: NationalTeam | undefined,
    fallbackTeamId: TournamentTeamId,
    align: 'left' | 'right'
  ): void {
    if (team !== undefined) {
      const flag = this.add.image(x + (align === 'left' ? -42 : 42), 0, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(52, 36);
      container.add(flag);
    }

    container.add(
      this.add
        .text(x, 0, team?.name ?? fallbackTeamId, {
          align,
          color: '#dfeaf2',
          fontFamily: 'Arial, sans-serif',
          fontSize: '30px',
          fontStyle: '700',
          wordWrap: { width: 250 }
        })
        .setOrigin(align === 'left' ? 0 : 1, 0.5)
    );
  }
}

function findTeam(teamId: TournamentTeamId): NationalTeam | undefined {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId);
}

function getTeamName(teamId: TournamentTeamId): string {
  return findTeam(teamId)?.name ?? teamId;
}

function formatKickSummary(kick: PenaltyShootoutState['kicks'][number]): string {
  return `${getTeamName(kick.shooterTeamId)}: ${kick.attackerRank} vs GK ${kick.goalkeeperRank} -> ${kick.outcome.toUpperCase()}`;
}
