# Assets

Drop PNGs here. Missing files are fine — the demo falls back to colored rects.

## Layout

```
demo/assets/
├── tiles/
│   ├── ground.png
│   ├── brick.png
│   ├── pipe.png
│   ├── coin.png
│   └── flag.png
├── enemies/
│   ├── goomba.png
│   ├── koopa.png
│   └── piranha.png
├── player/
│   └── player.png
└── sounds/
    ├── jump.ogg
    ├── coin.ogg
    ├── stomp.ogg
    ├── death.ogg
    └── win.ogg
```

All sprites are drawn at **32×32 px**. Source images can be larger; canvas scales
them down. For pixel-art crispness, prefer 16×16 or 32×32 sources.

## Where to get them

Kenney.nl CC0 packs (no attribution required, but it's polite):

- **Platformer Pack Redux** — https://kenney.nl/assets/platformer-pack-redux
  - Tile mappings (approximate):
    - `ground.png` → `grass.png` or `dirt.png`
    - `brick.png` → `boxItem.png` / `box.png`
    - `pipe.png` → `pipeGreen.png`
    - `coin.png` → `coinGold.png`
    - `flag.png` → `flagRed1.png`
  - Enemies:
    - `goomba.png` → `enemyWalking_1.png` (or similar)
    - `koopa.png` → `enemyFloating_1.png`
    - `piranha.png` → `enemySpikey_1.png`
  - Player:
    - `player.png` → `alienGreen_stand.png` (or any character pack)

## Sounds

`.ogg` preferred (broad browser support, small files). `.mp3` works too — just
update `SOUND_PATHS` in `demo/index.html`. Kenney has free SFX packs:
https://kenney.nl/assets/category:Audio

The demo exposes `window.demoSound("jump"|"coin"|"stomp"|"death"|"win")` so the
engine can trigger sounds once Person 1 wires it up. The header `♪ test` button
plays a random loaded clip — handy for confirming files loaded.

## After dropping files in

Hard-reload the page (Ctrl+Shift+R). Footer status shows `sprites: N/9 ·
sounds: M/5`. Anything missing keeps using the fallback — no errors.

## Renaming vs. updating the manifest

Two options:
1. Rename downloaded files to match the paths above (simplest).
2. Open `demo/index.html`, find `ASSET_PATHS`, and point it at the original
   filenames.
