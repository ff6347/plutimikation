# Plutimikation — Agent Instructions

## What This Is

A single-file (`index.html`) German-language web app for children (4th grade, age 9–10) to practice written multiplication (schriftliche Multiplikation) the way it's taught in German schools. Deployed on GitHub Pages.

## Critical Rules — Do Not Break These

1. **Simple structure**: HTML in `index.html`, CSS in `style.css`, JS in `main.js`. Vite as dev server. No frameworks, no build tools beyond Vite.
2. **No backend**: Everything runs client-side. Data lives in `localStorage` only.
3. **All UI text in German**: Every label, button, and message must be in German.
4. **Monospace font**: All numbers and the grid use `'Nimbus Mono PS', 'Courier New', monospace`. No external font loading.
5. **Black/white/grey only**: Color is used exclusively for validation feedback (red rows = wrong, green rows = correct). No decorative colors.

## Math Logic — Get This Right

The app implements schriftliche Multiplikation exactly as taught in German schools:

```
     91482 × 889
  ──────────────
  [partial product × 800]    ← highest digit first
  [carry row]
  [partial product × 80]     ← then tens
  [carry row]
  [partial product × 9]      ← then ones
  ──────────────
  [sum = final result]
```

**Key rules:**
- Partial products are ordered **highest place value first** (800 → 80 → 9), not lowest first
- Each partial product is offset by its place value (the child must figure out the offset — no hints)
- Carry rows (Übertrag) appear between partial products as smaller cells for the child to note carries
- Input moves **right to left** within each row (ones place first, like solving by hand)
- The first active cell on a new task is the **rightmost** cell of the first partial product row
- Grid width = enough columns to fit the longest possible result

**When changing math logic, verify:**
- Partial products compute correctly for all digit combinations
- Place-value offsets are correct (partial product for tens digit shifted 1 left, hundreds shifted 2 left, etc.)
- The sum of all partial products equals Factor A × Factor B
- Edge cases: factors containing zeros (e.g., 103 × 20)

## Layout Rules

- Narrow card layout, `max-width: 400px`, centered on desktop
- **Mobile (< 420px)**: edge-to-edge, no body padding, no card border
- **Desktop (≥ 420px)**: 8px body padding, card border visible
- No excessive whitespace — grid, numpad, and buttons should stack tightly
- The numpad and action buttons are always visible below the grid (not pushed to the bottom of the viewport)

## Input Behavior

- Numpad (0–9, backspace ←, confirm ✓) is always visible
- Physical keyboard input also works (digits, Backspace, Enter/Tab)
- Typing a digit fills the active cell and auto-advances to the next cell (right → left, then next row)
- Cells can be tapped/clicked directly to select them
- Backspace clears current cell and moves back

## Validation & Feedback

- "Ergebnis Überprüfen" checks each row independently
- Wrong rows get a colored background — **row-level only, never cell-level**
- All correct → confetti animation (subtle, short, no sound)
- "Ergebnis Anzeigen" fills in correct answers in grey — does NOT count as solved in statistics
- Statistics update only when "Ergebnis Überprüfen" succeeds with zero errors

## Things That Are Intentionally Missing — Do Not Add

- No sounds or music
- No hints for carry positions or place-value offsets
- No confirmation dialog on "Neue Aufgabe"
- No cell-level error highlighting
- No statistics reset button
- No timer or time pressure
- No badges, stars, levels, or gamification (confetti is the only reward)
- No multi-user support or accounts
- No backend or API calls

## localStorage Schema

```json
{
  "settings": { "difficulty": "mixed" },
  "stats": {
    "total": 0, "solved": 0,
    "byDifficulty": {
      "easy":   { "total": 0, "solved": 0 },
      "medium": { "total": 0, "solved": 0 },
      "hard":   { "total": 0, "solved": 0 }
    }
  }
}
```

## Difficulty Levels

| Key | Factor A | Factor B | Example |
|-----|----------|----------|---------|
| `easy` | 2 digits | 1 digit | 47 × 8 |
| `medium` | 3–4 digits | 2 digits | 382 × 47 |
| `hard` | 5–6 digits | 3 digits | 123405 × 445 |
| `mixed` | varies | varies | weighted: 60% hard, 30% medium, 10% easy |

Default setting: `mixed`.
