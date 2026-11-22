// Manners: a robot that gets about politely. From Anna's House (my_house/site/src/staff/robots.js, the part
// headed "manners", and staff.js's bodies), with Vesper Street's `aside` and `passage` folded in, and nothing
// here that knows a house, a shop or a school. A Polite is an Agent (agent.js) with a Mover (nav.js) on a plan,
// and these habits, whatever else its owner has it doing:
//
//   - it never steps nearer the visitor than its own radius and hers and a hand's breadth (Mover.hard), and
//     she cannot walk into it (World.solid, hooked into her walker);
//   - a robot in the line she is walking, or one she walks up to, or one she has stopped right beside, steps
//     aside to open floor: off her line, out of doorways, stairs and aisles, not past her, and nowhere that
//     would shut her in; it turns to her, waits until she has passed, then goes back to what it was doing;
//   - pressed against her, it glides away rather than pinning her;
//   - it does not stand about in a doorway, at a stair or in a hall, nor where it shuts her into a corner;
//   - its trips go round her at a berth; if she stands on its way with no way round it waits, out of the
//     doorways, and tries again; if she stands where it was going it waits nearby or goes somewhere else;
//   - it goes round its colleagues, and the junior of two that meet makes way.
//
//   makeWorld({ colliders, doors, portals, surfaces, ground, rnd })  ->  W, the things every robot shares:
//     W.visitor     { present, x, y, z, dx, dz, speed, seated }: keep it up to date with W.watch(walker, present, dt)
//     W.agents      everyone (each Polite adds itself)
//     W.plan(area)  a plan (nav.js) of a patch of floor; W.stale() says the furniture or a door has changed
//     W.solid(p)    push a walker's feet p out of every body: call it from the walker's own collide()
//   new Polite(W, { radius, top, speed, plan: () => plan, rank })     then every frame, while anyone is near:
//     a.manners() a few times a second, a.aside.phase ? a.stepAside(dt) : a.stepTask(), a.glide(dt)
//
//   attendVisitor(st, me, v, dt, o)  ->  st        turning to her as she comes up (any robot, Polite or not)
//     st   its own state: pass {} the first time and the same object every frame after (it is filled in and returned)
//     me   { x, z, yaw }: where the robot stands and the way its body faces now (radians, 0 = +z, as Mover.yaw)
//     v    the visitor: W.visitor, or anything with { present, x, z, speed } and, optionally, fx, fz (the way she
//          is looking; W.watch fills them in) or dx, dz (the way she is walking)
//     dt   seconds since the last call
//     o    { reach: 10 (feet), keepWorking: false (a lecturer: eyes and head only, the body goes on with its
//          work), talking: false (being spoken to: full attention, at any range up to reach * 1.5), busy: false
//          (hands full: a glance only, slower to come), level: true (false: she is on another floor) }
//   It reads:  st.looking  true while attending to her          st.w     0..1, how much (eased in and out)
//              st.eye      -1..1 across the face, for face.draw's look, measured from the head as st.head has turned it
//              st.eyeBody  the same measured from the body: use it instead if nothing turns the head
//              st.head     radians, how far to turn the head (or the whole upper body, for a robot without a neck)
//                          from the body, within +-0.6; ease it onto whatever turns the head (bob.rotation.y)
//              st.yaw      the body's yaw it wants (null: leave the body to its task); turn it with
//                          Mover.face(st.yaw, dt * st.rate)
//              st.rel      her bearing from the way the body faces (radians, -PI..PI)
//   When she comes within reach and is looking at it, or stops near it, or walks right up, the eyes turn to her
//   at once, the head after a moment, the body (unless keepWorking) once she has been there about a second;
//   when she looks away or leaves, it eases back to what it was doing a moment later. As the staff of Anna's
//   House glance over and turn to the guest (my_house staff/robots.js, linger and update).

import { Agent, rngFrom } from './agent.js';
import { makePlan, Mover, CELL } from './nav.js';

export const VR = 0.72;                                  // the visitor's own radius (walk.js)
const GOING = 1, HOLD = 2, BACK = 3;                     // stepping aside: on the way, waiting for her to pass, going back
const RADII = [2.6, 3.4, 4.4, 5.6, 7];

