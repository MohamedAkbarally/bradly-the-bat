// Hand-drawn / crayon rendering helpers.
import { mulberry32, TAU } from './util.js';

export const INK = '#17171d';

// "Line boil": shapes re-jitter a few times a second, like a hand-drawn cartoon.
let boilFrame = 0;
export function setBoil(t) {
  boilFrame = Math.floor(t * 6) % 3;
}
export function rngFor(seed) {
  return mulberry32((seed | 0) * 7919 + boilFrame * 104729 + 17);
}

// ---- paper / crayon grain --------------------------------------------------
const grainCanvas = document.createElement('canvas');
const patterns = new WeakMap();

export function initCrayon() {
  const g = grainCanvas;
  g.width = g.height = 128;
  const c = g.getContext('2d');
  const r = mulberry32(42);
  for (let i = 0; i < 1900; i++) {
    const x = r() * 128, y = r() * 128;
    c.fillStyle = r() < 0.72
      ? `rgba(255,255,255,${0.12 + r() * 0.35})`
      : `rgba(0,0,0,${0.06 + r() * 0.14})`;
    c.fillRect(x, y, 1 + r() * 2.2, 1 + r() * 1.2);
  }
  c.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    c.strokeStyle = `rgba(255,255,255,${0.07 + r() * 0.12})`;
    const x = r() * 110, y = 10 + r() * 110;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 6 + r() * 12, y - 3 - r() * 6);
    c.stroke();
  }
}

export function grainFor(ctx) {
  let p = patterns.get(ctx);
  if (!p) {
    p = ctx.createPattern(grainCanvas, 'repeat');
    patterns.set(ctx, p);
  }
  return p;
}

// ---- paths -------------------------------------------------------------------
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function signedArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s;
}

export function smoothClosed(pts, path = new Path2D()) {
  const n = pts.length;
  const m0 = mid(pts[n - 1], pts[0]);
  path.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const c = pts[i], m = mid(c, pts[(i + 1) % n]);
    path.quadraticCurveTo(c[0], c[1], m[0], m[1]);
  }
  path.closePath();
  return path;
}

export function smoothOpen(pts, path = new Path2D()) {
  path.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) {
    path.lineTo(pts[1][0], pts[1][1]);
    return path;
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const m = mid(pts[i], pts[i + 1]);
    path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  const l = pts[pts.length - 1];
  path.lineTo(l[0], l[1]);
  return path;
}

// Wobbly ellipse. Always wound the same way so unions fill correctly.
export function blob(cx, cy, rx, ry, rng, wob = 0.05, n = 14) {
  const pts = [];
  const off = rng ? rng() * TAU : 0;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU;
    const k = 1 + (rng ? (rng() * 2 - 1) * wob : 0);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts);
}

// Straight-edged polygon with jittered corners (winding normalised).
export function poly(pts, rng, j = 1) {
  let q = pts.map((p) => [p[0] + (rng ? (rng() - 0.5) * 2 * j : 0), p[1] + (rng ? (rng() - 0.5) * 2 * j : 0)]);
  if (signedArea(q) < 0) q = q.reverse();
  const p = new Path2D();
  q.forEach((pt, i) => (i ? p.lineTo(pt[0], pt[1]) : p.moveTo(pt[0], pt[1])));
  p.closePath();
  return p;
}

// ---- painting ----------------------------------------------------------------
export function paint(ctx, path, o = {}) {
  const { fill, stroke = INK, lw = 3, grain = 0.45, rng = null, outline = true } = o;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
    if (grain > 0) {
      ctx.save();
      ctx.clip(path);
      ctx.globalAlpha *= grain;
      ctx.fillStyle = grainFor(ctx);
      ctx.fillRect(-3000, -3000, 6000, 6000);
      ctx.restore();
    }
  }
  if (outline && stroke) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke(path);
    if (rng) {
      ctx.save();
      ctx.translate((rng() - 0.5) * lw * 0.8, (rng() - 0.5) * lw * 0.8);
      ctx.globalAlpha *= 0.45;
      ctx.lineWidth = lw * 0.6;
      ctx.stroke(path);
      ctx.restore();
    }
  }
}

export function line(ctx, pts, o = {}) {
  const { color = INK, lw = 3, rng = null, jitter = 0.7, alpha = 1 } = o;
  const q = rng ? pts.map((p) => [p[0] + (rng() - 0.5) * jitter * 2, p[1] + (rng() - 0.5) * jitter * 2]) : pts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(smoothOpen(q));
  ctx.restore();
}

// Outline a union of sub-paths (stroke wide, then fill over the inside).
export function outlinedUnion(ctx, path, fill, stroke, lw) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw * 2;
  ctx.stroke(path);
  ctx.fillStyle = fill;
  ctx.fill(path);
}

// Lots of short zig-zag marker strokes (used for skies, grass, sea...).
export function strokes(ctx, o) {
  const [x0, y0, x1, y1] = o.box;
  const { count, colors, rng } = o;
  const len = o.len || [20, 60], lw = o.lw || [2, 5], al = o.alpha || [0.3, 0.7];
  const ang = o.angle ?? -0.5, av = o.angleVar ?? 0.3, wrap = o.wrap || 0;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < count; i++) {
    const x = x0 + rng() * (x1 - x0), y = y0 + rng() * (y1 - y0);
    const l = len[0] + rng() * (len[1] - len[0]);
    const a = ang + (rng() - 0.5) * av;
    const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
    const nx = -Math.sin(a), ny = Math.cos(a);
    const step = 2.5 + rng() * 3;
    ctx.strokeStyle = colors[(rng() * colors.length) | 0];
    ctx.globalAlpha = al[0] + rng() * (al[1] - al[0]);
    ctx.lineWidth = lw[0] + rng() * (lw[1] - lw[0]);
    const zig = o.zig === false ? 1 : 1 + ((rng() * 3) | 0);
    const offs = wrap ? [-wrap, 0, wrap] : [0];
    for (const ox of offs) {
      const sx = x + ox;
      if (wrap && (sx < -l - 30 || sx > wrap + l + 30)) continue;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      for (let k = 1; k <= zig; k++) {
        const end = k % 2 === 1;
        ctx.lineTo(sx + (end ? dx : 0) + nx * step * k, y + (end ? dy : 0) + ny * step * k);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Back-and-forth marker colouring, clipped to a path.
export function scribble(ctx, path, box, colors, rng, o = {}) {
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 10;
  ctx.save();
  if (path) ctx.clip(path);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const col of colors) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((o.angle ?? -0.6) + (rng() - 0.5) * (o.angleVar ?? 0.5));
    ctx.strokeStyle = col;
    ctx.lineWidth = o.lw ?? 4;
    ctx.globalAlpha = o.alpha ?? 0.5;
    const gap = o.gap ?? 6;
    ctx.beginPath();
    let left = true;
    ctx.moveTo(-R, -R);
    for (let y = -R; y <= R; y += gap * (0.6 + rng() * 0.8)) {
      const xa = -R * (0.85 + rng() * 0.15), xb = R * (0.85 + rng() * 0.15);
      ctx.lineTo(left ? xb : xa, y + (rng() - 0.5) * gap);
      left = !left;
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
