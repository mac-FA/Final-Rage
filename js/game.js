'use strict';
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const Q = new URLSearchParams(location.search);
let SCALE = 1;
function resize() {
  const ww = innerWidth, wh = innerHeight, s = Math.min(ww / W, wh / H), dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px';
  canvas.width = Math.floor(W * s * dpr); canvas.height = Math.floor(H * s * dpr); SCALE = canvas.width / W;
}
addEventListener('resize', resize); resize();

/* a posable display dummy for menus */
class Mannequin {
  constructor(def, k) {
    this.def = def; this.st = Object.assign({}, def.style, { scale: def.style.scale * k });
    this.chains = this.st.chains.map(c => new Chain(Object.assign({}, c, { seg: c.seg * k, w0: c.w0 * k, w1: c.w1 * k }))); this.cur = null;
  }
  draw(c, x, gy, anim, f, face, sil, alpha) {
    const a = ANIMS[anim] || (ANIMS[anim] = { k: [[anim, 0]] }), tmp = poseAt(a.k, f, a.loop, {});
    if (!this.cur) this.cur = tmp; else { mixPose(this.cur, tmp, 0.22, this.cur); this.cur.face = tmp.face; }
    const J = solve(this.st, this.cur, x, gy, face);
    if (alpha) c.globalAlpha = alpha;
    if (!sil) for (let i = 0; i < this.chains.length; i++) { const ch = this.chains[i], an = chainAnchor(J, ch.s); ch.update(an[0], an[1], face, gy, G.t + i * 7); ch.draw(c); }
    drawFighter(c, this.st, J, sil); c.globalAlpha = 1; return J;
  }
}
const para = (c, x, y, w, h, sk) => { c.beginPath(); c.moveTo(x + sk, y); c.lineTo(x + w + sk, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); };

