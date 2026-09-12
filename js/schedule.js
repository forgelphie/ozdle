/* ============================================================
   Scheduling
   Builds one ordered list mixing every Wordle answer and every
   Squaredle puzzle, spaced proportionally to how many of each
   exist (e.g. 43 Wordles : 24 Squaredles interleave ~roughly
   2-to-1, not strictly alternating). Day N since START_DATE
   plays schedule[N % schedule.length].
   ============================================================ */

function buildSchedule() {
  const wCount = WORDLE_WORDS.length;
  const sCount = SQUAREDLE_PUZZLES.length;
  const schedule = [];
  let wUsed = 0;
  let sUsed = 0;

  while (wUsed < wCount || sUsed < sCount) {
    // Pick whichever type is furthest behind its fair share so both
    // types spread evenly across the whole run instead of clumping.
    const wShare = wCount ? wUsed / wCount : Infinity;
    const sShare = sCount ? sUsed / sCount : Infinity;

    if (sUsed < sCount && (wUsed >= wCount || sShare <= wShare)) {
      schedule.push({ type: "squaredle", index: sUsed });
      sUsed++;
    } else {
      schedule.push({ type: "wordle", index: wUsed });
      wUsed++;
    }
  }
  return schedule;
}

const SCHEDULE = buildSchedule();

// ---- Date helpers ---------------------------------------------------------

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a, b) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((stripTime(b) - stripTime(a)) / MS_PER_DAY);
}

function dateKey(d) {
  const dd = stripTime(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
}

function isWithinRun(d) {
  const dd = stripTime(d);
  return dd >= stripTime(CONFIG.START_DATE) && dd <= stripTime(CONFIG.END_DATE);
}

// Returns { type, index, puzzle, dayNumber, inRange } for a given date, or
// null if the date falls outside the daily run (before START_DATE or after
// END_DATE) — unless opts.ignoreRange is set (dev/testing mode), in which
// case any date at all resolves to a puzzle by wrapping through the
// schedule, including dates before START_DATE or after END_DATE.
function getPuzzleForDate(d, opts = {}) {
  const inRange = isWithinRun(d);
  if (!inRange && !opts.ignoreRange) return null;

  const rawOffset = daysBetween(CONFIG.START_DATE, d);
  const len = SCHEDULE.length;
  const idx = ((rawOffset % len) + len) % len; // handles negative offsets too
  const entry = SCHEDULE[idx];
  const puzzle =
    entry.type === "wordle" ? WORDLE_WORDS[entry.index] : SQUAREDLE_PUZZLES[entry.index];
  return { type: entry.type, index: entry.index, puzzle, dayNumber: rawOffset + 1, inRange };
}

function today() {
  return stripTime(new Date());
}
