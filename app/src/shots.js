// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover shows the cover alone, at the size the query names.
// The query can pick layout, grade, caption, subtitle and photo per panel:
//   ?shot=cover&size=1920x1080&layout=poster&grade=neon&caption=Neon%20Getaway
//   &panel0=pier&panel1=boulevard&panel2=sunset
// window.__shotReady is set once the cover is painted.

/** Applies a shot scene to the booted app. `app` carries the live state and helpers. */
export async function runShot(shot, query, app) {
  const { state, bank, placePhoto, redraw, canvas, SIZES } = app;
  const pick = (id) => bank.find((entry) => entry.id === id);

  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('caption')) state.caption = query.get('caption');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');

  const sizeKey = query.get('size') ?? '1080x1080';
  const [w, h] = SIZES[sizeKey] ?? SIZES['1080x1080'];
  canvas.width = w;
  canvas.height = h;

  // Rebuild the panel list for the chosen layout, then fill it from the query.
  const panelCount = { hero: 1, poster: 3, trio: 3, split: 2, grid: 4 }[state.layout] ?? 3;
  const fresh = [];
  for (let i = 0; i < panelCount; i++) fresh.push({ image: null, zoom: 1, panX: 0, panY: 0 });
  state.panels = fresh;
  for (let i = 0; i < panelCount; i++) {
    const entry = pick(query.get(`panel${i}`) ?? (i === 0 ? 'pier' : i === 1 ? 'boulevard' : 'sunset'));
    if (entry) placePhoto(i, entry.image);
    const zoom = Number(query.get(`zoom${i}`));
    if (Number.isFinite(zoom) && zoom >= 1) state.panels[i].zoom = zoom;
    const panY = Number(query.get(`panY${i}`));
    if (Number.isFinite(panY) && panY >= -1 && panY <= 1) state.panels[i].panY = panY;
    const panX = Number(query.get(`panX${i}`));
    if (Number.isFinite(panX) && panX >= -1 && panX <= 1) state.panels[i].panX = panX;
  }

  const captionInput = document.getElementById('caption');
  const subtitleInput = document.getElementById('subtitle');
  if (captionInput) captionInput.value = state.caption;
  if (subtitleInput) subtitleInput.value = state.subtitle;
  const gradeSelect = document.getElementById('grade');
  if (gradeSelect) gradeSelect.value = state.grade;
  const sizeSelect = document.getElementById('size');
  if (sizeSelect) sizeSelect.value = sizeKey;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
