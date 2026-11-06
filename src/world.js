// Pre-rendered crayon backgrounds and scenery.
import { mulberry32, W, H, TAU } from './util.js';
import { strokes, scribble, blob, poly, paint, outlinedUnion, INK } from './crayon.js';

export const PR = 1.5; // pre-render resolution multiplier
export const STRIP = 1920; // width of tileable strips
export const A = {};

export function groundY(x) {
  return 458 + 15 * Math.sin((TAU * x) / 960) + 9 * Math.sin((TAU * x) / 480 + 1.3) + 5 * Math.sin((TAU * x) / 320 + 0.4);
}
export function hillY(x) {
  return 372 + 26 * Math.sin((TAU * x) / 1920 + 0.5) + 16 * Math.sin((TAU * x) / 640 + 2) + 8 * Math.sin((TAU * x) / 384 + 1);
}
export function seaTop(x) {
  return 452 + 5 * Math.sin((TAU * x) / 480);
}

function mk(w, h, y0 = 0) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * PR);
  c.height = Math.ceil(h * PR);
  const x = c.getContext('2d');
  x.scale(PR, PR);
  x.translate(0, -y0);
  return { c, x, w, h, y0 };
}

// ------------------------------------------------------------------ drawing helpers
export function strip(ctx, s, off) {
  const o = ((off % STRIP) + STRIP) % STRIP;
  ctx.drawImage(s.c, -o, s.y0, STRIP + 1, s.h);
  ctx.drawImage(s.c, STRIP - o - 1, s.y0, STRIP + 1, s.h);
}

export function sprite(ctx, s, x, y, sc = 1, ax = 0.5, ay = 1, rot = 0, flip = false) {
  const w = s.w * sc, h = s.h * sc;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(s.c, -w * ax, -h * ay, w, h);
  ctx.restore();
}

