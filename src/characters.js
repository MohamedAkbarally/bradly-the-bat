// Character drawing: Bradly the bat, Henry the hummingbird, the mean bats, fireflies & stars.
import { rngFor, blob, paint, line, poly, INK } from './crayon.js';
import { TAU } from './util.js';

// ---------------------------------------------------------------- bat wing
// Right wing, shoulder at (0,0), length L. Scalloped bottom edge like the drawing.
function batWing(ctx, L, rng, fill, lw = 3) {
  const j = () => (rng() - 0.5) * 2;
  const tip = [L, -L * 0.34 + j()];
  const p1 = [L * 0.7, L * 0.04 + j()];
  const p2 = [L * 0.4, L * 0.12 + j()];
  const p3 = [0, L * 0.16];
  const path = new Path2D();
  path.moveTo(0, -L * 0.1);
  path.quadraticCurveTo(L * 0.45 + j(), -L * 0.62 + j(), tip[0], tip[1]);
  const sc = (a, b) => {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    path.quadraticCurveTo(m[0] - L * 0.02, m[1] - L * 0.13, b[0], b[1]);
  };
  sc(tip, p1);
  sc(p1, p2);
  sc(p2, p3);
  path.closePath();
  paint(ctx, path, { fill, lw, rng, grain: 0.5 });
  line(ctx, [[0, 0], [L * 0.45, -L * 0.1], p1], { lw: lw * 0.55, rng, alpha: 0.75 });
  line(ctx, [[0, 0], [p2[0] * 0.8, p2[1] * 0.4], p2], { lw: lw * 0.55, rng, alpha: 0.75 });
}

function wings(ctx, L, angle, rng, fill, sx, sy) {
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * sx, sy);
    ctx.scale(side, 1);
    ctx.rotate(-angle - 0.05);
    batWing(ctx, L, rng, fill);
    ctx.restore();
  }
}

function miniStar(ctx, x, y, r, fill = '#ffd93b') {
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rr = i % 2 ? r * 0.45 : r;
    i ? p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : p.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  p.closePath();
  ctx.fillStyle = fill;
  ctx.fill(p);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.stroke(p);
}

