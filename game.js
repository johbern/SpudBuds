const SIZE = 8;
const DELAY = 180;

const TILE_INFO = {
  potato: { emoji: "🟤", name: "Whole Potato" },
  slice: { emoji: "🥔", name: "Potato Slice" },
  butter: { emoji: "🧈", name: "Butter Pat" },
  herb: { emoji: "🌿", name: "Herb Sprig" },
  salt: { emoji: "🧂", name: "Salt Crystal" }
};

const LEVELS = [
  {
    name: "Level 1 — Learn Matching",
    moves: 20,
    tiles: ["potato", "butter", "herb"],
    goals: [{ id: "matches", label: "Make 6 matches", target: 6 }],
    intro:
      "Carra T. Gold cackles: 'The Grand Masher shall compress this valley into very efficient cubes!' The Spud Buds politely disagree."
  },
  {
    name: "Level 2 — Collection Time",
    moves: 22,
    tiles: ["potato", "butter", "herb", "salt"],
    goals: [
      { id: "potato", label: 'Collect 10 <img src="TileAssets/potato.png" alt="Potato" style="height:2.5em;vertical-align:middle;"> ', target: 10 },
        { id: "butter", label: 'Collect 8 <img src="TileAssets/butter.png" alt="Butter" style="height:2.5em;vertical-align:middle;">', target: 8 }
    ],
    intro:
      "Rad-ish Green waves the Sacred Implements around wildly. 'I improved the weather by making everything... denser?'"
  },
  {
    name: "Level 3 — Butter Blast Discovery",
    moves: 30,
    tiles: ["potato", "butter", "herb", "salt"],
    goals: [
      { id: "blasts", label: 'Use 2 <img src="TileAssets/supernova.png" alt="Supernova" style="height:2.5em;vertical-align:middle;">', target: 2 },
      { id: "clear", label: "Clear 12 tiles", target: 12 }
    ],
    intro:
      "Beatrice Oniona dramatically points at the sky: 'The mashed horizon is emotionally overwhelming!' Time for gentle butter-powered restoration."
  },
  {
    name: "Level 4 — The Grand Challenge",
    moves: 18,
    tiles: ["potato", "butter", "herb", "salt"],
    goals: [
      { id: "potato", label: 'Collect 8 <img src="TileAssets/potato.png" alt="Potato" style="height:1.2em;vertical-align:middle;"> ', target: 8 },
        { id: "butter", label: 'Collect 12 <img src="TileAssets/butter.png" alt="Butter" style="height:1.2em;vertical-align:middle;">', target: 12 }
    ],
    intro:
      "All three Spud Buds gather solemnly. 'This is it. The final push to restore our home. We believe in you, friend.'"
  },
  {
    name: "Level 5 — Breaking Through",
    moves: 20,
    tiles: ["potato", "butter", "herb", "salt"],
    goals: [
      { id: "clear", label: "Clear 20 tiles", target: 20 },
      { id: "potato", label: 'Collect 6 <img src="TileAssets/potato.png" alt="Potato" style="height:1.2em;vertical-align:middle;"> Pairs', target: 6 },
      { id: "pressed", label: "Clear Mashed Tiles", target: 12 }
    ],
    intro:
      "Deep beneath the surface, layers of compressed earth stand stubborn. The mash is thick, dense, and tightly packed. You sense something pressing back."
  }
];

const state = {
  levelIndex: 0,
  board: [],
  selected: null,
  animating: false,
  stats: {}
};

