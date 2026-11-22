// A colony of ants that finds its own road. Nothing draws the trail: it is what the ants make of two simple rules
// (the model is the classroom one: Deneubourg's double-bridge ants, Resnick's "Ants" in StarLogo, 1994).
//
//   an ant out looking for food lays "home" scent as it goes, less of it the longer it has been out, and steers by the
//   "food" scent it smells ahead: it tests three places (ahead, a little left, a little right) and turns to the strongest;
//   smelling nothing, it wanders
//   an ant that has found food turns round, lays "food" scent (less the longer it has been carrying), and steers the
//   same way by the "home" scent, with a slight sense of which way home lies (ants count their steps)
//   both scents evaporate
//
// So the first ants to stumble on the food come back along something like the way they went, the next ones out follow
// what they left, short ways get more scent per minute than long ones, and within a minute or two there is a road.
// Put something in the way (stand on it: they give way to feet) and it mends round.
//
// The scents are two small grids over the patch of ground between the nest and the food; cells the colony may not use
// (a walk, a table leg, the water) are found once. Drawn as one set of points: one draw call. Nothing is allocated
// per frame. Ants are small: the colony only runs while the visitor is within a few yards.
//
// S: { nest: [x, z], food: [x, z], n, cell (ft), pad (ft round the two), speed (ft/s), size (ft, how big a dot),
//      colour, open(x, z): where an ant may go (kit.free if not given: ants can be let under things), when }

import * as THREE from 'three';
import { TAU, rng } from './kit.js';

