// Things about the grounds that are neither planting nor paving: what a laboratory of emergence on an island in the
// sky would have out of doors.
//
//   the waterwheel      at the spring: Malkus's chaotic waterwheel, leaking cups on a wheel under a steady stream. It
//                       turns one way, slows, and turns back, and never repeats: its equations are Lorenz's, and they
//                       are integrated here, every frame, to turn it
//   the chalkboard      at the end of the terrace: the same three equations in chalk, and the butterfly they draw
//                       (computed, not sketched)
//   umbrellas           over the terrace's three tables
//   the hives           three, at the top of the meadow, for the Collective Behaviour group
//   the gardener's yard behind the hall: a potting bench, two cold frames, a barrow, pots: somewhere for a gardener to be
//   a Klein bottle      on a plinth past the far mouth of the Hilbert walk (a scan: x_klein_bottle)

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAINT } from './tools.js';
import { TERRACE, RILL, SHED, TREES, HIVES, TERRACE_TABLES, groundAt } from '../campus.js';

const CEDAR = PAINT.cedar, CEDAR2 = 'c#7a6e5e/0.9', IRON = PAINT.iron, STONE = 'c#b7b0a0/0.95', GREEN = 'c#2f4a40/0.6';

// Lorenz's equations, one step (fourth-order Runge-Kutta)
export const lorenzStep = (s, dt, sigma = 10, rho = 28, beta = 8 / 3) => {
  const f = ([x, y, z]) => [sigma * (y - x), x * (rho - z) - y, x * y - beta * z], add = (a, b, k) => a.map((v, i) => v + b[i] * k);
  const k1 = f(s), k2 = f(add(s, k1, dt / 2)), k3 = f(add(s, k2, dt / 2)), k4 = f(add(s, k3, dt));
  return s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
};

