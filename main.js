// ABOUTME: Application logic for the plutimikation multiplication practice app.
// ABOUTME: Handles grid rendering, input, validation, statistics, and settings.

// ── State ──
const DEFAULT_SETTINGS = { difficulty: 'mixed' };
const DEFAULT_STATS = {
  total: 0, solved: 0,
  byDifficulty: {
    easy:   { total: 0, solved: 0 },
    medium: { total: 0, solved: 0 },
    hard:   { total: 0, solved: 0 }
  }
};

let settings, stats;
let factorA, factorB, currentDifficulty;
let partialProducts, totalResult, gridCols;
// cells[i] = { cells: [dom elements], isCarry: bool }
let rows = [];
let activeRow = 0, activeCol = 0;
let revealed = false;
let taskCounted = false;

function loadState() {
  try {
    settings = JSON.parse(localStorage.getItem('settings')) || { ...DEFAULT_SETTINGS };
  } catch { settings = { ...DEFAULT_SETTINGS }; }
  try {
    stats = JSON.parse(localStorage.getItem('stats')) || JSON.parse(JSON.stringify(DEFAULT_STATS));
  } catch { stats = JSON.parse(JSON.stringify(DEFAULT_STATS)); }
}

function saveSettings() { localStorage.setItem('settings', JSON.stringify(settings)); }
function saveStats() { localStorage.setItem('stats', JSON.stringify(stats)); }

