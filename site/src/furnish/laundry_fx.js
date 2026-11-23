// laundry_fx.js: what is drawn on canvases, glows or moves in The Laundry and The Linen Closet (laundry.js calls
// these from f.later). Everything is given in the building's plan (X, Y, h) and turned into the world with
// W = (X, Y, h) => f.world(X, Y, h); every mesh is tracked to its room, so nothing costs anything while the room is
// out of sight. Per frame: a few uniforms, and the drums and the tap only while they run.
//
//   hexFloor()    the floor: one-inch unglazed porcelain hexagons, white with a black band and black flowers, and
//                 ANNA'S BASEMENT set in black hexes in a ruled panel inside the door (one canvas for both rooms)
//   wallpaper()   Morris's Willow Bough (1887) on the north wall, at its own scale
//   windowView()  the "window" over the sink: a painted view of a drying green, a linen blind backlit at its head
//   laylight()    the glass ceiling light over the folding table: daylight by day, warm lamplight at night
//   machines()    the washer's and the dryer's drums: E starts a wash or a dry; the drum turns, glows a little, stops
//   tap()         E on the bridge tap: a thread of water into the Belfast sink
//   clock()       the hands of the clock over the closet door, at the place's own hour
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const smooth = THREE.MathUtils.smoothstep;
const tone = '#include <tonemapping_fragment>\n#include <colorspace_fragment>';
const add = (ctx, mesh, at, size = 1, test) => { ctx.scene.add(mesh); ctx.track?.(mesh, ctx.zoneAt(at.x, at.y, at.z, size), test); return mesh; };
// a flat quad in plan coordinates: corners [[X, Y, h], ...] (four, in order round it) and their uv
const quadGeo = (W, pts, uvs) => {
  const P = pts.map(([X, Y, h]) => W(X, Y, h)), pos = [], uv = [];
  for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(P[i].x, P[i].y, P[i].z); uv.push(...uvs[i]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  return g;
};
// make sure a quad faces the way asked (its normal toward `toward`, a world point)
const faceToward = (g, toward) => {
  const p = g.attributes.position, n = g.attributes.normal;
  if (n.getX(0) * (toward.x - p.getX(0)) + n.getY(0) * (toward.y - p.getY(0)) + n.getZ(0) * (toward.z - p.getZ(0)) < 0) {
    for (let i = 0; i < p.count; i += 3) for (const at of [p, g.attributes.uv]) { const k = at.itemSize, t = []; for (let j = 0; j < k; j++) t.push(at.array[(i + 1) * k + j]); for (let j = 0; j < k; j++) { at.array[(i + 1) * k + j] = at.array[(i + 2) * k + j]; at.array[(i + 2) * k + j] = t[j]; } }
    g.computeVertexNormals();
  }
  return g;
};

// ---- the floor ------------------------------------------------------------------------------------------------------
// o: { X0, X1, Y0, Y1 (the canvas's extent in plan), rooms: [[X0, X1, Y0, Y1, kind]], h, panel: { X, Y } }. kind 'laundry'
// (band, flowers, the name) or 'plain' (the closet: plain field). Pointy-topped hexagons one inch across the flats, in
// rows running along X (offset half a tile each row), drawn on one canvas at about 8.75 pixels a tile.
export function hexFloor(ctx, W, o) {
  const IN = 12, spanX = (o.X1 - o.X0) * IN, spanY = (o.Y1 - o.Y0) * IN;      // inches
  const P = Math.min(2048 / spanX, 2048 / spanY), CW = Math.round(spanX * P), CH = Math.round(spanY * P);
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const g = cv.getContext('2d');
  const RH = Math.sqrt(3) / 2;                         // the rows' pitch, inches (tiles one inch across)
  // in inches from the canvas's top left (plan X0, Y1): x east, y south
  const toIn = (X, Y) => [(X - o.X0) * IN, (o.Y1 - Y) * IN];
  // ---- the name, on the lattice itself: strokes as polylines in (x inches, y rows), measured from a letter's top left
  const L = 0.75, R = 4.75, T = 0.5, B = 6.5, Mid = 3.5;
  const GLYPH = {
    A: { adv: 7, s: [[[L, B], [L, 1.6], [1.75, T], [3.75, T], [R, 1.6], [R, B]], [[L, 4.5], [R, 4.5]]] },
    N: { adv: 7, s: [[[L, B], [L, T]], [[L, T], [R, B]], [[R, B], [R, T]]] },
    S: { adv: 7, s: [[[R, 1.3], [3.75, T], [1.75, T], [L, 1.3], [L, 2.6], [1.75, Mid], [3.75, Mid], [R, 4.4], [R, 5.7], [3.75, B], [1.75, B], [L, 5.7]]] },
    "'": { adv: 3, s: [[[L, T], [L, 2.1]]] },
    B: { adv: 7, s: [[[L, T], [L, B]], [[L, T], [3.7, T], [R, 1.3], [R, 2.7], [3.7, Mid], [L, Mid]], [[3.7, Mid], [R, 4.3], [R, 5.7], [3.7, B], [L, B]]] },
    E: { adv: 7, s: [[[R, T], [L, T], [L, B], [R, B]], [[L, Mid], [3.75, Mid]]] },
    M: { adv: 8, s: [[[L, B], [L, T], [3.25, 4.2], [5.75, T], [5.75, B]]] },
    T: { adv: 7, s: [[[0.25, T], [5.25, T]], [[2.75, T], [2.75, B]]] },
  };
  const width = s => [...s].reduce((a, ch) => a + GLYPH[ch].adv, 0) - 1.5;
  // the panel: two lines, 7 rows tall each, 3 rows apart, a margin of 3 rows / 5 inches, ruled round in black
  const lines = ["ANNA'S", 'BASEMENT'], Wt = Math.max(...lines.map(width)), MX = 5, MR = 3;
  const panelW = Math.ceil(Wt + 2 * MX), panelRows = MR + 7 + 3 + 7 + MR;
  const [pcx, pcy] = toIn(o.panel.X, o.panel.Y);
  const r0 = Math.round(pcy / RH - panelRows / 2), c0 = Math.round(pcx - panelW / 2);     // the panel's top row, its left inch
  const segs = [];      // [x0, y0, x1, y1] in inches (y in inches: rows * RH)
  lines.forEach((s, li) => {
    let x = Math.round(c0 + (panelW - width(s)) / 2); const rowTop = r0 + MR + li * 10;
    for (const ch of s) { for (const st of GLYPH[ch].s) for (let i = 0; i < st.length - 1; i++) segs.push([x + st[i][0], (rowTop + st[i][1]) * RH, x + st[i + 1][0], (rowTop + st[i + 1][1]) * RH]); x += GLYPH[ch].adv; }
  });
  const onStroke = (x, y) => {
    for (const [ax, ay, bx, by] of segs) {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
      const vx = x - (ax + t * dx), vy = y - (ay + t * dy);
      // a pen wider than it is tall: two tiles across an upright, two rows through a horizontal
      if ((vx / 1.0) ** 2 + (vy / 0.5) ** 2 <= 1) return true;
    }
    return false;
  };
  const px0 = c0 - 0.5, px1 = c0 + panelW + 0.5, py0 = (r0 - 0.5) * RH, py1 = (r0 + panelRows + 0.5) * RH;
  const inPanel = (x, y, m = 0) => x > px0 - m && x < px1 + m && y > py0 - m && y < py1 + m;
  // the ruled frame: one tile wide, a second line two tiles outside it, a flower at each corner
  const onRule = (x, y) => {
    for (const k of [0, 2.5]) {
      const ax0 = px0 - k, ax1 = px1 + k, ay0 = py0 - k * RH, ay1 = py1 + k * RH;
      const inX = x > ax0 - 0.55 && x < ax1 + 0.55, inY = y > ay0 - 0.5 && y < ay1 + 0.5;
      if (inX && inY && (Math.abs(x - ax0) < 0.55 || Math.abs(x - ax1) < 0.55 || Math.abs(y - ay0) < 0.47 || Math.abs(y - ay1) < 0.47)) return true;
    }
    return false;
  };
  // flowers: a ring of six black tiles round a white one, on a lattice every 10 tiles and 8 rows, offset alternately
  const flowerCells = new Set();
  const rows = Math.ceil(spanY / RH) + 2, cols = Math.ceil(spanX) + 2;
  const cellXY = (c, r) => [c + ((r & 1) ? 0.5 : 0), r * RH];
  const neighbours = (c, r) => { const odd = r & 1; return [[c - 1, r], [c + 1, r], [c - 1 + odd, r - 1], [c + odd, r - 1], [c - 1 + odd, r + 1], [c + odd, r + 1]]; };
  for (let r = 4; r < rows; r += 8) for (let c = ((r / 8) | 0) % 2 ? 5 : 0; c < cols; c += 10) {
    const [x, y] = cellXY(c, r), X = o.X0 + x / IN, Y = o.Y1 - y / IN;
    const room = o.rooms.find(q => X > q[0] && X < q[1] && Y > q[2] && Y < q[3]);
    if (!room || room[4] !== 'laundry') continue;
    const d = Math.min(X - room[0], room[1] - X, Y - room[2], room[3] - Y) * IN;
    if (d < 13 || inPanel(x, y, 4)) continue;
    for (const [cc, rr] of neighbours(c, r)) flowerCells.add(cc + ',' + rr);
  }
  for (const [kx, ky] of [[px0 - 2.5, py0 - 2.5 * RH], [px1 + 2.5, py0 - 2.5 * RH], [px0 - 2.5, py1 + 2.5 * RH], [px1 + 2.5, py1 + 2.5 * RH]]) {
    const r = Math.round(ky / RH), c = Math.round(kx - ((r & 1) ? 0.5 : 0)); for (const [cc, rr] of neighbours(c, r)) flowerCells.add(cc + ',' + rr); flowerCells.add(c + ',' + r + '!');
  }
  // paint: grout first (a warm grey, close to the white so it does not shimmer), then every tile
  g.fillStyle = '#c3beb3'; g.fillRect(0, 0, CW, CH);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rad = P / Math.sqrt(3) * 0.93, ang = [0, 1, 2, 3, 4, 5].map(k => Math.PI / 6 + k * Math.PI / 3), vx = ang.map(a => Math.cos(a) * rad), vy = ang.map(a => Math.sin(a) * rad);
  for (let r = -1; r < rows; r++) for (let c = -1; c < cols; c++) {
    const [x, y] = cellXY(c, r), X = o.X0 + x / IN, Y = o.Y1 - y / IN;
    const room = o.rooms.find(q => X > q[0] - 0.05 && X < q[1] + 0.05 && Y > q[2] - 0.05 && Y < q[3] + 0.05);
    if (!room) continue;
    let black = false;
    if (room[4] === 'laundry') {
      const d = Math.min(X - room[0], room[1] - X, Y - room[2], room[3] - Y) * IN;
      black = (d > 6.2 && d < 8.0) || flowerCells.has(c + ',' + r) || flowerCells.has(c + ',' + r + '!') || onRule(x, y) || (inPanel(x, y) && onStroke(x, y));
    }
    const j = rnd();
    g.fillStyle = black ? `rgb(${30 + j * 10 | 0},${29 + j * 9 | 0},${28 + j * 8 | 0})` : `rgb(${236 + j * 9 | 0},${233 + j * 9 | 0},${225 + j * 8 | 0})`;
    const cx = x * P, cy = y * P;
    g.beginPath(); g.moveTo(cx + vx[0], cy + vy[0]); for (let k = 1; k < 6; k++) g.lineTo(cx + vx[k], cy + vy[k]); g.closePath(); g.fill();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const uvOf = (X, Y) => [(X - o.X0) / (o.X1 - o.X0), (Y - o.Y0) / (o.Y1 - o.Y0)];
  const geos = o.rooms.map(([X0, X1, Y0, Y1]) => { const pts = [[X0, Y0, o.h], [X1, Y0, o.h], [X1, Y1, o.h], [X0, Y1, o.h]]; return faceToward(quadGeo(W, pts, pts.map(([X, Y]) => uvOf(X, Y))), W((X0 + X1) / 2, (Y0 + Y1) / 2, o.h + 5)); });
  const m = new THREE.Mesh(mergeGeometries(geos), mat); m.receiveShadow = true; m.name = 'laundry hex floor';
  const [a, b] = [o.rooms[0], o.rooms[o.rooms.length - 1]];
  add(ctx, m, W((a[0] + b[1]) / 2, (a[2] + a[3]) / 2, o.h + 1), Math.max(b[1] - a[0], a[3] - a[2]) / 2);
}

// Paint the thin board seams on one soffit so there are no subpixel cracks between faces.
export function paintedCeiling(ctx, W, { X0, X1, Y0, Y1, ceil }) {
  const canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 1024;
  const g = canvas.getContext('2d'), count = Math.round((Y1 - Y0) / 0.51);
  for (let i = 0; i < count; i++) {
    const y0 = Math.round(i * canvas.height / count), y1 = Math.round((i + 1) * canvas.height / count);
    g.fillStyle = i % 4 === 1 ? '#f4efe4' : '#f6f1e7';
    g.fillRect(0, y0, canvas.width, y1 - y0);
    if (i > 0) { g.fillStyle = '#e9e2d5'; g.fillRect(0, y0, canvas.width, 1); }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  const h = ceil - 0.06, x = (X0 + X1) / 2, y = (Y0 + Y1) / 2;
  const corners = [[X0, Y0, h], [X1, Y0, h], [X1, Y1, h], [X0, Y1, h]];
  const geo = faceToward(quadGeo(W, corners, [[0, 0], [1, 0], [1, 1], [0, 1]]), W(x, y, h - 1));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, color: new THREE.Color().setScalar(0.78), roughness: 0.91 }));
  mesh.name = 'painted laundry ceiling'; mesh.receiveShadow = true;
  add(ctx, mesh, W(x, y, h - 1));
}

