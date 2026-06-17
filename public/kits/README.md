# Kit Assets

Static kit WebP files for Total Soccer: Mundial live in:

```text
public/kits/images/
```

Field player kits use the `flagCode` from `src/data/nationalTeams.ts`:

```text
public/kits/images/pl.webp
public/kits/images/fr.webp
public/kits/images/es.webp
public/kits/images/ua.webp
public/kits/images/br.webp
public/kits/images/gb-eng.webp
public/kits/images/gb-sct.webp
public/kits/images/gb-wls.webp
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
- Field kit file name must be `<flagCode>.webp`.
- Fallback file name must be `none.webp`.
- Goalkeeper file names must be `gk1.webp` and `gk2.webp`.
- Include only the kit artwork.
- Do not include a player number.
- Do not include the card rank.
- Do not include text or labels.
- Do not include a human figure or face.

The player number is added programmatically. Its position is controlled by `SHIRT_NUMBER_ANCHOR` from `src/data/teamKits.ts`.
The number color uses each team's `shirtNumberColor`. By default this matches `secondaryColor`, but teams may override it. Shirt numbers are rendered without stroke.

## Registry

Registered team kits are generated into:

```text
src/data/generated/availableManualKitFlagCodes.ts
```

Adding a new field kit:

1. Put the file in `public/kits/images/<flagCode>.webp`.
2. Keep the file WebP, 702 x 900 px.
3. Run `npm run validate:kits` to sync and validate the generated registry.
4. Run `npm test`.
5. Commit the new `.webp` file and the generated registry update.

`npm run validate:kits` runs `npm run sync:kits` before validation. `npm test` also runs the sync hook before Vitest.

Do not edit `AVAILABLE_MANUAL_KIT_FLAG_CODES` manually. The runtime imports the generated registry through `src/data/teamKits.ts`, because the browser cannot read `public/kits/images/` with `fs`.

Unknown team files still fail validation. If `public/kits/images/xx.webp` does not match a `nationalTeams.flagCode`, rename the file or add the team first.

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
  "images/pl.webp": {
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
