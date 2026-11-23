// The staff of Anna's Basement: the robots who run it (staff/cast.js says who; staff/lines.js what they say;
// staff/bodies.js what they look like; staff/acts.js what their hands do).
//
// The bathhouse hires the full cast by default. Preview options:
//   ?staff=0         visit the furnished house with staff disabled
//   ?staff=lineup    everyone in an arc round where you stand, going through their gestures (use with ?at=court)
//   ?staff=ding,saz  only those (placed); ?staff=lineup:ding,saz only those (in a row)
//
// What they do, each in its own rooms:
//   - keep house: a round of small jobs at home and at their posts (folding, skimming the pool, plumping, dusting,
//     turning the bed down, tending the fire, tasting, polishing), a word with a colleague they meet;
//   - turn to you as you come up, greet you when you come in, mutter at their work (robokit/attend.js, face.js);
//   - E opens a card of things to say (faculty/talk.js). A thing asked for is either made and set on the counter
//     (`serve`) or made and CARRIED TO YOU on a tray, wherever you have got to in that robot's rooms (`bring`), and
//     held out until you take it; a towel or a robe comes the same way;
//   - the concierge arranges things (`book`): whoever it is with is ready for you when you get there;
//   - bells: ctx.staff.ring({ order, x, z }) sends the runner (Ding). With an order it goes to the bar, waits for
//     it, and brings it; with none it comes and asks. The nail corner's bell-push is wired to this (NAILS.onBell).
//     Any later bell (the desk, a bedside, the poolside) needs only: act: () => ctx.staff?.ring({ order: '...' }).
//   - manners, all from faculty/manners.js (Polite): never through you, aside when you come, out of doorways,
//     never shutting you in, round their colleagues. Nothing runs for a robot you are nowhere near.

import { makeBubbles } from './faculty/bubbles.js';
import { makeTalk } from './faculty/talk.js';
import { useThreeDrinks, buildDrink, setFill } from './faculty/drinks.js';
import { makeWorld, Polite, VR, attendVisitor, engageVisitor } from './faculty/manners.js';
import { makeFaceLife } from './robokit/face.js';
import { turnTime } from './robokit/speech.js';
import { useThree, buildStaff, buildCarried } from './staff/bodies.js';
import { pose, HOLDS, SECS } from './staff/acts.js';
import { COURT } from './campus.js';
import { CAST, byId } from './staff/cast.js';
import { LINES, RANG, BOOKINGS, CHAT } from './staff/lines.js';

let THREE;
const pick = a => a[Math.floor(Math.random() * a.length)];
const one = a => (Array.isArray(a) ? pick(a) : a);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fill = (s, name) => { const t = s.replace('%s', name); return /^[a-z]/.test(t) ? cap(t) : t.replace(/^(\*[^*]*\* )?([a-z])/, (_, a, b) => (a ?? '') + (a ? b : b.toUpperCase())); };

class Staffer extends Polite {
  constructor(H, spec) {
    const b = buildStaff(spec.look);
    super(H.W, { radius: b.radius, top: b.top, speed: spec.speed ?? 2.4, plan: () => this.survey() });
    this.H = H; this.spec = spec; this.id = spec.id; this.name = spec.name; this.rest = spec.rest ?? 'neutral'; this.body = b; this.L = LINES[spec.id] ?? {};
    this.fixed = !!spec.fixed; this.quiet = !!spec.quiet;
    const m = this.m; [m.x, m.z] = spec.home; m.y = spec.y ?? 0; this.phase = Math.random() * 10;
    this.homeYaw = spec.faces ? Math.atan2(spec.faces[0] - m.x, spec.faces[1] - m.z) : 0; m.yaw = this.homeYaw;
    this.spots = { home: { x: spec.home[0], z: spec.home[1] }, posts: (spec.posts ?? []).map(p => ({ ...p, x: p.at[0], z: p.at[1] })), machine: spec.serve?.machine ? { x: spec.serve.machine[0], z: spec.serve.machine[1] } : null };
    b.root.position.set(m.x, m.y, m.z); b.root.rotation.y = m.yaw; H.group.add(b.root);
    if (!this.fixed) {
      H.ctx.track?.(b.root, ['r:' + spec.room, ...(spec.roam ?? []).map(n => 'r:' + n), ...(spec.court ? ['o:court'] : [])]);
      // Keep the shared door-swing check in step with the circular walker avoidance.
      this.bounds = { staff: true };
      this.updateBounds();
      H.ctx.doorBodies.push(this.bounds);
      m.opener = true;
      const agentNear = m.hard;
      m.hard = (x, z) => agentNear(x, z) || H.W.doors.some(d => {
        if (!d.clearanceAt || d.y0 > m.y + this.top || d.y1 < m.y + 0.2 || Math.abs(d.cx - x) > 6 || Math.abs(d.cz - z) > 6) return false;
        const next = d.clearanceAt(x, z);
        return next < this.r + 0.02 && next < d.clearanceAt(m.x, m.z);
      });
      m.onDoor = leaf => { for (const mate of H.W.doors) if (!mate.fixed && mate.stop === leaf.stop) mate.isOpen = true; };
    }
    this.bubble = H.bubbles.make(spec.name); this.bubble.far = 26;
    this.state = 'home'; this.queue = []; this.expr = 'neutral'; this.exprUntil = 0; this.act = null; this.actT = 0; this.attn = {}; this.eng = {};
    this.greeted = -1e9; this.wasIn = false; this.nextIdle = H.now + 15 + Math.random() * 25; this.nextDoing = 0; this.trips = 0; this.sitTo = 0; this.sitK = 0;
    this.carrying = null; this.cargo = null; this.offered = false; this.making = null; this.drink = null; this.chatting = null; this.offeredAt = -1e9; this.inSince = 0;
    this.life = makeFaceLife(spec.id, H.now);
    this.talkReach = 12; this.asideStarts = []; this.calmUntil = 0;
    if (spec.seat && !spec.seat.when && !this.fixed) { this.sitTo = 1; this.sitK = 1; }      // (found in its chair)
    this.item = { x: m.x, y: m.y + b.hover, z: m.z, reach: 10, size: 1.7, label: () => this.label(), act: () => this.press() };
    H.ctx.interact.push(this.item);
  }
  updateBounds() {
    const q = this.bounds;
    if (!q) return;
    const centre = this.body.root.position, r = this.r;
    q.x0 = centre.x - r; q.x1 = centre.x + r;
    q.z0 = centre.z - r; q.z1 = centre.z + r;
    q.y0 = this.y; q.y1 = this.y + this.top;
  }
  label() { return this.carrying && this.offered ? `take the ${this.carrying.name} from ${this.name}` : this.H.talk.robot === this ? 'say the next thing' : `talk to ${this.name}`; }
  press() { if (this.carrying && this.offered) return this.give(); this.H.talk.press(this); }

