// Wires Vice Cover Studio: photo bank (samples + uploads), layout picker, per-panel
// crop and position, caption and grade controls, and PNG export in three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead of the editor.

import { drawCover, LAYOUTS, blankPanel } from './cover.js';
import { paintSunsetScene } from './sunset.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const gradeSelect = document.getElementById('grade');
const sizeSelect = document.getElementById('size');
const panelSelect = document.getElementById('panelSelect');
const panelPhoto = document.getElementById('panelPhoto');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  layout: 'poster',
  caption: captionInput.value,
  subtitle: subtitleInput.value,
  grade: gradeSelect.value,
  panels: [blankPanel(), blankPanel(), blankPanel()],
};

/** Every photo the app can place: built-ins plus the user's uploads. */
const bank = [];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  drawCover(canvas, state);
}

/** Fills a panel with a photo, keeping its crop where one was set. */
export function placePhoto(panelIndex, photo) {
  const panel = state.panels[panelIndex];
  if (!panel) return;
  panel.image = photo;
  redraw();
}

function syncPanelEditor() {
  const i = Number(panelSelect.value);
  const panel = state.panels[i];
  panelPhoto.value = panel.image ? panel.image.dataset.bankId ?? '' : '';
  zoomInput.value = Math.round(panel.zoom * 100);
  panXInput.value = Math.round(panel.panX * 100);
  panYInput.value = Math.round(panel.panY * 100);
  document.getElementById('zoomValue').textContent = `${zoomInput.value}%`;
  document.getElementById('panXValue').textContent = panXInput.value;
  document.getElementById('panYValue').textContent = panYInput.value;
}

function rebuildPanelControls() {
  const count = LAYOUTS[state.layout].panels.length;
  state.panels = state.panels.slice(0, count);
  while (state.panels.length < count) state.panels.push(blankPanel());
  panelSelect.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Panel ${i + 1}`;
    panelSelect.appendChild(option);
  }
  panelPhoto.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'Empty';
  panelPhoto.appendChild(none);
  for (const entry of bank) {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.label;
    panelPhoto.appendChild(option);
  }
  syncPanelEditor();
}

function buildPhotoBank() {
  const holder = document.getElementById('photoBank');
  holder.innerHTML = '';
  for (const entry of bank) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.setAttribute('aria-pressed', 'false');
    const img = document.createElement('img');
    img.src = entry.thumb;
    img.alt = entry.label;
    const label = document.createElement('span');
    label.textContent = entry.label;
    button.append(img, label);
    button.addEventListener('click', () => {
      const i = Number(panelSelect.value);
      placePhoto(i, entry.image);
      holder.querySelectorAll('.thumb').forEach((t) => t.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      syncPanelEditor();
    });
    holder.appendChild(button);
  }
}

function buildLayoutPicker() {
  const holder = document.getElementById('layoutPicker');
  const sketches = {
    hero: [[0, 0, 34, 26]],
    poster: [[0, 0, 34, 15], [0, 15, 17, 11], [17, 15, 17, 11]],
    trio: [[0, 0, 11, 26], [11, 0, 12, 26], [23, 0, 11, 26]],
    split: [[0, 0, 17, 26], [17, 0, 17, 26]],
    grid: [[0, 0, 17, 13], [17, 0, 17, 13], [0, 13, 17, 13], [17, 13, 17, 13]],
  };
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'layout-btn';
    button.setAttribute('aria-pressed', id === state.layout ? 'true' : 'false');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 34 26');
    for (const [x, y, w, h] of sketches[id]) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', w);
      rect.setAttribute('height', h);
      svg.appendChild(rect);
    }
    button.append(svg, document.createTextNode(layout.name));
    button.addEventListener('click', () => {
      state.layout = id;
      rebuildPanelControls();
      holder.querySelectorAll('.layout-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      redraw();
    });
    holder.appendChild(button);
  }
}

function exportPNG() {
  const [w, h] = SIZES[sizeSelect.value];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${sizeSelect.value}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-cover-${sizeSelect.value}.png (${w} × ${h}).`;
  }, 'image/png');
}

