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
    label: "Flag",
    noun: "flag",
    title: "Plot ideas on a 0-2 Canadian flag",
    eyebrow: "3 Axis Notes // ASCII Flag",
    intro: "Add notes with scores from 0 to 2. Each point lands on the Canadian flag, inside one of eight labeled low/high octants.",
    space: "0-2 flag space",
  },
  house: {
    id: "house",
    label: "House",
    noun: "house",
    title: "Plot ideas on a 0-2 house",
    eyebrow: "3 Axis Notes // ASCII House",
    intro: "Add notes with scores from 0 to 2. Each point lands in the lit mansion, inside one of eight labeled low/high octants.",
    space: "0-2 house space",
  },
  cart: {
    id: "cart",
    label: "Cart",
    noun: "cart",
    title: "Plot ideas on a 0-2 shopping cart",
    eyebrow: "3 Axis Notes // ASCII Cart",
    intro: "Add notes with scores from 0 to 2. Each point lands in the red grocery cart, inside one of eight labeled low/high octants.",
    space: "0-2 cart space",
  },
  drone: {
    id: "drone",
    label: "Drone",
    noun: "drone",
    title: "Plot ideas on a 0-2 drone",
    eyebrow: "3 Axis Notes // ASCII Drone",
    intro: "Add notes with scores from 0 to 2. Each point lands on the tiny whoop, inside one of eight labeled low/high octants.",
    space: "0-2 drone space",
  },
  truck: {
    id: "truck",
    label: "Truck",
    noun: "truck",
    title: "Plot ideas on a 0-2 truck",
    eyebrow: "3 Axis Notes // ASCII Truck",
    intro: "Add notes with scores from 0 to 2. Each point lands on the silver Toyota flatbed, inside one of eight labeled low/high octants.",
    space: "0-2 truck space",
  },
  roo: {
    id: "roo",
    label: "Roo",
    noun: "kangaroo",
    title: "Plot ideas on a 0-2 kangaroo",
    eyebrow: "3 Axis Notes // ASCII Roo",
    intro: "Add notes with scores from 0 to 2. Each point lands on the onsen kangaroo, inside one of eight labeled low/high octants.",
    space: "0-2 kangaroo space",
  },
  wolf: {
    id: "wolf",
    label: "Wolf",
    noun: "wolf",
    title: "Plot ideas on a 0-2 wolf",
    eyebrow: "3 Axis Notes // ASCII Wolf",
    intro: "Add notes with scores from 0 to 2. Each point lands on the wolf figure, inside one of eight labeled low/high octants.",
    space: "0-2 wolf space",
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
  const drawers = {
    burger: drawBurger,
    donut: drawDonut,
    leaf: drawLeaf,
    house: drawHouse,
    cart: drawCart,
    drone: drawDrone,
    truck: drawTruck,
    roo: drawRoo,
    wolf: drawWolf,
  };
  drawers[currentShape()](buf);
}

function drawShapeLabels(buf) {
  const labels = {
    burger: drawBurgerLabels,
    donut: drawDonutLabels,
    leaf: drawLeafLabels,
    house: drawHouseLabels,
    cart: drawCartLabels,
    drone: drawDroneLabels,
    truck: drawTruckLabels,
    roo: drawRooLabels,
    wolf: drawWolfLabels,
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
  fillDiscAt(buf, BURGER_CENTER.x, y, BURGER_CENTER.z, radius, color, fill, BURGER_SEGMENTS);
}

function fillDiscAt(buf, cx, y, cz, radius, color, fill, segments = 12) {
  const center = { x: cx, y, z: cz };
  for (let i = 0; i < segments; i += 1) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    fillQuad(buf, [center, ringPoint(a0, radius, y, cx, cz), ringPoint(a1, radius, y, cx, cz), center], color, fill);
  }
}

function stackDiscs(buf, cx, y0, y1, cz, r0, r1, color, fill, layers = 8, segments = 12) {
  for (let i = 0; i < layers; i += 1) {
    const t = i / Math.max(1, layers - 1);
    fillDiscAt(buf, cx, y0 + (y1 - y0) * t, cz, r0 + (r1 - r0) * t, color, fill, segments);
  }
}

function ellipsoidPoint(u, v, cx, cy, cz, rx, ry, rz, bulge = 0) {
  const sinV = Math.sin(v);
  const cosV = Math.cos(v);
  const inflate = 1 + bulge * Math.max(0, sinV);
  return {
    x: cx + rx * inflate * sinV * Math.cos(u),
    y: cy + ry * cosV,
    z: cz + rz * inflate * sinV * Math.sin(u),
    nx: sinV * Math.cos(u),
    ny: cosV,
    nz: sinV * Math.sin(u),
  };
}

function fillEllipsoid(buf, cx, cy, cz, rx, ry, rz, color, fill = "O", opts = {}) {
  const uSeg = opts.uSeg || 16;
  const vSeg = opts.vSeg || 12;
  const bulge = opts.bulge || 0;
  const hi = opts.highlight || "#fff6e8";
  const gloss = opts.gloss ?? 0.48;
  const hot = opts.hot ?? 0.74;
  const light = opts.light || { x: 0.28, y: 0.72, z: 0.64 };
  const len = Math.hypot(light.x, light.y, light.z) || 1;
  const lx = light.x / len;
  const ly = light.y / len;
  const lz = light.z / len;
  for (let i = 0; i < uSeg; i += 1) {
    for (let j = 0; j < vSeg; j += 1) {
      const u0 = (i / uSeg) * Math.PI * 2;
      const u1 = ((i + 1) / uSeg) * Math.PI * 2;
      const v0 = (j / vSeg) * Math.PI;
      const v1 = ((j + 1) / vSeg) * Math.PI;
      const p00 = ellipsoidPoint(u0, v0, cx, cy, cz, rx, ry, rz, bulge);
      const p10 = ellipsoidPoint(u1, v0, cx, cy, cz, rx, ry, rz, bulge);
      const p11 = ellipsoidPoint(u1, v1, cx, cy, cz, rx, ry, rz, bulge);
      const p01 = ellipsoidPoint(u0, v1, cx, cy, cz, rx, ry, rz, bulge);
      const nx = (p00.nx + p10.nx + p11.nx + p01.nx) / 4;
      const ny = (p00.ny + p10.ny + p11.ny + p01.ny) / 4;
      const nz = (p00.nz + p10.nz + p11.nz + p01.nz) / 4;
      const shine = nx * lx + ny * ly + nz * lz;
      const glyph = shine > hot ? "*" : shine > gloss ? "o" : fill;
      fillQuad(buf, [p00, p10, p11, p01], shine > gloss ? hi : color, glyph);
    }
  }
}

