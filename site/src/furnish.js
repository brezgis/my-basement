// The furnishing layer: what stands in the school's rooms. Each building's furniture is one or more files in
// src/furnish/ (listed per building in src/furnish/index.js), each
//
//   export default function (f) { ... }
//
// called once, after the building's own file, with `f`: everything a room is furnished with, in the BUILDING'S
// OWN plan coordinates (X, Y, h, exactly as src/buildings/README.md describes for `b`). The whole interface is
// described, with examples, in src/furnish/README.md. Keep the two in step.
//
// What happens here:
//  - everything a furnish file adds is put in the zone of the room it stands in (visibility.js), so that it is
//    drawn only when that room can be seen: by the room that wholly holds it, else the room its middle is in,
//    else the nearest room of the building. (The building's fabric is 'shell:<site>'; furniture never is.)
//  - the furniture kit (kit.js, kit/) is the building's own (b.kit), so its lamps, seats, candles, models, signs,
//    rugs and books are moved to the island with the building's;
//  - robots (faculty.js), things to eat and drink (hold.js) and the record player (record.js) are collected here
//    in world terms and set going once the scene exists, through the building's `later` list (so main.js does
//    not know about them). ?furnish=0 leaves every room bare; ?faculty=0 leaves the robots out; ?lineup stands
//    the whole roster at the Landing.

import { FURNISH, START } from './furnish/index.js';
import * as boards from './boards.js';
import { byId } from './faculty/roster.js';
import { recordPlayerBody, PLATTER } from './record.js';

const TURNS = { east: 0, north: 1, west: 2, south: 3 };
const BIG = 1.6;                                           // as visibility.js: half-diagonal above which a piece is furniture, not clutter
const Q = new URLSearchParams(globalThis.location?.search ?? '');
const placed = { faculty: [], researchers: [], eats: [], records: [], labels: [], chess: [] };     // what the furnish files asked for that lives after start-up, in world terms
let hooked = false;
const plans = {};                                         // per site: { rooms, world(X, Y, h), yaw(deg) }, for ?room= and ?stand= (below)