export function makeWorld(env) {
  const W = { ...env, now: 0, dt: 1 / 60, rnd: env.rnd ?? rngFrom(Math.floor(Math.random() * 1e9)), agents: [], events: {}, talking: null,
    visitor: { present: false, x: 0, y: 0, z: 0, dx: 0, dz: -1, px: 0, pz: 0, speed: 0, seated: false } };
  const plans = [];
  W.plan = area => { const p = makePlan(W, area); plans.push(p); return p; };
  // Has the furniture arrived, or a door been opened or shut? (Looked at every second or so, only while somebody is awake.)
  let sig = '', sigAt = -1e9;
  W.stale = () => {
    if (W.now - sigAt < 1.2) return false; sigAt = W.now;
    let off = 0; for (const c of W.colliders) if (c.off) off++;
    let open = 0; for (const d of W.doors ?? []) if (d.isOpen) open++;
    const s = `${W.colliders.length}|${off}|${open}`; if (s === sig) return false;
    const first = !sig; sig = s; if (!first) W.gen = (W.gen ?? 0) + 1; return !first;
  };
  W.watch = (walker, present, dt) => {
    const v = W.visitor; v.present = !!walker && present; if (!v.present) return;
    v.x = walker.pos.x; v.y = walker.pos.y; v.z = walker.pos.z; v.seated = !!walker.seated;
    // how fast, and which way, she is actually walking (smoothed; the way she faces may differ)
    const ddx = v.x - v.px, ddz = v.z - v.pz, L = Math.hypot(ddx, ddz), sp = L > 6 ? 0 : L / Math.max(dt, 1e-3);
    v.speed = v.speed * 0.8 + sp * 0.2;
    if (L > 1e-4 && sp > 0.4) { v.dx = v.dx * 0.6 + (ddx / L) * 0.4; v.dz = v.dz * 0.6 + (ddz / L) * 0.4; const k = Math.hypot(v.dx, v.dz) || 1; v.dx /= k; v.dz /= k; }
    v.px = v.x; v.pz = v.z;
    if (typeof walker.yaw === 'number') { v.fx = -Math.sin(walker.yaw); v.fz = -Math.cos(walker.yaw); }      // the way she is looking (the walker's yaw 0 looks toward -z)
  };
  // She cannot walk into a body. p: her feet (changed in place). True if she was pushed.
  W.solid = p => {
    let hit = false;
    for (const a of W.agents) {
      if (a.ghost || Math.abs(p.y - a.y) > 3) continue;
      const dx = p.x - a.x, dz = p.z - a.z, R = a.r + VR, d2 = dx * dx + dz * dz; if (d2 >= R * R) continue;
      const d = Math.sqrt(d2); if (d > 1e-4) { p.x = a.x + dx / d * R; p.z = a.z + dz / d * R; } else p.x += R;
      hit = true;
    }
    return hit;
  };
  // Is anybody else standing at (or bound for) (x, z)? For choosing a place to wait.
  W.taken = (self, x, z, r) => {
    for (const o of W.agents) if (o !== self && Math.abs(o.y - self.y) < 3 && (Math.hypot(o.x - x, o.z - z) < r || (o.m.goal && o.m.path && Math.hypot(o.m.goal.x - x, o.m.goal.z - z) < r) || (o.aside.phase && Math.hypot(o.aside.x - x, o.aside.z - z) < r))) return true;
    return false;
  };
  return W;
}

// ---- turning to her ----------------------------------------------------------------------------------
// (robokit/attend.js, shared with Anna's House and Vesper Street: the function documented at the top of this file)
export { attendVisitor, engageVisitor } from '../robokit/attend.js';

