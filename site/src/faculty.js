// The faculty: the robots who teach here. Who they are is in faculty/roster.js (name, look, field); where they
// stand and what they say is given by the furnish file that places them:
//
//   f.faculty({ id, home: [X, Y, h], faces: [X, Y], posts: [[X, Y], ...], field, serve, lecture, lines })      (src/furnish/README.md)
//
// which hands this file a spec in world terms:
//   id, name, field, look, rest, roam      from the roster
//   home [x, z], y            where they stand, and the height of the floor there; faces [x, z]: what they look at when alone
//   room                      the room they belong to ({ name, site, x0, x1, z0, z1 }): they keep to it, and "you have come in" means into it
//   posts [[x, z], ...]       other spots they drift to and fuss at
//   roam                      ['Room', ...]: neighbouring rooms on the same floor it may go into (its posts there are excursions)
//   serve                     { machine: [x, z], pickup: { xz: [x, z], y } } if they make things to order; optional
//                             drinks: { name: { vessel, liquid, note, last } } and food: { name: { build: THREE => Object3D, bites, note } }.
//                             What they make is set down at the pickup and taken in the hand (hold.js): Q sips or bites.
//   lecture                   { stand: [X, Y, h], board: [X, Y], script: [...], pace } (still in the building's own plan
//                             coordinates: turned into the world's here): they lecture at the front (below)
//   lines                     greet[], idle[], bye[], served[], aside[], topics[{ q, a, next: [topics], serve: 'drink name', then: ctx => {} }]
//
// E on one opens a small card of things to say (faculty/talk.js). They greet you when you come in, mutter to
// themselves, turn to watch you, drift about their room, and keep out of your way.
//
// How they get about and how they behave toward the visitor is not this file's: faculty/nav.js (a plan of the
// room's floor, a way across it), faculty/agent.js (a task is a generator), faculty/manners.js (never through
// you, aside when you come, out of doorways, never shutting you in). Those three know nothing of the school and
// are meant to be shared with Anna's House and Vesper Street. This file is the school's own part: what a teacher
// does with its day (home, posts, fussing, a drink to order, a lecture), its lines, and hiring them.
// Nothing here runs for a robot the visitor is nowhere near.

import { makeBubbles } from './faculty/bubbles.js';
import { makeTalk } from './faculty/talk.js';
import { useThreeBody, buildBody, lookFromSeed } from './faculty/body.js';
import { useThreeDrinks, buildDrink, setFill } from './faculty/drinks.js';
import { ROSTER, byId } from './faculty/roster.js';
import { makeWorld, Polite, VR, attendVisitor, engageVisitor } from './faculty/manners.js';
import { hireResearchers } from './faculty/researchers.js';

let THREE;
const TAU = Math.PI * 2;
const pick = a => a[Math.floor(Math.random() * a.length)];
const TURNS = { east: 0, north: 1, west: 2, south: 3 };
const ASIDES = ['Come in, sit anywhere.', 'Come in. We have not got far.', '*nods you toward a seat*'];
// Two colleagues who stop to talk (the visitor hears a line or two of it, if she is near): an opening, a reply, a parting
const CHAT = [
  ['Have you a minute? It is about Thursday.', 'For you, two. What about Thursday?', 'I will put it in a note. A short one.'],
  ['Did you see what came back from the reviewers?', 'I did. I have decided to be amused by it.', 'Amused is good. Amused gets papers revised.'],
  ['Your seminar ran over again.', 'The questions were better than the talk.', 'They usually are. That is why we have them.'],
  ['Is the kettle on the third floor working?', 'It is working. It is not pleasant about it.', 'Neither am I, before ten.'],
  ['I think the result holds.', 'You said that in March.', 'In March I was wrong in a different way.'],
  ['Someone has taken my good chalk.', 'Someone has taken everyone\'s good chalk.', 'Then it is a field study.'],
  ['Are you coming to the reading group?', 'If the reading is short.', 'It is never short. Come anyway.'],
  ['The airship was late.', 'The airship is never late. The clouds are early.', '*laughs* I will tell her you said so.'],
];
// What a robot does with its hands, by the tool it carries, when it is at work where it stands
const BENCH = { book: ['read', 'read', 'think'], notebook: ['read', 'think', null], clipboard: ['read', 'think', null], pipette: [null, 'think', null], magnifier: ['think', null, null], cup: ['sip', null, 'think'], duster: [null, 'reach', null], wrench: [null, 'reach', null] };

