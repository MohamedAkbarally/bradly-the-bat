// "Week" levels: practise flying with Henry and catch fireflies to grow your wings.
import { W, H, clamp, lerp, rand, pick } from '../util.js';
import { A, groundY, strip, sprite, drawTwinkles, drawScenery } from '../world.js';
import { drawBradly, drawHenry, drawMeanBat, drawFirefly } from '../characters.js';
import { bubble, caption, card, text, hudCount, meter } from '../ui.js';
import { INK } from '../crayon.js';
import { burst, updateParts, drawParts } from '../fx.js';
import * as audio from '../audio.js';

const S = 0.85;
const FOOT = 56 * S;
const TAUNTS = ['HAHA!', 'BIG HEAD!', 'TINY WINGS!', 'HEHEHE!', 'WEIRD FRIEND!', "YOU CAN'T FLY!"];
const CHEERS = ["DON'T LISTEN TO THEM, BRADLY!", 'IGNORE THEM!', 'YOU CAN DO IT!', "THEY'RE JUST JEALOUS!"];

export class LevelScene {
  constructor(game, cfg) {
    this.game = game;
    this.cfg = cfg;
    this.t = 0;
    this.started = false;
    this.done = false;
    this.doneT = 0;
    this.leaving = false;
    this.b = { x: 300, y: groundY(300) - FOOT, vy: 0, fp: 0, flapT: 0, dizzy: 0, inv: 0, onGround: true, air: 0 };
    this.h = { x: 390, y: 300 };
    this.count = 0;
    this.best = 0;
    this.wing = cfg.wingFrom;
    this.flies = [];
    this.bats = [];
    this.parts = [];
    this.says = {};
    this.nextFly = 620;
    this.batTimer = cfg.batFirst ?? 4;
    this.camX = 0;
    this.combo = 0;
    this.comboT = 0;
    this.warned = false;
    this.halfSaid = false;
    this.grow = 0;
  }
  enter() {
    audio.setMood('night');
  }
  power() {
    return clamp((this.wing - 0.45) / 0.55, 0, 1);
  }
  maxAlt() {
    return 70 + 430 * this.power();
  }
  say(who, str, dur = 2.6) {
    this.says[who] = { text: str, t: 0, dur };
    audio.pop();
  }
  press() {
    if (!this.started) {
      this.started = true;
      this.say('henry', this.cfg.startLine, 3);
    }
    this.flap();
  }
  flap() {
    const b = this.b;
    if (b.dizzy > 0) return;
    const alt = groundY(b.x) - FOOT - b.y;
    const k = clamp(1 - alt / this.maxAlt(), 0, 1);
    const imp = (380 + 110 * this.power()) * (0.22 + 0.78 * k);
    b.vy = Math.min(b.vy, -imp);
    b.flapT = 0.2;
    audio.flap();
    if (b.onGround) burst(this.parts, b.x, b.y + FOOT, 'dust', 3, { speed: [20, 60], life: [0.3, 0.5], size: [3, 5] });
    if (k < 0.06 && !this.warned && this.cfg.week < 3) {
      this.warned = true;
      this.say('henry', 'YOUR WINGS ARE STILL GROWING! CATCH MORE FIREFLIES!', 3.2);
    }
  }

  spawnFlies(x) {
    const ma = Math.max(45, this.maxAlt() * 0.8);
    const lo = 22;
    const r = Math.random();
    const add = (fx, a) => this.flies.push({ x: fx, y: groundY(fx) - FOOT + 8 - clamp(a, 0, 420), seed: Math.random() * 10, cool: 0 });
    if (r < 0.3) add(x, rand(lo, ma));
    else if (r < 0.6) {
      const a = rand(lo, ma);
      for (let i = 0; i < 3; i++) add(x + i * 50, a);
    } else if (r < 0.85 || ma < 150) {
      const h = Math.min(70, ma * 0.5), a = rand(lo, Math.max(lo, ma - h));
      for (let i = 0; i < 5; i++) add(x + i * 45, a + Math.sin((i / 4) * Math.PI) * h);
    } else {
      const a = rand(lo, Math.max(lo, ma - 100));
      for (let i = 0; i < 3; i++) add(x, a + i * 50);
    }
  }

  hit() {
    const b = this.b;
    b.dizzy = 1.1;
    b.inv = 2.2;
    b.vy = -160;
    audio.boing();
    const drop = Math.min(2, this.count);
    this.count -= drop;
    for (let k = 0; k < drop; k++) this.flies.push({ x: b.x, y: b.y, vx: rand(180, 320), vy: rand(-220, -60), loose: true, cool: 0.45, seed: Math.random() * 10 });
    burst(this.parts, b.x, b.y - 20, 'feather', 5, { speed: [60, 160], g: 120, life: [0.6, 1] });
    this.say('henry', pick(CHEERS));
  }

