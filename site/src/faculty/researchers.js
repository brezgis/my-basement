// The research staff: plain working robots of half a dozen makes, who inhabit the place. Who they are is one
// cohort (faculty/researcher_cohort.js): eighteen, named, each with its group, its make, its touches and its places,
// the same at every hour. Where they may sit or stand is given by the furnish files, each with
//
//   f.researcher({ at: [X, Y, h], facing: [X, Y] or degrees, pose, seed, group, lines, seat, top })      (src/furnish/README.md)
//
// which now marks a SPOT, not a robot (furnish.js hands this file its place in world terms: { x, y, z, face: [x, z],
// room, pose, seed, group, lines, seat, top }): a chair at a desk with the work left out on it (a laptop open, a
// book, papers), a place at a bench, a seat in a lecture room. A spot is used when one of the cohort is there.
// What they do with their day, and how they get from one place to another, is faculty/researcher_life.js; how they
// look is faculty/researcher_looks.js. ?crowd stands one of each make at the Landing instead (faculty.js), each
// kept to its own spot.
//
// Cheap, all of them together: their bodies and heads are one batched mesh (each its own geometry, a matrix each,
// one draw), their eyes, the lids that make them smile, their hands, their cups and spanners one instanced mesh
// each; what is on the tables is merged by room and drawn with the room. The faces are alive: each blinks on its
// own time, glances about, looks down at its work, narrows its eyes to concentrate, and smiles when spoken to; and
// they turn to the visitor as she comes up (manners.js attendVisitor: the eyes first, then the head, then, if it is
// standing, the body; seated, only the head and shoulders). Nothing runs for anyone the visitor is not near.

import { paint, xform as T, merge, sph, cyl, solid } from './models.js';
import { makeLooks, rng } from './researcher_looks.js';
import { COHORT } from './researcher_cohort.js';
import { Member, makeFloors, weighted } from './researcher_life.js';
import { attendVisitor, engageVisitor, VR } from './manners.js';

const TAU = Math.PI * 2;
export const GROUPS = {
  matter: { name: 'Complex Matter', colour: '#3d6e9a', match: /matter/i },
  systems: { name: 'Complex Systems Theory', colour: '#8a3d6b', match: /system/i },
  machine: { name: 'Machine Intelligence', colour: '#e0723c', match: /machine|learning/i },
  neural: { name: 'Neural Computation', colour: '#a8a34a', match: /neur/i },
  morpho: { name: 'Morphogenesis', colour: '#3f7a52', match: /morpho/i },
  collective: { name: 'Collective Behavior', colour: '#c9a02e', match: /collect|behav/i },
  mind: { name: 'Foundations and Mind', colour: '#5d3a5a', match: /mind|found/i },
};
const groupOf = g => (g && (GROUPS[g] ? g : Object.keys(GROUPS).find(k => GROUPS[k].match.test(g)))) || null;
// (none of these is used in Anna's House, on Vesper Street, or on the roster)
const NAMES = ['Abel', 'Ada', 'Alba', 'Amos', 'Anouk', 'Arlo', 'Bea', 'Bertie', 'Birdie', 'Blythe', 'Bruno', 'Calla', 'Cato', 'Cleo', 'Cora', 'Dara', 'Davy', 'Edda', 'Edie', 'Elio', 'Elsie', 'Enid', 'Esme', 'Etta', 'Ewan', 'Faye', 'Freya', 'Gil', 'Greer', 'Hal', 'Hattie', 'Hugo', 'Ida', 'Ivo', 'Jem', 'Joss', 'Lark', 'Leda', 'Lena', 'Lior', 'Lotte', 'Luca', 'Mae', 'Magnus', 'Maud', 'Milo', 'Mina', 'Nils', 'Noor', 'Orla', 'Otto', 'Pearl', 'Perry', 'Petra', 'Posy', 'Rafe', 'Rhea', 'Rufus', 'Runa', 'Sage', 'Selma', 'Silas', 'Tess', 'Theo', 'Tilda', 'Una', 'Vera', 'Wilf', 'Yara', 'Zora'];
const SHELLS = ['#c9c2b2', '#9aa7ad', '#7f9a8c', '#b9a58a', '#8d93a8', '#a98a7c', '#d9d2c2', '#93a3b8', '#a7ad8f', '#bfae9e', '#8fa6a0', '#b59aa8'];
const EYES = ['#ffe2b0', '#fff0c0', '#dfeaff', '#c8fff0', '#ffd9a0', '#f4eee2'];
// What they say when spoken to: a line for their group, or for what they are doing. Short, and about the work.
const SAY = {
  matter: ['The magnet is cold enough now. We wait for it to make up its mind.', 'Above the critical point it is all the same stuff. Below, it has to choose.', 'I spent the morning watching sand. It is called a measurement.', 'The cryostat has opinions. I have learned not to argue.'],
  systems: ['Three rules, and I cannot tell you what they will do. That is the whole subject.', 'The model is simple. The behaviour is not. I am writing up the gap.', 'It was a fixed point on Monday. This morning it is a cycle.', 'Power laws everywhere, if you squint. I am trying not to squint.'],
  machine: ['The loss went down. I do not yet know what it learned.', 'It works. Finding out why is the thesis.', 'I gave it more layers. It gave me more questions.', 'Training since Tuesday. I am told this is normal.'],
  neural: ['One cell does almost nothing. I am counting how many it takes.', 'The trace is noise until it suddenly is not.', 'Each of them only fires or does not. And yet here we are, talking.', 'The recording ran all night. So, in a sense, did I.'],
  morpho: ['The flatworms regrew their heads again. We are still surprised.', 'Nobody tells a cell where it is. It works it out from its neighbours.', 'Stripes or spots: it comes down to how fast two things spread.', 'A leaf is a decision made many thousands of times.'],
  collective: ['No ant knows the way. The colony does.', 'The flock turned before any one bird could have decided to.', 'The slime mould found the short way round again. No brain. Good at it.', 'I follow one of them for an hour. Then I follow all of them at once.'],
  mind: ['I have been on one sentence since ten o\'clock. It is a good sentence.', 'Whether the room understands is still open. I have a seminar on it at four.', 'A category you learned and a category that is there: is that two things, or one?', 'I came in to find a reference and stayed for the argument.'],
  sit: ['Ten minutes. Then back to it.', 'The coffee here is better than the results today.'],
  read: ['Third time through this paper. It is starting to give.', 'Just this chapter, and then I will tell you what I think.'],
  type: ['One more paragraph. I have said that for an hour.', 'Qualifying exam on Friday. Don\'t ask.'],
  write: ['If I write it down, I find out whether I believe it.', 'It was clearer in my head. It usually is.'],
  stand: ['Careful of the bench. It took all week to set up.', 'Nearly there. It is always nearly there.'],
  listen: ['Shh. This is the good part.', 'I sit in on this one every year.'],
  talk: ['We were just disagreeing. Productively.', 'Give us a minute, we nearly have it.'],
  browse: ['It was on this shelf last week. Someone has been reading it.', 'I only came for one book.'],
  window: ['I think better looking at something far off.', 'Look at the light out there.'],
  think: ['Hold on. I nearly had it.', 'Walking helps. Sitting down again helps more.'],
  walk: ['Just on my way to the other room.', 'I left my notes somewhere along here.'],
  tech: ['It was working yesterday. That is all anyone ever tells me.', 'Do not touch that one. It is level, and it took all morning.', 'Whatever it is, it is usually a loose connector.', 'I keep the one spanner that fits. Nobody else knows where.', 'They design it on Monday and I find out on Friday whether it can be built.', 'If it hums, it is fine. If it stops humming, come and find me.'],
};
const SEATED = { sit: 1, read: 1, type: 1, write: 1, listen: 1 };
const POSES = { sit: 1, read: 1, type: 1, write: 1, listen: 1, stand: 1, talk: 1 };
// how many of the cohort a room holds at once (a lecture room: never more than three in the audience; others two)
const CAP = { 'Museum': 5, 'Reading Room': 4, 'Museum Basement': 4, 'Delivery Room': 3, 'Book Room': 3, 'The Stone Library': 3 };

