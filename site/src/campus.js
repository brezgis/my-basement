// Spanya: the place under the cellar doors of Anna's House. One building (buildings/spanya.js) cut into a
// block of rock, after Villa Vals (SeARCH and Christian Müller Architects, 2009): rooms round a circular
// courtyard that is open to the sky and, on its south side, to the clouds.
//
// World coordinates, in feet: x is north (+) and south (-), z is east (+) and west (-), y is up. The sun is in
// the south (-x) at noon. y = 0 is the COURTYARD's level; the meadow you arrive on is the top of the rock,
// MEADOW feet above it. The engine's island (island.js) is the ledge the rock stands on: all that shows of it
// is the grass lip round the courtyard's terrace.
//
// The building is written in its own plan coordinates (building.js; buildings/README.md): X to the right as you
// face its open side from the south, Y back (north) into the rock. This file is the only place that knows
// where it stands.

import { makeSite } from './building.js';
import { BUILDINGS } from './buildings/index.js';
import { furnish, furnishSteps, furnishHook } from './furnish.js';
import { wind } from './grounds/cards.js';
import { VIEWS } from './perf.js';

const TURNS = { east: 0, north: 1, west: 2, south: 3 };
export const LAYOUT = 'spanya';
export const MEADOW = 30;                                       // the meadow's height above the courtyard
// The plan (own coordinates): the rock is X ROCK.X0..X1, Y ROCK.Y0..Y1; the courtyard a circle at COURT; the
// cellar doors on the meadow at DOORS, the stair going down eastward from them.
export const ROCK = { X0: -640, X1: 760, Y0: 16, Y1: 136 };      // (wide: from the first view the cliff runs out of sight to both sides)
export const OCULUS = { X: 60, Y: 99.5, r: 3 };                  // the chapel's light shaft, where it comes up in the meadow
export const COURT = { X: 60, Y: 28, r: 24 };
// The patio and pool share this eight-panel stretch of the 48-sided terrace.
const poolBrink = Array.from({length:9}, (_,i) => {
  const angle=(32+i)*Math.PI/24, radius=COURT.r-0.45;
  return [COURT.X+radius*Math.cos(angle), COURT.Y+radius*Math.sin(angle)];
});
export const EDGE_POOL = {
  brink:poolBrink, coping:poolBrink.map(([x,y],i)=>[x,y+7.7*Math.sin(i*Math.PI/8)]),
  bed:-2.26, water:0.76,
};
export const DOORS = { X: -57.2, Y: 28 };
// Each preview has its own port on the same Tailscale machine.
export function houseAddress() {
  const local = location.port === '5193' && /^(localhost|\[::1\]|[\d.]+|.+\.ts\.net)$/.test(location.hostname);
  return local ? location.protocol + '//' + location.hostname + ':8791/' : 'https://house.brezgis.com/site/';
}
export const SITES = [
  { id: 'spanya', name: 'Anna’s Basement', origin: [0, 0], facing: 'south', W: 120, D: 125, ground: 0, door: [60, 0], note: 'after Villa Vals' },
];
export function sitePoint(s, X, Y) { const k = TURNS[s.facing] ?? 0, c = Math.round(Math.cos(k * Math.PI / 2)), n = Math.round(Math.sin(k * Math.PI / 2)); return [s.origin[0] + X * c - Y * n, s.origin[1] - X * n - Y * c]; }
const rectOf = s => { const [ax, az] = sitePoint(s, 0, 0), [bx, bz] = sitePoint(s, s.W, s.D); return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) }; };
for (const s of SITES) s.rect = rectOf(s);
const S0 = SITES[0], W = (X, Y) => sitePoint(S0, X, Y);

// ---- the island: the ledge under the rock, a few feet wider than it, and a bulge under the terrace -------------
const CENTRE = W((ROCK.X0 + ROCK.X1) / 2, (ROCK.Y0 + ROCK.Y1) / 2);
export const ISLAND = (() => {
  const N = 180, outline = [], [a0x, a0z] = W(ROCK.X0, ROCK.Y0), [a1x, a1z] = W(ROCK.X1, ROCK.Y1);
  const x0 = Math.min(a0x, a1x) + 2.0,      /* (hardly any ledge on the south: from the wings' windows one should see cloud, not a strip of grass) */ x1 = Math.max(a0x, a1x) + 9, z0 = Math.min(a0z, a1z) - 9, z1 = Math.max(a0z, a1z) + 9;
  const [tx, tz] = W(COURT.X, COURT.Y), tr = COURT.r - 6;      // (the land stops short of the terrace's rim, so the rim and the edge pool stand sheer over the clouds)
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    let r = Math.min(dx > 1e-6 ? (x1 - CENTRE[0]) / dx : dx < -1e-6 ? (x0 - CENTRE[0]) / dx : 1e9, dz > 1e-6 ? (z1 - CENTRE[1]) / dz : dz < -1e-6 ? (z0 - CENTRE[1]) / dz : 1e9);
    // the terrace's circle, along the same ray
    const ox = CENTRE[0] - tx, oz = CENTRE[1] - tz, bq = ox * dx + oz * dz, cq = ox * ox + oz * oz - tr * tr, disc = bq * bq - cq;
    if (disc > 0) r = Math.max(r, -bq + Math.sqrt(disc));
    outline.push(r);
  }
  return { x: CENTRE[0], z: CENTRE[1], r: Math.max(...outline) / 0.965, outline: outline.map(v => v / 0.965) };
})();
export function outlineAt(a) {
  const o = ISLAND.outline, n = o.length, t = ((a / (Math.PI * 2)) % 1 + 1) % 1 * n, i = Math.floor(t), f = t - i;
  return o[i % n] * (1 - f) + o[(i + 1) % n] * f;
}
export const RIM = 0.965;
export const rimDist = (x, z) => outlineAt(Math.atan2(z - ISLAND.z, x - ISLAND.x)) * RIM - Math.hypot(x - ISLAND.x, z - ISLAND.z);
// The land is the courtyard's level under the courtyard and the terrace, and eight feet lower under the rooms, so
// that a pool or a cellar can be sunk below the floors without the island's own grass showing in it.
const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
export function groundAt(x, z) {
  const X = z, Y = x;                                           // (the site faces south: world x is the plan's Y, z its X)
  if (Y < ROCK.Y0 + 1) {
    const {brink,coping,bed}=EDGE_POOL;
    if (Y<13 && X>=brink[0][0] && X<=brink.at(-1)[0]) {
      for (let i=1;i<brink.length;i++) {
        if (X>brink[i][0]) continue;
        const t=(X-brink[i-1][0])/(brink[i][0]-brink[i-1][0]);
        const yAt=pts=>pts[i-1][1]+t*(pts[i][1]-pts[i-1][1]);
        if (Y>=yAt(brink) && Y<=yAt(coping)) return bed - 1;
        break;
      }
    }
    return Math.hypot(X-COURT.X,Y-COURT.Y) < COURT.r-0.45 ? 0.34 : 0;
  }
  const d = Math.hypot(X - COURT.X, Y - COURT.Y);
  return -8 * sm((d - COURT.r + 1) / 5) * sm((Y - ROCK.Y0 - 1) / 4);
}
export const wearAt = () => 0;
export const TREES = [];
export const WALKS = [], PATHS = [];

