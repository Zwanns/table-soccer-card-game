import { describe, expect, it, vi } from 'vitest';
import { ACTIVE_NATIONAL_TEAMS } from '../data/activeTeams';
import { createTournamentState, getTournamentFormat, loadStoredTournament, saveTournament, submitTournamentMatchResult } from '../tournament';
import { getTournamentKnockoutAdvancements } from '../tournament/TournamentBracket';
import type { TournamentFormatId, TournamentMatch, TournamentStage, TournamentState } from '../tournament/tournamentTypes';
import { resolveKnockoutBracketModel } from '../ui/tournamentBracketModel';
import { createTournamentHubLayout, getTournamentHubCupMPlayoffGeometry, getTournamentHubCupXlPlayoffGeometry } from '../ui/tournamentHubLayout';
import { TournamentHubScene } from '../scenes/TournamentHubScene';

vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: class {} } } }));

const formats: TournamentFormatId[] = ['cup-m', 'cup-l', 'cup-xl'];
const ids = (matches: readonly TournamentMatch[]) => matches.map((match) => match.id);

function createState(formatId: TournamentFormatId): TournamentState {
  return createTournamentState({ formatId, seed: 'bracket-continuity',
    teamIds: ACTIVE_NATIONAL_TEAMS.slice(0, getTournamentFormat(formatId).teamCount).map((team) => team.flagCode) });
}

function completeStage(state: TournamentState, stage: TournamentStage): TournamentState {
  for (const match of state.matches.filter((match) => match.stage === stage)) {
    state = submitTournamentMatchResult(state, match.id, { homeGoals: 2, awayGoals: 0 });
  }
  return state;
}

function completeTournament(formatId: TournamentFormatId): TournamentState {
  let state = completeStage(createState(formatId), 'group');
  for (const round of getTournamentFormat(formatId).knockoutRounds) {
    state = completeStage(state, round.stage);
  }
  return state;
}

function membership(state: TournamentState) {
  const model = resolveKnockoutBracketModel(state.formatId, state.matches);
  return [model.left, model.right].map((branch) => branch.rounds.map((round) => ids(round.matches)));
}

function assertGraphContinuity(state: TournamentState): void {
  const model = resolveKnockoutBracketModel(state.formatId, state.matches);
  const graph = getTournamentKnockoutAdvancements(state.formatId);
  expect(model.edges.map(({ fromMatchId, toMatchId, slot }) => ({ fromMatchId, toMatchId, slot }))).toEqual(graph);
  for (const branch of [model.left, model.right]) {
    for (let index = 1; index < branch.rounds.length; index += 1) {
      branch.rounds[index].matches.forEach((parent, parentIndex) => {
        const children = branch.rounds[index - 1].matches.slice(parentIndex * 2, parentIndex * 2 + 2);
        expect(new Set(ids(children))).toEqual(new Set(graph.filter((edge) => edge.toMatchId === parent.id).map((edge) => edge.fromMatchId)));
      });
    }
    const branchIds = new Set(branch.rounds.flatMap((round) => ids(round.matches)));
    for (const edge of model.edges.filter((edge) => edge.side === branch.side)) {
      expect(branchIds.has(edge.fromMatchId)).toBe(true);
      expect(edge.toMatchId === model.finalMatch.id || branchIds.has(edge.toMatchId)).toBe(true);
    }
  }
}

