// Renders a GTA-style multi-panel cover onto a canvas: panel photos with crop and
// position, a sunset/neon/noir colour grade, and bold caption lettering with a VI badge.
// Everything is drawn with the canvas 2D API; no image leaves the machine.

export const LAYOUTS = {
  hero:   { name: 'Hero',    panels: [[0, 0, 1, 1]] },
  poster: { name: 'Poster',  panels: [[0, 0, 1, 0.62], [0, 0.62, 0.5, 0.38], [0.5, 0.62, 0.5, 0.38]] },
  trio:   { name: 'Trio',    panels: [[0, 0, 0.34, 1], [0.34, 0, 0.32, 1], [0.66, 0, 0.34, 1]] },
  split:  { name: 'Split',   panels: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] },
  grid:   { name: 'Grid',    panels: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
};

export const GRADES = {
  sunset: { filter: 'saturate(1.25) contrast(1.08)', wash: ['rgba(255,110,60,0.10)', 'rgba(214,32,140,0.30)'] },
  neon:   { filter: 'saturate(1.45) contrast(1.12)', wash: ['rgba(20,220,255,0.12)', 'rgba(255,0,160,0.28)'] },
  noir:   { filter: 'grayscale(1) contrast(1.25) brightness(1.05)', wash: ['rgba(0,0,0,0)', 'rgba(10,10,30,0.35)'] },
  none:   { filter: 'none', wash: null },
};

/** A panel's photo placement: source image, zoom (1 = cover-fit) and pan in -1..1. */
export function blankPanel() {
  return { image: null, zoom: 1, panX: 0, panY: 0 };
}

function coverFitRect(photo, rect, zoom, panX, panY) {
  // Images carry naturalWidth; the painted sunset sample is a canvas, so fall back.
  const iw = photo.naturalWidth ?? photo.width;
  const ih = photo.naturalHeight ?? photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const slackX = Math.max(0, (pw - rect.w) / 2);
  const slackY = Math.max(0, (ph - rect.h) / 2);
  return {
    x: rect.x + (rect.w - pw) / 2 - panX * slackX,
    y: rect.y + (rect.h - ph) / 2 - panY * slackY,
    w: pw,
    h: ph,
  };
}

function drawPanelPhoto(ctx, photo, rect, panel) {
  const r = coverFitRect(photo, rect, panel.zoom, panel.panX, panel.panY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);
  ctx.restore();
}

function drawEmptyPanel(ctx, rect, index) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#3a1c52');
  g.addColorStop(1, '#1c0f2a');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `700 ${Math.max(14, rect.w * 0.06)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
}

function drawBadge(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.06);
  const w = size * 1.9;
  const h = size;
  const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  grad.addColorStop(0, '#ff2e88');
  grad.addColorStop(0.55, '#ff7a3d');
  grad.addColorStop(1, '#ffc93d');
  ctx.fillStyle = grad;
  roundRect(ctx, -w / 2, -h / 2, w, h, h * 0.22);
  ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${size * 0.62}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VI', 0, size * 0.03);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx, text, maxWidth, startSize, weight = 900) {
  let size = startSize;
  ctx.font = `${weight} ${size}px Impact, "Arial Black", system-ui, sans-serif`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px Impact, "Arial Black", system-ui, sans-serif`;
  }
  return size;
}

function drawCaption(ctx, w, h, caption, subtitle, layoutId) {
  const title = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const bandH = h * (layoutId === 'poster' ? 0.16 : 0.2);
  const bandY = h - bandH;
  const shade = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  shade.addColorStop(0, 'rgba(10,4,18,0)');
  shade.addColorStop(0.45, 'rgba(10,4,18,0.72)');
  shade.addColorStop(1, 'rgba(10,4,18,0.88)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);

  if (title) {
    const size = fitFont(ctx, title, w * 0.88, h * 0.11);
    ctx.save();
    ctx.translate(w / 2, h - h * 0.055);
    ctx.rotate(-0.012);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.14;
    ctx.strokeStyle = '#12081a';
    ctx.strokeText(title, 0, 0);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.28;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffc93d';
    ctx.fillText(title, 0, -size * 0.045);
    ctx.restore();
  }
  if (sub) {
    const size = fitFont(ctx, sub, w * 0.7, h * 0.032, 700);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f5eef7';
    ctx.fillText(sub, w / 2, h - h * 0.135);
  }
  drawBadge(ctx, w * 0.085, h * 0.085, h * 0.075);
}

/**
 * Draws the whole cover. `state` holds layout, panels (one per layout slot),
 * caption, subtitle and grade. The canvas keeps its own pixel size.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.poster;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const gutter = Math.max(3, Math.round(Math.min(w, h) * 0.006));

  ctx.fillStyle = '#12081a';
  ctx.fillRect(0, 0, w, h);

  ctx.filter = grade.filter === 'none' ? 'none' : grade.filter;
  layout.panels.forEach(([fx, fy, fw, fh], i) => {
    const rect = {
      x: fx * w + (fx > 0 ? gutter / 2 : 0),
      y: fy * h + (fy > 0 ? gutter / 2 : 0),
      w: fw * w - (fx > 0 ? gutter / 2 : 0) - (fx + fw < 1 ? gutter / 2 : 0),
      h: fh * h - (fy > 0 ? gutter / 2 : 0) - (fy + fh < 1 ? gutter / 2 : 0),
    };
    const panel = state.panels[i] ?? blankPanel();
    if (panel.image) drawPanelPhoto(ctx, panel.image, rect, panel);
    else drawEmptyPanel(ctx, rect, i);
  });
  ctx.filter = 'none';

  if (grade.wash) {
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  }

  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,18,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = gutter;
  ctx.strokeRect(gutter / 2, gutter / 2, w - gutter, h - gutter);

  drawCaption(ctx, w, h, state.caption, state.subtitle, state.layout);
}