export function placeName(x, z) {
  const dx = x - W(COURT.X, COURT.Y)[0], dz = z - W(COURT.X, COURT.Y)[1];
  if (Math.hypot(dx, dz) < COURT.r + 1) return 'The Courtyard';
  if (x < 17 && x > 2) return z < 28 ? 'The Lookout' : z < 109 ? 'The Courtyard' : '';      // (the walks along the front; x is the plan's Y, z its X)
  return '';
}

// ---- named viewpoints (perf.js): ?at=doors, ?at=court, ?at=air ------------------------------------------------
const yawTo = (fx, fz, tx, tz) => Math.atan2(-(tx - fx), -(tz - fz));
const stand = (X, Y, h, tX, tY, pitch = 0) => { const [x, z] = W(X, Y), [tx, tz] = W(tX, tY); return { walk: [x, h, z, yawTo(x, z, tx, tz), pitch] }; };
Object.assign(VIEWS, {
  doors: stand(DOORS.X + 8.4, DOORS.Y, MEADOW - 10 * (4.4 / 15), DOORS.X + 40, DOORS.Y, -0.32),      // on the stair, a few steps down, under the cellar doors
  court: stand(COURT.X, COURT.Y - 15, 0, COURT.X, COURT.Y + 40, 0.12),
  brink: stand(COURT.X, COURT.Y + 12, 0, COURT.X, COURT.Y - 40, 0),
  air: { orbit: [-190, 16, 150, 40, 12, 75] },
  above: { orbit: [-41, 520, -75, -40, 0, -75] },
  spanya: stand(COURT.X, COURT.Y - 15, 0, COURT.X, COURT.Y + 40, 0.12),
});

// ---- building it ---------------------------------------------------------------------------------------
export function buildCampus(B, { only = null, defer = false } = {}) {
  const pending = [];
  const lists = { surfaces: [], rooms: [], lamps: [], doors: [], windows: [], portals: [], boxes: [], footprints: [], later: [], kits: [] };
  const built = {};
  for (const s of SITES) {
    const make = BUILDINGS[s.id];
    if (typeof make === 'function' && (!only || only.includes(s.id))) {
      const b = makeSite(B, s, lists), was = B.zone;
      B.zone = 'shell:' + s.id;
      try { make(b); if (defer) { furnishHook(lists); void b.kit; pending.push({ s, b }); } else furnish(B, s, b, lists); b.finish(); built[s.id] = true; } catch (e) { console.error('building ' + s.id + ' failed:', e); }
      B.zone = was;
    }
  }
  const items = { lamps: [], seats: [], candles: [], models: [], extras: [], books: [], steam: [], hinged: [], spots: [], later: lists.later };
  const taken = new Map();
  const gather = () => { for (const k of lists.kits) { const t = taken.get(k) ?? {}; taken.set(k, t); for (const n of ['lamps', 'seats', 'candles', 'models', 'extras', 'books', 'steam', 'hinged']) { const l = k[n] ?? []; for (let i = t[n] ?? 0; i < l.length; i++) items[n].push(l[i]); t[n] = l.length; } } };
  gather();
  function* furnishRest() {
    for (const { s, b } of pending) {
      const n0 = lists.lamps.length;
      yield* furnishSteps(B, s, b, lists);
      for (let i = n0; i < lists.lamps.length; i++) { const l = lists.lamps[i]; l.kind = l.fire ? 'fire' : (l.kind ?? 'fill'); }
      b.adopt(); gather();
      yield 'built';
    }
    pending.length = 0;
  }
  // You begin on the stair, a few steps down, under the cellar doors.
  const v = VIEWS.doors.walk, spawn = { x: v[0], y: v[1], z: v[2], yaw: v[3] };
  return { ...lists, items, built, spawn, sites: Object.fromEntries(SITES.map(s => [s.id, s])), furnishRest: defer ? furnishRest : null };
}

export function groundsLife(ctx) { ctx.animated.push(t => { wind.value = t; }); }
