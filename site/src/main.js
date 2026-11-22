import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Builder } from './builder.js';
import { makeMaterials } from './materials.js';
import { layGrounds } from './grounds.js';
import { buildCampus, groundsLife, groundAt, wearAt, outlineAt, TREES, ISLAND, RIM, placeName } from './campus.js';
import { buildIsland } from './island.js';
import { makeTrees } from './trees.js';
import { bringToLife } from './life.js';
import { Walker, eyeHeight, setEyeHeight } from './walk.js';
import { buildSky } from './sky.js';
import { makeSound } from './sound.js';
import { makeAbout } from './about.js';
import { namedView, statsDump, VIEWS } from './perf.js';
import { makeVisibility } from './visibility.js';
import { chooseQuality, rememberSlow, QUALITY_OPTIONS, storedChoice, chooseTier, takeContext } from './quality.js';
import { setTextureTier, sharpenTextures, markDressed } from './materials.js';
import { HL, installHouseLight, setHourLight, makeLampPool, makeExposure, makeWindowGlow, makeVignette, makeHalos } from './lighting.js';
import { makeWarmer } from './warm.js';
import { makeShade } from './shade.js';

import { loadFonts } from './fonts.js';
import { makePost } from './post.js';
import { makeFrameMeter } from './engine/frame.js';
import { openStage } from './engine/stage.js';
import { pictureInfo } from './engine/picinfo.js';

// Every label, leaf and painted stone on the island is painted on a 2D canvas and handed to the renderer as
// a texture. Browsers keep such canvases on the graphics card unless told otherwise, and a card that is
// short of memory can silently drop them: the canvas comes back blank, and trees lose their leaves or signs
// go black. Kept in ordinary memory they cannot be lost, and they upload to WebGL without a read-back.
{ const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, opts) { return get.call(this, type, type === '2d' ? { willReadFrequently: true, ...opts } : opts); }; }
await loadFonts();      // anything lettered is painted at start-up: the typeface first (fonts.js)
const Q = new URLSearchParams(location.search);
if (Q.has('loadlog')) { const M = THREE.DefaultLoadingManager, open = new Map(), s0 = M.itemStart, e0 = M.itemEnd; window.__loadlog = []; M.itemStart = u => { open.set(u, performance.now()); s0(u); }; M.itemEnd = u => { window.__loadlog.push([u.slice(-60), Math.round(open.get(u)), Math.round(performance.now())]); open.delete(u); e0(u); }; window.__loadopen = () => [...open.keys()]; }      // (?loadlog: what the threshold is waiting for, and when each came)
const $ = id => document.getElementById(id);
const sound = makeSound();

// ---- Renderer -------------------------------------------------------------------
// Sharpness is traded for speed automatically: the drawing resolution starts
// modest and drops further if the frame rate cannot keep up.
// The quality tier (quality.js) sets the starting resolution, antialiasing, shadow detail
// and texture sizes; ?quality=low|medium|high forces one.
const QUALITY = chooseQuality(Q);
setTextureTier(QUALITY.tex);
// ?post=1: drawn small into a picture of its own, then enlarged and sharpened to a canvas at the screen's own pixels
// (post.js); otherwise the canvas itself is the small picture and the browser stretches it.
const POST = Q.get('post') === '1';
const MAX_RATIO = Math.min(devicePixelRatio, Number(Q.get('ratio') ?? (POST ? Math.min(1, QUALITY.ratio) : QUALITY.ratio)));
let ratio = MAX_RATIO;
const renderer = new THREE.WebGLRenderer({ antialias: QUALITY.antialias && !POST, powerPreference: 'high-performance', ...(POST ? {} : takeContext(QUALITY.antialias)) });
renderer.setPixelRatio(POST ? Math.min(devicePixelRatio, Number(Q.get('out') ?? 2)) : ratio);
renderer.setSize(innerWidth, innerHeight);
const post = POST ? makePost(renderer, { scale: ratio, samples: QUALITY.antialias ? 4 : 0, sharp: Number(Q.get('sharp') ?? 0.6) }) : null;
post?.setSize(innerWidth, innerHeight);
const draw = () => (post ? post.render(scene, camera) : renderer.render(scene, camera));
const setRatio = r => (post ? post.setScale(r) : renderer.setPixelRatio(r));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = QUALITY.softShadow ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.25, 3000);

