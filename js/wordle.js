/* ============================================================
   Tokens
   ============================================================ */
:root {
  --bg-deep: #0e1a14;
  --bg-panel: #142a20;
  --emerald: #1f6b3b;
  --emerald-bright: #3f9e5e;
  --rose: #d6336c;
  --gold: #c9a24b;
  --parchment: #f3ecda;
  --ink: #171310;
  --line: rgba(243, 236, 218, 0.14);
  --font-display: "Cinzel", serif;
  --font-body: "Work Sans", sans-serif;
  --radius: 10px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background: radial-gradient(ellipse at top, #16301f 0%, var(--bg-deep) 60%);
  color: var(--parchment);
  font-family: var(--font-body);
}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 3rem;
}

button { font-family: inherit; }

a { color: var(--gold); }

/* ============================================================
   Header
   ============================================================ */
.site-header {
  width: 100%;
  max-width: 560px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1rem 0.9rem;
  border-bottom: 1px solid var(--line);
}

.wordmark {
  font-family: var(--font-display);
  font-size: 1.6rem;
  letter-spacing: 0.12em;
  margin: 0;
  color: var(--parchment);
}
.wordmark span { color: var(--emerald-bright); }

.header-actions { display: flex; gap: 0.5rem; }

.icon-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--parchment);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: border-color 0.15s ease, transform 0.1s ease;
}
.icon-btn:hover { border-color: var(--gold); }
.icon-btn:active { transform: scale(0.94); }
.icon-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* ============================================================
   Puzzle header / day strip
   ============================================================ */
.puzzle-meta {
  width: 100%;
  max-width: 560px;
  padding: 1rem 1rem 0;
  text-align: center;
}
.puzzle-meta .day-label {
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  color: var(--gold);
  font-size: 0.95rem;
}
.puzzle-meta .theme-label {
  margin: 0.15rem 0 0;
  font-size: 1.05rem;
  color: var(--parchment);
  opacity: 0.85;
}
.puzzle-meta .archive-note {
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: var(--rose);
}

main {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  gap: 1.25rem;
}
/* ============================================================
   Wordle board
   ============================================================ */
.wordle-board {
  display: grid;
  /* FIX 1: Explicitly force all 6 rows to take identical 1fr height */
  grid-template-rows: repeat(6, 1fr); 
  gap: 6px;
  width: 100%;
  max-width: calc(var(--word-length, 5) * 56px + (var(--word-length, 5) - 1) * 6px);
  margin: 0 auto;
}

.wordle-row {
  display: grid;
  grid-template-columns: repeat(var(--word-length, 5), 1fr);
  gap: 6px;
  /* FIX 2: Ensure rows do not grow beyond their track */
  height: 100%;
  align-items: center;
}

.wordle-tile {
  aspect-ratio: 1 / 1;
  width: 100%;
  min-height: 0; /* Prevents text line-height from blowing out tile height */
  border: 2px solid var(--line);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 4vw, 1.6rem);
  font-weight: 600;
  line-height: 1; /* Locks character vertical height */
  color: var(--parchment);
  transition: background-color 0.25s ease, border-color 0.25s ease;
  box-sizing: border-box;
}

.wordle-tile.filled { 
  border-color: var(--gold); 
}

.wordle-tile.correct { background: var(--emerald); border-color: var(--emerald); }
.wordle-tile.present { background: var(--rose); border-color: var(--rose); }
.wordle-tile.absent { background: rgba(255,255,255,0.05); border-color: transparent; opacity: 0.6; }

.current-row .wordle-tile.filled { animation: pop 0.1s ease; }

@keyframes pop { 
  0% { transform: scale(0.95); } 
  50% { transform: scale(1.02); }
  100% { transform: scale(1); } 
}

/* Keyboard */
.keyboard { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.keyboard-row { display: flex; justify-content: center; gap: 6px; }
.key {
  flex: 1;
  max-width: 42px;
  height: 52px;
  border: none;
  border-radius: 6px;
  background: rgba(243, 236, 218, 0.12);
  color: var(--parchment);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}
.key:active { transform: scale(0.95); }
.key-wide { max-width: 68px; font-size: 0.75rem; }
.key.correct { background: var(--emerald); }
.key.present { background: var(--rose); }
.key.absent { background: rgba(255,255,255,0.04); opacity: 0.5; }


/* ============================================================
   Squaredle
   ============================================================ */
.squaredle-wrap { display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; }

.squaredle-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: min(88vw, 360px);
  aspect-ratio: 1;
  user-select: none;
  touch-action: none;
}
.squaredle-cell {
  display: grid;
  place-items: center;
  background: var(--bg-panel);
  border: 2px solid var(--line);
  border-radius: 10px;
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 5vw, 1.8rem);
  font-weight: 600;
  color: var(--parchment);
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.4s ease, transform 0.1s ease;
}
.squaredle-cell.selected { background: var(--emerald); border-color: var(--emerald-bright); transform: scale(1.05); }
.squaredle-cell.faded { opacity: 0.25; cursor: default; }

