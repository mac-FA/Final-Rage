'use strict';
/* ---------- looping / state animations ---------- */
const ANIMS = {
  idle: { loop: 1, k: [['idle', 0], ['idle2', 26], ['idle', 26]] },
  idleH: { loop: 1, k: [['idleH', 0], ['idleH2', 11], ['idleH', 11]] },
  idleB: { loop: 1, k: [['idleB', 0], ['idleB2', 34], ['idleB', 34]] },
  wall: { loop: 1, k: [['wall1', 0], ['wall2', 14], ['wall1', 14]] },
  walk: { loop: 1, k: [['walk1', 0], ['walk2', 7, 'l'], ['walk3', 7, 'l'], ['walk4', 7, 'l'], ['walk1', 7, 'l']] },
  run: { loop: 1, k: [['run1', 0], ['run2', 8, 'l'], ['run1', 8, 'l']] },
  nrun: { loop: 1, k: [['nrun1', 0], ['nrun2', 6, 'l'], ['nrun1', 6, 'l']] },
  brun: { loop: 1, k: [['brun1', 0], ['brun2', 10, 'l'], ['brun1', 10, 'l']] },
  jumpUp: { k: [['jumpUp', 0]] }, fall: { k: [['fall', 0]] },
  land: { k: [['land', 0], ['land', 5], ['idle', 7]] },
  hurtA: { k: [['hurtA', 0]] }, hurtB: { k: [['hurtB', 0]] }, launched: { k: [['launched', 0]] }, lie: { k: [['lie', 0]] },
  getup: { k: [['lie', 0], ['getup', 9], ['idle', 9]] },
  power: { k: [['power', 0]] }, winR: { k: [['winR', 0]] }, winH: { k: [['winH', 0]] }, winB: { k: [['winB', 0]] }, encore: { k: [['encore', 0]] }, point: { k: [['point', 0]] },
  uppW: { k: [['uppW', 0]] }, upper: { k: [['upper', 0]] }, splash: { k: [['splash', 0]] }, fallB: { k: [['hammerW', 0]] },
  rush: { loop: 1, k: [['jab', 0], ['cross', 3, 'o'], ['jab', 3, 'o']] }
};

/* ---------- moves ----------
   k: keyframes; hits: {f:[from,to], x:[near,far], y:[low,high], dmg, kx, ky(launch), stun, stop(hitstop), heavy, multi, both}
   lunge:[frame, vx]  hop:[frame, vy]  spin:[from,to,period]  ev:{frame:'event'}  air: ends on landing  trail: joint name */
