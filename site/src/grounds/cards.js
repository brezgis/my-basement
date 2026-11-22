// Foliage cards. Every leafy thing outdoors (shrubs, perennials, vegetables,
// tree crowns) is drawn as small alpha-tested quads that show one cell of a
// painted atlas. Each instance carries its own atlas cell (aCell: u0, v0, du,
// dv), so one InstancedMesh can hold many species, and the whole garden costs
// a handful of draw calls. The vertex shader adds a gentle breeze.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const wind = { value: 0 };          // seconds; advanced by the garden's setup()

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Patch a material so it reads its atlas cell per instance, sways, and is lit
// the same on both faces (cards are lit as if they faced the sky).
function patch(mat, sway) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWind = wind;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aCell;\nuniform float uWind;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = aCell.xy + uv * aCell.zw;\n#endif')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
{
  vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float ph = ip.x * 0.21 + ip.z * 0.17;
  float swell = 0.35 + 0.65 * smoothstep(0.55, 1.0, sin(uWind * 0.11 + ph * 0.03));   // an occasional gentle stir, exactly as in the house's garden (it had been made quicker and stronger here; Anna, 2026-11-20: "the wind at the lab is too fast", the house's "is much better")
  float k = ${(sway * 0.25).toFixed(4)} * uv.y * uv.y * swell;
  transformed.x += k * (sin(uWind * 0.55 + ph) + 0.3 * sin(uWind * 1.2 + ph * 2.0));
  transformed.z += k * 0.6 * cos(uWind * 0.45 + ph * 1.3);
}
#endif`);
    // (the line sits inside a chunk that is not yet written out at this point, so the chunk is written out here
    // with the change made; replacing it in the shader's own text never matched, and backs of cards were lit from below)
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0'));
  };
  mat.customProgramCacheKey = () => 'card4' + sway;
  return mat;
}

export function cardMaterials(map, { sway = 0.08, roughness = 0.85, env = 0.6, alphaTest = 0.5 } = {}) {
  const material = patch(new THREE.MeshStandardMaterial({ map, alphaTest, side: THREE.DoubleSide, roughness, metalness: 0, envMapIntensity: env }), sway);
  const depth = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest }), sway);
  // depth only, for the pass that lays down a crown's nearest leaves before any is shaded (CardSet.build, prepass).
  // It lies a hair behind the leaves themselves, so a leaf it has seen is never refused by its own depth.
  const pre = patch(new THREE.MeshBasicMaterial({ map, alphaTest, side: THREE.DoubleSide, colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }), sway);
  // and the leaves as shaded after it: they write no depth of their own (the pass before has), which lets the card
  // refuse the hidden ones before shading them even though the shader may cut a fragment away
  const shaded = patch(new THREE.MeshStandardMaterial({ map, alphaTest, side: THREE.DoubleSide, roughness, metalness: 0, envMapIntensity: env, depthWrite: false }), sway);
  return { material, depth, pre, shaded };
}