describe('canonical knockout ancestry and winner paths', () => {
  it('groups Cup XL through actual semifinal ancestry with deterministic parent order', () => {
    const state = createState('cup-xl');
    const model = resolveKnockoutBracketModel('cup-xl', state.matches);
    expect(model.left.rounds.map((round) => ids(round.matches))).toEqual([
      ['round-of-16-1', 'round-of-16-2', 'round-of-16-5', 'round-of-16-6'],
      ['quarter-final-1', 'quarter-final-3'], ['semi-final-1']
    ]);
    expect(model.right.rounds.map((round) => ids(round.matches))).toEqual([
      ['round-of-16-3', 'round-of-16-4', 'round-of-16-7', 'round-of-16-8'],
      ['quarter-final-2', 'quarter-final-4'], ['semi-final-2']
    ]);
    expect(resolveKnockoutBracketModel('cup-xl', [...state.matches].reverse())).toEqual(model);
  });

  it.each(formats)('%s render parent-child pairs match the engine graph before any results', (formatId) => {
    const state = createState(formatId);
    assertGraphContinuity(state);
    expect(resolveKnockoutBracketModel(formatId, state.matches).edges.every((edge) => !edge.hasCompletedWinner && !edge.isWinnerSeeded)).toBe(true);
    const graph = getTournamentKnockoutAdvancements(formatId);
    expect(Object.isFrozen(graph)).toBe(true);
    expect(graph.every(Object.isFrozen)).toBe(true);
  });

  it.each(formats)('%s winners advance only along their rendered ancestry through the Final', (formatId) => {
    const initialMembership = membership(createState(formatId));
    let state = completeStage(createState(formatId), 'group');
    for (const round of getTournamentFormat(formatId).knockoutRounds) {
      for (const match of state.matches.filter((candidate) => candidate.stage === round.stage)) {
        state = submitTournamentMatchResult(state, match.id, { homeGoals: 2, awayGoals: 0 });
        const model = resolveKnockoutBracketModel(formatId, state.matches);
        const edge = model.edges.find((candidate) => candidate.fromMatchId === match.id);
        if (edge !== undefined) {
          const target = state.matches.find((candidate) => candidate.id === edge.toMatchId)!;
          expect(target[edge.slot]).toBe(match.homeTeamId);
          expect(edge.hasCompletedWinner).toBe(true);
          expect(edge.isWinnerSeeded).toBe(true);
          const next = model.edges.find((candidate) => candidate.fromMatchId === target.id);
          if (next !== undefined) expect(next.side).toBe(edge.side);
        }
        expect(membership(state)).toEqual(initialMembership);
        assertGraphContinuity(state);
      }
    }
    expect(state.stage).toBe('complete');
    expect(state.matches.every((match) => match.status === 'completed')).toBe(true);
    expect(resolveKnockoutBracketModel(formatId, state.matches).edges.every((edge) => edge.isWinnerSeeded)).toBe(true);
  });

  it('keeps R16/QF/SF branch membership stable while QFs are partial and SF1 is seeded but locked', () => {
    let state = completeStage(completeStage(createState('cup-xl'), 'group'), 'round-of-16');
    const initial = membership(state);
    for (const id of ['quarter-final-1', 'quarter-final-3']) {
      state = submitTournamentMatchResult(state, id, { homeGoals: 2, awayGoals: 0 });
    }
    expect(state.matches.find((match) => match.id === 'semi-final-1')).toMatchObject({ status: 'locked' });
    const model = resolveKnockoutBracketModel('cup-xl', state.matches);
    expect(model.left.semiFinalMatch.homeTeamId).toBeDefined();
    expect(model.left.semiFinalMatch.awayTeamId).toBeDefined();
    expect(model.edges.filter((edge) => edge.isWinnerSeeded)).toHaveLength(10);
    expect(membership(state)).toEqual(initial);
    state = submitTournamentMatchResult(state, 'quarter-final-2', { homeGoals: 0, awayGoals: 3 });
    state = submitTournamentMatchResult(state, 'quarter-final-4', { homeGoals: 0, awayGoals: 3 });
    expect(state.matches.filter((match) => match.stage === 'semi-final').every((match) => match.status === 'available')).toBe(true);
    expect(membership(state)).toEqual(initial);
  });

  it('reproduces BRA/USA/ARG/CZE: BRA and ARG share SF1; USA and CZE share SF2', () => {
    let state = completeStage(createState('cup-xl'), 'group');
    const homes = ['br', 'de', 'us', 'pl', 'ar', 'nl', 'cz', 'ua'];
    const aways = state.teamIds.filter((id) => !homes.includes(id)).slice(0, 8);
    let index = 0;
    state = { ...state, matches: state.matches.map((match) => match.stage === 'round-of-16'
      ? { ...match, homeTeamId: homes[index], awayTeamId: aways[index++] } : match) };
    state = completeStage(completeStage(state, 'round-of-16'), 'quarter-final');
    const model = resolveKnockoutBracketModel('cup-xl', state.matches);
    expect(model.left.rounds[1].matches.map((match) => match.result?.winnerTeamId)).toEqual(['br', 'ar']);
    expect(model.right.rounds[1].matches.map((match) => match.result?.winnerTeamId)).toEqual(['us', 'cz']);
    expect(model.left.semiFinalMatch).toMatchObject({ homeTeamId: 'br', awayTeamId: 'ar' });
    expect(model.right.semiFinalMatch).toMatchObject({ homeTeamId: 'us', awayTeamId: 'cz' });
    expect(model.edges.filter((edge) => edge.hasCompletedWinner).every((edge) => edge.isWinnerSeeded)).toBe(true);
    state = completeStage(completeStage(state, 'semi-final'), 'final');
    const completed = resolveKnockoutBracketModel('cup-xl', state.matches);
    expect(completed.finalMatch.result?.winnerTeamId).toBe('br');
    const championEdges = completed.edges.filter((edge) => state.matches.find((match) => match.id === edge.fromMatchId)?.result?.winnerTeamId === 'br');
    expect(championEdges).toHaveLength(3);
    expect(championEdges.every((edge) => edge.side === 'left' && edge.isWinnerSeeded)).toBe(true);
  });

  it('audits Cup L QF1/QF2 -> SF1 and QF3/QF4 -> SF2', () => {
    const model = resolveKnockoutBracketModel('cup-l', completeTournament('cup-l').matches);
    expect(ids(model.left.rounds[0].matches)).toEqual(['quarter-final-1', 'quarter-final-2']);
    expect(ids(model.right.rounds[0].matches)).toEqual(['quarter-final-3', 'quarter-final-4']);
    expect(model.left.semiFinalMatch.id).toBe('semi-final-1');
    expect(model.right.semiFinalMatch.id).toBe('semi-final-2');
    expect(model.edges.every((edge) => edge.isWinnerSeeded)).toBe(true);
  });

  it('audits Cup M semifinal winners entering the two canonical Final slots', () => {
    const model = resolveKnockoutBracketModel('cup-m', completeTournament('cup-m').matches);
    expect(model.edges).toMatchObject([
      { fromMatchId: 'semi-final-1', toMatchId: 'final-1', slot: 'homeTeamId', isWinnerSeeded: true },
      { fromMatchId: 'semi-final-2', toMatchId: 'final-1', slot: 'awayTeamId', isWinnerSeeded: true }
    ]);
  });

  it.each([false, true])('loads legacy %s completed/partial saves without changing their IDs, teams, results or next matches', (completed) => {
    const state = completed ? completeTournament('cup-xl') : completeStage(completeStage(createState('cup-xl'), 'group'), 'round-of-16');
    const snapshot = JSON.stringify(state);
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    expect(saveTournament(state, storage)).toBe(true);
    const loaded = loadStoredTournament(storage)!.tournament;
    expect(loaded).toEqual(state);
    resolveKnockoutBracketModel('cup-xl', loaded.matches);
    expect(JSON.stringify(loaded)).toBe(snapshot);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('Cup XL viewport geometry', () => {
  it.each([false, true])('fits all seven columns, centers Final and mirrors gaps (mobile=%s)', (mobile) => {
    const layout = createTournamentHubLayout(mobile);
    const geometry = getTournamentHubCupXlPlayoffGeometry(layout);
    const { cardWidth, leftColumnXs: left, rightColumnXs: right, finalX } = geometry;
    expect(geometry.contentWidth).toBeLessThanOrEqual(layout.playoff.width);
    expect(geometry.startX).toBeGreaterThanOrEqual(0);
    expect(right[0] + cardWidth).toBeLessThanOrEqual(layout.playoff.width);
    expect(Math.max(0, geometry.contentWidth - layout.playoff.width)).toBe(0);
    expect(finalX + cardWidth / 2).toBe(layout.playoff.width / 2);
    expect(finalX - left[2]).toBe(right[2] - finalX);
    expect(left[2] - left[1]).toBe(right[1] - right[2]);
    expect(left[1] - left[0]).toBe(right[0] - right[1]);
    expect(geometry.columnLabels).toHaveLength(7);
    for (const anchor of geometry.columnLabels) {
      expect(anchor.originX).toBe(0.5);
      expect(anchor.x - anchor.maxWidth / 2).toBeGreaterThanOrEqual(0);
      expect(anchor.x + anchor.maxWidth / 2).toBeLessThanOrEqual(layout.playoff.width);
    }
    const firstCenter = layout.playoff.cardHeight / 2 + 44;
    expect(firstCenter - layout.playoff.cardHeight / 2 - 24 - parseInt(geometry.titleFontSize) / 2).toBeGreaterThanOrEqual(0);
    expect(firstCenter + 3 * layout.playoff.rowGap + layout.playoff.cardHeight / 2 + 12).toBeLessThanOrEqual(layout.playoff.viewportHeight);
    expect(layout.playoff.rowGap).toBeGreaterThan(layout.playoff.cardHeight);
  });

  it('fits from available viewport width instead of assuming a fixed mobile width', () => {
    const layout = createTournamentHubLayout(true);
    for (const width of [1344, 1400, 1500, 1536, 1600]) {
      const geometry = getTournamentHubCupXlPlayoffGeometry({ ...layout, playoff: { ...layout.playoff, width } });
      expect(geometry.contentWidth).toBeLessThanOrEqual(width);
      expect(geometry.finalX + geometry.cardWidth / 2).toBe(width / 2);
      expect(geometry.columnGap).toBe(28);
      expect(geometry.centerGap).toBe(40);
    }
  });
});

// Exercise the actual scene methods; only Phaser drawing objects are replaced.
function renderBracket(state: TournamentState, mobile: boolean) {
  const scene = new TournamentHubScene() as unknown as Record<string, any>;
  const cards: { match: TournamentMatch; x: number; y: number; layout: ReturnType<typeof createTournamentHubLayout> }[] = [];
  const labels: { x: number; origin: number; width: number }[] = [];
  const lines: { color: number; points: number[] }[] = [];
  let color = 0;
  const graphics = { lineStyle: (_width: number, nextColor: number) => { color = nextColor; return graphics; },
    lineBetween: (...points: number[]) => { lines.push({ color, points }); return graphics; },
    fillStyle: () => graphics, fillRect: () => graphics, createGeometryMask: () => ({}), setVisible: () => graphics };
  const zone = { setInteractive: () => zone, setDepth: () => zone };
  scene.add = { container: (x: number, y: number) => ({ x, y, add: () => {}, setMask: () => {} }), graphics: () => graphics, zone: () => zone,
    text: (x: number, _y: number, text: string) => {
      const label = { x, origin: 0, width: text.length * 13, setOrigin: (origin: number) => { label.origin = origin; return label; },
        setScale: (scale: number) => { label.width *= scale; return label; } };
      labels.push(label);
      return label;
    } };
  scene.make = { graphics: () => graphics };
  scene.tabContent = { add: () => {} };
  scene.bindTwoAxisPlayoffScroll = vi.fn();
  scene.createScrollbar = vi.fn();
  scene.createBracketMatch = (match: TournamentMatch, x: number, y: number, layout: ReturnType<typeof createTournamentHubLayout>) => {
    cards.push({ match, x, y, layout }); return {};
  };
  scene.playoffScrollX = 400; // A legacy scrolled view must reset to zero.
  scene.playoffScrollY = 0;
  const layout = createTournamentHubLayout(mobile);
  scene.createBracketTab(state, layout);
  return { scene, cards, labels, lines, layout };
}

describe('actual Playoff renderer regression audit', () => {
  it.each(formats.flatMap((formatId) => [false, true].map((mobile) => ({ formatId, mobile }))))('$formatId mobile=$mobile has no overflow and gold paths reach canonical targets', ({ formatId, mobile }) => {
    const state = completeTournament(formatId);
    const { scene, cards, lines, layout, labels } = renderBracket(state, mobile);
    expect(scene.playoffScrollX).toBe(0);
    expect(scene.playoffScrollY).toBe(0);
    expect(cards).toHaveLength(state.matches.filter((match) => match.stage !== 'group').length);
    for (const card of cards) {
      expect(card.x).toBeGreaterThanOrEqual(0);
      expect(card.x + card.layout.playoff.cardWidth).toBeLessThanOrEqual(layout.playoff.width);
      expect(card.y).toBeGreaterThanOrEqual(0);
      expect(card.y + card.layout.playoff.cardHeight).toBeLessThanOrEqual(layout.playoff.viewportHeight);
    }
    for (const edge of getTournamentKnockoutAdvancements(formatId)) {
      const source = cards.find((card) => card.match.id === edge.fromMatchId)!;
      const target = cards.find((card) => card.match.id === edge.toMatchId)!;
      const rightToLeft = source.x > target.x;
      const sourceX = source.x + (rightToLeft ? 0 : source.layout.playoff.cardWidth);
      const sourceY = source.y + source.layout.playoff.cardHeight / 2;
      const targetX = target.x + (rightToLeft ? target.layout.playoff.cardWidth : 0);
      const targetY = target.y + target.layout.playoff.cardHeight / 2;
      const jointX = (sourceX + targetX) / 2;
      for (const expected of [
        [sourceX, sourceY, jointX, sourceY],
        [jointX, sourceY, jointX, targetY],
        [jointX, targetY, targetX, targetY]
      ]) {
        expect(lines.some((line) => line.color === 0xf0c95a && line.points.every((point, index) => point === expected[index]))).toBe(true);
      }
    }
    if (formatId === 'cup-xl') {
      expect(labels).toHaveLength(7);
      for (const label of labels) {
        expect(label.origin).toBe(0.5);
        expect(label.x - label.width / 2).toBeGreaterThanOrEqual(0);
        expect(label.x + label.width / 2).toBeLessThanOrEqual(layout.playoff.width);
      }
      const final = cards.find((card) => card.match.stage === 'final')!;
      expect(final.x + final.layout.playoff.cardWidth / 2).toBe(layout.playoff.width / 2);
      const model = resolveKnockoutBracketModel(formatId, state.matches);
      for (const branch of [model.left, model.right]) {
        for (const match of branch.rounds.flatMap((round) => round.matches)) {
          const card = cards.find((card) => card.match.id === match.id)!;
          expect(branch.side === 'left' ? card.x < final.x : card.x > final.x).toBe(true);
        }
      }
    }
    if (formatId === 'cup-m') {
      expect(cards[0].layout.playoff.cardWidth).toBe(getTournamentHubCupMPlayoffGeometry(layout).cardWidth);
    }
    if (formatId === 'cup-l') {
      expect(cards[0].layout.playoff.cardWidth).toBe(layout.playoff.cardWidth);
    }
  });

  it('renders neutral topology before winners are known and adds only completed source gold paths', () => {
    const before = createState('cup-xl');
    const unplayed = renderBracket(before, true);
    expect(unplayed.lines.filter((line) => line.color === 0xf0c95a)).toHaveLength(0);
    let partial = completeStage(completeStage(before, 'group'), 'round-of-16');
    partial = submitTournamentMatchResult(partial, 'quarter-final-1', { homeGoals: 2, awayGoals: 0 });
    const rendered = renderBracket(partial, true);
    expect(rendered.lines.filter((line) => line.color !== 0xf0c95a)).toEqual(unplayed.lines);
    expect(rendered.lines.filter((line) => line.color === 0xf0c95a)).toHaveLength(9 * 3);
    expect(rendered.cards.map(({ match, x, y }) => ({ id: match.id, x, y }))).toEqual(unplayed.cards.map(({ match, x, y }) => ({ id: match.id, x, y })));
  });
});