// ---- Sky, sun and the hour ---------------------------------------------------------
// The light follows the visitor's own clock (see sky.js).
const sky = buildSky(scene, renderer, new THREE.Vector3(0, 8, 0));
const sun = sky.sun, day = sky.state;
sun.shadow.mapSize.set(QUALITY.shadow, QUALITY.shadow);
const now = new Date();
// The school keeps the visitor's own clock, as the house and the town do (so they agree when you travel
// between them); ?time=17.5 or ?time=dusk sets it, and [ and ] and the settings card move it.
let hour = Q.has('time') ? (Q.get('time') === 'dusk' ? sky.dusk : Number(Q.get('time'))) : now.getHours() + now.getMinutes() / 60;
function setHour(h) {
  sky.setHour(h); hour = day.hour;
  setHourLight(day, materials);
  const hh = Math.floor(hour), mm = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
  const part = hour < 5 ? 'at night' : hour < 12 ? 'in the morning' : hour < 17 ? 'in the afternoon' : hour < 21 ? 'in the evening' : 'at night';
  $('clock').textContent = `${((hh + 11) % 12) + 1}:${mm} ${part}`;
}

// ---- The buildings, the grounds and the trees ------------------------------------------
// ?only=stone (or snow,library) builds only those buildings; ?sites pegs out every site's allowance;
// ?facing=stone:north turns a site to face another way (a test).
const builder = new Builder();
builder.zone = 'shell';                                   // a building's own fabric is always drawn (see visibility.js)
const STAGE = {}, mark = k => { STAGE[k] = Math.round(performance.now()); };      // start-up timings, for perf.js
mark('start');
const stage = openStage({ mark, onEarlyEnter: () => sound.start(), early: Q.get('early') === '1' });      // the place opens on a picture before it is furnished (engine/stage.js): the photos are counted from here
// The furniture comes after the picture. A plain visit opens on the island seen from above, where no room can be
// seen into: so the buildings are built bare, the island is drawn and the threshold lifts, and what stands in the
// rooms is made behind that picture, a furnish file at a time (campus.js furnishRest), before anything else is set
// going. Any address that asks for a particular view or test builds everything at once, as before (so does ?stream=0).
const PLAIN = new Set(['from', 'fps', 'quality', 'time', 'stages', 'loadlog', 'welcome', 'stream', 'aa', 'lamps', 'tex', 'shadow', 'ratio', 'taps', 'boxes', 'soft', 'light', 'post', 'sharp', 'out', 'ahead', 'ease', 'early']);
const STREAM = Q.has('stream') ? Q.get('stream') !== '0' : [...Q.keys()].every(k => PLAIN.has(k));
const house = buildCampus(builder, { defer: STREAM, only: Q.has('only') ? Q.get('only').split(',') : null, marks: Q.has('sites'), facing: Q.has('facing') ? Object.fromEntries(Q.get('facing').split(',').map(p => p.split(':'))) : null }); mark('house');
installHouseLight(house.boxes);                                                // indoor light, patched into the shaders before anything compiles (lighting.js)
const { surfaces, rooms, lamps, spawn, items } = house;
const vis = makeVisibility({ rooms, portals: house.portals, footprints: house.footprints, quality: QUALITY });
builder.zone = null; builder.zoner = vis.zoner;          // anything added from here on goes to the zone it stands in
for (const l of lamps) l.kind = l.fire ? 'fire' : (l.kind ?? 'fill');
lamps.push(...items.lamps); items.lamps = lamps; mark('furnish');
const GROUNDS_FITTED = true;      // (the plan was made smaller on 21 November: the garden is laid again for it; ?grounds=1 shows it meanwhile)
const garden = Q.get('grounds') === '0' || (!GROUNDS_FITTED && Q.get('grounds') !== '1') ? null : layGrounds(builder, items);      // the courtyard's garden and the meadow (grounds.js)      // the walks, the dial, the seat, the Landing, the planting (grounds.js)
const materials = makeMaterials(renderer, QUALITY);
const zoned = builder.finalize(scene, materials); mark('finalize');
// Everything outdoors hangs from one group, hidden whenever no window or outside door is in view.
const outdoors = new THREE.Group(); outdoors.name = 'outdoors'; scene.add(outdoors);

if (Q.get('trees') !== '0') makeTrees(outdoors, materials, builder.colliders, TREES);
mark('trees');

// The ground: a floating island (island.js, as at the house and the town), except that here the land has a
// shape (it rises a little toward Snow Hall) and the paths across the green are worn into it (campus.js).
// (No island of its own is drawn: this place is cut into the side of the house's island, and all that is seen of that
// is the cliff, which is the building's. Anna: "there shouldn't be the grass poking out, it should be like stone/earth all around.")
if (Q.get('island') === '1') buildIsland({ ISLAND, outlineAt, materials, outdoors, height: groundAt, wear: wearAt });

