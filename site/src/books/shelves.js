// Shelves: where books stand, and which book stands where. Pure (no three.js, no page): node can test it.
//
// The furniture kit does not make books any more: it records SHELF ROWS (a box on a shelf: where it is, which way
// it faces, how much clear height it has, what it should hold), and when the book list has arrived every row is
// filled, in order, from the catalogue. So the titles on a shelf are a matter of the catalogue and the plan, not of
// the order in which spines happened to be painted, and a shelf can be asked for a subject.
//
// A row is recorded in the kit's own coordinates (the building's plan, before the building is moved to its place).
// Each kit also lists three PROBES (plain points at (0,0), (1,0), (0,1) of those coordinates) among its books, which
// the building moves into place with everything else: from them the rows are moved too. (That is the whole of what
// this needs from the building; an engine that moved `kit.shelves.rows` itself would not need the probes.)
//
//   set.row({ x, z, sx, sz, q, y, clear, ... })   a row: centre and extent of its footprint, facing q (0..3, as a kit
//                                                 frame), shelf surface at y, `clear` under the shelf above
//       items: [{ s0, s1, d0, d1, z0, h, lying }]  books whose places are already decided (s along the row from the
//                                                 reader's LEFT end, d out from the row's back, h null: by the title)
//       items: null                               a row filled when the titles are known (thickness by the title)
//       subject, run, fill, thick, jitter         what it holds; which sequence it continues; how far along it is full; how stout
//   set.run(name, { subject, fit, fill, thick, start })  a named sequence of rows (start: the class it begins with): titles go on in the order the rows were
//                                                 made, round and round the collection. fit: n makes the books just
//                                                 stout enough that the rows hold the collection n times over.
//   set.label({ x, y, z, q, w, tall, from, to, head })   a card saying what rows [from, to) hold (set.rows.length marks a place)
//
//   layout(sets, catalogue, { roomOf, rooms })  ->  { books, rows, labels, stats }   in world feet

import { bookKey, hash01, describe } from './catalogue.js';

export const SETS = [];                 // every kit's shelves, in the order the kits were made
const DIRS = [[0, 1], [-1, 0], [0, -1], [1, 0]];

export function makeShelfSet() {
  const probe = (x, z) => ({ x, y: 0, z, sx: 0, sy: 0, sz: 0, q: 0, lying: false, probe: true });
  const set = { id: SETS.length, rows: [], labels: [], runs: {}, probes: [probe(0, 0), probe(1, 0), probe(0, 1)],
    row(r) { r.seq = set.rows.length; set.rows.push(r); return r; },
    run(name, o = {}) { return (set.runs[name] = { ...(set.runs[name] ?? {}), ...o }); },
    label(l) { set.labels.push(l); return l; } };
  SETS.push(set);
  return set;
}

// How stout, tall and deep a book is, from its record alone (so every copy of it is the same book).
const SIZE = { small: { t: 0.09, h: [0.56, 0.66], d: [0.42, 0.5] }, medium: { t: 0.12, h: [0.68, 0.78], d: [0.48, 0.56] }, large: { t: 0.15, h: [0.8, 0.9], d: [0.54, 0.62] }, folio: { t: 0.19, h: [0.94, 1.06], d: [0.6, 0.68] } };
const lerp = (a, u) => a[0] + (a[1] - a[0]) * u;
export const thickOf = rec => (SIZE[rec.size] ?? SIZE.medium).t * (0.8 + 0.4 * hash01('t' + bookKey(rec)));
export const tallOf = rec => lerp((SIZE[rec.size] ?? SIZE.medium).h, hash01('h' + bookKey(rec)));
export const deepOf = rec => lerp((SIZE[rec.size] ?? SIZE.medium).d, hash01('d' + bookKey(rec)));
const GAP = 0.006;                      // between neighbours
// A book made k times as stout (library bindings; a run fitted to its shelves). Past 1.3 the thin ones gain more than
// the thick, so that no folio comes out half a foot through.
const stout = (t, k) => k * (0.115 + (t - 0.115) * Math.min(1, 1.3 / k));