  // ---- the plan of the floor it gets about on: its own room and the rooms it may go into, with the doorways between ----
  survey() {
    const H = this.H, sp = this.spec, r = sp.roomBox, [hx, hz] = sp.home, rooms = H.ctx.house.rooms;
    const level = q => q.site === r.site && Math.abs((q.floor ?? q.y0) - (r.floor ?? r.y0)) < 1.5;
    const mine = r ? rooms.filter(q => q.name === r.name && level(q)) : [{ x0: hx - 10, x1: hx + 10, z0: hz - 10, z1: hz + 10 }];
    const names = sp.roam ?? [], others = r ? rooms.filter(q => names.includes(q.name) && q.name !== r.name && level(q)) : [], links = [];
    if (sp.court) others.push(...sp.court);
    if (others.length) for (const p of H.ctx.house.portals ?? []) {
      if (p.kind !== 'door' || p.y0 > (sp.y ?? 0) + 3 || p.y1 < (sp.y ?? 0) + 1) continue;
      const ax = p.x1 - p.x0 > p.z1 - p.z0, b = { x0: p.x0 - (ax ? 0 : 1.6), x1: p.x1 + (ax ? 0 : 1.6), z0: p.z0 - (ax ? 1.6 : 0), z1: p.z1 + (ax ? 1.6 : 0) }, hit = q => q.x1 > b.x0 && q.x0 < b.x1 && q.z1 > b.z0 && q.z0 < b.z1;
      if (new Set([...mine, ...others].filter(hit).map(q => q.name)).size >= 2) links.push(b);
    }
    this.homeBoxes = r ? mine : null;
    const plan = H.W.plan({ radius: this.r, boxes: [...mine, ...others, ...links], links, y: sp.y ?? 0, top: Math.max(3.2, this.body.top), open: !r });
    // a post inside something, in a doorway, at a stair or cut off from home is moved to the nearest fair floor, and said so
    const need = this.m.need, fair = c => plan.lane[c] !== 3 && !plan.inDoorway(plan.cx(c), plan.cz(c));
    // (and one it cannot walk to from home: behind a table, in a gap narrower than itself, beyond a shut door)
    const hc = plan.nearest(hx, hz, need, 8, false, fair); if (hc >= 0) { this.spots.home.x = plan.cx(hc); this.spots.home.z = plan.cz(hc); plan.flood(plan.cx(hc), plan.cz(hc), need, 900, 0, 0, 0, this.m.opener); }
    const ok = c => c >= 0 && plan.free(c, need, false) && fair(c) && plan.reachD(c) < Infinity;
    const fix = (p, what) => {
      if (!p) return; const c0 = plan.cellOf(p.x, p.z);
      if (ok(c0)) return;
      const c = plan.nearest(p.x, p.z, need, 9, false, ok);
      if (c >= 0) { const d = Math.hypot(plan.cx(c) - p.x, plan.cz(c) - p.z); if (d > 0.6) console.info(`staff: ${sp.id}'s ${what} was not a place it can get to; moved ${d.toFixed(1)} ft`); p.x = plan.cx(c); p.z = plan.cz(c); }
      else { console.warn(`staff: ${sp.id}'s ${what} has no floor near it that it can reach; left out`); p.dead = true; }
    };
    if (hc < 0) console.warn(`staff: ${sp.id}'s home has no floor near it`);
    this.spots.posts.forEach((p, i) => fix(p, 'post ' + (i + 1))); fix(this.spots.machine, 'machine');
    this.spots.posts = this.spots.posts.filter(p => !p.dead);
    if (hc >= 0) { this.m.x = this.spots.home.x; this.m.z = this.spots.home.z; }
    return plan;
  }
  // (counted: four steps aside in nine seconds is a room with nowhere to step to, and it stops trying for a while)
  startAside(...a) { const now = this.W.now, q = this.asideStarts; q.push(now); if (q.length > 4) q.shift(); if (q.length === 4 && now - q[0] < 9) { this.calmUntil = now + 25; q.length = 0; return false; } return super.startAside(...a); }
  mayStandHere() { const s = this.spots, near = p => p && Math.hypot(p.x - this.x, p.z - this.z) < 1.3; return near(s.home) || near(s.machine) || s.posts.some(near) || near(this.counter); }

  // ---- speech -------------------------------------------------------------------------------------------------
  say(text, expr = 'happy', secs) {
    if (!text) return; this.bubble.say(text, secs, this.H.now);
    if (expr === 'neutral' || expr === 'happy') { const q = /\?\s*(\*[^*]*\*)?$/.test(text); if (q && !this.quiet) expr = 'surprised'; }
    this.expr = expr; this.exprUntil = this.H.now + 3.5;
    if (!this.quiet || !/^\*/.test(text)) this.H.ctx.sound?.chirp?.(this.spec.chirp ?? [70, 74], this.quiet ? 0.02 : 0.045);
  }
  line(kind, name) { const l = this.L[kind]; if (l?.length) this.say(name ? fill(pick(l), name) : pick(l), kind === 'idle' || kind === 'walkedOff' ? this.rest : kind === 'waiting' ? 'sass' : 'happy'); }
  topics(list) {
    return list.slice(0, 4).map(t => ({ text: t.q, act: () => {
      this.say(one(t.a), t.expr ?? (t.serve || t.bring ? 'wink' : 'happy'), 6); this.replyUntil = this.H.now + 6;
      if (t.serve) this.queue.push({ kind: 'bring', name: t.serve });      // (everything asked for is brought to her on the tray, as in the house: set down on a counter, it was missed)
      if (t.bring) this.queue.push({ kind: 'bring', name: t.bring });
      if (t.book) this.H.book(t.book);
      if (t.call) this.H.ring({ by: t.call, quiet: true });
      t.then?.(this.H.ctx, this);
      this.asked = (this.asked ?? 0) + 1;
      return t.next ? this.topics(t.next) : null;
    } }));
  }
  // What she can say from the couch: three from the list, turning over, and always the choice of saying nothing
  couchCard() {
    const all = this.L.couch ?? [], S = this.session ?? {}, n = all.length, k = (S.said ?? 0) % Math.max(1, n), three = n <= 3 ? all : [0, 1, 2].map(i => all[(k + i) % n]);
    const quiet = { q: '*say nothing for a while*', a: this.L.couchSilence ?? ['Mm.'], expr: 'neutral', then: (ctx, me) => { if (me.session) { me.session.quietUntil = me.H.now + 50; me.session.next = me.H.now + 26; } } };
    const wrap = t => ({ ...t, then: (ctx, me) => { if (me.session) { me.session.said = (me.session.said ?? 0) + 3; me.session.next = me.H.now + 30; } t.then?.(ctx, me); }, next: t.next?.map(x => ({ ...x })) });
    return this.topics([...three.map(wrap), quiet]);
  }
  dialogue() {
    const all = this.L.topics ?? [], n = all.length, k = (this.asked ?? 0) % Math.max(1, n);
    const list = n <= 4 ? all : [...all.slice(0, 2), ...[0, 1].map(i => all[2 + ((k + i) % (n - 2))])];
    this.expr = 'happy'; this.exprUntil = this.H.now + 2;
    return this.topics(list);
  }

  // ---- the hands: a job done where it stands, for a while -----------------------------------------------------
  setAct(a) {
    if (a === this.act) return; this.act = a; this.actT = 0;
    const [l, r] = (a && HOLDS[a]) || [null, null], b = this.body;
    if (!b.hold(0, l ?? 'glove')) b.hold(0, 'glove'); if (!b.hold(1, r ?? 'glove')) b.hold(1, 'glove');
  }
  *doing(act, secs, state = 'fuss') {
    const W = this.W, end = W.now + (secs ?? (SECS[act] ?? 8) * (0.8 + Math.random() * 0.4)), yaw0 = this.m.yaw; this.state = state;
    try {
      this.setAct(act);
      if (this.inRoom && this.near && W.now > this.nextDoing && this.L.doing?.[act] && Math.random() < 0.6 && !this.bubble.talking(W.now) && this.H.talk.robot !== this) { this.say(pick(this.L.doing[act]), 'neutral'); this.nextDoing = W.now + 30 + Math.random() * 30; this.nextIdle = Math.max(this.nextIdle, W.now + 16); }
      while (W.now < end) { this.m.v = Math.max(0, this.m.v - W.dt * 4); if (!this.attn.looking) this.m.face(yaw0, W.dt); yield; }
    } finally { this.setAct(null); }
  }
  *stay(secs, state = 'home') { const W = this.W, end = W.now + secs; this.state = state; while (W.now < end) { this.m.v = Math.max(0, this.m.v - W.dt * 4); if (this.atHome() && !this.attn.looking && !this.sitting) this.m.face(this.homeYaw, W.dt); yield; } }
  *turn(yaw, secs = 1.1) { const W = this.W, t0 = W.now; while (W.now - t0 < secs) { this.m.face(yaw, W.dt * 1.4); yield; } }
  atHome() { return Math.hypot(this.spots.home.x - this.x, this.spots.home.z - this.z) < 1; }
  get sitting() { return this.sitK > 0.02 || this.sitTo > 0; }
  inRoomOf(q) { const n = q.room ?? this.spec.room, r = this.H.room; return !!r && r.name === n; }

