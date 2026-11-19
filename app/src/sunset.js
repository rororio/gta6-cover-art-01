// Paints a procedural Vice City sunset on an offscreen canvas: gradient sky, a low
// sun with glow, a palm-fringed skyline and its reflection on the water. It is the
// app's third built-in sample photo, so the cover maker works with no upload at all.

/** Returns a canvas (720 x 720) holding the painted sunset scene. */
export function paintSunsetScene() {
  const size = 720;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, size * 0.62);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.35, '#7b1e6e');
  sky.addColorStop(0.62, '#e8446e');
  sky.addColorStop(0.85, '#ff7a3d');
  sky.addColorStop(1, '#ffc93d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size * 0.62);

  // Sun with a soft halo, sitting just above the skyline so no tower hides it.
  const sunX = size * 0.5;
  const sunY = size * 0.36;
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, size * 0.26);
  halo.addColorStop(0, 'rgba(255,220,140,0.95)');
  halo.addColorStop(0.5, 'rgba(255,150,90,0.45)');
  halo.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, size * 0.085, 0, Math.PI * 2);
  ctx.fill();

  // A few drifting birds.
  ctx.strokeStyle = 'rgba(30,8,40,0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const [bx, by, s] of [[0.2, 0.2, 16], [0.3, 0.14, 12], [0.72, 0.24, 14], [0.62, 0.12, 10]]) {
    const x = bx * size;
    const y = by * size;
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s / 2, y - s * 0.6, x, y);
    ctx.quadraticCurveTo(x + s / 2, y - s * 0.6, x + s, y);
    ctx.stroke();
  }

  // Skyline: dark towers with a few lit windows, all shorter than the sun's seat.
  const horizon = size * 0.62;
  ctx.fillStyle = '#1d0b33';
  const towers = [[0, 0.14], [0.14, 0.2], [0.3, 0.11], [0.44, 0.22], [0.6, 0.15], [0.74, 0.2], [0.88, 0.13]];
  for (const [fx, fh] of towers) {
    const tw = size * 0.14;
    ctx.fillRect(fx * size, horizon - fh * size, tw, fh * size);
  }
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 40; i++) {
    const wx = (0.03 + Math.random() * 0.94) * size;
    const wy = horizon - Math.random() * size * 0.22;
    ctx.fillRect(wx, wy, 4, 5);
  }

  // Water with sun glitter.
  const sea = ctx.createLinearGradient(0, horizon, 0, size);
  sea.addColorStop(0, '#ff9a5c');
  sea.addColorStop(0.25, '#c93a7e');
  sea.addColorStop(1, '#2b1055');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, size, size - horizon);
  ctx.fillStyle = 'rgba(255,230,160,0.75)';
  for (let i = 0; i < 26; i++) {
    const y = horizon + 8 + Math.random() * (size - horizon - 16);
    const spread = 30 + (y - horizon) * 0.55;
    const x = sunX + (Math.random() * 2 - 1) * spread;
    ctx.fillRect(x, y, 26 + Math.random() * 50, 3);
  }

  drawPalm(ctx, size * 0.12, size * 0.66, size * 0.3, -0.25);
  drawPalm(ctx, size * 0.9, size * 0.7, size * 0.34, 0.3);
  return canvas;
}

/** A palm silhouette: a leaning trunk and seven drooping fronds. */
function drawPalm(ctx, x, y, height, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = '#160826';
  ctx.lineWidth = height * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(height * 0.06, -height * 0.55, height * 0.02, -height);
  ctx.stroke();
  ctx.translate(height * 0.02, -height);
  ctx.fillStyle = '#160826';
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * (0.08 + i * 0.13);
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(height * 0.28, -height * 0.05, height * 0.52, height * 0.16);
    ctx.quadraticCurveTo(height * 0.26, height * 0.1, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
