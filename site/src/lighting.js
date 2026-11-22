// Lighting: the indoor/outdoor split, the lamp pool, glows, and the eye's adaptation.
//
// The house is lit by a sun (or moon) with a static shadow map, an open-sky environment map
// and hemisphere light, a soft sky "fill", and a pool of four point lights shared out among
// the lamps nearest the visitor. Everything else here is cheap and mostly painted:
//
// - Indoors. Every MeshStandardMaterial gets a few lines of shader (patched in once, before
//   anything compiles) that ask whether the fragment lies inside the house's walls (five
//   boxes, compiled in as constants). Inside, the open-sky light is cut down to what windows
//   let in, the unshadowed sky fill is dropped (it shone through walls), and a soft warm
//   "room bounce" is added instead: strong by day, a low lamplit glow at night, so no room
//   is black even when none of its lamps are among the four. The sun and moon still come in
//   through the windows, with their shadows. The same glow makes the rooms show warm through
//   the windows when seen from the garden at night.
// - Glows. Lampshades, bulbs, lit fittings and lanterns are emissive; they are turned down by
//   day (unlit fabric and glass) and up from dusk. Window glass glows warm from outside after
//   dark, and soft additive cards lay the windows' light on the lawn and porch floors.
// - The pool (see pickLamps): by day the invisible daylight fills, from dusk the lamps, the
//   room you stand in first, then rooms you can see, with a little stickiness so lights do not
//   swap back and forth. Lamps make pools (inverse-square-ish falloff), fills are broad.
// - The hand lantern takes one of the four lights while it is lit.
// - Exposure: eyes adjust to indoors, porches and the garden, by day and night, quickly
//   toward darker (no blow-out on stepping outside), more slowly toward brighter.
// - A faint vignette (a CSS overlay, no GPU cost), a little stronger at night.
//
// Rooms that light themselves (roomLight, called from a room's furnish file). The four lights of the pool are
// too few for a room hung with twenty lamps, and the even 'room bounce' that kept every room legible also made
// every room the same flat amber after dark. In a room that asks for it, then, two things change while you are
// indoors near it (the room you stand in and the nearest few others, so that a room seen through a door is lit
// as itself, not as a plain room beside a lamplit one): its own even light is lowered (each room says how far),
// and every lamp of it near you that has no light from the pool lights it anyway, through a few lines of shader
// (diffuse only, no shadow, the same falloff as the pool's lamps, so that a lamp handed to the pool or back does
// not change). Pools of light read under the pendants and on the tables, and the room between them falls to a
// dim warm dusk; the eye opens a little to meet the room it is in (exposure), so nothing goes black. From out of
// doors every room is as it was (its windows warm across the lawn); by day nothing changes.
// - Daylight indoors takes the sky's colour at the hour (sky.js gives it): cool and pale at noon, gold in the
//   low sun, blue once the sun is down.
// - Window glass glows amber from outside after dark, wherever a lit room stands behind it.
// ?light=old shows all of this as it was, for comparing (and for timing one against the other).

import * as THREE from 'three';

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp, smooth = THREE.MathUtils.smoothstep;
const f = n => n.toFixed(3);
const QS = new URLSearchParams(globalThis.location?.search ?? '');
export const LIGHT_OLD = QS.get('light') === 'old';
// For measuring what each part of the indoor light costs per pixel (and trying cheaper forms of it):
//   ?taps=17|9|5|1   how many samples of the sun's shadow map each pixel takes (17: three's own filter, as it was)
//   ?boxes=old       the room tests one after another, all of them (as it was; now they go in groups, each behind one test of the group's bounds: the same picture);  ?boxes=0  none (wrong picture: timing only)
//   ?soft=0          no shader lamps (wrong picture: timing only)
//   ?soft=old       each pixel goes through all sixteen shader lamps (as it was; now only its own room's: the same picture)
const EASE = QS.get('ease') !== '0';      // (?ease=0: rooms' own light switched at a stroke, as it was)
const TAPS = Number(QS.get('taps') ?? 17), BOXES = QS.get('boxes') ?? 'fast', SOFT_OFF = QS.get('soft') === '0', SOFT_FAST = QS.get('soft') !== 'old' && !SOFT_OFF;      // (the grouped room tests and the room-by-room lamps are how it is drawn now: the same picture, less work. ?boxes=old, ?soft=old: as it was)
// The insides of the buildings, as boxes in world feet [x0, x1, z0, z1, y0, y1, floor, ceiling]
// (building.js gives them: one for each room, or one for a whole storey). The floor and ceiling of
// the box a surface lies in are what the corner shade is measured from; where they are left out,
// the two heights given to installHouseLight stand in.
let boxGLSL = '', overGLSL = '', FLOOR = 0.55, CEILING = 12.55;

const SOFT = 16;                   // lamps lit by the shader beyond the pool's four (rooms that light themselves)
const NREG = 6;                    // rooms that light themselves at once: the one you are in and the nearest others
// Shared uniform values. Plain objects (not THREE.Vector*) so that three's uniform cloning
// keeps a reference to them, and every material sees the same numbers.
export const HL = {
  amb: { x: 0, y: 0, z: 0 },       // warm room light added indoors (irradiance)
  k: { x: 1, y: 1, z: 1, w: 0 },   // indoors: sky diffuse scale, sky reflection scale, sky-fill cut, how far whites are held back by lamplight
  sh: { x: 0, y: 0, z: 0, w: 0 },  // indoors: corner shade on the room light, and on the lamps (set by shade.js)
  cav: new Float32Array(6 * 8),    // up to six open shelves near the eye, shaded inside: per shelf x0, z0, x1, z1 and y0, y1, open side, weight (shade.js)
  reg: new Float32Array(NREG * 8), // rooms that light themselves, near the eye: x0, z0, x1, z1 and y0, y1, on, how far their even light is kept (roomLight)
  ambN: { x: 0, y: 0, z: 0 },      // the even light indoors in two parts, the lamplit (which those rooms scale) and the daylit: amb = ambN + ambD
  ambD: { x: 0, y: 0, z: 0 },
  soft: new Float32Array(SOFT * 4),// their lamps that the pool has not lit: x, y, z, strength (the live ones first)
  softCone: new Float32Array(SOFT),// ...for each, 2 x which of those rooms it is in, plus 1 if it is shaded (its light goes down in a cone)
  softTint: { x: 1, y: 1, z: 1 },  // the lamps' colour (linear), as the pool's
  softRun: new Float32Array(NREG * 2),// (?soft=fast) for each of those rooms, where its lamps begin and end in soft (which is then kept room by room)
};