  // ---- the day ----------------------------------------------------------------------------------------------
  *day() {
    const sp = this.spec, s = this.spots;
    for (let first = !!sp.seat; ; first = false) {
      const posts = first ? [] : s.posts.filter(p => !(p.when === 'empty' && this.inRoomOf(p)) && Math.hypot(p.x - this.x, p.z - this.z) > 2 && !this.nearGuest(p, 4.5));
      const partner = first ? null : this.colleague();
      const what = first ? 'home' : pickW([['home', 3], ['post', posts.length ? 3.2 : 0], ['chat', partner ? 1.3 : 0]]);
      if (what === 'post') {
        const p = pickW(posts.map(q => [q, q.w ?? 1])); this.state = 'go'; this.trips++;
        if (yield* this.travel(p.x, p.z, { patience: p.room ? 40 : 14 })) {
          if (p.faces) yield* this.turn(Math.atan2(p.faces[0] - this.x, p.faces[1] - this.z));
          const n = 1 + (Math.random() < 0.5 ? 1 : 0), came = this.cameIn;
          for (let k = 0; k < n; k++) { yield* this.doing(pick(p.acts), p.secs); if (this.cameIn !== came && !this.inRoomOf(p)) break; if (Math.random() < 0.4) yield* this.stay(1.5 + Math.random() * 2, 'pause'); }
        } else yield* this.stay(2 + Math.random() * 2, 'pause');
      } else if (what === 'chat') { if (!(yield* this.chatWith(partner))) yield* this.stay(2, 'pause'); }
      // home, and its work there (sat down, if it has a chair of its own)
      if (!this.atHome()) { this.state = 'go'; if (!(yield* this.travel(s.home.x, s.home.z, { must: true, patience: 30 }))) { yield* this.stay(3, 'pause'); continue; } }
      yield* this.turn(this.homeYaw, 0.8);
      if (sp.seat && !sp.seat.when) this.sitTo = 1;
      try {
        const end = this.W.now + 14 + Math.random() * 22;
        while (this.W.now < end && !this.queue.length) { const a = pick(sp.homeActs ?? ['rest']); yield* this.doing(a, null, 'home'); if (Math.random() < 0.45) yield* this.stay(2 + Math.random() * 3, 'home'); }
      } finally { if (sp.seat && !sp.seat.when) { this.sitTo = 0; } }
      if (sp.seat && !sp.seat.when) { const t0 = this.W.now; while (this.W.now - t0 < 1.2 && this.sitK > 0.05) yield; }
    }
  }
  nearGuest(p, r) { const v = this.W.visitor; return this.about() && Math.hypot(p.x - v.x, p.z - v.z) < r; }
  // ?staff=lineup: where it stands, going through everything its hands can do
  *demo() {
    const sp = this.spec, acts = [...new Set([...(sp.homeActs ?? []), ...(sp.posts ?? []).flatMap(p => p.acts), 'bow'])].filter(a => a !== 'rest');
    for (let i = Math.floor(Math.random() * acts.length); ; i++) { yield* this.doing(acts[i % acts.length], 6.5, 'home'); yield* this.stay(1.2, 'home'); }
  }
  think() { this.run('day', this.fixed ? this.demo() : this.day()); }

  // ---- a word with a colleague it meets ----------------------------------------------------------------------
  colleague() {
    const H = this.H; if (this.fixed || H.now - (H.lastChat ?? -40) < 45) return null;
    const ok = o => o !== this && !o.fixed && !o.chatting && !o.sitting && !o.busyWithOrder() && o.taskName === 'day' && ['home', 'pause', 'fuss'].includes(o.state) && Math.abs(o.y - this.y) < 2 && Math.hypot(o.x - this.x, o.z - this.z) < 30 && this.plan.inBoxes(o.x, o.z) && H.talk.robot !== o && CHAT.some(c => (c[0] === this.id && c[1] === o.id));
    return H.awake?.find(ok) ?? null;
  }
  *chatWith(o) {
    const H = this.H, W = this.W; H.lastChat = H.now;
    const lines = pick(CHAT.filter(c => c[0] === this.id && c[1] === o.id))[2];
    const dx = this.x - o.x, dz = this.z - o.z, d = Math.hypot(dx, dz) || 1, gap = this.r + o.r + 1.4, p = this.plan;
    const c = p.nearest(o.x + dx / d * gap, o.z + dz / d * gap, this.m.need, 4, false, c => p.lane[c] !== 2 && p.lane[c] !== 3 && !p.inDoorway(p.cx(c), p.cz(c))); if (c < 0) return false;
    o.chatting = this; this.chatting = o; o.run('chat', o.listen(this, 24 + lines.reduce((t, l) => t + turnTime(l), 0)), true);
    try {
      this.state = 'go'; if (!(yield* this.travel(p.cx(c), p.cz(c), { patience: 14, until: () => o.chatting !== this }))) return false;
      if (o.chatting !== this || Math.hypot(o.x - this.x, o.z - this.z) > gap + 2.5) return false;
      for (let k = 0; k < lines.length; k++) {
        const who = k % 2 ? o : this;
        if (this.inEarshot() || o.inEarshot()) who.say(lines[k], k === lines.length - 1 ? 'happy' : who.rest === 'sleepy' ? 'neutral' : who.rest, turnTime(lines[k]) - 0.8);
        const t0 = W.now, turn = turnTime(lines[k]); while (W.now - t0 < turn) { /* (each line read through, and a breath before the reply: robokit/speech.js) */ this.m.faceTo(o.x, o.z, W.dt * 2); this.state = 'chat'; yield; }
        if (o.chatting !== this) break;
      }
      return true;
    } finally { if (o.chatting === this) o.chatting = null; this.chatting = null; }
  }
  *listen(o, secs) { const W = this.W, end = W.now + secs; this.state = 'chat'; try { while (W.now < end && this.chatting === o) { this.m.v = 0; if (Math.hypot(o.x - this.x, o.z - this.z) < 9) this.m.faceTo(o.x, o.z, W.dt * 1.5); yield; } } finally { if (this.chatting === o) this.chatting = null; } }
  inEarshot() { return this.visitorDist() < 17; }
  busyWithOrder() { return !!(this.queue.length || this.making || this.carrying); }

