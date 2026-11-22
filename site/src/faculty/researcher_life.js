// What the research staff do with their day (faculty/researchers.js draws them; researcher_cohort.js says who they
// are). A member of the cohort is always at one of its places: sitting or standing at a SPOT (a furnish file's
// f.researcher call) in one of the rooms the roster gives it, or on its way between two of them.
//
// At its spot it works (typing, writing, turning pages, sipping, listening), and between whiles shifts, leans
// back, stretches, looks round. Every half minute or so it gets up on an errand in the room: to a shelf, a window,
// a colleague's desk for a word, a turn about the floor, or just to stand and stretch, and comes back and sits
// down again. Every few minutes it moves on to another of its places: along the floor through the halls if the
// place is on the same floor, else out by the stairs or the door, unseen, and in at the other end.
//
// How it walks and how it behaves toward the visitor is faculty/nav.js and faculty/manners.js, as for the
// teachers (a Polite: never through her, aside when she comes, out of doorways). What is its own: a seat is not
// floor anyone can walk on, so getting up and sitting down are a short glide between the seat and the clear floor
// behind it, never begun while she is close by, and never into a chair she is sitting in. One plan of each floor
// is shared by everyone on it. Nothing here runs unless the visitor is near; away from her, people simply are
// where their day has got to (moved, if at all, only where she cannot see).

import { Polite, VR } from './manners.js';

const TAU = Math.PI * 2;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const pick = (a, rnd = Math.random) => a[Math.floor(rnd() * a.length)];
export function weighted(list, rnd = Math.random) { const tot = list.reduce((s, [, w]) => s + Math.max(0, w), 0); if (tot <= 0) return null; let u = rnd() * tot; for (const [k, w] of list) { u -= Math.max(0, w); if (u <= 0) return k; } return list[list.length - 1][0]; }

// ---- the floors: one plan for each floor of each building, of all its rooms joined at their doorways ----
export function makeFloors(H) {
  const W = H.W, house = H.ctx.house, floors = new Map();
  const fl = q => q.floor ?? q.y0;
  function at(site, y) {
    const rooms = house.rooms.filter(q => q.site === site && Math.abs(fl(q) - y) < 1.4);
    if (!rooms.length) return null;
    const key = site + '|' + rooms.map(q => q.name).sort().join(',') + '|' + Math.round(Math.min(...rooms.map(fl)) * 2);
    let F = floors.get(key); if (F) return F;
    const links = [];
    for (const p of house.portals ?? []) {
      if (p.kind !== 'door' || p.y0 > y + 3 || p.y1 < y + 1) continue;
      const ax = p.x1 - p.x0 > p.z1 - p.z0, b = { x0: p.x0 - (ax ? 0 : 1.6), x1: p.x1 + (ax ? 0 : 1.6), z0: p.z0 - (ax ? 1.6 : 0), z1: p.z1 + (ax ? 1.6 : 0) }, hit = q => q.x1 > b.x0 && q.x0 < b.x1 && q.z1 > b.z0 && q.z0 < b.z1;
      if (new Set(rooms.filter(hit).map(q => q.name)).size >= 2) links.push(b);
    }
    let plan = null;
    F = { key, site, y, rooms, gen: W.gen ?? 0, exits: null, get plan() { return (plan ??= W.plan({ boxes: [...rooms, ...links], links, y, top: 4.6 })); } };
    F.inRoom = (name, x, z) => rooms.some(q => q.name === name && x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1);
    F.roomAt = (x, z) => rooms.find(q => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1)?.name ?? null;
    floors.set(key, F); return F;
  }
  // the ways off a floor: the head (or foot) of each stair, and each door out of the building, as clear floor beside
  // them (x, z), and the way on through (tx, tz, dy: onto the stair and down or up it, or out of the door)
  function exits(F) {
    if (F.exits) return F.exits;
    const p = F.plan, y = F.y, out = [];
    const inB = (x, z) => F.rooms.some(q => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1), near = (x0, x1, z0, z1) => inB((x0 + x1) / 2, (z0 + z1) / 2) || inB(x0 - 1, (z0 + z1) / 2) || inB(x1 + 1, (z0 + z1) / 2) || inB((x0 + x1) / 2, z0 - 1) || inB((x0 + x1) / 2, z1 + 1);
    const through = (e, cx, cz, dy) => { const L = Math.hypot(cx - e.x, cz - e.z) || 1, k = Math.min(2.6, L); return { ...e, tx: e.x + (cx - e.x) / L * k, tz: e.z + (cz - e.z) / L * k, dy }; };
    const stairs = [...(house.portals ?? []).filter(q => q.kind === 'stair' && q.y0 < y + 1.5 && q.y1 > y - 1.5).map(q => [q, -1.6]), ...(house.surfaces ?? []).filter(q => q.ramp && Math.max(q.h, q.h2) > y - 0.5 && Math.min(q.h, q.h2) < y + 0.5).map(q => [q, Math.max(q.h, q.h2) > y + 1 ? 1.6 : -1.6])];
    for (const [s, dy] of stairs) {
      if (!near(s.x0, s.x1, s.z0, s.z1)) continue;
      const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2, c = p.nearest(cx, cz, 2, Math.max(s.x1 - s.x0, s.z1 - s.z0) / 2 + 5);
      if (c >= 0) out.push(through({ x: p.cx(c), z: p.cz(c), kind: 'stair' }, cx, cz, dy));
    }
    for (const d of house.doors ?? []) {
      if ((d.y0 ?? y) > y + 3 || (d.y1 ?? y + 7) < y + 1 || !near(d.cx - 0.5, d.cx + 0.5, d.cz - 0.5, d.cz + 0.5)) continue;
      const o = [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]].find(([dx, dz]) => !inB(d.cx + dx, d.cz + dz)); if (!o) continue;
      const c = p.nearest(d.cx - o[0], d.cz - o[1], 2, 4); if (c >= 0) out.push({ x: p.cx(c), z: p.cz(c), tx: d.cx + o[0], tz: d.cz + o[1], dy: 0, kind: 'door', door: d });
    }
    return (F.exits = out);
  }
  return { at, exits, all: floors };
}

