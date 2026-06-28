import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GoalkeeperDeck, type Card, type GoalkeeperCard } from '../cards';
import { createDefaultSquad } from '../data/defaultSquads';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  createEmptyField,
  GameEngine,
  createMatchTeamSetup,
  type GameState,
  type Player
} from '../game';
import { createSimulatedTournamentGameState } from '../scenes/tournamentMatchSimulation';
import {
  createTournamentMatchResultFromGameState,
  createTournamentState,
  getTournamentPlayerStats,
  getTournamentPlayerStatsRanking,
  getTournamentTeamControllerType,
  submitTournamentMatchResultObject,
  type TournamentMatch
} from '../tournament';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

describe('tournament hub scene integration', () => {
  it('registers tournament setup and hub scenes in Phaser config', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain('TournamentSetupScene');
    expect(mainSource).toContain('TournamentHubScene');
    expect(mainSource).toContain('TournamentPenaltyScene');
    expect(mainSource).toContain('TournamentCompleteScene');
  });

  it('starts the tournament hub after setup creates a tournament', () => {
    const setupSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentSetupScene.ts'), 'utf8');

    expect(setupSource).toContain("this.registry.set('currentTournament'");
    expect(setupSource).toContain("this.scene.start('TournamentHubScene')");
  });

  it('uses the shared tournament background on the tournament hub', () => {
    const hubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');
    const backgroundSource = readFileSync(join(process.cwd(), 'src', 'ui', 'tournamentBackground.ts'), 'utf8');

    expect(hubSource).toContain("import { createTournamentBackground } from '../ui/tournamentBackground'");
    expect(hubSource).toContain('createTournamentBackground(this)');
    expect(hubSource).not.toContain('getBackgroundAssetKey');
    expect(hubSource).not.toContain('TOURNAMENT_ASSETS.statsBackground');
    expect(hubSource).not.toContain('cup-stats-bg');
    expect(hubSource).toContain("matches: 'Matches'");
    expect(hubSource).toContain("tables: 'Group Stage'");
    expect(hubSource).toContain("bracket: 'Playoff'");
    expect(hubSource).toContain("stats: 'Stats'");
    expect(backgroundSource).toContain('textureKey: string = TOURNAMENT_ASSETS.background');
    expect(backgroundSource).toContain('scene.textures.exists(textureKey) ? textureKey : TOURNAMENT_ASSETS.background');
    expect(hubSource).not.toContain(
      'this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a)'
    );
  });

  it('passes tournament launch context through match and result scenes', () => {
    const hubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');
    const gameSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const resultSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');

    expect(hubSource).toContain("mode: 'tournament'");
    expect(hubSource).toContain('tournamentMatchId');
    expect(gameSource).toContain('launchContext');
    expect(resultSource).toContain("{ label: 'Continue', onClick: () => this.returnToTournament() }");
    expect(resultSource).toContain('submitTournamentMatchResultObject');
    expect(resultSource).toContain("this.scene.start('TournamentCompleteScene')");
  });

  it('passes tournament participant controller types to visual matches without replacing simulations', () => {
    const hubSource = readSource('src/scenes/TournamentHubScene.ts');
    const simulationSource = readSource('src/scenes/tournamentMatchSimulation.ts');

    expect(hubSource).toContain('getTournamentTeamControllerType');
    expect(hubSource).toContain('player1ControllerType: getTournamentTeamControllerType(tournament, homeTeam.flagCode)');
    expect(hubSource).toContain('player2ControllerType: getTournamentTeamControllerType(tournament, awayTeam.flagCode)');
    expect(hubSource).toContain('createAiMarker');
    expect(hubSource).toContain('submitSimulatedTournamentMatch');
    expect(simulationSource).toContain('homeControllerType: getTournamentTeamControllerType(tournament, homeTeam.flagCode)');
    expect(simulationSource).toContain('awayControllerType: getTournamentTeamControllerType(tournament, awayTeam.flagCode)');
    expect(simulationSource).toContain('homeControllerType?: PlayerControllerType');
    expect(simulationSource).toContain('awayControllerType?: PlayerControllerType');
    expect(simulationSource).toContain('controllerType: options.homeControllerType');
    expect(simulationSource).toContain('controllerType: options.awayControllerType');
    expect(simulationSource).not.toContain('AiTurnController');
    expect(simulationSource).not.toContain('chooseAiAction');
  });

  it('keeps tournament simulations in Hub while saving results and reserving Complete for the final', () => {
    const hubSource = readSource('src/scenes/TournamentHubScene.ts');
    const simulateStart = hubSource.indexOf('private simulateTournamentMatch');
    const simulateEnd = hubSource.indexOf('private showSimulationError');
    const simulateBlock = hubSource.slice(simulateStart, simulateEnd);
    const simulationSource = readSource('src/scenes/tournamentMatchSimulation.ts');

    expect(simulationSource).toContain('createTournamentMatchResultFromGameState');
    expect(simulationSource).toContain('submitTournamentMatchResultObject');
    expect(hubSource).toContain('saveTournament(currentTournament)');
    expect(hubSource).toContain("this.registry.set('currentTournament', currentTournament)");
    expect(hubSource).toContain("if (currentTournament.stage === 'complete')");
    expect(hubSource).toContain("this.scene.start('TournamentCompleteScene')");
    expect(hubSource).toContain('this.render()');
    expect(simulateBlock).not.toContain("this.scene.start('ResultScene'");
    expect(simulateBlock).not.toContain("this.scene.start('GameScene'");
  });

  it('routes Next Match through AI-only simulations before starting the next human match', () => {
    const hubSource = readSource('src/scenes/TournamentHubScene.ts');

    expect(hubSource).toContain("new Button(this, layout.footer.nextX, layout.footer.y, 'Next Match'");
    expect(hubSource).toContain('private handleNextMatch(tournament: TournamentState): void');
    expect(hubSource).toContain('const nextMatch = findNextAvailableMatch(currentTournament)');
    expect(hubSource).toContain('function isAiVsAiTournamentMatch(');
    expect(hubSource).toContain('if (!isAiVsAiTournamentMatch(currentTournament, nextMatch))');
    expect(hubSource).toContain('this.startTournamentMatch(currentTournament, nextMatch)');
    expect(hubSource).toContain('const simulatedTournament = this.simulateTournamentMatch(currentTournament, nextMatch)');
    expect(hubSource).toContain('saveTournament(currentTournament)');
    expect(hubSource).toContain('function findNextAvailableMatch(tournament: TournamentState): TournamentMatch | undefined');
    expect(hubSource).not.toContain('function getAvailableMatchActions(');
    expect(hubSource).not.toContain('private runMatchAction(');
    expect(hubSource).not.toContain("new Button(this, action.kind === 'simulate'");
  });

  it('stores participant controller types in tournament state while preserving team ids', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: ['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar'],
      participants: [
        { flagCode: 'fr', controllerType: 'AI' },
        { flagCode: 'es', controllerType: 'HUMAN' }
      ],
      seed: 'tournament-ai-participants'
    });

    expect(tournament.teamIds).toEqual(['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar']);
    expect(tournament.participants.find((participant) => participant.flagCode === 'fr')?.controllerType).toBe('AI');
    expect(tournament.participants.find((participant) => participant.flagCode === 'pl')?.controllerType).toBe('HUMAN');
  });

  it('maps tournament participant controller types into a visual match setup', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: ['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar'],
      participants: [
        { flagCode: 'fr', controllerType: 'AI' },
        { flagCode: 'es', controllerType: 'HUMAN' }
      ],
      seed: 'tournament-ai-visual-match'
    });
    const engine = new GameEngine();
    const state = engine.startNewGame({
      seed: 'tournament-ai-visual-match:group-A-1',
      player1FlagCode: 'fr',
      player2FlagCode: 'es',
      player1ControllerType: getTournamentTeamControllerType(tournament, 'fr'),
      player2ControllerType: getTournamentTeamControllerType(tournament, 'es')
    });

    expect(state.matchSetups.PLAYER_1.controllerType).toBe('AI');
    expect(state.matchSetups.PLAYER_2.controllerType).toBe('HUMAN');
    expect(getTournamentTeamControllerType(tournament, 'pl')).toBe('HUMAN');
  });

  it('routes drawn playoff matches through the tournament penalty scene', () => {
    const resultSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');
    const penaltySource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');

    expect(resultSource).toContain("this.scene.start('TournamentPenaltyScene'");
    expect(resultSource).toContain("{ label: 'Continue', onClick: () => this.returnToTournament() }");
    expect(resultSource).toContain('needsPenaltyShootout');
    expect(penaltySource).toContain('createPenaltyShootoutState');
    expect(penaltySource).toContain('submitTournamentMatchResultObject');
    expect(penaltySource).not.toContain('formatKickSummary');
    expect(penaltySource).not.toContain('createLastKickCards');
    expect(penaltySource).not.toContain('createShootoutSummary');
    expect(penaltySource).toContain('createMatchStatsPanel');
    expect(penaltySource).toContain('Match stats');
    expect(penaltySource).toContain('MATCH_STATS_VIEWPORT');
    expect(penaltySource).toContain("scrollZone.on('wheel'");
    expect(penaltySource).toContain('tooltipEnabled: false');
    expect(penaltySource).not.toContain('getPenaltyExtraSymbol');
  });

  it('passes controller types into penalty shootout scene data without starting penalty AI', () => {
    const resultSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');
    const penaltySource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');

    expect(resultSource).toContain('getTournamentTeamControllerType');
    expect(resultSource).toContain('homeControllerType: getTournamentTeamControllerType(tournament, matchResult.homeTeamId)');
    expect(resultSource).toContain('awayControllerType: getTournamentTeamControllerType(tournament, matchResult.awayTeamId)');
    expect(penaltySource).toContain('player1ControllerType?: PlayerControllerType');
    expect(penaltySource).toContain('player2ControllerType?: PlayerControllerType');
    expect(penaltySource).toContain("this.homeControllerType = data.homeControllerType ?? data.player1ControllerType ?? 'HUMAN'");
    expect(penaltySource).toContain("this.awayControllerType = data.awayControllerType ?? data.player2ControllerType ?? 'HUMAN'");
    expect(penaltySource).not.toContain('AiTurnController');
    expect(penaltySource).not.toContain('chooseAiAction');
  });

  it('connects penalty AI actions through the same scene handlers as HUMAN clicks', () => {
    const penaltySource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');

    expect(penaltySource).toContain('new PenaltyAiController');
    expect(penaltySource).toContain('onAction: (action) => this.handlePenaltyAiAction(action)');
    expect(penaltySource).toContain('this.handleGoalkeeperAction()');
    expect(penaltySource).toContain('this.handleShotAction(action.cardIndex)');
    expect(penaltySource).toContain('onClick: canDrawGoalkeeper && !inputControlledByAi ? () => this.handleGoalkeeperAction() : undefined');
    expect(penaltySource).toContain('onClick: canReveal && !inputControlledByAi ? () => this.handleShotAction(index) : undefined');
    expect(penaltySource).toContain('this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyPenaltyAiController, this)');
    expect(penaltySource).toContain('this.penaltyAiController?.destroy()');
  });

  it('renders penalty shootouts on the match-style field layout', () => {
    const penaltySource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');
    const gameSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const fieldSource = readFileSync(join(process.cwd(), 'src', 'ui', 'FieldView.ts'), 'utf8');
    const matchFieldSource = readFileSync(join(process.cwd(), 'src', 'ui', 'MatchFieldView.ts'), 'utf8');
    const controlsSource = readFileSync(join(process.cwd(), 'src', 'ui', 'matchControlButtons.ts'), 'utf8');
    const resultActionsSource = readFileSync(join(process.cwd(), 'src', 'ui', 'resultActionButtons.ts'), 'utf8');
    const pauseSource = readFileSync(join(process.cwd(), 'src', 'ui', 'matchPauseOverlay.ts'), 'utf8');
    const rulesSource = readFileSync(join(process.cwd(), 'src', 'ui', 'MatchRulesOverlay.ts'), 'utf8');
    const attemptListSource = readFileSync(join(process.cwd(), 'src', 'ui', 'PenaltyAttemptListView.ts'), 'utf8');
    const sidePanelSource = readFileSync(join(process.cwd(), 'src', 'ui', 'matchSidePanelStyle.ts'), 'utf8');
    const cardSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardView.ts'), 'utf8');
    const cardScaleSource = readFileSync(join(process.cwd(), 'src', 'ui', 'matchCardScale.ts'), 'utf8');
    const layoutSource = readFileSync(join(process.cwd(), 'src', 'ui', 'matchScreenLayout.ts'), 'utf8');
    const bootSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');
    const scoreSource = readFileSync(join(process.cwd(), 'src', 'ui', 'ScoreView.ts'), 'utf8');
    const teamSelectSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TeamSelectScene.ts'), 'utf8');

    expect(penaltySource).toContain('new ScoreView');
    expect(scoreSource).toContain('penaltyScore');
    expect(scoreSource).toContain('`PEN ${options.penaltyScore.playerOne}:${options.penaltyScore.playerTwo}`');
    expect(penaltySource).toContain('penaltyScore: {');
    expect(penaltySource).toContain('new AdvantageView');
    expect(bootSource).toContain("document.fonts.load('64px DS-Digital')");
    expect(bootSource).toContain("document.fonts.load('400 42px Anton')");
    expect(bootSource).toContain("document.fonts.load('600 18px Oswald')");
    expect(bootSource).toContain('document.fonts.ready');
    expect(penaltySource).toContain('createPenaltyField');
    expect(penaltySource).toContain('createMatchControls');
    expect(penaltySource).toContain('createMatchControlButtons({');
    expect(gameSource).toContain('createMatchControlButtons({');
    expect(controlsSource).toContain("config.labels?.pause ?? 'Pause'");
    expect(controlsSource).toContain("config.labels?.rules ?? 'Rules'");
    expect(penaltySource).toContain('onPause: () => this.openPauseModal()');
    expect(penaltySource).toContain('onRules: () => this.openRulesModal()');
    expect(penaltySource).toContain("disabled: this.shootoutState?.status === 'complete'");
    expect(controlsSource).toContain('disabled: config.disabled');
    expect(penaltySource).not.toContain('createMenuButton');
    expect(penaltySource).not.toContain("new Button(this, 120, 34, 'Menu'");
    expect(penaltySource).toContain('this.pauseModal = createMatchPauseOverlay(this, [');
    expect(penaltySource).toContain("import { PenaltyPauseStatsPanel } from '../ui/PenaltyPauseStatsPanel'");
    expect(penaltySource).toContain('const statsPanel = new PenaltyPauseStatsPanel(this, SCENE_WIDTH / 2, MATCH_STATS_PANEL_CENTER_Y');
    expect(penaltySource).toContain('], { statsPanel });');
    expect(penaltySource).toContain("label: 'Continue'");
    expect(penaltySource).toContain("label: 'Exit to Menu'");
    expect(penaltySource).toContain("label: 'Sim'");
    expect(penaltySource).toContain('onClick: () => this.completeShootoutFromPause()');
    expect(penaltySource).not.toContain("label: 'About'");
    expect(penaltySource).toContain('this.rulesModal = createMatchRulesOverlay({');
    expect(pauseSource).toContain('export function createMatchPauseOverlay');
    expect(pauseSource).toContain('statsPanel?: Phaser.GameObjects.GameObject');
    expect(pauseSource).toContain('options.statsPanel ??');
    expect(rulesSource).toContain('export function createMatchRulesOverlay');
    expect(penaltySource).toContain('this.penaltyAiController?.cancelPendingAction()');
    expect(penaltySource).toContain('this.schedulePenaltyAiAction()');
    expect(penaltySource).toContain("this.scene.start('MenuScene')");
    expect(penaltySource).toContain('this.createCompletedShootoutActions()');
    expect(penaltySource).toContain("label: this.standalone ? 'Play Again' : 'Continue'");
    expect(penaltySource).toContain("label: 'New Match'");
    expect(penaltySource).toContain("{ label: 'Menu', onClick: () => this.scene.start('MenuScene') }");
    expect(penaltySource).not.toContain("this.standalone ? 'Menu' : 'Back to tournament'");
    expect(penaltySource).toContain('export const PENALTY_COMPLETE_PANEL_TOP_Y = PENALTY_ATTEMPT_LIST_TOP_Y');
    expect(penaltySource).toContain('export const PENALTY_COMPLETE_PANEL_HEIGHT = 500');
    expect(penaltySource).toContain(
      'const PENALTY_COMPLETE_PANEL_Y = PENALTY_COMPLETE_PANEL_TOP_Y + PENALTY_COMPLETE_PANEL_HEIGHT / 2'
    );
    expect(penaltySource).toContain('height: 420');
    expect(penaltySource).toContain('{ totalWidth: PENALTY_COMPLETE_PANEL_WIDTH }');
    expect(resultActionsSource).toContain('export const RESULT_ACTION_PANEL_WIDTH = 840');
    expect(resultActionsSource).toContain('export const RESULT_ACTION_BUTTON_HEIGHT = 68');
    expect(resultActionsSource).toContain("export const RESULT_ACTION_BUTTON_FONT_SIZE = '24px'");
    expect(resultActionsSource).toContain('export const RESULT_ACTION_BUTTON_RADIUS = 8');
    expect(resultActionsSource).toContain('const totalWidth = options.totalWidth ?? RESULT_ACTION_PANEL_WIDTH');
    expect(resultActionsSource).toContain('const buttonWidth = (totalWidth - RESULT_ACTION_BUTTON_GAP * Math.max(0, actions.length - 1)) / actions.length');
    const completedStatsHandler = penaltySource.slice(
      penaltySource.indexOf('private createMatchStatsPanel('),
      penaltySource.indexOf('private createStatsLabel(')
    );
    expect(completedStatsHandler).not.toContain("'Penalties'");
    expect(completedStatsHandler).not.toContain('formatPenaltyAttempt');
    expect(penaltySource).toContain('this.createPenaltyAttemptLists(this.shootoutState)');
    const resultsHandler = penaltySource.slice(
      penaltySource.indexOf('private completeShootoutFromPause()'),
      penaltySource.indexOf('private closePauseModal()')
    );
    expect(resultsHandler).toContain("simulatedState.phase === 'selecting-goalkeeper'");
    expect(resultsHandler).toContain('drawPenaltyGoalkeeperCard(simulatedState)');
    expect(resultsHandler).toContain('revealPenaltyAttackCard(simulatedState, 0)');
    expect(resultsHandler).toContain('takePenaltyKick(simulatedState)');
    expect(resultsHandler).toContain('this.completeTournamentMatch()');
    expect(resultsHandler).toContain('this.render()');
    const pauseHandler = penaltySource.slice(
      penaltySource.indexOf('private openPauseModal()'),
      penaltySource.indexOf('private completeShootoutFromPause()')
    );
    const rulesHandler = penaltySource.slice(penaltySource.indexOf('private openRulesModal()'), penaltySource.indexOf('private closeRulesModal()'));
    expect(pauseHandler).toContain("this.shootoutState?.status === 'complete'");
    expect(rulesHandler).toContain("this.shootoutState?.status === 'complete'");
    expect(pauseHandler).not.toContain('createPenaltyShootoutState');
    expect(pauseHandler).not.toContain('this.render()');
    expect(rulesHandler).not.toContain('createPenaltyShootoutState');
    expect(rulesHandler).not.toContain('this.render()');
    expect(fieldSource).toContain('export class FieldView extends MatchFieldView');
    expect(penaltySource).toContain('new MatchFieldView(this, MATCH_FIELD_CENTER_X, MATCH_FIELD_CENTER_Y)');
    expect(gameSource).toContain('const FIELD_CENTER_Y = MATCH_FIELD_CENTER_Y');
    expect(layoutSource).toContain('export const MATCH_FIELD_CENTER_Y = 400');
    expect(penaltySource).toContain('const PENALTY_GOALKEEPER_HOME_X = -490');
    expect(penaltySource).toContain('const PENALTY_GOALKEEPER_AWAY_X = 490');
    expect(penaltySource).toContain('queueTeamCoverLoad(this, this.matchResult.homeTeamId)');
    expect(penaltySource).toContain('queueTeamCoverLoad(this, this.matchResult.awayTeamId)');
    expect(bootSource).toContain('AVAILABLE_TEAM_COVER_FLAG_CODES');
    expect(bootSource).toContain('getTeamCoverTextureKey(flagCode)');
    expect(bootSource).toContain('getTeamCoverPath(flagCode)');
    expect(teamSelectSource).toContain("mode?: 'match' | 'penalty'");
    expect(teamSelectSource).toContain("'Penalty teams'");
    expect(teamSelectSource).toContain("'Start penalties'");
    expect(teamSelectSource).toContain("this.scene.start('TournamentPenaltyScene'");
    expect(teamSelectSource).toContain('createStandalonePenaltyMatchResult(data)');
    expect(penaltySource).toContain('coverTextureKey: this.getCoverTextureKey(teamId)');
    expect(penaltySource).toContain('createPenaltyCardColumns');
    expect(penaltySource).toContain("this.createPenaltyCardColumn(field, shootoutState, 'home', getPenaltyAttackColumnX(shootoutState, 'home'))");
    expect(penaltySource).toContain("this.createPenaltyCardColumn(field, shootoutState, 'away', getPenaltyAttackColumnX(shootoutState, 'away'))");
    expect(penaltySource).toContain('return targetX < 0 ? -PENALTY_ATTACK_COLUMN_X : PENALTY_ATTACK_COLUMN_X');
    expect(penaltySource).toContain('const PENALTY_ATTACK_CARD_ROTATION = Math.PI / 2');
    expect(penaltySource).toContain('card.setRotation(isRevealed ? 0 : PENALTY_ATTACK_CARD_ROTATION)');
    expect(penaltySource).toContain('.setPadding(24, 18, 24, 20)');
    expect(penaltySource).toContain('const PENALTY_MARKER_SCORE_GAP = 54');
    expect(penaltySource).toContain('const SHOOTOUT_MARKER_Y = PENALTY_STATUS_Y + PENALTY_MARKER_SCORE_GAP');
    expect(penaltySource).toContain('this.createShootoutMarkers(this.shootoutState)');
    expect(penaltySource).toContain('this.createPenaltyAttemptLists(this.shootoutState)');
    expect(penaltySource).toContain('new PenaltyAttemptListView(');
    expect(sidePanelSource).toContain(
      'export const MATCH_SIDE_PANEL_CORRIDOR_WIDTH = MATCH_FIELD_CENTER_X - MATCH_FIELD_WIDTH / 2 - FIELD_GOAL_DEPTH'
    );
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_LEFT_X = MATCH_SIDE_PANEL_CORRIDOR_WIDTH / 2');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_RIGHT_X = MATCH_SCREEN_WIDTH - MATCH_SIDE_PANEL_LEFT_X');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_TOP_Y = MATCH_FIELD_CENTER_Y - MATCH_FIELD_HEIGHT / 2');
    expect(matchFieldSource).toContain('export const FIELD_GOAL_AREA_HALF_HEIGHT = 95');
    expect(matchFieldSource).toContain('markings.strokeRect(pitchLeft, -FIELD_GOAL_AREA_HALF_HEIGHT, 70, FIELD_GOAL_AREA_HALF_HEIGHT * 2)');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_BOTTOM_Y = MATCH_FIELD_CENTER_Y - FIELD_GOAL_AREA_HALF_HEIGHT');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_HEIGHT = MATCH_SIDE_PANEL_BOTTOM_Y - MATCH_SIDE_PANEL_TOP_Y');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_WIDTH = MATCH_SIDE_PANEL_CORRIDOR_WIDTH - 8');
    expect(sidePanelSource).toContain('SCOREBOARD_BACKGROUND_COLOR');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_BACKGROUND_ALPHA = 0.82');
    expect(sidePanelSource).toContain('background.setStrokeStyle(1, MATCH_SIDE_PANEL_BORDER_COLOR, MATCH_SIDE_PANEL_BORDER_ALPHA)');
    expect(sidePanelSource).toContain("titleFontFamily: 'Arial, sans-serif'");
    expect(sidePanelSource).toContain("titleFontSize: '20px'");
    expect(sidePanelSource).toContain("itemFontFamily: 'Arial, sans-serif'");
    expect(sidePanelSource).toContain("itemFontSize: '19px'");
    expect(attemptListSource).toContain('createMatchSidePanelBackground(scene, PENALTY_ATTEMPT_LIST_HEIGHT / 2)');
    expect(attemptListSource).not.toContain('background.setStrokeStyle(2, 0xf0c95a');
    expect(attemptListSource).toContain('export const PENALTY_ATTEMPT_LIST_MAX_VISIBLE_ROWS = 6');
    expect(attemptListSource).toContain("attempt.success ? '#71e48b' : '#ff788a'");
    expect(attemptListSource).toContain('fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontFamily');
    expect(attemptListSource).toContain('fontSize: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontSize');
    expect(attemptListSource.match(/fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.itemFontFamily/g)?.length).toBe(2);
    expect(attemptListSource.match(/fontSize: MATCH_SIDE_PANEL_TEXT_STYLE.itemFontSize/g)?.length).toBe(2);
    expect(attemptListSource).toContain("attempt.success ? '✓' : '✗'");
    expect(attemptListSource.match(/resolution: SHARP_TEXT_RESOLUTION/g)?.length).toBeGreaterThanOrEqual(3);
    expect(attemptListSource).toContain('super(scene, px(x), px(y))');
    expect(attemptListSource).toContain('truncatePlayerName(attempt.shooterLabel)');
    expect(attemptListSource).not.toContain('.setScale(');
    const fieldCenterY = Number(layoutSource.match(/export const MATCH_FIELD_CENTER_Y = (\d+);/)?.[1]);
    const goalAreaHalfHeight = Number(matchFieldSource.match(/export const FIELD_GOAL_AREA_HALF_HEIGHT = (\d+);/)?.[1]);
    const cardHeight = Number(cardSource.match(/export const CARD_HEIGHT = ([\d.]+);/)?.[1]);
    const cardScale = Number(cardScaleSource.match(/export const MATCH_CARD_SCALE = ([\d.]+);/)?.[1]);
    const panelBottomY = fieldCenterY - goalAreaHalfHeight;
    const goalkeeperCardTopY = fieldCenterY - (cardHeight * cardScale) / 2;
    expect(panelBottomY).toBeLessThan(goalkeeperCardTopY);
    expect(penaltySource).toContain('attempts: createPenaltyAttemptSummaries(penaltyResult.kicks)');
    expect(penaltySource).toContain('PENALTY_SELECTED_CARD_SCALE');
    expect(penaltySource).toContain('const PENALTY_CARD_SCALE = MATCH_CARD_SCALE');
    expect(penaltySource).toContain('const PENALTY_SELECTED_CARD_SCALE = MATCH_CARD_SCALE');
    expect(penaltySource).toContain('card.setScale(options.scale ?? MATCH_CARD_SCALE)');
    expect(penaltySource).toContain('const PENALTY_ATTACK_CARD_GAP = 60');
    expect(matchFieldSource).toContain('private createPitchMarkings');
    expect(matchFieldSource).toContain('private createGoals');
    expect(penaltySource).not.toContain('createPenaltyPitchMarkings');
    expect(penaltySource).not.toContain('PENALTY_FIELD_WIDTH');
    expect(penaltySource).not.toContain('0x0d6a42');
    expect(penaltySource).not.toContain('createPenaltyGoalFrame');
  });

  it('uses a shared-layout penalty stats panel in the penalty pause menu', () => {
    const penaltySource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8');
    const pausePanelSource = readFileSync(join(process.cwd(), 'src', 'ui', 'PenaltyPauseStatsPanel.ts'), 'utf8');
    const matchPanelSource = readFileSync(join(process.cwd(), 'src', 'ui', 'MatchStatsPanel.ts'), 'utf8');

    expect(penaltySource).toContain('new PenaltyPauseStatsPanel');
    expect(penaltySource).toContain('matchResult: this.matchResult');
    expect(penaltySource).toContain('shootoutState: this.shootoutState');
    expect(pausePanelSource).toContain('MATCH_STATS_PANEL_HEIGHT');
    expect(pausePanelSource).toContain('MATCH_STATS_PANEL_WIDTH');
    expect(pausePanelSource).toContain('const width = options.width ?? MATCH_STATS_PANEL_WIDTH');
    expect(pausePanelSource).toContain('const height = options.height ?? MATCH_STATS_PANEL_HEIGHT');
    expect(pausePanelSource).toContain('SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA');
    expect(pausePanelSource).toContain("['Match goals', String(matchResult.homeGoals), String(matchResult.awayGoals)]");
    expect(pausePanelSource).toContain("['Penalties', String(shootoutState.homeGoals), String(shootoutState.awayGoals)]");
    expect(pausePanelSource).toContain("['Attempts', String(shootoutState.homeKicks), String(shootoutState.awayKicks)]");
    expect(pausePanelSource).toContain("'GK saves'");
    expect(pausePanelSource).toContain('getPenaltyGoalkeeperSaves(shootoutState,');
    expect(pausePanelSource).toContain('`PEN ${shootoutState.homeGoals}:${shootoutState.awayGoals}`');
    expect(pausePanelSource).toContain('getTeamScoreboardCode(matchResult.homeTeamId)');
    expect(pausePanelSource).not.toContain('Goalscorers');
    expect(matchPanelSource).toContain('export const MATCH_STATS_PANEL_WIDTH = RESULT_ACTION_PANEL_WIDTH');
  });

  it('provides a tournament completion scene with champion summary and stats navigation', () => {
    const completeSource = readSource('src/scenes/TournamentCompleteScene.ts');
    const hubSource = readSource('src/scenes/TournamentHubScene.ts');
    const resultSource = readSource('src/scenes/ResultScene.ts');

    expect(completeSource).toContain("super('TournamentCompleteScene')");
    expect(completeSource).toContain("import { createTournamentBackground } from '../ui/tournamentBackground'");
    expect(completeSource).toContain('createTournamentBackground(this, TOURNAMENT_ASSETS.winnerBackground)');
    expect(completeSource).toContain("import { isMobileLandscapeLayout } from '../ui/mobileLayout'");
    expect(completeSource).toContain("import {\n  RESULT_ACTION_BUTTON_FONT_SIZE,\n  RESULT_ACTION_BUTTON_HEIGHT,\n  RESULT_ACTION_BUTTON_RADIUS\n} from '../ui/resultActionButtons'");
    expect(completeSource).toContain('SCOREBOARD_BACKGROUND_COLOR,');
    expect(completeSource).toContain('SCOREBOARD_BACKGROUND_ALPHA,');
    expect(completeSource).toContain('SCOREBOARD_BORDER_COLOR,');
    expect(completeSource).toContain('SCOREBOARD_BORDER_ALPHA');
    expect(completeSource).toContain("this.createHeader(championTeamId, layout)");
    expect(completeSource).toContain("'Congratulations to the champion!'");
    expect(completeSource).not.toContain("'Tournament complete'");
    expect(completeSource).not.toContain('Champion:');
    expect(completeSource).not.toContain('matches played');
    expect(completeSource).toContain('Champion path');
    expect(completeSource).toContain('Tournament leaders');
    expect(completeSource).toContain('const matchOrder = new Map(tournament.matches.map((match, index) => [match.id, index]))');
    expect(completeSource).toContain(".sort((first, second) => (matchOrder.get(first.id) ?? 0) - (matchOrder.get(second.id) ?? 0))");
    expect(completeSource).not.toContain('first.roundIndex - second.roundIndex || first.orderIndex - second.orderIndex');
    expect(completeSource).not.toContain('SCOREBOARD_FONT_FAMILY');
    expect(completeSource).toContain('Top scorer');
    expect(completeSource).toContain('Top assist');
    expect(completeSource).toContain('Top goalkeeper');
    expect(completeSource).toContain('function createTournamentCompleteLayout(');
    expect(completeSource).toContain('mobileLandscape = isMobileLandscapeLayout()');
    expect(completeSource).toContain('const panelHeight = COMPLETE_PANEL_BOTTOM_Y - panelTop');
    expect(completeSource).toContain('fillRoundedRect(');
    expect(completeSource).toContain('strokeRoundedRect(');
    expect(completeSource).toContain('this.createPathRow(match, 0, layout.path.rowHeight / 2 + index * layout.path.rowGap, layout)');
    expect(completeSource).not.toContain('private createFinalLine');
    expect(completeSource).not.toContain("this.createSectionTitle(-488, -168, 'Final')");
    expect(completeSource).toContain('borderRadius: getCompleteActionButtonRadius(index, actions.length)');
    expect(completeSource).toContain('borderWidth: 0');
    expect(completeSource).toContain('const buttonWidth = layout.actions.width / actions.length');
    expect(completeSource).toContain('topLeft: 0');
    expect(completeSource).toContain('topRight: 0');
    expect(completeSource).toContain('bottomRight: isLast ? RESULT_ACTION_BUTTON_RADIUS : 0');
    expect(completeSource).toContain('bottomLeft: isFirst ? RESULT_ACTION_BUTTON_RADIUS : 0');
    expect(completeSource).toContain('View stats');
    expect(completeSource).toContain("initialTab: 'stats'");
    expect(completeSource).toContain('New tournament');
    expect(resultSource).not.toContain('TOURNAMENT_ASSETS.winnerBackground');
    expect(resultSource).not.toContain('cup-win-bg');
    expect(hubSource).toContain('initialTab?: TournamentHubTab');
  });
});

