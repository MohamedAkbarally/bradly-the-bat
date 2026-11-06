// Comic-panel cut-scenes.
import { W, H } from '../util.js';
import { A, groundY, strip, sprite, drawTwinkles } from '../world.js';
import { drawBradly, drawHenry, drawMeanBat } from '../characters.js';
import { bubble, caption, panelFrame, text } from '../ui.js';
import { INK } from '../crayon.js';
import * as audio from '../audio.js';

export function drawSet(ctx, set, t) {
  const cam = set.cam || 0;
  ctx.drawImage(A.skyNight.c, 0, 0, W, H);
  drawTwinkles(ctx, t, 1);
  if (set.moon) sprite(ctx, set.moon[2] === 'full' ? A.moonFull : A.moon, set.moon[0], set.moon[1], 1, 0.5, 0.5);
  strip(ctx, A.hills, cam * 0.35);
  if (set.tree) sprite(ctx, A.tree, set.tree.x, groundY(set.tree.x + cam) + 14, set.tree.s);
  if (set.bush) sprite(ctx, A.bush, set.bush.x, groundY(set.bush.x + cam) + 16, set.bush.s);
  strip(ctx, A.ground, cam);
}

function actorPos(a, set, t) {
  const s = a.s || 1;
  if (a.type === 'bradly') {
    const y = a.ground ? groundY(a.x + (set.cam || 0)) - 56 * s : a.y + Math.sin(t * 2) * 4;
    return { x: a.x, y, head: [a.x, y - 52 * s] };
  }
  if (a.type === 'henry') {
    const y = a.y + Math.sin(t * 2.4 + 1) * 6;
    return { x: a.x, y, head: [a.x + 6 * s * (a.facing || 1), y - 22 * s] };
  }
  const y = a.y + Math.sin(t * 3 + a.x) * 5;
  return { x: a.x, y, head: [a.x, y - 30 * s] };
}

function drawActor(ctx, a, p, t) {
  const s = a.s || 1;
  const blink = (t + a.x * 0.013) % 3.6 < 0.12 ? 1 : 0;
  if (a.type === 'bradly') {
    drawBradly(ctx, p.x, p.y, { scale: s, wing: a.wing ?? 1, flap: t * 3, flapAmp: 0.25, look: a.look, mood: a.mood, blink, t });
  } else if (a.type === 'henry') {
    drawHenry(ctx, p.x, p.y, { scale: s, t, facing: a.facing || 1, happy: a.happy });
  } else {
    drawMeanBat(ctx, p.x, p.y, { scale: s, t, facing: a.facing || 1, seed: a.seed });
  }
}

export class StoryScene {
  constructor(game, beats) {
    this.game = game;
    this.beats = beats;
    this.i = 0;
    this.line = 0;
    this.chars = 0;
    this.t = 0;
    this.beatT = 0;
    this.flash = 0;
  }
  enter() {
    audio.setMood('night');
  }
  get beat() {
    return this.beats[this.i];
  }
  get cur() {
    return this.beat.lines[this.line];
  }
  update(dt) {
    this.t += dt;
    this.beatT += dt;
    this.flash = Math.max(0, this.flash - dt * 3);
    const L = this.cur;
    if (this.beatT > 0.35 && this.chars < L.text.length) {
      const before = Math.floor(this.chars);
      this.chars = Math.min(L.text.length, this.chars + dt * 40);
      const now = Math.floor(this.chars);
      if (now !== before && now % 3 === 0 && L.text[now] !== ' ') audio.blip(this.beat.actors[L.who].type);
    }
  }
  press() {
    if (this.beatT < 0.3) return;
    if (this.chars < this.cur.text.length) {
      this.chars = this.cur.text.length;
      return;
    }
    if (this.line < this.beat.lines.length - 1) {
      this.line++;
      this.chars = 0;
      this.beatT = 0.2;
      audio.pop();
      return;
    }
    if (this.i < this.beats.length - 1) {
      this.i++;
      this.line = 0;
      this.chars = 0;
      this.beatT = 0;
      this.flash = 1;
      audio.pop();
      return;
    }
    this.game.next();
  }
  draw(ctx) {
    const b = this.beat, t = this.t;
    drawSet(ctx, b.set, t);
    const pos = b.actors.map((a) => actorPos(a, b.set, t));
    b.actors.forEach((a, k) => drawActor(ctx, a, pos[k], t));
    for (let k = 0; k <= this.line; k++) {
      const L = b.lines[k];
      bubble(ctx, L.text, L.x, L.y, { maxW: L.maxW, tail: pos[L.who].head, chars: k === this.line ? this.chars : null, seed: 10 + k });
    }
    if (b.caption) caption(ctx, b.caption, 34, 30, 32);
    panelFrame(ctx);
    // progress pips + continue hint
    const total = this.beats.length;
    if (total > 1) {
      for (let k = 0; k < total; k++) {
        ctx.fillStyle = k === this.i ? INK : 'rgba(23,23,29,0.25)';
        ctx.beginPath();
        ctx.arc(W / 2 - (total - 1) * 9 + k * 18, H - 6, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (this.chars >= this.cur.text.length && Math.floor(t * 2.2) % 2 === 0) {
      text(ctx, 'TAP ▶', W - 70, H - 42, { size: 24, color: '#fff', outline: INK, lw: 6 });
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(251,246,233,${this.flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
