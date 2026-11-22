// Spanya's own plants (grounds.js): the ones the lab's atlas (paint.js) has not got. Painted here leaf by leaf on one
// canvas and drawn as instanced cards exactly as the lab's planting is (cards.js), in a handful of draws.
//
//   the courtyard (a Japanese moss-and-stone garden): a red Japanese maple and its fallen leaves, bamboo, Hakone grass,
//      a dark sedge, moss, the pine's needles (the lab's own pine sprig, paint.js TREE_PAINT.pine), a little ivy
//   the meadow: long grass in seed, ox-eye daisies, yarrow with a few pale buttercups; creeping thyme to lie flat
//
// Each kind: [cell, shape, width, height]. Shapes: 'x' three cards crossed, 'x2' two (the meadow's grass: there are
// thousands), 'f' lying flat, 'star' a tuft seen from every side (pine, maple and bamboo leaves), 'wall' one upright
// card facing +z (the ivy).

import * as THREE from 'three';
import { CardSet, crossGeo, flatGeo, starGeo, cardMaterials, atlasTexture, cellUV, place, rng } from './cards.js';
import { TREE_PAINT } from './paint.js';

export const WILD = {
  acer: ['acer', 'star', 3.2, 3.2], bamboo: ['bamboo', 'star', 3.4, 3.4], hakone: ['hakone', 'x', 2.6, 1.6], sedge: ['sedge', 'x', 2.2, 1.9],
  fallen: ['fallen', 'f', 1.6, 1.6], longgrass: ['longgrass', 'x2', 3.6, 2.5], pine: ['pine', 'star', 3, 3], ivy: ['ivy', 'wall', 2.4, 3.2],
  moss: ['moss', 'f', 2.4, 2.4], cowparsley: ['cowparsley', 'x', 3.0, 3.6], foxglove: ['foxglove', 'x', 1.8, 4.6], anemone: ['anemone', 'x', 2.2, 3.0], miscanthus: ['miscanthus', 'x', 3.6, 6.5], trailing: ['trailing', 'hang', 2.0, 3.2], thyme: ['thyme', 'f', 2.2, 2.2], oxeye: ['oxeye', 'x', 2.8, 2.7], meadowmix: ['meadowmix', 'x', 3.0, 2.3],
};
const CELLS = ['acer', 'bamboo', 'hakone', 'sedge', 'fallen', 'longgrass', 'pine', 'ivy', 'moss', 'thyme', 'oxeye', 'meadowmix', 'cowparsley', 'foxglove', 'anemone', 'miscanthus', 'trailing'];
export const FLOWERING = new Set(['oxeye', 'meadowmix', 'thyme', 'cowparsley', 'foxglove', 'anemone']);

const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
function stem(g, x0, y0, x1, y1, bend, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1); g.stroke(); }
function leaf(g, x, y, len, wid, ang, fill) {
  g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.moveTo(0, 0);
  g.bezierCurveTo(wid, -len * 0.3, wid * 0.85, -len * 0.78, 0, -len); g.bezierCurveTo(-wid * 0.85, -len * 0.78, -wid, -len * 0.3, 0, 0);
  g.fillStyle = fill; g.fill(); g.restore();
}
const dot = (g, x, y, r, col) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.fill(); };
// grass blades from the foot of the cell: n of them, len px tall, in the hues given
function blades(g, S, r, n, len, hue, light, spread = 0.8, w = 2) {
  for (let i = 0; i < n; i++) {
    const x0 = S / 2 + (r() - 0.5) * S * 0.35, l = len * (0.45 + r() * 0.6), a = (r() - 0.5) * spread, x1 = x0 + Math.sin(a) * l, y1 = S - Math.cos(a) * l;
    stem(g, x0, S, x1, y1, (r() - 0.5) * l * 0.3, w * (0.6 + r() * 0.7), hsl(hue[0] + r() * hue[1], 30 + r() * 25, light[0] + r() * light[1]));
  }
}
// the head of a flower on a wiry stem: returns where it ends
function wire(g, S, r, h0, h1, lean, col = hsl(95, 30, 34)) { const x0 = S / 2 + (r() - 0.5) * S * 0.2, l = S * (h0 + r() * (h1 - h0)), a = (r() - 0.5) * lean, x1 = x0 + Math.sin(a) * l, y1 = S - Math.cos(a) * l; stem(g, x0, S, x1, y1, (r() - 0.5) * 20, 1.6, col); return [x1, y1]; }
function daisy(g, x, y, rad, petal, centre, n = 14, tilt = 0.7) {
  g.save(); g.translate(x, y); g.scale(1, tilt);
  for (let i = 0; i < n; i++) { g.save(); g.rotate((i / n) * Math.PI * 2); g.beginPath(); g.ellipse(0, -rad * 0.55, rad * 0.2, rad * 0.5, 0, 0, 7); g.fillStyle = petal; g.fill(); g.restore(); }
  dot(g, 0, 0, rad * 0.28, centre); g.restore();
}