const MOVES = {
  // ----- Ryker -----
  jab: { k: [['jabW', 2], ['jab', 2, 'b'], ['jab', 4], ['idle', 6]], cancel: 6, lunge: [1, 2.4], trail: 'hF', hits: [{ f: [3, 7], x: [0, 72], y: [50, 112], dmg: 5, kx: 1.2, stun: 20, stop: 3 }] },
  cross: { k: [['crossW', 2], ['cross', 2, 'b'], ['cross', 5], ['idle', 7]], cancel: 7, lunge: [1, 3.2], trail: 'hB', hits: [{ f: [3, 8], x: [0, 80], y: [50, 112], dmg: 7, kx: 1.8, stun: 22, stop: 4 }] },
  hikick: { k: [['hikickW', 3], ['hikick', 2, 'b'], ['hikick', 6], ['idle', 8]], cancel: 9, lunge: [2, 2.8], trail: 'tF', hits: [{ f: [4, 10], x: [0, 92], y: [55, 135], dmg: 9, kx: 2.4, stun: 24, stop: 5 }] },
  upper: { k: [['uppW', 5, 'o'], ['upper', 3, 'b'], ['upper', 10], ['fall', 6], ['idle', 5]], lunge: [4, 3.4], hop: [5, 6.2], trail: 'hF', hits: [{ f: [5, 13], x: [-5, 78], y: [10, 180], dmg: 16, kx: 3.4, ky: 11, stop: 10, heavy: 1 }] },
  knee: { k: [['knee', 3, 'b'], ['knee', 13], ['fall', 5], ['idle', 5]], lunge: [0, 8.5], hop: [0, 4.6], keep: 14, trail: 'kF', hits: [{ f: [1, 15], x: [0, 66], y: [20, 110], dmg: 12, kx: 4.5, ky: 7, stop: 7, heavy: 1 }] },
  divekick: { k: [['divekick', 3, 'b'], ['divekick', 90]], air: 1, dive: [6, -4], trail: 'tF', hits: [{ f: [2, 99], x: [0, 70], y: [-25, 70], dmg: 10, kx: 3.5, ky: 5.5, stop: 6 }] },
  tornado: { k: [['tornado', 3, 'b'], ['tornado', 28], ['fall', 5], ['idle', 4]], hop: [0, 5.2], spin: [2, 31, 3], ctrl: 2.4, inv: 1, trail: 'tF', hits: [{ f: [3, 31], x: [-80, 80], y: [15, 125], dmg: 5, kx: 3.6, ky: 7.5, stop: 2, multi: 8, both: 1 }] },
  // ----- Hana -----
  sidekick: { k: [['sidekickW', 2], ['sidekick', 2, 'b'], ['sidekick', 4], ['idleH', 5]], cancel: 6, lunge: [1, 2.6], trail: 'tF', hits: [{ f: [3, 7], x: [0, 90], y: [45, 110], dmg: 5, kx: 1.4, stun: 20, stop: 3 }] },
  hikickH: { k: [['hikickW', 2], ['hikick', 2, 'b'], ['hikick', 5], ['idleH', 6]], cancel: 7, lunge: [1, 2.8], trail: 'tF', hits: [{ f: [3, 8], x: [0, 92], y: [55, 135], dmg: 6, kx: 1.8, stun: 22, stop: 4 }] },
  spinkick: { k: [['spinW', 4], ['sidekick', 2, 'b'], ['sidekick', 6], ['idleH', 7]], cancel: 9, lunge: [2, 4], flip: [0, 4], trail: 'tF', hits: [{ f: [5, 11], x: [0, 98], y: [40, 120], dmg: 9, kx: 3, stun: 24, stop: 6 }] },
  axe: { k: [['axeW', 5, 'o'], ['axeW', 3], ['axe', 2, 'b'], ['axe', 8], ['idleH', 8]], lunge: [6, 3], trail: 'tF', ev: { 10: 'quakeS' }, hits: [{ f: [9, 14], x: [0, 86], y: [0, 170], dmg: 15, kx: 2.6, ky: 10, stop: 10, heavy: 1 }] },
  dropkick: { k: [['dropkick', 3, 'b'], ['dropkick', 13], ['fall', 5], ['idleH', 5]], lunge: [0, 10], hop: [0, 4.2], keep: 14, trail: 'tF', hits: [{ f: [1, 15], x: [0, 84], y: [25, 100], dmg: 12, kx: 5, ky: 7, stop: 7, heavy: 1 }] },
  split: { k: [['split', 5, 'b'], ['split', 30], ['idleH', 8]], spin: [4, 36, 3], ctrl: 2.8, inv: 1, trail: 'tF', hits: [{ f: [5, 36], x: [-84, 84], y: [30, 130], dmg: 4, kx: 3.2, ky: 7.5, stop: 2, multi: 6, both: 1 }] },
  // ----- Brisket -----
  palm: { k: [['palmW', 3], ['palm', 2, 'b'], ['palm', 5], ['idleB', 7]], cancel: 8, lunge: [2, 3], trail: 'hF', hits: [{ f: [4, 9], x: [0, 78], y: [45, 112], dmg: 8, kx: 2.2, stun: 24, stop: 5 }] },
  hook: { k: [['hookW', 3], ['hook', 2, 'b'], ['hook', 5], ['idleB', 7]], cancel: 8, lunge: [2, 3], trail: 'hF', hits: [{ f: [4, 9], x: [0, 74], y: [50, 120], dmg: 10, kx: 2.2, stun: 24, stop: 6 }] },
  butt: { k: [['buttW', 4, 'o'], ['butt', 2, 'b'], ['butt', 6], ['idleB', 8]], cancel: 10, lunge: [3, 3.6], hits: [{ f: [5, 10], x: [0, 70], y: [40, 125], dmg: 12, kx: 1.5, stun: 34, stop: 8 }] },
  hammer: { k: [['hammerW', 7, 'o'], ['hammer', 3, 'b'], ['hammer', 10], ['idleB', 9]], lunge: [6, 3], trail: 'hF', ev: { 9: 'quake' }, hits: [{ f: [8, 13], x: [-10, 104], y: [0, 140], dmg: 20, kx: 3, ky: 9.5, stop: 12, heavy: 1, zr: 40 }] },
  shoulder: { k: [['shoulder', 3, 'b'], ['shoulder', 15], ['idleB', 8]], lunge: [0, 9], keep: 15, hits: [{ f: [1, 17], x: [0, 62], y: [20, 120], dmg: 14, kx: 5.5, ky: 6.5, stop: 8, heavy: 1 }] },
  splash: { k: [['splash', 4, 'b'], ['splash', 90]], air: 1, dive: [3, -2], ev: { land: 'quake' }, hits: [{ f: [2, 99], x: [-46, 56], y: [-30, 60], dmg: 16, kx: 3, ky: 6, stop: 9, heavy: 1, zr: 34 }] },
  lariat: { k: [['lariat', 4, 'b'], ['lariat', 36], ['idleB', 8]], spin: [3, 40, 4], ctrl: 1.7, inv: 1, trail: 'hF', hits: [{ f: [4, 40], x: [-96, 96], y: [40, 125], dmg: 7, kx: 4, ky: 8, stop: 3, multi: 10, both: 1 }] },
  // ----- enemies (long, readable wind-ups) -----
  ejab: { k: [['jabW', 13, 'o'], ['jab', 2, 'b'], ['jab', 6], ['idle', 12]], lunge: [12, 2.5], trail: 'hF', hits: [{ f: [14, 18], x: [0, 70], y: [50, 112], dmg: 6, kx: 1.5, stun: 16, stop: 4 }] },
  ekick: { k: [['hikickW', 15, 'o'], ['hikick', 2, 'b'], ['hikick', 7], ['idle', 14]], lunge: [14, 2.5], trail: 'tF', hits: [{ f: [16, 21], x: [0, 90], y: [55, 135], dmg: 9, kx: 3, ky: 5, stop: 6 }] },
  ecase: { k: [['hammerW', 17, 'o'], ['hammer', 3, 'b'], ['hammer', 9], ['idle', 16]], lunge: [16, 3], trail: 'hF', hits: [{ f: [18, 23], x: [0, 88], y: [0, 135], dmg: 11, kx: 2.6, ky: 5, stop: 7 }] },
  ehammer: { k: [['hammerW', 24, 'o'], ['hammer', 3, 'b'], ['hammer', 10], ['wall1', 18]], lunge: [23, 3], ev: { 26: 'quakeS' }, hits: [{ f: [25, 30], x: [0, 108], y: [0, 135], dmg: 13, kx: 3, ky: 6, stop: 8 }] },
  etackle: { k: [['uppW', 16, 'o'], ['shoulder', 3, 'b'], ['shoulder', 22], ['idle', 14]], lunge: [16, 7.6], keep: 38, hits: [{ f: [17, 39], x: [0, 60], y: [20, 120], dmg: 10, kx: 4.5, ky: 5.5, stop: 7 }] },
  edive: { k: [['uppW', 10, 'o'], ['jumpUp', 4, 'b'], ['jumpUp', 11], ['divekick', 3, 'b'], ['divekick', 90]], hop: [10, 11.5], air: 1, ev: { 25: 'dive' }, trail: 'tF', hits: [{ f: [26, 140], x: [0, 68], y: [-25, 70], dmg: 9, kx: 3.5, ky: 5, stop: 6 }] },
  // ----- bosses -----
  bossSlam: { k: [['hammerW', 22, 'o'], ['hammer', 3, 'b'], ['hammer', 14], ['idleB', 16]], lunge: [21, 3.5], trail: 'hF', ev: { 24: 'shock' }, hits: [{ f: [23, 28], x: [-10, 120], y: [0, 150], dmg: 16, kx: 3.5, ky: 8, stop: 10, heavy: 1, zr: 36 }] },
  bossCharge: { k: [['uppW', 22, 'o'], ['shoulder', 3, 'b'], ['shoulder', 32], ['idleB', 20]], lunge: [22, 9], keep: 54, hits: [{ f: [23, 56], x: [0, 72], y: [10, 150], dmg: 14, kx: 6, ky: 7.5, stop: 9, heavy: 1, zr: 30 }] },
  bossThrow: { k: [['throwW', 16, 'o'], ['palm', 3, 'b'], ['palm', 10], ['idleB', 12]], ev: { 18: 'dumpling' }, hits: [] },
  bossSpin: { k: [['lariat', 14, 'o'], ['lariat', 56], ['idleB', 26]], spin: [14, 70, 4], chase: 2.5, trail: 'hF', hits: [{ f: [14, 70], x: [-110, 110], y: [30, 150], dmg: 9, kx: 4, ky: 6.5, stop: 4, multi: 16, both: 1, zr: 30 }] },
  gfFist: { k: [['crossW', 15, 'o'], ['cross', 2, 'b'], ['cross', 12], ['idle', 10]], ev: { 17: 'goldfist' }, hits: [] },
  gfTele: { k: [['power', 10, 'o'], ['uppW', 9, 'o'], ['upper', 3, 'b'], ['upper', 10], ['fall', 6], ['idle', 12]], ev: { 10: 'tele' }, lunge: [19, 3], hop: [19, 6.5], trail: 'hF', hits: [{ f: [19, 27], x: [-10, 90], y: [10, 190], dmg: 14, kx: 3.5, ky: 10, stop: 10, heavy: 1 }] },
  roar: { k: [['power', 6, 'o'], ['power', 50], ['idle', 8]], ev: { 6: 'roar' }, hits: [], inv: 1 }
};

