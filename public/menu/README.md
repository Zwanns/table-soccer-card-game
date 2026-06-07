# Menu assets

Optional visual assets for the main menu of `Total Soccer: Mundial`.

The app must keep working when these files are missing. In that case `MenuScene` uses its built-in fallback background, text title, and existing UI buttons.

## Expected files

```text
menu-bg.webp
```

Main menu background. Preferred size: `1600 x 720`.

Use this for a night stadium, stylized pitch, or tournament atmosphere. Do not include embedded buttons, UI text, or the game logo in this image.

```text
menu-logo.png
```

Transparent PNG logo for the game. If this file is absent, `MenuScene` renders the title with Phaser text.

```text
menu-ball.png
```

Transparent PNG decorative football. If this file is absent, `MenuScene` uses the existing `turn-ball` texture as a subtle fallback decoration.

```text
menu-flags.png
```

Transparent PNG strip or group of international flags. Keep it decorative and readable behind the menu UI.
