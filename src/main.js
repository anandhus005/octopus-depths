import Lenis from 'lenis';
import './style.css';
const $ = s => document.querySelector(s), cv = $('#c'), ctx = cv.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, SW = reduce ? 0 : 1;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { v = clamp((v - a) / (b - a)); return v * v * (3 - 2 * v); };
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => ((v + (B[i] - v) * t) | 0).toString(16).padStart(2, '0')).join(''); };
let seed = 7; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

let W, H, R, mob, dpr, meterH = 1;
function resize() {
  mob = innerWidth < 760; dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 2);
  W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  R = Math.min(W, H) * (mob ? .13 : .105); meterH = $('#meter').clientHeight;
}
addEventListener('resize', resize); resize();

const lenis = new Lenis({ lerp: reduce ? 1 : .07 });
let p = 0, vel = 0, sv = 0;
lenis.on('scroll', e => { p = clamp(e.progress || 0); vel = e.velocity || 0; });

// ---- pointer / behaviour inputs ----
const P = { x: W / 2, y: H / 2, sx: W / 2, sy: H / 2, speed: 0, last: 0, down: 0, moved: false };
const o = { x: W / 2, y: H * .5, vx: 0, vy: 0, ang: 0, pulse: 0, sq: 0, hide: 0, react: 0, state: 'IDLE', bl: 0, nb: 3 };
const bubs = [], inks = [];
let t = 0;
function bubble(x, y, n = 1) { for (let i = 0; i < n; i++) { if (bubs.length > (mob ? 40 : 90)) bubs.shift(); bubs.push({ x: x + (Math.random() - .5) * 20, y, r: 1.5 + Math.random() * 6, v: .5 + Math.random() * 1.5, ph: Math.random() * 6 }); } }
addEventListener('pointermove', e => { P.speed = Math.hypot(e.clientX - P.x, e.clientY - P.y); P.x = e.clientX; P.y = e.clientY; P.last = t; P.moved = true; });
addEventListener('pointerdown', e => {
  P.x = e.clientX; P.y = e.clientY; P.last = t; P.down = t; P.moved = true; bubble(P.x, P.y, 4);
  const d = Math.hypot(e.clientX - o.x, e.clientY - o.y) || 1;
  o.react = 1; o.vx += (e.clientX - o.x) / d * 9; o.vy += (e.clientY - o.y) / d * 9;
  for (let i = 0; i < 6; i++) inks.push({ x: o.x + (Math.random() - .5) * R, y: o.y + R * .6, r: R * .3, a: .5, vx: -o.vx * .1 + (Math.random() - .5), vy: -o.vy * .1 + (Math.random() - .5) });
  bubble(o.x, o.y, 10);
});
addEventListener('pointerup', () => { P.down = 0; });
addEventListener('pointercancel', () => { P.down = 0; });

// ---- palette / assets ----
const stops = ['#8fe3ea', '#3fb7c9', '#1f86a8', '#14607f', '#0c3a5c', '#08233f', '#050f26', '#02060f'];
const wcol = q => { q = clamp(q) * 7; const i = Math.min(6, q | 0); return mix(stops[i], stops[i + 1], q - i); };

const skin = mk(256, 256); { const x = skin.getContext('2d'); for (let i = 0; i < 28; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '125,85,140' : '255,205,190'},${.05 + rnd() * .09})`; x.beginPath(); x.ellipse(rnd() * 256, rnd() * 256, 10 + rnd() * 34, 8 + rnd() * 26, rnd() * 3, 0, 7); x.fill(); } for (let i = 0; i < 1500; i++) { const k = rnd(); x.fillStyle = k < .45 ? `rgba(115,62,105,${.08 + rnd() * .25})` : k < .75 ? `rgba(255,226,212,${.1 + rnd() * .2})` : `rgba(70,35,65,${.25 + rnd() * .15})`; x.beginPath(); x.ellipse(rnd() * 256, rnd() * 256, k > .75 ? .5 + rnd() * .5 : 1 + rnd() * 3.5, k > .75 ? .5 + rnd() * .5 : 1 + rnd() * 3, rnd() * 3, 0, 7); x.fill(); } }
const caus = mk(128, 128); { const x = caus.getContext('2d'), im = x.createImageData(128, 128); for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const u = i / 128 * 6.2832, w = j / 128 * 6.2832, a = Math.sin(u * 2 + Math.sin(w * 3) * 1.6), b = Math.sin(w * 2 + Math.sin(u * 3) * 1.6), v = Math.pow(1 - Math.abs(a), 9) + Math.pow(1 - Math.abs(b), 9), k = (j * 128 + i) * 4; im.data[k] = 210; im.data[k + 1] = 250; im.data[k + 2] = 255; im.data[k + 3] = Math.min(255, v * 150); } x.putImageData(im, 0, 0); }
const spr = c => { const s = mk(64, 64), x = s.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${c},1)`); g.addColorStop(.25, `rgba(${c},.4)`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return s; };
const GC = spr('95,242,224'), GP = spr('170,120,255'), GW = spr('255,244,225');
const skinPat = ctx.createPattern(skin, 'repeat'), causPat = ctx.createPattern(caus, 'repeat');

