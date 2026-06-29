Task: Split Tournament Hub Next Match flow into Advance To Next Match and Play Next Match

Context
Project: Total Soccer: Mundial.
Work in main.

Area:
Tournament mode:
- Tournament Hub footer
- match progression flow
- AI-only auto simulation
- human-relevant match launch
- Finish tournament state

Important:
Do not commit.
Do not edit ToDo.md.
Report in Ukrainian.

Current behavior
Tournament Hub has a "Next Match" button.
It currently:
- auto-simulates AI-only matches before the next human-relevant match;
- then immediately launches the next human-relevant match.

New behavior
Split this into two separate steps/buttons:

1. "Advance to next match"
   - visible/active when there is at least one AI-only unplayed match before the next human-relevant match.
   - clicking it simulates those AI-only matches only.
   - after that it stays in Tournament Hub.
   - after that, this button becomes inactive/hidden because the next scheduled unplayed match is now human-relevant.

2. "Play next match"
   - renamed from current "Next Match".
   - active only when the next scheduled unplayed match is human-relevant and there are no AI-only matches before it.
   - clicking it starts that human-relevant match normally.

Terminology / labels
Use English UI labels unless the project already has localization:
- Advance to next match
- Play next match
- Finish tournament

Definitions
- Human-relevant match: an unplayed match where at least one team is not AI-controlled.
- AI-only match: an unplayed match where both teams are AI-controlled.
- Next scheduled unplayed match: first unplayed match in tournament schedule order.

Detailed requirements

============================================================
PART 1 — Footer button state machine
============================================================

The Tournament Hub footer should choose the correct primary progression action based on schedule state.

State A: next scheduled unplayed match is human-relevant
- Show/enable: Play next match
- Hide/disable: Advance to next match
- Hide/disable: Finish tournament
- Clicking Play next match starts that match.

State B: there are AI-only unplayed matches before the next human-relevant match
- Show/enable: Advance to next match
- Hide/disable or disable: Play next match
- Hide/disable: Finish tournament
- Clicking Advance to next match simulates only the AI-only matches before the next human-relevant match.
- It must not start the human-relevant match.
- It must remain in Tournament Hub after simulation.
- After the click completes, the footer state should update to State A.

State C: no future human-relevant matches remain, but tournament has unplayed matches
- Show/enable: Finish tournament
- Hide/disable: Advance to next match
- Hide/disable: Play next match
- Clicking Finish tournament simulates all remaining matches and opens TournamentCompleteScene.

State D: tournament complete
- TournamentCompleteScene behavior remains unchanged.

============================================================
PART 2 — Advance to next match behavior
============================================================

When pressing Advance to next match:
1. Find the next future human-relevant match.
2. Simulate every unplayed AI-only match before it in schedule order.
3. Do not simulate the human-relevant match itself.
4. Stay in Tournament Hub.
5. Update and save:
   - match cards
   - group standings
   - playoff seeding/bracket if affected
   - tournament progress counter
   - tournament stats
   - footer button state
6. If the simulation of AI-only matches causes playoff bracket updates that reveal the next human-relevant match, state should refresh correctly.

Important edge cases:
- If no human-relevant match exists, Advance to next match should not be shown. Use Finish tournament instead.
- If the next scheduled match is already human-relevant, Advance to next match should not be shown.

============================================================
PART 3 — Play next match behavior
============================================================

When pressing Play next match:
1. Check the next scheduled unplayed match.
2. It must be human-relevant.
3. Start/open this match through the normal playable tournament match flow.
4. Do not auto-simulate anything in this button.
5. If the next scheduled match is AI-only, Play next match must be disabled/hidden and Advance to next match should be available instead.

============================================================
PART 4 — Finish tournament behavior
============================================================

Keep current Finish tournament behavior:
- shown when no human-relevant future match remains;
- simulates all remaining matches in order;
- opens TournamentCompleteScene after final.

Make sure the new split flow does not regress this behavior.

============================================================
PART 5 — Remove old Next Match label
============================================================

The old label "Next Match" should no longer appear in Tournament Hub footer.
Use:
- Advance to next match
- Play next match
- Finish tournament

============================================================
PART 6 — Preserve existing decisions
============================================================

Do not restore Sim / Play buttons on match cards.
Do not change:
- Matches tab card visuals except if tests need button absence adjusted
- group-stage calendar order
- tournament stats aggregation
- simulated assists/saves consistency
- TournamentCompleteScene visual layout
- Tournament Setup
- Playoff geometry
- Stats layout
- save format unless strictly necessary
- ToDo.md

============================================================
PART 7 — Tests
============================================================

Add/update tests for:

1. If AI-only matches exist before the next human-relevant match:
   - footer shows Advance to next match
   - footer does not show Play next match as active
   - old Next Match label is not shown

2. Pressing Advance to next match:
   - simulates all preceding AI-only matches
   - does not launch the human-relevant match
   - does not open GameScene
   - remains in Tournament Hub
   - updates match results/cards/progress/stats/save
   - after completion, footer switches to Play next match

3. If the next scheduled unplayed match is human-relevant:
   - footer shows Play next match
   - Advance to next match is not active
   - pressing Play next match launches the match

4. If no future human-relevant matches remain:
   - footer shows Finish tournament
   - Advance to next match is not shown
   - Play next match is not shown

5. Finish tournament:
   - still simulates remaining matches
   - still opens TournamentCompleteScene

6. Regression:
   - no Sim / Play buttons are rendered on match cards
   - group-stage calendar order remains matchday-based
   - simulated AI-only stats still include goals/assists/saves
   - Cup M / Cup L / Cup XL behave correctly

Validation:
Run:
npm test
npm run build
git diff --check

Final report in Ukrainian:
1. changed files
2. how footer state machine works
3. how Advance to next match works
4. how Play next match works
5. how Finish tournament remains unchanged
6. test/build/diff-check results
7. confirm no commit was made