  // ---- orders ---------------------------------------------------------------------------------------------------
  // what a thing is: from its own menu, or its maker's
  menuItem(name) { const sv = this.spec.serve, mine = sv?.menu?.[name]; if (mine) return mine; const from = sv?.from && byId(sv.from); return from?.serve?.menu?.[name] ?? null; }
  build(name, it) {
    if (it?.carried) return buildCarried(it.carried);
    const iced = /cold|iced|shaken|water|kvass/.test(name), tea = /tea|chai|chamomile/.test(name), short = /espresso$|cortado/.test(name);
    const g = buildDrink({ id: it?.id ?? name, vessel: it?.vessel ?? (iced ? 'highball' : short ? 'demitasse' : tea ? 'teacup' : 'latte'), liquid: it?.liquid ?? 0xc9a27a });
    g.scale.setScalar(1.25); setFill(g, 1, 0); return g;
  }
  // made at its own machine and set down at its counter
  *serve(o) {
    const H = this.H, s = this.spots, it = this.menuItem(o.name);
    this.making = o.name; this.sitTo = 0;
    try {
      while (this.sitK > 0.05) yield;
      this.state = 'go'; if (!s.machine || s.machine.dead || !(yield* this.travel(s.machine.x, s.machine.z, { must: true, patience: 12 }))) return;
      if (this.spec.serve.faces) yield* this.turn(Math.atan2(this.spec.serve.faces[0] - this.x, this.spec.serve.faces[1] - this.z), 0.7);
      H.ctx.sound?.chirp?.([55, 55, 58], 0.03);
      yield* this.doing(it?.make ?? 'stir', 4.4, 'make');
      this.state = 'go'; yield* this.travel(s.home.x, s.home.z, { must: true, patience: 12 });
      yield* this.turn(this.homeYaw, 0.6);
      this.setDown(o.name, it);
    } finally { this.making = null; this.state = 'home'; }
  }
  setDown(name, it) {
    const H = this.H, sv = this.spec.serve; H.W.events.served = (H.W.events.served ?? 0) + 1;
    if (this.drink) { H.group.remove(this.drink.g); const i = H.ctx.interact.indexOf(this.drink.item); if (i >= 0) H.ctx.interact.splice(i, 1); this.drink = null; }
    const g = this.build(name, it); g.position.set(sv.pickup.xz[0], sv.pickup.y, sv.pickup.xz[1]); H.group.add(g);
    const item = { x: g.position.x, y: g.position.y + 0.2, z: g.position.z, reach: 7, size: 0.9, label: () => `take your ${name}`, act: () => {
      const i = H.ctx.interact.indexOf(item); if (i >= 0) H.ctx.interact.splice(i, 1); this.drink = null; this.take(name, it, g);
      setTimeout(() => this.line('served'), 5000);
    } };
    H.ctx.interact.push(item); this.drink = { g, item, name };
    this.line('ready', name);
  }
  // into her hand (a drink, a dish), or round her shoulders (a towel, a robe)
  take(name, it, g) {
    const H = this.H; H.W.events.taken = (H.W.events.taken ?? 0) + 1;
    if (it?.wear) { g.removeFromParent(); H.ctx.flash?.(it.wear); return; }
    const d = { name, food: !!it?.food, bites: it?.bites ?? 3, note: it?.note, last: it?.last };
    if (H.ctx.hold) { const from = new THREE.Vector3(); g.getWorldPosition(from); g.scale.setScalar(it?.carried ? 1 : 1.25); H.ctx.hold(d, g, { from }); } else g.removeFromParent();
  }
  // made (at its own machine, or collected from whoever makes it) and carried to her on the tray
  *bring(o) {
    const H = this.H, W = this.W, sv = this.spec.serve ?? {}, it = o.item ?? this.menuItem(o.name);
    this.making = o.name; this.sitTo = 0;
    try {
      while (H.talk.robot === this || W.now < (this.replyUntil ?? 0)) { this.m.v = 0; yield; }      // finish the sentence first
      while (this.sitK > 0.05) yield;
      if (!this.fixed) {
        const from = it?.from ?? (this.spec.serve?.menu?.[o.name] ? null : sv.from), maker = from ? H.staff[from] : null;
        if (maker && !maker.fixed && maker !== this && !maker.broken) {      // to the counter where it is made; the one who makes it is asked, and waited for
          // (it waits on the guests' side of the counter: the far side of where the thing is set down from the one who makes it)
          const pk = maker.spec.serve.pickup, p = this.plan, mh = maker.spots.home, ux = pk.xz[0] - mh.x, uz = pk.xz[1] - mh.z; p.flood(this.x, this.z, this.m.need, 900);
          const side = c => p.lane[c] !== 2 && p.lane[c] !== 3 && p.reachD(c) < Infinity && Math.hypot(p.cx(c) - mh.x, p.cz(c) - mh.z) > this.r + maker.r + 1.2;
          let c = p.nearest(pk.xz[0], pk.xz[1], this.m.need, 7, false, c => side(c) && (p.cx(c) - pk.xz[0]) * ux + (p.cz(c) - pk.xz[1]) * uz > 0.3); if (c < 0) c = p.nearest(pk.xz[0], pk.xz[1], this.m.need, 9, false, side);
          if (c < 0) return;
          const order = { kind: 'make', name: o.name, item: it, ready: false };
          this.counter = c >= 0 ? { x: p.cx(c), z: p.cz(c) } : null;
          this.state = 'go'; if (!(yield* this.travel(this.counter.x, this.counter.z, { must: true, patience: 40, speed: this.spec.runner ? 1.4 : 1 }))) return;
          maker.queue.push(order);
          const t0 = W.now; while (!order.ready && !order.done && W.now - t0 < 45) { this.m.v = 0; this.m.faceTo(maker.x, maker.z, W.dt * 2); this.state = 'make'; yield; }
          this.counter = null;
          if (!order.ready) return;
        } else if (it?.at || this.spots.machine) {
          const p = this.plan, c = it?.at ? p.nearest(it.at[0], it.at[1], this.m.need, 8, false) : -1, to = c >= 0 ? { x: p.cx(c), z: p.cz(c) } : this.spots.machine ?? this.spots.home;
          this.state = 'go'; if (!(yield* this.travel(to.x, to.z, { must: true, patience: 30 }))) return;
          if (it?.at) yield* this.turn(Math.atan2(it.at[0] - this.x, it.at[1] - this.z), 0.7);
          H.ctx.sound?.chirp?.([55, 55, 58], 0.03);
          yield* this.doing(it?.make ?? 'stir', 4.2, 'make');
        }
      } else yield* this.doing(it?.make && this.body.hands[1].userData.variants[(HOLDS[it.make] ?? [])[1]] ? it.make : 'bow', 3.2, 'make');
      // onto the tray
      const g = this.build(o.name, it); this.body.slot.add(g); this.cargo = g; this.carrying = { name: o.name, item: it, order: o }; this.offered = false;
    } finally { this.counter = null; this.making = null; }
    yield* this.deliver();
  }
  // somebody else's order, made at its own machine while the runner waits at the counter
  *makeFor(o) {
    const s = this.spots; this.making = o.name; this.sitTo = 0;
    try {
      if (!s.machine || s.machine.dead) return;
      this.state = 'go';
      if (!(yield* this.travel(s.machine.x, s.machine.z, { must: true, patience: 20 }))) return;
      this.H.ctx.sound?.chirp?.([55, 55, 58], 0.03);
      yield* this.doing(o.item?.make ?? 'stir', 4.2, 'make');
      o.ready = true;
      this.state = 'go'; yield* this.travel(s.home.x, s.home.z, { must: true, patience: 20 });
    } finally { o.done = true; this.making = null; this.state = 'home'; }
  }
  // to wherever she is in its rooms, the tray out in front; held out to her until she takes it
  // (a place to stand a few feet from her: on its own side of her if that is free, else round her to either side)
  standNear(stop) {
    const W = this.W, v = W.visitor, p = this.plan, m = this.m, d = Math.max(0.01, Math.hypot(v.x - this.x, v.z - this.z)), a0 = Math.atan2(this.x - v.x, this.z - v.z);
    for (const da of [0, 0.7, -0.7, 1.4, -1.4, 2.2, -2.2, Math.PI]) {
      const tx = v.x + Math.sin(a0 + da) * stop, tz = v.z + Math.cos(a0 + da) * stop, q = p.nearest(tx, tz, m.need, 2.5, false, c => p.lane[c] !== 2 && p.lane[c] !== 3);
      if (q < 0 || W.taken(this, p.cx(q), p.cz(q), this.r + 0.9) || Math.hypot(p.cx(q) - v.x, p.cz(q) - v.z) < this.keep + 0.3) continue;
      if (!p.openBetween(p.cx(q), p.cz(q), v.x, v.z) && da !== Math.PI) continue;
      return { x: p.cx(q), z: p.cz(q) };
    }
    return null;
  }
  // A way that fails where it stands (a corner cut by a hair): a step out to roomier floor, and from there again
  nudge() { const p = this.plan, m = this.m, c = p.nearest(m.x, m.z, m.need, 3.5, false, c => p.clear[c] >= m.need + 1.5 && Math.hypot(p.cx(c) - m.x, p.cz(c) - m.z) > 0.7); return c >= 0 && m.goTo(p.cx(c), p.cz(c)); }
  *deliver() {
    const H = this.H, W = this.W, v = W.visitor, m = this.m, c = this.carrying; if (!c) return;
    let arrived = 0, nextWait = 0, away = 0, replan = 0, goal = null, stuck = 0, fail = null; const t0 = W.now, at = c.order?.at;
    try {
      while (this.carrying) {
        const here = v.present && this.about() && (this.fixed || this.plan.inBoxes(v.x, v.z)), still = this.fixed || this.spec.stays;      // (still: it does not leave its place; it holds the thing out from there)
        if (!here) {      // she has gone where it cannot follow: it waits a while, then keeps it for her
          away += W.dt; this.offered = false; m.v = 0; this.state = 'wait';
          if (away > 60) { this.line('kept', c.name); this.unload(); return; }
          yield; continue;
        }
        away = 0;
        const d = Math.hypot(v.x - this.x, v.z - this.z), stop = Math.max(3.4, this.keep + 1.3);
        // near enough to hand it over: beside her, or as near as the room (or a colleague) lets it get, in plain sight
        const reach = d <= stop + 0.8 || (d < 8 && stuck > 1.5 && this.plan.openBetween(this.x, this.z, v.x, v.z)) || (d < 16 && stuck > 3) || (this.offered && d < Math.max(stop + 2.2, this.item.reach - 1.5));      // (she is in the water, or behind a table: held out from the nearest floor, and she comes for it)
        if (!reach && !still) {
          this.offered = false; this.state = 'carry';
          if (W.now > replan || !goal || Math.hypot(goal.x - v.x, goal.z - v.z) > stop + 2.5) { replan = W.now + 1.5; goal = this.standNear(stop); if (!goal || !m.goTo(goal.x, goal.z)) { m.goTo(v.x, v.z); goal = null; } }
          const x0 = this.x, z0 = this.z, st = m.update(W.dt, d > 12 ? (this.spec.runner ? 1.45 : 1.1) : 0.85);
          if (st === 'failed' && fail && Math.hypot(fail.x - this.x, fail.z - this.z) < 1 && this.nudge()) { fail = null; replan = W.now + 1.6; }      // twice in one place: out to roomier floor first
          else if (st === 'failed') { fail = { x: this.x, z: this.z }; replan = 0; } else if (st === 'idle' || st === 'arrived') replan = 0;
          stuck = Math.hypot(this.x - x0, this.z - z0) < W.dt * 0.2 ? stuck + W.dt : 0;
          if (arrived && d > 9 && W.now > nextWait) { nextWait = W.now + 16; this.line('waiting', c.name); }
        } else {
          m.stop(); m.v = 0; m.faceTo(v.x, v.z, W.dt * 2); this.state = 'offer';
          if (at?.down) { at.down(); this.withdrawing = true; this.unload(); break; }      // a table of her own to set it on (the nail corner)
          this.offered = true; this.item.reach = Math.max(10, d + 3);
          if (!arrived) { arrived = W.now; nextWait = W.now + 16; this.line('deliver', c.name); W.events.deliveries = (W.events.deliveries ?? 0) + 1; }
          else if (W.now > nextWait) { nextWait = W.now + 18; this.line('waiting', c.name); }
        }
        if ((arrived && W.now - arrived > 90) || W.now - t0 > 240) { this.line('kept', c.name); this.unload(); return; }
        yield;
      }
      // taken: a small bow, and back out of her way to open floor (an errand still: her standing there does not hold it)
      this.withdrawing = true; this.expr = 'happy'; this.exprUntil = W.now + 2; yield* this.doing('bow', 1.5, 'pause');
      if (!this.fixed) { const pt = this.roomSpot(5.5); if (pt) { this.state = 'go'; yield* this.travel(pt.x, pt.z, { patience: 6 }); } }
    } finally { this.offered = false; this.withdrawing = false; this.item.reach = 10; if (this.carrying) this.unload(); }
  }
  give() { const c = this.carrying, g = this.cargo; if (!c || !g) return; this.withdrawing = true; this.carrying = null; this.cargo = null; this.offered = false; this.take(c.name, c.item, g); setTimeout(() => this.line('served'), 5000); }
  unload() { if (this.cargo) this.cargo.removeFromParent(); this.cargo = null; this.carrying = null; this.offered = false; }
  // what the concierge arranged is in another of its rooms: over to its post there, to be ready for her
  *meet(p) { this.making = 'booking'; try { this.state = 'go'; if (yield* this.travel(p.x, p.z, { patience: 30 })) { if (p.faces) yield* this.turn(Math.atan2(p.faces[0] - this.x, p.faces[1] - this.z)); yield* this.doing(p.acts[0], 8); } } finally { this.making = null; } }
  // a bell with nothing ordered: to her, and "you rang?"
  *answer() {
    const W = this.W, v = W.visitor, m = this.m; this.making = 'bell';
    try {
      const t0 = W.now; let replan = 0, fail = null;
      while (W.now - t0 < 40) {
        if (!v.present || !this.about() || !this.plan.inBoxes(v.x, v.z)) { m.v = 0; yield; continue; }
        const d = Math.hypot(v.x - this.x, v.z - this.z), stop = Math.max(3.6, this.keep + 1.4); if (d < stop + 0.8) break;
        if (W.now > replan) { replan = W.now + 1.5; const g = this.standNear(stop); if (!g || !m.goTo(g.x, g.z)) m.goTo(v.x, v.z); }
        const st = m.update(W.dt, 1.1); this.state = 'go';
        if (st === 'failed' && fail && Math.hypot(fail.x - this.x, fail.z - this.z) < 1 && this.nudge()) { fail = null; replan = W.now + 1.6; } else if (st === 'failed') { fail = { x: this.x, z: this.z }; replan = 0; }
        yield;
      }
      m.stop(); this.say(this.quiet ? '*is simply there, at your elbow, waiting to be told*' : this.id === 'ding' ? pick(RANG.here) : 'You rang, darling?', 'happy'); this.replyUntil = W.now + 5; if (!this.H.talk.robot) this.H.talk.open(this, this.dialogue());      // (and its card of things to ask for, opened for her)
    } finally { this.making = null; }
  }

