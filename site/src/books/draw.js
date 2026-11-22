// Drawing the shelves. Twenty thousand books cannot each be a box (twelve triangles apiece would be a quarter of a
// million), so a book is drawn in two parts:
//
//   - its SPINE, always: one face (two triangles), printed with its own title from the shared sheets (spines.js).
//     All the spines of a room on one sheet are a single mesh. This is what you see across a room or along a
//     range, and it is the same paint, in the same place, as what you find when you walk up to it: nothing swaps.
//   - its HEAD AND SIDES (the paper's edge on top, the cloth where a taller book stands beside a shorter one), only
//     for the shelves within NEAR feet of the eye: one small mesh per sheet, refilled as you walk. Beyond that the
//     head of a book is a sliver under the shelf above, and is left out.
//
// Books lying flat (a pile on a table, a few on a shelf) are few, and are drawn whole.
//
//   const d = drawShelves({ THREE, scene, track, zoneAt }, laid, sheets);      laid: what shelves.js layout() returned
//   d.update(camera)        call now and then (it does nothing unless the eye has moved)
//   d.stats()               { spines, staticTris, nearTris, nearBooks, meshes }

import { CREAM } from './spines.js';

export const NEAR = 11;                 // feet: within this, a shelf's books have heads and sides

export function drawShelves(ctx, laid, sheets) {
  const { THREE, scene } = ctx, { books, rows } = laid;
  const cream = new THREE.Color(CREAM), tmp = new THREE.Color(), colours = new Map();
  const cover = rec => { let c = colours.get(rec.colour); if (!c) { tmp.set(/^#[0-9a-f]{6}$/i.test(rec.colour ?? '') ? rec.colour : '#6b2a25'); colours.set(rec.colour, c = [tmp.r, tmp.g, tmp.b]); } return c; };
  const CR = [cream.r, cream.g, cream.b], WHITE = [1, 1, 1];

  // A growing set of quads: position, normal, uv, colour.
  const bag = () => ({ pos: [], nor: [], uv: [], col: [], n: 0 });
  const quad = (a, P, N, UV, C) => {      // P: four corners counter-clockwise seen from N; UV: four pairs, or one pair for all; C: a colour
    for (let i = 0; i < 4; i++) { a.pos.push(P[i][0], P[i][1], P[i][2]); a.nor.push(N[0], N[1], N[2]); a.col.push(C[0], C[1], C[2]); if (UV.length === 2) a.uv.push(UV[0], UV[1]); else a.uv.push(UV[i][0], UV[i][1]); }
    a.n++;
  };
  // the corners of a book: l/r along the reader's right, f/b front and back, 0/1 foot and head
  const corners = b => {
    const w = b.row, rx = w.rx * b.t / 2, rz = w.rz * b.t / 2, nx = w.nx * b.d / 2, nz = w.nz * b.d / 2, y0 = b.y - b.sy / 2, y1 = b.y + b.sy / 2;
    return { lf0: [b.x - rx + nx, y0, b.z - rz + nz], rf0: [b.x + rx + nx, y0, b.z + rz + nz], rf1: [b.x + rx + nx, y1, b.z + rz + nz], lf1: [b.x - rx + nx, y1, b.z - rz + nz],
      lb0: [b.x - rx - nx, y0, b.z - rz - nz], rb0: [b.x + rx - nx, y0, b.z + rz - nz], rb1: [b.x + rx - nx, y1, b.z + rz - nz], lb1: [b.x - rx - nx, y1, b.z - rz - nz] };
  };
  const spine = (a, b, c, k) => {
    const w = b.row, N = [w.nx, 0, w.nz];
    if (b.lying) quad(a, [k.lf0, k.rf0, k.rf1, k.lf1], N, [[c.u0, c.v1], [c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1]], WHITE);      // the title reads along the shelf
    else quad(a, [k.lf0, k.rf0, k.rf1, k.lf1], N, [[c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1], [c.u0, c.v1]], WHITE);
  };
  const rest = (a, b, k, white, left, right) => {      // head and sides (left, right: whether that side can be seen)
    const w = b.row, col = cover(b.rec);
    quad(a, [k.lf1, k.rf1, k.rb1, k.lb1], [0, 1, 0], white, b.lying ? col : CR);
    if (left) quad(a, [k.lb0, k.lf0, k.lf1, k.lb1], [-w.rx, 0, -w.rz], white, b.lying ? CR : col);
    if (right) quad(a, [k.rf0, k.rb0, k.rb1, k.rf1], [w.rx, 0, w.rz], white, b.lying ? CR : col);
    if (w.src.open && !b.lying) quad(a, [k.rb0, k.lb0, k.lb1, k.rb1], [-w.nx, 0, -w.nz], white, CR);      // a shelf with no back to it: the fore-edge can be seen from the other side
  };
  const geometry = (a, dynamic) => {
    const g = new THREE.BufferGeometry(), idx = new (a.n * 4 > 65535 ? Uint32Array : Uint16Array)(a.n * 6);
    for (let i = 0; i < a.n; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    g.setAttribute('position', new THREE.Float32BufferAttribute(a.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(a.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(a.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(a.col, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    if (dynamic) for (const k of ['position', 'normal', 'uv', 'color']) g.attributes[k].setUsage(THREE.DynamicDrawUsage);
    return g;
  };

  // ---- the spines: one mesh per room and sheet --------------------------------------------------------------------
  const bags = new Map(), meshes = [];
  for (const w of rows) {
    if (!w.count) continue;
    w.zone = ctx.zoneAt ? ctx.zoneAt(w.x, w.y + Math.min(0.4, w.clear / 2), w.z, 0.3) : '';
    for (let i = w.first; i < w.first + w.count; i++) {
      const b = books[i], c = sheets.cell(b.rec); if (!c) continue;
      const key = w.zone + '|' + c.sheet; let a = bags.get(key); if (!a) bags.set(key, a = Object.assign(bag(), { zone: w.zone, sheet: c.sheet, rows: new Set() }));
      const k = corners(b); spine(a, b, c, k);
      if (b.lying) rest(a, b, k, sheets.white(c.sheet), true, true);
      a.rows.add(w);
    }
  }
  let staticTris = 0;
  for (const a of bags.values()) {
    const mesh = new THREE.Mesh(geometry(a), sheets.materials[a.sheet]);
    mesh.receiveShadow = true; mesh.userData.cat = 'books'; mesh.name = 'books ' + a.zone; scene.add(mesh); ctx.track?.(mesh, a.zone);
    for (const w of a.rows) (w.meshes ??= []).push(mesh);
    meshes.push(mesh); staticTris += a.n * 2;
  }

  // ---- heads and sides of the books near the eye ------------------------------------------------------------------
  const near = sheets.materials.map(m => { const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.userData.cat = 'books'; mesh.name = 'books near'; mesh.visible = false; scene.add(mesh); return mesh; });
  const standing = rows.filter(w => w.count && books[w.first + w.count - 1] && !w.src.items?.every(it => it.lying));
  let last = null, lastKey = '', nearBooks = 0, nearTris = 0;
  function update(camera, force) {
    const p = camera.position;
    if (!force && last && p.distanceToSquared(last) < 1.0) return;
    (last ??= new THREE.Vector3()).copy(p);
    const pick = [];
    for (const w of standing) {
      const dy = w.y + w.clear / 2 - p.y; if (Math.abs(dy) > NEAR) continue;
      const ax = (p.x - w.x) * w.rx + (p.z - w.z) * w.rz, dn = (p.x - w.x) * w.nx + (p.z - w.z) * w.nz, da = Math.max(0, Math.abs(ax) - w.len / 2);
      if (dn < -1 || da * da + dn * dn + dy * dy > NEAR * NEAR) continue;      // (behind the shelf: nothing of its books can be seen)
      if (w.meshes && !w.meshes.some(m => m.visible)) continue;                // its room is out of sight
      pick.push(w);
    }
    const key = pick.map(w => w.first).join(',');
    if (key === lastKey) return; lastKey = key;
    const out = sheets.materials.map(bag); nearBooks = 0;
    for (const w of pick) for (let i = w.first; i < w.first + w.count; i++) {
      const b = books[i]; if (b.lying) continue;
      const c = sheets.cell(b.rec); if (!c) continue;
      const L = i > w.first ? books[i - 1] : null, R = i < w.first + w.count - 1 ? books[i + 1] : null;
      const open = (o, gap) => !o || o.lying || gap > 0.02 || o.sy < b.sy - 0.012 || o.d < b.d - 0.03;
      const bs = (b.x - w.x) * w.rx + (b.z - w.z) * w.rz;
      const gl = L ? bs - b.t / 2 - (((L.x - w.x) * w.rx + (L.z - w.z) * w.rz) + L.t / 2) : 1, gr = R ? (((R.x - w.x) * w.rx + (R.z - w.z) * w.rz) - R.t / 2) - (bs + b.t / 2) : 1;
      rest(out[c.sheet], b, corners(b), sheets.white(c.sheet), open(L, gl), open(R, gr)); nearBooks++;
    }
    nearTris = 0;
    out.forEach((a, i) => { near[i].geometry.dispose(); near[i].geometry = geometry(a); near[i].visible = a.n > 0; nearTris += a.n * 2; });
  }

  // ---- the cards at the ends of the ranges --------------------------------------------------------------------------
  const cards = laid.labels.filter(l => l.lines.length);
  if (cards.length) {
    const RES = 200, cw = Math.round(Math.max(...cards.map(l => l.w)) * RES), ch = Math.round(Math.max(...cards.map(l => l.tall)) * RES), cols = Math.max(1, Math.floor(2048 / cw)), H = Math.ceil(cards.length / cols) * ch;
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = H; const g = c.getContext('2d');
    const byZone = new Map(), FACE = '"Goudy House", Georgia, serif';
    cards.forEach((l, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch, W = Math.round(l.w * RES), Hh = Math.round(l.tall * RES);
      g.fillStyle = '#efe7d2'; g.fillRect(x, y, W, Hh); g.strokeStyle = '#3a2f25'; g.lineWidth = 2; g.strokeRect(x + 5, y + 5, W - 10, Hh - 10);
      const lines = l.lines.slice(0, 7), top = l.head ? Hh * 0.2 : 0, lh = Math.min(Hh * 0.2, (Hh * 0.86 - top) / Math.max(lines.length, 2));
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (l.head) { g.fillStyle = '#7a2f2a'; g.font = `600 ${Math.round(Hh * 0.105)}px ${FACE}`; g.fillText(l.head, x + W / 2, y + Hh * 0.15); }
      lines.forEach((ln, k) => {
        const t = ln.name + (ln.span ? '  ' + ln.span : ''); let px = Math.round(lh * 0.74); g.font = `${px}px ${FACE}`;
        while (g.measureText(t).width > W - 26 && px > 8) { px--; g.font = `${px}px ${FACE}`; }
        g.fillStyle = '#231a14'; g.fillText(t, x + W / 2, y + top + Hh * 0.07 + lh * (k + 0.5) + (Hh * 0.86 - top - lh * lines.length) / 2);
      });
      const zone = ctx.zoneAt ? ctx.zoneAt(l.x + l.nx * 0.3, l.y, l.z + l.nz * 0.3, 0.3) : ''; let a = byZone.get(zone); if (!a) byZone.set(zone, a = bag());
      const rx = l.nz, rz = -l.nx, hw = l.w / 2, hh = l.tall / 2, u0 = x / c.width, u1 = (x + W) / c.width, v1 = 1 - y / H, v0 = 1 - (y + Hh) / H;
      quad(a, [[l.x - rx * hw, l.y - hh, l.z - rz * hw], [l.x + rx * hw, l.y - hh, l.z + rz * hw], [l.x + rx * hw, l.y + hh, l.z + rz * hw], [l.x - rx * hw, l.y + hh, l.z - rz * hw]], [l.nx, 0, l.nz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], WHITE);
    });
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0xc8c4bc, roughness: 0.9, envMapIntensity: 0.1, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });      // (a card lies close on its board: it is drawn a hair forward, so the two never flicker)
    for (const [zone, a] of byZone) { const mesh = new THREE.Mesh(geometry(a), mat); mesh.receiveShadow = true; mesh.userData.cat = 'book labels'; mesh.name = 'shelf labels ' + zone; scene.add(mesh); ctx.track?.(mesh, zone); }
  }

  return { update, meshes, near, stats: () => ({ spines: books.length, staticTris, nearTris, nearBooks, meshes: meshes.length }) };
}
