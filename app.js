const STORAGE_KEY = "three-axis-notes-settings";
const BURGER_CENTER = { x: 1, z: 1 };
const BURGER_SEGMENTS = 18;
const BURGER_LAYERS = [
  { name: "plate", y0: -0.04, y1: 0.02, radius: 1.12, color: "#9aa7b5", fill: "-", plate: true },
  { name: "bottom bun", y0: 0.02, y1: 0.38, radius: 0.94, color: "#d9a441", fill: "O" },
  { name: "patty", y0: 0.38, y1: 0.64, radius: 0.82, color: "#6b3319", fill: "#" },
  { name: "cheese", y0: 0.64, y1: 0.8, radius: 0.93, color: "#ffcc33", fill: "=" },
  { name: "lettuce", y0: 0.8, y1: 1.04, radius: 0.9, color: "#7dff6b", fill: "~", wavy: true },
  { name: "tomato", y0: 1.04, y1: 1.28, radius: 0.78, color: "#e63946", fill: "o" },
  { name: "top bun", y0: 1.28, y1: 2.0, radius: 0.94, color: "#e8b86d", fill: "@", dome: true, sesame: true },
];

const SESAME_SEEDS = [
  [0.18, 0.08],
  [-0.16, 0.14],
  [0.04, -0.2],
  [-0.22, -0.08],
  [0.26, -0.12],
  [-0.06, 0.24],
  [0.12, 0.22],
  [-0.28, 0.04],
];

const SHAPE_INFO = {
  burger: {
    id: "burger",
    label: "Burger",
    noun: "burger",
    title: "Plot ideas on a 0-2 burger",
    eyebrow: "3 Axis Notes // ASCII Burger",
    intro: "Add notes with scores from 0 to 2. Each point lands in the bun-to-bun stack, inside one of eight labeled low/high octants.",
    space: "0-2 burger space",
  },
  donut: {
    id: "donut",
    label: "Donut",
    noun: "donut",
    title: "Plot ideas on a 0-2 donut",
    eyebrow: "3 Axis Notes // ASCII Donut",
    intro: "Add notes with scores from 0 to 2. Each point lands on the glazed torus, inside one of eight labeled low/high octants.",
    space: "0-2 donut space",
  },
  leaf: {
    id: "leaf",
    label: "Leaf",
    noun: "leaf",
    title: "Plot ideas on a 0-2 leaf",
    eyebrow: "3 Axis Notes // ASCII Leaf",
    intro: "Add notes with scores from 0 to 2. Each point lands along the blade from stem to tip, inside one of eight labeled low/high octants.",
    space: "0-2 leaf space",
  },
  house: {
    id: "house",
    label: "House",
    noun: "house",
    title: "Plot ideas on a 0-2 house",
    eyebrow: "3 Axis Notes // ASCII House",
    intro: "Add notes with scores from 0 to 2. Each point lands in the house volume, inside one of eight labeled low/high octants.",
    space: "0-2 house space",
  },
};

const defaultSettings = {
  axes: ["Urgency", "Impact", "Effort"],
  regions: {},
  shape: "burger",
};

const regionCombos = [
  ["low", "low", "low"],
  ["high", "low", "low"],
  ["low", "high", "low"],
  ["high", "high", "low"],
  ["low", "low", "high"],
  ["high", "low", "high"],
  ["low", "high", "high"],
  ["high", "high", "high"],
];

const regionColors = [
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#f472b6",
  "#fb7185",
  "#f59e0b",
  "#34d399",
  "#22d3ee",
];

function regionKey(parts) {
  return parts.join("-");
}

function defaultRegionName(parts) {
  return parts.map((part) => part[0].toUpperCase() + part.slice(1)).join(" / ");
}

for (const combo of regionCombos) {
  defaultSettings.regions[regionKey(combo)] = defaultRegionName(combo);
}

let settings = loadSettings();
let notes = [];
let activeNoteId = null;
let nextNoteId = 1;
let yaw = -0.9;
let pitch = 0.38;
let zoom = 1;
let dragState = null;
let hitTargets = [];
let cellW = 8;
let cellH = 14;
let gridCols = 80;
let gridRows = 40;
let lastBuf = null;
let rotateLocked = false;
let stickyLock = false;
let hoverLocked = false;
let yawVel = 0;
let pitchVel = 0;
let spinFrame = 0;

