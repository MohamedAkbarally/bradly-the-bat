// "THIS IS PARADISE!" — the beach ending, plus the original comic.
import { W, H, lerp, clamp, easeInOut, easeOutBounce, easeOutBack } from '../util.js';
import { A, sprite } from '../world.js';
import { drawBradly, drawHenry } from '../characters.js';
import { bubble, button, hitBtn, crayonTitle, text, card } from '../ui.js';
import { INK } from '../crayon.js';
import { burst, updateParts, drawParts } from '../fx.js';
import { ARTIST } from '../story.js';
import * as audio from '../audio.js';

const BS = 1.15;
const FEET = 452;
const LAND = [470, FEET - 56 * BS];

export class EndingScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.showOrig = false;
    this.parts = [];
    this.fired = new Set();
    this.buttons = [
      { x: 330, y: 505, w: 220, h: 50, label: 'PLAY AGAIN', act: 'again', seed: 51 },
      { x: 625, y: 505, w: 320, h: 50, label: 'SEE THE ORIGINAL COMIC', act: 'orig', color: '#ff9a5a', seed: 52 },
    ];
    this.img = new Image();
    this.img.src = 'original-comic.jpg';
  }
  enter() {
    audio.setMood('day');
  }
  at(time, key, fn) {
    if (this.t >= time && !this.fired.has(key)) {
      this.fired.add(key);
      fn();
    }
  }
  update(dt) {
    this.t += dt;
    this.at(1.8, 'land', () => {
      audio.puff();
      burst(this.parts, LAND[0], FEET, 'dust', 8, { speed: [40, 120], life: [0.4, 0.7], size: [4, 7] });
    });
    this.at(3.2, 'shades', () => {
      audio.cool();
      burst(this.parts, LAND[0], LAND[1] - 5, 'spark', 16, { speed: [80, 220], life: [0.4, 0.8], size: [2, 4], colors: ['#fff', '#ffe45c'] });
    });
    this.at(3.5, 'bubble', () => audio.pop());
    this.at(5.6, 'end', () => {
      audio.win();
      burst(this.parts, W / 2, 90, 'confetti', 60, { speed: [150, 420], g: 260, drag: 1.2, life: [1.5, 2.6], size: [3, 6], colors: ['#ffd84a', '#ff6a4a', '#5cc65a', '#5cb6ec', '#ff9ad0'] });
    });
    updateParts(this.parts, dt);
  }
  press(x, y, isKey) {
    if (this.showOrig) {
      this.showOrig = false;
      return;
    }
    if (this.t < 6) {
      if (this.t < 5.6) this.t = Math.max(this.t, 5.6);
      return;
    }
    if (isKey) return this.game.restart();
    for (const b of this.buttons) {
      if (hitBtn(b, x, y)) {
        audio.pop();
        if (b.act === 'again') this.game.restart();
        else this.showOrig = true;
      }
    }
  }
  draw(ctx) {
    const t = this.t;
    ctx.drawImage(A.beach.c, 0, 0, W, H);
    sprite(ctx, A.sun, 820, 105, 0.82, 0.5, 0.5, t * 0.12);
    // waves
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const wx = ((i * 137 + t * 18) % (W + 80)) - 40, wy = 318 + ((i * 29) % 60);
      ctx.beginPath();
      ctx.moveTo(wx - 16, wy);
      ctx.quadraticCurveTo(wx - 8, wy - 5, wx, wy);
      ctx.quadraticCurveTo(wx + 8, wy - 5, wx + 16, wy);
      ctx.stroke();
    }
    ctx.restore();

    // Bradly glides in and lands
    let bx, by, amp = 0.3, flap = t * 3;
    if (t < 1.8) {
      const u = easeInOut(t / 1.8);
      bx = lerp(-80, LAND[0], u);
      by = lerp(90, LAND[1], u) - Math.sin(u * Math.PI) * 30;
      amp = 1;
      flap = t * 14;
    } else {
      bx = LAND[0];
      by = LAND[1] - Math.abs(Math.sin((t - 1.8) * 2.5)) * (t > 3.5 ? 8 : 0);
    }
    const hu = easeInOut(clamp(t / 2.2, 0, 1));
    const hx = lerp(-200, 690, hu), hy = lerp(60, 330, hu) + Math.sin(t * 2.3) * 8;

    let shades = false, shadesY = 0;
    if (t > 2.4) {
      shades = true;
      shadesY = lerp(-300, 0, easeOutBounce(clamp((t - 2.4) / 0.8, 0, 1)));
    }
    drawHenry(ctx, hx, hy, { scale: 1.5, t, facing: -1, happy: true });
    drawBradly(ctx, bx, by, { scale: BS, wing: 1, flap, flapAmp: amp, look: [0.3, 0], mood: 'joy', shades, shadesY, blink: !shades && t % 3 < 0.12 ? 1 : 0 });
    drawParts(ctx, this.parts);

    if (t > 3.5) bubble(ctx, 'THIS IS PARADISE!', 470, 255, { tail: [LAND[0] + 10, LAND[1] - 55], maxW: 260, size: 26, chars: (t - 3.5) * 30, seed: 8 });

    if (t > 5.6) {
      const k = easeOutBack(clamp((t - 5.6) / 0.6, 0, 1));
      ctx.save();
      ctx.translate(W / 2, 92);
      ctx.scale(k, k);
      crayonTitle(ctx, 'THE END', 0, 0, 96, '#ffd84a', 6);
      ctx.restore();
      const s = this.game.state;
      text(ctx, `You caught ${s.fireflies} fireflies and ${s.stars} stars!`, W / 2, 162, { size: 26, color: '#fff', outline: INK, lw: 6, alpha: clamp((t - 6) * 2, 0, 1) });
    }
    if (t > 6) for (const b of this.buttons) button(ctx, b, hitBtn(b, this.game.mouse.x, this.game.mouse.y));

    if (this.showOrig) this.drawOriginal(ctx);
  }
  drawOriginal(ctx) {
    ctx.fillStyle = 'rgba(8,14,40,0.85)';
    ctx.fillRect(0, 0, W, H);
    const img = this.img;
    const maxW = 860, maxH = 420;
    const iw = img.naturalWidth || 4, ih = img.naturalHeight || 3;
    const sc = Math.min(maxW / iw, maxH / ih);
    const w = iw * sc, h = ih * sc;
    card(ctx, W / 2, 245, w + 28, h + 28, { fill: '#fffdf6', seed: 61, alpha: 1 });
    if (img.complete && img.naturalWidth) ctx.drawImage(img, W / 2 - w / 2, 245 - h / 2, w, h);
    text(ctx, `The original comic${ARTIST ? ` by ${ARTIST}` : ''} that inspired this game ♥`, W / 2, 492, { size: 26, color: '#fff', outline: INK, lw: 6 });
    text(ctx, 'tap anywhere to close', W / 2, 522, { size: 18, color: '#cfd8f0' });
  }
}