  // ---- every frame, while she is anywhere near ------------------------------------------------------------------
  update(dt) {
    const H = this.H, W = this.W, now = W.now, v = W.visitor, b = this.body, sp = this.spec, m = this.m;
    if (!m.plan && !this.fixed) this.plan;
    const inRoom = this.inRoom = v.present && (this.fixed ? Math.hypot(v.x - this.x, v.z - this.z) < 30 : H.room ? H.room.name === sp.room : Math.abs(v.y - this.y) < 4.5 && !!this.homeBoxes?.some(b => v.x > b.x0 && v.x < b.x1 && v.z > b.z0 && v.z < b.z1));      // (in the pool she is in no room, but she is in its room)
    const dv = Math.hypot(v.x - this.x, v.z - this.z), talking = H.talk.robot === this;
    // coming and going; what the concierge arranged; a thing brought unasked
    if (inRoom && !this.wasIn) { this.cameIn = now; this.inSince = now; }
    // Nobody calls across a room: what it says unasked (a greeting, a mutter at its work, a word with a colleague) is
    // said only when she is within speaking distance, on its floor
    const near = this.near = v.present && dv < 17 && Math.abs(v.y - this.y) < 4;
    if (!this.fixed) {
      const bk = H.booking;
      if (bk && bk.with === this.id && H.room && H.room.name === bk.room && !this.busyWithOrder() && this.plan.inBoxes(v.x, v.z)) {      // (in the room it is for, which may not be its own: it comes to her there)
        H.booking = null; this.greeted = now; setTimeout(() => this.say(pick(this.L.booked?.[bk.key] ?? this.L.greet ?? []), 'happy', 7), 700);
        const post = this.spots.posts.find(p => p.room === bk.room); if (post && Math.hypot(post.x - this.x, post.z - this.z) > 3) this.queue.push({ kind: 'meet', post });
      }
      else if (inRoom && near && now - this.greeted > 60 && (!this.metIn || this.cameIn !== this.metIn)) { this.greeted = now; this.metIn = this.cameIn; setTimeout(() => this.line('greet'), 600); }      // (when she comes within speaking distance, not from across the room)
      if (!inRoom && this.wasIn && now - this.greeted > 12 && Math.random() < 0.6 && dv < 20) this.line('bye');
      if (inRoom && near && now > this.nextIdle && !talking && !this.bubble.talking(now) && !this.busyWithOrder()) { this.line('idle'); this.nextIdle = now + 30 + Math.random() * 40; }
      if (sp.offers && inRoom && !this.busyWithOrder() && now - this.inSince > (v.seated ? 12 : 45) && now - this.offeredAt > 300 && !H.ctx.holding?.()) { this.offeredAt = now; this.queue.push({ kind: 'bring', name: sp.offers }); }
    }
    this.wasIn = inRoom;
    // The analyst: she lies on the couch, and it takes its chair behind her head and talks to her, a line now and
    // then; she gets up, and it rises.
    if (sp.seat?.when && !this.fixed) {
      const lying = v.present && H.ctx.walker?.seated?.label === sp.seat.when && inRoom;
      const hm = this.spots.home, atChair = Math.hypot(hm.x - this.x, hm.z - this.z) < 2.2;
      if (lying && !this.busyWithOrder() && !atChair && this.taskName !== 'toChair') { const me = this; this.run('toChair', (function* () { me.state = 'go'; yield* me.travel(hm.x, hm.z, { must: true, patience: 20 }); yield* me.turn(me.homeYaw, 0.6); })(), true); }      // (wherever it was: over to its chair)
      if (lying && !this.busyWithOrder() && atChair) {
        if (!this.session) { this.session = { i: 0, next: now + 9, cardAt: now + 5, quietUntil: 0, said: 0 }; }
        this.sitTo = 1;
        // From the couch she may say things, or choose to say nothing: a card of them is kept open for her while she lies
        // there (it is put up again a little after each answer; choosing the silence keeps it away for a while).
        const S = this.session, free = !talking && now > (this.replyUntil ?? 0) + 2.5 && now > S.quietUntil;
        if (this.sitK > 0.85 && !H.talk.robot && free && now > S.cardAt) { H.talk.open(this, this.couchCard()); S.cardAt = now + 9; }
        // and now and then, if she has said nothing for a good while, one small thing from the chair
        if (this.sitK > 0.85 && now > S.next && !talking && !this.bubble.talking(now)) { const l = this.L.session ?? []; if (l.length) this.say(l[S.i++ % l.length], 'neutral'); S.next = now + 38 + Math.random() * 20; this.nextIdle = now + 40; }
      } else if (this.session && !lying) { this.session = null; this.sitTo = 0; if (talking) H.talk.close(); if (inRoom) this.say(pick(this.L.sessionEnd ?? ['We will stop there.']), 'happy'); }
      else if (!lying) this.sitTo = 0;
    }
    const seated = this.sitting, level0 = v.present && Math.abs(v.y - this.y) < 3 && (inRoom || dv < 7);
    const eng = engageVisitor(this.eng, this, v, dt, { talking: talking || now < (this.replyUntil ?? 0), level: level0, near: this.fixed ? 0 : 7, far: 9, atAWalk: true });
    const errand = this.busyWithOrder() || this.withdrawing;
    const replying = now < (this.replyUntil ?? 0), hold = this.engaged = !this.fixed && ((eng.on && (talking || (!eng.give && !errand))) || (replying && !this.carrying));      // (still answering her: it does not walk off mid-sentence)
    if (this.fixed) { if (!talking && now >= (this.replyUntil ?? 0) && this.queue.length && !this.making && !this.carrying) { const o = this.queue.shift(); if (o.kind === 'answer' || !o.name) { this.say(pick(RANG.here), 'happy'); this.replyUntil = now + 4; } else if (o.kind === 'make') o.ready = true; else this.run('order', this.bring(o), false); } if (!this.task) this.think(); this.stepTask(); }
    else {
      // (a room too small to step aside in: after a few tries in a row it stays where it is for a while, turned to her)
      if (now < this.calmUntil && this.aside.phase) { this.aside.phase = 0; this.asideEnd = now; m.stop(); }
      if (now >= this.nextManners && !seated && !this.offered && now > this.calmUntil && !sp.stays) { this.nextManners = now + 0.2; this.manners({ still: hold || this.state === 'chat' || this.state === 'offer', back: ['home', 'make', 'chat'].includes(this.state) }); }
      if (this.aside.phase) { this.setAct(null); this.stepAside(dt); }
      else if (hold) { m.v = 0; if (!seated) m.faceTo(v.x, v.z, dt * 1.6); }
      else {
        if (this.queue.length && !this.making && !this.carrying && !talking && now >= (this.replyUntil ?? 0)) { const o = this.queue.shift(); this.run('order', o.kind === 'serve' ? this.serve(o) : o.kind === 'make' ? this.makeFor(o) : o.kind === 'answer' ? this.answer() : o.kind === 'meet' ? this.meet(o.post) : this.bring(o), false); }
        if (!this.task && now > (this.faultAt ?? -9) + 2) this.think();
        this.stepTask();
      }
      if (!seated && !sp.stays) this.glide(dt);
    }
    this.actT += dt;
    // turning to her as she comes up: the eyes, then the head, then the body
    const at = attendVisitor(this.attn, { x: m.x, z: m.z, yaw: m.yaw }, v, dt, { reach: this.fixed ? 14 : 10, talking, hold, level: level0, keepWorking: seated || this.state === 'chat' || this.state === 'make' || this.state === 'carry', busy: !!this.act });
    if (at.yaw !== null && !talking && !this.aside.phase && m.v < 0.3 && !seated && this.state !== 'offer') m.face(at.yaw, dt * at.rate);
    else if (this.fixed && at.yaw === null && !this.act) m.face(this.homeYaw, dt);
    // sitting: the body drawn onto its chair from where it stands beside it
    this.sitK += (this.sitTo - this.sitK) * Math.min(1, dt * (sp.seat?.when ? 1.0 : 2.6));      // (the analyst lowers itself into its chair, and rises from it, slowly) if (this.sitK < 0.002) this.sitK = 0;
    const q = sp.seat, k = q ? this.sitK : 0, sm = k * k * (3 - 2 * k);
    if (q && k > 0.3) { let dy = q.yaw - m.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); m.yaw += dy * Math.min(1, dt * 3); }
    // behind its counter it floats higher, so that it is seen over it (cast.js `counter`)
    { const c = sp.counterW, inside = c && !seated && Math.hypot(m.x - c.x, m.z - c.z) < c.r; this.lift = (this.lift ?? 0) + ((inside ? Math.max(0, c.top - 0.2 - (b.hover + b.bottom)) : 0) - (this.lift ?? 0)) * Math.min(1, dt * 2.5); }
    const t = now + this.phase, moving = m.v > 0.25, speak = this.bubble.talking(now), act = talking || this.aside.phase || (hold && !seated) ? null : this.act;
    b.root.position.set(m.x + (q ? (q.x - m.x) * sm : 0), m.y, m.z + (q ? (q.z - m.z) * sm : 0)); b.root.rotation.y = m.yaw;
    const P = act && act !== 'idle' ? pose(act, this.actT, b.D) : null, w = 1 - at.w * (at.yaw !== null ? 0.7 : 0.25);
    const head = hold && seated ? Math.max(-0.6, Math.min(0.6, at.rel)) : hold ? 0 : at.head;
    const Lf = this.life.step(now, dt, { w: at.w, eye: at.eye, work: P ? (P.ly ?? 0) : null, moveLook: moving && at.w < 0.5 && m.path?.[m.i] ? Math.atan2(Math.sin(Math.atan2(m.path[m.i].x - m.x, m.path[m.i].z - m.z) - m.yaw), Math.cos(Math.atan2(m.path[m.i].x - m.x, m.path[m.i].z - m.z) - m.yaw)) * 1.5 : null });
    const close = ['paint', 'file', 'note', 'probe', 'tamp', 'light', 'pourTea', 'pour', 'water'].includes(act), restful = ['rest', 'breathe', 'listen', 'tea', 'taste', 'ponder'].includes(act);
    const expr = now < this.exprUntil ? this.expr : this.carrying ? 'happy' : at.w > 0.5 && inRoom ? (['neutral', 'sleepy', 'focus'].includes(this.rest) && !this.quiet && this.id !== 'winnicbott' ? 'happy' : this.rest) : close ? 'focus' : restful ? (this.rest === 'sass' ? 'sass' : 'sleepy') : this.rest;
    b.animate({ t, dt, pose: P, w, moving, speak: speak && !this.quiet, expr, look: Lf.lx, shut: Lf.shut, ly: Lf.ly, head, sitK: k, sitY: q ? q.sitY : b.hover, ringOn: !!q, lift: this.lift, carry: this.carrying ? (this.offered ? 2 : 1) : 0 });
    this.ghost = seated;
    this.updateBounds();
    const drop = (q ? (b.hover - q.sitY) * sm : 0) - (this.lift ?? 0);
    this.item.x = b.root.position.x; this.item.z = b.root.position.z; this.item.y = m.y + b.hover - drop;
    H.tmp.set(b.root.position.x, m.y + b.top + 0.35 - drop, b.root.position.z); H.bubbles.place(this.bubble, H.tmp, now, b.root.visible);
  }
  sleep() { this.H.tmp.set(this.x, this.y, this.z); this.H.bubbles.place(this.bubble, this.H.tmp, this.W.now, false); this.wasIn = false; this.inRoom = false; }
}
function pickW(list) { const w = list.reduce((t, [, n]) => t + n, 0); let r = Math.random() * w; for (const [k, n] of list) { r -= n; if (r <= 0) return k; } return list[0][0]; }