// ---- a member of the cohort ----
export class Member extends Polite {
  // L: what they share (H, W, floors, spots, seen(x, y, z), visitorAt(), choose(member), now, audit); look: who it is
  constructor(L, look) {
    super(L.W, { radius: Math.min(0.78, look.w + 0.12), top: 4.6, speed: 2.3, plan: () => this.floor?.plan });
    Object.assign(this, look);
    this.L = L; this.H = L.H; this.spot = null; this.dest = null; this.floor = null; this.seated = false; this.hidden = true; this.ghost = true;
    this.act = 'stand'; this.micro = null; this.microUntil = 0; this.nextMicro = 0; this.stintEnd = 0; this.nextErrand = 0; this.chat = null; this.away = false;
    this.thNow = null; this.hipNow = null; this.lean = 0; this.turn = 0; this.attn = null; this.talkUntil = 0; this.glideK = 0; this.faceYaw = 0; this.awake = false;
    this.lastX = 0; this.lastZ = 0; this.stillFor = 0;
    const upd = this.m.update.bind(this.m); this.m.update = (dt, k) => (this.mstate = upd(dt, k));      // (what its walking last said: for the trace)
    this.trace = [];
  }
  // a short record of what it has been doing, for finding out why it is not getting anywhere (researchers.js, tests)
  note(what) { const t = this.trace; t.push(`${this.W.now.toFixed(1)} ${what} act=${this.act} why=${this.why ?? ''} at ${this.x.toFixed(1)},${this.z.toFixed(1)} v=${this.m.v.toFixed(2)} m=${this.mstate ?? ''} aside=${this.aside?.phase} path=${this.m.path ? this.m.path.length - this.m.i : 0}`); if (t.length > 40) t.shift(); }
  get fy() { return this.m.y; }
  // one plan for each floor, rebuilt once when the furniture or a door has changed, whoever asks first
  get plan() {
    const F = this.floor; if (!F) return null;
    if (F.gen !== (this.W.gen ?? 0)) { F.gen = this.W.gen ?? 0; F.plan.rebuild(); }
    if (this.m.plan !== F.plan) this.m.plan = F.plan;
    return F.plan;
  }
  get room() { return this.spot?.room?.name ?? (this.floor ? this.floor.roomAt(this.x, this.z) : null); }
  // a place it was given may be in an aisle or by a door (a bench, a desk): it may stand there; and where an errand took it
  mayStandHere() { const near = p => p && Math.hypot(p.x - this.x, p.z - this.z) < 1.3; return near(this.spot) || near(this.spot?.off) || near(this.errandAt); }