function randomise() {
  const layouts = Object.keys(LAYOUTS);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = ['sunset', 'neon', 'noir'][Math.floor(Math.random() * 3)];
  gradeSelect.value = state.grade;
  const titles = ['SUNSET HEIST', 'PALM ROYALE', 'NEON GETAWAY', 'VICE NIGHTS', 'OCEAN DRIVE'];
  const subs = ['VICE CITY · SUMMER 2026', 'TWO STARS. ONE SUNSET.', 'DRIVE FAST. LOOK FASTER.', 'THE CITY NEVER SLEEPS'];
  state.caption = titles[Math.floor(Math.random() * titles.length)];
  state.subtitle = subs[Math.floor(Math.random() * subs.length)];
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  rebuildPanelControls();
  document.querySelectorAll('.layout-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.textContent.trim() === LAYOUTS[state.layout].name));
  });
  state.panels.forEach((panel, i) => {
    const pick = bank[Math.floor(Math.random() * bank.length)];
    panel.image = pick.image;
    panel.zoom = 1 + Math.random() * 0.4;
    panel.panX = Math.random() * 0.6 - 0.3;
    panel.panY = Math.random() * 0.6 - 0.3;
  });
  syncPanelEditor();
  redraw();
}

panelSelect.addEventListener('change', syncPanelEditor);
panelPhoto.addEventListener('change', () => {
  const entry = bank.find((b) => b.id === panelPhoto.value);
  placePhoto(Number(panelSelect.value), entry ? entry.image : null);
});
zoomInput.addEventListener('input', () => {
  state.panels[Number(panelSelect.value)].zoom = Number(zoomInput.value) / 100;
  syncPanelEditor();
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[Number(panelSelect.value)].panX = Number(panXInput.value) / 100;
  syncPanelEditor();
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[Number(panelSelect.value)].panY = Number(panYInput.value) / 100;
  syncPanelEditor();
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; redraw(); });
sizeSelect.addEventListener('change', () => {
  const [w, h] = SIZES[sizeSelect.value];
  canvas.width = w;
  canvas.height = h;
  redraw();
});
document.getElementById('export').addEventListener('click', exportPNG);
document.getElementById('shuffle').addEventListener('click', randomise);
document.getElementById('upload').addEventListener('change', async (event) => {
  for (const file of event.target.files) {
    const image = await loadImage(URL.createObjectURL(file));
    const id = `upload-${bank.length}`;
    image.dataset.bankId = id;
    bank.push({ id, label: file.name.replace(/\.[^.]+$/, '').slice(0, 14) || 'Upload', image, thumb: image.src });
    buildPhotoBank();
    rebuildPanelControls();
  }
  if (event.target.files.length) {
    const i = Number(panelSelect.value);
    placePhoto(i, bank[bank.length - 1].image);
    syncPanelEditor();
    status.textContent = `${event.target.files.length} photo(s) added — placed in panel ${i + 1}.`;
  }
});

/** Loads the built-in photos, fills the default cover and hands over to shot mode. */
async function boot() {
  const boulevard = await loadImage('samples/boulevard.jpg');
  const pier = await loadImage('samples/pier.jpg');
  const sunset = paintSunsetScene();
  const entries = [
    { id: 'boulevard', label: 'Boulevard', image: boulevard, thumb: 'samples/boulevard.jpg' },
    { id: 'pier', label: 'Pier', image: pier, thumb: 'samples/pier.jpg' },
    { id: 'sunset', label: 'Sunset', image: sunset, thumb: sunset.toDataURL('image/jpeg', 0.8) },
  ];
  for (const entry of entries) {
    entry.image.dataset.bankId = entry.id;
    bank.push(entry);
  }
  buildLayoutPicker();
  buildPhotoBank();
  rebuildPanelControls();
  state.panels[0].image = pier;
  state.panels[1].image = boulevard;
  state.panels[2].image = sunset;
  syncPanelEditor();
  redraw();

  const params = new URLSearchParams(location.search);
  if (params.get('shot')) {
    await runShot(params.get('shot'), params, { state, bank, placePhoto, redraw, canvas, SIZES });
  }
  window.__vice = { state, bank, placePhoto, redraw, exportPNG, canvas };
}

boot();