// ---------------------------------------------------------------- Bradly
// Origin = centre of his (big!) head. Feet are at y = +56 * scale.
export function drawBradly(ctx, x, y, o = {}) {
  const s = o.scale ?? 1, ws = o.wing ?? 1, amp = o.flapAmp ?? 1;
  const mood = o.mood || 'happy';
  const rng = rngFor(101);
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(s, s);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;

  const a = Math.sin(o.flap ?? 0) * 0.6 * amp + (o.wingLift ?? 0);
  wings(ctx, 80 * ws, a, rng, '#c9cad3', 9, 31);

  // feet
  line(ctx, [[-6, 47], [-7, 56]], { lw: 3, rng });
  line(ctx, [[6, 47], [7, 56]], { lw: 3, rng });
  // body
  paint(ctx, blob(0, 36, 14, 15, rng, 0.05, 10), { fill: '#8f909b', lw: 3, rng });
  // ears
  for (const sx of [-1, 1]) {
    paint(ctx, poly([[sx * 8, -24], [sx * 22, -52], [sx * 28, -12]], rng, 1), { fill: '#8f909b', lw: 3, rng });
    paint(ctx, poly([[sx * 13, -25], [sx * 21, -43], [sx * 24, -20]], rng, 0.6), { fill: '#c99aa8', outline: false, grain: 0.3 });
  }
  // the big head
  paint(ctx, blob(0, 0, 34, 30, rng, 0.03, 16), { fill: '#a0a1ab', lw: 3.2, rng, grain: 0.55 });
  // cheeks
  ctx.fillStyle = 'rgba(244,140,165,0.38)';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * 23, 12, 6, 4, 0, 0, TAU);
    ctx.fill();
  }

  // eyes
  const look = o.look || [1, 0];
  const blink = o.blink || 0;
  for (const ex of [-11.5, 11.5]) {
    const ey = -3;
    if (blink > 0.5 && mood !== 'dizzy') {
      line(ctx, [[ex - 9, ey + 1], [ex, ey + 4], [ex + 9, ey + 1]], { lw: 3, rng });
      continue;
    }
    paint(ctx, blob(ex, ey, 11.5, 12.5, rng, 0.04, 12), { fill: '#ffffff', lw: 2.6, rng, grain: 0.1 });
    if (mood === 'dizzy') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const t0 = (o.t || 0) * 8;
      for (let k = 0; k < 24; k++) {
        const aa = t0 + k * 0.5, rr = k * 0.32;
        const px = ex + Math.cos(aa) * rr, py = ey + Math.sin(aa) * rr;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    } else {
      const px = ex + look[0] * 4.5, py = ey + 1 + look[1] * 4.5;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(px, py, mood === 'wow' ? 4.2 : 5.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px - 1.8, py - 2, 1.8, 0, TAU);
      ctx.fill();
    }
  }

  // sunglasses
  if (o.shades) {
    ctx.save();
    ctx.translate(0, o.shadesY || 0);
    for (const ex of [-12.5, 12.5]) {
      paint(ctx, blob(ex, -3, 13.5, 10.5, rng, 0.03, 12), { fill: '#141418', lw: 2.6, rng, grain: 0.15 });
      line(ctx, [[ex - 8, -7], [ex - 3, -10]], { color: 'rgba(255,255,255,0.8)', lw: 2.2 });
    }
    line(ctx, [[-1, -6], [1, -6]], { lw: 3 });
    line(ctx, [[-26, -6], [-34, -9]], { lw: 3, rng });
    line(ctx, [[26, -6], [34, -9]], { lw: 3, rng });
    ctx.restore();
  }

  // mouth
  if (mood === 'wow') {
    paint(ctx, blob(0, 17, 4, 5, rng, 0.05, 8), { fill: '#5a1f2a', lw: 2.2, grain: 0 });
  } else if (mood === 'sad') {
    line(ctx, [[-7, 18], [0, 13.5], [7, 18]], { lw: 2.6, rng });
  } else if (mood === 'dizzy') {
    line(ctx, [[-8, 16], [-4, 13], [0, 16], [4, 13], [8, 16]], { lw: 2.4, rng });
  } else if (mood === 'joy') {
    const m = new Path2D();
    m.moveTo(-10, 11);
    m.quadraticCurveTo(0, 27, 10, 11);
    m.closePath();
    paint(ctx, m, { fill: '#7a2433', lw: 2.4, grain: 0 });
    paint(ctx, poly([[2, 12], [4.5, 17], [7, 12]], null), { fill: '#fff', lw: 1.4, grain: 0 });
  } else {
    line(ctx, [[-8, 12], [0, 18.5], [8, 12]], { lw: 2.6, rng });
    paint(ctx, poly([[2, 15.5], [4, 19.5], [6, 14.2]], null), { fill: '#fff', lw: 1.4, grain: 0 });
  }

  // dizzy stars
  if (o.dizzy > 0) {
    const t = o.t || 0;
    for (let i = 0; i < 3; i++) {
      const aa = t * 6 + (i * TAU) / 3;
      miniStar(ctx, Math.cos(aa) * 32, -46 + Math.sin(aa) * 8, 6);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Henry
function hWing(ctx, ang, rng, col, alpha) {
  ctx.save();
  ctx.translate(-3, -4);
  ctx.rotate(ang);
  ctx.globalAlpha *= alpha;
  paint(ctx, blob(15, 0, 16, 5.8, rng, 0.06, 10), { fill: col, lw: 2.4, rng, grain: 0.3 });
  ctx.restore();
}

export function drawHenry(ctx, x, y, o = {}) {
  const s = o.scale ?? 1, t = o.t ?? 0, f = o.facing ?? 1;
  const rng = rngFor(202);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * f, s);
  if (o.rot) ctx.rotate(o.rot);
  const wa = Math.sin(t * 38) * 0.75;
  hWing(ctx, -2.1 - wa * 0.7, rng, '#8f3419', 0.7);
  // tail
  paint(ctx, poly([[-12, 5], [-30, 13], [-26, 4], [-31, -3], [-12, -1]], rng, 0.8), { fill: '#b8461f', lw: 2.6, rng });
  // body + belly
  paint(ctx, blob(-1, 4, 16, 12, rng, 0.05, 12), { fill: '#e85a2a', lw: 3, rng });
  paint(ctx, blob(3, 9, 9, 4.5, rng, 0.08, 10), { fill: '#f7a35d', outline: false, grain: 0.3 });
  // head
  paint(ctx, blob(11, -7, 10.5, 10, rng, 0.05, 12), { fill: '#e85a2a', lw: 3, rng });
  // long beak
  line(ctx, [[20, -6], [29, -5], [38, -3]], { lw: 2.8, rng, color: '#2a2018' });
  // eye
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(14, -9, 3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(13, -10.2, 1.1, 0, TAU);
  ctx.fill();
  if (o.happy) line(ctx, [[10, -1], [14, 1], [18, -1]], { lw: 1.8 });
  // front wing (with a blur ghost)
  hWing(ctx, -1.9 - wa + 0.5, rng, '#b5431f', 0.28);
  hWing(ctx, -1.9 - wa, rng, '#b5431f', 1);
  ctx.restore();
}

// ---------------------------------------------------------------- mean bats
export function drawMeanBat(ctx, x, y, o = {}) {
  const s = o.scale ?? 1, t = o.t ?? 0, f = o.facing ?? 1, seed = o.seed || 0;
  const rng = rngFor(303 + seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * f, s);
  const a = Math.sin(t * 9 + seed * 1.7) * 0.6;
  wings(ctx, 54, a, rng, '#34343d', 7, 21);
  paint(ctx, blob(0, 24, 11, 12, rng, 0.05, 10), { fill: '#5f606b', lw: 3, rng });
  for (const sx of [-1, 1]) {
    paint(ctx, poly([[sx * 5, -14], [sx * 15, -35], [sx * 20, -7]], rng, 0.8), { fill: '#5f606b', lw: 3, rng });
  }
  paint(ctx, blob(0, 0, 22, 19, rng, 0.04, 14), { fill: '#6c6d78', lw: 3, rng, grain: 0.5 });
  // eyes looking at Bradly
  for (const ex of [-7.5, 7.5]) {
    paint(ctx, blob(ex, -2, 6.5, 6.5, rng, 0.05, 10), { fill: '#fff9d8', lw: 2.2, grain: 0 });
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex + 2.2, -1, 3, 0, TAU);
    ctx.fill();
  }
  // grumpy brows
  line(ctx, [[-15, -12], [-3, -7]], { lw: 3.2, rng });
  line(ctx, [[15, -12], [3, -7]], { lw: 3.2, rng });
  // smirk with fangs
  const m = new Path2D();
  m.moveTo(-9, 7);
  m.quadraticCurveTo(0, 17, 10, 6);
  m.quadraticCurveTo(0, 10, -9, 7);
  m.closePath();
  paint(ctx, m, { fill: '#3b1a22', lw: 2.2, grain: 0 });
  paint(ctx, poly([[-4, 8.6], [-2.5, 13], [-1, 9.2]], null), { fill: '#fff', lw: 1.2, grain: 0 });
  paint(ctx, poly([[3, 9], [4.5, 13], [6, 8.4]], null), { fill: '#fff', lw: 1.2, grain: 0 });
  ctx.restore();
}

// ---------------------------------------------------------------- fireflies & stars
let glow = null;
function glowSprite() {
  if (glow) return glow;
  glow = document.createElement('canvas');
  glow.width = glow.height = 96;
  const g = glow.getContext('2d');
  const gr = g.createRadialGradient(48, 48, 2, 48, 48, 48);
  gr.addColorStop(0, 'rgba(255,245,160,0.85)');
  gr.addColorStop(0.35, 'rgba(255,230,110,0.35)');
  gr.addColorStop(1, 'rgba(255,230,110,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 96, 96);
  return glow;
}

export function drawGlow(ctx, x, y, r, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(glowSprite(), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// Yellow scribbled "asterisk" stars, just like the ones in the drawing.
export function drawFirefly(ctx, x, y, t, seed = 0, scale = 1) {
  const pulse = 0.75 + 0.25 * Math.sin(t * 5 + seed * 3);
  drawGlow(ctx, x, y, 30 * scale * (0.85 + pulse * 0.3), pulse);
  const r = (7 + pulse * 1.6) * scale;
  ctx.save();
  ctx.strokeStyle = '#ffe345';
  ctx.lineWidth = 2.6 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 4 + seed;
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.fillStyle = '#fffbd6';
  ctx.beginPath();
  ctx.arc(x, y, 2.6 * scale, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawStar(ctx, x, y, t, seed = 0, scale = 1) {
  const pulse = 0.8 + 0.2 * Math.sin(t * 4 + seed * 2);
  drawGlow(ctx, x, y, 34 * scale, 0.7 * pulse);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2 + seed) * 0.25);
  ctx.scale(scale, scale);
  miniStar(ctx, 0, 0, 13);
  ctx.restore();
}