  update(dt) {
    this.t += dt;
    const b = this.b, cfg = this.cfg, held = this.game.held;
    for (const k in this.says) {
      const s = this.says[k];
      s.t += dt;
      if (s.t > s.dur) delete this.says[k];
    }
    // wings grow with the best firefly count reached this week
    const target = lerp(cfg.wingFrom, cfg.wingTo, clamp(this.best / cfg.target, 0, 1));
    this.wing += (target - this.wing) * Math.min(1, dt * 2.5);
    this.grow = Math.max(0, this.grow - dt * 2);

    if (b.flapT > 0) {
      b.flapT -= dt;
      b.fp += dt * 30;
    } else b.fp += dt * (b.onGround ? 4 : held ? 3 : 8);

    if (this.started) {
      b.x += cfg.speed * (b.dizzy > 0 ? 0.55 : 1) * dt;
      const glide = held && b.vy > 0 && b.dizzy <= 0;
      b.vy += (glide ? 520 : 1500) * dt;
      b.vy = Math.min(b.vy, glide ? 170 : 700);
      b.y += b.vy * dt;
      const gy = groundY(b.x) - FOOT;
      if (b.y >= gy) {
        if (!b.onGround && b.vy > 260) burst(this.parts, b.x, gy + FOOT, 'dust', 5, { speed: [30, 90], life: [0.3, 0.6], size: [3, 6] });
        b.y = gy;
        b.vy = 0;
        b.onGround = true;
      } else b.onGround = false;
      b.air = b.onGround ? 0 : b.air + dt;
      if (b.y < 50) {
        b.y = 50;
        if (b.vy < 0) b.vy = 0;
      }
      b.dizzy = Math.max(0, b.dizzy - dt);
      b.inv = Math.max(0, b.inv - dt);
    } else {
      b.y = groundY(b.x) - FOOT;
    }
    this.camX = b.x - 300;

    // Henry follows his best friend
    const h = this.h;
    const tx = b.x + 115, ty = Math.min(b.y - 85, groundY(b.x + 115) - 110) + Math.sin(this.t * 2.2) * 12;
    h.x = tx + Math.sin(this.t * 1.3) * 14;
    h.y += (ty - h.y) * Math.min(1, dt * 2.5);
    h.y = Math.max(50, h.y);

    // fireflies
    if (!this.done) {
      while (this.nextFly < this.camX + W + 250) {
        this.spawnFlies(this.nextFly);
        this.nextFly += rand(260, 400);
      }
    }
    this.comboT -= dt;
    if (this.comboT <= 0) this.combo = 0;
    for (let i = this.flies.length - 1; i >= 0; i--) {
      const f = this.flies[i];
      if (f.loose) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= 1 - dt * 1.6;
        f.vy *= 1 - dt * 1.6;
        f.y = clamp(f.y, 60, groundY(f.x) - FOOT + 8);
      }
      f.cool = Math.max(0, f.cool - dt);
      if (f.x < this.camX - 100) {
        this.flies.splice(i, 1);
        continue;
      }
      const fy = f.y + Math.sin(this.t * 2 + f.seed) * 5;
      const dx = f.x - b.x, dy = fy - (b.y + 8);
      if (f.cool <= 0 && this.started && !this.done && dx * dx + dy * dy < 36 * 36) {
        this.flies.splice(i, 1);
        this.count++;
        if (this.count > this.best) {
          this.best = this.count;
          this.grow = 1;
        }
        this.combo++;
        this.comboT = 1.2;
        audio.chime(this.combo - 1);
        burst(this.parts, f.x, fy, 'spark', 10, { speed: [60, 180], life: [0.3, 0.6], size: [2, 4] });
        if (!this.halfSaid && this.count >= Math.ceil(cfg.target / 2) && !this.done) {
          this.halfSaid = true;
          this.say('henry', 'HALFWAY THERE! YOUR WINGS ARE GROWING!');
        }
      }
    }

    // mean bats
    if (cfg.bats && this.started && !this.done) {
      this.batTimer -= dt;
      if (this.batTimer <= 0) {
        this.batTimer = rand(cfg.batGap[0], cfg.batGap[1]);
        const x = this.camX + W + 80;
        const ma = Math.min(this.maxAlt(), 360);
        const y = Math.max(80, groundY(x) - FOOT - rand(0, ma * 0.85));
        this.bats.push({ x, y0: y, y, vx: -rand(70, 130), amp: rand(20, 50), ph: Math.random() * 6, seed: (Math.random() * 100) | 0, taunt: pick(TAUNTS), sayT: -1, hit: false });
      }
    }
    for (let i = this.bats.length - 1; i >= 0; i--) {
      const bt = this.bats[i];
      bt.x += bt.vx * dt;
      bt.y = bt.y0 + Math.sin(this.t * 2 + bt.ph) * bt.amp;
      if (bt.sayT < 0 && bt.x - this.camX < W - 40) {
        bt.sayT = 0;
        audio.blip('meanbat');
      }
      if (bt.sayT >= 0) bt.sayT += dt;
      if (bt.x < this.camX - 150 || bt.y < -100) {
        this.bats.splice(i, 1);
        continue;
      }
      const dx = bt.x - b.x, dy = bt.y - (b.y + 5);
      if (!bt.hit && b.inv <= 0 && !this.done && dx * dx + dy * dy < 46 * 46) {
        bt.hit = true;
        this.hit();
      }
    }

