'use strict';
for (const k in MOVES) { MOVES[k].len = keysLen(MOVES[k].k); MOVES[k].name = k; }
const und = (v, d) => v === undefined ? d : v;

class Fighter {
  constructor(def, x, z, team) {
    this.def = def; this.st = def.style; this.x = x; this.z = z; this.y = 0; this.vx = 0; this.vz = 0; this.vy = 0;
    this.facing = 1; this.team = team; this.hp = this.maxhp = def.hp; this.dhp = def.hp;
    this.state = 'idle'; this.idleName = def.idle || 'idle'; this.runName = def.run || 'run';
    this.anim = this.idleName; this.af = 0; this.pose = mixPose(POSES.idle, POSES.idle, 1, {}); this.from = mixPose(POSES.idle, POSES.idle, 1, {}); this._tmp = {};
    this.blend = 0; this.blendN = 1; this.move = null; this.mf = 0; this.hitSet = new Set(); this.hitTag = -1;
    this.stun = 0; this.inv = 0; this.flash = 0; this.timer = 0; this.t = (Math.random() * 100) | 0; this.trail = []; this.ghosts = [];
    this.chains = this.st.chains.map(c => new Chain(c));
    this.sq = 0; this.sqV = 0; this.smear = null; this.grabCd = 0; this.sayCd = rand(200, 900);
    this.remove = false; this.spinA = 0; this.spinV = 0; this.juggle = 0; this.hurtAlt = 0; this.entered = false;
    this.refresh();
  }
  get scale() { return this.st.scale; }
  get gy() { return FLOOR + this.z; }
  get alive() { return this.hp > 0 && !this.remove; }
  onScreen(m) { const sx = this.x - G.camX; return sx > -(m || 0) && sx < W + (m || 0); }
  setAnim(name, blend) {
    if (!ANIMS[name]) ANIMS[name] = { k: [[name, 0]] };
    if (this.anim === name && !this.move) return;
    mixPose(this.pose, this.pose, 1, this.from); this.blendN = this.blend = und(blend, 5);
    this.anim = name; this.af = 0; this.move = null;
  }
  startMove(name) {
    const m = MOVES[name];
    mixPose(this.pose, this.pose, 1, this.from); this.blendN = this.blend = 2;
    this.move = m; this.mf = 0; this.state = 'attack'; this.hitSet.clear(); this.hitTag = -1; this.vz = 0;
    if (m.lunge && m.lunge[0] === 0) this.vx = this.facing * m.lunge[1];
    if (m.hop && m.hop[0] === 0) { this.vy = m.hop[1]; this.y = Math.max(this.y, 0.01); }
    if (m.dive) { this.vx = this.facing * m.dive[0]; this.vy = Math.min(this.vy, m.dive[1]); }
    if (this.isPlayer) Sfx.play(m.spin ? 'whooshBig' : 'whoosh');
  }
  endMove() {
    this.move = null; this.anim = null;
    if (this.y > 0) { this.state = 'jump'; this.setAnim('fall', 5); } else { this.state = 'idle'; this.setAnim(this.idleName, 5); }
  }
  drawFacing() {
    const m = this.move; if (!m) return this.facing;
    if (m.spin && this.mf >= m.spin[0] && this.mf <= m.spin[1]) return this.facing * ((((this.mf - m.spin[0]) / m.spin[2]) | 0) % 2 ? -1 : 1);
    if (m.flip && this.mf >= m.flip[0] && this.mf < m.flip[1]) return -this.facing;
    return this.facing;
  }
  refresh() {
    const tmp = this._tmp;
    if (this.move) poseAt(this.move.k, this.mf, false, tmp); else { const a = ANIMS[this.anim]; poseAt(a.k, this.af, a.loop, tmp); }
    if (this.blend > 0) { this.blend--; mixPose(this.from, tmp, 1 - this.blend / this.blendN, this.pose); } else mixPose(tmp, tmp, 1, this.pose);
    if (this.spinA) this.pose.rot += this.spinA;
    const p = this.pose, s8 = this.state;
    if (s8 === 'walk' || s8 === 'jump') p.t += clamp(this.vx * this.facing * 1.7, -10, 10); // lean into travel
    if (this.def.quirk && (s8 === 'walk' || s8 === 'idle')) {
      const q = this.def.quirk, t = this.t;
      if (q === 'bob') { const b = Math.sin(t * 0.42); p.hd += b * 11; p.hx += b * 3; }
      else if (q === 'groove') { const b = Math.sin(t * 0.27); p.t += b * 4; p.hd -= b * 9; p.af0 += b * 16; p.ab0 -= b * 16; p.af1 += b * 10; }
      else if (q === 'twitch') { if (t % 53 < 4) { p.hd += 14; p.af0 += 10; } }
    }
    this.sqV += -this.sq * 0.34; this.sqV *= 0.7; this.sq += this.sqV; // squash & stretch spring
    this.J = solve(this.st, p, this.x, this.gy - this.y, this.drawFacing(), Math.abs(this.sq) > 0.004 ? this.sq : 0);
    if (p.face === 'calm' && this.t % 170 < 6) this.J.expr = 'blink';
  }
  addGhost(life, col) { this.ghosts.push({ J: this.J, life: life || 12, max: life || 12, col: col || this.def.col || '#fff' }); }
  /* ---------- per-frame ---------- */
  update() {
    this.t++; this.af++;
    if (this.inv > 0) this.inv--; if (this.flash > 0) this.flash--;
    if (this.armorT > 0 && --this.armorT === 0) this.armorC = 0;
    if (this.dhp > this.hp) this.dhp = Math.max(this.hp, this.dhp - 0.5); else this.dhp = this.hp;
    let phys = true;
    switch (this.state) {
      case 'idle': case 'walk': case 'run': this.control(); break;
      case 'jump': this.control(); if (this.state === 'jump') this.setAnim(this.vy > 1.5 ? 'jumpUp' : 'fall', 5); break;
      case 'land': this.vx *= 0.7; this.vz = 0; if (--this.timer <= 0) { this.state = 'idle'; this.setAnim(this.idleName, 5); } break;
      case 'attack': this.tickMove(); break;
      case 'hurt': this.vx *= 0.82; this.vz = 0; if (--this.stun <= 0) { this.state = 'idle'; this.setAnim(this.idleName, 6); } break;
      case 'grab': this.grabTick(); break;
      case 'held': this.vx = this.vz = 0; phys = false; if (!this.holder || this.holder.held !== this || this.holder.state !== 'grab') { this.holder = null; this.state = this.y > 0 ? 'jump' : 'idle'; this.spinA = 0; this.anim = null; this.setAnim(this.idleName, 5); } break;
      case 'block': this.vx *= 0.8; this.vz = 0; if (--this.timer <= 0) this.state = 'idle'; break;
      case 'launched':
        if (this.star) {
          this.x += this.vx; this.y += this.vy; this.spinA -= 31; phys = false; if (this.t % 2 === 0) this.addGhost(8, '#fff');
          if (this.gy - this.y < -90) { this.remove = true; FX.add({ k: 'star', x: clamp(this.x, G.camX + 30, G.camX + W - 30), y: 34, size: 46, life: 34, front: 1 }); Sfx.play('star'); }
          break;
        }
        this.spinA += this.spinV;
        if (this.thrown) for (const o of G.ents) { // a thrown body is a bowling ball
          if (o === this || !o.alive || this.thrownHit.has(o) || o.state === 'launched' || o.state === 'down' || o.state === 'getup' || o.state === 'held') continue;
          if (Math.abs(o.x - this.x) < 46 && Math.abs(o.z - this.z) < 28 && o.y < 60) { this.thrownHit.add(o); if (o.takeHit(this.thrown, { dmg: 9, kx: 4.5, ky: 7, stop: 6, both: 1, y: [40, 90] })) { this.vx *= 0.75; FX.add({ k: 'text', s: 'STRIKE!', x: o.x, y: o.gy - 150, vy: -0.6, size: 20, life: 30, rot0: -0.1, col: '#7dff6b', front: 1 }); } }
        }
        if (Math.abs(this.vx) > 6 && this.t % 3 === 0) this.addGhost(8, '#fff');
        { const sx = this.x - G.camX;
          if (this.entered && ((sx > W - 14 && this.vx > 1.5) || (sx < 14 && this.vx < -1.5))) {
            this.vx *= -0.55; hitSpark(this.x, this.gy - this.y - 50, false, '#fff'); G.shake = Math.max(G.shake, 9); Sfx.play('hit2'); this.spinV *= -1;
            FX.add({ k: 'text', s: 'ガン!', x: this.x - Math.sign(sx - W / 2) * 30, y: this.gy - this.y - 80, size: 30, life: 26, rot0: rand(-0.3, 0.3), font: JFONT, front: 1 });
          } }
        break;
      case 'down':
        this.vx *= 0.8; this.vz = 0;
        if (--this.timer <= 0) {
          if (this.hp <= 0) { this.onGone(); }
          else { this.state = 'getup'; this.anim = null; this.setAnim('getup', 0); this.timer = 18; this.inv = this.isPlayer ? 100 : 12; this.juggle = 0; }
        }
        break;
      case 'getup': if (--this.timer <= 0) { this.state = 'idle'; this.setAnim(this.idleName, 4); } break;
      case 'super': phys = this.superTick(); break;
      case 'win': this.vx = this.vz = 0; break;
    }
    if (phys) this.physics();
    const sx = this.x - G.camX;
    if (this.isPlayer) { if (this.state !== 'super' || phys) this.x = clamp(this.x, G.camX + 26, G.camX + W - 26); }
    else if (!this.entered) { if (sx > 30 && sx < W - 30) this.entered = true; }
    else if (!this.star) this.x = clamp(this.x, G.camX - 30, G.camX + W + 30);
    this.z = clamp(this.z, ZMIN, ZMAX);
    this.refresh(); this.smear = null; if (this.grabCd > 0) this.grabCd--;
    // strike trail: sample the hitting limb twice per frame for a smooth arc
    const m = this.move;
    if (m && m.trail && m.hits.length && this.mf >= m.hits[0].f[0] - 3 && this.mf <= Math.min(m.hits[0].f[1], m.hits[0].f[0] + 40)) {
      const j = this.J[m.trail], z = m.trail[0] === 'h' ? (m.trail === 'hF' ? this.J.fz : this.J.bz) : this.J.kz;
      const pv = this.trail[this.trail.length - 1];
      if (pv && !pv.brk && pv.life >= 6 && Math.hypot(pv.x - j[0], pv.y - j[1]) > 22 * this.scale) this.smear = { a: [pv.x, pv.y], b: [j[0], j[1]], w: 6.5 * this.scale * z, col: m.trail[0] === 'h' ? this.st.glove : this.st.shoe };
      this.trail.push({ x: j[0], y: j[1], life: 7, w: 11 * this.scale * z });
    } else if (this.trail.length && this.trail[this.trail.length - 1].life > 0 && !m) this.trail.push({ x: 0, y: 0, life: 0, brk: 1 });
    for (let i = this.trail.length - 1; i >= 0; i--) if (--this.trail[i].life < -1) this.trail.splice(i, 1);
    for (let i = this.ghosts.length - 1; i >= 0; i--) if (--this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
  }
  physics() {
    this.x += this.vx; this.z += this.vz;
    if (this.y > 0 || this.vy > 0) {
      this.y += this.vy; const v = this.vy; this.vy -= GRAV;
      if (this.y <= 0) { this.y = 0; this.vy = 0; this.onLand(v); }
    }
  }
  onLand(v) {
    if (this.state === 'launched') {
      dustPuff(this.x, this.gy, 6, 3);
      this.sqV = -0.1;
      if (!this.bounced && v < -5) { this.bounced = true; this.vy = -v * 0.42; this.y = 0.01; this.vx *= 0.7; G.shake = Math.max(G.shake, 5); Sfx.play('land'); return; }
      this.thrown = null; this.state = 'down'; this.spinA = 0; this.spinV = 0; this.anim = null; this.setAnim('lie', 2); this.timer = this.hp <= 0 ? 44 : (this.isPlayer ? 26 : 40); Sfx.play('land');
      return;
    }
    if (this.state === 'super') return;
    const m = this.move;
    if (m && !m.air) return; // hop inside a grounded move: keep going
    if (m && m.ev && m.ev.land) this.event(m.ev.land);
    this.sqV = -0.1;
    if (this.dropIn) { this.dropIn = false; this.event('quake'); G.shake = 24; FX.add({ k: 'ring', x: this.x, y: this.gy, size: 260, life: 24, w: 12 }); dustPuff(this.x, this.gy, 16, 7); }
    this.move = null; this.anim = null; this.state = 'land'; this.setAnim('land', 2); this.timer = m ? 9 : 6; this.vx *= 0.4;
    dustPuff(this.x, this.gy, 4, 2.5); Sfx.play('land');
  }
  tickMove() {
    const m = this.move; this.mf++;
    if (m.lunge && this.mf === m.lunge[0]) { this.vx = this.facing * m.lunge[1]; if (!this.isPlayer) Sfx.play('whoosh'); }
    if (m.hop && this.mf === m.hop[0]) { this.vy = m.hop[1]; this.y = Math.max(this.y, 0.01); }
    if (m.ev && m.ev[this.mf]) this.event(m.ev[this.mf]);
    if (!this.move) return;
    if (m.ctrl && this.isPlayer) { const I = Input.held; this.vx = ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * m.ctrl; this.vz = ((I.down ? 1 : 0) - (I.up ? 1 : 0)) * m.ctrl * 0.6; }
    else if (m.chase && this.mf >= m.spin[0] && this.mf < m.spin[1]) { const p = G.player, dx = p.x - this.x, dz = p.z - this.z, d = Math.hypot(dx, dz) || 1; this.vx = dx / d * m.chase; this.vz = dz / d * m.chase * 0.7; }
    else if (!(m.keep && this.mf < m.keep) && this.y <= 0) { this.vx *= 0.8; this.vz = 0; }
    if (m.spin && this.mf >= m.spin[0] && this.mf <= m.spin[1] && (this.mf - m.spin[0]) % (m.spin[2] * 2) === 0) { Sfx.play('whoosh'); if (this.y <= 0) dustPuff(this.x, this.gy, 2, 4); }
    if ((m.keep && this.mf < m.keep || m.spin) && this.mf % 3 === 0) this.addGhost(9);
    this.checkHits();
    if (this.isPlayer) this.attackInput();
    if (this.move === m && !m.air && this.mf >= m.len) this.endMove();
    else if (this.move === m && m.air && this.mf >= m.len) this.endMove();
  }
  checkHits() {
    const m = this.move, s = this.scale;
    for (let i = 0; i < m.hits.length; i++) {
      const h = m.hits[i]; if (this.mf < h.f[0] || this.mf > h.f[1]) continue;
      const tag = i * 1000 + (h.multi ? ((this.mf - h.f[0]) / h.multi) | 0 : 0);
      if (tag !== this.hitTag) { this.hitTag = tag; this.hitSet.clear(); }
      const targets = this.team === 0 ? G.ents.concat(G.props) : [G.player];
      for (const t of targets) {
        if (!t || t === this || t.team === this.team || this.hitSet.has(t) || t.remove) continue;
        if (Math.abs(t.z - this.z) > (h.zr || 24) + (t.zr || 0)) continue;
        const rel = (t.x - this.x) * this.facing, tw = t.halfW || 16 * t.scale;
        if (rel + tw < h.x[0] * s || rel - tw > h.x[1] * s) continue;
        const th = t.hitH ? t.hitH() : [0, 100];
        if (this.y + h.y[1] * s < th[0] || this.y + h.y[0] * s > th[1]) continue;
        if (t.takeHit(this, h)) this.hitSet.add(t);
      }
    }
  }
  hitH() { return this.state === 'launched' ? [this.y - 10, this.y + 70 * this.scale] : [this.y, this.y + 116 * this.scale]; }
  takeHit(att, h) {
    if (this.inv > 0 || this.remove || this.state === 'held' || this.state === 'down' || this.state === 'getup' || this.state === 'super' || this.state === 'win' || this.star) return false;
    if (this.move && this.move.inv && !h.pierce) return false;
    const dir = h.both ? (Math.sign(this.x - att.x) || att.facing) : att.facing;
    const cx = this.x - dir * 8, cy = this.gy - this.y - clamp((h.y[0] + h.y[1]) / 2 * att.st.scale + att.y - this.y, 24, 110 * this.scale);
    if (this.state === 'block' && !h.heavy && !h.pierce) { // the mime's invisible wall. it is very real.
      FX.add({ k: 'ring', x: cx - dir * 20, y: cy, size: 46, flat: 1, life: 10, w: 4, front: 1 }); FX.add({ k: 'text', s: 'カキン!', x: cx - dir * 26, y: cy - 30, size: 22, life: 22, rot0: 0, col: '#bff', font: JFONT, front: 1 });
      Sfx.play('select'); G.hitstop = Math.max(G.hitstop, 4); att.vx = -dir * 4; return true;
    }
    if (this.held) { this.held = null; this.gMode = null; }
    this.sqV = -0.07;
    const dmg = h.dmg * att.def.pow * (this.isPlayer ? G.diff : 1);
    this.hp -= dmg; this.flash = 5;
    const dead = this.hp <= 0;
    hitSpark(cx, cy, h.heavy, att.def.col);
    if (h.heavy || Math.random() < 0.3) hitText(cx, cy, h.heavy);
    Sfx.play(h.heavy ? 'heavy' : (Math.random() < 0.5 ? 'hit' : 'hit2'));
    G.hitstop = Math.max(G.hitstop, und(h.stop, 3)); G.shake = Math.max(G.shake, h.heavy ? 16 : 4);
    if (h.heavy) { G.punch(cx, cy); G.flash = Math.max(G.flash, 0.2); }
    for (let i = 0; i < 3; i++) FX.add({ k: 'streak', x: this.x, y: this.gy - this.y - 108 * this.scale, vx: dir * rand(2, 7), vy: rand(-6, -1), g: 0.4, size: 2.4, col: '#e8f6ff', life: 14, len: 1.5 });
    if (this.def.feathers) for (let i = 0; i < 5; i++) FX.add({ k: 'feather', x: cx, y: cy, vx: rand(-3, 3), vy: rand(-3, 0.5), g: 0.03, drag: 0.95, size: rand(4, 7), col: pick(['#fff', '#c8d0e0', '#9aa3b8']), life: 60, ph: rand(6) });
    if (att.isPlayer) { G.addCombo(); if (att.state !== 'super') att.rage = Math.min(100, att.rage + dmg * 0.85 + 0.6); G.score += Math.round(dmg) * 10; G.lastHit = this; G.lastHitT = 150; }
    if (this.isPlayer) { this.rage = Math.min(100, this.rage + dmg * 0.6); G.combo = 0; Sfx.play('hurt'); }
    if (!dead && this.def.armor && !h.heavy && !h.pierce && !h.ky && this.y <= 0 && this.state !== 'hurt') {
      this.armorC = (this.armorC || 0) + 1; this.armorT = 100; this.x += dir * 2;
      if (this.armorC < this.def.armor) return true;
      this.armorC = 0; FX.add({ k: 'text', s: 'GUARD CRUSH!', x: cx, y: cy - 60, size: 20, life: 30, rot0: 0, col: '#8ef', front: 1 });
    }
    this.move = null; this.anim = null; this.facing = -dir || this.facing;
    if (dead || h.ky || this.y > 0) {
      const hm = this.def.heavy ? 0.78 : 1, jm = Math.max(0.55, 1 - this.juggle * 0.1); this.juggle++;
      this.state = 'launched'; this.bounced = false;
      this.vx = dir * und(h.kx, 2) * (dead ? 1.35 : 1) * hm; this.vy = (h.ky || (this.y > 0 ? 6 : 5)) * hm * jm; this.y = Math.max(this.y, 0.01);
      this.spinV = h.heavy ? -16 : 0; this.spinA = 0; this.setAnim('launched', 2);
      if (dead) this.onDeath(att, h, dir);
    } else {
      this.state = 'hurt'; this.stun = und(h.stun, 18); this.vx = dir * und(h.kx, 1.5);
      this.setAnim((this.hurtAlt ^= 1) ? 'hurtA' : 'hurtB', 2);
    }
    return true;
  }
  onDeath() { } onGone() { this.remove = true; } control() { } attackInput() { } superTick() { return true; } grabTick() { this.state = 'idle'; }
  event(name) {
    const f = this.facing, gx = this.x + f * 70 * this.scale;
    switch (name) {
      case 'quake': case 'quakeS': {
        const big = name === 'quake';
        FX.add({ k: 'ring', x: gx, y: this.gy, size: big ? 120 : 60, life: 16, w: big ? 8 : 4 }); dustPuff(gx, this.gy, big ? 12 : 5, big ? 5 : 3);
        if (big) { G.shake = Math.max(G.shake, 12); debris(gx, this.gy, ['#555', '#888', '#333'], 8); Sfx.play('heavy'); }
        break;
      }
      case 'shock':
        G.shake = Math.max(G.shake, 16); Sfx.play('boom'); dustPuff(gx, this.gy, 12, 5); FX.add({ k: 'ring', x: gx, y: this.gy, size: 150, life: 18, w: 9, col: this.def.notes ? '#05d9e8' : '#ffd31a' });
        for (const d of [-1, 1]) G.projs.push({ k: 'shock', x: gx, z: this.z, y: 0, vx: d * (this.enraged ? 8 : 6), life: 80, owner: this, t: 0, col: this.def.notes ? ['#05d9e8', '#ff2a6d'] : ['#ffd31a', '#fff'] });
        break;
      case 'dumpling': {
        const p = G.player, n = this.enraged ? 3 : 1; Sfx.play('throw');
        for (let i = 0; i < n; i++) { const tx = p.x + (i - (n - 1) / 2) * 110 + p.vx * 20, T = 52; G.projs.push({ k: 'dumpling', x: this.x + f * 60, z: this.z, y: 150, vx: (tx - this.x - f * 60) / T, vz: (p.z - this.z) / T, vy: 0.35 * T / 2 - 150 / T, owner: this, t: 0 }); }
        break;
      }
      case 'goldfist':
        Sfx.play('whooshBig'); G.projs.push({ k: 'gfist', x: this.x + f * 70, z: this.z, y: 78 * this.scale, vx: f * (this.enraged ? 12 : 9), life: 110, owner: this, t: 0 });
        break;
      case 'tele': {
        const p = G.player; this.addGhost(30, '#ffe14a'); const ox = this.x, oy = this.gy - 70;
        this.x = clamp(p.x - p.facing * 80, G.camX + 40, G.camX + W - 40); this.z = p.z; this.facing = p.x > this.x ? 1 : -1; Sfx.play('tele');
        FX.add({ k: 'slash', x: ox, y: oy, x2: this.x, y2: this.gy - 70, size: 16, col: '#ffd31a', life: 18 });
        break;
      }
      case 'roar': {
        G.shake = 20; Sfx.play('super'); FX.add({ k: 'ring', x: this.x, y: this.gy - 60 * this.scale, size: 260, flat: 1, life: 26, w: 12, col: '#fff', front: 1 });
        FX.add({ k: 'text', s: this.def.notes ? 'DROP THE BASS!!' : this.st.prop ? 'ORDER UP!!' : 'HOSTILE TAKEOVER!!', x: this.x, y: this.gy - 190 * this.scale, vy: -0.3, size: 30, life: 70, rot0: -0.06, col: '#ff5a5a', front: 1 });
        const p = G.player; if (p && Math.abs(p.x - this.x) < 150 && Math.abs(p.z - this.z) < 60 && p.state !== 'super') { p.vx = Math.sign(p.x - this.x) * 9; }
        break;
      }
      case 'dive': { const p = G.player; this.facing = p.x > this.x ? 1 : -1; this.vx = this.facing * clamp(Math.abs(p.x - this.x) / 18, 4, 9); this.vz = clamp((p.z - this.z) / 18, -2, 2); this.vy = -4; Sfx.play('whoosh'); break; }
    }
  }
  /* ---------- render ---------- */
  drawShadow(ctx) {
    const r = 27 * this.scale * clamp(1 - this.y / 500, 0.3, 1);
    ctx.fillStyle = 'rgba(8,4,20,0.42)'; ctx.beginPath(); ctx.ellipse(this.x, this.gy, r, r * 0.3, 0, 0, TAU); ctx.fill();
  }
  draw(ctx) {
    if (this.hp <= 0 && this.state === 'down' && this.timer < 28 && (this.timer >> 1) & 1) return;
    const J = this.J;
    for (const g of this.ghosts) { ctx.globalAlpha = g.life / g.max * 0.5; drawFighter(ctx, this.st, g.J, g.col); }
    ctx.globalAlpha = 1;
    if (this.inv > 0 && this.state !== 'super' && (G.t >> 1) & 1 && this.isPlayer) ctx.globalAlpha = 0.45;
    let jx = 0;
    if (G.hitstop > 0 && this.flash > 0) { jx = ((G.t & 1) ? 4 : -4); ctx.save(); ctx.translate(jx, 0); }
    if (G.rim && this.flash <= 2) { ctx.save(); ctx.translate(-2.6, -2.2); drawFighter(ctx, this.st, J, G.rim); ctx.restore(); } // back-light
    if (this.smear) { const sm = this.smear; ctx.globalAlpha = 0.9; limb(ctx, [sm.a, sm.b], [sm.w * 0.3, sm.w], [sm.col], INK, 2); ctx.fillStyle = '#fff'; capsule(ctx, sm.a, sm.b, sm.w * 0.1, sm.w * 0.5); ctx.globalAlpha = 1; }
    for (let i = 0; i < this.chains.length; i++) {
      const c = this.chains[i], a = chainAnchor(J, c.s);
      if (!G.paused) c.update(a[0], a[1], J.face, this.gy, G.t + i * 7);
      c.draw(ctx, this.flash > 2 ? '#fff' : null);
    }
    drawFighter(ctx, this.st, J, this.flash > 2 ? '#fff' : null, { attacking: this.state === 'attack' });
    if (jx) ctx.restore();
    ctx.globalAlpha = 1;
    // strike trail
    const tr = this.trail;
    if (tr.length > 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 1; i < tr.length; i++) {
        const a = tr[i - 1], b = tr[i]; if (a.brk || b.brk || a.life <= 0) continue;
        const u = b.life / 7; ctx.globalAlpha = u * 0.8;
        ctx.strokeStyle = this.def.col || '#fff'; ctx.lineWidth = b.w * 2 * u; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = b.w * u; ctx.stroke();
      }
      ctx.restore();
    }
  }
}