// ---- rooms that light themselves ----------------------------------------------------------
// roomLight(f.room('Museum'), { night: 0.3 }): while the eye is indoors near that room its even light after dark is
// night times the usual, and its lamps all light it (above). Called by furnish files, before the scene is lit.
const REGIONS = [];
export function roomLight(room, o = {}) {
  if (LIGHT_OLD) return;
  const ws = (room.boxes?.length ? room.boxes : [room]).map(b => b.world).filter(Boolean);
  if (!ws.length) return;
  const mn = k => Math.min(...ws.map(w => w[k])), mx = k => Math.max(...ws.map(w => w[k]));
  // (let out a little into the walls: some of the room's wall faces lie exactly on its edges, and there the test
  // came out one way or the other pixel by pixel, a speckle of bright and dim on the end walls after dark; not as
  // far as the face of the next room, a quarter foot past the edge, which would then be lit as this one)
  const P = 0.2;
  REGIONS.push({ name: room.name, x0: mn('x0') - P, x1: mx('x1') + P, z0: mn('z0') - P, z1: mx('z1') + P, y0: mn('y0') - P, y1: mx('y1') + P, night: o.night ?? 1 });
}
const regionAt = p => REGIONS.find(r => p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1 && p.y > r.y0 && p.y < r.y1) ?? null;
// in: how far the eye is indoors (eased, 0..1: the rooms take their own levels as it comes in); k: the level of the
// room the eye is in (eased, for the exposure); eff: what that comes to at this hour
const ROOM = { in: 0, k: 1, eff: 1, act: [] };
export const LIGHT_STATE = { REGIONS, ROOM };      // (for looking and tuning from the console)

