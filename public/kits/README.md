# Kit Assets

This folder is reserved for match card kit artwork.

## Field player kits

Use one folder per team id:

```text
public/kits/teams/<teamId>/home.png
public/kits/teams/<teamId>/away.png
```

`teamId` currently matches the national team `flagCode` from `src/data/nationalTeams.ts`.

## Goalkeeper kits

Universal goalkeeper kits live here:

```text
public/kits/goalkeepers/gk-1.png
public/kits/goalkeepers/gk-2.png
public/kits/goalkeepers/gk-3.png
public/kits/goalkeepers/gk-4.png
```

## Image requirements

- PNG with a transparent background.
- The image should contain only a shirt, shorts, and socks.
- Do not include a human figure.
- Do not include a face.
- Do not include a player number.
- Do not include a card rank.
- Leave clear space on the shirt chest for the programmatic player number.
- Leave clear space in the top-left card area for the programmatic rank.

Fallback rendering for missing kit assets will be implemented in a later stage.