/* =============================== PLAYER =============================== */
class Player extends Fighter {
  constructor(def, x, z) { super(def, x, z, 0); this.isPlayer = true; this.rage = 0; this.comboI = 0; this.buf = 0; this.tapDir = 0; this.tapT = -99; this.running = false; this.airUsed = false; this.sup = null; }
  control() {
    const I = Input, grounded = this.y <= 0 && this.state !== 'jump';
    const mx = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0), mz = (I.held.down ? 1 : 0) - (I.held.up ? 1 : 0);
    if (I.hit.left || I.hit.right) { const d = I.hit.right ? 1 : -1; if (this.tapDir === d && this.t - this.tapT < 16) { this.running = true; Sfx.play('dash'); dustPuff(this.x, this.gy, 5, 3); } this.tapDir = d; this.tapT = this.t; }
    if (I.run && mx) this.running = true; if (!mx) this.running = false;
    if (G.auto) return;
    if (I.hit.spc && (this.rage >= 100 || grounded)) return this.special();
    if (grounded) {
      this.airUsed = false;
      if (I.hit.atk) { if (mx) this.facing = mx; if (this.running && mx) this.startMove(this.def.dash); else { this.comboI = 0; this.startMove(this.def.combo[0]); } this.buf = 0; return; }
      if (I.hit.jump) { this.vy = this.def.jump; this.y = 0.01; this.vx = mx * this.def.speed * (this.running ? 1.75 : 1); this.state = 'jump'; this.sqV = 0.09; this.setAnim('jumpUp', 3); Sfx.play('jump'); dustPuff(this.x, this.gy, 4, 2); return; }
      if (mx && !this.running && this.grabCd <= 0 && this.tryGrab(mx)) return;
      const sp = this.def.speed * (this.running ? 1.9 : 1);
      this.vx = mx * sp; this.vz = mz * this.def.speed * 0.68; if (mx) this.facing = mx;
      if (mx || mz) { this.state = this.running ? 'run' : 'walk'; this.setAnim(this.running ? this.runName : 'walk', 4); if (this.running && this.t % 4 === 0) { this.addGhost(10); dustPuff(this.x - this.facing * 10, this.gy, 1, 1); } }
      else { this.state = 'idle'; this.setAnim(this.idleName, 5); }
    } else {
      this.vx = clamp(this.vx + mx * 0.22, -this.def.speed * 1.8, this.def.speed * 1.8); this.vz = mz * this.def.speed * 0.4;
      if (I.hit.atk && !this.airUsed) { this.airUsed = true; if (mx) this.facing = mx; this.startMove(this.def.airAtk); }
    }
  }
  tryGrab(mx) {
    for (const e of G.ents) {
      if (!e.alive || e.def.boss || e.def.heavy || e.y > 0 || !(e.state === 'idle' || e.state === 'walk' || e.state === 'hurt')) continue;
      const rel = (e.x - this.x) * mx;
      if (rel < 12 || rel > 40 * this.scale || Math.abs(e.z - this.z) > 11) continue;
      this.state = 'grab'; this.held = e; this.facing = mx; this.gT = 85; this.gk = 0; this.gA = 0; this.gMode = null; this.vx = this.vz = 0; this.anim = null; this.setAnim('grab', 3);
      e.state = 'held'; e.holder = this; e.move = null; e.anim = null; e.setAnim('hurtB', 3); e.facing = -mx; e.vx = e.vz = 0; e.mode = 'hover';
      Sfx.play('land'); FX.add({ k: 'text', s: 'ガシッ', x: e.x, y: e.gy - 140, size: 22, life: 22, rot0: 0.1, col: '#fff', font: JFONT, front: 1 });
      return true;
    }
    return false;
  }
  grabTick() {
    const e = this.held, I = Input, f = this.facing, s = this.scale;
    if (!e && this.gMode && this.gMode[0] === 't') { this.vx *= 0.8; if (++this.gA >= 24) { this.gMode = null; this.state = 'idle'; this.grabCd = 20; this.anim = null; this.setAnim(this.idleName, 6); } return; }
    if (!e || e.remove || e.state !== 'held') { this.held = null; this.gMode = null; this.state = 'idle'; this.grabCd = 25; this.anim = null; this.setAnim(this.idleName, 5); return; }
    this.vx = this.vz = 0;
    if (!this.gMode) {
      e.x = this.x + f * 34 * s; e.z = this.z + 0.5; e.y = 0;
      const back = f > 0 ? I.held.left : I.held.right;
      if ((I.hit.atk && back) || I.hit.jump) { this.gMode = 'tB'; this.gA = 0; this.anim = null; this.setAnim('liftW', 4); Sfx.play('whoosh'); }
      else if (I.hit.atk) { this.gMode = 'knee'; this.gA = 0; this.anim = null; this.setAnim('gknee', 2); }
      else if (--this.gT <= 0) { this.held = null; e.vx = f * 3; this.vx = -f * 2; }
    } else if (this.gMode === 'knee') {
      this.gA++; e.x = this.x + f * 34 * s;
      if (this.gA === 3) {
        const dmg = 6 * this.def.pow; e.hp -= dmg; e.flash = 5; e.sqV = -0.08; this.gk++;
        hitSpark(e.x - f * 12, e.gy - 62 * e.scale, false, this.def.col); hitText(e.x, e.gy - 80, false); Sfx.play('hit');
        G.hitstop = Math.max(G.hitstop, 5); G.shake = Math.max(G.shake, 5); G.addCombo(); this.rage = Math.min(100, this.rage + dmg); G.score += 60; G.lastHit = e; G.lastHitT = 150;
        e.anim = null; e.setAnim(this.gk % 2 ? 'hurtA' : 'hurtB', 2);
      }
      if (this.gA >= 13) {
        if (this.gk >= 3 || e.hp <= 0) { this.gMode = 'tF'; this.gA = 0; this.anim = null; this.setAnim('palmW', 3); }
        else { this.gMode = null; this.gT = 55; this.anim = null; this.setAnim('grab', 4); }
      }
    } else { // throw: carry the victim through an arc, then let go
      this.gA++; const back = this.gMode === 'tB', n = 9;
      if (this.gA <= n && e.state === 'held') {
        const u = this.gA / n, ang = u * Math.PI * (back ? 0.95 : 0.3);
        e.x = this.x + f * Math.cos(ang) * 36 * s; e.y = Math.sin(ang) * 100 * s; e.spinA = -u * (back ? 150 : 40);
        if (this.gA === n) {
          const dir = back ? -f : f, dmg = 9 * this.def.pow;
          this.held = null; e.holder = null; e.state = 'launched'; e.thrown = this; e.thrownHit = new Set(); e.bounced = false; e.facing = -dir;
          e.vx = dir * 11; e.vy = back ? 4.5 : 7; e.spinV = -19; e.spinA = 0; e.anim = null; e.setAnim('launched', 2);
          e.hp -= dmg; e.flash = 5; G.addCombo(); G.score += 150; this.rage = Math.min(100, this.rage + dmg);
          if (e.hp <= 0) e.onDeath(this, { heavy: 0 }, dir);
          this.facing = dir; this.anim = null; this.setAnim(back ? 'hammer' : 'palm', 2); this.sqV = 0.06;
          Sfx.play('whooshBig'); Sfx.play('throw'); G.shake = Math.max(G.shake, 7);
          FX.add({ k: 'text', s: back ? 'ドリャア!!' : 'ポイッ!', x: this.x, y: this.gy - 170 * s, vy: -0.5, size: back ? 34 : 26, life: 34, rot0: -0.12, font: JFONT, front: 1 });
        }
      }
      if (this.gA >= n + 15) { this.gMode = null; this.state = 'idle'; this.grabCd = 20; this.anim = null; this.setAnim(this.idleName, 6); }
    }
  }
  attackInput() {
    const I = Input, m = this.move; if (!m) return;
    if (I.hit.atk) this.buf = 10; else if (this.buf > 0) this.buf--;
    if (I.hit.spc && this.rage >= 100) return this.special();
    if (m.cancel && this.mf >= m.cancel && this.buf > 0 && this.comboI < this.def.combo.length - 1 && this.y <= 0) {
      const mx = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0); if (mx) this.facing = mx;
      this.comboI++; this.buf = 0; this.startMove(this.def.combo[this.comboI]);
    }
  }
  special() {
    if (this.rage >= 100) {
      this.rage = 0; this.state = 'super'; this.move = null; this.anim = null; this.sup = { type: this.def.sup, t: 0 }; this.vx = this.vz = 0; this.vy = 0; this.y = 0; this.spinA = 0;
      this.setAnim('power', 0); this.refresh(); G.startCutin(this); return;
    }
    if (this.y > 0) return;
    this.hp = Math.max(1, this.hp - 4); this.startMove(this.def.spc);
  }
  endSuper() { this.sup = null; this.inv = 45; this.anim = null; if (this.y > 0) { this.state = 'jump'; this.setAnim('fall', 4); } else { this.state = 'idle'; this.setAnim(this.idleName, 6); } }
  inFront(e, x0, x1, zr) { const rel = (e.x - this.x) * this.facing; return rel > x0 && rel < x1 && Math.abs(e.z - this.z) < zr; }
  superTick() {
    const s = this.sup, t = ++s.t, f = this.facing, sc = this.scale, gy = this.gy;
    if (t % 2 === 0) FX.add({ k: 'flame', x: this.x + rand(-22, 22), y: gy - this.y - rand(0, 30), vy: -rand(2, 5), size: rand(6, 12), col: this.def.col, life: 18 });
    switch (s.type) {
      case 'rush':
        if (t < 58) {
          this.setAnim('rush', 2); this.vx = f * 1.1;
          for (let i = 0; i < 2; i++) FX.add({ k: 'fist', x: this.x + f * rand(50, 160), y: gy - rand(42, 122) * sc, dx: f * rand(30, 60), dy: rand(-8, 8), size: rand(7, 13), col: this.st.glove, life: 4, front: 1 });
          if (t % 4 === 0) this.addGhost(10);
          if (t % 3 === 0) {
            Sfx.play('whoosh');
            for (const e of G.enemies()) if (this.inFront(e, -20, 175, 46)) { if (e.takeHit(this, { dmg: 2.2, kx: 0.2, stun: 44, stop: 1, pierce: 1, y: [rand(40, 60), rand(90, 120)] })) { e.x += (this.x + f * 95 - e.x) * 0.25; e.vy = Math.min(e.vy, 2); } }
          }
        } else if (t < 76) {
          if (t === 58) { this.setAnim('uppW', 4); Sfx.play('super'); G.zoomT = 1.22; G.zfx = this.x - G.camX; G.zfy = gy - 60; }
          this.vx = 0;
          for (const e of G.enemies()) if (this.inFront(e, -20, 190, 50) && e.state === 'hurt') e.stun = 30;
        } else if (t === 76) {
          this.setAnim('upper', 1); this.vy = 9; this.y = 0.01; this.vx = f * 3; G.zoomT = 1;
          for (const e of G.enemies()) if (this.inFront(e, -30, 200, 56)) e.takeHit(this, { dmg: 46, kx: 4.5, ky: 15, stop: 20, heavy: 1, pierce: 1, y: [50, 120] });
          G.invert = 5; G.shake = 30; Sfx.play('boom'); FX.add({ k: 'ring', x: this.x + f * 50, y: gy, size: 240, life: 22, w: 12, col: '#ffd31a' });
          FX.add({ k: 'text', s: 'お届け完了!!', x: this.x + f * 60, y: gy - 230, vy: -0.4, size: 40, life: 60, rot0: -0.1, font: JFONT, front: 1 });
        } else if (t > 104 && this.y <= 0) this.endSuper();
        return true;
      case 'encore':
        if (t === 1) { s.ox = this.x; s.oz = this.z; s.targets = G.enemies().filter(e => e.onScreen(20)); s.i = 0; s.marked = new Set(); }
        if (t < 47) {
          if (t % 5 === 1) {
            const tg = s.targets.length ? s.targets[s.i % s.targets.length] : null, px = this.x, py = gy - this.y - 60, side = s.i % 2 ? 1 : -1;
            this.addGhost(46, '#ff4fa3');
            if (tg && !tg.remove) {
              this.x = tg.x + side * 48; this.z = tg.z; this.y = s.i % 3 === 1 ? 44 : 0; this.facing = -side;
              tg.takeHit(this, { dmg: 3, kx: 0, stun: 150, stop: 0, pierce: 1, y: [50, 100] }); if (tg.hp > 0) s.marked.add(tg);
            } else { this.x = clamp(s.ox + side * rand(80, 300), G.camX + 40, G.camX + W - 40); this.z = rand(ZMIN, ZMAX); this.y = rand(0, 60); this.facing = -side; }
            this.anim = null; this.setAnim(pick(['sidekick', 'hikick', 'divekick', 'axe', 'dropkick']), 0);
            FX.add({ k: 'slash', x: px, y: py, x2: this.x, y2: this.gy - this.y - 60, size: 16, col: '#ff4fa3', life: 26 });
            Sfx.play('tele'); s.i++; G.shake = Math.max(G.shake, 6);
          }
        } else if (t === 47) {
          this.addGhost(40, '#22d3ee'); this.x = s.ox; this.z = s.oz; this.y = 0; this.anim = null; this.setAnim('encore', 0); Sfx.play('cutin');
          FX.add({ k: 'text', s: '♪ thank you, goodnight ♪', x: this.x, y: gy - 170, vy: -0.2, size: 18, life: 34, rot0: 0, col: '#fff', front: 1 });
        } else if (t === 82) {
          for (const e of s.marked) if (e.alive) { e.inv = 0; if (e.state === 'down' || e.state === 'getup') e.state = 'hurt'; e.takeHit(this, { dmg: 44, kx: rand(3, 6), ky: rand(11, 15), stop: 20, heavy: 1, pierce: 1, both: 1, y: [50, 100] }); FX.add({ k: 'burst', x: e.x, y: e.gy - 60, size: 190, col: '#ff4fa3', life: 20, front: 1 }); }
          G.invert = 5; G.shake = 30; Sfx.play('boom');
          FX.add({ k: 'text', s: 'アンコール!!', x: this.x, y: gy - 200, vy: -0.4, size: 44, life: 60, rot0: -0.1, font: JFONT, front: 1 });
        } else if (t > 108) this.endSuper();
        return false;
      case 'meteor':
        if (t < 10) { this.setAnim('uppW', 3); if (t % 3 === 0) dustPuff(this.x, gy, 2, 4); }
        else if (t < 26) {
          if (t === 10) {
            this.setAnim('jumpUp', 2); Sfx.play('whooshBig'); dustPuff(this.x, gy, 14, 6);
            const es = G.enemies().filter(e => e.onScreen(0));
            s.tx = es.length ? es.reduce((a, e) => a + e.x, 0) / es.length : this.x + f * 150; s.tz = es.length ? es.reduce((a, e) => a + e.z, 0) / es.length : this.z;
            s.tx = clamp(s.tx, G.camX + 80, G.camX + W - 80);
          }
          this.y += 46; if (t % 2 === 0) this.addGhost(12);
        } else if (t < 40) {
          if (t === 26) { this.x = s.tx; this.z = s.tz; this.anim = null; this.setAnim('splash', 0); Sfx.play('super'); }
          this.y = Math.max(0, 644 - (t - 25) * 46);
          for (let i = 0; i < 3; i++) FX.add({ k: 'flame', x: this.x + rand(-40, 40), y: this.gy - this.y - rand(20, 90), vy: -rand(4, 9), size: rand(14, 26), col: pick(['#ff9a1a', '#ff3a1a', '#ffd31a']), life: 16, al: 0.9 });
          this.addGhost(8, '#ff5a1a');
        }
        if (t === 40) {
          this.y = 0; this.anim = null; this.setAnim('land', 1);
          for (const e of G.enemies()) if (e.onScreen(60)) { if (e.state === 'down' || e.state === 'getup') e.state = 'hurt'; e.inv = 0; e.takeHit(this, { dmg: 46, kx: rand(3, 6), ky: rand(11, 15), stop: 20, heavy: 1, pierce: 1, both: 1, y: [30, 80] }); }
          for (let i = 0; i < 3; i++) FX.add({ k: 'ring', x: this.x, y: this.gy, size: 200 + i * 170, life: 20 + i * 8, w: 14, col: i ? '#ff9a1a' : '#fff' });
          FX.add({ k: 'burst', x: this.x, y: this.gy - 30, size: 330, col: '#ff7a1a', life: 24, front: 1 });
          debris(this.x, this.gy, ['#555', '#888', '#333', '#ff9a1a'], 26); dustPuff(this.x, this.gy, 26, 9);
          G.invert = 6; G.shake = 38; Sfx.play('boom');
          FX.add({ k: 'text', s: 'ドッカーン!!', x: this.x, y: this.gy - 210, vy: -0.4, size: 52, life: 64, rot0: -0.1, font: JFONT, front: 1 });
        }
        if (t > 74) this.endSuper();
        return false;
    }
    return true;
  }
  onDeath() { G.slow = 50; Sfx.play('ko'); }
  onGone() { G.playerGone(this); }
  drawShadow(ctx) {
    super.drawShadow(ctx);
    const s = this.sup;
    if (s && s.type === 'meteor' && s.t >= 10 && s.t < 40) { const a = (s.t - 10) / 30; ctx.strokeStyle = '#ff3a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(s.tx, FLOOR + s.tz, 150 - a * 90, (150 - a * 90) * 0.3, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = `rgba(255,60,20,${0.15 + a * 0.3})`; ctx.fill(); }
  }
}