// ---- the wallpaper --------------------------------------------------------------------------------------------------
// rects: [[a0, a1, h0, h1]] along a wall that runs along X at plan Y = y (its face toward -Y, the room); the tile is
// tw by th feet. Hung as paper is: the pattern runs on unbroken across every piece.
export function wallpaper(ctx, W, { y, rects, tw, th, url, room }) {
  const tex = new THREE.TextureLoader().load(url); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const pos = [], uv = [];
  for (const [a0, a1, h0, h1] of rects) {
    const c = [[a0, h0], [a1, h0], [a1, h1], [a0, h1]].map(([X, h]) => ({ p: W(X, y, h), t: [X / tw, (h - room.floor) / th] }));
    // seen from the room (from -Y), +X is to the right: wound so that it faces -Y
    for (const i of [0, 2, 1, 0, 3, 2]) { pos.push(c[i].p.x, c[i].p.y, c[i].p.z); uv.push(...c[i].t); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  // (wind it toward the room whatever the world's handedness)
  const n = g.attributes.normal, p0 = W(room.cx, room.cy, room.floor + 4), a = g.attributes.position;
  if (n.getX(0) * (p0.x - a.getX(0)) + n.getY(0) * (p0.y - a.getY(0)) + n.getZ(0) * (p0.z - a.getZ(0)) < 0) {
    for (let i = 0; i < a.count; i += 3) for (const at of [a, g.attributes.uv]) { const k = at.itemSize, t = []; for (let j = 0; j < k; j++) t.push(at.array[(i + 1) * k + j]); for (let j = 0; j < k; j++) { at.array[(i + 1) * k + j] = at.array[(i + 2) * k + j]; at.array[(i + 2) * k + j] = t[j]; } }
    g.computeVertexNormals();
  }
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.name = 'laundry wallpaper';
  add(ctx, m, W(room.cx, y - 1, room.floor + 6), 1);
}

// ---- the painted view in the window ---------------------------------------------------------------------------------
// A drying green on a bright day: sky, a line of hills, a hedge, the lawn, a line of sheets between two posts; at the
// head, the linen blind drawn a third of the way down, lit through from outside. o: { X0, X1, y, h0, h1 } (the glass
// lies in the plane Y = y, facing -Y). By day bright as daylight; at night the view goes to dusk blue, the blind stays
// faintly warm.
export function windowView(ctx, W, o) {
  const cw = 384, ch = Math.round(cw * (o.h1 - o.h0) / (o.X1 - o.X0)), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const g = cv.getContext('2d');
  const blind = 0.3;                                                       // the blind covers the top 30 per cent
  const sky = g.createLinearGradient(0, 0, 0, ch * 0.72); sky.addColorStop(0, '#9fc3e4'); sky.addColorStop(0.6, '#cfe1ee'); sky.addColorStop(1, '#f2efe4'); g.fillStyle = sky; g.fillRect(0, 0, cw, ch);
  // clouds
  let s = 5; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) { const x = rnd() * cw, y = ch * (0.3 + rnd() * 0.22), r = 14 + rnd() * 26; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.8, r * 0.7, 0, 0, Math.PI * 2); g.fill(); }
  // hills, far and near
  const hill = (y0, amp, col, k) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, ch); for (let x = 0; x <= cw; x += 8) g.lineTo(x, y0 + Math.sin(x / cw * k + y0) * amp + Math.sin(x / cw * k * 2.7) * amp * 0.4); g.lineTo(cw, ch); g.closePath(); g.fill(); };
  hill(ch * 0.62, 10, '#a9bccb', 5); hill(ch * 0.67, 8, '#8fae8a', 7);
  // a hedge with round trees in it, then the lawn
  g.fillStyle = '#5f8355'; for (let i = 0; i < 18; i++) { const x = i / 17 * cw, r = 14 + rnd() * 16; g.beginPath(); g.arc(x, ch * 0.71 - r * 0.5, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#6e9460'; g.fillRect(0, ch * 0.71, cw, ch);
  const lawn = g.createLinearGradient(0, ch * 0.71, 0, ch); lawn.addColorStop(0, '#86a96a'); lawn.addColorStop(1, '#a4c07e'); g.fillStyle = lawn; g.fillRect(0, ch * 0.72, cw, ch);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${60 + rnd() * 40},${100 + rnd() * 40},${50},${0.25})`; g.fillRect(rnd() * cw, ch * 0.72 + rnd() * ch * 0.28, 1.5, 3); }
  // the drying line: two posts, a sagging line, sheets on it
  const p0 = [cw * 0.12, ch * 0.62], p1 = [cw * 0.9, ch * 0.6], lineY = x => p0[1] + (p1[1] - p0[1]) * (x - p0[0]) / (p1[0] - p0[0]) + Math.sin((x - p0[0]) / (p1[0] - p0[0]) * Math.PI) * ch * 0.025;
  g.fillStyle = '#7a6248'; for (const p of [p0, p1]) g.fillRect(p[0] - 2, p[1] - 4, 4, ch * 0.84 - p[1]);
  g.strokeStyle = '#6e6458'; g.lineWidth = 1.2; g.beginPath(); for (let x = p0[0]; x <= p1[0]; x += 4) (x === p0[0] ? g.moveTo(x, lineY(x)) : g.lineTo(x, lineY(x))); g.stroke();
  const sheet = (x0, x1, drop, col, stripe) => { g.fillStyle = col; g.beginPath(); g.moveTo(x0, lineY(x0)); for (let x = x0; x <= x1; x += 3) g.lineTo(x, lineY(x)); g.lineTo(x1 + 3, lineY(x1) + drop); for (let x = x1; x >= x0; x -= 6) g.lineTo(x, lineY(x) + drop + Math.sin(x * 0.3) * 3); g.closePath(); g.fill();
    g.fillStyle = 'rgba(120,130,140,.18)'; for (let x = x0 + 6; x < x1; x += 11) g.fillRect(x, lineY(x) + 2, 3, drop - 4);
    if (stripe) { g.fillStyle = stripe; for (let k = 0; k < 3; k++) g.fillRect(x0, lineY(x0) + drop * (0.25 + k * 0.22), x1 - x0, 2.5); } };
  sheet(cw * 0.17, cw * 0.38, ch * 0.13, '#fbfaf6'); sheet(cw * 0.42, cw * 0.55, ch * 0.09, '#f6f3ec', '#7c9cc4'); sheet(cw * 0.6, cw * 0.84, ch * 0.14, '#fdfcf8');
  // the blind: warm linen, three soft folds, lit through
  const bh = ch * blind; const lin = g.createLinearGradient(0, 0, 0, bh); lin.addColorStop(0, '#f4ead6'); lin.addColorStop(1, '#efe2c8'); g.fillStyle = lin; g.fillRect(0, 0, cw, bh);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(150,120,80,${0.05 + rnd() * 0.06})`; g.fillRect(rnd() * cw, rnd() * bh, 1, 2 + rnd() * 3); }
  for (let k = 1; k <= 3; k++) { const y = bh * k / 3.2; const fd = g.createLinearGradient(0, y - 7, 0, y + 5); fd.addColorStop(0, 'rgba(120,90,50,0)'); fd.addColorStop(0.7, 'rgba(120,90,50,.22)'); fd.addColorStop(1, 'rgba(255,250,235,.3)'); g.fillStyle = fd; g.fillRect(0, y - 7, cw, 12); }
  g.fillStyle = 'rgba(110,84,50,.35)'; g.fillRect(0, bh - 3, cw, 3);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const U = { map: { value: tex }, uDay: { value: 1 }, uB: { value: 1 - blind } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float uDay, uB; varying vec2 vUv;
void main() { vec3 t = texture2D(map, vUv).rgb; float bl = step(uB, vUv.y);
  vec3 night = t * vec3(0.10, 0.13, 0.24) + vec3(0.0, 0.005, 0.02);
  vec3 c = mix(night, t * 1.08, uDay);
  c = mix(c, t * mix(vec3(0.62, 0.5, 0.36), vec3(1.1, 1.06, 1.0), uDay), bl);      // the blind: lit through by day, by the room's lamps at night
  gl_FragColor = vec4(c, 1.0);
  ${tone}
}`,
  });
  const pts = [[o.X0, o.y, o.h0], [o.X1, o.y, o.h0], [o.X1, o.y, o.h1], [o.X0, o.y, o.h1]];
  const geo = faceToward(quadGeo(W, pts, [[0, 0], [1, 0], [1, 1], [0, 1]]), W((o.X0 + o.X1) / 2, o.y - 3, (o.h0 + o.h1) / 2));
  // (seen from the room the picture's left is west, -X: the uv above runs u along +X, which is to the viewer's right: so)
  const m = new THREE.Mesh(geo, mat); m.name = 'laundry window view';
  add(ctx, m, W((o.X0 + o.X1) / 2, o.y - 1, (o.h0 + o.h1) / 2), 1);
  ctx.animated.push(() => { U.uDay.value = smooth(ctx.day?.light ?? 1, 0.25, 0.85); });
}

// ---- the laylight ---------------------------------------------------------------------------------------------------
// panes: [[X0, X1, Y0, Y1]] at height h, facing down. Frosted glass with a ruled border and a ring of small squares,
// as the laylights of Edwardian stairwells; behind it, "the sky" by day, warm lamps after dark.
export function laylight(ctx, W, { X0, X1, Y0, Y1, h, panes }) {
  const cw = 512, ch = Math.round(cw * (Y1 - Y0) / (X1 - X0)), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const g = cv.getContext('2d');
  const rg = g.createRadialGradient(cw / 2, ch / 2, 10, cw / 2, ch / 2, cw * 0.62); rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, '#e9edf0'); g.fillStyle = rg; g.fillRect(0, 0, cw, ch);
  let s = 3; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(180,190,200,${rnd() * 0.08})`; g.fillRect(rnd() * cw, rnd() * ch, 2, 2); }
  const m = 22; g.strokeStyle = 'rgba(150,140,120,.55)'; g.lineWidth = 3; g.strokeRect(m, m, cw - 2 * m, ch - 2 * m); g.strokeRect(m + 14, m + 14, cw - 2 * m - 28, ch - 2 * m - 28);
  g.fillStyle = 'rgba(214,196,150,.55)'; for (let x = m + 24; x < cw - m - 20; x += 22) for (const y of [m + 4, ch - m - 10]) g.fillRect(x, y, 7, 7); for (let y = m + 24; y < ch - m - 20; y += 22) for (const x of [m + 4, cw - m - 10]) g.fillRect(x, y, 7, 7);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const U = { map: { value: tex }, uCol: { value: new THREE.Color(1, 1, 1) } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform vec3 uCol; varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(map, vUv).rgb * uCol, 1.0);
  ${tone}
}` });
  const pos = [], uv = [];
  for (const [a0, a1, b0, b1] of panes) {
    const c = [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].map(([X, Y]) => ({ p: W(X, Y, h), t: [(X - X0) / (X1 - X0), (Y - Y0) / (Y1 - Y0)] }));
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(c[i].p.x, c[i].p.y, c[i].p.z); uv.push(...c[i].t); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'laundry laylight';
  add(ctx, mesh, W((X0 + X1) / 2, (Y0 + Y1) / 2, h - 1), 1);
  const day = new THREE.Color(1.0, 1.0, 0.97), night = new THREE.Color(1.0, 0.8, 0.56);
  ctx.animated.push(() => { const L = smooth(ctx.day?.light ?? 1, 0.25, 0.85); U.uCol.value.copy(night).multiplyScalar(0.92).lerp(day.clone().multiplyScalar(1.12), L); });
}

// ---- the washer and the dryer ---------------------------------------------------------------------------------------
// list: [{ kind: 'washer' | 'dryer', X, Y (the middle of the door's glass), h, axis: [dX, dY] (out of the machine),
// r (the drum's mouth), depth }]. The drum (perforated steel) with its three lifters, one mesh, and a load of washing,
// another; E: the drum tumbles this way and that, then spins (the washer), or tumbles one way, warm (the dryer); the
// drum lights up a little while it runs; a chime when it is done.
export function machines(ctx, W, list) {
  const dots = document.createElement('canvas'); dots.width = 128; dots.height = 128; { const g = dots.getContext('2d'); g.fillStyle = '#b9bcbe'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#3a3c3e'; for (let y = 4; y < 128; y += 10) for (let x = (y % 20 ? 4 : 9); x < 128; x += 10) { g.beginPath(); g.arc(x, y, 2.1, 0, Math.PI * 2); g.fill(); } }
  const dtex = new THREE.CanvasTexture(dots); dtex.wrapS = dtex.wrapT = THREE.RepeatWrapping; dtex.repeat.set(6, 2); dtex.colorSpace = THREE.SRGBColorSpace;
  const CLOTH = [0xf1ede4, 0xe9e3d6, 0x9fb3c8, 0xf4f0e8, 0xc8b89c, 0x8ea58a], clothM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const up = new THREE.Vector3(0, 1, 0);
  for (const m of list) {
    const c = W(m.X, m.Y, m.h), e = W(m.X + m.axis[0], m.Y + m.axis[1], m.h), out = new THREE.Vector3(e.x - c.x, e.y - c.y, e.z - c.z).normalize();
    const root = new THREE.Group(); root.position.set(c.x, c.y, c.z); root.quaternion.setFromUnitVectors(up, out);      // local +y: out of the machine
    // the drum: open toward us, its far end a perforated disc, three lifters; one mesh, turning about local y
    const drum = new THREE.Group(); root.add(drum);
    const steel = new THREE.MeshStandardMaterial({ map: dtex, color: 0xc9cccf, roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide, emissive: m.kind === 'dryer' ? 0xff9a40 : 0xbfd8ff, emissiveIntensity: 0 });
    const parts = [new THREE.CylinderGeometry(m.r, m.r, m.depth, 22, 1, true).translate(0, -m.depth / 2 - 0.06, 0), new THREE.CircleGeometry(m.r, 22).rotateX(Math.PI / 2).translate(0, -m.depth - 0.06, 0)];
    for (let k = 0; k < 3; k++) parts.push(new THREE.BoxGeometry(0.14, m.depth * 0.9, 0.1).translate(0, -m.depth / 2 - 0.06, -m.r + 0.06).rotateY(k * Math.PI * 2 / 3));
    drum.add(new THREE.Mesh(mergeGeometries(parts.map(g => (g.index ? g.toNonIndexed() : g))), steel));
    // the washing: a few soft lumps lying in the bottom of the drum, one mesh coloured by its vertices (it tumbles on its own)
    const load = new THREE.Group(); root.add(load);
    let s = m.kind === 'dryer' ? 9 : 4; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const lumps = [];
    for (let k = 0; k < 7; k++) {
      const g = new THREE.SphereGeometry(1, 7, 5).toNonIndexed(), col = new THREE.Color(CLOTH[(k + (m.kind === 'dryer' ? 2 : 0)) % CLOTH.length]);
      const a = Math.PI + (rnd() - 0.5) * 1.6, rr = m.r * (0.55 + rnd() * 0.25);
      g.scale(0.2 + rnd() * 0.12, 0.16 + rnd() * 0.14, 0.12 + rnd() * 0.08); g.rotateX(rnd() * 3); g.rotateY(rnd() * 3); g.translate(Math.sin(a) * rr, -0.25 - rnd() * (m.depth - 0.45), Math.cos(a) * rr);
      const n = g.attributes.position.count, cc = new Float32Array(n * 3); for (let i = 0; i < n; i++) cc.set([col.r, col.g, col.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      lumps.push(g);
    }
    load.add(new THREE.Mesh(mergeGeometries(lumps), clothM));
    // (the bottom of the drum is local -z or +z depending on the world: turn the load so that it lies under the axis)
    const downL = root.worldToLocal(new THREE.Vector3(c.x, c.y - 1, c.z)).normalize(); load.rotation.y = Math.atan2(downL.x, downL.z) - Math.PI;
    load.userData.rest = load.rotation.y;
    add(ctx, root, c, 0.8);
    // running
    const DUR = m.kind === 'dryer' ? 32 : 40;
    let t0 = -1, on = false, now = 0, ang = 0;
    const run = (t, dt) => {
      if (t0 < 0) t0 = t;
      const u = t - t0, d = Math.min(dt ?? 0.016, 0.05);
      let w = 0;
      if (m.kind === 'washer') {
        if (u < DUR - 11) w = 1.6 * Math.sign(Math.sin(u * Math.PI / 7)) * smooth(Math.abs(Math.sin(u * Math.PI / 7)), 0, 0.25);      // this way, that way
        else if (u < DUR - 3) w = 13 * smooth(u, DUR - 11, DUR - 7);                                                                // the spin
        else w = 13 * (1 - smooth(u, DUR - 3, DUR));
      } else w = 2.2 * smooth(u, 0, 2) * (1 - smooth(u, DUR - 2.5, DUR));
      ang += w * d; drum.rotation.y = ang;
      // the washing lifts with the drum and falls back; in the spin it goes round pressed to the wall
      const spin = m.kind === 'washer' ? smooth(Math.abs(w), 6, 11) : 0;
      load.rotation.y = load.userData.rest + (1 - spin) * Math.sin(u * 2.3) * 0.7 * Math.min(1, Math.abs(w)) + spin * ang;
      const k = Math.min(1, u / 1.5) * (1 - smooth(u, DUR - 1.5, DUR));
      steel.emissiveIntensity = (m.kind === 'dryer' ? 0.55 : 0.4) * k;      // a light in the drum while it runs
      if (u >= DUR) {
        on = false; t0 = -1; drum.rotation.y = ang % (Math.PI * 2); load.rotation.y = load.userData.rest; steel.emissiveIntensity = 0;
        const i = ctx.animated.indexOf(run); if (i >= 0) ctx.animated.splice(i, 1);
        try { ctx.sound?.note?.(79, 0, 1.4, 0.05); ctx.sound?.note?.(84, 0.28, 1.8, 0.05); } catch { /* no sound yet */ }
        ctx.flash?.(m.kind === 'dryer' ? 'The dryer stops. Everything in it is warm.' : 'The wash is done. It smells of soap flakes.');
      }
    };
    ctx.animated.push(t => { now = t; });
    ctx.interact.push({ x: c.x, y: c.y, z: c.z, reach: 6, size: m.r, label: () => (on ? (m.kind === 'dryer' ? 'the dryer is going' : 'the wash is going') : (m.kind === 'dryer' ? 'start the dryer' : 'start a wash')),
      act: () => { if (on) { ctx.flash?.(m.kind === 'dryer' ? 'Tumbling. Not long now.' : 'It has a little while to go.'); return; } on = true; t0 = -1; ctx.animated.push(run); ctx.flash?.(m.kind === 'dryer' ? 'The dryer begins to turn.' : 'Water runs in; the drum begins to turn.'); } });
  }
}

// ---- the tap --------------------------------------------------------------------------------------------------------
// mouth: [X, Y, h] of the spout's mouth; floor: h of the basin's floor. E turns it on and off; it turns itself off.
export function tap(ctx, W, { mouth, floor, at }) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 64; const g = c.getContext('2d'), img = g.createImageData(16, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) { const v = y / 64 * 6.2832, a = 0.5 + 0.22 * Math.sin(v * 2 + Math.sin(x * 0.785) * 0.9) + 0.18 * Math.sin(v * 5 + x * 0.785); img.data.set([226, 238, 244, Math.round(255 * Math.max(0.15, Math.min(1, a)))], (y * 16 + x) * 4); }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 3); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  const top = W(...mouth), bot = W(mouth[0], mouth[1], floor), len = top.y - bot.y;
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.016, len, 8, 1, true).translate(0, -len / 2, 0), mat); stream.position.set(top.x, top.y, top.z); stream.renderOrder = 3; stream.visible = false;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.12, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe8f0f2, transparent: true, opacity: 0.35, depthWrite: false })); ring.position.set(bot.x, bot.y + 0.01, bot.z); ring.visible = false;
  let on = false, left = 0;
  add(ctx, stream, top, 0.4, () => on); add(ctx, ring, bot, 0.4, () => on);
  const run = (t, dt) => { tex.offset.y = (t * 2.2) % 1; ring.scale.setScalar(1 + 0.15 * Math.sin(t * 17)); left -= Math.min(dt ?? 0.016, 0.05); if (left <= 0) set(false); };
  const set = v => { on = v; stream.visible = ring.visible = v; left = 25; const i = ctx.animated.indexOf(run); if (v && i < 0) ctx.animated.push(run); if (!v && i >= 0) ctx.animated.splice(i, 1); };
  const p = W(...at);
  ctx.interact.push({ x: p.x, y: p.y, z: p.z, reach: 5.5, size: 0.6, label: () => (on ? 'turn off the tap' : 'turn on the tap'), act: () => set(!on) });
}

// ---- the clock's hands ----------------------------------------------------------------------------------------------
// at: [X, Y, h] the middle of the face, out: [dX, dY] the way it faces; the place's own hour (ctx.day.hour)
export function clock(ctx, W, { at, out, r }) {
  const c = W(...at), e = W(at[0] + out[0], at[1] + out[1], at[2]), n = new THREE.Vector3(e.x - c.x, e.y - c.y, e.z - c.z).normalize();
  const root = new THREE.Group(); root.position.set(c.x, c.y, c.z); root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1d1a17, roughness: 0.5 });
  const hand = (len, w, z) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.012).translate(0, len / 2 - len * 0.15, z), mat); g.add(m); root.add(g); return g; };
  const hh = hand(r * 0.52, 0.045, 0.02), mm = hand(r * 0.78, 0.03, 0.035);
  mm.children[0].geometry = mergeGeometries([mm.children[0].geometry.toNonIndexed(), new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10).rotateX(Math.PI / 2).translate(0, 0, 0.045).toNonIndexed()]);
  add(ctx, root, c, 0.5);
  let last = -1;
  ctx.animated.push(t => {
    if (t - last < 0.5) return; last = t;
    const hr = ctx.day?.hour ?? 13, h12 = hr % 12, mins = (hr % 1) * 60;
    hh.rotation.z = -h12 / 12 * Math.PI * 2; mm.rotation.z = -mins / 60 * Math.PI * 2;
  });
}
