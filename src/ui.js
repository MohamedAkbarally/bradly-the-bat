// Speech bubbles, captions, buttons, HUD bits — all hand-drawn.
import { FONT, W, H, clamp, TAU } from './util.js';
import { rngFor, blob, poly, INK } from './crayon.js';
import { drawFirefly, drawStar } from './characters.js';

export function setFont(ctx, size) {
  ctx.font = `${size}px ${FONT}`;
}

const cache = new Map();
export function layout(ctx, text, maxW, size) {
  const key = text + '|' + maxW + '|' + size;
  let L = cache.get(key);
  if (L) return L;
  ctx.save();
  setFont(ctx, size);
  const lines = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  const widths = lines.map((l) => ctx.measureText(l).width);
  ctx.restore();
  L = { lines, widths, w: Math.max(...widths), h: lines.length * size * 1.08, size };
  cache.set(key, L);
  return L;
}

export function text(ctx, str, x, y, o = {}) {
  const { size = 24, color = INK, align = 'center', base = 'middle', outline = null, lw = 6, alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  setFont(ctx, size);
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Comic speech bubble with a tail pointing at the speaker.
export function bubble(ctx, str, x, y, o = {}) {
  const size = o.size || 21;
  const L = layout(ctx, str, o.maxW || 260, size);
  const rx = L.w * 0.5 * 1.16 + 20, ry = L.h * 0.5 * 1.3 + 15;
  x = clamp(x, rx + 10, W - rx - 10);
  y = clamp(y, ry + 10, H - ry - 10);
  const rng = rngFor(o.seed || 7);
  const body = blob(x, y, rx, ry, rng, 0.022, 20);
  let tail = null;
  if (o.tail) {
    const [tx, ty] = o.tail;
    const dx = (tx - x) / rx, dy = (ty - y) / ry;
    if (dx * dx + dy * dy > 1.1) {
      const ang = Math.atan2(ty - y, tx - x);
      const e = (a) => [x + Math.cos(a) * rx * 0.88, y + Math.sin(a) * ry * 0.88];
      const b1 = e(ang - 0.22), b2 = e(ang + 0.22);
      tail = new Path2D();
      tail.moveTo(b1[0], b1[1]);
      tail.quadraticCurveTo((b1[0] + tx) / 2 + 4, (b1[1] + ty) / 2, tx, ty);
      tail.quadraticCurveTo((b2[0] + tx) / 2 - 4, (b2[1] + ty) / 2, b2[0], b2[1]);
      tail.closePath();
    }
  }
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.stroke(body);
  if (tail) ctx.stroke(tail);
  ctx.fillStyle = '#fffef7';
  ctx.fill(body);
  if (tail) ctx.fill(tail);
  setFont(ctx, size);
  ctx.fillStyle = '#16161c';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let remaining = o.chars == null ? Infinity : Math.floor(o.chars);
  const top = y - L.h / 2 + size * 0.56;
  L.lines.forEach((ln, i) => {
    if (remaining <= 0) return;
    ctx.fillText(ln.slice(0, remaining), x - L.widths[i] / 2, top + i * size * 1.08);
    remaining -= ln.length + 1;
  });
  ctx.restore();
}

export function wobblyRect(x, y, w, h, rng, j = 2) {
  const P = [];
  const seg = (ax, ay, bx, by, k) => {
    for (let i = 0; i < k; i++) P.push([ax + ((bx - ax) * i) / k, ay + ((by - ay) * i) / k]);
  };
  const k = Math.max(2, Math.round(w / 110)), kh = Math.max(2, Math.round(h / 110));
  seg(x, y, x + w, y, k);
  seg(x + w, y, x + w, y + h, kh);
  seg(x + w, y + h, x, y + h, k);
  seg(x, y + h, x, y, kh);
  return poly(P, rng, j);
}

export function card(ctx, x, y, w, h, o = {}) {
  const { fill = '#fbf6e9', seed = 5, alpha = 0.97 } = o;
  const p = wobblyRect(x - w / 2, y - h / 2, w, h, rngFor(seed), 2);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.save();
  ctx.translate(6, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill(p);
  ctx.restore();
  ctx.fillStyle = fill;
  ctx.fill(p);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.stroke(p);
  ctx.restore();
}

// Red "WEEK 1..." label in a white box, like the comic.
export function caption(ctx, str, x, y, size = 30) {
  setFont(ctx, size);
  const w = ctx.measureText(str).width + 30, h = size + 14;
  const p = wobblyRect(x, y, w, h, rngFor(77), 1.5);
  ctx.fillStyle = '#fff';
  ctx.fill(p);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke(p);
  text(ctx, str, x + 15, y + h / 2 + 2, { size, color: '#d9262c', align: 'left' });
}

export function crayonTitle(ctx, str, x, y, size, fill, seed = 1) {
  const r = rngFor(seed);
  ctx.save();
  setFont(ctx, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = size * 0.2;
  ctx.strokeText(str, x + 4, y + 6);
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.13;
  for (let i = 0; i < 2; i++) ctx.strokeText(str, x + (r() - 0.5) * 2.5, y + (r() - 0.5) * 2.5);
  ctx.fillStyle = fill;
  ctx.fillText(str, x, y);
  ctx.restore();
}

export function button(ctx, b, hover = false) {
  const p = wobblyRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, rngFor(b.seed || 9), 2);
  ctx.save();
  if (hover) {
    ctx.translate(b.x, b.y);
    ctx.scale(1.05, 1.05);
    ctx.translate(-b.x, -b.y);
  }
  ctx.save();
  ctx.translate(4, 5);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill(p);
  ctx.restore();
  ctx.fillStyle = b.color || '#ffd84a';
  ctx.fill(p);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.stroke(p);
  text(ctx, b.label, b.x, b.y + 2, { size: b.size || 26 });
  ctx.restore();
}
export const hitBtn = (b, x, y) => Math.abs(x - b.x) <= b.w / 2 && Math.abs(y - b.y) <= b.h / 2;

// Paper border around a comic panel.
export function panelFrame(ctx) {
  const m = 12;
  const inner = wobblyRect(m, m, W - 2 * m, H - 2 * m, rngFor(3), 1.4);
  const p = new Path2D();
  p.rect(-10, -10, W + 20, H + 20);
  p.addPath(inner);
  ctx.fillStyle = '#fbf6e9';
  ctx.fill(p, 'evenodd');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.stroke(inner);
}

export const MUTE = { x: W - 36, y: 36 };
export function muteIcon(ctx, muted) {
  const { x, y } = MUTE;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#fbf6e9';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 19, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 4);
  ctx.lineTo(x - 5, y - 4);
  ctx.lineTo(x + 2, y - 10);
  ctx.lineTo(x + 2, y + 10);
  ctx.lineTo(x - 5, y + 4);
  ctx.lineTo(x - 10, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  if (muted) {
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 5);
    ctx.lineTo(x + 12, y + 5);
    ctx.moveTo(x + 12, y - 5);
    ctx.lineTo(x + 6, y + 5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x + 3, y, 6, -0.8, 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 3, y, 11, -0.8, 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

export function hudCount(ctx, n, target, t, kind = 'firefly') {
  card(ctx, 98, 40, 150, 52, { seed: 31, alpha: 0.9 });
  if (kind === 'firefly') drawFirefly(ctx, 50, 40, t, 0.4, 1.1);
  else drawStar(ctx, 50, 40, t, 0.4, 0.95);
  text(ctx, target ? `${n} / ${target}` : `${n}`, 74, 42, { size: 32, align: 'left' });
}

export function meter(ctx, label, frac, x, y, w = 150, color = '#c9cad3') {
  const r = rngFor(41);
  text(ctx, label, x, y, { size: 20, color: '#fff', align: 'left', outline: INK, lw: 5 });
  const bx = x + 62, by = y - 9;
  const outer = wobblyRect(bx, by, w, 18, r, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill(outer);
  ctx.save();
  ctx.clip(outer);
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, w * clamp(frac, 0, 1), 18);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke(outer);
}