  // ---- being somewhere ----
  placeAt(spot) {
    if (this.spot && this.spot !== spot && this.spot.by === this) { this.spot.by = null; this.spot.here = false; }
    if (this.dest && this.dest !== spot && this.dest.by === this && !this.dest.here) this.dest.by = null;
    if (spot.by && spot.by !== this) console.warn('researchers:', this.name, 'put in', spot.by.name + '\'s place');
    this.spot = spot; spot.by = this; this.carry = null; spot.here = true; this.dest = null;
    this.floor = this.L.floors.at(spot.site, spot.y); this.m.plan = this.floor?.plan ?? null; this.m.stop();
    this.m.x = spot.x; this.m.z = spot.z; this.m.y = spot.y; this.m.yaw = spot.yaw;
    this.seated = spot.seated; this.hidden = false; this.ghost = false; this.away = false; this.act = this.spotAct(); this.chat = null; this.errandAt = null;
    this.thNow = null; this.hipNow = null;
  }
  vanish() { if (this.spot && this.spot.by === this) { this.spot.by = null; this.spot.here = false; } this.spot = null; this.hidden = true; this.ghost = true; this.m.stop(); this.seated = false; this.away = false; this.m.x = this.m.z = 1e6; }
  spotAct() { const s = this.spot; if (!s) return 'walk'; if (s.pose === 'talk') return s.partner?.by?.spot === s.partner && s.partner.here ? 'talk' : 'stand'; if (s.pose === 'stand') return 'stand'; return s.pose; }
  // the clear floor beside its spot: behind the chair if there is room there, else the nearest that will do
  standoff(spot = this.spot) {
    if (spot.off !== undefined) return spot.off;
    const F = this.L.floors.at(spot.site, spot.y), p = F?.plan; if (!p) return (spot.off = null);
    const need = this.m.need, others = this.L.spots.filter(o => o !== spot && o.key === spot.key && Math.hypot(o.x - spot.x, o.z - spot.z) < 6), good = (x, z) => p.freeAt(x, z, need, false) && p.laneAt(x, z) !== 3 && !p.inDoorway(x, z) && others.every(o => Math.hypot(o.x - x, o.z - z) > (o.seated ? this.r + 1 : this.r + 1.8));
    if (!spot.seated && good(spot.x, spot.z)) return (spot.off = { x: spot.x, z: spot.z });
    const bx = -Math.sin(spot.yaw), bz = -Math.cos(spot.yaw);
    for (const d of [1.4, 1.9, 2.4, 3]) for (const a of [0, 0.5, -0.5, 1.1, -1.1, 1.57, -1.57]) {
      const c = Math.cos(a), s = Math.sin(a), x = spot.x + (bx * c - bz * s) * d, z = spot.z + (bx * s + bz * c) * d;
      if (good(x, z) && F.inRoom(spot.room?.name, x, z)) return (spot.off = { x, z });
    }
    const c = p.nearest(spot.x, spot.z, need, 3.2, false, c => p.lane[c] !== 3 && !p.inDoorway(p.cx(c), p.cz(c)));
    return (spot.off = c >= 0 ? { x: p.cx(c), z: p.cz(c) } : null);
  }
  // is she close to this spot (or sitting in it, or next to it)?
  herNear(x, z, r) { const v = this.L.visitorAt(); return v && Math.abs(v.y - this.y) < 3 && Math.hypot(v.x - x, v.z - z) < r; }
  herSeatNear(x, z, r) { const s = this.L.visitorSeat(); return s && Math.abs(s.y - 2.45 - this.y) < 3 && Math.hypot(s.x - x, s.z - z) < r; }