class Teacher extends Polite {
  constructor(H, spec) {
    const look = { ...(spec.look ?? {}) }, b = buildBody(look);
    super(H.W, { radius: b.radius, top: b.top, speed: spec.speed ?? 2.6, plan: () => this.survey() });
    this.H = H; this.spec = { ...spec, look }; this.name = spec.name; this.rest = spec.rest ?? 'neutral'; this.body = b;
    this.roam = spec.roam ?? true; this.fixed = !!spec.fixed;
    const m = this.m; [m.x, m.z] = spec.home; m.y = spec.y ?? 0; this.phase = Math.random() * 10;
    this.homeYaw = spec.faces ? Math.atan2(spec.faces[0] - m.x, spec.faces[1] - m.z) : 0; m.yaw = this.homeYaw;
    this.spots = { home: { x: spec.home[0], z: spec.home[1] }, posts: (spec.posts ?? []).map(p => ({ x: p[0], z: p[1] })), machine: spec.serve ? { x: spec.serve.machine[0], z: spec.serve.machine[1] } : null };
    b.root.position.set(m.x, m.y, m.z); b.root.rotation.y = m.yaw; H.group.add(b.root);
    if (spec.room) H.ctx.track?.(b.root, 'r:' + spec.room.name);      // drawn only when its room can be seen (visibility.js)
    this.bubble = H.bubbles.make(spec.name);
    this.state = 'home'; this.queue = []; this.expr = 'neutral'; this.exprUntil = 0; this.busy = false; this.pointing = false; this.nodAt = -9;
    this.greeted = -1e9; this.wasIn = false; this.nextIdle = H.now + 20 + Math.random() * 30; this.drink = null; this.trips = 0;
    // what it is doing with its hands (body.js animate act), turning to her (manners.js attendVisitor), and sitting
    this.act = null; this.bend = 0; this.attn = {}; this.seat = null; this.sitTo = 0; this.sitK = 0; this.drop = 0; this.chatting = null; this.cupFor = 0;
    if (spec.lecture?.script?.length) this.setLecture(spec.lecture);
    // (a lecturer can be spoken to from anywhere in its room: the far ones must be looked straight at, as life.js has it)
    const far = this.lec && spec.room ? Math.max(10, Math.hypot(spec.room.x1 - spec.room.x0, spec.room.z1 - spec.room.z0)) : 10; this.talkReach = far + 2;
    this.item = { x: m.x, y: m.y + b.eye, z: m.z, reach: far, size: 1.7, label: () => (H.talk.robot === this ? 'say the next thing' : `talk to ${spec.name}`), act: () => H.talk.press(this) };
    H.ctx.interact.push(this.item);
  }
  // The plan of the floor it gets about on: its own room (all the boxes of that name), or the ground round its home
  survey() {
    const H = this.H, sp = this.spec, r = sp.room, [hx, hz] = sp.home, R = typeof this.roam === 'number' ? this.roam : 10;
    const level = q => q.site === r.site && Math.abs((q.floor ?? q.y0) - (r.floor ?? r.y0)) < 1, mine = r ? H.ctx.house.rooms.filter(q => q.name === r.name && level(q)) : [{ x0: hx - R, x1: hx + R, z0: hz - R, z1: hz + R }];
    // roam: ['Room', ...]: the neighbouring rooms it may make excursions into, on its own floor, and the doorways that join them to its own
    const names = Array.isArray(sp.roam) ? sp.roam : [], others = r ? H.ctx.house.rooms.filter(q => names.includes(q.name) && q.name !== r.name && level(q)) : [], links = [];
    for (const n of names) if (r && n !== r.name && !others.some(q => q.name === n)) console.warn(`faculty: ${sp.id} is to roam into "${n}", which is not a room of this building on its floor`);
    if (others.length) for (const p of H.ctx.house.portals ?? []) {
      if (p.kind !== 'door' || p.y0 > (sp.y ?? 0) + 3 || p.y1 < (sp.y ?? 0) + 1) continue;
      const ax = p.x1 - p.x0 > p.z1 - p.z0, b = { x0: p.x0 - (ax ? 0 : 1.6), x1: p.x1 + (ax ? 0 : 1.6), z0: p.z0 - (ax ? 1.6 : 0), z1: p.z1 + (ax ? 1.6 : 0) }, hit = q => q.x1 > b.x0 && q.x0 < b.x1 && q.z1 > b.z0 && q.z0 < b.z1;
      if (new Set([...mine, ...others].filter(hit).map(q => q.name)).size >= 2) links.push(b);
    }
    this.homeBoxes = r ? mine : null; const boxes = [...mine, ...others, ...links];
    if (r && others.length) H.ctx.track?.(this.body.root, [...new Set([r, ...others].map(q => 'r:' + q.name))]);      // drawn when any of its rooms can be seen
    const plan = H.W.plan({ boxes, links, y: sp.y ?? 0, top: Math.max(3.2, this.body.top), open: !r, hall: /\bhall\b|corridor|vestibule|lobby|passage/i.test(r?.name ?? '') });
    // nobody is posted in a doorway (the opening itself, or a step from it) or at a stair, whatever the furnish file says: such a spot is moved to the nearest floor that is neither
    const fix = (p, what) => { if (!p) return; const l = plan.laneAt(p.x, p.z); if (l !== 3 && !plan.inDoorway(p.x, p.z)) return; const c = plan.nearest(p.x, p.z, this.m.need, 8, false, c => plan.lane[c] !== 3 && !plan.inDoorway(plan.cx(c), plan.cz(c))); if (c >= 0) { console.info(`faculty: ${sp.id}'s ${what} is ${l === 3 ? 'at a stair' : 'in a doorway'}; moved ${Math.hypot(plan.cx(c) - p.x, plan.cz(c) - p.z).toFixed(1)} ft`); p.x = plan.cx(c); p.z = plan.cz(c); } };
    fix(this.spots.home, 'home'); this.spots.posts.forEach(p => fix(p, 'post')); fix(this.spots.machine, 'machine'); if (this.lec) fix(this.lec.stand, 'lecture stand');
    return plan;
  }
  // a place given to it by name (home, a post, the machine, the front of the class) may be in an aisle: behind a counter, behind a desk
  mayStandHere() { const s = this.spots, L = this.lec, near = p => p && Math.hypot(p.x - this.x, p.z - this.z) < 1.3; return near(s.home) || near(s.machine) || s.posts.some(near) || (L && (near(L.stand) || near(L.mark) || !!L.spots?.board.some(near) || !!L.spots?.pace.some(near))) || (this.seat && near({ x: this.seat.ax, z: this.seat.az })); }
  // (the face goes with the words: a question asked looks it, an exclamation is pleased, a lecture line is thought through)
  say(text, expr = 'happy', secs, style) { if (!text) return; this.bubble.say(text, secs, this.H.now, style);
    if (expr === 'neutral' || expr === 'happy') { const q = /\?\s*(\*[^*]*\*)?$/.test(text), x = /!/.test(text); expr = q ? (style === 'lecture' ? 'focus' : 'surprised') : x ? 'happy' : style === 'lecture' ? ['neutral', 'focus', 'neutral', 'happy'][(text.length >> 2) % 4] : expr; }
    this.expr = expr; this.exprUntil = this.H.now + (style === 'lecture' ? Math.min(secs ?? 4, 6) : 3.5); if (style !== 'lecture') this.H.ctx.sound?.chirp?.(this.spec.chirp ?? [70 + (this.name.length % 5) * 2, 74 + (this.name.length % 4) * 2]); }
  line(kind) { const l = this.spec.lines?.[kind]; if (l?.length) this.say(pick(l), kind === 'idle' ? 'neutral' : 'happy'); }
  topics(list) {
    return list.slice(0, 4).map(t => ({ text: t.q, act: () => {
      this.say(Array.isArray(t.a) ? pick(t.a) : t.a, t.expr ?? (t.serve ? 'wink' : 'happy'), 6); this.replyUntil = this.H.now + 6;      // (still talking to her while it answers)
      if (t.serve && this.spec.serve) this.queue.push(t.serve);
      t.then?.(this.H.ctx, this);
      this.asked = (this.asked ?? 0) + 1;
      return t.next ? this.topics(t.next) : null;
    } }));
  }
  dialogue() {
    // Up to four things to say; a longer list turns over so the later ones get their turn
    const all = this.spec.lines?.topics ?? [], n = all.length, k = (this.asked ?? 0) % Math.max(1, n);
    const list = n <= 4 ? all : [...all.slice(0, 2), ...[0, 1].map(i => all[2 + ((k + i) % (n - 2))])];
    this.expr = 'happy'; this.exprUntil = this.H.now + 2;
    return this.topics(list);
  }