describe('tournament match result normalization', () => {
  it('creates a tournament match result from a finished game state', () => {
    const gameState = createFinishedGameState();
    const result = createTournamentMatchResultFromGameState('group-A-1', gameState, 'fr', 'es');

    expect(result).toMatchObject({
      matchId: 'group-A-1',
      homeTeamId: 'fr',
      awayTeamId: 'es',
      homeGoals: 1,
      awayGoals: 0,
      winnerTeamId: 'fr'
    });
    expect(result.teamStats.home.shots).toBe(2);
    expect(result.teamStats.away.shots).toBe(1);
    expect(result.playerStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamId: 'fr',
          playerId: 'field:A',
          goals: 1
        }),
        expect.objectContaining({
          teamId: 'fr',
          playerId: 'field:Q',
          assists: 1
        }),
        expect.objectContaining({
          teamId: 'fr',
          playerId: 'goalkeeper:gk',
          goalkeeperSaves: 1
        })
      ])
    );
  });

  it('does not carry assist candidates through posts or saves', () => {
    const afterPost = createTournamentMatchResultFromGameState('group-A-1', createPostBeforeGoalGameState(), 'fr', 'es');
    const afterSave = createTournamentMatchResultFromGameState('group-A-1', createSaveBeforeGoalGameState(), 'fr', 'es');

    expect(afterPost.playerStats.find((stats) => stats.playerId === 'field:Q')?.assists ?? 0).toBe(0);
    expect(afterSave.playerStats.find((stats) => stats.playerId === 'field:Q')?.assists ?? 0).toBe(0);
  });

  it('submits a normalized group result once and updates standings inputs', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: ['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar'],
      seed: 'tournament-flow'
    });
    const result = createTournamentMatchResultFromGameState('group-A-1', createFinishedGameState(), 'fr', 'es');
    const updatedTournament = submitTournamentMatchResultObject(tournament, result);

    expect(updatedTournament.matches.find((match) => match.id === 'group-A-1')).toMatchObject({
      status: 'completed',
      result: expect.objectContaining({
        homeGoals: 1,
        awayGoals: 0
      })
    });
    expect(() => submitTournamentMatchResultObject(updatedTournament, result)).toThrow('twice');
  });

  it('creates a simulated playoff result with a winner while penalties are not implemented', () => {
    const match: TournamentMatch = {
      id: 'semi-final-1',
      stage: 'semi-final',
      roundIndex: 1,
      orderIndex: 0,
      homeTeamId: 'fr',
      awayTeamId: 'es',
      status: 'available'
    };
    const homeTeam = requireNationalTeam('fr');
    const awayTeam = requireNationalTeam('es');
    const gameState = createSimulatedTournamentGameState({
      match,
      homeTeam,
      awayTeam,
      tournamentSeed: 'simulate-playoff'
    });
    const result = createTournamentMatchResultFromGameState(match.id, gameState, 'fr', 'es');

    expect(gameState.isDraw).toBe(false);
    expect(result.winnerTeamId).toBeDefined();
  });

  it('creates assists for simulated goals and keeps scorer and assist providers separate', () => {
    const match: TournamentMatch = {
      id: 'group-A-1',
      stage: 'group',
      roundIndex: 0,
      orderIndex: 0,
      groupId: 'A',
      homeTeamId: 'fr',
      awayTeamId: 'es',
      status: 'available'
    };
    const gameState = createSimulatedTournamentGameState({
      match,
      homeTeam: requireNationalTeam('fr'),
      awayTeam: requireNationalTeam('es'),
      tournamentSeed: 'simulate-assists'
    });
    const result = createTournamentMatchResultFromGameState(match.id, gameState, 'fr', 'es');
    const assistStats = result.playerStats.filter((stats) => stats.assists > 0);
    const goalEvents = gameState.log
      .map((event, index) => ({ event, index }))
      .filter((entry) => entry.event.type === 'GOAL_SCORED');

    expect(assistStats.length).toBeGreaterThan(0);
    goalEvents.forEach(({ event, index }) => {
      if (event.type !== 'GOAL_SCORED') {
        return;
      }

      const assistEvent = [...gameState.log.slice(0, index)]
        .reverse()
        .find((candidate) => candidate.type === 'CARD_DEFEATED' && candidate.playerId === event.playerId);

      expect(assistEvent).toBeDefined();
      if (assistEvent?.type === 'CARD_DEFEATED') {
        expect(assistEvent.attackerCard.rank).not.toBe(event.scorer.rank);
      }
    });
  });

  it('includes simulated assists in tournament top assists without breaking scorer and goalkeeper rankings', () => {
    let tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: ['fr', 'es', 'pl', 'ua', 'de', 'it', 'br', 'ar'],
      seed: 'simulate-assists'
    });
    const match = tournament.matches.find((candidate) => candidate.id === 'group-A-1')!;
    const gameState = createSimulatedTournamentGameState({
      match,
      homeTeam: requireNationalTeam(match.homeTeamId!),
      awayTeam: requireNationalTeam(match.awayTeamId!),
      tournamentSeed: tournament.seed
    });
    const result = createTournamentMatchResultFromGameState(match.id, gameState, match.homeTeamId!, match.awayTeamId!);

    tournament = submitTournamentMatchResultObject(tournament, result);

    const playerStats = getTournamentPlayerStats(tournament);

    expect(getTournamentPlayerStatsRanking(playerStats, 'assists', 1)[0]?.assists).toBeGreaterThan(0);
    expect(getTournamentPlayerStatsRanking(playerStats, 'goals', 1)[0]?.goals).toBeGreaterThan(0);
    expect(getTournamentPlayerStatsRanking(playerStats, 'goalkeeperSaves', 1)[0]?.goalkeeperSaves).toBeGreaterThan(0);
  });

  it('uses English tournament hub labels and flag rows in the playoff bracket', () => {
    const hubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');

    expect(hubSource).toContain("matches: 'Matches'");
    expect(hubSource).toContain("tables: 'Group Stage'");
    expect(hubSource).toContain("bracket: 'Playoff'");
    expect(hubSource).toContain("'round-of-16': 'Round of 16'");
    expect(hubSource).toContain("'semi-final': 'Semi-final'");
    expect(hubSource).toContain("final: 'Final'");
    expect(hubSource).toContain('addBracketTeamRow');
    expect(hubSource).toContain('getFlagAssetKey(team.flagCode)');
    expect(hubSource).toContain('layout.playoff');
    expect(hubSource).toContain('bindTwoAxisPlayoffScroll');
    expect(hubSource).toContain('getBracketColumnGap');
    expect(hubSource).toContain('getBracketRoundCenters');
    expect(hubSource).toContain('drawBracketConnectors');
  });
});

