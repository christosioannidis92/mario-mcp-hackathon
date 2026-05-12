# Plan

## Roles

### Person 1 — Engine Core (`engine/`)
- Canvas renderer, game loop, tile/sprite rendering
- Physics: gravity, collision, jumping
- Keyboard input (arrow keys / WASD, space to jump, R to reset)
- Camera follow
- Exposes the `Game` interface from [TOOLS.md](TOOLS.md)
- **First deliverable (hour 4)**: renders `fixtures/sample-level.json` with a stationary player sprite

### Person 2 — Content & World (`world/`)
- Level JSON schema (already drafted in TOOLS.md — refine as needed)
- Enemy behaviours (Goomba walks, Koopa shells)
- Library of level *chunks* (gap, staircase, pipe-with-enemy) that `generate_level` composes
- Implements every tool as a pure function over level/game state
- **First deliverable (hour 4)**: `tools.ts` with stubbed pure functions that pass round-trip tests

### Person 3 — MCP Server (`mcp-server/`)
- MCP server using `@modelcontextprotocol/sdk`
- Registers Person 2's functions as tools
- WebSocket bridge: MCP server ↔ browser game
- Claude Desktop config + system prompt teaching Claude the level vocabulary
- **First deliverable (hour 4)**: MCP server boots, Claude Desktop sees the tool list, can call `describe_level` against fixture

### Person 4 — Demo, Assets, Glue (`demo/`)
- Sprites + sounds (Kenney.nl CC0 pack)
- Split-screen demo page: game | Claude chat | live level JSON
- README polish, install script
- Demo script (the 3-minute story)
- Recorded backup video in case live demo flops
- Floats wherever someone is stuck
- **First deliverable (hour 4)**: demo page shell loads, shows fixture level (even if static image)

## Hour 0 (whole team, 60 minutes)

1. Read [TOOLS.md](TOOLS.md) together. Agree the schema and tool list. Lock it.
2. Agree the **demo script** (see below). Work backwards from it.
3. Decide stack details:
   - Engine: vanilla Canvas vs Phaser?
   - Package manager: npm / pnpm / bun?
   - Repo: monorepo with workspaces, or separate `package.json` per folder?
4. Person 4 commits a richer `fixtures/sample-level.json` if needed.
5. Everyone clones, installs, can run a "hello world" in their folder.

## Day 1

| Time | P1 (Engine) | P2 (World) | P3 (MCP) | P4 (Demo) |
|---|---|---|---|---|
| H0-1 | setup, render empty canvas | setup, schema types | MCP server skeleton | demo page shell |
| H1-4 | render fixture level | `tools.ts` stubs + tests | server registers stub tools | sprite pack integrated |
| H4-6 | physics + player input | enemy logic against P1 API | WebSocket bridge | split-screen layout |
| H6-8 | jumping, collision | level chunks library | Claude Desktop wired up | sounds, polish |

**End-of-day-1 milestone**: Claude Desktop calls `place_tile` → tile appears in browser. *This is the integration moment.* If you don't hit this, drop scope from day 2.

## Day 2

**Morning**
- P1: death/respawn, win condition (touch flag), polish player controls
- P2: `generate_level` — compose chunks into a coherent level
- P3: prompt engineering. Give Claude examples of good levels in the system prompt.
- P4: more sounds, particles, title screen

**Hard freeze at noon.** No new features after this.

**Afternoon**
- Pre-generate and save 2-3 fallback levels in case live `generate_level` flops on stage
- Rehearse the demo twice end-to-end
- Record the backup video
- Write a one-page judging handout

## Demo script (2-3 minutes)

1. **(0:00)** Demo page open. Empty level. Player sprite stands at start.
2. **(0:15)** Type into Claude: *"Design a level themed spooky castle, medium difficulty, 60 tiles long."* → tiles + enemies appear live in the browser.
3. **(0:45)** Operator picks up the keyboard and plays through it. Might die on a Goomba, that's fine.
4. **(1:30)** *"Claude, that was too easy. Add more enemies and a gap near the end."* → Claude calls `spawn_enemy` + `place_tile`. Level updates live; operator hits R to restart.
5. **(2:15)** Operator plays the harder version. Reaches the flag. Wraps up.

If you can land beats 1-3 reliably you have a hackathon-winner. Beats 4-5 are stretch.

## Risk register

| Risk | Mitigation |
|---|---|
| Live generation produces unplayable levels | Pre-generate 3 good levels; "Claude, load the spooky castle one I prepared earlier" |
| WebSocket bridge flaky on demo wifi | Run everything on localhost; tether to phone hotspot as backup |
| Claude makes wrong tool calls | Tight system prompt with examples; restrict tool descriptions to be unambiguous |
| Person blocked waiting on integration | Fixtures + stub functions from hour 0 — nobody should ever be blocked on real data |
| Sprite/IP concerns | Kenney.nl CC0 pack; don't call it "Mario" in the demo title |

## Definition of done

- [ ] Claude Desktop can call all authoring tools and see results live in the browser
- [ ] A human can play a Claude-generated level from start to flag using the keyboard
- [ ] Mid-play edits ("add a gap") show up after a reset without restarting the server
- [ ] Demo runs end-to-end in under 3 minutes without crashing
- [ ] README explains how to run it locally
- [ ] Backup video recorded
