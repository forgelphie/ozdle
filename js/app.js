/* ============================================================
   App controller
   ============================================================ */

const STORAGE_PREFIX = "ozdle:";

function resolveDevMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("dev") === "1") localStorage.setItem(STORAGE_PREFIX + "devmode", "1");
  if (params.get("dev") === "0") localStorage.removeItem(STORAGE_PREFIX + "devmode");
  return localStorage.getItem(STORAGE_PREFIX + "devmode") === "1";
}
const DEV_MODE = resolveDevMode();

function loadState(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveState(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

let selectedDate = today();
let currentGame = null;
let activeGameType = null;
let timerInterval = null;

function isCompleted(key, entry) {
  const state = loadState(key);
  if (!state) return false;
  if (entry.type === "wordle") return state.status === "won" || state.status === "lost";
  return (state.found || []).length === entry.puzzle.words.length;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function renderPuzzle(date) {
  stopTimer();
  const root = document.getElementById("game-root");
  const meta = document.getElementById("puzzle-meta");
  root.innerHTML = "";
  meta.innerHTML = "";

  const entry = getPuzzleForDate(date, { ignoreRange: DEV_MODE });
  const key = dateKey(date);
  const isToday = daysBetween(date, today()) === 0;

  if (!entry) {
    const beforeStart = stripTime(date) < stripTime(CONFIG.START_DATE);
    meta.innerHTML = `<p class="theme-label">${
      beforeStart
        ? `The first daily puzzle drops ${CONFIG.START_DATE.toLocaleDateString(undefined, { month: "long", day: "numeric" })}.`
        : `The daily run wrapped on ${CONFIG.END_DATE.toLocaleDateString(undefined, { month: "long", day: "numeric" })} — pick any date from the calendar to keep playing.`
    }</p>`;
    return;
  }

  meta.innerHTML = `
    <div class="day-label">${isToday ? "Today" : date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · Day ${entry.dayNumber}</div>
    ${!isToday ? `<p class="archive-note">Playing an earlier puzzle</p>` : ""}
    ${!entry.inRange ? `<p class="archive-note">Dev preview — outside the normal daily run</p>` : ""}
  `;

  activeGameType = entry.type;
  if (entry.type === "wordle") {
    renderWordlePuzzle(root, entry, key);
  } else {
    renderSquaredlePuzzle(root, entry, key);
  }
}

/* ---- WORDLE ---- */

function renderWordlePuzzle(root, entry, key) {
  const saved = loadState(key);
  const boardEl = document.createElement("div");
  const bannerEl = document.createElement("div");
  const shareBtnHolder = document.createElement("div");
  shareBtnHolder.style.textAlign = "center";
  const kbEl = document.createElement("div");

  root.append(boardEl, bannerEl, shareBtnHolder, kbEl);

  const game = new WordleGame(entry.puzzle, {
    savedState: saved,
    onChange: () => {
      renderWordleBoard(boardEl, game);
      renderWordleKeyboard(kbEl, game, onKey);
      renderBanner();
      saveState(key, game.serialize());
    },
  });
  currentGame = game;

  function renderBanner() {
    bannerEl.innerHTML = "";
    shareBtnHolder.innerHTML = "";
    
    if (game.status === "won" || game.status === "lost") {
      bannerEl.className = `status-banner ${game.status}`;
      bannerEl.textContent = game.status === "won"
        ? `Solved in ${game.guesses.length}/${game.maxGuesses}!`
        : `The word was ${game.answer}.`;

      const shareBtn = document.createElement("button");
      shareBtn.className = "share-btn";
      shareBtn.type = "button";
      shareBtn.textContent = "Share Results 🧹🫧";
      shareBtn.addEventListener("click", () => shareWordleResults(entry, game));
      shareBtnHolder.appendChild(shareBtn);
    } else {
      bannerEl.className = "";
    }
  }

  function onKey(key) {
    if (game.status !== "playing") return;
    if (key === "ENTER") {
      const { error } = game.submitGuess();
      if (error) flashMessage(error);
    } else if (key === "BACK") {
      game.backspace();
    } else {
      game.typeLetter(key);
    }
  }

  currentGame.handleInput = onKey;

  renderWordleBoard(boardEl, game);
  renderWordleKeyboard(kbEl, game, onKey);
  renderBanner();
}

function shareWordleResults(entry, game) {
  const formattedDate = selectedDate.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" });

  const emojiMap = {
    correct: "💚",
    present: "🩷",
    absent: "🖤"
  };

  const gridText = game.guesses.map(guess => {
    const colors = game.evaluateGuess(guess);
    return colors.map(c => emojiMap[c] || "🖤").join("");
  }).join("\n");

  const scoreText = game.status === "won" ? `${game.guesses.length}/${game.maxGuesses}` : "X/6";
  const shareText = `Ozdle 🧹🫧\n\n${formattedDate}\n#${scoreText}\n${gridText}\n\n${window.location.href.split('?')[0]}`;

  copyToClipboard(shareText);
}


function renderSquaredlePuzzle(root, entry, key) {
  const saved = loadState(key);
  const wrap = document.createElement("div");
  wrap.className = "squaredle-wrap";

  const timerEl = document.createElement("div");
  timerEl.className = "squaredle-timer";

  const themeEl = document.createElement("p");
  themeEl.className = "theme-label";
  themeEl.textContent = `Theme: ${entry.puzzle.theme}`;

  const currentWordEl = document.createElement("div");
  currentWordEl.className = "squaredle-current-word";

  const gridHolder = document.createElement("div");

  const progressEl = document.createElement("div");
  progressEl.className = "word-progress";

  const bannerEl = document.createElement("div");
  const shareBtnHolder = document.createElement("div");
  shareBtnHolder.style.textAlign = "center";

  const typeRow = document.createElement("div");
  typeRow.className = "squaredle-type-row";
  typeRow.innerHTML = `<input type="text" id="squaredle-input" placeholder="...or type a word" autocomplete="off" autocapitalize="characters" /><button type="button">Enter</button>`;

  wrap.append(timerEl, themeEl, currentWordEl, gridHolder, typeRow, progressEl, bannerEl, shareBtnHolder);
  root.append(wrap);

  let elapsedSeconds = saved?.elapsedTime || 0;

  const game = new SquaredleGame(entry.puzzle, { savedState: saved, onChange: rerender });
  currentGame = game;

  if (!game.isComplete) {
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      timerEl.textContent = `⏳ ${formatTime(elapsedSeconds)}`;
      saveState(key, { ...game.serialize(), elapsedTime: elapsedSeconds });
    }, 1000);
  }
  timerEl.textContent = `⏳ ${formatTime(elapsedSeconds)}`;

  const gridEl = createSquaredleGrid(game);
  gridHolder.appendChild(gridEl);
  attachSquaredleInput(gridEl, game, rerender);

  const input = typeRow.querySelector("input");
  const enterBtn = typeRow.querySelector("button");

  const submitTyped = () => {
    if (!input.value.trim()) return;
    game.submitTypedWord(input.value.trim());
    input.value = "";
    rerender();
  };

  enterBtn.addEventListener("click", submitTyped);

  function rerender() {
    updateSquaredleGrid(gridEl, game);
    currentWordEl.textContent = game.path.map(i => game.letters[i]).join("");

    progressEl.innerHTML = "";
    game.words.forEach(w => {
      const chip = document.createElement("span");
      const found = game.found.has(w);
      chip.className = "word-chip" + (found ? " found" : " hidden-word");
      chip.textContent = found ? w : "•".repeat(w.length);
      progressEl.appendChild(chip);
    });

    bannerEl.innerHTML = "";
    shareBtnHolder.innerHTML = "";

    if (game.isComplete) {
      stopTimer();
      bannerEl.className = "status-banner won";
      bannerEl.textContent = `Found all ${game.words.length} words!`;

      const shareBtn = document.createElement("button");
      shareBtn.className = "share-btn";
      shareBtn.type = "button";
      shareBtn.textContent = "Share Results 🧹🫧";
      shareBtn.addEventListener("click", () => shareSquaredleResults(entry, elapsedSeconds));
      shareBtnHolder.appendChild(shareBtn);
    } else {
      bannerEl.className = "";
    }

    saveState(key, { ...game.serialize(), elapsedTime: elapsedSeconds });
  }

  rerender();
}

function shareSquaredleResults(entry, seconds) {
  const formattedDate = selectedDate.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" });
  const timeFormatted = formatTime(seconds);
  const shareText = `Ozdle 🧹🫧\n\n${formattedDate}\n${entry.puzzle.theme}\n⏳${timeFormatted}\n\n${window.location.href.split('?')[0]}`;

  copyToClipboard(shareText);
}

/* ---- KEYBOARD & UTILITIES ---- */

document.addEventListener("keydown", e => {
  const modalOpen = Array.from(document.querySelectorAll(".modal-backdrop")).some(m => m.classList.contains("open"));
  if (modalOpen) return;

  if (activeGameType === "wordle" && currentGame && currentGame.handleInput) {
    if (e.key === "Enter") currentGame.handleInput("ENTER");
    else if (e.key === "Backspace") currentGame.handleInput("BACK");
    else if (/^[a-zA-Z]$/.test(e.key)) currentGame.handleInput(e.key.toUpperCase());
  } else if (activeGameType === "squaredle") {
    const input = document.getElementById("squaredle-input");
    if (input && document.activeElement !== input) {
      if (/^[a-zA-Z]$/.test(e.key)) {
        input.focus();
      }
    }
  }
});

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => flashMessage("Copied results to clipboard!"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    flashMessage("Copied results to clipboard!");
  } catch (err) {
    flashMessage("Failed to copy results");
  }
  document.body.removeChild(textArea);
}