function requireNationalTeam(teamId: string) {
  const team = NATIONAL_TEAMS.find((candidate) => candidate.flagCode === teamId);

  if (team === undefined) {
    throw new Error(`Expected national team "${teamId}".`);
  }

  return team;
}

function createFinishedGameState(): GameState {
  const players: [Player, Player] = [
    createPlayer('PLAYER_1', 'France', 'fr', 1),
    createPlayer('PLAYER_2', 'Spain', 'es', 0)
  ];

  return {
    players,
    matchSetups: {
      PLAYER_1: createMatchTeamSetup({
        teamId: 'fr',
        squad: createDefaultSquad('fr'),
        goalkeeperKitId: 'gk1'
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: 'es',
        squad: createDefaultSquad('es'),
        goalkeeperKitId: 'gk2'
      })
    },
    activePlayerId: null,
    phase: 'GAME_OVER',
    attackCard: null,
    attackBank: [],
    legalTargetPositionIds: [],
    winnerId: 'PLAYER_1',
    isDraw: false,
    turnNumber: 6,
    log: [
      {
        type: 'CARD_DEFEATED',
        playerId: 'PLAYER_1',
        turnNumber: 2,
        positionId: 'defender-1',
        attackerCard: card('Q'),
        defenderCard: card('2')
      },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
      {
        type: 'GOAL_SCORED',
        playerId: 'PLAYER_1',
        turnNumber: 2,
        attackerCard: card('A'),
        scorer: {
          playerName: 'Mbappe',
          shirtNumber: 17,
          rank: 'A',
          teamId: 'fr'
        }
      },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_2', attackerCard: card('K'), goalkeeperCard: goalkeeperCard('8') },
      { type: 'GOALKEEPER_SAVE', playerId: 'PLAYER_2', attackerCard: card('K'), goalkeeperCard: goalkeeperCard('8') },
      { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
      { type: 'GOALPOST_HIT', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
      { type: 'GAME_OVER', winnerId: 'PLAYER_1' }
    ]
  };
}

function createPostBeforeGoalGameState(): GameState {
  return createGameStateWithLog([
    {
      type: 'CARD_DEFEATED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      positionId: 'defender-1',
      attackerCard: card('Q'),
      defenderCard: card('2')
    },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
    { type: 'GOALPOST_HIT', playerId: 'PLAYER_1', attackerCard: card('7'), goalkeeperCard: goalkeeperCard('7') },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
    {
      type: 'GOAL_SCORED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      attackerCard: card('A'),
      scorer: {
        playerName: 'Mbappe',
        shirtNumber: 17,
        rank: 'A',
        teamId: 'fr'
      }
    },
    { type: 'GAME_OVER', winnerId: 'PLAYER_1' }
  ]);
}

function createSaveBeforeGoalGameState(): GameState {
  return createGameStateWithLog([
    {
      type: 'CARD_DEFEATED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      positionId: 'defender-1',
      attackerCard: card('Q'),
      defenderCard: card('2')
    },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('5'), goalkeeperCard: goalkeeperCard('8') },
    { type: 'GOALKEEPER_SAVE', playerId: 'PLAYER_1', attackerCard: card('5'), goalkeeperCard: goalkeeperCard('8') },
    { type: 'SHOT_ON_GOAL', playerId: 'PLAYER_1', attackerCard: card('A'), goalkeeperCard: goalkeeperCard('6') },
    {
      type: 'GOAL_SCORED',
      playerId: 'PLAYER_1',
      turnNumber: 2,
      attackerCard: card('A'),
      scorer: {
        playerName: 'Mbappe',
        shirtNumber: 17,
        rank: 'A',
        teamId: 'fr'
      }
    },
    { type: 'GAME_OVER', winnerId: 'PLAYER_1' }
  ]);
}

function createGameStateWithLog(log: GameState['log']): GameState {
  const state = createFinishedGameState();

  return {
    ...state,
    log
  };
}

function createPlayer(id: Player['id'], name: string, flagCode: string, goals: number): Player {
  return {
    id,
    name,
    flagCode,
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals,
    deck: { cards: [] },
    goalkeeperDeck: new GoalkeeperDeck([goalkeeperCard('3')]),
    field: createEmptyField()
  };
}

function card(rank: Card['rank']): Card {
  return {
    id: `FLOW_${rank}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

function goalkeeperCard(rank: GoalkeeperCard['rank']): GoalkeeperCard {
  return {
    id: `TOURNAMENT_GK_${rank}`,
    kind: 'goalkeeper',
    rank
  };
}