  // ---- the day ----
  *life() {
    // (begun again part way through something, after a fault or a jump: first back to where its day says it is)
    this.gliding = false; this.restarts = (this.restarts ?? 0) + 1;
    if (this.spot && (this.away || !this.spot.here) && !this.hidden) {
      const s = this.spot, d = Math.hypot(this.x - s.x, this.z - s.z);
      if (d < 0.6) { this.m.x = s.x; this.m.z = s.z; this.m.yaw = s.yaw; this.seated = s.seated; s.here = true; this.away = false; this.act = this.spotAct(); this.carry = null; }      // (still in its chair, as good as)
      else { this.seated = false; yield* this.goBack(); }
    }
    else if (!this.spot && !this.hidden) {
      const ex = this.exitNear(this.x, this.z); this.act = 'walk';
      if (!(ex && (yield* this.walk(ex.x, ex.z, { must: true, patience: 20 })) && (yield* this.through(ex, true)))) { this.act = 'stand'; yield* this.unseenThen(() => true, 1e9); }
      const d = this.dest; this.vanish(); this.dest = d; this.transitUntil = this.L.now + 5;
    }
    for (;;) {
      if (!this.spot) { yield* this.arrive(); continue; }
      const why = yield* this.work();
      if (why === 'errand') yield* this.errand();
      else if (why === 'move') yield* this.moveOn();
      else yield;
    }
  }
  // at its spot until it is time for an errand or to move on
  *work() {
    const L = this.L;
    for (;;) {
      if (L.now > this.stintEnd && !this.fixed && !L.hold) return 'move';
      if (L.now > this.nextErrand && !this.fixed && !L.hold && this.standoff() && this.roomQuiet()) { this.nextErrand = L.now + 30 + Math.random() * 50; return 'errand'; }
      yield;
    }
  }
  // nobody else of this room is away from their place on an errand (one at a time keeps a room settled)
  roomQuiet() { for (const o of this.L.members) if (o !== this && o.away && o.room === this.room) return false; return true; }
  // up from the seat to the clear floor beside it (or on to its feet, standing): false if she is too near to do it politely
  *rise() {
    const s = this.spot, off = this.standoff(); if (!off) return false;
    if (!s.seated && Math.hypot(off.x - s.x, off.z - s.z) < 0.05) { this.away = true; return true; }
    let waited = 0;
    while (this.herNear(s.x, s.z, 4.5) || this.herNear(off.x, off.z, 4.5) || this.herSeatNear(off.x, off.z, 3)) { waited += this.W.dt; if (waited > 6) return false; yield; }
    this.away = true; s.here = false;
    yield* this.glideTo(s.x, s.z, off.x, off.z, 1.1, true);
    return true;
  }
  // back into its place: false if she is at it or sitting in it
  *sitDown() {
    const s = this.spot, off = this.standoff();
    if (s.by && s.by !== this) { console.warn('researchers:', this.name, 'found its place taken by', s.by.name); return false; }
    s.by = this;
    if (!off || Math.hypot(off.x - s.x, off.z - s.z) < 0.05) { s.here = true; this.away = false; this.act = this.spotAct(); return true; }
    let waited = 0;
    while (this.herNear(s.x, s.z, this.keep + 0.4) || this.herSeatNear(s.x, s.z, 2.2) || this.herNear(off.x, off.z, this.keep)) { waited += this.W.dt; if (waited > 4) return false; this.m.v = 0; yield; }
    const near = Math.hypot(this.x - s.x, this.z - s.z) < 3.4;      // (from wherever it got to beside the seat, if it is close)
    yield* this.glideTo(near ? this.x : off.x, near ? this.z : off.z, s.x, s.z, 1.1, false);
    this.m.yaw = s.yaw; s.here = true; this.away = false; this.act = this.spotAct(); this.carry = null;
    return true;
  }
  // the short way between a seat and the floor: straight, slowly, turning to the work as it sits (not on the plan:
  // the seat is not floor); `up`: getting up (the body stands as it goes), else sitting down
  *glideTo(x0, z0, x1, z1, secs, up) {
    const W = this.W, m = this.m, t0 = W.now, s = this.spot; this.act = up ? 'rise' : 'sit'; this.gliding = true; m.stop(); this.glideT0 = t0; this.glideTask = this.task; this.note('glide ' + (up ? 'up' : 'down'));
    try {
      while (W.now - t0 < secs) {
        const k = Math.min(1, (W.now - t0) / secs), e = k * k * (3 - 2 * k); this.glideK = up ? e : 1 - e;
        if (up && k > 0.25) this.seated = false; if (!up && k > 0.75 && s.seated) this.seated = true;
        m.x = x0 + (x1 - x0) * e; m.z = z0 + (z1 - z0) * e;
        m.face(up ? (Math.hypot(x1 - x0, z1 - z0) > 0.3 ? Math.atan2(x1 - x0, z1 - z0) : s.yaw) : s.yaw, W.dt * 3);
        yield;
      }
      m.x = x1; m.z = z1; if (!up) this.seated = s.seated;
    } finally { this.gliding = false; this.glideK = 0; }
  }
  // an errand in the room: somewhere to go, something to do there, and back
  *errand() {
    const W = this.W, L = this.L, kind = this.errandKind(); if (!kind) return;
    this.why = 'errand: ' + (kind.what ?? ''); this.note('errand ' + kind.what);
    this.errands = (this.errands ?? 0) + 1;
    const s = this.spot;
    if (!(yield* this.rise())) { this.away = false; s.here = true; this.act = this.spotAct(); return; }
    try {
      if (kind.what === 'stretch') { this.act = 'stretch'; yield* this.hold(2.5 + Math.random() * 2); }
      else {
        this.act = 'walk'; this.errandAt = kind;
        if (yield* this.walk(kind.x, kind.z, { patience: 14, speed: 0.8 })) {
          if (kind.with) { kind.with.chat = this; this.chat = kind.with; }
          this.act = kind.what; const t0 = W.now, dur = kind.dur;
          while (W.now - t0 < dur) { if (kind.yaw !== undefined) this.m.face(kind.yaw, W.dt * 2); else if (kind.with) this.m.faceTo(kind.with.x, kind.with.z, W.dt * 2); this.m.v = 0; this.chatter(); if (kind.with && (kind.with.away || kind.with.spot?.room !== s.room)) break; yield; }
        }
      }
    } finally { if (kind.with && kind.with.chat === this) kind.with.chat = null; this.chat = null; this.errandAt = null; }
    yield* this.goBack();
    this.nextErrand = this.L.now + 30 + Math.random() * 50;      // (a while at its work before the next)
  }
  *goBack() {
    const s = this.spot, off = this.standoff(); this.why = 'back to its place';
    // (somewhere it cannot walk from: another floor, off the plan; it goes there unseen)
    if (Math.abs(this.y - s.y) > 2 || !this.floor?.plan.inBoxes(this.x, this.z)) { this.act = 'stand'; this.why = 'out of place, waiting to go unseen'; yield* this.unseenThen(() => true, 1e9); this.placeAt(s); return; }
    for (let tries = 0; ; tries++) {
      this.act = 'walk';
      // to the floor beside its seat (after a failed try, any clear floor beside it that nobody is at)
      let to = off; if (tries && off) { const p = this.plan, c = p.nearest(s.x, s.z, this.m.need, 3.2, false, c => p.lane[c] !== 3 && !p.inDoorway(p.cx(c), p.cz(c)) && !this.W.taken(this, p.cx(c), p.cz(c), this.r + 0.9) && Math.hypot(p.cx(c) - off.x, p.cz(c) - off.z) > 0.7); if (c >= 0) to = { x: p.cx(c), z: p.cz(c) }; }
      if (!to || (yield* this.walk(to.x, to.z, { must: true, patience: 14, speed: 0.8 }))) { if (yield* this.sitDown()) return; }
      else if (Math.hypot(this.x - s.x, this.z - s.z) < 3.4 && !this.herNear(s.x, s.z, this.keep + 1)) { if (yield* this.sitDown()) return; }      // (close enough: in from here)
      if (!this.awake) return;
      // a way back it cannot find after several goes, with her nowhere near it: back as soon as nobody is looking
      if (tries >= 3 && !this.herNear(s.x, s.z, 9) && !this.herNear(this.x, this.z, 9)) { this.act = 'stand'; this.why = 'no way back, waiting to go unseen'; yield* this.unseenThen(() => true, 1e9); this.placeAt(s); return; }
      // she is at its place (or sitting by it): wait out of the way, on open floor nearby, and try again in a little while
      this.act = 'walk'; const pt = this.roomSpot(4.4, off?.x ?? this.x, off?.z ?? this.z, 10);
      if (pt && Math.hypot(pt.x - this.x, pt.z - this.z) > 1) yield* this.walk(pt.x, pt.z, { patience: 8 });
      this.act = 'stand'; yield* this.hold(3 + Math.random() * 4);
    }
  }
  // Polite.travel, given up if it makes no headway for some seconds while she is nowhere near (a corner it cannot
  // get round, somebody standing in a narrow place): whoever asked then does something else
  *walk(x, z, o = {}) {
    const W = this.W, gen = this.travel(x, z, o); let lx = this.x, lz = this.z, lt = W.now; this.note(`walk to ${x.toFixed(1)},${z.toFixed(1)}`);
    for (;;) {
      const r = gen.next(); if (r.done) { this.note('walk ' + (r.value ? 'there' : 'failed')); return r.value; }
      if (Math.hypot(this.x - lx, this.z - lz) > 0.5) { lx = this.x; lz = this.z; lt = W.now; }
      else if (W.now - lt > (o.stall ?? 9) * (this.herNear(this.x, this.z, 9) ? 2.5 : 1)) { gen.return(); this.m.stop(); this.note('walk gave up'); return false; }
      yield;
    }
  }
  *hold(secs) { const W = this.W, t0 = W.now; while (W.now - t0 < secs) { this.m.v = 0; yield; } }
  // a few words between two colleagues, if she is near enough to hear
  chatter() {
    const L = this.L, W = this.W, o = this.chat; if (!o || W.now < (this.chatAt ?? 0)) return;
    this.chatAt = W.now + 3.5 + Math.random() * 3;
    const v = L.visitorAt(); if (!v || Math.hypot(v.x - this.x, v.z - this.z) > 16 || Math.abs(v.y - this.y) > 4) return;
    const who = Math.random() < 0.5 ? this : o; L.say(who, null, 3.2, 'chat');
  }
  // what the errand is: a colleague to have a word with, a window, a shelf, a turn about the room, or a stretch
  errandKind() {
    const L = this.L, s = this.spot, F = this.floor, p = F?.plan, name = s.room?.name; if (!p) return null;
    const need = this.m.need, rnd = Math.random, v = L.visitorAt();
    const fine = (x, z) => p.freeAt(x, z, need, false) && p.laneAt(x, z) !== 3 && p.laneAt(x, z) !== 2 && !p.inDoorway(x, z) && F.inRoom(name, x, z) && !(v && Math.hypot(v.x - x, v.z - z) < 4.5) && !this.L.takenBy(this, x, z, this.r + 1.4);
    const opts = [];
    // a colleague at their place
    const mates = L.members.filter(o => o !== this && o.spot && !o.away && o.spot.here && o.spot.room === s.room && o.spot.site === s.site && Math.hypot(o.x - s.x, o.z - s.z) < 22);
    for (const o of mates) for (const d of [this.r + o.r + 1.1, this.r + o.r + 1.7]) for (let k = 0; k < 8; k++) {
      const a = o.spot.yaw + Math.PI / 2 + k * TAU / 8, x = o.x + Math.sin(a) * d, z = o.z + Math.cos(a) * d;
      if (fine(x, z)) { opts.push([{ what: 'chat', x, z, with: o, dur: 9 + rnd() * 9 }, 3]); break; }
    }
    // a window of this room
    for (const w of L.windows) { if (Math.abs(w.y - this.y) > 6) continue; const x = w.x - w.nx * 2.3, z = w.z - w.nz * 2.3; if (!F.inRoom(name, x, z) || Math.hypot(x - s.x, z - s.z) > 24) continue; const c = p.nearest(x, z, need, 1.6, false, c => fine(p.cx(c), p.cz(c))); if (c >= 0) opts.push([{ what: 'window', x: p.cx(c), z: p.cz(c), yaw: Math.atan2(w.nx, w.nz), dur: 8 + rnd() * 10 }, 1.5]); }
    // a shelf, a case, a board: somewhere that stands against something tall
    for (let k = 0; k < 2; k++) {
      const q = p.randomSpot(need, rnd, need, c => { const x = p.cx(c), z = p.cz(c); if (!fine(x, z) || Math.hypot(x - s.x, z - s.z) > 22) return false; for (let j = 0; j < 8; j++) { const a = j * TAU / 8; if (!p.see(x, z, x + Math.sin(a) * 1.6, z + Math.cos(a) * 1.6)) return true; } return false; });
      if (q) { let yaw = 0; for (let j = 0; j < 16; j++) { const a = j * TAU / 16; if (!p.see(q.x, q.z, q.x + Math.sin(a) * 1.6, q.z + Math.cos(a) * 1.6)) { yaw = a; break; } } opts.push([{ what: 'browse', x: q.x, z: q.z, yaw, dur: 7 + rnd() * 9 }, 2]); break; }
    }
    // a turn about the room, thinking
    const q = p.randomSpot(need, rnd, 3, c => fine(p.cx(c), p.cz(c)) && Math.hypot(p.cx(c) - s.x, p.cz(c) - s.z) < 18);
    if (q) opts.push([{ what: 'think', x: q.x, z: q.z, dur: 5 + rnd() * 6 }, 1]);
    opts.push([{ what: 'stretch' }, s.seated ? 1 : 0.3]);
    return weighted(opts, rnd);
  }
  // on to another of its places: across the floor on foot, or away by the stairs or the door and in at the other end
  *moveOn() {
    const L = this.L, W = this.W, s = this.spot, next = L.choose(this);
    if (!next) { this.stintEnd = L.now + 40 + Math.random() * 60; return; }
    next.by = this; next.here = false; this.dest = next;
    const nextF = L.floors.at(next.site, next.y), off = this.standoff(), noff = this.standoff(next);
    try {
      if (!off) { yield* this.unseenThen(() => true, 40); return this.leaveFor(next); }
      if (!(yield* this.rise())) { this.release(next); this.stintEnd = L.now + 20; s.here = true; this.away = false; this.act = this.spotAct(); return; }
      s.here = false; if (s.by === this) s.by = null; this.spot = null; this.act = 'walk'; this.carry = this.touches?.mug ? null : (s.pose === 'type' || s.pose === 'write' ? 'papers' : 'book');      // (its work goes with it)
      this.why = 'walking to ' + next.key;
      if (nextF === this.floor && noff) {
        if (yield* this.walk(noff.x, noff.z, { must: true, patience: 50, speed: 1 })) { this.spot = next; this.dest = null; next.here = false; if (yield* this.sitDown()) { this.stintEnd = L.now + L.stint(); return; } this.spot = null; this.dest = next; }
      }
      // off the floor: to the nearest stair or door that nobody is standing at, and on down the stair or out of the door
      for (let tries = 0, tried = new Set(); tries < 3; tries++) {
        const ex = this.exitNear(this.x, this.z, this.floor, tried); if (!ex) break; tried.add(ex); this.why = 'to the ' + ex.kind + ' for ' + next.key;
        if ((yield* this.walk(ex.x, ex.z, { must: true, patience: 15 })) && (yield* this.through(ex, true))) return this.leaveFor(next);
      }
      this.act = 'stand';
      yield* this.unseenThen(() => true, 1e9);
      this.leaveFor(next);
    } finally { /* (interrupted on the way: researchers.js settles it where she cannot see) */ }
  }
  release(spot) { if (spot && spot.by === this && !spot.here) spot.by = null; if (this.dest === spot) this.dest = null; }
  leaveFor(next) { const s = this.spot; if (s && s.by === this) { s.by = null; s.here = false; } this.spot = null; this.vanish(); this.dest = next; this.transitUntil = this.L.now + 15 + Math.random() * 30; }
  // the nearest way off this floor that nobody is at or bound for
  exitNear(x, z, F = this.floor, not = null) { const L = this.L; return L.floors.exits(F).filter(e => !not?.has(e) && !this.W.taken(this, e.x, e.z, this.r + 1.4) && !this.herNear(e.tx, e.tz, 3.5) && !this.herNear(e.x, e.z, 3)).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0] ?? null; }
  // on through it (out: from the floor onto the stair, going down or up it, or out of the door; else the other way, coming in)
  *through(e, out) {
    const W = this.W, m = this.m, y0 = this.floor.y, secs = 1.6;
    if (out) { let w = 0; while (this.herNear(e.tx, e.tz, 3.5)) { if ((w += W.dt) > 4) return false; m.v = 0; yield; } }
    this.act = 'walk'; this.gliding = true; this.ghost = !out; m.stop();
    try {
      const t0 = W.now, [ax, az, bx, bz] = out ? [e.x, e.z, e.tx, e.tz] : [e.tx, e.tz, e.x, e.z], [ya, yb] = out ? [y0, y0 + e.dy] : [y0 + e.dy, y0];
      m.yaw = Math.atan2(bx - ax, bz - az);
      while (W.now - t0 < secs) { const k = (W.now - t0) / secs; m.x = ax + (bx - ax) * k; m.z = az + (bz - az) * k; m.y = ya + (yb - ya) * k; m.v = 1.6; yield; }
      m.x = bx; m.z = bz; m.y = yb;
    } finally { this.gliding = false; this.ghost = false; m.v = 0; }
    return true;
  }
  // wait until nobody can see it (at most `secs`), then go on
  *unseenThen(fn, secs) { const W = this.W, t0 = W.now; this.why = 'waiting to go unseen'; while (this.L.seen(this.x, this.y, this.z, this.floor) && W.now - t0 < secs) { this.m.v = 0; yield; } return fn(); }
  // coming in: straight to its place if nobody can see it, else by a stair or door of that floor that she cannot see
  *arrive() {
    const L = this.L, W = this.W;
    for (;;) {
      if (L.now < (this.transitUntil ?? 0)) { yield; continue; }
      let d = this.dest;
      if (!d || (d.by && d.by !== this) || this.herNear(d.x, d.z, 2) || this.herSeatNear(d.x, d.z, 1.5)) { if (d && d.by === this) d.by = null; d = this.dest = L.choose(this, true); if (!d) { this.transitUntil = L.now + 10; continue; } d.by = this; }
      if (!L.seen(d.x, d.y, d.z, L.floors.at(d.site, d.y))) { this.placeAt(d); this.stintEnd = L.now + L.stint(); return; }
      const F = L.floors.at(d.site, d.y), noff = F && this.standoff(d), ex = F && noff && this.exitNear(d.x, d.z, F);
      if (ex) {
        this.carry = this.touches?.mug ? null : 'book'; this.floor = F; this.m.plan = F.plan; this.m.x = ex.tx; this.m.z = ex.tz; this.m.y = F.y + ex.dy; this.hidden = false; this.seated = false; this.spot = null;
        yield* this.through(ex, false); this.act = 'walk';
        if (yield* this.walk(noff.x, noff.z, { must: true, patience: 50 })) { this.spot = d; d.here = false; if (yield* this.sitDown()) { this.dest = null; this.stintEnd = L.now + L.stint(); return; } this.spot = null; }
        const back = this.exitNear(this.x, this.z);
        if (back && (yield* this.walk(back.x, back.z, { must: true, patience: 40 })) && (yield* this.through(back, true))) { this.vanish(); this.transitUntil = L.now + 5; continue; }
        this.act = 'stand'; yield* this.unseenThen(() => true, 1e9); this.vanish(); this.transitUntil = L.now + 5; continue;
      }
      this.transitUntil = L.now + 2;
    }
  }
}
export { VR, wrap, pick };
