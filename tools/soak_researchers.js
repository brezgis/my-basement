// A soak test of the research staff's day (site/src/faculty/researchers.js and researcher_life.js): in a few rooms,
// fast-forward several minutes of their life with the visitor standing about, standing in an aisle by them, and
// sitting in an empty chair among them, and count what goes wrong. Run it through drive.py:
//
//   python3 tools/drive.py "at=snow&time=22" "$(cat tools/soak_researchers.js)"
//
// It steps the researchers itself, in one block (so the page's own clock cannot interleave), and asks the audit
// in researchers.js, which looks every step at everyone near her:
//   inside        on its feet, inside furniture or a wall (seated ones sit in their chairs, which is allowed)
//   on-visitor    nearer her than her radius and its own
//   in-her-chair  sitting in the chair she is sitting in
//   stuck         meaning to walk and getting nowhere for half a minute
//   shared-seat   two sitting in one seat
// and at the end of each room, with nobody allowed to set off anywhere new for two and a half minutes, that everyone
// there is back at a spot of its own (seated if the spot is a seat), and no spot has two.
async () => {
  const F = window.__faculty, R = F.researchers, W = F.W, L = R.L, walker = window.__house.walker, cam = window.__house.camera;
  const ROOMS = [['Museum', 5], ['Reading Room', 4], ['Room 203', 3], ['Museum Basement', 4]];
  const DT = 0.05, out = { rooms: {} };
  let now = W.now + 1; const t0 = now;
  const run = secs => { for (let i = 0, n = Math.round(secs / DT); i < n; i++) { now += DT; W.now = now; W.dt = DT; W.watch(walker, true, DT); R.tick(now, DT); } };
  const look = (x, y, z, tx, tz) => { walker.pos.set(x, y, z); W.visitor.px = x; W.visitor.pz = z; cam.position.set(x, y + 5.2, z); cam.lookAt(tx, y + 3, tz); cam.updateMatrixWorld(); };
  for (const [name, n] of ROOMS) {
    const e0 = R.all.reduce((a, r) => a + (r.errands ?? 0), 0), who = R.fill(name, n), mine = R.all.filter(r => who.includes(r.name)), A = R.startAudit(); L.hold = false;
    if (!mine.length) { out.rooms[name] = { error: 'nobody could be brought here' }; continue; }
    const fl = mine[0].floor, p = fl.plan, y = fl.y, cx = mine.reduce((a, r) => a + r.x, 0) / mine.length, cz = mine.reduce((a, r) => a + r.z, 0) / mine.length;
    for (const r of mine) { r.nextErrand = now + Math.random() * 10; r.stintEnd = now + 1e6; }      // (they stay in this room for the test, and run their errands)
    // (never on top of anyone: she walks in, she is not dropped on them)
    const clear = c => R.all.every(r => r.hidden || Math.hypot(r.x - p.cx(c), r.z - p.cz(c)) > 2.6) && R.spots.every(s => s.key !== mine[0].spot?.key || Math.hypot(s.x - p.cx(c), s.z - p.cz(c)) > 3);      // (nor standing at a chair of theirs)
    const pick = ok => { const c = p.nearest(cx, cz, 2, 30, false, c => fl.inRoom(name, p.cx(c), p.cz(c)) && clear(c) && ok(c)); return c >= 0 ? { x: p.cx(c), z: p.cz(c) } : null; };
    const log = [];
    // 1. standing about in open floor among them
    const open = pick(c => p.lane[c] === 0 && mine.every(r => Math.hypot(r.x - p.cx(c), r.z - p.cz(c)) > 3)) ?? pick(() => true);
    walker.seated = null; look(open.x, y, open.z, cx, cz); run(150); log.push(`open floor ${open.x.toFixed(1)}, ${open.z.toFixed(1)}`);
    // 2. standing in an aisle right by one of them (where it would get up into)
    const r0 = mine.find(r => r.spot?.off) ?? mine[0], off = r0.spot?.off ?? r0;
    const aisle = (() => { const c = p.nearest(off.x, off.z, 2, 6, false, c => p.lane[c] === 4 && R.all.every(r => r.hidden || Math.hypot(r.x - p.cx(c), r.z - p.cz(c)) > 2.6) && Math.hypot(p.cx(c) - off.x, p.cz(c) - off.z) > 1.8); return c >= 0 ? { x: p.cx(c), z: p.cz(c) } : open; })();
    look(aisle.x, y, aisle.z, r0.x, r0.z); run(90); log.push(`aisle by ${r0.name} at ${aisle.x.toFixed(1)}, ${aisle.z.toFixed(1)}`);
    // 3. sitting in an empty chair among them (a seat of theirs, if one is free; else the floor behind one of theirs)
    const empty = R.spots.filter(s => s.room?.name === name && s.seated && !s.by).sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
    const by = pick(c => p.lane[c] !== 3 && Math.hypot(p.cx(c) - off.x, p.cz(c) - off.z) < 4) ?? open, seat = empty ? { x: empty.x, y: empty.y + 1.5 + 2.45, z: empty.z, yaw: 0, label: 'sit' } : { x: by.x, y: y + 1.5 + 2.45, z: by.z, yaw: 0, label: 'sit' };
    look(seat.x, y, seat.z, cx, cz); walker.seated = seat; run(90); walker.seated = null; log.push(`seated at ${seat.x.toFixed(1)}, ${seat.z.toFixed(1)} (${empty ? 'an empty researcher\'s chair' : 'a seat by ' + r0.name})`);
    // 4. nobody sets off anywhere new; a minute and a half for everyone to come back and sit down
    L.hold = true; look(open.x, y, open.z, cx, cz); run(150);
    const here = R.all.filter(r => !r.hidden && (r.spot?.room?.name === name || fl.inRoom(name, r.x, r.z)));
    const back = here.filter(r => r.spot && r.spot.here && !r.away && Math.hypot(r.x - r.spot.x, r.z - r.spot.z) < 0.05 && r.seated === r.spot.seated);
    const twice = R.spots.filter(s => R.all.filter(r => r.spot === s).length > 1).length;
    out.rooms[name] = { cohort: who, scenarios: log, problems: A.counts, firstOfEach: A.list.slice(0, 8), present: here.length, backAtSpot: back.length, notBack: here.filter(r => !back.includes(r)).map(r => { const off = r.spot?.off; return `${r.name}: ${r.act}${r.away ? ' (away)' : ''} at ${r.x.toFixed(1)}, ${r.z.toFixed(1)}, task ${r.taskName}, ${off ? Math.hypot(off.x - r.x, off.z - r.z).toFixed(1) + ' ft from standoff, taken ' + W.taken(r, off.x, off.z, r.r + 0.9) + ', her ' + Math.hypot(off.x - W.visitor.x, off.z - W.visitor.z).toFixed(1) + ' ft from it' : 'no standoff'}`; }), spotsHeldTwice: twice, errands: R.all.reduce((a, r) => a + (r.errands ?? 0), 0) - e0 };
    L.hold = false;
  }
  // and then an ordinary stretch of the day, everyone free to move on, with her in the middle of the Museum's floor: how many walk
  // somewhere, whether anyone gets stuck on the way, and that none of them walks into her
  { const A = R.startAudit(), mus = R.spots.find(s => s.room?.name === 'Museum'), fl = R.L.floors.at(mus.site, mus.y), p = fl.plan, c = p.nearest(110, 60, 2, 20, false, c => p.lane[c] === 0 && R.all.every(r => r.hidden || Math.hypot(r.x - p.cx(c), r.z - p.cz(c)) > 2.6));
    for (const r of R.all) r.stintEnd = now + Math.random() * 120;
    const moves = R.all.map(r => (r.spot ?? r.dest)?.key); look(p.cx(c), fl.y, p.cz(c), 90, 60); run(300);      // (a spot she could be standing at: nobody is there when she arrives, as nobody would be)
    out.freeDay = { minutes: 5, problems: A.counts, firstOfEach: A.list.slice(0, 8), movedOn: R.all.filter((r, i) => (r.spot ?? r.dest)?.key !== moves[i]).length, walkingNow: R.all.filter(r => !r.hidden && !(r.spot?.here && !r.away)).map(r => r.name) }; }
  L.audit = null;
  { const mus = R.spots.find(s => s.room?.name === 'Museum'), fl = R.L.floors.at(mus.site, mus.y), t0 = performance.now(); fl.plan.rebuild(); out.museumFloorPlanRebuildMs = +(performance.now() - t0).toFixed(1); }
  out.cost = R.cost();
  out.simulatedMinutes = +((now - t0) / 60).toFixed(1);
  out.census = R.census();
  return JSON.stringify(out, null, 1);
}