// ---- Card shapes, all of unit size ---------------------------------------------------
const up = new THREE.Vector3(0, 1, 0);
function soften(g, k = 0.75) {                       // bend normals toward the sky
  const n = g.attributes.normal, v = new THREE.Vector3();
  for (let i = 0; i < n.count; i++) { v.fromBufferAttribute(n, i).lerp(up, k).normalize(); n.setXYZ(i, v.x, v.y, v.z); }
  return g;
}
// Upright quads crossed like a star, standing on y = 0.
export function crossGeo(n = 3) {
  const qs = [];
  for (let i = 0; i < n; i++) { const q = new THREE.PlaneGeometry(1, 1); q.translate(0, 0.5, 0); q.rotateY((i * Math.PI) / n); qs.push(q); }
  return soften(mergeGeometries(qs), 0.7);
}
// Quads tilted out from a centre, like the leaves of a lettuce: each quad's base at the origin.
export function rosetteGeo(n = 6, tilt = 0.75) {
  const qs = [];
  for (let i = 0; i < n; i++) {
    const q = new THREE.PlaneGeometry(0.62, 1); q.translate(0, 0.5, 0); q.rotateX(-(Math.PI / 2 - tilt) * (0.85 + 0.3 * ((i * 7) % 3) / 2));
    q.rotateY((i / n) * Math.PI * 2 + (i % 2) * 0.3); qs.push(q);
  }
  // an upright heart in the middle
  const h = new THREE.PlaneGeometry(0.5, 0.7); h.translate(0, 0.35, 0); h.rotateX(-0.3); qs.push(h);
  const h2 = h.clone(); h2.rotateY(Math.PI * 0.6); qs.push(h2);
  return soften(mergeGeometries(qs), 0.55);
}
// One flat quad lying on the ground (lily pads, ground covers).
export function flatGeo() { const q = new THREE.PlaneGeometry(1, 1); q.rotateX(-Math.PI / 2); return q; }
// Three quads crossed in all directions around a centre (tree tufts, shrub masses).
export function starGeo() {
  const qs = [0, 1, 2].map(i => { const q = new THREE.PlaneGeometry(1, 1); q.rotateX(-Math.PI / 2 + (i - 1) * 0.9); q.rotateY((i * Math.PI) / 3); return q; });
  const g = mergeGeometries(qs), n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

// ---- A set of instances, split by region so distant parts can be culled -------------------
export class CardSet {
  constructor({ region = 120 } = {}) { this.region = region; this.items = new Map(); }
  // cell: [u0, v0, du, dv] in atlas UV; m: Matrix4; c: Color
  push(shape, cell, m, c) {
    const key = shape + '|' + Math.floor(m.elements[12] / this.region) + '|' + Math.floor(m.elements[14] / this.region);
    if (!this.items.has(key)) this.items.set(key, { shape, list: [] });
    this.items.get(key).list.push({ cell, m: m.clone(), c: c.clone() });
  }
  // prepass: the cards are first drawn into depth alone, by a shader that does nothing but cut them out, and then
  // shaded; only the nearest card at each pixel passes the depth test the second time, so a dense crown is lit
  // once per pixel rather than once per layer of leaves (it had been the most costly thing in a view of the garden).
  build(scene, shapes, mats, { shadow = true, prepass = false } = {}) {
    const meshes = [];
    for (const { shape, list } of this.items.values()) {
      const geo = shapes[shape].clone();
      const cells = new Float32Array(list.length * 4);
      list.forEach((it, i) => cells.set(it.cell, i * 4));
      geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 4));
      const mesh = new THREE.InstancedMesh(geo, mats.material, list.length);
      list.forEach((it, i) => { mesh.setMatrixAt(i, it.m); mesh.setColorAt(i, it.c); });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.customDepthMaterial = mats.depth;
      nearFirst(mesh);
      if (prepass && mats.pre) {
        const pre = new THREE.InstancedMesh(geo, mats.pre, list.length);
        pre.instanceMatrix = mesh.instanceMatrix;      // (one set of instances, kept in order once for both)
        pre.boundingSphere = mesh.boundingSphere; pre.renderOrder = 1; mesh.renderOrder = 2; mesh.material = mats.shaded;
        mesh.userData.pre = pre; mesh.userData.shaded = mats.shaded; mesh.userData.plain = mats.material;
        pre.castShadow = pre.receiveShadow = false;
        mesh.add(pre);
      }
      scene.add(mesh); meshes.push(mesh);
    }
    return meshes;
  }
  get count() { let n = 0; for (const v of this.items.values()) n += v.list.length; return n; }
}

