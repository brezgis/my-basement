// larder_fx.js: the live candle flames of the Listening Room and the Cave (larder.js gathers their wicks and calls this
// from f.later). The flame and its halo are the Pool's and the Chapel's (pool_chapel_fx.js), which are the house's
// candle flame (flame.js) drawn instanced: every candle of a room in one draw, always alight, flickering.
import * as THREE from 'three';
import { NOISE } from '../flame.js';

const addTracked = (ctx, mesh, at, size = 1) => { mesh.frustumCulled = false; ctx.scene.add(mesh); ctx.track?.(mesh, ctx.zoneAt(at.x, at.y, at.z, size)); return mesh; };

// Every cord and its globe rotate together about the ferrule fixed to the canopy.
export function hangingGlobes(ctx, world, top, globes, metal, bulb) {
  const group = new THREE.Group();
  group.name = 'Listening Room suspended globes';
  const centre = world(0, 0, top);
  group.position.set(centre.x, centre.y, centre.z);
  const shapes = [
    [new THREE.CylinderGeometry(1, 1, 1, 6), metal, 0.015],
    [new THREE.CylinderGeometry(1, 1, 1, 12), metal, 0.09],
    [new THREE.SphereGeometry(1, 18, 12), 'glass'],
    [new THREE.CylinderGeometry(1, 1, 1, 6), bulb, 0.026],
  ];
  const meshes = shapes.map(([geometry, material]) => {
    const mesh = new THREE.InstancedMesh(geometry, ctx.materials.make(material), globes.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  });
  const pivot = new THREE.Object3D(), part = new THREE.Object3D(), matrix = new THREE.Matrix4();
  const points = globes.map(([x, y, bottom, r]) => {
    const point = world(x, y, top);
    const anchor = new THREE.Vector3(point.x - centre.x, point.y - centre.y, point.z - centre.z);
    return { anchor, drop: top - bottom - 1.9 * r, r };
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function move(t) {
    for (let i = 0; i < points.length; i++) {
      const { anchor, drop, r } = points[i];
      pivot.position.copy(anchor);
      pivot.rotation.set(0.009 * Math.sin(t * 0.68 + i * 1.6), 0, 0.011 * Math.sin(t * 0.52 + i * 2.1));
      if (reducedMotion.matches) pivot.rotation.set(0, 0, 0);
      pivot.updateMatrix();
      const parts = [[-drop / 2, shapes[0][2], drop + 0.05], [-drop + 0.015, shapes[1][2], 0.14], [-drop - r * 0.92, r, r * 0.98], [-drop - r * 0.83, shapes[3][2], r * 1.03]];
      for (let j = 0; j < meshes.length; j++) {
        const [y, radius, length] = parts[j];
        part.position.set(0, y, 0);
        part.scale.set(radius, length, radius);
        part.updateMatrix();
        meshes[j].setMatrixAt(i, matrix.multiplyMatrices(pivot.matrix, part.matrix));
      }
    }
    for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
  }
  move(0);
  addTracked(ctx, group, world(0, 0, top - 3), 3);
  ctx.animated.push(t => { if (group.visible) move(t); });
}

// ---- candle flames --------------------------------------------------------------------------------------------------
// list: [{ X, Y, h, s }] (the wick's tip; s a size). The flame card and its colours are flame.js's makeCandleFlame,
// with the wick's place given per instance instead of by a mesh's matrix, so a whole room of them is one draw.
export function flames(ctx, W, list, at) {
  if (!list.length) return;
  const uT = { value: 0 }, n = list.length;
  const mk = (w, h, dy) => { const g = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(w, h).translate(0, dy, 0)); const a = new Float32Array(n * 4); list.forEach((c, i) => { const p = W(c.X, c.Y, c.h); a.set([p.x, p.y, p.z, c.s ?? 1], i * 4); }); g.setAttribute('aP', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n; return g; };
  const vert = `attribute vec4 aP; varying vec2 vUv; varying float vS;
void main() { vUv = uv; vec3 c = aP.xyz; float s = aP.w; vS = fract(c.x * 3.71 + c.z * 5.37 + c.y * 1.13) * 40.0;
  vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
  gl_Position = projectionMatrix * viewMatrix * vec4(c + right * position.x * s + vec3(0.0, position.y * s, 0.0), 1.0); }`;
  // (the fragment is flame.js's makeCandleFlame, word for word)
  const flame = new THREE.Mesh(mk(0.14, 0.24, 0.108), new THREE.ShaderMaterial({
    uniforms: { uT }, transparent: true, depthWrite: false, fog: false, vertexShader: vert,
    fragmentShader: `uniform float uT; varying vec2 vUv; varying float vS;
${NOISE}
void main() {
  float t = uT + vS, y = vUv.y, x = (vUv.x - 0.5) * 2.0;
  float lean = noise(vec2(vS, t * 1.3)) - 0.5, quick = noise(vec2(vS + 9.0, t * 6.0)) - 0.5, lick = noise(vec2(x * 2.0 + vS, y * 3.0 - t * 4.5)) - 0.5;
  x -= (lean * 0.5 + quick * 0.16) * y * y + lick * 0.14 * y;
  float yy = y / (0.84 + 0.1 * noise(vec2(vS + 3.0, t * 5.0)) + 0.06 * lean);
  if (yy >= 1.0) discard;
  float w = 1.1 * sqrt(yy) * pow(1.0 - yy, 0.75) + 0.05 * (1.0 - yy);
  float d = abs(x) / w;
  float a = (1.0 - smoothstep(0.5, 1.0, d)) * smoothstep(0.0, 0.05, yy) * (1.0 - smoothstep(0.86, 1.0, yy));
  vec3 col = mix(vec3(1.0, 0.82, 0.42), vec3(1.0, 0.42, 0.06), smoothstep(0.25, 1.0, d));
  col = mix(col, vec3(1.0, 0.96, 0.82), (1.0 - smoothstep(0.0, 0.55, d)) * smoothstep(0.16, 0.42, yy) * (1.0 - smoothstep(0.55, 0.92, yy)));
  float foot = 1.0 - smoothstep(0.02, 0.26, yy);
  col = mix(col, vec3(0.28, 0.42, 1.0), foot * 0.8);
  a *= mix(1.0, 0.5, foot);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col * 1.2, a);
}`,
  }));
  flame.renderOrder = 3; flame.name = 'larder flames';
  // a soft halo round each, stronger after dark (the house's halos only come on at dusk, and only for its own candles)
  const uK = { value: 0.3 };
  const halo = new THREE.Mesh(mk(1, 1, 0), new THREE.ShaderMaterial({
    uniforms: { uK, uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute vec4 aP; uniform float uT; varying vec2 vUv; varying float vA;
void main() { vUv = uv * 2.0 - 1.0; vA = 1.0 + 0.06 * sin(uT * 8.0 + aP.x * 3.1 + aP.z * 1.7);
  vec4 mv = viewMatrix * vec4(aP.xyz + vec3(0.0, 0.1, 0.0), 1.0); mv.xy += position.xy * min(aP.w, 1.2) * 1.1; mv.z += 0.3; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; varying vec2 vUv; varying float vA;
void main() { float r = dot(vUv, vUv); if (r > 1.0) discard; float g = 1.0 - r; g = g * g * g; gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * g * vA * uK, 1.0); }`,
  }));
  halo.renderOrder = 2; halo.name = 'larder candle halos';
  addTracked(ctx, flame, at); addTracked(ctx, halo, at);
  ctx.animated.push(t => { uT.value = t; uK.value = 0.16 + 0.3 * (ctx.day?.night ?? 0); });
}