function lerp3(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function quadPoint(p00, p10, p01, p11, u, v) {
  return lerp3(lerp3(p00, p10, u), lerp3(p01, p11, u), v);
}

function cartOvalHole(u, v, cols, rows) {
  const mu = 0.07;
  const mv = 0.1;
  if (u < mu || u > 1 - mu || v < mv || v > 1 - mv) return false;
  const uu = (u - mu) / (1 - 2 * mu);
  const vv = (v - mv) / (1 - 2 * mv);
  const col = Math.min(cols - 1, Math.floor(uu * cols));
  const row = Math.min(rows - 1, Math.floor(vv * rows));
  const dx = (uu - (col + 0.5) / cols) * cols;
  const dy = (vv - (row + 0.5) / rows) * rows;
  return (dx * dx) / (0.27 * 0.27) + (dy * dy) / (0.4 * 0.4) < 1;
}

function fillTriangleUV(buf, a, b, c, ua, va, ub, vb, uc, vc, color, ch, holeTest) {
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
      const u = w0 * ua + w1 * ub + w2 * uc;
      const v = w0 * va + w1 * vb + w2 * vc;
      if (holeTest?.(u, v)) continue;
      const z = w0 * a.z + w1 * b.z + w2 * c.z;
      plotCell(buf, col, row, ch || shadeChar(z), z, color);
    }
  }
}

function drawPerforatedQuad(buf, p00, p10, p11, p01, color, fill, cols, rows, holeTest) {
  const c00 = toCell(p00);
  const c10 = toCell(p10);
  const c11 = toCell(p11);
  const c01 = toCell(p01);
  const test = holeTest || ((u, v) => cartOvalHole(u, v, cols, rows));
  fillTriangleUV(buf, c00, c10, c11, 0, 0, 1, 0, 1, 1, color, fill, test);
  fillTriangleUV(buf, c00, c11, c01, 0, 0, 1, 1, 0, 1, color, fill, test);
}

function drawTube(buf, start, end, color) {
  const offsets = [
    { x: 0, y: 0, z: 0 },
    { x: 0.045, y: 0.02, z: 0.02 },
    { x: -0.03, y: 0.035, z: -0.02 },
    { x: 0.02, y: -0.03, z: 0.03 },
  ];
  for (const o of offsets) {
    drawAsciiLine(
      buf,
      { x: start.x + o.x, y: start.y + o.y, z: start.z + o.z },
      { x: end.x + o.x, y: end.y + o.y, z: end.z + o.z },
      color,
      0.1,
    );
  }
}

function drawWheelYZ(buf, x, cy, cz, radius, thickness = 0.08, caster = false) {
  const tire = "#3a3a3a";
  const hub = "#9aa3ad";
  const fork = "#c5cdd4";
  const segments = 11;
  for (const ox of [-thickness / 2, thickness / 2]) {
    const wx = x + ox;
    const center = { x: wx, y: cy, z: cz };
    for (let i = 0; i < segments; i += 1) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const outer0 = { x: wx, y: cy + Math.cos(a0) * radius, z: cz + Math.sin(a0) * radius };
      const outer1 = { x: wx, y: cy + Math.cos(a1) * radius, z: cz + Math.sin(a1) * radius };
      const inner0 = { x: wx, y: cy + Math.cos(a0) * radius * 0.42, z: cz + Math.sin(a0) * radius * 0.42 };
      const inner1 = { x: wx, y: cy + Math.cos(a1) * radius * 0.42, z: cz + Math.sin(a1) * radius * 0.42 };
      fillQuad(buf, [outer0, outer1, inner1, inner0], tire, "o");
      fillQuad(buf, [center, inner0, inner1, center], hub, "*");
    }
  }
  if (caster) {
    const top = { x, y: cy + radius + 0.18, z: cz };
    drawTube(buf, { x, y: cy + radius * 0.2, z: cz - radius * 0.55 }, top, fork);
    drawTube(buf, { x, y: cy + radius * 0.2, z: cz + radius * 0.55 }, top, fork);
    drawTube(buf, top, { x, y: top.y + 0.08, z: cz }, fork);
  }
}

function drawWheelXY(buf, cx, cy, z, radius, thickness = 0.1) {
  const tire = "#1a1a1a";
  const rim = "#2e2e32";
  const segments = 11;
  for (const oz of [-thickness / 2, thickness / 2]) {
    const wz = z + oz;
    const center = { x: cx, y: cy, z: wz };
    for (let i = 0; i < segments; i += 1) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const outer0 = { x: cx + Math.cos(a0) * radius, y: cy + Math.sin(a0) * radius, z: wz };
      const outer1 = { x: cx + Math.cos(a1) * radius, y: cy + Math.sin(a1) * radius, z: wz };
      const inner0 = { x: cx + Math.cos(a0) * radius * 0.42, y: cy + Math.sin(a0) * radius * 0.42, z: wz };
      const inner1 = { x: cx + Math.cos(a1) * radius * 0.42, y: cy + Math.sin(a1) * radius * 0.42, z: wz };
      fillQuad(buf, [outer0, outer1, inner1, inner0], tire, "o");
      fillQuad(buf, [center, inner0, inner1, center], rim, "*");
    }
  }
}

function writeOnMesh(buf, text, point, color) {
  const cell = toCell(point);
  const start = Math.round(cell.x - text.length / 2);
  const row = Math.round(cell.y);
  for (let i = 0; i < text.length; i += 1) {
    plotCell(buf, start + i, row, text[i], cell.z + 0.16, color);
  }
}