mark('island');
const ABOVE = [-128, 24, 60], ABOVE_AT = [28, 19, 60];      // (Spanya has no top: seen from the south, level with the cut, never from above)
const SWAY = { mid: -Math.PI / 2, half: 0.34, period: 64 };      // the first view swings left and right across the courtyard's mouth instead of going round      // the first view: from the south-east, over the open side of the green
const exposure = makeExposure(Q);
const winGlow = makeWindowGlow({ scene: outdoors, materials, windows: house.windows });
if (house.furnishRest) {
  camera.near = 2; camera.updateProjectionMatrix(); camera.position.set(...ABOVE); camera.lookAt(...ABOVE_AT);
  sky.setHour(hour); setHourLight(sky.state, materials); sun.shadow.needsUpdate = true;
  await stage.furnish(house.furnishRest(), {
    picture: () => {
      exposure.update(renderer, 'out', sky.state, 1, true);
      winGlow.update(sky.state.night, true, 1 - THREE.MathUtils.smoothstep(sky.state.light, 0.42, 0.97));
      sky.update(0, 0, camera); draw();
    },
    each: step => { if (step === 'built') zoned.push(...builder.finalize(scene, materials)); },
  });
}
const life = bringToLife({ scene, outdoors, vis, quality: QUALITY, renderer, camera, items, garden: null, materials, doors: house.doors, colliders: builder.colliders, onChange: () => { sun.shadow.needsUpdate = true; } });

// What the parts that move and answer back are given (b.later in a building; the grounds).
const ctx = { THREE, scene, camera, renderer, materials, house, items, flash: t => flash(t), zoom: on => { camera.fov = on ? 13 : WALK_FOV; camera.updateProjectionMatrix(); walker.lookScale = on ? 0.22 : 1; ctx.zoomed = !!on; }, colliders: builder.colliders, interact: life.interact, animated: life.animated, loadModel: life.loadModel, track: life.track, zoneAt: life.zoneAt, sound, day, get walker() { return walker; }, get mode() { return mode; }, get aimed() { return aimed; }, get flashlight() { return torch.intensity > 0; } };
pictureInfo({ extras: items.extras ?? [], interact: life.interact, say: t => window.houseUI?.toast?.(t, 6000) });      // E on a hung picture: its title, artist and year (engine/picinfo.js)
mark('life');
groundsLife(ctx);                                                             // the breeze in the trees
try { garden?.setup?.(Object.create(ctx, { scene: { value: outdoors } })); } catch (e) { console.error('grounds', e); }      // the grounds' own things go in the outdoors group
mark('gardenSetup');
for (const f of items.later ?? []) { try { f(ctx); } catch (e) { console.warn('building', e); } }      // what the buildings set going once the scene exists (b.later)
mark('later');
// A mesh made without a material stops three.js drawing anything at all. While rooms are still being furnished that
// happens: so such a mesh is given plain grey and named in the console, and the page goes on.
{ const fallback = new THREE.MeshStandardMaterial({ color: 0x7d7770, roughness: 0.9 }), sweep = () => scene.traverse(o => { if ((o.isMesh || o.isLine || o.isPoints) && !o.material) { o.material = fallback; const w = o.getWorldPosition(new THREE.Vector3()); console.error('a mesh with no material at plan X ' + w.z.toFixed(1) + ', Y ' + w.x.toFixed(1) + ', h ' + w.y.toFixed(1) + ' (zone ' + (o.userData.zone ?? '?') + '): drawn grey'); } }); sweep(); setInterval(sweep, 2000); }
import('./guestbook.js').then(m => { window.__guestbook = m; }).catch(e => console.warn('guest book', e));      // the guest book on the concierge's desk (guestbook.js): the Hall's furniture opens it with window.__guestbook.open()
import('./reticle.js').then(m => m.setupReticle(ctx)).catch(e => console.warn('reticle', e));      // the mark in the middle, and the ring on what it has hold of
import('./welcome.js').then(m => m.setupWelcome(ctx)).catch(e => console.warn('welcome', e));      // the fade from the view above to the Landing

// ---- Lamps ---------------------------------------------------------------------------
// Only four lights are ever lit (three on the low tier), shared out among the lamps nearest
// you, the room you are in first; each fades out before it is moved, so nothing pops. By day
// soft fills stand in for daylight bouncing round the rooms; from dusk the lamps, candles and
// fire take over. Glows, indoor light and the window light are in lighting.js.
const lampPool = makeLampPool({ scene, lamps, vis, size: QUALITY.lamps, day, camera });
const vignette = makeVignette();
const halos = makeHalos({ scene, lamps, day });
const shade = Q.get('shade') === '0' ? null : makeShade({ scene, rooms, colliders: builder.colliders, lampPool, camera });      // soft shade on the floor under the furniture (shade.js)
const warmer = makeWarmer({ renderer, scene, camera, range: 60 });      // textures and shaders made ready a little ahead of the visitor (warm.js)