const pal = ['#c97d8a', '#c98a63', '#8e7aa8', '#b9a58a', '#8a3e48', '#4f9a98'];
function rock() { const c = mk(300, 220), x = c.getContext('2d'), n = 16, ph = rnd() * 6; x.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI + Math.PI, r = 1 + .18 * Math.sin(i * 2.3 + ph) + rnd() * .12, px = 150 + Math.cos(a) * 135 * r, py = 205 + Math.sin(a) * 170 * r * .85; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); const g = x.createLinearGradient(0, 30, 0, 210); g.addColorStop(0, '#6a8587'); g.addColorStop(.5, '#35505a'); g.addColorStop(1, '#16262f'); x.fillStyle = g; x.fill(); x.clip(); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${rnd() * .1})`; x.beginPath(); x.arc(rnd() * 300, 40 + rnd() * 180, rnd() * 4 + 1, 0, 7); x.fill(); } for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${60 + rnd() * 40 | 0},${110 + rnd() * 50 | 0},${90 + rnd() * 40 | 0},${.06 + rnd() * .14})`; x.beginPath(); x.ellipse(rnd() * 300, 110 + rnd() * 100, 8 + rnd() * 24, 4 + rnd() * 10, 0, 0, 7); x.fill(); } const rl = x.createLinearGradient(0, 30, 0, 110); rl.addColorStop(0, 'rgba(210,245,245,.2)'); rl.addColorStop(1, 'rgba(210,245,245,0)'); x.fillStyle = rl; x.fillRect(0, 0, 300, 120); return c; }
function coral() { const c = mk(300, 300), x = c.getContext('2d'), col = pal[rnd() * 6 | 0]; x.lineCap = 'round'; (function br(px, py, a, l, w, d) { if (d > 5 || l < 6) return; const nx = px + Math.cos(a) * l, ny = py + Math.sin(a) * l; x.strokeStyle = 'rgba(20,10,30,.3)'; x.lineWidth = w + 3; x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke(); x.strokeStyle = mix(col, '#2a1a30', .15 + d * .04); x.lineWidth = w; x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke(); x.strokeStyle = 'rgba(255,235,225,.22)'; x.lineWidth = Math.max(1, w * .28); x.beginPath(); x.moveTo(px - w * .2, py); x.lineTo(nx - w * .2, ny); x.stroke(); if (d > 3) { x.fillStyle = 'rgba(255,225,205,.6)'; x.beginPath(); x.arc(nx, ny, w * .7, 0, 7); x.fill(); } const k = 2 + (rnd() < .4); for (let i = 0; i < k; i++) br(nx, ny, a + (rnd() - .5) * 1.3, l * (.68 + rnd() * .15), w * .7, d + 1); })(150, 295, -Math.PI / 2, 60, 16, 0); return c; }
function soft() { const c = mk(300, 300), x = c.getContext('2d'), col = pal[rnd() * 6 | 0]; x.lineCap = 'round'; for (let i = 0; i < 8; i++) { const bx = 90 + rnd() * 120, tx = bx + (rnd() - .5) * 140, ty = 60 + rnd() * 110; x.strokeStyle = mix(col, '#2a1a30', .2); x.lineWidth = 3 + rnd() * 3; x.beginPath(); x.moveTo(bx, 298); x.quadraticCurveTo(bx + (rnd() - .5) * 60, (298 + ty) / 2, tx, ty); x.stroke(); for (let k = 0; k < 7; k++) { const u = .35 + k / 10; x.fillStyle = 'rgba(255,225,210,.55)'; x.beginPath(); x.arc(lerp(bx, tx, u * u) + (rnd() - .5) * 8, lerp(298, ty, u), 2 + rnd() * 2, 0, 7); x.fill(); } } return c; }
function fan() { const c = mk(300, 300), x = c.getContext('2d'), col = rnd() < .5 ? '184,86,120' : '200,130,70'; x.lineWidth = 1.6; for (let i = 0; i <= 28; i++) { const a = -Math.PI / 2 + (i / 28 - .5) * 2.1; x.strokeStyle = `rgba(${col},.75)`; x.beginPath(); x.moveTo(150, 295); x.quadraticCurveTo(150 + Math.sin(a + 1.57) * 20, 200, 150 + Math.cos(a) * 190 * (.8 + .2 * Math.sin(i * 1.7)), 295 + Math.sin(a) * 250); x.stroke(); } for (let r = .3; r < 1; r += .12) { x.strokeStyle = `rgba(${col},.35)`; x.beginPath(); x.arc(150, 295, 250 * r, -Math.PI / 2 - 1.05, -Math.PI / 2 + 1.05); x.stroke(); } return c; }
function sponge() { const c = mk(300, 300), x = c.getContext('2d'), col = ['#b9906a', '#8e7aa8', '#c97d8a', '#8f6b58'][rnd() * 4 | 0]; for (let i = 0; i < 5; i++) { const x0 = 70 + i * 42 + rnd() * 16, h = 80 + rnd() * 120, w = 20 + rnd() * 14, g = x.createLinearGradient(x0 - w, 0, x0 + w, 0); g.addColorStop(0, mix(col, '#1a1228', .5)); g.addColorStop(.4, col); g.addColorStop(1, mix(col, '#1a1228', .6)); x.fillStyle = g; x.beginPath(); x.moveTo(x0 - w, 298); x.lineTo(x0 - w * .85, 298 - h); x.ellipse(x0, 298 - h, w * .85, w * .35, 0, Math.PI, 2 * Math.PI); x.lineTo(x0 + w, 298); x.fill(); x.fillStyle = 'rgba(20,10,25,.7)'; x.beginPath(); x.ellipse(x0, 298 - h, w * .7, w * .25, 0, 0, 7); x.fill(); } return c; }
function grass() { const c = mk(300, 300), x = c.getContext('2d'); x.lineCap = 'round'; for (let i = 0; i < 26; i++) { const bx = 40 + rnd() * 220, h = 80 + rnd() * 150, sw = (rnd() - .5) * 90; x.strokeStyle = `rgba(${50 + rnd() * 30 | 0},${120 + rnd() * 50 | 0},${95 + rnd() * 40 | 0},.85)`; x.lineWidth = 2 + rnd() * 3; x.beginPath(); x.moveTo(bx, 298); x.quadraticCurveTo(bx + sw * .3, 298 - h * .6, bx + sw, 298 - h); x.stroke(); } return c; }
const V = { rock: [0, 1, 2, 3].map(rock), coral: [0, 1, 2, 3, 4].map(coral), soft: [0, 1, 2].map(soft), fan: [0, 1, 2].map(fan), sponge: [0, 1, 2].map(sponge), grass: [0, 1, 2].map(grass) };
const bk = new Map(); const bake = (img, fl, pad = 24) => { const key = fl + (img._i || (img._i = Math.random())); if (!bk.has(key)) { const c = mk(img.width + pad * 2, img.height + pad * 2), x = c.getContext('2d'); x.filter = fl; x.drawImage(img, pad, pad); bk.set(key, c); } return bk.get(key); };
const props = [], TY = ['rock', 'coral', 'coral', 'soft', 'fan', 'sponge', 'grass'];
for (let i = 0; i < 60; i++) {
  const fg = i >= 54, d = fg ? .05 + rnd() * .9 : .07 + i / 54 * .9, deep = d > .42; if (deep && i % 2 && !fg) continue;
  const type = deep ? (rnd() < .7 ? 'rock' : 'fan') : TY[rnd() * 7 | 0], img = V[type][rnd() * V[type].length | 0], z = fg ? 1.6 + rnd() * .35 : .35 + rnd() * .85;
  const far = z < .7, near = z > 1.25, im = far ? bake(img, 'blur(2px) saturate(.45) brightness(.85)') : near ? bake(img, 'blur(5px) brightness(.45) saturate(.7)') : img;
  props.push({ im, pad: far || near ? 24 : 0, side: i % 2 ? 1 : -1, d, z, sc: (fg ? .9 : .5) + rnd() * .8, fl: rnd() < .5 ? -1 : 1, ang: .8 + rnd() * .6, ph: rnd() * 6 });
}
props.sort((a, b) => a.z - b.z);
const kelp = Array.from({ length: 16 }, (_, i) => ({ side: i % 2 ? 1 : -1, d: .36 + rnd() * .2, z: .6 + rnd() * .9, h: 260 + rnd() * 260, ph: rnd() * 6, w: 5 + rnd() * 6 }));