.squaredle-current-word {
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  font-size: 1.2rem;
  min-height: 1.6rem;
  color: var(--gold);
}

.squaredle-type-row { display: flex; gap: 0.5rem; width: min(88vw, 360px); }
.squaredle-type-row input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(243, 236, 218, 0.06);
  color: var(--parchment);
  font-family: var(--font-body);
  font-size: 1rem;
}
.squaredle-type-row button {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: none;
  background: var(--emerald);
  color: var(--parchment);
  font-weight: 600;
  cursor: pointer;
}

.word-progress {
  width: min(88vw, 360px);
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}
.word-chip {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 0.85rem;
  letter-spacing: 0.03em;
}
.word-chip.found { background: var(--emerald); border-color: var(--emerald-bright); }
.word-chip.hidden-word { color: transparent; background: rgba(255,255,255,0.05); border-color: var(--line); }
.word-chip.hidden-word::selection { color: transparent; }

/* ============================================================
   Status banner
   ============================================================ */
.status-banner {
  width: 100%;
  text-align: center;
  padding: 0.8rem 1rem;
  border-radius: var(--radius);
  font-family: var(--font-display);
  letter-spacing: 0.05em;
}
.status-banner.won { background: rgba(63, 158, 94, 0.18); color: var(--emerald-bright); border: 1px solid var(--emerald-bright); }
.status-banner.lost { background: rgba(214, 51, 108, 0.18); color: var(--rose); border: 1px solid var(--rose); }
/* ============================================================
   Share Button & Timer Additions
   ============================================================ */
.squaredle-timer {
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  color: var(--gold);
  font-size: 1.15rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.25rem;
}

.share-btn {
  background: var(--emerald);
  color: var(--parchment);
  border: 1px solid var(--emerald-bright);
  border-radius: var(--radius);
  padding: 0.75rem 1.5rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.75rem;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.share-btn:hover {
  background: var(--emerald-bright);
}

.share-btn:active {
  transform: scale(0.96);
}

/* ============================================================
   Modal (calendar / how to play)
   ============================================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 12, 9, 0.75);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 20;
}
.modal-backdrop.open { display: flex; }
.modal {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1.4rem;
  width: 100%;
  max-width: 480px;
  max-height: 88vh;
  overflow-y: auto;
}
.modal h2 {
  font-family: var(--font-display);
  color: var(--gold);
  margin-top: 0;
  letter-spacing: 0.05em;
}
.modal-close {
  float: right;
  background: none;
  border: none;
  color: var(--parchment);
  font-size: 1.3rem;
  cursor: pointer;
}

/* Calendar */
.calendar-month { margin-bottom: 1.4rem; }
.calendar-month h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.08em;
  color: var(--parchment);
  opacity: 0.85;
  margin-bottom: 0.5rem;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.calendar-dow {
  text-align: center;
  font-size: 0.7rem;
  opacity: 0.5;
  letter-spacing: 0.05em;
}
.calendar-day {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 0.85rem;
  position: relative;
  border: 1px solid transparent;
}
.calendar-day.empty { visibility: hidden; }
.calendar-day.out-of-range { color: rgba(243,236,218,0.2); }
.calendar-day.locked { color: rgba(243,236,218,0.3); }
.calendar-day.playable {
  cursor: pointer;
  background: rgba(243, 236, 218, 0.06);
  border-color: var(--line);
}
.calendar-day.playable:hover { border-color: var(--gold); }
.calendar-day.today { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }
.calendar-day.completed { background: var(--emerald); }
.calendar-day .type-dot {
  position: absolute;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--rose);
}
.calendar-day[data-type="squaredle"] .type-dot { background: var(--gold); }

.calendar-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  opacity: 0.75;
  margin-top: 0.5rem;
}
.calendar-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.how-to-play p, .how-to-play li { line-height: 1.5; }
.tile-demo { display: inline-flex; gap: 2px; vertical-align: middle; }
.tile-demo span {
  width: 24px; height: 24px; display: grid; place-items: center;
  border-radius: 4px; font-size: 0.8rem; font-weight: 700;
}

footer {
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.5;
  margin-top: 1rem;
  padding: 0 1rem;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

@media (max-width: 400px) {
  .key { height: 46px; }
}
