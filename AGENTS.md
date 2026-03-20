# Plutimikation

A minimalist German-language web app that helps children (age 9–10, 4th grade) practice written multiplication (schriftliche Multiplikation) as taught in German schools.

## Architecture

- **Single-file app**: Everything lives in `index.html` — HTML, CSS, and JavaScript
- **No build step, no dependencies, no backend**: Pure HTML/CSS/JS, deployable as a static file (GitHub Pages)
- **Data storage**: `localStorage` only (settings + statistics)
- **Single user profile** per browser

## Key Concepts

### Written Multiplication (Schriftliche Multiplikation)

The app mirrors the German school method:
- Factor A × Factor B displayed at the top
- Partial product rows: one per digit of Factor B, ordered **highest place value first** (hundreds → tens → ones)
- Carry rows (Übertrag) between partial products for the child to note carries
- Sum row at the bottom for the final result
- Input direction: **right to left** within each row (matching how you solve by hand)

### Difficulty Levels

| Level | Factor A | Factor B | Example |
|-------|----------|----------|---------|
| Leicht | 2 digits | 1 digit | 47 × 8 |
| Mittel | 3–4 digits | 2 digits | 382 × 47 |
| Schwer | 5–6 digits | 3 digits | 123405 × 445 |
| Gemischt | mixed | mixed | weighted: 60% Schwer, 30% Mittel, 10% Leicht |

Default: Gemischt (mixed).

## UI/Design Rules

- **Language**: All UI text in German
- **Layout**: Narrow card (max-width 400px), edge-to-edge on mobile
- **Font**: Monospace (JetBrains Mono) for all numbers and grid
- **Colors**: Black/white/grey only — color exclusively for feedback (red = wrong row, green = correct row)
- **Validation**: Row-level only, never cell-level
- **Confetti**: Subtle animation on fully correct solution (no sound)
- **No gamification**: No badges, stars, timers, or scores beyond the statistics page

## What Is Intentionally Not Included

- No sounds or music
- No hints for carry/offset positions — the child must know this
- No confirmation dialog on "Neue Aufgabe"
- No cell-level error marking (only row-level)
- No reset button for statistics
- No backend, accounts, or multi-user support
- No timer or time pressure

## Development Notes

- When editing, keep everything in the single `index.html` file
- Test multiplication math carefully — partial products must account for place-value offset
- Preserve right-to-left input order within rows
- Preserve highest-digit-first order for partial products
- Mobile-first: ensure no excessive margins or whitespace on small screens
