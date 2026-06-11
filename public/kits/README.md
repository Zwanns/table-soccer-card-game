# Kit Assets

Manual kit PNG files for Total Soccer: Mundial live in:

```text
public/kits/images/
```

Field player kits use the `flagCode` from `src/data/nationalTeams.ts`:

```text
public/kits/images/pl.png
public/kits/images/ua.png
public/kits/images/br.png
public/kits/images/gb-eng.png
public/kits/images/gb-sct.png
public/kits/images/gb-wls.png
```

Universal goalkeeper kits use:

```text
public/kits/images/gk-1.png
public/kits/images/gk-2.png
```

## Image Requirements

- PNG size: 384 x 420 px.
- Transparent background is preferred.
- A solid white background is temporarily accepted.
- Include only the shirt and shorts.
- Do not include socks.
- Do not include a player number.
- Do not include the card rank.
- Do not include text or labels.
- Do not include a human figure or face.
- File name must be `<flagCode>.png`.
- Goalkeeper file names must be `gk-1.png` and `gk-2.png`.

The player number is added programmatically. Its position is controlled by `SHIRT_NUMBER_ANCHOR` from `src/data/teamKits.ts`.

## Attribution

Every PNG listed in the manual registries must have an entry in:

```text
public/kits/ATTRIBUTION.json
```

Example:

```json
{
  "images/pl.png": {
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

Manual PNG files must be copied into `public/kits/images/`.