// ---- Two ways of looking: circling outside, and walking -----------------------------
const WALK_FOV = Number(Q.get('fov') ?? 56);
// Circling outside, nothing is nearer than the trees: a near plane of 2 ft rather than 0.25 gives the
// depth buffer eight times the precision at a distance, where the garden's layers lie close together.
const ORBIT_NEAR = 2; camera.near = ORBIT_NEAR; camera.updateProjectionMatrix();
const walker = new Walker(camera, renderer.domElement, { colliders: builder.colliders, surfaces });
life.attend?.(walker);      // doors that open toward the visitor ease them back a step (life.js)
for (const s of garden?.surfaces ?? []) surfaces.push(s);
walker.rim = null;
// Whoever does get under the floors (there is nothing down there but the sunken ground) is set back where they last
// stood on something built; and whoever falls right out of the world, at the top of the stair.
{ let good = null;
  setInterval(() => { if (mode !== 'walk') return; const p = walker.pos, g = groundAt(p.x, p.z);
    if (p.y < -30) { walker.place(spawn.x, spawn.y ?? 0, spawn.z, spawn.yaw); walker.vy = 0; walker.grounded = true; return; }
    if (walker.grounded && p.y > g + 0.2) good = [p.x, p.y, p.z];
    else if (g < -2 && p.y < g + 0.6 && good) { walker.pos.set(good[0], good[1] + 0.05, good[2]); walker.vy = 0; walker.grounded = true; } }, 250); }
walker.ground = groundAt;                                 // the land rises a little toward Snow Hall (campus.js)

// A lantern to carry in the dark (F): a warm glow all round, with the lantern itself
// held low at the edge of view. Its light is one of the lamp pool's four while it is lit.
scene.add(camera);
const torch = { get intensity() { return lampPool.lanternOn ? 1 : 0; } };
const lanternMesh = new THREE.Group();
{
  const brass = new THREE.MeshStandardMaterial({ color: 0x6b5330, roughness: 0.5, metalness: 0.8 }), glow = new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false });
  const cage = (y, h, r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), brass); m.position.y = y; lanternMesh.add(m); };
  cage(0.19, 0.03, 0.1); cage(-0.19, 0.04, 0.1); cage(0.26, 0.08, 0.04);
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.36, 0.012), brass); p.position.set(Math.cos(i * Math.PI / 2 + 0.78) * 0.095, 0, Math.sin(i * Math.PI / 2 + 0.78) * 0.095); lanternMesh.add(p); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 16), brass); ring.position.y = 0.36; lanternMesh.add(ring);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glow); flame.scale.set(0.8, 1.5, 0.8); lanternMesh.add(flame);
  lanternMesh.position.set(0.62, -0.62, -1.25); lanternMesh.visible = false;
}
camera.add(lanternMesh);
if (Q.has('lantern')) { lampPool.setLantern(true, { at: [0.62, -0.42, -1.25] }); lanternMesh.visible = true; }      // ?lantern: lit from the start (test shots)
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(...ABOVE_AT); orbit.enableDamping = true; orbit.autoRotate = false; let swaying = !matchMedia('(prefers-reduced-motion: reduce)').matches;
orbit.minPolarAngle = Math.PI / 2 - 0.1; orbit.maxPolarAngle = Math.PI / 2 + 0.25; orbit.minDistance = 90; orbit.maxDistance = 240;
orbit.minAzimuthAngle = SWAY.mid - 0.6; orbit.maxAzimuthAngle = SWAY.mid + 0.6;      // (and nobody drags it round to the back, or up over the top)
orbit.addEventListener('start', () => { swaying = false; });
camera.position.set(...ABOVE);

if (Q.has('cam')) { camera.position.set(...Q.get('cam').split(',').map(Number)); orbit.autoRotate = false; }      // a fixed outside viewpoint, for test shots
let mode = 'orbit';
function walk(place = true) {
  mode = 'walk'; orbit.enabled = false; walker.enabled = true; camera.fov = WALK_FOV; camera.near = 0.25; camera.updateProjectionMatrix();
  if (place) walker.place(spawn.x, spawn.y ?? 0, spawn.z, spawn.yaw);
  document.body.classList.add('walking');
}
function overview() {
  mode = 'orbit'; walker.enabled = false; walker.seated = null; orbit.enabled = true; camera.fov = 42; camera.near = ORBIT_NEAR; camera.updateProjectionMatrix();
  camera.position.set(...ABOVE); document.exitPointerLock?.(); document.body.classList.remove('walking');
}

const flash = text => { window.houseUI ? window.houseUI.toast(text) : ($('clock').textContent = text); };      // ui.js hook: passing notes go to the toast
sound.onNote = flash;

const ray = new THREE.Raycaster(), mid = new THREE.Vector2(0, 0);