// ---- creatures ----
const schools = [
  { d: .2, n: mob ? 14 : 26, c: ['#d2ad52', '#5aa6c8'], sz: 1, eye: 0 },
  { d: .45, n: mob ? 12 : 22, c: ['#aebfc8', '#8ea3b0'], sz: 1.2, eye: 0 },
  { d: .76, n: mob ? 8 : 14, c: ['#27344d', '#1c2640'], sz: 1.1, eye: 1 }
].map((s, k) => ({ ...s, k, fish: Array.from({ length: s.n }, () => ({ x: Math.random() * innerWidth, oy: (Math.random() - .5) * 200, vx: 1, vy: 0, ox: (Math.random() - .5) * 190, oyy: (Math.random() - .5) * 90, ph: Math.random() * 6, s: (.7 + Math.random() * .6) * s.sz, ci: Math.random() < .5 ? 0 : 1 })) }));
schools.push((() => { const s = { d: .33, n: mob ? 14 : 24, c: ['#b9d2dc', '#9fc0cf'], sz: .5, eye: 0, al: .65, k: 3 }; s.fish = Array.from({ length: s.n }, () => ({ x: Math.random() * innerWidth, oy: (Math.random() - .5) * 160, vx: 1, vy: 0, ox: (Math.random() - .5) * 150, oyy: (Math.random() - .5) * 70, ph: Math.random() * 6, s: (.7 + Math.random() * .6) * s.sz, ci: Math.random() < .5 ? 0 : 1 })); return s; })());
schools.forEach(s => s.g = s.c.map(c => { const g = ctx.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, mix(c, '#0a1a2a', .5)); g.addColorStop(.55, c); g.addColorStop(1, mix(c, '#ffffff', .6)); return g; }));
const jellies = [{ d: .46, x: .7, sz: 1, c: '210,170,235', bio: 0 }, { d: .58, x: .25, sz: 1.3, c: '190,215,255', bio: 0 }, { d: .7, x: .72, sz: 1.1, c: '95,242,224', bio: 1 }, { d: .82, x: .3, sz: 1.5, c: '170,120,255', bio: 1 }].map((j, i) => ({ ...j, ph: i * 1.7, ox: 0, oy: 0, sx: 0, sy: 0 }));
const snow = Array.from({ length: mob ? 60 : 170 }, () => ({ x: Math.random(), y: Math.random() * 5000, z: .3 + Math.random() * 1.2, r: .6 + Math.random() * 1.8, ox: 0, oy: 0 }));
const bio = Array.from({ length: mob ? 18 : 44 }, () => ({ x: Math.random(), y: Math.random() * 5000, z: .4 + Math.random(), ph: Math.random() * 9, c: Math.random() < .25 ? 1 : 0 }));

const N = mob ? 11 : 16, arms = Array.from({ length: 8 }, () => Array.from({ length: N }, () => ({ x: o.x, y: o.y, px: o.x, py: o.y })));
const ap = arms.map((_, i) => ({ l: .88 + ((i * 37) % 11) / 11 * .3, k: .8 + ((i * 17) % 5) * .12, w: .14 + ((i * 53) % 7) / 7 * .18, f: .85 + ((i * 29) % 5) * .1, ph: i * 1.9 + ((i * 13) % 7) }));

// ---- zones / HUD ----
const Z = [['Ocean Surface', 'The ocean is alive', 'Sunlight breaks into ten thousand pieces overhead. Beneath it, a different world is waking up.', ''],
['Shallow Reef', 'Beneath the surface', 'Warm, bright water. Schools turn as one — and a curious eight-armed stranger follows your hand.', 'Zone 02'],
['Coral Zone', 'Discover the unseen', 'Every crevice shelters something that is watching you back.', 'Zone 03'],
['Kelp Forest', 'Kelp forest', 'Towering fronds sway in a current you can only read through them.', 'Zone 04'],
['Deep Ocean', 'Where the color fades', 'Sunlight becomes a rumour. The colors drain out first.', 'Zone 05'],
['Twilight Zone', 'Unknown territory', 'Here the only light left is the kind that life makes for itself.', 'Zone 06 · Unknown territory'],
['Bioluminescent Zone', 'Life in the dark', 'Glowing drifters pulse in slow, silent conversation.', 'Zone 07'],
['The Abyss', 'The abyss', 'Stay a while. Something here has been waiting to meet you.', 'Zone 08']];
const el = { zn: $('#zn'), zl: $('#zl'), h: $('#h'), sub: $('#sub'), tag: $('#tag'), mkv: $('#mkv'), mk: $('#mk'), big: $('#big'), temp: $('#temp'), vis: $('#vis'), pr: $('#pr'), lt: $('#lt'), co: $('#co'), bh: $('#bh'), bar: $('#barf'), hint: $('#hint'), up: $('#up') };
const set = (e, v) => { if (e._v !== v) { e.textContent = v; e._v = v; } };
let curZ = -1;
$('#up').onclick = () => lenis.scrollTo(0, { duration: 4 });
function hud() {
  const z = Math.min(7, (p * 8) | 0);
  if (z !== curZ) { curZ = z; set(el.zn, '0' + (z + 1)); set(el.zl, Z[z][0]); [el.tag, el.h, el.sub].forEach((e, i) => { e.textContent = Z[z][[3, 1, 2][i]]; e.classList.remove('rv'); void e.offsetWidth; e.classList.add('rv'); }); }
  const m = Math.round(260 * Math.pow(p, 1.3)), ms = String(m).padStart(3, '0');
  set(el.big.firstChild, ms); set(el.mkv, ms + ' M');
  el.mk.style.transform = `translate3d(0,${(p * meterH).toFixed(1)}px,0)`;
  set(el.temp, (4 + 22 * Math.exp(-m / 70)).toFixed(0) + ' °C'); set(el.vis, (2 + 38 * Math.exp(-m / 60)).toFixed(0) + ' m');
  set(el.pr, (1 + m / 10).toFixed(1) + ' atm'); set(el.lt, Math.round(100 * Math.exp(-m / 35)) + ' %');
  set(el.co, `9.${9312 + (p * 400 | 0)}°N 76.2673°E`); set(el.bh, o.state);
  el.bar.style.transform = `scaleX(${p.toFixed(4)})`; el.hint.style.opacity = p > .03 ? 0 : 1; el.up.classList.toggle('on', p > .96);
}
const ring = $('#ring');

