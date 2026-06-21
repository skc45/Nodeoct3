const STORAGE_KEY = "three-axis-notes-settings";

const defaultSettings = {
  axes: ["Urgency", "Impact", "Effort"],
  regions: {},
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
let yaw = -0.72;
let pitch = 0.56;
let zoom = 1;
let dragState = null;
let hitTargets = [];

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
    };
  } catch {
    return structuredClone(defaultSettings);
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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
        Sub-cube label
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

function projectFlat(point) {
  const rect = canvas.getBoundingClientRect();
  const rotated = rotate(point);
  const scale = Math.min(rect.width, rect.height) * 0.34 * zoom;

  return {
    x: rect.width / 2 + rotated.x * scale,
    y: rect.height / 2 - rotated.y * scale,
  };
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  hitTargets = [];

  drawBackground(rect);
  drawSubCubes();
  drawMidPlanes();
  drawOuterWireframe();
  drawTicksAndAxes();
  drawRegionLabels();
  drawNotes();
}

function drawBackground(rect) {
  const gradient = ctx.createRadialGradient(rect.width * 0.5, rect.height * 0.45, 20, rect.width * 0.5, rect.height * 0.5, rect.width * 0.65);
  gradient.addColorStop(0, "rgba(14, 165, 233, 0.16)");
  gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);
}

function drawSubCubes() {
  const faces = [];

  regionCombos.forEach((combo, regionIndex) => {
    const xRange = combo[0] === "low" ? [0, 1] : [1, 2];
    const yRange = combo[1] === "low" ? [0, 1] : [1, 2];
    const zRange = combo[2] === "low" ? [0, 1] : [1, 2];
    const color = hexToRgb(regionColors[regionIndex]);
    const points = cuboidPoints(xRange, yRange, zRange);

    for (const face of cuboidFaces(points)) {
      faces.push({
        points: face,
        depth: averageDepth(face),
        fill: `rgba(${color.r}, ${color.g}, ${color.b}, 0.075)`,
        stroke: `rgba(${color.r}, ${color.g}, ${color.b}, 0.24)`,
      });
    }
  });

  faces.sort((a, b) => a.depth - b.depth);
  for (const face of faces) {
    drawPolygon(face.points, face.fill, face.stroke);
  }
}

function drawMidPlanes() {
  const planes = [
    [{ x: 1, y: 0, z: 0 }, { x: 1, y: 2, z: 0 }, { x: 1, y: 2, z: 2 }, { x: 1, y: 0, z: 2 }],
    [{ x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 2, y: 1, z: 2 }, { x: 0, y: 1, z: 2 }],
    [{ x: 0, y: 0, z: 1 }, { x: 2, y: 0, z: 1 }, { x: 2, y: 2, z: 1 }, { x: 0, y: 2, z: 1 }],
  ];

  for (const plane of planes) {
    drawPolygon(plane, "rgba(255, 255, 255, 0.035)", "rgba(255, 255, 255, 0.22)");
  }
}

function drawOuterWireframe() {
  const corners = cuboidPoints([0, 2], [0, 2], [0, 2]);
  const edges = [
    ["000", "200"], ["200", "220"], ["220", "020"], ["020", "000"],
    ["002", "202"], ["202", "222"], ["222", "022"], ["022", "002"],
    ["000", "002"], ["200", "202"], ["220", "222"], ["020", "022"],
  ];

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(238, 244, 255, 0.78)";
  for (const [a, b] of edges) {
    drawLine(corners[a], corners[b]);
  }
}

function drawTicksAndAxes() {
  const axes = [
    { name: settings.axes[0], points: [{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }], key: "x" },
    { name: settings.axes[1], points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }], key: "y" },
    { name: settings.axes[2], points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }], key: "z" },
  ];

  ctx.font = "700 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(238, 244, 255, 0.82)";

  for (const axis of axes) {
    ctx.strokeStyle = "rgba(125, 211, 252, 0.52)";
    ctx.lineWidth = 1.3;
    drawLine(axis.points[0], axis.points[1]);

    for (const tick of [0, 1, 2]) {
      const point = { x: 0, y: 0, z: 0 };
      point[axis.key] = tick;
      const projected = project(point);
      drawText(String(tick), projected.x, projected.y + 18, "rgba(238, 244, 255, 0.74)");
    }

    const labelPoint = { ...axis.points[1] };
    labelPoint[axis.key] += 0.22;
    const projected = project(labelPoint);
    drawText(axis.name, projected.x, projected.y, "rgba(125, 211, 252, 0.96)");
  }
}

function drawRegionLabels() {
  regionCombos.forEach((combo, index) => {
    const point = {
      x: combo[0] === "low" ? 0.5 : 1.5,
      y: combo[1] === "low" ? 0.5 : 1.5,
      z: combo[2] === "low" ? 0.5 : 1.5,
    };
    const projected = projectFlat(point);
    drawLabel(settings.regions[regionKey(combo)], projected.x, projected.y, regionColors[index]);
  });
}