// Sources and citations (I), also reachable from labels in the house
const about = makeAbout();

let aimed = null;
function use() {
  if (mode !== 'walk') return;
  if (ctx.capture?.()) return;                                   // a game in progress takes the click (chess.js)
  if (walker.seated) { if (aimed) aimed.act(); else if (ctx.holding?.()) ctx.sip?.(); else walker.seated = null; return; }      // sat down, you can still use what is in front of you, or drink what you hold; otherwise E stands you up
  if (!aimed) { ctx.sip?.(); return; }                           // nothing in front of you: a sip of what you are holding (hold.js)
  if (aimed.seat) walker.sit(aimed.seat); else aimed.act();
}
const touch = 'ontouchstart' in window;
$('enter').addEventListener('click', () => { walk(); sound.start(); if (!touch) renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); });      // (refused when the press was made for the visitor a moment late: the next click on the picture asks again)
renderer.domElement.addEventListener('click', () => {
  if (mode !== 'walk') return;
  if (!touch && document.pointerLockElement !== renderer.domElement) { renderer.domElement.requestPointerLock?.(); return; }
  use();
});
addEventListener('keydown', e => {
  if (e.code === 'KeyO') mode === 'walk' ? overview() : walk();
  if (e.code === 'KeyI') about.toggle();
  if (e.code === 'Escape' && about.open) about.hide();
  if (about.open) return;
  if (e.code === 'KeyE') use();
  if (e.code === 'KeyF') { lampPool.setLantern(!lampPool.lanternOn, { at: [0.62, -0.42, -1.25] }); lanternMesh.visible = lampPool.lanternOn; flash(lampPool.lanternOn ? 'lantern lit' : 'lantern out'); }
  if (e.code === 'KeyM') flash(sound.toggleMute() ? 'sound off' : 'sound on');
  if (e.code === 'BracketRight') { setHour(hour + 0.5); ctx.hourMoved = true; }
  if (e.code === 'BracketLeft') { setHour(hour - 0.5); ctx.hourMoved = true; }
  if (e.code === 'Minus' || e.code === 'Equal') { const v = setEyeHeight(eyeHeight() + (e.code === 'Equal' ? 0.1 : -0.1)); flash(`eye height ${Math.floor(v)}'-${Math.round((v % 1) * 12)}"`); }      // ui.js hook: was a direct write to #clock
});

// ?view=x,feetY,z,yaw,pitch drops you somewhere directly (used for test shots); ?at=name uses a named one (perf.js)
function setView(v) {
  if (v.walk) { walk(false); walker.place(...v.walk); }
  else { overview(); orbit.autoRotate = false; camera.position.set(...v.orbit.slice(0, 3)); orbit.target.set(...v.orbit.slice(3)); orbit.update(); }
}
if (Q.has('at') && namedView(Q.get('at'))) { setView(namedView(Q.get('at'))); if (Q.has('view') === false) Q.set('view', '1'); }
else if (Q.has('view')) {
  const [x, y, z, yaw = 0, pitch = 0] = Q.get('view').split(',').map(Number);
  walk(false); walker.place(x, y, z, yaw, pitch);
}
if (!Q.has('view') && !Q.has('at') && Q.get('from') === 'house') walk();      // down the cellar stair from the house: no welcome card, straight onto the stair under the doors
if ((Q.has('view') || Q.has('at')) && Q.has('open')) for (const d of house.doors) if (!d.fixed) { d.isOpen = true; d.stop.off = true; }

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); post?.setSize(innerWidth, innerHeight);
});

// ---- What to draw this frame (visibility.js) -------------------------------------------
const REACH = QUALITY.reach;                                           // (QUALITY.reach is lowered for a while when frames run slow: see the loop)
const smallNear = Q.get('ahead') === '0' ? () => 34 * QUALITY.reach : () => 34 * REACH;      // clutter further off than this is not drawn (the tier's own reach, not the slow-frame one: life.js SMALL_NEAR)
for (const m of zoned) { m.geometry.computeBoundingBox(); m.userData.box = m.geometry.boundingBox; m.userData.small = vis.isSmall(m.userData.zone); }
const cullOff = Q.get('cull') === '0';
function cullScene(all = cullOff) {
  vis.update(camera);
  const eye = camera.position, SMALL_NEAR = smallNear();
  for (const m of zoned) { const z = m.userData.zone, b = m.userData.box; m.visible = all || (vis.shows(z) && (!m.userData.small || b.distanceToPoint(eye) < SMALL_NEAR) && vis.inView(z, b)); }
  outdoors.visible = all || vis.state.out;
  sky.setOutdoors?.(all || vis.state.out);
  life.cull(all);
}
// When the sun's shadows are redrawn, rooms and garden out of sight must still cast theirs. The
// renderer makes its list of what to draw before it draws the shadow map, and reads `visible`
// again for the shadow map: so everything is shown at that moment, which puts it all in the
// shadows without drawing it all in the picture (drawing it all, as this used to, sent every
// texture in the house to the graphics card in one frame: a stall of up to a second). The next
// frame's cullScene puts things back. (This leans on the order of work in three r170's
// WebGLRenderer.render: projectObject, then shadowMap.render. If that changes, shadows of
// things out of view go missing; nothing worse.)
{
  const update = sun.shadow.updateMatrices.bind(sun.shadow);
  sun.shadow.updateMatrices = (light, vp) => {
    for (const m of zoned) m.visible = true;
    outdoors.visible = true; life.cull(true);
    update(light, vp);
  };
}

