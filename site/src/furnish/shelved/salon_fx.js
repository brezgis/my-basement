// salon_fx.js: what glows, sparkles, changes or answers in the Nail Salon, set going from f.later in salon.js.
// Everything is given in the building's plan (X, Y, h) and turned into the world with W = (X, Y, h) => f.world(X, Y, h);
// each mesh is tracked to its room (ctx.track), so it costs nothing while the room cannot be seen.
//
//   bottles()   the polish wall's bottles, lit from behind like a bar's back wall: every bottle glows a little in its
//               own colour; the glitter shelf's bottles also sparkle (flecks that catch the eye as you move, and
//               twinkle by themselves). One mesh, one draw.
//   neon()      the one loud thing: "hello, honey" in the staff's hand, in pink neon, on the north wall
//   letterBoard() TODAY'S GOSSIP in white letters on black felt; a new set each hour, and E changes the letters
//   bells()     the brass bell-push on each throne's paw: a ding, the order called out, and the coffee already on the
//               side table a moment later, to be taken with E
//
// FOR THE STAFF AGENT: `SALON` below is the hand-over. Set `SALON.onBell = ({ i, drink, ctx, throne }) => true` to take
// the bell over (return true and the default runner does nothing; call `SALON.deliver(i, drink)` when your runner sets
// the cup down, and it appears on that throne's side table, takeable). `SALON.thrones[i]` has `bell` and `table`
// ([X, Y, h], plan) and `seat`.
import * as THREE from 'three';
import { buildDrink, useThreeDrinks } from '../../faculty/drinks.js';
import { useThree as useThreeParts } from '../../faculty/models.js';
import * as TX from './salon_text.js';

export const SALON = { thrones: [], onBell: null, deliver: () => {}, cups: [] };

const addTracked = (ctx, mesh, at, size = 1) => { mesh.frustumCulled = false; ctx.scene.add(mesh); ctx.track?.(mesh, ctx.zoneAt(at.x, at.y, at.z, size)); return mesh; };
const fmt = (s, a) => s.replace('%s', a);