const PAINTERS = {
  longgrass(g, S, r) {      // the meadow's grass in June: dense, tawny at the top, heads of cocksfoot, timothy and Yorkshire fog
    blades(g, S, r, 260, S * 0.62, [70, 30], [24, 22], 1.1, 2.2);
    for (let i = 0; i < 26; i++) {
      const [x, y] = wire(g, S, r, 0.6, 0.98, 1.2, hsl(60 + r() * 20, 30, 50)), k = r();
      if (k < 0.4) { g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.5); g.beginPath(); g.ellipse(0, 0, 3.5, 16, 0, 0, 7); g.fillStyle = hsl(45 + r() * 15, 35, 52 + r() * 15); g.fill(); g.restore(); }
      else if (k < 0.75) for (let q = 0; q < 14; q++) dot(g, x + (r() - 0.5) * 16, y + (r() - 0.3) * 22, 2.3, hsl(35 + r() * 30, 30 + r() * 20, 50 + r() * 20));
      else for (let q = 0; q < 10; q++) dot(g, x + (r() - 0.5) * 10, y + r() * 26, 2.4, hsl(340 + r() * 20, 18, 60 + r() * 15));
    }
  },
  acer(g, S, r) {      // a spray of red Japanese maple, seen from anywhere: small leaves of seven fingers, crimson, a few rust
    const c = S / 2;
    for (let i = 0; i < 6; i++) { const a = r() * 6.28; stem(g, c, c, c + Math.cos(a) * S * 0.34, c + Math.sin(a) * S * 0.28, (r() - 0.5) * 30, 1.6, hsl(20, 30, 24)); }
    for (let i = 0; i < 170; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * S * 0.42, x = c + Math.cos(a) * d, y = c + Math.sin(a) * d * 0.8, sz = 10 + r() * 7, k = r();
      const col = k < 0.15 ? hsl(20 + r() * 12, 70, 40) : hsl(356 + r() * 14, 62 + r() * 22, 30 + r() * 16);
      for (let f = 0; f < 7; f++) leaf(g, x, y, sz * (f === 3 ? 1 : 0.62 + (f % 2) * 0.12 + (3 - Math.abs(f - 3)) * 0.08), sz * 0.16, (f - 3) * 0.42 + (r() - 0.5) * 0.2 + (a - 1.57) * 0.3, col);
    }
  },
  bamboo(g, S, r) {      // the leaves of a bamboo (Phyllostachys): thin twigs, long narrow leaves hanging in fans
    const c = S / 2;
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.28, l = S * (0.15 + r() * 0.25), x1 = c + Math.cos(a) * l, y1 = c + Math.sin(a) * l * 0.7; stem(g, c, c, x1, y1, (r() - 0.5) * 16, 1.3, hsl(60, 30, 36));
      for (let k = 0; k < 5; k++) { const t = 0.4 + r() * 0.6, x = c + (x1 - c) * t, y = c + (y1 - c) * t; for (let q = 0; q < 3; q++) leaf(g, x, y, S * (0.09 + r() * 0.06), S * 0.012, Math.PI * (0.6 + r() * 0.8), hsl(85 + r() * 25, 35 + r() * 15, 18 + r() * 16)); }
    }
  },
  hakone(g, S, r) {      // Hakonechloa, the Japanese forest grass: soft arching blades all combed one way, bright green going gold
    for (let i = 0; i < 230; i++) { const x0 = S / 2 + (r() - 0.5) * S * 0.25, l = S * (0.4 + r() * 0.5), a = -0.2 + r() * 1.3, x1 = x0 + Math.sin(a) * l, y1 = S - Math.cos(a) * l * 0.55; stem(g, x0, S, x1, y1, -l * 0.25, 2.3, hsl(78 + r() * 22, 45 + r() * 20, 22 + r() * 14)); }
  },
  sedge(g, S, r) {      // a dark evergreen sedge (Carex), a fine fountain
    blades(g, S, r, 260, S * 0.75, [95, 25], [16, 16], 1.5, 1.6);
  },
  fallen(g, S, r) {      // (flat) a few fallen maple leaves, red and rust, lying where they came down
    for (let i = 0; i < 11; i++) { const x = S * (0.15 + r() * 0.7), y = S * (0.15 + r() * 0.7), sz = 16 + r() * 12, rot = r() * 6.3, col = hsl(r() * 18 - 4, 60 + r() * 25, 30 + r() * 16); for (let f = 0; f < 5; f++) leaf(g, x, y, sz * (f === 2 ? 1 : 0.75), sz * 0.2, rot + (f - 2) * 0.55, col); }
  },
  cowparsley(g, S, r) {      // cow parsley (Queen Anne's lace): fine ferny leaves low down, tall branching stems, flat lacy white umbels
    for (let i = 0; i < 16; i++) { const x = S / 2 + (r() - 0.5) * S * 0.35, a = (r() - 0.5) * 2.4; for (let k = 0; k < 12; k++) leaf(g, x + Math.sin(a) * k * 4, S - k * 5, 9, 3, a + (k % 2 ? 0.9 : -0.9), hsl(95 + r() * 20, 35, 30 + r() * 12)); }
    for (let i = 0; i < 8; i++) {
      const [x, y] = wire(g, S, r, 0.55, 0.95, 1.0, hsl(95, 25, 40));
      for (let u = 0; u < 14; u++) { const ua = -1.25 + u * 0.18 + (r() - 0.5) * 0.1, ex = x + Math.sin(ua) * S * 0.07, ey = y - Math.cos(ua) * S * 0.03; stem(g, x, y + 10, ex, ey, 0, 0.8, hsl(95, 22, 45)); for (let k = 0; k < 9; k++) dot(g, ex + (r() - 0.5) * 9, ey + (r() - 0.5) * 4, 1.8, hsl(48, 25, 90 + r() * 8)); }
    }
  },
  foxglove(g, S, r) {      // white foxgloves: a rosette of soft leaves, one or two tall spikes hung with pale bells
    for (let i = 0; i < 14; i++) leaf(g, S / 2 + (r() - 0.5) * S * 0.2, S, S * 0.15, S * 0.06, (r() - 0.5) * 2.6, hsl(100, 22, 32 + r() * 10));
    for (let i = 0; i < 2; i++) {
      const x0 = S / 2 + (i - 0.5) * S * 0.12, x1 = x0 + (r() - 0.5) * S * 0.06; stem(g, x0, S, x1, S * 0.06, 4, 3, hsl(100, 25, 34));
      for (let k = 0; k < 26; k++) { const t = 0.3 + k / 26 * 0.68, x = x0 + (x1 - x0) * t, y = S - (S * 0.94) * t, sd = k % 2 ? 1 : -1; g.beginPath(); g.ellipse(x + sd * 6, y + 5, 5.5 - t * 2.5, 9 - t * 4, sd * 0.4, 0, 7); g.fillStyle = hsl(40, 20, 90 + r() * 7); g.fill(); dot(g, x + sd * 6, y + 9, 1.4, hsl(330, 25, 55)); }
    }
  },
  anemone(g, S, r) {      // Japanese anemones: white, on tall wiry stems over a mound of dark leaves
    for (let i = 0; i < 18; i++) { const x = S / 2 + (r() - 0.5) * S * 0.4, y = S - r() * S * 0.25; for (let k = 0; k < 3; k++) leaf(g, x, y, S * 0.08, S * 0.05, (k - 1) * 0.8 + (r() - 0.5), hsl(110, 25, 24 + r() * 10)); }
    for (let i = 0; i < 9; i++) { const [x, y] = wire(g, S, r, 0.6, 0.95, 0.8, hsl(100, 20, 32)); for (let p = 0; p < 6; p++) { g.beginPath(); g.ellipse(x + Math.cos(p * 1.05) * 8, y + Math.sin(p * 1.05) * 6, 7, 5, p * 1.05, 0, 7); g.fillStyle = hsl(30, 25 + (i % 3 ? 0 : 30), 95); g.fill(); } dot(g, x, y, 4, hsl(50, 80, 50)); }
  },
  miscanthus(g, S, r) {      // a tall feathery grass (Miscanthus, Calamagrostis): fine arching blades, pale silky plumes high up
    for (let i = 0; i < 200; i++) { const x0 = S / 2 + (r() - 0.5) * S * 0.14, l = S * (0.35 + r() * 0.35), a = (r() - 0.5) * 1.4, x1 = x0 + Math.sin(a) * l, y1 = S - Math.cos(a) * l; stem(g, x0, S, x1, y1, a * l * 0.4, 1.4, hsl(80 + r() * 30, 30 + r() * 20, 26 + r() * 20)); }
    for (let i = 0; i < 16; i++) { const x0 = S / 2 + (r() - 0.5) * S * 0.1, a = (r() - 0.5) * 0.5, l = S * (0.8 + r() * 0.17), x1 = x0 + Math.sin(a) * l, y1 = S - Math.cos(a) * l; stem(g, x0, S, x1, y1, a * 20, 1.2, hsl(55, 20, 55)); for (let k = 0; k < 40; k++) { const t = r() * 0.18; g.strokeStyle = hsl(38 + r() * 12, 25 + r() * 15, 74 + r() * 18); g.lineWidth = 1; g.beginPath(); const px = x1 + (x0 - x1) * t, py = y1 + (S - y1) * t; g.moveTo(px, py); g.lineTo(px + (r() - 0.3) * 18, py + 8 + r() * 14); g.stroke(); } }
  },
  trailing(g, S, r) {
    g.save(); g.translate(0, S); g.scale(1, -1);      // (painted growing up from the foot of the cell; the card is hung upside down, so its tips swing) strands of a trailing plant over a basket's rim: small leaves in pairs, a few white stars
    for (let i = 0; i < 22; i++) {
      const x0 = S * (0.2 + r() * 0.6), l = S * (0.35 + r() * 0.6), sw = (r() - 0.5) * 40; stem(g, x0, 0, x0 + sw, l, sw * 0.4, 1.3, hsl(90, 30, 30));
      for (let k = 0; k < 18; k++) { const t = k / 18, x = x0 + sw * t * t, y = l * t; for (const sd of [-1, 1]) leaf(g, x, y, 9 + r() * 4, 4, Math.PI + sd * (0.9 + r() * 0.4), hsl(95 + r() * 30, 35 + r() * 20, 26 + r() * 18)); if (r() < 0.06) dot(g, x + 4, y, 3.2, hsl(40, 20, 94)); }
    }
    g.restore();
  },
  pine(g, S, r) { TREE_PAINT.pine(g, S, r); },
  ivy(g, S, r) {      // Boston ivy climbing from the foot of the card: a few leaders, leaves in three lobes
    for (let i = 0; i < 5; i++) {
      let x = S / 2 + (r() - 0.5) * S * 0.4, y = S; const steps = 14 + Math.floor(r() * 8);
      for (let k = 0; k < steps; k++) {
        const nx = x + (r() - 0.5) * S * 0.09, ny = y - S * (0.035 + r() * 0.03); stem(g, x, y, nx, ny, 0, 2, hsl(25, 25, 28)); x = nx; y = ny;
        for (const sd of [-1, 1]) { const lx = x + sd * (6 + r() * 10), ly = y + (r() - 0.5) * 8, hu = 95 + r() * 30, li = 26 + r() * 16, sz = 12 + r() * 9; for (const la of [-0.7, 0, 0.7]) leaf(g, lx, ly + sz * 0.3, sz * (la ? 0.8 : 1), sz * 0.38, la + (r() - 0.5) * 0.3, hsl(hu, 40 + r() * 15, li)); }
      }
    }
  },
  moss(g, S, r) {      // (flat) a cushion of moss seen from above
    const c = S / 2;
    for (let i = 0; i < 2600; i++) { const a = r() * 6.3, d = Math.pow(r(), 0.6) * S * (0.43 + 0.05 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 7)); dot(g, c + Math.cos(a) * d, c + Math.sin(a) * d, 2 + r() * 3, hsl(78 + r() * 24, 40 + r() * 20, 22 + r() * 18 + (1 - d / (S * 0.45)) * 8)); }
  },
  thyme(g, S, r) {      // (flat) creeping thyme in flower, seen from above
    const c = S / 2;
    for (let i = 0; i < 1400; i++) { const a = r() * 6.3, d = Math.pow(r(), 0.7) * S * (0.42 + 0.05 * Math.sin(a * 4)), x = c + Math.cos(a) * d, y = c + Math.sin(a) * d; leaf(g, x, y, 6 + r() * 3, 2.2, r() * 6.3, hsl(95 + r() * 30, 25, 30 + r() * 14)); }
    for (let i = 0; i < 260; i++) { const a = r() * 6.3, d = Math.pow(r(), 0.8) * S * 0.38; dot(g, c + Math.cos(a) * d, c + Math.sin(a) * d, 2.1 + r() * 1.3, hsl(290 + r() * 25, 22, 72 + r() * 14)); }
  },
  oxeye(g, S, r) {      // ox-eye daisies and the grass they stand in
    blades(g, S, r, 120, S * 0.5, [75, 30], [26, 20], 1.0, 2);
    for (let i = 0; i < 12; i++) { const [x, y] = wire(g, S, r, 0.55, 0.95, 1.1); daisy(g, x, y, S * (0.045 + r() * 0.015), '#f7f5ee', hsl(46, 92, 50), 16, 0.55 + r() * 0.4); }
  },
  meadowmix(g, S, r) {      // yarrow and a few pale buttercups in the grass
    blades(g, S, r, 150, S * 0.55, [70, 30], [25, 22], 1.0, 2);
    for (let i = 0; i < 6; i++) { const [x, y] = wire(g, S, r, 0.4, 0.85, 1.2); for (let p = 0; p < 5; p++) dot(g, x + Math.cos(p * 1.26) * 5, y + Math.sin(p * 1.26) * 4, 5, hsl(54, 75, 72)); dot(g, x, y, 2.5, hsl(48, 70, 50)); }
    for (let i = 0; i < 9; i++) { const [x, y] = wire(g, S, r, 0.45, 0.85, 0.9); for (let k = 0; k < 40; k++) dot(g, x + (r() - 0.5) * 30, y + (r() - 0.5) * 8, 2.4, hsl(40, 20, 92)); }
  },
};

