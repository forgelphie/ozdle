/* ============================================================
   Squaredle engine
   Words are checked by searching for a valid contiguous,
   non-repeating, 8-directionally-adjacent path through the grid
   that spells the word — no pre-baked coordinates needed.
   ============================================================ */

const GRID_SIZE = 4;

function neighbors(index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        result.push(r * GRID_SIZE + c);
      }
    }
  }
  return result;
}

const NEIGHBOR_CACHE = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => neighbors(i));

/**
 * Finds one valid path spelling `word` in `letters` (16-char string).
 * Returns an array of cell indices, or null if no path exists.
 */
function findPath(letters, word) {
  const target = word.toUpperCase();
  const startCells = [];
  letters.forEach((l, i) => {
    if (l === target[0]) startCells.push(i);
  });

  for (const start of startCells) {
    const visited = new Set([start]);
    const path = [start];
    if (search(1)) return path;

    function search(charIndex) {
      if (charIndex === target.length) return true;
      const last = path[path.length - 1];
      for (const n of NEIGHBOR_CACHE[last]) {
        if (visited.has(n)) continue;
        if (letters[n] !== target[charIndex]) continue;
        visited.add(n);
        path.push(n);
        if (search(charIndex + 1)) return true;
        path.pop();
        visited.delete(n);
      }
      return false;
    }
  }
  return null;
}

class SquaredleGame {
  constructor(puzzle, opts = {}) {
    this.theme = puzzle.theme;
    this.letters = puzzle.letters.toUpperCase().split("");
    this.words = puzzle.words.map(w => w.toUpperCase());
    this.onChange = opts.onChange || (() => {});
    this.found = new Set(opts.savedState?.found || []);
    this.path = []; // currently-dragged path of cell indices
  }

  serialize() {
    return { found: Array.from(this.found) };
  }

  get isComplete() {
    return this.found.size === this.words.length;
  }

  /** Cells that are part of at least one unfound word's solvable path. */
  activeCells() {
    const active = new Set();
    this.words.forEach(w => {
      if (this.found.has(w)) return;
      const path = findPath(this.letters, w);
      if (path) path.forEach(i => active.add(i));
    });
    return active;
  }

  startPath(index) {
    if (!this.activeCells().has(index)) return; // can't start a word on an already-cleared tile
    this.path = [index];
    this.onChange();
  }

  extendPath(index) {
    if (!this.path.length) return;
    const last = this.path[this.path.length - 1];
    if (this.path.includes(index)) {
      // Backtrack if re-entering an earlier cell in the path
      const pos = this.path.indexOf(index);
      this.path = this.path.slice(0, pos + 1);
      this.onChange();
      return;
    }
    if (!NEIGHBOR_CACHE[last].includes(index)) return;
    if (!this.activeCells().has(index)) return; // can't drag across a faded/cleared tile
    this.path.push(index);
    this.onChange();
  }

  endPath() {
    if (this.path.length > 1) {
      const word = this.path.map(i => this.letters[i]).join("");
      this._tryWord(word);
    }
    this.path = [];
    this.onChange();
  }

  /** For the keyboard/typed-word fallback. */
  submitTypedWord(word) {
    this._tryWord(word.toUpperCase());
    this.onChange();
  }

  _tryWord(word) {
    if (this.found.has(word)) return { result: "already-found" };
    if (!this.words.includes(word)) return { result: "not-in-list" };
    if (!findPath(this.letters, word)) return { result: "not-in-grid" };
    this.found.add(word);
    return { result: "found" };
  }
}

/**
 * Builds the grid's DOM ONCE. Call this a single time per puzzle — the
 * cell elements (and the drag listeners attached to them) must stay alive
 * for the whole game, or a mid-drag rebuild would drop the in-progress
 * drag on the floor.
 */
function createSquaredleGrid(game) {
  const grid = document.createElement("div");
  grid.className = "squaredle-grid";
  game.letters.forEach((letter, i) => {
    const cell = document.createElement("div");
    cell.className = "squaredle-cell";
    cell.dataset.index = i;
    cell.textContent = letter;
    grid.appendChild(cell);
  });
  return grid;
}

/** Cheap visual refresh — toggles classes on the existing cells, no rebuild. */
function updateSquaredleGrid(gridEl, game) {
  const active = game.activeCells();
  Array.from(gridEl.children).forEach((cell, i) => {
    cell.classList.toggle("selected", game.path.includes(i));
    cell.classList.toggle("faded", !active.has(i) && !game.path.includes(i));
  });
}

/**
 * Wires up drag-to-connect (mouse + touch). Call this ONCE per grid
 * element — `dragging` needs to persist across every move event of a
 * single drag, so this must not be re-run mid-drag.
 */
function attachSquaredleInput(gridEl, game, onUpdate) {
  let dragging = false;

  const indexFromEvent = e => {
    const point = e.changedTouches ? e.changedTouches[0] : e;
    const el = document.elementFromPoint(point.clientX, point.clientY);
    if (!el || !el.classList.contains("squaredle-cell")) return null;
    return Number(el.dataset.index);
  };

  const start = e => {
    const idx = indexFromEvent(e);
    if (idx === null) return;
    dragging = true;
    game.startPath(idx);
    onUpdate();
    e.preventDefault();
  };
  const move = e => {
    if (!dragging) return;
    const idx = indexFromEvent(e);
    if (idx === null) return;
    game.extendPath(idx);
    onUpdate();
    e.preventDefault();
  };
  const end = e => {
    if (!dragging) return;
    dragging = false;
    game.endPath();
    onUpdate();
    e.preventDefault();
  };

  gridEl.addEventListener("mousedown", start);
  gridEl.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  gridEl.addEventListener("touchstart", start, { passive: false });
  gridEl.addEventListener("touchmove", move, { passive: false });
  gridEl.addEventListener("touchend", end, { passive: false });
  gridEl.addEventListener("touchcancel", end, { passive: false });
}