const canvas = document.querySelector("#cubeCanvas");
const ctx = canvas.getContext("2d");
const noteForm = document.querySelector("#noteForm");
const sliderFields = document.querySelector("#sliderFields");
const notesList = document.querySelector("#notesList");
const activeRegion = document.querySelector("#activeRegion");
const settingsDialog = document.querySelector("#settingsDialog");
const settingsForm = document.querySelector("#settingsForm");
const regionSettings = document.querySelector("#regionSettings");
const openSettings = document.querySelector("#openSettings");
const closeSettings = document.querySelector("#closeSettings");
const resetLabels = document.querySelector("#resetLabels");
const resetView = document.querySelector("#resetView");
const lockRotate = document.querySelector("#lockRotate");
const cubePanel = document.querySelector(".cube-panel");
const canvasHint = document.querySelector("#canvasHint");
const shapePicker = document.querySelector("#shapePicker");
const shapeEyebrow = document.querySelector("#shapeEyebrow");
const shapeIntro = document.querySelector("#shapeIntro");
const shapeSpace = document.querySelector("#shapeSpace");
const notePanelTitle = document.querySelector("#notePanelTitle");

function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(defaultSettings);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      axes: parsed.axes?.length === 3 ? parsed.axes : [...defaultSettings.axes],
      regions: { ...defaultSettings.regions, ...(parsed.regions || {}) },
      shape: SHAPE_INFO[parsed.shape] ? parsed.shape : "burger",
    };
  } catch {
    return structuredClone(defaultSettings);
  }
}

function currentShape() {
  return SHAPE_INFO[settings.shape] ? settings.shape : "burger";
}

function shapeNoun() {
  return SHAPE_INFO[currentShape()].noun;
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applyShapeCopy() {
  const info = SHAPE_INFO[currentShape()];
  document.title = info.eyebrow;
  shapeEyebrow.textContent = info.eyebrow;
  notePanelTitle.textContent = info.title;
  shapeIntro.textContent = info.intro;
  shapeSpace.textContent = info.space;
  cubePanel.setAttribute("aria-label", `ASCII ${info.noun} visualization`);
  canvasHint.textContent = rotateLocked
    ? "Locked. Swipe to rotate. Tap empty space to unlock. Click @ or o to select."
    : `Hover or tap the ${info.noun} to lock, then swipe to rotate.`;
}

function renderShapePicker() {
  shapePicker.innerHTML = "";
  Object.values(SHAPE_INFO).forEach((info) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.shape = info.id;
    button.className = info.id === currentShape() ? "is-active" : "";
    button.textContent = `[ ${info.label.toUpperCase()} ]`;
    button.addEventListener("click", () => {
      settings.shape = info.id;
      saveSettings();
      applyShapeCopy();
      renderShapePicker();
      drawScene();
    });
    shapePicker.appendChild(button);
  });
}

function getRegionParts(point) {
  return [point.x < 1 ? "low" : "high", point.y < 1 ? "low" : "high", point.z < 1 ? "low" : "high"];
}

function getRegion(point) {
  const parts = getRegionParts(point);
  const key = regionKey(parts);
  const index = regionCombos.findIndex((combo) => regionKey(combo) === key);
  return {
    key,
    parts,
    index,
    name: settings.regions[key],
    color: regionColors[index],
  };
}

function regionDescriptor(parts) {
  return parts.map((part, index) => `${settings.axes[index]} ${part}`).join(", ");
}

function renderSliders() {
  sliderFields.innerHTML = "";

  settings.axes.forEach((axis, index) => {
    const key = ["x", "y", "z"][index];
    const field = document.createElement("label");
    field.innerHTML = `
      <div class="slider-topline">
        <span>${axis}</span>
        <span><strong id="${key}Value">1.00</strong> <span id="${key}Pill" class="pill">high</span></span>
      </div>
      <input id="${key}Score" name="${key}" type="range" min="0" max="2" step="0.01" value="1" />
    `;
    sliderFields.appendChild(field);
  });

  for (const key of ["x", "y", "z"]) {
    const slider = document.querySelector(`#${key}Score`);
    slider.addEventListener("input", () => updateSliderReadout(key));
    updateSliderReadout(key);
  }
}

function updateSliderReadout(key) {
  const slider = document.querySelector(`#${key}Score`);
  const value = Number(slider.value);
  document.querySelector(`#${key}Value`).textContent = value.toFixed(2);
  document.querySelector(`#${key}Pill`).textContent = value < 1 ? "low" : "high";
}