    // done?
    if (!this.done && this.count >= cfg.target) {
      this.done = true;
      this.doneT = 0;
      audio.win();
      this.say('henry', cfg.doneLine, 3.2);
      burst(this.parts, b.x, b.y, 'confetti', 40, { speed: [120, 380], g: 300, drag: 1.5, life: [1, 1.8], size: [3, 6], colors: ['#ffd84a', '#ff6a4a', '#5cc65a', '#5cb6ec', '#ff9ad0'] });
      for (const bt of this.bats) {
        bt.vx = 250;
        bt.y0 -= 400;
      }
    }
    if (this.done) {
      this.doneT += dt;
      if (this.doneT > 3.4 && !this.leaving) {
        this.leaving = true;
        this.game.state.fireflies += this.count;
        this.game.next();
      }
    }
    updateParts(this.parts, dt);
  }

  draw(ctx) {
    const cam = this.camX, t = this.t, b = this.b, h = this.h, cfg = this.cfg;
    ctx.drawImage(A.skyNight.c, 0, 0, W, H);
    drawTwinkles(ctx, t);
    sprite(ctx, cfg.week === 2 ? A.moonFull : A.moon, 780 - cam * 0.02, 100, 1, 0.5, 0.5);
    strip(ctx, A.hills, cam * 0.35);
    drawScenery(ctx, cam, { home: true });
    strip(ctx, A.ground, cam);

    for (const f of this.flies) {
      const x = f.x - cam;
      if (x < -40 || x > W + 40) continue;
      drawFirefly(ctx, x, f.y + Math.sin(t * 2 + f.seed) * 5, t, f.seed);
    }
    for (const bt of this.bats) drawMeanBat(ctx, bt.x - cam, bt.y, { scale: 0.85, t, facing: -1, seed: bt.seed });

    drawHenry(ctx, h.x - cam, h.y, { scale: 1.1, t, happy: this.done });

    const blinkInv = b.inv > 0 && Math.floor(t * 12) % 2 === 0;
    const mood = b.dizzy > 0 ? 'dizzy' : this.done ? 'joy' : b.air > 0.15 ? 'joy' : 'happy';
    const gs = 1 + this.grow * 0.08;
    drawBradly(ctx, b.x - cam, b.y, {
      scale: S * gs, wing: this.wing, flap: b.fp, flapAmp: b.air > 0.1 ? 1 : 0.3,
      look: [1, clamp(b.vy / 600, -0.6, 0.6)], mood, dizzy: b.dizzy, t,
      rot: this.started ? clamp(b.vy / 1600, -0.18, 0.22) : 0, alpha: blinkInv ? 0.45 : 1,
      blink: !this.started && t % 3.4 < 0.12 ? 1 : 0,
    });
    drawParts(ctx, this.parts, cam);

    // speech
    const sh = this.says.henry;
    if (sh) bubble(ctx, sh.text, h.x - cam, h.y - 90, { tail: [h.x - cam + 4, h.y - 22], maxW: 230, size: 20, alpha: Math.min(1, (sh.dur - sh.t) * 4), seed: 3 });
    for (const bt of this.bats) {
      if (bt.sayT >= 0 && bt.sayT < 1.5) bubble(ctx, bt.taunt, bt.x - cam, bt.y - 62, { tail: [bt.x - cam, bt.y - 24], maxW: 150, size: 19, seed: bt.seed });
    }

    // HUD
    hudCount(ctx, this.count, cfg.target, t);
    meter(ctx, 'WINGS', (this.wing - 0.45) / 0.55, 26, 88, 140, '#d8d9e2');
    caption(ctx, cfg.title, W - 210, 16, 26);

    if (!this.started) {
      card(ctx, W / 2, 270, 560, 230, { seed: 12 });
      text(ctx, cfg.title, W / 2, 190, { size: 46, color: '#d9262c' });
      text(ctx, 'Practise flying with Henry!', W / 2, 238, { size: 28 });
      text(ctx, `Catch ${cfg.target} fireflies to make your wings grow.`, W / 2, 272, { size: 23 });
      text(ctx, cfg.tip, W / 2, 304, { size: 21, color: '#5a5a66' });
      if (Math.floor(t * 2) % 2 === 0) text(ctx, 'TAP / SPACE to flap  •  HOLD to glide', W / 2, 352, { size: 24, color: '#1f6fb0' });
    }
    if (this.done) {
      const k = Math.min(1, this.doneT * 2.5);
      ctx.save();
      ctx.translate(W / 2, 200);
      ctx.scale(k, k);
      text(ctx, `${cfg.title.replace(/[.!]+$/, '')} DONE!`, 0, 0, { size: 64, color: '#ffd84a', outline: INK, lw: 10 });
      ctx.restore();
    }
  }
}