// ── Difficulty & Generation ──
function pickDifficulty() {
  const d = settings.difficulty;
  if (d !== 'mixed') return d;
  const r = Math.random();
  if (r < 0.1) return 'easy';
  if (r < 0.4) return 'medium';
  return 'hard';
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFactors(diff) {
  let a, b;
  switch (diff) {
    case 'easy':
      a = randInt(10, 99);
      b = randInt(2, 9);
      break;
    case 'medium': {
      const aDigits = randInt(3, 4);
      a = randInt(Math.pow(10, aDigits - 1), Math.pow(10, aDigits) - 1);
      b = randInt(10, 99);
      break;
    }
    case 'hard': {
      const aDigits = randInt(5, 6);
      a = randInt(Math.pow(10, aDigits - 1), Math.pow(10, aDigits) - 1);
      b = randInt(100, 999);
      break;
    }
  }
  return [a, b];
}

// ── Grid Rendering ──
function digits(n, cols) {
  const s = String(n);
  const arr = new Array(cols).fill('');
  for (let i = 0; i < s.length; i++) {
    arr[cols - s.length + i] = s[i];
  }
  return arr;
}

function renderTask() {
  const ta = document.getElementById('taskArea');
  ta.innerHTML = '';
  revealed = false;
  taskCounted = false;

  // Compute — start from highest digit of factor B (e.g. 445 → 4,4,5 → ×400, ×40, ×5)
  const bStr = String(factorB);
  const bLen = bStr.length;
  partialProducts = [];
  for (let i = 0; i < bLen; i++) {
    const digit = Number(bStr[i]);
    const placeValue = Math.pow(10, bLen - 1 - i);
    partialProducts.push(factorA * digit * placeValue);
  }
  totalResult = factorA * factorB;

  // Determine grid columns
  const maxVal = Math.max(totalResult, ...partialProducts);
  gridCols = String(maxVal).length;

  // Factor display — single line
  const factorsDiv = document.createElement('div');
  factorsDiv.className = 'factors';
  factorsDiv.textContent = String(factorA) + '  \u00D7  ' + String(factorB);
  ta.appendChild(factorsDiv);

  // Separator
  const sep1 = document.createElement('hr');
  sep1.className = 'separator';
  ta.appendChild(sep1);

  // Build grid: for each partial product, add the product row + a carry (Übertrag) row
  rows = [];
  let logicalRow = 0;

  for (let r = 0; r < partialProducts.length; r++) {
    // Partial product row
    const { row, rowEl } = createGridRow(gridCols, logicalRow, false);
    rows.push({ cells: row, isCarry: false });
    ta.appendChild(rowEl);
    logicalRow++;

    // Übertrag (carry) row after each partial product
    const { row: carryRow, rowEl: carryRowEl } = createGridRow(gridCols, logicalRow, true);
    rows.push({ cells: carryRow, isCarry: true });
    ta.appendChild(carryRowEl);
    logicalRow++;
  }

  // Separator before sum
  const sep2 = document.createElement('hr');
  sep2.className = 'separator';
  ta.appendChild(sep2);

  // Carry row for the addition
  const { row: sumCarry, rowEl: sumCarryEl } = createGridRow(gridCols, logicalRow, true);
  rows.push({ cells: sumCarry, isCarry: true });
  ta.appendChild(sumCarryEl);
  logicalRow++;

  // Sum row
  const { row: sumRow, rowEl: sumRowEl } = createGridRow(gridCols, logicalRow, false);
  rows.push({ cells: sumRow, isCarry: false });
  ta.appendChild(sumRowEl);

  // Activate rightmost cell of first row (right-to-left input)
  activeRow = 0;
  activeCol = gridCols - 1;
  activateCell(0, gridCols - 1);
}

function createGridRow(cols, rowIndex, isCarry) {
  const rowEl = document.createElement('div');
  rowEl.className = 'grid-row' + (isCarry ? ' carry-row' : '');
  rowEl.dataset.row = rowIndex;
  const row = [];
  for (let c = 0; c < cols; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell' + (isCarry ? ' carry-cell' : '');
    cell.dataset.row = rowIndex;
    cell.dataset.col = c;
    cell.tabIndex = 0;
    cell.addEventListener('click', () => {
      if (!revealed) {
        activeRow = rowIndex;
        activeCol = c;
        activateCell(rowIndex, c);
      }
    });
    row.push(cell);
    rowEl.appendChild(cell);
  }
  return { row, rowEl };
}

function activateCell(r, c) {
  document.querySelectorAll('.cell.active').forEach(el => el.classList.remove('active'));
  if (rows[r] && rows[r].cells[c]) {
    rows[r].cells[c].classList.add('active');
    rows[r].cells[c].focus();
  }
}

// ── Input Handling (right-to-left) ──
function inputDigit(d) {
  if (revealed) return;
  clearRowHighlights();
  const cell = rows[activeRow]?.cells[activeCol];
  if (!cell) return;
  cell.textContent = d;
  moveToNext();
  updateURL();
}

function backspace() {
  if (revealed) return;
  clearRowHighlights();
  const cell = rows[activeRow]?.cells[activeCol];
  if (!cell) return;
  if (cell.textContent !== '') {
    cell.textContent = '';
  } else {
    moveToPrev();
    const prev = rows[activeRow]?.cells[activeCol];
    if (prev) prev.textContent = '';
  }
  activateCell(activeRow, activeCol);
  updateURL();
}

function confirmCell() {
  if (revealed) return;
  moveToNext();
}

// Right-to-left within a row, then next row (right side)
function moveToNext() {
  let r = activeRow, c = activeCol - 1;
  if (c < 0) {
    r++;
    c = gridCols - 1;
  }
  if (r >= rows.length) {
    r = rows.length - 1;
    c = 0;
  }
  activeRow = r;
  activeCol = c;
  activateCell(r, c);
}

function moveToPrev() {
  let r = activeRow, c = activeCol + 1;
  if (c >= gridCols) {
    r--;
    c = 0;
  }
  if (r < 0) { r = 0; c = gridCols - 1; }
  activeRow = r;
  activeCol = c;
}

// ── Check / Reveal ──
// Only check non-carry rows (partial products + sum)
function getCheckableRows() {
  // Returns indices of non-carry rows and their expected values
  const result = [];
  let partialIdx = 0;
  for (let r = 0; r < rows.length; r++) {
    if (!rows[r].isCarry) {
      const expected = partialIdx < partialProducts.length
        ? digits(partialProducts[partialIdx], gridCols)
        : digits(totalResult, gridCols);
      result.push({ rowIdx: r, expected });
      partialIdx++;
    }
  }
  return result;
}

function clearRowHighlights() {
  document.querySelectorAll('.grid-row').forEach(el => {
    el.classList.remove('row-error', 'row-correct');
  });
}

function checkResult() {
  if (revealed) return;
  clearRowHighlights();
  const checkable = getCheckableRows();
  let allCorrect = true;

  if (!taskCounted) {
    taskCounted = true;
    stats.total++;
    stats.byDifficulty[currentDifficulty].total++;
  }

  for (const { rowIdx, expected } of checkable) {
    const userVals = rows[rowIdx].cells.map(c => c.textContent);
    const rowEl = rows[rowIdx].cells[0].parentElement;
    let rowCorrect = true;
    for (let c = 0; c < gridCols; c++) {
      if (expected[c] !== userVals[c]) { rowCorrect = false; break; }
    }
    if (rowCorrect) {
      rowEl.classList.add('row-correct');
    } else {
      rowEl.classList.add('row-error');
      allCorrect = false;
    }
  }

  if (allCorrect) {
    stats.solved++;
    stats.byDifficulty[currentDifficulty].solved++;
    saveStats();
    showConfetti();
  } else {
    saveStats();
  }
}

function revealResult() {
  clearRowHighlights();
  revealed = true;
  const checkable = getCheckableRows();

  if (!taskCounted) {
    taskCounted = true;
    stats.total++;
    stats.byDifficulty[currentDifficulty].total++;
    saveStats();
  }

  for (const { rowIdx, expected } of checkable) {
    for (let c = 0; c < gridCols; c++) {
      rows[rowIdx].cells[c].textContent = expected[c];
      rows[rowIdx].cells[c].classList.add('revealed');
    }
  }
}

function difficultyFromFactors(a, b) {
  const aLen = String(a).length;
  const bLen = String(b).length;
  if (aLen <= 2 && bLen <= 1) return 'easy';
  if (aLen <= 4 && bLen <= 2) return 'medium';
  return 'hard';
}

function serializeCells() {
  return rows.map(r => r.cells.map(c => c.textContent || '_').join('')).join('.');
}

function restoreCells(encoded) {
  const rowData = encoded.split('.');
  for (let r = 0; r < rows.length && r < rowData.length; r++) {
    for (let c = 0; c < rows[r].cells.length && c < rowData[r].length; c++) {
      const ch = rowData[r][c];
      rows[r].cells[c].textContent = ch === '_' ? '' : ch;
    }
  }
}

function updateURL() {
  const url = new URL(window.location);
  url.searchParams.set('a', factorA);
  url.searchParams.set('b', factorB);
  url.searchParams.set('c', serializeCells());
  history.replaceState(null, '', url);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const a = Number(params.get('a'));
  const b = Number(params.get('b'));
  if (a > 0 && b > 0 && Number.isInteger(a) && Number.isInteger(b)) {
    factorA = a;
    factorB = b;
    currentDifficulty = difficultyFromFactors(a, b);
    renderTask();
    const cellData = params.get('c');
    if (cellData) {
      restoreCells(cellData);
    }
    updateURL();
    return true;
  }
  return false;
}

function newTask() {
  currentDifficulty = pickDifficulty();
  [factorA, factorB] = generateFactors(currentDifficulty);
  updateURL();
  renderTask();
}

// ── Confetti ──
function showConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#e44', '#4a4', '#44e', '#ea4', '#e4a', '#4ae'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.8 + 's';
    piece.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
    piece.style.width = (6 + Math.random() * 6) + 'px';
    piece.style.height = (6 + Math.random() * 6) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 3500);
}

