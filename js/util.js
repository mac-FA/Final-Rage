'use strict';
/* ---------- constants & math ---------- */
const W = 960, H = 540, FLOOR = 340, ZMIN = 16, ZMAX = 184, GRAV = 0.62;
const D2R = Math.PI / 180, TAU = Math.PI * 2, INK = '#15101f';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
function RNG(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const _shadeCache = {};
function shade(hex, f) {
  const k = hex + f; if (_shadeCache[k]) return _shadeCache[k];
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16), r = clamp(((n >> 16) & 255) * f, 0, 255) | 0, g = clamp(((n >> 8) & 255) * f, 0, 255) | 0, b = clamp((n & 255) * f, 0, 255) | 0;
  return _shadeCache[k] = `rgb(${r},${g},${b})`;
}
function tint(hex, f) {
  const k = hex + 't' + f; if (_shadeCache[k]) return _shadeCache[k];
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16), m = v => (v + (255 - v) * f) | 0;
  return _shadeCache[k] = `rgb(${m((n >> 16) & 255)},${m((n >> 8) & 255)},${m(n & 255)})`;
}
const FONT = 'Impact, "Haettenschweiler", "Arial Narrow Bold", "Arial Black", sans-serif';
const JFONT = '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans CJK JP", "Noto Sans JP", "MS Gothic", Impact, sans-serif';
/* outlined, optionally skewed text */
function txt(ctx, s, x, y, size, fill, o) {
  o = o || {};
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.sc) ctx.scale(o.sc, o.sc);
  if (o.skew !== 0) ctx.transform(1, 0, o.skew === undefined ? -0.22 : o.skew, 1, 0, 0);
  ctx.font = `${o.w || 900} ${size}px ${o.font || FONT}`;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  ctx.lineJoin = 'round';
  if (o.maxW) { const mw = ctx.measureText(s).width; if (mw > o.maxW) ctx.scale(o.maxW / mw, o.maxW / mw); }
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 16; }
  if (o.ol !== 0) { ctx.lineWidth = o.ol || Math.max(3, size * 0.16); ctx.strokeStyle = o.stroke || INK; ctx.strokeText(s, 0, 0); }
  if (Array.isArray(fill)) { const g = ctx.createLinearGradient(0, -size * 0.42, 0, size * 0.42); fill.forEach((c, i) => g.addColorStop(i / (fill.length - 1), c)); fill = g; }
  ctx.fillStyle = fill; ctx.fillText(s, 0, 0);
  ctx.restore();
}

/* ---------- input ---------- */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  KeyJ: 'atk', KeyZ: 'atk', KeyK: 'jump', KeyX: 'jump', Space: 'jump', KeyL: 'spc', KeyC: 'spc', Enter: 'start', KeyP: 'start', Escape: 'start'
};
const Input = {
  ACT: ['left', 'right', 'up', 'down', 'atk', 'jump', 'spc', 'start'],
  held: {}, hit: {}, prev: {}, kb: {}, pad: {}, touch: {}, pulse: {}, run: false, isTouch: false,
  init(canvas) {
    addEventListener('keydown', e => {
      Sfx.init();
      if (e.code === 'KeyM') Sfx.toggleMute();
      const a = KEYMAP[e.code]; if (a) { this.kb[a] = true; e.preventDefault(); }
    });
    addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) { this.kb[a] = false; e.preventDefault(); } });
    addEventListener('blur', () => { this.kb = {}; this.touch = {}; });
    // touch
    const tdiv = document.getElementById('touch'), stick = document.getElementById('stick'), nub = document.getElementById('nub');
    let sid = null, ox = 0, oy = 0;
    const bind = (id, act) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sfx.init(); this.touch[act] = true; el.classList.add('on'); el.setPointerCapture(e.pointerId); });
      const up = e => { this.touch[act] = false; el.classList.remove('on'); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    };
    bind('bA', 'atk'); bind('bJ', 'jump'); bind('bS', 'spc'); bind('bP', 'start');
    addEventListener('pointerdown', e => {
      Sfx.init();
      if (e.pointerType === 'mouse') { this.pulse.tap = true; return; }
      if (!this.isTouch) { this.isTouch = true; tdiv.style.display = 'block'; }
      this.pulse.tap = true;
      if (e.clientX < innerWidth * 0.5 && sid === null) {
        sid = e.pointerId; ox = e.clientX; oy = e.clientY;
        stick.style.display = 'block'; stick.style.left = ox + 'px'; stick.style.top = oy + 'px'; nub.style.transform = '';
      }
    });
    addEventListener('pointermove', e => {
      if (e.pointerId !== sid) return;
      let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy), m = 52;
      if (d > m) { dx *= m / d; dy *= m / d; }
      nub.style.transform = `translate(${dx}px,${dy}px)`;
      const t = this.touch; t.left = dx < -16; t.right = dx > 16; t.up = dy < -16; t.down = dy > 16;
      this.run = Math.abs(dx) > 44;
    });
    const end = e => {
      if (e.pointerId !== sid) return; sid = null; stick.style.display = 'none';
      const t = this.touch; t.left = t.right = t.up = t.down = false; this.run = false;
    };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    addEventListener('contextmenu', e => e.preventDefault());
  },
  tick() {
    const p = this.pad = {};
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of gps) {
      if (!g) continue; const b = i => g.buttons[i] && g.buttons[i].pressed;
      if (g.axes[0] < -0.4 || b(14)) p.left = true; if (g.axes[0] > 0.4 || b(15)) p.right = true;
      if (g.axes[1] < -0.4 || b(12)) p.up = true; if (g.axes[1] > 0.4 || b(13)) p.down = true;
      if (b(2) || b(3)) p.atk = true; if (b(0)) p.jump = true; if (b(1) || b(5) || b(7)) p.spc = true; if (b(9)) p.start = true;
    }
    for (const a of this.ACT) {
      const h = !!(this.kb[a] || p[a] || this.touch[a]);
      this.hit[a] = (h && !this.prev[a]) || !!this.pulse[a];
      this.prev[a] = h; this.held[a] = h;
    }
    this.hit.tap = !!this.pulse.tap;
    this.pulse = {};
  },
  any() { return this.hit.atk || this.hit.start || this.hit.jump || this.hit.tap; }
};