  // ---- the day: what each does depends on what is about it. At its own place a while, at work (with whatever is
  // in its hands); a trip to a post (a shelf, a bench, the window) to work there, reaching up, bent to it; for those
  // that float, a while sat at a desk (typing, writing, reading, thinking, a sip) or in an easy chair with a book;
  // now and then over to a colleague for a word. Whoever she is, it turns to her as she comes up (update, below).
  *day() {
    const s = this.spots;
    for (;;) {
      const seats = this.seatsHere(), desk = seats.filter(q => q.desk), easy = seats.filter(q => !q.desk), came = this.cameIn;
      const pick2 = [['home', 3], ['post', this.roam && s.posts.length ? 3 : 0], ['wander', this.roam ? 1.2 : 0], ['desk', desk.length ? 4 : 0], ['easy', easy.length ? 2 : 0], ['chat', this.colleague() ? 1.2 : 0]];
      const w = pick2.reduce((t, [, n]) => t + n, 0); let r = Math.random() * w, what = 'home'; for (const [k, n] of pick2) { r -= n; if (r <= 0) { what = k; break; } }
      if (what === 'home') yield* this.atWork(8 + Math.random() * 14, 'home');
      else if (what === 'desk' || what === 'easy') { const q = pick(what === 'desk' ? desk : easy); if (!(yield* this.sitAt(q, what === 'desk' ? 25 + Math.random() * 40 : 20 + Math.random() * 30, what))) yield* this.atWork(4, 'home'); }
      else if (what === 'chat') { const o = this.colleague(); if (!o || !(yield* this.chatWith(o))) yield* this.atWork(4, 'home'); }
      else yield* this.trip(what === 'post');
      if (this.cameIn !== came) yield* this.atWork(3, 'home');                                  // someone has come in: a moment where it is
      if (Math.hypot(s.home.x - this.x, s.home.z - this.z) > 1 && Math.random() < 0.6) { this.state = 'go'; if (!(yield* this.travel(s.home.x, s.home.z, { must: true, patience: 30 }))) yield* this.stay(4, 'fuss'); }
    }
  }
  // a trip or two to a post or a clear spot of the room, and work there; (now and then an excursion into the next room)
  *trip(posts) {
    const W = this.W, s = this.spots, came = this.cameIn, away = s.posts.filter(q => !this.atHomeRoom(q)), trip = posts && away.length && Math.random() < 0.35 ? pick(away) : null;
    const n = trip ? 1 + (Math.random() < 0.4) : 1 + Math.floor(Math.random() * 2.6);
    for (let k = 0; k < n; k++) {
      const p = trip ? (k ? pick(away.filter(q => q !== trip && Math.hypot(q.x - trip.x, q.z - trip.z) < 30)) ?? null : trip) : this.somewhere(); if (!p) break;
      this.state = 'go'; this.trips++;
      if (yield* this.travel(p.x, p.z, { patience: trip ? 40 : 9 })) {
        // at work: turned to the bench, the shelf or the instrument it has come to, bent to it, hands busy (or up at a shelf, or thinking it over); a word about it now and then
        const post = s.posts.includes(p), yaw = this.benchYaw();
        if (yaw !== null) { const t0 = W.now; while (W.now - t0 < 1.2) { this.m.face(yaw, W.dt * 1.4); yield; } }
        if (post && this.inRoom && W.now > this.nextIdle - 14 && this.H.talk.robot !== this && !this.bubble.talking(W.now)) { this.line('idle'); this.nextIdle = W.now + 28 + Math.random() * 40; }
        const secs = post ? 5 + Math.random() * 7 : 3 + Math.random() * 4;
        if (yaw !== null && Math.random() < 0.3) yield* this.doing('reach', secs * 0.5, 'focus'); 
        yield* this.fuss(secs * (yaw !== null ? 0.7 : 1));
        if (post && Math.random() < 0.5) yield* this.atWork(2 + Math.random() * 3, 'pause');
      } else yield* this.stay(1.5 + Math.random() * 2, 'fuss');
      if (this.cameIn !== came) break;                                    // someone has come in: back to its own place
    }
  }
  // Where it stands, at its work: a few turns of whatever goes with what it carries (a book read, a cup sipped, a
  // thought had), stood still between
  *atWork(secs, state) {
    const W = this.W, end = W.now + secs, kinds = BENCH[this.spec.look?.tool] ?? ['think', null, null];
    while (W.now < end) {
      const a = Math.random() < 0.55 ? pick(kinds) : null, d = Math.min(end - W.now, 3 + Math.random() * 5);
      if (a) yield* this.doing(a, d, a === 'think' ? 'focus' : null, state); else yield* this.stay(d, state);
    }
  }
  // Hold still with the hands at something (body.js animate act), for secs
  *doing(act, secs, expr = null, state = 'fuss') {
    const W = this.W, end = W.now + secs; this.state = state;
    if (act === 'sip') this.cup(true);
    try { while (W.now < end) { this.act = act; this.m.v = Math.max(0, this.m.v - W.dt * 4); if (expr && W.now > this.exprUntil - 0.3) { this.expr = expr; this.exprUntil = W.now + 0.5; } yield; } }
    finally { this.act = null; if (act === 'sip') this.cup(false); }
  }
  // a cup in the hand that has none, for a sip (and away again after)
  cup(on) { const b = this.body, tool = this.spec.look?.tool, i = tool === 'cup' ? -1 : this.spec.look?.tool2 ? -1 : 0; if (i < 0 || !!this.cupOn === !!on) return; this.cupOn = !!on; b.setTool(i, on ? 'cup' : this.spec.look?.tool2 ?? null); }
  // Hold still: turned to its own place's way when at home (to her, when she comes up, is attendVisitor's: update)
  *stay(secs, state) {
    const W = this.W, m = this.m, end = W.now + secs; this.state = state; this.busy = state === 'fuss' || state === 'make';
    const yaw0 = m.yaw;
    try {
      while (W.now < end) {
        m.v = Math.max(0, m.v - W.dt * 4);
        if (this.busy) m.face(yaw0, W.dt); else if (this.atHome() && !this.attn.looking) m.face(this.homeYaw, W.dt);
        yield;
      }
    } finally { this.busy = false; }
  }
  *fuss(secs) { yield* this.stay(secs, 'fuss'); }

  // ---- sitting: only those that float settle onto a seat (its ring goes out, its body comes down onto it); the
  // others stand at their work. The robot itself (its Mover) stays on open floor beside the seat; only its body is
  // drawn on the seat, so nothing that gets about by the plan ever finds it inside a chair.
  // Seats in its own room, at a sitting height, near its home or a post, that it can stand beside, and nobody's
  seatsHere() {
    const H = this.H, b = this.body; if (!b.floats || this.spec.serve || this.fixed || !this.spec.room) return [];
    if (!this.seatList || this.seatList.n !== H.ctx.items.seats.length) {
      const p = this.plan, y = this.y, list = [], near = [this.spots.home, ...this.spots.posts.filter(q => this.atHomeRoom(q))];
      for (const st of H.ctx.items.seats) {
        const top = st.y - 2.45 - y; if (top < 0.9 || top > 2.4 || !p.inBoxes(st.x, st.z) || !this.atHomeRoom(st) || /counter|stool/i.test(st.label ?? '')) continue;
        if (!near.some(q => Math.hypot(q.x - st.x, q.z - st.z) < 14)) continue;
        const drop = b.under - top + 0.04; if (drop < 0.25) continue;                         // (it would have to climb: not a seat for it)
        const c = p.nearest(st.x, st.z, this.m.need, 2.4, false, c => p.lane[c] !== 2 && p.lane[c] !== 3 && !p.inDoorway(p.cx(c), p.cz(c))); if (c < 0) continue;
        list.push({ s: st, x: st.x, z: st.z, ax: p.cx(c), az: p.cz(c), top, drop, yaw: st.yaw + Math.PI, desk: /desk|table/i.test(st.label ?? '') });
      }
      this.seatList = list; list.n = H.ctx.items.seats.length;
    }
    return this.seatList.filter(q => !this.H.seatTaken(q.s, this));
  }
  *sitAt(q, secs, kind) {
    const W = this.W, m = this.m, v = W.visitor;
    this.state = 'go'; if (!(yield* this.travel(q.ax, q.az, { patience: 14 }))) return false;
    if (this.H.seatTaken(q.s, this) || (this.about() && Math.hypot(v.x - q.x, v.z - q.z) < 2.2)) return false;
    let t0 = W.now; while (W.now - t0 < 0.9) { m.face(q.yaw, W.dt * 2); yield; }
    this.seat = q; this.H.claimSeat(q.s, this); this.state = 'sit'; this.drop = q.drop / this.body.root.scale.y;
    try {
      this.sitTo = 1; t0 = W.now; while (W.now - t0 < 1.1) { m.face(q.yaw, W.dt * 2); yield; }
      const end = W.now + secs, acts = kind === 'desk' ? ['type', 'type', 'read', 'think', 'type', 'sip'] : ['read', 'read', 'read', 'think', 'sip'];
      while (W.now < end && !this.queue.length) {
        const a = pick(acts); yield* this.doing(a, Math.min(end - W.now, 4 + Math.random() * 7), a === 'think' ? 'focus' : null, 'sit');
        if (Math.random() < 0.25) yield* this.stay(1.5 + Math.random() * 2, 'sit');
      }
      this.sitTo = 0; t0 = W.now; while (W.now - t0 < 1 && this.sitK > 0.05) yield;
      return true;
    } finally { this.sitTo = 0; this.seat = null; this.H.claimSeat(q.s, null); }
  }
  get sitting() { return this.sitK > 0.02 || this.sitTo > 0; }