// ---- Loop -----------------------------------------------------------------------------
const clock = new THREE.Clock();
let caption = '', frames = 0, since = 0, settled = 0, shown = '', fast = 0, slow = 0;
let nextRatio = null, slowFrames = 0, slowSecs = 0, raisedAt = -1e9, ceiling = 0, holdUntil = 0, hold = 30;      // the drawing resolution's own bookkeeping
// What is given up, in order, when frames run slow: [drawing resolution, how far off clutter is drawn (x the tier's)]
const FLOOR_RATIO = Math.min(MAX_RATIO, 1), LADDER = [[MAX_RATIO, 1], [MAX_RATIO, 0.8]];
for (let r = MAX_RATIO - 0.125; r > FLOOR_RATIO + 0.01; r -= 0.125) LADDER.push([r, 0.8]);
if (MAX_RATIO > FLOOR_RATIO) LADDER.push([FLOOR_RATIO, 0.8]);
LADDER.push([FLOOR_RATIO, 0.65]);
if (FLOOR_RATIO > 0.85) LADDER.push([0.85, 0.65]);
let rung = 0;
function climb(to) { rung = to; const [r, k] = LADDER[rung]; QUALITY.reach = REACH * k; if (Math.abs(r - ratio) > 0.001) nextRatio = r; }
const fpsBox = Q.has('fps') ? $('room') : null;
setHour(hour);