// Called by buildCampus for each building, between the building's own function and its finish().
export function furnish(B, site, b, lists) { for (const _ of furnishSteps(B, site, b, lists)); }
// What is set going once the scene exists is listed at the first building, whenever its furniture comes.
export function furnishHook(lists) { if (!hooked) { hooked = true; lists.later.push(start); } }
// The same in steps, one furnish file at a time: when the furniture is put off until the island is on the screen
// (main.js, campus.js furnishRest), a frame can be drawn between one file and the next.
export function* furnishSteps(B, site, b, lists) {
  furnishHook(lists);
  const files = site.alt || Q.get('furnish') === '0' ? [] : FURNISH[site.id] ?? [];

  // ---- this building's rooms, in its own plan coordinates -----------------------------------------------
  const k = TURNS[site.facing] ?? 0, cos = Math.round(Math.cos(k * Math.PI / 2)), sin = Math.round(Math.sin(k * Math.PI / 2)), [ox, oz] = site.origin, g0 = site.ground ?? 0;
  const plan = (x, z) => [(x - ox) * cos - (z - oz) * sin, -(x - ox) * sin - (z - oz) * cos];      // world [x, z] -> plan [X, Y] (the inverse of building.js's P)
  const mine = lists.rooms.filter(r => r.site === site.id);
  const rooms = {};
  for (const r of mine) {
    const [Xa, Ya] = plan(r.x0, r.z0), [Xb, Yb] = plan(r.x1, r.z1), X0 = Math.min(Xa, Xb), X1 = Math.max(Xa, Xb), Y0 = Math.min(Ya, Yb), Y1 = Math.max(Ya, Yb);
    const floor = (r.floor ?? r.y0 + 0.6) - g0, ceil = (r.ceil ?? r.y1 - 0.6) - g0;
    const box = { name: r.name, X0, X1, Y0, Y1, floor, ceil, w: X1 - X0, d: Y1 - Y0, cx: (X0 + X1) / 2, cy: (Y0 + Y1) / 2, world: r };
    (rooms[r.name] ??= { ...box, boxes: [] }).boxes.push(box);      // (the room is a thing of its own, not its first box: taking a later, larger box's size used to overwrite that first box, and the Upper Room's front-west part had no light of its own)
    if (box.w * box.d > rooms[r.name].w * rooms[r.name].d) Object.assign(rooms[r.name], { X0, X1, Y0, Y1, floor, ceil, w: box.w, d: box.d, cx: box.cx, cy: box.cy, world: r });      // a room of several boxes is known by its largest
  }
  const room = name => { const r = typeof name === 'string' ? rooms[name] : name; if (!r) throw new Error(`furnish ${site.id}: no room called "${name}" (there are: ${Object.keys(rooms).join(', ')})`); return r; };
  const roomAtWorld = (x, y, z) => mine.find(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y >= r.y0 && y <= r.y1) ?? null;

  { const Dir = (dX, dY) => [dX * cos - dY * sin, -dX * sin - dY * cos];
    plans[site.id] = { rooms, world: b.world, yaw: deg => { const [dx, dz] = Dir(Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)); return Math.atan2(-dx, -dz); } }; }

  // ---- zones: every piece goes to the room it stands in ---------------------------------------------------
  const away = (r, x, y, z) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1), 3 * Math.max(r.y0 - y, 0, y - r.y1));
  let strays = 0;
  const zoner = (g, mat) => {
    g.computeBoundingBox(); const bb = g.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, cz = (bb.min.z + bb.max.z) / 2;
    const fits = mine.filter(r => bb.min.x >= r.x0 - 0.2 && bb.max.x <= r.x1 + 0.2 && bb.min.z >= r.z0 - 0.2 && bb.max.z <= r.z1 + 0.2 && bb.min.y >= r.y0 - 0.4 && bb.max.y <= r.y1 + 1.6);
    let r = fits.find(q => cy >= q.y0 - 0.05 && cy <= q.y1) ?? fits[0] ?? roomAtWorld(cx, cy, cz);
    if (!r) { r = mine.reduce((best, q) => (!best || away(q, cx, cy, cz) < away(best, cx, cy, cz) ? q : best), null); if (r && away(r, cx, cy, cz) > 2 && !strays++) console.warn(`furnish ${site.id}: something stands outside every room (near ${r.name}); it is drawn with that room`); }
    if (!r) return 'shell:' + site.id;
    const z = 'r:' + r.name + (bb.min.distanceTo(bb.max) / 2 > BIG ? ':big' : ':small');
    return mat === 'vc' ? z + '@' + Math.floor((bb.min.x + bb.max.x) / 16) + ',' + Math.floor((bb.min.z + bb.max.z) / 16) : z;      // (plain colours in 8 ft cells, as visibility.js)
  };

  // ---- f ----------------------------------------------------------------------------------------------------
  const xz = p => { const w = b.world(p[0], p[1], 0); return [w.x, w.z]; };
  const f = {
    // The component stays visible as a unit through an opening.
    inZone(zone, build) {
      const previous = B.zone;
      B.zone = zone;
      try { return build(); } finally { B.zone = previous; }
    },
    site, G: b.G, B: b.B, get kit() { return b.kit; }, draw: boards,
    // raw geometry, as b's (plan boxes X0, X1, Y0, Y1, h0, h1)
    box: b.box, cyl: b.cyl, mesh: b.mesh, block: b.block, surface: b.surface, prism: b.prism,
    // frames: fr(X, Y, h, q) (q: 0 faces +Y, 1 faces -X, 2 faces -Y, 3 faces +X)
    fr: b.fr,
    // rooms: f.rooms['Room 102'], f.room('Room 102') (throws if there is none) -> { name, X0, X1, Y0, Y1, floor, ceil, w, d, cx, cy, boxes }
    rooms, room,
    // a frame lying ON a wall of a room, facing into it, at the middle of the wall and the room's floor: x runs along
    // the wall (0 its middle; to the LEFT of someone looking at the wall), y comes out into the room, z is height
    // above the floor. side: 'front' (the wall toward the building's entrance front, low Y), 'back', 'left' (low X),
    // 'right'. The frame has .len, the wall's length. o: { box: i } for a room of several boxes.
    wall(name, side, o = {}) {
      const r0 = room(name), r = o.box !== undefined ? r0.boxes[o.box] : r0;
      const fr = side === 'front' ? b.fr(r.cx, r.Y0, r.floor, 0) : side === 'back' ? b.fr(r.cx, r.Y1, r.floor, 2) : side === 'left' ? b.fr(r.X0, r.cy, r.floor, 3) : side === 'right' ? b.fr(r.X1, r.cy, r.floor, 1) : null;
      if (!fr) throw new Error(`furnish: a wall is 'front', 'back', 'left' or 'right', not "${side}"`);
      fr.len = side === 'front' || side === 'back' ? r.w : r.d; return fr;
    },
    // a frame standing on a room's floor at plan (X, Y) (default: its middle), turned q quarter turns
    floor(name, X, Y, q = 0) { const r = room(name); return b.fr(X ?? r.cx, Y ?? r.cy, r.floor, q); },
    // light: f.lamp(X, Y, h, { power, kind: 'lamp' | 'candle' | 'fill' }), f.fill(X, Y, h, power). (Fittings you can see: the kit's.)
    lamp: b.lamp, fill: b.fill,
    candle: (fr, x, y, z, tall) => b.kit.candle(fr, x, y, z, tall),
    // somewhere to sit: the eye comes to rest 2.45 ft above (x, y, z) of the frame, facing the frame's front
    seat: (fr, x, y, z, label) => b.kit.seat(fr, x, y, z, label),
    // a collected model from assets/models/<id>/ with its lowest point at height z: o { scale, turn, seat, collide, hang }
    model: (id, fr, x, y, z = 0, dq = 0, o = {}) => b.kit.model(id, fr, x, y, z, dq, o),
    rug: (X0, X1, Y0, Y1, h, style) => b.kit.rug(X0, X1, Y0, Y1, h, style),
    // a computer (a model with a glass named screen: the iMac G3s) standing at a frame's origin, its picture drawn by
    // draw(g, W, H) on the model's own curved glass and lit from within, as the house's iMac is (life.js: onModel).
    // Nothing hangs in front of the tube. o: { scale, turn (a quarter turn), glow (1) }
    computer(id, fr, draw, o = {}) {
      const K = b.kit, pic = { canvas: draw, glow: o.glow ?? 1.0, onModel: true, x: 0, y: fr.h, z: 0, rotY: 0, w: 1, h: 0.74 };
      { const [a, c] = K.world(fr, 0, 0); pic.x = a; pic.z = c; }
      K.extras.push(pic);
      K.model(id, fr, 0, 0, 0, 0, { turn: o.turn ?? Math.PI / 2, scale: o.scale, screen: pic });
    },
    // things that move or answer: ctx => { ... } once the scene exists (ctx as b.later's)
    later: b.later, world: b.world,
    // boards and lettering (boards.js): on a wall frame, by the CENTRE of the thing (x along the wall, z above the frame)
    chalkboard: (fr, x, z, w, tall, draw, o) => boards.chalkboard(b.kit, fr, x, z, w, tall, draw, o),
    sign: (fr, x, z, w, tall, draw, o) => boards.sign(b.kit, fr, x, z, w, tall, draw, o),
    plate: (fr, x, z, text, o) => boards.plate(b.kit, fr, x, z, text, o),
    paper: (fr, x, z, w, tall, what, o) => boards.paperOn(b.kit, fr, x, z, w, tall, what, o),
    // a robot of the faculty (faculty/roster.js): { id, home: [X, Y, h], faces: [X, Y], posts: [[X, Y], ...], field,
    //   serve: { machine: [X, Y], pickup: [X, Y, h], drinks, food }, lines: { greet, idle, bye, topics } }
    faculty(spec) {
      if (!byId(spec.id)) throw new Error(`furnish ${site.id}: nobody on the roster is called "${spec.id}"`);
      const [X, Y, h] = spec.home, w = b.world(X, Y, h ?? 0), r = roomAtWorld(w.x, w.y + 2, w.z);
      if (!r) console.warn(`furnish ${site.id}: ${spec.id} stands in no room, and will be drawn wherever you are`);
      const sv = spec.serve;
      placed.faculty.push({ ...spec, home: [w.x, w.z], y: w.y, room: r, faces: spec.faces ? xz(spec.faces) : null, posts: (spec.posts ?? []).map(xz),
        serve: sv ? { ...sv, machine: xz(sv.machine), pickup: { xz: xz(sv.pickup), y: b.world(sv.pickup[0], sv.pickup[1], sv.pickup[2] ?? 0).y } } : undefined });
    },
    // an ordinary researcher, sitting or standing (faculty/researchers.js): { at: [X, Y, h], facing: [X, Y] or plan degrees, pose, seed, group, lines, seat, top }
    researcher(spec) {
      const [X, Y, h] = spec.at, w = b.world(X, Y, h ?? 0), a = (typeof spec.facing === 'number' ? spec.facing : 90) * Math.PI / 180;
      placed.researchers.push({ ...spec, x: w.x, y: w.y, z: w.z, site: site.id, room: roomAtWorld(w.x, w.y + 1, w.z), face: xz(Array.isArray(spec.facing) ? spec.facing : [X + Math.cos(a), Y + Math.sin(a)]) });
    },
    // something to help yourself to (hold.js): { at: [X, Y, h], name, model | build: THREE => Object3D | drink: { vessel, liquid },
    //   bites, note, scale, plural, label }: "take a ..." appears there; a copy comes away in the hand (Q to eat or sip, R to put down)
    help(e) { const w = b.world(e.at[0], e.at[1], e.at[2]); placed.eats.push({ ...e, x: w.x, y: w.y, z: w.z }); },
    // a chess set you can play (chess.js), standing at (x, y) of a frame on a table top at height z. The visitor sits on
    // the frame's FRONT side (+y), `back` feet from the middle of the board (2.15), and plays White. o: { opponent: a name, back }
    chess(fr, x = 0, y = 0, z = 2.5, o = {}) {
      const [X, Y] = fr.map(x, y), [SX, SY] = fr.map(x, y + (o.back ?? 2.15)), c = b.world(X, Y, fr.h + z), s = b.world(SX, SY, fr.h + Math.max(4.0, z + 1.6));      // (the eye, seated)
      placed.chess.push({ x: c.x, y: c.y, z: c.z, seat: s, opponent: o.opponent });
    },
    // a framed picture from assets/art/<slug>.jpg (tools/art.py makes one from a scan), hung on a wall frame, its middle
    // at (x, z), the picture itself w by tall feet (keep the image's proportions). o: { frame: material ('fir'),
    // border: the moulding's width (0.16), mat: the width of a paper mount (0.18; 0 for none), glass,
    // title, text, foot: a caption card opened with E ("read the caption") }
    framed(fr, x, z, w, tall, slug, o = {}) {
      const n0 = b.kit.extras.length, edge = (o.mat ?? 0.18) + (o.border ?? 0.16);
      b.kit.picture(fr, slug, x, z, w, tall, { frame: o.frame ?? 'fir', border: o.border, mat: o.mat ?? 0.18, glass: o.glass });
      boards.tag(b.kit, n0, { kind: 'framed', text: o.title ?? slug, ow: w + 2 * edge, oh: tall + 2 * edge });      // (for tools/signs_audit.py)
      if (o.title || o.text) f.label(fr, x, 0.15, z, { label: o.label ?? 'read the caption', title: o.title, kicker: o.kicker, text: o.text, foot: o.foot, size: Math.min(w, tall) * 0.5, reach: o.reach });
    },
    // something to read on anything: at (x, y, z) of a frame, E opens a card { title, kicker, text, foot } (card.js);
    // or { note: '...' } says one passing line instead. label: the prompt ('read the label').
    label(fr, x, y, z, o = {}) { const [X, Y] = fr.map(x, y), w = b.world(X, Y, fr.h + z); placed.labels.push({ ...o, x: w.x, y: w.y, z: w.z, at: globalThis.__signAudit ? new Error().stack : undefined }); },
    // the record player (record.js), standing at (x, y) of a frame with its foot at height z (the top of a table or
    // cabinet you provide), its front toward the frame's front. E changes the record.
    recordPlayer(fr, x = 0, y = 0, z = 0) {
      const [X, Y] = recordPlayerBody(b.kit, fr, x, y, z), w = b.world(X, Y, fr.h + z + PLATTER.top), r = roomAtWorld(w.x, w.y, w.z);
      placed.records.push({ x: w.x, y: w.y, z: w.z, room: r ? { name: r.name, site: r.site } : null });
    },
  };

  const T = (globalThis.__furnishMs ??= {});      // (how long each file took: start-up timings)
  for (let i = 0; i < files.length; i++) {
    const was = [B.zone, B.zoner], t0 = performance.now(); B.zone = null; B.zoner = zoner;
    b.kit.reseed(START.get(files[i])?.[site.id] ?? (20261110 + 104729 * (i + 1)) % 2147483647);      // each file's own run of chance (furnish/index.js START)
    try { files[i](f); } catch (e) { console.error(`furnishing ${site.id} failed:`, e); }
    [B.zone, B.zoner] = was; T[site.id + ':' + i] = Math.round(performance.now() - t0);
    yield site.id;
  }
}

