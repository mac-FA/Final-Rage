'use strict';
/* =====================================================================
   Procedural character rig.
   Angles: 0 = limb points down, +90 = forward (facing), 180 = up, -90 = back.
   t = torso lean (+ forward), hd = head tilt relative to torso.
   af/ab = front/back arm [upper, forearm]; lf/lb = front/back leg [thigh, shin] (absolute).
   Extras: fz/bz fist scale, kz/jz foot scale, hz head scale (anime foreshortening),
   rot whole-body rotation, air 1 = don't auto-plant on the ground, hx/hy hip offset.
   ===================================================================== */
const NK = ['t', 'hd', 'af0', 'af1', 'ab0', 'ab1', 'lf0', 'lf1', 'lb0', 'lb1', 'hx', 'hy', 'rot', 'fz', 'bz', 'kz', 'jz', 'hz', 'air'];
function PZ(t, hd, af, ab, lf, lb, ex) {
  const p = { t, hd, af0: af[0], af1: af[1], ab0: ab[0], ab1: ab[1], lf0: lf[0], lf1: lf[1], lb0: lb[0], lb1: lb[1], hx: 0, hy: 0, rot: 0, fz: 1, bz: 1, kz: 1, jz: 1, hz: 1, air: 0, face: 'calm' };
  if (ex) Object.assign(p, ex);
  return p;
}
function mixPose(a, b, t, out) {
  for (let i = 0; i < NK.length; i++) { const k = NK[i]; out[k] = a[k] + (b[k] - a[k]) * t; }
  out.face = t > 0.35 ? b.face : a.face;
  return out;
}
const Y = { face: 'yell' }, HURT = { face: 'hurt' };
const POSES = {
  // --- neutral ---
  idle: PZ(10, -5, [35, 125], [55, 135], [32, -2], [-18, -42]),
  idle2: PZ(14, -6, [39, 119], [59, 129], [39, -7], [-23, -49]),
  idleH: PZ(4, 0, [50, 150], [20, 110], [22, 4], [-14, -30]),
  idleH2: PZ(8, -2, [56, 144], [26, 104], [30, -4], [-20, -42]),
  idleB: PZ(6, -4, [48, 112], [64, 118], [36, 4], [-30, -34]),
  idleB2: PZ(10, -4, [52, 106], [68, 112], [42, -2], [-36, -42]),
  walk1: PZ(8, 0, [20, 110], [60, 140], [35, 8], [-28, -48]),
  walk2: PZ(9, 0, [25, 118], [55, 133], [8, -8], [22, -55]),
  walk3: PZ(8, 0, [46, 130], [36, 118], [-28, -48], [35, 8]),
  walk4: PZ(9, 0, [40, 125], [40, 125], [22, -55], [8, -8]),
  run1: PZ(40, -28, [-70, 15], [80, 155], [80, 10], [-40, -118], Y),
  run2: PZ(40, -28, [80, 155], [-70, 15], [-40, -118], [80, 10], Y),
  nrun1: PZ(58, -45, [-78, -84], [-68, -74], [85, 15], [-45, -120], Y),
  nrun2: PZ(58, -45, [-72, -78], [-74, -80], [-45, -120], [85, 15], Y),
  brun1: PZ(48, -30, [50, 130], [-40, 30], [72, 12], [-42, -105], Y),
  brun2: PZ(48, -30, [44, 124], [-50, 20], [-42, -105], [72, 12], Y),
  jumpUp: PZ(4, -8, [118, 162], [-35, -70], [78, -25], [-12, -55], { air: 1, fz: 1.3 }),
  fall: PZ(-8, 6, [105, 150], [-105, -150], [34, -28], [-22, -72], { air: 1 }),
  land: PZ(46, -22, [14, 4], [-82, -104], [82, -12], [-22, -96], { fz: 1.3 }),
  // --- hero strikes ---
  jabW: PZ(4, -3, [-28, 96], [55, 135], [30, 0], [-20, -45]),
  jab: PZ(19, -9, [88, 90], [42, 142], [46, 0], [-36, -52], { fz: 1.6, face: 'yell' }),
  crossW: PZ(2, 0, [52, 132], [-42, 82], [28, 0], [-20, -45]),
  cross: PZ(30, -14, [-48, 58], [92, 90], [52, 4], [-42, -60], { bz: 1.9, face: 'yell' }),
  hikickW: PZ(-6, 0, [42, 120], [62, 130], [62, -62], [-5, -10]),
  hikick: PZ(-30, 12, [-42, -20], [72, 112], [114, 110], [-9, -13], { kz: 1.8, face: 'yell' }),
  uppW: PZ(44, -22, [-22, 68], [60, 120], [72, -26], [-36, -96]),
  upper: PZ(-14, -12, [158, 170], [-52, -92], [16, -26], [-14, -32], { fz: 2.1, air: 1, hx: 8, hy: -20, face: 'yell' }),
  sidekickW: PZ(-10, 5, [35, 115], [-40, 20], [70, -70], [-4, -8]),
  sidekick: PZ(-38, 22, [28, 104], [-62, -30], [92, 90], [-6, -6], { kz: 1.9, face: 'yell' }),
  spinW: PZ(18, -10, [-60, 20], [-80, -10], [20, -10], [-30, -40]),
  axeW: PZ(-16, 6, [62, 122], [-42, -62], [174, 177], [0, -5], { kz: 1.6, face: 'yell' }),
  axe: PZ(28, -12, [-32, -52], [62, 102], [58, 46], [-18, -34], { kz: 1.9, face: 'yell' }),
  palmW: PZ(-6, 0, [-42, 62], [-52, 52], [30, 0], [-20, -45]),
  palm: PZ(27, -12, [86, 93], [80, 96], [52, 5], [-42, -57], { fz: 1.9, bz: 1.6, face: 'yell' }),
  hookW: PZ(-4, 0, [-70, 30], [50, 130], [30, 0], [-22, -46]),
  hook: PZ(22, -8, [86, 142], [-32, 62], [46, 0], [-36, -56], { fz: 1.9, face: 'yell' }),
  buttW: PZ(-28, -18, [-32, -62], [-42, -72], [30, 0], [-20, -45]),
  butt: PZ(58, 12, [-52, -82], [-62, -92], [56, 5], [-42, -62], { hz: 1.45, face: 'yell' }),
  hammerW: PZ(-22, -10, [166, 202], [160, 196], [26, -5], [-20, -40], { fz: 1.3, bz: 1.3, face: 'yell' }),
  hammer: PZ(52, -12, [42, 30], [36, 24], [66, -10], [-42, -86], { fz: 2.1, bz: 1.8, face: 'yell' }),
  knee: PZ(16, -10, [-42, 42], [52, 132], [96, -8], [-32, -82], { air: 1, hy: -10, kz: 1.3, face: 'yell' }),
  dropkick: PZ(-72, 42, [-100, -122], [-112, -132], [89, 91], [84, 86], { air: 1, hy: -4, kz: 1.9, jz: 1.5, face: 'yell' }),
  shoulder: PZ(52, -22, [42, 122], [-52, -22], [62, 10], [-52, -82], Y),
  divekick: PZ(-22, 12, [-62, -102], [62, 132], [52, 50], [32, -72], { air: 1, kz: 1.9, face: 'yell' }),
  splash: PZ(82, -62, [150, 172], [140, 162], [-58, -80], [-68, -92], { air: 1, fz: 1.5, bz: 1.4, face: 'yell' }),
  tornado: PZ(-10, 0, [62, 122], [-62, -122], [96, 93], [0, -5], { kz: 1.8, air: 1, hy: -12, face: 'yell' }),
  lariat: PZ(0, 0, [92, 91], [-92, -91], [24, -4], [-24, -40], { fz: 1.8, bz: 1.8, face: 'yell' }),
  split: PZ(0, 0, [178, 180], [182, 180], [84, 88], [-84, -88], { rot: 180, kz: 1.7, jz: 1.7, face: 'yell' }),
  // --- reactions ---
  hurtA: PZ(-24, -30, [62, 30], [-62, -22], [26, 10], [-10, -42], HURT),
  hurtB: PZ(42, 26, [32, 100], [22, 92], [36, -5], [-26, -56], HURT),
  launched: PZ(-30, -30, [-140, -160], [120, 150], [62, 20], [28, -24], { air: 1, rot: -62, face: 'hurt' }),
  lie: PZ(0, 0, [-150, -165], [110, 130], [12, 26], [-6, -22], { rot: -88, face: 'hurt' }),
  getup: PZ(62, -22, [22, 10], [10, 0], [82, -30], [-22, -96]),
  // --- flair ---
  power: PZ(-12, -26, [-36, 96], [-26, 102], [46, -10], [-46, 10], { fz: 1.3, bz: 1.3, face: 'yell' }),
  winR: PZ(-10, -14, [-44, 70], [168, 178], [24, 10], [-24, -10], { bz: 2.0, face: 'grin' }),
  winH: PZ(-12, 8, [112, 168], [-52, 62], [10, 2], [-12, -112], { fz: 1.5, face: 'grin' }),
  winB: PZ(-14, -16, [-48, 52], [150, 172], [30, 12], [-28, -12], { bz: 1.5, face: 'grin' }),
  encore: PZ(-8, -8, [-34, 68], [166, 174], [16, 4], [-18, -8], { bz: 1.7, face: 'grin' }),
  wall1: PZ(4, 0, [82, 150], [62, 128], [22, 2], [-16, -32]),
  wall2: PZ(4, 0, [64, 132], [86, 152], [26, -2], [-20, -38]),
  throwW: PZ(-18, -8, [-120, -170], [60, 120], [30, 0], [-22, -46]),
  grab: PZ(14, -6, [72, 96], [62, 102], [40, 0], [-30, -48]),
  gknee: PZ(24, -10, [60, 100], [52, 104], [106, -6], [-22, -42], { kz: 1.5, face: 'yell' }),
  liftW: PZ(-22, -12, [160, 186], [150, 180], [30, -5], [-25, -40], { fz: 1.3, bz: 1.3, face: 'yell' }),
  point: PZ(-4, -6, [88, 90], [-40, 70], [24, 6], [-22, -12], { fz: 1.5, face: 'grin' })
};

