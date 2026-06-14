# Team Cover Assets

Static deck-cover WebP files for Total Soccer: Mundial live in:

```text
public/covers/
```

Team deck covers use the `flagCode` from `src/data/nationalTeams.ts`:

```text
public/covers/<flagCode>.webp
```

Fallback for teams without a registered cover:

```text
public/covers/none.webp
```

## Image Requirements

- File must be readable as WebP.
- Team cover file name must be `<flagCode>.webp`.
- Fallback file name must be `none.webp`.
- The recommended cover size is `960 x 1320 px`.
- Do not use Windows paths or imported dev-cache paths in runtime code.

## Registry

Registered team covers are listed in `AVAILABLE_TEAM_COVER_FLAG_CODES` in:

```text
src/assets/teamCover.ts
```

Adding a new team cover is a runtime contract:

1. Put the file in `public/covers/<flagCode>.webp`.
2. Make sure `<flagCode>` matches `nationalTeams.flagCode`.
3. Add `<flagCode>` to `AVAILABLE_TEAM_COVER_FLAG_CODES`.
4. Run `npm run validate:covers`.
5. Run `npm test`.
6. Run `npm run build`.

If a matching `<flagCode>.webp` exists for a national team but is not registered, `npm run validate:covers` fails.
The game would otherwise keep showing `covers/none.webp`.

Do not add `none` to `AVAILABLE_TEAM_COVER_FLAG_CODES`. It is handled as the fallback cover.