// Standing somewhere by the building's own plan, for looking and for test pictures (add &shot to hide the welcome):
//   ?room=Room 102            the middle of that room, looking along +Y (into the building); ?room=Room 102,180 looks along -X ...
//   ?stand=snow:60,30,4,90    in Snow Hall at plan X 60, Y 30, feet at h 4, looking along plan angle 90 (0 is +X, 90 is +Y);
//                             a fifth number is the pitch in degrees, up positive
function standAt(ctx) {
  let v = null;
  if (Q.has('stand')) {
    const [id, rest] = Q.get('stand').split(':'), [X, Y, h = 0, deg = 90, pitch = 0] = (rest ?? '').split(',').map(Number), p = plans[id];
    if (p && Number.isFinite(X) && Number.isFinite(Y)) { const w = p.world(X, Y, h); v = [w.x, w.y, w.z, p.yaw(deg), pitch * Math.PI / 180]; } else console.warn('stand: give ?stand=<site>:X,Y,h,degrees');
  } else if (Q.has('room')) {
    const [name, deg = '90', pitch = '0'] = Q.get('room').split(',');
    for (const p of Object.values(plans)) { const r = p.rooms[name]; if (r) { const w = p.world(r.cx, r.cy, r.floor); v = [w.x, w.y, w.z, p.yaw(Number(deg)), Number(pitch) * Math.PI / 180]; } }
    if (!v) console.warn('room: there is no room called', name, '(there are:', Object.values(plans).flatMap(p => Object.keys(p.rooms)).join(', ') + ')');
  }
  if (v) setTimeout(() => { window.__house?.setView({ walk: v }); document.body.classList.add('ready'); }, 0);      // (main.js's own hooks exist by then)
}