// ---- simulation ----
const wy = d => H * .5 + (d - p) * H * 7;
let q = 1, slow = 0, camX = 0, camY = 0, cvx = 0, cvy = 0;
function update(dt) {
  const idle = t - P.last, dp = ss(0, .95, p);
  P.sx += (P.x - P.sx) * .12; P.sy += (P.y - P.sy) * .12; P.speed *= .9;
  let tx = P.sx, ty = P.sy + (mob ? -R * 1.6 : 0);
  if (idle > 4 && t > 4) { tx = W * (.5 + Math.sin(t * .2) * .22); ty = H * (.5 + Math.sin(t * .31) * .12); }
  if (idle > 9) ty += R * .8;
  if (idle > 1.5) { tx += Math.sin(t * .6) * R * .25 * SW; ty += Math.sin(t * .9) * R * .15 * SW; }
  let foc = null, fd = 230;
  for (const j of jellies) { const d = Math.hypot(j.sx - o.x, j.sy - o.y); if (d < fd) { fd = d; foc = j; } }
  const spd = Math.hypot(o.vx, o.vy);
  o.hide = P.down && t - P.down > .5 ? Math.min(1, o.hide + dt * 2) : Math.max(0, o.hide - dt * 1.5);
  o.react = Math.max(0, o.react - dt * .8);
  const k = .004 * clamp(1 + P.speed * .03, 1, 2.2) * (idle > 9 ? .5 : 1) * (foc && spd < 3 ? .5 : 1) * (1 - o.hide * .9);
  o.vx = o.vx * .945 + (tx - o.x) * k; o.vy = o.vy * .945 + (ty - o.y) * k;
  const sp = Math.hypot(o.vx, o.vy), cap = 15; if (sp > cap) { o.vx *= cap / sp; o.vy *= cap / sp; }
  o.x += o.vx; o.y += o.vy;
  o.state = o.hide > .5 ? 'HIDING' : o.react > .3 ? 'STARTLED' : foc && spd < 3 ? 'INSPECTING' : spd > 4 ? 'SWIMMING' : idle < 4 && P.moved ? 'FOLLOWING' : idle > 9 ? 'RESTING' : 'IDLE';
  o.pulse += dt * (1.3 + spd * .45) * SW; o.sq = Math.sin(o.pulse * 2) * (.04 + Math.min(.1, spd * .01));
  o.ang += (clamp(o.vx * .05, -.6, .6) - o.ang) * .08;
  if (t > o.nb) { o.bl = 1; o.nb = t + 2 + Math.random() * 4; } o.bl *= .84;
  o.foc = foc && fd < 230 ? foc : null;
  const L0 = R * .2, ca = Math.cos(o.ang), sa = Math.sin(o.ang), fs = Math.min(1, spd * .15), pls = Math.sin(o.pulse * 2);
  arms.forEach((ch, i) => {
    const ar = ap[i], L = L0 * ar.l, lx = (i - 3.5) * R * .19, ly = R * .5, ax = o.x + lx * ca - ly * sa, ay = o.y + lx * sa + ly * ca;
    const fa = o.ang + (i - 3.5) * (.24 + .07 * pls * fs) + Math.sin(t * .5 + ar.ph) * .06 * SW, dx = Math.sin(fa), dy = Math.cos(fa), ext = .9 - o.hide * .7 - .22 * Math.max(0, pls) * fs;
    ch.forEach((n, j) => {
      if (!j) { n.x = ax; n.y = ay; n.px = ax; n.py = ay; return; }
      const u = j / N, kk = (.011 * (1 - u) + .0015) * ar.k * (1 + o.hide * 6), gx = ax + dx * j * L * ext, gy = ay + dy * j * L * ext;
      const dr = .94 - ar.w * .05, vx = (n.x - n.px) * dr, vy = (n.y - n.py) * dr; n.px = n.x; n.py = n.y;
      const wv = Math.sin(t * 1.3 * ar.f + ar.ph + j * .45) * ar.w * u * SW * (1 - o.hide);
      n.x += vx + (gx - n.x) * kk - dy * wv; n.y += vy + (gy - n.y) * kk + dx * wv - sv * .02;
      const pd = Math.hypot(P.sx - n.x, P.sy - n.y);
      if (pd < 280 && !o.hide) { n.x += (P.sx - n.x) * .004 * u; n.y += (P.sy - n.y) * .004 * u; }
      if (o.foc && i === 3 && u > .4) { n.x += (o.foc.sx - n.x) * .015 * u; n.y += (o.foc.sy - n.y) * .015 * u; }
      const a = ch[j - 1], ex = n.x - a.x, ey = n.y - a.y, dd = Math.hypot(ex, ey) || 1, f = (dd - L) / dd; n.x -= ex * f; n.y -= ey * f;
    });
  });
  if (Math.random() < .015 + spd * .004) bubble(o.x + (Math.random() - .5) * R, o.y - R * .8);
  for (const b of bubs) { b.y -= b.v - sv * .08; b.x += Math.sin(t * 2 + b.ph) * .35 * SW; }
  for (let i = bubs.length - 1; i >= 0; i--) if (bubs[i].y < -20 || bubs[i].y > H + 60) bubs.splice(i, 1);
  for (let i = inks.length - 1; i >= 0; i--) { const n = inks[i]; n.x += n.vx; n.y += n.vy; n.r *= 1.02; n.a -= dt * .25; if (n.a <= 0) inks.splice(i, 1); }
  for (const s of schools) {
    const base = wy(s.d), cx = W * (.5 + .38 * Math.sin(t * .12 + s.k * 2)), cy = Math.sin(t * .17 + s.k) * 80, od = o.y - base;
    if (Math.abs(base - H / 2) > H * 1.2) continue;
    for (const f of s.fish) {
      f.vx += (cx + f.ox + Math.sin(t * .6 + f.ph) * 25 - f.x) * .0022; f.vy += (cy + f.oyy + Math.cos(t * .5 + f.ph) * 20 - f.oy) * .0022;
      let d = Math.hypot(f.x - o.x, f.oy - od); if (d < R * 2.6) { f.vx += (f.x - o.x) / d * .5; f.vy += (f.oy - od) / d * .5; }
      d = Math.hypot(f.x - P.sx, f.oy - (P.sy - base)); if (d < 130) { f.vx += (f.x - P.sx) / d * .25; f.vy += (f.oy - (P.sy - base)) / d * .25; }
      f.vx *= .96; f.vy *= .96; const m = Math.hypot(f.vx, f.vy); if (m < .9) { f.vx += (Math.sign(f.vx) || 1) * .03; } f.x += f.vx; f.oy += f.vy;
      if (f.x < -80) f.x = W + 60; if (f.x > W + 80) f.x = -60;
    }
  }
  for (const j of jellies) {
    const by = wy(j.d) + Math.sin(t * .4 + j.ph) * 30 * SW, bx = W * j.x + Math.sin(t * .25 + j.ph) * 50 * SW;
    const d = Math.hypot(bx + j.ox - o.x, by + j.oy - o.y); if (d < R * 2.2) { j.ox += (bx + j.ox - o.x) / d * 1.2; j.oy += (by + j.oy - o.y) / d * 1.2; }
    j.ox *= .985; j.oy *= .985; j.sx = bx + j.ox; j.sy = by + j.oy;
  }
  const sc = Math.abs(sv) * .04 + dp * .25, tgx = (P.sx - W / 2) * -.03 + (o.x - W / 2) * -.02 + Math.sin(t * 47) * sc * SW, tgy = (P.sy - H / 2) * -.02 + Math.sin(t * 31) * sc * SW;
  cvx += (tgx - camX) * .06; cvy += (tgy - camY) * .06; camX += cvx; camY += cvy; cvx *= .8; cvy *= .8;
}