/* keyframe list -> pose. k = [[pose, duration, ease?], ...]; segment i blends from key i-1 to key i */
const EASE = {
  s: t => t * t * (3 - 2 * t),
  o: t => 1 - Math.pow(1 - t, 3),
  i: t => t * t * t,
  b: t => { const c = 2.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, // overshoot: the anime "snap"
  l: t => t
};
function keysLen(k) { let n = 0; for (let i = 0; i < k.length; i++) n += k[i][1]; return n; }
function poseAt(k, f, loop, out) {
  const total = keysLen(k);
  if (loop) f = ((f % total) + total) % total; else f = clamp(f, 0, total);
  let acc = 0;
  for (let i = 0; i < k.length; i++) {
    const d = k[i][1];
    if (f <= acc + d || i === k.length - 1) {
      const b = POSES[k[i][0]];
      if (i === 0 || d <= 0) return mixPose(b, b, 1, out);
      const a = POSES[k[i - 1][0]];
      return mixPose(a, b, EASE[k[i][2] || 's'](clamp((f - acc) / d, 0, 1)), out);
    }
    acc += d;
  }
  return out;
}

/* ---------- styles ---------- */
function mkStyle(o) {
  const st = Object.assign({
    scale: 1, torso: 44, thigh: 31, shin: 31, upper: 23, fore: 23, headR: 14.5, neck: 3, foot: 11, shW: 4, hipW: 4,
    wT: 15, wB: 11.5, wA: 6.5, wL: 8.5,
    skin: '#f2c49b', top: '#d22', pants: '#234', glove: '#fff', shoe: '#222', hair: '#222', accent: '#ff0', shirt: '#fff',
    hairStyle: 'spiky', sleeve: 1, deco: 'jacket', eyes: 'normal', chains: []
  }, o);
  st.scale = (o.scale || 1) * 1.2;
  st.chains = st.chains.map(c => Object.assign({}, c, { seg: c.seg * 1.15, w0: c.w0 * 1.1, w1: c.w1 * 1.1 }));
  st.d = {}; st.l = {};
  for (const k of ['skin', 'top', 'pants', 'glove', 'shoe', 'hair']) { st.d[k] = shade(st[k], 0.66); st.l[k] = tint(st[k], 0.24); }
  return st;
}

/* ---------- forward kinematics ---------- */
function solve(st, p, x, gy, face, sq) {
  const s = st.scale, R = D2R;
  const tr = p.t * R, nx = Math.sin(tr) * st.torso, ny = -Math.cos(tr) * st.torso;
  const har = (p.t + p.hd) * R, hr = st.headR * p.hz;
  const seg = (o, a, l) => [o[0] + Math.sin(a * R) * l, o[1] + Math.cos(a * R) * l];
  const P = {};
  P.hip = [0, 0]; P.neck = [nx, ny];
  P.head = [nx + Math.sin(har) * (hr * 0.85 + st.neck), ny - Math.cos(har) * (hr * 0.85 + st.neck)];
  P.sF = [nx * 0.9 - st.shW, ny * 0.9]; P.sB = [nx * 0.9 + st.shW, ny * 0.9];
  P.eF = seg(P.sF, p.af0, st.upper); P.hF = seg(P.eF, p.af1, st.fore);
  P.eB = seg(P.sB, p.ab0, st.upper); P.hB = seg(P.eB, p.ab1, st.fore);
  P.gF = [-st.hipW, 0]; P.gB = [st.hipW, 0];
  P.kF = seg(P.gF, p.lf0, st.thigh); P.fF = seg(P.kF, p.lf1, st.shin); P.tF = seg(P.fF, p.lf1 + 78, st.foot);
  P.kB = seg(P.gB, p.lb0, st.thigh); P.fB = seg(P.kB, p.lb1, st.shin); P.tB = seg(P.fB, p.lb1 + 78, st.foot);
  if (p.rot) {
    const c = Math.cos(p.rot * R), sn = Math.sin(p.rot * R);
    for (const k in P) { const q = P[k], qx = q[0], qy = q[1]; q[0] = qx * c - qy * sn; q[1] = qx * sn + qy * c; }
  }
  let my = -1e9;
  if (p.air < 1) {
    my = Math.max(P.fF[1] + 5, P.tF[1] + 4, P.fB[1] + 5, P.tB[1] + 4, P.hF[1] + 6, P.hB[1] + 6, P.head[1] + hr, P.hip[1] + st.wB, P.neck[1] + st.wT * 0.8, P.kF[1] + 6, P.kB[1] + 6);
  }
  const offY = (p.air < 1 ? -my * (1 - p.air) : 0) + (-(st.thigh + st.shin) * 0.96 + p.hy) * p.air;
  const J = { s, face, ha: (p.t + p.hd + p.rot) * R, fz: p.fz, bz: p.bz, kz: p.kz, jz: p.jz, hr: hr * s, expr: p.face };
  const qx = sq ? 1 - sq * 0.55 : 1, qy = sq ? 1 + sq : 1; // squash & stretch about the feet
  for (const k in P) J[k] = [x + face * (P[k][0] + p.hx) * s * qx, gy + (P[k][1] + offY) * s * qy];
  return J;
}

/* ---------- drawing primitives ---------- */
const LX = -0.45, LY = -0.89; // key light: upper left
function capsule(ctx, a, b, r1, r2) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-3, nx = -dy / L, ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(a[0] + nx * r1, a[1] + ny * r1); ctx.lineTo(b[0] + nx * r2, b[1] + ny * r2);
  ctx.lineTo(b[0] - nx * r2, b[1] - ny * r2); ctx.lineTo(a[0] - nx * r1, a[1] - ny * r1);
  ctx.fill();
  ctx.beginPath(); ctx.arc(a[0], a[1], r1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(b[0], b[1], r2, 0, TAU); ctx.fill();
}
const lo = (p, r) => [p[0] + LX * r * 0.4, p[1] + LY * r * 0.4];
/* a chain of tapered capsules: ink outline, flat colour, then a cel highlight on the lit side */
function limb(ctx, pts, rs, cols, OL, ow, lit) {
  if (ow) { ctx.fillStyle = OL; for (let i = 0; i < pts.length - 1; i++) capsule(ctx, pts[i], pts[i + 1], rs[i] + ow, rs[i + 1] + ow); }
  for (let i = 0; i < pts.length - 1; i++) { ctx.fillStyle = cols[i]; capsule(ctx, pts[i], pts[i + 1], rs[i], rs[i + 1]); }
  if (lit) for (let i = 0; i < pts.length - 1; i++) { ctx.fillStyle = lit[i]; capsule(ctx, lo(pts[i], rs[i]), lo(pts[i + 1], rs[i + 1]), rs[i] * 0.46, rs[i + 1] * 0.46); }
}
function disc(ctx, p, r, col, OL, ow) {
  if (ow) { ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(p[0], p[1], r + ow, 0, TAU); ctx.fill(); }
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
}
const HAS_RR = typeof CanvasRenderingContext2D !== 'undefined' && !!CanvasRenderingContext2D.prototype.roundRect;
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (HAS_RR) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); }
/* a blocky cartoon fist, oriented along the forearm, with knuckles */
function fist(ctx, h, e, r, col, lit, OL, ow, sil) {
  if (sil) { ctx.fillStyle = sil; ctx.beginPath(); ctx.arc(h[0], h[1], r * 1.05, 0, TAU); ctx.fill(); return; }
  const a = Math.atan2(h[1] - e[1], h[0] - e[0]);
  ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(a);
  ctx.fillStyle = OL; rrect(ctx, -r * 0.9 - ow, -r - ow, r * 2.05 + ow * 2, r * 2 + ow * 2, r * 0.66 + ow);
  ctx.fillStyle = col; rrect(ctx, -r * 0.9, -r, r * 2.05, r * 2, r * 0.66);
  ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.3, r * 0.13); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 0.62, -r * 0.42); ctx.lineTo(r * 1.1, -r * 0.42); ctx.moveTo(r * 0.62, r * 0.12); ctx.lineTo(r * 1.1, r * 0.12); ctx.moveTo(r * 0.62, r * 0.6); ctx.lineTo(r * 1.0, r * 0.6);
  ctx.moveTo(-r * 0.3, r * 0.2); ctx.quadraticCurveTo(r * 0.25, r * 0.2, r * 0.3, r * 0.75); ctx.stroke();
  ctx.restore();
  if (lit) { ctx.fillStyle = lit; ctx.beginPath(); ctx.arc(h[0] + LX * r * 0.42, h[1] + LY * r * 0.42, r * 0.36, 0, TAU); ctx.fill(); }
}
const pol = (a, r) => [Math.cos(a * D2R) * r, Math.sin(a * D2R) * r];

