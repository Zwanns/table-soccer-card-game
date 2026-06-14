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
menu-logo1.png
```

Transparent PNG scoreboard logo with the title switched on. If this file is absent, `MenuScene` renders the title with Phaser text.

```text
menu-logo2.png
```

Transparent PNG scoreboard logo with the title switched off. If this file is absent, `MenuScene` keeps `menu-logo1.png` visible and skips the blink effect.

```text
menu-flags.png
```

Transparent PNG strip or group of international flags. Keep it decorative and readable behind the menu UI.