function drawNotes() {
  const ordered = [...notes].sort((a, b) => project(a.point).z - project(b.point).z);

  for (const note of ordered) {
    const projected = project(note.point);
    const region = getRegion(note.point);
    const radius = (note.id === activeNoteId ? 10 : 7) * projected.perspective;

    ctx.beginPath();
    ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = region.color;
    ctx.fill();
    ctx.lineWidth = note.id === activeNoteId ? 4 : 2;
    ctx.strokeStyle = note.id === activeNoteId ? "#ffffff" : "rgba(255,255,255,0.72)";
    ctx.stroke();

    if (note.id === activeNoteId) {
      drawLabel(note.title, projected.x, projected.y - radius - 18, "#ffffff");
    }

    hitTargets.push({
      id: note.id,
      x: projected.x,
      y: projected.y,
      radius: radius + 8,
    });
  }
}

function cuboidPoints(xRange, yRange, zRange) {
  const [x0, x1] = xRange;
  const [y0, y1] = yRange;
  const [z0, z1] = zRange;
  return {
    [`${x0}${y0}${z0}`]: { x: x0, y: y0, z: z0 },
    [`${x1}${y0}${z0}`]: { x: x1, y: y0, z: z0 },
    [`${x1}${y1}${z0}`]: { x: x1, y: y1, z: z0 },
    [`${x0}${y1}${z0}`]: { x: x0, y: y1, z: z0 },
    [`${x0}${y0}${z1}`]: { x: x0, y: y0, z: z1 },
    [`${x1}${y0}${z1}`]: { x: x1, y: y0, z: z1 },
    [`${x1}${y1}${z1}`]: { x: x1, y: y1, z: z1 },
    [`${x0}${y1}${z1}`]: { x: x0, y: y1, z: z1 },
  };
}

function cuboidFaces(points) {
  const keys = Object.keys(points);
  const lowX = Math.min(...keys.map((key) => Number(key[0])));
  const highX = Math.max(...keys.map((key) => Number(key[0])));
  const lowY = Math.min(...keys.map((key) => Number(key[1])));
  const highY = Math.max(...keys.map((key) => Number(key[1])));
  const lowZ = Math.min(...keys.map((key) => Number(key[2])));
  const highZ = Math.max(...keys.map((key) => Number(key[2])));

  return [
    [points[`${lowX}${lowY}${lowZ}`], points[`${highX}${lowY}${lowZ}`], points[`${highX}${highY}${lowZ}`], points[`${lowX}${highY}${lowZ}`]],
    [points[`${lowX}${lowY}${highZ}`], points[`${highX}${lowY}${highZ}`], points[`${highX}${highY}${highZ}`], points[`${lowX}${highY}${highZ}`]],
    [points[`${lowX}${lowY}${lowZ}`], points[`${lowX}${highY}${lowZ}`], points[`${lowX}${highY}${highZ}`], points[`${lowX}${lowY}${highZ}`]],
    [points[`${highX}${lowY}${lowZ}`], points[`${highX}${highY}${lowZ}`], points[`${highX}${highY}${highZ}`], points[`${highX}${lowY}${highZ}`]],
    [points[`${lowX}${lowY}${lowZ}`], points[`${highX}${lowY}${lowZ}`], points[`${highX}${lowY}${highZ}`], points[`${lowX}${lowY}${highZ}`]],
    [points[`${lowX}${highY}${lowZ}`], points[`${highX}${highY}${lowZ}`], points[`${highX}${highY}${highZ}`], points[`${lowX}${highY}${highZ}`]],
  ];
}

function averageDepth(points) {
  return points.reduce((sum, point) => sum + project(point).z, 0) / points.length;
}

function drawPolygon(points, fill, stroke) {
  const projected = points.map(project);
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  for (const point of projected.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawLine(a, b) {
  const start = project(a);
  const end = project(b);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function drawText(text, x, y, fill) {
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawLabel(text, x, y, color) {
  ctx.font = "800 12px Inter, sans-serif";
  const paddingX = 8;
  const width = ctx.measureText(text).width + paddingX * 2;
  const height = 24;

  ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
  roundRect(x - width / 2, y - height / 2, width, height, 10);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(text, x, y + 1, "#eef4ff");
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function openSettingsDialog() {
  renderSettingsForm();
  settingsDialog.showModal();
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
  yaw = -0.72;
  pitch = 0.56;
  zoom = 1;
  drawScene();
});

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  dragState = {
    x: event.clientX,
    y: event.clientY,
    moved: false,
  };
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  const dx = event.clientX - dragState.x;
  const dy = event.clientY - dragState.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) {
    dragState.moved = true;
  }

  yaw -= dx * 0.008;
  pitch = Math.max(-1.15, Math.min(1.15, pitch + dy * 0.008));
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

canvas.addEventListener("pointerup", (event) => {
  canvas.releasePointerCapture(event.pointerId);
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (!dragState?.moved) {
    const hit = [...hitTargets].reverse().find((target) => Math.hypot(target.x - x, target.y - y) <= target.radius);
    if (hit) {
      selectNote(hit.id);
    }
  }

  dragState = null;
});

window.addEventListener("resize", setupCanvasSize);

renderSliders();
renderNotesList();
updateActiveRegion();
setupCanvasSize();

if (!localStorage.getItem(STORAGE_KEY)) {
  openSettingsDialog();
}
