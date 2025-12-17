let rows = 12;
let cols = 12;

const COLORS = [
  { key: "R", name: "Rojo", value: "#e53935" },
  { key: "O", name: "Naranja", value: "#fb8c00" },
  { key: "Y", name: "Amarillo", value: "#fdd835" },
  { key: "G", name: "Verde", value: "#43a047" },
  { key: "C", name: "Cian", value: "#00bcd4" },
  { key: "B", name: "Azul", value: "#1e88e5" },
  { key: "P", name: "Morado", value: "#7c5cff" },
  { key: "K", name: "Negro", value: "#111111" },
  { key: "W", name: "Gris claro", value: "#d9d9d9" }
];

const modelGrid = document.getElementById("model-grid");
const playerGrid = document.getElementById("player-grid");
const paletteEl = document.getElementById("palette");
const eraserBtn = document.getElementById("eraser");
const currentToolEl = document.getElementById("current-tool");
const checkBtn = document.getElementById("check-btn");
const resetBtn = document.getElementById("reset-btn");
const scoreEl = document.getElementById("score");
const detailEl = document.getElementById("detail");
const levelButtons = document.querySelectorAll(".level-btn");

const EMPTY_COLOR = "#f2f3f5";
let selectedColorKey = COLORS[0].key;
let modelMatrix = [];
let playerMatrix = [];
let currentLevelIndex = 0;
let rootStyle = document.documentElement.style;
let levelResults = {};

function keyToColor(k) {
  const c = COLORS.find(x => x.key === k);
  return c ? c.value : null;
}

function keyToName(k) {
  const c = COLORS.find(x => x.key === k);
  return c ? c.name : "Borrador";
}

function setGridTemplate(el) {
  el.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
}

const LEVELS = [
  {
    size: 12,
    build() {
      const n = 12;
      const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
      for (let i = 0; i < n; i++) {
        const color = i < 6 ? "Y" : i < 9 ? "B" : "R";
        for (let j = 0; j < n; j++) matrix[i][j] = color;
      }
      return matrix;
    },
    title: "Bandera de Colombia"
  },
  {
    size: 12,
    build() {
      const mask = [
        "............",
        "....KKKK....",
        "...KWWWWK...",
        "..KWWWWWWK..",
        "..KWWWWWWK..",
        "..KWWWWWWK..",
        "...KWWWWK...",
        "....KWWK....",
        ".....KK.....",
        ".....KK.....",
        "....BBBB....",
        "............"
      ];
      const n = 12;
      const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const ch = mask[i][j] || ".";
          if (ch === ".") continue;
          matrix[i][j] = ch;
        }
      }
      return matrix;
    },
    title: "Vaso"
  },
  {
    size: 14,
    build() {
      const n = 14;
      const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
      for (let i = 2; i < n - 2; i++) {
        const j = 2 + ((i - 2) % (n - 4));
        matrix[i][j] = "G";
        if (j + 1 < n - 2) matrix[i][j + 1] = "G";
      }
      matrix[4][3] = "K";
      matrix[4][4] = "K";
      matrix[5][3] = "K";
      matrix[5][4] = "K";
      return matrix;
    },
    title: "Serpiente"
  },
  {
    size: 16,
    build() {
      const n = 16;
      const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => "G"));
      for (let i = 1; i < n - 1; i++) {
        matrix[1][i] = "W";
        matrix[n - 2][i] = "W";
        matrix[i][1] = "W";
        matrix[i][n - 2] = "W";
      }
      const mid = Math.floor(n / 2);
      for (let i = 2; i < n - 2; i++) {
        matrix[mid][i] = "W";
      }
      const cx = mid, cy = mid;
      const r = 3;
      for (let i = 2; i < n - 2; i++) {
        for (let j = 2; j < n - 2; j++) {
          const d = Math.sqrt((i - cx) ** 2 + (j - cy) ** 2);
          if (Math.abs(d - r) <= 0.6) matrix[i][j] = "W";
        }
      }
      return matrix;
    },
    title: "Cancha de fútbol"
  },
  {
    size: 16,
    build() {
      const mask = [
        "....R..O..Y....",
        "...RR.OO.YY....",
        "..RRR.OOO.YY...",
        ".RRRR.OOOO.YY..",
        ".PYYY.BBBB.PP..",
        ".PYYY.BBBB.PP..",
        ".PPPP.BBBB.PP..",
        ".PPPP.BBBB.PP..",
        ".PPPP.BBBB.PP..",
        ".PYYY.BBBB.PP..",
        ".PYYY.BBBB.PP..",
        ".RRRR.OOOO.YY..",
        "..RRR.OOO.YY...",
        "...RR.OO.YY....",
        "....R..O..Y....",
        "................"
      ];
      const n = 16;
      const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const ch = mask[i][j] || ".";
          if (ch === ".") continue;
          matrix[i][j] = ch;
        }
      }
      return matrix;
    },
    title: "Patrón tribal"
  }
];

function buildModel() {
  const level = LEVELS[currentLevelIndex];
  rows = level.size;
  cols = level.size;
  modelMatrix = level.build();
}

function renderModel() {
  modelGrid.innerHTML = "";
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const k = modelMatrix[i][j];
      const color = keyToColor(k);
      if (color) cell.style.backgroundColor = color;
      modelGrid.appendChild(cell);
    }
  }
}

function initPlayer() {
  playerMatrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  playerGrid.innerHTML = "";
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(i);
      cell.dataset.col = String(j);
      cell.addEventListener("click", onCellClick);
      playerGrid.appendChild(cell);
    }
  }
}

