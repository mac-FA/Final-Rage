'use strict';
/* Particles live in world-x / screen-y space. */
const FX = {
  p: [],
  add(o) { o.life = o.life || 20; o.max = o.life; o.vx = o.vx || 0; o.vy = o.vy || 0; this.p.push(o); return o; },
  clear() { this.p.length = 0; },
  update() {
    const p = this.p;
    for (let i = p.length - 1; i >= 0; i--) {
      const o = p[i];
      o.x += o.vx; o.y += o.vy; if (o.g) o.vy += o.g; if (o.drag) { o.vx *= o.drag; o.vy *= o.drag; }
      if (o.vr) o.rot = (o.rot || 0) + o.vr;
      if (o.floor !== undefined && o.y > o.floor) { o.y = o.floor; o.vy *= -0.4; o.vx *= 0.6; o.vr = (o.vr || 0) * 0.5; }
      if (--o.life <= 0) { p[i] = p[p.length - 1]; p.pop(); }
    }
    if (p.length > 700) p.splice(0, p.length - 700);
  },
  draw(ctx, camX, front) {
    const p = this.p;
    for (let i = 0; i < p.length; i++) {
      const o = p[i]; if (!!o.front !== !!front) continue;
      const x = o.x - camX, y = o.y, t = o.life / o.max, a = 1 - t;
      if (x < -200 || x > W + 200) continue;
      switch (o.k) {
        case 'spark': {
          const r = o.size * (0.4 + EASE.o(a) * 0.9), n = o.n || 8;
          ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, t * 2.2);
          ctx.fillStyle = o.col; ctx.beginPath();
          for (let j = 0; j < n * 2; j++) { const rr = j % 2 ? r * 0.28 : r * (j % 4 ? 1 : 0.7), an = j / (n * 2) * TAU; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
          ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3 * t + 2, 0, TAU); ctx.fill();
          ctx.restore(); break;
        }
        case 'streak': {
          ctx.globalAlpha = t; ctx.strokeStyle = o.col; ctx.lineWidth = o.size * t + 0.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - o.vx * (o.len || 3), y - o.vy * (o.len || 3)); ctx.stroke(); ctx.globalAlpha = 1; break;
        }
        case 'dust': {
          ctx.globalAlpha = t * 0.55; ctx.fillStyle = o.col || '#d8d0e8';
          ctx.beginPath(); ctx.arc(x, y, o.size * (0.5 + a * 1.1), 0, TAU); ctx.fill(); ctx.globalAlpha = 1; break;
        }
        case 'ring': {
          const r = o.size * EASE.o(a);
          ctx.globalAlpha = t; ctx.strokeStyle = o.col || '#fff'; ctx.lineWidth = (o.w || 6) * t + 1;
          ctx.beginPath(); ctx.ellipse(x, y, r, r * (o.flat || 0.3), 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; break;
        }
        case 'burst': {
          const r = o.size * EASE.o(a);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#fff'); g.addColorStop(0.4, o.col); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); break;
        }
        case 'text': {
          const age = o.max - o.life, sc = age < 6 ? EASE.b(age / 6) : 1 + (age - 6) * 0.004;
          ctx.globalAlpha = Math.min(1, o.life / 8);
          txt(ctx, o.s, x + 3, y + 3, o.size, '#c8102e', { rot: o.rot0, sc, ol: 0, font: o.font });
          txt(ctx, o.s, x, y, o.size, o.col || '#ffe14a', { rot: o.rot0, sc, font: o.font, stroke: INK });
          ctx.globalAlpha = 1; break;
        }
        case 'debris': {
          ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.globalAlpha = Math.min(1, t * 3);
          ctx.fillStyle = INK; ctx.fillRect(-o.size / 2 - 1.5, -o.size / 2 - 1.5, o.size + 3, o.size * (o.asp || 1) + 3);
          ctx.fillStyle = o.col; ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size * (o.asp || 1)); ctx.restore(); break;
        }
        case 'bill': case 'feather': {
          ctx.save(); ctx.translate(x + Math.sin(o.life * 0.15 + o.ph) * 8, y); ctx.rotate(Math.sin(o.life * 0.11 + o.ph) * 1.2); ctx.globalAlpha = Math.min(1, t * 4) * (o.al || 1);
          ctx.fillStyle = o.col; const sx = Math.cos(o.life * 0.2 + o.ph);
          if (o.k === 'bill') { ctx.fillRect(-o.size * sx, -o.size * 0.25, o.size * 2 * sx, o.size * 0.5); ctx.fillStyle = '#0003'; ctx.fillRect(-o.size * 0.3 * sx, -o.size * 0.12, o.size * 0.6 * sx, o.size * 0.24); }
          else { ctx.beginPath(); ctx.ellipse(0, 0, o.size, o.size * 0.3 * Math.abs(sx) + 0.6, 0, 0, TAU); ctx.fill(); }
          ctx.restore(); break;
        }
        case 'star': {
          const r = o.size * Math.sin(a * Math.PI);
          ctx.save(); ctx.translate(x, y); ctx.rotate(a * 2); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = o.col || '#fff';
          ctx.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? r * 0.12 : r, an = j / 8 * TAU; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.fill(); ctx.restore(); break;
        }
        case 'fist': {
          ctx.globalAlpha = t; ctx.strokeStyle = '#fff'; ctx.lineWidth = o.size * 0.9; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - o.dx, y - o.dy); ctx.lineTo(x, y); ctx.stroke();
          ctx.globalAlpha = 1; disc(ctx, [x, y], o.size, o.col, INK, 2); break;
        }
        case 'slash': {
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t; ctx.lineCap = 'round';
          ctx.strokeStyle = o.col; ctx.lineWidth = o.size * t; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(o.x2 - camX, o.y2); ctx.stroke();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = o.size * 0.35 * t; ctx.stroke(); ctx.restore(); break;
        }
        case 'flame': {
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t * (o.al || 0.7); ctx.fillStyle = o.col;
          const r = o.size * (0.4 + t * 0.6); ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x - r * 0.6, y - r * 1.2, x, y - r * 2.6); ctx.quadraticCurveTo(x + r * 0.6, y - r * 1.2, x + r, y); ctx.arc(x, y, r, 0, Math.PI); ctx.fill();
          ctx.restore(); break;
        }
        case 'note': {
          ctx.globalAlpha = Math.min(1, t * 3);
          txt(ctx, o.s, x + Math.sin(o.life * 0.2) * 4, y, o.size, o.col, { skew: 0, ol: 3 }); ctx.globalAlpha = 1; break;
        }
      }
    }
  }
};
const KATA_L = ['バシッ', 'ドカッ', 'ガッ', 'POW', 'BAM', 'WHAP', 'ベシ'];
const KATA_H = ['ドゴォ!!', 'ズドン!!', 'バキィ!!', 'KRAK!!', 'DOOM!!', 'KA-BLAM!', 'ドッカーン!'];
function hitSpark(x, y, heavy, col) {
  FX.add({ k: 'spark', x, y, size: heavy ? 74 : 38, col: col || '#ffd31a', life: heavy ? 14 : 9, rot: rand(TAU), n: heavy ? 10 : 7 });
  if (heavy) { FX.add({ k: 'burst', x, y, size: 120, col: col || '#ff7a1a', life: 12 }); FX.add({ k: 'ring', x, y, size: 110, flat: 1, life: 12, w: 8, col: '#fff' }); }
  const n = heavy ? 16 : 7;
  for (let i = 0; i < n; i++) { const a = rand(TAU), v = rand(5, heavy ? 19 : 11); FX.add({ k: 'streak', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.86, size: heavy ? 4 : 3, col: i % 2 ? '#fff' : (col || '#ffd31a'), life: rand(8, 16) | 0, len: 2.2 }); }
}
function hitText(x, y, heavy) {
  const s = pick(heavy ? KATA_H : KATA_L);
  FX.add({ k: 'text', s, x: x + rand(-20, 20), y: y - rand(20, 50), vy: -0.5, size: heavy ? 50 : 24, life: heavy ? 46 : 26, rot0: rand(-0.3, 0.3), col: heavy ? '#ffe14a' : '#fff', font: /[^\x00-\x7f]/.test(s) ? JFONT : FONT, front: 1 });
}
function dustPuff(x, y, n, spread, col) {
  for (let i = 0; i < n; i++) FX.add({ k: 'dust', x: x + rand(-8, 8), y: y + rand(-3, 3), vx: rand(-1, 1) * (spread || 2), vy: rand(-1.2, -0.1), drag: 0.93, size: rand(6, 13), life: rand(16, 30) | 0, col });
}
function debris(x, y, cols, n) {
  for (let i = 0; i < n; i++) FX.add({ k: 'debris', x, y: y - rand(0, 50), vx: rand(-5, 5), vy: rand(-9, -2), g: 0.5, size: rand(5, 13), asp: rand(0.4, 1.4), col: pick(cols), rot: rand(TAU), vr: rand(-0.4, 0.4), life: rand(30, 55) | 0, floor: y + rand(-4, 8) });
}

/* radial "focus" speed lines — the classic manga panel */
function speedLines(ctx, cx, cy, tick, alpha, col, inner) {
  const r = RNG(((tick / 2) | 0) * 977 + 13);
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col || '#fff';
  const R = 720;
  for (let i = 0; i < 44; i++) {
    const a = r() * TAU, w = 0.006 + r() * 0.022, r0 = (inner || 190) + r() * 150;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.62);
    ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); ctx.fill();
  }
  ctx.restore();
}
/* horizontal streaks used behind supers / dashes */
function streakField(ctx, tick, alpha, cols, speed) {
  const r = RNG(4242);
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < 46; i++) {
    const y = r() * H, len = 80 + r() * 380, sp = (speed || 40) * (0.5 + r()), x = ((r() * 1600 - tick * sp) % 1600 + 1600) % 1600 - 400, h = 1 + r() * 5;
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(x, y, len, h);
  }
  ctx.restore();
}
