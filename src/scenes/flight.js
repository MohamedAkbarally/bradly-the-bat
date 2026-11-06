// The big journey: Bradly and Henry fly away together, from night into day.
import { W, H, clamp, rand, smoothstep, mulberry32 } from '../util.js';
import { A, groundY, strip, sprite, drawTwinkles, drawScenery } from '../world.js';
import { drawBradly, drawHenry, drawMeanBat, drawStar } from '../characters.js';
import { bubble, card, text, hudCount } from '../ui.js';
import { INK } from '../crayon.js';
import { burst, updateParts, drawParts } from '../fx.js';
import * as audio from '../audio.js';

const S = 0.85, FOOT = 56 * S;
const L = 14500; // journey length
const CF_START = 1500, CF_END = L - 1400; // cloud floor
const ISLAND_X = L + 260;
const FLOOR = 438;

export class FlightScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.started = false;
    this.startT = 0;
    this.leaving = false;
    this.b = { x: 300, y: groundY(300) - FOOT, vy: 0, fp: 0, flapT: 0, dizzy: 0, inv: 0, air: 0 };
    this.h = { x: 380, y: 320 };
    this.camX = 0;
    this.count = 0;
    this.combo = 0;
    this.comboT = 0;
    this.parts = [];
    this.says = {};
    this.events = new Set();
    this.bats = [
      { x: 160, y: 230, seed: 1, say: 'LOOK! BIG HEAD BRADLY CAN FLY!', at: 0.4 },
      { x: 60, y: 300, seed: 2, say: 'WOW... HIS WINGS ARE HUGE!', at: 2.2 },
    ];
    this.storms = [];
    for (let x = 2600; x < L - 1900; x += rand(380, 560)) {
      this.storms.push({ x, y: rand(90, 390), sc: rand(0.8, 1.1), k: (Math.random() * 2) | 0, seed: Math.random() * 10, flash: 0 });
    }
    this.stars = [];
    for (let x = 900; x < L - 700; x += rand(230, 320)) {
      const near = this.storms.filter((s) => Math.abs(s.x - x) < 260);
      let y = 250;
      for (let tries = 0; tries < 12; tries++) {
        y = rand(80, 400);
        if (near.every((s) => Math.abs(y - s.y) > 120 * s.sc)) break;
      }
      const r = Math.random();
      const n = r < 0.4 ? 1 : 3;
      for (let i = 0; i < n; i++) {
        const sy = r < 0.7 ? y : y + (i - 1) * 45;
        this.stars.push({ x: x + (r < 0.7 ? i * 48 : 0), y: clamp(sy, 70, 410), seed: Math.random() * 10 });
      }
    }
    const r = mulberry32(5);
    this.deco = Array.from({ length: 40 }, (_, i) => ({ x: i * 520 + r() * 300, y: 60 + r() * 220, k: (r() * 3) | 0, s: 0.5 + r() * 0.5 }));
  }
  enter() {
    audio.setMood('night');
  }
  say(who, str, dur = 2.8) {
    this.says[who] = { text: str, t: 0, dur };
    audio.pop();
  }
  press() {
    if (!this.started) {
      this.started = true;
      this.startT = this.t;
    }
    const b = this.b;
    if (b.dizzy > 0 || this.auto) return;
    b.vy = Math.min(b.vy, -410);
    b.flapT = 0.2;
    audio.flap();
  }
  once(key, fn) {
    if (!this.events.has(key)) {
      this.events.add(key);
      fn();
    }
  }
  update(dt) {
    this.t += dt;
    const b = this.b, held = this.game.held;
    const st = this.started ? this.t - this.startT : 0;
    const p = clamp(b.x / L, 0, 1);
    for (const k in this.says) {
      const s = this.says[k];
      s.t += dt;
      if (s.t > s.dur) delete this.says[k];
    }
    if (b.flapT > 0) {
      b.flapT -= dt;
      b.fp += dt * 30;
    } else b.fp += dt * (held ? 3 : 8);

    if (this.started) {
      this.auto = b.x > L - 520;
      b.x += 270 * (b.dizzy > 0 ? 0.7 : 1) * dt;
      if (this.auto) {
        b.vy += ((300 - b.y) * 3 - b.vy) * dt * 3;
      } else {
        const glide = held && b.vy > 0 && b.dizzy <= 0;
        b.vy += (glide ? 450 : 1250) * dt;
        b.vy = Math.min(b.vy, glide ? 160 : 650);
      }
      b.y += b.vy * dt;
      if (b.y < 70) {
        b.y = 70;
        if (b.vy < 0) b.vy = 0;
      }
      let floor = b.x < CF_START ? groundY(b.x) - FOOT : FLOOR - FOOT * 0.4;
      if (b.x > CF_END) floor = 452 - FOOT * 0.3;
      if (b.y >= floor) {
        b.y = floor;
        if (b.x < CF_START) {
          b.vy = 0;
          b.air = 0;
        } else {
          b.vy = -330;
          if (b.x > CF_END) {
            audio.splash();
            burst(this.parts, b.x, floor + FOOT * 0.5, 'drop', 10, { angle: -Math.PI / 2, spread: 1.6, speed: [120, 260], g: 600, life: [0.4, 0.7] });
          } else {
            audio.puff();
            burst(this.parts, b.x, floor + FOOT * 0.6, 'puff', 6, { speed: [30, 90], life: [0.4, 0.7], size: [6, 10] });
          }
        }
      } else b.air += dt;
      b.dizzy = Math.max(0, b.dizzy - dt);
      b.inv = Math.max(0, b.inv - dt);
    } else {
      b.y = groundY(b.x) - FOOT;
    }
    this.camX = b.x - 300;
    const cam = this.camX;

    // Henry
    const h = this.h;
    const tx = b.x + 120, ty = clamp(b.y - 70, 80, 400) + Math.sin(this.t * 2.2) * 12;
    h.x = tx + Math.sin(this.t * 1.3) * 14;
    h.y += (ty - h.y) * Math.min(1, dt * 2.5);

    // the mean bats are impressed (and fall behind)
    for (const bt of this.bats) {
      if (st > 1.2) bt.x += 160 * dt;
      if (this.started && st > bt.at && !bt.said) {
        bt.said = true;
        bt.sayT = 0;
      }
      if (bt.said) bt.sayT += dt;
    }
    if (this.started && st > 4.6) this.once('fun', () => this.say('bradly', 'FLYING IS FUN!', 2.6));
    if (p > 0.3) this.once('p30', () => this.say('henry', "WE'RE REALLY DOING IT, BRADLY!"));
    if (p > 0.46) this.once('sun', () => {
      this.say('henry', 'LOOK! THE SUN IS COMING UP!');
      audio.setMood('day');
    });
    if (b.x > CF_END - 250) this.once('island', () => this.say('henry', 'I CAN SEE AN ISLAND!'));

    // stars
    this.comboT -= dt;
    if (this.comboT <= 0) this.combo = 0;
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      if (s.x < cam - 60) {
        this.stars.splice(i, 1);
        continue;
      }
      const sy = s.y + Math.sin(this.t * 2 + s.seed) * 6;
      const dx = s.x - b.x, dy = sy - (b.y + 6);
      if (dx * dx + dy * dy < 44 * 44) {
        this.stars.splice(i, 1);
        this.count++;
        this.combo++;
        this.comboT = 1.2;
        audio.chime(this.combo - 1);
        burst(this.parts, s.x, sy, 'spark', 12, { speed: [60, 200], life: [0.3, 0.6], size: [2, 4] });
      }
    }
    // storm clouds
    for (const s of this.storms) {
      s.flash = Math.max(0, s.flash - dt);
      if (Math.abs(s.x - b.x) > 200) continue;
      const dx = (b.x - s.x) / (105 * s.sc), dy = (b.y + 5 - s.y) / (48 * s.sc);
      if (b.inv <= 0 && dx * dx + dy * dy < 1) {
        b.dizzy = 0.9;
        b.inv = 1.8;
        b.vy = b.y < s.y ? -380 : 380;
        s.flash = 0.5;
        audio.thunder();
        audio.boing();
        this.once('storm', () => this.say('henry', 'WATCH OUT FOR THE STORM CLOUDS!'));
      }
    }
    updateParts(this.parts, dt);
    if (b.x >= L && !this.leaving) {
      this.leaving = true;
      this.game.state.stars = this.count;
      this.game.next();
    }
  }

  draw(ctx) {
    const t = this.t, cam = this.camX, b = this.b, h = this.h;
    const p = clamp(b.x / L, 0, 1);
    const night = 1 - smoothstep(0.3, 0.65, p);

    // sky: night -> dawn -> day
    ctx.drawImage(A.skyNight.c, 0, 0, W, H);
    const dawn = smoothstep(0.28, 0.48, p), day = smoothstep(0.55, 0.78, p);
    if (dawn > 0) {
      ctx.globalAlpha = dawn;
      ctx.drawImage(A.skyDawn.c, 0, 0, W, H);
    }
    if (day > 0) {
      ctx.globalAlpha = day;
      ctx.drawImage(A.skyDay.c, 0, 0, W, H);
    }
    ctx.globalAlpha = 1;
    drawTwinkles(ctx, t, night);
    sprite(ctx, A.moon, 720, 100 + smoothstep(0.2, 0.5, p) * 520, 1, 0.5, 0.5);
    const sunY = 640 - smoothstep(0.42, 0.78, p) * 535;
    if (sunY < 600) sprite(ctx, A.sun, 790, sunY, 0.8, 0.5, 0.5, t * 0.15);

    // far hills fade away as we climb
    const hillA = 1 - smoothstep(700, 2200, cam);
    if (hillA > 0) {
      ctx.globalAlpha = hillA;
      strip(ctx, A.hills, cam * 0.35);
      ctx.globalAlpha = 1;
    }
    // background clouds
    for (const d of this.deco) {
      const x = d.x - cam * 0.4;
      if (x < -200 || x > W + 200) continue;
      ctx.globalAlpha = 0.75;
      sprite(ctx, A.clouds[d.k], x, d.y, d.s, 0.5, 0.5);
    }
    ctx.globalAlpha = 1;

    // home meadow (only at the start)
    const gEnd = CF_START + 300 - cam;
    if (gEnd > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, Math.min(W, gEnd), H);
      ctx.clip();
      drawScenery(ctx, cam, { home: true, maxX: CF_START });
      strip(ctx, A.ground, cam);
      ctx.restore();
    }
    // the sea and the island (only at the end)
    const sStart = CF_END - 300 - cam;
    if (sStart < W) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(Math.max(0, sStart), 0, W, H);
      ctx.clip();
      ctx.fillStyle = '#3aa6d8';
      ctx.fillRect(0, 395, W, H);
      ctx.strokeStyle = '#1f6f9a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 395);
      ctx.lineTo(W, 395);
      ctx.stroke();
      sprite(ctx, A.island, ISLAND_X - cam, 468, 1, 0.5, 1);
      strip(ctx, A.sea, cam);
      ctx.restore();
    }
    // cloud floor
    const cs = CF_START - cam, ce = CF_END - cam;
    if (ce > -300 && cs < W + 300) {
      ctx.save();
      ctx.beginPath();
      const x0 = Math.max(0, cs), x1 = Math.min(W, ce);
      if (x1 > x0) {
        ctx.rect(x0, 0, x1 - x0, H);
        ctx.clip();
        strip(ctx, A.cloudFloor, cam);
      }
      ctx.restore();
      if (cs > -300 && cs < W + 300) sprite(ctx, A.bigCloud, cs, H + 40, 1);
      if (ce > -300 && ce < W + 300) sprite(ctx, A.bigCloud, ce, H + 40, 1, 0.5, 1, 0, true);
    }
    // moonlight tint
    if (night > 0.01) {
      ctx.fillStyle = `rgba(12,22,70,${0.32 * night})`;
      ctx.fillRect(0, 0, W, H);
    }

    // collectibles & hazards
    for (const s of this.stars) {
      const x = s.x - cam;
      if (x < -40 || x > W + 40) continue;
      drawStar(ctx, x, s.y + Math.sin(t * 2 + s.seed) * 6, t, s.seed);
    }
    for (const s of this.storms) {
      const x = s.x - cam;
      if (x < -200 || x > W + 200) continue;
      const bolt = s.flash > 0 || (t * 1.3 + s.seed) % 4 < 0.15;
      if (bolt) this.bolt(ctx, x + 10, s.y + 35 * s.sc, s.sc);
      sprite(ctx, A.storms[s.k], x + (s.flash > 0 ? Math.sin(t * 60) * 3 : 0), s.y, s.sc, 0.5, 0.5);
    }
    for (const bt of this.bats) {
      const x = bt.x - cam;
      if (x < -80) continue;
      drawMeanBat(ctx, x, bt.y + Math.sin(t * 3 + bt.seed) * 6, { scale: 0.9, t, facing: 1, seed: bt.seed });
    }

    drawHenry(ctx, h.x - cam, h.y, { scale: 1.1, t, happy: true });
    const blinkInv = b.inv > 0 && Math.floor(t * 12) % 2 === 0;
    drawBradly(ctx, b.x - cam, b.y, {
      scale: S, wing: 1, flap: b.fp, flapAmp: this.started ? 1 : 0.3,
      look: [1, clamp(b.vy / 600, -0.6, 0.6)], mood: b.dizzy > 0 ? 'dizzy' : 'joy', dizzy: b.dizzy, t,
      rot: this.started ? clamp(b.vy / 1600, -0.18, 0.22) : 0, alpha: blinkInv ? 0.45 : 1,
    });
    drawParts(ctx, this.parts, cam);

    // speech
    for (const bt of this.bats) {
      if (bt.said && bt.sayT < 2.6 && bt.x - cam > 20) bubble(ctx, bt.say, bt.x - cam, bt.y - 75, { tail: [bt.x - cam, bt.y - 28], maxW: 220, size: 20, seed: bt.seed });
    }
    const sh = this.says.henry;
    if (sh) bubble(ctx, sh.text, h.x - cam + 40, h.y - 90, { tail: [h.x - cam + 4, h.y - 22], maxW: 240, size: 20, alpha: Math.min(1, (sh.dur - sh.t) * 4), seed: 3 });
    const sb = this.says.bradly;
    if (sb) bubble(ctx, sb.text, b.x - cam - 20, b.y - 110, { tail: [b.x - cam, b.y - 50], maxW: 220, size: 22, alpha: Math.min(1, (sb.dur - sb.t) * 4), seed: 4 });

    // HUD: stars + journey progress
    hudCount(ctx, this.count, 0, t, 'star');
    this.progress(ctx, p);

    if (!this.started) {
      card(ctx, W / 2, 250, 560, 210, { seed: 14 });
      text(ctx, 'FLY AWAY TOGETHER!', W / 2, 185, { size: 44, color: '#d9262c' });
      text(ctx, 'Your wings are big now. Fly to a new place!', W / 2, 232, { size: 25 });
      text(ctx, 'Catch the stars and dodge the storm clouds.', W / 2, 266, { size: 22, color: '#5a5a66' });
      if (Math.floor(t * 2) % 2 === 0) text(ctx, 'TAP / SPACE to flap  •  HOLD to glide', W / 2, 312, { size: 24, color: '#1f6fb0' });
    }
  }

  bolt(ctx, x, y, sc) {
    const pts = [[0, 0], [-10, 26], [4, 26], [-8, 58], [14, 20], [0, 20], [8, 0]];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.closePath();
    ctx.fillStyle = '#ffe14a';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  progress(ctx, p) {
    const x0 = 330, x1 = 630, y = 34;
    ctx.save();
    ctx.strokeStyle = 'rgba(23,23,29,0.6)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.strokeStyle = '#fbf6e9';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.restore();
    sprite(ctx, A.tree, x0 - 6, y + 14, 0.07);
    sprite(ctx, A.island, x1 + 14, y + 12, 0.09);
    drawBradly(ctx, x0 + (x1 - x0) * p, y - 2, { scale: 0.3, wing: 1, flap: this.t * 10, mood: 'joy' });
  }
}