// plans: furnish.js's, per site: { rooms: { name: { floor, world: the room's box in the world } }, world(X, Y, h) }
export function hireStaff(ctx, plans, ask = '1') {
  ({ THREE } = ctx); useThree(THREE); useThreeDrinks(THREE);
  const group = new THREE.Group(); group.name = 'staff'; ctx.scene.add(group);
  const Q = new URLSearchParams(location.search), house = ctx.house, P = plans?.spanya ?? Object.values(plans ?? {})[0];
  const lineup = /^lineup/.test(ask), only = ask.replace(/^lineup:?/, '').split(',').filter(s => s && s !== '1' && byId(s));
  const W = makeWorld({ colliders: ctx.colliders, doors: house.doors, portals: house.portals, surfaces: house.surfaces, ground: (x, z) => ctx.walker?.ground?.(x, z) ?? 0 });
  const H = { debug: Q.has('keys'), ctx, W, group, room: null, tmp: new THREE.Vector3(), staff: {}, booking: null,
    get now() { return W.now; }, get dt() { return W.dt; }, get visitor() { return W.visitor; }, get events() { return W.events; } };
  W.events.choices = 0;
  H.bubbles = makeBubbles(THREE, ctx.camera); H.talk = makeTalk(H, false);

  // the cast, in the world's terms
  const xz = p => { const w = P.world(p[0], p[1], 0); return [w.x, w.z]; };
  const place = c => {
    const r = P?.rooms?.[c.room]; if (!r) { console.warn(`staff: ${c.id}'s room, "${c.room}", is not in the building; left out`); return null; }
    const y = P.world(c.home[0], c.home[1], r.floor).y, sv = c.serve;
    const seat = c.seat ? (() => { const [x, z] = xz(c.seat.at), [fx, fz] = xz(c.seat.faces); const yaw = Math.atan2(fx - x, fz - z); return { x: x + Math.sin(yaw) * 0.5, z: z + Math.cos(yaw) * 0.5, top: c.seat.top, yaw, when: c.seat.when }; })() : null;      // (forward on the seat, clear of the chair's back)
    // The pool attendant works both sides of the pool doors. Cross-sections
    // cover the dry courtyard only, ending behind the raised infinity coping.
    const court = c.outdoor ? [] : null;
    if (court) {
      const radius = COURT.r - 0.8;
      for (let y = COURT.Y - 14; y < COURT.Y + COURT.r; y++) {
        const hw = Math.sqrt(Math.max(0, radius ** 2 - Math.max((y - COURT.Y) ** 2, (y + 1 - COURT.Y) ** 2)));
        if (!hw) continue;
        const [xa, za] = xz([COURT.X - hw, y]), [xb, zb] = xz([COURT.X + hw, y + 1]);
        court.push({ name: 'The Courtyard', x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) });
      }
    }
    const counterW = c.counter ? (() => { const [x, z] = xz(c.counter.at); return { x, z, r: c.counter.r, top: c.counter.top }; })() : null;
    // Whoever brings things can follow her into any room on its own floor (its rounds keep to its own rooms: `roam` in
    // cast.js says where its posts may be; this only widens the floor it can walk)
    const floorOf = q => q.floor ?? q.y0, sameFloor = c.serve && !c.stays ? [...new Set(ctx.house.rooms.filter(q => q.site === r.world.site && Math.abs(floorOf(q) - floorOf(r.world)) < 1.5 && !/Stair|Laundry|Linen|Old Cave/.test(q.name)).map(q => q.name))] : [];
    c = { ...c, roam: [...new Set([...(c.roam ?? []), ...sameFloor])].filter(n => n !== c.room) };
    return { ...c, court, counterW, home: xz(c.home), y, roomBox: r.world, faces: c.faces ? xz(c.faces) : null, seat,
      posts: [...(c.posts ?? []), ...(c.outdoor ?? [])].filter(p => !p.room || P.rooms[p.room] || (console.warn(`staff: ${c.id} has a post in "${p.room}", which is not in the building`), false)).map(p => ({ ...p, at: xz(p.at), faces: p.faces ? xz(p.faces) : null })),
      serve: sv ? { ...sv, machine: sv.machine ? xz(sv.machine) : null, faces: sv.faces ? xz(sv.faces) : null, pickup: sv.pickup ? { xz: xz(sv.pickup), y: y + sv.pickup[2] } : null, menu: Object.fromEntries(Object.entries(sv.menu ?? {}).map(([k, it]) => [k, it.at ? { ...it, at: xz(it.at) } : it])) } : undefined };
  };
  const staff = [];
  const hire = sp => {
    const s = new Staffer(H, sp);
    if (sp.seat) sp.seat.sitY = sp.seat.top - s.body.bottom + 0.34;      // (it hovers a hand above the cushion: a floating robot still)
    H.staff[s.id] = s; staff.push(s);
  };
  const cast = CAST.filter(c => !only.length || only.includes(c.id));
  const pending = lineup ? [] : cast.map(place).filter(Boolean);
  function hireNext() {
    if (pending.length) hire(pending.shift());
    if (pending.length) requestAnimationFrame(hireNext);
  }
  hireNext();
  // ?staff=lineup: in an arc round where she stands when she first walks, each turned to her (set up on the first frame she is there)
  const standUp = () => {
    const w = ctx.walker, cam = ctx.camera, d = cam.getWorldDirection(H.tmp), fx = d.x, fz = d.z, L = Math.hypot(fx, fz) || 1, gap = 2.7, R = Number(Q.get('staffr')) || Math.max(8, (cast.length - 1) * gap / 1.15);      // (far enough off that the whole row is in view)
    cast.map((c, i) => { const a = ((cast.length - 1) / 2 - i) * gap / R, ux = fx / L, uz = fz / L, x = w.pos.x + (ux * Math.cos(a) + uz * Math.sin(a)) * R, z = w.pos.z + (uz * Math.cos(a) - ux * Math.sin(a)) * R;
      return { ...c, home: [x, z], y: w.pos.y, faces: [w.pos.x, w.pos.z], fixed: true, roam: [], posts: c.posts ?? [], roomBox: null, seat: null, serve: c.serve ? { ...c.serve, machine: null, pickup: null } : undefined }; }).forEach(hire);
    for (const s of staff) s.spots.posts = [];
  };

  // ---- what the rest of the place may ask of them -----------------------------------------------------------------
  // The concierge has arranged something: whoever it is with greets her for it when she comes into their room
  H.book = key => { const b = BOOKINGS[key]; if (!b) return false; H.booking = { key, ...b, at: W.now }; W.events.booked = (W.events.booked ?? 0) + 1; return true; };
  // A bell. { order: 'name' | { name, vessel, liquid }, by: id (default: the runner), at: { down() } (it is set down for
  // her, not handed over), quiet }. True if somebody is coming.
  H.ring = (o = {}) => {
    const v = W.visitor, who = (o.by && H.staff[o.by]) || staff.find(s => s.spec.runner) || null; if (!who || who.broken) return false;
    if (!who.fixed && !(who.plan.inBoxes(v.x, v.z) && Math.abs(v.y - who.y) < 3)) return false;      // she is somewhere it cannot get to
    W.events.rings = (W.events.rings ?? 0) + 1;
    const name = typeof o.order === 'string' ? o.order : o.order?.name;
    if (who.carrying || who.queue.length > 2) { if (!o.quiet) who.say(pick(RANG.busy), 'surprised'); if (!name) return true; }
    else if (!o.quiet) who.say(name ? fill(pick(RANG.order), name) : pick(RANG.coming), 'happy');
    who.queue.push(name ? { kind: 'bring', name, item: typeof o.order === 'object' ? { ...o.order, make: 'shake' } : undefined, at: o.at } : { kind: 'answer' });
    return true;
  };
  ctx.staff = { ring: H.ring, book: H.book, who: H.staff, H };
  // The bell in her pocket: G, from anywhere, calls the runner (Ding below; upstairs, where Ding cannot come, Hush).
  // It comes to her and opens its card of things to bring.
  let rangAt = -9;
  addEventListener('keydown', e => {
    if (e.code !== 'KeyG' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || ctx.mode !== 'walk' || /INPUT|TEXTAREA/.test(document.activeElement?.tagName ?? '') || W.now - rangAt < 4) return;
    rangAt = W.now; ctx.sound?.chirp?.([88, 93, 100], 0.05);
    const v = W.visitor, can = s => !s.broken && !s.fixed && Math.abs(v.y - s.y) < 3 && s.plan.inBoxes(v.x, v.z);
    const who = [H.staff.ding, H.staff.hush, ...staff.filter(s => s.spec.brings)].find(s => s && can(s));
    if (who && H.ring({ by: who.id, quiet: who.quiet })) ctx.flash?.(who.id === 'ding' ? 'You ring for Ding.' : `You ring. ${who.name} is coming.`);
    else ctx.flash?.('You ring. Nobody can get to you here.');
  });
  // the nail corner's bell-push (furnish/banya_nails_fx.js): Bijou calls it out, the runner brings it and sets it on the throne's table
  if (!lineup) import('./furnish/banya_nails_fx.js').then(({ NAILS }) => {
    NAILS.onBell = ({ i, drink }) => {
      const ok = H.ring({ order: drink, quiet: true, at: { down: () => { NAILS.deliver(i, drink); H.staff.ding?.say(`Ding! Your ${drink.name}, on your table! Seven minutes exactly!`, 'happy'); } } });
      if (ok) H.staff.bijou?.say(pick([`Ding! One ${drink.name} for honey! Seven minutes!`, `Honey wants a ${drink.name}! Seven minutes, honey!`]), 'happy');
      return ok;
    };
  }).catch(() => {});

  // She cannot walk into a robot (as faculty.js has it; hooked once, whoever else is hired)
  let hooked = false; const last = { x: 0, z: 0, ok: false };
  const hook = () => {
    const w = ctx.walker; if (!w || hooked) return; hooked = true;
    const base = w.collide.bind(w);
    w.collide = p => { if (W.solid(p)) { base(p); if (W.solid(p) && last.ok && Math.hypot(last.x - p.x, last.z - p.z) < 3) { p.x = last.x; p.z = last.z; } } else base(p); last.x = p.x; last.z = p.z; last.ok = true; };
  };
  let awake = [], awakeAt = -1, stood = !lineup;
  const near = c => { const v = W.visitor; return v.present && v.y - c.y < 9.5 && c.y - v.y < 6 && Math.hypot(v.x - c.x, v.z - c.z) < 70; };
  ctx.animated.push((t, dt) => {
    W.now = t; W.dt = dt; hook();
    W.watch(ctx.walker, ctx.mode === 'walk', dt); H.room = W.visitor.present ? ctx.room ?? null : null;
    if (!stood && ctx.walker && (W.visitor.present || Q.has('keys'))) { stood = true; standUp(); }
    if (t - awakeAt > 0.35) { awakeAt = t; const was = awake; awake = staff.filter(c => !c.broken && (near(c) || c.busyWithOrder() || H.talk.robot === c)); for (const c of was) if (!awake.includes(c)) c.sleep(); if (awake.length) W.stale(); H.awake = awake; }
    for (const c of awake) { try { c.update(dt); } catch (e) { c.broken = true; console.error('staff', c.name, e.stack ?? e); } }
    H.talk.update(); H.bubbles.update(t);
  });
  // for tests: who is where, doing what; is anybody inside anything; what they cost
  window.__staff = { H, W, get staff() { return staff; }, VR, get awake() { return awake.map(c => c.id); },
    status: () => staff.map(c => ({ id: c.id, x: +c.x.toFixed(2), z: +c.z.toFixed(2), state: c.state, task: c.taskName, act: c.act, sitting: c.sitting, aside: c.aside.phase, carrying: c.carrying?.name ?? null, broken: !!c.broken, faults: [...(c.faults ?? [])] })),
    gap(c) { let best = 1e9; const y = c.y; for (const b of ctx.colliders) { if (b.off || b.staff || b.y0 >= y + c.top || b.y1 <= y + 0.2) continue; const dx = Math.max(b.x0 - c.x, 0, c.x - b.x1), dz = Math.max(b.z0 - c.z, 0, c.z - b.z1), d = Math.hypot(dx, dz) - c.r; if (d < best) best = d; } return best; },
    cost() { const out = {}; for (const c of staff) out[c.id] = c.body.cost(); return out; } };
  return H;
}