export function layout(sets, cat, o = {}) {
  const roomOf = o.roomOf ?? (() => null), ROOMS = o.rooms ?? {}, rows = [], labels = [], runs = new Map();
  // ---- every row into the world --------------------------------------------------------------------------------
  for (const set of sets) {
    const [p0, p1, p2] = set.probes, ex = [p1.x - p0.x, p1.z - p0.z], ez = [p2.x - p0.x, p2.z - p0.z], k = p0.q ?? 0;
    const at = (x, z) => [p0.x + x * ex[0] + z * ez[0], p0.z + x * ex[1] + z * ez[1]];
    const first = rows.length;
    for (const r of set.rows) {
      const [x, z] = at(r.x, r.z), q = (r.q + k) % 4, d = DIRS[q], nx = d[0], nz = -d[1], rx = nz, rz = -nx;      // n: out of the shelf; r: the reader's right
      const sx = k % 2 ? r.sz : r.sx, sz = k % 2 ? r.sx : r.sz, len = Math.abs(nx) > 0.5 ? sz : sx, depth = Math.abs(nx) > 0.5 ? sx : sz;
      const y = r.y + p0.y, room = roomOf(x, y + 0.4, z);
      const run = r.run ? set.runs[r.run] ?? {} : null, subject = r.subject ?? run?.subject ?? ROOMS[room] ?? ROOMS['*'] ?? null;
      const key = r.run ? 'run:' + set.id + ':' + r.run : 'room:' + set.id + ':' + (room ?? '') + ':' + JSON.stringify(subject);
      const w = { set: set.id, seq: r.seq, x, y, z, nx, nz, rx, rz, len, depth, clear: r.clear, room, subject, src: r, books: [],
        fill: r.fill ?? run?.fill ?? 0.96, thick: r.thick ?? run?.thick ?? 1.3, jitter: r.jitter ?? 0.03 };
      rows.push(w);
      if (!runs.has(key)) runs.set(key, { key, subject, fit: run?.fit ?? 0, start: run?.start, rows: [] });
      runs.get(key).rows.push(w);
    }
    for (const l of set.labels) {
      const [x, z] = at(l.x, l.z), q = (l.q + k) % 4, d = DIRS[q];
      labels.push({ x, y: l.y + p0.y, z, nx: d[0], nz: -d[1], w: l.w, tall: l.tall, head: l.head ?? '', rows: rows.slice(first + l.from, first + l.to), lines: [] });
    }
  }
  // ---- fill them, run by run --------------------------------------------------------------------------------------
  const stats = { spines: 0, titles: new Set(), runs: [] };
  const place = (w, s0, s1, d0, d1, z0, h, rec, lying) => {
    const sm = (s0 + s1) / 2 - w.len / 2, dm = (d0 + d1) / 2 - w.depth / 2, t = s1 - s0, dd = d1 - d0;
    w.books.push({ x: w.x + w.rx * sm + w.nx * dm, y: w.y + z0 + h / 2, z: w.z + w.rz * sm + w.nz * dm,
      sx: Math.abs(w.rx) * t + Math.abs(w.nx) * dd, sy: h, sz: Math.abs(w.rz) * t + Math.abs(w.nz) * dd, nx: w.nx, nz: w.nz, t, d: dd, rec, lying: !!lying, row: w });
  };
  // one run's rows filled from its collection at a given stoutness; `cap`: stop after this many titles (no copy more)
  const fill = (run, col, scale, cap) => {
    let n = 0, spines = 0;
    const off = run.start ? Math.max(0, col.findIndex(r => r.shelf === run.start)) : 0, next = () => col[(off + n) % col.length];      // (a run may begin at another class: the same round, entered elsewhere)
    for (const w of run.rows) {
      const max = w.clear - 0.05; w.books = [];
      if (w.src.items) {              // places decided by the kit: left to right, a pile from the bottom up
        const items = [...w.src.items].sort((a, b) => a.s0 - b.s0 || a.z0 - b.z0);
        for (const it of items) {
          const rec = next(); n++;
          place(w, it.s0, it.s1, it.d0, it.d1, it.z0 ?? 0, it.h ?? Math.min(it.hmax ?? max, tallOf(rec)), rec, it.lying);
        }
      } else {
        // from the reader's left, as far along as the shelf is full (a library leaves the end of a shelf empty, some more than others)
        const k = scale || w.thick, depthMax = w.depth - 0.02, end = Math.min(w.len - 0.01, w.len * w.fill * (0.9 + 0.2 * hash01('f' + w.set + ':' + w.seq)));
        let s = 0.012;
        for (let guard = 0; guard < 400 && n < cap; guard++) {
          const rec = next(), key = bookKey(rec) + '#' + Math.floor(n / col.length), t = stout(thickOf(rec), k);
          if (hash01('g' + key) < 0.012) { const gap = 0.1 + 0.2 * hash01('w' + key); if (s + gap + t > end) break; s += gap; }      // a volume is out
          if (s + t > end) break;
          const dp = Math.min(depthMax, deepOf(rec)), d1 = w.depth - w.jitter * hash01('j' + key);
          place(w, s, s + t, d1 - dp, d1, 0, Math.min(max, tallOf(rec)), rec, false);
          s += t + GAP; n++;
        }
      }
      spines += w.books.length;
    }
    return { n, spines };
  };
  for (const run of runs.values()) {
    const col = run.subject ? cat.collection(run.subject) : [];
    if (!col.length) { stats.runs.push({ key: run.key, titles: 0, spines: 0 }); continue; }
    let scale = 0, done;
    if (run.fit) {
      // Just stout enough that these rows hold the collection `fit` times over: tried, measured and tried again
      // (a book that will not fit at the end of a row goes on to the next, so it cannot be worked out beforehand).
      // It is left a hair slender, and the filling stops when the last copy is on: a little shelf is left over at
      // the end rather than a few titles coming round again beside their own copies.
      const natural = col.reduce((s, r) => s + thickOf(r), 0) / col.length, room = run.rows.reduce((s, w) => s + (w.src.items ? 0 : (w.len - 0.1) * w.fill), 0);
      scale = Math.max(0.9, Math.min(2.1, (room / (run.fit * col.length) - GAP) / natural));
      for (let i = 0; i < 5; i++) {
        const r = fill(run, col, scale, Infinity), passes = r.n / col.length, want = run.fit * 1.004;
        if (Math.abs(passes - want) < 0.003) break;
        const to = Math.max(0.9, Math.min(2.1, scale * passes / want)); if (to === scale) break; scale = to;
      }
      done = fill(run, col, scale, run.fit * col.length);
    } else done = fill(run, col, 0, Infinity);
    for (const w of run.rows) for (const b of w.books) stats.titles.add(b.rec);
    stats.spines += done.spines;
    stats.runs.push({ key: run.key, titles: col.length, spines: done.spines, passes: +(done.n / col.length).toFixed(2), scale: +scale.toFixed(2) });
  }
  const books = [];
  for (const w of rows) { w.first = books.length; for (const b of w.books) books.push(b); w.count = w.books.length; }
  for (const l of labels) l.lines = describe(cat, l.rows.flatMap(w => w.books.map(b => b.rec)));
  return { books, rows, labels, stats };
}