/* ---------- playable heroes ---------- */
const HEROES = [
  {
    id: 'ryker', cry: 'SPECIAL DELIVERY!!', flex: ['winR', 'upper', 'jab', 'hikick'], name: 'RYKER VOLT', title: 'THE OVERNIGHT EXPRESS', quote: '"Signed, sealed, DELIVERED. To your face."',
    hp: 100, pow: 1, speed: 2.6, jump: 11.5, stats: [3, 3, 3],
    combo: ['jab', 'cross', 'hikick', 'upper'], dash: 'knee', airAtk: 'divekick', spc: 'tornado',
    superName: '1000-PARCEL RUSH', superKata: '千件速達', sup: 'rush', col: '#ffd31a', col2: '#e8323c',
    idle: 'idle', run: 'run', win: 'winR',
    style: mkStyle({ top: '#e8323c', shirt: '#fff', pants: '#26325a', glove: '#ffd31a', shoe: '#f4f4f4', hair: '#2b2540', accent: '#05d9e8', hairStyle: 'spiky', sleeve: 1, deco: 'jacket',
      chains: [{ at: 'neck', ox: 4, oy: -4, n: 13, seg: 8, w0: 10, w1: 5, col: '#ffd31a' }] })
  },
  {
    id: 'hana', cry: 'ARE YOU READYYY?!', flex: ['winH', 'hikick', 'encore', 'sidekick'], name: 'HANA "NEON" KISARAGI', title: 'IDOL DRUMMER, OFF HER LEASH', quote: '"This next one goes out to your RIBS!"',
    hp: 85, pow: 0.92, speed: 3.2, jump: 12.5, stats: [2, 5, 3],
    combo: ['sidekick', 'hikickH', 'spinkick', 'axe'], dash: 'dropkick', airAtk: 'divekick', spc: 'split',
    superName: 'FINAL ENCORE', superKata: '最終公演', sup: 'encore', col: '#ff4fa3', col2: '#22d3ee',
    idle: 'idleH', run: 'nrun', win: 'winH',
    style: mkStyle({ scale: 0.93, wT: 12.5, wB: 10, wA: 5.6, wL: 7.6, headR: 15, blush: 'rgba(255,90,140,0.45)', skin: '#ffd9bf', top: '#ff4fa3', shirt: '#fff', pants: '#22d3ee', shorts: 1, glove: '#fff', shoe: '#ffe14a', hair: '#3ad6c5', accent: '#ff4fa3',
      hairStyle: 'twin', sleeve: 0, deco: 'tank', eyeCol: '#b0236a',
      chains: [{ at: 'head', ox: -0.8, oy: -0.8, n: 10, seg: 7, w0: 10, w1: 3, col: '#3ad6c5' }, { at: 'head', ox: -0.25, oy: -1.1, n: 9, seg: 7, w0: 9, w1: 3, col: '#2bb8a8' }] })
  },
  {
    id: 'brisket', cry: 'DINNER. IS. SERVED.', flex: ['winB', 'power', 'palm', 'lariat'], name: 'GRANDMASTER BRISKET', title: 'PITMASTER. LOW & SLOW. MOSTLY SLOW.', quote: '"You been MARINATING in bad decisions, son."',
    hp: 130, pow: 1.22, speed: 2.05, jump: 10.5, stats: [5, 1, 4],
    combo: ['palm', 'hook', 'butt', 'hammer'], dash: 'shoulder', airAtk: 'splash', spc: 'lariat',
    superName: 'MEAT METEOR', superKata: '肉流星', sup: 'meteor', col: '#ff9a1a', col2: '#b3261e',
    idle: 'idleB', run: 'brun', win: 'winB',
    style: mkStyle({ scale: 1.26, wT: 21, wB: 17, wA: 9.6, wL: 11.2, headR: 13.5, skin: '#c98a5e', top: '#b3261e', shirt: '#f4f0e6', pants: '#3a2a22', glove: '#ff9a1a', shoe: '#1c1c22', hair: '#d92b3a', accent: '#fff',
      hairStyle: 'bandana', beard: '#f0ece0', brow: '#f0ece0', sleeve: 0, deco: 'belly',
      chains: [{ at: 'head', ox: -1.0, oy: -0.3, n: 5, seg: 6, w0: 6, w1: 4, col: '#d92b3a' }] })
  }
];

