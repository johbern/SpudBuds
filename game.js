const SIZE = 8;
const DELAY = 180;

const TILE_INFO = {
  potato: { emoji: "🟤", name: "Whole Potato" },
  slice: { emoji: "🥔", name: "Potato Slice" },
  butter: { emoji: "🧈", name: "Butter Pat" },
  herb: { emoji: "🌿", name: "Herb Sprig" }
};

const LEVELS = [
  {
    name: "Level 1 — Learn Matching",
    moves: 30,
    tiles: ["potato", "butter", "herb"],
    goals: [{ id: "matches", label: "Make 6 matches", target: 6 }],
    intro:
      "Carra T. Gold cackles: 'The Grand Masher shall compress this valley into very efficient cubes!' The Spud Buds politely disagree."
  },
  {
    name: "Level 2 — Collection Time",
    moves: 28,
    tiles: ["potato", "butter", "herb", "slice"],
    goals: [
      { id: "potato", label: "Collect 10 Whole Potatoes", target: 10 },
      { id: "butter", label: "Collect 8 Butter Pats", target: 8 }
    ],
    intro:
      "Rad-ish Green waves the Sacred Implements around wildly. 'I improved the weather by making everything... denser?'"
  },
  {
    name: "Level 3 — Butter Blast Discovery",
    moves: 30,
    tiles: ["potato", "butter", "herb", "slice"],
    goals: [
      { id: "blasts", label: "Use 2 Butter Blasts", target: 2 },
      { id: "clear", label: "Clear 12 tiles", target: 12 }
    ],
    intro:
      "Beatrice Oniona dramatically points at the sky: 'The mashed horizon is emotionally overwhelming!' Time for gentle butter-powered restoration."
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
  levelName: document.getElementById("level-name"),
  movesLeft: document.getElementById("moves-left"),
  message: document.getElementById("message"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayText: document.getElementById("overlay-text"),
  overlayButton: document.getElementById("overlay-button")
};

el.overlayButton.addEventListener("click", () => {
  el.overlay.classList.add("hidden");
  if (!state.board.length) startLevel(0);
  else if (state.levelIndex < LEVELS.length) startLevel(state.levelIndex);
});

function showOverlay(title, text, buttonText = "Continue") {
  el.overlayTitle.textContent = title;
  el.overlayText.textContent = text;
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
    clear: 0
  };
  state.board = createBoard(level.tiles);
  if (index === 2) seedEarlyButterBlastOpportunity();
  draw();
  setMessage("Swap adjacent tiles to make cozy matches.");
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

function draw() {
  const level = LEVELS[state.levelIndex];
  el.levelName.textContent = level.name;
  el.movesLeft.textContent = state.stats.moves;

  el.goals.innerHTML = "";
  level.goals.forEach((goal) => {
    const value = state.stats[goal.id];
    const row = document.createElement("div");
    row.className = `goal ${value >= goal.target ? "done" : ""}`;
    row.textContent = `${goal.label}: ${Math.min(value, goal.target)}/${goal.target}`;
    el.goals.appendChild(row);
  });

  el.board.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const tile = state.board[r][c];
      const btn = document.createElement("button");
      btn.className = `tile ${tile.power ? "power" : ""}`;
      if (state.selected && state.selected.r === r && state.selected.c === c) {
        btn.classList.add("selected");
      }
      btn.textContent = tile.power ? "✨" : TILE_INFO[tile.type].emoji;
      btn.setAttribute("aria-label", tile.power ? "Butter Blast" : TILE_INFO[tile.type].name);
      btn.onclick = () => onTileClick(r, c);
      el.board.appendChild(btn);
    }
  }
}

function onTileClick(r, c) {
  if (state.animating || state.stats.moves <= 0) return;
  const tile = state.board[r][c];

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

  setMessage("Nice and cozy. Keep restoring the valley.");
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
      state.stats.clear += 1;
      if (tile.type === "potato") state.stats.potato += 1;
      if (tile.type === "butter") state.stats.butter += 1;
      state.board[r][c] = null;
    }

    currentPowers.forEach((coord) => {
      const [r, c] = coord;
      state.board[r][c] = { type: "butter", power: "butterBlast" };
    });

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
          if (len >= 4) powerSpawns.push([start + Math.floor(len / 2), c]);
        }
        start = r;
      }
    }
  }

  const uniqPower = [];
  const seen = new Set();
  for (const [r, c] of powerSpawns) {
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
    state.stats.clear += 1;
    if (tile.type === "potato") state.stats.potato += 1;
    if (tile.type === "butter") state.stats.butter += 1;
    state.board[rr][cc] = null;
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

  state.animating = false;
  setMessage("Butter Blast melted through the mash!");
  draw();
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
    LEVELS[state.levelIndex].intro
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

showOverlay(
  "Welcome, Spud Bud!",
  "The Grand Masher has compressed the valley into a very dramatic potato collage. Make gentle matches, collect ingredients, and discover the Butter Blast.",
  "Start Level 1"
);