/* ---------- audio: everything is synthesised ---------- */
const Sfx = {
  ac: null, out: null, mus: null, nbuf: null, muted: false,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = this.ac = new AC();
      const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
      this.out = ac.createGain(); this.out.gain.value = 0.55; this.out.connect(comp);
      this.mus = ac.createGain(); this.mus.gain.value = 0.5; this.mus.connect(this.out);
      const nb = this.nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (Music.cfg) Music.start(Music.cfg);
    } catch (e) { this.ac = null; }
  },
  toggleMute() { this.muted = !this.muted; if (this.out) this.out.gain.value = this.muted ? 0 : 0.55; },
  tone(type, f0, f1, dur, vol, delay, dest) {
    const ac = this.ac; if (!ac) return; const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.out); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, f0, f1, q, delay, type, dest) {
    const ac = this.ac; if (!ac) return; const t = ac.currentTime + (delay || 0);
    const s = ac.createBufferSource(); s.buffer = this.nbuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(n) {
    if (!this.ac) return;
    switch (n) {
      case 'whoosh': this.noise(0.13, 0.22, 500, 2600, 1.2); break;
      case 'whooshBig': this.noise(0.28, 0.35, 300, 3200, 0.8); break;
      case 'hit': this.noise(0.09, 0.6, 1800, 500, 0.7); this.tone('sine', 190, 60, 0.12, 0.6); break;
      case 'hit2': this.noise(0.11, 0.65, 2400, 400, 0.7); this.tone('triangle', 240, 55, 0.15, 0.6); break;
      case 'heavy': this.noise(0.3, 0.9, 1400, 90, 0.5, 0, 'lowpass'); this.tone('sine', 150, 32, 0.4, 0.95); this.tone('square', 90, 40, 0.18, 0.3); break;
      case 'boom': this.noise(0.8, 1, 900, 40, 0.4, 0, 'lowpass'); this.tone('sine', 110, 24, 0.9, 1); break;
      case 'jump': this.tone('square', 260, 620, 0.12, 0.13); break;
      case 'land': this.noise(0.08, 0.3, 300, 100, 0.6, 0, 'lowpass'); break;
      case 'dash': this.noise(0.2, 0.25, 1200, 300, 1.5); break;
      case 'break': this.noise(0.3, 0.6, 3000, 300, 0.4); this.tone('square', 300, 80, 0.15, 0.2); break;
      case 'pickup': [660, 880, 1320].forEach((f, i) => this.tone('square', f, f, 0.09, 0.14, i * 0.06)); break;
      case 'fanfare': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => { this.tone('square', f, f, i === 6 ? 0.5 : 0.11, 0.16, i * 0.1); this.tone('triangle', f / 2, f / 2, i === 6 ? 0.5 : 0.11, 0.2, i * 0.1); }); break;
      case 'select': this.tone('square', 520, 520, 0.05, 0.14); break;
      case 'ok': this.tone('square', 520, 1040, 0.16, 0.18); this.tone('sawtooth', 260, 780, 0.2, 0.12); break;
      case 'super': this.tone('sawtooth', 110, 1400, 0.7, 0.35); this.noise(0.7, 0.4, 200, 6000, 0.6); this.tone('square', 55, 220, 0.7, 0.3); break;
      case 'cutin': this.noise(0.25, 0.5, 4000, 600, 2); this.tone('sawtooth', 1200, 300, 0.25, 0.25); break;
      case 'ko': this.tone('sawtooth', 500, 60, 0.9, 0.4); this.noise(0.9, 0.5, 2000, 80, 0.5, 0, 'lowpass'); break;
      case 'star': this.tone('sine', 1800, 2600, 0.25, 0.18); this.tone('sine', 2700, 3900, 0.3, 0.1, 0.05); break;
      case 'warn': this.tone('square', 440, 440, 0.18, 0.2); this.tone('square', 330, 330, 0.18, 0.2, 0.22); break;
      case 'hurt': this.tone('sawtooth', 320, 110, 0.18, 0.3); this.noise(0.1, 0.4, 1000, 300, 0.8); break;
      case 'tele': this.tone('sine', 2200, 300, 0.12, 0.2); this.noise(0.1, 0.25, 5000, 1500, 3); break;
      case 'throw': this.noise(0.18, 0.25, 700, 1500, 2); break;
    }
  }
};

