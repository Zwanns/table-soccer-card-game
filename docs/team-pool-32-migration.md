TEAM.POOL.32 + FLAGCODE.MIGRATION.1 — implementation report

Baseline: the local 1.4.6 working tree, including KIT.METADATA.32 and the mobile HOME/AWAY implementation. No commit, push, reset, restore or cleanup was performed.

Canonical active pool

Source: src/data/activeTeams.ts. ACTIVE_TEAM_FLAG_CODES is an allow-list; ACTIVE_NATIONAL_TEAMS preserves the master NATIONAL_TEAMS display order. All 66 master teams, squads and HOME kits remain available for internal lookup and legacy tournament continuation.

ar, be, br, cm, co, hr, cz, dk, eng, fr, ge, de, it, jm, jp, mx, ma, nl, ng, no, py, pl, pt, ca, kr, es, se, tr, ua, uy, us, uz

Quick Match and standalone Penalty share TeamSelectScene: only active teams appear in grids, scrolling indexes and selected-team fallbacks; both player handlers reject inactive input. SquadSelectScene uses the filtered list and guards direct selection. SquadEditorScene normalizes input and falls back to an active team when an inactive squad is requested. The existing read-only viewer is retained.

TournamentSetupScene and tournamentSetupDraft use the active pool. Manual selection and injected complete drafts reject inactive teams. Random/empty-slot helpers filter even a supplied full master registry and deduplicate it. Cup XL uses all 32 unique active teams. TournamentEngine.create rejects inactive teams. The low-level createTournamentState factory supports explicit internal/legacy fixtures and normalizes incoming codes. Loading and advancing existing saves does not enforce the active pool.

Compatibility and persistence

src/data/flagCodes.ts provides normalizeFlagCode and normalizeFlagCodeKeys. src/tournament/tournamentFlagCodes.ts normalizes semantic identities in stored teamIds, participants, groups, fixtures, results, team/player stats, penalty winners/kicks/attempts and drawOrder keys. Opaque IDs, seeds, player names and labels remain unchanged. TournamentStorage applies normalization on reads and writes, including completed tournament records.

GameScene and GameEngine input, MatchTeamSetup creation, squad loading and TournamentPenaltyScene result/fieldKits input normalize aliases. Canonical asset resolvers never map new codes back to old filenames.

The localStorage audit found only tournament saves and language preferences. Quick Match selections, squad edits/customizations and standalone statistics have no separate persistence implementation in this version. No customization storage keys were removed, and all 66 squad definitions remain.

If old and canonical object keys coexist, the explicit canonical entry wins regardless of insertion order. Reading returns a normalized copy without cleanup or writeback; the original raw save is preserved. Tests cover collisions for all three aliases. Real user browser saves were not inspected or rewritten.

Assets — all nine renames verified byte-for-byte with SHA-256

- public/kits/images/gb-eng1.webp -> public/kits/images/eng1.webp
- public/kits/images/gb-sct1.webp -> public/kits/images/sct1.webp
- public/kits/images/gb-wls1.webp -> public/kits/images/wls1.webp
- public/covers/gb-eng.webp -> public/covers/eng.webp
- public/covers/gb-sct.webp -> public/covers/sct.webp
- public/covers/gb-wls.webp -> public/covers/wls.webp
- public/flags/gb-eng.svg -> public/flags/eng.svg
- public/flags/gb-sct.svg -> public/flags/sct.svg
- public/flags/gb-wls.svg -> public/flags/wls.svg

No corresponding legacy AWAY images existed; none were created. sync:kits regenerated the kit registry. SVGs retain their original embedded flag-icons-gb-* IDs to preserve image bytes; those IDs are not runtime team or asset keys.

Full preflight legacy text usage map

Runtime registry/resolver entries, generated metadata, source-contract fixtures, tests and the current kit README were migrated according to their roles. SVG embedded IDs were retained under the image-content preservation requirement.