// Once the scene exists: what is held in the hand, the faculty, the record player.
function start(ctx) {
  standAt(ctx);
  if (globalThis.__signAudit) globalThis.__signAudit.labels = placed.labels;      // (tools/signs_audit.py)
  ctx.items.eats = placed.eats;
  const rec = placed.records[0];
  if (rec) ctx.sound.places.music = { x: rec.x, z: rec.z, room: rec.room };      // where the music comes from (sound.js), before the visitor steps in
  if (placed.records.length > 1) console.warn('furnish: more than one record player; only the first plays');
  for (const l of placed.labels) ctx.interact.push({ x: l.x, y: l.y, z: l.z, reach: l.reach ?? 6, size: l.size ?? 0.8, label: () => l.label ?? 'read the label',
    act: () => (l.note ? ctx.flash(l.note) : import('./card.js').then(m => m.showCard({ title: l.title ?? '', kicker: l.kicker, text: l.text ?? '', foot: l.foot })).catch(e => console.warn('card', e))) });
  // The parts that are set going once the scene exists (books, the faculty, chess, the record player...) take turns, one a
  // frame: they arrive together, and run back to back they made one frame of more than half a second just after the
  // threshold lifted.
  let turns = Promise.resolve();
  const inTurn = (name, f) => (turns = turns.then(() => new Promise(ok => requestAnimationFrame(() => { try { f(); } catch (e) { console.warn(name, e); } ok(); }))));
  if (ctx.items.books?.length) import('./books.js').then(m => inTurn('books', () => m.setupBooks(ctx))).catch(e => console.warn('books', e));      // every book on a shelf can be taken down
  import('./hold.js').then(m => inTurn('hold', () => m.setupHold(ctx))).catch(e => console.warn('hold', e));
  if (Q.get('faculty') !== '0' && (placed.faculty.length || placed.researchers.length || Q.has('lineup') || Q.has('crowd'))) import('./faculty.js').then(m => inTurn('faculty', () => m.hireFaculty(ctx, placed.faculty, placed.researchers))).catch(e => console.warn('faculty', e));
  // Hire the bathhouse staff after furnishings have registered their footprints.
  if (Q.get('staff') !== '0') import('./staff.js').then(m => inTurn('staff', () => m.hireStaff(ctx, plans, Q.get('staff') || '1'))).catch(e => console.warn('staff', e));
  if (placed.chess[0]) import('./chess.js').then(m => inTurn('chess', () => m.setupChess(ctx, placed.chess[0]))).catch(e => console.warn('chess', e));
  if (rec) import('./record.js').then(m => inTurn('record', () => m.setupRecord(ctx, rec))).catch(e => console.warn('record', e));
}
