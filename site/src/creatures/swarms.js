// The things that come in numbers, each one or two draws for the lot (the cast is in ../creatures.js).
//
//   fireflies     a few everywhere at night, as at Anna's House: they come up as the stars do (one draw, moved in the shader)
//   bats          flitting over open grass at dusk (Anna's House: one instanced mesh, wings beaten in the shader; not used
//                 at the Laboratory now: Anna found the flying things overhead at night creepy)
//   butterflies   from flower to flower by day: settle with their wings closed, open them to the sun (Anna's House)
//   dragonflies   over a pond by day: patrol a beat over the water, hover, dart (Anna's House)
//   swallows      hawking in loops over open ground by day; passers, a pair of pigeons crossing high over, now and then
//   bees, moths, crickets   at the hives; round the lamps; heard and not seen
//
// Models: the bat and the dragonfly are from Poly Pizza, CC-BY 3.0 (see assets/CREDITS.md); the rest are built in code.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TAU, flapping, turnTo, wrapA, clamp, ease, rng, vcMat, coloured, tris } from './kit.js';

// ---- Fireflies ------------------------------------------------------------------------------------------------
// A few here and a few there all over the grounds, as at Anna's House: each one hovers about a place of its own, drifting
// a couple of feet this way and that, and lights now and then. They are told where (S.spots(), asked for once, when
// they are first wanted); one set of points for the lot (one draw), moved and lit in the shader. Their size and glow
// are the house's (a PointsMaterial of size 0.55 with a soft dot: its size on screen is 0.55 * half the canvas's
// height / the distance, whatever the field of view).
// S: { spots(): [[x, y, z], ...], x, z: about where (for loading), load, live, from: how dark before the first shows, when }
export function fireflies(kit, S) {
  const { ctx, day, scene, tag, add } = kit, r = rng(S.seed ?? 9091);
  const uT = { value: 0 }, uN = { value: 0 }, uPx = { value: 400 }, FROM = S.from ?? 0.4; let pts = null;
  add({
    name: S.name ?? 'fireflies', x: S.x, z: S.z, load: S.load ?? 2000, live: S.live ?? 2000, when: S.when,
    init: async () => {
      const pos = [], seed = []; for (const [x, y, z] of S.spots()) { pos.push(x, y, z); seed.push(r(), r()); }
      if (!pos.length) throw new Error('nowhere for the fireflies');
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 2));
      pts = tag(new THREE.Points(geo, new THREE.ShaderMaterial({
        uniforms: { uT, uN, uPx }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `attribute vec2 aSeed; uniform float uT, uN, uPx; varying float vB;
void main() {
  float ph = aSeed.x * 20.0, sp = 0.2 + aSeed.y * 0.3;
  vec3 p = position + vec3(sin(uT * sp + ph) * 2.5, sin(uT * sp * 1.7 + ph) * 0.6, cos(uT * sp * 0.8 + ph) * 2.5);
  vB = pow(max(0.0, sin(uT * 1.3 + ph * 3.0)), 6.0) * uN;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_PointSize = min(uPx * 0.55 / max(0.5, -mv.z), 24.0) * step(0.004, vB);
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: `varying float vB;
void main() { float d = length(gl_PointCoord * 2.0 - 1.0); float g = d < 0.3 ? 1.0 - d * 1.3333 : 0.6 * max(0.0, 1.0 - d) / 0.7; gl_FragColor = vec4(vec3(1.0, 0.95, 0.35) * vB * g, 1.0);
  #include <colorspace_fragment>
}`,      // (the house's PointsMaterial is converted to the output's colours, as this is)
      }))); pts.frustumCulled = false; pts.name = 'fireflies'; pts.renderOrder = 3; scene.add(pts);
    },
    show: on => { pts.visible = on; },
    think: () => { uPx.value = ctx.renderer.domElement.height / 2; },
    tick: t => { uT.value = t; uN.value = THREE.MathUtils.smoothstep(day.night, FROM, Math.min(1, FROM + 0.3)); },
    check: () => { const p = pts.geometry.attributes.position, c = ctx.camera.position; let near = 0; for (let i = 0; i < p.count; i++) if (Math.hypot(p.getX(i) - c.x, p.getZ(i) - c.z) < 50) near++; return { n: p.count, within50: near, bright: uN.value }; },
  });
}

// ---- Bats -----------------------------------------------------------------------------------------------------
// S: { beats: [[x, z, reach, height above the ground, phase], ...] one bat to each, over open grass, when }
export function bats(kit, S) {
  const { scene, mesh, tag, groundAt, add } = kit;
  const beats = S.beats.map(([x, z, R, h, ph]) => [x, z, R, groundAt(x, z) + h, ph]), N = beats.length, uT = { value: 0 };
  if (!N) return;
  const batX = ([cx, , R, , ph], s) => cx + R * (Math.sin(s + ph) + 0.35 * Math.sin(s * 2.7)), batZ = ([, cz, R, , ph], s) => cz + R * (Math.cos(s * 1.3 + ph) + 0.3 * Math.cos(s * 3.1));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  let inst;
  add({
    name: S.name ?? 'bats', x: beats[0][0], z: beats[0][1], load: S.load ?? 200, live: S.live ?? 170, when: S.when,
    init: async () => {
      const src = await mesh('v_bat', 1.0, 0x6a5240); inst = tag(new THREE.InstancedMesh(src.geometry, flapping(src.material, uT, 0.75, 19), N));
      inst.frustumCulled = false; inst.name = 'bats'; scene.add(inst);
    },
    show: on => { inst.visible = on; },
    tick: t => {
      uT.value = t;
      for (let i = 0; i < N; i++) {
        const B = beats[i], a = t * 0.55 + B[4], b = a + 0.05;
        const x = batX(B, a), z = batZ(B, a), y = B[3] + 2 * Math.sin(a * 1.9) + 0.6 * Math.sin(a * 7.3), vx = batX(B, b) - x, vz = batZ(B, b) - z;
        e.set(0.1, Math.atan2(vx, vz), 0.3 * Math.sin(a * 2.2), 'YXZ'); q.setFromEuler(e); pv.set(x, y, z);
        inst.setMatrixAt(i, m4.compose(pv, q, sv));
      }
      inst.instanceMatrix.needsUpdate = true;
    },
    check: () => { const all = []; for (let i = 0; i < N; i++) { inst.getMatrixAt(i, m4); all.push({ x: m4.elements[12], y: m4.elements[13], z: m4.elements[14] }); } return { ...all[0], all }; },
  });
}

// ---- Butterflies ------------------------------------------------------------------------------------------------
// S: { x, z: about where, n, flowers(): [[[x, y, z], ...], ...] the flower heads they visit, a list for each place they
//      keep to (asked for once, when they are first wanted), when }. Three kinds: an orange one, a white, a blue.
export function butterflies(kit, S) {
  const { scene, tag, add } = kit, r = rng(S.seed ?? 31338), N = S.n ?? 5;
  let bfly = null, body = null; const flies = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  add({
    name: S.name ?? 'butterflies', x: S.x, z: S.z, load: S.load ?? 160, live: S.live ?? 130, when: S.when,
    init: async () => {
      const lists = S.flowers().filter(l => l.length); if (!lists.length) throw new Error('no flowers for the butterflies');      // (one list of flower heads for each place they keep to)
      // one wing, painted pale with dark veins and a dark edge; each butterfly's colour is its instance's
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#f6f2e8'; g.beginPath(); g.moveTo(4, 64); g.bezierCurveTo(20, 0, 110, -10, 120, 30); g.bezierCurveTo(124, 60, 90, 66, 60, 64); g.bezierCurveTo(100, 80, 104, 120, 70, 124); g.bezierCurveTo(40, 126, 14, 90, 4, 64); g.fill();
      g.strokeStyle = '#1a1410'; g.lineWidth = 7; g.stroke(); g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(6, 64); g.lineTo(40 + k * 18, 10 + k * 22); g.stroke(); }
      g.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(100 + (k % 2) * 10, 25 + k * 6, 3, 0, 7); g.fill(); }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      // a wing: hinged on the body's long axis (z, the hinge at x = 0), reaching out along +x. The painted
      // forewing (the top of the picture) is toward -z, so -z is the butterfly's front.
      const wing = new THREE.PlaneGeometry(1, 1); wing.rotateX(-Math.PI / 2); wing.translate(0.5, 0, 0);
      const bodyG = new THREE.CylinderGeometry(0.045, 0.03, 0.7, 5); bodyG.rotateX(Math.PI / 2); bodyG.translate(0, -0.02, 0.02);
      bfly = tag(new THREE.InstancedMesh(wing, new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, envMapIntensity: 0.4 }), N * 2));
      body = tag(new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.8 }), N));
      const tints = [0xf08a2c, 0xffffff, 0x86b0f0].map(h => new THREE.Color(h));
      for (let i = 0; i < N; i++) {
        const list = lists[i % lists.length], a = list[Math.floor(r() * list.length)];
        flies.push({ list, ax: a[0], ay: a[1], az: a[2], bx: a[0], by: a[1], bz: a[2], t0: -r() * 4, rest: 0.8 + r() * 2.2, fly: 2, size: 0.26 + r() * 0.1, head: r() * TAU, ph: r() * 9, px: a[0], py: a[1], pz: a[2], resting: true });
        bfly.setColorAt(i * 2, tints[i % 3]); bfly.setColorAt(i * 2 + 1, tints[i % 3]);
      }
      for (const m of [bfly, body]) { m.frustumCulled = false; scene.add(m); }
      bfly.name = 'butterflies'; body.name = 'butterfly bodies';
    },
    show: on => { bfly.visible = body.visible = on; },
    tick: t => {
      for (let i = 0; i < flies.length; i++) {
        const f = flies[i], list = f.list; let u = t - f.t0, x, y, z, flap;
        if (u > f.rest + f.fly) {                                    // landed, rested: off to another flower nearby
          f.t0 = t; u = 0; f.ax = f.bx; f.ay = f.by; f.az = f.bz;
          const n = list[Math.floor(r() * list.length)];
          f.bx = n[0]; f.by = n[1]; f.bz = n[2]; f.fly = 1.5 + Math.hypot(f.bx - f.ax, f.bz - f.az) / 2.2; f.rest = 0.7 + r() * 2.6;
        }
        if (u < f.rest) {                                            // resting on the flower: wings held up, opened now and then to bask
          x = f.ax; y = f.ay; z = f.az; const bask = Math.max(0, Math.sin(u * 0.9 + f.ph)); flap = 1.45 - 1.15 * bask * bask;
        } else {
          const k = (u - f.rest) / f.fly, sk = ease(k), wob = Math.sin(k * Math.PI);
          x = f.ax + (f.bx - f.ax) * sk + Math.sin(t * 3.1 + i) * 0.5 * wob; z = f.az + (f.bz - f.az) * sk + Math.cos(t * 2.7 + i) * 0.5 * wob;
          y = f.ay + (f.by - f.ay) * sk + wob * (1.2 + 0.4 * Math.sin(i)) + 0.18 * Math.sin(t * 7 + i) * wob;
          f.head = turnTo(f.head, Math.atan2(-(f.bx - f.ax), -(f.bz - f.az)), 0.08);      // its front (-z) toward where it goes
          flap = 0.15 + 1.25 * Math.abs(Math.sin(t * 14 + i));
        }
        f.px = x; f.py = y; f.pz = z; f.resting = u < f.rest;
        e.set(0, f.head, 0, 'YXZ'); q.setFromEuler(e); p.set(x, y, z);
        body.setMatrixAt(i, m4.compose(p, q, s.setScalar(f.size)));
        for (let side = 0; side < 2; side++) {                       // both wings rise about the back together
          e.set(0, f.head, side ? -flap : flap, 'YXZ'); q.setFromEuler(e); s.set(side ? -f.size : f.size, 1, f.size);
          bfly.setMatrixAt(i * 2 + side, m4.compose(p, q, s));
        }
      }
      bfly.instanceMatrix.needsUpdate = true; body.instanceMatrix.needsUpdate = true;
    },
    check: () => ({ x: flies[0].px, y: flies[0].py, z: flies[0].pz, homes: new Set(flies.map(f => f.list)).size, all: flies.map(f => ({ x: f.px, y: f.py, z: f.pz, resting: f.resting })) }),
  });
}

// ---- Dragonflies over a pond ----------------------------------------------------------------------------------------
// S: { x, z, y: the water's middle and level, at(a, s): the point of the water at angle a, s of the way out, n, when }
export function dragonflies(kit, S) {
  const { scene, mesh, add } = kit, N = S.n ?? 2;
  let flies = null;
  const beat = (i, j) => { const q = rng(i * 7919 + j * 104729 + 1); const a = q() * TAU, s = 0.3 + q() * 0.5; return S.at(a, s); };
  const st = Array.from({ length: N }, (_, i) => ({ k: 0, t0: 0, hover: 1, ax: 0, az: 0, bx: 0, bz: 0, h: 1.3 + i * 0.4 }));
  add({
    name: S.name ?? 'dragonflies', x: S.x, z: S.z, load: S.load ?? 130, live: S.live ?? 100, when: S.when,
    init: async () => { const src = await mesh('v_dragonfly', 2.2); flies = st.map((_, i) => (i ? src.clone() : src)); flies.forEach((f, i) => { const [x, z] = beat(i, 0); f.position.set(x, S.y + st[i].h, z); f.name = 'dragonfly'; scene.add(f); st[i].ax = st[i].bx = x; st[i].az = st[i].bz = z; }); },
    show: on => { for (const f of flies) f.visible = on; },
    tick: (t, dt) => { for (let i = 0; i < N; i++) {
      const f = flies[i], s = st[i], u = t - s.t0, dart = 0.55;
      if (u > s.hover + dart) { s.k++; s.t0 = t; s.ax = s.bx; s.az = s.bz; const b = beat(i, s.k); s.bx = b[0]; s.bz = b[1]; s.hover = 0.5 + rng(i + s.k * 31)() * 1.6; }
      const e = u < s.hover ? 0 : ease((u - s.hover) / dart);
      f.position.set(s.ax + (s.bx - s.ax) * e + 0.05 * Math.sin(t * 9 + i), S.y + s.h + 0.1 * Math.sin(t * 5 + i) + 0.3 * Math.sin(Math.PI * e), s.az + (s.bz - s.az) * e + 0.05 * Math.cos(t * 7 + i));
      f.rotation.y = turnTo(f.rotation.y, Math.atan2(s.bx - s.ax, s.bz - s.az), dt * (e > 0 ? 12 : 1.5));
    } },
    check: () => ({ x: flies[0].position.x, y: flies[0].position.y, z: flies[0].position.z, all: flies.map(f => ({ x: f.position.x, y: f.position.y, z: f.position.z })) }),
  });
}

// A small bird in flight, built in code (wings, a forked tail; the wings are beaten by flapping()): a swallow by default
const flier = (top = 0x1c2440, belly = 0xe8e0cc, red = 0x8a2a1a, sc = 1.5) => {
  const body = tris([[[0, 0.03, 0.12], [-0.035, 0, 0.02], [0.035, 0, 0.02]], [[0, 0.03, 0.12], [0.035, 0, 0.02], [0, 0.02, -0.1]], [[0, 0.03, 0.12], [0, 0.02, -0.1], [-0.035, 0, 0.02]],
    [[-0.035, 0, 0.02], [0, 0.02, -0.1], [0.035, 0, 0.02]]], top);
  const under = tris([[[0, -0.025, 0.11], [0.035, 0, 0.02], [-0.035, 0, 0.02]], [[0, -0.025, 0.11], [-0.035, 0, 0.02], [0, -0.01, -0.1]], [[0, -0.025, 0.11], [0, -0.01, -0.1], [0.035, 0, 0.02]]], (x, y, z) => (z > 0.07 ? red : belly));
  const wingsG = tris([[[-0.03, 0.01, 0.07], [-0.03, 0.01, -0.03], [-0.5, 0.01, -0.12]], [[-0.03, 0.01, 0.07], [-0.5, 0.01, -0.12], [-0.27, 0.01, 0.06]],
    [[0.03, 0.01, 0.07], [0.5, 0.01, -0.12], [0.03, 0.01, -0.03]], [[0.03, 0.01, 0.07], [0.27, 0.01, 0.06], [0.5, 0.01, -0.12]]], top);
  const tail = tris([[[-0.01, 0.015, -0.09], [-0.1, 0.015, -0.36], [0.0, 0.015, -0.16]], [[0.01, 0.015, -0.09], [0.0, 0.015, -0.16], [0.1, 0.015, -0.36]]], top);
  const geo = mergeGeometries([body, under, wingsG, tail]); geo.scale(sc, sc, sc); return geo;
};

// ---- Swallows hawking low over open ground, by day -----------------------------------------------------------------
// S: { x, z, rx, rz: the loops they fly (a figure about this point), y: height above the ground there, amp, n, when }
export function swallows(kit, S) {
  const { scene, tag, groundAt, add } = kit, N = S.n ?? 6, uT = { value: 0 }, cx = S.x, cz = S.z, RX = S.rx ?? 28, RZ = S.rz ?? 22, Y0 = groundAt(cx, cz) + (S.y ?? 20), AMP = S.amp ?? 7; let inst;
  const swX = (s, ph) => cx + RX * Math.sin(s * 0.9 + ph) + RX * 0.28 * Math.sin(s * 2.3), swZ = (s, ph) => cz + RZ * Math.cos(s * 0.7 + ph) + RZ * 0.27 * Math.cos(s * 1.9);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  add({
    name: S.name ?? 'swallows', x: cx, z: cz, load: S.load ?? 420, live: S.live ?? 380, when: S.when,
    init: async () => {
      const geo = flier();
      inst = tag(new THREE.InstancedMesh(geo, flapping(vcMat({ side: THREE.DoubleSide }), uT, 0.7, 13, 1), N)); inst.frustumCulled = false; inst.name = 'swallows'; scene.add(inst);
    },
    show: on => { inst.visible = on; },
    tick: t => {
      uT.value = t;
      for (let i = 0; i < N; i++) {
        const ph = i * 1.37, a = t * 0.42 + ph * 3;
        const x = swX(a, ph), z = swZ(a, ph), y = Y0 + AMP * Math.sin(a * 1.1 + ph), x1 = swX(a + 0.02, ph), z1 = swZ(a + 0.02, ph), x2 = swX(a + 0.04, ph), z2 = swZ(a + 0.04, ph);
        const h0 = Math.atan2(x1 - x, z1 - z), h1 = Math.atan2(x2 - x1, z2 - z1);
        e.set(0.15 * Math.sin(a * 1.1 + ph), h0, clamp(wrapA(h1 - h0) * -12, -0.9, 0.9), 'YXZ'); q.setFromEuler(e); pv.set(x, y, z);
        inst.setMatrixAt(i, m4.compose(pv, q, sv));
      }
      inst.instanceMatrix.needsUpdate = true;
    },
    check: () => { const all = []; for (let i = 0; i < N; i++) { inst.getMatrixAt(i, m4); all.push({ x: m4.elements[12], y: m4.elements[13], z: m4.elements[14] }); } return { ...all[0], all }; },
  });
}

// ---- A pair passing over, now and then, by day ------------------------------------------------------------------------
// Two birds (wood pigeons, grey, with pale bellies) that come in over the rim, cross the island high up in a long,
// gently rising and falling line, one a little behind and beside the other, and go out over the far side; then nothing
// for a while. Not a flock: a pair, and seldom. One instanced mesh (one draw), hidden between passes.
// S: { r: how far from the middle they come in and go out (ft), y: [lo, hi] height over the middle of the island,
//      gap: [lo, hi] seconds between passes, speed (ft/s), when }
export function passers(kit, S) {
  const { scene, tag, groundAt, add } = kit, r = rng(S.seed ?? 4242), N = 2, uT = { value: 0 }, R = S.r ?? 320, Y0 = groundAt(0, 0);
  const [ylo, yhi] = S.y ?? [80, 98], [glo, ghi] = S.gap ?? [25, 70], V = S.speed ?? 30;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  let inst, flying = false, t0 = 0, T = 1, next = -1, ax = 0, az = 0, bx = 0, bz = 0, y = 40, side = 4, back = 7, ph = 0; const at = [[0, 0, 0], [0, 0, 0]];
  add({
    name: S.name ?? 'passing pair', x: 0, z: 0, load: S.load ?? 2000, live: S.live ?? 2000, when: S.when,
    init: async () => {
      inst = tag(new THREE.InstancedMesh(flier(0x8f96a0, 0xc9ccd0, 0xa8b0b4, 3), flapping(vcMat({ side: THREE.DoubleSide }), uT, 0.6, 9, 1), N)); inst.frustumCulled = false; inst.name = 'passing pair';
      for (let i = 0; i < N; i++) inst.setMatrixAt(i, Z); scene.add(inst);
    },
    show: on => { inst.visible = on; },
    tick: t => {
      uT.value = t;
      if (next < 0) next = t + 4 + r() * 12;                                       // (the first pass soon after she comes out)
      if (!flying && t >= next) {                                                  // a chord across the island, not through its middle
        const a = r() * TAU, off = (r() - 0.5) * R * 0.7, c = Math.cos(a), sn = Math.sin(a);
        ax = c * R - sn * off; az = sn * R + c * off; bx = -c * R - sn * off; bz = -sn * R + c * off;
        y = Y0 + ylo + r() * (yhi - ylo); T = Math.hypot(bx - ax, bz - az) / V; t0 = t; flying = true; side = (r() < 0.5 ? -1 : 1) * (3 + r() * 4); back = 5 + r() * 6; ph = r() * 9;
      }
      if (!flying) return;
      const k = (t - t0) / T;
      if (k >= 1) { flying = false; next = t + glo + r() * (ghi - glo); for (let i = 0; i < N; i++) inst.setMatrixAt(i, Z); inst.instanceMatrix.needsUpdate = true; return; }
      const dx = (bx - ax) / (V * T), dz = (bz - az) / (V * T), hd = Math.atan2(dx, dz);
      for (let i = 0; i < N; i++) {
        const u = k * V * T - i * back, wob = Math.sin(t * 0.7 + ph + i * 1.3);
        at[i][0] = ax + dx * u + (-dz) * side * i + 1.2 * wob * dz; at[i][2] = az + dz * u + dx * side * i - 1.2 * wob * dx; at[i][1] = y + 3 * Math.sin(u / 60 + ph) + i * 1.5;
        e.set(-0.05 * Math.cos(u / 60 + ph), hd, 0.12 * wob, 'YXZ'); q.setFromEuler(e); pv.set(at[i][0], at[i][1], at[i][2]);
        inst.setMatrixAt(i, m4.compose(pv, q, sv));
      }
      inst.instanceMatrix.needsUpdate = true;
    },
    check: () => ({ x: at[0][0], y: at[0][1], z: at[0][2], flying, all: at.map(([x, y, z]) => ({ x, y, z })) }),
  });
}

// ---- Bees at their hives ---------------------------------------------------------------------------------------------
// A loose cloud at each hive's entrance, bees on the landing board, and flight lines out to the flowers and back.
// The foraging is a rule, not a timetable (the honeybee's recruitment, as in Seeley's "The Wisdom of the Hive", much
// reduced): the flowers in reach are sorted into patches, each with a worth (how many blooms it has);
//
//   a bee with nowhere to go either follows a dancer on its own hive's board (the likelier the better the dancer's
//   patch), or goes back to the patch it knew (the likelier the better it was), or scouts one at random;
//   it flies out, works a few blooms of the patch one after another, flies home, and dances on the board for a
//   time in proportion to the patch's worth: which is when others may follow it
//
// so the good patches gather bees and the poor ones are forgotten (check() counts who is where). How many are out at
// all is the hour's doing: S.active() is the share of the hive that is flying (all of it at noon, a few at dusk); at
// night they are all on the board, fanning. A bee is a striped body and a blur of wings, one instanced mesh for
// every hive: one draw call. They fly their lines above head height, and lift over anyone who is in the way.
// S: { hives: [{ x, y, z: the way in, board: [x, y, z] the middle of its landing board, out: [dx, dz] the way it faces }],
//      per: bees to each, flowers(hive): [[x, y, z], ...] the blooms within its reach (asked for once), active(), when }
export function bees(kit, S) {
  const { scene, cam, tag, add } = kit, r = rng(S.seed ?? 2718), hives = S.hives, per = S.per ?? 12, N = hives.length * per, uT = { value: 0 };
  if (!N) return;
  const cx = hives.reduce((s, h) => s + h.x, 0) / hives.length, cz = hives.reduce((s, h) => s + h.z, 0) / hives.length;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  let inst; const B = [], stats = { followed: 0, returned: 0, scouted: 0 };
  const atHome = b => b.mode === 'board' || b.mode === 'hover';
  const leg = (b, x, y, z, speed = 9) => { b.ax = b.x; b.ay = b.y; b.az = b.z; b.bx = x; b.by = y; b.bz = z; const d = Math.hypot(x - b.x, y - b.y, z - b.z); b.T = 0.35 + d / speed; b.arc = Math.min(7, 0.4 + d * 0.16); };
  const bloom = b => { const n = b.patch.list[Math.floor(r() * b.patch.list.length)]; return [n[0] + (r() - 0.5) * 0.4, n[1], n[2] + (r() - 0.5) * 0.4]; };
  const home = b => { const h = b.hive, bd = h.board ?? [h.x, h.y, h.z], o = h.out ?? [0, 0]; return b.mode === 'hover' ? [h.x + o[0] * (0.5 + r() * 1.9) - o[1] * (r() - 0.5) * 2.4, h.y + 0.1 + r() * 1.3, h.z + o[1] * (0.5 + r() * 1.9) + o[0] * (r() - 0.5) * 2.4] : [bd[0] - o[1] * (r() - 0.5) * 1.4 + o[0] * (r() - 0.5) * 0.3, bd[1] + 0.05, bd[2] + o[0] * (r() - 0.5) * 1.4 + o[1] * (r() - 0.5) * 0.3]; };
  add({
    name: S.name ?? 'bees', x: cx, z: cz, load: S.load ?? 260, live: S.live ?? 220, when: S.when,
    init: async () => {
      // a bee: a striped body and two pale wings (the wings are a blur in the shader); drawn about three times life size, to be seen at all
      const body = coloured(new THREE.SphereGeometry(0.5, 7, 5).scale(0.36, 0.34, 0.5), (x, y, z) => (z > 0.3 ? 0x1c140c : Math.floor((z + 0.5) * 6) % 2 ? 0x2a1e10 : 0xe0a41c));
      const wingsG = tris([[[0, 0.15, 0.1], [0.6, 0.24, -0.05], [0.1, 0.15, -0.2]], [[0, 0.15, 0.1], [-0.1, 0.15, -0.2], [-0.6, 0.24, -0.05]]], 0xf2f6f8);
      const geo = mergeGeometries([body, wingsG]); geo.scale(0.2, 0.2, 0.2);
      inst = tag(new THREE.InstancedMesh(geo, flapping(vcMat({ side: THREE.DoubleSide }), uT, 0.7, 75), N)); inst.frustumCulled = false; inst.name = S.name ?? 'bees';
      for (const h of hives) {
        // the blooms in reach, sorted into patches ten feet square; a patch is worth more the more blooms it has
        const cells = new Map(); for (const f of S.flowers(h)) { const k = Math.floor(f[0] / 10) + ',' + Math.floor(f[2] / 10); (cells.get(k) ?? cells.set(k, []).get(k)).push(f); }
        h.patches = [...cells.values()].sort((a, b) => b.length - a.length).slice(0, 7).map(list => ({ list, worth: Math.min(1, 0.25 + list.length / 14), bees: 0 }));
        if (!h.patches.length) h.patches = [{ list: [[h.x - 6, h.y, h.z], [h.x - 4, h.y - 0.4, h.z + 5]], worth: 0.5, bees: 0 }];
        for (let k = 0; k < per; k++) { const b = { hive: h, mode: k % 3 ? 'board' : 'hover', patch: null, t0: -r() * 2, T: 0.3 + r() * 1.5, arc: 0, visits: 0, ph: r() * 9, x: h.x, y: h.y, z: h.z, yaw: r() * TAU, ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0 }; const p = home(b); b.x = b.ax = b.bx = p[0]; b.y = b.ay = b.by = p[1]; b.z = b.az = b.bz = p[2]; B.push(b); }
      }
      scene.add(inst);
    },
    show: on => { inst.visible = on; },
    tick: t => {
      uT.value = t; const active = S.active?.() ?? 1;
      for (let i = 0; i < B.length; i++) {
        const b = B[i]; let u = (t - b.t0) / b.T;
        if (u >= 1) {                                                           // what next
          b.t0 = t; u = 0; b.x = b.bx; b.y = b.by; b.z = b.bz;
          if (atHome(b) || b.mode === 'dance') {
            const was = b.mode; if (was === 'dance') b.patch.bees--;
            if (was !== 'dance' && r() < active * 0.45) {                         // off to forage: after a dancer, back where it was, or somewhere new
              let d = null; for (let k = 0; k < B.length; k++) { const o = B[(i + 1 + k) % B.length]; if (o.hive === b.hive && o.mode === 'dance') { d = o; break; } }
              if (d && r() < d.patch.worth) { b.patch = d.patch; stats.followed++; }
              else if (b.patch && r() < b.patch.worth) stats.returned++;
              else { b.patch = b.hive.patches[Math.floor(r() * b.hive.patches.length)]; stats.scouted++; }
              b.mode = 'out'; b.visits = 2 + Math.floor(r() * 3); const f = bloom(b); leg(b, f[0], f[1], f[2]);
            } else {                                                              // about the entrance: on the board, or in the cloud before it
              b.mode = active > 0.02 && r() < 0.25 + 0.5 * active ? 'hover' : 'board'; const p = home(b); leg(b, p[0], p[1], p[2], b.mode === 'board' && was === 'board' ? 0.6 : 4); b.arc = b.mode === 'hover' ? 0.3 : 0; b.T += 0.3 + r() * (active > 0.02 ? 1 : 2.5);
            }
          }
          else if (b.mode === 'out' || b.mode === 'hop') { b.mode = 'work'; b.ax = b.x; b.ay = b.y; b.az = b.z; b.T = 0.8 + r() * 1.4; }
          else if (b.mode === 'work' && --b.visits > 0 && active > 0.02) { b.mode = 'hop'; const f = bloom(b); leg(b, f[0], f[1], f[2], 6); b.arc = 0.5; }
          else if (b.mode === 'work') { b.mode = 'home'; const h = b.hive, bd = h.board ?? [h.x, h.y, h.z]; leg(b, bd[0] + (r() - 0.5) * 0.8, bd[1] + 0.05, bd[2] + (r() - 0.5) * 0.8); }
          else if (b.mode === 'home') { b.mode = 'dance'; b.patch.bees++; b.ax = b.x; b.ay = b.y; b.az = b.z; b.T = 0.6 + 2.2 * b.patch.worth; }      // the better the patch, the longer the dance
        }
        const k = clamp(u, 0, 1); let x, y, z, yaw = b.yaw;
        if (b.mode === 'work') { x = b.ax + 0.14 * Math.sin(t * 5 + b.ph); y = b.ay + 0.07 * Math.sin(t * 7 + b.ph); z = b.az + 0.14 * Math.cos(t * 4 + b.ph); yaw += 0.03 * Math.sin(t * 2 + b.ph); }
        else if (b.mode === 'dance') { const o = b.hive.out ?? [0, 1], w = Math.sin(t * 26 + b.ph) * 0.1, run = 0.35 * Math.sin(t * 2.8 + b.ph); x = b.ax - o[1] * (w + run); y = b.ay; z = b.az + o[0] * (w + run); yaw = Math.atan2(-o[1], o[0]) + 0.5 * Math.sin(t * 26 + b.ph) + (Math.cos(t * 2.8 + b.ph) < 0 ? Math.PI : 0); }      // the waggle: up the board shaking, and round again
        else {
          const s = ease(k), wob = Math.sin(Math.PI * k);
          x = b.ax + (b.bx - b.ax) * s + 0.35 * wob * Math.sin(t * 3 + b.ph); z = b.az + (b.bz - b.az) * s + 0.35 * wob * Math.cos(t * 2.6 + b.ph); y = b.ay + (b.by - b.ay) * s + wob * b.arc;
          if (b.mode === 'hover') { x += 0.25 * Math.sin(t * 2.3 + b.ph); y += 0.15 * Math.sin(t * 3.1 + b.ph * 2); z += 0.25 * Math.cos(t * 1.9 + b.ph); }
          if (Math.hypot(b.bx - b.ax, b.bz - b.az) > 0.2) yaw = Math.atan2(b.bx - b.ax, b.bz - b.az); else if (b.mode === 'board') yaw += 0.02 * Math.sin(t * 1.7 + b.ph);      // (on the board: fanning, turning a little)
          const dc = Math.hypot(x - cam.x, y - cam.y, z - cam.z); if (dc < 4) y += (4 - dc) * 0.9;                                            // up and over anyone in the way
        }
        b.yaw = yaw;
        e.set(0, yaw, 0); q.setFromEuler(e); pv.set(x, y, z);
        inst.setMatrixAt(i, m4.compose(pv, q, sv));
        b.px = x; b.py = y; b.pz = z;
      }
      inst.instanceMatrix.needsUpdate = true;
    },
    check: () => { const by = {}; for (const b of B) by[b.mode] = (by[b.mode] ?? 0) + 1; return { x: B[0].px, y: B[0].py, z: B[0].pz, n: B.length, hives: hives.length, ...by, patches: hives.map(h => h.patches.map(p => p.list.length + ':' + B.filter(b => b.hive === h && b.patch === p && !atHome(b)).length).join(' ')).join(' | '), ...stats, all: B.slice(0, 14).map(b => ({ x: b.px, y: b.py, z: b.pz })) }; },
  });
}

// ---- Moths round the lamps, at night --------------------------------------------------------------------------------
// Two or three pale flecks that circle each lit globe, drawn to it and never arriving: one set of points for every lamp
// on the island (one draw), moved entirely in the shader. Small, dim and greyish, and no bigger than a moth however
// far off (they once had a floor to their size and a quick shimmer, and read as fireflies stuck to the lamps).
// S: { lamps: [[x, y, z], ...] the middle of each globe, per: moths to each, when }
export function moths(kit, S) {
  const { ctx, day, scene, tag, add } = kit, r = rng(S.seed ?? 1618), lamps = S.lamps, per = S.per ?? 2;
  if (!lamps.length) return;
  const uT = { value: 0 }, uN = { value: 0 }, uPx = { value: 600 }; let pts = null;
  add({
    name: S.name ?? 'moths', x: lamps[0][0], z: lamps[0][2], load: 900, live: 900, when: S.when,
    init: async () => {
      const pos = [], seed = [];
      for (const l of lamps) for (let k = 0; k < per; k++) { pos.push(l[0], l[1], l[2]); seed.push(r(), r(), r()); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 3));
      pts = tag(new THREE.Points(geo, new THREE.ShaderMaterial({
        uniforms: { uT, uN, uPx }, transparent: true, depthWrite: false,
        vertexShader: `attribute vec3 aSeed; uniform float uT, uN, uPx; varying float vB;
void main() {
  float ph = aSeed.x * 40.0, sp = 1.6 + aSeed.y * 2.2, rad = 0.9 + 1.5 * aSeed.z + 0.5 * sin(uT * 0.9 + ph * 2.0);
  float a = uT * sp * (aSeed.x > 0.5 ? 1.0 : -1.0) + ph;
  vec3 p = position + vec3(cos(a) * rad, 0.7 * sin(uT * sp * 0.73 + ph) + 0.25 * sin(uT * 9.0 + ph), sin(a) * rad);
  vB = uN * (0.4 + 0.15 * sin(uT * 7.0 + ph));                   // wings catching the light, now and then
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_PointSize = min(uPx * 0.12 / max(1.0, -mv.z), 6.0);
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: `varying float vB;
void main() { vec2 d = gl_PointCoord * 2.0 - 1.0; float g = max(0.0, 1.0 - dot(d, d)); gl_FragColor = vec4(vec3(0.86, 0.84, 0.8), vB * g); }`,
      }))); pts.frustumCulled = false; pts.name = 'moths'; pts.renderOrder = 3; scene.add(pts);
    },
    show: on => { pts.visible = on; },
    think: () => { uPx.value = ctx.renderer.domElement.height / (2 * Math.tan((ctx.camera.fov ?? 60) * Math.PI / 360)); },
    tick: t => { uT.value = t; uN.value = THREE.MathUtils.smoothstep(day.night, 0.55, 0.9); },
    check: () => ({ n: lamps.length * per, lamps: lamps.length, bright: uN.value }),
  });
}

// ---- Crickets: heard, not seen ------------------------------------------------------------------------------------
// S: { x, z, r: where they sing from (heard within r), when }. A few thin high notes at a time through the page's
// own sound (ctx.sound.chirp), quieter the further off; nothing if the page has no sound.
export function crickets(kit, S) {
  const { ctx, camDist, add } = kit, r = rng(S.seed ?? 404); let next = 0;
  add({
    name: S.name ?? 'crickets', x: S.x, z: S.z, load: S.r, live: S.r, when: S.when,
    init: async () => {}, show: () => {},
    think: t => { if (t < next) return; next = t + 0.9 + r() * 1.8; const k = 1 - camDist(S.x, S.z) / S.r; if (k > 0) ctx.sound?.chirp?.([98, 98, 98, 98].slice(0, 2 + Math.floor(r() * 3)), 0.004 + 0.008 * k); },
    check: () => ({ x: S.x, y: 0, z: S.z }),
  });
}
