/* ============================================================
   Wordle engine
   ============================================================ */

const KEYBOARD_ROWS = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  ["ENTER", ..."ZXCVBNM".split(""), "BACK"],
];

class WordleGame {
  /**
   * @param {string} answer
   * @param {object} opts { maxGuesses, savedState, onChange }
   */
  constructor(answer, opts = {}) {
    this.answer = answer.toUpperCase();
    this.length = this.answer.length;
    this.maxGuesses = opts.maxGuesses || 6;
    this.onChange = opts.onChange || (() => {});
    this.guesses = [];
    this.current = "";
    this.status = "playing"; // playing | won | lost
    this.letterStates = {}; // letter -> 'correct' | 'present' | 'absent'

    if (opts.savedState) {
      this.guesses = opts.savedState.guesses || [];
      this.status = opts.savedState.status || "playing";
      this.guesses.forEach(g => this._updateLetterStates(g));
    }
  }

  serialize() {
    return { guesses: this.guesses, status: this.status };
  }

  _evaluate(guess) {
    const result = new Array(this.length).fill("absent");
    const answerLetters = this.answer.split("");
    const guessLetters = guess.split("");
    const counts = {};

    answerLetters.forEach(l => (counts[l] = (counts[l] || 0) + 1));

    // First pass: exact matches
    guessLetters.forEach((l, i) => {
      if (answerLetters[i] === l) {
        result[i] = "correct";
        counts[l]--;
      }
    });
    // Second pass: present-but-misplaced
    guessLetters.forEach((l, i) => {
      if (result[i] === "correct") return;
      if (counts[l] > 0) {
        result[i] = "present";
        counts[l]--;
      }
    });
    return result;
  }

  _updateLetterStates(guessObj) {
    const rank = { absent: 0, present: 1, correct: 2 };
    guessObj.word.split("").forEach((l, i) => {
      const state = guessObj.result[i];
      if (!this.letterStates[l] || rank[state] > rank[this.letterStates[l]]) {
        this.letterStates[l] = state;
      }
    });
  }

  typeLetter(letter) {
    if (this.status !== "playing") return;
    if (this.current.length >= this.length) return;
    this.current += letter;
    this.onChange();
  }

  backspace() {
    if (this.status !== "playing") return;
    this.current = this.current.slice(0, -1);
    this.onChange();
  }

  submitGuess() {
    if (this.status !== "playing") return { error: null };
    if (this.current.length !== this.length) {
      return { error: `Word must be ${this.length} letters` };
    }
    const word = this.current.toUpperCase();
    const result = this._evaluate(word);
    const guessObj = { word, result };
    this.guesses.push(guessObj);
    this._updateLetterStates(guessObj);
    this.current = "";

    if (word === this.answer) {
      this.status = "won";
    } else if (this.guesses.length >= this.maxGuesses) {
      this.status = "lost";
    }
    this.onChange();
    return { error: null };
  }
}

function renderWordleBoard(container, game) {
  container.innerHTML = "";
  const board = document.createElement("div");
  board.className = "wordle-board";
  board.style.setProperty("--word-length", game.length);

  for (let r = 0; r < game.maxGuesses; r++) {
    const row = document.createElement("div");
    row.className = "wordle-row";
    const guessObj = game.guesses[r];
    const isCurrentRow = r === game.guesses.length && game.status === "playing";
    const rowLetters = guessObj
      ? guessObj.word.split("")
      : isCurrentRow
      ? game.current.padEnd(game.length, " ").split("")
      : new Array(game.length).fill(" ");

    rowLetters.forEach((letter, i) => {
      const tile = document.createElement("div");
      tile.className = "wordle-tile";
      if (guessObj) {
        tile.classList.add(guessObj.result[i]);
        tile.style.transitionDelay = `${i * 120}ms`;
      } else if (letter.trim()) {
        tile.classList.add("filled");
      }
      tile.textContent = letter.trim();
      row.appendChild(tile);
    });

    if (isCurrentRow) row.classList.add("current-row");
    board.appendChild(row);
  }
  container.appendChild(board);
}

function renderWordleKeyboard(container, game, onKey) {
  container.innerHTML = "";
  const kb = document.createElement("div");
  kb.className = "keyboard";
  KEYBOARD_ROWS.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";
    row.forEach(key => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key";
      if (key === "ENTER" || key === "BACK") btn.classList.add("key-wide");
      const state = game.letterStates[key];
      if (state) btn.classList.add(state);
      btn.textContent = key === "BACK" ? "⌫" : key === "ENTER" ? "ENTER" : key;
      btn.addEventListener("click", () => onKey(key));
      rowEl.appendChild(btn);
    });
    kb.appendChild(rowEl);
  });
  container.appendChild(kb);
}