// ── Stats Display ──
function showStats() {
  const c = document.getElementById('statsContent');
  const pct = (s, t) => t > 0 ? Math.round(s / t * 100) : 0;
  c.innerHTML = `
    <div class="stat-line">Aufgaben gesamt: ${stats.total}</div>
    <div class="stat-line">Davon gelöst: ${stats.solved} (${pct(stats.solved, stats.total)}%)</div>
    <div class="stat-section">
      <div class="stat-line" style="padding-left:0;font-weight:600;">Nach Schwierigkeit:</div>
      <div class="stat-line">Leicht: ${stats.byDifficulty.easy.solved} / ${stats.byDifficulty.easy.total} (${pct(stats.byDifficulty.easy.solved, stats.byDifficulty.easy.total)}%)</div>
      <div class="stat-line">Mittel: ${stats.byDifficulty.medium.solved} / ${stats.byDifficulty.medium.total} (${pct(stats.byDifficulty.medium.solved, stats.byDifficulty.medium.total)}%)</div>
      <div class="stat-line">Schwer: ${stats.byDifficulty.hard.solved} / ${stats.byDifficulty.hard.total} (${pct(stats.byDifficulty.hard.solved, stats.byDifficulty.hard.total)}%)</div>
    </div>
  `;
  document.getElementById('statsOverlay').classList.add('open');
}

// ── Settings ──
function applySettingsUI() {
  const radios = document.querySelectorAll('input[name="difficulty"]');
  radios.forEach(r => { r.checked = r.value === settings.difficulty; });
}

// ── Event Listeners ──
function init() {
  loadState();

  // Numpad
  document.querySelectorAll('.numpad-btn[data-digit]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      inputDigit(btn.dataset.digit);
    });
  });
  document.querySelector('[data-action="backspace"]').addEventListener('click', (e) => {
    e.preventDefault();
    backspace();
  });
  document.querySelector('[data-action="confirm"]').addEventListener('click', (e) => {
    e.preventDefault();
    confirmCell();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.overlay.open')) return;
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      inputDigit(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      confirmCell();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveToNext();
      activateCell(activeRow, activeCol);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveToPrev();
      activateCell(activeRow, activeCol);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeRow < rows.length - 1) activeRow++;
      activateCell(activeRow, activeCol);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeRow > 0) activeRow--;
      activateCell(activeRow, activeCol);
    }
  });

  // Action buttons
  document.getElementById('checkBtn').addEventListener('click', checkResult);
  document.getElementById('revealBtn').addEventListener('click', revealResult);
  document.getElementById('newBtn').addEventListener('click', newTask);
  document.getElementById('statsBtn').addEventListener('click', showStats);

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    applySettingsUI();
    document.getElementById('settingsOverlay').classList.add('open');
  });
  document.getElementById('settingsClose').addEventListener('click', () => {
    document.getElementById('settingsOverlay').classList.remove('open');
  });
  document.getElementById('settingsOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settingsOverlay')) {
      document.getElementById('settingsOverlay').classList.remove('open');
    }
  });

  document.querySelectorAll('input[name="difficulty"]').forEach(r => {
    r.addEventListener('change', () => {
      settings.difficulty = r.value;
      saveSettings();
    });
  });

  // Stats close
  document.getElementById('statsClose').addEventListener('click', () => {
    document.getElementById('statsOverlay').classList.remove('open');
  });
  document.getElementById('statsOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('statsOverlay')) {
      document.getElementById('statsOverlay').classList.remove('open');
    }
  });

  // Prevent numpad buttons from stealing focus from cells
  document.querySelectorAll('.numpad-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
  });

  // Start — use URL params if present, otherwise generate random task
  if (!loadFromURL()) {
    newTask();
  }
}

init();