const TW = [];
{
  const r = mulberry32(99);
  for (let i = 0; i < 26; i++) TW.push([r() * W, 20 + r() * 300, r() * 6, 0.6 + r() * 0.6]);
}
export function drawTwinkles(ctx, t, alpha = 1) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.strokeStyle = '#ffe45c';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  for (const [x, y, ph, s] of TW) {
    const k = 0.6 + 0.4 * Math.sin(t * 2 + ph);
    ctx.globalAlpha = alpha * k;
    const R = 5 * s * k;
    ctx.beginPath();
    for (let j = 0; j < 3; j++) {
      const a = (j * Math.PI) / 3 + ph;
      ctx.moveTo(x - Math.cos(a) * R, y - Math.sin(a) * R);
      ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Trees and bushes along the meadow (deterministic per segment).
export function drawScenery(ctx, cam, o = {}) {
  const { home = true, maxX = Infinity } = o;
  if (home && 110 - cam > -260) sprite(ctx, A.tree, 110 - cam, groundY(110) + 14, 0.85);
  const i0 = Math.floor((cam - 700) / 900), i1 = Math.floor((cam + W + 700) / 900);
  for (let i = Math.max(1, i0); i <= i1; i++) {
    const r = mulberry32(i * 7919 + 3);
    const x = i * 900 + r() * 450;
    if (x > maxX) continue;
    const tree = r() < 0.5;
    const s = tree ? 0.38 + r() * 0.22 : 0.55 + r() * 0.45;
    sprite(ctx, tree ? A.tree : A.bush, x - cam, groundY(x) + (tree ? 12 : 16), s, 0.5, 1, 0, r() < 0.5);
  }
}

// ------------------------------------------------------------------ pre-renders
function makeSky(top, bottom, cols, seed) {
  const s = mk(W, H), x = s.x, r = mulberry32(seed);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  strokes(x, { box: [-30, -30, W + 30, H + 30], count: 1300, colors: cols, rng: r, len: [30, 90], lw: [3, 7], alpha: [0.2, 0.5], angle: -0.45 });
  return s;
}

function terrainPath(fn, step = 6) {
  const p = new Path2D();
  p.moveTo(-4, H + 4);
  for (let i = -4; i <= STRIP + 4; i += step) p.lineTo(i, fn(i));
  p.lineTo(STRIP + 4, H + 4);
  p.closePath();
  return p;
}
function topLine(x, fn, color, lw, r) {
  x.save();
  x.strokeStyle = color;
  x.lineWidth = lw;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.beginPath();
  for (let i = -4; i <= STRIP + 4; i += 8) {
    const y = fn(i) + (r() - 0.5) * 1.2;
    i === -4 ? x.moveTo(i, y) : x.lineTo(i, y);
  }
  x.stroke();
  x.restore();
}

function makeHills() {
  const s = mk(STRIP, H - 320, 320), x = s.x, r = mulberry32(7);
  const p = terrainPath(hillY);
  x.fillStyle = '#1c5a34';
  x.fill(p);
  x.save();
  x.clip(p);
  strokes(x, { box: [0, 330, STRIP, H], count: 900, colors: ['#236b3d', '#174d2c', '#2b7a47'], rng: r, len: [30, 80], lw: [3, 6], alpha: [0.4, 0.8], angle: -0.5, wrap: STRIP });
  x.restore();
  topLine(x, hillY, '#0f3a20', 3, r);
  return s;
}

function makeGround() {
  const s = mk(STRIP, H - 425, 425), x = s.x, r = mulberry32(8);
  const p = terrainPath(groundY);
  x.fillStyle = '#3a9d38';
  x.fill(p);
  x.save();
  x.clip(p);
  strokes(x, { box: [0, 430, STRIP, H], count: 1100, colors: ['#4bb543', '#2f8a2f', '#5fc552', '#358f33'], rng: r, len: [25, 60], lw: [3, 6], alpha: [0.4, 0.8], angle: -0.7, wrap: STRIP });
  x.restore();
  topLine(x, groundY, '#1d5a1f', 3.5, r);
  x.strokeStyle = '#256f26';
  x.lineWidth = 2;
  x.lineCap = 'round';
  for (let i = 6; i < STRIP - 6; i += 11) {
    const x0 = i + r() * 6, y0 = groundY(x0) + 2;
    x.beginPath();
    x.moveTo(x0, y0);
    x.lineTo(x0 - 3 + r() * 2, y0 - 6 - r() * 6);
    x.moveTo(x0 + 3, y0);
    x.lineTo(x0 + 5, y0 - 4 - r() * 5);
    x.stroke();
  }
  return s;
}

function makeSea() {
  const s = mk(STRIP, H - 430, 430), x = s.x, r = mulberry32(9);
  const p = terrainPath(seaTop);
  const g = x.createLinearGradient(0, 440, 0, H);
  g.addColorStop(0, '#2fb5d0');
  g.addColorStop(1, '#1b78ac');
  x.fillStyle = g;
  x.fill(p);
  x.save();
  x.clip(p);
  strokes(x, { box: [0, 445, STRIP, H], count: 700, colors: ['#7fd8ea', '#4fc3dc', '#1f8fbf'], rng: r, len: [20, 50], lw: [2, 4], alpha: [0.4, 0.8], angle: 0, angleVar: 0.15, wrap: STRIP });
  x.restore();
  topLine(x, seaTop, '#0f5878', 3, r);
  return s;
}

const CLOUD = { fill: '#ffffff', ink: '#4d5f86', shade: ['#dbe5f5', '#c9d6ee'] };
const STORM = { fill: '#8c91a6', ink: '#2b2f3d', shade: ['#6f7489', '#7d8298', '#5f6478'] };

function makeCloud(w, h, seed, pal = CLOUD) {
  const s = mk(w, h), x = s.x, r = mulberry32(seed);
  const p = new Path2D();
  const n = Math.max(3, Math.round(w / 60));
  const pad = 8;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const cx = pad + (w - 2 * pad) * (0.12 + 0.76 * t);
    const rad = h * (0.22 + r() * 0.08);
    const cy = h - pad - rad * 0.95;
    p.moveTo(cx + rad, cy);
    p.arc(cx, cy, rad, 0, TAU);
  }
  for (let i = 0; i < n - 1; i++) {
    const t = (i + 1) / n;
    const cx = pad + (w - 2 * pad) * (0.12 + 0.76 * t) + (r() - 0.5) * 10;
    const rad = h * (0.26 + r() * 0.12);
    const cy = h * 0.48 + (r() - 0.5) * h * 0.08;
    p.moveTo(cx + rad, cy);
    p.arc(cx, cy, rad, 0, TAU);
  }
  outlinedUnion(x, p, pal.fill, pal.ink, 2.5);
  x.save();
  x.clip(p);
  strokes(x, { box: [0, h * 0.45, w, h], count: Math.round((w * h) / 260), colors: pal.shade, rng: r, len: [15, 40], lw: [2, 5], alpha: [0.4, 0.8], angle: -0.3 });
  x.restore();
  return s;
}

function makeCloudFloor() {
  const s = mk(STRIP, H - 360, 360), x = s.x, r = mulberry32(14);
  const p = new Path2D();
  for (let cx = 0; cx < STRIP; cx += 55 + r() * 30) {
    const rad = 40 + r() * 38;
    const cy = 470 + r() * 14 - rad * 0.25;
    for (const ox of [-STRIP, 0, STRIP]) {
      p.moveTo(cx + ox + rad, cy);
      p.arc(cx + ox, cy, rad, 0, TAU);
    }
  }
  p.rect(-50, 470, STRIP + 100, 120);
  outlinedUnion(x, p, '#f4f7fe', '#5d6f95', 3);
  x.save();
  x.clip(p);
  strokes(x, { box: [0, 400, STRIP, H], count: 900, colors: ['#d3ddef', '#c2cfe8', '#e6ecf8'], rng: r, len: [20, 50], lw: [3, 6], alpha: [0.5, 0.9], angle: -0.35, wrap: STRIP });
  x.restore();
  return s;
}

function makeTree(seed) {
  const w = 440, h = 560;
  const s = mk(w, h), x = s.x, r = mulberry32(seed);
  const limb = (x0, y0, x1, y1, w0, w1) => {
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
    return [[x0 + (nx * w0) / 2, y0 + (ny * w0) / 2], [x1 + (nx * w1) / 2, y1 + (ny * w1) / 2], [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2], [x0 - (nx * w0) / 2, y0 - (ny * w0) / 2]];
  };
  const wood = new Path2D();
  for (const L of [
    limb(220, 566, 216, 300, 74, 40),
    limb(212, 340, 118, 215, 28, 10),
    limb(226, 330, 322, 205, 26, 9),
    limb(216, 310, 212, 160, 32, 12),
    limb(160, 268, 104, 282, 10, 4),
    [[168, 562], [194, 515], [246, 515], [274, 562]],
  ]) wood.addPath(poly(L, r, 1.5));
  outlinedUnion(x, wood, '#8b5a2b', '#2b1a0c', 3);
  scribble(x, wood, [90, 150, 340, 566], ['#6e4420', '#a06a36', '#7a4b22'], r, { angle: -1.45, gap: 6, lw: 3.5, alpha: 0.55, angleVar: 0.2 });
  x.strokeStyle = '#3b2410';
  x.lineWidth = 2;
  x.lineCap = 'round';
  for (let k = 0; k < 10; k++) {
    const bx = 196 + r() * 44, by = 360 + r() * 180;
    x.beginPath();
    x.moveTo(bx, by);
    x.quadraticCurveTo(bx + (r() - 0.5) * 6, by + 12, bx + (r() - 0.5) * 4, by + 22 + r() * 10);
    x.stroke();
  }
  paint(x, blob(224, 420, 14, 19, r, 0.08, 10), { fill: '#24140a', lw: 2.5, rng: r, grain: 0 });

  const crown = new Path2D();
  for (const b of [[130, 200, 72, 62], [215, 150, 95, 78], [312, 195, 74, 62], [170, 100, 62, 52], [270, 105, 62, 52], [220, 235, 70, 46]]) {
    crown.addPath(blob(b[0], b[1], b[2], b[3], r, 0.07, 12));
  }
  outlinedUnion(x, crown, '#3ea64a', '#174d22', 3);
  scribble(x, crown, [40, 30, 400, 290], ['#2f8f3c', '#55bd57', '#2a7d35'], r, { angle: -0.7, gap: 6, lw: 4, alpha: 0.5 });
  x.strokeStyle = '#1e6a2c';
  x.lineWidth = 2;
  for (let k = 0; k < 60; k++) {
    const cx = 60 + r() * 320, cy = 50 + r() * 220;
    if (!x.isPointInPath(crown, cx * PR, cy * PR)) continue;
    x.beginPath();
    x.arc(cx, cy, 5 + r() * 4, 0.3, Math.PI - 0.3);
    x.stroke();
  }
  return s;
}

function makeBush(seed) {
  const s = mk(220, 120), x = s.x, r = mulberry32(seed);
  const p = new Path2D();
  for (const b of [[60, 80, 48, 36], [110, 58, 60, 48], [165, 80, 48, 36], [110, 92, 90, 26]]) p.addPath(blob(b[0], b[1], b[2], b[3], r, 0.06, 12));
  outlinedUnion(x, p, '#24703a', '#0d3018', 2.5);
  scribble(x, p, [0, 0, 220, 120], ['#1b5a2e', '#2f8346'], r, { angle: -0.6, gap: 6, lw: 4, alpha: 0.55 });
  return s;
}

function makeMoon() {
  const s = mk(130, 130), x = s.x, r = mulberry32(19);
  const g = x.createRadialGradient(65, 65, 20, 65, 65, 64);
  g.addColorStop(0, 'rgba(255,250,200,0.25)');
  g.addColorStop(1, 'rgba(255,250,200,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 130, 130);
  const outer = new Path2D();
  outer.arc(65, 65, 42, 0, TAU);
  const cut = new Path2D();
  cut.arc(86, 50, 38, 0, TAU);
  x.save();
  const clipP = new Path2D();
  clipP.rect(0, 0, 130, 130);
  clipP.arc(86, 50, 38, 0, TAU);
  x.clip(clipP, 'evenodd');
  x.fillStyle = '#f4eec4';
  x.fill(outer);
  scribble(x, outer, [20, 20, 110, 110], ['#e6dc9c', '#fffbe0'], r, { lw: 3, gap: 5, alpha: 0.6 });
  x.strokeStyle = INK;
  x.lineWidth = 3;
  x.stroke(outer);
  x.restore();
  x.save();
  x.clip(outer);
  x.strokeStyle = INK;
  x.lineWidth = 3;
  x.stroke(cut);
  x.restore();
  return s;
}

function makeFullMoon() {
  const s = mk(130, 130), x = s.x, r = mulberry32(23);
  const g = x.createRadialGradient(65, 65, 20, 65, 65, 64);
  g.addColorStop(0, 'rgba(255,250,200,0.3)');
  g.addColorStop(1, 'rgba(255,250,200,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 130, 130);
  const m = blob(65, 65, 42, 42, r, 0.02, 16);
  paint(x, m, { fill: '#efe8c0', lw: 3, rng: r });
  scribble(x, m, [20, 20, 110, 110], ['#e0d49a', '#fffbe0'], r, { lw: 3, gap: 5, alpha: 0.5 });
  for (const [cx, cy, rr] of [[52, 52, 8], [80, 72, 10], [60, 86, 6]]) paint(x, blob(cx, cy, rr, rr * 0.85, r, 0.1, 8), { fill: '#d6cc98', lw: 1.6, grain: 0.2 });
  return s;
}

function makeSun() {
  const s = mk(240, 240), x = s.x, r = mulberry32(29);
  const c = 120;
  const g = x.createRadialGradient(c, c, 40, c, c, 120);
  g.addColorStop(0, 'rgba(255,220,90,0.45)');
  g.addColorStop(1, 'rgba(255,220,90,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 240, 240);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    x.save();
    x.translate(c + Math.cos(a) * 80, c + Math.sin(a) * 80);
    x.rotate(a);
    paint(x, blob(0, 0, 24, 13, r, 0.08, 10), { fill: '#f7901e', stroke: '#8a3d06', lw: 2.5, rng: r });
    x.restore();
  }
  const core = blob(c, c, 64, 64, r, 0.03, 18);
  paint(x, core, { fill: '#ffd638', stroke: '#8a3d06', lw: 3, rng: r });
  scribble(x, core, [50, 50, 190, 190], ['#ffc21f', '#ffe56b'], r, { lw: 5, gap: 7, alpha: 0.6 });
  return s;
}

function makePalm() {
  const w = 400, h = 540;
  const s = mk(w, h), x = s.x, r = mulberry32(61);
  const P0 = [215, 548], C = [252, 330], P1 = [178, 168];
  const bz = (t) => [
    (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P1[0],
    (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P1[1],
  ];
  const N = 13;
  for (let k = 0; k < N; k++) {
    const t0 = k / N, t1 = (k + 1) / N + 0.015;
    const a = bz(t0), b = bz(t1);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const w0 = (38 - 16 * t0) / 2, w1 = (38 - 16 * t1) / 2 + 3;
    const seg = poly([[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], r, 0.8);
    paint(x, seg, { fill: k % 2 ? '#a96b33' : '#9a5f2b', stroke: '#3f240e', lw: 2.4, grain: 0.4 });
  }
  const c = [178, 165];
  for (const [a, len] of [[-2.8, 150], [2.9, 125], [-2.25, 140], [-1.7, 115], [-1.15, 130], [-0.55, 150], [0.35, 125], [-0.05, 150]]) {
    const tip = [c[0] + Math.cos(a) * len, c[1] + Math.sin(a) * len * 0.75 + len * 0.32];
    const m = [(c[0] + tip[0]) / 2, (c[1] + tip[1]) / 2 - len * 0.18];
    const dx = tip[0] - c[0], dy = tip[1] - c[1], L = Math.hypot(dx, dy);
    const nx = -dy / L, ny = dx / L, wd = len * 0.32;
    const p = new Path2D();
    p.moveTo(c[0], c[1]);
    p.quadraticCurveTo(m[0] + nx * wd, m[1] + ny * wd, tip[0], tip[1]);
    p.quadraticCurveTo(m[0] - nx * wd, m[1] - ny * wd, c[0], c[1]);
    p.closePath();
    paint(x, p, { fill: '#3faa45', stroke: '#17501d', lw: 2.6, grain: 0.4, rng: r });
    scribble(x, p, [c[0] - 160, c[1] - 160, c[0] + 160, c[1] + 160], ['#5cc65a'], r, { lw: 3, gap: 8, alpha: 0.5, angle: Math.atan2(dy, dx) + 1.4 });
    x.strokeStyle = '#1f5f24';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(c[0], c[1]);
    x.quadraticCurveTo(m[0], m[1], tip[0], tip[1]);
    x.stroke();
  }
  for (const [cx, cy] of [[166, 182], [188, 186], [176, 198]]) paint(x, blob(cx, cy, 12, 12, r, 0.06, 10), { fill: '#7b4a20', lw: 2.4, rng: r });
  return s;
}

function makeIsland() {
  const s = mk(560, 330), x = s.x, r = mulberry32(71);
  const sc = 0.62;
  x.drawImage(A.palm.c, 300 - 215 * sc, 300 - 548 * sc, 400 * sc, 540 * sc);
  const sand = blob(280, 304, 250, 42, r, 0.03, 18);
  paint(x, sand, { fill: '#f4c63a', stroke: '#8a5a12', lw: 3, rng: r });
  scribble(x, sand, [30, 260, 530, 350], ['#e7a92c', '#f9d860'], r, { lw: 4, gap: 7, alpha: 0.55 });
  return s;
}

function makeBeach() {
  const s = mk(W, H), x = s.x, r = mulberry32(81);
  x.drawImage(A.skyDay.c, 0, 0, W, H);
  x.fillStyle = '#2c9ed6';
  x.fillRect(0, 300, W, 110);
  x.save();
  x.beginPath();
  x.rect(0, 300, W, 110);
  x.clip();
  strokes(x, { box: [0, 300, W, 410], count: 220, colors: ['#5cc2ee', '#1f86c2', '#7fd3f2'], rng: r, len: [30, 70], lw: [2, 4], alpha: [0.4, 0.8], angle: 0, angleVar: 0.1 });
  x.restore();
  x.strokeStyle = INK;
  x.lineWidth = 2.5;
  x.beginPath();
  x.moveTo(0, 300);
  x.lineTo(W, 301);
  x.stroke();
  const sc = 0.85;
  x.drawImage(A.palm.c, 215 - 215 * sc, 480 - 548 * sc, 400 * sc, 540 * sc);
  const sandTop = (xx) => 382 + 10 * Math.sin(xx / 150) + 5 * Math.sin(xx / 60 + 1);
  const p = new Path2D();
  p.moveTo(-5, H + 5);
  for (let i = -5; i <= W + 5; i += 6) p.lineTo(i, sandTop(i));
  p.lineTo(W + 5, H + 5);
  p.closePath();
  x.fillStyle = '#f6c332';
  x.fill(p);
  scribble(x, p, [0, 370, W, H], ['#eaa327', '#fbd75a', '#f0b22a'], r, { angle: -0.6, gap: 7, lw: 5, alpha: 0.5 });
  x.strokeStyle = '#8a5a12';
  x.lineWidth = 3;
  x.beginPath();
  for (let i = -5; i <= W + 5; i += 8) i === -5 ? x.moveTo(i, sandTop(i)) : x.lineTo(i, sandTop(i));
  x.stroke();
  // a few shells
  for (const [sx, sy] of [[120, 500], [780, 470], [860, 520], [600, 515]]) paint(x, blob(sx, sy, 7, 5, r, 0.1, 8), { fill: '#fbe3d2', stroke: '#8a5a12', lw: 1.8, grain: 0 });
  return s;
}

export function initWorld() {
  A.skyNight = makeSky('#13286c', '#2142a0', ['#2a4cb0', '#1a3486', '#3459c2', '#223f9f', '#13286a'], 11);
  A.skyDawn = makeSky('#3f3a8f', '#ef9a7e', ['#5a4aa8', '#c0708a', '#f0a080', '#7a5ab0'], 12);
  A.skyDay = makeSky('#4aa8e6', '#a6dcf6', ['#5cb6ec', '#7ccaf2', '#4a9fdc', '#93d4f5'], 13);
  A.hills = makeHills();
  A.ground = makeGround();
  A.sea = makeSea();
  A.cloudFloor = makeCloudFloor();
  A.tree = makeTree(5);
  A.bush = makeBush(6);
  A.moon = makeMoon();
  A.moonFull = makeFullMoon();
  A.clouds = [makeCloud(260, 140, 21), makeCloud(220, 120, 22), makeCloud(320, 150, 23)];
  A.storms = [makeCloud(250, 140, 31, STORM), makeCloud(290, 150, 32, STORM)];
  A.bigCloud = makeCloud(560, 300, 41);
  A.sun = makeSun();
  A.palm = makePalm();
  A.island = makeIsland();
  A.beach = makeBeach();
}