/* ---------- the opposition ---------- */
const ENEMIES = {
  punk: { name: 'SKID', hp: 30, speed: 1.5, pow: 1, score: 200, range: 62, attacks: ['ejab', 'ejab', 'ekick'], cd: [50, 120],
    style: mkStyle({ top: '#2a2a3a', pants: '#3b4a7a', glove: '#9a9ab0', shoe: '#111', hair: '#7dff6b', accent: '#7dff6b', hairStyle: 'mohawk', sleeve: 0, deco: 'tank', skin: '#e8b48a' }) },
  punk2: { name: 'SKIDMARK', hp: 44, speed: 1.9, pow: 1.2, score: 350, range: 62, attacks: ['ejab', 'ekick', 'ekick'], cd: [35, 90],
    style: mkStyle({ top: '#4a1030', pants: '#222', glove: '#ffd31a', shoe: '#111', hair: '#ff2a6d', accent: '#ff2a6d', hairStyle: 'mohawk', sleeve: 0, deco: 'tank', skin: '#c98a5e' }) },
  suit: { name: 'MR. OVERTIME', hp: 42, speed: 1.4, pow: 1, score: 300, range: 70, attacks: ['ecase'], cd: [60, 130], ai: 'charger', quirk: 'twitch',
    style: mkStyle({ top: '#3a4660', pants: '#2c364c', glove: '#f2c49b', shoe: '#111', hair: '#1a1a22', accent: '#d92b3a', hairStyle: 'slick', sleeve: 2, deco: 'suit', eyes: 'glasses', prop: 'case',
      chains: [{ at: 'head', ox: -0.95, oy: -0.35, n: 6, seg: 6, w0: 5, w1: 4, col: '#d92b3a' }] }) },
  mime: { name: 'SILENT PIERRE', hp: 40, speed: 1.2, pow: 1, score: 400, range: 86, attacks: ['ehammer'], cd: [70, 140], ai: 'mime', idle: 'wall',
    style: mkStyle({ skin: '#f6f6f6', top: '#fafafa', pants: '#15151c', glove: '#fff', shoe: '#15151c', hair: '#15151c', accent: '#15151c', hairStyle: 'beret', sleeve: 2, deco: 'stripes', eyes: 'mime', prop: 'mallet', scale: 0.98 }) },
  pigeon: { name: 'EL PALOMO', hp: 34, speed: 2, pow: 1, score: 350, range: 60, attacks: ['ejab'], cd: [50, 110], ai: 'jumper', feathers: 1, quirk: 'bob',
    style: mkStyle({ skin: '#9aa3b8', top: '#8a93a8', pants: '#7a3ad9', glove: '#ff8a1a', shoe: '#ff8a1a', hairStyle: 'bald', eyes: 'pigeon', accent: '#ffd31a', sleeve: 0, deco: 'bare', scale: 0.96,
      chains: [{ at: 'neck', ox: 5, oy: -2, n: 7, seg: 8, w0: 12, w1: 28, col: '#d92b3a', g: 0.2 }] }) },
  bouncer: { name: 'TINY', hp: 95, speed: 1.1, pow: 1.3, score: 800, range: 76, attacks: ['ecase', 'etackle'], cd: [70, 130], armor: 4, heavy: 1,
    style: mkStyle({ scale: 1.32, wT: 21, wB: 18, wA: 9.5, wL: 11, headR: 12, top: '#1c1c26', shirt: '#fff', pants: '#1c1c26', glove: '#8a5a3c', shoe: '#111', hairStyle: 'bald', eyes: 'shades', sleeve: 1, deco: 'belly', skin: '#8a5a3c', accent: '#fff' }) },
  // bosses
  dj: { name: 'DJ SUBWOOFER', tag: 'HE DROPS THE BASS. ON YOU.', hp: 300, speed: 1.5, pow: 1.1, score: 5000, range: 90, boss: 1, armor: 5, heavy: 1, cd: [50, 100], idle: 'idleB', notes: 1, quirk: 'groove',
    style: mkStyle({ scale: 1.5, wT: 21, wB: 17, wA: 9.8, wL: 11.5, headR: 12.5, skin: '#8a5a3c', top: '#7a1ad9', shirt: '#05d9e8', pants: '#5a12a8', glove: '#fff', shoe: '#ffd31a', hair: '#111', accent: '#05d9e8', hairStyle: 'phones', eyes: 'shades', sleeve: 2, deco: 'jacket',
      chains: [{ at: 'neck', ox: -6, oy: 6, n: 5, seg: 6, w0: 5, w1: 7, col: '#ffd31a', g: 0.5, wind: 0.05 }] }) },
  gyozilla: { name: 'CHEF GYOZILLA', tag: 'THE SECRET INGREDIENT IS VIOLENCE.', hp: 380, speed: 1.3, pow: 1.15, score: 8000, range: 100, boss: 1, armor: 5, heavy: 1, cd: [45, 95], idle: 'idleB',
    style: mkStyle({ scale: 1.58, wT: 22, wB: 19, wA: 10, wL: 11.5, headR: 12.5, skin: '#e8b48a', top: '#f4f4f4', shirt: '#d92b3a', pants: '#3c3c4a', glove: '#e8b48a', shoe: '#111', hair: '#222', accent: '#d92b3a', hairStyle: 'chef', beard: '#2a2226', sleeve: 1, deco: 'belly', prop: 'cleaver' }) },
  goldfist: { name: 'CHAIRMAN GOLDFIST', tag: 'YOUR FUN IS NOW A SUBSCRIPTION.', hp: 480, speed: 2.1, pow: 1.2, score: 20000, range: 84, boss: 1, armor: 6, heavy: 1, cd: [35, 80],
    style: mkStyle({ scale: 1.3, wT: 17, wB: 12.5, wA: 7.6, wL: 9.2, top: '#e0b030', pants: '#c9971a', glove: '#ffe14a', shoe: '#fff', hair: '#fff3c0', accent: '#15101f', hairStyle: 'pomp', eyes: 'shades', sleeve: 2, deco: 'suit',
      chains: [{ at: 'neck', ox: 5, oy: -2, n: 8, seg: 9, w0: 14, w1: 36, col: '#a3172b', g: 0.2 }] }) }
};