const G = {
  state: 'title', t: 0, st: 0, camX: 0, ents: [], props: [], picks: [], projs: [], player: null, heroI: 0,
  hitstop: 0, shake: 0, invert: 0, flash: 0, zoom: 1, zoomT: 1, zfx: W / 2, zfy: H / 2, slow: 0, cutin: null, superA: 0,
  score: 0, lives: 2, combo: 0, comboT: 0, comboPop: 0, bestCombo: 0, kills: 0, stageI: 0, waveI: 0, wave: null, waveT: 0, queue: [], goT: 0, maxAtk: 2, diff: 1,
  paused: false, auto: false, ban: null, card: null, lastHit: null, lastHitT: 0, tap: null, built: {}, hi: 0,
  enemies() { return this.ents.filter(e => e.alive); },
  addCombo() { this.combo++; this.comboT = 140; this.comboPop = 1; if (this.combo > this.bestCombo) this.bestCombo = this.combo; },
  punch(cx, cy) { this.zoom = 1.1; this.zfx = clamp(cx - this.camX, 200, W - 200); this.zfy = clamp(cy, 150, H - 100); },
  banner(s, col, dur, sub) { this.ban = { s, col: col || '#fff', t: 0, dur: dur || 120, sub }; },
  startCutin(pl) { this.cutin = { t: 0, pl }; Sfx.play('cutin'); Sfx.play('super'); },
  setState(s) { this.state = s; this.st = 0; },

  /* ---------- stage flow ---------- */
  newGame() { this.score = 0; this.lives = 2; this.kills = 0; this.bestCombo = 0; this.player = new Player(HEROES[this.heroI], 0, 100); if (Q.get('rage')) this.player.rage = 100; this.startStage(+Q.get('stage') || 0); },
  startStage(i) {
    this.stageI = i; const sd = STAGE_DATA[i];
    if (!this.built[i]) { Scenery[i].build(); this.built[i] = 1; }
    this.ents = []; this.picks = []; this.projs = []; FX.clear(); this.camX = 0; this.waveI = 0; this.wave = null; this.queue = []; this.goT = 0;
    this.props = sd.props.map(p => new Prop(p[0], p[1], p[2], p[3]));
    const p = this.player; p.x = -40; p.z = 100; p.y = 0; p.vx = p.vy = p.vz = 0; p.hp = p.maxhp; p.dhp = p.hp; p.state = 'walk'; p.move = null; p.anim = null; p.setAnim('walk', 0); p.facing = 1; p.inv = 0; p.sup = null; p.ghosts = []; p.trail = [];
    this.maxAtk = 2 + (i > 0 ? 1 : 0); this.combo = 0; this.hitstop = 0; this.slow = 0; this.zoomT = 1; this.card = null; this.ban = null;
    this.auto = true; this.setState('intro'); Music.start(TUNES[sd.tune]);
  },
  spawn(type, side, z) {
    const e = new Enemy(type, 0, z);
    if (side === 0) { e.x = this.camX + rand(180, W - 180); e.y = 520; e.vy = -3; e.state = 'jump'; e.entered = true; e.anim = null; e.setAnim('fall', 0); }
    else e.x = side > 0 ? this.camX + W + 70 : this.camX - 70;
    e.facing = e.x > this.player.x ? -1 : 1;
    this.ents.push(e);
    if (e.def.boss) { this.card = { t: 0, def: e.def }; this.boss = e; Music.start(TUNES.boss); Sfx.play('warn'); }
    return e;
  },
  bossDown(b) {
    this.slow = 130; this.invert = 6; this.flash = 1; Music.stop(); Sfx.play('ko'); this.banner('K.O.!!', '#ffd31a', 150); this.queue = []; this.zoom = 1.25;
    for (const e of this.ents) if (e !== b && e.alive) { e.hp = 0; e.move = null; e.anim = null; e.state = 'launched'; e.star = true; e.vx = rand(-6, 6); e.vy = rand(14, 18); e.setAnim('launched', 2); }
    this.projs = [];
  },
  playerGone(p) {
    if (this.lives > 0) {
      this.lives--; p.hp = p.maxhp; p.dhp = p.hp; p.state = 'getup'; p.anim = null; p.setAnim('getup', 0); p.timer = 18; p.inv = 170; p.rage = Math.max(p.rage, 50);
      FX.add({ k: 'ring', x: p.x, y: p.gy, size: 320, life: 26, w: 12, col: p.def.col }); this.shake = 16; Sfx.play('super');
      for (const e of this.enemies()) if (Math.abs(e.x - p.x) < 300) e.takeHit(p, { dmg: 4, kx: 5, ky: 8, stop: 0, both: 1, pierce: 1, y: [30, 80] });
    } else { this.setState('over'); Music.stop(); }
  },

  /* ---------- simulation ---------- */
  step() {
    Input.tick(); this.t++; this.st++;
    if (this.shake > 0) this.shake *= 0.86; if (this.shake < 0.4) this.shake = 0;
    if (this.invert > 0) this.invert--; if (this.flash > 0) this.flash -= 0.08;
    this.zoom += (this.zoomT - this.zoom) * 0.14;
    if (this.comboPop > 0) this.comboPop -= 0.1;
    switch (this.state) {
      case 'title': if (this.st > 20 && Input.any()) { Sfx.play('ok'); this.setState('select'); } break;
      case 'select': {
        let ch = 0; if (Input.hit.left) ch = -1; if (Input.hit.right) ch = 1;
        let go = Input.hit.atk || Input.hit.start || Input.hit.jump;
        if (this.tap) { const i = clamp((this.tap.x / (W / 3)) | 0, 0, 2); if (i === this.heroI) go = this.st > 15; else { this.heroI = i; Sfx.play('select'); } }
        if (ch) { this.heroI = (this.heroI + ch + 3) % 3; Sfx.play('select'); }
        if (go && this.st > 15) { Sfx.play('ok'); Sfx.play('super'); this.flash = 1; this.newGame(); }
        break;
      }
      case 'intro': this.world(); { const p = this.player; p.vx = 2.6; p.state = 'walk'; p.setAnim('walk', 4); if (this.st > 150 || (this.st > 40 && Input.any())) { this.auto = false; p.state = 'idle'; this.setState('play'); } } break;
      case 'play':
        if (Input.hit.start) { this.paused = !this.paused; Sfx.play('select'); }
        if (!this.paused) this.world();
        break;
      case 'clear': {
        this.world();
        const p = this.player; if (p.y <= 0 && p.state !== 'win' && p.state !== 'super' && p.state !== 'attack') { p.state = 'win'; p.move = null; p.anim = null; p.setAnim(p.def.win, 8); }
        if (this.st > 330 || (this.st > 120 && Input.any())) { if (this.stageI + 1 < STAGE_DATA.length) this.startStage(this.stageI + 1); else { this.setState('ending'); Music.start(TUNES.title); this.saveHi(); } }
        break;
      }
      case 'over':
        if (this.st % 3 === 0) this.world();
        if (this.st > 40 && Input.any()) { this.score = (this.score / 2) | 0; this.lives = 2; this.player.hp = this.player.maxhp; this.startStage(this.stageI); }
        else if (this.st > 600) { this.saveHi(); this.setState('title'); Music.start(TUNES.title); }
        break;
      case 'ending': if (this.st > 90 && Input.any()) { this.setState('title'); } break;
    }
    this.tap = null;
  },
  saveHi() { if (this.score > this.hi) { this.hi = this.score; try { localStorage.setItem('finalrage-hi', this.hi); } catch (e) { } } },
  world() {
    if (this.cutin) { if (++this.cutin.t >= 62) this.cutin = null; FX.update(); return; }
    if (this.hitstop > 0) { this.hitstop--; FX.update(); return; }
    if (this.slow > 0) { this.slow--; if (this.t % 3) return; }
    const p = this.player, sd = STAGE_DATA[this.stageI];
    p.update();
    for (const e of this.ents) e.update();
    this.ents = this.ents.filter(e => !e.remove); this.props = this.props.filter(e => !e.remove);
    updateProjs(); updatePickups(); FX.update();
    if (p.rage >= 100 && this.t % 2 === 0) FX.add({ k: 'flame', x: p.x + rand(-20, 20), y: p.gy - p.y - rand(0, 20), vy: -rand(2, 4.5), size: rand(6, 11), col: pick([p.def.col, p.def.col2, '#fff']), life: 16, al: 0.6 });
    if (Q.get('god')) { p.hp = p.maxhp; }
    // waves
    if (this.state === 'play') {
      if (!this.wave && this.waveI < sd.waves.length && this.camX >= sd.waves[this.waveI].at - 1) { this.wave = sd.waves[this.waveI]; this.waveT = 0; this.queue = this.wave.s.slice(); this.goT = 0; }
      if (this.wave) {
        this.waveT++;
        this.queue = this.queue.filter(q => { if (q[3] <= this.waveT) { this.spawn(q[0], q[1], q[2]); return false; } return true; });
        const bossDead = this.wave.boss && this.waveT > 10 && !this.ents.some(e => e.def.boss);
        if (bossDead) this.queue = [];
        if (!this.queue.length && !this.ents.length) {
          this.wave = null; this.waveI++;
          if (this.waveI >= sd.waves.length) { this.setState('clear'); this.auto = true; this.banner('STAGE CLEAR!', '#7dff6b', 220, pick(['FUN LEVELS RISING', 'THAT WAS LEGALLY DISTINCT VIOLENCE', 'JUSTICE: SERVED HOT'])); Sfx.play('ok'); Sfx.play('pickup'); }
          else { this.goT = 240; Sfx.play('ok'); }
        } else if (!this.ents.length && this.queue.length) this.waveT += 3; // nobody left: hurry the stragglers
      }
    }
    // camera
    const max = this.wave ? this.wave.at : (this.waveI < sd.waves.length ? sd.waves[this.waveI].at : sd.len - W);
    const want = clamp(p.x - W * 0.4 + p.facing * 30, this.camX, Math.max(this.camX, max));
    this.camX += (want - this.camX) * 0.09; if (this.wave && Math.abs(this.camX - this.wave.at) < 1) this.camX = this.wave.at;
    if (this.comboT > 0 && --this.comboT === 0) this.combo = 0;
    if (this.lastHitT > 0) this.lastHitT--; if (this.goT > 0) this.goT--;
    if (this.ban && ++this.ban.t > this.ban.dur) this.ban = null;
    if (this.card && ++this.card.t > 170) this.card = null;
    const sup = p.state === 'super' ? 1 : 0; this.superA += (sup - this.superA) * 0.2;
  },

  /* ---------- render ---------- */
  render() {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (Q.get('poses')) return this.poseSheet();
    switch (this.state) {
      case 'title': this.drawTitle(); break;
      case 'select': this.drawSelect(); break;
      case 'ending': this.drawEnding(); break;
      default: this.drawWorld(); this.drawHUD();
    }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${clamp(this.flash, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
    if (Sfx.muted) txt(ctx, 'MUTED [M]', W - 10, H - 10, 11, '#fff8', { align: 'right', skew: 0, ol: 2 });
  },
  drawWorld() {
    const sc = Scenery[this.stageI], cam = this.camX, t = this.t, p = this.player;
    const z = Math.max(this.zoom, 1 + this.shake * 0.003), sh = this.shake;
    ctx.save();
    if (z !== 1) { ctx.translate(this.zfx, this.zfy); ctx.scale(z, z); ctx.translate(-this.zfx, -this.zfy); }
    if (sh) ctx.translate(rand(-sh, sh) * 0.7, rand(-sh, sh) * 0.7);
    sc.draw(ctx, cam, t);
    const sa = this.cutin ? 1 : this.superA;
    if (sa > 0.02) { ctx.fillStyle = `rgba(8,2,22,${sa * 0.78})`; ctx.fillRect(-60, -60, W + 120, H + 120); streakField(ctx, t, sa * 0.75, [p.def.col, p.def.col2, '#ffffff'], 46); }
    ctx.save(); ctx.translate(-cam, 0);
    const list = this.props.concat(this.ents, [p]).sort((a, b) => a.z - b.z);
    for (const e of list) e.drawShadow(ctx);
    for (const pk of this.picks) drawPickup(ctx, pk);
    let pi = 0; const pr = this.projs.slice().sort((a, b) => a.z - b.z);
    for (const e of list) { while (pi < pr.length && pr[pi].z <= e.z) drawProj(ctx, pr[pi++]); e.draw(ctx); }
    while (pi < pr.length) drawProj(ctx, pr[pi++]);
    ctx.restore();
    FX.draw(ctx, cam, false);
    sc.front(ctx, cam, t);
    FX.draw(ctx, cam, true);
    ctx.restore();
    // impact panel: freeze + focus lines
    if (this.hitstop > 5 && !this.cutin) speedLines(ctx, this.zfx, this.zfy, t, 0.55, '#fff', 150);
    else if (p.state === 'run' || (p.move && p.move.keep && p.mf < p.move.keep)) streakField(ctx, t, 0.16, ['#fff'], 60);
    if (this.invert > 0) { ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    // vignette
    if (!this.vig) { this.vig = ctx.createRadialGradient(W / 2, H / 2, 260, W / 2, H / 2, 620); this.vig.addColorStop(0, 'rgba(0,0,0,0)'); this.vig.addColorStop(1, 'rgba(4,0,14,0.38)'); }
    ctx.fillStyle = this.vig; ctx.fillRect(0, 0, W, H);
    if (this.cutin) this.drawCutin();
  },
  drawCutin() {
    const c = this.cutin, t = c.t, d = c.pl.def, a = EASE.o(Math.min(1, t / 7)) * (t > 54 ? Math.max(0, 1 - (t - 54) / 7) : 1), hh = 118 * a;
    ctx.fillStyle = `rgba(0,0,0,${0.5 * a})`; ctx.fillRect(0, 0, W, H);
    const cy = H / 2 - 10, sl = 46;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, cy - hh + sl); ctx.lineTo(W, cy - hh - sl); ctx.lineTo(W, cy + hh - sl); ctx.lineTo(0, cy + hh + sl); ctx.closePath();
    ctx.save(); ctx.clip();
    const g = ctx.createLinearGradient(0, cy - 150, 0, cy + 150); g.addColorStop(0, d.col2); g.addColorStop(0.5, shade('#ffffff', 0.12)); g.addColorStop(1, d.col2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    streakField(ctx, t * 2, 0.9, [d.col, '#fff', d.col2], 70);
    const hx = lerp(-260, 190, EASE.o(Math.min(1, t / 10))) + t * 0.9, hy = cy - 6;
    const st = d.style;
    // shoulders + giant fist toward the camera
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(hx - 40, hy + 170, 220, 100, -0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = st.top; ctx.beginPath(); ctx.ellipse(hx - 40, hy + 174, 212, 94, -0.1, 0, TAU); ctx.fill();
    drawHead(ctx, st, [hx, hy], 88, -0.12, 1, 'yell');
    const fx = hx + 210 + Math.sin(t * 0.9) * 3, fy = hy + 64;
    disc(ctx, [fx, fy], 74, st.glove, INK, 6); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(fx - 50 + i * 34, fy - 60); ctx.quadraticCurveTo(fx - 40 + i * 34, fy - 20, fx - 54 + i * 34, fy + 10); } ctx.stroke();
    ctx.fillStyle = '#fff9'; ctx.beginPath(); ctx.ellipse(fx - 30, fy - 46, 30, 14, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
    if (t > 8 && t < 26) { ctx.save(); ctx.translate(-0, 0); const o = { k: 0 }; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff'; const r = 70 * Math.sin((t - 8) / 18 * Math.PI); ctx.translate(hx + 48, hy - 4); ctx.rotate(t * 0.1); ctx.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? r * 0.1 : r, an = j / 8 * TAU; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.fill(); ctx.restore(); }
    const tx = lerp(W + 400, W - 36, EASE.o(clamp((t - 5) / 10, 0, 1))) - t * 0.5;
    ctx.globalAlpha = a;
    txt(ctx, d.superKata, tx, cy - 58, 80, '#fff', { align: 'right', font: JFONT, ol: 12, stroke: INK });
    const gg = ['#fff', d.col];
    txt(ctx, d.superName + '!!', tx + 6, cy + 22, 44, gg, { align: 'right', ol: 9 });
    ctx.globalAlpha = 1;
    if (t < 5) { ctx.fillStyle = `rgba(255,255,255,${1 - t / 5})`; ctx.fillRect(0, 0, W, H); }
  },
  bar(x, y, w, h, frac, ghost, cols, sk) {
    para(ctx, x - 3, y - 3, w + 6, h + 6, sk); ctx.fillStyle = INK; ctx.fill();
    para(ctx, x, y, w, h, sk); ctx.fillStyle = '#3a0c1c'; ctx.fill();
    if (ghost > frac) { para(ctx, x, y, w * clamp(ghost, 0, 1), h, sk); ctx.fillStyle = '#fff'; ctx.fill(); }
    if (frac > 0) { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); para(ctx, x, y, w * clamp(frac, 0, 1), h, sk); ctx.fillStyle = g; ctx.fill(); para(ctx, x, y, w * clamp(frac, 0, 1), h * 0.4, sk * 0.4); ctx.fillStyle = '#ffffff55'; ctx.fill(); }
  },
  drawHUD() {
    const p = this.player, d = p.def, t = this.t;
    // player panel
    para(ctx, 10, 10, 360, 66, 14); ctx.fillStyle = 'rgba(10,4,24,0.72)'; ctx.fill(); ctx.strokeStyle = d.col; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); para(ctx, 16, 14, 58, 58, 12); ctx.fillStyle = d.col2; ctx.fill(); ctx.clip();
    drawHead(ctx, d.style, [48 + (p.flash > 0 ? rand(-3, 3) : 0), 46], 21, -0.08, 1, p.hp <= 0 || p.state === 'hurt' || p.state === 'launched' ? 'hurt' : p.state === 'attack' || p.state === 'super' ? 'yell' : p.state === 'win' ? 'grin' : 'calm');
    ctx.restore();
    txt(ctx, d.name, 92, 23, 15, '#fff', { align: 'left', ol: 4 });
    txt(ctx, '×' + this.lives, 366, 23, 15, d.col, { align: 'right', ol: 4 });
    this.bar(90, 34, 262, 15, p.hp / p.maxhp, p.dhp / p.maxhp, p.hp / p.maxhp < 0.3 && (t >> 2) & 1 ? ['#ff5a3a', '#ff2a2a'] : ['#ffd31a', '#7dff6b'], 6);
    const full = p.rage >= 100;
    this.bar(86, 56, 190, 9, p.rage / 100, 0, full ? ((t >> 2) & 1 ? ['#fff', '#ffd31a'] : ['#ff2a6d', '#ffd31a']) : ['#05d9e8', '#b967ff'], 4);
    txt(ctx, full ? 'RAGE MAX!' : 'RAGE', 286, 61, full ? 13 : 10, full ? ((t >> 2) & 1 ? '#fff' : '#ff2a6d') : '#9fd', { align: 'left', ol: 3 });
    if (full && this.state === 'play') txt(ctx, Input.isTouch ? 'TAP  RAGE !!' : 'PRESS [ L ] — UNLEASH!!', 20, 96 + Math.sin(t * 0.3) * 2, 15, (t >> 2) & 1 ? '#ffd31a' : '#fff', { align: 'left', ol: 4 });
    // score
    txt(ctx, 'SCORE', W / 2, 16, 11, '#9fd', { ol: 3 }); txt(ctx, String(this.score).padStart(7, '0'), W / 2, 36, 24, '#fff', { ol: 5 });
    // enemy bar
    const e = this.lastHit;
    if (e && this.lastHitT > 0 && !e.def.boss) {
      ctx.globalAlpha = Math.min(1, this.lastHitT / 20);
      txt(ctx, e.def.name, W - 20, 22, 14, '#ffb0b0', { align: 'right', ol: 4 });
      this.bar(W - 222, 34, 200, 10, e.hp / e.maxhp, e.dhp / e.maxhp, ['#ff2a6d', '#ff8a3a'], -5); ctx.globalAlpha = 1;
    }
    const b = this.ents.find(x => x.def.boss);
    if (b && !this.card) {
      txt(ctx, b.def.name, 180, H - 44, 20, b.enraged ? '#ff5a5a' : '#ffd31a', { align: 'left', ol: 5 });
      this.bar(180, H - 32, 600, 14, b.hp / b.maxhp, b.dhp / b.maxhp, b.enraged ? ['#ff2a2a', '#ff8a3a'] : ['#b967ff', '#ff2a6d'], 8);
    }
    // combo
    if (this.combo > 1) {
      const pop = 1 + Math.max(0, this.comboPop) * 0.5, x = W - 30, y = 120;
      let rk = null; for (const r of RANKS) if (this.combo >= r[0]) rk = r;
      const g = ['#fff', rk ? rk[2] : '#ffd31a'];
      txt(ctx, String(this.combo), x - 70, y, 62, g, { align: 'right', sc: pop, ol: 9, rot: -0.05 });
      txt(ctx, 'HITS!', x, y + 10, 24, '#fff', { align: 'right', ol: 5, rot: -0.05 });
      if (rk) txt(ctx, rk[1], x, y + 44, 22, rk[2], { align: 'right', ol: 5, rot: -0.05, sc: 1 + Math.max(0, this.comboPop) * 0.2 });
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 120, y + 60, 120 * this.comboT / 140, 3);
    }
    // GO!
    if (this.state === 'play' && !this.wave && this.waveI < STAGE_DATA[this.stageI].waves.length && (t >> 3) & 1 && this.st > 30) {
      const x = W - 110 + Math.sin(t * 0.3) * 8;
      txt(ctx, 'GO!', x, 230, 44, '#ffd31a', { ol: 8 });
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x + 40, 205); ctx.lineTo(x + 92, 232); ctx.lineTo(x + 40, 259); ctx.fill();
      ctx.fillStyle = '#ffd31a'; ctx.beginPath(); ctx.moveTo(x + 46, 214); ctx.lineTo(x + 82, 232); ctx.lineTo(x + 46, 250); ctx.fill();
    }
    if (this.ban) {
      const bn = this.ban, a = Math.min(1, bn.t / 8, (bn.dur - bn.t) / 10), sx = (1 - EASE.o(Math.min(1, bn.t / 10))) * 500;
      ctx.globalAlpha = a; para(ctx, -20, 196, W + 40, 92, 30); ctx.fillStyle = 'rgba(10,4,24,0.7)'; ctx.fill();
      txt(ctx, bn.s, W / 2 - sx, 236, 74, bn.col, { ol: 12, sc: 1 + Math.max(0, 1 - bn.t / 8) });
      if (bn.sub) txt(ctx, bn.sub, W / 2 + sx, 300, 18, '#fff', { ol: 4 });
      ctx.globalAlpha = 1;
    }
    if (this.card) this.drawBossCard();
    if (this.state === 'intro') this.drawStageCard();
    if (this.state === 'clear' && this.st > 80) {
      const y = 352; txt(ctx, `KOs  ${this.kills}     BEST COMBO  ${this.bestCombo}     SCORE  ${this.score}`, W / 2, y, 20, '#fff', { ol: 5 });
    }
    if (this.state === 'over') {
      ctx.fillStyle = 'rgba(10,0,10,0.7)'; ctx.fillRect(0, 0, W, H);
      txt(ctx, 'GAME OVER', W / 2, 200, 96, '#ff2a2a', { ol: 14 });
      txt(ctx, 'FUN REMAINS $4.99', W / 2, 270, 22, '#fff', { ol: 5 });
      const n = Math.max(0, 9 - ((this.st / 62) | 0));
      txt(ctx, 'CONTINUE?  ' + n, W / 2, 340, 40, '#ffd31a', { ol: 7, sc: 1 + ((this.st % 62) < 8 ? 0.15 : 0) });
      txt(ctx, Input.isTouch ? 'TAP TO GET BACK UP' : 'PRESS ENTER TO GET BACK UP', W / 2, 390, 16, '#fff', { ol: 4 });
    }
    if (this.paused) {
      ctx.fillStyle = 'rgba(10,0,20,0.72)'; ctx.fillRect(0, 0, W, H); txt(ctx, 'PAUSED', W / 2, 200, 80, '#fff', { ol: 12 });
      this.controls(300);
    }
  },
  controls(y) {
    const L = Input.isTouch ? ['LEFT STICK  move  (push far to DASH)', 'HIT  combo / dash attack / air attack', 'JUMP  jump          RAGE  spin special — or SUPER when meter is full']
      : ['ARROWS / WASD  move        double-tap ← →  DASH', 'J / Z  attack (mash for combo)        K / X / SPACE  jump', 'L / C  spin special (costs HP) — or SUPER when RAGE is full', 'ENTER  pause        M  mute        gamepads welcome'];
    L.forEach((s, i) => txt(ctx, s, W / 2, y + i * 26, 16, '#fff', { ol: 4, skew: 0 }));
  },
  drawStageCard() {
    const t = this.st, sd = STAGE_DATA[this.stageI], a = Math.min(1, t / 10, (150 - t) / 12), sx = (1 - EASE.o(Math.min(1, t / 14))) * 700;
    if (a <= 0) return; ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8,2,20,0.55)'; ctx.fillRect(0, 0, W, H);
    para(ctx, -30 - sx, 170, W + 60, 70, 40); ctx.fillStyle = '#ff2a6d'; ctx.fill();
    para(ctx, -30 + sx, 246, W + 60, 44, 26); ctx.fillStyle = '#05d9e8'; ctx.fill();
    txt(ctx, 'STAGE ' + (this.stageI + 1), 150 - sx, 204, 34, INK, { ol: 0 });
    txt(ctx, sd.name, W / 2 + 60 - sx, 206, 56, '#fff', { ol: 10 });
    txt(ctx, sd.sub, W / 2 + sx, 268, 20, INK, { ol: 0 });
    ctx.globalAlpha = 1;
  },
  drawBossCard() {
    const c = this.card, t = c.t, a = Math.min(1, t / 8, (170 - t) / 12), d = c.def; if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 50 * a); ctx.fillRect(0, H - 50 * a, W, 50 * a);
    for (let k = 0; k < 2; k++) {
      const y = k ? H - 40 : 10; ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, 30); ctx.clip();
      for (let i = -2; i < 30; i++) { ctx.fillStyle = i % 2 ? '#ffd31a' : INK; para(ctx, i * 40 + ((t * (k ? -2 : 2)) % 80), y, 40, 30, 20); ctx.fill(); }
      ctx.restore(); txt(ctx, 'WARNING!!   WARNING!!   WARNING!!', W / 2, y + 16, 18, '#ff2a2a', { ol: 5 });
    }
    const sx = (1 - EASE.o(Math.min(1, t / 12))) * 600;
    para(ctx, -70 - sx, 96, 640, 116, 50); ctx.fillStyle = 'rgba(10,4,24,0.8)'; ctx.fill(); ctx.strokeStyle = '#ffd31a'; ctx.lineWidth = 3; ctx.stroke();
    txt(ctx, d.name, 44 - sx, 138, 50, '#ffd31a', { align: 'left', ol: 9 });
    txt(ctx, d.tag, 36 - sx, 188, 18, '#fff', { align: 'left', ol: 4 });
    ctx.globalAlpha = 1;
  },

  /* ---------- menus ---------- */
  menuBg(dark) {
    if (!this.built[0]) { Scenery[0].build(); this.built[0] = 1; }
    Scenery[0].draw(ctx, this.t * 1.4, this.t); Scenery[0].front(ctx, this.t * 1.4, this.t);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(10,2,26,${dark})`); g.addColorStop(1, `rgba(60,6,50,${dark * 0.8})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  dummies() { return this.dm || (this.dm = HEROES.map(h => new Mannequin(h, 1.3))); },
  drawTitle() {
    const t = this.t; this.menuBg(0.72);
    speedLines(ctx, W / 2, 250, t, 0.1, '#ff2a6d', 260);
    const dm = this.dummies(), gy = 528, pos = [[W / 2, 'winR', 1], [W / 2 - 300, 'winH', 1], [W / 2 + 300, 'winB', -1]];
    [1, 2, 0].forEach(i => {
      const [x, an, f] = pos[i], h = HEROES[i];
      ctx.fillStyle = 'rgba(8,4,20,0.5)'; ctx.beginPath(); ctx.ellipse(x, gy, 60, 12, 0, 0, TAU); ctx.fill();
      dm[i].draw(ctx, x - f * 14, gy, an, 0, f, h.col2, 0.5); dm[i].draw(ctx, x - f * 7, gy, an, 0, f, h.col, 0.6); dm[i].draw(ctx, x, gy, an, 0, f);
    });
    const j = (t % 90) < 6 ? rand(-3, 3) : 0;
    txt(ctx, 'FINAL', W / 2 - 170 + j, 96, 76, '#fff', { ol: 14, rot: -0.06 });
    const g = ['#ffe14a', '#ff5a1a', '#c8102e'];
    txt(ctx, 'RAGE', W / 2 + 40 - j, 160, 170, '#000', { ol: 30, rot: -0.06, stroke: '#000' });
    txt(ctx, 'RAGE', W / 2 + 40 - j, 160, 170, g, { ol: 12, rot: -0.06, stroke: '#fff' });
    txt(ctx, '激怒', W / 2 + 330, 96, 40, '#ff2a6d', { font: JFONT, ol: 8, rot: 0.1 });
    txt(ctx, '— TURBO JUSTICE EDITION —', W / 2, 252, 20, '#05d9e8', { ol: 5 });
    if ((t >> 4) & 1) txt(ctx, Input.isTouch ? 'TAP TO START' : 'PRESS ENTER', W / 2, 300, 30, '#ffd31a', { ol: 7 });
    const s = STORY[((t / 260) | 0) % STORY.length], a = Math.min(1, (t % 260) / 20, (260 - t % 260) / 20);
    ctx.globalAlpha = a; txt(ctx, s, W / 2, H - 18, 14, '#fff', { ol: 4, skew: 0 }); ctx.globalAlpha = 1;
    if (this.hi) txt(ctx, 'HI ' + this.hi, W - 14, 16, 14, '#fff', { align: 'right', ol: 4 });
  },
  drawSelect() {
    const t = this.t; this.menuBg(0.86); streakField(ctx, t, 0.12, ['#ff2a6d', '#05d9e8'], 20);
    txt(ctx, 'CHOOSE YOUR MENACE', W / 2, 40, 40, '#fff', { ol: 8 });
    const dm = this.dummies();
    for (let i = 0; i < 3; i++) {
      const h = HEROES[i], sel = i === this.heroI, x = 40 + i * 300, w = 280;
      para(ctx, x, 78, w, 380, 26); ctx.fillStyle = sel ? shade(h.col2, 0.55) : 'rgba(20,10,40,0.8)'; ctx.fill(); ctx.strokeStyle = sel ? h.col : '#ffffff33'; ctx.lineWidth = sel ? 5 : 2; ctx.stroke();
      ctx.save(); ctx.clip(); if (sel) { streakField(ctx, t + i * 50, 0.3, [h.col, '#fff'], 40); speedLines(ctx, x + w / 2 + 12, 250, t, 0.14, '#fff', 120); }
      const cx = x + w / 2 + 10, gy = 372;
      ctx.fillStyle = 'rgba(8,4,20,0.5)'; ctx.beginPath(); ctx.ellipse(cx, gy, 56, 11, 0, 0, TAU); ctx.fill();
      if (sel) { dm[i].draw(ctx, cx - 12, gy, h.win, 0, 1, h.col, 0.5); }
      dm[i].draw(ctx, cx, gy, sel ? h.win : h.idle, t, 1);
      if (!sel) { ctx.fillStyle = 'rgba(14,6,30,0.6)'; ctx.fillRect(x - 10, 70, w + 60, 400); }
      ctx.restore();
      ctx.globalAlpha = sel ? 1 : 0.6;
      txt(ctx, h.name, x + w / 2 + 4, 392, h.name.length > 16 ? 19 : 26, sel ? h.col : '#fff', { ol: 6 });
      txt(ctx, h.title, x + w / 2 + 2, 414, 11, '#fff', { ol: 3 });
      const lab = ['POW', 'SPD', 'RNG'];
      for (let k = 0; k < 3; k++) { const bx = x + 30 + k * 84; txt(ctx, lab[k], bx, 436, 11, '#9fd', { align: 'left', ol: 3 }); for (let q = 0; q < 5; q++) { ctx.fillStyle = q < h.stats[k] ? h.col : '#ffffff22'; ctx.fillRect(bx + 28 + q * 9, 431, 7, 10); } }
      ctx.globalAlpha = 1;
    }
    const h = HEROES[this.heroI];
    txt(ctx, h.quote, W / 2, 484, 20, '#fff', { ol: 5 });
    txt(ctx, 'SUPER:  ' + h.superName + '  ' + h.superKata, W / 2, 512, 16, h.col, { ol: 4, font: JFONT });
    if ((t >> 4) & 1) { txt(ctx, '◀', 22, 260, 30, '#fff', { skew: 0, ol: 5 }); txt(ctx, '▶', W - 22, 260, 30, '#fff', { skew: 0, ol: 5 }); }
  },
  drawEnding() {
    const t = this.st; this.menuBg(0.8); speedLines(ctx, W / 2, 200, this.t, 0.12, '#ffd31a', 240);
    const dm = this.dummies(); dm[this.heroI].draw(ctx, W / 2, 510, HEROES[this.heroI].win, 0, 1);
    txt(ctx, 'FUN IS FREE AGAIN!', W / 2, 90, 80, '#ffd31a', { ol: 14, sc: 1 + Math.max(0, 1 - t / 14) });
    const L = ['Chairman Goldfist was launched into low orbit, where laughing is still technically legal.', 'The trademark on "FUN" expired the moment he left the atmosphere.', `FINAL SCORE  ${this.score}      KOs  ${this.kills}      BEST COMBO  ${this.bestCombo}`, 'No pigeons were harmed. El Palomo is a man in a mask. Probably.'];
    L.forEach((s, i) => { if (t > 40 + i * 50) txt(ctx, s, W / 2, 160 + i * 30, i === 2 ? 22 : 16, i === 2 ? '#7dff6b' : '#fff', { ol: 4, skew: i === 2 ? -0.22 : 0 }); });
    if (t > 240 && (this.t >> 4) & 1) txt(ctx, 'THANK YOU FOR PUNCHING', W / 2, 300, 26, '#ff4fa3', { ol: 6 });
  },
  poseSheet() {
    ctx.fillStyle = '#334'; ctx.fillRect(0, 0, W, H);
    const names = Object.keys(POSES), h = HEROES[+Q.get('hero') || 0], page = +Q.get('page') || 0, per = 24;
    names.slice(page * per, page * per + per).forEach((n, i) => {
      const x = 60 + (i % 8) * 116, gy = 150 + ((i / 8) | 0) * 175, p = POSES[n];
      ctx.strokeStyle = '#fff3'; ctx.beginPath(); ctx.moveTo(x - 50, gy); ctx.lineTo(x + 50, gy); ctx.stroke();
      drawFighter(ctx, h.style, solve(h.style, p, x, gy - (p.air ? 30 : 0), 1), null);
      txt(ctx, n, x, gy + 14, 12, '#fff', { skew: 0, ol: 3 });
    });
  }
};
try { G.hi = +localStorage.getItem('finalrage-hi') || 0; } catch (e) { }
window.G = G;
Input.init(canvas);
addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); G.tap = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; });
Music.cfg = TUNES.title;
if (Q.get('hero')) G.heroI = +Q.get('hero') % 3;
if (Q.get('play')) G.newGame();

let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  let n = 0; while (acc >= 16.6 && n < 4) { G.step(); acc -= 16.667; n++; }
  if (n === 4) acc = 0;
  G.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