let installed = false;
export function installHouseLight(boxes = [], floor = 0.55, ceil = 12.55) {
  if (installed) return; installed = true;
  FLOOR = floor; CEILING = ceil;
  // (a round end is given as { round: true, x, z, r, y0, y1, dx, dz, cos, floor, ceil }: within r of (x, z), and
  // within the angle whose cosine is cos of the direction (dx, dz): building.js, roomArc)
  const boxLines = boxes.map(q => (q.round
    ? `  { vec2 q = p.xz - vec2(${f(q.x)}, ${f(q.z)}); float l = length(q); if (l < ${f(q.r)} && p.y > ${f(q.y0)} && p.y < ${f(q.y1)} && dot(q, vec2(${f(q.dx)}, ${f(q.dz)})) >= ${f(q.cos)} * l) { m = 1.0; hlFloor = ${f(q.floor ?? floor)}; hlCeil = ${f(q.ceil ?? ceil)}; } }`
    : (([x0, x1, z0, z1, y0, y1, fl = floor, cl = ceil, nt]) => `  if (hlBox(p, vec3(${[x0, y0, z0].map(f)}), vec3(${[x1, y1, z1].map(f)})) > 0.5${nt ? ` && length(p.xz - vec2(${f(nt[0])}, ${f(nt[1])})) > ${f(nt[2])}` : ''}) { m = 1.0; hlFloor = ${f(fl)}; hlCeil = ${f(cl)}; }`)(q)));
  if (BOXES === '0') boxGLSL = '';
  else if (BOXES === 'fast') {
    // the same tests in the same order, in runs of eight, each run skipped where the point is outside the run's bounds;
    // and nothing at all tested outside the bounds of them all (out of doors)
    const bound = q => (q.round ? [q.x - q.r, q.x + q.r, q.z - q.r, q.z + q.r, q.y0, q.y1] : q.slice(0, 6));
    const hull = qs => { const b = qs.map(bound); return [0, 1, 2, 3, 4, 5].map(k => (k % 2 ? Math.max : Math.min)(...b.map(v => v[k]))); };
    const test = ([x0, x1, z0, z1, y0, y1]) => `hlBox(p, vec3(${[x0 - 0.01, y0 - 0.01, z0 - 0.01].map(f)}), vec3(${[x1 + 0.01, y1 + 0.01, z1 + 0.01].map(f)})) > 0.5`;
    const runs = []; for (let k = 0; k < boxes.length; k += 8) runs.push(`  if (${test(hull(boxes.slice(k, k + 8)))}) {\n${boxLines.slice(k, k + 8).join('\n')}\n  }`);
    boxGLSL = boxes.length ? `  if (${test(hull(boxes))}) {\n${runs.join('\n')}\n  }` : '';
  } else boxGLSL = boxLines.join('\n');
  // The plan of what is indoors, whatever the height: the boxes' rectangles (those that lie within another left
  // out). A room's finishes (indoorLit, below) are lit as indoors anywhere over these: the boxes are square and stop
  // under a sloping ceiling, and the plaster or boards between a box's top and the slates were lit as out of doors,
  // olive by day and black at night. Beyond the walls (an eave's soffit) the same materials are lit as outdoors.
  const rects = boxes.map(q => (q.round ? [q.x - q.r * 0.7, q.x + q.r * 0.7, q.z - q.r * 0.7, q.z + q.r * 0.7, q.y0] : [q[0], q[1], q[2], q[3], q[4]]));
  const within = (a, b2) => a !== b2 && a[0] >= b2[0] && a[1] <= b2[1] && a[2] >= b2[2] && a[3] <= b2[3] && a[4] >= b2[4];
  const plan = rects.filter((a, i) => !rects.some((b2, j) => within(a, b2) && !(within(b2, a) && j > i)));
  overGLSL = plan.map(([x0, x1, z0, z1, y0]) => `  if (p.x > ${f(x0)} && p.x < ${f(x1)} && p.z > ${f(z0)} && p.z < ${f(z1)} && p.y > ${f(y0)}) return 1.0;`).join('\n');
  const head = `
#define HOUSE_LIGHT
uniform vec3 uInAmb;
uniform vec4 uInK;
uniform vec4 uInSh;
uniform vec4 uInCav[12];
uniform vec4 uInReg[${NREG * 2}];
uniform vec3 uInAmbN, uInAmbD, uInSoftTint;
uniform vec4 uInSoft[${SOFT}];
uniform vec4 uInSoftCone[${SOFT / 4}];
uniform vec2 uInSoftRun[${NREG}];
// which of the rooms that light themselves the point is in (-1: none)
int hlRegion(vec3 p) {
  for (int i = 0; i < ${NREG}; i++) {
    vec4 A = uInReg[i * 2], B = uInReg[i * 2 + 1];
    if (B.z < 0.5) break;
    if (p.x > A.x && p.x < A.z && p.z > A.y && p.z < A.w && p.y > B.x && p.y < B.y) return i;
  }
  return -1;
}
// The room's lamps that have no light of their own from the pool: as a point light of the pool's (a lamp's
// cutoff and decay, the light dropped below the shade), diffuse only. A shaded lamp (an enamel pendant, a
// table lamp) throws its light down in a broad cone: the wall beside it and the ceiling over it get only a
// little, from the glow of the shade, and the table under it the pool.
// (each lamp lights only the room it is in: no light through the walls)
vec3 hlSoftLamps(vec3 p, vec3 n, int room) {
  float s = 0.0;
${SOFT_OFF ? '  return vec3(0.0);' : ''}
${SOFT_FAST ? `  vec2 run = uInSoftRun[room];
  for (int i = int(run.x); i < int(run.y); i++) {
    vec4 L = uInSoft[i];
    float c = uInSoftCone[i >> 2][i & 3], r = floor(c * 0.5);` : `  for (int i = 0; i < ${SOFT}; i++) {
    vec4 L = uInSoft[i];
    if (L.w <= 0.0) break;
    float c = uInSoftCone[i >> 2][i & 3], r = floor(c * 0.5);
    if (int(r) != room) continue;`}
    vec3 d = L.xyz - p; float l2 = dot(d, d);
    if (l2 > ${f(SHAPE.lamp[0] * SHAPE.lamp[0])}) continue;      // beyond the lamp's reach it gives nothing: most of a big room's lamps, for any one point of it (the Reading Room has sixteen)
    float l = max(sqrt(l2), 0.05), q = l / ${f(SHAPE.lamp[0])}; q *= q;
    float w = clamp(1.0 - q * q, 0.0, 1.0);
    float cone = mix(1.0, 0.1 + 0.9 * smoothstep(0.25, 0.8, d.y / l), c - 2.0 * r);
    s += L.w * cone * w * w / max(pow(l, ${f(SHAPE.lamp[1])}), 0.01) * max(dot(n, d / l), 0.0);
  }
  return s * uInSoftTint;
}
float hlFloor = ${f(FLOOR)}, hlCeil = ${f(CEILING)};      // of the room the fragment is in (set by houseInside)
float hlBox(vec3 p, vec3 a, vec3 b) { return (all(greaterThan(p, a)) && all(lessThan(p, b))) ? 1.0 : 0.0; }
float houseInside(vec3 p) {
  float m = 0.0;
${boxGLSL}
  return m;
}
float houseOver(vec3 p) {
${overGLSL}
  return 0.0;
}
// How open a spot indoors is, 1 in the open: less low on walls and on the sides of things (where
// they meet the floor), up under the ceiling, and on faces turned down (the undersides of things).
float houseShade(vec3 p, vec3 n, float inside) {
  if (inside < 0.5) return 1.0;
  float h = max(p.y - hlFloor, 0.0), c = max(hlCeil - p.y, 0.0);
  float side = 1.0 - abs(n.y);
  float a = 1.0 - side * (0.5 * exp(-1.8 * h) + 0.22 * exp(-3.0 * c));
  // inside an open shelf: darker toward the back (open side 0: +x, 1: -x, 2: +z, 3: -z)
  for (int i = 0; i < 6; i++) {
    vec4 A = uInCav[i * 2], B = uInCav[i * 2 + 1];
    if (B.w <= 0.0 || p.x < A.x || p.x > A.z || p.z < A.y || p.z > A.w || p.y < B.x || p.y > B.y) continue;
    float t = B.z < 0.5 ? (A.z - p.x) / (A.z - A.x) : B.z < 1.5 ? (p.x - A.x) / (A.z - A.x) : B.z < 2.5 ? (A.w - p.z) / (A.w - A.y) : (p.z - A.y) / (A.w - A.y);
    a *= 1.0 - B.w * 0.6 * smoothstep(0.05, 0.9, t);
  }
  return a * (1.0 + min(n.y, 0.0) * mix(0.55, 0.15, smoothstep(9.0, 11.5, h)));
}
`;
  const after = `
#ifdef HOUSE_LIGHT
  {
    float kd = mix(1.0, uInK.x, hlIn);
    float ao = mix(1.0, hlAO, uInSh.x);
    iblIrradiance *= kd * ao;
    vec3 hlA = uInAmb;
    int hlR = hlIn > 0.5 ? hlRegion(hlP) : -1;
    if (hlR >= 0) hlA = uInAmbN * uInReg[hlR * 2 + 1].w + uInAmbD + hlSoftLamps(hlP, inverseTransformDirection(normal, viewMatrix), hlR);
    irradiance = (irradiance * kd + hlIn * hlA) * ao;
    radiance *= mix(1.0, uInK.y, hlIn);
  }
#endif
`;
  if (TAPS !== 17) {
    // fewer samples of the sun's shadow map, over the same width (three's own filter takes seventeen)
    const C = THREE.ShaderChunk.shadowmap_pars_fragment, i0 = C.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), i1 = C.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )');
    const at = (x, y) => `texture2DCompare( shadowMap, shadowCoord.xy + vec2( ${f(x)}, ${f(y)} ) * hlR, shadowCoord.z )`;
    const pts = TAPS >= 9 ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] : TAPS >= 5 ? [[0, 0], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]] : [[0, 0]];
    if (i0 > 0 && i1 > i0) THREE.ShaderChunk.shadowmap_pars_fragment = C.slice(0, i0) + `#if defined( SHADOWMAP_TYPE_PCF )\n\t\t\tvec2 hlR = shadowRadius / shadowMapSize;\n\t\t\tshadow = ( ${pts.map(([x, y]) => at(x, y)).join(' + ')} ) * ${f(1 / pts.length)};\n\t\t` + C.slice(i1);
  }
  for (const id of ['standard', 'physical']) {
    const S = THREE.ShaderLib[id];
    S.uniforms.uInAmb = { value: HL.amb };
    S.uniforms.uInK = { value: HL.k };
    S.uniforms.uInSh = { value: HL.sh };
    S.uniforms.uInCav = { value: HL.cav };
    S.uniforms.uInReg = { value: HL.reg };
    S.uniforms.uInAmbN = { value: HL.ambN };
    S.uniforms.uInAmbD = { value: HL.ambD };
    S.uniforms.uInSoft = { value: HL.soft };
    S.uniforms.uInSoftTint = { value: HL.softTint };
    S.uniforms.uInSoftCone = { value: HL.softCone };
    S.uniforms.uInSoftRun = { value: HL.softRun };
    S.fragmentShader = S.fragmentShader
      .replace('#include <common>', '#include <common>\n' + head)
      .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\n' + after);
  }
  // Where the fragment is, before any light is added (only where HOUSE_LIGHT is defined)
  let ch = THREE.ShaderChunk.lights_fragment_begin;
  ch = '#ifdef HOUSE_LIGHT\n\tvec3 hlP = cameraPosition + ( vec4( - vViewPosition, 0.0 ) * viewMatrix ).xyz;\n\tfloat hlIn = houseInside( hlP );\n\t#ifdef HOUSE_LIGHT_ALWAYS\n\thlIn = max( hlIn, houseOver( hlP ) );\n\t#endif\n\tfloat hlAO = houseShade( hlP, inverseTransformDirection( normal, viewMatrix ), hlIn );\n\tmaterial.diffuseColor /= 1.0 + uInK.w * hlIn * max( material.diffuseColor.r, max( material.diffuseColor.g, material.diffuseColor.b ) );\n#endif\n' + ch;
  // Indoors the sky fill (the second, unshadowed directional light) is dropped
  const dir = ch.indexOf('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )');
  const re = ch.indexOf('RE_Direct( directLight', dir);
  // ...and a thing indoors that does not read the shadow map (a mesh without receiveShadow) gets no
  // sun or moon at all: unshadowed, they came straight through the roof, and pale things shone at night
  ch = ch.slice(0, re) + '#if defined( HOUSE_LIGHT ) && ( UNROLLED_LOOP_INDEX > 0 )\n\t\tdirectLight.color *= 1.0 - hlIn * uInK.z;\n\t\t#elif defined( HOUSE_LIGHT )\n\t\tif ( ! receiveShadow ) directLight.color *= 1.0 - hlIn;\n\t\t#endif\n\t\t' + ch.slice(re);
  // The lamps (the point lights, the first loop) are shaded in the corners too, a little
  ch = ch.replace('RE_Direct( directLight', '#ifdef HOUSE_LIGHT\n\t\tdirectLight.color *= mix( 1.0, hlAO, uInSh.y );\n\t\t#endif\n\t\tRE_Direct( directLight');
  THREE.ShaderChunk.lights_fragment_begin = ch;
}
// A material that should be lit as if outdoors wherever it is (window glass)
export function outdoorLit(m) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => { prev?.call(m, sh, r); sh.fragmentShader = sh.fragmentShader.replace('#define HOUSE_LIGHT', ''); };
  const key = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => (key ? key() : '') + '|out';
}
// A material that is a room's finish (plaster, a ceiling, the boards of an open roof): lit as indoors wherever it
// stands over the plan of a building's rooms, also above the boxes of light, which stop under a sloping ceiling.
export function indoorLit(m) {
  if (new URLSearchParams(globalThis.location?.search ?? '').get('indoorlit') === '0') return m;      // (?indoorlit=0: as it was, for comparing)
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => { prev?.call(m, sh, r); sh.fragmentShader = sh.fragmentShader.replace('#define HOUSE_LIGHT', '#define HOUSE_LIGHT\n#define HOUSE_LIGHT_ALWAYS'); };
  const key = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => (key ? key() : '') + '|in';
  m.userData.indoor = true;
  return m;
}