const el = {
  board: document.getElementById("board"),
  goals: document.getElementById("goals"),
  levelHeader: document.getElementById("level-header"),
  movesLeft: document.getElementById("moves-left"),
  message: document.getElementById("message"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayText: document.getElementById("overlay-text"),
  overlayButton: document.getElementById("overlay-button")
};

el.overlayButton.addEventListener("click", () => {
  el.overlay.classList.add("hidden");
  if (state.levelIndex < LEVELS.length) startLevel(state.levelIndex);
  else startLevel(0);
});

function showOverlay(title, text, buttonText = "Continue") {
  el.overlayTitle.textContent = title;
  el.overlayText.innerHTML = text;
  el.overlayButton.textContent = buttonText;
  el.overlay.classList.remove("hidden");
}

function startLevel(index) {
  const level = LEVELS[index];
  state.levelIndex = index;
  state.selected = null;
  state.stats = {
    moves: level.moves,
    matches: 0,
    potato: 0,
    butter: 0,
    blasts: 0,
    clear: 0,
    pressed: 0
  };
  state.board = createBoard(level.tiles);
  if (index === 2) {
    seedEarlyButterBlastOpportunity();
    resolveInitial(state.board, level.tiles); // Clean up any matches created by seeding
  }
  if (index === 3) {
    // Seed awkward tiles (may introduce new matches) then resolve to ensure no starting matches
    seedAwkwardTiles();
    resolveInitial(state.board, level.tiles);
  }
  if (index === 4) {
    // Ensure the initial board has no matches, then mark some tiles as pressed
    resolveInitial(state.board, level.tiles);
    seedPressedTiles();
  }
  draw();
  
  // Set level-specific instructions
  const instructions = [
    "Swap adjacent tiles to create matches of three or more.",
    "Match potatoes and butter to rebuild the valley.",
    "Create matches of 4+ tiles to unlock the Butter Blast power-up.",
    "Careful planning needed—you have limited moves!",
    "Some tiles are compressed. Loosen them with a match, then clear normally."
  ];
  setMessage(instructions[index]);
}

function createBoard(tilePool) {
  const board = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ type: pick(tilePool), power: null }))
  );
  resolveInitial(board, tilePool);
  return board;
}

function resolveInitial(board, tilePool) {
  let loops = 0;
  while (true && loops < 20) {
    const { clearSet } = findMatches(board);
    if (!clearSet.size) break;
    clearSet.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      board[r][c] = { type: pick(tilePool), power: null };
    });
    loops += 1;
  }
}

function seedEarlyButterBlastOpportunity() {
  const row = 2;
  state.board[row][1] = { type: "butter", power: null };
  state.board[row][2] = { type: "butter", power: null };
  state.board[row][3] = { type: "potato", power: null };
  state.board[row][4] = { type: "butter", power: null };
  state.board[row][5] = { type: "butter", power: null };
}

function seedAwkwardTiles() {
  // Place some salt and herb tiles in scattered positions to make the puzzle trickier
  const awkwardPositions = [
    [0, 3], [0, 4], [1, 1], [1, 6],
    [2, 2], [2, 5], [3, 0], [3, 7],
    [5, 2], [5, 5], [6, 1], [6, 6],
    [7, 3], [7, 4]
  ];
  
  const awkwardTypes = ["salt", "herb"];
  awkwardPositions.forEach((pos) => {
    const [r, c] = pos;
    state.board[r][c] = { type: awkwardTypes[Math.floor(Math.random() * awkwardTypes.length)], power: null };
  });
}

function seedPressedTiles() {
  // Seed about 12-16 random tiles as "pressed" tiles
  const pressedCount = 12 + Math.floor(Math.random() * 5);
  const pressedPositions = new Set();
  
  while (pressedPositions.size < pressedCount) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    const key = `${r},${c}`;
    
    if (!pressedPositions.has(key)) {
      pressedPositions.add(key);
      state.board[r][c].pressed = true;
    }
  }
}

