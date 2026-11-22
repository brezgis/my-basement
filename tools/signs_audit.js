// The lettering audit, run in the page by tools/signs_audit.py after signs_audit_init.js. It paints every lettered
// thing again on a canvas of its own and measures each string (does it cross the canvas's edge or a clip, lie over
// another string, is it squeezed, too small, too faint); then it measures how each thing sits in the world (does its
// face look into free air, is it fixed to something, can a standing visitor see it and from how near, how tall are
// its letters there, does anything cross it), tests every wall-hung rectangle against every other and against what
// else is on its wall, and checks that every E prompt can be reached. Returns { signs, labels, loose, warnings }.
async () => {
  const A = window.__signAudit, H = window.__house, t0 = performance.now();
  for (let i = 0; i < 240 && H.pending() > 0; i++) await new Promise(r => setTimeout(r, 500));      // the models arrive a few at a time
  const pendingLeft = H.pending();
  const V = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
  const r2 = v => Math.round(v * 100) / 100;
  const srcOf = at => { const l = Array.isArray(at) ? at : (at ?? '').split('\n').filter(s => s.includes('/src/')).map(s => (/\/src\/([^?:)]+)[^:]*:(\d+)/.exec(s) ?? []).slice(1, 3).join(':')).filter(Boolean); return l.filter(s => !/^(boards|furnish|life|kit|building|builder|main|campus)\.js|^kit\//.test(s)); };

  // ---- 1. every lettered thing, painted again --------------------------------------------------------------
  const signs = [];
  for (const e of H.items.extras) {
    if (e.rug || !(e.draw || e.file)) continue;
    const t = e.tag ?? {}, c = Math.cos(e.rotY ?? 0), s = Math.sin(e.rotY ?? 0), ti = e.tilt ?? 0;
    const g = { kind: t.kind ?? (e.draw ? 'drawn (kit)' : 'picture (kit)'), text: t.text, src: srcOf(t.at), p: [e.x, e.y + (t.dz ?? 0), e.z], w: e.w, h: e.h, ow: t.ow ?? e.w + (e.file ? 0.32 : 0), oh: t.oh ?? e.h + (e.file ? 0.32 : 0),
      flat: !!e.flat, glow: !!e.glow, round: !!e.round, r: [c, 0, -s], u: e.flat ? [-s, 0, -c] : [-s * Math.sin(ti), Math.cos(ti), -c * Math.sin(ti)], n: e.flat ? [0, 1, 0] : [s * Math.cos(ti), Math.sin(ti), c * Math.cos(ti)], front: [s, 0, c], cw: e.cw, ch: e.ch, texts: [], issues: [] };
    if (e.draw) { const cv = document.createElement('canvas'); cv.width = e.cw; cv.height = e.ch; A.cur = g; try { e.draw(cv.getContext('2d', { willReadFrequently: true }), e.cw, e.ch); } catch (err) { g.issues.push({ t: 'error', fail: 1, say: 'its painter threw: ' + err.message }); } A.cur = null; cv.width = cv.height = 0; }
    signs.push(g);
  }
  // the grounds' boards (painted at start-up: their strings were noted on their canvases)
  H.scene.traverse(o => {
    if (!o.isMesh || !/^board/.test(o.name)) return; const cv = o.material.map?.image, m = o.matrixWorld.elements, P = o.geometry.parameters;
    if (o.name === 'board plates') {      // one sheet of several plates, each a band of the canvas: every string must stay in its own band
      const tx = cv?.__texts ?? [], n = Math.round(cv.height / 264);
      for (let i = 0; i < n; i++) { const mine = tx.filter(t => (t.b[1] + t.b[3]) / 2 >= i * 264 && (t.b[1] + t.b[3]) / 2 < (i + 1) * 264).map(t => ({ ...t, b: [t.b[0], t.b[1] - i * 264, t.b[2], t.b[3] - i * 264], ch: 264 })); signs.push({ kind: 'ground plate', text: mine[0]?.s, src: ['grounds.js'], outdoor: true, noWorld: true, w: 2.4, h: 0.79, cw: cv.width, ch: 264, texts: mine, issues: [] }); }
      return;
    }
    if (!P) return;
    signs.push({ kind: 'ground board', src: srcOf(cv?.__texts?.[0]?.at ?? []), outdoor: true, cut: o.material.alphaTest > 0, p: [m[12], m[13], m[14]], r: V.norm([m[0], m[1], m[2]]), u: V.norm([m[4], m[5], m[6]]), n: V.norm([m[8], m[9], m[10]]), w: P.width, h: P.height, ow: P.width, oh: P.height, cw: cv?.width, ch: cv?.height, texts: cv?.__texts ?? [], issues: [] });
  });
  for (const g of signs) { if (!g.front && g.n) g.front = V.norm([g.n[0], 0, g.n[2]]); if (g.n) g.flat = g.flat || g.n[1] > 0.8; }

  // ---- 2. the strings on each canvas -------------------------------------------------------------------------
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  for (const g of signs) {
    const tx = g.texts, tol = 1.5;
    tx.forEach((t, i) => {
      const [x0, y0, x1, y1] = t.b, where = srcOf(t.at)[0] ?? g.src[0], iss = (type, say, fail = 1) => g.issues.push({ t: type, fail, s: t.s, at: where, say });
      if (t.how !== 'fill' || (t.fa ?? 1) < 0.2) return;      // (not the ghosts on a slate, nor a watermark)
      const over = [x0 < -tol ? 'left' : '', x1 > t.cw + tol ? 'right' : '', y0 < -tol ? 'top' : '', y1 > t.ch + tol ? 'bottom' : ''].filter(Boolean);
      if (over.length) iss('edge', `runs off the ${over.join(' and ')} of its canvas by ${Math.round(Math.max(-x0, x1 - t.cw, -y0, y1 - t.ch))} px of ${over[0] === 'top' || over[0] === 'bottom' ? t.ch : t.cw}`);
      else if (t.clip && (x0 < t.clip[0] - tol || x1 > t.clip[2] + tol || y0 < t.clip[1] - tol || y1 > t.clip[3] + tol)) iss('clip', `is cut by a clip (${t.clip.join(', ')}): the string spans ${t.b.map(Math.round).join(', ')}`);
      if (t.sq < 0.8) iss('squeezed', `is squeezed to ${Math.round(t.sq * 100)}% of its width to fit`, t.sq < 0.62 ? 1 : 0);
      if ((t.fa ?? 1) >= 0.5) for (let j = 0; j < i; j++) {      // over an earlier string? (not the same words set a hair off: a shadow, a cut letter's light and dark)
        const o = tx[j]; if (o.how !== 'fill' || (o.fa ?? 1) < 0.5) continue;
        const ix = Math.min(x1, o.b[2]) - Math.max(x0, o.b[0]), iy = Math.min(y1, o.b[3]) - Math.max(y0, o.b[1]); if (ix <= 1 || iy <= 1) continue;
        if (o.s === t.s && Math.abs(o.b[0] - x0) < (y1 - y0) * 0.4 && Math.abs(o.b[1] - y0) < (y1 - y0) * 0.4) continue;
        if (g.kind === 'chalkboard' && (t.s.trim().length < 6 || o.s.trim().length < 6)) continue;      // (a subscript sits against its letter)
        const frac = ix * iy / Math.max(1, Math.min((x1 - x0) * (y1 - y0), (o.b[2] - o.b[0]) * (o.b[3] - o.b[1])));
        if (frac > 0.12 && iy > Math.min(y1 - y0, o.b[3] - o.b[1]) * 0.25) { iss('overlap', `lies over "${o.s.slice(0, 50)}" (${Math.round(frac * 100)}% of the smaller)`); break; }
      }
      if (t.fill && t.bg && t.bg[3] > 0.6 && t.fa >= 0.75) { const a = lum(t.fill), b = lum(t.bg), cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); t.cr = r2(cr); if (cr < 1.9) iss('contrast', `is faint: contrast ${cr.toFixed(2)} to 1 (rgb ${t.fill.join(',')} on ${t.bg.slice(0, 3).join(',')})`, cr < 1.45 ? 1 : 0); }
    });
    // how tall the letters are in the world: the largest, and the size most of the words are in
    const solid = tx.filter(t => t.how === 'fill' && (t.fa ?? 1) >= 0.5 && t.s.trim().length > 1);
    if (solid.length && g.w) {
      const ft = g.w / g.cw, by = [...solid].sort((a, b) => a.cap - b.cap), total = by.reduce((a, t) => a + t.s.length, 0); let acc = 0, body = by[0];
      for (const t of by) { acc += t.s.length; if (acc >= total / 2) { body = t; break; } }
      g.capMax = r2(by.at(-1).cap * ft * 12); g.capBody = r2(body.cap * ft * 12); g.capMin = r2(by[0].cap * ft * 12); g.pxBody = body.cap; g.pxMax = by.at(-1).cap; g.words = total;      // inches; canvas px
      if (g.pxMax < 6) g.issues.push({ t: 'mush', fail: 1, say: `its largest letters are ${g.pxMax.toFixed(1)} px tall on the canvas: mush` });
      else if (g.pxBody < 5) g.issues.push({ t: 'mush', fail: 0, say: `most of its words are ${g.pxBody.toFixed(1)} px tall on the canvas: texture, not text` });
    }
  }

  // ---- 3. the world as triangles in a grid, for rays ------------------------------------------------------------
  H.scene.updateMatrixWorld(true);
  const SKIP = /^(extras|rugs|sky|halos|window light|floor shade|candles|steam|fire|books|book labels|record|island|tree|ground |doors|windsock|board)/, CELL = 3;
  const tri = [], triMesh = [], meshes = [], grid = new Map(), big = [];
  const key = (i, j, k) => ((i + 512) << 20) | ((j + 512) << 10) | (k + 512);
  H.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry?.attributes?.position) return;
    let cat = o.userData.cat, zone = o.userData.zone; for (let q = o.parent; q && (!cat || !zone); q = q.parent) { cat = cat ?? q.userData.cat; zone = zone ?? q.userData.zone; }
    cat = cat ?? o.name ?? ''; if (SKIP.test(cat) || SKIP.test(o.name ?? '')) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material; if (!mat || mat.blending === 2) return;
    const glass = !!mat.transparent && mat.opacity < 0.9, id = meshes.length; meshes.push({ cat, zone: zone ?? '', glass, name: o.name });
    const pos = o.geometry.attributes.position, idx = o.geometry.index, m = o.matrixWorld.elements, n = idx ? idx.count : pos.count, v = new Float64Array(9);
    for (let i = 0; i + 2 < n; i += 3) {
      for (let k = 0; k < 3; k++) { const q = idx ? idx.getX(i + k) : i + k, x = pos.getX(q), y = pos.getY(q), z = pos.getZ(q); v[k * 3] = m[0] * x + m[4] * y + m[8] * z + m[12]; v[k * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; v[k * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14]; }
      const t = triMesh.length; tri.push(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8]); triMesh.push(id);
      const i0 = Math.floor(Math.min(v[0], v[3], v[6]) / CELL), i1 = Math.floor(Math.max(v[0], v[3], v[6]) / CELL), j0 = Math.floor(Math.min(v[1], v[4], v[7]) / CELL), j1 = Math.floor(Math.max(v[1], v[4], v[7]) / CELL), k0 = Math.floor(Math.min(v[2], v[5], v[8]) / CELL), k1 = Math.floor(Math.max(v[2], v[5], v[8]) / CELL);
      if ((i1 - i0 + 1) * (j1 - j0 + 1) * (k1 - k0 + 1) > 3000) { big.push(t); continue; }
      for (let a = i0; a <= i1; a++) for (let b = j0; b <= j1; b++) for (let c = k0; c <= k1; c++) { const kk = key(a, b, c); let l = grid.get(kk); if (!l) grid.set(kk, l = []); l.push(t); }
    }
  });
  const T9 = new Float64Array(tri), stamp = new Uint32Array(triMesh.length); let tick = 0;
  // the nearest thing a ray from o along d (unit) meets within tmax: { t, mesh } or null. glass: 'skip' (default), 'hit'
  function ray(o, d, tmax, glass = 'skip') {
    tick++; let best = null, bt = tmax;
    const e = V.add(o, d, tmax), test = t => {
      if (stamp[t] === tick) return; stamp[t] = tick; const M = meshes[triMesh[t]]; if (M.glass && glass === 'skip') return;
      const q = t * 9, e1x = T9[q + 3] - T9[q], e1y = T9[q + 4] - T9[q + 1], e1z = T9[q + 5] - T9[q + 2], e2x = T9[q + 6] - T9[q], e2y = T9[q + 7] - T9[q + 1], e2z = T9[q + 8] - T9[q + 2];
      const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-12) return;
      const inv = 1 / det, tx = o[0] - T9[q], ty = o[1] - T9[q + 1], tz = o[2] - T9[q + 2], u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) return;
      const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, vv = (d[0] * qx + d[1] * qy + d[2] * qz) * inv; if (vv < 0 || u + vv > 1) return;
      const tt = (e2x * qx + e2y * qy + e2z * qz) * inv; if (tt > 1e-4 && tt < bt) { bt = tt; best = { t: tt, mesh: M }; }
    };
    const i0 = Math.floor(Math.min(o[0], e[0]) / CELL), i1 = Math.floor(Math.max(o[0], e[0]) / CELL), j0 = Math.floor(Math.min(o[1], e[1]) / CELL), j1 = Math.floor(Math.max(o[1], e[1]) / CELL), k0 = Math.floor(Math.min(o[2], e[2]) / CELL), k1 = Math.floor(Math.max(o[2], e[2]) / CELL);
    for (let a = i0; a <= i1; a++) for (let b = j0; b <= j1; b++) for (let c = k0; c <= k1; c++) { const l = grid.get(key(a, b, c)); if (l) for (const t of l) test(t); }
    for (const t of big) test(t);
    return best;
  }
  const what = M => (M ? (M.glass ? 'glass ' : '') + (M.cat.startsWith('model:') ? M.cat.slice(6) : (M.zone || M.cat).replace(/^r:/, '').replace(/[:@].*$/, '')) : '');
  // where a visitor could stand: the floor under (x, z) at or below y, and nothing solid where the body would be
  const EYE = 4.85, RAD = 0.72, cols = H.colliders, surf = H.surfaces;
  function floorUnder(x, z, y) { let best = -Infinity; for (const s of surf) { if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue; const h = s.ramp ? s.h + (s.h2 - s.h) * (s.ax === 'x' ? (s.x1 - x) / (s.x1 - s.x0) : (s.z1 - z) / (s.z1 - s.z0)) : s.h; if (h <= y && h > best) best = h; } const gr = H.groundAt(x, z); if (best === -Infinity && Number.isFinite(gr) && gr <= y + 1) best = gr; return best; }
  function standable(x, z, fl) { for (const c of cols) { if (c.off || c.y1 <= fl + 1.4 || c.y0 >= fl + 5.7) continue; const nx = Math.max(c.x0, Math.min(x, c.x1)), nz = Math.max(c.z0, Math.min(z, c.z1)); if ((x - nx) ** 2 + (z - nz) ** 2 < RAD * RAD) return false; } return true; }
  const sees = (eye, p) => { const d = V.sub(p, eye), l = V.len(d), h = ray(eye, V.norm(d), l - 0.04); return h ? h : null; };

  // ---- 4. each thing in the world -------------------------------------------------------------------------------
  for (const g of signs) {
    if (g.noWorld) continue;
    const iss = (type, say, fail = 1, more = {}) => g.issues.push({ t: type, fail, say, ...more }), small = g.kind === 'drawn (kit)';
    const pts = [[0, 0], [-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]].map(([a, b]) => V.add(V.add(g.p, g.r, a * g.w), g.u, b * g.h));
    // its face: nothing solid within a few inches of it, and something behind it
    const cover = pts.map(p => ray(V.add(p, g.n, 0.012), g.n, 0.3)), nc = cover.filter(Boolean).length;
    if (g.kind !== 'chalkboard' && !/clock/i.test(g.src.join(' ')) && (cover[0] || nc >= 2)) { const h = cover.find(Boolean); iss('buried', `${nc} of 5 points of its face are covered within ${(Math.min(...cover.filter(Boolean).map(c => c.t)) * 12).toFixed(1)} in. (by ${what(h.mesh)})`, cover[0] || nc >= 3 ? 1 : 0); }
    const back = pts.map(p => ray(V.add(p, g.n, 0.012), V.add([0, 0, 0], g.n, -1), 0.4, 'hit')), nb = back.filter(Boolean).length;
    if (!g.cut && !small) { if (!nb) iss('floating', 'nothing is behind it within 5 in.: it hangs in the air'); else if (nb < 4 || !back[0]) iss('half off', `only ${nb} of 5 points of it have anything behind them: it is partly off what it is fixed to`, nb < 3 ? 1 : 0); }
    // anything crossing its plane (an object standing through a card, glass cutting a label)
    const cross = [];
    for (const k of [-0.3, 0, 0.3]) { for (const [a, b, len] of [[V.add(g.p, g.u, k * g.h), g.r, g.w], [V.add(g.p, g.r, k * g.w), g.u, g.h]]) { const o = V.add(V.add(a, b, -len * 0.47), g.n, 0.006), h = ray(o, b, len * 0.94, 'hit'); if (h) cross.push(h); } }
    if (cross.length && !small) iss('crossed', `${what(cross[0].mesh)} passes through its face (${cross.length} of 6 lines across it are cut)`, cross.length >= 2 ? 1 : 0);
    // where it can be read from
    const tries = [];
    if (g.flat) {
      const sides = [['from its foot', V.add([0, 0, 0], g.u, -1)], ['upside down', g.u], ['from its right, sideways', g.r], ['from its left, sideways', V.add([0, 0, 0], g.r, -1)]].map(([name, dir]) => {
        let bestV = null;
        for (const d of [0.9, 1.3, 1.8, 2.4, 3.2]) for (const lat of [0, 0.5, -0.5]) {
          const side = [-dir[2], 0, dir[0]], x = g.p[0] + dir[0] * d + side[0] * lat, z = g.p[2] + dir[2] * d + side[2] * lat, fl = floorUnder(x, z, g.p[1] + 0.2);
          if (fl === -Infinity || g.p[1] - fl > 5.2 || !standable(x, z, fl)) continue;
          const eye = [x, fl + EYE, z], to = V.sub(eye, g.p), dist = V.len(to); if (eye[1] < g.p[1] + 0.4 || V.dot(g.n, to) / dist < 0.3) continue;
          const clear = pts.filter(p => !sees(eye, V.add(p, g.n, 0.012))).length;
          if (clear >= 4 && (!bestV || dist < bestV.d)) bestV = { d: dist, fl, clear, x, z };
        }
        return { name, v: bestV };
      });
      if (sides[0].v) g.view = sides[0].v; else { const o = sides.find(s => s.v); if (o) { g.view = o.v; iss('orientation', `can only be seen ${o.name} (from ${o.v.d.toFixed(1)} ft): from its foot it is hidden, or nobody can stand there`, /exhibits/.test(g.src.join(' ')) ? 1 : 0); } }
      g.pic = g.view;
    } else {
      for (const d of [1.2, 2, 3, 4.5, 6, 9, 14, 20]) for (const lat of [0, 0.4, -0.4]) {
        const x = g.p[0] + g.front[0] * d + g.r[0] * lat * d, z = g.p[2] + g.front[2] * d + g.r[2] * lat * d, fl = floorUnder(x, z, g.p[1] + 0.5);
        if (fl === -Infinity || !standable(x, z, fl)) { if (d === 3 && !lat) tries.push(fl === -Infinity ? 'no floor 3 ft in front of it' : 'something solid stands 3 ft in front of it'); continue; }
        const eye = [x, fl + EYE, z], to = V.sub(eye, g.p), dist = V.len(to); if (V.dot(g.n, to) / dist < 0.25) continue;
        const hits = pts.map(p => sees(eye, V.add(p, g.n, 0.012))), clear = hits.filter(h => !h).length;
        if (clear >= 4 && !hits[0]) { if (!g.view || dist < g.view.d) g.view = { d: dist, fl, clear, x, z }; if (!g.pic && d >= 2.6) g.pic = { d: dist, fl, x, z }; } else if (tries.length < 3) tries.push(`from ${d} ft: hidden by ${what(hits.find(Boolean)?.mesh)}`);
        if (g.view && d >= 3) break;
      }
    }
    if (!g.view) { const d = g.flat ? V.add([0, 0, 0], g.u, -1) : g.front, x = g.p[0] + d[0] * 3, z = g.p[2] + d[2] * 3, fl = floorUnder(x, z, g.p[1] + 0.5); if (fl > -Infinity) g.pic = { d: 3, fl, x, z, guess: true }; }
    if (!g.view) { if (!small) iss('unseen', 'no standing visitor can see it' + (tries.length ? ' (' + tries.slice(0, 2).join('; ') + ')' : '')); continue; }
    g.view.d = r2(g.view.d); g.height = r2(g.p[1] - g.view.fl);
    if (!g.flat && !small && (g.height > 7.4 || g.height + g.h / 2 < 1.6) && (g.capMax ?? 9) / 12 / Math.max(3, g.view.d) < 1 / 60) iss('height', `its middle is ${g.height.toFixed(1)} ft above the floor`, 1);
    if (g.capMax !== undefined && g.kind !== 'chalkboard') {
      const d = g.view.d * 12, need = d / 130;      // a letter under 1/130 of its distance is under 5 px tall on a 760 px screen
      if (g.capMax < need) iss('too small', `its largest letters are ${g.capMax.toFixed(2)} in. tall, read from ${g.view.d.toFixed(1)} ft at the nearest (they want ${need.toFixed(2)} in.)`, small ? 0 : 1);
      else if (g.capBody < need) iss('small', `most of its words are ${g.capBody.toFixed(2)} in. tall, read from ${g.view.d.toFixed(1)} ft at the nearest (they want ${need.toFixed(2)} in.; its heading is ${g.capMax.toFixed(2)})`, 0);
    }
  }

  // ---- 5. wall-hung rectangles against each other and against what else is on the wall ----------------------------
  const hung = signs.filter(g => !g.noWorld && !g.flat && !g.cut && !g.outdoor && g.kind !== 'drawn (kit)' && Math.abs(g.n[1]) < 0.3);
  for (let i = 0; i < hung.length; i++) for (let j = i + 1; j < hung.length; j++) {
    const a = hung[i], b = hung[j], d = V.sub(b.p, a.p); if (Math.abs(d[0]) + Math.abs(d[2]) > 30 || V.dot(a.n, b.n) < 0.97 || Math.abs(V.dot(d, a.n)) > 0.5) continue;
    const gx = Math.abs(V.dot(d, a.r)) - (a.ow + b.ow) / 2, gy = Math.abs(d[1]) - (a.oh + b.oh) / 2; if (gx > 0.17 || gy > 0.17) continue;
    const inside = (p, q) => Math.abs(V.dot(d, a.r)) + p.ow / 2 <= q.ow / 2 + 0.02 && Math.abs(d[1]) + p.oh / 2 <= q.oh / 2 + 0.02;
    if (inside(a, b) || inside(b, a)) continue;                                           // one lies wholly on the other: a paper on a board
    const over = gx < -0.01 && gy < -0.01, name = g => `${g.kind}${g.text ? ' "' + String(g.text).slice(0, 40) + '"' : ''} (${g.src.slice(0, 2).join(' < ') || '?'})`;
    const say = over ? `overlaps ${name(b)} by ${(Math.min(-gx, -gy) * 12).toFixed(1)} in.` : `is ${(Math.max(gx, gy) * 12).toFixed(1)} in. from ${name(b)}`;
    a.issues.push({ t: over ? 'overlaps' : 'near', fail: over ? 1 : 0, say, other: b.src[0] }); b.issues.push({ t: over ? 'overlaps' : 'near', fail: over ? 1 : 0, say: (over ? 'overlaps ' : 'is ' + (Math.max(gx, gy) * 12).toFixed(1) + ' in. from ') + name(a) + (over ? ` by ${(Math.min(-gx, -gy) * 12).toFixed(1)} in.` : ''), other: a.src[0] });
  }
  // a ring of probes 2 in. outside each: the wall should be there, and nothing proud of it
  for (const g of hung) {
    if (g.ow < 0.45 && g.oh < 0.45) continue;
    const ring = grow => { const a = g.ow / 2 + grow, b = g.oh / 2 + grow, out = []; for (const [x, y, side] of [[-a, -b, 'bottom left'], [-a / 2, -b, 'bottom'], [0, -b, 'bottom'], [a / 2, -b, 'bottom'], [a, -b, 'bottom right'], [a, -b / 2, 'right'], [a, 0, 'right'], [a, b / 2, 'right'], [a, b, 'top right'], [a / 2, b, 'top'], [0, b, 'top'], [-a / 2, b, 'top'], [-a, b, 'top left'], [-a, b / 2, 'left'], [-a, 0, 'left'], [-a, -b / 2, 'left']]) { const o = V.add(V.add(V.add(g.p, g.r, x), [0, 1, 0], y), g.n, 0.6), h = ray(o, V.add([0, 0, 0], g.n, -1), 2.2, 'hit'); out.push({ side, s: h ? h.t - 0.6 : null, mesh: h?.mesh }); } return out; };
    let pr = ring(0.17); const med = l => { const v = l.filter(p => p.s !== null).map(p => p.s).sort((a, b) => a - b); return v.length ? v[v.length >> 1] : null; };
    let wall = med(pr);
    if (wall !== null && wall < -0.03) { const wider = ring(0.42), w2 = med(wider); if (w2 !== null && w2 > wall + 0.03) { pr = wider; wall = w2; g.ownFrame = true; } }      // the ring sat on its own frame or board: look farther out
    if (wall === null) { g.issues.push({ t: 'off wall', fail: 1, say: 'there is no wall round it' }); continue; }
    const proud = pr.filter(p => p.s !== null && p.s < wall - 0.035 && !(p.mesh?.glass)), gone = pr.filter(p => p.s === null || p.s > wall + 0.3 || (p.mesh?.glass && p.s > wall + 0.05));
    const sides = l => [...new Set(l.map(p => p.side.split(' ').pop()))].join(', ');
    if (proud.length) g.issues.push({ t: 'crowded', fail: 0, say: `${what(proud[0].mesh)} stands proud of the wall within ${g.ownFrame ? 5 : 2} in. of its ${sides(proud)} (${proud.length} of 16 probes, ${(Math.max(...proud.map(p => wall - p.s)) * 12).toFixed(1)} in. proud)` });
    if (gone.length) g.issues.push({ t: 'off wall', fail: gone.length >= 6 ? 1 : 0, say: `the wall ends or opens within ${g.ownFrame ? 5 : 2} in. of its ${sides(gone)} (${gone.length} of 16 probes: a corner, a window, a doorway)` });
    // and anything standing in front of it, out to a foot and a half
    const front = [[0, 0], [-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]].map(([a, b]) => ray(V.add(V.add(V.add(g.p, g.r, a * g.ow), [0, 1, 0], b * g.oh), g.n, 0.32), g.n, 1.4)).filter(Boolean);
    if (front.length) g.issues.push({ t: 'behind', fail: front.length >= 3 ? 1 : 0, say: `${what(front[0].mesh)} stands ${((front[0].t + 0.32) * 12).toFixed(0)} in. in front of it (${front.length} of 5 points)` });
  }

  // ---- 5b. lettering that hides what it describes: from where each thing is read (and half a pace to each side, the eye
  // at 5.4 ft), rays to a grid of points on every small model within 2 ft; a card that stands in front of more than a
  // fifth of them hides the thing
  const models = [];
  H.scene.traverse(o => { const cat = o.userData?.cat; if (typeof cat !== 'string' || !cat.startsWith('model:')) return; let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], any = false;
    o.traverse(m => { if (!m.isMesh || !m.geometry?.attributes?.position) return; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox, e = m.matrixWorld.elements; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const q = [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]; for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], q[k]); hi[k] = Math.max(hi[k], q[k]); } any = true; } });
    if (any && Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) < 5) models.push({ id: cat.slice(6), lo, hi, c: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2] }); });
  for (const g of signs) {
    if (g.noWorld || !g.view || g.kind === 'chalkboard' || g.kind === 'framed' || g.w > 3.5) continue;
    for (const m of models) {
      if (Math.max(m.lo[0] - g.p[0], g.p[0] - m.hi[0], 0) + Math.max(m.lo[1] - g.p[1], g.p[1] - m.hi[1], 0) + Math.max(m.lo[2] - g.p[2], g.p[2] - m.hi[2], 0) > 2) continue;
      let worst = 0;
      for (const lat of [0, 1.1, -1.1]) {
        const side = g.flat ? g.r : g.r, eye = [g.view.x + side[0] * lat, g.view.fl + 5.4, g.view.z + side[2] * lat]; let hit = 0, n = 0;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
          const q = [m.lo[0] + (m.hi[0] - m.lo[0]) * (0.15 + 0.35 * i), m.lo[1] + (m.hi[1] - m.lo[1]) * (0.15 + 0.35 * j), m.lo[2] + (m.hi[2] - m.lo[2]) * (0.15 + 0.35 * k)], d = V.sub(q, eye), den = V.dot(d, g.n); n++;
          if (Math.abs(den) < 1e-6) continue; const t = V.dot(V.sub(g.p, eye), g.n) / den; if (t <= 0.02 || t >= 0.98) continue;
          const at = V.sub(V.add(eye, d, t), g.p); if (Math.abs(V.dot(at, g.r)) <= g.w / 2 && Math.abs(V.dot(at, g.u)) <= g.h / 2) hit++;
        }
        worst = Math.max(worst, hit / n);
      }
      const wide = g.w / Math.max(0.2, Math.hypot(m.hi[0] - m.lo[0], m.hi[2] - m.lo[2]));
      if (worst > 0.2) g.issues.push({ t: 'hides', fail: 1, say: `stands in front of ${Math.round(worst * 100)}% of ${m.id} as a visitor sees it (the card is ${g.w.toFixed(2)} ft wide, the thing ${Math.hypot(m.hi[0] - m.lo[0], m.hi[2] - m.lo[2]).toFixed(2)})` });
      else if (wide > 0.6 && !g.flat) g.issues.push({ t: 'wide label', fail: 0, say: `is ${Math.round(wide * 100)}% as wide as ${m.id} beside it (a label wants to be about a third)` });
    }
  }

  // ---- 6. the E prompts ---------------------------------------------------------------------------------------
  const labels = (A.labels ?? []).map(l => {
    const p = [l.x, l.y, l.z], out = { label: l.label ?? 'read the label', title: l.title, src: srcOf(l.at), p: p.map(r2), issues: [] }, reach = l.reach ?? 6;
    if (!l.note && !(l.text && String(l.text).trim())) out.issues.push({ t: 'empty card', fail: 1, say: 'its card has no text' });
    if (!l.note && !l.title) out.issues.push({ t: 'empty card', fail: 0, say: 'its card has no title' });
    let ok = false, why = '';
    for (const d of [1.5, 2.5, 3.5, reach * 0.8]) { for (let k = 0; k < 12 && !ok; k++) { const a = k * Math.PI / 6, x = p[0] + Math.cos(a) * d, z = p[2] + Math.sin(a) * d, fl = floorUnder(x, z, p[1] + 0.5); if (fl === -Infinity || p[1] - fl > 14 || p[1] - fl < -0.5 || !standable(x, z, fl)) continue; const eye = [x, fl + EYE, z]; if (V.len(V.sub(eye, p)) > reach) continue; const h = sees(eye, p); if (!h) ok = true; else why = what(h.mesh); } if (ok) break; }
    if (!ok) out.issues.push({ t: 'prompt', fail: 1, say: 'no visitor can stand within reach and see where its prompt is' + (why ? ` (it is behind ${why})` : '') });
    const near = signs.filter(g => g.p && V.len(V.sub(g.p, p)) < 1.3).length; out.near = near;
    return out;
  });
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) { const a = labels[i], b = labels[j]; if (Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]) < 0.35) { a.issues.push({ t: 'prompt', fail: 1, say: `its prompt is in the same place as "${b.title ?? b.label}" (${b.src[0] ?? '?'})` }); } }

  // ---- other canvases painted since the page began (books' labels, covers, the airship's boards): edges only ------
  const loose = [];
  for (const cv of A.loose) { if (signs.some(g => g.texts === cv.__texts)) continue; for (const t of cv.__texts) { if (t.how !== 'fill') continue; const over = t.b[0] < -1.5 || t.b[1] < -1.5 || t.b[2] > t.cw + 1.5 || t.b[3] > t.ch + 1.5; if (over) loose.push({ s: t.s, at: srcOf(t.at)[0] ?? t.at[0], b: t.b, cw: t.cw, ch: t.ch }); } }

  const rooms = H.campus?.rooms ?? [], place = p => { if (!p) return ''; const r = rooms.find(r => p[0] >= r.x0 - 0.4 && p[0] <= r.x1 + 0.4 && p[2] >= r.z0 - 0.4 && p[2] <= r.z1 + 0.4 && p[1] >= r.y0 - 0.2 && p[1] <= r.y1 + 0.2); return r ? (r.site ? r.site + ': ' : '') + r.name : 'outdoors'; };
  for (const l of labels) l.room = place(l.p);
  return { ms: Math.round(performance.now() - t0), pendingLeft, tris: triMesh.length, warnings: A.warnings,
    signs: signs.map(g => ({ kind: g.kind, room: place(g.p), text: g.text ?? g.texts.find(t => t.how === 'fill' && (t.fa ?? 1) >= 0.5)?.s, src: g.src, p: g.p?.map(r2), n: g.n?.map(r2), flat: g.flat, w: r2(g.w), h: r2(g.h), cw: g.cw, ch: g.ch, view: g.view, pic: g.pic ?? g.view, height: g.height, capMax: g.capMax, capBody: g.capBody, pxBody: g.pxBody, nTexts: g.texts.length, issues: g.issues, strings: g.texts.filter(t => t.how === 'fill').slice(0, 40).map(t => t.s.slice(0, 60)) })),
    labels, loose };
}