function renderSettingsForm() {
  document.querySelector("#axisX").value = settings.axes[0];
  document.querySelector("#axisY").value = settings.axes[1];
  document.querySelector("#axisZ").value = settings.axes[2];
  regionSettings.innerHTML = "";

  regionCombos.forEach((combo, index) => {
    const key = regionKey(combo);
    const row = document.createElement("div");
    row.className = "region-row";
    row.innerHTML = `
      <p data-region-description="${key}">${regionDescriptor(combo)}</p>
      <label>
        Octant label
        <input type="text" name="${key}" value="${settings.regions[key]}" data-region-key="${key}" />
      </label>
    `;
    row.style.borderColor = `${regionColors[index]}66`;
    regionSettings.appendChild(row);
  });
}

function currentModalAxes() {
  return [
    document.querySelector("#axisX").value.trim() || defaultSettings.axes[0],
    document.querySelector("#axisY").value.trim() || defaultSettings.axes[1],
    document.querySelector("#axisZ").value.trim() || defaultSettings.axes[2],
  ];
}

function updateModalRegionDescriptions() {
  const axes = currentModalAxes();
  regionCombos.forEach((combo) => {
    const description = combo.map((part, index) => `${axes[index]} ${part}`).join(", ");
    regionSettings.querySelector(`[data-region-description="${regionKey(combo)}"]`).textContent = description;
  });
}

function renderNotesList() {
  if (!notes.length) {
    notesList.innerHTML = `<p class="empty-state">No notes plotted yet.</p>`;
    return;
  }

  notesList.innerHTML = "";
  notes.forEach((note) => {
    const region = getRegion(note.point);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `note-card${note.id === activeNoteId ? " is-active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(note.title)}</strong>
      ${note.details ? `<p>${escapeHtml(note.details)}</p>` : ""}
      <span>${region.name} - ${formatPoint(note.point)}</span>
    `;
    button.addEventListener("click", () => selectNote(note.id));
    notesList.appendChild(button);
  });
}

function formatPoint(point) {
  return settings.axes.map((axis, index) => `${axis}: ${point[["x", "y", "z"][index]].toFixed(2)}`).join(" - ");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

function selectNote(id) {
  activeNoteId = id;
  const note = notes.find((item) => item.id === id);
  if (note) {
    const vector = normalize({
      x: note.point.x - 1,
      y: note.point.y - 1,
      z: note.point.z - 1,
    });
    if (vector) {
      yaw = Math.atan2(vector.x, vector.z) - Math.PI;
      pitch = Math.max(-0.95, Math.min(0.95, Math.asin(vector.y) * 0.8));
    }
  }
  updateActiveRegion();
  renderNotesList();
  drawScene();
}

function updateActiveRegion() {
  const note = notes.find((item) => item.id === activeNoteId);
  if (!note) {
    activeRegion.textContent = "No note selected";
    return;
  }

  const region = getRegion(note.point);
  activeRegion.textContent = `${note.title} - ${region.name}`;
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (!length) return null;
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function setupCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cellH = Math.max(10, Math.min(16, Math.floor(rect.height / 46)));
  cellW = Math.max(6, Math.floor(cellH * 0.62));
  gridCols = Math.max(24, Math.floor(rect.width / cellW));
  gridRows = Math.max(16, Math.floor(rect.height / cellH));
  drawScene();
}

function rotate(point) {
  const centered = {
    x: point.x - 1,
    y: point.y - 1,
    z: point.z - 1,
  };

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = centered.x * cosY - centered.z * sinY;
  const z1 = centered.x * sinY + centered.z * cosY;

  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const y2 = centered.y * cosX - z1 * sinX;
  const z2 = centered.y * sinX + z1 * cosX;

  return { x: x1, y: y2, z: z2 };
}

function project(point) {
  const rect = canvas.getBoundingClientRect();
  const rotated = rotate(point);
  const distance = 4.6;
  const scale = Math.min(rect.width, rect.height) * 0.34 * zoom;
  const perspective = distance / (distance - rotated.z);

  return {
    x: rect.width / 2 + rotated.x * scale * perspective,
    y: rect.height / 2 - rotated.y * scale * perspective,
    z: rotated.z,
    perspective,
  };
}

function toCell(point) {
  const projected = project(point);
  return {
    x: projected.x / cellW,
    y: projected.y / cellH,
    z: projected.z,
    perspective: projected.perspective,
  };
}

function createBuffer() {
  return {
    chars: Array.from({ length: gridRows }, () => Array(gridCols).fill(" ")),
    depths: Array.from({ length: gridRows }, () => Array(gridCols).fill(-Infinity)),
    colors: Array.from({ length: gridRows }, () => Array(gridCols).fill("#8b9aab")),
    cols: gridCols,
    rows: gridRows,
  };
}

function plotCell(buf, col, row, ch, depth, color) {
  if (col < 0 || row < 0 || col >= buf.cols || row >= buf.rows) return;
  if (depth >= buf.depths[row][col]) {
    buf.depths[row][col] = depth;
    buf.chars[row][col] = ch;
    buf.colors[row][col] = color;
  }
}

function shadeChar(z) {
  const t = (z + 1.6) / 3.2;
  const index = Math.max(0, Math.min(ASCII_RAMP.length - 1, Math.floor(t * ASCII_RAMP.length)));
  return ASCII_RAMP[index];
}

function lineChar(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ay < ax * 0.35) return "-";
  if (ax < ay * 0.35) return "|";
  return Math.sign(dx) === Math.sign(dy) ? "\\" : "/";
}