const meter = makeFrameMeter();      // (where a frame's time goes, for the ?fps caption: engine/frame.js)
renderer.setAnimationLoop(() => {
  meter.begin();
  const raw = clock.getDelta(), dt = Math.min(raw, 0.05), t = clock.elapsedTime;
  // A change of drawing resolution is made here, before the frame is drawn. (Made after drawing, it
  // emptied the canvas, and the page's dark background showed for a frame: a full-screen blink.)
  if (nextRatio !== null) { ratio = nextRatio; nextRatio = null; setRatio(ratio); }
  let where = 'out';
  if (mode === 'walk') {
    walker.update(dt);
    const p = walker.pos;
    const r = rooms.find(r => p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1 && p.y >= r.y0 && p.y <= r.y1);
    const name = r ? r.name : placeName(p.x, p.z);
    if (name !== caption && !fpsBox) { caption = name; $('room').textContent = name; }
    where = r ? 'in' : 'out';
    ctx.room = r ?? null;
    aimed = life.target(camera); if (walker.seated && aimed?.seat) aimed = null;      // (no hopping from seat to seat)
    const hint = ctx.hint?.();                                     // a game in progress says what to do (chess.js)
    const text = hint ? hint : aimed ? aimed.label() : walker.seated ? 'stand up' : '';
    if (text !== shown) { shown = text; $('prompt').innerHTML = text ? (hint ? text : `<b>E</b>${text}`) : ''; $('prompt').classList.toggle('on', !!text); }
  } else { if (swaying && mode === 'orbit') { const az = SWAY.mid + SWAY.half * Math.sin((performance.now() / 1000) * (Math.PI * 2 / SWAY.period)), d = Math.hypot(ABOVE[0] - ABOVE_AT[0], ABOVE[2] - ABOVE_AT[2]); camera.position.set(ABOVE_AT[0] + Math.sin(az) * d, ABOVE[1], ABOVE_AT[2] + Math.cos(az) * d); } orbit.update(); }
  // Eyes adjust: rooms are far dimmer than the garden, and night dimmer still (lighting.js).
  exposure.update(renderer, where, day, dt, Q.has('view'));
  lampPool.update(camera.position, Q.has('view') ? 1 : dt, t);
  winGlow.update(day.night, where === 'out', 1 - THREE.MathUtils.smoothstep(day.light, 0.42, 0.97));      // third: how far the lamps are on (as lighting.js lampOn)
  vignette.set(day.night);
  halos.update(t);
  shade?.update(1 - THREE.MathUtils.smoothstep(day.light, 0.42, 0.97), dt);      // as lighting.js lampOn
  life.update(t, dt);
  sound.update(dt, { where, light: day.light, room: ctx.room, pos: camera.position });
  sky.update(dt, t, camera);
  // The first frame: every shader the place needs is compiled now, behind the welcome, rather than
  // one by one as rooms are first seen
  if (!perf.frames && !cullOff) { mark('loop'); cullScene(true); renderer.compile(scene, camera); warmer.settle(); mark('compiled'); }
  cullScene();
  meter.draw(); draw(); meter.end();
  warmer.update(dt);
  perf.frames++; perf.lastCalls = renderer.info.render.calls; perf.lastTris = renderer.info.render.triangles;
  if (perf.firstFrameMs === undefined) { perf.firstFrameMs = Math.round(performance.now()); if (window.__ready) document.body.classList.add('ready'); }      // (the threshold lifts when the photos are in AND a frame has been drawn: whichever comes second, onLoad below or this)
  if (Q.has('stages') && perf.frames === 3) console.log('STAGES', JSON.stringify(STAGE), 'first frame', perf.firstFrameMs, 'calls', renderer.info.render.calls, 'tris', renderer.info.render.triangles, 'tex', renderer.info.memory.textures, 'geo', renderer.info.memory.geometries, 'programs', renderer.info.programs.length);

  // Keep it quick, but sharp. If most frames run slow for two seconds together, the next rung of LADDER is taken:
  // first the clutter and far furniture are drawn a little less far off, then the resolution comes down in small steps,
  // but not below one pixel to each of the screen's points, then the distances once more, and only at the last below
  // that. (One slow second is not enough: a single hitch, as when a room's pictures first load, used to drop the
  // resolution, which then crept back up in steps, each one a visible change.)
  frames++; since += raw; if (raw > 1 / 46) slowFrames++;
  if (since >= 1) {
    const fps = frames / since, mostlySlow = slowFrames > frames * 0.6; frames = 0; since = 0; slowFrames = 0; settled++;
    if (fpsBox) fpsBox.textContent = `${fps.toFixed(0)} fps · ×${ratio.toFixed(2)} · ${QUALITY.name}${QUALITY.antialias ? '' : ' (no aa)'} · ${renderer.info.render.calls} calls · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tris · ${(renderer.info.memory.textures)} tex · ${meter.text()} · first frame ${((perf.firstFrameMs ?? 0) / 1000).toFixed(1)} s, open ${perf.readyMs ? (perf.readyMs / 1000).toFixed(1) + ' s' : '…'}`;      // (the last two: how long the visit took to start)
    // (not while the furniture is still arriving: that is the processor, not the picture. Only the furniture: the far
    // rooms' lettering is made only in frames with time to spare, so on a machine that is slow throughout it never
    // finished, and the resolution was never let down at all)
    slowSecs = settled > 3 && mostlySlow && !life.arriving() ? slowSecs + 1 : 0;
    if (slowSecs >= 2 && rung < LADDER.length - 1 && !Q.has('ratio')) {
      climb(rung + 1); fast = 0; slowSecs = 0;
      // If this undoes a recent sharpening, that rung is too much for this machine here: hold
      // below it for a while (longer each time), so the resolution does not pump up and down.
      if (t - raisedAt < 20) { ceiling = rung; holdUntil = t + hold; hold = Math.min(hold * 2, 600); }
    }
    // ...and sharpens again, slowly, when there is time to spare (the resolution back first, as it was given up last)
    fast = fps > 58 ? fast + 1 : 0;
    const top = t < holdUntil ? ceiling : 0;
    if (fast >= 4 && rung > top && nextRatio === null && !Q.has('ratio')) { climb(rung - 1); fast = 0; raisedAt = t; }
    // Still slow at the last rung: the next visit starts at a lower quality tier
    slow = rung === LADDER.length - 1 && fps < 30 ? slow + 1 : 0;
    if (slow === 8 && !QUALITY.forced) rememberSlow(QUALITY.name);
  }
});