/* ---------- head (drawn in unit space, face toward +x) ---------- */
function hairPath(ctx, hs) {
  ctx.beginPath();
  switch (hs) {
    case 'spiky': {
      ctx.moveTo(0.8, -0.5);
      for (let i = 0; i < 7; i++) {
        const v = pol(-38 - i * 28, 1.0), tip = pol(-38 - i * 28 - 26, 1.6 + (i % 2) * 0.38 + (i === 2 ? 0.3 : 0));
        ctx.lineTo(v[0], v[1]); ctx.lineTo(tip[0], tip[1]);
      }
      const e = pol(-236, 1.0); ctx.lineTo(e[0], e[1]); ctx.lineTo(-0.15, -0.15); ctx.lineTo(0.35, -0.55);
      ctx.lineTo(1.36, -0.4); ctx.lineTo(0.72, -0.8);
      break;
    }
    case 'pomp':
      ctx.arc(0, 0, 1.1, -20 * D2R, -215 * D2R, true); ctx.lineTo(-0.35, 0.05); ctx.lineTo(0.3, -0.45);
      ctx.lineTo(0.9, -0.5); ctx.bezierCurveTo(2.0, -0.6, 1.9, -1.8, 0.5, -1.55); ctx.bezierCurveTo(0.1, -1.5, -0.3, -1.3, -0.5, -1.0);
      break;
    case 'mohawk':
      ctx.moveTo(0.75, -0.7);
      for (let i = 0; i < 6; i++) { const tip = pol(-45 - i * 24 - 12, 2.05 - Math.abs(i - 2) * 0.1), v = pol(-45 - i * 24 - 24, 1.0); ctx.lineTo(tip[0], tip[1]); ctx.lineTo(v[0], v[1]); }
      ctx.lineTo(-0.5, -0.6); ctx.lineTo(0.4, -0.8);
      break;
    case 'bald': break;
    default: // cap-like hair: slick, twin, phones, bandana, chef, beret base
      ctx.arc(0, 0, 1.1, -32 * D2R, -218 * D2R, true); ctx.lineTo(-0.35, 0.08); ctx.lineTo(0.05, -0.35); ctx.lineTo(0.5, -0.38); ctx.lineTo(0.62, -0.1); ctx.lineTo(0.95, -0.55);
  }
  ctx.closePath();
}
function drawHead(ctx, st, c, r, ang, face, expr, sil) {
  ctx.save();
  ctx.translate(c[0], c[1]); ctx.scale(face, 1); ctx.rotate(ang); ctx.scale(r, r);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = Math.min(0.2, 2.2 / r);
  if (sil) {
    ctx.fillStyle = sil; ctx.beginPath(); ctx.ellipse(0, 0.04, 1, 1.08, 0, 0, TAU); ctx.fill();
    hairPath(ctx, st.hairStyle); ctx.fill(); ctx.restore(); return;
  }
  const hs = st.hairStyle;
  ctx.strokeStyle = INK; ctx.lineWidth = lw;
  // skull, with a soft jaw shadow and a lit cheek
  ctx.fillStyle = st.skin; ctx.beginPath(); ctx.ellipse(0, 0.04, 1, 1.08, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0.04, 0.96, 1.04, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = st.d.skin; ctx.beginPath(); ctx.ellipse(-0.75, 0.55, 0.9, 1.0, 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = st.l.skin; ctx.beginPath(); ctx.ellipse(0.25, -0.75, 0.7, 0.4, -0.3, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.fillStyle = st.d.skin; ctx.beginPath(); ctx.ellipse(-0.2, 0.2, 0.17, 0.26, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (st.blush) { ctx.fillStyle = st.blush; ctx.beginPath(); ctx.ellipse(0.34, 0.36, 0.22, 0.12, 0, 0, TAU); ctx.fill(); }
  if (st.beard) { ctx.fillStyle = st.beard; ctx.beginPath(); ctx.arc(0, 0.04, 1.06, -5 * D2R, 150 * D2R); ctx.lineTo(-0.2, 0.3); ctx.lineTo(0.45, 0.28); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // eyes
  const ey = st.eyes;
  if (ey === 'pigeon') {
    ctx.fillStyle = '#ffb21a'; ctx.beginPath(); ctx.arc(0.42, -0.12, 0.32, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0.5, -0.12, expr === 'hurt' ? 0.06 : 0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0.44, -0.2, 0.06, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff8a1a'; ctx.beginPath(); ctx.moveTo(0.85, -0.05); ctx.lineTo(1.75, 0.3); ctx.lineTo(0.8, 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.9, 0.28); ctx.lineTo(1.6, 0.3); ctx.stroke();
  } else if (ey === 'shades' || ey === 'glasses') {
    ctx.fillStyle = ey === 'shades' ? '#0b0b12' : '#eaffff';
    ctx.beginPath(); ctx.moveTo(0.18, -0.38); ctx.lineTo(1.02, -0.3); ctx.lineTo(0.92, 0.16); ctx.lineTo(0.3, 0.14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.2, -0.3); ctx.lineTo(-0.7, -0.22); ctx.stroke();
    ctx.fillStyle = ey === 'shades' ? '#fff' : '#9fe'; ctx.beginPath(); ctx.moveTo(0.4, -0.3); ctx.lineTo(0.62, -0.28); ctx.lineTo(0.45, 0.05); ctx.closePath(); ctx.fill();
  } else if (expr === 'grin') {
    ctx.lineWidth = 0.15; ctx.beginPath(); ctx.arc(0.5, 0.1, 0.26, 200 * D2R, 340 * D2R); ctx.stroke();
  } else if (expr === 'blink') {
    ctx.lineWidth = 0.14; ctx.beginPath(); ctx.arc(0.5, -0.16, 0.26, 20 * D2R, 160 * D2R); ctx.stroke();
  } else if (expr === 'hurt') {
    ctx.lineWidth = 0.15; ctx.beginPath(); ctx.moveTo(0.26, -0.24); ctx.lineTo(0.74, -0.02); ctx.lineTo(0.26, 0.2); ctx.stroke();
  } else {
    const yell = expr === 'yell';
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0.5, -0.03, 0.31, yell ? 0.25 : 0.3, 0.1, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = st.eyeCol || '#4a3a9a'; ctx.beginPath(); ctx.arc(0.59, -0.02, yell ? 0.13 : 0.19, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0.61, -0.02, yell ? 0.06 : 0.09, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0.52, -0.11, 0.07, 0, TAU); ctx.fill();
    ctx.lineWidth = 0.13; ctx.beginPath(); ctx.arc(0.5, 0, 0.33, -150 * D2R, -22 * D2R); ctx.stroke(); // heavy upper lid
    if (ey === 'mime') { ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(0.5, -0.5); ctx.lineTo(0.5, 0.45); ctx.stroke(); }
  }
  if (ey !== 'pigeon') {
    // brow: slanted = permanently furious
    ctx.lineWidth = 0.18; ctx.strokeStyle = st.brow || INK;
    ctx.beginPath(); if (expr === 'hurt') { ctx.moveTo(0.15, -0.34); ctx.lineTo(0.85, -0.54); } else if (expr === 'grin' || expr === 'blink') { ctx.moveTo(0.14, -0.52); ctx.lineTo(0.9, -0.44); } else { ctx.moveTo(0.1, -0.56); ctx.lineTo(0.94, -0.28); } ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = lw;
    // mouth
    if (expr === 'yell') {
      ctx.fillStyle = '#7a1020'; ctx.beginPath(); ctx.moveTo(0.3, 0.32); ctx.lineTo(1.0, 0.36); ctx.lineTo(0.66, 0.97); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0.38, 0.36); ctx.lineTo(0.95, 0.39); ctx.lineTo(0.88, 0.5); ctx.lineTo(0.44, 0.47); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8566a'; ctx.beginPath(); ctx.ellipse(0.66, 0.8, 0.12, 0.08, 0, 0, TAU); ctx.fill();
    } else if (expr === 'grin') {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0.34, 0.36); ctx.lineTo(1.0, 0.3); ctx.lineTo(0.72, 0.74); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (expr === 'hurt') {
      ctx.fillStyle = '#7a1020'; ctx.beginPath(); ctx.ellipse(0.7, 0.58, 0.16, 0.22, 0, 0, TAU); ctx.fill(); ctx.stroke();
    } else { ctx.lineWidth = 0.12; ctx.beginPath(); ctx.moveTo(0.5, 0.52); ctx.lineTo(0.88, 0.46); ctx.stroke(); ctx.lineWidth = lw; }
  }
  // hair & headgear
  if (hs !== 'bald') {
    hairPath(ctx, hs); ctx.fillStyle = st.hair; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = st.l.hair; ctx.lineWidth = 0.13; ctx.beginPath(); ctx.arc(0, 0, 0.82, -62 * D2R, -112 * D2R, true); ctx.stroke(); // gloss
    ctx.strokeStyle = INK; ctx.lineWidth = lw;
  }
  if (hs === 'spiky' || hs === 'bandana') { // headband
    ctx.strokeStyle = INK; ctx.lineWidth = 0.42; ctx.beginPath(); ctx.arc(0, 0, 1.04, -28 * D2R, -160 * D2R, true); ctx.stroke();
    ctx.strokeStyle = st.accent; ctx.lineWidth = 0.26; ctx.beginPath(); ctx.arc(0, 0, 1.04, -28 * D2R, -160 * D2R, true); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = lw;
  }
  if (hs === 'twin') { ctx.fillStyle = st.accent; ctx.beginPath(); ctx.arc(-0.75, -0.8, 0.34, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-0.2, -1.1, 0.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-0.82, -0.9, 0.1, 0, TAU); ctx.arc(-0.27, -1.2, 0.09, 0, TAU); ctx.fill(); }
  if (hs === 'phones') {
    ctx.lineWidth = 0.3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(-0.1, 0, 1.25, -60 * D2R, -150 * D2R, true); ctx.stroke();
    ctx.lineWidth = lw; ctx.fillStyle = st.accent; ctx.beginPath(); ctx.ellipse(-0.2, 0.12, 0.46, 0.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-0.2, 0.12, 0.2, 0.3, 0, 0, TAU); ctx.fill();
  }
  if (hs === 'chef') {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-0.85, -0.7); ctx.lineTo(-1.0, -1.7);
    ctx.bezierCurveTo(-1.5, -2.6, -0.3, -2.9, 0, -2.4); ctx.bezierCurveTo(0.5, -3.0, 1.6, -2.4, 0.95, -1.7); ctx.lineTo(0.8, -0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.9, -1.1); ctx.lineTo(0.85, -1.1); ctx.stroke();
  }
  if (hs === 'beret') { ctx.fillStyle = st.accent; ctx.beginPath(); ctx.ellipse(-0.25, -0.98, 1.05, 0.42, -0.25, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-0.3, -1.38); ctx.lineTo(-0.38, -1.62); ctx.stroke(); }
  ctx.restore();
}

/* ---------- body ---------- */
function drawFighter(ctx, st, J, sil, opt) {
  const s = J.s, OL = sil || INK, ow = sil ? 0 : 2.2;
  const c = (k, dark) => sil || (dark ? st.d[k] : st[k]);
  const wA = st.wA * s, wL = st.wL * s, f = J.face;
  const s1 = st.sleeve >= 1 ? 'top' : 'skin', s2 = st.sleeve >= 2 ? 'top' : 'skin', l2 = st.shorts ? 'skin' : 'pants';
  // back arm & leg sit in shadow
  limb(ctx, [J.sB, J.eB, J.hB], [wA, wA * 0.92, wA * 0.85], [c(s1, 1), c(s2, 1)], OL, ow);
  fist(ctx, J.hB, J.eB, wA * 1.25 * J.bz, c('glove', 1), null, OL, ow, sil);
  limb(ctx, [J.gB, J.kB, J.fB], [wL * 1.12, wL * 0.95, wL * 0.74], [c('pants', 1), c(l2, 1)], OL, ow);
  limb(ctx, [J.fB, J.tB], [wL * 0.82 * J.jz, wL * 0.66 * J.jz], [c('shoe', 1)], OL, ow);
  // front leg
  limb(ctx, [J.gF, J.kF, J.fF], [wL * 1.12, wL * 0.95, wL * 0.74], [c('pants'), c(l2)], OL, ow, sil ? null : [st.l.pants, st.l[l2]]);
  limb(ctx, [J.fF, J.tF], [wL * 0.82 * J.kz, wL * 0.66 * J.kz], [c('shoe')], OL, ow, sil ? null : [st.l.shoe]);
  // torso frame
  const ux = J.neck[0] - J.hip[0], uy = J.neck[1] - J.hip[1], L = Math.hypot(ux, uy) || 1;
  const ax = ux / L, ay = uy / L, px = -ay * f, py = ax * f;
  const tp = (a, b) => [J.hip[0] + ux * a + px * b * s, J.hip[1] + uy * a + py * b * s];
  const wB = st.wB * s, wT = st.wT * s;
  limb(ctx, [J.neck, J.head], [wA * 0.9, wA * 0.9], [c('skin', 1)], OL, ow);
  disc(ctx, J.hip, wB, c('pants'), OL, ow);
  if (st.deco === 'belly') disc(ctx, tp(0.3, st.wB * 0.55), wB * 1.12, c('top'), OL, ow);
  limb(ctx, [tp(0.2, 0), tp(0.88, 0)], [wB, wT], [c('top')], OL, ow);
  if (!sil) {
    if (st.deco === 'belly') disc(ctx, tp(0.3, st.wB * 0.55), wB * 1.1, st.top, 0, 0);
    // core shadow down the back, highlight on the lit shoulder
    ctx.fillStyle = st.d.top; capsule(ctx, tp(0.22, -st.wB * 0.34), tp(0.86, -st.wT * 0.34), wB * 0.6, wT * 0.6);
    ctx.fillStyle = st.l.top; capsule(ctx, lo(tp(0.5, st.wB * 0.1), wB), lo(tp(0.88, st.wT * 0.1), wT), wB * 0.3, wT * 0.42);
    ctx.lineCap = 'round';
    const line = (a, b, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
    switch (st.deco) {
      case 'jacket': line(tp(0.24, st.wB * 0.5), tp(0.86, st.wT * 0.52), 7, st.shirt); line(tp(0.86, st.wT * 0.1), tp(0.5, st.wT * 0.2), 2.2, INK); line(tp(0.2, -st.wB * 0.2), tp(0.2, st.wB * 0.8), 4, st.accent); break;
      case 'belly': line(tp(0.1, st.wB * 0.7), tp(0.8, st.wT * 0.55), 12, st.shirt); line(tp(0.84, st.wT * 0.2), tp(0.84, st.wT * 0.8), 3, st.shirt); break;
      case 'suit': line(tp(0.3, st.wB * 0.6), tp(0.9, st.wT * 0.55), 6, '#fff'); line(tp(0.9, st.wT * 0.62), tp(0.42, st.wT * 0.78), 3.4, st.accent); line(tp(0.9, st.wT * 0.2), tp(0.56, st.wT * 0.36), 2, INK); break;
      case 'stripes': for (const a of [0.3, 0.5, 0.7]) { const w = lerp(st.wB, st.wT, a) * 0.8; line(tp(a, -w), tp(a, w), 4.5, st.accent); } break;
      case 'bare': line(tp(0.62, st.wT * 0.1), tp(0.6, st.wT * 0.85), 1.6, st.d.skin); line(tp(0.4, st.wB * 0.3), tp(0.4, st.wB * 0.8), 1.4, st.d.skin); line(tp(0.2, -st.wB * 0.8), tp(0.2, st.wB * 0.8), 4, st.accent); break;
      case 'tank': line(tp(0.2, -st.wB * 0.8), tp(0.2, st.wB * 0.8), 4, st.accent); disc(ctx, tp(0.62, st.wT * 0.3), 4 * s, st.accent, 0, 0); break;
    }
  }
  drawHead(ctx, st, J.head, J.hr, J.ha, f, J.expr, sil);
  // front arm (+ prop)
  if (st.prop && !sil) drawProp(ctx, st, J, opt);
  limb(ctx, [J.sF, J.eF, J.hF], [wA * 1.05, wA * 0.95, wA * 0.88], [c(s1), c(s2)], OL, ow, sil ? null : [st.l[s1], st.l[s2]]);
  fist(ctx, J.hF, J.eF, wA * 1.3 * J.fz, c('glove', 0), sil ? null : st.l.glove, OL, ow, sil);
}
function drawProp(ctx, st, J, opt) {
  const dx = J.hF[0] - J.eF[0], dy = J.hF[1] - J.eF[1], a = Math.atan2(dy, dx), s = J.s;
  ctx.save(); ctx.translate(J.hF[0], J.hF[1]); ctx.rotate(a);
  ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  if (st.prop === 'case') {
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(2 * s, -12 * s, 20 * s, 26 * s); ctx.strokeRect(2 * s, -12 * s, 20 * s, 26 * s);
    ctx.fillStyle = '#e8c15a'; ctx.fillRect(9 * s, -2 * s, 6 * s, 5 * s);
  } else if (st.prop === 'cleaver') {
    ctx.fillStyle = '#dfe8f0'; ctx.beginPath(); ctx.rect(6 * s, -20 * s, 34 * s, 22 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(8 * s, -18 * s, 30 * s, 5 * s); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(34 * s, -4 * s, 2 * s, 0, TAU); ctx.fill();
  } else if (st.prop === 'mallet' && opt && opt.attacking) {
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(48 * s, 0); ctx.stroke(); ctx.strokeRect(40 * s, -22 * s, 30 * s, 44 * s);
  }
  ctx.restore();
}

/* ---------- cloth / hair chains: tiny verlet ropes that sell the motion ---------- */
class Chain {
  constructor(spec) { this.s = spec; this.p = null; }
  update(ax, ay, face, gy, tick) {
    const s = this.s, n = s.n;
    if (!this.p) { this.p = []; for (let i = 0; i < n; i++) this.p.push({ x: ax - face * i * s.seg, y: ay + i, px: ax - face * i * s.seg, py: ay + i }); }
    const p = this.p; p[0].x = ax; p[0].y = ay;
    for (let i = 1; i < n; i++) {
      const q = p[i], vx = (q.x - q.px) * 0.88, vy = (q.y - q.py) * 0.88;
      q.px = q.x; q.py = q.y;
      q.x += vx - face * (s.wind || 0.3) + Math.sin(tick * 0.19 + i * 0.9) * 0.22;
      q.y += vy + (s.g || 0.28) + Math.cos(tick * 0.23 + i) * 0.1;
    }
    for (let k = 0; k < 3; k++) for (let i = 1; i < n; i++) {
      const a = p[i - 1], b = p[i]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = s.seg / d;
      b.x = a.x + dx * f; b.y = Math.min(a.y + dy * f, gy - 2);
    }
  }
  draw(ctx, sil) {
    const p = this.p; if (!p) return; const s = this.s, n = p.length, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const w = lerp(s.w0, s.w1, i / (n - 1)) * 0.5; L.push([p[i].x - dy / d * w, p[i].y + dx / d * w]); Rr.push([p[i].x + dy / d * w, p[i].y - dx / d * w]);
    }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
    ctx.closePath(); ctx.fillStyle = sil || s.col; ctx.fill();
    if (!sil) { ctx.lineJoin = 'round'; ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
  }
}
function chainAnchor(J, spec) {
  if (spec.at === 'head') {
    const c = Math.cos(J.ha), sn = Math.sin(J.ha), ox = spec.ox * J.hr, oy = spec.oy * J.hr;
    return [J.head[0] + J.face * (ox * c - oy * sn), J.head[1] + ox * sn + oy * c];
  }
  return [J.neck[0] - J.face * (spec.ox || 0) * J.s, J.neck[1] + (spec.oy || 0) * J.s];
}
