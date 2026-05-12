# demo/ — Person 4

The thing the judges see. Also: assets, glue, and demo rehearsal.

## Responsibilities

- Sprite + sound assets (Kenney.nl CC0 platformer pack)
- Split-screen demo page:
  - Left: live game canvas
  - Middle (optional): live level JSON, updating as Claude authors
  - Right: Claude Desktop screenshare or transcript
- Title screen ("Tile Jumper" or similar — not "Mario")
- README polish, install script, one-command bootstrap
- Demo script (see [../PLAN.md](../PLAN.md))
- Recorded backup video
- Floats wherever someone is stuck

## First deliverable (hour 4)

`demo/index.html` loads, shows the fixture level as a static rendering (even if just the JSON dumped to the page). Split-screen layout in place.

## Asset checklist

- [ ] Player sprite (idle, walk, jump frames)
- [ ] Goomba sprite (walk, squashed)
- [ ] Koopa sprite (walk, shell)
- [ ] Tile sprites: ground, brick, pipe, coin, flag
- [ ] Background per theme (overworld, underground, castle, ice, spooky)
- [ ] SFX: jump, coin, stomp, death, level-win

## Demo-day checklist

- [ ] Localhost only — do not depend on demo-day wifi
- [ ] Phone hotspot as backup
- [ ] 2-3 pre-generated fallback levels saved as JSON
- [ ] Backup video recorded at 1080p
- [ ] One-page handout for judges (what it does, the angle, links)
- [ ] Rehearse the full 3-minute script twice the afternoon before