/* =============================== ENEMY =============================== */
class Enemy extends Fighter {
  constructor(type, x, z) {
    super(ENEMIES[type], x, z, 1); this.type = type; this.cd = rand(30, 90); this.aiT = 0; this.mode = 'hover'; this.side = 1; this.hOff = 0; this.hDist = 180;
    this.facing = -1;
  }
  control() {
    const p = G.player, d = this.def;
    if (this.state === 'jump') return;
    if (!p || p.hp <= 0 || G.state !== 'play' || G.auto) { this.vx = this.vz = 0; this.state = 'idle'; this.setAnim(this.idleName, 6); return; }
    const dx = p.x - this.x, dz = p.z - this.z, adx = Math.abs(dx), adz = Math.abs(dz);
    this.facing = dx >= 0 ? 1 : -1; this.cd--;
    const sp = d.speed * (this.enraged ? 1.35 : 1);
    if (d.boss) {
      if (!this.introDone && this.entered) { this.introDone = true; this.startMove('roar'); return; }
      if (!this.enraged && this.hp < this.maxhp * 0.5) { this.enraged = true; this.inv = 30; this.startMove('roar'); G.banner('IT GOT ANGRIER', '#ff5a5a', 80); return; }
      if (this.cd <= 0 && this.entered) {
        let mv = null; const r = Math.random();
        if (this.type === 'dj') mv = adx < 140 && adz < 34 ? (r < 0.75 ? 'bossSlam' : 'bossCharge') : adz < 26 ? (r < 0.65 ? 'bossCharge' : 'bossSlam') : (r < 0.25 ? 'bossSlam' : null);
        else if (this.type === 'gyozilla') mv = adx > 210 ? (r < 0.8 ? 'bossThrow' : 'bossSpin') : (r < 0.45 ? 'bossSpin' : r < 0.8 && adz < 34 ? 'bossSlam' : 'bossThrow');
        else mv = r < 0.34 ? 'gfTele' : adx > 170 && adz < 30 ? 'gfFist' : adx < 140 && adz < 34 ? 'bossSlam' : (r < 0.7 ? 'gfTele' : 'gfFist');
        if (mv) { this.startMove(mv); this.cd = rand(d.cd[0], d.cd[1]) * (this.enraged ? 0.6 : 1); return; }
        this.cd = 12;
      }
      this.mode = 'attack';
    } else {
      if (this.aiT-- <= 0) {
        this.aiT = rand(30, 80);
        const n = G.ents.reduce((a, e) => a + (e !== this && e.mode === 'attack' && !e.def.boss ? 1 : 0), 0);
        this.mode = this.cd <= 0 && n < G.maxAtk ? 'attack' : 'hover';
        this.side = Math.random() < 0.75 ? (this.x < p.x ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
        this.hOff = rand(-70, 70); this.hDist = rand(130, 240);
      }
      if (this.cd <= 0 && this.entered) {
        if (d.ai === 'charger' && adx > 170 && adx < 340 && adz < 16) { this.startMove('etackle'); this.cd = rand(120, 200); return; }
        if (d.ai === 'jumper' && adx > 130 && adx < 300 && adz < 50) { this.startMove('edive'); this.cd = rand(110, 190); return; }
      }
      if (d.ai === 'mime' && p.state === 'attack' && adx < 120 && adz < 30 && !this.blockCd && Math.random() < 0.07) {
        this.state = 'block'; this.timer = 40; this.blockCd = 150; this.anim = null; this.setAnim('wall1', 3); this.vx = this.vz = 0; return;
      }
      if (this.blockCd) this.blockCd--;
    }
    let tx, tz;
    if (this.mode === 'attack') { const side = d.boss ? (this.x < p.x ? -1 : 1) : this.side; tx = p.x + side * d.range * 0.92 * this.scale; tz = p.z; }
    else { tx = p.x + this.side * this.hDist; tz = clamp(p.z + this.hOff, ZMIN, ZMAX); }
    if (this.mode === 'attack' && !d.boss && adx < (d.range + 10) * this.scale && adx > 18 && adz < 13 && this.cd <= 0 && p.inv <= 0) {
      this.vx = this.vz = 0; this.startMove(pick(d.attacks)); this.cd = rand(d.cd[0], d.cd[1]); this.mode = 'hover'; this.aiT = 24; return;
    }
    const ex = tx - this.x, ez = tz - this.z, dist = Math.hypot(ex, ez);
    if (dist > 7) { const v = sp * (this.mode === 'hover' && this.entered ? 0.75 : 1); this.vx = ex / dist * v; this.vz = ez / dist * v * 0.7; this.state = 'walk'; this.setAnim('walk', 5); }
    else { this.vx = this.vz = 0; this.state = 'idle'; this.setAnim(this.idleName, 6); }
    if (this.entered && --this.sayCd <= 0) { this.sayCd = rand(500, 1400); if (G.ents.length < 7 || d.boss) FX.add({ k: 'bubble', ent: this, s: pick(LINES[this.type]), x: this.x, y: 0, life: 120, front: 1 }); }
    if (this.enraged && this.t % 3 === 0) FX.add({ k: 'flame', x: this.x + rand(-26, 26), y: this.gy - rand(0, 40), vy: -rand(2, 5), size: rand(8, 14), col: '#ff3a3a', life: 18 });
    if (d.notes && this.t % 22 === 0) FX.add({ k: 'note', s: pick(['♪', '♫']), x: this.x + rand(-30, 30), y: this.gy - 150 * this.scale, vy: -1, vx: rand(-0.5, 0.5), size: 22, col: pick(['#05d9e8', '#ff2a6d']), life: 40 });
  }
  onDeath(att, h, dir) {
    G.score += this.def.score; G.kills++;
    if (this.def.boss) { G.bossDown(this); this.spinV = -12; this.vy = Math.max(this.vy, 11); this.vx = dir * 5; return; }
    if (!G.queue.length && !G.enemies().length) { G.slow = Math.max(G.slow, 44); G.zoom = 1.2; G.zfx = clamp(this.x - G.camX, 200, W - 200); G.zfy = clamp(this.gy - 70, 150, H - 100); G.blur = 8; FX.add({ k: 'text', s: 'FINISH!!', x: this.x, y: this.gy - 190, vy: -0.3, size: 46, life: 70, rot0: -0.08, col: '#ff4fa3', front: 1 }); }
    if (h.heavy && Math.random() < 0.6) { this.star = true; this.vx = dir * rand(4, 8); this.vy = rand(15, 19); FX.add({ k: 'text', s: pick(['BYEEE', 'さよなら〜', 'I REGRET NOTHINNNG', 'TELL MY BOSS I QUIT', 'AAAAaaaa…']), x: this.x, y: this.gy - 150, vy: -1.4, vx: dir * 1.5, size: 16, life: 46, rot0: dir * 0.2, col: '#fff', font: JFONT, front: 1 }); }
  }
  onGone() {
    this.remove = true;
    if (this.def.boss) { for (let i = 0; i < 5; i++) FX.add({ k: 'burst', x: this.x + rand(-60, 60), y: this.gy - rand(0, 80), size: rand(90, 190), col: pick(['#ffd31a', '#ff7a1a', '#fff']), life: 20 + i * 4, front: 1 }); debris(this.x, this.gy, ['#ffd31a', '#fff', '#ff2a6d', '#05d9e8'], 30); Sfx.play('boom'); G.shake = 24; }
    else dustPuff(this.x, this.gy, 6, 3);
  }
}

/* =============================== PROPS / PICKUPS / PROJECTILES =============================== */
class Prop {
  constructor(type, x, z, drop) { this.type = type; this.x = x; this.z = z; this.drop = drop; this.hp = 2; this.team = 2; this.shakeT = 0; this.halfW = 22; this.scale = 1; this.zr = 8; }
  hitH() { return [0, 90]; }
  takeHit(att, h) {
    this.hp -= h.heavy ? 2 : 1; this.shakeT = 8; const cy = FLOOR + this.z - 50;
    hitSpark(this.x - att.facing * 10, cy, false, '#fff'); Sfx.play('hit2'); G.hitstop = Math.max(G.hitstop, 3);
    if (this.hp <= 0) {
      this.remove = true; Sfx.play('break'); G.shake = Math.max(G.shake, 8); G.score += 100;
      debris(this.x, FLOOR + this.z, PROP_COLS[this.type], 16); dustPuff(this.x, FLOOR + this.z, 8, 4);
      if (this.type === 'bust') FX.add({ k: 'text', s: 'MY FACE!!', x: this.x, y: cy - 70, vy: -0.5, size: 18, life: 40, rot0: 0.1, col: '#ffd31a', front: 1 });
      if (this.drop) G.picks.push({ x: this.x, z: this.z, y: 30, vy: 6, kind: this.drop, t: 0 });
    }
    return true;
  }
  draw(ctx) {
    const x = this.x + (this.shakeT > 0 ? ((this.shakeT-- & 1) ? 3 : -3) : 0), y = FLOOR + this.z;
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    const box = (bx, by, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(bx, by, w, h); ctx.strokeRect(bx, by, w, h); };
    switch (this.type) {
      case 'vend':
        box(x - 24, y - 100, 48, 100, '#d92b3a'); box(x - 19, y - 92, 38, 46, '#bff4ff');
        for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#ffd31a', '#7dff6b', '#ff6bd0'][i % 3]; ctx.fillRect(x - 16 + (i % 3) * 12, y - 88 + ((i / 3) | 0) * 20, 8, 14); }
        box(x - 19, y - 24, 38, 14, '#15101f'); txt(ctx, 'SODA?', x, y - 36, 11, '#fff', { skew: 0, ol: 0 });
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(160,240,255,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 44, 9, 0, 0, TAU); ctx.fill(); ctx.restore();
        break;
      case 'trash':
        box(x - 17, y - 46, 34, 46, '#6a7a8a'); ctx.fillStyle = '#4a5866'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 11 + i * 10, y - 40, 3, 36);
        ctx.fillStyle = '#8a9aaa'; ctx.beginPath(); ctx.ellipse(x, y - 47, 20, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); break;
      case 'crate':
        box(x - 24, y - 46, 48, 46, '#b07a3a'); ctx.beginPath(); ctx.moveTo(x - 24, y - 46); ctx.lineTo(x + 24, y); ctx.moveTo(x + 24, y - 46); ctx.lineTo(x - 24, y); ctx.stroke(); txt(ctx, '?', x, y - 23, 20, '#fff2c0', { skew: 0, ol: 4 }); break;
      case 'cart':
        box(x - 30, y - 50, 60, 36, '#a3172b'); box(x - 34, y - 56, 68, 8, '#e8dcc0');
        ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(x - 18, y - 9, 9, 0, TAU); ctx.arc(x + 18, y - 9, 9, 0, TAU); ctx.fill(); ctx.stroke();
        box(x - 12, y - 72, 24, 16, '#8a8a9a'); txt(ctx, '麺', x, y - 32, 18, '#fff', { skew: 0, ol: 0, font: JFONT });
        if (G.t % 9 === 0) FX.add({ k: 'dust', x: this.x + rand(-6, 6), y: y - 76, vy: -1, vx: rand(-0.3, 0.3), size: 6, life: 30, col: '#fff' });
        break;
      case 'vase':
        ctx.fillStyle = '#2b5ad9'; ctx.beginPath(); ctx.moveTo(x - 8, y - 62); ctx.lineTo(x + 8, y - 62); ctx.quadraticCurveTo(x + 4, y - 50, x + 18, y - 34); ctx.quadraticCurveTo(x + 24, y - 10, x + 10, y); ctx.lineTo(x - 10, y); ctx.quadraticCurveTo(x - 24, y - 10, x - 18, y - 34); ctx.quadraticCurveTo(x - 4, y - 50, x - 8, y - 62); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd31a'; ctx.fillRect(x - 16, y - 30, 32, 5); txt(ctx, '$', x, y - 16, 14, '#ffd31a', { skew: 0, ol: 0 }); break;
      case 'bust':
        box(x - 20, y - 36, 40, 36, '#5a4a78'); box(x - 24, y - 42, 48, 8, '#7a6a98');
        ctx.save(); ctx.translate(x, y - 62); const st = ENEMIES.goldfist.style; drawHead(ctx, Object.assign({}, st, { skin: '#e0b030', hair: '#ffe680', d: { skin: '#b8860b' }, l: { skin: '#ffe680', hair: '#fff3c0' } }), [0, 0], 17, 0, -1, 'grin'); ctx.restore(); break;
    }
  }
  drawShadow(ctx) { ctx.fillStyle = 'rgba(8,4,20,0.4)'; ctx.beginPath(); ctx.ellipse(this.x, FLOOR + this.z, 30, 8, 0, 0, TAU); ctx.fill(); }
}
const PROP_COLS = { vend: ['#d92b3a', '#bff4ff', '#ffd31a', '#7dff6b'], trash: ['#6a7a8a', '#8a9aaa', '#4a5866'], crate: ['#b07a3a', '#8a5a2a', '#d09a5a'], cart: ['#a3172b', '#e8dcc0', '#8a8a9a'], vase: ['#2b5ad9', '#ffd31a', '#fff'], bust: ['#e0b030', '#ffe680', '#5a4a78'] };