function flashMessage(msg) {
  const meta = document.getElementById("puzzle-meta");
  const note = document.createElement("p");
  note.className = "archive-note";
  note.textContent = msg;
  meta.appendChild(note);
  setTimeout(() => note.remove(), 2000);
}

/* ---- Calendar ---- */

function buildCalendarHTML() {
  const months = [
    { year: 2026, month: 8, label: "September 2026" },
    { year: 2026, month: 9, label: "October 2026" },
    { year: 2026, month: 10, label: "November 2026" },
  ];
  const dow = ["S", "M", "T", "W", "T", "F", "S"];
  let html = "";

  months.forEach(({ year, month, label }) => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    html += `<div class="calendar-month"><h3>${label}</h3><div class="calendar-grid">`;
    dow.forEach(d => (html += `<div class="calendar-dow">${d}</div>`));
    for (let i = 0; i < firstDay.getDay(); i++) html += `<div class="calendar-day empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = dateKey(date);
      const entry = getPuzzleForDate(date, { ignoreRange: DEV_MODE });
      const isFuture = stripTime(date) > today();
      const isToday = daysBetween(date, today()) === 0;

      let cls = "calendar-day";
      let clickable = false;
      if (!entry) {
        cls += " out-of-range";
      } else if (isFuture && !DEV_MODE) {
        cls += " locked";
      } else {
        cls += " playable";
        clickable = true;
        if (isCompleted(key, entry)) cls += " completed";
      }
      if (isToday) cls += " today";

      html += `<div class="${cls}" ${clickable ? `data-date="${key}"` : ""} ${
        entry ? `data-type="${entry.type}"` : ""
      }>${d}${entry ? `<span class="type-dot"></span>` : ""}</div>`;
    }
    html += `</div></div>`;
  });
  return html;
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("open"));
}

function goToDate(date) {
  selectedDate = date;
  renderPuzzle(selectedDate);
  closeModals();
}

function initModals() {
  const devNote = document.getElementById("dev-mode-note");
  if (devNote) devNote.style.display = DEV_MODE ? "block" : "none";
  const devJump = document.getElementById("dev-jump");
  if (devJump) {
    devJump.style.display = DEV_MODE ? "flex" : "none";
    const jumpInput = document.getElementById("dev-jump-input");
    document.getElementById("dev-jump-btn").addEventListener("click", () => {
      if (!jumpInput.value) return;
      const [y, m, d] = jumpInput.value.split("-").map(Number);
      goToDate(new Date(y, m - 1, d));
    });
  }

  document.getElementById("calendar-btn").addEventListener("click", () => {
    document.getElementById("calendar-body").innerHTML = buildCalendarHTML();
    document.querySelectorAll("#calendar-body .calendar-day.playable").forEach(dayEl => {
      dayEl.addEventListener("click", () => {
        const [y, m, d] = dayEl.dataset.date.split("-").map(Number);
        goToDate(new Date(y, m - 1, d));
      });
    });
    openModal("calendar-backdrop");
  });

  document.getElementById("help-btn").addEventListener("click", () => openModal("help-backdrop"));

  document.querySelectorAll(".modal-close").forEach(btn =>
    btn.addEventListener("click", closeModals)
  );
  document.querySelectorAll(".modal-backdrop").forEach(backdrop =>
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) closeModals();
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  initModals();
  const badge = document.getElementById("dev-badge");
  if (badge) badge.style.display = DEV_MODE ? "inline-block" : "none";
  renderPuzzle(selectedDate);
});