export function hireResearchers(H, specs) {
  const { ctx, W } = H, THREE = ctx.THREE, Q = new URLSearchParams(location.search), LK = makeLooks(THREE), { MAKES, MAKE_IDS, frame } = LK;
  const rod = LK.rod, box = LK.box;
  // ---- the shared parts of the old round make, kept for faculty/outdoors.js (its walkers are drawn by it) ----
  const headGeo = merge([paint(sph(0.34, 12, 8), '#ffffff'), paint(T(new THREE.SphereGeometry(0.346, 8, 4, Math.PI / 2 - 0.85, 1.7, 1.02, 0.78), {}), '#1b1517'), paint(T(cyl(0.012, 0.016, 0.16, 4), { p: [0, 0.4, 0] }), '#6b5a48'), paint(T(sph(0.035, 5, 4), { p: [0, 0.49, 0] }), '#ffffff')]);
  const eyeGeo = merge([-1, 1].map(s => T(new THREE.CircleGeometry(0.05, 8), { p: [s * 0.115, 0.045, 0.332], r: [-0.12, s * 0.33, 0] })));
  const handGeo = paint(T(sph(0.085, 7, 5), { s: [1, 0.85, 1.15] }), '#f4eee2');
  const cupGeo = merge([paint(T(cyl(0.075, 0.06, 0.15, 10), { p: [0, 0.075, 0] }), '#efe6d2'), paint(T(cyl(0.065, 0.065, 0.006, 10), { p: [0, 0.146, 0] }), '#4a2c1a'), paint(T(new THREE.TorusGeometry(0.04, 0.012, 4, 8, Math.PI), { p: [0.075, 0.08, 0], r: [0, 0, -Math.PI / 2] }), '#efe6d2')]);
  const toolGeo = merge([paint(box(0.035, 0.36, 0.02, [0, 0.14, 0]), '#b9bcc0'), paint(T(new THREE.TorusGeometry(0.05, 0.018, 4, 8, Math.PI * 1.5), { p: [0, 0.35, 0], r: [0, 0, 0.8] }), '#b9bcc0')]);      // a spanner, for the technical staff
  const dummy = new THREE.Object3D(), col = new THREE.Color(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

  // ---- who one is, from its seed: name, make, colours (and, from a stream of its own, its touches) ----
  const used = new Set(Object.values(ctx.faculty ?? {}).map(c => c.name));
  function mintAny(sp, i) {
    const seed = sp.seed ?? (i + 1) * 17, R = rng(seed), pick = a => a[Math.floor(R() * a.length)], pose = SAY[sp.pose] && sp.pose !== 'tech' ? sp.pose : 'stand', gk = groupOf(sp.group);
    let name = sp.name ?? NAMES[Math.floor(R() * NAMES.length)]; for (let k = 0; used.has(name) && k < NAMES.length; k++) name = NAMES[(NAMES.indexOf(name) + 1) % NAMES.length]; used.add(name);
    const size0 = 0.92 + R() * 0.2, wear = pick(['scarf', 'satchel', 'none', 'none']), r = { sp, i, seed, name, pose, seated: !!SEATED[pose], group: gk, groupColour: gk ? GROUPS[gk].colour : '#8a8f96', shell: pick(SHELLS), accent: pick(['#7a2f2a', '#2f4a40', '#3d5873', '#8f6a24', '#5d3a5a', '#6c7a60']), eye: pick(EYES), eyeH: 0.55 + R() * 0.95, wear: sp.wear ?? wear,
      seat: sp.seat ?? 1.55, top: sp.pose === 'stand' || !SEATED[pose] ? (sp.top ?? 0) : (sp.top ?? 2.5), phase: R() * 40, tempo: 1 / (9 + R() * 8) };
    r.role = sp.role === 'tech' || /tech/i.test(sp.group ?? '') ? 'tech' : null;
    const pool = MAKE_IDS.map(id => [id, MAKES[id].weight * (r.role === 'tech' ? ({ drum: 2.5, box: 2, wide: 1.5 }[id] ?? 0.5) : 1)]); let u = R() * pool.reduce((a, b) => a + b[1], 0), make = pool[0][0]; for (const [id, wgt] of pool) { u -= wgt; if (u <= 0) { make = id; break; } }
    r.make = MAKES[sp.make] ? sp.make : make;
    const M = MAKES[r.make], top1 = M.lift + M.th + (M.neck ?? 0) + M.head + M.hr;
    r.size = sp.size ?? Math.min(size0 * (r.seated ? 1 : 1.2), r.seated ? 1.12 : 5.1 / top1);
    // a touch or two of its own (its own stream, so the seed still gives the name and colours it always gave)
    const P = rng(seed ^ 0x51ed27), pk = a => a[Math.floor(P() * a.length)];
    const tc = { antenna: P() < 0.55 ? (r.make === 'round' || r.make === 'drum' || r.make === 'box' ? 'stub' : 'none') : pk(['none', 'ball', 'bent', 'two', 'stub']), bulb: pk(['#e0723c', '#c8fff0', '#ffd9a0', '#dfeaff']), visorW: 0.9 + P() * 0.22, visorH: 0.9 + P() * 0.2 };
    const extra = [['glasses', () => pk(['#3a2f28', '#8a6a3a', '#c9a45c', '#2a2622'])], ['pencil', () => (P() < 0.5 ? 1 : -1)], ['sticker', () => [-0.8 + P() * 1.6, 0.3 + P() * 0.3, pk(['#e0723c', '#3f7a52', '#c9a02e', '#3d6e9a', '#8a3d6b'])]], ['patch', () => [-0.15 + P() * 0.3, 0.35 + P() * 0.3]], ['cardigan', () => pk(['#7c8a5a', '#8a3d4b', '#3d5873', '#8f6a24', '#6b5a7a'])], ['mug', () => true]];
    for (const [k, f] of extra) if (P() < 0.16) tc[k] = f();
    r.touches = { ...tc, ...(sp.touches ?? {}) };
    r.w = M.w * r.size;
    return r;
  }
  // (as it was before there were makes: the round one, at the size it had. faculty/outdoors.js mints its walkers with this.)
  function mint(sp, i) { const r = mintAny({ make: 'round', ...sp }, i); if (sp.size === undefined && !sp.make) r.size = Math.min(r.size, 1.12) / (r.seated ? 1 : 1.2); return r; }
  // what is on the table in front of a spot, in its own frame (y = 0 the floor, facing +z)
  function props(pose, tt, accent, role, front = 0.35) {
    const g = [], P = (geo, colour) => g.push(paint(geo, colour));
    if (pose === 'type') { P(box(0.66, 0.03, 0.44, [0, tt + 0.015, 0.84]), '#b9bcc0'); P(box(0.66, 0.42, 0.025, [0, tt + 0.21, 1.1], [0.28, 0, 0]), '#8f969b'); P(box(0.6, 0.36, 0.01, [0, tt + 0.21, 1.086], [0.28, 0, 0]), '#dfe9f4'); }
    if (pose === 'read') { for (const sx of [-1, 1]) { P(box(0.3, 0.035, 0.42, [sx * 0.155, tt + 0.03, 0.8], [0, 0, sx * 0.12]), '#f1e9d6'); P(box(0.31, 0.012, 0.44, [sx * 0.155, tt + 0.008, 0.8], [0, 0, sx * 0.12]), accent); } }
    if (pose === 'write') { P(box(0.42, 0.02, 0.54, [0.05, tt + 0.01, 0.8], [0, 0.12, 0]), '#f4eee2'); P(box(0.42, 0.022, 0.05, [0.02, tt + 0.011, 1.05], [0, 0.12, 0]), accent); }
    if (pose === 'stand' && tt && tt < 4.4 && role !== 'tech') P(box(0.34, 0.02, 0.26, [-0.3, tt + 0.01, front + 0.5], [0, 0.2, 0]), '#f4eee2');
    return g;
  }
  // one researcher's body as it once was (trunk, what it wears, and what is on its table), in its own frame: for outdoors.js
  function statics(r, bare = false) {
    const F = frame(r), s = r.size, g = [T(LK.body(bare ? { ...r, touches: {} } : r, r.seated, bare), { s: [s, s, s], p: [0, F.hip, F.z] })];      // (bare, for outdoors.js: without the touches, which its bodies have no room for)
    if (!bare) g.push(...props(r.pose, r.top, r.accent, r.role, F.front));
    return g;
  }

  // ---- the spots ----
  const spots = [], byRoom = new Map();
  const ACC = ['#7a2f2a', '#2f4a40', '#3d5873', '#8f6a24', '#5d3a5a', '#6c7a60'];
  function addSpot(sp) {
    const pose = POSES[sp.pose] ? sp.pose : 'stand', seated = !!SEATED[pose], seat = sp.seat ?? 1.55;
    const s = { i: spots.length, sp, pose, seated, seat, top: !seated ? (sp.top ?? 0) : (sp.top ?? 2.5), x: sp.x, z: sp.z, y: seated ? sp.y - seat : sp.y, yaw: Math.atan2(sp.face[0] - sp.x, sp.face[1] - sp.z), room: sp.room ?? null, site: sp.site ?? sp.room?.site ?? '',
      lines: (sp.lines ?? []).filter(l => !/asleep|sleep|dream|snor|nap\b/i.test(l)), seed: sp.seed ?? spots.length * 17, role: sp.role === 'tech' || /tech/i.test(sp.group ?? '') ? 'tech' : null, by: null, here: false };
    s.key = s.room ? `${s.site}|${s.room.name}` : 'out'; s.accent = ACC[Math.floor(rng(s.seed)() * ACC.length)];
    for (const d of ctx.house.doors ?? []) if ((d.y0 ?? -1e9) < s.y + 3 && (d.y1 ?? 1e9) > s.y + 1 && Math.hypot(d.cx - s.x, d.cz - s.z) < 3) console.warn(`researcher spot (${s.site} ${s.room?.name ?? ''}, ${pose}, seed ${s.seed}) is ${Math.hypot(d.cx - s.x, d.cz - s.z).toFixed(1)} ft from a door: keep 3 ft clear of doorways`);
    let G = byRoom.get(s.key); if (!G) byRoom.set(s.key, G = { key: s.key, room: s.room, list: [], built: false, checked: false });
    G.list.push(s); s.G = G; spots.push(s); return s;
  }
  specs.forEach(addSpot);
  for (const s of spots) if (s.pose === 'talk') s.partner = spots.filter(o => o !== s && o.pose === 'talk' && o.key === s.key).sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))[0] ?? null;
  // what is on the tables, merged by room and drawn with the room
  function buildProps(G) {
    G.built = true; const parts = [];
    for (const s of G.list) for (const g of props(s.pose, s.top, s.accent, s.role)) parts.push(g.applyMatrix4(new THREE.Matrix4().makeRotationY(s.yaw).setPosition(s.x, s.y, s.z)));
    G.probe = new THREE.Object3D(); if (G.room) ctx.track?.(G.probe, 'r:' + G.room.name);
    if (!parts.length) return;
    const m = G.mesh = new THREE.Mesh(merge(parts), solid()); m.receiveShadow = true; m.castShadow = false; H.group.add(m); if (G.room) ctx.track?.(m, 'r:' + G.room.name);
  }
  // the manners of where a spot is: a standing place not in a doorway, at a stair or in an aisle (looked at once, when first come near)
  function check(G, F) {
    G.checked = true; if (!F) return;
    for (const s of G.list) { if (s.seated) continue; const l = F.plan.laneAt(s.x, s.z);
      if (l === 2 || l === 3 || l === 4) console.warn(`researcher spot (${s.site} ${s.room?.name ?? ''}, ${s.pose}, seed ${s.seed}, at ${s.x.toFixed(1)}, ${s.z.toFixed(1)}) stands ${l === 2 ? 'in a doorway' : l === 3 ? 'at a stair' : 'in an aisle under 5 ft 6 wide'}: move it to open floor`); }
  }

  // ---- the cohort (or, for ?crowd, one fixed to each spot) ----
  const floors = makeFloors(H), crowdMode = Q.has('crowd');
  const camF = new THREE.Frustum(), camM = new THREE.Matrix4(), sphere = new THREE.Sphere();
  const speaking = new Set();
  const L = { H, W, floors, spots, members: [], windows: ctx.house.windows ?? [], now: 0, hold: false, audit: null,
    visitorAt() { const v = W.visitor; if (!v.present) return null; const s = ctx.walker?.seated; return s ? { x: s.x, y: v.y, z: s.z } : v; },
    visitorSeat() { return W.visitor.present ? ctx.walker?.seated ?? null : null; },
    stint: () => 80 + Math.random() * 160,
    takenBy: (self, x, z, r) => W.taken(self, x, z, r) || L.members.some(o => o !== self && !o.hidden && o.errandAt && Math.hypot(o.errandAt.x - x, o.errandAt.z - z) < r),
    // could she see someone at (x, y, z) on floor F? In front of her, near enough, and nothing solid between
    seen(x, y, z, F) {
      const v = W.visitor; if (!v.present) return false;
      const d = Math.hypot(x - v.x, z - v.z); if (Math.abs(y - v.y) > 10 || d > 80) return false;
      sphere.center.set(x, y + 1.6, z); sphere.radius = 1.8; if (!camF.intersectsSphere(sphere)) return d < 4;
      if (F && Math.abs(v.y - F.y) < 3 && F.plan.inBoxes(v.x, v.z)) return F.plan.see(v.x, v.z, x, z);
      const in_ = H.room ?? ctx.room; if (in_ && F && in_.site !== F.site) return false;      // (indoors in another building: not through its walls)
      return F ? d < 28 : d < 60;      // (from outside, through a window)
    },
    say(r, text, secs = 4.5, kind) {
      r.bubble ??= H.bubbles.make(r.name);
      const pool = text ? [text] : r.spot?.lines?.length && r.spot.here && kind !== 'chat' ? r.spot.lines : r.role === 'tech' ? SAY.tech : [...(r.group ? SAY[r.group] : []), ...(SAY[r.act] ?? SAY.walk)], n = pool.length;
      r.lineAt = ((r.lineAt ?? r.seed) + 1) % n; r.bubble.say(pool[r.lineAt], secs, W.now); speaking.add(r);
      if (kind !== 'chat') { r.talkUntil = W.now + secs; ctx.sound?.chirp?.([72 + (r.seed % 5) * 2, 76 + (r.seed % 4) * 2]); }
    },
    choose: (r, arriving = false) => choose(r, arriving) };
  let classrooms = null;
  const roomCount = key => L.members.filter(o => (o.spot ?? o.dest)?.key === key).length;
  // the next of its places: weighted by the roster, a little toward where she is, never a full room or a chair she is in
  function choose(r, arriving) {
    classrooms ??= new Set(Object.values(ctx.faculty ?? {}).filter(c => c.lec && c.spec.room).map(c => `${c.spec.room.site}|${c.spec.room.name}`));
    const v = L.visitorAt(), seat = L.visitorSeat(), hour = ctx.day?.hour ?? 13, late = hour >= 20 || hour < 6, here = (r.spot ?? r.dest)?.key, cands = [];
    for (const [name, w0] of r.places) {
      const free = spots.filter(s => s.room?.name === name && !s.by && !(v && Math.abs(v.y - s.y) < 3 && Math.hypot(v.x - s.x, v.z - s.z) < 2.5) && !(seat && Math.hypot(seat.x - s.x, seat.z - s.z) < 1.5));
      if (!free.length) continue;
      const key = free[0].key; if (key === here && !arriving) continue;
      const cap = classrooms.has(key) ? 3 : CAP[name] ?? 2; if (roomCount(key) - (key === here ? 1 : 0) >= cap) continue;
      let w = w0 * (late && /Reading Room|Stone Library/.test(name) ? 1.4 : 1);
      if (v && free.some(s => Math.hypot(v.x - s.x, v.z - s.z) < 90 && Math.abs(v.y - s.y) < 16)) w *= 2.2;
      cands.push([{ free, key, cls: classrooms.has(key) }, w]);
    }
    const c = weighted(cands); if (!c) return null;
    // in a lecture room, a seat in the audience; a place to talk only if somebody is at the other one
    return weighted(c.free.map(s => [s, (c.cls ? (s.pose === 'listen' ? 3 : s.seated ? 1.5 : 0.2) : 1) * (s.pose === 'talk' ? (s.partner?.by ? 4 : 0.15) : 1) * (r.role === 'tech' && s.pose === 'stand' ? 3 : 1)]));
  }
  // the look and the life of one member
  const members = L.members;
  function hire(look, i) {
    const r = new Member(L, look); r.i = i; r.places = look.places ?? []; r.fixed = !!look.fixed;
    r.blinkBase = 2.6 + Math.random() * 2.6; r.blinkIn = Math.random() * 4; r.blinkTwice = false; r.sacAt = Math.random() * 3; r.gx = 0; r.gy = 0; r.gxT = 0; r.gyT = 0; r.nextMicro = 4 + Math.random() * 12; r.lift = new Map();
    r.box = { x0: 0, x1: 0, z0: 0, z1: 0, y0: -1e5, y1: -1e5 + 1, staff: true, researcher: true }; ctx.colliders.push(r.box);
    r.item = { x: 0, y: -1e5, z: 0, reach: 7, size: 1.0, label: () => `talk to ${r.name}`, act: () => L.say(r) }; ctx.interact.push(r.item);
    members.push(r); return r;
  }
  if (crowdMode) spots.forEach((s, i) => { const r = hire({ ...mintAny(s.sp, i), fixed: true }, i); r.placeAt(s); r.stintEnd = 1e9; });
  else if (spots.length) {
    for (const [i, c] of COHORT.entries()) { if (used.has(c.name)) console.warn('researchers: the cohort\'s', c.name, 'shares a name with a teacher'); const look = mintAny({ seed: c.seed, name: c.name, group: c.group, make: c.make, size: c.size, role: c.role, pose: 'sit', wear: c.wear ?? 'none', touches: c.touches }, i); look.size = c.size ?? Math.min(1.1, look.size * 1.05); look.w = MAKES[look.make].w * look.size; look.places = c.places; hire(look, i); }
    for (const r of [...members].sort(() => Math.random() - 0.5)) { const s = choose(r, true); if (s) { r.placeAt(s); r.stintEnd = 20 + Math.random() * 200; r.nextErrand = 8 + Math.random() * 45; } }
  }

  // ---- drawing them: bodies and heads batched, the rest instanced ----
  const N = members.length, ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  let batch = null, eyes, lids, mouths, hands, cups, tools, carried;
  const eyeMat = new THREE.MeshBasicMaterial({ toneMapped: false }), lidMat = new THREE.MeshStandardMaterial({ color: '#1b1517', roughness: 0.38, metalness: 0.12, envMapIntensity: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });      // (lit as the visor is, so a lid is not seen as a dark patch on it)
  function buildBodies() {
    const geos = [];
    for (const r of members) { r.g = { sit: LK.body(r, true), stand: LK.body(r, false), head: LK.head(r) }; geos.push(r.g.sit, r.g.stand, r.g.head); }
    const verts = geos.reduce((a, g) => a + g.attributes.position.count, 0);
    batch = new THREE.BatchedMesh(N * 2, verts, 0, solid()); batch.frustumCulled = false; batch.castShadow = false; batch.receiveShadow = true; batch.name = 'researchers';
    for (const r of members) { r.gid = { sit: batch.addGeometry(r.g.sit), stand: batch.addGeometry(r.g.stand), head: batch.addGeometry(r.g.head) }; r.bi = batch.addInstance(r.gid.stand); r.hi = batch.addInstance(r.gid.head); batch.setVisibleAt(r.bi, false); batch.setVisibleAt(r.hi, false); r.geoNow = 'stand'; r.g = null; }
    const disc = new THREE.CircleGeometry(1, 16);
    eyes = new THREE.InstancedMesh(disc, eyeMat, N * 2); lids = new THREE.InstancedMesh(disc, lidMat, N * 2); mouths = new THREE.InstancedMesh(disc, eyeMat, N); hands = new THREE.InstancedMesh(handGeo, solid(), N * 2);
    carried = { book: new THREE.InstancedMesh(merge([paint(box(0.36, 0.08, 0.27), '#7a2f2a'), paint(box(0.34, 0.066, 0.272, [0.012, 0, 0]), '#efe6d2')]), solid(), N), papers: new THREE.InstancedMesh(merge([paint(box(0.3, 0.03, 0.38, [0, 0, 0], [0, 0.08, 0]), '#f4eee2'), paint(box(0.3, 0.032, 0.38, [0.01, 0.006, 0], [0, -0.05, 0]), '#e9dfc8')]), solid(), N) }; cups = new THREE.InstancedMesh(cupGeo, solid(), N); tools = new THREE.InstancedMesh(toolGeo, solid(), N);
    members.forEach((r, i) => { eyes.setColorAt(i * 2, col.set(r.eye)); eyes.setColorAt(i * 2 + 1, col.set(r.eye)); mouths.setColorAt(i, col.set(r.eye)); }); eyes.instanceColor.needsUpdate = true; mouths.instanceColor.needsUpdate = true;
    for (const m of [batch, eyes, lids, mouths, hands, cups, tools, carried.book, carried.papers]) { m.frustumCulled = false; m.castShadow = false; H.group.add(m); }
    for (const m of [eyes, lids, mouths, hands, cups, tools, carried.book, carried.papers]) { for (let i = 0; i < m.count; i++) m.setMatrixAt(i, ZERO); m.instanceMatrix.needsUpdate = true; }
  }

  // ---- how one stands or sits now, and where its head and hands are (in its own frame, at time t) ----
  const o = { L: new THREE.Vector3(), R: new THREE.Vector3(), cup: null, cupTilt: 0, tool: false };
  function liftAt(r, s) { let v = r.lift.get(s); if (v !== undefined) return v; const M = MAKES[r.make], z = r.size, base = M.lift * z; v = M.wheels && !(s.top > 0) ? base : s.top > 0 ? Math.max(M.wheels ? base : 0.4, Math.min(base + 1.7, s.top + 0.3 - M.th * 0.82 * z)) : base; r.lift.set(s, v); return v; }
  function pose(r, t, dt) {
    const M = MAKES[r.make], s = r.size, sp = r.spot, seated = r.seated, ph = t + r.phase, k = (ph * r.tempo) % 1;
    const thT = seated ? Math.min(M.th, M.thSit ?? M.th) : M.th, nkT = M.neck ? (seated ? M.neckSit : M.neck) : 0;
    const atSpot = !!(sp && sp.here && !r.away);
    const hipT = seated && sp ? sp.seat : (atSpot && !sp.seated ? liftAt(r, sp) : M.lift * s);
    const e = r.thNow === null ? 1 : Math.min(1, dt * (r.gliding ? 5 : 3));
    r.thNow = r.thNow === null ? thT : r.thNow + (thT - r.thNow) * e; r.nkNow = r.nkNow === undefined || e === 1 ? nkT : r.nkNow + (nkT - r.nkNow) * e; r.hipNow = r.hipNow === null ? hipT : r.hipNow + (hipT - r.hipNow) * e;
    const hip = r.hipNow, shoulder = hip + r.thNow * 0.82 * s, headY = hip + (r.thNow + r.nkNow + M.head) * s, w = M.w * s, front = M.front * s, tt = sp?.top ?? 0;
    o.pitch = 0; o.yaw = 0; o.cup = null; o.cupAt = false; o.cupTilt = 0; o.tool = false; o.lean = 0; o.turn = 0; o.bob = 0; o.focus = false; o.happy = false;
    const L0 = o.L, R0 = o.R, act = r.act;
    if (atSpot && act === 'type') { const on = ((ph * 0.21) % 1) < 0.72; o.pitch = on ? 0.2 : 0.05; o.focus = on && ((ph * 0.05) % 1) < 0.5; o.lean = 0.05; L0.set(-0.15, tt + 0.075 + (on ? Math.max(0, Math.sin(ph * 17)) * 0.035 : 0), 0.82); R0.set(0.15, tt + 0.075 + (on ? Math.max(0, Math.sin(ph * 19 + 2)) * 0.035 : 0), 0.82); }
    else if (atSpot && act === 'read') { const turn = k > 0.9 ? (k - 0.9) / 0.1 : 0; o.pitch = 0.42; o.yaw = Math.sin(ph * 0.5) * 0.12; L0.set(-0.33, tt + 0.07, 0.78); R0.set(0.33 - Math.sin(turn * Math.PI) * 0.36, tt + 0.07 + Math.sin(turn * Math.PI) * 0.16, 0.78); }
    else if (atSpot && act === 'write') { const pause = ((ph * 0.13) % 1) > 0.7; o.pitch = pause ? -0.05 : 0.36; o.focus = !pause; L0.set(-0.2, tt + 0.06, 0.76); R0.set(0.02 + (pause ? 0.1 : ((ph * 0.35) % 1) * 0.2) + (pause ? 0 : Math.sin(ph * 14) * 0.012), tt + 0.075, 0.8 + (pause ? 0 : Math.sin(ph * 9) * 0.012)); }
    else if (atSpot && act === 'sit') { const sip = k > 0.86 ? Math.sin(((k - 0.86) / 0.14) * Math.PI) : 0; o.yaw = Math.sin(ph * 0.27) * 0.3; o.pitch = 0.06 - sip * 0.16; L0.set(-0.22, tt + 0.06, 0.6); R0.set(0.3 - sip * 0.2, tt + 0.1 + sip * (headY - tt - 0.26), 0.72 - sip * (0.42 - front * 0.5)); o.cup = R0; o.cupTilt = sip * 0.5; }
    else if (atSpot && act === 'listen') { const nod = k > 0.9 ? Math.sin(((k - 0.9) / 0.1) * TAU) : 0; o.pitch = -0.06 + Math.max(0, nod) * 0.2; o.yaw = Math.sin(ph * 0.19) * 0.12; L0.set(-w * 0.45, hip + 0.28, front + 0.08); R0.set(w * 0.45, hip + 0.28, front + 0.08); if (((ph * 0.07) % 1) > 0.8 && sp.sp.top) { R0.set(0.1, tt + 0.07 + Math.max(0, Math.sin(ph * 12)) * 0.02, 0.75); o.pitch = 0.3; } }      // (now and then a note, if there is a ledge to write on)
    else if ((atSpot && act === 'talk') || act === 'chat') { const mine = ((ph * 0.11) % 1) < 0.5, y = shoulder - 0.35 * s; o.pitch = mine ? Math.sin(ph * 3.1) * 0.05 : 0.04 + Math.max(0, Math.sin(ph * 1.3)) * 0.1; L0.set(-w - 0.1, y + (mine ? 0.22 + Math.sin(ph * 4.3) * 0.1 : 0), 0.18 + (mine ? front : 0)); R0.set(w + 0.1, y, 0.18); o.happy = mine && Math.sin(ph * 0.7) > 0.5; }
    else if (atSpot) {      // standing at its work: the hands at the work whatever its height, the face turned to it
      const y = tt ? tt + 0.1 : shoulder - 0.25 * s, z = front + 0.36; L0.set(-0.2, y + Math.sin(ph * 5.1) * 0.05, z); R0.set(0.2, y + Math.sin(ph * 6.3 + 2) * 0.05, z + 0.02); o.focus = ((ph * 0.09) % 1) < 0.5;
      o.pitch = Math.max(-0.55, Math.min(0.55, Math.atan2(headY - y, 0.8))); if (((ph * 0.09) % 1) > 0.8) o.pitch *= 0.2; if (r.role === 'tech') { o.tool = true; o.cupTilt = 0.5 + Math.sin(ph * 3.3) * 0.5; }
    } else if (act === 'browse') { const reach = Math.max(0, Math.sin(ph * 0.55)); o.pitch = -0.2 + Math.sin(ph * 0.33) * 0.35; o.yaw = Math.sin(ph * 0.21) * 0.25; L0.set(-w - 0.06, shoulder - 0.35 * s, 0.2); R0.set(0.18, shoulder + 0.1 + reach * 0.55, front + 0.42 + reach * 0.15); o.bob = Math.sin(ph * 1.4) * 0.02; }
    else if (act === 'window') { o.pitch = -0.06 + Math.sin(ph * 0.17) * 0.05; o.yaw = Math.sin(ph * 0.13) * 0.35; L0.set(-w * 0.7, shoulder - 0.45 * s, -0.12); R0.set(w * 0.7, shoulder - 0.45 * s, -0.12); o.bob = Math.sin(ph * 1.1) * 0.025; }
    else if (act === 'think') { o.pitch = -0.18 + Math.sin(ph * 0.3) * 0.1; o.yaw = Math.sin(ph * 0.25) * 0.4; L0.set(-w - 0.08, shoulder - 0.4 * s, 0.1); R0.set(0.08, headY - 0.36 * s, front + 0.12); o.bob = Math.sin(ph * 1.2) * 0.025; }
    else if (act === 'stretch') { const u = Math.sin(Math.min(1, ((ph * 0.4) % 1) * 1.2) * Math.PI); L0.set(-w * 0.55, headY + 0.1 + u * 0.35, 0.02); R0.set(w * 0.55, headY + 0.1 + u * 0.35, 0.02); o.pitch = -0.25 * u; o.lean = -0.08 * u; o.happy = u > 0.6; }
    else if (act === 'rise' || act === 'sit') { L0.set(-w - 0.06, hip + 0.35 * s, 0.15); R0.set(w + 0.06, hip + 0.35 * s, 0.15); o.lean = 0.12; }
    else {      // walking (or standing about on the way): hands swinging a little, bobbing as it goes
      const go = Math.min(1, r.m.v / 1.5), sw = Math.sin(ph * 5.5) * 0.14 * go; L0.set(-w - 0.07, shoulder - 0.45 * s, 0.1 + sw); R0.set(w + 0.07, shoulder - 0.45 * s, 0.1 - sw); o.lean = 0.07 * go; o.bob = Math.abs(Math.sin(ph * 5.5)) * 0.03 * go + Math.sin(ph * 1.6) * 0.02; o.yaw = (1 - go) * Math.sin(ph * 0.4) * 0.3;
    }
    // things in the hands. Carrying its work between places (a book, or a sheaf of papers) in both hands before it; at a
    // colleague's desk, pointing at the work now and then; a hand raised to her when it first sees her; a small
    // gesture while it speaks; a little wave of the hand from the chair
    o.item = null;
    if (r.carry && !atSpot && (act === 'walk' || act === 'rise' || act === 'sit')) { const y = shoulder - 0.32 * s, z = front + 0.2; L0.set(-0.13, y, z); R0.set(0.13, y, z); o.item = r.carry; o.itemAt = tmp.set(0, y + 0.02, z + 0.02); }
    if (act === 'chat' && ((ph * 0.09) % 1) > 0.72) { R0.set(0.12, shoulder - 0.05 * s, front + 0.55); o.pitch = 0.15; }
    const greet = t < (r.waveUntil ?? 0) && !o.item;
    if (greet) { const u = Math.sin((r.waveUntil - t) / 1.6 * Math.PI); R0.set(w * 0.75 + Math.sin(t * 11) * 0.06 * u, (seated ? headY - 0.2 * s : headY - 0.1 * s) + u * 0.12, front + 0.12); if (o.cup === R0) o.cup = null; o.happy = true; }
    else if (r.bubble?.talking(t) && !o.item && act !== 'type' && act !== 'write') { const u = Math.max(0, Math.sin(ph * 2.3)); R0.set(w * 0.55 + u * 0.08, Math.max(R0.y, shoulder - 0.3 * s) + u * 0.1, front + 0.2 + u * 0.08); if (o.cup === R0) o.cup = null; }
    // a mug kept by: on the table beside the work, or in the hand when it is up and about
    if (r.touches?.mug && !o.cup && !o.tool) { if (atSpot && seated && sp.sp.top !== undefined) { tmp2.set(0.42, tt, 0.62); o.cupAt = true; o.cup = tmp2; } else if (!atSpot && act !== 'stretch' && act !== 'browse') { R0.set(w * 0.55, shoulder - 0.2 * s, front + 0.22); o.cup = R0; } }
    // a seated one's small changes of position, one at a time: leaning back, looking round, shifting, a stretch where it sits, a nod
    if (atSpot && seated) {
      if (t > r.nextMicro) { r.micro = ['lean', 'look', 'shift', 'stretch', 'nod', 'look'][Math.floor(Math.random() * 6)]; r.microT0 = t; r.microEnd = t + 3 + Math.random() * 4; r.nextMicro = r.microEnd + 6 + Math.random() * 16; r.microSide = Math.random() < 0.5 ? -1 : 1; }
      if (r.micro && t < r.microEnd) { const u = Math.sin(Math.min(1, (t - r.microT0) / (r.microEnd - r.microT0)) * Math.PI);
        if (r.micro === 'lean') { o.lean = -0.13 * u; o.pitch = o.pitch * (1 - u) - 0.15 * u; if (u > 0.3) { L0.set(-w * 0.6, hip + 0.3, front * 0.6); R0.set(w * 0.6, hip + 0.3, front * 0.6); if (o.cup === R0) o.cup = null; } }
        else if (r.micro === 'look') { o.yaw = r.microSide * 0.7 * u; o.pitch *= 1 - u; }
        else if (r.micro === 'shift') o.turn = r.microSide * 0.16 * u;
        else if (r.micro === 'stretch' && u > 0.15) { L0.set(-w * 0.5, headY + 0.05 + u * 0.25, 0); R0.set(w * 0.5, headY + 0.05 + u * 0.25, 0); o.pitch = -0.2 * u; o.lean = -0.06 * u; o.happy = u > 0.7; if (o.cup === R0) o.cup = null; }
        else if (r.micro === 'nod') o.pitch += Math.max(0, Math.sin((t - r.microT0) * 5)) * 0.18 * u;
      } else r.micro = null;
    }
    return o;
  }

  // ---- placing one: body, head, eyes and lids, hands, cup, spanner ----
  const mBody = new THREE.Matrix4(), mHead = new THREE.Matrix4(), mE = new THREE.Matrix4(), mT = new THREE.Matrix4(), mS = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), vP = new THREE.Vector3(), vS = new THREE.Vector3(1, 1, 1);
  function hide(r) { if (!batch) return; batch.setVisibleAt(r.bi, false); batch.setVisibleAt(r.hi, false); for (const k of [0, 1]) { eyes.setMatrixAt(r.i * 2 + k, ZERO); lids.setMatrixAt(r.i * 2 + k, ZERO); hands.setMatrixAt(r.i * 2 + k, ZERO); } cups.setMatrixAt(r.i, ZERO); tools.setMatrixAt(r.i, ZERO); mouths.setMatrixAt(r.i, ZERO); carried.book.setMatrixAt(r.i, ZERO); carried.papers.setMatrixAt(r.i, ZERO); r.shown = false; }
  function place(r, t, dt) {
    const M = MAKES[r.make], s = r.size, v = W.visitor, m = r.m;
    pose(r, t, dt);
    // turning to her as she comes up: the eyes, then the head, then (standing) the body
    const talking = W.now < r.talkUntil, level = v.present && Math.abs(v.y - r.y) < 4;
    r.attn = attendVisitor(r.attn, { x: r.x, z: r.z, yaw: m.yaw }, v, dt, { reach: 10, keepWorking: r.seated || r.gliding || (r.act === 'walk' && !r.engaged), talking, hold: !!r.engaged, busy: !!o.focus, level });
    const A = r.attn, near = A.w;
    if (r.awake) {
      if (A.yaw !== null && !r.seated && !r.gliding && m.v < 0.2 && !r.aside.phase) m.face(A.yaw, dt * A.rate);
      else if (r.spot?.here && !r.away && !r.seated && !A.looking && !r.aside.phase && m.v < 0.2) m.face(r.spot.yaw, dt * 0.8);
    }
    r.lean += (o.lean - r.lean) * Math.min(1, dt * 3); r.turn += ((o.turn + (r.seated ? A.head * 0.4 * near : 0)) - r.turn) * Math.min(1, dt * 3);
    const hy = o.yaw * (1 - near) + A.head * (r.seated ? 0.75 : 1), hp = o.pitch * (1 - near) - 0.06 * near;
    // the body: which geometry (a tall one telescopes, a neck draws in: the standing body squashed until it is down)
    const thS = Math.min(M.th, M.thSit ?? M.th), nkS = M.neck ? M.neckSit : 0, down = r.seated && Math.abs(r.thNow - thS) < 0.02 && Math.abs(r.nkNow - nkS) < 0.02, want = down ? 'sit' : 'stand';
    if (want !== r.geoNow) { batch.setGeometryIdAt(r.bi, r.gid[want]); r.geoNow = want; }
    const sy = want === 'sit' ? 1 : (r.thNow + r.nkNow) / (M.th + (M.neck ?? 0)), zOff = r.seated ? -0.08 : 0;
    eu.set(r.lean, m.yaw + r.turn, 0, 'YXZ'); q.setFromEuler(eu);
    vP.set(m.x, m.y + r.hipNow + o.bob, m.z); mT.compose(vP, q, vS); mBody.makeTranslation(0, 0, zOff).premultiply(mT);
    batch.setMatrixAt(r.bi, mE.copy(mBody).multiply(mS.makeScale(s, s * sy, s))); batch.setVisibleAt(r.bi, true);
    // the head on top, turned and tipped
    mHead.makeTranslation(0, (r.thNow + r.nkNow + M.head) * s, 0).premultiply(mBody); eu.set(hp, hy, 0, 'YXZ'); mHead.multiply(mT.makeRotationFromEuler(eu)).multiply(mS.makeScale(s, s, s));
    batch.setMatrixAt(r.hi, mHead); batch.setVisibleAt(r.hi, true);
    // The face, as the faculty's (body.js faceTick): a blink on its own rhythm through a half-lid (now and then two),
    // glances about and down at the work, to her when she is near; happy when she is close or speaks to it, narrowed
    // when it is working, wide for a moment when it first notices her, a wink now and then when it answers; and a
    // mouth that moves while it speaks. (Instances scaled and moved: no canvas each.)
    r.blinkIn -= dt; let lid = 0;
    if (r.blinkIn < 0) { const ph = -r.blinkIn / 0.16; lid = ph < 1 ? (ph < 0.3 || ph > 0.7 ? 0.5 : 1) : 0; if (ph >= 1) { if (r.blinkTwice) { r.blinkTwice = false; r.blinkIn = 0.12; } else { r.blinkTwice = Math.random() < 0.18; r.blinkIn = r.blinkBase * (0.6 + Math.random() * 0.8); } } }
    if (t > r.sacAt) { r.sacAt = t + 0.8 + Math.random() * 2.6; r.gxT = (Math.random() - 0.5) * 0.24; r.gyT = (Math.random() - 0.5) * 0.08 + (o.pitch > 0.15 ? -0.05 : 0); }
    const eyeX = r.gxT * (1 - near) + A.eye * 0.22 * near, eyeY = r.gyT * (1 - near) + 0.02 * near;
    r.gx += (eyeX - r.gx) * Math.min(1, dt * 14); r.gy += (eyeY - r.gy) * Math.min(1, dt * 14);
    if (A.looking && !r.noticed) { r.noticed = true; r.surpriseUntil = t + 0.7; if (Math.random() < 0.6 && !o.focus) r.waveUntil = t + 0.8 + 1.6; } else if (!A.looking && A.w < 0.05) r.noticed = false;
    const speakNow = !!r.bubble?.talking(t);
    if (talking && !r.wasTalking && Math.random() < 0.25) r.winkUntil = t + 0.45; r.wasTalking = talking;
    const fx = r.forceFace;      // (for pictures: one expression held)
    if (fx === 'blink') lid = 0.5;
    const surprised = fx ? fx === 'surprised' : t < (r.surpriseUntil ?? 0) && !talking, happy = fx ? fx === 'happy' || fx === 'speak' : !surprised && (talking || o.happy || (near > 0.6 && Math.hypot(v.x - r.x, v.z - r.z) < 6 && !o.focus)), focus = fx ? fx === 'focus' : o.focus && !happy && !surprised;
    const open = lid === 1 ? 0.08 : lid ? 0.5 : focus ? 0.5 : 1, big = surprised ? 1.22 : 1;
    const one = LK.FACES[r.make]?.one;
    for (const [j, k] of (one ? [[0, 0]] : [[0, -1], [1, 1]])) {
      const wink = (fx ? fx === 'wink' : t < (r.winkUntil ?? 0)) && k === 1;
      eyes.setMatrixAt(r.i * 2 + j, mE.copy(mHead).multiply(LK.eyeLocal(r, k, r.gx, r.gy, wink ? 0.08 : open, mT, 0, 0, big, big)));
      if (happy && !lid && !wink) lids.setMatrixAt(r.i * 2 + j, mE.copy(mHead).multiply(LK.eyeLocal(r, k, r.gx, r.gy, 1, mT, 0.005, -0.55, 1.12, 0.64))); else lids.setMatrixAt(r.i * 2 + j, ZERO);
    }
    if (one) { eyes.setMatrixAt(r.i * 2 + 1, ZERO); lids.setMatrixAt(r.i * 2 + 1, ZERO); }
    const mo = speakNow ? Math.abs(Math.sin(t * 10.5)) * (0.35 + 0.65 * Math.abs(Math.sin(t * 2.9 + Math.sin(t * 1.3)))) : 0;
    if (mo > 0.12) mouths.setMatrixAt(r.i, mE.copy(mHead).multiply(LK.eyeLocal(r, 0, r.gx * 0.5, 0, 0.18 + mo * 0.7, mT, 0.002, -(1 + (-(LK.FACES[r.make].mouth ?? -2) - 1) / (r.eyeH ?? 1)), 1.3, 1 / (r.eyeH ?? 1)))); else mouths.setMatrixAt(r.i, ZERO);
    // the hands, the cup, the spanner
    const c = Math.cos(m.yaw), sn = Math.sin(m.yaw), at = (x, y, z) => dummy.position.set(m.x + x * c + z * sn, m.y + y + o.bob, m.z - x * sn + z * c);
    dummy.rotation.set(0, m.yaw, 0); dummy.scale.setScalar(s);
    at(o.L.x, o.L.y, o.L.z); dummy.updateMatrix(); hands.setMatrixAt(r.i * 2, dummy.matrix);
    at(o.R.x, o.R.y, o.R.z); dummy.updateMatrix(); hands.setMatrixAt(r.i * 2 + 1, dummy.matrix);
    if (o.cup) { if (o.cup === o.R) at(o.R.x - 0.02, o.R.y - 0.1, o.R.z + 0.1); else { at(o.cup.x, o.cup.y, o.cup.z); dummy.position.y -= o.bob; } dummy.rotation.set(-o.cupTilt, m.yaw, 0, 'YXZ'); dummy.scale.setScalar(1); dummy.updateMatrix(); cups.setMatrixAt(r.i, dummy.matrix); } else cups.setMatrixAt(r.i, ZERO);
    for (const k of ['book', 'papers']) if (o.item === k) { at(o.itemAt.x, o.itemAt.y, o.itemAt.z); dummy.rotation.set(0, m.yaw, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); carried[k].setMatrixAt(r.i, dummy.matrix); } else carried[k].setMatrixAt(r.i, ZERO);
    if (o.tool) { at(o.R.x, o.R.y, o.R.z + 0.05); dummy.rotation.set(0.9, m.yaw, o.cupTilt - 0.5, 'YXZ'); dummy.scale.setScalar(1.15); dummy.updateMatrix(); tools.setMatrixAt(r.i, dummy.matrix); } else tools.setMatrixAt(r.i, ZERO);
    // what she bumps into, and where she speaks to it from
    const hw = Math.min(0.6, r.w + 0.04), b = r.box, top = r.hipNow + (r.thNow + r.nkNow + M.head + M.hr) * s;
    b.x0 = m.x - hw; b.x1 = m.x + hw; b.z0 = m.z - hw; b.z1 = m.z + hw; b.y0 = m.y + (r.seated ? r.hipNow - 0.1 : 0.25); b.y1 = m.y + top;
    r.item.x = m.x; r.item.y = m.y + r.hipNow + (r.thNow + r.nkNow + M.head) * s - 0.1; r.item.z = m.z; r.topY = m.y + top;
    r.shown = true;
  }

  // ---- every frame ----
  let awakeAt = -1, staleAt = 0, settleAt = 0;
  const WAKE = 55;
  function tick(t, dt) {
    if (!members.length) { if (t - awakeAt > 1) { awakeAt = t; for (const G of byRoom.values()) if (!G.built) buildProps(G); } return; }
    if (!batch) buildBodies();
    L.now = W.now;
    const v = W.visitor;
    if (t - awakeAt > 0.4) {
      awakeAt = t; let any = false;
      for (const G of byRoom.values()) if (!G.built) buildProps(G);
      for (const r of members) {
        const p = r.hidden ? r.dest : r, near = v.present && !!p && Math.abs(v.y - p.y) < 10 && Math.hypot(v.x - p.x, v.z - p.z) < WAKE;
        if (near && !r.awake) { r.awake = true; if (!r.task) r.run('life', r.life()); }
        else if (!near && r.awake) { r.awake = false; r.aside.phase = 0; }
        if (near) { any = true; const G = r.spot?.G; if (G && !G.checked && r.floor) check(G, r.floor); }
      }
      if (any && t - staleAt > 1) { staleAt = t; W.stale(); }
    }
    camM.multiplyMatrices(ctx.camera.projectionMatrix, ctx.camera.matrixWorldInverse); camF.setFromProjectionMatrix(camM);
    // away from her: people are simply where their day has got to (moved, if at all, only where she cannot see)
    if (t - settleAt > 1) { settleAt = t; for (const r of members) if (!r.awake) settle(r); if (!crowdMode) staff(); }
    for (const r of members) {
      if (r.awake) { try { if (r.hidden) { if (!r.task) r.run('life', r.life()); r.stepTask(); } else step(r, dt); } catch (e) { console.warn('researcher', r.name, e); r.run('life', r.life()); } }
      if (r.awake && !r.hidden && r.away && t - (r.noteAt ?? 0) > 2) { r.noteAt = t; r.note('tick'); }
      // (a watchdog: one away from its place that has not moved or changed what it is doing for a minute is set going again, and said so once)
      if (r.awake && !r.hidden && r.away) { const sig = `${r.act}|${r.why}|${Math.round(r.x * 2)}|${Math.round(r.z * 2)}`; if (sig !== r.sig) { r.sig = sig; r.sigT = t; } else if (t - r.sigT > 60 && !(W.visitor.present && Math.hypot(W.visitor.x - r.x, W.visitor.z - r.z) < 12)) { if (!r.dogged) console.warn('researchers: restarting', r.name, 'stalled at', r.act, r.why, r.taskName, 'gliding', r.gliding, 'now-t0', (W.now - (r.glideT0 ?? 0)).toFixed(1), 'same task', r.task === r.glideTask, 'awake', r.awake, '\n' + r.trace.slice(-12).join('\n')); r.dogged = (r.dogged ?? 0) + 1; L.watchdog = (L.watchdog ?? 0) + 1; r.sigT = t; r.run('life', r.life()); } }
      const show = !r.hidden && (r.awake || ((r.spot?.G?.probe?.visible ?? true) && v.present && Math.abs(v.y - r.y) < 30 && Math.hypot(v.x - r.x, v.z - r.z) < 150));
      if (show) place(r, t, dt); else if (r.shown !== false) { hide(r); r.box.y0 = -1e5; r.box.y1 = -1e5 + 1; r.item.y = -1e5; }
      if (L.audit && r.awake) audit(r, t);
    }
    for (const m of [eyes, lids, mouths, hands, cups, tools, carried.book, carried.papers]) m.instanceMatrix.needsUpdate = true;
    for (const r of speaking) { const on = r.bubble.talking(t); tmp.set(r.x, (r.topY ?? r.y + 4) + 0.35, r.z); H.bubbles.place(r.bubble, tmp, t, on && r.shown); if (!on) speaking.delete(r); }
  }
  // its manners (a few times a second, on its feet), then its day; spoken to on the way, it stops and turns to her
  function step(r, dt) {
    const now = W.now, talking = now < r.talkUntil, m = r.m, v = W.visitor;
    if (!r.task) r.run('life', r.life());
    const onFeet = !r.seated && !r.gliding && !!r.floor;
    // Engaged with her (robokit/attend.js engageVisitor): spoken to, or come up to, it stops what it is doing, turns
    // to her (sat down, it stays sat and turns its head) and waits, its day held where it was, until she has gone
    const eng = r.eng = engageVisitor(r.eng ?? {}, r, v, dt, { talking, level: v.present && Math.abs(v.y - r.y) < 4 && Math.hypot(v.x - r.x, v.z - r.z) < 9 && (!r.floor?.plan?.see || r.floor.plan.see(v.x, v.z, r.x, r.z)) });      // (not through a wall)
    const hold = r.engaged = !r.fixed && eng.on && (talking || !eng.give);      // (at a stride straight at it, she is passing: it gives way)
    if (onFeet && now >= (r.nextManners ?? 0)) { r.nextManners = now + 0.2; r.manners({ still: hold, back: !!(r.spot && !r.away) }); }
    if (r.aside.phase) r.stepAside(dt);
    else if (hold && !r.gliding) { if (onFeet) { m.v = 0; m.faceTo(v.x, v.z, dt * 1.6); } }
    else r.stepTask();
    if (onFeet) r.glide(dt);
  }
  // put one where its day says, if she cannot see the change: back at its spot, at its next place, or arrived
  function settle(r) {
    if (r.fixed) return;
    if (r.hidden) {
      if (L.now < (r.transitUntil ?? 0)) return;
      let d = r.dest; if (!d || (d.by && d.by !== r)) { d = r.dest = choose(r, true); if (!d) return; d.by = r; }
      if (!L.seen(d.x, d.y, d.z, floors.at(d.site, d.y))) { r.placeAt(d); r.stintEnd = L.now + L.stint(); r.run('life', r.life()); }
      return;
    }
    if (L.seen(r.x, r.y, r.z, r.floor)) return;
    if (r.away || !r.spot?.here || r.gliding || r.aside.phase) {      // part way through something: finished, out of sight
      r.aside.phase = 0; const s = r.spot ?? r.dest;
      if (s && (!s.by || s.by === r)) r.placeAt(s); else { r.vanish(); r.dest = null; r.transitUntil = L.now + 5; }
      r.run('life', r.life()); return;
    }
    if (L.now > r.stintEnd && !L.hold) {
      const next = choose(r); r.stintEnd = L.now + L.stint();
      if (next && !L.seen(next.x, next.y, next.z, floors.at(next.site, next.y))) { r.placeAt(next); r.run('life', r.life()); }
    }
  }

  // ---- never an empty room as she comes in ----
  // A lecture room with a lecture going on has two (at most three) in its audience by the time she can see into it,
  // and the café, the Reading Room and the bullpen are never empty when she walks in. When one of them is about to
  // come into her view (she is on its floor and near it, or can see its door), anyone it lacks is fetched from a
  // room she cannot see, straight to a seat she cannot see; they stay while she is about, and once she has gone they
  // drift back to their own places in the ordinary way.
  const WANT = { 'Museum': 2, 'Reading Room': 2, 'Museum Basement': 2, 'Room 306': 2 };      // (the Common Room too: never empty when she climbs up to it)
  const wantedSince = new Map();
  const box3 = new THREE.Box3(), looking = q => camF.intersectsBox(box3.set(tmp.set(q.x0, -1e3, q.z0), tmp2.set(q.x1, 1e3, q.z1)));
  function staff() {
    const v = W.visitor; if (!v.present || !spots.length) return;
    classrooms ??= new Set(Object.values(ctx.faculty ?? {}).filter(c => c.lec && c.spec.room).map(c => `${c.spec.room.site}|${c.spec.room.name}`));
    const here = H.room ?? ctx.room, dist = q => Math.hypot(Math.max(q.x0 - v.x, 0, v.x - q.x1), Math.max(q.z0 - v.z, 0, v.z - q.z1));
    let n = 0;
    for (const G of [...byRoom.values()].filter(G => G.room).sort((a, b) => dist(a.room) - dist(b.room))) {
      const q = G.room;
      const want = classrooms.has(G.key) ? 2 : WANT[q.name] ?? 0; if (!want) continue;
      const fy = Math.min(...G.list.map(s => s.y)), dx = Math.max(q.x0 - v.x, 0, v.x - q.x1), dz = Math.max(q.z0 - v.z, 0, v.z - q.z1), d = Math.hypot(dx, dz);
      const sameFloor = Math.abs(v.y - fy) < 4 && (!here || here.site === q.site || d < 12);
      const coming = (sameFloor && d < 16) || (here?.name === q.name && here.site === q.site) || ((G.probe?.visible ?? false) && Math.abs(v.y - fy) < 4 && d < 30 && looking(q));
      if (!coming) { const since = wantedSince.get(G.key); if (since !== undefined && L.now - since > 40) { wantedSince.delete(G.key); for (const r of members) if (r.visiting === G.key) { r.visiting = null; r.stintEnd = L.now + 30 + Math.random() * 90; } } continue; }
      if (++n > 2) continue;      // (the two nearest that she is coming to, no more)
      wantedSince.set(G.key, L.now);
      // who is there: sitting (or standing) at a place in it, or a few steps from one; not those still on their way to it
      const there = members.filter(r => !r.hidden && r.spot?.key === G.key && ((r.spot.here && !r.away) || Math.hypot(r.x - r.spot.x, r.z - r.spot.z) < 4));
      for (const r of there) if (r.visiting === G.key || there.length <= want) r.stintEnd = Math.max(r.stintEnd, L.now + 60);      // (nobody leaves while she is about)
      const total = members.filter(r => !r.hidden && r.spot?.key === G.key).length;      // (with any of them up on an errand about the room: never more than three)
      if (there.length >= want || total >= 3) { for (const r of members) if (r.hidden && r.dest?.key === G.key && there.length >= 3) { if (r.dest.by === r) r.dest.by = null; r.dest = null; } continue; }
      const F = floors.at(q.site, fy);
      const seats = G.list.filter(s => !s.by && s.seated && !L.seen(s.x, s.y, s.z, F) && !(Math.hypot(v.x - s.x, v.z - s.z) < 3)).sort((a, b) => (b.pose === 'listen') - (a.pose === 'listen') || Math.random() - 0.5);
      for (const s of seats.slice(0, want - there.length)) {
        // whoever can be spared: not near her, not seen, and better one whose places include this room
        const r = members.filter(r => !r.fixed && !r.visiting && (r.hidden || (!r.awake && !L.seen(r.x, r.y, r.z, r.floor))) && (r.spot ?? r.dest)?.key !== G.key)
          .sort((a, b) => (b.places.some(([n]) => n === q.name) - a.places.some(([n]) => n === q.name)) || Math.random() - 0.5)[0];
        if (!r) break;
        if (r.dest?.by === r && r.dest !== s) r.dest.by = null;
        r.placeAt(s); r.visiting = G.key; r.stintEnd = L.now + 120; r.nextErrand = L.now + 20 + Math.random() * 40; r.run('life', r.life()); L.staffed = (L.staffed ?? 0) + 1;
      }
      // every seat in sight: one comes in at the door a moment later, from the hall outside where she cannot see it
      const now2 = members.filter(r => !r.hidden && r.spot?.key === G.key).length;
      if (now2 < want && L.now > (G.walkInAt ?? 0)) {
        G.walkInAt = L.now + 6;
        const seat = G.list.filter(s => !s.by && s.seated && !(Math.hypot(v.x - s.x, v.z - s.z) < 3)).sort((a, b) => (b.pose === 'listen') - (a.pose === 'listen') || Math.random() - 0.5)[0];
        const r = seat && members.filter(r => !r.fixed && !r.visiting && (r.hidden || (!r.awake && !L.seen(r.x, r.y, r.z, r.floor))) && (r.spot ?? r.dest)?.key !== G.key)[0];
        const at = seat && r && doorOutside(G, F);
        if (at) { if (r.dest?.by === r) r.dest.by = null; r.placeAt(seat); seat.here = false; r.m.x = at.x; r.m.z = at.z; r.m.y = F.y; r.m.yaw = Math.atan2(seat.x - at.x, seat.z - at.z); r.seated = false; r.away = true; r.carry = 'book'; r.thNow = r.hipNow = null; r.visiting = G.key; r.stintEnd = L.now + 120; r.nextErrand = L.now + 30; r.run('life', r.life()); L.walkedIn = (L.walkedIn ?? 0) + 1; }
      }
    }
  }
  // a place in the hall outside one of a room's doors that she cannot see, to come in from
  function doorOutside(G, F) {
    const q = G.room, p = F.plan, fy = F.y, inQ = (x, z) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1;
    G.doors ??= (ctx.house.portals ?? []).filter(d => d.kind === 'door' && d.y0 < fy + 3 && d.y1 > fy + 1 && d.x1 > q.x0 - 1.5 && d.x0 < q.x1 + 1.5 && d.z1 > q.z0 - 1.5 && d.z0 < q.z1 + 1.5).map(d => {
      const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2, ax = d.x1 - d.x0 < d.z1 - d.z0, n = ax ? [1, 0] : [0, 1], sg = inQ(cx + n[0] * 2, cz + n[1] * 2) ? -1 : 1;
      return { cx, cz, nx: n[0] * sg, nz: n[1] * sg };
    }).filter(d => !inQ(d.cx + d.nx * 2, d.cz + d.nz * 2));
    for (const d of G.doors) for (const k of [3.5, 7, 11]) {
      const c = p.nearest(d.cx + d.nx * k, d.cz + d.nz * k, 2, 2, false); if (c < 0) continue;
      const x = p.cx(c), z = p.cz(c); if (inQ(x, z) || L.seen(x, fy, z, F) || W.agents.some(o => !o.ghost && Math.abs(o.y - fy) < 3 && Math.hypot(o.x - x, o.z - z) < 1.6)) continue;
      return { x, z };
    }
    return null;
  }

  // ---- for tests (tools/soak_researchers.js): what goes wrong, as it happens ----
  function audit(r, t) {
    const A = L.audit, v = W.visitor, bad = (kind, more = '') => { const k = `${kind}|${r.name}`; A.counts[kind] = (A.counts[kind] ?? 0) + 1; if (!A.seen.has(k)) { A.seen.add(k); A.list.push(`${kind}: ${r.name} (${r.act}, ${r.room ?? '?'}) at ${r.x.toFixed(1)}, ${r.z.toFixed(1)} ${more}`); } };
    if (r.hidden) return;
    // in anything solid (on its feet, and not on the way out of or into a seat)
    if (!r.seated && !r.gliding) { let worst = 1e9; for (const b of ctx.colliders) { if (b.off || b.staff || b.y0 >= r.y + 3.2 || b.y1 <= r.y + 0.4) continue; const dx = Math.max(b.x0 - r.x, 0, r.x - b.x1), dz = Math.max(b.z0 - r.z, 0, r.z - b.z1), d = Math.hypot(dx, dz) - r.r * 0.6; if (d < worst) worst = d; } if (worst < -0.05) bad('inside', `(${worst.toFixed(2)} ft)`); }
    // on top of her
    if (v.present && Math.abs(v.y - r.y) < 3) { const d = Math.hypot(v.x - r.x, v.z - r.z); if (!r.seated && d < r.r + VR - 0.15) bad('on-visitor', `(${d.toFixed(2)} ft)`); const st = ctx.walker?.seated; if (st && r.seated && Math.hypot(st.x - r.x, st.z - r.z) < 0.9) bad('in-her-chair'); }
    // stuck: meaning to walk and getting nowhere for half a minute
    const moved = Math.hypot(r.x - (r.ax ?? r.x), r.z - (r.az ?? r.z)); if (moved > 0.3 || r.act !== 'walk' || r.aside.phase === 2) { r.ax = r.x; r.az = r.z; r.stuckT = t; } else if (t - (r.stuckT ?? t) > 30 && v.present && Math.hypot(v.x - r.x, v.z - r.z) < 9) { bad('waits-for-her', '(she is beside it, in its way)'); r.stuckT = t; } else if (t - (r.stuckT ?? t) > 30) { const m = r.m, g = m.goal, pl = r.floor?.plan; bad('stuck', `[path ${m.path ? m.path.length - m.i : 0}, goal ${g ? g.x.toFixed(1) + ',' + g.z.toFixed(1) : '-'}${g && pl ? ' free ' + pl.freeAt(g.x, g.z, m.need, false) : ''}, here free ${pl ? pl.freeAt(r.x, r.z, m.need, false) : '?'}, blocked ${m.blockedFor.toFixed(1)}, her ${v.present ? Math.hypot(v.x - r.x, v.z - r.z).toFixed(1) : '-'}, for ${(r.spot ?? r.dest)?.key ?? '?'}, by ${W.agents.filter(a => a !== r && !a.ghost && Math.abs(a.y - r.y) < 3 && Math.hypot(a.x - r.x, a.z - r.z) < 3).map(a => a.name + (a.spot?.here ? '(at its place)' : a.act ? '(' + a.act + ')' : '')).join(' ') || 'nobody'}]`); r.stuckT = t; }
    // away from its place (on an errand, or on its way back) for more than two minutes
    if (r.away && !L.hold0) { r.awaySince ??= t; if (t - r.awaySince > 120) { const off = r.spot?.off; if ((off && v.present && (Math.hypot(v.x - off.x, v.z - off.z) < 9 || Math.hypot(v.x - r.spot.x, v.z - r.spot.z) < 9)) || (/unseen/.test(r.why ?? '') && L.seen(r.x, r.y, r.z, r.floor))) { bad('waits-for-her', '(she is standing at its place, or in the way to it)'); r.awaySince = t; return; } if (!A.traced) { A.traced = true; console.warn('researchers: away long', r.name, '\n' + r.trace.slice(-25).join('\n')); } bad('away-long', `[${r.why ?? r.taskName}, restarts ${r.restarts ?? 0}, aside ${r.aside.phase}, path ${r.m.path ? r.m.path.length - r.m.i : 0}, blocked ${r.m.blockedFor.toFixed(1)}, task ${r.taskName}, ${off ? Math.hypot(off.x - r.x, off.z - r.z).toFixed(1) + ' ft from its standoff' : 'no standoff'}, there taken by ${off ? W.agents.filter(a => a !== r && !a.ghost && Math.hypot(a.x - off.x, a.z - off.z) < r.r + 0.9).map(a => a.name).join(' ') || 'nobody' : '-'}, her ${v.present ? Math.hypot(v.x - (off?.x ?? r.x), v.z - (off?.z ?? r.z)).toFixed(1) : '-'} ft from it]`); r.awaySince = t; } } else r.awaySince = null;
    // two in one seat
    if (r.seated) for (const q2 of members) if (q2 !== r && !q2.hidden && q2.seated && Math.hypot(q2.x - r.x, q2.z - r.z) < 0.6) bad('shared-seat', `${q2.name} [spots ${r.spot?.i}/${q2.spot?.i}, held by ${r.spot?.by?.name}/${q2.spot?.by?.name}, ${r.taskName}/${q2.taskName}, ${r.act}/${q2.act}, dest ${r.dest?.i}/${q2.dest?.i}]`);
  }

  // ---- what others are told ----
  const api = { all: members, spots, GROUPS, tick, speak: r => L.say(r), add: sp => addSpot(sp), L,
    cost() { const out = { members: members.length, spots: spots.length, calls: (batch ? 6 : 0) + [...byRoom.values()].filter(G => G.mesh).length }; if (batch) out.verts = batch.geometry.attributes.position.count; return out; },
    // where everyone is, by room (and who is on the way)
    census() { const out = {}; for (const r of members) { const k = r.hidden ? '(between places)' : r.spot?.here && !r.away ? r.spot.key : `(up) ${r.floor?.roomAt(r.x, r.z) ?? ''}`; (out[k] ??= []).push(r.name); } return out; },
    // for tests: bring n of the cohort to a room (to the free spots there), and watch for trouble
    fill(name, n = 3) {
      const free = spots.filter(s => s.room?.name === name && !s.by); let k = members.filter(r => r.spot?.room?.name === name).length;
      for (const r of members) { if (k >= n || !free.length) break; if (r.fixed || r.spot?.room?.name === name) continue; const s = free.splice(Math.floor(Math.random() * free.length), 1)[0]; if (r.spot?.by === r) { r.spot.by = null; r.spot.here = false; } if (r.dest?.by === r) r.dest.by = null; r.placeAt(s); r.nextErrand = L.now + Math.random() * 8; r.run('life', r.life()); k++; }
      return members.filter(r => r.spot?.room?.name === name).map(r => r.name);
    },
    startAudit() { L.audit = { list: [], counts: {}, seen: new Set() }; return L.audit; },
    // for tests: everyone fetched to a room goes back to one of their own places at once (as they would, unseen, once she has gone)
    release() { wantedSince.clear(); for (const r of members) if (r.visiting) { r.visiting = null; const s = choose(r); if (s && !L.seen(s.x, s.y, s.z, floors.at(s.site, s.y))) { r.placeAt(s); r.run('life', r.life()); } } },
    // for moving a standing spot out of an aisle: the nearest open floor to each one that is in one
    aisles(R = 3.5) { const out = []; for (const s of spots) { if (s.seated) continue; const F = floors.at(s.site, s.y); if (!F) continue; const p = F.plan, l = p.laneAt(s.x, s.z); if (l !== 4 && l !== 2 && l !== 3) continue;
      const c = p.nearest(s.x, s.z, 2, R, false, c => !p.lane[c] && F.inRoom(s.room?.name, p.cx(c), p.cz(c))); out.push({ seed: s.seed, room: s.room?.name, pose: s.pose, at: [+s.x.toFixed(2), +s.z.toFixed(2)], open: c >= 0 ? [+p.cx(c).toFixed(2), +p.cz(c).toFixed(2), +Math.hypot(p.cx(c) - s.x, p.cz(c) - s.z).toFixed(2)] : null }); } return out; } };
  const eyeAt = r => { const F = LK.FACES[r.make ?? 'round']; return { y: F.flat ? F.y : Math.sin(F.b) * F.R, z: F.flat ? F.z : F.R * Math.cos(F.b), gap: 1, tall: r.eyeH ?? 1 }; };
  // (mint, statics, headGeo, eyeGeo, handGeo: as they were, the round make, for faculty/outdoors.js)
  api.kit = { mint, mintAny, statics, frame, MAKES, makes: MAKE_IDS, headGeo, eyeGeo, handGeo, cupGeo, toolGeo, rod, box, SAY, eyeAt };
  H.researchers = api;
  if (Q.has('researchers')) console.log('researchers', JSON.stringify(api.cost()));
  return api;
}
