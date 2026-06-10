import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import type { NationalTeamSquad, SquadValidationResult } from '../data/squadTypes';
import { validateSquad } from '../data/squadValidation';
import { loadSquad, resetSquad, saveSquad } from '../services/squadStorage';
import { Button } from '../ui/Button';
import { createDraftSquadFromValues, type SquadEditorValues } from './squadEditorDraft';

type SquadEditorSceneData = {
  teamId?: string;
};

const FORM_WIDTH = 960;
const FORM_HEIGHT = 500;

export class SquadEditorScene extends Phaser.Scene {
  private teamId = 'fr';
  private squad: NationalTeamSquad = loadSquad(this.teamId);
  private formElement: HTMLFormElement | null = null;
  private formDomElement: Phaser.GameObjects.DOMElement | null = null;
  private message: Phaser.GameObjects.Text | null = null;
  private confirmModal: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('SquadEditorScene');
  }

  public init(data: SquadEditorSceneData): void {
    this.teamId = data.teamId ?? 'fr';
    this.squad = loadSquad(this.teamId);
  }

  public create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupDom, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupDom, this);
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    this.cleanupDom();

    const centerX = SCENE_WIDTH / 2;
    const team = getTeam(this.teamId);

    this.add.rectangle(centerX, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);
    this.add
      .text(centerX, 30, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.createHeader(team);
    this.createForm();

    new Button(this, 500, 666, 'Save', () => this.saveCurrentSquad(), { width: 210 });
    new Button(this, 800, 666, 'Reset squad', () => this.openResetConfirm(), { width: 250 });
    new Button(this, 1110, 666, 'Back', () => this.goBack(), { width: 210 });
  }

  private createHeader(team: NationalTeam): void {
    const header = this.add.container(SCENE_WIDTH / 2, 78);
    const flag = this.add.image(-220, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(58, 42);
    const title = this.add
      .text(-174, -10, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const subtitle = this.add
      .text(-174, 22, 'Team squad', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    header.add([flag, title, subtitle]);
  }

  private createForm(): void {
    const form = document.createElement('form');
    form.className = 'squad-editor-form';
    form.innerHTML = createSquadEditorHtml(this.squad);
    form.addEventListener('submit', (event) => event.preventDefault());

    this.formElement = form;
    this.formDomElement = this.add.dom(SCENE_WIDTH / 2, 362, form).setOrigin(0.5);
  }

  private saveCurrentSquad(): void {
    if (this.formElement === null) {
      return;
    }

    const values = collectEditorValues(this.formElement, this.teamId, this.squad);
    const draftSquad = createDraftSquadFromValues(values);
    const validation = validateSquad(draftSquad);

    if (!validation.ok) {
      this.showMessage(getValidationMessage(validation), '#f7a6a6');
      return;
    }

    saveSquad(draftSquad);
    this.squad = loadSquad(this.teamId);
    this.showMessage('Squad saved', '#d9eadf');
  }

  private openResetConfirm(): void {
    if (this.confirmModal !== null) {
      return;
    }

    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const modal = this.add.container(0, 0);
    const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.68);
    overlay.setInteractive();
    const panel = this.add.container(centerX, centerY);
    const background = this.add.rectangle(0, 0, 560, 220, 0x0b2118, 0.98);
    background.setStrokeStyle(2, 0xf0c95a, 0.95);
    const title = this.add
      .text(0, -54, 'Reset squad?', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const text = this.add
      .text(0, -12, 'All custom changes will be discarded.', {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        wordWrap: { width: 460 }
      })
      .setOrigin(0.5);
    const resetButton = new Button(this, -120, 64, 'Reset', () => {
      this.squad = resetSquad(this.teamId);
      this.closeResetConfirm();
      this.render();
      this.showMessage('Squad reset', '#d9eadf');
    });
    const cancelButton = new Button(this, 120, 64, 'Cancel', () => this.closeResetConfirm());

    panel.add([background, title, text, resetButton, cancelButton]);
    modal.add([overlay, panel]);
    this.confirmModal = modal;
  }

  private closeResetConfirm(): void {
    this.confirmModal?.destroy();
    this.confirmModal = null;
  }

  private goBack(): void {
    this.cleanupDom();
    this.scene.start('SquadSelectScene');
  }

  private showMessage(text: string, color: string): void {
    this.message?.destroy();
    this.message = this.add
      .text(SCENE_WIDTH / 2, 622, text, {
        align: 'center',
        color,
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 4,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);

    this.time.delayedCall(1600, () => {
      this.message?.destroy();
      this.message = null;
    });
  }

  private cleanupDom(): void {
    this.formDomElement?.destroy();
    this.formDomElement = null;
    this.formElement = null;
    this.closeResetConfirm();
  }
}

function createSquadEditorHtml(squad: NationalTeamSquad): string {
  const fieldRows = FIELD_SQUAD_RANKS.map((rank) => {
    const player = squad.fieldPlayers[rank];

    return `
      <label class="squad-editor-row">
        <span class="rank">${rank}</span>
        <input data-field-name="${rank}" maxlength="24" value="${escapeHtml(player.name)}" />
        <input data-field-number="${rank}" type="number" min="0" max="99" step="1" value="${player.shirtNumber}" />
      </label>`;
  }).join('');
  const goalkeeperRows = squad.goalkeepers.map((goalkeeper, index) => `
    <label class="squad-editor-row">
      <span class="rank">GK ${index + 1}</span>
      <input data-gk-name="${index}" maxlength="24" value="${escapeHtml(goalkeeper.name)}" />
      <input data-gk-number="${index}" type="number" min="0" max="99" step="1" value="${goalkeeper.shirtNumber}" />
      <input class="radio" data-gk-starting="${index}" type="radio" name="starting-goalkeeper" ${
        goalkeeper.id === squad.defaultStartingGoalkeeperId ? 'checked' : ''
      } />
    </label>`).join('');

  return `
    <style>
      .squad-editor-form {
        width: ${FORM_WIDTH}px;
        height: ${FORM_HEIGHT}px;
        box-sizing: border-box;
        padding: 16px 18px;
        color: #ffffff;
        background: rgba(11, 33, 24, 0.96);
        border: 2px solid rgba(95, 149, 114, 0.95);
        font-family: Arial, sans-serif;
        overflow: auto;
      }
      .squad-editor-grid {
        display: grid;
        grid-template-columns: 1.35fr 0.95fr;
        gap: 20px;
        height: 100%;
      }
      .squad-editor-panel {
        min-width: 0;
      }
      .squad-editor-title,
      .squad-editor-header,
      .squad-editor-row {
        display: grid;
        grid-template-columns: 72px 1fr 86px;
        gap: 10px;
        align-items: center;
      }
      .squad-editor-panel.gk .squad-editor-header,
      .squad-editor-panel.gk .squad-editor-row {
        grid-template-columns: 72px 1fr 86px 78px;
      }
      .squad-editor-title {
        display: block;
        margin-bottom: 8px;
        color: #f0c95a;
        font-size: 17px;
        font-weight: 700;
      }
      .squad-editor-header {
        margin-bottom: 5px;
        color: #9fc5ad;
        font-size: 13px;
        font-weight: 700;
      }
      .squad-editor-row {
        height: 28px;
        margin-bottom: 5px;
      }
      .squad-editor-row .rank {
        color: #f0c95a;
        font-weight: 700;
      }
      .squad-editor-form input {
        width: 100%;
        height: 26px;
        box-sizing: border-box;
        border: 1px solid #69a77b;
        background: #f6f1e7;
        color: #1f2a2e;
        font: 700 14px Arial, sans-serif;
        padding: 3px 7px;
      }
      .squad-editor-form input[type="number"] {
        text-align: center;
      }
      .squad-editor-form .radio {
        width: 18px;
        height: 18px;
        justify-self: center;
      }
    </style>
    <div class="squad-editor-grid">
      <section class="squad-editor-panel">
        <div class="squad-editor-title">Field players</div>
        <div class="squad-editor-header"><span>Rank</span><span>Name</span><span>Number</span></div>
        ${fieldRows}
      </section>
      <section class="squad-editor-panel gk">
        <div class="squad-editor-title">Goalkeepers</div>
        <div class="squad-editor-header"><span>Role</span><span>Name</span><span>Number</span><span>Starting</span></div>
        ${goalkeeperRows}
      </section>
    </div>`;
}

function collectEditorValues(form: HTMLFormElement, teamId: string, squad: NationalTeamSquad): SquadEditorValues {
  return {
    teamId,
    fieldPlayers: FIELD_SQUAD_RANKS.map((rank) => ({
      rank,
      name: getInputValue(form, `[data-field-name="${rank}"]`),
      shirtNumber: getInputValue(form, `[data-field-number="${rank}"]`)
    })),
    goalkeepers: [
      {
        id: squad.goalkeepers[0].id,
        name: getInputValue(form, '[data-gk-name="0"]'),
        shirtNumber: getInputValue(form, '[data-gk-number="0"]'),
        isStarting: getChecked(form, '[data-gk-starting="0"]')
      },
      {
        id: squad.goalkeepers[1].id,
        name: getInputValue(form, '[data-gk-name="1"]'),
        shirtNumber: getInputValue(form, '[data-gk-number="1"]'),
        isStarting: getChecked(form, '[data-gk-starting="1"]')
      }
    ]
  };
}

function getValidationMessage(validation: SquadValidationResult): string {
  if (validation.ok) {
    return 'Squad valid';
  }

  return validation.issues[0]?.message ?? 'Check the squad data.';
}

function getInputValue(form: HTMLFormElement, selector: string): string {
  return form.querySelector<HTMLInputElement>(selector)?.value ?? '';
}

function getChecked(form: HTMLFormElement, selector: string): boolean {
  return form.querySelector<HTMLInputElement>(selector)?.checked ?? false;
}

function getTeam(teamId: string): NationalTeam {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId) ?? NATIONAL_TEAMS[0];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
