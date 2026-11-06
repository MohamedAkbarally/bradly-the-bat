import { W, H, FONT } from './util.js';
import { initCrayon, setBoil } from './crayon.js';
import { initWorld } from './world.js';
import * as audio from './audio.js';
import { muteIcon, MUTE } from './ui.js';
import { STORY, WEEKS } from './story.js';
import { TitleScene } from './scenes/title.js';
import { StoryScene } from './scenes/story.js';
import { LevelScene } from './scenes/level.js';
import { FlightScene } from './scenes/flight.js';
import { EndingScene } from './scenes/ending.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let scale = 1;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${Math.floor(W * s)}px`;
  canvas.style.height = `${Math.floor(H * s)}px`;
  canvas.width = Math.round(W * s * dpr);
  canvas.height = Math.round(H * s * dpr);
  scale = (s * dpr);
}
window.addEventListener('resize', resize);
resize();

const FLOW = [
  (g) => new TitleScene(g),
  (g) => new StoryScene(g, STORY.intro),
  (g) => new LevelScene(g, WEEKS[0]),
  (g) => new StoryScene(g, STORY.week1),
  (g) => new LevelScene(g, WEEKS[1]),
  (g) => new StoryScene(g, STORY.week2),
  (g) => new LevelScene(g, WEEKS[2]),
  (g) => new StoryScene(g, STORY.week3),
  (g) => new FlightScene(g),
  (g) => new EndingScene(g),
];

const game = {
  held: false,
  mouse: { x: -1, y: -1 },
  state: null,
  index: 0,
  scene: null,
  fade: 1,
  fadeDir: -1,
  pending: null,
  reset() {
    this.state = { fireflies: 0, stars: 0 };
  },
  goto(i) {
    if (this.pending != null) return;
    this.pending = i;
    this.fadeDir = 1;
  },
  next() {
    this.goto((this.index + 1) % FLOW.length);
  },
  restart() {
    this.reset();
    this.goto(0);
  },
};
window.__game = game; // handy for debugging

function enter(i) {
  game.index = i;
  game.scene = FLOW[i](game);
  game.scene.enter?.();
}

// ---------------------------------------------------------------- input
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
}
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const [x, y] = toLogical(e);
  game.mouse.x = x;
  game.mouse.y = y;
  audio.unlock();
  if (Math.hypot(x - MUTE.x, y - MUTE.y) < 26) {
    audio.toggleMute();
    return;
  }
  game.held = true;
  if (game.pending == null) game.scene?.press?.(x, y, false);
});
canvas.addEventListener('pointermove', (e) => {
  const [x, y] = toLogical(e);
  game.mouse.x = x;
  game.mouse.y = y;
});
const release = () => (game.held = false);
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
window.addEventListener('blur', release);

const KEYS = new Set(['Space', 'ArrowUp', 'KeyW', 'Enter']);
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') return audio.toggleMute();
  if (!KEYS.has(e.code)) return;
  e.preventDefault();
  if (e.repeat) return;
  audio.unlock();
  game.held = true;
  if (game.pending == null) game.scene?.press?.(-1, -1, true);
});
window.addEventListener('keyup', (e) => {
  if (KEYS.has(e.code)) game.held = false;
});

// ---------------------------------------------------------------- loop
let last = performance.now(), time = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frame(dt);
  requestAnimationFrame(loop);
}
// Debug helper: window.__step(frames, fn) advances the game manually.
window.__step = (n = 1, fn) => {
  for (let i = 0; i < n; i++) {
    fn?.(game);
    frame(1 / 60);
  }
};
function frame(dt) {
  time += dt;
  setBoil(time);

  if (game.fadeDir > 0) {
    game.fade += dt * 3;
    if (game.fade >= 1) {
      game.fade = 1;
      enter(game.pending);
      game.pending = null;
      game.fadeDir = -1;
    }
  } else if (game.fadeDir < 0) {
    game.fade -= dt * 2.5;
    if (game.fade <= 0) {
      game.fade = 0;
      game.fadeDir = 0;
    }
  }
  if (game.pending == null || game.fade < 1) game.scene.update(dt);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  game.scene.draw(ctx);
  muteIcon(ctx, audio.isMuted());
  if (game.fade > 0) {
    ctx.fillStyle = `rgba(11,20,51,${game.fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

async function boot() {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = '#0b1433';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = `28px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('drawing with crayons...', W / 2, H / 2);
  try {
    await Promise.race([document.fonts.load(`24px "Patrick Hand"`), new Promise((r) => setTimeout(r, 2500))]);
  } catch {}
  await new Promise((r) => setTimeout(r, 30));
  initCrayon();
  initWorld();
  game.reset();
  const start = Number(new URLSearchParams(location.search).get('s')) || 0;
  enter(Math.min(start, FLOW.length - 1));
  requestAnimationFrame(loop);
}
boot();