// Leaves are cut out of their cards in the fragment shader (alpha test), and a fragment that may be cut out cannot be
// hidden before it is shaded the way a wall's can: every card behind another was being shaded in full, and the island's
// foliage was over half the graphics card's work in a view of the garden. Two things let the depth test throw most of
// that away first, neither of which changes the picture (cut-out cards are drawn opaque, so order cannot show):
//  - the cards are drawn after everything else that is solid (renderOrder 1), so a crown behind a building costs nothing;
//  - each set's cards are kept in order nearest the visitor first, re-sorted as one walks (a set at a time, when one has
//    moved a few yards since its last sort), so in a crown the near leaves are drawn before the ones they cover.
const sortQueue = new Set(), PRE_NEAR = 80;
let sortFrame = -1;
function nearFirst(mesh) {
  mesh.renderOrder = 1;
  const n = mesh.count, cell = mesh.geometry.attributes.aCell;
  const st = { at: new THREE.Vector3(1e9, 0, 0), pos: new Float32Array(n * 3), order: new Uint32Array(n), d: new Float32Array(n),
    mat: mesh.instanceMatrix.array.slice(), col: mesh.instanceColor?.array.slice(), cell: cell.array.slice() };
  for (let i = 0; i < n; i++) { st.pos[i * 3] = st.mat[i * 16 + 12]; st.pos[i * 3 + 1] = st.mat[i * 16 + 13]; st.pos[i * 3 + 2] = st.mat[i * 16 + 14]; st.order[i] = i; }
  mesh.onBeforeRender = (renderer, scene, camera) => {
    // the depth pass (prepass, below) only for a set of crowns that comes within PRE_NEAR: further off a crown is too
    // small on the screen for its layers to cost anything, and the pass would be a draw call and its triangles for nothing.
    // (Decided here for the next frame, the pass and the leaves' own material together.)
    const pre = mesh.userData.pre;
    if (pre) {
      const near = camera.position.distanceTo(mesh.boundingSphere.center) - mesh.boundingSphere.radius < PRE_NEAR;
      if (pre.visible !== near) { pre.visible = near; mesh.material = near ? mesh.userData.shaded : mesh.userData.plain; }
    }
    if (camera.position.distanceToSquared(st.at) < 100) return;      // within ten feet of where it was last sorted from
    // one set a frame (the renderer's frame counter tells frames apart), so a turn of the head never sorts them all at once
    const f = renderer.info.render.frame;
    if (sortFrame === f && !sortQueue.has(mesh)) { sortQueue.add(mesh); return; }
    if (sortFrame === f) return;
    sortFrame = f; sortQueue.delete(mesh);
    const p = camera.position; st.at.copy(p);
    for (let i = 0; i < n; i++) { const dx = st.pos[i * 3] - p.x, dy = st.pos[i * 3 + 1] - p.y, dz = st.pos[i * 3 + 2] - p.z; st.d[i] = dx * dx + dy * dy + dz * dz; }
    st.order.sort((a, b) => st.d[a] - st.d[b]);
    const M = mesh.instanceMatrix.array, C = mesh.instanceColor?.array, A = cell.array;
    for (let j = 0; j < n; j++) {
      const i = st.order[j];
      for (let k = 0; k < 16; k++) M[j * 16 + k] = st.mat[i * 16 + k];
      if (C) { C[j * 3] = st.col[i * 3]; C[j * 3 + 1] = st.col[i * 3 + 1]; C[j * 3 + 2] = st.col[i * 3 + 2]; }
      for (let k = 0; k < 4; k++) A[j * 4 + k] = st.cell[i * 4 + k];
    }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; cell.needsUpdate = true;
  };
}

// Helpers for composing instance matrices
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function place(m, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _s.set(sx, sy, sz); _p.set(x, y, z);
  return m.compose(_p, _q, _s);
}

// Turn a painted atlas canvas into a texture. Transparent pixels take the
// average colour of their cell, so leaves do not get dark fringes as the
// texture shrinks with distance. rects: [[x, y, w, h], ...] in pixels.
export function atlasTexture(c, rects) {
  const w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h * 4);
  // (pixels are moved whole, as 32-bit words, rather than a byte at a time: a third of the time, and the same bytes.
  // Every machine that runs this is little-endian, so a word's top byte is the pixel's alpha.)
  const src32 = new Uint32Array(src.buffer, src.byteOffset, w * h), out32 = new Uint32Array(out.buffer);
  for (const [x0, y0, cw, ch] of rects) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y0 + ch; y += 2) for (let x = x0; x < x0 + cw; x += 2) { const i = (y * w + x) * 4; if (src[i + 3] > 128) { r += src[i]; g += src[i + 1]; b += src[i + 2]; n++; } }
    if (n) { r /= n; g /= n; b /= n; }
    const fill = ((r & 255) | ((g & 255) << 8) | ((b & 255) << 16)) >>> 0;      // the cell's average colour, clear (as a Uint8Array would store it)
    for (let y = y0; y < y0 + ch; y++) {
      const si = y * w, oi = (h - 1 - y) * w;
      for (let x = x0; x < x0 + cw; x++) { const p = src32[si + x]; out32[oi + x] = (p >>> 24) > 8 ? p : fill; }
    }
  }
  const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
// Atlas UV of a pixel rect (v measured from the bottom, as the texture is stored flipped)
export function cellUV(W, H, [x, y, w, h], inset = 2) {
  return [(x + inset) / W, (H - y - h + inset) / H, (w - 2 * inset) / W, (h - 2 * inset) / H];
}