const sils = [{ d: .52, k: 1.2, sp: .6, ph: 0 }, { d: .8, k: 2.1, sp: .25, ph: 2 }];
function silDraw() { const dp = ss(0, .95, p); for (const s of sils) { const y = wy(s.d); if (Math.abs(y - H / 2) > H * .9) continue; const L = Math.min(W, H) * .5 * s.k, x = ((t * s.sp * 20 + s.ph * 400) % (W + L * 2 + 200)) - L - 100; ctx.save(); ctx.translate(x + camX * .2, y); ctx.fillStyle = wcol(p + .18); ctx.globalAlpha = .3 + dp * .1; ctx.beginPath(); ctx.moveTo(L, 0); ctx.bezierCurveTo(L * .6, -L * .16, L * .1, -L * .2, -L * .4, -L * .05); ctx.lineTo(-L * .7, -L * .18); ctx.lineTo(-L * .62, 0); ctx.lineTo(-L * .75, L * .2); ctx.lineTo(-L * .4, L * .04); ctx.bezierCurveTo(L * .1, L * .14, L * .6, L * .1, L, 0); ctx.fill(); ctx.restore(); } ctx.globalAlpha = 1; }
const shrimp = Array.from({ length: 6 }, (_, i) => ({ d: .12 + i * .045, x: .2 + ((i * 37) % 7) / 10, ph: i * 2.1, ox: 0, oy: 0 }));
const debris = Array.from({ length: mob ? 8 : 16 }, () => ({ x: Math.random(), y: Math.random() * 5000, z: .5 + Math.random() * .8, a: Math.random() * 6, r: 2 + Math.random() * 3 }));
function extras() {
  for (const s of shrimp) { const by = wy(s.d); if (Math.abs(by - H / 2) > H * .8) continue; const x = W * s.x + Math.sin(t * .3 + s.ph) * 60 * SW + s.ox + camX * .9, y = by + Math.sin(t * .7 + s.ph) * 14 * SW + s.oy, d = Math.hypot(x - o.x, y - o.y) || 1; if (d < R * 2) { s.ox += (x - o.x) / d * 6; s.oy += (y - o.y) / d * 3; } s.ox *= .97; s.oy *= .97; const f = Math.sin(t * 8 + s.ph) * 3 * SW; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,205,190,.7)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 9, y + f); ctx.quadraticCurveTo(x - 2, y - 6, x + 8, y - 1); ctx.stroke(); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x + 8, y - 1); ctx.lineTo(x + 16, y - 7); ctx.moveTo(x + 8, y - 1); ctx.lineTo(x + 17, y - 3); ctx.stroke(); ctx.fillStyle = '#111'; ctx.fillRect(x + 7, y - 3, 1.5, 1.5); }
  if (p < .6) for (const b of debris) { const yy = (((b.y - p * H * 7 * b.z * .9) % H) + H) % H, xx = b.x * W + Math.sin(t * .2 + b.a) * 30 * SW + camX * b.z; ctx.save(); ctx.translate(xx, yy); ctx.rotate(b.a + t * .1 * SW); ctx.fillStyle = 'rgba(120,100,80,.45)'; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.8, b.r * .7, 0, 0, 7); ctx.fill(); ctx.restore(); }
}
function haze(a) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, wcol(p + .05)); g.addColorStop(1, wcol(p + .15)); ctx.globalAlpha = a + ss(0, .9, p) * .2; ctx.fillStyle = g; ctx.fillRect(0, -camY - 40, W, H + 80); ctx.globalAlpha = 1; }

