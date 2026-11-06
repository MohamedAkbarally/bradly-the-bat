import { W, H } from '../util.js';
import { A, groundY, strip, sprite, drawTwinkles, drawScenery } from '../world.js';
import { drawBradly, drawHenry, drawFirefly } from '../characters.js';
import { crayonTitle, text } from '../ui.js';
import { INK } from '../crayon.js';
import { ARTIST } from '../story.js';
import * as audio from '../audio.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.flies = Array.from({ length: 16 }, () => ({ x: Math.random() * W, y: 120 + Math.random() * 300, s: Math.random() * 10, vx: (Math.random() - 0.5) * 24 }));
  }
  enter() {
    audio.setMood('night');
  }
  update(dt) {
    this.t += dt;
    for (const f of this.flies) {
      f.x += f.vx * dt;
      if (f.x < -20) f.x = W + 20;
      if (f.x > W + 20) f.x = -20;
    }
  }
  press() {
    audio.pop();
    this.game.next();
  }
  draw(ctx) {
    const t = this.t;
    ctx.drawImage(A.skyNight.c, 0, 0, W, H);
    drawTwinkles(ctx, t);
    sprite(ctx, A.moon, 860, 92, 1, 0.5, 0.5);
    strip(ctx, A.hills, 0);
    drawScenery(ctx, -40, { home: true, maxX: 0 });
    strip(ctx, A.ground, 0);
    for (const f of this.flies) drawFirefly(ctx, f.x, f.y + Math.sin(t * 1.5 + f.s) * 10, t, f.s, 0.8);

    // Bradly hopping and flapping his tiny wings as hard as he can
    const hop = Math.abs(Math.sin(t * 3)) * 26;
    const by = groundY(500) - 56 * 1.1 - hop;
    drawBradly(ctx, 500, by, { scale: 1.1, wing: 0.45, flap: t * 24, look: [0.6, -0.4], mood: 'joy', blink: t % 3.3 < 0.12 ? 1 : 0 });
    drawHenry(ctx, 640, 320 + Math.sin(t * 2.2) * 10, { scale: 1.5, t, facing: -1 });

    crayonTitle(ctx, 'BRADLY', W / 2, 112, 124, '#ffd84a', 2);
    crayonTitle(ctx, 'THE BAT', W / 2, 200, 54, '#ffffff', 3);
    text(ctx, '& HENRY THE HUMMINGBIRD', W / 2, 248, { size: 26, color: '#ff9a5a', outline: INK, lw: 6 });

    if (Math.floor(t * 1.6) % 2 === 0 || t < 0.6) text(ctx, 'TAP OR PRESS SPACE TO START', W / 2, 498, { size: 30, color: '#fff', outline: INK, lw: 7 });
    text(ctx, `based on a comic by ${ARTIST || 'a very talented kid'} ♥`, W / 2, 528, { size: 17, color: '#e6f5da', outline: '#1d5a1f', lw: 4 });
  }
}