export class Polite extends Agent {
  constructor(W, o = {}) {
    super(W); this.W = W;
    this.r = o.radius ?? 0.75; this.top = o.top ?? 4.6; this.rank = o.rank ?? W.agents.length; this.getPlan = o.plan;
    this.keep = this.r + VR + 0.35;                                           // never nearer her than this, by its own doing
    this.m = new Mover(null, { need: Math.max(2, Math.ceil(this.r / CELL + 0.5)), speed: o.speed ?? 2.6, turn: 3.2 });
    this.m.fit = this.r / CELL + 0.5;                                          // clearance (in cells) at which the body just touches nothing
    this.m.avoid = (x, z) => this.blocked(x, z); this.m.hard = (x, z) => this.tooNear(x, z);
    this.soft = 0.9;                                                          // the berth it gives her where there is open floor between them, beyond `keep`
    this.aside = { phase: 0, x: 0, z: 0, t0: 0, hold: true, back: false, bx: 0, bz: 0, goal: false, gx: 0, gz: 0, kind: 0, who: null };
    this.asideEnd = -9; this.nextManners = (W.agents.length % 7) * 0.03; this.laneTime = 0; this.trapTime = 0; this.planGen = -1;
    W.agents.push(this);
  }
  get x() { return this.m.x; } get z() { return this.m.z; } get y() { return this.m.y; }
  get plan() { const W = this.W; if (!this.m.plan) { this.m.plan = this.getPlan(); this.planGen = W.gen ?? 0; } else if (this.planGen !== (W.gen ?? 0)) { this.planGen = W.gen ?? 0; this.m.plan.rebuild(); this.unstick(); } return this.m.plan; }
  // after the furniture has moved: out of anything it is now standing in
  unstick() { const p = this.m.plan, m = this.m; if (!p.freeAt(m.x, m.z, 1, true)) { const c = p.nearest(m.x, m.z, m.need, 6, true); if (c >= 0) { m.x = p.cx(c); m.z = p.cz(c); m.y = p.floorY(m.x, m.z); } } }
  run(name, gen, interruptible) { if (this.aside?.phase) { this.aside.phase = 0; this.asideEnd = this.W.now; } this.m.strafe = false; super.run(name, gen, interruptible); }

