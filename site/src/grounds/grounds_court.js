// The Courtyard (grounds.js): a paved terrace under the rock vault, its garden all in pots. Anna: "plants and life, but not
// like growing out of the ground. Pots, maybe hanging pots." The flags are spanya.js's; on them:
//
//   the pine      the old black pine, pruned into clouds, the one tree: in a great low stone bowl, off-centre toward the
//                 mouth of the vault, leaning out to the clouds
//   pots          four groups of clay and stone pots of different sizes against the wall between the doors and on the
//                 south-west shoulder (tall jars of fern, a jar of feathery grass, a bowl of moss with a stone in it, white
//                 foxgloves and anemones); two hanging baskets of trailing green on iron brackets beside the west and east
//                 doors; one ivy going up the rock from a pot beside the north doors
//   stones        two scanned mossy boulders set on the flags in the Japanese manner, the tall one lit from its foot at night
//   the brink     the timber hot tub with its stove, stair and steam; a paper lantern across the terrace,
//                 by the parapet; a candle lantern on the flags by the pots
// The walking lines between the three doors and from the north doors to the parapet are left wide open: a terrace to cross.
//
// Plan coordinates as spanya.js (X right, Y back into the rock, h up); the world is x = Y, z = X. Where the courtyard is
// comes from campus.js (COURT).

import * as THREE from 'three';
import { PAINT } from './tools.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './cards.js';
import { limb } from './grounds_flora.js';
import { COURT } from '../campus.js';
import { fixedExteriorLight } from '../lighting.js';

const TAU = Math.PI * 2, CX = COURT.X, CY = COURT.Y, RIN = COURT.r - 0.75, PAVE = 0.34;      // RIN: the wall's inner face
export const FALL = { from: 233, to: 307, r: COURT.r + 0.9, top: PAVE + 0.76 };      // (the falling water's bearings: switched off, grounds.js FALLS_ON)
const pw = (X, Y) => [Y, X];
const polar = (a, r) => [CX + r * Math.cos(a * Math.PI / 180), CY + r * Math.sin(a * Math.PI / 180)];
const S75 = (X, Y) => [CX + (X - 75) * 0.75, CY + (Y - 36) * 0.75];      // (the pine was drawn for the old, larger courtyard)
const CLAY = ['c#a8654a/0.9', 'c#b57a5a/0.9', 'c#9a5d45/0.9'], STONEP = ['c#8f8a80/0.95', 'c#7d786f/0.95'], GLAZE = 'c#2e3330/0.35';

