# Team logos

Use 64×64 WebP images named `<canonical flagCode>.webp`, matching `NATIONAL_TEAMS.flagCode`.
Codes and extensions must be lowercase. Paraguay is `py`; England, Scotland and Wales are
`eng`, `sct` and `wls`. Legacy `gb-eng`, `gb-sct` and `gb-wls` filenames are rejected.

All 32 active teams must have logos. Logos for inactive teams are supported too.
The UI prefers an available, loaded logo and displays it as a square at the previous flag height.
Teams without a logo, or whose logo fails to load, fall back to their existing `public/flags/<code>.svg`.
Keep the flags available; neither sync nor validation modifies image files.

Run `npm run sync:logos` after adding files and `npm run validate:logos` to check
canonical filenames, active-team coverage, WebP format and exact 64×64 dimensions.
Dev/build/test startup automatically syncs the registry from actual files.