function draw() {
  const level = LEVELS[state.levelIndex];
  el.levelHeader.textContent = level.name;
  el.movesLeft.textContent = state.stats.moves;

  el.goals.innerHTML = "";
  level.goals.forEach((goal) => {
    const value = state.stats[goal.id];
    const row = document.createElement("div");
    row.className = `goal ${value >= goal.target ? "done" : ""}`;

    const label = document.createElement("div");
    label.className = "goal-label";
    label.innerHTML = goal.label;

    const count = document.createElement("div");
    count.className = "goal-target";
    count.textContent = `${Math.min(value, goal.target)}/${goal.target}`;

    row.appendChild(label);
    row.appendChild(count);
    el.goals.appendChild(row);
  });

  el.board.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const tile = state.board[r][c];
      const btn = document.createElement("button");
      btn.className = `tile ${tile.power ? "power" : ""} ${tile.pressed ? "pressed" : ""}`;
      if (state.selected && state.selected.r === r && state.selected.c === c) {
        btn.classList.add("selected");
      }
      if (tile.power === "butterBlast") {
        const img = document.createElement("img");
        img.src = "TileAssets/supernova.png";
        img.alt = "Supernova";
        btn.appendChild(img);
      } else {
        const img = document.createElement("img");
        img.src = `TileAssets/${tile.type}.png`;
        img.alt = TILE_INFO[tile.type].name;
        btn.appendChild(img);
      }
      btn.setAttribute("aria-label", tile.power ? "Butter Blast" : TILE_INFO[tile.type].name);
      btn.onclick = () => onTileClick(r, c);
      el.board.appendChild(btn);
    }
  }
}

function onTileClick(r, c) {
  if (state.animating || state.stats.moves <= 0) return;
  const tile = (state.board[r] && state.board[r][c]) || null;
  if (!tile) {
    // Defensive: if tile is missing, clear selection and re-draw so UI stays interactive
    state.selected = null;
    draw();
    return;
  }

  if (tile.power === "butterBlast") {
    useButterBlast(r, c);
    return;
  }

  if (!state.selected) {
    state.selected = { r, c };
    draw();
    return;
  }

  const sel = state.selected;
  if (sel.r === r && sel.c === c) {
    state.selected = null;
    draw();
    return;
  }

  if (!isAdjacent(sel, { r, c })) {
    state.selected = { r, c };
    draw();
    return;
  }

  swap(sel, { r, c });
  state.selected = null;
  handleMove(sel, { r, c });
}

async function handleMove(a, b) {
  state.animating = true;
  const before = findMatches(state.board);
  if (!before.clearSet.size) {
    swap(a, b);
    setMessage("Those spuds just traded places. Try another swap!");
    state.animating = false;
    draw();
    return;
  }

  state.stats.moves -= 1;
  await resolveCascades(before.groups, before.clearSet, before.powerSpawns);

  if (checkWin()) {
    finishLevel();
    return;
  }

  if (state.stats.moves <= 0) {
    setMessage("Out of moves, but no stress — refreshing level.");
    setTimeout(() => startLevel(state.levelIndex), 700);
    return;
  }

  setMessage("Nice work! Keep restoring the valley.");
  state.animating = false;
  draw();
}

async function resolveCascades(groups, clearSet, powerSpawns) {
  let currentGroups = groups;
  let currentClear = clearSet;
  let currentPowers = powerSpawns;

  while (currentClear.size) {
    state.stats.matches += currentGroups.length;
    await animateClear(currentClear);

    const cleared = Array.from(currentClear).map((k) => k.split(",").map(Number));
    for (const [r, c] of cleared) {
      const tile = state.board[r][c];
      
      // If tile is pressed, loosen it instead of clearing
      if (tile && tile.pressed) {
        tile.pressed = false;
        state.stats.pressed = (state.stats.pressed || 0) + 1;
      } else {
        // Normal clear
        state.stats.clear += 1;
        if (tile.type === "potato") state.stats.potato += 1;
        if (tile.type === "butter") state.stats.butter += 1;
        state.board[r][c] = null;
      }
    }

    // Only spawn Butter Blast power tiles in level 3 or later
    if (state.levelIndex >= 2) {
      currentPowers.forEach((coord) => {
        const [r, c] = coord;
        state.board[r][c] = { type: "butter", power: "butterBlast" };
      });
    }

    collapseBoard();
    draw();
    await delay(DELAY);

    const next = findMatches(state.board);
    currentGroups = next.groups;
    currentClear = next.clearSet;
    currentPowers = next.powerSpawns;
  }
}