// ---- what the hour asks for ----------------------------------------------------------------
// lampOn: 0 by day, rising through the golden hour, 1 after dark.
export function lampOn(day) { return 1 - smooth(day.light, 0.42, 0.97); }

const NIGHT_AMB = Number(QS.get('amb') ?? 0.5);      // the rooms' own even light after dark (?amb= to try another)
const AMB_DAY = new THREE.Color(0.95, 0.86, 0.72), AMB_NIGHT = new THREE.Color(1.0, 0.74, 0.46), amb = new THREE.Color();
const ambDay = new THREE.Color(), ambNight = new THREE.Color(), tint = new THREE.Color(), HOUR = { L: 1, on: 0 };
// The colour of a room's daylight: mostly the warm bounce off its own floor and walls, but a third of it the
// colour of the sky in the windows at that hour, and in a low sun a little of the sun's own gold.
function daylightTint(day, out) {
  out.copy(AMB_DAY);
  if (LIGHT_OLD || !day.skyCol) return out;
  const sk = tint.copy(day.skyCol); sk.multiplyScalar(1 / Math.max(sk.r, sk.g, sk.b, 1e-3));
  out.lerp(sk, 0.35);
  if (day.sunCol && day.sunK > 0) { const su = sk.copy(day.sunCol); su.multiplyScalar(1 / Math.max(su.r, su.g, su.b, 1e-3)); out.lerp(su, 0.25 * day.sunK * (1 - day.low)); }
  return out;
}
export function setHourLight(day, materials) {
  const on = lampOn(day), L = day.light;
  // indoors: how much of the sky comes in, and the room's own light
  HL.k.x = lerp(0.12, 0.42, L);           // sky diffuse
  HL.k.y = lerp(0.1, 0.3, L);             // sky reflections
  HL.k.z = 1;                              // no sky fill through walls
  // By lamplight the eye is wide open (exposure, below) and anything white near a lamp burns out to
  // paper white beside mid-toned walls, as if lit from within. The palest surfaces are held back a
  // little after dark (white about a third, mid-tones hardly at all); by day nothing changes.
  HL.k.w = 0.7 * on;
  // (shops keep their lights on: after dark they are as bright inside as by day, only warmer)
  ambDay.copy(daylightTint(day, ambDay)).multiplyScalar(0.56); ambNight.copy(AMB_NIGHT).multiplyScalar(NIGHT_AMB);
  amb.copy(ambNight).lerp(ambDay, L);
  HL.amb.x = amb.r; HL.amb.y = amb.g; HL.amb.z = amb.b;
  HOUR.L = L; HOUR.on = on; setRoomAmb();
  // emissive glows: lamps and their shades
  for (const m of materials.glows ?? []) m.emissiveIntensity = m.userData.e0 * lerp(m.userData.day ?? 0.06, 1, on);
}