export function follies(env) {
  const { K, G, B, stand, stake, setups, T } = env;

  // ---- the waterwheel ---------------------------------------------------------------------------------------
  {
    const [sx, sz] = RILL.pts.at(-1), cx = sx, cz = sz + 2.1, cy = 3.55, R = 2.5, y0 = groundAt(sx - 3.4, cz);
    // two A-frames of weathered timber astride the head of the rill, the axle between them
    for (const dz of [-0.62, 0.62]) { for (const sd of [-1, 1]) K.beam(CEDAR2, [cx + sd * 2.9, y0 - 0.4, cz + dz], [cx + sd * 0.12, cy + 0.35, cz + dz], 0.3, 0.24); K.beam(CEDAR2, [cx - 1.75, 1.5, cz + dz * 1.02], [cx + 1.75, 1.5, cz + dz * 1.02], 0.2, 0.16); }
    K.tube(IRON, [cx, cy, cz - 0.86], [cx, cy, cz + 0.86], 0.07, 8);
    K.collide(cx - 3, cx + 3, cz - 0.9, cz + 0.9, 7, -2);
    // the rain butt on its stand behind, and the spout from it over the top of the wheel
    const bz = cz + 2.3, by = 4.6;
    for (const [dx, dz] of [[-0.8, -0.7], [0.8, -0.7], [-0.8, 0.7], [0.8, 0.7]]) K.box(CEDAR2, cx + dx - 0.13, cx + dx + 0.13, -0.4, by, bz + dz - 0.13, bz + dz + 0.13);
    K.box(CEDAR, cx - 1.1, cx + 1.1, by, by + 0.14, bz - 1, bz + 1);
    K.lathe('c#6f5c48/0.9', cx, by + 0.14, bz, [[0.01, 0], [0.82, 0], [0.95, 0.9], [0.95, 1.7], [0.82, 2.6], [0.7, 2.6], [0.01, 2.56]], 14);
    for (const h of [0.35, 1.3, 2.25]) K.lathe(IRON, cx, by + 0.14 + h, bz, [[0.86 + (h === 1.3 ? 0.1 : 0.04), 0], [0.88 + (h === 1.3 ? 0.1 : 0.04), 0.05], [0.86 + (h === 1.3 ? 0.1 : 0.04), 0.1]], 14);
    K.tube(PAINT.brass, [cx + 0.25, by + 0.5, bz - 0.9], [cx + 0.25, cy + R + 0.62, cz + 0.05], 0.05, 6);
    K.collide(cx - 1.1, cx + 1.1, bz - 1, bz + 1, 8, -2);
    { const w = new THREE.PlaneGeometry(0.07, 0.5); w.translate(cx + 0.25, cy + R + 0.36, cz + 0.02); B.mesh('water', w); }      // the stream: a thread of water into the top cup
    stake(cx + 4.4, cz - 2.2, Math.PI, 'THE CLOUD SPRING', 'it rises here among the stones and runs to the pond', 'nobody has found where it comes from: the Laboratory is named for it');
    stake(cx - 4.6, cz - 1.6, Math.PI, 'THE WATERWHEEL', 'leaking cups under a steady stream: it turns, slows, and turns back', 'its three equations are Lorenz’s, and it never repeats');
    // the wheel itself is the one thing here that moves: a rim, eight spokes, twelve brass cups
    setups.push(({ scene, animated }) => {
      const parts = [], col = (g, hex) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); parts.push(g); };
      for (const dz of [-0.3, 0.3]) col(new THREE.TorusGeometry(R, 0.05, 5, 40).translate(0, 0, dz), 0x26241f);
      for (let i = 0; i < 8; i++) for (const dz of [-0.3, 0.3]) col(new THREE.CylinderGeometry(0.03, 0.03, R, 5).translate(0, R / 2, 0).rotateZ(i / 8 * Math.PI * 2).translate(0, 0, dz), 0x26241f);
      col(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 10).rotateX(Math.PI / 2), 0x3a3630);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; col(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 9, 1, true).translate(0, R, 0).rotateZ(a), 0x9a7a3c); col(new THREE.CircleGeometry(0.22, 9).rotateX(Math.PI / 2).translate(0, R - 0.25, 0).rotateZ(a), 0x7a6030); }      // (each cup is fixed to the rim, mouth outward)
      const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.9 }));
      m.name = 'waterwheel'; m.castShadow = true; m.position.set(cx, cy, cz); scene.add(m);
      let s = [0.6, 1.1, 21], last = null, angle = 0;
      animated.push(t => { const dt = last === null ? 0 : Math.min(0.1, Math.max(0, t - last)); last = t; for (let k = 0; k < 4; k++) s = lorenzStep(s, dt * 0.32 / 4); angle += s[0] * 0.085 * dt; m.rotation.z = angle; });      // the wheel's speed is Lorenz's x
    });
  }

  // ---- the terrace: umbrellas, and a chalkboard at its north end ------------------------------------------------
  {
    const T0 = TERRACE, y = T0.level + 0.11, CANVAS = PAINT.canvas;
    for (const { x, z } of TERRACE_TABLES) {
      K.cyl('c#8d806e/0.9', x, y + 2.47, y + 7.9, z, 0.06, 0.06, 6);
      const c = new THREE.ConeGeometry(3.7, 1.25, 8, 1); c.rotateY(Math.PI / 8 + x); c.translate(x, y + 7.2, z); K.put(CANVAS, c);
      K.sphere('c#8d806e/0.9', x, y + 7.95, z, 0.1);
    }
    const S = stand(T0.x1 - 1.1, T0.z0 + 6.6, -Math.PI / 2, y);
    for (const lx of [-3.3, 3.3]) S.box(CEDAR2, lx - 0.13, lx + 0.13, 0, 6.6, -0.13, 0.13);
    S.box(CEDAR2, -3.45, 3.45, 1.9, 6.4, -0.1, 0); S.box(CEDAR, -3.3, 3.3, 2.0, 2.14, 0, 0.32); S.block(0, 0, 0.4, 6); S.block(-2.6, 0, 0.4, 6); S.block(2.6, 0, 0.4, 6);
    S.sign(6.5, 4.1, 0, 4.25, 0.012, (g, w, h) => {
      g.fillStyle = '#2b3330'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(255,255,255,${0.012 + (i % 5) * 0.004})`; g.lineWidth = 14 + (i % 7) * 6; g.beginPath(); g.moveTo(((i * 131) % w), ((i * 71) % h)); g.lineTo(((i * 131) % w) + 160, ((i * 71) % h) + (i % 3 - 1) * 20); g.stroke(); }
      const chalk = 'rgba(238,236,224,.92)';
      T(g, 'ẋ = σ (y − x)', w * 0.04, h * 0.16, h * 0.085, chalk, { a: 'left', it: 1 }); T(g, 'ẏ = x (ρ − z) − y', w * 0.04, h * 0.3, h * 0.085, chalk, { a: 'left', it: 1 }); T(g, 'ż = x y − β z', w * 0.04, h * 0.44, h * 0.085, chalk, { a: 'left', it: 1 });
      T(g, 'σ = 10,  ρ = 28,  β = 8/3', w * 0.04, h * 0.6, h * 0.055, 'rgba(238,236,224,.75)', { a: 'left' });
      T(g, 'never the same loop twice.', w * 0.04, h * 0.74, h * 0.06, 'rgba(250,226,150,.9)', { a: 'left', it: 1 }); T(g, 'see the wheel at the spring', w * 0.04, h * 0.84, h * 0.05, 'rgba(238,236,224,.7)', { a: 'left', it: 1 });
      T(g, 'do not erase', w * 0.93, h * 0.94, h * 0.045, 'rgba(238,236,224,.6)', { a: 'right' });
      // the attractor itself, x against z, drawn by integrating the equations
      let s = [1, 1, 1]; g.strokeStyle = 'rgba(238,236,224,.5)'; g.lineWidth = 1.3; g.beginPath();
      for (let i = 0; i < 5200; i++) { s = lorenzStep(s, 0.006); const px = w * 0.72 + s[0] * w * 0.0125, py = h * 0.86 - s[2] * h * 0.0158; if (i < 300) continue; if (i === 300) g.moveTo(px, py); else g.lineTo(px, py); }
      g.stroke();
    }, { cw: 1040, ch: 656 });
  }

  // ---- the hives, at the top of the meadow ------------------------------------------------------------------------
  HIVES.forEach(({ x, z, yaw }, n) => {      // (where they stand is campus.js's HIVES: the bees read it too)
    const S = stand(x, z, yaw), boxes = [[PAINT.hive1, PAINT.hive2], [PAINT.hive3, PAINT.hive1, PAINT.hive4], [PAINT.hive2, PAINT.hive3]][n % 3];
    for (const [lx, lz] of [[-0.75, -0.6], [0.75, -0.6], [-0.75, 0.6], [0.75, 0.6]]) S.box(CEDAR2, lx - 0.09, lx + 0.09, -0.5, 1.0, lz - 0.09, lz + 0.09);
    S.box(CEDAR2, -0.95, 0.95, 1.0, 1.12, -0.8, 1.05);      // the stand, and the landing board
    boxes.forEach((c, i) => S.box(c, -0.85 + i * 0.006, 0.85 - i * 0.006, 1.12 + i * 0.8, 1.9 + i * 0.8, -0.7 + i * 0.006, 0.7 - i * 0.006));
    const top = 1.12 + boxes.length * 0.8; S.box(PAINT.slate, -0.95, 0.95, top, top + 0.16, -0.8, 0.8); S.box('c#111111/0.9', -0.3, 0.3, 1.14, 1.2, 0.69, 0.712 + n * 0.002); S.block(0, 0, 0.95, 4);
  });

  // ---- the gardener's yard, behind the hall --------------------------------------------------------------------------
  {
    G.ribbon('hoggin', [[158.6, 5], [166, 5.6], [175.5, 7]], 15, { wobble: 0.06 });
    // the potting bench against the hall's back wall, facing north
    const S = stand(161.4, 4, Math.PI / 2);
    for (const lx of [-3, 3]) { S.box(CEDAR2, lx - 0.13, lx + 0.13, -0.3, 5.6, -0.95, -0.7); S.box(CEDAR2, lx - 0.13, lx + 0.13, -0.3, 2.9, 0.7, 0.95); }
    for (let i = 0; i < 5; i++) S.box(CEDAR, -3.15, 3.15, 2.9, 3.02, -0.98 + i * 0.4, -0.98 + i * 0.4 + 0.37);      // the top, boards
    for (let i = 0; i < 4; i++) S.box(CEDAR, -3, 3, 0.9, 1.0, -0.8 + i * 0.42, -0.8 + i * 0.42 + 0.38);                // the shelf below
    S.box(CEDAR2, -3, 3, 3.02, 5.5, -0.98, -0.9); S.box(CEDAR, -3.15, 3.15, 5.5, 5.6, -1, -0.3); S.block(0, 0, 1.2, 5); S.block(-2.2, 0, 1.2, 5); S.block(2.2, 0, 1.2, 5);
    for (const [lx, s, plants] of [[-2.2, 0.42, [['herbs', 0.5]]], [-1.3, 0.34, []], [-0.6, 0.34, [['marigold', 0.5]]], [1.6, 0.5, [['lavender', 0.55]]]]) { const [wx, wz] = S.at(lx, 0.1); K.pot(wx, S.y + 3.02, wz, s, plants, { collide: false }); }
    for (const [lx, n] of [[-1.8, 4], [0.9, 3]]) for (let i = 0; i < n; i++) { const [wx, wz] = S.at(lx, 0); K.lathe(PAINT.terracotta, wx, S.y + 1.0 + i * 0.16, wz, [[0.3, 0], [0.42, 0.5], [0.46, 0.5], [0.46, 0.58], [0.4, 0.58], [0.3, 0.06]], 10, 1 - i * 0.03); }      // stacks of empty pots on the shelf
    // two cold frames: brick-red boxes, glass lids, one propped open
    [[168, -1.2, 0], [168, 5.2, 0.5]].forEach(([x, z, open]) => {
      const F = stand(x, z, 0);
      F.box(CEDAR2, -3, 3, -0.3, 1.0, -1.6, -1.48); F.box(CEDAR2, -3, 3, -0.3, 1.9, 1.48, 1.6); F.box(CEDAR2, -3, -2.88, -0.3, 1.0, -1.48, 1.48); F.box(CEDAR2, 2.88, 3, -0.3, 1.0, -1.48, 1.48); F.block(0, 0, 1.6, 2); F.block(-1.6, 0, 1.6, 2); F.block(1.6, 0, 1.6, 2);
      F.geo('soil', new THREE.BoxGeometry(5.76, 0.1, 2.96).translate(0, 0.45, 0));
      const tilt = Math.atan2(0.9, 3.1) + open, lid = (g, mat) => { g.translate(0, 0, -1.6); g.rotateX(-tilt); g.translate(0, 1.93, 1.55); F.geo(mat, g); };
      lid(new THREE.BoxGeometry(5.9, 0.04, 3.1), 'glass'); for (const lx of [-2.95, 0, 2.95]) lid(new THREE.BoxGeometry(0.14, 0.1, 3.2).translate(lx, 0, 0), CEDAR); for (const lz of [-1.55, 1.55]) lid(new THREE.BoxGeometry(6.04, 0.1, 0.14).translate(0, 0, lz), CEDAR);
      if (open) F.beam(CEDAR, [2.2, 1.0, -1.3], [2.2, 2.35, -1.02], 0.08);
      for (let i = 0; i < 9; i++) { const [wx, wz] = F.at(-2.4 + (i % 5) * 1.2, i < 5 ? -0.6 : 0.6); K.F.add(i % 3 === 0 ? 'marigold' : i % 3 === 1 ? 'herbs' : 'strawberry', wx, wz, 0.7, { y: F.y + 0.56 }); }
    });
    // the barrow, left where the work stopped
    { const W = stand(172.5, 10.5, 2.3), TRAY = 'c#3f5a48/0.7';
      W.geo(TRAY, new THREE.BoxGeometry(2.1, 0.9, 3).translate(0, 1.75, 0)); W.geo('soil', new THREE.BoxGeometry(1.9, 0.3, 2.8).translate(0, 2.12, 0));
      W.geo(IRON, new THREE.CylinderGeometry(0.62, 0.62, 0.22, 14).rotateZ(Math.PI / 2).translate(0, 0.62, 1.9));
      for (const sx of [-1, 1]) { W.beam(CEDAR, [sx * 0.75, 1.3, 2.0], [sx * 0.95, 2.0, -3.1], 0.12); W.beam(IRON, [sx * 0.7, 1.3, -1.0], [sx * 0.8, 0, -1.3], 0.08); W.beam(IRON, [sx * 0.5, 1.3, 1.5], [sx * 0.16, 0.62, 1.9], 0.07); }
      W.block(0, 0, 1.4, 2.4); for (const [lx, lz, k] of [[-0.3, 0.4, 'fern'], [0.4, -0.5, 'hosta']]) { const [wx, wz] = W.at(lx, lz); K.F.add(k, wx, wz, 0.7, { y: W.y + 2.2 }); } }
    for (const [x, z, s] of [[163, 10.4, 0.9], [164.4, 11.6, 0.6], [162.6, -2.4, 0.75]]) K.pot(x, groundAt(x, z), z, s, s > 0.7 ? [['fern', 0.8]] : []);
    // a spade and a fork leaning on the wall by the bench
    for (const [lx, head] of [[3.8, 0.34], [4.5, 0.26]]) { const [ax, az] = S.at(lx, -0.2), [bx, bz] = S.at(lx + 0.1, -1.05); K.tube(CEDAR, [ax, S.y + 0.7, az], [bx, S.y + 4.6, bz], 0.045, 6); K.box(IRON, ax - 0.03, ax + 0.03, S.y - 0.1, S.y + 0.75, az - head, az + head); }
  }

  // ---- a Klein bottle on a plinth, beyond the far mouth of the Hilbert walk ---------------------------------------------
  {
    const x = -138.2, z = -104.5, S = stand(x, z, 0.6);
    S.box(STONE, -1.25, 1.25, -0.6, 0.4, -1.25, 1.25); S.box(STONE, -1, 1, 0.4, 2.7, -1, 1); S.box(STONE, -1.12, 1.12, 2.7, 2.9, -1.12, 1.12); S.block(0, 0, 1.25, 7);
    K.model('x_klein_bottle', x, z, 0.6, { y: S.y + 2.9, scale: 5.2 });
    stake(x + 2.6, z + 1.3, Math.PI / 4, 'A KLEIN BOTTLE', 'one side, no edge, no inside and no outside', 'in three dimensions it must pass through itself: in four it need not');
  }
}

// ---- the philosophers' court -----------------------------------------------------------------------------------------
// Behind Schwab Academy (the little stone library), out of its back door: a gravelled court between two yew hedges,
// open to the east over a low box hedge, where the island ends and the sky begins. A bench against the wall, an iron
// table with a chess study left on it, a birdbath, wisteria over the door, and Chrysippos on a pillar among the ferns.
// A step is added at the back door, at the door in the north end and at the French window on the front; campus.js has
// the path round to the first two.
export function philosophersCourt(env) {
  const { K, G, F, B, stand, stake } = env, Y = groundAt(-2, 128), X0 = -12, X1 = 8.5, Z0 = 121, Z1 = 135.6, WALL = 120.7;
  // the three doorsteps: at the back door, at the door in the north end, and at the French window on the front. Each runs
  // back under the sill to the granite base course (they stood a third of a foot off it, and the grass showed in the
  // slot under the sill); the front one stands on the flags laid before that window, which lie half a foot short of the
  // wall: it closes that strip too, and halves the rise of more than a foot from the flags to the sill
  K.box(STONE, -4.6, 1.1, Y - 0.5, Y + 0.66, 120.77, 122.5); K.surface(-4.6, 1.1, 120.75, 122.5, Y + 0.66);
  K.box(STONE, 17.22, 19.1, Y - 0.5, Y + 0.66, 106, 110.6); K.surface(17.2, 19.1, 106, 110.6, Y + 0.66);
  { const y = groundAt(8.6, 95.3); K.box(STONE, 6.4, 10.8, y - 0.5, y + 0.66, 94.75, 95.83); K.surface(6.4, 10.8, 94.75, 95.85, y + 0.66); }
  // the floor: gravel in a brick border
  G.rect('hoggin', X0, X1, Z0, Z1);
  for (const [x0, x1, z0, z1] of [[X0, X1, Z1 - 0.55, Z1], [X0, X0 + 0.55, Z0, Z1 - 0.55], [X1 - 0.55, X1, Z0, Z1 - 0.55]]) G.rect('edging', x0, x1, z0, z1);
  // the hedges: yew, five feet, down both sides (the path comes in through a gap on the north); box, two feet, across the end
  for (const pts of [[[X0 - 0.9, 121.5], [X0 - 0.9, 128.5], [X0 - 0.9, 136.4]], [[X1 + 0.9, 121.5], [X1 + 0.9, 126.3]], [[X1 + 0.9, 131.1], [X1 + 0.9, 136.4]]]) {
    G.hedge('boxwood', pts, 1.5, 5.1); const a = pts[0], b = pts.at(-1); K.collide(a[0] - 0.7, a[0] + 0.7, a[1] - 0.7, b[1] + 0.7, Y + 5.2, Y - 2);
  }
  G.hedge('boxwood', [[X0 + 0.1, 136.5], [-2, 136.5], [X1 - 0.1, 136.5]], 1.15, 2.1, { ends: 0 }); K.collide(X0, X1, 135.95, 137.05, Y + 2.2, Y - 2);
  // the bench against the wall; the table and its two chairs
  K.bench(4.7, WALL + 1.55, 0, { y: Y }); K.seat(4.7, Y + 1.4, WALL + 1.55, Math.PI, 'sit in the philosophers’ court');
  {
    const x = -6, z = 129.6, y = Y + 0.07, top = y + 2.47;
    K.lathe(IRON, x, y, z, [[0.01, 0], [0.72, 0], [0.72, 0.07], [0.1, 0.2], [0.07, 2.3], [0.26, 2.4], [0.01, 2.4]], 12); K.cyl(PAINT.white, x, y + 2.4, top, z, 1.12, 1.12, 20); K.collide(x - 0.9, x + 0.9, z - 0.9, z + 0.9, y + 2.5, y);
    for (const sd of [-1, 1]) {
      const cz = z + sd * 2.05, cx = x;
      K.cyl(GREEN, cx, y + 1.42, y + 1.5, cz, 0.62, 0.62, 12);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.tube(IRON, [cx + 0.42 * a, y, cz + 0.42 * b], [cx + 0.36 * a, y + 1.42, cz + 0.36 * b], 0.03, 4);
      const back = [-0.5, -0.25, 0, 0.25, 0.5].map(t => [cx + t * 1.1, y + 2.9 - Math.abs(t) * 0.5, cz + sd * 0.56]);
      K.tube(IRON, [cx + 0.5, y + 1.46, cz + sd * 0.5], back[4], 0.03, 4); K.tube(IRON, [cx - 0.5, y + 1.46, cz + sd * 0.5], back[0], 0.03, 4); for (let i = 0; i < 4; i++) K.tube(IRON, back[i], back[i + 1], 0.03, 4);
      K.seat(cx, y + 1.5, cz, sd > 0 ? 0 : Math.PI, 'sit at the chess table');
    }
    // the board, and on it Réti's study of 1921 (White: king h8, pawn c6. Black: king a6, pawn h5. White to move, and draw)
    const Q = 0.165, bx = x - 4 * Q, bz = z - 4 * Q, DARK = 'c#4a3a2c/0.7', LIGHT = 'c#e4d8b8/0.7';
    K.box(LIGHT, bx - 0.05, bx + 8 * Q + 0.05, top, top + 0.03, bz - 0.05, bz + 8 * Q + 0.05);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) K.box(DARK, bx + i * Q, bx + (i + 1) * Q, top + 0.03, top + 0.036, bz + j * Q, bz + (j + 1) * Q);      // a1 is dark
    const man = (file, rank, white, king) => { const px = bx + (file + 0.5) * Q, pz = bz + (rank - 0.5) * Q, c = white ? 'c#efe7d2/0.6' : 'c#26221e/0.6', h = king ? 0.27 : 0.15; K.cyl(c, px, top + 0.036, top + 0.036 + h, pz, king ? 0.055 : 0.045, king ? 0.035 : 0.03, 8); K.sphere(c, px, top + 0.036 + h + (king ? 0.035 : 0.03), pz, king ? 0.05 : 0.04); };
    man(7, 8, true, true); man(2, 6, true, false); man(0, 6, false, true); man(7, 5, false, false);
    stake(x - 3.3, z + 1.2, Math.PI / 2, 'WHITE TO MOVE AND DRAW', 'Réti, 1921: a king too far from either pawn', 'he walks one diagonal toward both at once, and arrives');
  }
  // a birdbath
  { const x = 3.4, z = 131.4; K.lathe(STONE, x, Y - 0.3, z, [[0.01, 0], [0.8, 0], [0.8, 0.5], [0.34, 0.7], [0.28, 2.5], [0.5, 2.75], [1.3, 3.0], [1.36, 3.22], [1.2, 3.22], [1.1, 3.06], [0.01, 2.96]], 16); const w = new THREE.CircleGeometry(1.12, 18); w.rotateX(-Math.PI / 2); w.translate(x, Y - 0.3 + 3.15, z); B.mesh('water', w); K.collide(x - 0.8, x + 0.8, z - 0.8, z + 0.8, Y + 3, Y); }
  // Chrysippos, who made a logic of "if" and "or": a scan of the portrait (x_chrysippos), on a pillar in the corner by the wall
  { const x = -9.4, z = 123.6, S = stand(x, z, 0.5, Y); S.box(STONE, -0.8, 0.8, -0.5, 0.4, -0.8, 0.8); S.box(STONE, -0.6, 0.6, 0.4, 3.9, -0.6, 0.6); S.box(STONE, -0.72, 0.72, 3.9, 4.08, -0.72, 0.72); S.block(0, 0, 0.8, 6.5);
    K.model('x_chrysippos', x, z, 0.5, { y: Y + 4.08, scale: 1.7 });
    stake(x + 2.5, z + 1.2, 0.5, 'CHRYSIPPOS', 'the Stoic who made a logic of “if”, “and” and “or”', 'two thousand years before anyone built it of switches'); }
  // ferns and hostas at the feet of the hedges and round the pillar; two pots by the door; a lantern on a short post
  const r = (() => { let s = 77; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  for (let z = 122.4; z < 135; z += 1.5) { F.add(r() < 0.65 ? 'fern' : 'hosta', X0 + 0.9 + r() * 0.9, z + r() * 0.6, 0.9 + r() * 0.5, { y: Y + 0.05 }); if (z < 125.6 || z > 131.6) F.add(r() < 0.6 ? 'fern' : 'hosta', X1 - 0.9 - r() * 0.9, z + r() * 0.6, 0.9 + r() * 0.5, { y: Y + 0.05 }); }
  for (let x = X0 + 2.2; x < X1 - 1.6; x += 1.45) F.add(x > -4.5 && x < 1 ? 'lavender' : r() < 0.5 ? 'catmint' : 'lavender', x + r() * 0.5, 134.9 - r() * 0.6, 0.85 + r() * 0.2, { y: Y + 0.05 });      // lavender along the low hedge, under the view
  for (const [x, plants] of [[-6.2, [['fern', 1.1]]], [2.2, [['hosta', 1.6], ['fern', 0.6, 0.3, 0.2]]]]) K.pot(x, Y, WALL + 1.2, 1.15, plants);
  { const x = 7.2, z = 134.2; K.cyl(IRON, x, Y - 0.3, Y + 5.6, z, 0.07, 0.05, 8); K.lathe(IRON, x, Y + 6.3, z, [[0.3, 0], [0.06, 0.26], [0.01, 0.3]], 8); B.mesh('e#ffe2b4/1.7', new THREE.SphereGeometry(0.3, 12, 8).translate(x, Y + 5.95, z)); K.lamp(x, Y + 5.9, z, 0.9); K.collide(x - 0.3, x + 0.3, z - 0.3, z + 0.3, Y + 6, Y); }
  // wisteria: two stems up the wall either side of the door and a third along above it, racemes hanging
  { const zw = WALL + 0.22, H = Y + 10.4, pts = [[-6.9, Y - 0.2], [-6.6, Y + 5], [-6.2, H - 0.4], [-4, H + 0.1], [-1.6, H], [1, H + 0.15], [3.2, H - 0.3], [3.5, Y + 5.2], [3.9, Y - 0.2]];
    for (let i = 0; i < pts.length - 1; i++) K.tube(PAINT.bark, [pts[i][0], pts[i][1], zw + (i % 2) * 0.03], [pts[i + 1][0], pts[i + 1][1], zw + ((i + 1) % 2) * 0.03], i === 0 || i === pts.length - 2 ? 0.1 : 0.07, 6);
    for (let x = -6.6; x < 3.6; x += 0.62) F.add('wisteria', x + r() * 0.3, zw + 0.25 + r() * 0.15, 0.75 + r() * 0.45, { y: H + 0.25 - Math.abs(x + 1.5) * 0.04 });
    for (const [x, y] of [[-6.5, Y + 8], [-6.7, Y + 6.2], [3.4, Y + 8.2], [3.6, Y + 6.4]]) F.add('wisteria', x, zw + 0.3, 0.7, { y }); }
  stake(X1 + 3.2, 132.6, Math.PI / 2 - 0.5, 'THE PHILOSOPHERS’ COURT', 'given by nobody in particular, for arguing in', 'the view is thrown in');
}

// ---- the groundskeeper's shed ---------------------------------------------------------------------------------------------
// In the yard behind the hall (campus.js: SHED). Boarded walls, a slate roof, a wide door standing open on the tools;
// inside, room by the door for a mower (4 ft by 6), shelves, sacks, a hose on its reel; a water butt at the corner;
// mown stripes on the lawn beside it.
export function shed(env) {
  const { K, G, B, stand } = env, S = stand(SHED.x, SHED.z, SHED.yaw), HW = SHED.w / 2, HD = SHED.d / 2, EAVE = 6.6, RIDGE = 9.4, T = 0.28;
  const WALLC = 'c#6f8073/0.85', TRIM = 'c#e6dfcb/0.8', FLOOR = 'c#8a8172/0.95', SLATE = PAINT.slate, DOORW = 2.7;      // (half the doorway)
  S.box(FLOOR, -HW, HW, -0.4, 0.1, -HD, HD);
  S.box(WALLC, -HW, HW, 0.1, EAVE, -HD, -HD + T); S.block(0, -HD + T / 2, 0, 0);                                           // back
  for (const sx of [-1, 1]) {
    S.box(WALLC, sx * DOORW, sx * HW, 0.1, EAVE, HD - T, HD);                                                              // the front, either side of the doorway
    const g = new THREE.Shape([[-HD, 0.1], [HD, 0.1], [HD, EAVE], [0, RIDGE], [-HD, EAVE]].map(([a, b]) => new THREE.Vector2(a, b))), e = new THREE.ExtrudeGeometry(g, { depth: T, bevelEnabled: false }); e.rotateY(-Math.PI / 2); e.translate(sx * HW - (sx > 0 ? 0 : -T), 0, 0); S.geo(WALLC, e);      // the gable ends
    S.box(TRIM, sx * DOORW - 0.12, sx * DOORW + 0.12, 0.1, EAVE - 0.3, HD - 0.02, HD + 0.06);                                // the door's posts
    const roof = new THREE.BoxGeometry(SHED.w + 1.2, 0.2, Math.hypot(HD + 0.7, RIDGE - EAVE + 0.5)); roof.rotateX(sx * Math.atan2(RIDGE - EAVE, HD)); roof.translate(0, (RIDGE + EAVE) / 2 + 0.16, sx * (HD + 0.5) / 2); S.geo(SLATE, roof);
  }
  S.box(WALLC, -DOORW, DOORW, EAVE - 0.5, EAVE, HD - T, HD); S.box(TRIM, -DOORW - 0.12, DOORW + 0.12, EAVE - 0.56, EAVE - 0.3, HD - 0.01, HD + 0.07);      // over the doorway
  S.box(TRIM, -HW - 0.6, HW + 0.6, RIDGE + 0.22, RIDGE + 0.36, -0.14, 0.14);                                                 // the ridge
  for (let x = -HW + 0.5; x < HW; x += 1) for (const z of [-HD - 0.03, HD + 0.03]) if (z < 0 || Math.abs(x) > DOORW + 0.3) S.box('c#4a5a4e/0.85', x - 0.07, x + 0.07, 0.1, EAVE, z - 0.03, z + 0.03);      // battens over the boards' joints
  // the walker's walls (the doorway is open)
  const wall = (x0, x1, z0, z1) => { const a = S.at(x0, z0), b = S.at(x1, z1); K.collide(a[0], b[0], a[1], b[1], S.y + 8, S.y - 1); };
  wall(-HW, HW, -HD, -HD + T); wall(-HW, -HW + T, -HD, HD); wall(HW - T, HW, -HD, HD); wall(-HW, -DOORW, HD - T, HD); wall(DOORW, HW, HD - T, HD);
  // the door leaves, standing open against the front
  for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(DOORW - 0.1, EAVE - 0.7, 0.12); g.translate(sx * (DOORW - 0.1) / 2, 0, 0); g.rotateY(sx * -0.28); g.translate(sx * (DOORW + 0.1), (EAVE - 0.5) / 2 + 0.1, HD + 0.1); S.geo('c#7a3b30/0.8', g); }      // (folded back against the front, a little ajar: oxblood paint)
  // inside: shelves along the back with pots and seed trays, sacks in a corner, a hose reel on the end wall, rakes
  for (const h of [3.0, 4.6]) S.box(CEDAR, -HW + 0.4, HW - 0.4, h, h + 0.09, -HD + T, -HD + T + 0.95);
  for (const [lx, s] of [[-3.6, 0.36], [-2.9, 0.3], [-2.2, 0.36], [0.4, 0.32], [3.2, 0.38]]) { const [wx, wz] = S.at(lx, -HD + 0.75); K.pot(wx, S.y + 3.09, wz, s, [], { collide: false }); }
  for (const lx of [-1.2, 1.6, 2.5]) S.box('c#3b3f3a/0.9', lx - 0.4, lx + 0.4, 4.69, 4.82, -HD + 0.36, -HD + 1.1);                // seed trays
  for (const [lx, lz, sy] of [[-4, 2.6, 1], [-3.9, 1.3, 0.85], [-3.2, 2.9, 0.7]]) { const [wx, wz] = S.at(lx, lz); K.sphere('c#b9a67c/0.95', wx, S.y + 0.1 + 0.62 * sy, wz, 0.8, 0.75 * sy, 1, 1, 0.7); }      // sacks
  { const [wx, wz] = S.at(HW - T - 0.25, -1.4); const reel = new THREE.TorusGeometry(0.62, 0.17, 8, 18); reel.rotateY(Math.PI / 2); reel.translate(wx, S.y + 3.6, wz); K.put('c#3f6b4a/0.7', reel); }      // the hose, coiled on the end wall
  for (const [lx, head] of [[3.9, 0.5], [4.3, 0.28]]) { const a = S.at(lx, -HD + 1.0), b = S.at(lx + 0.05, -HD + 0.45); K.tube(CEDAR, [a[0], S.y + 0.2, a[1]], [b[0], S.y + 5.4, b[1]], 0.045, 6); K.box(IRON, a[0] - head, a[0] + head, S.y + 0.1, S.y + 0.42, a[1] - 0.03, a[1] + 0.03); }
  // a water butt at the front corner
  { const [wx, wz] = S.at(HW + 1.3, HD - 1.2); K.lathe('c#4c5a50/0.8', wx, S.y - 0.2, wz, [[0.01, 0], [0.85, 0], [1.0, 1.2], [1.0, 2.6], [0.88, 3.7], [0.01, 3.7]], 14); K.collide(wx - 0.9, wx + 0.9, wz - 0.9, wz + 0.9, S.y + 3.6, S.y); K.tube(IRON, [wx - 0.6, S.y + EAVE, wz], [wx - 0.3, S.y + 3.8, wz], 0.07, 6); }
  // (the lawns are mown in stripes by the island's own grass now: island.js)
}

// ---- petals -----------------------------------------------------------------------------------------------------------------
// A few petals let go by the cherries and magnolias, carried across the grass by the same wind that moves the leaves.
export function petals(env) {
  env.setups.push(({ scene, animated }) => {
    const src = TREES.filter(t => t.kind === 'cherry' || t.kind === 'magnolia'); if (!src.length) return;
    const N = 90, g = new THREE.PlaneGeometry(0.2, 0.14), m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0xf3c9d6, roughness: 0.8, side: THREE.DoubleSide }), N);
    m.name = 'petals'; m.frustumCulled = false; scene.add(m);
    let seed = 99; const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296), P = Array.from({ length: N }, () => ({ t0: -r() * 40 }));
    const born = (p, t) => { const s = src[Math.floor(r() * src.length)], a = r() * 6.28, d = r() * s.height * 0.4; p.x = s.x + Math.cos(a) * d; p.z = s.z + Math.sin(a) * d; p.y = s.y + s.height * (0.45 + r() * 0.4); p.t0 = t; p.spin = 2 + r() * 4; p.ph = r() * 6.28; p.fall = 0.9 + r() * 0.9; p.rest = 4 + r() * 10; p.down = null; };
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1); let last = null;
    animated.push(t => {
      const dt = last === null ? 0 : Math.min(0.1, Math.max(0, t - last)); last = t;
      const gust = 0.55 + 0.45 * Math.sin(t * 0.19) ;      // (in step with the leaves' swell)
      P.forEach((p, i) => {
        if (p.x === undefined || (p.down !== null && t - p.down > p.rest)) born(p, t + (p.x === undefined ? p.t0 : 0));
        if (t < p.t0) { M.makeScale(0, 0, 0); m.setMatrixAt(i, M); return; }
        if (p.down === null) {
          p.x += (-1.6 * gust + 0.5 * Math.sin(t * 1.3 + p.ph)) * dt; p.z += (2.4 * gust + 0.6 * Math.cos(t * 1.1 + p.ph)) * dt; p.y -= p.fall * dt;
          const gr = groundAt(p.x, p.z) + 0.12; if (p.y <= gr) { p.y = gr; p.down = t; }
          E.set(t * p.spin + p.ph, t * 0.7 + p.ph, t * p.spin * 0.6);
        } else E.set(-Math.PI / 2, 0, p.ph);
        M.compose(V.set(p.x, p.y, p.z), Q.setFromEuler(E), ONE); m.setMatrixAt(i, M);
      });
      m.instanceMatrix.needsUpdate = true;
    });
  });
}