export function ants(kit, S) {
  const { ctx, cam, scene, tag, free, groundAt, add } = kit, r = rng(S.seed ?? 1994), N = S.n ?? 60;
  const CELL = S.cell ?? 0.3, PAD = S.pad ?? 4, SPEED = S.speed ?? 0.9, [nx, nz] = S.nest, [fx, fz] = S.food;
  const x0 = Math.min(nx, fx) - PAD, z0 = Math.min(nz, fz) - PAD, W = Math.ceil((Math.max(nx, fx) + PAD - x0) / CELL), H = Math.ceil((Math.max(nz, fz) + PAD - z0) / CELL);
  const home = new Float32Array(W * H), food = new Float32Array(W * H), open = new Uint8Array(W * H), gy = new Float32Array(W * H);
  const ax = new Float32Array(N), az = new Float32Array(N), ah = new Float32Array(N), age = new Float32Array(N), carry = new Uint8Array(N);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const idx = (x, z) => { const i = Math.floor((x - x0) / CELL), j = Math.floor((z - z0) / CELL); return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i; };
  const smell = (f, x, z) => { const k = idx(x, z); return k < 0 || !open[k] ? -1 : f[k]; };
  const uPx = { value: 600 }, uSize = { value: S.size ?? 0.07 }; let pts = null, trips = 0, evap = 0;
  const REACH = 0.7, SENSE = 0.75, SPREAD = 0.7;
  const step = (dt, feetX, feetZ) => {
    for (let i = 0; i < N; i++) {
      const seek = carry[i] ? home : food; let h = ah[i];
      const a = smell(seek, ax[i] + Math.cos(h) * SENSE, az[i] + Math.sin(h) * SENSE), l = smell(seek, ax[i] + Math.cos(h - SPREAD) * SENSE, az[i] + Math.sin(h - SPREAD) * SENSE), rr = smell(seek, ax[i] + Math.cos(h + SPREAD) * SENSE, az[i] + Math.sin(h + SPREAD) * SENSE);
      if (a < 0 && l < 0 && rr < 0) h += Math.PI * (0.6 + 0.8 * r());                                   // nowhere to go ahead: about turn
      else if (Math.max(a, l, rr) > 0.02) { if (l > a && l >= rr) h -= SPREAD * 0.5; else if (rr > a && rr > l) h += SPREAD * 0.5; h += (r() - 0.5) * 0.35; }
      else h += (r() - 0.5) * 1.5;                                                                     // nothing to smell: it wanders
      if (carry[i]) { const want = Math.atan2(nz - az[i], nx - ax[i]); h += Math.atan2(Math.sin(want - h), Math.cos(want - h)) * 0.12; }      // a sense of the way home
      const fd = Math.hypot(ax[i] - feetX, az[i] - feetZ); if (fd < 2.2) { const away = Math.atan2(az[i] - feetZ, ax[i] - feetX); h += Math.atan2(Math.sin(away - h), Math.cos(away - h)) * 0.6; }      // out from under her feet
      const x = ax[i] + Math.cos(h) * SPEED * dt, z = az[i] + Math.sin(h) * SPEED * dt, k = idx(x, z);
      if (k < 0 || !open[k]) { ah[i] = h + Math.PI * (0.5 + r()); continue; }
      ax[i] = x; az[i] = z; ah[i] = h; age[i] += dt;
      const lay = Math.max(0, 1 - age[i] / 45) * dt * 2.2; if (carry[i]) food[k] = Math.min(4, food[k] + lay); else home[k] = Math.min(4, home[k] + lay);
      if (!carry[i] && Math.hypot(x - fx, z - fz) < REACH) { carry[i] = 1; age[i] = 0; ah[i] = h + Math.PI; }
      else if (carry[i] && Math.hypot(x - nx, z - nz) < REACH) { carry[i] = 0; age[i] = 0; ah[i] = h + Math.PI; trips++; }
    }
    evap += dt; if (evap > 0.5) { const k = Math.exp(-evap / 28); for (let c = 0; c < home.length; c++) { home[c] *= k; food[c] *= k; } evap = 0; }
  };
  add({
    name: S.name ?? 'ants', x: (nx + fx) / 2, z: (nz + fz) / 2, load: S.load ?? 90, live: S.live ?? 70, when: S.when,
    init: async () => {
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = x0 + (i + 0.5) * CELL, z = z0 + (j + 0.5) * CELL; open[j * W + i] = (S.open ?? free)(x, z, 0.05) ? 1 : 0; gy[j * W + i] = groundAt(x, z) + 0.035; }
      for (const [x, z] of [S.nest, S.food]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const k = idx(x + i * CELL, z + j * CELL); if (k >= 0) open[k] = 1; }
      for (let i = 0; i < N; i++) { ax[i] = nx + (r() - 0.5); az[i] = nz + (r() - 0.5); ah[i] = r() * TAU; }
      for (let k = 0; k < 2400; k++) step(0.1, 1e6, 1e6);                                                // four minutes on their own first: the road is there when she finds them
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const dark = new THREE.Color(S.colour ?? 0x1a1210), crumb = new THREE.Color(0xd9c9a0);
      for (let i = 0; i < N; i++) dark.toArray(col, i * 3);
      pts = tag(new THREE.Points(geo, new THREE.ShaderMaterial({
        uniforms: { uPx, uSize }, vertexColors: true,
        vertexShader: `uniform float uPx, uSize; varying vec3 vC;
void main() { vC = color; vec4 mv = viewMatrix * vec4(position, 1.0); gl_PointSize = clamp(uPx * uSize / max(0.5, -mv.z), 1.6, 18.0); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vC;
void main() { vec2 d = gl_PointCoord * 2.0 - 1.0; if (dot(d * vec2(1.0, 1.6), d * vec2(1.0, 1.6)) > 1.0) discard; gl_FragColor = vec4(vC, 1.0); }`,
      }))); pts.frustumCulled = false; pts.name = S.name ?? 'ants'; scene.add(pts);
      pts.userData.crumb = crumb; pts.userData.dark = dark;
    },
    show: on => { pts.visible = on; },
    think: () => { uPx.value = ctx.renderer.domElement.height / (2 * Math.tan((ctx.camera.fov ?? 60) * Math.PI / 360)); },
    tick: (t, dt) => {
      step(Math.min(dt, 0.05), cam.x, cam.z);
      const dark = pts.userData.dark, crumb = pts.userData.crumb;
      for (let i = 0; i < N; i++) { const k = idx(ax[i], az[i]); pos[i * 3] = ax[i]; pos[i * 3 + 1] = k >= 0 ? gy[k] : 0; pos[i * 3 + 2] = az[i]; const c = carry[i] ? crumb : dark; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;
    },
    // how much of the colony is on the road: within 1.5 ft of the straight line between nest and food
    check: () => { let on = 0, c = 0; const dx = fx - nx, dz = fz - nz, L = Math.hypot(dx, dz); for (let i = 0; i < N; i++) { const t = Math.max(0, Math.min(1, ((ax[i] - nx) * dx + (az[i] - nz) * dz) / (L * L))); if (Math.hypot(ax[i] - nx - dx * t, az[i] - nz - dz * t) < 1.5) on++; c += carry[i]; } return { x: ax[0], y: 0, z: az[0], n: N, onRoad: on, carrying: c, trips, grid: W + 'x' + H, blockedCells: open.reduce((s, v) => s + (v ? 0 : 1), 0), all: Array.from({ length: Math.min(N, 10) }, (_, i) => ({ x: ax[i], y: 0, z: az[i] })) }; },
  });
}
