# SpudBuds

A cozy browser match-3 prototype set in a world of potatoes, restoration, and very dramatic root vegetables.

## Quick start

This project is plain HTML/CSS/JS, so any static server works.

```bash
python3 -m http.server 4173
```

Then open:

- Story / intro page: `http://localhost:4173/index.html`
- Game page: `http://localhost:4173/game.html`

## Current gameplay

- 8×8 match-3 board
- Swap adjacent tiles to make matches of 3+
- Matches clear tiles, refill with gravity, and can chain into cascades
- Goal tracking per level (moves, collection, clears, and power usage)
- Narrative overlays at the start and between levels

## Implemented levels

The prototype currently includes 5 sequential levels:

1. **Level 1 — Learn Matching**
  - Goal: make 6 matches
2. **Level 2 — Collection Time**
  - Goal: collect 10 potato + 8 butter
3. **Level 3 — Butter Blast Discovery**
  - Goals: use 2 Butter Blasts + clear 12 tiles
4. **Level 4 — The Grand Challenge**
  - Goal: collect 8 potato + 12 butter in tighter move limits
5. **Level 5 — Breaking Through**
  - Goals: clear 20 tiles, collect potato, and clear pressed tiles

## Special mechanics

- **Butter Blast power-up**
  - Created from line matches of 4+ and T/L-style intersections
  - Clears a 3×3 area when activated
  - Costs 1 move to use
- **Pressed tiles (Level 5)**
  - First clear loosens the tile
  - A later clear removes it normally

## Controls

- Click a tile to select it
- Click an adjacent tile to swap
- Click a selected special tile to trigger its effect
- Complete all goals before moves run out

## Project structure

- `index.html` — story landing page
- `game.html` — game shell and UI layout
- `game.js` — game state, matching logic, level flow, power-ups
- `styles.css` — visual styling and layout
- `TileAssets/` — tile and UI image assets

## Notes

- Progress is session-only (no save system yet)
- Designed as an MVP prototype for gameplay feel and level tuning
