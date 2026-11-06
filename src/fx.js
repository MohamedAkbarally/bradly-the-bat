// Simple particle effects.
import { TAU, rand } from './util.js';

export function burst(parts, x, y, type, n, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread ?? TAU) : Math.random() * TAU;
    const sp = rand(o.speed?.[0] ?? 60, o.speed?.[1] ?? 200);
    const life = rand(o.life?.[0] ?? 0.4, o.life?.[1] ?? 0.8);
    parts.push({
      x, y, type,
      vx: Math.cos(a) * sp + (o.vx || 0),
      vy: Math.sin(a) * sp + (o.vy || 0),
      g: o.g ?? 0,
      drag: o.drag ?? 2,
      life, max: life,
      size: rand(o.size?.[0] ?? 3, o.size?.[1] ?? 6),
      rot: Math.random() * TAU,
      spin: rand(-6, 6),
      color: o.colors ? o.colors[(Math.random() * o.colors.length) | 0] : null,
    });
  }
}

export function updateParts(parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      parts.splice(i, 1);
      continue;
    }
    p.vy += p.g * dt;
    p.vx *= 1 - p.drag * dt;
    p.vy *= 1 - p.drag * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
  }
}

export function drawParts(ctx, parts, cam = 0) {
  ctx.save();
  for (const p of parts) {
    const a = p.life / p.max;
    const x = p.x - cam, y = p.y;
    ctx.globalAlpha = Math.min(1, a * 1.5);
    switch (p.type) {
      case 'spark':
        ctx.fillStyle = p.color || '#ffe45c';
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.5 + a * 0.5), 0, TAU);
        ctx.fill();
        break;
      case 'dust':
      case 'puff': {
        ctx.fillStyle = p.type === 'dust' ? 'rgba(200,220,170,0.8)' : 'rgba(255,255,255,0.9)';
        ctx.strokeStyle = p.type === 'dust' ? 'rgba(40,80,30,0.5)' : 'rgba(80,100,140,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1.6 - a * 0.6), 0, TAU);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'drop':
        ctx.fillStyle = '#bff0ff';
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.6, 0, TAU);
        ctx.fill();
        break;
      case 'confetti':
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color || '#ff6a4a';
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
        ctx.restore();
        break;
      case 'feather':
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#9a9ba6';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
        break;
    }
  }
  ctx.restore();
}
