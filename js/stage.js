'use strict';
/* Stage scenery: pre-rendered parallax tiles + a few live layers. */
const BGS = 2;
function mkLayer(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w * BGS; c.height = h * BGS;
  const x = c.getContext('2d'); x.scale(BGS, BGS); fn(x, w, h); c.lw = w; c.lh = h; return c;
}
function tile(ctx, cv, off, y) { const tw = cv.lw; let x = -(((off % tw) + tw) % tw); for (; x < W; x += tw) ctx.drawImage(cv, x, y, tw, cv.lh); }
function skyGrad(ctx, stops, h) { const g = ctx.createLinearGradient(0, 0, 0, h || FLOOR); stops.forEach((s, i) => g.addColorStop(s[0], s[1])); ctx.fillStyle = g; ctx.fillRect(0, 0, W, h || FLOOR); }
function vSign(x, s, px, py, size, col, bg) {
  const h = s.length * (size + 2) + 10;
  x.fillStyle = bg || '#120a24'; x.fillRect(px - size * 0.5 - 6, py, size + 12, h);
  x.save(); x.shadowColor = col; x.shadowBlur = 12; x.strokeStyle = col; x.lineWidth = 2; x.strokeRect(px - size * 0.5 - 6, py, size + 12, h); x.restore();
  for (let i = 0; i < s.length; i++) txt(x, s[i], px, py + 8 + size * 0.5 + i * (size + 2), size, col, { skew: 0, ol: 0, glow: col, blur: 10, font: JFONT });
}
function hSign(x, s, px, py, size, col, bg, font) {
  x.save(); x.font = `900 ${size}px ${font || FONT}`; const w = x.measureText(s).width + 16; x.restore();
  x.fillStyle = bg || '#120a24'; x.fillRect(px - w / 2, py - size * 0.7, w, size * 1.4);
  x.save(); x.shadowColor = col; x.shadowBlur = 12; x.strokeStyle = col; x.lineWidth = 2; x.strokeRect(px - w / 2, py - size * 0.7, w, size * 1.4); x.restore();
  txt(x, s, px, py + 1, size, col, { skew: 0, ol: 0, glow: col, blur: 10, font: font || FONT });
}
function windows(x, r, bx, by, w, h, cw, ch, p, cols) {
  for (let yy = by; yy < by + h - ch; yy += ch + 3) for (let xx = bx + 4; xx < bx + w - cw; xx += cw + 3)
    if (r() < p) { x.globalAlpha = 0.35 + r() * 0.6; x.fillStyle = cols[(r() * cols.length) | 0]; x.fillRect(xx, yy, cw, ch); }
  x.globalAlpha = 1;
}