function edge(a, b, c) {
  return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

function fillTriangle(buf, a, b, c, color, ch) {
  const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
  const maxX = Math.min(buf.cols - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
  const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
  const maxY = Math.min(buf.rows - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
  const area = edge(a, b, c);
  if (Math.abs(area) < 0.0001) return;

  for (let row = minY; row <= maxY; row += 1) {
    for (let col = minX; col <= maxX; col += 1) {
      const point = { x: col + 0.5, y: row + 0.5 };
      const w0 = edge(b, c, point) / area;
      const w1 = edge(c, a, point) / area;
      const w2 = edge(a, b, point) / area;
      if (!((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0))) continue;
      const z = w0 * a.z + w1 * b.z + w2 * c.z;
      plotCell(buf, col, row, ch || shadeChar(z), z, color);
    }
  }
}

function fillQuad(buf, points, color, ch) {
  const cells = points.map(toCell);
  fillTriangle(buf, cells[0], cells[1], cells[2], color, ch);
  fillTriangle(buf, cells[0], cells[2], cells[3], color, ch);
}

function drawAsciiLine(buf, start, end, color, depthBias = 0.04) {
  const a = toCell(start);
  const b = toCell(end);
  let x0 = Math.round(a.x);
  let y0 = Math.round(a.y);
  const x1 = Math.round(b.x);
  const y1 = Math.round(b.y);
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  const steps = Math.max(dx, dy, 1);
  const glyph = lineChar(x1 - x0, y1 - y0);
  let i = 0;

  while (true) {
    const t = i / steps;
    const z = a.z + (b.z - a.z) * t + depthBias;
    const isEnd = (x0 === x1 && y0 === y1) || i === 0;
    plotCell(buf, x0, y0, isEnd ? "+" : glyph, z, color);
    if (x0 === x1 && y0 === y1) break;
    const twiceErr = 2 * err;
    if (twiceErr > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (twiceErr < dx) {
      err += dx;
      y0 += sy;
    }
    i += 1;
  }
}

function writeText(buf, text, x, y, color, depth = 8) {
  const clipped = text.length > 22 ? `${text.slice(0, 21)}.` : text;
  const start = Math.round(x - clipped.length / 2);
  const row = Math.round(y);
  for (let i = 0; i < clipped.length; i += 1) {
    plotCell(buf, start + i, row, clipped[i], depth, color);
  }
}

function blit(buf, rect) {
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.font = `${Math.floor(cellH * 0.92)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let row = 0; row < buf.rows; row += 1) {
    for (let col = 0; col < buf.cols; col += 1) {
      const ch = buf.chars[row][col];
      if (ch === " ") continue;
      ctx.fillStyle = buf.colors[row][col];
      ctx.fillText(ch, col * cellW, row * cellH);
    }
  }
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  hitTargets = [];
  const buf = createBuffer();

  drawShape(buf);
  drawTicksAndAxes(buf);
  drawShapeLabels(buf);
  drawNotes(buf);
  lastBuf = buf;
  blit(buf, rect);
}

function drawShape(buf) {
  const drawers = { burger: drawBurger, donut: drawDonut, leaf: drawLeaf, house: drawHouse };
  drawers[currentShape()](buf);
}

function drawShapeLabels(buf) {
  const labels = {
    burger: drawBurgerLabels,
    donut: drawDonutLabels,
    leaf: drawLeafLabels,
    house: drawHouseLabels,
  };
  labels[currentShape()](buf);
}

function ringPoint(angle, radius, y, cx = 1, cz = 1) {
  return {
    x: cx + Math.cos(angle) * radius,
    y,
    z: cz + Math.sin(angle) * radius,
  };
}

function burgerPoint(angle, radius, y) {
  return ringPoint(angle, radius, y, BURGER_CENTER.x, BURGER_CENTER.z);
}

function layerRadius(layer, angle) {
  if (!layer.wavy) return layer.radius;
  return layer.radius + 0.07 * Math.sin(angle * 6);
}

function fillDisc(buf, y, radius, color, fill) {
  const center = { x: BURGER_CENTER.x, y, z: BURGER_CENTER.z };
  for (let i = 0; i < BURGER_SEGMENTS; i += 1) {
    const a0 = (i / BURGER_SEGMENTS) * Math.PI * 2;
    const a1 = ((i + 1) / BURGER_SEGMENTS) * Math.PI * 2;
    fillQuad(buf, [center, burgerPoint(a0, radius, y), burgerPoint(a1, radius, y), center], color, fill);
  }
}

function drawBurger(buf) {
  for (const layer of BURGER_LAYERS) {
    const rings = layer.dome ? 4 : 1;
    for (let ring = 0; ring < rings; ring += 1) {
      const t0 = ring / rings;
      const t1 = (ring + 1) / rings;
      const y0 = layer.y0 + (layer.y1 - layer.y0) * t0;
      const y1 = layer.y0 + (layer.y1 - layer.y0) * t1;
      const r0 = layer.dome ? layer.radius * Math.cos(t0 * Math.PI * 0.48) : layer.radius;
      const r1 = layer.dome ? layer.radius * Math.cos(t1 * Math.PI * 0.48) : layer.radius;

      for (let i = 0; i < BURGER_SEGMENTS; i += 1) {
        const a0 = (i / BURGER_SEGMENTS) * Math.PI * 2;
        const a1 = ((i + 1) / BURGER_SEGMENTS) * Math.PI * 2;
        const p00 = burgerPoint(a0, layer.wavy ? layerRadius(layer, a0) : r0, y0);
        const p10 = burgerPoint(a1, layer.wavy ? layerRadius(layer, a1) : r0, y0);
        const p01 = burgerPoint(a0, layer.wavy ? layerRadius(layer, a0) : r1, y1);
        const p11 = burgerPoint(a1, layer.wavy ? layerRadius(layer, a1) : r1, y1);
        fillQuad(buf, [p00, p10, p11, p01], layer.color, layer.fill);
        drawAsciiLine(buf, p00, p10, layer.color, 0.05);
        drawAsciiLine(buf, p01, p11, layer.color, 0.05);
      }
    }

    fillDisc(buf, layer.y0, layer.radius, layer.color, layer.fill);
    fillDisc(buf, layer.y1, layer.dome ? layer.radius * 0.28 : layer.radius, layer.color, layer.fill);

    if (layer.sesame) {
      for (const [dx, dz] of SESAME_SEEDS) {
        const seed = { x: BURGER_CENTER.x + dx, y: layer.y1 - 0.06, z: BURGER_CENTER.z + dz };
        const cell = toCell(seed);
        plotCell(buf, Math.round(cell.x), Math.round(cell.y), "*", cell.z + 0.12, "#fff4c8");
      }
    }
  }
}

function drawBurgerLabels(buf) {
  for (const layer of BURGER_LAYERS) {
    if (layer.plate) continue;
    const point = {
      x: BURGER_CENTER.x + layer.radius + 0.22,
      y: (layer.y0 + layer.y1) / 2,
      z: BURGER_CENTER.z,
    };
    const cell = toCell(point);
    writeText(buf, `[${layer.name}]`, cell.x, cell.y, layer.color, 7);
  }
}

function torusPoint(u, v, R = 0.72, r = 0.3) {
  return {
    x: 1 + (R + r * Math.cos(v)) * Math.cos(u),
    y: 1 + r * Math.sin(v),
    z: 1 + (R + r * Math.cos(v)) * Math.sin(u),
  };
}

function drawDonut(buf) {
  const uSeg = 20;
  const vSeg = 12;
  for (let i = 0; i < uSeg; i += 1) {
    for (let j = 0; j < vSeg; j += 1) {
      const u0 = (i / uSeg) * Math.PI * 2;
      const u1 = ((i + 1) / uSeg) * Math.PI * 2;
      const v0 = (j / vSeg) * Math.PI * 2;
      const v1 = ((j + 1) / vSeg) * Math.PI * 2;
      const glazed = Math.sin((v0 + v1) / 2) > 0.12;
      const color = glazed ? "#f4a6c1" : "#d4a574";
      const fill = glazed ? "@" : "O";
      fillQuad(buf, [torusPoint(u0, v0), torusPoint(u1, v0), torusPoint(u1, v1), torusPoint(u0, v1)], color, fill);
    }
  }

  const sprinkles = [
    [0.2, 0.9, "#ff6b6b"],
    [1.1, 0.7, "#7dd3fc"],
    [2.4, 1.2, "#ffe66d"],
    [3.6, 0.5, "#ffffff"],
    [4.8, 1.0, "#ff8fab"],
    [5.5, 0.8, "#bde0fe"],
  ];
  for (const [u, v, color] of sprinkles) {
    const seed = torusPoint(u, v, 0.72, 0.34);
    const cell = toCell(seed);
    plotCell(buf, Math.round(cell.x), Math.round(cell.y), "*", cell.z + 0.12, color);
  }
}

function drawDonutLabels(buf) {
  const tags = [
    { text: "[glaze]", point: torusPoint(0.4, 1.2), color: "#f4a6c1" },
    { text: "[dough]", point: torusPoint(3.4, 4.2), color: "#d4a574" },
    { text: "[hole]", point: { x: 1, y: 1, z: 1 }, color: "#9aa7b5" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function leafPoint(t, s) {
  const y = 0.1 + t * 1.84;
  const width = Math.sin(Math.PI * Math.max(0.02, Math.min(0.98, t))) * (0.62 + 0.1 * Math.sin(t * 10));
  return {
    x: 1 + s * width,
    y,
    z: 1 + 0.2 * Math.sin(Math.PI * t) + s * s * 0.05,
  };
}

function drawLeaf(buf) {
  const tSeg = 14;
  const sSeg = 8;
  for (let i = 0; i < tSeg; i += 1) {
    for (let j = 0; j < sSeg; j += 1) {
      const t0 = i / tSeg;
      const t1 = (i + 1) / tSeg;
      const s0 = -1 + (2 * j) / sSeg;
      const s1 = -1 + (2 * (j + 1)) / sSeg;
      const color = Math.abs((s0 + s1) / 2) < 0.12 ? "#2f7a3a" : "#5dce6a";
      const fill = Math.abs((s0 + s1) / 2) < 0.12 ? "|" : "~";
      fillQuad(buf, [leafPoint(t0, s0), leafPoint(t1, s0), leafPoint(t1, s1), leafPoint(t0, s1)], color, fill);
    }
  }

  drawAsciiLine(buf, { x: 1, y: 0.02, z: 1 }, { x: 1, y: 0.18, z: 1 }, "#8b5a2b", 0.08);
  drawAsciiLine(buf, leafPoint(0.02, 0), leafPoint(0.98, 0), "#2f7a3a", 0.08);
}

function drawLeafLabels(buf) {
  const tags = [
    { text: "[stem]", point: { x: 1, y: 0.08, z: 1.12 }, color: "#8b5a2b" },
    { text: "[blade]", point: leafPoint(0.45, 0.9), color: "#5dce6a" },
    { text: "[tip]", point: leafPoint(0.96, 0), color: "#7dff6b" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function drawBox(buf, x0, x1, y0, y1, z0, z1, color, fill) {
  const p = (x, y, z) => ({ x, y, z });
  const faces = [
    [p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0)],
    [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)],
    [p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, z1), p(x0, y0, z1)],
    [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)],
    [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)],
    [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)],
  ];
  for (const face of faces) {
    fillQuad(buf, face, color, fill);
  }
  const corners = [
    p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0),
    p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1),
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  for (const [a, b] of edges) {
    drawAsciiLine(buf, corners[a], corners[b], color, 0.06);
  }
}

function drawHouse(buf) {
  drawBox(buf, 0.38, 1.62, 0.02, 1.18, 0.42, 1.58, "#e8dcc8", "#");
  const ridgeF = { x: 1, y: 1.88, z: 1.58 };
  const ridgeB = { x: 1, y: 1.88, z: 0.42 };
  const eaveLF = { x: 0.22, y: 1.16, z: 1.58 };
  const eaveRF = { x: 1.78, y: 1.16, z: 1.58 };
  const eaveLB = { x: 0.22, y: 1.16, z: 0.42 };
  const eaveRB = { x: 1.78, y: 1.16, z: 0.42 };
  fillQuad(buf, [eaveLF, ridgeF, ridgeB, eaveLB], "#c23b22", "A");
  fillQuad(buf, [eaveRF, ridgeF, ridgeB, eaveRB], "#a8321c", "A");
  fillQuad(buf, [eaveLF, ridgeF, eaveRF, eaveLF], "#e05a3c", "/");
  fillQuad(buf, [eaveLB, ridgeB, eaveRB, eaveLB], "#9a2e1a", "/");
  drawBox(buf, 0.86, 1.14, 0.02, 0.58, 1.52, 1.62, "#6b3a2a", "H");
  drawBox(buf, 0.48, 0.74, 0.62, 0.92, 1.54, 1.61, "#7dd3fc", "o");
  drawBox(buf, 1.26, 1.52, 0.62, 0.92, 1.54, 1.61, "#7dd3fc", "o");
  drawBox(buf, 1.32, 1.52, 1.42, 1.98, 0.5, 0.72, "#8a8a8a", "|");
}

function drawHouseLabels(buf) {
  const tags = [
    { text: "[roof]", point: { x: 1, y: 1.7, z: 1.72 }, color: "#c23b22" },
    { text: "[door]", point: { x: 1, y: 0.3, z: 1.72 }, color: "#6b3a2a" },
    { text: "[chimney]", point: { x: 1.62, y: 1.8, z: 0.6 }, color: "#b0b0b0" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function drawTicksAndAxes(buf) {
  const axes = [
    { name: settings.axes[0], points: [{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }], key: "x" },
    { name: settings.axes[1], points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }], key: "y" },
    { name: settings.axes[2], points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }], key: "z" },
  ];

  for (const axis of axes) {
    drawAsciiLine(buf, axis.points[0], axis.points[1], "#ffc857", 0.09);
    for (const tick of [0, 1, 2]) {
      const point = { x: 0, y: 0, z: 0 };
      point[axis.key] = tick;
      const cell = toCell(point);
      writeText(buf, String(tick), cell.x, cell.y + 1.2, "#c5d0dc", 9);
    }

    const labelPoint = { ...axis.points[1] };
    labelPoint[axis.key] += 0.28;
    const projected = toCell(labelPoint);
    writeText(buf, axis.name, projected.x, projected.y, "#ffc857", 10);
  }
}

function drawNotes(buf) {
  const ordered = [...notes].sort((a, b) => toCell(a.point).z - toCell(b.point).z);

  for (const note of ordered) {
    const cell = toCell(note.point);
    const region = getRegion(note.point);
    const col = Math.round(cell.x);
    const row = Math.round(cell.y);
    const selected = note.id === activeNoteId;
    const glyph = selected ? "@" : "o";
    plotCell(buf, col, row, glyph, cell.z + 0.2, selected ? "#ffffff" : region.color);

    if (selected) {
      plotCell(buf, col - 1, row, "[", cell.z + 0.2, "#ffffff");
      plotCell(buf, col + 1, row, "]", cell.z + 0.2, "#ffffff");
      writeText(buf, note.title, cell.x, cell.y - 1.4, "#ffffff", 12);
    }

    hitTargets.push({
      id: note.id,
      x: col * cellW + cellW / 2,
      y: row * cellH + cellH / 2,
      radius: Math.max(cellW, cellH) * 1.6,
    });
  }
}

function hoverLockEnabled(event) {
  if (event?.pointerType === "mouse" || event?.pointerType === "pen") return true;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function isOnShape(clientX, clientY) {
  if (!lastBuf) return false;
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((clientX - rect.left) / cellW);
  const row = Math.floor((clientY - rect.top) / cellH);
  for (let dr = -2; dr <= 2; dr += 1) {
    for (let dc = -2; dc <= 2; dc += 1) {
      const ch = lastBuf.chars[row + dr]?.[col + dc];
      if (ch && ch !== " ") return true;
    }
  }
  return false;
}

function setRotateLock({ hover, sticky } = {}) {
  const nextHover = hover == null ? hoverLocked : hover;
  const nextSticky = sticky == null ? stickyLock : sticky;
  const nextLocked = Boolean(nextSticky || nextHover);
  if (nextHover === hoverLocked && nextSticky === stickyLock && nextLocked === rotateLocked) return;
  hoverLocked = nextHover;
  stickyLock = nextSticky;
  rotateLocked = nextLocked;
  cubePanel.classList.toggle("is-locked", rotateLocked);
  lockRotate.textContent = rotateLocked ? "[ UNLOCK ]" : "[ LOCK ]";
  lockRotate.setAttribute("aria-pressed", rotateLocked ? "true" : "false");
  canvasHint.textContent = rotateLocked
    ? `Locked. Swipe to rotate. Tap empty space to unlock. Click @ or o to select.`
    : `Hover or tap the ${shapeNoun()} to lock, then swipe to rotate.`;
  if (!rotateLocked) {
    yawVel = 0;
    pitchVel = 0;
  }
}

function startSpin() {
  if (spinFrame) return;
  const tick = () => {
    if (dragState || !rotateLocked || (Math.abs(yawVel) < 0.0005 && Math.abs(pitchVel) < 0.0005)) {
      yawVel = 0;
      pitchVel = 0;
      spinFrame = 0;
      return;
    }
    yaw += yawVel;
    pitch = Math.max(-1.15, Math.min(1.15, pitch + pitchVel));
    yawVel *= 0.9;
    pitchVel *= 0.9;
    drawScene();
    spinFrame = requestAnimationFrame(tick);
  };
  spinFrame = requestAnimationFrame(tick);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function openSettingsDialog() {
  renderSettingsForm();
  settingsDialog.showModal();
}

function hitNoteAt(x, y) {
  return [...hitTargets].reverse().find((target) => Math.hypot(target.x - x, target.y - y) <= target.radius);
}

function endPointer(event) {
  if (dragState && rotateLocked && dragState.moved) {
    startSpin();
  }

  if (dragState && !dragState.moved) {
    const pos = pointerPosition(event);
    const hit = hitNoteAt(pos.x, pos.y);
    const onBurger = isOnShape(event.clientX, event.clientY);
    if (hit) {
      selectNote(hit.id);
    } else if (hoverLockEnabled(event)) {
      setRotateLock({ sticky: false, hover: onBurger });
    } else {
      setRotateLock({ sticky: onBurger, hover: false });
    }
  }

  if (event.pointerId != null) {
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  }
  dragState = null;
}

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#noteTitle").value.trim();
  const details = document.querySelector("#noteDetails").value.trim();
  if (!title) return;

  const note = {
    id: nextNoteId++,
    title,
    details,
    point: {
      x: Number(document.querySelector("#xScore").value),
      y: Number(document.querySelector("#yScore").value),
      z: Number(document.querySelector("#zScore").value),
    },
  };

  notes.push(note);
  noteForm.reset();
  for (const key of ["x", "y", "z"]) {
    document.querySelector(`#${key}Score`).value = 1;
    updateSliderReadout(key);
  }
  selectNote(note.id);
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  settings.axes = currentModalAxes();

  regionSettings.querySelectorAll("[data-region-key]").forEach((input) => {
    settings.regions[input.dataset.regionKey] = input.value.trim() || defaultSettings.regions[input.dataset.regionKey];
  });

  saveSettings();
  settingsDialog.close();
  renderSliders();
  renderNotesList();
  updateActiveRegion();
  drawScene();
});

openSettings.addEventListener("click", openSettingsDialog);
closeSettings.addEventListener("click", () => settingsDialog.close());
for (const selector of ["#axisX", "#axisY", "#axisZ"]) {
  document.querySelector(selector).addEventListener("input", updateModalRegionDescriptions);
}
resetLabels.addEventListener("click", () => {
  settings = structuredClone(defaultSettings);
  renderSettingsForm();
});
resetView.addEventListener("click", () => {
  yaw = -0.9;
  pitch = 0.38;
  zoom = 1;
  yawVel = 0;
  pitchVel = 0;
  drawScene();
});
lockRotate.addEventListener("click", () => {
  setRotateLock({ sticky: !stickyLock });
});

canvas.addEventListener("pointerdown", (event) => {
  yawVel = 0;
  pitchVel = 0;
  const onBurger = isOnShape(event.clientX, event.clientY);
  if (onBurger) {
    if (hoverLockEnabled(event)) setRotateLock({ hover: true });
    else setRotateLock({ sticky: true });
  }
  dragState = {
    x: event.clientX,
    y: event.clientY,
    moved: false,
  };
  if (rotateLocked) {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragState) {
    if (hoverLockEnabled(event)) {
      setRotateLock({ hover: isOnShape(event.clientX, event.clientY) });
    }
    return;
  }

  const dx = event.clientX - dragState.x;
  const dy = event.clientY - dragState.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) {
    dragState.moved = true;
  }

  if (!rotateLocked) return;

  event.preventDefault();
  const stepYaw = dx * 0.012;
  const stepPitch = dy * 0.012;
  yaw -= stepYaw;
  pitch = Math.max(-1.15, Math.min(1.15, pitch + stepPitch));
  yawVel = -stepYaw;
  pitchVel = stepPitch;
  dragState.x = event.clientX;
  dragState.y = event.clientY;
  drawScene();
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    zoom = Math.max(0.55, Math.min(2.2, zoom - event.deltaY * 0.001));
    drawScene();
  },
  { passive: false },
);

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", () => {
  if (!dragState) {
    setRotateLock({ hover: false });
  }
});

window.addEventListener("resize", setupCanvasSize);

renderSliders();
renderNotesList();
renderShapePicker();
applyShapeCopy();
updateActiveRegion();
setupCanvasSize();

if (!localStorage.getItem(STORAGE_KEY)) {
  openSettingsDialog();
}
