// The pond's shape, as plain numbers, for the koi (koi_school.js, koi.js: both exactly as at Anna's House, where
// this file describes a larger pond with a bridge). Here the pond is the one campus.js digs: POND there is an
// ellipse and the land dips to it (groundAt); the water lies at POND.level. This file only restates that in the
// terms the koi expect: s is the "normalised radius" of a point, 0 at the middle and 1 at the water's edge.

import { POND as P, groundAt } from '../campus.js';

const depthAlong = e => P.level - groundAt(P.x + P.rx * e, P.z);      // the water's depth, e of the way out along the ellipse
// where the water's edge really is, as a share of the ellipse in campus.js (the bowl is a little wider or narrower than it)
const EDGE = (() => { let a = 0, b = 1.6; if (!(depthAlong(0) > 0)) return 1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (depthAlong(m) > 0) a = m; else b = m; } return a; })();
export const POND = { x: P.x, z: P.z, rx: P.rx * EDGE, rz: P.rz * EDGE, y: P.level, deep: Math.max(0, depthAlong(0)) };

export const rim = () => 1;                                             // (no wobble: the bank is the land's own)
export const sAt = (x, z) => Math.hypot((x - POND.x) / POND.rx, (z - POND.z) / POND.rz);
export const at = (a, s = 1) => [POND.x + Math.cos(a) * POND.rx * s, POND.z + Math.sin(a) * POND.rz * s];
// Depth of the water (feet) at normalised radius s, from a table made once
const TABLE = Float32Array.from({ length: 65 }, (_, i) => Math.max(0, depthAlong(i / 64 * EDGE)));
export function depthAtS(s) { if (s >= 1) return 0; const k = Math.max(0, s) * 64, i = Math.floor(k); return TABLE[i] + (TABLE[i + 1] - TABLE[i]) * (k - i); }
export const depthAt = (x, z) => depthAtS(sAt(x, z));
export const OBSTACLES = [];                                            // nothing stands in the water (the lily pads float: fish pass under them)