function drawLitWindow(buf, x0, x1, y0, y1, z0, z1, arched = false) {
  const glow = "#ffd056";
  const pane = "#ffe38a";
  drawBox(buf, x0, x1, y0, y1, z0, z1, glow, "o");
  if (arched) {
    const mid = (x0 + x1) / 2;
    const z = (z0 + z1) / 2;
    fillQuad(
      buf,
      [
        { x: x0, y: y1, z },
        { x: x1, y: y1, z },
        { x: mid, y: y1 + (y1 - y0) * 0.35, z },
        { x: x0, y: y1, z },
      ],
      pane,
      "o",
    );
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

const MAPLE_SVG = [
  [512, 32],
  [599, 249],
  [837, 194],
  [720, 394],
  [944, 487],
  [720, 580],
  [837, 780],
  [599, 725],
  [512, 942],
  [425, 725],
  [187, 780],
  [304, 580],
  [80, 487],
  [304, 394],
  [187, 194],
  [425, 249],
];

function mapleWorld(sx, sy, z = 1) {
  const scale = 0.0007;
  return {
    x: 1 + (sx - 512) * scale,
    y: 1.02 + (487 - sy) * scale,
    z,
  };
}

const MAPLE_POLY = MAPLE_SVG.map(([sx, sy]) => mapleWorld(sx, sy));

function pointInMaple(x, y) {
  let inside = false;
  for (let i = 0, j = MAPLE_POLY.length - 1; i < MAPLE_POLY.length; j = i, i += 1) {
    const a = MAPLE_POLY[i];
    const b = MAPLE_POLY[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function fillFlagRect(buf, x0, x1, y0, y1, z, color, fill, nx, ny) {
  for (let i = 0; i < nx; i += 1) {
    for (let j = 0; j < ny; j += 1) {
      const xa = x0 + ((x1 - x0) * i) / nx;
      const xb = x0 + ((x1 - x0) * (i + 1)) / nx;
      const ya = y0 + ((y1 - y0) * j) / ny;
      const yb = y0 + ((y1 - y0) * (j + 1)) / ny;
      fillQuad(
        buf,
        [
          { x: xa, y: ya, z },
          { x: xb, y: ya, z },
          { x: xb, y: yb, z },
          { x: xa, y: yb, z },
        ],
        color,
        fill,
      );
    }
  }
}

function drawLeaf(buf) {
  const red = "#ff0000";
  const white = "#f4f4f4";
  const x0 = 0.08;
  const x1 = 1.92;
  const y0 = 0.52;
  const y1 = 1.48;
  const z0 = 0.92;
  const z1 = 1.08;
  const pale = (x1 - x0) / 4;
  const left = x0 + pale;
  const right = x1 - pale;

  drawBox(buf, x0, left, y0, y1, z0, z1, red, "#");
  drawBox(buf, left, right, y0, y1, z0, z1, white, "=");
  drawBox(buf, right, x1, y0, y1, z0, z1, red, "#");
  fillFlagRect(buf, x0, left, y0, y1, z1 + 0.01, red, "#", 4, 10);
  fillFlagRect(buf, left, right, y0, y1, z1 + 0.01, white, "=", 10, 10);
  fillFlagRect(buf, right, x1, y0, y1, z1 + 0.01, red, "#", 4, 10);
  fillFlagRect(buf, x0, left, y0, y1, z0 - 0.01, red, "#", 4, 10);
  fillFlagRect(buf, left, right, y0, y1, z0 - 0.01, white, "=", 10, 10);
  fillFlagRect(buf, right, x1, y0, y1, z0 - 0.01, red, "#", 4, 10);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of MAPLE_POLY) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const nx = 30;
  const ny = 34;
  for (let i = 0; i < nx; i += 1) {
    for (let j = 0; j < ny; j += 1) {
      const xa = minX + ((maxX - minX) * i) / nx;
      const xb = minX + ((maxX - minX) * (i + 1)) / nx;
      const ya = minY + ((maxY - minY) * j) / ny;
      const yb = minY + ((maxY - minY) * (j + 1)) / ny;
      if (!pointInMaple((xa + xb) / 2, (ya + yb) / 2)) continue;
      fillQuad(
        buf,
        [
          { x: xa, y: ya, z: z1 + 0.03 },
          { x: xb, y: ya, z: z1 + 0.03 },
          { x: xb, y: yb, z: z1 + 0.03 },
          { x: xa, y: yb, z: z1 + 0.03 },
        ],
        red,
        "#",
      );
    }
  }
  for (let i = 0; i < MAPLE_POLY.length; i += 1) {
    const a = MAPLE_POLY[i];
    const b = MAPLE_POLY[(i + 1) % MAPLE_POLY.length];
    drawAsciiLine(buf, { ...a, z: z1 + 0.04 }, { ...b, z: z1 + 0.04 }, red, 0.12);
  }
}

function drawLeafLabels(buf) {
  const tags = [
    { text: "[pale]", point: { x: 0.22, y: 1.05, z: 1.16 }, color: "#ff4d4d" },
    { text: "[maple]", point: { x: 1, y: 1.22, z: 1.16 }, color: "#ff0000" },
    { text: "[field]", point: { x: 1.05, y: 0.64, z: 1.16 }, color: "#f4f4f4" },
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
  const stone = "#e6d4b8";
  const stoneDim = "#cbb694";
  const brick = "#b46348";
  const rail = "#d5dde4";
  const glow = "#ffd056";

  for (let i = 0; i < 10; i += 1) {
    const z0 = 1.5 + i * 0.045;
    const z1 = z0 + 0.045;
    fillQuad(
      buf,
      [
        { x: 0.12, y: 0.02, z: z0 },
        { x: 1.88, y: 0.02, z: z0 },
        { x: 1.88, y: 0.02, z: z1 },
        { x: 0.12, y: 0.02, z: z1 },
      ],
      i % 2 === 0 ? "#2f6d3c" : "#3d8750",
      i % 2 === 0 ? "/" : "\\",
    );
  }

  drawBox(buf, 0.28, 1.72, 0.02, 0.42, 0.52, 1.46, "#4a5560", "#");
  drawBox(buf, 0.38, 1.62, 0.08, 0.38, 1.44, 1.52, "#8fd4ea", "o");
  for (const x of [0.48, 0.72, 0.96, 1.2, 1.44]) {
    drawLitWindow(buf, x, x + 0.16, 0.1, 0.34, 1.5, 1.54, false);
  }
  drawBox(buf, 0.42, 0.7, 0.04, 0.14, 1.54, 1.72, "#1f242b", "=");
  drawBox(buf, 0.78, 1.06, 0.04, 0.14, 1.54, 1.72, "#1f242b", "=");
  drawBox(buf, 1.14, 1.42, 0.04, 0.12, 1.58, 1.7, "#f2f2f2", "=");

  drawBox(buf, 0.16, 1.84, 0.4, 0.5, 0.48, 1.66, stone, "=");
  drawBox(buf, 0.16, 1.84, 0.5, 0.64, 1.62, 1.68, rail, "|");
  for (const x of [0.22, 0.52, 0.82, 1.12, 1.42, 1.72]) {
    drawBox(buf, x - 0.03, x + 0.03, 0.5, 0.66, 1.62, 1.7, stoneDim, "+");
  }

  for (let step = 0; step < 5; step += 1) {
    const t = step / 5;
    const y1 = 0.48 - t * 0.42;
    const y0 = y1 - 0.08;
    const z0 = 1.66 + t * 0.22;
    const z1 = z0 + 0.08;
    drawBox(buf, 0.28, 0.52, y0, y1, z0, z1, stoneDim, "=");
    drawBox(buf, 1.48, 1.72, y0, y1, z0, z1, stoneDim, "=");
  }

  drawBox(buf, 0.22, 1.78, 0.48, 1.52, 0.46, 1.46, stone, "#");
  drawBox(buf, 0.22, 0.5, 0.48, 1.46, 0.5, 1.44, brick, "#");
  drawBox(buf, 1.5, 1.78, 0.48, 1.46, 0.5, 1.44, brick, "#");
  drawBox(buf, 0.7, 1.3, 0.48, 1.54, 1.38, 1.54, stone, "#");

  const pedL = { x: 0.7, y: 1.54, z: 1.54 };
  const pedR = { x: 1.3, y: 1.54, z: 1.54 };
  const pedPeak = { x: 1, y: 1.9, z: 1.54 };
  const pedLb = { x: 0.72, y: 1.54, z: 1.4 };
  const pedRb = { x: 1.28, y: 1.54, z: 1.4 };
  const pedPeakB = { x: 1, y: 1.86, z: 1.4 };
  fillQuad(buf, [pedL, pedPeak, pedR, pedL], "#f3e6cc", "A");
  fillQuad(buf, [pedLb, pedPeakB, pedRb, pedLb], stoneDim, "A");
  fillQuad(buf, [pedL, pedPeak, pedPeakB, pedLb], glow, "/");
  fillQuad(buf, [pedR, pedPeak, pedPeakB, pedRb], "#ffe08a", "/");

  drawBox(buf, 0.82, 1.18, 1.02, 1.16, 1.52, 1.66, stoneDim, "=");
  drawBox(buf, 0.82, 1.18, 1.16, 1.26, 1.62, 1.68, "#3a424c", "|");

  const facadeZ0 = 1.46;
  const facadeZ1 = 1.52;
  const bays = [0.3, 0.52, 0.76, 1.08, 1.32, 1.54];
  for (const x of bays) {
    drawLitWindow(buf, x, x + 0.16, 0.58, 0.98, facadeZ0, facadeZ1, true);
    drawLitWindow(buf, x + 0.02, x + 0.14, 1.2, 1.4, facadeZ0, facadeZ1, false);
  }
  for (const x of [0.26, 0.48, 0.7, 1.02, 1.26, 1.48, 1.7]) {
    drawBox(buf, x - 0.025, x + 0.025, 0.5, 1.48, 1.42, 1.5, stoneDim, "|");
  }

  drawBox(buf, 0.2, 1.8, 1.5, 1.6, 0.44, 1.48, stoneDim, "=");
  for (const x of [0.24, 0.56, 0.88, 1.12, 1.44, 1.76]) {
    drawBox(buf, x - 0.03, x + 0.03, 1.58, 1.7, 1.42, 1.5, stone, "+");
    const lamp = toCell({ x, y: 1.72, z: 1.48 });
    plotCell(buf, Math.round(lamp.x), Math.round(lamp.y), "*", lamp.z + 0.1, glow);
  }
  for (const [x, z] of [
    [0.38, 0.62],
    [1.62, 0.62],
    [0.38, 1.22],
    [1.62, 1.22],
  ]) {
    drawBox(buf, x - 0.08, x + 0.08, 1.56, 1.94, z - 0.08, z + 0.08, stone, "#");
  }
}

function drawHouseLabels(buf) {
  const tags = [
    { text: "[pediment]", point: { x: 1, y: 1.82, z: 1.7 }, color: "#f3e6cc" },
    { text: "[windows]", point: { x: 0.38, y: 0.78, z: 1.62 }, color: "#ffd056" },
    { text: "[terrace]", point: { x: 1.55, y: 0.46, z: 1.74 }, color: "#e6d4b8" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function drawCart(buf) {
  const red = "#ff1f2d";
  const redDark = "#c41222";
  const redRim = "#e01424";
  const steel = "#cfd6dc";
  const steelDark = "#8b949e";

  const trl = { x: 0.26, y: 1.5, z: 1.44 };
  const trr = { x: 1.74, y: 1.5, z: 1.44 };
  const tfl = { x: 0.46, y: 1.22, z: 0.3 };
  const tfr = { x: 1.54, y: 1.22, z: 0.3 };
  const brl = { x: 0.38, y: 0.7, z: 1.3 };
  const brr = { x: 1.62, y: 0.7, z: 1.3 };
  const bfl = { x: 0.52, y: 0.66, z: 0.4 };
  const bfr = { x: 1.48, y: 0.66, z: 0.4 };

  const center = { x: 1, y: 1.05, z: 0.88 };
  const inset = (p, t = 0.07) => lerp3(p, center, t);
  const itrl = inset(trl);
  const itrr = inset(trr);
  const itfl = inset(tfl);
  const itfr = inset(tfr);
  const ibrl = inset(brl, 0.1);
  const ibrr = inset(brr, 0.1);
  const ibfl = inset(bfl, 0.1);
  const ibfr = inset(bfr, 0.1);

  const plateFront = (u, v) => v < 0.34 ? false : cartOvalHole(u, v, 5, 3);
  const plateRear = (u, v) => v < 0.3 ? false : cartOvalHole(u, v, 5, 3);

  drawPerforatedQuad(buf, tfl, trl, brl, bfl, red, "#", 7, 4);
  drawPerforatedQuad(buf, tfr, trr, brr, bfr, red, "#", 7, 4);
  drawPerforatedQuad(buf, tfl, tfr, bfr, bfl, red, "#", 5, 4, plateFront);
  drawPerforatedQuad(buf, trl, trr, brr, brl, redDark, "#", 5, 3, plateRear);
  drawPerforatedQuad(buf, bfl, bfr, brr, brl, redDark, "#", 5, 4);

  drawPerforatedQuad(buf, itfl, itrl, ibrl, ibfl, redDark, "#", 6, 3);
  drawPerforatedQuad(buf, itfr, itrr, ibrr, ibfr, redDark, "#", 6, 3);
  drawPerforatedQuad(buf, itfl, itfr, ibfr, ibfl, redDark, "#", 4, 3);
  drawPerforatedQuad(buf, itrl, itrr, ibrr, ibrl, redDark, "#", 4, 3);

  fillQuad(buf, [tfl, tfr, lerp3(tfr, bfr, 0.32), lerp3(tfl, bfl, 0.32)], red, "#");
  fillQuad(buf, [trl, trr, lerp3(trr, brr, 0.28), lerp3(trl, brl, 0.28)], red, "#");
  fillQuad(buf, [tfl, tfr, itfr, itfl], redRim, "=");
  fillQuad(buf, [trl, trr, itrr, itrl], redRim, "=");
  fillQuad(buf, [tfl, trl, itrl, itfl], redRim, "=");
  fillQuad(buf, [tfr, trr, itrr, itfr], redRim, "=");

  drawTube(buf, tfl, tfr, redRim);
  drawTube(buf, trl, trr, redRim);
  drawTube(buf, tfl, trl, redRim);
  drawTube(buf, tfr, trr, redRim);

  const seatL = lerp3(itrl, itfl, 0.16);
  const seatR = lerp3(itrr, itfr, 0.16);
  const seatLB = { x: seatL.x + 0.04, y: 0.86, z: seatL.z - 0.08 };
  const seatRB = { x: seatR.x - 0.04, y: 0.86, z: seatR.z - 0.08 };
  for (const t of [0.08, 0.26, 0.44, 0.62, 0.8, 0.92]) {
    drawAsciiLine(buf, lerp3(seatL, seatR, t), lerp3(seatLB, seatRB, t), steel, 0.05);
  }
  for (const t of [0.05, 0.28, 0.5, 0.72, 0.95]) {
    drawAsciiLine(buf, lerp3(seatL, seatLB, t), lerp3(seatR, seatRB, t), steel, 0.05);
  }
  drawAsciiLine(buf, lerp3(seatLB, seatRB, 0.22), { x: 0.78, y: 0.78, z: 1.12 }, steel, 0.04);
  drawAsciiLine(buf, lerp3(seatLB, seatRB, 0.78), { x: 1.22, y: 0.78, z: 1.12 }, steel, 0.04);

  const handleL = { x: 0.3, y: 1.78, z: 1.8 };
  const handleR = { x: 1.7, y: 1.78, z: 1.8 };
  const neckL = { x: 0.28, y: 1.62, z: 1.58 };
  const neckR = { x: 1.72, y: 1.62, z: 1.58 };
  drawTube(buf, trl, neckL, steel);
  drawTube(buf, neckL, handleL, steel);
  drawTube(buf, trr, neckR, steel);
  drawTube(buf, neckR, handleR, steel);
  drawTube(buf, handleL, handleR, steel);
  const gripL = { x: 0.48, y: 1.74, z: 1.76 };
  const gripR = { x: 1.52, y: 1.74, z: 1.76 };
  const gripLB = { x: 0.48, y: 1.84, z: 1.84 };
  const gripRB = { x: 1.52, y: 1.84, z: 1.84 };
  fillQuad(buf, [gripL, gripR, gripRB, gripLB], red, "=");
  fillQuad(
    buf,
    [
      { x: gripL.x, y: gripL.y - 0.05, z: gripL.z },
      { x: gripR.x, y: gripR.y - 0.05, z: gripR.z },
      { x: gripRB.x, y: gripRB.y - 0.05, z: gripRB.z },
      { x: gripLB.x, y: gripLB.y - 0.05, z: gripLB.z },
    ],
    redRim,
    "=",
  );

  const rearLeft = { x: 0.42, y: 0.2, z: 1.28 };
  const rearRight = { x: 1.58, y: 0.2, z: 1.28 };
  const frontLeft = { x: 0.52, y: 0.18, z: 0.42 };
  const frontRight = { x: 1.48, y: 0.18, z: 0.42 };
  drawTube(buf, neckL, rearLeft, steelDark);
  drawTube(buf, neckR, rearRight, steelDark);
  drawTube(buf, brl, rearLeft, steelDark);
  drawTube(buf, brr, rearRight, steelDark);
  drawTube(buf, bfl, frontLeft, steelDark);
  drawTube(buf, bfr, frontRight, steelDark);
  drawTube(buf, rearLeft, frontLeft, steel);
  drawTube(buf, rearRight, frontRight, steel);
  drawTube(buf, { x: rearLeft.x, y: 0.34, z: rearLeft.z }, { x: frontLeft.x, y: 0.34, z: frontLeft.z }, steel);
  drawTube(buf, { x: rearRight.x, y: 0.34, z: rearRight.z }, { x: frontRight.x, y: 0.34, z: frontRight.z }, steel);
  drawTube(buf, { x: rearLeft.x, y: 0.22, z: rearLeft.z }, { x: rearRight.x, y: 0.22, z: rearRight.z }, steel);
  drawTube(buf, { x: frontLeft.x, y: 0.22, z: frontLeft.z }, { x: frontRight.x, y: 0.22, z: frontRight.z }, steel);

  for (const x of [0.56, 0.74, 0.92, 1.1, 1.28, 1.44]) {
    drawAsciiLine(buf, { x, y: 0.3, z: 0.46 }, { x, y: 0.3, z: 1.2 }, steel, 0.04);
  }
  drawAsciiLine(buf, { x: 0.5, y: 0.3, z: 0.46 }, { x: 1.5, y: 0.3, z: 0.46 }, steel, 0.04);
  drawAsciiLine(buf, { x: 0.5, y: 0.3, z: 1.2 }, { x: 1.5, y: 0.3, z: 1.2 }, steel, 0.04);

  drawWheelYZ(buf, rearLeft.x, 0.2, rearLeft.z, 0.18, 0.1, false);
  drawWheelYZ(buf, rearRight.x, 0.2, rearRight.z, 0.18, 0.1, false);
  drawWheelYZ(buf, frontLeft.x, 0.18, frontLeft.z, 0.16, 0.09, true);
  drawWheelYZ(buf, frontRight.x, 0.18, frontRight.z, 0.16, 0.09, true);
}

function drawCartLabels(buf) {
  const tags = [
    { text: "[basket]", point: { x: 1.05, y: 0.98, z: 0.24 }, color: "#ff1f2d" },
    { text: "[handle]", point: { x: 1.05, y: 1.88, z: 1.86 }, color: "#ff1f2d" },
    { text: "[rack]", point: { x: 1.05, y: 0.24, z: 0.68 }, color: "#cfd6dc" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function torusXZ(u, v, cx, y, cz, R, r) {
  const ring = R + r * Math.cos(v);
  return {
    x: cx + ring * Math.cos(u),
    y: y + r * Math.sin(v),
    z: cz + ring * Math.sin(u),
  };
}

function drawTorusXZ(buf, cx, y, cz, R, r, color, fill, uSeg = 14, vSeg = 7) {
  for (let i = 0; i < uSeg; i += 1) {
    for (let j = 0; j < vSeg; j += 1) {
      const u0 = (i / uSeg) * Math.PI * 2;
      const u1 = ((i + 1) / uSeg) * Math.PI * 2;
      const v0 = (j / vSeg) * Math.PI * 2;
      const v1 = ((j + 1) / vSeg) * Math.PI * 2;
      fillQuad(
        buf,
        [
          torusXZ(u0, v0, cx, y, cz, R, r),
          torusXZ(u1, v0, cx, y, cz, R, r),
          torusXZ(u1, v1, cx, y, cz, R, r),
          torusXZ(u0, v1, cx, y, cz, R, r),
        ],
        color,
        fill,
      );
    }
  }
}

function fillDiscFacingZ(buf, cx, cy, z, radius, color, fill, segments = 8) {
  const center = { x: cx, y: cy, z };
  for (let i = 0; i < segments; i += 1) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    fillQuad(
      buf,
      [
        center,
        { x: cx + Math.cos(a0) * radius, y: cy + Math.sin(a0) * radius, z },
        { x: cx + Math.cos(a1) * radius, y: cy + Math.sin(a1) * radius, z },
        center,
      ],
      color,
      fill,
    );
  }
}

function drawWhoopProp(buf, cx, y, cz, radius, blades, phase, color) {
  for (let b = 0; b < blades; b += 1) {
    const a = phase + (b / blades) * Math.PI * 2;
    const tip = { x: cx + Math.cos(a) * radius, y, z: cz + Math.sin(a) * radius };
    const left = {
      x: cx + Math.cos(a - 0.42) * radius * 0.18,
      y: y + 0.01,
      z: cz + Math.sin(a - 0.42) * radius * 0.18,
    };
    const right = {
      x: cx + Math.cos(a + 0.42) * radius * 0.18,
      y: y - 0.01,
      z: cz + Math.sin(a + 0.42) * radius * 0.18,
    };
    const hub = { x: cx, y, z: cz };
    fillQuad(buf, [hub, left, tip, right], color, "/");
    drawAsciiLine(buf, hub, tip, color, 0.08);
  }
}

function drawDrone(buf) {
  const frame = "#e8eef4";
  const frameDim = "#c5ced8";
  const pink = "#ff4fa8";
  const pinkDeep = "#e03790";
  const pcb = "#1b1e24";
  const motor = "#2b3038";
  const bell = "#3d6ea8";
  const wire = "#111318";
  const ductY = 1.02;
  const R = 0.35;
  const r = 0.075;
  const offset = 0.39;
  const hubs = [
    { x: 1 - offset, z: 1 - offset, spin: 0.15 },
    { x: 1 + offset, z: 1 - offset, spin: -0.15 },
    { x: 1 - offset, z: 1 + offset, spin: -0.15 },
    { x: 1 + offset, z: 1 + offset, spin: 0.15 },
  ];

  drawBox(buf, 0.86, 1.14, 0.88, 0.98, 0.86, 1.14, "#252830", "#");
  drawBox(buf, 0.84, 1.16, 0.98, 1.08, 0.84, 1.16, pcb, "#");

  for (const hub of hubs) {
    drawTorusXZ(buf, hub.x, ductY, hub.z, R, r, frame, "@");
    drawTube(buf, { x: 1, y: 1.02, z: 1 }, { x: hub.x, y: ductY, z: hub.z }, frameDim);
    drawAsciiLine(buf, { x: 1, y: 1.04, z: 1 }, { x: hub.x, y: ductY + 0.02, z: hub.z }, wire, 0.04);
    fillDiscAt(buf, hub.x, ductY - 0.04, hub.z, 0.07, bell, "*", 8);
    fillDiscAt(buf, hub.x, ductY + 0.02, hub.z, 0.055, motor, "#", 8);
    fillDiscAt(buf, hub.x, ductY + 0.07, hub.z, 0.03, "#4a5160", "+", 6);
    drawWhoopProp(buf, hub.x, ductY + 0.08, hub.z, 0.26, 3, hub.spin, pink);
  }

  const legL = { x: 0.88, y: 1.08, z: 1.02 };
  const legR = { x: 1.12, y: 1.08, z: 1.02 };
  const peak = { x: 1, y: 1.3, z: 1.14 };
  const noseL = { x: 0.92, y: 1.08, z: 1.28 };
  const noseR = { x: 1.08, y: 1.08, z: 1.28 };
  const nose = { x: 1, y: 1.12, z: 1.34 };
  fillQuad(buf, [legL, peak, nose, noseL], pink, "A");
  fillQuad(buf, [legR, peak, nose, noseR], pinkDeep, "A");
  fillQuad(buf, [legL, peak, legR, legL], pink, "A");
  fillQuad(buf, [noseL, nose, noseR, noseL], pinkDeep, "A");
  fillDiscFacingZ(buf, 1, 1.1, 1.36, 0.07, "#0d0d0f", "O");
  fillDiscFacingZ(buf, 1, 1.1, 1.38, 0.035, "#3a3a40", "*");

  drawAsciiLine(buf, { x: 1.02, y: 1.08, z: 0.86 }, { x: 1.08, y: 1.62, z: 0.74 }, wire, 0.05);
  const tip = toCell({ x: 1.08, y: 1.64, z: 0.72 });
  plotCell(buf, Math.round(tip.x), Math.round(tip.y), "*", tip.z + 0.1, "#f4f4f4");
  drawAsciiLine(buf, { x: 0.96, y: 1.08, z: 0.88 }, { x: 0.9, y: 1.4, z: 0.7 }, "#c5cdd4", 0.06);

  for (const [x, z] of [
    [0.9, 0.9],
    [1.1, 0.9],
    [0.9, 1.1],
    [1.1, 1.1],
  ]) {
    const screw = toCell({ x, y: 1.09, z });
    plotCell(buf, Math.round(screw.x), Math.round(screw.y), "+", screw.z + 0.12, "#d0d5dc");
  }
}

function drawDroneLabels(buf) {
  const tags = [
    { text: "[duct]", point: { x: 1.52, y: 1.02, z: 0.5 }, color: "#e8eef4" },
    { text: "[prop]", point: { x: 0.5, y: 1.22, z: 1.5 }, color: "#ff4fa8" },
    { text: "[cam]", point: { x: 1, y: 1.22, z: 1.48 }, color: "#ff4fa8" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function drawTruck(buf) {
  const silver = "#c5ccd4";
  const silverDim = "#9aa3ad";
  const black = "#1a1c20";
  const glass = "#9ec9e8";
  const amber = "#e8943a";

  drawBox(buf, 0.26, 1.86, 0.3, 0.44, 0.54, 1.46, black, "=");

  drawBox(buf, 0.18, 0.46, 0.42, 0.78, 0.5, 1.5, silver, "#");
  drawBox(buf, 0.42, 0.96, 0.42, 1.28, 0.46, 1.54, silver, "#");
  fillQuad(
    buf,
    [
      { x: 0.46, y: 0.78, z: 0.5 },
      { x: 0.46, y: 0.78, z: 1.5 },
      { x: 0.54, y: 1.26, z: 1.5 },
      { x: 0.54, y: 1.26, z: 0.5 },
    ],
    glass,
    "/",
  );
  drawBox(buf, 0.5, 0.92, 0.82, 1.18, 1.5, 1.56, glass, "o");
  drawBox(buf, 0.5, 0.92, 0.82, 1.18, 0.44, 0.5, glass, "o");
  drawBox(buf, 0.88, 0.94, 0.7, 1.16, 0.48, 1.52, glass, "|");

  drawBox(buf, 0.12, 0.28, 0.44, 0.86, 0.48, 1.52, black, "#");
  drawBox(buf, 0.12, 0.26, 0.7, 0.84, 0.52, 0.72, "#eef4ff", "=");
  drawBox(buf, 0.12, 0.26, 0.7, 0.84, 1.28, 1.48, "#eef4ff", "=");
  drawBox(buf, 0.12, 0.24, 0.7, 0.76, 0.5, 0.6, amber, "=");
  drawBox(buf, 0.12, 0.24, 0.7, 0.76, 1.4, 1.5, amber, "=");
  drawPerforatedQuad(
    buf,
    { x: 0.14, y: 0.62, z: 0.54 },
    { x: 0.14, y: 0.62, z: 1.46 },
    { x: 0.14, y: 0.46, z: 1.46 },
    { x: 0.14, y: 0.46, z: 0.54 },
    "#2c3036",
    "o",
    8,
    3,
  );
  drawBox(buf, 0.1, 0.3, 0.32, 0.46, 0.46, 1.54, black, "=");
  drawBox(buf, 0.12, 0.26, 0.34, 0.44, 0.86, 1.14, "#f4f4f4", "=");
  writeOnMesh(buf, "TOYOTA", { x: 0.16, y: 0.76, z: 1 }, "#d8dde3");
  writeOnMesh(buf, "TOYOTA", { x: 0.18, y: 0.38, z: 1 }, black);

  drawBox(buf, 0.38, 0.5, 0.96, 1.12, 1.52, 1.64, black, "#");
  drawBox(buf, 0.38, 0.5, 0.96, 1.12, 0.36, 0.48, black, "#");

  drawBox(buf, 0.94, 1.9, 0.58, 0.7, 0.5, 1.5, silverDim, "=");
  drawBox(buf, 0.94, 1.88, 0.7, 0.98, 0.5, 0.58, silver, "#");
  drawBox(buf, 0.94, 1.88, 0.7, 0.98, 1.42, 1.5, silver, "#");
  drawBox(buf, 1.82, 1.9, 0.7, 0.98, 0.52, 1.48, silver, "#");
  for (const x of [1.04, 1.18, 1.32, 1.46, 1.6, 1.74]) {
    drawAsciiLine(buf, { x, y: 0.72, z: 0.5 }, { x, y: 0.96, z: 0.5 }, silverDim, 0.05);
    drawAsciiLine(buf, { x, y: 0.72, z: 1.5 }, { x, y: 0.96, z: 1.5 }, silverDim, 0.05);
  }

  for (const [x, z] of [
    [0.5, 0.48],
    [0.5, 1.52],
    [1.48, 0.48],
    [1.48, 1.52],
  ]) {
    drawWheelXY(buf, x, 0.22, z, 0.2, 0.12);
  }
}

function drawTruckLabels(buf) {
  const tags = [
    { text: "[grille]", point: { x: 0.12, y: 0.7, z: 1.62 }, color: "#d8dde3" },
    { text: "[cab]", point: { x: 0.7, y: 1.22, z: 1.6 }, color: "#c5ccd4" },
    { text: "[bed]", point: { x: 1.5, y: 0.86, z: 1.62 }, color: "#9aa3ad" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function drawRoo(buf) {
  const tan = "#c48a4a";
  const tanDark = "#9a6230";
  const cream = "#f3e6d0";
  const hair = "#16100c";
  const water = "#3d6d88";
  const waterHi = "#7eb3c9";
  const rock = "#6a6e76";
  const snow = "#f2f4f6";
  const pink = "#e8a0a8";
  const snout = "#2a1c16";
  const cx = 1.02;
  const cz = 1.02;

  fillDiscAt(buf, 1, 0.12, 1.05, 0.98, water, "~", 14);
  fillDiscAt(buf, 1, 0.22, 1.05, 0.9, waterHi, "~", 12);
  fillDiscAt(buf, 1, 0.32, 1.05, 0.78, water, "o", 12);
  for (const r of [0.42, 0.58, 0.74]) {
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      drawAsciiLine(
        buf,
        { x: cx + Math.cos(a) * r, y: 0.34, z: cz + Math.sin(a) * r },
        { x: cx + Math.cos(a + 0.4) * (r + 0.04), y: 0.34, z: cz + Math.sin(a + 0.4) * (r + 0.04) },
        "#9ec9dc",
        0.03,
      );
    }
  }

  drawBox(buf, 1.42, 1.88, 0.28, 0.92, 0.72, 1.42, rock, "#");
  drawBox(buf, 1.48, 1.86, 0.88, 1.02, 0.78, 1.38, snow, "=");
  drawBox(buf, 1.58, 1.92, 0.18, 0.62, 1.18, 1.62, rock, "#");
  drawBox(buf, 1.62, 1.9, 0.58, 0.7, 1.22, 1.58, snow, "=");

  stackDiscs(buf, cx, 0.28, 0.58, cz, 0.22, 0.28, tanDark, "O", 5);
  stackDiscs(buf, cx + 0.08, 0.28, 0.52, cz + 0.02, 0.12, 0.16, cream, "o", 4);
  fillEllipsoid(buf, cx, 0.58, cz, 0.32, 0.2, 0.28, tan, "O", { bulge: 0.28, highlight: "#e8c48a" });
  fillEllipsoid(buf, cx, 0.92, cz, 0.26, 0.34, 0.22, tan, "#", { bulge: 0.18 });
  fillEllipsoid(buf, cx + 0.02, 0.88, cz + 0.1, 0.14, 0.28, 0.1, cream, "+");
  fillEllipsoid(buf, cx - 0.08, 0.98, cz + 0.16, 0.1, 0.1, 0.08, cream, "o", { highlight: "#fff8ee" });
  fillEllipsoid(buf, cx + 0.12, 0.98, cz + 0.16, 0.1, 0.1, 0.08, cream, "o", { highlight: "#fff8ee" });
  fillDiscAt(buf, cx - 0.08, 0.98, cz + 0.22, 0.03, pink, "*", 6);
  fillDiscAt(buf, cx + 0.12, 0.98, cz + 0.22, 0.03, pink, "*", 6);

  const hip = { x: cx, y: 0.58, z: cz };
  const tail = [
    { x: cx - 0.12, y: 0.62, z: cz - 0.08 },
    { x: cx - 0.32, y: 0.78, z: cz - 0.18 },
    { x: cx - 0.48, y: 1.02, z: cz - 0.12 },
    { x: cx - 0.42, y: 1.22, z: cz + 0.02 },
    { x: cx - 0.28, y: 1.28, z: cz + 0.12 },
  ];
  let prev = hip;
  const tailR = [0.12, 0.11, 0.09, 0.07, 0.05];
  for (let i = 0; i < tail.length; i += 1) {
    drawTube(buf, prev, tail[i], tanDark);
    fillEllipsoid(buf, tail[i].x, tail[i].y, tail[i].z, tailR[i], tailR[i] * 0.85, tailR[i], i > 2 ? cream : tan, "O");
    prev = tail[i];
  }

  drawTube(buf, { x: cx + 0.16, y: 1.08, z: cz }, { x: 1.52, y: 0.86, z: 1.22 }, tan);
  drawTube(buf, { x: 1.52, y: 0.86, z: 1.22 }, { x: 1.62, y: 0.78, z: 1.18 }, tanDark);
  fillDiscAt(buf, 1.64, 0.76, 1.16, 0.07, tanDark, "#", 6);
  drawTube(buf, { x: cx - 0.16, y: 1.02, z: cz + 0.04 }, { x: 0.72, y: 0.72, z: 1.18 }, tan);
  fillDiscAt(buf, 0.7, 0.7, 1.2, 0.07, tanDark, "#", 6);

  fillEllipsoid(buf, cx, 1.36, cz, 0.17, 0.18, 0.16, tan, "O");
  fillEllipsoid(buf, cx, 1.34, cz + 0.22, 0.07, 0.06, 0.12, tanDark, "#");
  fillDiscAt(buf, cx, 1.34, cz + 0.34, 0.05, snout, "*", 6);
  fillDiscAt(buf, cx - 0.06, 1.42, cz + 0.16, 0.035, "#c41e3a", "*", 5);
  fillDiscAt(buf, cx + 0.06, 1.42, cz + 0.16, 0.035, "#c41e3a", "*", 5);

  fillEllipsoid(buf, cx - 0.14, 1.68, cz, 0.06, 0.18, 0.05, tan, "#");
  fillEllipsoid(buf, cx + 0.14, 1.68, cz, 0.06, 0.18, 0.05, tan, "#");
  fillEllipsoid(buf, cx - 0.14, 1.68, cz + 0.04, 0.03, 0.14, 0.03, pink, "+");
  fillEllipsoid(buf, cx + 0.14, 1.68, cz + 0.04, 0.03, 0.14, 0.03, pink, "+");

  stackDiscs(buf, cx, 1.48, 1.62, cz - 0.06, 0.17, 0.14, hair, "#", 4);
  drawBox(buf, cx - 0.16, cx + 0.16, 0.7, 1.5, cz - 0.22, cz - 0.08, hair, "#");
  drawAsciiLine(buf, { x: cx - 0.12, y: 1.48, z: cz - 0.1 }, { x: cx - 0.2, y: 0.72, z: cz - 0.06 }, hair, 0.08);
  drawAsciiLine(buf, { x: cx + 0.1, y: 1.48, z: cz - 0.1 }, { x: cx + 0.18, y: 0.7, z: cz - 0.04 }, hair, 0.08);
}

function drawRooLabels(buf) {
  const tags = [
    { text: "[ears]", point: { x: 1.02, y: 1.82, z: 1.18 }, color: "#e8a0a8" },
    { text: "[tail]", point: { x: 0.48, y: 1.18, z: 0.88 }, color: "#c48a4a" },
    { text: "[onsen]", point: { x: 1.15, y: 0.22, z: 1.55 }, color: "#7eb3c9" },
  ];
  for (const tag of tags) {
    const cell = toCell(tag.point);
    writeText(buf, tag.text, cell.x, cell.y, tag.color, 7);
  }
}

function drawWolf(buf) {
  const cream = "#f4ebe3";
  const creamHi = "#fffaf4";
  const black = "#16161a";
  const charcoal = "#2a2a30";
  const pink = "#e89aa8";
  const cx = 1;
  const cz = 1.12;
  const gloss = { highlight: creamHi, bulge: 0.32, uSeg: 18, vSeg: 14, gloss: 0.38, hot: 0.68 };

  fillEllipsoid(buf, cx - 0.3, 0.86, cz + 0.16, 0.52, 0.5, 0.5, cream, "O", gloss);
  fillEllipsoid(buf, cx + 0.3, 0.86, cz + 0.16, 0.52, 0.5, 0.5, cream, "O", gloss);
  fillEllipsoid(buf, cx - 0.48, 0.78, cz - 0.04, 0.2, 0.38, 0.22, black, "#", { bulge: 0.12, highlight: "#3a3a42" });
  fillEllipsoid(buf, cx + 0.48, 0.78, cz - 0.04, 0.2, 0.38, 0.22, black, "#", { bulge: 0.12, highlight: "#3a3a42" });

  fillEllipsoid(buf, cx - 0.24, 0.38, cz + 0.06, 0.26, 0.4, 0.26, cream, "O", { ...gloss, bulge: 0.22 });
  fillEllipsoid(buf, cx + 0.24, 0.38, cz + 0.06, 0.26, 0.4, 0.26, cream, "O", { ...gloss, bulge: 0.22 });
  fillEllipsoid(buf, cx - 0.24, 0.16, cz + 0.04, 0.22, 0.22, 0.22, charcoal, "#", { bulge: 0.08, highlight: "#4a4a52" });
  fillEllipsoid(buf, cx + 0.24, 0.16, cz + 0.04, 0.22, 0.22, 0.22, charcoal, "#", { bulge: 0.08, highlight: "#4a4a52" });

  fillEllipsoid(buf, cx, 0.58, cz + 0.28, 0.07, 0.1, 0.05, pink, "*");

  fillDiscAt(buf, cx - 0.22, 1.12, cz + 0.52, 0.05, creamHi, "*", 8);
  fillDiscAt(buf, cx + 0.34, 0.98, cz + 0.5, 0.045, creamHi, "*", 8);
  fillDiscAt(buf, cx - 0.08, 0.72, cz + 0.54, 0.03, creamHi, "*", 6);

  fillEllipsoid(buf, cx, 1.28, cz - 0.02, 0.18, 0.26, 0.14, cream, "O", { bulge: 0.1 });
  drawBox(buf, cx - 0.2, cx + 0.22, 1.16, 1.44, cz - 0.16, cz + 0.12, charcoal, "#");
  drawBox(buf, cx - 0.18, cx - 0.02, 1.14, 1.2, cz - 0.08, cz + 0.1, charcoal, "~");
  drawBox(buf, cx + 0.04, cx + 0.2, 1.14, 1.18, cz - 0.06, cz + 0.08, charcoal, "~");
  fillDiscAt(buf, cx, 1.5, cz, 0.11, charcoal, "=", 10);
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    drawAsciiLine(
      buf,
      { x: cx + Math.cos(a) * 0.1, y: 1.5, z: cz + Math.sin(a) * 0.1 },
      { x: cx + Math.cos(a) * 0.16, y: 1.54, z: cz + Math.sin(a) * 0.16 },
      "#c8c8ce",
      0.03,
    );
  }

  fillEllipsoid(buf, 0.58, 1.66, 0.96, 0.16, 0.14, 0.18, cream, "O", { bulge: 0.08, highlight: creamHi });
  fillEllipsoid(buf, 0.52, 1.6, 1.12, 0.1, 0.07, 0.12, cream, "#");
  fillDiscAt(buf, 0.48, 1.58, 1.24, 0.045, "#111111", "*", 7);

  const tail = [
    { x: 1.38, y: 1.08, z: 0.96, rx: 0.14, ry: 0.12, rz: 0.16, color: black, fill: "#" },
    { x: 1.58, y: 1.18, z: 0.86, rx: 0.2, ry: 0.16, rz: 0.2, color: black, fill: "#" },
    { x: 1.7, y: 0.92, z: 0.78, rx: 0.24, ry: 0.2, rz: 0.22, color: black, fill: "#" },
    { x: 1.62, y: 0.62, z: 0.74, rx: 0.22, ry: 0.22, rz: 0.2, color: cream, fill: "O" },
    { x: 1.4, y: 0.38, z: 0.82, rx: 0.16, ry: 0.16, rz: 0.14, color: cream, fill: "O" },
  ];
  for (const p of tail) {
    fillEllipsoid(buf, p.x, p.y, p.z, p.rx, p.ry, p.rz, p.color, p.fill, {
      bulge: 0.2,
      highlight: p.color === black ? "#4a4a52" : creamHi,
    });
  }
}

function drawWolfLabels(buf) {
  const tags = [
    { text: "[hips]", point: { x: 1, y: 1.02, z: 1.62 }, color: "#f4ebe3" },
    { text: "[tail]", point: { x: 1.72, y: 0.88, z: 0.58 }, color: "#d0d0d6" },
    { text: "[thighs]", point: { x: 0.48, y: 0.22, z: 1.32 }, color: "#f4ebe3" },
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