  // ---- where she is, as far as this robot is concerned ------------------------------------------------
  level(o = this.W.visitor) { return Math.abs(o.y - this.y) < 3; }
  about() { const v = this.W.visitor; return v.present && this.level(v); }                    // on my floor, somewhere
  visitorDist() { const v = this.W.visitor; return this.about() ? Math.hypot(v.x - this.x, v.z - this.z) : Infinity; }
  // in the patch of floor I get about on (or just at its edge: in the doorway)
  withMe() { const v = this.W.visitor; if (!this.about()) return false; const p = this.plan; return p.inBoxes(v.x, v.z) || p.inBoxes(v.x + 1.5, v.z) || p.inBoxes(v.x - 1.5, v.z) || p.inBoxes(v.x, v.z + 1.5) || p.inBoxes(v.x, v.z - 1.5); }
  // Is someone standing at (x, z), from where I stand? She gets a berth where there is open floor between us;
  // stepping away from somebody is always allowed (pressed up against them, that is the only way out).
  blocked(x, z) {
    const W = this.W, v = W.visitor, sx = this.x, sz = this.z;
    if (this.about()) {
      const d = Math.hypot(v.x - x, v.z - z);
      if (d < Math.hypot(v.x - sx, v.z - sz) + 0.02 && (d < this.keep + 0.15 || (d < this.keep + this.soft && this.plan.openBetween(x, z, v.x, v.z)))) return true;
    }
    for (const o of W.agents) if (o !== this && !o.ghost && this.level(o)) { const d = Math.hypot(o.x - x, o.z - z); if (d < this.r + o.r + 0.5 && d < Math.hypot(o.x - sx, o.z - sz) + 0.02) return true; }
    return false;
  }
  // The rule with no exceptions: no step that brings it inside her (or a colleague's) space
  tooNear(x, z) {
    const W = this.W, v = W.visitor, sx = this.x, sz = this.z;
    if (this.about()) { const d = Math.hypot(v.x - x, v.z - z); if (d < this.keep && d < Math.hypot(v.x - sx, v.z - sz)) return true; }
    for (const o of W.agents) if (o !== this && !o.ghost && this.level(o)) { const d = Math.hypot(o.x - x, o.z - z); if (d < this.r + o.r + 0.15 && d < Math.hypot(o.x - sx, o.z - sz)) return true; }
    return false;
  }
  // Pressed against her: glide away rather than pin her (a little to one side if straight back is a wall)
  glide(dt) {
    const v = this.W.visitor, m = this.m; if (!this.about() || this.ghost) return;
    const dx = m.x - v.x, dz = m.z - v.z, d = Math.hypot(dx, dz), want = this.r + VR + 0.45;
    if (d >= want || d < 1e-3) return;
    const step = Math.min(want - d + 0.02, dt * 3.2), p = this.plan;
    for (const turn of [0, 0.8, -0.8, 1.5, -1.5]) {
      const c = Math.cos(turn), s = Math.sin(turn), ux = (dx * c - dz * s) / d, uz = (dx * s + dz * c) / d, x = m.x + ux * step, z = m.z + uz * step;
      if (p.freeAt(x, z, m.fit, false) && !this.tooNear(x, z)) { m.x = x; m.z = z; m.y = p.floorY(x, z); this.W.events.glides = (this.W.events.glides ?? 0) + 1; this.glidedAt = this.W.now; return; }
    }
  }
  // Would a body standing at (x, z) shut her in: cut her off from the doors, or from most of the floor she can
  // reach now? (Two flood fills from where she stands, one with the body in the way. Asked only when she is near.)
  traps(x, z) {
    const v = this.W.visitor, p = this.plan;
    if (!this.withMe() || v.seated || Math.hypot(x - v.x, z - v.z) > 9) return false;
    const doorsIn = n => { let k = 0; for (let i = 0; i < n; i++) if (p.lane[p.reached(i)] === 2) k++; return k; };
    const n0 = p.flood(v.x, v.z, 1.5, 60), d0 = doorsIn(n0); if (n0 < 8) return false;
    const n1 = p.flood(v.x, v.z, 1.5, 60, x, z, this.r + VR + 0.1), d1 = doorsIn(n1);
    return n1 < n0 * 0.5 || (d0 > 0 && d1 === 0);
  }
  inLane() { return !!this.plan.laneAt(this.x, this.z); }
  // The nearest place to wait that is open floor, not a way through, not on top of anybody, not shutting her in
  roomSpot(minFromGuest = 4.8, nearX = this.x, nearZ = this.z, maxR = 16) {
    const W = this.W, p = this.plan, v = W.visitor, about = this.withMe();
    for (const minClear of [3, 2.4]) for (let tries = 0, skip = new Set(); tries < 3; tries++) {
      const c = p.nearest(nearX, nearZ, this.m.need, maxR, false, c => {
        if (p.clear[c] < minClear || p.lane[c] || skip.has(c)) return false;
        const px = p.cx(c), pz = p.cz(c);
        if (about && Math.hypot(px - v.x, pz - v.z) < minFromGuest) return false;
        return !W.taken(this, px, pz, this.r + 1.6);
      });
      if (c < 0) break;
      if (!this.traps(p.cx(c), p.cz(c))) return { x: p.cx(c), z: p.cz(c) };
      skip.add(c);
    }
    return null;
  }
  // Is she coming this way? 1: I am in the line she is walking and she is gaining on me; 2: she is walking up
  // to me; 3: she has stopped, too close.
  inHerWay() {
    const v = this.W.visitor;
    if (!this.withMe() || v.seated) return 0;
    const rx = this.x - v.x, rz = this.z - v.z, d = Math.hypot(rx, rz);
    if (d > 10) return 0;
    if (!this.plan.openBetween(this.x, this.z, v.x, v.z)) return 0;                              // a counter, a desk between us: I am not in her way
    if (v.speed > 1.2) {
      const ahead = rx * v.dx + rz * v.dz, lat = rx * v.dz - rz * v.dx, mine = this.m.v * (Math.sin(this.m.yaw) * v.dx + Math.cos(this.m.yaw) * v.dz);
      if (ahead > -0.3 && ahead < 11 && Math.abs(lat) < 2.6 && v.speed - mine > 0.8) return 1;
      if (d < 3.6 && ahead > 0) return 2;
      return d < this.keep + 0.6 ? 3 : 0;
    }
    return d < this.keep + 0.6 ? 3 : 0;
  }
  // Somewhere close by, off her line and out of the doorways, reachable in a straight step
  // (from whoever is passing: her, or a colleague in a narrow place; o has x, z and a heading dx, dz)
  asideSpot(o = this.W.visitor, keep = 4.4) {
    const W = this.W, v = o, p = this.plan, need = this.m.need;
    const lat0 = (this.x - v.x) * v.dz - (this.z - v.z) * v.dx, side0 = Math.sign(lat0) || (this.rank % 2 ? 1 : -1);
    p.flood(this.x, this.z, need, 24, v.x, v.z, Math.min(this.r + VR + 0.3, Math.hypot(this.x - v.x, this.z - v.z) - 0.3));      // where it can get to without squeezing past
    const cand = [];
    for (let j = 0; j < RADII.length; j++) for (let k = 0; k < 16; k++) {
      const r = RADII[j], a = (k / 16) * Math.PI * 2, c = p.cellOf(this.x + Math.sin(a) * r, this.z + Math.cos(a) * r);
      if (c < 0 || !p.free(c, need, false) || p.door[c] >= 0 || p.lane[c] === 2 || p.lane[c] === 3 || p.clear[c] < 2.4) continue;
      const qx = p.cx(c) - v.x, qz = p.cz(c) - v.z, dv = Math.hypot(qx, qz);
      if (dv < keep) continue;                                                                  // not crowding her
      const ah = qx * v.dx + qz * v.dz, lt = qx * v.dz - qz * v.dx;
      if (ah > -1.5 && Math.abs(lt) < 3.1) continue;                                             // still in her way
      const ux = p.cx(c) - this.x, uz = p.cz(c) - this.z, ox = this.x - v.x, oz = this.z - v.z;
      if (ux * ox + uz * oz < -0.25 * r * Math.hypot(ox, oz)) continue;                           // a step aside is not a step toward her
      const pd = p.reachD(c); if (pd > r * 1.6 + 1.5) continue;                                  // (a step, not a trip round the houses or past her)
      if (W.taken(this, p.cx(c), p.cz(c), this.r + 1.6)) continue;
      cand.push([-pd * 0.55 - Math.max(0, ah) * 0.3 + Math.min(p.clear[c], 6) * 0.25 - (p.lane[c] ? 2.5 : 0) + (Math.sign(lt) === side0 ? 0.9 : 0) + Math.min(dv, 7) * 0.15, c]);
    }
    cand.sort((a, b) => b[0] - a[0]);
    for (const [, c] of cand.slice(0, 4)) if (o !== W.visitor || !this.traps(p.cx(c), p.cz(c))) return { x: p.cx(c), z: p.cz(c) };
    p.flood(this.x, this.z, need, 24, v.x, v.z, Math.min(this.r + VR + 0.3, Math.hypot(this.x - v.x, this.z - v.z) - 0.3));
    const best = this.farEnd(v, keep);        // nothing a step away (an aisle, behind a counter): out by the far end
    return best < 0 ? null : { x: p.cx(best), z: p.cz(best) };
  }
  // The nearest open floor it can walk to without passing her (call after plan.flood): out of an aisle by the
  // far end, not back past her. A spot in an aisle off her line will do if nothing else does.
  farEnd(v, keep) {
    const W = this.W, p = this.plan, R = Math.ceil(22 / CELL);
    let best = -1, bd = Infinity, best2 = -1, bd2 = Infinity;
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      const c = p.cellOf(this.x + dx * CELL, this.z + dz * CELL); if (c < 0) continue;
      const pd = p.reachD(c); if (pd === Infinity || p.door[c] >= 0 || p.lane[c] === 2 || p.lane[c] === 3) continue;
      const qx = p.cx(c) - v.x, qz = p.cz(c) - v.z, ah = qx * v.dx + qz * v.dz, lt = qx * v.dz - qz * v.dx;
      if (Math.hypot(qx, qz) < keep || (ah > -1.5 && Math.abs(lt) < 3.1) || W.taken(this, p.cx(c), p.cz(c), this.r + 1.6)) continue;
      if (!p.lane[c] && p.clear[c] >= 2.6) { if (pd < bd) { bd = pd; best = c; } }
      else if (p.clear[c] >= 2 && pd + 6 < bd2 && !p.clearLine(v.x, v.z, p.cx(c), p.cz(c), 1, false)) { bd2 = pd + 6; best2 = c; }      // (an aisle spot only round a corner from her)
    }
    return best >= 0 && bd <= bd2 + 8 ? best : best2 >= 0 ? best2 : best;
  }
  startAside(pt, hold, back, kind, who = null) {
    const W = this.W, a = this.aside, m = this.m;
    a.who = who;
    if (!a.phase) {
      a.goal = !!(m.path && m.goal); if (a.goal) { a.gx = m.goal.x; a.gz = m.goal.z; }
      a.back = back && !a.goal && !([2, 3].includes(this.plan.laneAt(this.x, this.z))); a.bx = this.x; a.bz = this.z;
    }
    a.x = pt.x; a.z = pt.z; a.hold = hold; a.kind = kind; a.t0 = W.now;
    const v = W.visitor, o = who ? who : this.about() ? v : null;      // (the way round whoever it is making room for)
    if (!(o ? this.goAvoiding(pt.x, pt.z, o.x, o.z, this.r + VR + 0.6) || m.goTo(pt.x, pt.z) : m.goTo(pt.x, pt.z))) { this.resume(); return false; }
    m.turnRate = 5;                                                                                   // (a brisk sidestep, not a slow about-turn)
    a.phase = GOING; W.events.asides = (W.events.asides ?? 0) + 1;
    return true;
  }
  // Back to what it was doing: the trip it was on, or the place it was standing (if that is still sensible)
  resume() {
    const W = this.W, a = this.aside, m = this.m, v = W.visitor;
    a.phase = 0; this.asideEnd = W.now; m.stop(); m.turnRate = 3.2; m.strafe = false;
    if (a.goal) m.goTo(a.gx, a.gz);
    else if (a.back && Math.hypot(a.bx - this.x, a.bz - this.z) > 1 && !(this.about() && Math.hypot(a.bx - v.x, a.bz - v.z) < 5.5) && !W.taken(this, a.bx, a.bz, this.r + 1.6) && m.goTo(a.bx, a.bz)) { a.phase = BACK; a.t0 = W.now; }
  }
  passed() {
    const W = this.W, a = this.aside, o = a.who;
    if (o) { const m = o.src.m; o.x = m.x; o.z = m.z; const rx = this.x - o.x, rz = this.z - o.z; return !m.path || rx * o.dx + rz * o.dz < -1 || Math.hypot(rx, rz) > 8; }      // a colleague: by, or stopped
    const v = W.visitor;
    if (!this.withMe()) return true;
    const rx = this.x - v.x, rz = this.z - v.z, d = Math.hypot(rx, rz);
    if (v.speed < 0.6) return d > 4.2 && W.now - a.t0 > 1.5;                                        // she has stopped, at a decent distance
    return rx * v.dx + rz * v.dz < -1.5 || d > 11;                                                    // she is past, or gone another way
  }
  stepAside(dt) {
    const W = this.W, a = this.aside, m = this.m, v = W.visitor;
    if (a.phase === GOING) {
      const st = m.update(dt, 1.3);
      if (st === 'arrived' || st === 'idle' || st === 'failed' || W.now - a.t0 > 8) {
        const there = Math.hypot(a.x - this.x, a.z - this.z) < 1.2;
        m.stop(); if (a.hold && there) { a.phase = HOLD; a.t0 = W.now; } else { this.resume(); if (!there) this.asideEnd = W.now - 1; }      // (stopped short: not a place to wait; look again at once)
      }
    } else if (a.phase === HOLD) {
      m.v = Math.max(0, m.v - dt * 4);
      const o = a.who ?? v;
      if (a.who || this.about()) m.faceTo(o.x, o.z, dt * 0.6);                                      // turned to her (or him) as she goes by
      if (this.passed() || W.now - a.t0 > 10) this.resume();
    } else if (a.phase === BACK) {
      const st = m.update(dt, 0.9);
      if ((st !== 'moving' && st !== 'waiting') || W.now - a.t0 > 10) { m.stop(); a.phase = 0; m.turnRate = 3.2; m.strafe = false; }
    }
  }
  // Plan a trip with somebody's body (ox, oz, r) marked as furniture, so the way goes round them, not through
  // them. False if there is no way round.
  goAvoiding(x, z, ox, oz, r) {
    const m = this.m; if (!this.plan) return false;
    r = Math.min(r, Math.hypot(this.x - ox, this.z - oz) - 0.3);                                     // (never walled in where it stands)
    if (r < 0.5) return m.goTo(x, z);
    return this.plan.around(ox, oz, r, this.x, this.z, () => m.goTo(x, z));
  }
  // Somewhere to stand aside for a colleague on the move: their heading from their path
  passer(src) {
    const m = src.m, pt = m.path?.[m.i], L = pt ? Math.hypot(pt.x - m.x, pt.z - m.z) : 0; if (L < 0.05) return null;
    const o = this.who ??= { src: null, x: 0, z: 0, dx: 0, dz: 0 };
    o.src = src; o.x = m.x; o.z = m.z; o.dx = (pt.x - m.x) / L; o.dz = (pt.z - m.z) / L;
    return this.asideSpot(o, 2.6);
  }
  // A few times a second. `o.still`: it has business where it stands (being spoken to), and only moves if she is on top of it.
  manners(o = {}) {
    const W = this.W, a = this.aside, m = this.m, v = W.visitor;
    const w = this.inHerWay();
    const stuckGoing = a.phase === GOING && m.blockedFor > 0.4 && W.now - a.t0 > 0.6;
    const badHold = a.phase === HOLD && ([2, 3].includes(this.plan.laneAt(this.x, this.z)) || Math.hypot(a.x - this.x, a.z - this.z) > 1.2);      // waiting in a doorway, or not where it meant to wait
    if (w && !(o.still && w !== 3) && (a.phase === 0 || a.phase === BACK || stuckGoing || (a.phase === HOLD && (w !== 3 || badHold))) && W.now - this.asideEnd > (a.phase ? 0.6 : 1.2)) {
      const pt = this.asideSpot();
      if (pt && Math.hypot(pt.x - this.x, pt.z - this.z) > 0.8) { this.startAside(pt, true, w !== 3 || !!o.back, w); return; }
    }
    if (o.still) return;
    // two meeting in a narrow place: the junior one (or the one standing) makes way; the other goes round a colleague who is standing
    if ((!a.phase || a.phase === GOING) && m.path && m.blockedFor > 0.7) {
      for (const q of W.agents) {
        if (q === this || q.ghost || !this.level(q) || Math.hypot(q.x - this.x, q.z - this.z) > this.r + q.r + 1.8) continue;
        if (q.m.path && !q.aside.phase && q.rank < this.rank) {
          if (a.phase) continue;
          const pt = this.passer(q); if (pt) { m.blockedFor = 0; this.startAside(pt, true, true, 4, this.who); return; }
        } else if ((!q.m.path || q.aside.phase === HOLD) && m.goal && Math.hypot(m.goal.x - q.x, m.goal.z - q.z) > this.r + q.r + 0.5) {
          m.blockedFor = 0; const g = m.goal; if (this.goAvoiding(g.x, g.z, q.x, q.z, this.r + q.r + 0.5)) { W.events.detours = (W.events.detours ?? 0) + 1; return; } m.goTo(g.x, g.z);
        }
      }
    }
    // nobody stands about in a doorway, at a stair or in a hall, nor on top of a colleague, nor where she is shut in
    const idle = !a.phase && !m.path && m.v < 0.15;
    let crowd = false;
    if (idle) for (const q of W.agents) if (q !== this && !q.ghost && q.rank < this.rank && this.level(q) && Math.hypot(q.x - this.x, q.z - this.z) < this.r + q.r + 0.6) crowd = true;
    const lane = this.plan.laneAt(this.x, this.z), passage = lane === 1 || lane === 3 || this.plan.inDoorway(this.x, this.z) || ((lane === 2 || lane === 4) && !this.mayStandHere?.());      // (a place it was given by name may be near a door or in an aisle, never in the doorway)
    this.laneTime = idle && (crowd || passage) ? this.laneTime + 0.2 : 0;
    if (this.laneTime > (crowd ? 1 : 2)) {
      this.laneTime = 0;
      const pt = this.roomSpot(); if (pt && this.startAside(pt, false, false, 0)) { W.events.moveAlong = (W.events.moveAlong ?? 0) + 1; return; }
    }
    this.trapTime = idle && this.visitorDist() < 9 ? this.trapTime + 0.2 : 0;
    if (this.trapTime > 0.6) {
      this.trapTime = 0;
      if (this.traps(this.x, this.z)) { const pt = this.roomSpot(4.4); if (pt && this.startAside(pt, true, false, 6)) W.events.untraps = (W.events.untraps ?? 0) + 1; }
    }
  }

  // ---- trips ---------------------------------------------------------------------------------------------
  // Go to (x, z) the polite way: round her at a berth; if she is in the way with no way round, wait (out of the
  // doorways) and try again; if she is standing on the very spot, wait nearby (o.must) or give up (-> false).
  // o: { must, patience: seconds, speed, until: () => bool, face: {x, z} to look at while waiting }
  *travel(x, z, o = {}) {
    const W = this.W, m = this.m, v = W.visitor, end = W.now + (o.patience ?? 14), berth = this.keep + 1.5;
    if (!this.plan) return false;                                             // (asking for the plan makes it: the Mover is never left without one)
    for (;;) {
      if (o.until?.()) { m.stop(); return true; }
      if (Math.hypot(x - this.x, z - this.z) < 0.25) { m.stop(); return true; }
      const at = this.about() && Math.hypot(v.x - x, v.z - z) < this.keep + 0.5 && this.plan.openBetween(x, z, v.x, v.z);      // she is standing where I am going
      if (at || W.taken(this, x, z, this.r + 0.9)) {
        if (!o.must || W.now > end) return false;
        yield* this.standBy(x, z, 2.5);
        continue;
      }
      const vx = v.x, vz = v.z, round = this.about() && Math.hypot(vx - this.x, vz - this.z) < 30;
      // round her at a good berth; if the room does not allow that, round her closely; else straight, to wait where she blocks the way
      this.soft = 0.9;
      if (round && this.goAvoiding(x, z, vx, vz, berth)) { /* the wide way */ }
      else if (round && this.goAvoiding(x, z, vx, vz, this.keep + 0.5)) this.soft = 0.15;
      else if (!m.goTo(x, z)) { if (W.now > end) return false; yield* this.wait(1.2); continue; }
      let st = 'moving', t0 = W.now;
      for (;;) {
        st = m.update(W.dt, o.speed ?? 1);
        if (st === 'arrived' || st === 'failed' || st === 'idle') break;
        if (o.until?.()) { m.stop(); return true; }
        if (W.now - t0 > 0.6 && this.about() && Math.hypot(v.x - vx, v.z - vz) > 1.5) break;        // she has moved: think again
        if (W.now > end + 20) { m.stop(); return false; }
        yield;
      }
      this.soft = 0.9;
      if (st === 'arrived') return true;
      if (st === 'failed' || st === 'idle') {
        if (W.now > end) { m.stop(); return false; }
        yield* this.standBy(x, z, 1.5);
      }
    }
  }
  // Wait a moment for the way (or the spot) to clear: where it is if that is a fair place to stand, else the
  // nearest open floor toward where it is going that is clear of her
  *standBy(x, z, secs) {
    const W = this.W, v = W.visitor, lane = this.plan.laneAt(this.x, this.z);
    if (lane === 2 || lane === 3 || this.visitorDist() < this.keep + 0.8 || Math.hypot(x - this.x, z - this.z) > 9 || (this.about() && this.traps(this.x, this.z))) {      // (and from far off it comes nearer, to wait where it can see the place)
      const pt = this.roomSpot(4.4, x, z, 14) ?? this.roomSpot(4.4);
      if (pt && this.goAvoiding(pt.x, pt.z, v.x, v.z, this.r + VR + 0.8)) { const t0 = W.now; while (W.now - t0 < 6) { const st = this.m.update(W.dt, 1); if (st !== 'moving' && st !== 'waiting') break; yield; } this.m.stop(); }
    }
    const end = W.now + secs;
    while (W.now < end) { if (this.about()) this.m.faceTo(v.x, v.z, W.dt * 0.8); this.m.v = 0; yield; }
  }
}
