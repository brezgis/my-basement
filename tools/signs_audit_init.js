// Runs in the page before anything else (tools/signs_audit.py): every string painted on a 2D canvas is noted with
// its measured extent, its type size, its colour against what is under it, the clip in force and the place in the
// source it was painted from. While window.__signAudit.cur is set (signs_audit.js paints each sign in turn) the
// notes go to that sign; otherwise to the canvas (canvas.__texts), for the boards the grounds paint at start-up.
(() => {
  const A = window.__signAudit = { warnings: [], cur: null, loose: [], on: true };
  const P = CanvasRenderingContext2D.prototype, st = new WeakMap();
  const S = g => { let s = st.get(g); if (!s) st.set(g, s = { clip: null, stack: [], path: null }); return s; };
  const dev = (g, x, y) => { const m = g.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
  const add = (g, pts) => { const s = S(g), p = s.path ?? (s.path = [Infinity, Infinity, -Infinity, -Infinity]); for (const [x, y] of pts) { const [X, Y] = dev(g, x, y); if (X < p[0]) p[0] = X; if (Y < p[1]) p[1] = Y; if (X > p[2]) p[2] = X; if (Y > p[3]) p[3] = Y; } };
  const before = (name, fn) => { const orig = P[name]; if (!orig) return; P[name] = function (...a) { try { fn(this, a); } catch { /* the audit never breaks a painting */ } return orig.apply(this, a); }; };
  before('save', g => { const s = S(g); s.stack.push(s.clip ? [...s.clip] : null); });
  before('restore', g => { const s = S(g); if (s.stack.length) s.clip = s.stack.pop(); });
  before('beginPath', g => { S(g).path = null; });
  before('rect', (g, [x, y, w, h]) => add(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]));
  before('roundRect', (g, [x, y, w, h]) => add(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]));
  before('moveTo', (g, [x, y]) => add(g, [[x, y]]));
  before('lineTo', (g, [x, y]) => add(g, [[x, y]]));
  before('quadraticCurveTo', (g, [a, b, x, y]) => add(g, [[a, b], [x, y]]));
  before('bezierCurveTo', (g, [a, b, c, d, x, y]) => add(g, [[a, b], [c, d], [x, y]]));
  before('arc', (g, [x, y, r]) => add(g, [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]]));
  before('ellipse', (g, [x, y, rx, ry]) => { const r = Math.max(rx, ry); add(g, [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]]); });
  before('clip', (g, a) => { if (a[0] instanceof Path2D) return; const s = S(g), p = s.path; if (!p) return; const c = s.clip ?? [0, 0, g.canvas.width, g.canvas.height]; s.clip = [Math.max(c[0], p[0]), Math.max(c[1], p[1]), Math.min(c[2], p[2]), Math.min(c[3], p[3])]; });

  const caps = new Map(), cols = new Map(), probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); probe.canvas.width = probe.canvas.height = 1;
  const colour = c => { if (typeof c !== 'string') return null; let v = cols.get(c); if (!v) { probe.clearRect(0, 0, 1, 1); probe.fillStyle = c; probe.fillRect(0, 0, 1, 1); const d = probe.getImageData(0, 0, 1, 1).data; cols.set(c, v = [d[0], d[1], d[2], d[3] / 255]); } return v; };
  const where = () => (new Error().stack ?? '').split('\n').filter(l => l.includes('/src/')).map(l => (/\/src\/([^?:)]+)[^:]*:(\d+)/.exec(l) ?? []).slice(1, 3).join(':')).filter(Boolean).slice(0, 6);
  function note(g, s, x, y, max, how) {
    const cv = g.canvas; if (!A.on || !cv || !String(s).trim()) return;
    const m = g.measureText(s), mt = g.getTransform(), scale = Math.sqrt(Math.abs(mt.a * mt.d - mt.b * mt.c));
    let l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight, sq = 1;
    if (max !== undefined && m.width > max) { sq = max / m.width; l *= sq; r *= sq; }
    const pts = [[x - l, y - m.actualBoundingBoxAscent], [x + r, y - m.actualBoundingBoxAscent], [x + r, y + m.actualBoundingBoxDescent], [x - l, y + m.actualBoundingBoxDescent]].map(p => dev(g, p[0], p[1]));
    const b = [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
    let cap = caps.get(g.font); if (cap === undefined) { const h = g.measureText('H'); caps.set(g.font, cap = h.actualBoundingBoxAscent + h.actualBoundingBoxDescent); }
    const rec = { s: String(s), b: b.map(v => Math.round(v * 10) / 10), px: +(parseFloat((/([\d.]+)px/.exec(g.font) ?? [])[1]) * scale).toFixed(1), cap: +(cap * scale).toFixed(1), sq: +sq.toFixed(2), how,
      clip: S(g).clip?.map(Math.round) ?? null, cw: cv.width, ch: cv.height, rot: Math.abs(mt.b) > 0.02, at: where() };
    const cur = A.cur;
    if (cur && how === 'fill') {      // the colour against what is under it (only for the signs being audited: reading pixels is slow)
      const f = colour(g.fillStyle), x0 = Math.max(0, Math.floor(b[0])), y0 = Math.max(0, Math.floor(b[1])), w = Math.min(cv.width, Math.ceil(b[2])) - x0, h = Math.min(cv.height, Math.ceil(b[3])) - y0;
      if (f && w > 0 && h > 0) {
        rec.fill = f.slice(0, 3); rec.fa = +(f[3] * g.globalAlpha).toFixed(2);
        try { const d = g.getImageData(x0, y0, Math.min(w, 200), Math.min(h, 60)).data; let R = 0, G = 0, B = 0, Al = 0, n = d.length / 4; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; Al += d[i + 3]; } rec.bg = [Math.round(R / n), Math.round(G / n), Math.round(B / n), +(Al / n / 255).toFixed(2)]; } catch { /* tainted */ }
      }
    }
    if (cur) cur.texts.push(rec);
    else { if (!cv.__texts) { cv.__texts = []; A.loose.push(cv); } if (cv.__texts.length < 600) cv.__texts.push(rec); }
  }
  before('fillText', (g, [s, x, y, max]) => note(g, s, x, y, max, 'fill'));
  before('strokeText', (g, [s, x, y, max]) => note(g, s, x, y, max, 'stroke'));
})();
