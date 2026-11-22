// The walk every change should survive: from the Landing across the green to each site's door and back; and with
// ?layout=rise or court, in at the Stone Library's door, up its stair, and to a window. Run it with
//   python3 tools/drive.py "at=landing&time=13" "$(cat tools/walk_test.js)"
// It walks with the page's own walker (window.__house.walkTo: collisions, stairs, the lie of the land) and
// returns where each leg ended. A leg that did not arrive says arrived: false.
(async () => {
  const H = window.__house, C = H.campus, S = C.sites, out = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const k = { east: 0, north: 1, west: 2, south: 3 };
  const pt = (s, X, Y) => { const t = k[s.facing] * Math.PI / 2, c = Math.round(Math.cos(t)), n = Math.round(Math.sin(t)); return [s.origin[0] + X * c - Y * n, s.origin[1] - X * n - Y * c]; };
  const leg = async (name, x, z, o) => { const r = await H.walkTo(x, z, { run: true, ...o }); out.push({ leg: name, ...r, ground: +H.groundAt(r.x, r.z).toFixed(2) }); return r; };
  const pair = !S.stone || S.stone.facing === 'west';      // the usual arrangement has only the hall and the library
  await leg('landing to the green', ...(pair ? [-30, -6] : [-14, 70]));
  await leg('to Snow Hall door', ...pt(S.snow, S.snow.door[0], -8));
  await leg('to the Library door', ...pt(S.library, S.library.door[0], -8));
  if (pair) { await leg('back to the landing', C.spawn.x, C.spawn.z); return out; }
  await leg('back to the long walk', -17, 44);
  const st = S.stone, dX = st.door[0];
  await leg('to the Stone Library path end', ...pt(st, dX, -8));
  if (C.rooms.some(r => r.name === 'Upper schoolroom')) {
    // the stand-in (example.js): up the steps, open the door, in, up the stair, to the window in the upper room
    await leg('up the steps', ...pt(st, dX, -2), { run: false, near: 0.5, pitch: -0.4 });      // (looking at the door, not over it)
    await sleep(300); H.use(); await sleep(1200);
    out.push({ leg: 'door', open: C.doors.filter(d => d.site === 'stone' && d.exterior).map(d => !!d.isOpen) });
    await leg('in at the door', ...pt(st, dX, 3.5), { run: false, near: 0.5 });
    await leg('up the stair', ...pt(st, dX, 20.5), { run: false, near: 0.6 });
    await leg('across the upper room', ...pt(st, dX - 8, 20.5), { run: false, near: 0.6 });
    await leg('to the side window', ...pt(st, dX - 12.4, 12), { run: false, near: 0.8 });
    const [wx, wz] = pt(st, dX - 40, 12); H.walker.yaw = Math.atan2(-(wx - H.walker.pos.x), -(wz - H.walker.pos.z)); H.walker.pitch = -0.08; await sleep(600);      // look out of it
  }
  return out;
})()