export function layCourt(E) {
  const { K, F, Wd, B } = E, r = rng(3107);
  const put = (mat, g) => K.put(mat, g);
  function plant(kind, x, y, z, scale = 1, options) {
    if (kind === 'fern') {
      K.model('fern_clump_b',x,z,(x+z)*1.3,{y:y-0.08*scale,scale:scale*0.87});
      return;
    }
    if (['anemone','foxglove','miscanthus'].includes(kind)) {
      const grass=kind==='miscanthus', origin=new THREE.Vector3(x,y-0.05,z);
      // A folded blade has thickness at the midrib and a face on either side.
      const pts=[];
      for (let i=0;i<(grass?28:13);i++) {
        const az=i*2.4+r()*0.34, length=(0.74+r()*0.84)*scale, width=(grass?0.033:0.11)*scale;
        const along=new THREE.Vector3(Math.cos(az),0,Math.sin(az)), across=new THREE.Vector3(-along.z,0,along.x);
        const tip=origin.clone().addScaledVector(along,length);
        tip.y+=length*(grass?1.25:0.56);
        const mid=origin.clone().lerp(tip,0.52); mid.y+=length*0.32;
        const l=mid.clone().addScaledVector(across,width), d=mid.clone().addScaledVector(across,-width);
        const upper=mid.clone(), lower=mid.clone(); upper.y+=width*0.42;lower.y-=width*0.17;
        for (const v of [origin,l,upper,upper,l,tip,origin,upper,d,d,upper,tip,origin,lower,l,l,lower,tip,origin,d,lower,lower,d,tip]) pts.push(v.x,v.y,v.z);
      }
      const leaf=new THREE.BufferGeometry();leaf.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));leaf.computeVertexNormals();
      put(grass?'c#7d8750/0.86':'c#48613c/0.77',leaf);
      if (!grass) for (let k=0;k<3;k++) {
        const a=k*2.4+r()*0.6, sx=x+Math.cos(a)*scale*0.42, sz=z+Math.sin(a)*scale*0.42;
        const h=y+(kind==='foxglove'?2.65:1.86)*scale*(0.8+r()*0.22);
        K.tube('c#71805b/0.8',[x,y-0.025,z],[sx,h,sz],0.019*scale,5);
        if (kind==='anemone') {
          for (let j=0;j<6;j++) {
            const angle=j*TAU/6+a;
            const g=new THREE.SphereGeometry(0.115*scale,8,5).scale(1.25,0.28,0.7);
            g.rotateZ(0.3).rotateY(-angle).translate(sx+Math.cos(angle)*0.093*scale,h,sz+Math.sin(angle)*0.093*scale);
            put('c#e3ddca/0.8',g);
          }
          K.sphere('c#d2ae54/0.8',sx,h+0.026*scale,sz,0.055*scale,0.67,1);
        } else for (let j=0;j<7;j++) {
          const t=0.68+j*0.047, size=(1.23-0.57*j/6)*scale, q=a+j*2.4;
          const px=x+(sx-x)*t, pz=z+(sz-z)*t, hy=y+(h-y)*t;
          const g=new THREE.LatheGeometry([[0,0],[0.035,0],[0.086,-0.09],[0.078,-0.14],[0.062,-0.14],[0.057,-0.09],[0,-0.035]].map(([rad,up])=>new THREE.Vector2(rad*size,up*size)),10);
          g.rotateZ(0.5).rotateY(q).translate(px,hy,pz);put('c#d8c4be/0.84',g);
        }
        E.flowers.court.push([sx,h,sz]);
      }
      return;
    }
    if (kind in E.WILD) Wd.add(kind,x,y,z,scale,options); else F.add(kind,x,z,scale,{y,...options});
    if (E.FLOWERS.has(kind)) E.flowers.court.push([x,y+1.6*scale,z]);
  }
  const lookTo = (dX, dY) => Math.atan2(-dY, -dX), yawTo = (dX, dY) => Math.atan2(dY, dX);
  // Keep the compost inside the lip. A gently raised centre catches light on the
  // soil normal map, while grit and a few bark chips break up the surface up close.
  function soil(x, z, top, radius) {
    const random = rng(Math.round(3941 + 31 * x + 79 * z));
    const profile = [[radius, -0.012], [radius * 0.7, 0.022], [radius * 0.32, 0.045], [0, 0.038]];
    const earth = new THREE.LatheGeometry(profile.map(([a, h]) => new THREE.Vector2(a, h)), 24);
    earth.translate(x, top, z);
    K.G.mesh('soil', earth.toNonIndexed());
    for (let i = 0; i < Math.min(27, 5 + radius * 8); i++) {
      const angle = random() * TAU, d = radius * 0.91 * Math.sqrt(random()), pebble = 0.022 + random() * 0.033;
      K.rock(i % 4 ? PAINT.stoneDark : PAINT.stone, x + d * Math.cos(angle), top + 0.024 * (1 - d / radius), z + d * Math.sin(angle), pebble, pebble * 0.51, pebble * (1.15 + random()), angle, 0);
    }
  }
  const stoneVessel = (x, y, z, profile, seg) => {
    const shell = new THREE.LatheGeometry(profile.map(([a, h]) => new THREE.Vector2(a, h)), seg);
    shell.translate(x, y, z);
    K.G.mesh('rock', shell.toNonIndexed());
  };
  // A pot, turned: kinds 'jar' (tall, wide-shouldered), 'pot' (flowerpot), 'bowl' (low and wide), 'urn' (stone, a foot);
  // size: its height in ft. Returns the height of its soil.
  const pot = (x, z, kind, size, mat, ground = PAVE) => {
    const P = { jar: [[0.01, 0], [0.3, 0], [0.42, 0.2], [0.5, 0.55], [0.44, 0.85], [0.3, 0.95], [0.32, 1.0], [0.27, 1.0], [0.25, 0.94]],
      pot: [[0.01, 0], [0.32, 0], [0.36, 0.08], [0.46, 0.85], [0.5, 0.9], [0.5, 1.0], [0.44, 1.0], [0.42, 0.9]],
      bowl: [[0.01, 0], [0.4, 0], [0.62, 0.3], [0.78, 0.8], [0.8, 1.0], [0.74, 1.0], [0.7, 0.85]],
      urn: [[0.01, 0], [0.3, 0], [0.3, 0.12], [0.18, 0.2], [0.2, 0.32], [0.5, 0.5], [0.6, 0.85], [0.62, 1.0], [0.55, 1.0], [0.52, 0.9]] }[kind];
    const profile = P.map(([a, b]) => [a * size, b * size]);
    if (STONEP.includes(mat)) stoneVessel(x, ground, z, profile, 24);
    else K.lathe(mat, x, ground, z, profile, 24);
    const top = ground + size * (kind === 'jar' ? 0.93 : 0.9), rr = size * (kind === 'jar' ? 0.27 : kind === 'bowl' ? 0.72 : kind === 'urn' ? 0.54 : 0.44);
    soil(x, z, top, rr);
    const rad = size * (kind === 'bowl' ? 0.8 : kind === 'urn' ? 0.62 : 0.5);
    K.collide(x - rad, x + rad, z - rad, z + rad, ground + size, ground - 0.5);
    E.perches.push([x + rr, top + 0.05, z]); (E.rims ??= []).push({ x, z, y: ground + size, r: size * { jar: 0.3, pot: 0.47, bowl: 0.77, urn: 0.585 }[kind], kind });
    return top;
  };

  E.pot = pot; E.plant = plant;

  // ---- the pine, in a great low stone bowl: the terrace's centrepiece, a ring of stone bench round it -----------------------
  const PINE = { X: CX + 1, Y: CY - 3 }, SH = [PINE.X - S75(92, 27)[0], PINE.Y - S75(92, 27)[1]];
  {
    const [bX, bY] = [PINE.X, PINE.Y], [x, z] = pw(bX, bY), LIFT = 1.55;
    stoneVessel(x, PAVE, z, [[0.01, 0], [2.3, 0], [2.4, 0.15], [2.85, 1.1], [3.0, 1.7], [2.98, 1.8], [2.75, 1.8], [2.6, 1.5]], 32);
    soil(x, z, PAVE + 1.5, 2.62);
    const pineRandom = rng(8449);
    for (let i = 0; i < 11; i++) {
      const angle = i * 2.4, d = 0.86 + 1.12 * pineRandom(), width = 0.27 + 0.26 * pineRandom();
      K.rock(i % 4 === 0 ? PAINT.stoneDark : PAINT.moss, x + Math.cos(angle) * d, PAVE + 1.52, z + Math.sin(angle) * d, width, width * 0.38, width * (0.88 + pineRandom() * 0.45), angle, 2);
    }
    K.collide(x - 3, x + 3, z - 3, z + 3, PAVE + 1.8, PAVE - 0.5);
    const P3 = (X, Y, h) => { const [a, b] = S75(X, Y); return [b + SH[1], PAVE + LIFT + h * 0.8, a + SH[0]]; };
    const trunk = [P3(92.3, 27.2, -0.6), P3(91.6, 26.8, 4), P3(90.2, 25.8, 8), P3(88.9, 24.3, 11.5), P3(87.0, 22.6, 14.5), P3(84.6, 20.6, 17.0), P3(82.2, 18.9, 19.2), P3(79.8, 17.8, 21.0)];
    const BARK = 'bark';
    put(BARK, limb(trunk, 0.9, 0.24, 14, { flare: 0.38, gnarl: 0.09, step: 0.75 }).geo);
    for (let i = 0; i < 6; i++) {
      const angle = i * TAU / 6 + pineRandom() * 0.6, reach = 1.4 + pineRandom() * 0.8;
      const root = (d, h, twist) => [trunk[0][0] + Math.cos(angle + twist) * d, PAVE + 1.5 + h, trunk[0][2] + Math.sin(angle + twist) * d];
      put(BARK, limb([root(0.35, 0.46, 0), root(reach * 0.5, 0.11, 0.12), root(reach, -0.065, 0)], 0.27, 0.033, 6, { step: 0.45 }).geo);
    }
    put(BARK, limb([P3(87.0, 22.6, 14.5), P3(87.8, 23.4, 18), P3(87.0, 23.8, 21.5), P3(86.0, 23.2, 24.8)], 0.44, 0.14, 7).geo);
    const PADS = [[78.5, 17.2, 21.8, 4.3], [85.6, 21.5, 25.6, 3.6], [84.0, 25.6, 13.4, 3.2], [90.6, 19.5, 15.8, 3.3], [89.0, 28.2, 18.0, 2.9], [85.5, 15.6, 18.6, 3.2], [80.8, 23.4, 20.4, 3.0], [82.0, 13.8, 22.6, 2.6]];
    const along = [...trunk.slice(2), P3(87.8, 23.4, 18), P3(87.0, 23.8, 21.5)];
    for (const [X, Y, h, rad0] of PADS) {
      const rad = rad0 * 0.78, c = new THREE.Vector3(...P3(X, Y, h)), cost = p => Math.hypot(p[0] - c.x, p[2] - c.z) + Math.abs(p[1] - c.y) * 0.6;
      const s = new THREE.Vector3(...along.reduce((a, p) => (cost(p) < cost(a) ? p : a)));
      if (s.distanceTo(c) > 1.2) { const mid = s.clone().lerp(c, 0.5); mid.y += 0.7; put(BARK, limb([s.toArray(), mid.toArray(), [c.x, c.y - 0.5, c.z]], 0.26, 0.08, 6).geo); }
      // Small whorls of branchlets carry needle clusters at their tips.
      // The spread follows the trained bough and remains open near the trunk.
      const turn = pineRandom() * TAU;
      for (let i = 0; i < 6; i++) {
        const angle = turn + i * TAU / 6 + (pineRandom() - 0.5) * 0.44;
        const reach = rad * (0.6 + 0.37 * pineRandom());
        const joint = new THREE.Vector3(c.x, c.y - 0.49, c.z);
        const tip = new THREE.Vector3(c.x + Math.cos(angle) * reach, c.y + reach * (0.08 + 0.2 * pineRandom()), c.z + Math.sin(angle) * reach);
        const elbow = joint.clone().lerp(tip, 0.57); elbow.y -= 0.2;
        put(BARK, limb([joint.toArray(), elbow.toArray(), tip.toArray()], 0.095, 0.025, 5, { step: 0.7 }).geo);
        for (const t of [0.5, 0.8, 1.04]) {
          const point = elbow.clone().lerp(tip, (t - 0.55) / 0.45);
          const light = 0.85 + 0.22 * t + 0.22 * (point.y - PAVE) / 20;
          Wd.add('pine', point.x, point.y, point.z, rad * (0.21 + 0.095 * pineRandom()), { w: 3.3, h: 1.88, rot: angle, tint: light, tilt: 0.26 + pineRandom() * 0.43, roll: (pineRandom() - 0.5) * 0.5 });
        }
      }
    }
    E.pineTree = { x, z, y: PAVE + LIFT, height: 18 };
    // the bench round it: a ring of dressed stone, open toward the four quarters
    const R0 = 4.3, R1 = 5.4, BH = 1.45;
    // four curved segments of dressed stone, clean radial ends, the top's edges rounded; open on the diagonals
    const PROF = [[R0, 0], [R0, BH - 0.14], [R0 + 0.04, BH - 0.05], [R0 + 0.14, BH], [R1 - 0.14, BH], [R1 - 0.04, BH - 0.05], [R1, BH - 0.14], [R1, 0]];
    const CUSHM = 'linen#e6dcc6';
    for (const mid of [0, 90, 180, 270]) {
      const p0 = (mid - 33) * Math.PI / 180, p1 = (mid + 33) * Math.PI / 180;
      // an annular sector in plan, extruded up with rounded edges (plan bearing q: world offset (r sin q, r cos q))
      const ring = (ra, rb, q0, q1, n = 24) => { const sh = new THREE.Shape(); for (let i = 0; i <= n; i++) { const q = q0 + (q1 - q0) * i / n; i ? sh.lineTo(ra * Math.sin(q), -ra * Math.cos(q)) : sh.moveTo(ra * Math.sin(q), -ra * Math.cos(q)); } for (let i = n; i >= 0; i--) { const q = q0 + (q1 - q0) * i / n; sh.lineTo(rb * Math.sin(q), -rb * Math.cos(q)); } return sh; };
      const g = new THREE.ExtrudeGeometry(ring(R0 + 0.07, R1 - 0.07, p0, p1), { depth: BH - 0.14, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 3, curveSegments: 24 });
      g.rotateX(-Math.PI / 2); g.translate(x, PAVE + 0.07, z); K.G.mesh('rock', g.index ? g.toNonIndexed() : g);
      const ph0 = Math.PI / 2 - p1, len = p1 - p0;
      for (let a = mid - 30; a <= mid + 30; a += 10) { const [cx2, cz2] = pw(bX + (R0 + R1) / 2 * Math.cos(a * Math.PI / 180), bY + (R0 + R1) / 2 * Math.sin(a * Math.PI / 180)); K.collide(cx2 - 0.55, cx2 + 0.55, cz2 - 0.55, cz2 + 0.55, PAVE + BH, PAVE - 0.5); }
      if (mid === 90 || mid === 270) {      // a long seat cushion on two of them, in a light outdoor linen
        const cg = new THREE.ExtrudeGeometry(ring(R0 + 0.2, R1 - 0.2, p0 + 0.05, p1 - 0.05, 20), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 3, curveSegments: 20 });
        cg.rotateX(-Math.PI / 2); cg.translate(x, PAVE + BH + 0.07, z); B.mesh(CUSHM, cg); void ph0; void len;
      }
    }
    for (const a of [90, 0, 180, 270]) { const [sx, sz] = pw(bX + 4.8 * Math.cos(a * Math.PI / 180), bY + 4.8 * Math.sin(a * Math.PI / 180)); K.seat(sx, PAVE + BH + 0.15, sz, lookTo(Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)), 'sit on the bench round the pine'); }
  }

  // ---- a seating group out on the flags: a round rug of woven rush, a low walnut table, three deep outdoor chairs ------------
  {
    const GX = CX + 7.5, GY = CY + 13, [gx, gz] = pw(GX, GY), CUSHM2 = 'linen#ece4d2', TEAK = 'oak_light#bc9c76', CUSH = 'c#d8ccb2/0.95', SAGE = 'c#7d8a6c/0.95';
    K.cyl('c#b8a888/1', gx, PAVE, PAVE + 0.03, gz, 4.3, 4.3, 40); put('c#7f6d55/1', new THREE.TorusGeometry(4.15, 0.06, 3, 48).rotateX(Math.PI / 2).translate(gx, PAVE + 0.04, gz));
    K.cyl(TEAK, gx, PAVE + 1.1, PAVE + 1.2, gz, 1.25, 1.25, 28); K.cyl(TEAK, gx, PAVE + 0.2, PAVE + 0.3, gz, 1.0, 1.0, 24);
    for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.4; K.box(TEAK, gx + Math.cos(a) * 0.9 - 0.08, gx + Math.cos(a) * 0.9 + 0.08, PAVE, PAVE + 1.1, gz + Math.sin(a) * 0.9 - 0.08, gz + Math.sin(a) * 0.9 + 0.08); }
    K.collide(gx - 1.25, gx + 1.25, gz - 1.25, gz + 1.25, PAVE + 1.2, PAVE - 0.5);
    E.jar(gx + 0.3, PAVE + 1.2, gz - 0.2); E.jar(gx - 0.35, PAVE + 1.2, gz + 0.25);
    K.lathe('glass', gx + 0.1, PAVE + 1.2, gz + 0.5, [[0.01, 0], [0.2, 0], [0.24, 0.3], [0.12, 0.62], [0.08, 0.8], [0.09, 0.86]], 14);
    for (const [b, cush] of [[200, CUSH], [320, SAGE], [80, CUSH]]) {
      const a = b * Math.PI / 180, cX = GX + Math.cos(a) * 2.85, cY = GY + Math.sin(a) * 2.85, yaw = yawTo(-Math.cos(a), -Math.sin(a)), m = new THREE.Matrix4().makeRotationY(yaw).setPosition(...pw(cX, cY).flatMap((v, i) => (i ? [PAVE, v] : [v])));
      const box = (mat, x0, x1, y0, y1, z0, z1, rx = 0) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); if (rx) g.rotateX(rx); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); put(mat, g.applyMatrix4(m)); };
      const soft = (x0, x1, y0, y1, z0, z1, rx = 0) => { const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 3, Math.min(0.14, (y1 - y0) / 2.2)); if (rx) g.rotateX(rx); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); B.mesh(CUSHM2, g.applyMatrix4(m)); };
      for (const sx of [-1, 1]) {      // an open timber side: two legs, an arm, a rail
        box(TEAK, sx * 1.22 - 0.08, sx * 1.22 + 0.08, 0, 1.95, 0.85, 1.0); box(TEAK, sx * 1.22 - 0.08, sx * 1.22 + 0.08, 0, 1.95, -1.05, -0.9);
        box(TEAK, sx * 1.22 - 0.13, sx * 1.22 + 0.13, 1.95, 2.05, -1.1, 1.1); box(TEAK, sx * 1.22 - 0.06, sx * 1.22 + 0.06, 0.4, 0.55, -0.95, 0.9);
      }
      box(TEAK, -1.14, 1.14, 0.4, 0.55, 0.88, 0.98); box(TEAK, -1.14, 1.14, 0.4, 0.55, -1.0, -0.9);      // the seat rails
      for (let k = 0; k < 5; k++) box(TEAK, -1.14 + 0.06, 1.14 - 0.06, 0.5, 0.56, -0.85 + k * 0.4, -0.85 + k * 0.4 + 0.28);
      box(TEAK, -1.14, 1.14, 0.6, 2.4, -1.12, -1.02, -0.16);      // the back's frame
      soft(-1.08, 1.08, 0.56, 1.12, -0.95, 1.08); soft(-1.0, 1.0, 1.05, 2.4, -0.98, -0.55, -0.18);      // seat cushion, back cushion
      if (cush === SAGE) soft(-0.5, 0.5, 1.12, 1.5, -0.5, -0.2, -0.3);      // and a scatter cushion
      const [sx2, sz2] = pw(cX, cY); K.collide(sx2 - 1.2, sx2 + 1.2, sz2 - 1.2, sz2 + 1.2, PAVE + 2.3, PAVE - 0.5); K.seat(sx2, PAVE + 1.05, sz2, lookTo(-Math.cos(a), -Math.sin(a)), 'sit in the chair');
    }
    for (const [dX, dY] of [[3.6, -1.6], [-3.4, 2.4]]) {
      const [lx, lz] = pw(GX + dX, GY + dY);
      E.lantern(lx, PAVE, lz, 0.95, 0); E.jar(lx + 0.6, PAVE, lz + 0.3);
      fixedExteriorLight(lx, PAVE + 0.52, lz, { power: 10, reach: 8.8 });
    }
    fixedExteriorLight(gx, PAVE + 1.4, gz, { power: 7, reach: 6.7 });
    E.perches.push([gx + 1.0, PAVE + 1.2, gz]);
  }

  // ---- the groups of pots, against the wall between the doors and on the south-west shoulder ---------------------------
  // each: [bearing, [[kind, height, material, along the wall (ft), out from the wall (ft), [[plant, scale], ...]], ...]]
  const FERN = s => [['fern', s]], GRASS = [['miscanthus', 0.62]], MOSSB = 'mossbowl';
  const GROUPS = [
    [135, [['jar', 2.6, CLAY[0], -2.2, 1.6, FERN(1.5)], ['jar', 1.9, CLAY[1], 0.0, 1.3, GRASS], ['bowl', 1.0, STONEP[0], 1.9, 1.9, MOSSB], ['pot', 1.3, CLAY[2], 3.3, 1.2, [['foxglove', 0.7], ['anemone', 0.5]]], ['jar', 1.7, CLAY[2], -0.8, 4.2, FERN(1.1)], ['pot', 1.1, STONEP[1], 1.2, 4.8, [['anemone', 0.6]]], ['bowl', 0.8, STONEP[0], 0.2, 6.0, MOSSB]]],
    [24, [['urn', 2.2, STONEP[1], -1.6, 1.6, FERN(1.2)], ['pot', 1.4, CLAY[1], 0.6, 1.2, [['anemone', 0.75]]], ['jar', 2.0, GLAZE, 2.3, 1.4, GRASS], ['bowl', 1.0, STONEP[0], -0.4, 3.6, MOSSB], ['jar', 1.6, CLAY[0], 1.4, 4.3, FERN(1.0)]]],
    [-24, [['jar', 2.5, CLAY[2], -1.8, 1.5, FERN(1.4)], ['bowl', 0.9, STONEP[0], 0.3, 1.9, MOSSB], ['pot', 1.2, CLAY[0], 1.8, 1.2, [['foxglove', 0.65]]]]],      // (it stands by the way to the east walk: it keeps to the wall)
  ];
  for (const [b, list] of GROUPS) {
    const a = b * Math.PI / 180, oX = Math.cos(a), oY = Math.sin(a), tX = -oY, tY = oX;
    for (const [kind, h, mat, along, out, plants] of list) {
      const X = CX + oX * (RIN - out * 1.2) + tX * along * 1.25, Y = CY + oY * (RIN - out * 1.2) + tY * along * 1.25, [x, z] = pw(X, Y), top = pot(x, z, kind, h * 1.25, mat);
      if (plants === MOSSB) {
        for (let i=0;i<9;i++) {
          const q=i*2.4, d=Math.sqrt(i/9)*h*0.58;
          K.rock(PAINT.moss, x + Math.cos(q) * d, top + 0.015, z + Math.sin(q) * d, h * 0.26, h * 0.10, h * 0.31, q, 1);
        }
        K.rock(PAINT.stone, x + 0.1, top + 0.12, z - 0.05, h * 0.32, h * 0.25, h * 0.26, r() * TAU, 1);
      } else for (const [p, s] of plants) plant(p, x + (r() - 0.5) * h * 0.25, top, z + (r() - 0.5) * h * 0.25, s * (0.8 + r() * 0.3), { tint: 0.8 + r() * 0.3 });
    }
    const [lx, lz] = pw(CX + oX * (RIN - 3.4) + tX * (list.length > 2 ? -3.6 : 2.6), CY + oY * (RIN - 3.4) + tY * (list.length > 2 ? -3.6 : 2.6));
    E.lantern(lx, PAVE, lz, 0.85, 0); E.jar(lx + 0.7, PAVE, lz + 0.4); E.jar(lx - 0.4, PAVE, lz + 0.8);
    fixedExteriorLight(lx, PAVE + 0.42, lz, { power: 6, reach: 6.3 });
    for (let i = 0; i < 5; i++) { const [fx, fz] = pw(CX + oX * (RIN - 2 - r() * 3) + tX * (r() - 0.5) * 6, CY + oY * (RIN - 2 - r() * 3) + tY * (r() - 0.5) * 6); E.fireflies.push([fx, PAVE + 1.2 + r() * 3, fz]); }
  }

  // ---- hanging baskets of trailing green, on iron brackets either side of the west and the east doors ---------------------
  {
    const NB = Math.sqrt(COURT.r ** 2 - 4.45 ** 2) - 0.75;      // the bays' inner faces, from the centre
    for (const [a, sd] of [[180, -1], [0, 1]]) {
      const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), tX = -s, tY = c, X0 = CX + c * NB + tX * sd * 3.75, Y0 = CY + s * NB + tY * sd * 3.75, [wx, wz] = pw(X0, Y0), [ox, oz] = pw(-c, -s), H = PAVE + 8.9;
      K.tube(PAINT.iron, [wx, H, wz], [wx + ox * 1.7, H, wz + oz * 1.7], 0.045, 6); K.tube(PAINT.iron, [wx, H - 0.9, wz], [wx + ox * 1.2, H, wz + oz * 1.2], 0.035, 6);
      const bx = wx + ox * 1.55, bz = wz + oz * 1.55, by = H - 1.9;
      K.tube(PAINT.iron, [bx, H, bz], [bx, by + 0.9, bz], 0.015, 4);
      K.lathe('c#6b5a44/0.95', bx, by, bz, [[0.01, 0], [0.4, 0.05], [0.72, 0.45], [0.78, 0.75], [0.72, 0.75]], 16);
      for (let k = 0; k < 6; k++) { const q = k * TAU / 6 + r() * 0.4; Wd.add('trailing', bx + Math.cos(q) * 0.55, by + 0.85, bz + Math.sin(q) * 0.55, 0.85 + r() * 0.35, { rot: q, tint: 0.8 + r() * 0.3 }); }
      soil(bx, bz, by + 0.68, 0.70);
      K.model('fern_clump_a',bx,bz,sd*0.9,{y:by+0.60,scale:0.68});
    }
    // one ivy going up the rock from a pot beside the north doors
    const a = 90, c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), X = CX + c * NB - 3.75, Y = CY + s * NB, [px, pz] = pw(X - 0.0, Y - 1.1);
    const top = pot(px, pz, 'pot', 1.5, CLAY[0]); plant('fern', px, top, pz, 0.6);
    const [ix, iz] = pw(X, Y - 0.12);
    for (let j = 0; j < 6; j++) Wd.add('ivy', ix + (r() - 0.5) * 0.3, PAVE + 1.2 + j * 2.5, iz + (r() - 0.5) * 0.5 * (j > 1 ? 2 : 1), 1, { w: 1.3 + (j > 1 && j < 5 ? 0.6 : 0) + r() * 0.3, h: 3.0, rot: Math.PI / 2 + Math.PI, tint: 0.75 + r() * 0.25 });
  }

  // ---- two scanned mossy boulders placed on the flags (notes/ASSETS.md), the tall one lit from its foot after dark -------------
  for (const [id, X, Y, sc, rot, lit] of [['mossy_rock_04', 45.5, 37.0, 0.36, 2.1, true]]) {
    const [x, z] = pw(X, Y); K.model(id, x, z, rot, { y: PAVE - 0.05, scale: sc, collide: true });
    E.perches.push([x, PAVE + (lit ? 2.0 : 1.0), z]);
    if (lit) { const dX = CX - X, dY = CY - Y, l = Math.hypot(dX, dY), [fx, fz] = pw(X + dX / l * 2.0, Y + dY / l * 2.0);
      K.cyl('c#3a3226/0.4/1', fx, PAVE, PAVE + 0.16, fz, 0.16, 0.14, 10); B.mesh('e#ffe2b4/1.6', new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10).translate(fx, PAVE + 0.17, fz)); K.lamp(fx, PAVE + 1.3, fz, 0.9); }
  }

  // ---- hot tub and timber access stair, clear of the lane along the parapet ----------------------
  {
    const TX = CX - 13.2, TY = CY - 5.8, TR = 2.8, [x, z] = pw(TX, TY), STEEL = 'c#9a9b97/0.35/1', IRONK = 'c#2b2a28/0.5/1';
    const staves = 44, sector = TAU / staves;
    const lathe = (mat, profile, segments, start = 0, span = TAU) => {
      const g = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), segments, start, span);
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (start + uv.getX(i) * span) / TAU * 17.6, uv.getY(i) * 3);
      B.mesh(mat, g.translate(x, PAVE + 0.25, z));
    };
    const outer = [[0.01, 0], [TR - 0.18, 0], [TR - 0.12, 0.1], [TR, 2.6], [TR + 0.02, 2.68]];
    const lip = [outer.at(-1), [TR + 0.018, 2.711], [TR - 0.019, 2.742], [TR - 0.148, 2.742], [TR - 0.184, 2.723], [TR - 0.197, 2.688]];
    const inner = [lip.at(-1), [TR - 0.201, 2.5], [TR - 0.28, 0.3], [0.01, 0.28]];
    lathe('oak_light#5c4432', outer, staves * 3);
    lathe('oak_light#b48b5d', lip, staves * 3);
    lathe('oak_light#9a7a58', inner, staves * 3);
    // Hairline joints expose the continuous dark shell behind individually faced stave boards.
    const stave = [[TR - 0.117, 0.104], [TR - 0.103, 0.155], [TR + 0.008, 2.55], [TR + 0.017, 2.597], [TR + 0.023, 2.642]];
    const tones = ['oak_light#896640', 'oak_light#83623f', 'oak_light#926f4a', 'oak_light#886746', 'oak_light#96734a'];
    for (let i = 0; i < staves; i++) lathe(tones[(i * 7 + Math.floor(i / 5)) % tones.length], stave, 3, i * sector + 0.0018, sector - 0.0036);
    for (const h of [0.55, 2.1]) put(IRONK, new THREE.TorusGeometry(TR - 0.11 + h * 0.042, 0.045, 5, 44).rotateX(Math.PI / 2).translate(x, PAVE + 0.25 + h, z));
    for (const d of [-1.1, 1.1]) K.box('c#4a3a2c/0.9', x + d - 0.2, x + d + 0.2, PAVE, PAVE + 0.27, z - 2.4, z + 2.4);
    B.mesh('water', new THREE.CircleGeometry(TR - 0.197, staves * 2).rotateX(-Math.PI / 2).translate(x, PAVE + 2.45, z));
    E.tub = { x, z, water: PAVE + 2.45, r: TR - 0.3 };
    // Follow the barrel's footprint without blocking the diagonal routes around it.
    for (const [dy, halfY, halfX] of [[0, 0.96, 2.8], [-1.57, 0.62, 2.64], [1.57, 0.62, 2.64], [-2.39, 0.41, 1.77], [2.39, 0.41, 1.77]]) {
      K.collide(x + dy - halfY, x + dy + halfY, z - halfX, z + halfX, PAVE + 4.02, PAVE - 0.09);
    }
    const [sx, sz] = pw(TX - 1.2, TY + 3.9), sy = PAVE, radius = 0.7;
    const shell = 'c#403a34/0.43/0.65', flue = 'c#77746c/0.41/0.78', ash = 'c#241e1a/0.9';
    K.box('limestone_smooth#77726a', sx - 0.88, sx + 1.18, sy, sy + 0.11, sz - 0.89, sz + 0.89);
    for (const dx of [-0.45, 0.45]) for (const dz of [-0.41, 0.41]) K.cyl(IRONK, sx + dx, sy + 0.11, sy + 0.28, sz + dz, 0.09, 0.075, 8);
    K.cyl(shell, sx, sy + 0.26, sy + 0.72, sz, radius, radius, 24);
    K.cyl(shell, sx, sy + 1.56, sy + 2.3, sz, radius, radius, 24);
    const slot = 0.65, cut = Math.PI / 2 + slot;
    const back = new THREE.CylinderGeometry(radius, radius, 0.84, 24, 1, true, cut, TAU - slot * 2);
    B.mesh(shell, back.translate(sx, sy + 1.14, sz));
    K.box(ash, sx + 0.04, sx + 0.09, sy + 0.72, sy + 1.56, sz - 0.4, sz + 0.4);
    K.box('c#81432c/0.72', sx + 0.10, sx + 0.72, sy + 0.72, sy + 0.75, sz - 0.4, sz + 0.4);
    for (const side of [-1, 1]) {
      const zz = sz + side * 0.4;
      K.box(IRONK, sx + 0.47, sx + 0.78, sy + 0.71, sy + 1.56, zz - 0.045, zz + 0.045);
    }
    for (const h of [0.7, 1.54]) K.box(IRONK, sx + 0.49, sx + 0.79, sy + h, sy + h + 0.055, sz - 0.44, sz + 0.44);
    // Hinged cast-iron fire door, open against the outer right jamb.
    K.box(IRONK, sx + 0.76, sx + 1.45, sy + 0.75, sy + 1.52, sz + 0.38, sz + 0.44);
    for (const h of [0.86, 1.38]) K.cyl(STEEL, sx + 0.78, sy + h, sy + h + 0.10, sz + 0.39, 0.045, 0.045, 8);
    K.tube(PAINT.brass, [sx + 1.30, sy + 1.12, sz + 0.41], [sx + 1.42, sy + 1.12, sz + 0.56], 0.029, 8);
    K.box(IRONK, sx + 0.61, sx + 0.73, sy + 0.43, sy + 0.59, sz - 0.27, sz + 0.27);
    K.tube(STEEL, [sx + 0.74, sy + 0.51, sz - 0.13], [sx + 0.74, sy + 0.51, sz + 0.13], 0.023, 6);

    // Stove top, seated collar, jointed flue and a rain cap held above the open outlet.
    K.cyl(IRONK, sx, sy + 2.28, sy + 2.40, sz, 0.74, 0.675, 24);
    K.cyl(IRONK, sx, sy + 2.39, sy + 2.67, sz, 0.285, 0.215, 20);
    K.cyl(flue, sx, sy + 2.55, sy + 7.17, sz, 0.17, 0.17, 16);
    for (const h of [2.73, 4.3, 5.92, 7.06]) K.cyl(IRONK, sx, sy + h, sy + h + 0.10, sz, 0.201, 0.201, 14);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU, dx = Math.cos(a), dz = Math.sin(a);
      K.tube(IRONK, [sx + dx * 0.18, sy + 7.12, sz + dz * 0.18], [sx + dx * 0.20, sy + 7.45, sz + dz * 0.20], 0.022, 6);
    }
    K.cyl(IRONK, sx, sy + 7.43, sy + 7.61, sz, 0.29, 0.075, 18);
    const toTub = new THREE.Vector2(x - sx, z - sz).normalize();
    for (const h of [0.91, 1.64]) {
      const inlet = new THREE.Vector3(sx + toTub.x * 0.65, sy + h, sz + toTub.y * 0.65);
      const outlet = new THREE.Vector3(x - toTub.x * (TR - 0.12), sy + h + 0.27, z - toTub.y * (TR - 0.12));
      K.tube(STEEL, inlet.toArray(), outlet.toArray(), 0.078, 10);
      const a = inlet.clone().lerp(outlet, 0.15), b = outlet.clone().lerp(inlet, 0.15);
      K.tube(flue, inlet.toArray(), a.toArray(), 0.127, 10);
      K.tube(flue, b.toArray(), outlet.toArray(), 0.124, 10);
    }
    E.stove = { x: sx + 0.45, y: sy + 0.76, z: sz };
    fixedExteriorLight(sx + 0.90, sy + 1.04, sz - 0.05, { power: 3.8, reach: 5.2 });
    K.collide(sx - 0.74, sx + 0.8, sz - 0.74, sz + 0.74, sy + 7.61, sy - 0.5);
    K.collide(sx + 0.76, sx + 1.46, sz + 0.34, sz + 0.47, sy + 1.52, sy + 0.75);
    // Set the oak planks on twin stringers and posts, with a landing below the lip.
    const tread = 'oak_light#b5966d', riser = 'oak_light#99714d', support = 'oak_light#74593e';
    const inside = TX + TR - 0.06, landingEnd = inside + 1.46, pitch = 0.87, totalRise = 2.52, stepRise = totalRise / 4;
    const bottom = landingEnd + 3 * pitch, halfWidth = 1.34;
    const plank = (mat, a, b, lo, hi, near, far) => K.box(mat, x + near, x + far, PAVE + lo, PAVE + hi, a, b, { grain: 'long' });
    const stringer = new THREE.Shape();
    stringer.moveTo(bottom - 0.07, 0.035);
    stringer.lineTo(bottom - 0.07, stepRise - 0.105);
    for (let i = 1; i <= 3; i++) {
      const x = bottom - i * pitch + 0.044;
      stringer.lineTo(x, i * stepRise - 0.105);
      stringer.lineTo(x, (i + 1) * stepRise - 0.105);
    }
    stringer.lineTo(landingEnd - 0.22, totalRise - 0.105);
    stringer.lineTo(landingEnd - 0.22, 1.46);
    stringer.lineTo(bottom - 0.07, 0.035);
    const cheek = new THREE.ExtrudeGeometry(stringer, { depth: 0.19, bevelEnabled: false }).rotateY(-Math.PI / 2);
    for (const side of [-1, 1]) {
      const railY = x + side * (halfWidth - 0.17);
      B.mesh(support, cheek.clone().translate(railY + 0.095, PAVE, 0));
      for (const planX of [inside + 0.15, landingEnd - 0.12]) {
        K.box('limestone_smooth#908578', railY - 0.165, railY + 0.165, PAVE, PAVE + 0.085, planX - 0.18, planX + 0.18);
        K.box(support, railY - 0.098, railY + 0.098, PAVE + 0.06, PAVE + totalRise - 0.1, planX - 0.098, planX + 0.098, { grain: 'long' });
      }
      plank(support, inside - 0.06, landingEnd + 0.04, totalRise - 0.33, totalRise - 0.09, railY - x - 0.1, railY - x + 0.1);
    }
    for (let i = 0; i < 4; i++) {
      const b = bottom - i * pitch, a = i === 3 ? inside : b - pitch, h = stepRise * (i + 1);
      const boards = i === 3 ? 4 : 2, boardDepth = (b - a) / boards;
      for (let j = 0; j < boards; j++) {
        const inner = a + j * boardDepth + (j ? 0.011 : 0), outer = a + (j + 1) * boardDepth + (j === boards - 1 ? 0.045 : -0.008);
        plank(tread, inner, outer, h - 0.115, h, -halfWidth, halfWidth);
      }
      plank(riser, b - 0.107, b - 0.021, i === 0 ? 0.025 : h - stepRise - 0.04, h - 0.093, -halfWidth + 0.09, halfWidth - 0.09);
      K.surface(x - halfWidth, x + halfWidth, a - 0.004, b + 0.045, PAVE + h);
    }
    // Block the steep sides at a low height so someone on the treads can walk normally.
    for (const side of [-1, 1]) {
      const y = x + side * (halfWidth - 0.1);
      K.collide(y - 0.085, y + 0.085, inside, landingEnd + 2 * pitch, PAVE + 2.41, PAVE);
    }

    // An immersed wooden bench across the north side of the tub.
    for (const dx of [-1.36, 1.36]) K.box('oak_light#795735', x + 0.62, x + 1.48, PAVE + 0.53, PAVE + 1.43, z + dx - 0.09, z + dx + 0.09);
    for (let j = 0; j < 3; j++) {
      const y = x + 0.61 + j * 0.33;
      K.box('oak_light#b08858', y, y + 0.305, PAVE + 1.41, PAVE + 1.53, z - 1.7, z + 1.7, { grain: 'long' });
    }
    const [seatX, seatZ] = pw(TX + 0.55, TY + 1.02);
    K.seat(seatX, PAVE + 1.53, seatZ, lookTo(0.23, -1), 'slip into the hot tub');
  }
  {
    // The Akari-style paper lantern now marks the garden-side path.
    const [ax, az] = pw(71.1, 21.3), y0 = PAVE + 0.5, y1 = PAVE + 3.4;
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3; K.tube(PAINT.iron, [ax + Math.cos(a) * 0.4, PAVE, az + Math.sin(a) * 0.4], [ax + Math.cos(a) * 0.3, y0, az + Math.sin(a) * 0.3], 0.02, 4); }
    const paper=new THREE.CylinderGeometry(0.62,0.55,y1-y0,28,1,true);
    const uv=paper.attributes.uv;
    for (let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*3.62,uv.getY(i)*(y1-y0));
    B.mesh('shade',paper.translate(ax,(y0+y1)/2,az));
    for (let h = y0 + 0.15; h < y1; h += 0.34) put('c#8a7a62/0.9', new THREE.TorusGeometry(0.55 + (h - y0) / (y1 - y0) * 0.075, 0.012, 3, 24).rotateX(Math.PI / 2).translate(ax, h, az));
    K.lamp(ax, y0 - 0.08, az, 0.52);
    K.collide(ax - 0.6, ax + 0.6, az - 0.6, az + 0.6, y1, PAVE - 0.5);
    E.perches.push([Y_parapet(CX - 13.5), PAVE + 2.62, CX - 13.5], [Y_parapet(CX + 13.5), PAVE + 2.62, CX + 13.5]);      // (the parapet's top: the robin's)
  }

  // ---- the light: warm lanterns and small floor uplights under the rock --------------------------------------------------
  {
    const IRON = PAINT.iron;
    function uplight(x, y, z, size = 1) {
      const s = size, trim = 'c#6b5944/0.42/0.9';
      K.cyl('c#211b14/0.6/0.82', x, y - 0.04 * s, y + 0.048 * s, z, 0.31 * s, 0.29 * s, 20);
      K.lathe(trim, x, y, z, [[0.29 * s, 0.043 * s], [0.27 * s, 0.073 * s], [0.195 * s, 0.073 * s], [0.17 * s, 0.028 * s]], 20);
      K.cyl('e#ffba6c/0.72', x, y + 0.057 * s, y + 0.063 * s, z, 0.175 * s, 0.175 * s, 20);
      for (let n = 0; n < 3; n++) {
        const angle = n / 3 * TAU + 0.2;
        K.cyl(IRON, x + Math.cos(angle) * 0.238 * s, y + 0.071 * s, y + 0.082 * s, z + Math.sin(angle) * 0.238 * s, 0.023 * s, 0.023 * s, 6);
      }
    }
    const wallPt = (a, h) => { const [X, Y] = polar(a, RIN - 0.05); const [x, z] = pw(X, Y); return new THREE.Vector3(x, h, z); };
    // festoons, properly made: a dark cable in a true catenary from an iron eye-bolt on the stone (above the ground-floor
    // window heads, below the upper sills: no string crosses glass) to an iron ring hung from the vault over the middle;
    // a bulb every foot on a short pigtail from its socket, a small glass globe with a warm filament and a soft halo.
    // Everything that hangs swings in the wind (grounds.js, swinging()).
    const HUB = { X: CX - 1, Y: CY + 7, h: PAVE + 20.5 }, [hx, hz] = pw(HUB.X, HUB.Y), hub = new THREE.Vector3(hx, HUB.h, hz);
    E.swayPart('iron', new THREE.TorusGeometry(0.9, 0.06, 6, 24).rotateX(Math.PI / 2).translate(hx, HUB.h, hz), 0, 0);
    // Extend the anchors into solid rock above the highest part of the uneven soffit.
    const anchorH = 68, hookH = HUB.h + 1.25;
    K.tube(IRON,[hx,hookH,hz],[hx,anchorH,hz],0.034,6);
    for (let i=0;i<3;i++) {
      const a=i*TAU/3;
      K.tube(IRON,[hx+0.9*Math.cos(a),HUB.h,hz+0.9*Math.sin(a)],[hx,hookH,hz],0.025,5);
    }
    const globe = new THREE.SphereGeometry(0.11, 8, 4), sock = new THREE.CylinderGeometry(0.035, 0.045, 0.09, 6), pig = new THREE.CylinderGeometry(0.008, 0.008, 0.16, 3);
    const cosh = x => (Math.exp(x) + Math.exp(-x)) / 2;
    [-12, 18, 42, 66, 114, 138, 162, 194].forEach((brg, si) => {
      const [AX, AY] = polar(brg, RIN - 0.05), [ax, az] = pw(AX, AY), A = new THREE.Vector3(ax, PAVE + 12.3, az);
      const dx = A.x - hub.x, dz = A.z - hub.z, Lh = Math.hypot(dx, dz), ux = dx / Lh, uz = dz / Lh, Cp = new THREE.Vector3(hub.x + ux * 0.9, hub.y, hub.z + uz * 0.9);
      const [sx, sy] = polar(brg, RIN + 0.45), [px, pz] = pw(sx, sy);
      K.tube(IRON, [A.x, A.y, A.z], [px, A.y, pz], 0.035, 6);
      E.swayPart('iron', new THREE.TorusGeometry(0.095, 0.018, 5, 12).rotateY(-Math.atan2(uz, ux)).translate(A.x, A.y, A.z), 0, 0);
      const span = Lh - 0.9, n = Math.round(span), ph = si * 1.7;
      const amplitude = t => 0.6 * Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1));
      // a catenary between the two ends: y(s) = y lerp + sag shaped by cosh (sag about a tenth of the span)
      const sag = span * 0.11, yAt = t => Cp.y + (A.y - Cp.y) * t - sag * (1 - (cosh((t - 0.5) * 2.2) - 1) / (cosh(1.1) - 1));
      let prev = Cp.clone();
      for (let i = 1; i <= n; i++) {
        const t = i / n, P = new THREE.Vector3(Cp.x + (A.x - Cp.x) * t, yAt(t), Cp.z + (A.z - Cp.z) * t), amp = amplitude(t);
        const d = P.clone().sub(prev), len = d.length(), seg = new THREE.CylinderGeometry(0.019, 0.019, len + 0.044, 5); seg.translate(0, len / 2, 0); seg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); seg.translate(prev.x, prev.y, prev.z);
        E.swayPart('iron', seg, (x, y, z) => amplitude(((x - Cp.x) * ux + (z - Cp.z) * uz) / span), ph); prev = P;
        if (i < n) {
          E.swayPart('iron', pig.clone().translate(P.x, P.y - 0.08, P.z), amp, ph); E.swayPart('iron', sock.clone().translate(P.x, P.y - 0.2, P.z), amp, ph);
          E.swayPart('bulb', globe.clone().scale(1, 1.15, 1).translate(P.x, P.y - 0.36, P.z), amp, ph);
          E.sway.halo.push([P.x, P.y - 0.36, P.z, amp, ph, 1.0]);
          if ((si === 1 || si === 5) && i === Math.floor(n * 0.55)) {
            fixedExteriorLight(P.x, P.y - 0.36, P.z, { power: 22, reach: 25 });
          }
        }
      }
    });
    // lanterns from the vault on chains of different lengths, in three sizes of one family (iron frame, glass, a candle):
    // high over the middle, lower over the pots and the seating; none lower than 7.6 ft where anyone walks
    const hanger = (X, Y, bottom, s, ph) => {
      const [x, z] = pw(X, Y), top = anchorH, h = s * 1.5, w = s * 0.5, y0 = PAVE + bottom, amp = Math.min(0.7, (top - y0) * 0.022);
      const ring = y0 + h + s * 0.5, cordEnd = ring + s * 0.095, cordLength = top - cordEnd;
      E.swayPart('iron', new THREE.CylinderGeometry(0.025, 0.025, cordLength, 5).translate(x, (top + cordEnd) / 2, z), (_, y) => amp * (top - y) / cordLength, ph);
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) E.swayPart('iron', new THREE.BoxGeometry(0.05 * s, h, 0.05 * s).translate(x + dx * w, y0 + h / 2, z + dz * w), amp, ph);
      E.swayPart('iron', new THREE.BoxGeometry(w * 2.2, 0.08 * s, w * 2.2).translate(x, y0, z), amp, ph);
      E.swayPart('iron', new THREE.ConeGeometry(w * 1.5, s * 0.45, 4).rotateY(Math.PI / 4).translate(x, y0 + h + s * 0.22, z), amp, ph);
      E.swayPart('iron', new THREE.TorusGeometry(s * 0.12, 0.023, 5, 12).translate(x, ring, z), amp, ph);
      E.swayPart('glass', new THREE.BoxGeometry(w * 1.94, h * 0.94, w * 1.94).translate(x, y0 + h / 2, z), amp, ph);
      E.swayPart('candle', new THREE.CylinderGeometry(w * 0.3, w * 0.3, h * 0.35, 8).translate(x, y0 + 0.08 * s + h * 0.175, z), amp, ph);
      const flameY = y0 + h * 0.35 + 0.14 * s;
      E.swayPart('bulb', globe.clone().scale(s * 0.38, s * 0.77, s * 0.38).translate(x, flameY, z), amp, ph);
      E.sway.halo.push([x, flameY, z, amp, ph, 1.45 * s]);
      if (bottom <= 8) fixedExteriorLight(x, flameY, z, { power: 9 + s * 6, reach: 15 });
    };
    [[CX - 6, CY + 2, 11.5, 1.6], [CX + 6, CY - 1, 13.0, 1.6], [CX + 1, CY + 13, 9.5, 1.2], [CX - 9, CY + 12, 12.0, 1.2], [CX + 12, CY + 7, 10.5, 1.2],
     [CX - 15.5, CY + 15.5, 7.8, 0.9], [CX + 17.5, CY + 8.5, 7.8, 0.9], [CX + 15.5, CY - 6.5, 8.0, 0.9], [CX - 17, CY - 3, 8.0, 0.9], [CX - 6.5, CY - 11.5, 8.6, 1.2], [CX + 7.5, CY + 13, 7.9, 0.9]]
      .forEach(([X, Y, b, s], i) => hanger(X, Y, b, s, 0.9 + i * 2.3));
    // wall lanterns on iron brackets beside each of the three doors
    const NB = Math.sqrt(COURT.r ** 2 - 4.45 ** 2) - 0.75;
    for (const a of [180, 90, 0]) for (const sd of [-1, 1]) {
      const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), X = CX + c * (NB - 0.05) - s * sd * 3.75, Y = CY + s * (NB - 0.05) + c * sd * 3.75, [x, z] = pw(X, Y), [ox, oz] = pw(-c, -s);
      if (a !== 90 && sd === (a === 180 ? -1 : 1)) continue;      // (the hanging baskets have that side of the west and east doors)
      const H = PAVE + 7.6, lx = x + ox * 0.75, lz = z + oz * 0.75;
      K.tube(IRON, [x - ox * 0.2, H, z - oz * 0.2], [lx, H, lz], 0.035, 5);
      K.tube(IRON, [x - ox * 0.2, H - 0.51, z - oz * 0.2], [x + ox * 0.49, H, z + oz * 0.49], 0.022, 5);
      E.lantern(lx, H - 1.2, lz, 0.7, 0, H);
      fixedExteriorLight(lx, H - 0.87, lz, { power: 3.0, reach: 8.0 });
    }
    // Recessed floor uplights wash the wall between the windows.
    const PIERS = [166, 146, 126, 108, 72, 54, 34, 14];
    for (const a of PIERS) {
      const p = wallPt(a, PAVE), c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), [ox, oz] = pw(-c, -s);
      const x = p.x + ox * 0.7, z = p.z + oz * 0.7;
      uplight(x, PAVE, z);
      fixedExteriorLight(x, PAVE + 0.08, z, { power: 34, reach: 13, up: 1 });
    }
    // Three smaller fixtures set into the pine's bowl.
    { const [x, z] = pw(PINE.X, PINE.Y);
      for (let k = 0; k < 3; k++) {
        const q = k * TAU / 3 + 0.5, lx = x + Math.cos(q) * 1.3, lz = z + Math.sin(q) * 1.3;
        uplight(lx, PAVE + 1.52, lz, 0.55);
        fixedExteriorLight(lx, PAVE + 1.57, lz, { power: 17, reach: 9, up: 0.8 });
      }
    }
  }
}
function Y_parapet(X) { return CY - Math.sqrt(Math.max(0, COURT.r ** 2 - (X - CX) ** 2)); }