const Music = {
  timer: null, step: 0, next: 0, cfg: null,
  start(cfg) {
    this.stop(); this.cfg = cfg; if (!Sfx.ac || !cfg) return;
    this.step = 0; this.next = Sfx.ac.currentTime + 0.08;
    this.timer = setInterval(() => this.sched(), 40);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; },
  sched() {
    const ac = Sfx.ac; if (!ac) return;
    if (this.next < ac.currentTime - 0.3) this.next = ac.currentTime + 0.05; // tab was asleep
    while (this.next < ac.currentTime + 0.15) { this.playStep(this.step++, this.next - ac.currentTime); this.next += 60 / this.cfg.bpm / 4; }
  },
  playStep(s, dly) {
    const c = this.cfg, i = s & 15, bar = (s >> 4) % c.chords.length, root = c.root + c.chords[bar], m = Sfx.mus;
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    const sd = 60 / c.bpm / 4;
    if (i % 2 === 0) { const n = root - 24 + (i % 4 === 2 ? 12 : 0); Sfx.tone('sawtooth', hz(n), hz(n), sd * 1.7, 0.2, dly, m); }
    const l = c.lead[s % c.lead.length];
    if (l !== null && (s >> 6) % 4 !== 0) { const f = hz(c.root + l + 12); Sfx.tone('square', f, f, sd * 1.9, 0.07, dly, m); Sfx.tone('square', f * 1.005, f * 1.005, sd * 1.9, 0.04, dly + sd, m); }
    const a = c.arp[i % c.arp.length]; if (a !== null && (s >> 5) % 2 === 1) { const f = hz(root + a); Sfx.tone('triangle', f, f, sd * 0.9, 0.09, dly, m); }
    if (i % 4 === 0) Sfx.tone('sine', 150, 40, 0.13, 0.55, dly, m);
    if (i === 4 || i === 12) Sfx.noise(0.12, 0.3, 1800, 900, 0.6, dly, 'bandpass', m);
    if (i % 2 === 0 || (c.busy && i % 4 === 3)) Sfx.noise(0.03, i % 4 === 2 ? 0.14 : 0.07, 8000, 7000, 2, dly, 'highpass', m);
  }
};
const TUNES = {
  title: { bpm: 126, root: 57, chords: [0, -4, 3, -2], arp: [0, 7, 12, 7, 15, 12, 7, 12], lead: [12, null, null, 7, null, null, 10, null, 12, null, null, 15, null, 14, null, 10] },
  s1: { bpm: 148, root: 57, chords: [0, 0, -4, -2], arp: [0, 7, 12, 7], lead: [12, null, 7, null, 3, null, 7, 12, 15, null, 12, null, 7, null, 3, null, 10, null, 7, null, 3, null, 7, 10, 14, null, 12, null, 10, null, 7, null] },
  s2: { bpm: 138, root: 62, chords: [0, 3, -2, -4], arp: [0, 5, 7, 12, 7, 5], lead: [0, null, 3, 5, null, 7, null, 10, 7, null, 5, 3, null, 5, null, null, 12, null, 10, 7, null, 5, null, 7, 3, null, 5, 0, null, null, null, null] },
  s3: { bpm: 164, root: 52, chords: [0, -2, -4, -5], arp: [0, 12, 7, 12], busy: 1, lead: [12, 12, null, 15, null, 12, null, 19, null, 17, null, 15, 14, null, 12, null, 10, 10, null, 12, null, 15, null, 14, null, 10, null, 7, 10, null, 12, null] },
  boss: { bpm: 172, root: 50, chords: [0, 0, 1, -2], arp: [0, 12, 0, 13, 0, 12, 7, 6], busy: 1, lead: [12, null, 13, null, 12, null, 7, null, 18, null, 19, null, 12, null, null, null, 15, null, 13, null, 12, null, 10, null, 12, 13, 12, 10, 7, null, null, null] }
};