// ---- drawing ----
function wallX(side, z, yw) { const f = Math.sin(yw * .004 + side) + .55 * Math.sin(yw * .011 + 2 * side) + .25 * Math.sin(yw * .027), w = W * (.05 + .045 * f) * (z > .8 ? 1 : 1.6); return side < 0 ? w : W - w; }
function wall(side, z, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(side < 0 ? -20 : W + 20, -20);
  for (let y = -20; y <= H + 40; y += 40) ctx.lineTo(wallX(side, z, y + p * H * 7 * z) + camX * z, y);
  ctx.lineTo(side < 0 ? -20 : W + 20, H + 40); ctx.fill();
}
function drawProps(z0, z1) {
  for (const pr of props) {
    if (pr.z < z0 || pr.z >= z1) continue;
    const by = H * .5 + (pr.d - p) * H * 7 * pr.z; if (Math.abs(by - H / 2) > H * .9) continue;
    const bx = wallX(pr.side, pr.z, H * .5 + pr.d * H * 7 * pr.z) + camX * pr.z, s = pr.sc * (.5 + pr.z * .6) * Math.min(W, H) / 620;
    ctx.save(); ctx.translate(bx, by + camY * pr.z); ctx.rotate(pr.side * -1 * -(pr.ang) * -1 + Math.sin(t * .7 + pr.ph) * .03 * SW); ctx.scale(pr.fl * s, s);
    ctx.globalAlpha = .5 + .5 * pr.z / 1.4; ctx.drawImage(pr.im, -150 - pr.pad, -(pr.im.height - pr.pad)); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function fishDraw(s) {
  const base = wy(s.d); if (Math.abs(base - H / 2) > H * 1.1) return;
  ctx.globalAlpha = s.al || 1;
  for (const f of s.fish) {
    const y = base + f.oy; if (y < -40 || y > H + 40) continue; const fl = f.vx < 0;
    ctx.save(); ctx.translate(f.x + camX * .7, y); ctx.rotate(fl ? -Math.atan2(f.vy, -f.vx) : Math.atan2(f.vy, f.vx)); ctx.scale(fl ? -f.s : f.s, f.s);
    const sw = Math.sin(t * 9 + f.ph) * 4 * SW;
    ctx.fillStyle = s.c[f.ci]; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-20, -7 + sw); ctx.lineTo(-17, 0); ctx.lineTo(-20, 7 + sw); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3, -5); ctx.quadraticCurveTo(2, -11, 6, -5); ctx.fill();
    ctx.fillStyle = s.g[f.ci]; ctx.beginPath(); ctx.ellipse(0, 0, 12, 5.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = s.eye ? '#5FF2E0' : '#0a1218'; ctx.beginPath(); ctx.arc(7.5, -1, 1.4, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(7.9, -1.5, .5, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function jellyDraw(j) {
  if (Math.abs(j.sy - H / 2) > H * .8) return;
  const x = j.sx + camX * .8, y = j.sy, s = (mob ? .8 : 1) * j.sz, pu = Math.sin(t * 1.6 + j.ph) * SW, bw = (44 + pu * 6) * s, bh = (34 - pu * 6) * s;
  ctx.globalCompositeOperation = 'lighter'; const g = j.bio ? (j.c === '95,242,224' ? GC : GP) : GW; ctx.globalAlpha = j.bio ? .5 : .15; ctx.drawImage(g, x - bw * 2, y - bw * 2, bw * 4, bw * 4); ctx.globalAlpha = 1;
  const gr = ctx.createRadialGradient(x, y + bh * .2, 0, x, y, bw); gr.addColorStop(0, `rgba(${j.c},.05)`); gr.addColorStop(.8, `rgba(${j.c},.22)`); gr.addColorStop(1, `rgba(${j.c},.55)`);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, bw, bh, 0, Math.PI, 2 * Math.PI); ctx.quadraticCurveTo(x, y + bh * .4, x - bw, y); ctx.fill();
  ctx.lineWidth = 1.3 * s; for (let i = 0; i < 8; i++) { const bx = x + (i - 3.5) * bw * .24, ln = 90 * s * (i % 2 ? 1 : 1.5); ctx.strokeStyle = `rgba(${j.c},${i % 2 ? .25 : .4})`; ctx.beginPath(); ctx.moveTo(bx, y); for (let k = 1; k <= 8; k++) ctx.lineTo(bx + Math.sin(t * 1.4 + i + k * .6) * (3 + k) * SW * s, y + k / 8 * ln); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
}
const A = (c, a) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };
function drawOcto(dp) {
  const lit = 1 - dp * .45, hid = o.hide, fl = o.react * .4;
  const C = c => mix(mix(mix(c, '#3f5560', hid * .75), '#f08a82', fl), '#0b1730', 1 - lit);
  const cs = clamp(1 - p * 1.5) * .4 + .06;
  const lightFx = body => {
    ctx.save(); ctx.clip(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'lighter';
    ctx.save(); ctx.globalAlpha = cs * .5; ctx.translate(-(t * 18) % 307, (t * 11) % 307); ctx.scale(2.4, 2.4); ctx.fillStyle = causPat; ctx.fillRect(-130, -130, W / 2.4 + 300, H / 2.4 + 300); ctx.restore();
    if (body) { const g = ctx.createLinearGradient(o.x - R, o.y - R * 1.6, o.x + R * .6, o.y + R); g.addColorStop(0, 'rgba(120,225,240,.24)'); g.addColorStop(.6, 'rgba(120,225,240,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  };
  if (dp > .3) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (dp - .3) * .4; ctx.drawImage(dp > .75 ? GP : GC, o.x - R * 3, o.y - R * 3, R * 6, R * 6); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  for (const n of inks) { ctx.fillStyle = `rgba(28,18,48,${n.a * .6})`; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill(); }
  arms.forEach((ch, i) => {
    const t1 = mix(mix('#d98aa0', '#a58ac4', ((i * 5) % 4) * .09), '#f2a99a', ((i * 3) % 3) * .08), c0 = C(t1), c1 = C('#f7c4ad');
    const g = ctx.createLinearGradient(ch[0].x, ch[0].y, ch[N - 1].x, ch[N - 1].y); g.addColorStop(0, c0); g.addColorStop(.75, c1); g.addColorStop(1, A(c1, .6));
    const L = [], Rr = [];
    for (let j = 0; j < N; j++) { const a = ch[Math.max(0, j - 1)], b = ch[Math.min(N - 1, j + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, w = R * .17 * Math.pow(1 - j / N, .85) + 1.3, nx = -dy / d, ny = dx / d; L.push([ch[j].x + nx * w, ch[j].y + ny * w]); Rr.push([ch[j].x - nx * w, ch[j].y - ny * w, nx, ny, w]); }
    const pa = (ox, oy) => { ctx.beginPath(); ctx.moveTo(L[0][0] + ox, L[0][1] + oy); for (let j = 1; j < N; j++) ctx.quadraticCurveTo(L[j - 1][0] + ox, L[j - 1][1] + oy, (L[j - 1][0] + L[j][0]) / 2 + ox, (L[j - 1][1] + L[j][1]) / 2 + oy); ctx.lineTo(Rr[N - 1][0] + ox, Rr[N - 1][1] + oy); for (let j = N - 1; j > 0; j--) ctx.quadraticCurveTo(Rr[j][0] + ox, Rr[j][1] + oy, (Rr[j][0] + Rr[j - 1][0]) / 2 + ox, (Rr[j][1] + Rr[j - 1][1]) / 2 + oy); ctx.closePath(); };
    pa(R * .03, R * .06); ctx.fillStyle = 'rgba(60,30,90,.2)'; ctx.fill();
    pa(0, 0); ctx.fillStyle = g; ctx.fill(); ctx.globalAlpha = .45; ctx.fillStyle = skinPat; ctx.fill(); ctx.globalAlpha = 1; lightFx(false);
    ctx.strokeStyle = 'rgba(255,242,236,.22)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L[1][0], L[1][1]); for (let j = 2; j < N - 3; j++) ctx.lineTo(L[j][0], L[j][1]); ctx.stroke();
    for (let j = 3; j < N - 2; j += 2) { const r = Rr[j], s = r[4] * .38; ctx.fillStyle = 'rgba(255,232,224,.5)'; ctx.strokeStyle = 'rgba(120,70,105,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ch[j].x + r[2] * r[4] * .35, ch[j].y + r[3] * r[4] * .35, s, 0, 7); ctx.fill(); ctx.stroke(); }
  });
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.ang); ctx.scale(1 - o.sq * .6, 1 + o.sq);
  const bg = ctx.createRadialGradient(-R * .3, -R * .9, R * .1, 0, -R * .2, R * 1.5); bg.addColorStop(0, C('#ffd9c7')); bg.addColorStop(.45, C('#ee9aa0')); bg.addColorStop(1, C('#8a6396'));
  const shape = () => { ctx.beginPath(); ctx.ellipse(0, -R * .45, R * .78, R * 1.1, 0, 0, 7); ctx.ellipse(0, R * .05, R * .92, R * .64, 0, 0, 7); };
  ctx.fillStyle = bg; shape(); ctx.fill(); ctx.globalAlpha = .55; ctx.fillStyle = skinPat; shape(); ctx.fill(); ctx.globalAlpha = 1; lightFx(true);
  const sh = ctx.createRadialGradient(0, R * .55, 0, 0, R * .55, R * .8); sh.addColorStop(0, 'rgba(70,30,85,.4)'); sh.addColorStop(1, 'rgba(70,30,85,0)'); ctx.fillStyle = sh; ctx.fillRect(-R, 0, R * 2, R * 1.2);
  const sp = ctx.createRadialGradient(-R * .32, -R * .95, 0, -R * .32, -R * .95, R * .55); sp.addColorStop(0, 'rgba(255,255,255,.5)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sp; shape(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-R * .28, -R * 1.02, R * .14, R * .05, -.4, 0, 7); ctx.fill();
  ctx.strokeStyle = dp > .25 ? `rgba(95,242,224,${.2 + dp * .35})` : 'rgba(150,235,245,.35)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, -R * .45, R * .78, R * 1.1, 0, -2.6, -.9); ctx.stroke();
  const tx = o.foc ? o.foc.sx : P.sx, ty = o.foc ? o.foc.sy : P.sy, dx = tx - o.x, dy = ty - o.y, dd = Math.hypot(dx, dy) || 1, lm = Math.min(1, dd / 220) * R * .05;
  const op = clamp((1 - o.bl) * (1 - hid * .6) * (o.state === 'RESTING' ? .55 : 1) + o.react * .15);
  for (const s of [-1, 1]) {
    const ex = s * R * .43, ey = R * .02;
    ctx.fillStyle = C('#9a6a86'); ctx.beginPath(); ctx.ellipse(ex, ey, R * .21, R * .23, 0, 0, 7); ctx.fill();
    const ir = ctx.createRadialGradient(ex + dx / dd * lm, ey + dy / dd * lm, 0, ex, ey, R * .16); ir.addColorStop(0, '#e9c277'); ir.addColorStop(.7, '#a8702c'); ir.addColorStop(1, '#3d2216');
    ctx.fillStyle = ir; ctx.beginPath(); ctx.ellipse(ex, ey, R * .15, R * .15 * op + .8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0608'; ctx.beginPath(); ctx.ellipse(ex + dx / dd * lm * 1.2, ey + dy / dd * lm * 1.2, R * .1, R * (.04 + o.react * .05) * op + .5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(ex - R * .05, ey - R * .06, R * .028, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(180,240,250,.45)'; ctx.beginPath(); ctx.ellipse(ex + R * .05, ey + R * .06, R * .05, R * .025, .5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(110,55,95,.65)'; ctx.lineWidth = R * .025; ctx.beginPath(); ctx.ellipse(ex, ey, R * .21, R * .23, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  }
  ctx.restore();
}

function draw(dt) {
  const dp = ss(0, .95, p), ra = clamp(1 - p * 2.4);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, wcol(p)); bg.addColorStop(1, wcol(p + .14)); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const sy = wy(-.06) + camY;
  if (sy > -60) {
    const sk = ctx.createLinearGradient(0, 0, 0, Math.max(1, sy)); sk.addColorStop(0, '#f4fdff'); sk.addColorStop(1, '#bdeef6'); ctx.fillStyle = sk; ctx.fillRect(0, 0, W, sy + 4);
    const gl = ctx.createLinearGradient(0, sy, 0, sy + H * .4); gl.addColorStop(0, 'rgba(255,255,255,.6)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(0, sy);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, sy + Math.sin(x * .02 + t * 1.2) * 5 * SW + Math.sin(x * .007 - t * .5) * 8 * SW); ctx.lineTo(W, sy + H * .4); ctx.lineTo(0, sy + H * .4); ctx.fill();
  }
  ctx.globalCompositeOperation = 'lighter';
  if (ra > 0) for (let k = 0; k < (mob ? 4 : 7); k++) { const x0 = W * (.02 + k * .16) + Math.sin(t * .15 + k) * 40 * SW + camX * .4, g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(210,250,255,${.22 * ra})`); g.addColorStop(1, 'rgba(210,250,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 40 + k * 8, 0); ctx.lineTo(x0 + 240, H); ctx.lineTo(x0 - 50, H); ctx.fill(); }
  if (ra > 0) { const sg = ctx.createRadialGradient(W * .5, -H * .1, 0, W * .5, -H * .1, H * 1.1); sg.addColorStop(0, `rgba(225,253,255,${.4 * ra})`); sg.addColorStop(1, 'rgba(225,253,255,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); }
  if (q > .8 && p < .6) { const ca = .5 * clamp(1 - p * 1.7); for (const [sp, sc, dx] of [[14, 3, 1], [9, 4.6, -1]]) { ctx.globalAlpha = ca * .6; ctx.save(); ctx.translate((t * sp * dx) % (128 * sc), (t * sp * .7 + p * 400) % (128 * sc)); ctx.scale(sc, sc); ctx.fillStyle = causPat; ctx.fillRect(-128, -128, W / sc + 300, H / sc + 300); ctx.restore(); } ctx.globalAlpha = 1; }
  ctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.translate(0, camY);
  silDraw();
  wall(-1, .6, mix('#1a3d4a', wcol(p + .06), .55)); wall(1, .6, mix('#1a3d4a', wcol(p + .06), .55)); drawProps(0, .8); haze(.2);
  schools.forEach(fishDraw); jellies.forEach(jellyDraw); extras();
  wall(-1, 1, '#14303b'); wall(1, 1, '#14303b'); drawProps(.8, 1.25);
  ctx.lineCap = 'round';
  const kelpDraw = (z0, z1) => { for (const k of kelp) { if (k.z < z0 || k.z >= z1) continue;
    const by = H * .5 + (k.d - p) * H * 7 * k.z; if (Math.abs(by - H / 2) > H) continue;
    const bx = wallX(k.side, k.z, H * .5 + k.d * H * 7 * k.z) + camX * k.z; let px = bx, py = by;
    ctx.strokeStyle = k.z >= 1.2 ? 'rgba(4,22,26,.85)' : mix('#1f5a4a', '#0e2a34', 1 - k.z / 1.5);
    for (let i = 1; i <= 8; i++) { const u = i / 8, x = bx - k.side * u * u * 90 * k.z + Math.sin(t * .8 + k.ph + u * 3) * u * 36 * SW * k.z, y = by - u * k.h * k.z; ctx.lineWidth = k.w * k.z * (1.1 - u * .8); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); px = x; py = y; }
  } };
  kelpDraw(0, 1.2);
  ctx.restore();
  // marine snow
  const nS = snow.length * q | 0, pc = dp > .5 ? '150,230,255' : '235,250,255';
  for (let i = 0; i < nS; i++) { const s = snow[i], yy = (((s.y - p * H * 7 * s.z * .9) % H) + H) % H, xx = s.x * W + Math.sin(t * s.z + s.y) * 12 * SW + camX * s.z;
    const dx = xx + s.ox - P.sx, dy = yy + s.oy - P.sy, d = Math.hypot(dx, dy); if (d < 120) { s.ox += dx / d * 2; s.oy += dy / d * 2; } s.ox *= .96; s.oy *= .96;
    ctx.fillStyle = `rgba(${pc},${.25 + .3 * s.z * (1 - dp * .5)})`; ctx.beginPath(); ctx.arc(xx + s.ox, yy + s.oy, s.r * s.z, 0, 7); ctx.fill(); }
  if (p > .3) { ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = ss(.3, .9, p) * .6; ctx.fillStyle = '#6b7a85'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  // darkness + fog
  ctx.fillStyle = `rgba(2,8,22,${dp * .5})`; ctx.fillRect(0, 0, W, H);
  const fg = ctx.createLinearGradient(0, 0, 0, H); fg.addColorStop(0, 'rgba(6,24,48,0)'); fg.addColorStop(1, `rgba(6,24,48,${.15 + dp * .3})`); ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
  // bioluminescence
  if (p > .45) { ctx.globalCompositeOperation = 'lighter'; const a = ss(.45, .75, p), nb = bio.length * q | 0; for (let i = 0; i < nb; i++) { const b = bio[i], yy = (((b.y - p * H * 7 * b.z * .7) % H) + H) % H, xx = b.x * W + Math.sin(t * .5 + b.ph) * 30 * SW + camX * b.z, fl = .5 + .5 * Math.sin(t * 1.5 + b.ph * 3), s = (14 + fl * 18) * b.z; ctx.globalAlpha = a * (.25 + fl * .6); ctx.drawImage(b.c ? GP : GC, xx - s, yy - s, s * 2, s * 2); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  drawOcto(dp);
  ctx.lineWidth = 1.1;
  for (const b of bubs) { ctx.strokeStyle = 'rgba(235,252,255,.55)'; ctx.fillStyle = 'rgba(235,252,255,.08)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(b.x - b.r * .3, b.y - b.r * .3, b.r * .2, 0, 7); ctx.fill(); }
  ctx.save(); ctx.translate(0, camY); drawProps(1.25, 9); kelpDraw(1.2, 9); ctx.restore();
}

let last = 0, acc = 0, nf = 0;
function frame(ts) {
  lenis.raf(ts); const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts; t += dt;
  vel *= .9; sv += (clamp(vel, -40, 40) - sv) * .15;
  if (++nf > 30) { acc += dt; if (nf % 90 === 0) { if (acc / 90 > .026 && q > .5) q -= .25; acc = 0; } }
  update(dt); draw(dt); hud();
  ring.style.transform = `translate3d(${P.sx}px,${P.sy}px,0) scale(${1 + Math.min(1, P.speed * .02)})`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