  // ---- a word with a colleague: over to one standing about nearby in its own rooms, a few lines each, back to work
  colleague() {
    const H = this.H; if (this.lec || this.spec.serve || this.fixed || H.now - (H.lastChat ?? -60) < 50) return null;
    const ok = o => o !== this && !o.lec && !o.fixed && !o.chatting && !o.sitting && !o.making && !o.queue.length && o.taskName === 'day' && ['home', 'pause', 'fuss'].includes(o.state) && Math.abs(o.y - this.y) < 2 && Math.hypot(o.x - this.x, o.z - this.z) < 28 && this.plan.inBoxes(o.x, o.z) && H.talk.robot !== o;
    return H.awake?.find(ok) ?? null;
  }
  *chatWith(o) {
    const H = this.H, W = this.W; H.lastChat = H.now;
    const dx = this.x - o.x, dz = this.z - o.z, d = Math.hypot(dx, dz) || 1, gap = this.r + o.r + 1.4;
    const p = this.plan, c = p.nearest(o.x + dx / d * gap, o.z + dz / d * gap, this.m.need, 4, false, c => p.lane[c] !== 2 && p.lane[c] !== 3 && !p.inDoorway(p.cx(c), p.cz(c))); if (c < 0) return false;
    // (the other stops what it is doing and waits, turned to the one coming over)
    const lines = pick(CHAT);
    o.chatting = this; this.chatting = o; o.run('chat', o.listen(this, 22 + lines.length * 3.2), true);
    try {
      this.state = 'go'; if (!(yield* this.travel(p.cx(c), p.cz(c), { patience: 14, until: () => o.chatting !== this }))) return false;
      if (o.chatting !== this || Math.hypot(o.x - this.x, o.z - this.z) > gap + 2.5) return false;
      const hear = () => this.inRoom || o.inRoom;
      for (let k = 0; k < lines.length; k++) {
        const who = k % 2 ? o : this, other = k % 2 ? this : o;
        if (hear()) who.say(lines[k], k === lines.length - 1 ? 'happy' : 'neutral', 3.2); else { who.expr = 'happy'; who.exprUntil = W.now + 2.5; }
        who.act = k % 2 ? 'gesture' : null; other.nodAt = W.now + 1.2;
        const t0 = W.now; while (W.now - t0 < 3.2) { this.m.faceTo(o.x, o.z, W.dt * 2); this.state = 'chat'; yield; }
        who.act = null;
        if (o.chatting !== this) break;
      }
      return true;
    } finally { this.act = null; if (o.chatting === this) o.chatting = null; this.chatting = null; }
  }
  *listen(o, secs) {
    const W = this.W, end = W.now + secs; this.state = 'chat';
    try { while (W.now < end && this.chatting === o) { this.m.v = 0; if (Math.hypot(o.x - this.x, o.z - this.z) < 9) this.m.faceTo(o.x, o.z, W.dt * 1.5); yield; } }
    finally { this.act = null; if (this.chatting === o) this.chatting = null; }
  }
  // which way the work is from here: toward the nearest thing standing within arm's reach (a bench, a case, a wall with a board on it)
  benchYaw() {
    const p = this.plan;
    for (let r = this.r + 0.3; r < this.r + 3; r += 0.25) { let sx = 0, sz = 0, n = 0; for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, c = p.cellOf(this.x + Math.sin(a) * r, this.z + Math.cos(a) * r); if (c < 0 || !p.walk[c]) { sx += Math.sin(a); sz += Math.cos(a); n++; } } if (n && Math.hypot(sx, sz) > 0.3 * n) return Math.atan2(sx, sz); if (n) return null; }
    return null;
  }
  atHomeRoom(q) { return !this.homeBoxes || this.homeBoxes.some(b => q.x >= b.x0 && q.x <= b.x1 && q.z >= b.z0 && q.z <= b.z1); }
  atHome() { return Math.hypot(this.spots.home.x - this.x, this.spots.home.z - this.z) < 1; }
  // somewhere to drift to: one of the furnish file's posts, or any clear spot of the room that is open floor,
  // not a way through, not on top of the visitor and not somewhere that would shut her in
  somewhere() {
    const s = this.spots, v = this.W.visitor, p = this.plan, about = this.about();
    const far = q => !about || Math.hypot(q.x - v.x, q.z - v.z) > this.keep + 1.2 || !p.openBetween(q.x, q.z, v.x, v.z);
    const posts = s.posts.filter(q => this.atHomeRoom(q) && Math.hypot(q.x - this.x, q.z - this.z) > 2 && far(q) && !this.traps(q.x, q.z));
    if (posts.length && (Math.random() < 0.7 || typeof this.roam === 'number')) return pick(posts);
    const R = typeof this.roam === 'number' ? this.roam : 1e9;
    for (let k = 0; k < 3; k++) {
      const q = p.randomSpot(this.m.need, Math.random, 3, c => { if (p.lane[c]) return false; const x = p.cx(c), z = p.cz(c); return this.atHomeRoom({ x, z }) && Math.hypot(x - this.x, z - this.z) > 4 && Math.hypot(x - s.home.x, z - s.home.z) < R && (!about || Math.hypot(x - v.x, z - v.z) > 4.5); });
      if (q && !this.traps(q.x, q.z)) return q;
    }
    return posts.length ? pick(posts) : null;
  }
  think() {
    if (this.fixed) return this.run('home', this.stay(1e9, 'home'));
    if (this.lec) return this.run('lecture', this.lecture());
    this.run('day', this.day());
  }

  // ---- lecturing: at the front, facing the class, the script line by line, wherever the clock says it has got to ----
  setLecture(L) {
    const H = this.H, sp = this.spec, site = H.ctx.house.sites?.[sp.room?.site];
    const world = p => { if (L.world || !site) return { x: p[0], z: p[1] }; const k = (TURNS[site.facing] ?? 0) * Math.PI / 2, c = Math.round(Math.cos(k)), n = Math.round(Math.sin(k)); return { x: site.origin[0] + p[0] * c - p[1] * n, z: site.origin[1] - p[0] * n - p[1] * c }; };
    const stand = world(L.stand), board = world(L.board ?? L.stand), r = sp.room;
    if (r && !(stand.x >= r.x0 && stand.x <= r.x1 && stand.z >= r.z0 && stand.z <= r.z1)) { console.warn(`faculty: ${sp.id}'s lecture stand is outside ${r.name}; no lecture`); return; }
    // the class is away from the board, and toward the middle of the room
    let fx = stand.x - board.x, fz = stand.z - board.z, fl = Math.hypot(fx, fz); if (fl > 0.5) { fx /= fl; fz /= fl; } else fx = fz = 0;
    if (r) { const cx = (r.x0 + r.x1) / 2 - stand.x, cz = (r.z0 + r.z1) / 2 - stand.z, cl = Math.hypot(cx, cz) || 1; fx += cx / cl; fz += cz / cl; }
    const fl2 = Math.hypot(fx, fz) || 1; fx /= fl2; fz /= fl2;
    const lines = L.script.map(text => ({ text, dur: L.pace ? Math.max(L.pace, 1.8 + text.length * 0.04) : 3.2 + text.length * 0.075 })); let total = 0; for (const l of lines) { l.t0 = total; total += l.dur; }
    this.lec = { stand, mark: { ...stand }, board, fx, fz, lines, total, i: -1, said: -1, away: 0, greeted: false, aside: L.aside ?? sp.lines?.aside ?? ASIDES };
    this.bubble.avoid = new THREE.Vector3(board.x, (sp.y ?? 0) + 5.2, board.z);
    this.homeYaw = Math.atan2(fx, fz);
  }
  lectureNow() { const L = this.lec, T = (Date.now() / 1000) % L.total; let i = L.lines.length - 1; while (i > 0 && L.lines[i].t0 > T) i--; return { i, u: (T - L.lines[i].t0) / L.lines[i].dur }; }
  // The places at the front it teaches from, found once it has its plan: the lectern (its stand), a few spots
  // along the board to write at (close enough to reach it), and the ends of a short walk along the front. Each is
  // open floor, not a doorway, a stair or an aisle, reached in a straight line from the stand, and where a body
  // would not shut her in; the board spots and the walk are places it is allowed to stand (mayStandHere).
  lectureSpots() {
    const L = this.lec, p = this.plan, need = this.m.need, S = L.stand, ax = L.fz, az = -L.fx, out = { board: [], pace: [] };
    const ok = (x, z) => { const l = p.laneAt(x, z); return p.freeAt(x, z, need, false) && l !== 2 && l !== 3 && !p.inDoorway(x, z) && p.clearLine(S.x, S.z, x, z, need, false); };
    // the board: the way from it to the class is (bx, bz); spots in front of it, along it
    let bx = S.x - L.board.x, bz = S.z - L.board.z; const bl = Math.hypot(bx, bz); if (bl > 0.3) { bx /= bl; bz /= bl; } else { bx = L.fx; bz = L.fz; }
    const ux = bz, uz = -bx;
    for (const k of [-2.2, -0.9, 0.6, 1.9]) for (const d of [this.r + 0.55, this.r + 0.85, this.r + 1.25, this.r + 1.7]) { const x = L.board.x + bx * d + ux * k, z = L.board.z + bz * d + uz * k; if (ok(x, z)) { out.board.push({ x, z, k }); break; } }
    for (const k of [-3.6, -2.2, 2.2, 3.6]) { const x = S.x + ax * k, z = S.z + az * k; if (ok(x, z)) out.pace.push({ x, z, k }); }
    out.bx = bx; out.bz = bz; out.ux = ux; out.uz = uz; return out;
  }
  // What goes with each line of the script, by its number, in a round that keeps it at the board as often as not:
  // writing, pointing at what it has written, a step along the front, a gesture to the room, the notes at the
  // lectern, a question put to the room, now and then a sip
  lecturePlan(i) {
    const L = this.lec, sp = L.spots, round = ['talk', 'write', 'write', 'point', 'pace', 'gesture', 'lectern', 'write', 'ask', 'pace', 'write', 'point'], k = (i + this.name.length * 3) % round.length;
    let act = round[k]; if (i % 13 === 7 && !(this.spec.look?.tool2 && this.spec.look?.tool !== 'cup')) act = 'sip';
    if ((act === 'write' || act === 'point') && !sp.board.length) act = act === 'write' ? 'gesture' : 'talk';
    if (act === 'pace' && !sp.pace.length) act = 'gesture';
    const spot = act === 'write' || act === 'point' ? sp.board[(i * 5 + (act === 'point' ? 2 : 0)) % sp.board.length] : act === 'pace' ? sp.pace[(i * 3) % sp.pace.length] : act === 'lectern' || act === 'sip' || act === 'ask' ? L.stand : null;
    return { act, spot };
  }
  *lecture() {
    const W = this.W, m = this.m, L = this.lec;
    L.spots ??= this.lectureSpots();
    let plan = null, at = -1, away = 0;
    for (;;) {
      const { i, u } = this.lectureNow();
      if (i !== at) { at = i; plan = this.lecturePlan(i); }
      // to its place for this line, unhurried (or, if she is standing there, stay where it is: it will try the next line's)
      const spot = plan.spot;
      if (spot && Math.hypot(spot.x - this.x, spot.z - this.z) > 0.4 && W.now > away) {
        this.state = 'go'; this.act = null; L.mark.x = spot.x; L.mark.z = spot.z;
        const ok = yield* this.travel(spot.x, spot.z, { patience: 5, speed: this.dv < 12 ? 0.5 : 0.8, until: () => this.lectureNow().i !== at });
        if (!ok) { away = W.now + 6; plan.spot = null; if (this.visitorDist() < this.keep + 1) { const pt = this.roomSpot(this.keep + 1.5, L.stand.x, L.stand.z, 12); if (pt) yield* this.travel(pt.x, pt.z, { patience: 6 }); } }
        continue;
      }
      this.state = 'lecture'; m.v = Math.max(0, m.v - W.dt * 4);
      const classYaw = Math.atan2(L.fx, L.fz), sweep = Math.sin(W.now * 0.23 + this.phase) * 0.35;
      const toYaw = (a, rate) => m.face(a, W.dt * rate);
      const P = plan.act; let act = null;
      if (P === 'write' && plan.spot) {
        // turns to the board, writes (its back half to the room), and turns round again before the line is out
        const sg = -Math.sign(plan.spot.k) || 1, writeYaw = Math.atan2(-L.spots.bx + L.spots.ux * 0.4 * sg, -L.spots.bz + L.spots.uz * 0.4 * sg);      // (open a little toward the middle of the room)
        if (u > 0.07 && u < 0.8) { toYaw(writeYaw, 1.6); if (u > 0.14) act = 'write'; }
        else toYaw(classYaw + sweep * 0.5, 1.2);
      } else if (P === 'point' && plan.spot) {
        // half turned to what is written, an arm up to it, then back to the class
        const half = Math.atan2(-L.spots.bx * 0.7 + L.fx * 0.6, -L.spots.bz * 0.7 + L.fz * 0.6);
        if (u > 0.06 && u < 0.7) { toYaw(half, 1.4); if (u > 0.12) act = 'point'; } else toYaw(classYaw + sweep, 1);
      } else if (P === 'gesture') { toYaw(classYaw + sweep * 1.3, 0.8); if (u > 0.12 && u < 0.85) act = 'gesture'; }
      else if (P === 'ask') { toYaw(classYaw + Math.sin(W.now * 0.5 + this.phase) * 0.55, 0.9); if (u > 0.08 && u < 0.6) act = 'ask'; }
      else if (P === 'lectern') { toYaw(classYaw, 1); if (u < 0.45) act = 'read'; }
      else if (P === 'sip') { toYaw(classYaw + sweep, 0.8); if (u > 0.25 && u < 0.75) act = 'sip'; }
      else toYaw(classYaw + sweep, 0.6);                                                          // talking to the class, looking over it
      if ((act === 'sip') !== (this.act === 'sip')) this.cup(act === 'sip');
      this.act = act; this.pointing = false;
      yield;
    }
  }
  // what is said: the line the clock has reached, begun wherever she comes in on it (called while she can hear)
  lectureSpeak(now) {
    const L = this.lec, H = this.H, b = this.bubble;
    if (H.talk.robot === this || (b.talking(now) && b.style !== 'lecture')) { L.said = -1; return; }      // a word with her first; then on where the clock says
    if (!L.greeted) { L.greeted = true; this.nodAt = now; this.expr = 'happy'; this.exprUntil = now + 2.5; if (Math.random() < 0.6) { this.say(pick(L.aside), 'happy', 3.2); return; } }
    const { i, u } = this.lectureNow(); if (i === L.said) return;
    L.said = i; const l = L.lines[i]; this.say(l.text, 'neutral', Math.max(1.5, l.dur * (1 - u) - 0.15), 'lecture');
  }

  update(dt) {
    const H = this.H, W = this.W, now = W.now, v = W.visitor, b = this.body, sp = this.spec, m = this.m;
    if (!m.plan && !this.fixed) this.plan;                                    // awake: it has its plan of the floor before anything asks the way
    let inRoom = this.inRoom = v.present && ((sp.room ? !!H.room && H.room.name === sp.room.name && H.room.site === sp.room.site : false) || (!!sp.reach && !H.room && Math.abs(v.y - this.y) < 7 && Math.hypot(v.x - this.x, v.z - this.z) < sp.reach));
    // (a banked room: its back rows may stand above the box the building gave the room. Anyone over its floor and not a storey up is in a lecturer's room)
    if (!inRoom && this.lec && v.present && sp.room && v.y > this.y - 1 && v.y < this.y + 9.5 && this.plan.inBoxes(v.x, v.z)) this.inRoom = true;
    const dv = this.dv = Math.hypot(v.x - this.x, v.z - this.z), talking = H.talk.robot === this;
    inRoom = this.inRoom;
    // coming and going
    if (inRoom && !this.wasIn) this.cameIn = now;
    if (this.lec) { if (inRoom) this.lectureSpeak(now); else if (this.wasIn && this.bubble.style === 'lecture') this.bubble.quiet(); }
    else {
      if (inRoom && !this.wasIn && now - this.greeted > 45) { this.greeted = now; setTimeout(() => this.line('greet'), 600); }
      if (!inRoom && this.wasIn && now - this.greeted > 12 && Math.random() < 0.6) this.line('bye');
      if (inRoom && now > this.nextIdle && !talking && !this.bubble.talking(now)) { this.line('idle'); this.nextIdle = now + 28 + Math.random() * 40; }
    }
    this.wasIn = inRoom;
    // what it is doing. Spoken to, it holds still and turns to her (and still will not be stood on); a drink asked for comes before anything else.
    // Sat down, it keeps its seat (she cannot walk into it, and it is in nobody's way there): no stepping aside, no gliding off.
    const seated = this.sitting;
    // Engaged with her (robokit/attend.js engageVisitor): while she talks to it and it answers, and when she comes up to
    // it, it stops where it is, turns to her and waits, its day held where it was, until the conversation is over and
    // she has stepped away. A lecturer at the front of a class only glances at her coming in; spoken to, it is the same
    // as anyone. An order she has given is the one thing it goes off for, once the card is closed.
    const level0 = v.present && Math.abs(v.y - this.y) < 3 && (inRoom || dv < 7);
    const eng = this.eng = engageVisitor(this.eng ?? {}, this, v, dt, { talking: talking || now < (this.replyUntil ?? 0), level: level0, near: this.lec || this.fixed ? 0 : 6 });
    const hold = this.engaged = !this.fixed && eng.on && (talking || (!eng.give && !(this.making || this.queue.length)));      // (at a stride straight at it, she is passing: it gives way)
    if (!this.fixed) {
      if (now >= this.nextManners && !seated) { this.nextManners = now + 0.2; this.manners({ still: hold || this.state === 'chat', back: this.state === 'home' || this.state === 'lecture' || this.state === 'make' || this.state === 'chat' }); }
      if (this.aside.phase) { if (this.act === 'sip') this.cup(false); this.act = null; this.stepAside(dt); }
      else if (hold) { m.v = 0; if (!seated) m.faceTo(v.x, v.z, dt * 1.6); }
      else {
        if (this.queue.length && this.taskName !== 'make') this.run('make', this.serve(this.queue.shift()), false);
        if (!this.task && now > (this.faultAt ?? -9) + 2) this.think();      // (after a fault, a breath before trying again)
        this.stepTask();
      }
      if (!seated) this.glide(dt);
    }
    // turning to her as she comes up (manners.js attendVisitor): the eyes at once, then the head, then (unless it is
    // teaching, or sat at its work, or busy with something else) the body. A lecturer glances, and teaches on.
    const level = level0;
    const at = attendVisitor(this.attn, { x: m.x, z: m.z, yaw: m.yaw }, v, dt, { reach: this.fixed ? 40 : 10, talking, hold, level, keepWorking: (!!this.lec && !hold) || seated || this.state === 'chat' || this.state === 'make', busy: !!this.act || this.busy });
    if (this.fixed) { if (at.yaw !== null) m.face(at.yaw, dt * 2); else m.face(this.homeYaw, dt); }
    else if (at.yaw !== null && !talking && !this.aside.phase && m.v < 0.3 && !seated) m.face(at.yaw, dt * at.rate);
    // sitting: the body drawn onto the seat from where the robot stands beside it, and down onto it
    this.sitK += (this.sitTo - this.sitK) * Math.min(1, dt * 2.6); if (this.sitK < 0.002) this.sitK = 0;
    const q = this.seat ?? this.lastSeat; if (this.seat) this.lastSeat = this.seat;
    const k = q ? this.sitK : 0, sm = k * k * (3 - 2 * k);
    // the body
    const t = now + this.phase, moving = m.v > 0.25, speak = this.bubble.talking(now), busy = this.busy && !this.aside.phase && !talking, act = talking || this.aside.phase ? null : this.act;
    b.root.position.set(m.x + (q ? (q.x - m.x) * sm : 0), m.y, m.z + (q ? (q.z - m.z) * sm : 0)); b.root.rotation.y = m.yaw;
    const head = hold && seated ? Math.max(-0.6, Math.min(0.6, at.rel)) : hold ? 0 : at.head;
    b.animate({ t, dt, moving, speed: m.v, busy, speak, point: this.pointing && !this.aside.phase && !talking, nod: Math.max(0, 1 - Math.abs(now - this.nodAt - 0.5) / 0.5), act, head, sit: k, drop: this.drop, yaw: m.yaw });
    const expr = now < this.exprUntil ? this.expr : busy || act === 'write' || act === 'type' ? 'focus' : at.looking && this.rest === 'neutral' ? 'happy' : this.rest;
    // the eyes: on her when it is attending to her; else on its work (down to what is in its hands, up to the board or the shelf) or wandering a little
    const look = at.looking || talking ? (talking ? Math.max(-1, Math.min(1, (at.rel - head) * 1.2)) : at.eye) : (act === 'write' || act === 'point' || act === 'type' || act === 'read' ? 0 : Math.sin(t * 0.37) * 0.35 + Math.sin(t * 1.13) * 0.15);
    const lookY = at.looking || talking ? 0 : act === 'read' || act === 'type' ? -1 : act === 'write' || act === 'point' || act === 'reach' ? 0.6 : act === 'ask' ? 0.3 : busy ? -0.5 : 0;
    b.faceTick({ t, dt, expr, look, lookY, speak });
    // sat down, it is where its body is drawn: spoken to there, and not a body in the way beside the chair (the chair keeps her off it)
    this.ghost = seated; this.item.x = b.root.position.x; this.item.z = b.root.position.z; this.item.y = m.y + b.eye - (q ? this.drop * b.root.scale.y * sm : 0);
    H.tmp.set(b.root.position.x, m.y + b.top + 0.35 - (q ? this.drop * b.root.scale.y * sm : 0), b.root.position.z); H.bubbles.place(this.bubble, H.tmp, now, b.root.visible);
  }
  sleep() { this.H.tmp.set(this.x, this.y, this.z); this.H.bubbles.place(this.bubble, this.H.tmp, this.W.now, false); this.wasIn = false; this.inRoom = false; }

  // Drinks: off to the machine, a hiss and a wait, back to its place, and the cup is on the counter for you. It
  // is made wherever the order was given from, and whatever is in the way: a leg that cannot be walked in half a
  // minute is given up and the next thing done from where it stands.
  *serve(name) {
    const H = this.H, s = this.spots;
    this.making = name; if (H.debug) console.log('DRINK start', name);
    this.state = 'go'; yield* this.travel(s.machine.x, s.machine.z, { must: true, patience: 25 });
    H.ctx.sound?.chirp?.([55, 55, 58], 0.03);
    yield* this.stay(4.2, 'make');
    this.state = 'go'; yield* this.travel(s.home.x, s.home.z, { must: true, patience: 25 });
    this.finishDrink(); this.state = 'home';
  }
  finishDrink() {
    const H = this.H, sv = this.spec.serve, name = this.making; if (H.debug) console.log('DRINK finish', name); if (!name) return; this.making = null; H.W.events.served = (H.W.events.served ?? 0) + 1;
    if (this.drink) { H.group.remove(this.drink.g); const i = H.ctx.interact.indexOf(this.drink.item); if (i >= 0) H.ctx.interact.splice(i, 1); this.drink = null; }
    // a dish (serve.food[name] = { build: THREE => Object3D, bites, note }) or a drink in one of drinks.js's vessels
    const dish = sv.food?.[name], spec = sv.drinks?.[name];
    const iced = /đá|cold|iced|spritz|tonic/.test(name), choc = /chocolate|cocoa/.test(name), tea = /tea/.test(name), short = /espresso|cortado/.test(name);
    const g = dish ? dish.build(THREE) : buildDrink({ id: name, vessel: spec?.vessel ?? (iced ? 'highball' : short ? 'demitasse' : tea ? 'teacup' : choc ? 'mug' : 'latte'), liquid: spec?.liquid ?? (iced ? 0x6a4226 : tea ? 0xb8a04a : choc ? 0x5a3020 : short ? 0x3b2416 : 0xc9a27a) });
    if (!dish) { g.scale.setScalar(1.25); setFill(g, 1, 0); }
    g.position.set(sv.pickup.xz[0], sv.pickup.y, sv.pickup.xz[1]); H.group.add(g);
    const d = { name, food: !!dish, bites: dish?.bites ?? 3, note: dish?.note ?? spec?.note, last: spec?.last };
    const item = { x: g.position.x, y: g.position.y + 0.2, z: g.position.z, reach: 7, size: 0.9, label: () => `take your ${name}`, act: () => {
      const i = H.ctx.interact.indexOf(item); if (i >= 0) H.ctx.interact.splice(i, 1); this.drink = null;
      if (H.ctx.hold) H.ctx.hold(d, g, { from: g.position.clone() }); else H.group.remove(g);
      setTimeout(() => this.say(pick(this.spec.lines?.served ?? ['Take your time with it.', 'Bring the empty back whenever you like.']), 'wink'), 5000);
    } };
    H.ctx.interact.push(item); this.drink = { g, item, name };
    this.say(pick(this.spec.lines?.ready?.map(l => l.replace('%s', name)) ?? [`One ${name}. It is on the counter.`, `Your ${name}, on the counter. Mind, it is hot.`, `${name[0].toUpperCase() + name.slice(1)}, ready. Take your time with it.`]), 'happy', 6);
  }
}