/* ---------- stages: [type, side(-1 left / 1 right / 0 sky), z, delay] ---------- */
const STAGE_DATA = [
  {
    name: 'NEON GUTTER', sub: 'It is always raining. It is always 2 A.M.', tune: 's1', len: 3700, boss: 'dj',
    waves: [
      { at: 180, s: [['punk', 1, 70, 0], ['punk', 1, 150, 40], ['punk', -1, 110, 130]] },
      { at: 800, s: [['punk', -1, 60, 0], ['suit', 1, 120, 20], ['punk', 1, 160, 90], ['suit', 1, 60, 240]] },
      { at: 1420, s: [['mime', 1, 100, 0], ['mime', -1, 150, 40], ['punk', 1, 50, 160], ['pigeon', 0, 110, 220], ['punk2', -1, 90, 380]] },
      { at: 2060, s: [['pigeon', 0, 60, 0], ['pigeon', 0, 150, 30], ['suit', -1, 100, 60], ['punk2', 1, 130, 200], ['mime', 1, 70, 320], ['punk', -1, 160, 330]] },
      { at: 2740, boss: 1, s: [['dj', 1, 100, 0], ['punk', -1, 60, 700], ['punk', 1, 150, 760], ['punk2', -1, 120, 1500]] }
    ],
    props: [['vend', 560, 22, 'ramen'], ['trash', 1180, 40, 'cash'], ['trash', 1240, 26, null], ['vend', 1900, 22, 'ramen'], ['trash', 2560, 34, 'cash'], ['vend', 3240, 22, 'cake']]
  },
  {
    name: 'MIDNIGHT NOODLE MARKET', sub: 'Every stall is open. Every stall is suspicious.', tune: 's2', len: 3900, boss: 'gyozilla',
    waves: [
      { at: 180, s: [['suit', 1, 70, 0], ['suit', -1, 140, 40], ['punk2', 1, 110, 100], ['pigeon', 0, 90, 260]] },
      { at: 820, s: [['bouncer', 1, 100, 0], ['punk', -1, 60, 60], ['punk', 1, 160, 150], ['mime', -1, 120, 300]] },
      { at: 1480, s: [['pigeon', 0, 60, 0], ['pigeon', 0, 110, 25], ['pigeon', 0, 160, 50], ['suit', -1, 90, 150], ['mime', 1, 130, 200], ['punk2', 1, 70, 400]] },
      { at: 2160, s: [['bouncer', 1, 70, 0], ['punk2', -1, 120, 40], ['punk2', 1, 160, 120], ['bouncer', -1, 130, 280], ['suit', 1, 60, 420]] },
      { at: 2940, boss: 1, s: [['gyozilla', 1, 100, 0], ['mime', -1, 70, 800], ['mime', 1, 150, 860], ['pigeon', 0, 100, 1600], ['pigeon', 0, 60, 1640]] }
    ],
    props: [['cart', 520, 24, 'ramen'], ['crate', 1100, 30, 'cash'], ['crate', 1150, 46, null], ['cart', 1840, 24, 'ramen'], ['crate', 2500, 30, 'cash'], ['cart', 2700, 24, 'ramen'], ['cart', 3400, 24, 'cake']]
  },
  {
    name: 'GOLDFIST TOWER — ROOFTOP', sub: 'Floor 404. Fun not found.', tune: 's3', len: 4100, boss: 'goldfist',
    waves: [
      { at: 180, s: [['punk2', 1, 60, 0], ['punk2', -1, 150, 30], ['suit', 1, 110, 90], ['suit', -1, 80, 200], ['pigeon', 0, 120, 300]] },
      { at: 860, s: [['bouncer', 1, 100, 0], ['mime', -1, 60, 40], ['mime', 1, 160, 80], ['pigeon', 0, 80, 220], ['pigeon', 0, 140, 250]] },
      { at: 1540, s: [['suit', 1, 60, 0], ['suit', 1, 110, 20], ['suit', 1, 160, 40], ['bouncer', -1, 100, 160], ['punk2', -1, 140, 320], ['punk2', 1, 70, 380]] },
      { at: 2240, s: [['bouncer', 1, 70, 0], ['bouncer', -1, 140, 60], ['pigeon', 0, 100, 150], ['pigeon', 0, 60, 180], ['mime', 1, 120, 320], ['punk2', -1, 90, 420], ['punk2', 1, 150, 470]] },
      { at: 3140, boss: 1, s: [['goldfist', 1, 100, 0], ['suit', -1, 70, 900], ['suit', 1, 150, 940], ['bouncer', -1, 110, 1900]] }
    ],
    props: [['vase', 540, 24, 'ramen'], ['bust', 1200, 26, 'cash'], ['vase', 1260, 40, 'cash'], ['bust', 1960, 26, 'ramen'], ['vase', 2600, 26, 'ramen'], ['bust', 2900, 30, 'cash'], ['vase', 3560, 24, 'cake']]
  }
];
const LINES = {
  punk: ['nice scarf, NERD', 'this is OUR gutter', 'fun costs extra, pal', 'i have a mohawk AND a plan'],
  punk2: ['i am the UPGRADED one', 'skid was my intern', 'hold still, it is my first day'],
  suit: ['per my last email—', "let's circle back. TO YOUR FACE", "I haven't slept since Q2", 'this meeting could have been a punch', 'do you have a moment to SYNERGIZE'],
  mime: ['…', '. . . !', '(gestures rudely)', '( is trapped. emotionally. )'],
  pigeon: ['COO.', 'COO COO, AMIGO', '¡PALOMA POWER!', 'got any bread?'],
  bouncer: ["you're not on the list", 'the list is just my name', 'no shirt, no shoes, NO MERCY'],
  dj: ['MAKE SOME NOOOISE', 'this next one is called PAIN', 'wub wub wub', 'requests cost extra'],
  gyozilla: ['YOU WANT FRIES WITH THAT BEATING?', '86 THE HERO!', "CHEF'S KISS… OF DEATH", 'WHO ORDERED THE KNUCKLE SANDWICH'],
  goldfist: ['I OWN THIS ROOF. AND GRAVITY.', 'PUNCHING ME IS A PAID FEATURE', 'SYNERGY!!', 'MY LAWYERS ARE ALSO FISTS']
};
const STORY = ['THE GOLDFIST CORPORATION HAS TRADEMARKED THE WORD "FUN".', 'EVERY LAUGH NOW COSTS $4.99. HIGH-FIVES ARE A PREMIUM FEATURE.', 'THREE HEROES REFUSE TO READ THE TERMS AND CONDITIONS.'];
const RANKS = [[3, 'NICE!', '#fff'], [6, 'SPICY!', '#ffd31a'], [10, 'RADICAL!!', '#ff9a1a'], [16, 'OUTRAGEOUS!!', '#ff4fa3'], [24, 'ILLEGAL!!!', '#ff2a2a'], [36, 'ANIME AS HECK!!!', '#b967ff']];