// Wild: a list of plants, built once the scene exists, as Flora is (flora.js).
export class Wild {
  static night = { value: 0 };
  constructor(seed = 2027) { this.list = []; this.r = rng(seed); }
  add(kind, x, y, z, s = 1, o = {}) {
    const k = WILD[kind]; if (!k) throw new Error('no wild kind ' + kind);
    const r = this.r;
    this.list.push({ kind, shape: k[1], x, y, z, w: (o.w ?? k[2]) * s * (0.85 + r() * 0.3), h: (o.h ?? k[3]) * s * (0.85 + r() * 0.3), rot: o.rot ?? r() * 6.28, tilt: o.tilt ?? (k[1] === 'x' || k[1] === 'x2' ? (r() - 0.5) * 0.14 : 0), roll: o.roll ?? 0, tint: o.tint ?? 0.85 + r() * 0.25 });
  }
  build(scene, size = 384) {
    const n = Math.ceil(Math.sqrt(CELLS.length)), c = document.createElement('canvas'); c.width = c.height = n * size;
    const g = c.getContext('2d'), rects = {};
    CELLS.forEach((name, i) => {
      const x = (i % n) * size, y = Math.floor(i / n) * size;
      g.save(); g.beginPath(); g.rect(x, y, size, size); g.clip(); g.translate(x, y); PAINTERS[name](g, size, rng(911 + i * 131)); g.restore();
      rects[name] = [x, y, size, size];
    });
    const tex = atlasTexture(c, Object.values(rects)), W = c.width;
    const cells = Object.fromEntries(Object.entries(rects).map(([k, v]) => [k, cellUV(W, W, v, 2)]));
    const sway = cardMaterials(tex, { sway: 0.14, roughness: 0.82, env: 0.65, alphaTest: 0.45 }), still = cardMaterials(tex, { sway: 0.012, roughness: 0.85, env: 0.55, alphaTest: 0.45 });
    const wallGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
    const hangGeo = crossGeo(2); hangGeo.rotateX(Math.PI); { const n = hangGeo.attributes.normal; for (let i = 0; i < n.count; i++) n.setY(i, Math.abs(n.getY(i))); }
    const shapes = { x: crossGeo(3), x2: crossGeo(2), f: flatGeo(), star: starGeo(), wall: wallGeo, hang: hangGeo };
    // (one draw a shape for the lot, the courtyard's and the meadow's together: every draw counts, seen from every room)
    const sets = { sway: new CardSet({ region: 4000 }), still: new CardSet({ region: 4000 }), pine: new CardSet({ region: 4000 }) }, m = new THREE.Matrix4(), col = new THREE.Color();
    // the pine's needles: the same material with a warm term after dark, strongest low down near the lit bowl (Wild.night)
    const pineMats = cardMaterials(tex, { sway: 0.14, roughness: 0.82, env: 0.65, alphaTest: 0.45 }), base = pineMats.material.onBeforeCompile, night = Wild.night, lo = this.pineLow ?? 2, hi = this.pineHigh ?? 22;
    pineMats.material.onBeforeCompile = sh => { base(sh); sh.uniforms.uNight = night;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWY;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n#ifdef USE_INSTANCING\nvWY = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).y;\n#else\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;\n#endif');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWY; uniform float uNight;').replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += uNight * vec3(1.0, 0.55, 0.22) * diffuseColor.rgb * 1.6 * (1.0 - smoothstep(${lo.toFixed(1)}, ${hi.toFixed(1)}, vWY));`); };
    pineMats.material.customProgramCacheKey = () => 'card-pine-night';
    for (const p of this.list) {
      const cell = cells[WILD[p.kind][0]]; col.setScalar(p.tint);
      if (p.shape === 'f') sets.still.push('f', cell, place(m, p.x, p.y, p.z, p.w, 1, p.w, p.rot), col);
      else if (p.shape === 'wall') sets.still.push('wall', cell, place(m, p.x, p.y, p.z, p.w, p.h, 1, p.rot, p.tilt, p.roll), col);
      else if (p.kind === 'pine') sets.pine.push('star', cell, place(m, p.x, p.y, p.z, p.w, p.h, p.w, p.rot, p.tilt, p.roll), col);
      else if (p.shape === 'star') sets.sway.push('star', cell, place(m, p.x, p.y, p.z, p.w, p.h, p.w, p.rot, p.tilt, p.roll), col);
      else sets.sway.push(p.shape, cell, place(m, p.x, p.y, p.z, p.w, p.h, p.w, p.rot, p.tilt, p.tilt * 0.7), col);
    }
    const meshes = [...sets.sway.build(scene, shapes, sway, { prepass: false }), ...sets.still.build(scene, shapes, still, { shadow: true }), ...sets.pine.build(scene, shapes, pineMats, { prepass: false })];
    for (const mesh of meshes) mesh.name = 'plants';      // (the butterflies look for flowers among meshes of this name)
    return meshes;
  }
}

// A round limb that tapers, along a smooth line through pts ([x, y, z]); for the pine's trunk and boughs. Texture
// coordinates in feet (round the girth, and along), for the bark.
export function limb(pts, r0, r1, radial = 8, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal'), L = curve.getLength(), n = Math.max(2, Math.ceil(L / (o.step ?? 1.4)));
  const frames = curve.computeFrenetFrames(n, false), pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPointAt(t), N = frames.normals[i], B = frames.binormals[i], rad = (r0 + (r1 - r0) * Math.pow(t, o.pow ?? 0.8)) * (1 + (o.flare ?? 0) * Math.max(0, 1 - t * 8));
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * Math.PI * 2, wob = 1 + (o.gnarl ?? 0.06) * Math.sin(a * 3 + i * 1.7) * Math.sin(i * 0.9 + j); pos.push(p.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * rad * wob, p.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * rad * wob, p.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * rad * wob); uv.push((j / radial) * Math.max(1, Math.round(rad * 4)), t * L / 4); }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // (the frames may turn either way: if the faces look inward, wind them the other way)
  const p0 = curve.getPointAt(0), nn = g.attributes.normal, q = j => (pos[j * 3] - p0.x) * nn.getX(j) + (pos[j * 3 + 1] - p0.y) * nn.getY(j) + (pos[j * 3 + 2] - p0.z) * nn.getZ(j);
  if (q(1) < 0) { for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]; g.setIndex(idx); g.computeVertexNormals(); }
  return { geo: g, curve };
}