// The even light in its two parts (rooms that light themselves scale the first after dark; by day they are as any
// room), and what the level of the room you are in comes to for the eye
function setRoomAmb() {
  HL.ambN.x = ambNight.r * (1 - HOUR.L); HL.ambN.y = ambNight.g * (1 - HOUR.L); HL.ambN.z = ambNight.b * (1 - HOUR.L);
  HL.ambD.x = ambDay.r * HOUR.L; HL.ambD.y = ambDay.g * HOUR.L; HL.ambD.z = ambDay.b * HOUR.L;
  ROOM.eff = lerp(1, ROOM.k, HOUR.on);
}

// ---- glowing windows and their light on the ground, after dark ------------------------------
export function makeWindowGlow({ scene, materials, windows, rooms, groundY = 0.56 }) {
  const glass = materials.glass;
  outdoorLit(glass);
  // Lamplight on the panes. A pane is smooth, so each lit lamp left a soft bright smear on it: from indoors after
  // dark, pale blobs hung in every window, over the garden. The sun's glint by day is kept; the renderer's highlights
  // are faded out as the lamps come on (update, below), and the lamps are shown in the glass as GLINT draws them.
  // After dark a pane shows the lamps as a dark window does: each lit lamp as a small soft disc, the size its shade
  // would be in a mirror at that distance and a fraction as bright, where the eye would see it reflected. (The
  // renderer's own highlight of a lamp on smooth glass is a point of enormous brightness whose skirts spread into
  // a pale blob; that is what is faded out.)
  const GLINT = `
	reflectedLight.directSpecular *= uGlint;
	#if NUM_POINT_LIGHTS > 0
	if ( uGlint < 0.999 ) {
		vec3 glR = reflect( - geometryViewDir, normal );
		for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
			vec3 glD = pointLights[ i ].position - geometryPosition; float glL = length( glD );
			vec3 glC = pointLights[ i ].color; float glM = max( glC.r, max( glC.g, glC.b ) );
			if ( glM < 0.01 || glL > 18.0 || dot( normal, glD ) <= 0.0 ) continue;      // (a lamp on the eye's side of the pane, and near: not one in another room)
			float glA = acos( clamp( dot( glR, glD / glL ), - 1.0, 1.0 ) ), glS = 0.3 / max( glL, 1.0 ), glQ = glA / glS;
			float glK = exp( - glQ * glQ * 1.6 ) * ( 1.0 - smoothstep( 9.0, 18.0, glL ) );
			reflectedLight.directSpecular += ( 1.0 - uGlint ) * uGlintLamp * glK * smoothstep( 0.0, 6.0, glM ) * ( glC / glM ) / max( opacity, 0.05 );
		}
	}
	#endif
`;
  const glint = { value: 1 }, glintLamp = { value: Number(new URLSearchParams(globalThis.location?.search ?? '').get('lampglint') ?? 0.09) };
  { const prev = glass.onBeforeCompile, key = glass.customProgramCacheKey?.bind(glass);
    glass.onBeforeCompile = (sh, r) => { prev?.call(glass, sh, r); sh.uniforms.uGlint = glint; sh.uniforms.uGlintLamp = glintLamp; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlint, uGlintLamp;').replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + GLINT); };
    glass.customProgramCacheKey = () => (key ? key() : '') + '|glint3'; }
  // After dark the glass glows amber from outside (as the house's does), but only where a room stands behind it:
  // the shader looks four feet past the pane (the walls are up to two thick), along the line of sight, and asks
  // whether that is indoors (the boxes of light). An attic or a stair with no box behind its window stays dark glass. One material for every
  // pane on the island, so it is all lit rooms or none; the rooms' own lamps and light, seen through the glass,
  // do the rest. (The pane is nearly clear, and its light is tone-mapped before it is laid over the room behind,
  // so a glow on clear glass could never show more than a seventh of itself: where it glows the pane is made
  // a little less clear, as old glass with a lit room behind it looks from the dark. Never from indoors, by the
  // shader's own boxes as well as the eye's place: seen from a room at a glancing angle beside its frames, four feet
  // past the pane can still be within the room's box, and a clouded pane there showed the night sky's reflection as
  // a strip of bright blue down the jambs and along the sill.)
  if (!LIGHT_OLD) {
    glass.emissive = new THREE.Color(0xffb15e); glass.emissiveIntensity = 0;
    const prev = glass.onBeforeCompile;
    glass.onBeforeCompile = (sh, r) => { prev?.call(glass, sh, r);
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n\t{ vec3 wp = cameraPosition + ( vec4( - vViewPosition, 0.0 ) * viewMatrix ).xyz; float g = houseInside( wp + normalize( wp - cameraPosition ) * 4.0 ) * ( 1.0 - houseInside( cameraPosition ) ); totalEmissiveRadiance *= g; diffuseColor.a = mix( diffuseColor.a, ${f(GLASS_A)}, g * clamp( emissive.r / ${f(GLASS_GLOW)}, 0.0, 1.0 ) ); }`); };
    const key = glass.customProgramCacheKey?.bind(glass);
    glass.customProgramCacheKey = () => (key ? key() : '') + '|lit';
  }
  // cards on the ground below the ground-floor windows (one draw)
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 18, 2, 32, 26, 40); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); return t;
  })();
  // Each window is given in world terms by building.js: { x, z } the middle of the opening on the wall's outside
  // face, { nx, nz } the way out, w its width, y the ground below it.
  const pos = [], uv = [], idx = [];
  for (const w of windows) {
    const len = 11, wide = w.w + 3, tx = -w.nz, tz = w.nx, y = (w.y ?? groundY) + 0.06;
    const P = (u, d) => [w.x + tx * u + w.nx * d, w.z + tz * u + w.nz * d];
    const n = pos.length / 3;
    for (const [u, d, a, b] of [[-wide / 2, 0.9, 0, 0], [wide / 2, 0.9, 1, 0], [wide / 2, len, 1, 1], [-wide / 2, len, 0, 1]]) { const [x, z] = P(u, d); pos.push(x, y, z); uv.push(a, 1 - b); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3, n, n + 2, n + 1, n, n + 3, n + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  // (no slope factor in the offset: from the basement, where the eye is barely above grade, a slope-scaled offset
  // pulled these patches of window light on the ground through two feet of wall as a bright line at sill height)
  const spillMat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffb466, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -4 });
  const spill = new THREE.Mesh(geo, spillMat); spill.name = 'window light'; spill.userData.cat = 'window light'; spill.renderOrder = 1; spill.visible = false;
  scene.add(spill);
  return {
    // night: 0..1; outside: is the eye outdoors (glass glows only from outside)
    update(night, outside, glowsOn) {
      glint.value = new URLSearchParams(globalThis.location?.search ?? '').get('glint') === '1' ? 1 : 1 - Math.min(1, Number(glowsOn) || 0);      // (?glint=1: as it was)
      const k = Math.max(smooth(night, 0.25, 0.9), 0.6 * (Number(glowsOn) || 0));      // the windows begin to glow as the lamps come on at dusk
      spillMat.opacity = 0.3 * k; spill.visible = k > 0.01;
      if (!LIGHT_OLD) glass.emissiveIntensity = outside ? GLASS_GLOW * k : 0;
    },
  };
}

const GLASS_GLOW = Number(QS.get('glassglow') ?? 0.45), GLASS_A = Number(QS.get('glassa') ?? 0.3);      // the glow of a lit room's pane, and how far it clouds the glass

// ---- the lamp pool ------------------------------------------------------------------------
// lamps: { x, y, z, power, kind } (kind 'fill' | 'lamp' | 'candle' | 'fire'). Four point lights
// are shared out. Their falloff depends on the kind: lamps and candles make pools, fills and
// the fire spread wide.
const TINT = { fire: 0xff9a4a, candle: 0xffb060, corona: 0xffb468, lamp: 0xffcf96, fill: 0xffe6c8, lantern: 0xffc583 };      // (corona: a hoop of candles hung high, as in the chapel)
const SHAPE = { fill: [36, 1.0], lamp: [26, 1.9], candle: [12, 2.0], corona: [38, 1.5], fire: [26, 1.5], lantern: [32, 1.35] };
const LAMP = 13;
// Where the light sits relative to the lamp's record: fills come down from near the ceiling (they
// left hot spots on it); lamps hang just below the shade's rim or the lantern's glass, since a light
// a few inches inside a shade lit the fabric chalk white whatever its glow.
const DROP = { fill: 1.8, lamp: 0.45 };
export function makeLampPool({ scene, lamps, vis, size, day, camera }) {
  const pool = Array.from({ length: size }, () => { const p = new THREE.PointLight(0xffdcb0, 0, 30, 1.7); scene.add(p); return { light: p, lamp: null, level: 0 }; });
  // how strong a lamp is at this hour
  const strength = l => {
    if (LIGHT_OLD && l.pilot) return 0;                 // (?light=old: the lamps added for the lighting pilot are not there)
    const on = lampOn(day);
    if (l.kind === 'fill') return l.power * 0.4 * smooth(day.light, 0.25, 0.9);
    if (l.kind === 'lamp') return l.power * on * 2.2;
    if (l.kind === 'candle') return l.power * (0.6 + 1.6 * on);
    if (l.kind === 'corona') return l.power * (0.3 + 2.1 * on);      // candlelight: faint against the day, the room's light after dark
    if (l.kind === 'glow') return 0;                                 // a flame's halo only (makeHalos): it lights nothing by itself
    return l.power * (1 + day.night);                   // fire
  };
  const zoneOf = l => (l.zone ??= vis.roomAt(l.x, l.y, l.z)?.id ?? 'o:');
  // "seen" is remembered for a few seconds, so that turning your head on a landing does not
  // keep trading one lamp for another (which pulsed the whole view)
  let nowT = 0;
  const seen = l => { if (zoneOf(l) === 'o:' ? vis.state.out : vis.state.seen.has(l.zone)) l.seenAt = nowT; return nowT - (l.seenAt ?? -1e9) < 6; };
  const here = l => vis.state.here.includes(zoneOf(l));
  // Smaller is better: distance (height counts triple, floors apart), less for strong lamps,
  // much less for the room you are in, more for lamps behind walls, and a little stickiness.
  function score(l, eye, held) {
    const s = strength(l);
    if (s <= 0.01) return Infinity;
    const d = Math.hypot(l.x - eye.x, l.z - eye.z) + Math.abs(l.y - eye.y) * 3;
    const outside = vis.state.here.includes('out'), indoorLamp = zoneOf(l) !== 'o:';
    return d / (0.4 + s) * (here(l) ? 0.55 : seen(l) ? 1 : 2.2) * (held ? 0.62 : 1)
      * (l.kind === 'fire' ? 0.5 : 1)                    // a lit fire is always worth one of the four
      * (outside && indoorLamp ? 1.8 : 1)                // from the garden, rooms glow by themselves (lighting.js); light the garden
      * (!outside && !indoorLamp && !LIGHT_OLD ? 2.2 : 1); // and from indoors a street lamp beyond the glass lights little of the room
  }
  let lantern = null;                                    // { pos: Vector3 } when carried
  const tmp = new THREE.Vector3();
  function choose(eye, n, held = new Set()) {
    return lamps.filter(l => l.power > 0)
      .map(l => ({ l, d: score(l, eye, held.has(l)) })).filter(o => o.d < Infinity)
      .sort((a, b) => a.d - b.d).slice(0, n).map(o => o.l);
  }
  function update(eye, dt, t) {
    nowT = t;
    const n = size - (lantern ? 1 : 0);
    const near = choose(eye, n, new Set(pool.map(s => s.lamp).filter(Boolean)));
    const slots = lantern ? pool.slice(0, n) : pool;
    // Coming into a room, its lamps must not wait their turn: a lamp of the room you stand in that has no
    // light yet takes one from a lamp elsewhere at once if that lamp's room is out of sight, and in a
    // fifth of a second if not. (Each light used to fade out over a second and a half first, and the
    // room stood dark, with only its shades glowing, while the eye had already adjusted to indoors.)
    // The same change as in the house (my_house, lighting.js).
    const urgent = near.some(l => here(l) && !pool.some(o => o.lamp === l));
    const inSight = l => here(l) || (zoneOf(l) === 'o:' ? vis.state.out : vis.state.seen.has(l.zone));
    for (const s of slots) {
      if (s.lamp === 'lantern') { s.lamp = null; s.level = 0; }
      const wanted = s.lamp && near.includes(s.lamp), mine = s.lamp && here(s.lamp), hurry = urgent && s.lamp && !wanted && !mine;
      if (hurry && !inSight(s.lamp)) s.level = 0;
      s.level += ((wanted ? 1 : 0) - s.level) * Math.min(1, dt * (wanted ? (mine ? 10 : 5.5) : hurry ? 14 : 2.4));      // otherwise slow, so a change of lamp is a drift, not a blink
      if (!wanted && s.level < (hurry ? 0.06 : 0.02)) {
        const free = near.find(l => !pool.some(o => o.lamp === l));
        s.lamp = free ?? null; s.level = free ? s.level : 0;
        if (free) { s.light.position.set(free.x, free.y - (DROP[free.kind] ?? 0), free.z); s.light.color.set(TINT[free.kind]); [s.light.distance, s.light.decay] = SHAPE[free.kind]; }
      }
      const live = s.lamp && (s.lamp.kind === 'fire' || s.lamp.kind === 'candle' || s.lamp.kind === 'corona');
      const flicker = live ? 1 + 0.1 * Math.sin(t * 9.1 + s.lamp.x) + 0.07 * Math.sin(t * 23.7 + s.lamp.z) + 0.04 * Math.sin(t * 41.3) : 1;
      s.light.intensity = s.lamp ? LAMP * strength(s.lamp) * s.level * flicker * poolShare(s.lamp) : 0;
    }
    if (lantern) {
      const s = pool[size - 1];
      if (s.lamp !== 'lantern') { s.lamp = 'lantern'; s.level = 0; s.light.color.set(TINT.lantern); [s.light.distance, s.light.decay] = SHAPE.lantern; }
      s.level += (1 - s.level) * Math.min(1, dt * 4);
      camera.localToWorld(s.light.position.copy(lantern.at));
      const flick = 1 + 0.035 * Math.sin(t * 13.3) + 0.025 * Math.sin(t * 29.1);
      s.light.intensity = lantern.power * lerp(0.35, 1, day.night) * s.level * flick;
    } else if (pool[size - 1].lamp === 'lantern') { pool[size - 1].lamp = null; pool[size - 1].level = 0; pool[size - 1].light.intensity = 0; }
    if (REGIONS.length) roomUpdate(eye, dt);
  }
  // Rooms that light themselves (roomLight, above): the one the eye is in and the nearest others, each at its own
  // level, so that a room seen through a door is lit as itself. Coming indoors their levels are taken over a second
  // or so (from out of doors every room is as it was, so its windows glow across the lawn); the eye opens to meet
  // the room it stands in (makeExposure). Their lamps near the eye that the pool has not lit are lit in the shader.
  // A shaded lamp of such a room gives the pool's point light (which shines all round, up the wall and onto the
  // ceiling) only a third of its light, and the shader the rest, in its cone.
  const inRoom = (l, r) => l.x > r.x0 && l.x < r.x1 && l.z > r.z0 && l.z < r.z1 && l.y > r.y0 && l.y < r.y1;
  const CONE_POOL = 0.35;
  const regOf = l => (l.__reg === undefined ? (l.__reg = REGIONS.find(r => inRoom(l, r)) ?? null) : l.__reg);
  const poolShare = l => (l.cone && regOf(l) && ROOM.act.includes(l.__reg) ? lerp(1, CONE_POOL, ROOM.in) : 1);
  const softC = new THREE.Color(TINT.lamp);
  HL.softTint.x = softC.r; HL.softTint.y = softC.g; HL.softTint.z = softC.b;
  const away = (r, p) => Math.hypot(Math.max(r.x0 - p.x, 0, p.x - r.x1), Math.max(r.z0 - p.z, 0, p.z - r.z1), 3 * Math.max(r.y0 - p.y, 0, p.y - r.y1));
  function roomUpdate(eye, dt) {
    const indoors = !vis.state.here.includes('out'), here = regionAt(eye);
    ROOM.in += ((indoors ? 1 : 0) - ROOM.in) * Math.min(1, dt * 1.6);
    ROOM.k += ((here && indoors ? here.night : 1) - ROOM.k) * Math.min(1, dt * 1.6);
    setRoomAmb();
    // (As the house: a room joins or leaves the nearest few over a third of a second, never at a stroke. Seen through a
    // doorway, its lamps and its own level otherwise jumped on as you crossed the room before it. Anna, 2026-11-21:
    // "Can you incorporate the lighting fix from the house?")
    const want = ROOM.in < 0.01 ? [] : REGIONS.map(r => [r, away(r, eye)]).filter(([, d]) => d < 70).sort((a, b) => a[1] - b[1]).slice(0, NREG).map(([r]) => r);
    const ease = EASE ? Math.min(1, dt * 7) : 1;
    for (const r of REGIONS) { const to = want.includes(r) ? 1 : 0; r.lv = (r.lv ?? 0) + (to - (r.lv ?? 0)) * ease; if (!to && r.lv < 0.02) r.lv = 0; }
    ROOM.act = REGIONS.filter(r => r.lv > 0).sort((a, b) => (want.includes(b) ? 1 : 0) - (want.includes(a) ? 1 : 0) || b.lv - a.lv).slice(0, NREG);
    HL.reg.fill(0);
    ROOM.act.forEach((r, i) => HL.reg.set([r.x0, r.z0, r.x1, r.z1, r.y0, r.y1, 1, lerp(1, r.night, ROOM.in * r.lv)], i * 8));
    // their lamps near the eye, each lit by the shader as far as the pool has not lit it
    const lvl = new Map(pool.map(s => [s.lamp, s.level])), w = ROOM.in;
    const mine = ROOM.act.length ? lamps.filter(l => l.kind === 'lamp' && l.power > 0 && regOf(l) && ROOM.act.includes(l.__reg))
      .map(l => ({ l, d: Math.hypot(l.x - eye.x, l.y - eye.y, l.z - eye.z), s: strength(l) * (1 - (lvl.get(l) ?? 0) * poolShare(l)) * w * (l.__reg.lv ?? 1) })).filter(o => o.s > 0.002 && o.d < 60)
      .sort((a, b) => a.d * (a.l.__reg === here ? 1 : 2.5) - b.d * (b.l.__reg === here ? 1 : 2.5)).slice(0, SOFT) : [];      // (the room the eye is in first: a neighbour's lamps, nearer in a straight line through the wall, took its places and left its far tables dark)
    if (SOFT_FAST) { mine.sort((a, b) => ROOM.act.indexOf(a.l.__reg) - ROOM.act.indexOf(b.l.__reg)); HL.softRun.fill(0); mine.forEach((o, k) => { const r = ROOM.act.indexOf(o.l.__reg); if (!HL.softRun[r * 2 + 1]) HL.softRun[r * 2] = k; HL.softRun[r * 2 + 1] = k + 1; }); }
    let i = 0;
    for (const { l, s } of mine) { HL.soft.set([l.x, l.y - DROP.lamp, l.z, LAMP * s], i * 4); HL.softCone[i] = 2 * ROOM.act.indexOf(l.__reg) + (l.cone ? 1 : 0); i++; }
    if (i < SOFT) HL.soft[i * 4 + 3] = 0;
  }
  return {
    update, strength, pool, choose,
    describe: l => `${l.kind}${l.halo ? '*' : ''}@${(l.zone ?? zoneOf(l)).replace('r:', '')}:${strength(l).toFixed(2)}`,
    setLantern(on, o = {}) { lantern = on ? { at: new THREE.Vector3(...(o.at ?? [0.55, -0.42, -1.1])), power: o.power ?? 22 } : null; },
    get lanternOn() { return !!lantern; },
  };
}

// ---- eyes adjusting -----------------------------------------------------------------------
// Targets by where you are (in / half / out) and the hour; changes are made in log space, quick
// toward darker and almost as quick toward brighter, so stepping outside never whites out and a room is
// never left dark while the eye catches up.
const EYE_OPEN = Number(QS.get('eyeopen') ?? 0.17);
export function makeExposure(Q) {
  const inDay = Number(Q.get('exp') ?? 1.6);
  const T = { in: [inDay, 2.0, 2.6], half: [1.35, 1.9, 2.45], out: [0.8, 1.35, 2.2] };     // day, dusk, night
  let cur = null;
  function target(where, day) {
    const [a, b, c] = T[where] ?? T.out, on = lampOn(day);
    // day -> dusk as the lamps come on; dusk -> night as the sky goes dark
    return day.night > 0.5 ? lerp(b, c, smooth(day.night, 0.5, 1)) : lerp(a, b, Math.min(1, on * 1.4));
  }
  return {
    update(renderer, where, day, dt, snap) {
      // in a room that has brought its own light down after dark, the eye opens a little to meet it: a sixth
      // of the way (in log terms), so the room reads darker than its neighbours but never black
      const aim = target(where, day) * (where === 'in' ? Math.pow(ROOM.eff, -EYE_OPEN) : 1);
      if (cur === null || snap) cur = aim;
      else { const k = aim < cur ? 3.4 : 3.6;      // (it used to take two or three seconds to brighten on coming indoors: a room stood dark while it did)
        cur = Math.exp(Math.log(cur) + (Math.log(aim) - Math.log(cur)) * Math.min(1, dt * k)); }
      renderer.toneMappingExposure = cur;
    },
    target,
  };
}

// ---- vignette --------------------------------------------------------------------------------
export function makeVignette() {
  const v = document.createElement('div');
  v.setAttribute('aria-hidden', 'true');
  Object.assign(v.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '1', transition: 'opacity 1.5s', background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 55%, rgba(12,8,4,.22) 82%, rgba(8,5,2,.42) 100%)' });
  const canvas = document.querySelector('canvas');
  (canvas?.parentNode ?? document.body).insertBefore(v, canvas?.nextSibling ?? null);
  return { set(night) { v.style.opacity = String(0.55 + 0.45 * night); } };
}

// ---- halos: the soft glow round a lit shade or a candle flame -------------------------------
// One instanced, camera-facing quad per lamp (a single draw), additive, faded in with the lamps.
// Lamps carry `halo` (a size in feet) where kit/light.js made a shade; candles get a small one
// while lit. Walls hide them as they hide anything else.
export function makeHalos({ scene, lamps, day }) {
  const list = () => lamps.filter(l => l.halo || l.kind === 'candle');
  let L = list();
  const N = Math.max(1, L.length + 16);
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4);            // xyz, size
  const aOn = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
  aPos.setUsage(THREE.DynamicDrawUsage); aOn.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', aPos); geo.setAttribute('aOn', aOn); geo.instanceCount = 0;
  const uK = { value: 0 }, uT = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uK, uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute vec4 aPos; attribute float aOn; uniform float uT; varying vec2 vUv; varying float vA;
void main() { vUv = uv * 2.0 - 1.0; vA = aOn * (1.0 + 0.05 * sin(uT * 9.0 + aPos.x * 3.0) * step(aPos.w, 1.2));
  vec4 mv = viewMatrix * vec4(aPos.xyz, 1.0); mv.xy += position.xy * aPos.w; mv.z += 0.3 * aPos.w; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; varying vec2 vUv; varying float vA;
void main() { float r = dot(vUv, vUv); if (r > 1.0) discard; float g = (1.0 - r); g = g * g * g; gl_FragColor = vec4(vec3(1.0, 0.64, 0.33) * g * vA * uK, 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'halos'; mesh.userData.cat = 'halos';
  scene.add(mesh);
  return {
    update(t) {
      if (L.length !== list().length) L = list();
      const on = lampOn(day);
      uK.value = 0.22 * on; uT.value = t;
      let n = 0;
      if (on > 0.01) for (const l of L) {
        if (n >= N) break;
        const candle = l.kind === 'candle';
        if (l.power <= 0) continue;
        aPos.setXYZW(n, l.x, l.y + (candle ? -0.12 : 0.05), l.z, candle ? 0.9 : (l.halo ?? 1) * 2.4); aOn.setX(n, candle ? 1.4 : 1); n++;
      }
      geo.instanceCount = n; mesh.visible = n > 0;
      aPos.needsUpdate = aOn.needsUpdate = true;
    },
  };
}