function renderPalette() {
  paletteEl.innerHTML = "";
  COLORS.forEach(c => {
    const swatch = document.createElement("button");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = c.value;
    swatch.dataset.key = c.key;
    swatch.addEventListener("click", () => selectColor(c.key, swatch));
    paletteEl.appendChild(swatch);
  });
  updateActiveTool();
}

function selectColor(key, swatchEl) {
  selectedColorKey = key;
  updateActiveTool(swatchEl);
}

function updateActiveTool(swatchEl) {
  Array.from(paletteEl.children).forEach(el => el.classList.remove("active"));
  eraserBtn.classList.remove("primary");
  if (selectedColorKey) {
    const target = swatchEl || Array.from(paletteEl.children).find(el => el.dataset.key === selectedColorKey);
    if (target) target.classList.add("active");
    currentToolEl.textContent = keyToName(selectedColorKey);
    currentToolEl.style.background = "rgba(255,255,255,0.06)";
  } else {
    eraserBtn.classList.add("primary");
    currentToolEl.textContent = "Borrador";
    currentToolEl.style.background = "rgba(255,255,255,0.06)";
  }
}

function onCellClick(e) {
  const cell = e.currentTarget;
  const i = Number(cell.dataset.row);
  const j = Number(cell.dataset.col);
  cell.classList.remove("status-correct", "status-incorrect");
  if (selectedColorKey) {
    playerMatrix[i][j] = selectedColorKey;
    const color = keyToColor(selectedColorKey);
    cell.style.backgroundColor = color || EMPTY_COLOR;
  } else {
    playerMatrix[i][j] = null;
    cell.style.backgroundColor = EMPTY_COLOR;
  }
}

function check() {
  let required = 0;
  let correct = 0;
  let incorrect = 0;
  let unused = 0;

  const cells = Array.from(playerGrid.children);
  cells.forEach(cell => cell.classList.remove("status-correct", "status-incorrect"));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const modelK = modelMatrix[i][j];
      const playerK = playerMatrix[i][j];
      const idx = i * cols + j;
      const cell = cells[idx];
      if (modelK) required++;
      if (modelK) {
        if (playerK === modelK) {
          correct++;
          cell.classList.add("status-correct");
        } else {
          incorrect++;
          cell.classList.add("status-incorrect");
        }
      } else {
        if (playerK) {
          unused++;
          cell.classList.add("status-incorrect");
        }
      }
    }
  }

  const pct = required > 0 ? Math.round((correct / required) * 100) : 100;
  scoreEl.textContent = `${pct}% correcto`;
  if (pct === 100) {
    detailEl.textContent = "¡Excelente! Todo coincide con el modelo.";
  } else if (pct >= 80) {
    detailEl.textContent = "Muy bien, revisa los puntos en rojo.";
  } else {
    detailEl.textContent = "Sigue intentando, corrige los puntos en rojo.";
  }
  detailEl.textContent += ` | Correctos: ${correct} · Incorrectos: ${incorrect} · Sin usar: ${unused}`;
  levelResults[currentLevelIndex] = { pct, correct, incorrect, unused };
  renderSummary();
}

function reset() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      playerMatrix[i][j] = null;
    }
  }
  Array.from(playerGrid.children).forEach(cell => {
    cell.style.backgroundColor = EMPTY_COLOR;
    cell.classList.remove("status-correct", "status-incorrect");
  });
  scoreEl.textContent = "";
  detailEl.textContent = "";
}

eraserBtn.addEventListener("click", () => {
  selectedColorKey = null;
  updateActiveTool();
});

checkBtn.addEventListener("click", check);
resetBtn.addEventListener("click", reset);

function applyLayout() {
  setGridTemplate(modelGrid);
  setGridTemplate(playerGrid);
}

function loadLevel(levelIndex) {
  currentLevelIndex = levelIndex;
  levelButtons.forEach(btn => btn.classList.remove("active"));
  const activeBtn = Array.from(levelButtons).find(b => Number(b.dataset.level) === levelIndex);
  if (activeBtn) activeBtn.classList.add("active");
  buildModel();
  applyLayout();
  renderModel();
  initPlayer();
  reset();
  renderSummary();
}

function adjustCellSize() {
  if (cols >= 24) {
    rootStyle.setProperty("--cell-size", "22px");
    rootStyle.setProperty("--gap", "1px");
  } else if (cols >= 16) {
    rootStyle.setProperty("--cell-size", "26px");
    rootStyle.setProperty("--gap", "1px");
  } else if (cols >= 12) {
    rootStyle.setProperty("--cell-size", "30px");
    rootStyle.setProperty("--gap", "2px");
  } else {
    rootStyle.setProperty("--cell-size", "34px");
    rootStyle.setProperty("--gap", "2px");
  }
}

function renderSummary() {
  const list = document.getElementById("summary-list");
  if (!list) return;
  list.innerHTML = "";
  for (let i = 0; i < LEVELS.length; i++) {
    const item = document.createElement("li");
    item.className = "summary-item";
    const left = document.createElement("span");
    left.textContent = `Nivel ${i + 1}: ${LEVELS[i].title}`;
    const right = document.createElement("span");
    const res = levelResults[i];
    if (res) {
      right.textContent = `${res.pct}% · C:${res.correct} · I:${res.incorrect} · SU:${res.unused}`;
    } else {
      right.textContent = "Pendiente";
    }
    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  }
}

levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.level);
    loadLevel(idx);
    adjustCellSize();
  });
});

renderPalette();
updateActiveTool();
loadLevel(currentLevelIndex);
adjustCellSize();
renderSummary();