function collapseBoard() {
  const pool = LEVELS[state.levelIndex].tiles;
  for (let c = 0; c < SIZE; c++) {
    const col = [];
    for (let r = SIZE - 1; r >= 0; r--) {
      if (state.board[r][c]) col.push(state.board[r][c]);
    }
    while (col.length < SIZE) col.push({ type: pick(pool), power: null });
    for (let r = SIZE - 1; r >= 0; r--) {
      state.board[r][c] = col[SIZE - 1 - r];
    }
  }
}

function findMatches(board) {
  const groups = [];
  const clearSet = new Set();
  const powerSpawns = [];
  const groupOrientations = [];

  for (let r = 0; r < SIZE; r++) {
    let start = 0;
    for (let c = 1; c <= SIZE; c++) {
      const same = c < SIZE && sameType(board[r][c], board[r][start]);
      if (!same) {
        const len = c - start;
        if (len >= 3) {
          const group = [];
          for (let x = start; x < c; x++) {
            group.push([r, x]);
            clearSet.add(`${r},${x}`);
          }
          groups.push(group);
          groupOrientations.push("h");
          if (len >= 4) powerSpawns.push([r, start + Math.floor(len / 2)]);
        }
        start = c;
      }
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let start = 0;
    for (let r = 1; r <= SIZE; r++) {
      const same = r < SIZE && sameType(board[r][c], board[start][c]);
      if (!same) {
        const len = r - start;
        if (len >= 3) {
          const group = [];
          for (let y = start; y < r; y++) {
            group.push([y, c]);
            clearSet.add(`${y},${c}`);
          }
          groups.push(group);
          groupOrientations.push("v");
          if (len >= 4) powerSpawns.push([start + Math.floor(len / 2), c]);
        }
        start = r;
      }
    }
  }

  const uniqPower = [];
  const seen = new Set();
  // Detect T / L intersections: if a coord is part of both a horizontal and vertical group
  // and the union of those groups is more than 4 tiles, spawn a power at the intersection.
  const coordToGroups = new Map();
  groups.forEach((grp, gi) => {
    grp.forEach(([rr, cc]) => {
      const k = `${rr},${cc}`;
      if (!coordToGroups.has(k)) coordToGroups.set(k, []);
      coordToGroups.get(k).push(gi);
    });
  });

  const intersectionSpawns = [];
  for (const [coord, groupIdxs] of coordToGroups.entries()) {
    // need at least one horizontal and one vertical group at this coord
    const hasH = groupIdxs.some((i) => groupOrientations[i] === "h");
    const hasV = groupIdxs.some((i) => groupOrientations[i] === "v");
    if (!hasH || !hasV) continue;

    // find all unique tiles in the union of the first h and first v groups that intersect here
    const hIndex = groupIdxs.find((i) => groupOrientations[i] === "h");
    const vIndex = groupIdxs.find((i) => groupOrientations[i] === "v");
    const union = new Set();
    groups[hIndex].forEach(([rr, cc]) => union.add(`${rr},${cc}`));
    groups[vIndex].forEach(([rr, cc]) => union.add(`${rr},${cc}`));

    if (union.size > 4) {
      const [r, c] = coord.split(",").map(Number);
      intersectionSpawns.push([r, c]);
    }
  }

  // Combine straight-line power spawns and intersection spawns
  const combinedSpawns = powerSpawns.concat(intersectionSpawns);
  for (const [r, c] of combinedSpawns) {
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    clearSet.delete(key);
    uniqPower.push([r, c]);
  }

  return { groups, clearSet, powerSpawns: uniqPower };
}

async function animateClear(clearSet) {
  const buttons = el.board.querySelectorAll(".tile");
  clearSet.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    const index = r * SIZE + c;
    buttons[index]?.classList.add("clearing");
  });
  await delay(DELAY);
}

