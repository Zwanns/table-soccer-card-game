# Kit Assets

Static kit WebP files for Total Soccer: Mundial live in:

```text
public/kits/images/
```

Field player kits use the `flagCode` from `src/data/nationalTeams.ts`:

```text
public/kits/images/pl1.webp
public/kits/images/fr1.webp
public/kits/images/es1.webp
public/kits/images/ua1.webp
public/kits/images/br1.webp
public/kits/images/eng1.webp
public/kits/images/sct1.webp
public/kits/images/wls1.webp
```

Fallback for teams without a registered kit:

```text
public/kits/images/none.webp
```

Universal goalkeeper kits:

```text
public/kits/images/gk1.webp
public/kits/images/gk2.webp
```

## Image Requirements

- WebP size: 702 x 900 px.
- File must be readable as WebP.
- File path must be inside `kits/images/`.
- Field kit file name must be `<flagCode>1.webp` for HOME or `<flagCode>2.webp` for AWAY.
- Fallback file name must be `none.webp`.
- Goalkeeper file names must be `gk1.webp` and `gk2.webp`.
- Include only the kit artwork.
- Do not include a player number.
- Do not include the card rank.
- Do not include text or labels.
- Do not include a human figure or face.

The player number is added programmatically. Its position is controlled by `SHIRT_NUMBER_ANCHOR` from `src/data/teamKits.ts`.
The number color uses each team's `shirtNumberColor`. By default this matches `secondaryColor`, but teams may override it. An optional `shirtNumberStrokeColor` controls the number outline.

## Registry

Registered team kits are generated into:

```text
src/data/generated/availableManualKitFlagCodes.ts
```

Adding a new field kit:

1. Put the file in `public/kits/images/<flagCode>1.webp`.
2. Keep the file WebP, 702 x 900 px.
3. Run `npm run validate:kits`.
4. Run `npm test`.
5. Commit the new `.webp` file and the generated registry update.

`npm run dev` and `npm run build` sync the generated registry automatically. While the dev server is running, adding, replacing, or deleting `public/kits/images/*.webp` also refreshes the registry and reloads the page. `npm run validate:kits` runs `npm run sync:kits` before validation. `npm test` also runs the sync hook before Vitest.

Do not edit `AVAILABLE_MANUAL_KIT_FLAG_CODES` manually. The runtime imports the generated registry through `src/data/teamKits.ts`, because the browser cannot read `public/kits/images/` with `fs`.

Unknown team files still fail validation. If `public/kits/images/xx1.webp` does not match a `nationalTeams.flagCode`, rename the file or add the team first.

Do not add `none`, `gk1`, or `gk2` to the generated team registry. They are handled as fallback and goalkeeper kits.

The mandatory service files are not optional registry entries. The validator always requires:

```text
public/kits/images/none.webp
public/kits/images/gk1.webp
public/kits/images/gk2.webp
```

## Attribution

Attribution metadata may be kept in:

```text
public/kits/ATTRIBUTION.json
```

Example:

```json
{
  "images/pl1.webp": {
    "sourcePage": "",
    "sourceFilePage": "",
    "source": "Wikipedia / Wikimedia Commons",
    "author": "",
    "license": "",
    "licenseUrl": "",
    "modified": true,
    "modificationNotes": "Manually cropped and adapted for use in Total Soccer: Mundial"
  }
}
```

## Importer Boundary

`scripts/wiki-kits/` is an experimental dev utility.

`public/kits/imported/` is not used by the game runtime.

Runtime kit assets must be copied into `public/kits/images/` as WebP files.

## AWAY colors and match selection

In `src/data/teamKits.ts`, edit `AWAY_KIT_METADATA`. The `de: {}` entry is
intentionally empty. Add `primaryColor` and `secondaryColor` as real `#RRGGBB`
values once known. Other teams use the same flagCode keys. Never copy HOME colors
as placeholders. Both valid colors and the image are required for tournament
selection; an image alone is enough for Quick Match and standalone penalties.

Optional `shirtNumberColor` and `shirtNumberStrokeColor` override the HOME number
style. Set `shirtNumberStrokeColor: null` to explicitly remove the outline.
Absent number settings inherit HOME only for number rendering.

HOME retains its existing `kit-<flagCode>` texture key. AWAY uses
`kit-<flagCode>-away`. Missing AWAY falls back to HOME, then `none.webp`.
The two generated availability lists are independent, including AWAY-only teams.

Tournament selection uses Oklab distance with dominant-color weight 0.75 and
secondary-color weight 0.25, plus a reversed-pair penalty. Tune the named constants
in `src/game/tournamentKitSelection.ts` after gameplay review. Accent and number
colors do not participate. Fixture order determines HOME priority.

Selection belongs to match setup, never squad storage. Restart and direct replay
preserve it. New selection screens default to HOME; each new tournament fixture
computes its own pair. Old match data without a selection defaults to HOME.