/* additive light pool on the floor */
function lightPool(ctx, x, y, rx, ry, rgb, a) {
  if (x < -rx || x > W + rx) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
}
const Scenery = [
  /* ================= STAGE 1 : NEON GUTTER ================= */
  {
    build() {
      const L = this.L = {};
      L.far = mkLayer(1440, FLOOR, x => {
        const r = RNG(11);
        for (let bx = -20; bx < 1440;) {
          const w = 40 + r() * 80, h = 90 + r() * 190; x.fillStyle = '#1c1140'; x.fillRect(bx, FLOOR - h, w, h);
          windows(x, r, bx, FLOOR - h + 6, w, h, 4, 5, 0.3, ['#ffd36b', '#6be7ff', '#ff6bd0']);
          if (r() < 0.5) { x.fillStyle = '#1c1140'; x.fillRect(bx + w / 2, FLOOR - h - 26, 2, 26); x.fillStyle = '#ff3355'; x.fillRect(bx + w / 2 - 1, FLOOR - h - 28, 4, 4); }
          bx += w + r() * 14;
        }
      });
      L.mid = mkLayer(1440, FLOOR, x => {
        const r = RNG(5); const signs = [['カラオケ', '#ff2a6d'], ['ラーメン', '#ffd31a'], ['24H', '#05d9e8'], ['パチンコ', '#b967ff'], ['ホテル', '#ff6bd0'], ['スシ', '#7dff6b']];
        let i = 0;
        for (let bx = 0; bx < 1440;) {
          const w = 150 + r() * 90, h = 200 + r() * 110; if (bx + w > 1440) break;
          x.fillStyle = '#26144a'; x.fillRect(bx, FLOOR - h, w, h); x.fillStyle = '#301a5c'; x.fillRect(bx, FLOOR - h, w, 6);
          windows(x, r, bx + 4, FLOOR - h + 14, w - 8, h, 12, 16, 0.42, ['#ffcf7a', '#8af0ff', '#ff8ad8', '#3a2a6a']);
          const s = signs[i++ % signs.length]; vSign(x, s[0], bx + (r() < 0.5 ? 16 : w - 16), FLOOR - h + 30, 18, s[1]);
          x.fillStyle = '#1a0e36'; x.fillRect(bx + w * 0.3, FLOOR - h - 18, 26, 18);
          bx += w + 20 + r() * 50;
        }
        x.strokeStyle = '#0c0618'; x.lineWidth = 1.5; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(0, 60 + k * 18); x.bezierCurveTo(480, 110 + k * 22, 960, 30 + k * 10, 1440, 60 + k * 18); x.stroke(); }
      });
      L.near = mkLayer(1440, FLOOR, x => {
        const r = RNG(77), cols = ['#2f1d55', '#3d2152', '#232a5a', '#341a47', '#2a2358', '#3a1d4c'];
        for (let i = 0; i < 6; i++) {
          const bx = i * 240, top = 40 + r() * 80, c = cols[i];
          if (i === 3) { // alley
            x.fillStyle = '#0a0616'; x.fillRect(bx + 60, 110, 120, 230);
            x.fillStyle = '#ffd31a'; x.fillRect(bx + 96, 286, 4, 3); x.fillRect(bx + 106, 286, 4, 3); // cat. obviously.
            x.fillStyle = '#1c2a3a'; x.fillRect(bx + 110, 296, 60, 44); x.fillStyle = '#263a4e'; x.fillRect(bx + 108, 290, 64, 8);
            x.fillStyle = c; x.fillRect(bx, top, 60, 340); x.fillRect(bx + 180, top + 30, 60, 340);
            vSign(x, 'ヤバイ', bx + 30, top + 40, 20, '#ff2a6d');
            continue;
          }
          x.fillStyle = c; x.fillRect(bx, top, 240, FLOOR - top);
          x.fillStyle = shade('#6a4a9a', 0.5); x.fillRect(bx, top, 240, 8);
          x.strokeStyle = '#0003'; x.lineWidth = 1; for (let yy = top + 16; yy < 210; yy += 9) { x.beginPath(); x.moveTo(bx, yy); x.lineTo(bx + 240, yy); x.stroke(); }
          for (let k = 0; k < 4; k++) { // upper windows
            const wx = bx + 18 + k * 56, wy = top + 30; if (wy > 170) break;
            x.fillStyle = '#0e0820'; x.fillRect(wx - 3, wy - 3, 42, 52);
            const lit = r() < 0.6; x.fillStyle = lit ? pick(['#ffcf7a', '#8af0ff', '#ff8ad8']) : '#1a1232'; x.fillRect(wx, wy, 36, 46);
            if (lit && r() < 0.5) { x.fillStyle = '#0008'; x.beginPath(); x.arc(wx + 18, wy + 26, 7, 0, TAU); x.fill(); x.fillRect(wx + 9, wy + 32, 18, 14); }
            x.fillStyle = '#0e0820'; x.fillRect(wx + 17, wy, 2, 46);
          }
          x.fillStyle = '#18102e'; x.fillRect(bx, 196, 240, 10); // ledge
          const sy = 214;
          if (i === 0) { // ramen
            const g = x.createLinearGradient(0, sy, 0, 340); g.addColorStop(0, '#ffb347'); g.addColorStop(1, '#c2532a'); x.fillStyle = g; x.fillRect(bx + 20, sy, 200, 126);
            x.fillStyle = '#3a1a14'; x.fillRect(bx + 20, 300, 200, 40); x.fillStyle = '#0006'; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(bx + 60 + k * 55, 296, 12, Math.PI, 0); x.fill(); }
            for (let k = 0; k < 4; k++) { x.fillStyle = '#a3172b'; x.fillRect(bx + 24 + k * 49, sy, 46, 44); txt(x, 'ラーメン'[k], bx + 47 + k * 49, sy + 24, 24, '#fff', { skew: 0, ol: 0, font: JFONT }); }
            hSign(x, 'RAMEN? RAMEN!', bx + 120, 186, 20, '#ffd31a');
          } else if (i === 2) { // arcade
            const g = x.createLinearGradient(0, sy, 0, 340); g.addColorStop(0, '#05d9e8'); g.addColorStop(1, '#3a1ab8'); x.fillStyle = g; x.fillRect(bx + 16, sy, 208, 126);
            for (let k = 0; k < 4; k++) { x.fillStyle = '#12082a'; x.fillRect(bx + 28 + k * 50, 250, 36, 90); x.fillStyle = pick(['#ff2a6d', '#ffd31a', '#7dff6b']); x.fillRect(bx + 33 + k * 50, 256, 26, 22); }
            hSign(x, 'ARCADE ∞', bx + 120, 186, 24, '#05d9e8');
          } else if (i === 4) { // karaoke
            x.fillStyle = '#1a0c2c'; x.fillRect(bx + 30, sy, 180, 126); x.fillStyle = '#ff6bd0'; x.fillRect(bx + 90, 240, 60, 100); x.fillStyle = '#2a0c3c'; x.fillRect(bx + 96, 246, 48, 94);
            hSign(x, 'KARAOKE!!', bx + 120, 182, 24, '#ff2a6d'); txt(x, '(please stop)', bx + 120, 226, 11, '#ff9ad8', { skew: 0, ol: 0, w: 700, font: 'sans-serif' });
            txt(x, '♪', bx + 54, 280, 40, '#ff2a6d', { skew: 0, ol: 0, glow: '#ff2a6d' }); txt(x, '♫', bx + 184, 270, 36, '#05d9e8', { skew: 0, ol: 0, glow: '#05d9e8' });
          } else { // shutters & graffiti
            x.fillStyle = '#4a4a66'; x.fillRect(bx + 24, sy + 6, 192, 120); x.strokeStyle = '#2c2c44'; x.lineWidth = 2; for (let yy = sy + 12; yy < 340; yy += 8) { x.beginPath(); x.moveTo(bx + 24, yy); x.lineTo(bx + 216, yy); x.stroke(); }
            const g = i === 1 ? ['FUN = $4.99', '#ff2a6d'] : ['GOLDFIST SUX', '#7dff6b'];
            txt(x, g[0], bx + 120, 280, 30, g[1], { rot: -0.08, ol: 5, stroke: '#111' });
            x.fillStyle = '#f4ecd0'; x.fillRect(bx + 36, 226, 34, 44); txt(x, 'WANTED', bx + 53, 234, 8, '#a00', { skew: 0, ol: 0 }); txt(x, 'FUN', bx + 53, 254, 14, '#111', { skew: 0, ol: 0 });
          }
          // pipe + AC
          x.fillStyle = '#15102a'; x.fillRect(bx + 4, top, 6, FLOOR - top); x.fillStyle = '#56567a'; x.fillRect(bx + 186, top + 96 > 190 ? 150 : top + 96, 34, 22);
        }
      });
    },
    draw(ctx, cam, t) {
      const L = this.L;
      skyGrad(ctx, [[0, '#0b0620'], [0.55, '#3a1160'], [1, '#c02a80']]);
      // the tower you are coming for
      const tx = 720 - cam * 0.04;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.12;
      for (let i = 0; i < 2; i++) { const a = Math.sin(t * 0.01 + i * 2) * 0.5 + (i ? 0.5 : -0.5); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.moveTo(tx, 70); ctx.lineTo(tx + Math.sin(a) * 600 - 40, 70 - Math.cos(a) * 600); ctx.lineTo(tx + Math.sin(a) * 600 + 40, 70 - Math.cos(a) * 600); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#150a30'; ctx.beginPath(); ctx.moveTo(tx - 34, FLOOR); ctx.lineTo(tx - 26, 70); ctx.lineTo(tx, 40); ctx.lineTo(tx + 26, 70); ctx.lineTo(tx + 34, FLOOR); ctx.fill();
      txt(ctx, 'G', tx, 96, 34, '#ffd31a', { skew: 0, ol: 0, glow: '#ffb000', blur: 18 });
      if (this.bolt > 0) { ctx.fillStyle = `rgba(220,200,255,${this.bolt / 14})`; ctx.fillRect(0, 0, W, FLOOR); this.bolt--; } else if (Math.random() < 0.002) this.bolt = 10;
      tile(ctx, L.far, cam * 0.15, 0);
      ctx.fillStyle = 'rgba(192,42,128,0.18)'; ctx.fillRect(0, 0, W, FLOOR);
      tile(ctx, L.mid, cam * 0.45, 0);
      tile(ctx, L.near, cam, 0);
      for (let n = Math.floor(cam / 1440); n <= Math.floor((cam + W) / 1440); n++) for (let k = 0; k < 4; k++) { // arcade cabinets never sleep
        const x = n * 1440 + 480 + 33 + k * 50 - cam; if (x < -30 || x > W) continue;
        ctx.fillStyle = ['#ff2a6d', '#ffd31a', '#7dff6b', '#05d9e8'][((t >> 4) + k * 3) & 3]; ctx.fillRect(x, 256, 26, 22);
        ctx.fillStyle = '#12082a'; ctx.fillRect(x + 4 + ((t >> 2) + k * 5) % 16, 262 + ((t >> 3) + k) % 10, 5, 5);
      }
      // wet street
      ctx.fillStyle = '#3d3566'; ctx.fillRect(0, FLOOR, W, 12); ctx.fillStyle = '#22193f'; ctx.fillRect(0, FLOOR + 10, W, 4);
      const g = ctx.createLinearGradient(0, FLOOR + 14, 0, H); g.addColorStop(0, '#33276a'); g.addColorStop(1, '#171034'); ctx.fillStyle = g; ctx.fillRect(0, FLOOR + 14, W, H - FLOOR - 14);
      ctx.save(); ctx.beginPath(); ctx.rect(0, FLOOR + 14, W, H); ctx.clip(); ctx.globalAlpha = 0.38;
      ctx.translate(0, FLOOR * 1.75 + 14); ctx.scale(1, -0.75); tile(ctx, L.near, cam, 0); ctx.restore();
      const g2 = ctx.createLinearGradient(0, FLOOR + 14, 0, H); g2.addColorStop(0, 'rgba(12,8,24,0)'); g2.addColorStop(1, 'rgba(18,10,40,0.7)'); ctx.fillStyle = g2; ctx.fillRect(0, FLOOR + 14, W, H);
      ctx.fillStyle = '#ffffff16'; for (let i = 0; i < 12; i++) { const x = ((i * 190 - cam) % 2280 + 2280) % 2280 - 200; ctx.fillRect(x, 448, 90, 5); }
      // rain ripples
      const r = RNG(((t / 6) | 0) + 3); ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const x = r() * W, y = FLOOR + 20 + r() * 180, a = (t % 6) / 6; ctx.beginPath(); ctx.ellipse(x, y, 3 + a * 9, 1 + a * 3, 0, 0, TAU); ctx.stroke(); }
    },
    reflect: { a: 0.34, ripple: 1 },
    glow(ctx, cam, t) { // shop light spilling onto the wet street, with the odd dying-neon flicker
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const P = [[120, '255,170,70'], [600, '40,220,240'], [1080, '255,70,190'], [840, '255,60,110']];
      for (let n = -1; n < 2; n++) for (let i = 0; i < P.length; i++) {
        const fl = (Math.sin(t * 0.37 + i * 9) > 0.93 || (i === 3 && (t >> 2) % 23 < 2)) ? 0.25 : 1;
        lightPool(ctx, P[i][0] + (Math.floor(cam / 1440) + n) * 1440 - cam, FLOOR + 26, i === 3 ? 90 : 190, i === 3 ? 30 : 64, P[i][1], (0.3 + 0.04 * Math.sin(t * 0.09 + i)) * fl);
      }
      ctx.restore();
    },
    front(ctx, cam, t) {
      ctx.strokeStyle = '#cfe6ff55'; ctx.lineWidth = 1.2; ctx.beginPath(); const r = RNG(9);
      for (let i = 0; i < 90; i++) { const x = ((r() * 1200 - t * 5 - cam * 1.2) % 1200 + 1200) % 1200 - 100, y = (r() * 700 + t * (16 + r() * 8)) % 700 - 80; ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 26); }
      ctx.stroke();
      // out-of-focus street furniture sliding past the lens
      for (let i = 0; i < 2; i++) {
        const x = ((i * 1250 + 500 - cam * 1.5) % 2500 + 2500) % 2500 - 300; if (x < -160 || x > W + 160) continue;
        ctx.fillStyle = 'rgba(6,2,16,0.93)'; ctx.fillRect(x - 7, 0, 14, H); ctx.fillRect(x - 70, 30, 140, 74);
        ctx.strokeStyle = i ? '#05d9e8' : '#ff2a6d'; ctx.lineWidth = 3; ctx.strokeRect(x - 64, 36, 128, 62);
        txt(ctx, i ? 'FUN ZONE →' : 'NO FUN', x, 60, 22, i ? '#05d9e8' : '#ff2a6d', { skew: 0, ol: 0, glow: i ? '#05d9e8' : '#ff2a6d' }); txt(ctx, i ? '(permit required)' : 'BY ORDER OF G.', x, 84, 11, '#fff', { skew: 0, ol: 0 });
      }
      ctx.strokeStyle = 'rgba(6,2,16,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = -1; k < 3; k++) { const x0 = k * 700 - ((cam * 1.5) % 700); ctx.moveTo(x0, -6); ctx.quadraticCurveTo(x0 + 350, 44, x0 + 700, -6); }
      ctx.stroke();
    }
  },
  /* ================= STAGE 2 : MIDNIGHT NOODLE MARKET ================= */
  {
    build() {
      const L = this.L = {};
      L.far = mkLayer(1440, FLOOR, x => {
        const r = RNG(21); x.fillStyle = '#5a1f5e';
        for (let i = 0; i < 5; i++) { // cranes & pagodas against the sun
          const bx = 60 + i * 290 + r() * 60;
          if (i % 2) { x.fillRect(bx, 150, 8, 190); x.fillRect(bx - 60, 150, 170, 6); x.fillRect(bx + 100, 156, 2, 50); x.beginPath(); x.moveTo(bx, 120); x.lineTo(bx + 8, 120); x.lineTo(bx + 110, 152); x.lineTo(bx - 60, 152); x.fill(); }
          else for (let k = 0; k < 4; k++) { const w = 120 - k * 22, y = 300 - k * 42; x.beginPath(); x.moveTo(bx - w / 2 - 16, y); x.quadraticCurveTo(bx, y - 16, bx + w / 2 + 16, y); x.lineTo(bx + w / 2, y - 12); x.lineTo(bx - w / 2, y - 12); x.fill(); x.fillRect(bx - w / 2 + 8, y, w - 16, 42); }
        }
        for (let bx = 0; bx < 1440;) { const w = 50 + r() * 70, h = 30 + r() * 60; x.fillRect(bx, FLOOR - h, w, h); bx += w; }
      });
      L.mid = mkLayer(1440, FLOOR, x => {
        const r = RNG(31);
        for (let bx = 0; bx < 1440;) {
          const w = 130 + r() * 80, h = 110 + r() * 90; if (bx + w > 1440) break;
          x.fillStyle = '#4a1a48'; x.fillRect(bx, FLOOR - h, w, h);
          x.fillStyle = '#2e0f33'; x.beginPath(); x.moveTo(bx - 14, FLOOR - h); x.quadraticCurveTo(bx + w / 2, FLOOR - h - 34, bx + w + 14, FLOOR - h); x.lineTo(bx + w, FLOOR - h + 8); x.lineTo(bx, FLOOR - h + 8); x.fill();
          windows(x, r, bx + 6, FLOOR - h + 18, w - 12, h, 16, 14, 0.5, ['#ffd98a', '#ffae5a', '#ff7a5a']);
          bx += w + 10 + r() * 40;
        }
      });
      L.near = mkLayer(1440, FLOOR, x => {
        const r = RNG(41);
        const stalls = [['ギョーザ', '#d92b3a', '#fff'], ['たこやき', '#1aa8a0', '#fff'], ['SOUP??', '#e8a21a', '#3a1a08'], ['ヤキトリ', '#7a3ad9', '#fff'], ['MYSTERY MEAT', '#d92b6a', '#fff'], ['おでん', '#2b6ad9', '#fff']];
        x.fillStyle = '#3a1436'; x.fillRect(0, 150, 1440, 190);
        for (let k = 0; k < 24; k++) { x.fillStyle = k % 2 ? '#431840' : '#35112f'; x.fillRect(k * 60, 150, 60, 190); }
        for (let i = 0; i < 6; i++) {
          const bx = i * 240 + 14, s = stalls[i];
          x.fillStyle = '#2a0e1e'; x.fillRect(bx, 196, 212, 144);
          const g = x.createLinearGradient(0, 200, 0, 340); g.addColorStop(0, '#ffcf70'); g.addColorStop(1, '#b8502a'); x.fillStyle = g; x.fillRect(bx + 8, 204, 196, 86);
          x.fillStyle = '#0005'; for (let k = 0; k < 3; k++) { const px = bx + 40 + k * 62 + r() * 10; x.beginPath(); x.arc(px, 262, 11, 0, TAU); x.fill(); x.fillRect(px - 14, 272, 28, 20); }
          x.fillStyle = '#5a2a1a'; x.fillRect(bx, 290, 212, 50); x.fillStyle = '#7a3c22'; x.fillRect(bx - 4, 286, 220, 8);
          for (let k = 0; k < 9; k++) { x.fillStyle = k % 2 ? s[2] : s[1]; x.beginPath(); x.moveTo(bx - 10 + k * 26, 170); x.lineTo(bx + 16 + k * 26, 170); x.lineTo(bx + 16 + k * 26, 206); x.quadraticCurveTo(bx + 3 + k * 26, 216, bx - 10 + k * 26, 206); x.fill(); }
          x.fillStyle = shade(s[1], 0.6); x.fillRect(bx - 10, 164, 234, 8);
          const jp = /[^\x00-\x7f]/.test(s[0]);
          txt(x, s[0], bx + 106, 142, jp ? 26 : 22, '#fff2c0', { skew: 0, ol: 5, stroke: '#2a0e1e', font: jp ? JFONT : FONT, glow: '#ffae5a', blur: 8 });
          for (let k = 0; k < 3; k++) { x.fillStyle = '#e8dcc0'; x.fillRect(bx + 20 + k * 64, 300, 44, 30); txt(x, pick(['¥300', '¥??', 'FREE*', '¥9999']), bx + 42 + k * 64, 316, 12, '#3a1a08', { skew: 0, ol: 0 }); }
        }
      });
    },
    draw(ctx, cam, t) {
      const L = this.L;
      skyGrad(ctx, [[0, '#2a1458'], [0.45, '#c2417a'], [0.8, '#ff8a4a'], [1, '#ffd070']]);
      const sx = 620 - cam * 0.03;
      ctx.save(); ctx.fillStyle = '#fff1b0'; ctx.shadowColor = '#ffb040'; ctx.shadowBlur = 50; ctx.beginPath(); ctx.arc(sx, 230, 110, 0, TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#ff8a4a'; for (let i = 0; i < 6; i++) ctx.fillRect(sx - 120, 236 + i * 17, 240, 3 + i * 1.6);
      ctx.fillStyle = '#ffffff20'; for (let i = 0; i < 5; i++) { const x = ((i * 300 - cam * 0.06 - t * 0.1) % 1500 + 1500) % 1500 - 200; ctx.beginPath(); ctx.ellipse(x, 70 + i * 22, 120, 9, 0, 0, TAU); ctx.fill(); }
      tile(ctx, L.far, cam * 0.12, 0);
      ctx.fillStyle = 'rgba(255,138,74,0.2)'; ctx.fillRect(0, 0, W, FLOOR);
      tile(ctx, L.mid, cam * 0.4, 0);
      // lantern strings between mid & near
      for (let i = -1; i < 5; i++) {
        const x0 = i * 320 - ((cam * 0.7) % 320);
        ctx.strokeStyle = '#2a0e1e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, 60); ctx.quadraticCurveTo(x0 + 160, 120, x0 + 320, 60); ctx.stroke();
        for (let k = 1; k < 6; k++) {
          const u = k / 6, lx = x0 + u * 320, ly = 60 + 4 * u * (1 - u) * 30 + 6 + Math.sin(t * 0.04 + k + i) * 2;
          ctx.save(); ctx.shadowColor = '#ff5a2a'; ctx.shadowBlur = 16; ctx.fillStyle = k % 2 ? '#ff4a3a' : '#ffb03a'; ctx.beginPath(); ctx.ellipse(lx, ly + 8, 8, 10, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
      tile(ctx, L.near, cam, 0);
      for (let m = Math.floor(cam / 240); m <= Math.floor((cam + W) / 240); m++) for (let k = 0; k < 4; k++) { // steam off the grills
        const u = ((t * 0.012 + k * 0.25 + m * 0.37) % 1), x = m * 240 + 120 - cam + Math.sin(u * 6 + m) * 14 + (k - 1.5) * 22, y = 262 - u * 90;
        ctx.fillStyle = `rgba(255,244,225,${0.26 * (1 - u)})`; ctx.beginPath(); ctx.arc(x, y, 8 + u * 16, 0, TAU); ctx.fill();
      }
      // plank pier
      const g = ctx.createLinearGradient(0, FLOOR, 0, H); g.addColorStop(0, '#8a5236'); g.addColorStop(1, '#4a2420'); ctx.fillStyle = g; ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.fillStyle = '#3a1a16'; ctx.fillRect(0, FLOOR, W, 5);
      ctx.strokeStyle = '#3a1a1688'; ctx.lineWidth = 2;
      for (let row = 0; row < 8; row++) {
        const y = FLOOR + 5 + row * 25; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        for (let k = 0; k < 9; k++) { const x = ((k * 150 + row * 67 - cam) % 1350 + 1350) % 1350 - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 25); ctx.stroke(); }
      }
      const g2 = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 70); g2.addColorStop(0, 'rgba(255,190,90,0.35)'); g2.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g2; ctx.fillRect(0, FLOOR, W, 70);
    },
    glow(ctx, cam, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = -1; i < 6; i++) lightPool(ctx, i * 240 + 120 - (((cam % 240) + 240) % 240), FLOOR + 22, 130, 46, '255,170,80', 0.2 + 0.03 * Math.sin(t * 0.07 + i * 2));
      ctx.restore();
    },
    front(ctx, cam, t) {
      const r = RNG(19); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) { const x = ((r() * 1300 - cam * 1.3 + Math.sin(t * 0.02 + i) * 30) % 1300 + 1300) % 1300 - 150, y = H - ((r() * 600 + t * (0.6 + r())) % 600); ctx.fillStyle = `rgba(255,${150 + r() * 80 | 0},60,${0.5 * r() + 0.2})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + r() * 2, 0, TAU); ctx.fill(); }
      ctx.restore();
      // blurry foreground lanterns for depth
      for (let i = 0; i < 3; i++) { const x = ((i * 520 - cam * 1.6) % 1560 + 1560) % 1560 - 300; ctx.fillStyle = '#1a0810'; ctx.fillRect(x - 2, 0, 4, 26); ctx.save(); ctx.shadowColor = '#ff5a2a'; ctx.shadowBlur = 40; ctx.fillStyle = '#ff5a3acc'; ctx.beginPath(); ctx.ellipse(x, 50 + Math.sin(t * 0.03 + i) * 3, 30, 36, 0, 0, TAU); ctx.fill(); ctx.restore(); txt(ctx, '祭', x, 52, 30, '#3a0a0acc', { skew: 0, ol: 0, font: JFONT }); }
    }
  },
  /* ================= STAGE 3 : GOLDFIST TOWER, ROOFTOP ================= */
  {
    build() {
      const L = this.L = {};
      L.far = mkLayer(1440, FLOOR, x => {
        const r = RNG(51);
        for (let bx = 0; bx < 1440;) { const w = 26 + r() * 50, h = 20 + r() * 110; x.fillStyle = '#0d1436'; x.fillRect(bx, FLOOR - h, w, h); windows(x, r, bx, FLOOR - h + 4, w, h, 3, 3, 0.45, ['#ffd36b', '#9fd0ff', '#fff']); bx += w + r() * 6; }
      });
      L.mid = mkLayer(1440, FLOOR, x => {
        const r = RNG(61);
        for (let i = 0; i < 4; i++) {
          const bx = 80 + i * 350 + r() * 60, w = 110 + r() * 60, top = 110 + r() * 90;
          x.fillStyle = '#141c48'; x.fillRect(bx, top, w, FLOOR - top); x.fillStyle = '#1e2a66'; x.fillRect(bx, top, w, 5); x.fillRect(bx + w - 6, top, 6, FLOOR - top);
          windows(x, r, bx + 4, top + 12, w - 10, FLOOR - top, 10, 12, 0.5, ['#ffd98a', '#a8d8ff', '#22306e']);
          x.fillStyle = '#141c48'; x.fillRect(bx + w / 2 - 2, top - 50, 4, 50);
          if (i === 1) { x.fillStyle = '#0a0e26'; x.fillRect(bx - 30, top - 86, w + 60, 70); x.strokeStyle = '#ffd31a'; x.lineWidth = 3; x.strokeRect(bx - 30, top - 86, w + 60, 70); txt(x, 'FUN™', bx + w / 2, top - 58, 34, '#ffd31a', { glow: '#ffb000', ol: 0 }); txt(x, 'now only $4.99 / laugh', bx + w / 2, top - 30, 11, '#ffe9a0', { skew: 0, ol: 0, w: 700, font: 'sans-serif' }); }
        }
      });
      L.near = mkLayer(1440, FLOOR, x => {
        // glass parapet with gold rail
        x.fillStyle = 'rgba(120,170,255,0.13)'; x.fillRect(0, 262, 1440, 78);
        x.strokeStyle = 'rgba(200,225,255,0.25)'; x.lineWidth = 2; for (let k = 0; k < 30; k++) { x.beginPath(); x.moveTo(k * 48 + 10, 262); x.lineTo(k * 48 - 16, 340); x.stroke(); }
        for (let k = 0; k < 12; k++) { x.fillStyle = '#b8860b'; x.fillRect(k * 120 - 4, 252, 8, 88); x.fillStyle = '#ffd31a'; x.fillRect(k * 120 - 2, 252, 3, 88); }
        x.fillStyle = '#b8860b'; x.fillRect(0, 252, 1440, 10); x.fillStyle = '#ffe680'; x.fillRect(0, 253, 1440, 3);
        // furniture of the obscenely rich
        const gold = { scale: 1.25 };
        for (let i = 0; i < 3; i++) {
          const bx = 200 + i * 480;
          if (i === 1) { x.fillStyle = '#39415e'; x.fillRect(bx - 60, 256, 120, 84); x.fillStyle = '#232a44'; for (let k = 0; k < 6; k++) x.fillRect(bx - 52, 264 + k * 12, 104, 5); x.fillStyle = '#525c84'; x.fillRect(bx - 64, 250, 128, 8); continue; }
          x.fillStyle = '#3a3050'; x.fillRect(bx - 44, 300, 88, 40); x.fillStyle = '#5a4a78'; x.fillRect(bx - 50, 294, 100, 8);
          txt(x, i ? 'ME (AGAIN)' : 'ME', bx, 322, 13, '#ffd31a', { skew: 0, ol: 0 });
          const st = Object.assign({}, ENEMIES.goldfist.style, { scale: 1.25 }), p = POSES[i ? 'winB' : 'point'];
          const J = solve(st, p, bx, 296, 1);
          drawFighter(x, st, J, '#c9971a'); x.globalAlpha = 0.5; const J2 = solve(st, p, bx - 3, 294, 1); drawFighter(x, st, J2, '#ffe680'); x.globalAlpha = 1; drawFighter(x, st, solve(st, p, bx + 1, 296, 1), '#e0b030');
        }
      });
    },
    draw(ctx, cam, t) {
      const L = this.L;
      skyGrad(ctx, [[0, '#04061a'], [0.6, '#131c52'], [1, '#4a2f86']]);
      const r = RNG(3); ctx.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * 260; ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.02 + i)); ctx.fillRect(x, y, 1.6, 1.6); } ctx.globalAlpha = 1;
      const mx = 690 - cam * 0.02;
      ctx.save(); ctx.shadowColor = '#bcd4ff'; ctx.shadowBlur = 70; ctx.fillStyle = '#f4f1dc'; ctx.beginPath(); ctx.arc(mx, 150, 128, 0, TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#d8d2b4'; [[-40, -30, 26], [34, 20, 34], [-10, 60, 16], [60, -50, 14], [-70, 30, 12]].forEach(c => { ctx.beginPath(); ctx.arc(mx + c[0], 150 + c[1], c[2], 0, TAU); ctx.fill(); });
      { // the chairman's helicopter, looking for you
        const hx = ((t * 1.1) % 1700) - 350, hy = 70 + Math.sin(t * 0.02) * 14;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,170,0.12)'; ctx.beginPath(); ctx.moveTo(hx, hy + 8); ctx.lineTo(hx - 110 + Math.sin(t * 0.03) * 60, FLOOR); ctx.lineTo(hx + 20 + Math.sin(t * 0.03) * 60, FLOOR); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#0a0e26'; ctx.beginPath(); ctx.ellipse(hx, hy, 20, 9, 0, 0, TAU); ctx.fill(); ctx.fillRect(hx - 44, hy - 3, 30, 4); ctx.fillRect(hx - 48, hy - 10, 4, 12); ctx.fillRect(hx - 2, hy - 14, 3, 8);
        ctx.fillRect(hx - 34 * Math.abs(Math.sin(t * 0.9)), hy - 16, 68 * Math.abs(Math.sin(t * 0.9)), 2);
        if ((t >> 3) & 1) { ctx.fillStyle = '#ff3355'; ctx.fillRect(hx - 48, hy - 12, 4, 4); }
      }
      for (let i = 0; i < 7; i++) { const x = ((i * 260 - cam * 0.1 - t * 0.9 * (1 + i % 3 * 0.3)) % 1820 + 1820) % 1820 - 300, y = 60 + (i * 53) % 200; ctx.fillStyle = i % 2 ? 'rgba(40,50,110,0.75)' : 'rgba(90,80,160,0.5)'; ctx.beginPath(); ctx.ellipse(x, y, 170, 13, 0, 0, TAU); ctx.ellipse(x + 60, y + 9, 110, 9, 0, 0, TAU); ctx.fill(); }
      tile(ctx, L.far, cam * 0.1, 0);
      tile(ctx, L.mid, cam * 0.35, 0);
      if ((t >> 5) & 1) { ctx.fillStyle = '#ff3355'; for (let i = 0; i < 6; i++) { const x = ((i * 350 + 140 - cam * 0.35) % 1440 + 1440) % 1440; ctx.beginPath(); ctx.arc(x, 82 + (i * 37) % 60, 3, 0, TAU); ctx.fill(); } }
      tile(ctx, L.near, cam, 0);
      // marble & gold floor
      const g = ctx.createLinearGradient(0, FLOOR, 0, H); g.addColorStop(0, '#2a3158'); g.addColorStop(1, '#0e1226'); ctx.fillStyle = g; ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.strokeStyle = '#c9971a66'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let k = -4; k < 22; k++) { const x = k * 100 - (cam % 100); ctx.moveTo(x, FLOOR); ctx.lineTo(x - 200, H); ctx.moveTo(x - 200, FLOOR); ctx.lineTo(x, H); }
      ctx.stroke();
      ctx.fillStyle = '#c9971a'; ctx.fillRect(0, FLOOR, W, 4);
      const hx = 2500 - cam; if (hx > -300 && hx < W + 300) { ctx.strokeStyle = '#ffd31a88'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(hx, 440, 230, 78, 0, 0, TAU); ctx.stroke(); txt(ctx, 'G', hx, 442, 120, '#ffd31a55', { skew: 0, ol: 0, sc: 1 }); }
      const g2 = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 80); g2.addColorStop(0, 'rgba(180,200,255,0.22)'); g2.addColorStop(1, 'rgba(180,200,255,0)'); ctx.fillStyle = g2; ctx.fillRect(0, FLOOR, W, 80);
    },
    reflect: { a: 0.2, ripple: 0 },
    glow(ctx, cam, t) { // moonlight on polished marble
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      lightPool(ctx, 690 - cam * 0.02, FLOOR + 70, 260, 110, '170,200,255', 0.22);
      for (let i = 0; i < 2; i++) lightPool(ctx, ((i * 700 + t * 3) % 1800) - 400, FLOOR + 60 + i * 60, 150, 40, '255,215,90', 0.14); // roaming spotlights
      ctx.restore();
    },
    front(ctx, cam, t) {
      const r = RNG(29);
      for (let i = 0; i < 16; i++) {
        const x = ((r() * 1400 - t * (3 + r() * 3) - cam * 1.2) % 1400 + 1400) % 1400 - 200, y = (r() * 560 + Math.sin(t * 0.03 + i) * 40 + t * 0.6) % 560, ph = i * 1.7, sx = Math.cos(t * 0.13 + ph);
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.07 + ph)); ctx.fillStyle = '#8fd694'; ctx.fillRect(-9 * sx, -4, 18 * sx, 8); ctx.fillStyle = '#3f8a4a'; ctx.fillRect(-3 * sx, -2, 6 * sx, 4); ctx.restore();
      }
      ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const x = ((r() * 1300 - t * 22) % 1300 + 1300) % 1300 - 150, y = r() * H; ctx.moveTo(x, y); ctx.lineTo(x + 70 + r() * 80, y); }
      ctx.stroke();
    }
  }
];