async function useButterBlast(r, c) {
  state.animating = true;
  state.stats.moves -= 1;
  state.stats.blasts += 1;

  const clearSet = new Set();
  for (let rr = r - 1; rr <= r + 1; rr++) {
    for (let cc = c - 1; cc <= c + 1; cc++) {
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) clearSet.add(`${rr},${cc}`);
    }
  }

  await animateClear(clearSet);
  clearSet.forEach((key) => {
    const [rr, cc] = key.split(",").map(Number);
    const tile = state.board[rr][cc];
    if (!tile) return;
    
    // If tile is pressed, loosen it instead of clearing
    if (tile.pressed) {
      tile.pressed = false;
      state.stats.pressed = (state.stats.pressed || 0) + 1;
    } else {
      // Normal clear
      state.stats.clear += 1;
      if (tile.type === "potato") state.stats.potato += 1;
      if (tile.type === "butter") state.stats.butter += 1;
      state.board[rr][cc] = null;
    }
  });

  collapseBoard();
  draw();
  await delay(DELAY);

  const next = findMatches(state.board);
  await resolveCascades(next.groups, next.clearSet, next.powerSpawns);

  if (checkWin()) {
    finishLevel();
    return;
  }

  // Allow further input after the blast finishes
  state.animating = false;
  state.selected = null;
  draw();

  // If the blast used the last move, refresh the level like a normal move would
  if (state.stats.moves <= 0) {
    setMessage("Out of moves, but no stress — refreshing level.");
    setTimeout(() => startLevel(state.levelIndex), 700);
    return;
  }
}

function checkWin() {
  const level = LEVELS[state.levelIndex];
  return level.goals.every((goal) => state.stats[goal.id] >= goal.target);
}

function finishLevel() {
  state.animating = false;
  const justFinished = state.levelIndex;
  state.levelIndex += 1;

  if (state.levelIndex >= LEVELS.length) {
    showOverlay(
      "World 1 Restored!",
      "Rutabog Thorne admits this was 'adequate effort.' Clarissa Parsnippe files a formal complaint titled: Excessive Cozy Competence.",
      "Play Again"
    );
    state.board = [];
    state.levelIndex = 0;
    return;
  }

  const intros = [
    "Carra T. Gold mutters, 'Fine. This zone is less mashed than before.'",
    "Rad-ish Green trips over a Butter Blast and accidentally applauds your technique.",
    "Beatrice Oniona wipes away a tear. 'The valley is nearly whole again. One last push, friend.'",
    "The awkward tiles shatter. The Spud Buds nod in approval.",
    "The pressed tiles release with a satisfying pop. The deepest layer of the mash begins to shift..."
  ];

  showOverlay(`Level ${justFinished + 1} Complete!`, intros[justFinished], "Next Level");
  state.board = [];
}

function setMessage(text) {
  el.message.textContent = text;
}

function sameType(a, b) {
  return a && b && a.type === b.type && !a.power && !b.power;
}

function isAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

function swap(a, b) {
  const temp = state.board[a.r][a.c];
  state.board[a.r][a.c] = state.board[b.r][b.c];
  state.board[b.r][b.c] = temp;
  draw();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Preload the first level in the background while overlay is open
startLevel(0);
showOverlay(
  "Ah! A new arrival. Splendid!",
  `<p>A round figure in a tidy waistcoat, tall top hat, and carefully knotted ascot approaches with surprising urgency, pausing to catch his breath before addressing you with great formality.</p>
  
  <p>“I’m Mayor Taterwell. Under normal circumstances, I would be welcoming you somewhere a good deal less… compressed. You’ll notice that being upright currently makes you one of the more structurally sound features in view.”</p>

<p>He gestures to the horizon, which is suspiciously flat.</p>

<p>“We’ve had a bit of trouble, you see. Someone has been rather overenthusiastic with the Grand Masher. It’s an old tending tool, meant for gentle shaping and keeping the land in order. A light touch, now and then.”</p>

<p>“This was not a light touch.”</p>

<p>“The Fryfields, and a few other places, have been pressed so tightly that everything’s lost its structure. Nothing’s gone, mind you. It’s all just… flat.”</p>

<p>“But if we gather what belongs together and help the right pieces reconnect, the land will start to remember its shape. Bit by bit, we can set things right again.”</p>

<p>He gives you an encouraging nod.</p>

<p>“You seem like just the sort of help we need. Shall we begin?”</p>`,
  "Let's go!"
);
