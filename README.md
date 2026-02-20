# SpudBuds

Cozy, humorous match-3 prototype for **Spud Buds**.

## Run locally

Because this prototype is plain HTML/CSS/JS, you can run it with any static server.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Prototype scope implemented

- 8×8 match-3 board with swap, clear, gravity refill, and cascading matches
- Three sequential levels with goals:
  - Level 1: make 6 matches
  - Level 2: collect 10 Whole Potatoes + 8 Butter Pats
  - Level 3: use 2 Butter Blasts + clear 12 tiles
- One power-up: **Butter Blast** (spawned by 4-match, clears a gentle 3×3 area)
- Light narrative overlay text between levels featuring Root Rivals flavor dialogue
- Warm, soft, cozy visual style aimed at readability on mobile-size layouts