- src/tests/fixtures/preserved-home-kit-metadata.json:139: "gb-sct": {
- src/tests/fixtures/preserved-home-kit-metadata.json:189: "gb-wls": {
- src/tests/fixtures/team-kit-metadata-32.json:125: "gb-eng",
- public/flags/gb-eng.svg:1: <svg xmlns="http://www.w3.org/2000/svg" id="flag-icons-gb-eng" viewBox="0 0 640 480">
- public/flags/gb-sct.svg:1: <svg xmlns="http://www.w3.org/2000/svg" id="flag-icons-gb-sct" viewBox="0 0 640 480">
- public/flags/gb-wls.svg:1: <svg xmlns="http://www.w3.org/2000/svg" id="flag-icons-gb-wls" viewBox="0 0 640 480">
- public/kits/README.md:17: public/kits/images/gb-eng1.webp
- public/kits/README.md:18: public/kits/images/gb-sct1.webp
- public/kits/README.md:19: public/kits/images/gb-wls1.webp
- src/assets/teamCover.ts:34: 'gb-eng',
- src/assets/teamCover.ts:35: 'gb-sct',
- src/assets/teamCover.ts:36: 'gb-wls',
- src/data/generated/availableManualKitFlagCodes.ts:26: 'gb-eng',
- src/data/generated/availableManualKitFlagCodes.ts:27: 'gb-sct',
- src/data/generated/availableManualKitFlagCodes.ts:28: 'gb-wls',
- src/data/nationalTeams.ts:27: { rank: 20, name: 'England', flagCode: 'gb-eng' },
- src/data/nationalTeams.ts:56: { rank: 48, name: 'Scotland', flagCode: 'gb-sct' },
- src/data/nationalTeams.ts:73: { rank: 65, name: 'Wales', flagCode: 'gb-wls' }
- src/data/nationalTeams.ts:96: 'gb-eng': 'ENG',
- src/data/nationalTeams.ts:125: 'gb-sct': 'SCO',
- src/data/nationalTeams.ts:142: 'gb-wls': 'WAL'
- src/data/realSquads.ts:103: 'gb-eng': ['Ashworth', 'Bradleyton', 'Crawford', 'Ellington', 'Harrington', 'Kingsley', 'Wexford', 'Chesterfield', 'Bromley', 'Fairhurst', 'Lockwood', 'Redgrave', 'Whitaker', 'Huxley', 'Northgate'],
- src/data/realSquads.ts:104: 'gb-sct': ['MacAlpin', 'McBraid', 'Campbellson', 'Abernethy', 'Drummond', 'Falkirk', 'Inverley', 'MacCrae', 'Strathmore', 'Glenwood', 'McTavish', 'Kirkcaldy', 'Dunbarry', 'MacNairn', 'Highland'],
- src/data/realSquads.ts:105: 'gb-wls': ['Aberdare', 'Llewelyn', 'Caradog', 'Brynmore', 'Gwynedd', 'Pritchard', 'Meredith', 'Powellyn', 'Ceredig', 'Rhondale', 'Taliesin', 'Owainson', 'Cardiffan', 'Pembroke', 'Maelor'],
- src/data/realSquads.ts:200: createSquad('gb-eng'),
- src/data/realSquads.ts:229: createSquad('gb-sct'),
- src/data/realSquads.ts:246: createSquad('gb-wls'),
- src/data/teamKits.ts:88: ['gb-eng', '#FFFFFF', '#1C2C5B', '#1C2C5B', undefined],
- src/data/teamKits.ts:117: ['gb-sct', '#003876', '#FFFFFF', '#FFFFFF', undefined],
- src/data/teamKits.ts:134: ['gb-wls', '#C8102E', '#FFFFFF', '#FFFFFF', undefined]
- src/data/teamKits.ts:253: 'gb-eng': {
- src/tests/kitAssetResolver.test.ts:89: for (const flagCode of ['fr', 'es', 'gb-eng', 'nir'] as const) {
- src/tests/matchFinishFlow.test.ts:80: players: [player('PLAYER_1', 'Portugal', ['Q'], undefined, 'pt'), player('PLAYER_2', 'England', [], undefined, 'gb-eng')],
- src/tests/matchFinishFlow.test.ts:93: players: [player('PLAYER_1', 'Portugal', ['Q'], undefined, 'pt'), player('PLAYER_2', 'England', [], undefined, 'gb-eng')],
- src/tests/matchFinishFlow.test.ts:106: const england = player('PLAYER_2', 'England', ['A', 'K', 'Q', 'J', '10'], undefined, 'gb-eng');
- src/tests/matchFinishFlow.test.ts:144: players: [player('PLAYER_1', 'Portugal', [], undefined, 'pt'), player('PLAYER_2', 'England', [], undefined, 'gb-eng')],
- src/tests/teamCover.test.ts:36: expect(getTeamCoverTextureKey('gb-eng')).toBe('cover-gb-eng');
- src/tests/teamCover.test.ts:65: expect.arrayContaining(['fr', 'es', 'nir', 'gb-eng', 'gb-sct', 'gb-wls', 'ie'])
- src/tests/teamCover.test.ts:71: expect(hasManualTeamCover('gb-eng')).toBe(true);
- src/tests/teamKits.test.ts:139: expect(getTeamKitStyle('gb-eng')).toMatchObject({
- src/tests/teamKits.test.ts:140: flagCode: 'gb-eng',
- src/tests/teamKits.test.ts:141: assetKey: 'kit-gb-eng',
- src/tests/teamKits.test.ts:142: path: 'kits/images/gb-eng1.webp'
- src/tests/teamKits.test.ts:144: expect(getTeamKitStyle('gb-sct')).toMatchObject({
- src/tests/teamKits.test.ts:145: flagCode: 'gb-sct',
- src/tests/teamKits.test.ts:146: assetKey: 'kit-gb-sct',
- src/tests/teamKits.test.ts:147: path: 'kits/images/gb-sct1.webp'
- src/tests/teamKits.test.ts:149: expect(getTeamKitStyle('gb-wls')).toMatchObject({
- src/tests/teamKits.test.ts:150: flagCode: 'gb-wls',
- src/tests/teamKits.test.ts:151: assetKey: 'kit-gb-wls',
- src/tests/teamKits.test.ts:152: path: 'kits/images/gb-wls1.webp'
- src/tests/teamKits.test.ts:239: expect.arrayContaining(['al', 'fr', 'es', 'gb-eng', 'gb-sct', 'gb-wls', 'ie', 'nir', 'pt', 'sk', 'tr'])
- src/tests/teamKits.test.ts:256: expect(hasManualTeamKit('gb-eng')).toBe(true);

Postflight legacy strings occur only in centralized compatibility aliases, explicit compatibility tests, this report and original embedded SVG IDs. Canonical runtime registries, current fixtures and filenames use eng/sct/wls. No legacy-named runtime files remain.

Files changed relative to the task baseline

- src/tests/fixtures/preserved-home-kit-metadata.json
- src/tests/fixtures/team-kit-metadata-32.json
- public/kits/README.md
- scripts/validate-kits.ts
- src/assets/teamCover.ts
- src/data/generated/availableManualKitFlagCodes.ts
- src/data/nationalTeams.ts
- src/data/realSquads.ts
- src/data/teamKits.ts
- src/game/GameEngine.ts
- src/game/MatchTeamSetup.ts
- src/scenes/GameScene.ts
- src/scenes/SquadEditorScene.ts
- src/scenes/SquadSelectScene.ts
- src/scenes/TeamSelectScene.ts
- src/scenes/TournamentPenaltyScene.ts
- src/scenes/TournamentSetupScene.ts
- src/scenes/tournamentSetupDraft.ts
- src/services/squadStorage.ts
- src/tests/kitAssetResolver.test.ts
- src/tests/matchFinishFlow.test.ts
- src/tests/squadEditor.test.ts
- src/tests/teamCountryGrid.test.ts
- src/tests/teamCover.test.ts
- src/tests/teamKits.test.ts
- src/tests/teamSelect.test.ts
- src/tests/teamSelectedHeader.test.ts
- src/tests/touchInput.test.ts
- src/tests/tournamentEngine.test.ts
- src/tests/tournamentGroupNameLayout.test.ts
- src/tests/tournamentSetup.test.ts
- src/tournament/TournamentEngine.ts
- src/tournament/TournamentState.ts
- src/tournament/TournamentStorage.ts
- src/data/activeTeams.ts (new)
- src/data/flagCodes.ts (new)
- src/tests/activeTeamPool.test.ts (new)
- src/tests/activeTeamSelectors.test.ts (new)
- src/tests/flagCodeMigration.test.ts (new)
- src/tournament/tournamentFlagCodes.ts (new)
- docs/team-pool-32-migration.md (new)

Verification

- sync:kits: 48 HOME / 2 AWAY assets; canonical codes regenerated.
- validate:kits: passed, 0 warnings; includes active-pool and kit-metadata validation.
- validate:covers: passed, 0 warnings.
- npm test: 71 files / 1155 tests passed.
- npm run build: TypeScript and production build passed; Vite large-chunk warning remains.
- git diff --check: passed.

Behavioral/structural tests exercise actual Quick Match/Penalty handlers and desktop/mobile rendered grids, active-only Squad Select/Editor behavior, all tournament formats across multiple seeds, full Cup XL filling, and loading/finishing a legacy tournament with inactive Scotland, Wales and Albania.

Snapshot checks confirm identical HOME/AWAY colors after code normalization, unchanged GK metadata and tournamentKitSelection, unchanged HOME/AWAY/mobile geometry, unchanged version files (1.4.6), unchanged image bytes, and unchanged protected cardFace.test.ts / kitCardFaceModel.ts / ToDo.md. Existing .vscode files were not edited.

Pre-task snapshots, hashes, status and diff: C:/Users/Zeberdee/AppData/Local/Temp/team-pool-32-SVai2M.