function drawPickup(ctx, p) {
  const x = p.x, y = FLOOR + p.z - p.y - (p.y <= 0 ? Math.abs(Math.sin(p.t * 0.08)) * 6 : 0);
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,150,${0.18 + 0.1 * Math.sin(p.t * 0.2)})`; ctx.beginPath(); ctx.arc(x, y - 12, 26, 0, TAU); ctx.fill(); ctx.restore();
  if (p.kind === 'ramen') {
    ctx.fillStyle = '#f4e6b0'; ctx.beginPath(); ctx.ellipse(x, y - 16, 19, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d92b3a'; ctx.beginPath(); ctx.moveTo(x - 20, y - 16); ctx.quadraticCurveTo(x - 16, y + 2, x - 8, y); ctx.lineTo(x + 8, y); ctx.quadraticCurveTo(x + 16, y + 2, x + 20, y - 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9ab0'; ctx.beginPath(); ctx.arc(x - 6, y - 17, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a5a2a'; ctx.beginPath(); ctx.moveTo(x + 4, y - 18); ctx.lineTo(x + 20, y - 34); ctx.moveTo(x + 8, y - 18); ctx.lineTo(x + 24, y - 32); ctx.stroke();
  } else if (p.kind === 'cake') {
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 18, y - 22, 36, 22); ctx.strokeRect(x - 18, y - 22, 36, 22); ctx.fillStyle = '#ff6bd0'; ctx.fillRect(x - 18, y - 12, 36, 4);
    ctx.fillStyle = '#d92b3a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - 10 + i * 10, y - 26, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
  } else {
    ctx.fillStyle = '#7ac74f'; ctx.beginPath(); ctx.moveTo(x - 6, y - 26); ctx.lineTo(x + 6, y - 26); ctx.quadraticCurveTo(x + 22, y - 6, x + 12, y); ctx.lineTo(x - 12, y); ctx.quadraticCurveTo(x - 22, y - 6, x - 6, y - 26); ctx.fill(); ctx.stroke();
    txt(ctx, '$', x, y - 10, 16, '#fff', { skew: 0, ol: 3 });
  }
}
function updatePickups() {
  const pl = G.player;
  for (const p of G.picks) {
    p.t++; if (p.y > 0 || p.vy > 0) { p.y += p.vy; p.vy -= 0.5; if (p.y <= 0) { p.y = 0; p.vy = 0; } }
    if (pl && pl.hp > 0 && p.t > 20 && Math.abs(pl.x - p.x) < 32 && Math.abs(pl.z - p.z) < 20 && pl.y < 30) {
      p.dead = true; Sfx.play('pickup');
      let s; if (p.kind === 'ramen') { pl.hp = Math.min(pl.maxhp, pl.hp + 40); s = 'ごちそうさま! +40'; } else if (p.kind === 'cake') { pl.hp = pl.maxhp; s = 'FULL HEAL! (it was a lie-free cake)'; } else { G.score += 1000; s = '+$1000 (TAX FREE)'; }
      FX.add({ k: 'text', s, x: p.x, y: FLOOR + p.z - 70, vy: -0.8, size: 17, life: 50, rot0: 0, col: '#aaffb0', font: JFONT, front: 1 });
      for (let i = 0; i < 8; i++) FX.add({ k: 'star', x: p.x + rand(-20, 20), y: FLOOR + p.z - rand(0, 50), size: rand(8, 16), life: rand(14, 26) | 0, col: '#ffe14a' });
    }
  }
  G.picks = G.picks.filter(p => !p.dead);
}
function updateProjs() {
  const pl = G.player;
  for (const p of G.projs) {
    p.t++; p.x += p.vx; p.z += p.vz || 0;
    const att = { x: p.x - Math.sign(p.vx || 1), facing: Math.sign(p.vx) || 1, def: p.owner.def, st: p.owner.st, y: 0 };
    const near = pl && pl.hp > 0 && !p.spent;
    if (p.k === 'dumpling') {
      p.y += p.vy; p.vy -= 0.35;
      if (p.y <= 0) {
        p.dead = true; Sfx.play('heavy'); G.shake = Math.max(G.shake, 8); const gy = FLOOR + p.z;
        FX.add({ k: 'ring', x: p.x, y: gy, size: 90, life: 16, w: 6 }); for (let i = 0; i < 10; i++) FX.add({ k: 'dust', x: p.x + rand(-20, 20), y: gy - rand(0, 20), vy: -rand(1, 3), vx: rand(-2, 2), size: rand(10, 18), life: 30, col: '#fff' });
        FX.add({ k: 'text', s: 'ジュワ〜', x: p.x, y: gy - 60, size: 22, life: 26, rot0: 0, col: '#fff', font: JFONT, front: 1 });
        if (near && Math.abs(pl.x - p.x) < 62 && Math.abs(pl.z - p.z) < 36 && pl.y < 50) pl.takeHit(att, { dmg: 11, kx: 3, ky: 6.5, stop: 6, both: 1, y: [10, 50] });
      }
    } else {
      if (--p.life <= 0 || Math.abs(p.x - G.camX - W / 2) > W) p.dead = true;
      if (p.k === 'shock') { if (near && Math.abs(pl.x - p.x) < 30 && Math.abs(pl.z - p.z) < 30 && pl.y < 14) { if (pl.takeHit(att, { dmg: 10, kx: 3, ky: 6.5, stop: 6, y: [10, 40] })) p.spent = true; } if (p.t % 3 === 0) dustPuff(p.x, FLOOR + p.z, 1, 1); }
      else if (p.k === 'gfist') {
        if (p.t % 2 === 0) FX.add({ k: 'star', x: p.x - Math.sign(p.vx) * 30 + rand(-8, 8), y: FLOOR + p.z - p.y + rand(-14, 14), size: rand(8, 18), life: 14, col: '#ffe14a' });
        if (near && Math.abs(pl.x - p.x) < 44 && Math.abs(pl.z - p.z) < 24 && pl.y < p.y + 30) { if (pl.takeHit(att, { dmg: 13, kx: 5.5, ky: 7, stop: 9, heavy: 1, y: [50, 90] })) { p.dead = true; } }
      }
    }
  }
  G.projs = G.projs.filter(p => !p.dead);
}
function drawProj(ctx, p) {
  const x = p.x, gy = FLOOR + p.z;
  if (p.k === 'shock') {
    const a = Math.min(1, p.life / 20);
    ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const h = 16 + Math.abs(Math.sin(p.t * 0.5 + i * 1.3)) * 62; ctx.fillStyle = p.col[i % 2]; ctx.fillRect(x - 24 + i * 10, gy - h, 7, h); }
    ctx.strokeStyle = p.col[0]; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, gy, 34, 30 * 0.35, 0, 0, TAU); ctx.stroke(); ctx.restore();
  } else if (p.k === 'dumpling') {
    ctx.fillStyle = 'rgba(8,4,20,0.4)'; ctx.beginPath(); ctx.ellipse(x, gy, 26 * clamp(1 - p.y / 300, 0.3, 1), 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff3a1a'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.ellipse(x + p.vx * (p.y / 4), gy + (p.vz || 0) * (p.y / 4), 56, 17, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(x, gy - p.y); ctx.rotate(p.t * 0.25); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.fillStyle = '#fff6dc';
    ctx.beginPath(); ctx.arc(0, 0, 24, Math.PI, 0); ctx.quadraticCurveTo(0, 16, -24, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9a25a'; for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) / 5 * Math.PI; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.stroke(); }
    ctx.restore();
  } else if (p.k === 'gfist') {
    const d = Math.sign(p.vx), y = gy - p.y;
    ctx.fillStyle = 'rgba(8,4,20,0.4)'; ctx.beginPath(); ctx.ellipse(x, gy, 30, 8, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x - d * 150, 0, x, 0); g.addColorStop(0, 'rgba(255,210,30,0)'); g.addColorStop(1, 'rgba(255,230,120,0.8)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x - d * 150, x), y - 20, 150, 40); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = '#ffd31a';
    ctx.beginPath(); ctx.roundRect(-26, -24, 56, 48, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff3a0'; ctx.fillRect(-18, -18, 30, 8);
    ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(30, -12 + i * 12); ctx.lineTo(14, -12 + i * 12); } ctx.stroke(); ctx.restore();
  }
}
