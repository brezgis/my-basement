// The island surface and its cut, in building plan coordinates (X, Y, height).
// The outside, the reveals around the facade and the vault all start at the same
// lip, so the edge of the opening is also the edge of the surrounding cliff.
import * as THREE from 'three';
import { cliffFootY, westWalk, eastWalk } from './cliff-walks.js';

const TAU = Math.PI * 2;
const mix = THREE.MathUtils.lerp;
const ease = x => THREE.MathUtils.smoothstep(x, 0, 1);

// Broad bedding planes broken up by shorter, angular fractures.
function relief(x, y) {
  const bed = Math.sin(x * 0.17 + y * 0.09 + 1.4 * Math.sin(y * 0.13));
  const cross = Math.cos(y * 0.31 - x * 0.08 + Math.sin(x * 0.15));
  return 1.7 * Math.min(bed + 0.35, cross + 0.4) + 0.8 * Math.sin(x * 0.39 + y * 0.19);
}

export function carvedRock(b, { court, facadeY, wallTop, shaft, shaftTop, left, right, caveDoor }) {
  const { X: cx, Y: cy, r } = court;
  const radius = 220, centreY = 220, backY = facadeY + 0.45;
  // Carry the brow over the inner face of the curved walls from the very
  // first section. Starting at the wall centre exposed its two square end caps.
  const vaultR = r - 1.45;
  const archRadius = Math.sqrt(vaultR ** 2 - (backY - cy) ** 2);
  const archLeft = cx - archRadius, archRight = cx + archRadius;
  const columns = [], angles = [];
  const angleAt = x => Math.asin((x - cx) / radius);
  // Extra columns resolve the rock silhouette at the house. The far side needs fewer.
  const addFront = x => { columns.push(x); angles.push(angleAt(x)); };
  const wingSteps = 13, archSteps = 28;
  for (let i = 0; i < wingSteps; i++) addFront(mix(left, archLeft, i / wingSteps));
  for (let i = 0; i <= archSteps; i++) addFront(cx - archRadius * Math.cos(Math.PI * i / archSteps));
  for (let i = 1; i <= wingSteps; i++) addFront(mix(archRight, right, i / wingSteps));
  const routes = [westWalk, eastWalk];
  // The carved sill shares its ledge with the underside of each staircase.
  // Include the changes of grade, so even an oblique fly-by sees one edge.
  for (const route of routes) for (const [x] of route) {
    if (x > left && x < right && (x < archLeft || x > archRight) && !columns.some(v => Math.abs(v - x) < 1e-5)) columns.push(x);
  }
  columns.sort((a,b) => a-b);
  angles.splice(0, angles.length, ...columns.map(angleAt));
  const vaultStart = columns.findIndex(x => Math.abs(x - archLeft) < 1e-5);
  const east = columns.length - 1;
  for (let i = 1; i < 96; i++) {
    const a = mix(angleAt(right), angleAt(left) + TAU, i / 96);
    angles.push(a); columns.push(cx + radius * Math.sin(a));
  }

  const positions = [], indices = [];
  function vertex(x, y, h) {
    const index = positions.length / 3;
    positions.push(x, h, -y);
    return index;
  }
  const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d);
  const coords = id => [positions[id * 3], -positions[id * 3 + 2], positions[id * 3 + 1]];
  const archHeight = phi => 25 * Math.sin(phi) ** 0.8
    + Math.sin(phi) * (2.7 * Math.sin(3 * phi + 0.5) + 2 * relief(15 * phi, 4));
  const spring = x => wallTop - 1.7 + 1.25 * Math.sin(x * 0.42) + 0.6 * Math.cos(x * 0.8);

  const profile = columns.map((rawX, i) => {
    const x = THREE.MathUtils.clamp(rawX, left, right), a = angles[i], sa = Math.sin(a), ca = Math.cos(a);
    const local = ca > 0 ? 1 - ease(Math.abs(rawX - x) / 32) : 0;
    const phi = Math.acos(THREE.MathUtils.clamp((cx - x) / archRadius, -1, 1));
    const wing = Math.max(archLeft - x, x - archRight, 0);
    const roof = spring(x) + (wing ? -ease(wing / 7) * (x < cx ? 4.4 : 7.5) : archHeight(phi));
    const front = Math.min(7.9, 4.5 + 1.8 * Math.sin(x * 0.25) + 1.3 * relief(x, roof));
    const floor = -6.8 + 1.4 * relief(x, -4);
    const footY = cliffFootY(x, Math.min(9, cy - Math.sqrt(Math.max(0, (r + 1) ** 2 - (x - cx) ** 2))));
    const crown = 113 + 18 * Math.sin(a * 3 + 1) + 9 * Math.cos(a * 7) + 7 * Math.sin(11 * a);
    return { x, a, sa, ca, local, floor: mix(-7, floor, local), roof: mix(28, roof, local), front, footY, crown };
  });

  function outside(i, h) {
    const p = profile[i];
    // Keep the stair and the Old Cave inside the body where the island curves away.
    const shoulder = 32 * Math.max(0, p.ca) ** 4 * ease(Math.abs(p.sa) * 4);
    const wide = 1 + 0.045 * Math.sin(3 * p.a + 1) + 0.027 * Math.sin(7 * p.a);
    const taper = 1 - 0.91 * ease(-h / 218);
    const ridges = 5 * Math.sin(5 * p.a + h * 0.033) + 2.8 * relief(70 * p.a, h);
    const rad = (radius * wide + shoulder + ridges) * taper;
    const base = [cx + rad * p.sa, centreY - rad * p.ca, h];
    const apron = ease((h + 105) / 95) * (1 - ease((h - p.roof) / 52)) * p.local;
    const f = ease((h - p.floor) / (p.roof - p.floor));
    const side = i <= east ? Math.max(1 - ease((p.x - left) / 9), 1 - ease((right - p.x) / 9)) : 1;
    const stagger = side * (p.x < cx ? 1 : -1) * (1.5 * Math.sin(h * 0.31) + 0.9 * relief(p.x, h));
    return [mix(base[0], columns[i] + stagger, apron),
      mix(base[1], mix(p.footY, p.front, f) + Math.sin(f * Math.PI) * relief(p.x, h), apron), h];
  }

  // Level rows on either side of the excavation share the sill and brow rows with the reveals.
  const lower = 12, jamb = 7, upper = 13, rows = [];
  for (let j = 0; j <= lower + jamb + upper; j++) {
    const row = profile.map((p, i) => {
      const h = j <= lower ? mix(-214, p.floor, j / lower)
        : j <= lower + jamb ? mix(p.floor, p.roof, (j - lower) / jamb)
        : mix(p.roof, p.crown, (j - lower - jamb) / upper);
      const [x, y] = outside(i, h);
      return vertex(x, y, h);
    });
    if (j) for (let i = 0; i < row.length; i++) {
      if (i < east && j > lower && j <= lower + jamb) continue;
      const n = (i + 1) % row.length;
      quad(rows[j - 1][i], rows[j - 1][n], row[n], row[i]);
    }
    rows.push(row);
  }
  // Close the tapered keel, then carry the broken crown across to the stone light shaft.
  const keel = vertex(cx + 3, centreY - 9, -232);
  for (let i = 0; i < columns.length; i++) indices.push(rows[0][(i + 1) % columns.length], rows[0][i], keel);
  let prev = rows.at(-1);
  const rim = prev.map(coords);
  for (let j = 1; j <= 12; j++) {
    const t = j / 13;
    const row = rim.map(([ex, ey, eh]) => {
      const x = mix(ex, shaft.X, t), y = mix(ey, shaft.Y, t);
      const h = mix(eh, shaftTop, t) + Math.sin(t * Math.PI) *
        (25 + 11 * Math.sin(x * 0.032 + y * 0.024) + 5 * Math.cos(y * 0.077) + 3 * relief(x * 0.45, y * 0.43));
      return vertex(x, y, h);
    });
    for (let i = 0; i < row.length; i++) { const n = (i + 1) % row.length; quad(prev[i], prev[n], row[n], row[i]); }
    prev = row;
  }
  // Stitch the last crown ring to the exact 28-sided opening used by the chapel shaft.
  const polar = id => { const [x, y] = coords(id); return (Math.atan2(y - shaft.Y, x - shaft.X) + TAU) % TAU; };
  const outer = [...prev].sort((a, b) => polar(a) - polar(b));
  const hole = Array.from({ length: 28 }, (_, i) => {
    const a = TAU * i / 28, x = shaft.X + shaft.r * Math.cos(a), y = shaft.Y + shaft.r * Math.sin(a);
    return vertex(x, y, shaftTop);
  });
  for (let i = 0, j = 0; i < outer.length || j < hole.length;) {
    const a = outer[i % outer.length], b = hole[j % hole.length];
    const nextOuter = i + 1 < outer.length ? polar(outer[i + 1]) : TAU + polar(outer[0]);
    if (i < outer.length && (j === hole.length || nextOuter < TAU * (j + 1) / hole.length)) {
      i++;
      indices.push(a, outer[i % outer.length], b);
    } else {
      j++;
      indices.push(a, hole[j % hole.length], b);
    }
  }

  const sill = rows[lower], lip = rows[lower + jamb];
  const header = [], base = [], ledge = [];
  function stairLip(x) {
    for (const route of routes) for (let j = 1; j < route.length; j++) {
      const [xa, ya, , ha] = route[j - 1], [xb, yb, , hb] = route[j];
      if (x < Math.min(xa, xb) || x > Math.max(xa, xb)) continue;
      const t = (x - xa) / (xb - xa);
      return vertex(x, mix(ya, yb, t), 0.34 + mix(ha, hb, t) - 0.92);
    }
    return null;
  }
  for (let i = 0; i <= east; i++) {
    const x = columns[i], h = profile[i].roof;
    header.push(vertex(x, backY, h));
    // The rock apron dips beneath the courtyard pool between its end piers.
    const basin = 1 - ease((Math.abs(x - cx) - 12) / 3);
    base.push(vertex(x, backY, 0.14 - 3.0 * basin));
    ledge.push(stairLip(x));
    if (i) {
      const l = ledge[i - 1] ?? base[i - 1], r = ledge[i] ?? base[i];
      quad(sill[i - 1], sill[i], r, l);
      if (l !== base[i - 1] || r !== base[i]) quad(l, r, base[i], base[i - 1]);
      quad(lip[i - 1], header[i - 1], header[i], lip[i]);
    }
  }

  // Each cheek folds back into the building. The east cheek contains the actual passage opening.
  for (const i of [0, east]) {
    const x = columns[i], innerY = 9.0, p = profile[i];
    const edge = [];
    for (let k = 0; k <= jamb; k++) {
      const front = rows[lower + k][i], h = coords(front)[2];
      edge.push(vertex(x, innerY, h));
      if (k) {
        const last = rows[lower + k - 1][i];
        if (i === 0) quad(last, edge[k - 1], edge[k], front);
        else quad(last, front, edge[k], edge[k - 1]);
      }
    }
    const back = edge.map((_, k) => [backY, mix(0.14, p.roof, k / jamb)]);
    const outline = [...edge.map(id => coords(id).slice(1)).reverse(), ...back];
    const mouth = new THREE.Shape(outline.map(v => new THREE.Vector2(...v)));
    if (i === east) mouth.holes.push(new THREE.Path(caveDoor.map(v => new THREE.Vector2(...v))));
    const face = new THREE.ShapeGeometry(mouth), pts = face.attributes.position;
    const ids = Array.from({ length: pts.count }, (_, k) => {
      const y = pts.getX(k), h = pts.getY(k);
      // Let a few feet of rock lap over the blank masonry at the two ends.
      // The cut through the east cheek still meets the tunnel at its exact arch.
      const t = THREE.MathUtils.clamp((h - 0.14) / (p.roof - 0.14), 0, 1);
      const lap = Math.abs(y - backY) < 0.001 ? Math.sin(t * Math.PI) * (1.8 + 1.2 * Math.sin(h * 0.53)) : 0;
      return vertex(x + (i === 0 ? lap : -lap), y, h);
    });
    for (let k = 0; k < face.index.count; k += 3) {
      const a = ids[face.index.getX(k)], b = ids[face.index.getX(k + 1)], c = ids[face.index.getX(k + 2)];
      if (i === 0) indices.push(a, b, c); else indices.push(a, c, b);
    }
    const fl = sill[i], top = lip[i];
    // Triangular wedges join the cheek's inset edge to the apron and soffit.
    if (i === 0) indices.push(fl, base[i], edge[0], top, edge[jamb], header[i]);
    else indices.push(fl, edge[0], base[i], top, header[i], edge[jamb]);
  }

  // From the shared brow the roof rises into a battered vault, with ledges
  // and asymmetrical bosses. Its spring line dies inside the courtyard masonry.
  let ring = header.slice(vaultStart, vaultStart + archSteps + 1);
  const eaves = [[ring[0]], [ring.at(-1)]];
  for (let j = 1; j <= 26; j++) {
    const t = j / 26, y = mix(backY, cy + vaultR, t);
    const inset = ease((y - backY) / 4);
    const width = Math.sqrt(Math.max(0, vaultR ** 2 - (y - cy) ** 2));
    const row = [];
    for (let k = 0; k <= archSteps; k++) {
      const phi = Math.PI * k / archSteps, x = cx - width * Math.cos(phi);
      const weight = Math.sin(phi) * Math.min(1, width / 7);
      const boss = 2.2 * relief(x, y) + 1.4 * Math.abs(Math.sin(x * 0.38 - y * 0.18));
      const skirt = inset * (1.8 + 1.1 * relief(x, y));
      const h = spring(x) - skirt + archHeight(phi) * width / archRadius + weight * inset * boss;
      row.push(j === 26 && k > 0 ? row[0] : vertex(x, y, h));
    }
    for (let k = 0; k < archSteps; k++) {
      if (j === 26) indices.push(ring[k], row[0], ring[k + 1]);
      else quad(ring[k], row[k], row[k + 1], ring[k + 1]);
    }
    eaves[0].push(row[0]); eaves[1].push(row.at(-1));
    ring = row;
  }
  // Turn the uneven lower lip back into the masonry all the way around the room.
  // From the court this exposes a short ragged rock edge above the finished stone.
  for (const [side, edge] of eaves.entries()) {
    let last;
    for (let i = 0; i < edge.length; i++) {
      const [x, y, h] = coords(edge[i]), d = Math.hypot(x - cx, y - cy);
      const depth = 1.8 * ease((y - backY) / 4);
      const end = i === 0 ? edge[i] : vertex(x + depth * (x - cx) / d, y + depth * (y - cy) / d, Math.min(wallTop, h + depth * 0.4));
      if (i) {
        if (i === 1 && side === 1) indices.push(last, edge[i], end);
        else if (i === 1) indices.push(last, end, edge[i]);
        else if (side === 1) quad(edge[i - 1], edge[i], end, last);
        else quad(edge[i - 1], last, end, edge[i]);
      }
      last = end;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  b.mesh('bedrock', g);
}