// ---- the bottles -------------------------------------------------------------------------------------------------
// list: [{ X, Y, h, col (0xrrggbb), glitter, cap (0xrrggbb), w, d }]: the foot of the bottle; boxes are square to the plan
export function bottles(ctx, W, list, at) {
  const pos = [], col = [], gl = [], nrm = [];
  const box = (c, sx, sy, sz, rgb, g, s) => {
    const b = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed(); b.translate(c.x, c.y, c.z);
    const P = b.attributes.position, N = b.attributes.normal;
    for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(N.getX(i), N.getY(i), N.getZ(i)); col.push(rgb.r, rgb.g, rgb.b); gl.push(g, s); }
  };
  const cyl = (c, r, hh, rgb) => {
    const b = new THREE.CylinderGeometry(r, r, hh, 4, 1).toNonIndexed(); b.translate(c.x, c.y, c.z);
    const P = b.attributes.position, N = b.attributes.normal;
    for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(N.getX(i), N.getY(i), N.getZ(i)); col.push(rgb.r, rgb.g, rgb.b); gl.push(0, 0); }
  };
  for (const b of list) {
    const p = W(b.X, b.Y, b.h + 0.085), c = new THREE.Color(b.col).convertSRGBToLinear(), w = b.w ?? 0.12, d = b.d ?? 0.09;
    box(p, w, 0.17, d, c, b.glitter ? 0.35 : 0.5, b.glitter ? 1 : 0);
    const q = W(b.X, b.Y, b.h + 0.255); cyl(q, 0.027, 0.17, new THREE.Color(b.cap ?? 0x141210).convertSRGBToLinear());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('gl', new THREE.Float32BufferAttribute(gl, 2));
  const uT = { value: 0 };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.18, metalness: 0.05, envMapIntensity: 1.2 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 gl;\nvarying vec2 vGl;\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGl = gl;\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uT; varying vec2 vGl; varying vec3 vWP;
float hsh(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec3 cell = floor(vWP * 90.0); float h = hsh(cell);
  float tw = pow(0.5 + 0.5 * sin(uT * (1.5 + h * 4.0) + h * 61.0), 28.0);
  vec3 rd = normalize(vec3(hsh(cell + 1.3) - 0.5, hsh(cell + 2.7) - 0.5, hsh(cell + 4.1) - 0.5));
  float gg = pow(max(dot(rd, normalize(cameraPosition - vWP)), 0.0), 50.0);
  float sp = step(0.55, h) * (tw * 1.2 + gg * 4.0) * vGl.y;
  totalEmissiveRadiance += vColor.rgb * vGl.x + mix(vColor.rgb, vec3(1.0), 0.55) * sp * 2.2; }`);
  };
  m.customProgramCacheKey = () => 'salon-bottles';
  const mesh = new THREE.Mesh(g, m); mesh.name = 'salon polish wall';
  addTracked(ctx, mesh, at, 4);
  ctx.animated.push(t => { uT.value = t; });
}

// a plane in the plan: its middle c [X, Y, h], width along the plan direction u [dX, dY], tall, facing n [dX, dY]
function plane(W, c, u, w, tall) {
  const o = W(c[0], c[1], c[2]), a = W(c[0] + u[0], c[1] + u[1], c[2]), ux = new THREE.Vector3(a.x - o.x, a.y - o.y, a.z - o.z).normalize(), up = new THREE.Vector3(0, 1, 0), O = new THREE.Vector3(o.x, o.y, o.z);
  const P = (s, t) => O.clone().addScaledVector(ux, s * w / 2).addScaledVector(up, t * tall / 2);
  const q = [P(-1, -1), P(1, -1), P(1, 1), P(-1, -1), P(1, 1), P(-1, 1)], uv = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q.flatMap(v => [v.x, v.y, v.z]), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  return { g, at: o };
}

// ---- the neon --------------------------------------------------------------------------------------------------
export function neon(ctx, W, c, u, w, tall, font) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.round(1024 * tall / w); const g = cv.getContext('2d');
  const H = cv.height, px = H * 0.62, txt = TX.NEON;
  g.font = `600 ${px}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (const [blur, lw, colr, a] of [[60, 10, '#ff3d8f', 0.55], [26, 9, '#ff4f9a', 0.8], [8, 7, '#ff86bd', 1], [0, 3.2, '#fff0f6', 1]]) {
    g.shadowColor = colr; g.shadowBlur = blur; g.globalAlpha = a; g.strokeStyle = colr; g.lineWidth = lw; g.strokeText(txt, cv.width / 2, H * 0.52);
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const { g: geo, at } = plane(W, c, u, w, tall);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  m.renderOrder = 3; m.name = 'salon neon';
  addTracked(ctx, m, at, w);
  // a faint buzz in the brightness, as neon has
  ctx.animated.push(t => { m.material.opacity = 0.93 + 0.05 * Math.sin(t * 37) * Math.sin(t * 3.1) + (Math.sin(t * 0.7) > 0.995 ? -0.25 : 0); });
}

// ---- the letter board: TODAY'S GOSSIP ---------------------------------------------------------------------------
export function letterBoard(ctx, W, c, u, w, tall, font, pickN) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.round(1024 * tall / w); const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = set => {
    const Wd = cv.width, H = cv.height; g.fillStyle = '#17161a'; g.fillRect(0, 0, Wd, H);
    g.globalAlpha = 1; for (let y = 6; y < H; y += 12) { g.fillStyle = 'rgba(255,255,255,0.045)'; g.fillRect(0, y, Wd, 2); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, y + 2, Wd, 2); }
    const line = (s, y, px, col = '#f2efe8') => { g.font = `700 ${px}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; try { g.letterSpacing = px * 0.12 + 'px'; } catch { /* old browsers */ }
      const ww = g.measureText(s).width, k = Math.min(1, Wd * 0.9 / ww); g.save(); g.translate(Wd / 2, y); g.scale(k, 1); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(s, 2, 3); g.fillStyle = col; g.fillText(s, 0, 0); g.restore(); };
    line(TX.BOARD_HEAD, H * 0.14, H * 0.11, '#f3c94a');
    set.forEach((s, i) => line(s, H * (0.36 + i * 0.17), H * 0.115));
    line(TX.BOARD_FOOT, H * 0.89, H * 0.07, '#ff7fb0');
    tex.needsUpdate = true;
  };
  const { g: geo, at } = plane(W, c, u, w, tall);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); m.name = 'salon letter board';
  addTracked(ctx, m, at, w);
  let shown = -1, extra = 0;
  const set = () => { const hr = Math.floor(ctx.day?.hour ?? new Date().getHours()), k = (hr + extra) % TX.GOSSIP.length; if (k !== shown) { shown = k; draw(TX.GOSSIP[k]); } };
  set(); ctx.animated.push(() => set());
  ctx.interact.push({ x: at.x, y: at.y, z: at.z, reach: 9, size: w * 0.45, label: () => 'change the gossip on the letter board',
    act: () => { extra++; set(); ctx.flash(TX.BOARD_SAY[pickN(TX.BOARD_SAY.length)] + '  ' + TX.GOSSIP[shown].join(' ')); } });
}

// ---- the bells and the coffee ----------------------------------------------------------------------------------
export function bells(ctx, W, thrones, pickN) {
  useThreeDrinks(THREE); useThreeParts(THREE);
  SALON.thrones = thrones;
  const cups = thrones.map(() => null);
  const ding = () => { try { const s = ctx.sound; if (s?.note) { s.note(93, 0, 1.3, 0.09); s.note(100, 0, 0.7, 0.035); s.note(93, 0.32, 1.0, 0.05); } } catch { /* no sound yet */ } };
  function clear(i) { const c = cups[i]; if (!c) return; ctx.scene.remove(c.g); const k = ctx.interact.indexOf(c.ent); if (k >= 0) ctx.interact.splice(k, 1); cups[i] = null; }
  function deliver(i, drink) {
    const T = thrones[i], p = W(...T.table);
    if (cups[i]) { ctx.flash(TX.ALREADY[pickN(TX.ALREADY.length)]); return; }
    const g = buildDrink({ id: drink.name, vessel: drink.vessel, liquid: drink.liquid });
    g.position.set(p.x, p.y + 0.005, p.z); g.rotation.y = 0.6 + i;
    addTracked(ctx, g, p, 0.5);
    const ent = { x: p.x, y: p.y + 0.15, z: p.z, reach: 6, size: 0.45, label: () => fmt(TX.TAKE, drink.name),
      act: () => { if (!ctx.hold) return; const from = g.position.clone(); clear(i); ctx.hold({ name: drink.name, drink: { vessel: drink.vessel, liquid: drink.liquid }, note: fmt(TX.DONE, drink.name) }, null, { from }); } };
    ctx.interact.push(ent); cups[i] = { g, ent, drink };
    ctx.flash(fmt(TX.ARRIVED[pickN(TX.ARRIVED.length)], drink.name));
  }
  SALON.deliver = deliver; SALON.cups = cups;
  thrones.forEach((T, i) => {
    const b = W(...T.bell);
    let waiting = false;
    ctx.interact.push({ x: b.x, y: b.y + 0.04, z: b.z, reach: 4.5, size: 0.3, label: () => 'press the bell-push (coffee, honey)',
      act: () => {
        ding();
        if (cups[i]) { ctx.flash(TX.ALREADY[pickN(TX.ALREADY.length)]); return; }
        if (waiting) return;
        const drink = TX.DRINKS[pickN(TX.DRINKS.length)];
        if (SALON.onBell?.({ i, drink, ctx, throne: T }) === true) return;
        ctx.flash(fmt(TX.RING[pickN(TX.RING.length)], drink.name));
        waiting = true; setTimeout(() => { waiting = false; deliver(i, drink); }, 2600);      // promised in seven minutes; here in under three seconds
      } });
  });
}