// ---- Measuring (perf.js): ?statsdump visits the test viewpoints and writes the numbers into the page
let loading = 0;
THREE.DefaultLoadingManager.onStart = () => { loading++; stage.loading(); };
THREE.DefaultLoadingManager.onProgress = (url, done, total) => { loading = total - done; };
const perf = { quality: QUALITY.name, gpu: QUALITY.gpu, stages: STAGE, visTime: () => vis.visMs(), resetVisTime: () => vis.resetMs(), vis, frames: 0, items, renderer, scene, camera, setView, setHour: h => setHour(h), pending: () => loading + life.pending() };
window.__house = perf; perf.post = post; perf.light = { HL, lampPool, sun, exposure }; perf.campus = house; perf.walker = walker; perf.groundAt = groundAt; perf.life = life; perf.loading = () => loading; perf.colliders = builder.colliders; perf.surfaces = surfaces;      // for looking at one light at a time (tools/evaljs.sh)
// Which lamps the pool would light at each test viewpoint, for checking its choices (?statsdump's eval=)
perf.lampChoice = (names = Object.keys(VIEWS), h) => { if (h !== undefined) setHour(h); const out = {}; for (const n of names) { setView(VIEWS[n]); camera.updateMatrixWorld(); vis.update(camera); out[n] = (vis.state.here.join('+') || 'out').replace(/r:/g, '') + ' -> ' + lampPool.choose(camera.position, QUALITY.lamps).map(lampPool.describe).join(', '); } return out; };
// Walking by program, for tests (tools/drive.py, tools/walk_test.js): the real walker, with its collisions, stairs
// and the lie of the land, turned toward a point and walked until it is there (or stops getting nearer).
//   await __house.walkTo(x, z, { run, near, timeout })  ->  { x, y, z, arrived, place }      __house.use() presses E
perf.use = () => use();
perf.walkTo = (x, z, o = {}) => new Promise(done => {
  if (mode !== 'walk') walk(false);
  const t0 = performance.now(), near = o.near ?? 1, key = o.run ? 'ShiftLeft' : null; let best = Infinity, stuck = 0;
  walker.keys.add('KeyW'); if (key) walker.keys.add(key);
  const tick = () => {
    const dx = x - walker.pos.x, dz = z - walker.pos.z, d = Math.hypot(dx, dz);
    walker.yaw = Math.atan2(-dx, -dz); walker.pitch = o.pitch ?? 0;
    if (d < best - 0.02) { best = d; stuck = 0; } else stuck++;
    if (d < near || stuck > 90 || performance.now() - t0 > (o.timeout ?? 60000)) {
      walker.keys.delete('KeyW'); if (key) walker.keys.delete(key);
      return done({ x: +walker.pos.x.toFixed(2), y: +walker.pos.y.toFixed(2), z: +walker.pos.z.toFixed(2), arrived: d < near, place: $('room').textContent });
    }
    requestAnimationFrame(tick);
  };
  tick();
});
if (Q.has('statsdump')) statsDump(perf, Q.get('statsdump') || null, (Q.get('hours') ?? '13,22').split(',').map(Number));

let sharpened = false;
const allIn = THREE.DefaultLoadingManager.onLoad = () => { stage.loaded(); perf.readyMs ??= Math.round(performance.now()); sun.shadow.needsUpdate = true; if (perf.frames) document.body.classList.add('ready'); window.__ready = true; markDressed(); if (!sharpened) { sharpened = true; setTimeout(() => sharpenTextures(), 2500); } };      // (the photos came at half size; now the full ones, one at a time)
if (stage.photosIn) allIn();      // (they came while the furniture was being made)
if (Q.has('view') || Q.has('at') || Q.has('shot')) { renderer.domElement.style.transition = 'none'; document.body.classList.add('ready'); }
if (Q.has('shot')) document.body.classList.add('shot');      // ?shot: the view from above with no invitation over it (test pictures)
window.house = { ctx, setHour: h => { setHour(h); ctx.hourMoved = true; }, get hour() { return hour; } };
ctx.hourMoved = Q.has('time'); ctx.hourNow = () => hour;      // (for the airship, one day: so the sky is the same at both ends)
// ?keys=KeyE:2000,KeyF:4500 presses keys at those milliseconds after start-up (test shots of things that need a key;
// Run20:5000 runs the place's life on by 20 seconds at once: the headless renderer draws only a few frames)
let testT = 1000;
if (Q.has('keys')) for (const k of Q.get('keys').split(',')) { const [code, ms] = k.split(':'); setTimeout(() => /^Run/.test(code) ? (() => { for (let i = 0; i < Number(code.slice(3)) * 20; i++) { testT += 0.05; life.update(testT, 0.05); } draw(); })() : dispatchEvent(new KeyboardEvent('keydown', { code, key: code.replace(/^(Key|Digit)/, '').toLowerCase(), bubbles: true })), Number(ms)); setTimeout(() => console.log('KEY', code, 'frames', perf.frames, 'mode', mode, 'aimed', aimed?.label?.()), Number(ms) + 300); }
// The quality choice for the settings card (quality.js); changing it reloads the page
window.house.quality = { options: QUALITY_OPTIONS, get: () => storedChoice() ?? 'auto', set: v => { chooseTier(v); location.reload(); }, get current() { return QUALITY.name; } };

await import('./ui.js');      // the interface reads window.house, so it comes after it
stage.enterIfAsked();      // (Take a walk, pressed before the place was ready: engine/stage.js)