// specs: what the furnish files placed (furnish.js turns their plan coordinates into the world's)
export function hireFaculty(ctx, specs = [], researchers = []) {
  ({ THREE } = ctx); useThreeBody(THREE); useThreeDrinks(THREE);
  const group = new THREE.Group(); group.name = 'faculty'; ctx.scene.add(group);
  const Q = new URLSearchParams(location.search), house = ctx.house;
  // what the shared parts are told about this place: its obstacles, doors, openings, floors and land (faculty/manners.js)
  const W = makeWorld({ colliders: ctx.colliders, doors: house.doors, portals: house.portals, surfaces: house.surfaces, ground: (x, z) => ctx.walker?.ground?.(x, z) ?? 0 });
  const H = { debug: Q.has('keys'), ctx, W, group, room: null, tmp: new THREE.Vector3(), toast: t => (window.houseUI ? window.houseUI.toast(t) : null),
    get now() { return W.now; }, get dt() { return W.dt; }, get visitor() { return W.visitor; }, get events() { return W.events; } };
  W.events.choices = 0;
  H.bubbles = makeBubbles(THREE, ctx.camera); H.talk = makeTalk(H, false);
  // Seats: who is on one. A faculty member claims the seat it sits on (claimSeat); a researcher sat at one is found by
  // where it is. Taken, a seat stops offering "sit" to the visitor (its prompt's reach is set to nothing, and given
  // back when the seat is free), and nobody else sits on it, her included.
  const claims = new Map(), offers = new Map();
  let offersN = -1, sitters = new Map(), sittersAt = -9;
  const cellKey = (x, z) => `${Math.floor(x / 2)},${Math.floor(z / 2)}`;
  const sitterNear = (st, r = 0.95) => { const k0 = Math.floor(st.x / 2), k1 = Math.floor(st.z / 2); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const o of sitters.get(`${k0 + a},${k1 + b}`) ?? []) if (Math.hypot(o.x - st.x, o.z - st.z) < r && Math.abs(o.y - (st.y - 2.45)) < 2.6) return o; return null; };
  H.claimSeat = (st, who) => { if (who) claims.set(st, who); else claims.delete(st); };
  H.seatTaken = (st, me) => { const c = claims.get(st); if (c && c !== me) return true; const ws = ctx.walker?.seated; if (ws === st || (ws && Math.hypot(ws.x - st.x, ws.z - st.z) < 1)) return true; return !!sitterNear(st); };
  function seatOffers(t) {
    if (t - sittersAt < 0.5) return; sittersAt = t;
    if (ctx.interact.length !== offersN) { offersN = ctx.interact.length; offers.clear(); for (const it of ctx.interact) if (it.seat) offers.set(it.seat, it); }
    sitters = new Map(); const put = (x, y, z) => { const k = cellKey(x, z); if (!sitters.has(k)) sitters.set(k, []); sitters.get(k).push({ x, y, z }); };
    for (const r of crowd.all ?? []) if (r.seated && Number.isFinite(r.x)) put(r.x, r.fy ?? r.y ?? 0, r.z);
    const v = W.visitor; if (!v.present) return;
    for (const [st, it] of offers) {
      if (Math.abs(st.x - v.x) > 14 || Math.abs(st.z - v.z) > 14) continue;      // (only those she could be offered)
      const taken = claims.has(st) || !!sitterNear(st);
      if (taken && it.reach > 0) { it.reach0 = it.reach; it.reach = 0; } else if (!taken && it.reach === 0 && it.reach0) it.reach = it.reach0;
    }
  }
  // ?lineup stands the whole roster in a row at the Landing, facing you as you arrive, for looking at them side by side
  let all = specs.map(sp => { const who = byId(sp.id); if (!who) console.warn('faculty: nobody on the roster is called', sp.id); return who ? { ...who, ...sp, name: who.name, look: who.look, field: sp.field || who.field } : null; }).filter(Boolean);
  if (Q.has('lineup')) {
    const s = house.spawn, fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw), gap = Number(Q.get('lineup')) || 2.6;      // the way the visitor faces on arriving
    const cast = Q.has('seeds') ? Array.from({ length: 16 }, (_, i) => ({ id: 'seed' + (i + (Number(Q.get('seeds')) || 1)), name: 'No. ' + (i + (Number(Q.get('seeds')) || 1)), look: lookFromSeed(i + (Number(Q.get('seeds')) || 1)) })) : ROSTER;
    // (in an arc about where you stand, each fifteen feet off and turned to you: turn round to see them all)
    all = cast.map((who, i) => { const a = ((cast.length - 1) / 2 - i) * gap / 15, x = s.x + (fx * Math.cos(a) + fz * Math.sin(a)) * 15, z = s.z + (fz * Math.cos(a) - fx * Math.sin(a)) * 15; return { ...who, home: [x, z], y: ctx.walker?.ground?.(x, z) ?? s.y, faces: [s.x, s.z], roam: false, fixed: true, posts: [], lines: { greet: [`${who.name}.`] }, reach: 60 }; });
  }
  // the ordinary researchers, who sit and stand about the place (faculty/researchers.js). ?crowd stands one of each pose at the Landing.
  if (Q.has('crowd')) {
    // every make standing and seated, with a named robot, a chair, a 3 ft bench, a 4 ft standing desk and a 7 ft case for scale (plain stand-ins)
    const s = house.spawn, fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw), P = (fwd, lat) => [s.x + fx * fwd + fz * lat, s.z + fz * fwd - fx * lat], gy = (x, z) => ctx.walker?.ground?.(x, z) ?? s.y;
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3c, roughness: 0.8 }), prop = (fwd, lat, w, h, d, y0 = 0) => { const [x, z] = P(fwd, lat), m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, gy(x, z) + y0 + h / 2, z); m.rotation.y = s.yaw; group.add(m); };
    const chair = (fwd, lat) => { prop(fwd, lat, 1.4, 0.12, 1.4, 1.43); prop(fwd + 0.66, lat, 1.4, 1.7, 0.1, 1.55); for (const a of [-0.6, 0.6]) for (const c of [-0.6, 0.6]) prop(fwd + a, lat + c, 0.1, 1.43, 0.1); };
    const makes = ['round', 'tall', 'box', 'wide', 'neck', 'drum'], seed0 = Number(Q.get('crowd')) || 3, groups = ['matter', 'systems', 'machine', 'neural', 'morpho', 'collective'];
    researchers = [];
    makes.forEach((make, i) => { const lat = (i - 2.5) * 2.7; let [x, z] = P(13, lat); researchers.push({ x, z, y: gy(x, z), face: [s.x, s.z], pose: 'stand', make, seed: seed0 + i * 5, group: groups[i] });
      [x, z] = P(7.5, lat); chair(7.5, lat); researchers.push({ x, z, y: gy(x, z) + 1.55, face: [s.x, s.z], pose: ['sit', 'read', 'type', 'write', 'listen', 'sit'][i], make, seed: seed0 + i * 5 + 2, group: groups[i] }); });
    prop(6.3, 0, 16.4, 0.12, 1.5, 2.38); chair(13, -9.6);
    [['drum', 3, 3.6, 3, 1.6, 12.5], ['tall', 4, 2.6, 4, 1.4, 17.5], ['round', 5.2, 3, 7, 1.0, 22.5], ['wide', 3, 3.6, 3, 1.6, 27.5]].forEach(([make, top, w, h, d, lat], i) => { const [x, z] = P(13, lat), [tx, tz] = P(13, lat + 3); prop(13, lat + 1.25 + d / 2, d, h, w); researchers.push({ x, z, y: gy(x, z), face: [tx, tz], pose: 'stand', make, top, role: i % 2 ? undefined : 'tech', seed: seed0 + 40 + i * 7, group: 'matter' }); });
    const [mx, mz] = P(13, 9.8), who = byId(Q.get('with') ?? 'tobias'); all = [{ ...who, home: [mx, mz], y: gy(mx, mz), faces: [s.x, s.z], roam: false, fixed: true, posts: [], lines: {}, reach: 60 }];
  }
  const seen = new Set();
  const faculty = all.filter(sp => (seen.has(sp.id) ? (console.warn('faculty:', sp.id, 'is placed twice; the second is left out'), false) : seen.add(sp.id))).map(spec => new Teacher(H, spec));
  ctx.faculty = Object.fromEntries(faculty.map(c => [c.spec.id, c]));
  const crowd = hireResearchers(H, Q.has('lineup') ? [] : researchers);
  // The visitor cannot walk into a robot: her walker's own collisions, and then theirs. If a wall and a robot
  // between them leave her nowhere, she stays where she last stood.
  let hooked = false; const last = { x: 0, z: 0, ok: false };
  const hook = () => {
    const w = ctx.walker; if (!w || hooked) return; hooked = true;
    const base = w.collide.bind(w);
    w.collide = p => {
      if (W.solid(p)) { base(p); if (W.solid(p) && last.ok && Math.hypot(last.x - p.x, last.z - p.z) < 3) { p.x = last.x; p.z = last.z; } } else base(p);
      last.x = p.x; last.z = p.z; last.ok = true;
    };
  };
  // Who is awake (a visitor up to 9.5 ft above counts: the back rows of a banked room look down on the lecturer): only those she is anywhere near (looked at a few times a second), or who owe her a drink
  let awake = [], awakeAt = -1;
  const near = c => { const v = W.visitor; return v.present && v.y - c.y < 9.5 && c.y - v.y < 6 && Math.hypot(v.x - c.x, v.z - c.z) < (c.fixed ? 90 : 70); };
  ctx.animated.push((t, dt) => {
    W.now = t; W.dt = dt; hook();
    W.watch(ctx.walker, ctx.mode === 'walk', dt); H.room = W.visitor.present ? ctx.room ?? null : null;
    if (t - awakeAt > 0.35) { awakeAt = t; const was = awake; awake = faculty.filter(c => !c.broken && (near(c) || c.queue.length || c.making || H.talk.robot === c)); for (const c of was) if (!awake.includes(c)) c.sleep(); if (awake.length) W.stale(); H.awake = awake; }
    for (const c of awake) { try { c.update(dt); } catch (e) { c.broken = true; console.error('faculty', c.name, e.stack ?? e); } }
    crowd.tick(t, dt); seatOffers(t);
    H.talk.update(); H.bubbles.update(t);
  });
  // for tests: who is where, doing what; is anybody inside anything; what they cost
  window.__faculty = { H, W, faculty, VR, researchers: crowd, get awake() { return awake.map(c => c.spec.id); },
    status: () => faculty.map(c => ({ id: c.spec.id, x: +c.x.toFixed(2), z: +c.z.toFixed(2), state: c.state, task: c.taskName, act: c.act, sitting: c.sitting, aside: c.aside.phase, lane: c.m.plan ? c.m.plan.laneAt(c.x, c.z) : null })),
    // the nearest thing in the way of a body at (x, z) on c's floor: feet from the edge of its body (negative: inside)
    gap(c) { let best = 1e9; const y = c.y; for (const b of ctx.colliders) { if (b.off || b.staff || b.y0 >= y + c.top || b.y1 <= y + 0.2) continue; const dx = Math.max(b.x0 - c.x, 0, c.x - b.x1), dz = Math.max(b.z0 - c.z, 0, c.z - b.z1), d = Math.hypot(dx, dz) - c.r; if (d < best) best = d; } return best; },
    cost() { const out = {}; for (const c of faculty) { let calls = 0, tris = 0; c.body.root.traverse(o => { if (o.isMesh) { calls++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); out[c.spec.id] = [calls, Math.round(tris)]; } return out; } };
  return H;
}
