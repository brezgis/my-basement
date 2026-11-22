// Measuring. A set of named test viewpoints (the landing, the green, the air, and one at each building's
// door: campus.js fills VIEWS in), and a stats dump that visits each of them in turn and writes what one
// frame there costs (draw calls, triangles, textures and geometry in memory, lights, the CPU time of the
// visibility code) as JSON into <pre id="statsdump">.
//
//   ?at=snow                    stand at a named viewpoint (a site's id puts you at its door)
//   ?statsdump                  visit every viewpoint by day and at night
//   ?statsdump=landing,green    only these
//   ?statsdump&hours=13         only this hour

// walk: [x, feetY, z, yaw, pitch]   (yaw 0 looks toward -z, west; PI/2 looks toward -x, south)
// orbit: [camX, camY, camZ, targetX, targetY, targetZ]
export const VIEWS = {};
export function namedView(name) { return VIEWS[name] ?? null; }

let H_ = null;
const waitFrames = async n => { const f0 = H_.frames; for (let i = 0; i < 2000 && H_.frames < f0 + n; i++) await sleep(16); };
const sleep = ms => new Promise(ok => setTimeout(ok, ms));

// H: { renderer, scene, camera, setView(v), setHour(h), pending(), visTime() }
export async function statsDump(H, which, hours) {
  H_ = H; const out = { views: {}, startup: {} };
  const pre = document.createElement('pre'); pre.id = 'statsdump'; pre.textContent = 'running'; document.body.append(pre);
  const t0 = performance.now();
  // wait for the first load to settle
  for (let i = 0; i < 600 && (H.pending() > 0 || !window.__ready); i++) await sleep(100);
  out.startup.settledMs = Math.round(performance.now() - t0);
  pre.textContent = 'settled ' + out.startup.settledMs + ' pending ' + H.pending() + ' ready ' + window.__ready;
  out.startup.firstFrameMs = H.firstFrameMs ?? null;
  out.startup.stages = H.stages;
  const res = performance.getEntriesByType('resource');
  out.startup.requests = res.length;
  out.startup.bytes = Math.round(res.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0) / 1024) + ' KB';
  const names = which ? which.split(',') : Object.keys(VIEWS);
  const tally = {}; let tallyOn = false, tallyFrame = -1;
  // Count what is drawn, by kind, through onBeforeRender
  H.scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) tag(o); });
  function tag(o) {
    if (o.userData.__tagged) return; o.userData.__tagged = true;
    const prev = o.onBeforeRender;
    o.onBeforeRender = function (r, s, cam, geo, mat, group) {
      prev.apply(this, arguments);
      if (!tallyOn || H.frames !== tallyFrame || r.getRenderTarget()) return;      // one frame exactly (two were sometimes caught, doubling the count)
      let k = o.userData.cat, p = o; while (!k && p.parent) { p = p.parent; k = p.userData.cat ?? (p.parent && !p.parent.parent && p.name ? p.name : undefined); }
      k = k ?? (o.name || 'other');
      if (k === 'outdoors') k = 'outdoors:' + (o.name || o.parent?.name || 'anon');
      const g = geo, n = group ? group.count : g.index ? g.index.count : g.attributes.position.count;
      const tris = (o.isMesh ? n / 3 : 0) * (o.isInstancedMesh ? o.count : 1);
      const t = tally[k] ??= [0, 0]; t[0]++; t[1] += tris;
    };
  }
  for (const h of hours) {
    H.setHour(h);
    for (const name of names) {
      const v = VIEWS[name]; if (!v) continue;
      H.setView(v); pre.textContent = 'at ' + name + ' ' + h + ' ' + Math.round(performance.now() - t0) + ' frames ' + H.frames + ' pending ' + H.pending();
      await waitFrames(3);
      for (let i = 0; i < 400 && H.pending() > 0; i++) await sleep(50);
      await waitFrames(12);
      H.scene.traverse(o => { if ((o.isMesh || o.isPoints || o.isSprite) && !o.userData.__tagged) tag(o); });
      for (const k in tally) delete tally[k];
      H.resetVisTime?.();
      tallyFrame = H.frames; tallyOn = true; await waitFrames(1); tallyOn = false;
      const info = H.renderer.info, mem = memory(H);
      await waitFrames(1);
      const top = Object.entries(tally).sort((a, b) => b[1][1] - a[1][1]).slice(0, 12).map(([k, [c, t]]) => `${k}:${c}/${(t / 1000).toFixed(0)}k`);
      const topc = Object.entries(tally).sort((a, b) => b[1][0] - a[1][0]).slice(0, 8).map(([k, [c]]) => `${k}:${c}`);
      const fam = {}; for (const [k, [c, t]] of Object.entries(tally)) { const f = k.split(':')[0]; fam[f] ??= [0, 0]; fam[f][0] += c; fam[f][1] += t; }
      const byFam = Object.entries(fam).sort((a, b) => b[1][1] - a[1][1]).map(([k, [c, t]]) => `${k}:${c}/${(t / 1000).toFixed(0)}k`).join(' ');
      let mc = 0, mt = 0; for (const [c, t] of Object.values(tally)) { mc += c; mt += t; }
      out.views[`${name}@${h}`] = { byFam, calls: mc, tris: Math.round(mt), frameCalls: H.lastCalls, frameTris: H.lastTris, textures: info.memory.textures, geometries: info.memory.geometries, programs: info.programs?.length, texMB: mem.texMB, sheetMB: mem.sheetMB, sheets: mem.sheets, geoMB: mem.geoMB, visMs: H.visTime?.() ?? null, seen: H.vis ? [...H.vis.state.seen].map(([k, v]) => k.slice(2) + '/' + v.level).join(', ') : '', quality: H.quality, byTris: top.join(' '), byCalls: topc.join(' ') };
    }
  }
  out.totalMs = Math.round(performance.now() - t0);
  pre.textContent = JSON.stringify(out, null, 1);
  document.title = 'statsdump done';
  return out;
}

// Texture and geometry bytes actually uploaded to the GPU (estimated from sizes).
function memory(H) {
  const props = H.renderer.properties, seen = new Set(), geos = new Set();
  let tex = 0, geo = 0, sheet = 0, sheets = 0;
  const KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap', 'sheenColorMap', 'sheenRoughnessMap', 'transmissionMap', 'thicknessMap', 'specularIntensityMap', 'specularColorMap', 'iridescenceMap', 'lightMap', 'displacementMap', 'anisotropyMap'];
  H.scene.traverse(o => {
    // (a room's sheets, life.js, keep copies at several sizes, not all of them on a material at any one time)
    for (const t of o.userData.textures ?? []) { const id = t.source?.uuid ?? t.uuid; if (seen.has(id) || !props.get(t).__webglTexture) continue; seen.add(id); const b = t.image.width * t.image.height * 4 * 1.333; tex += b; sheet += b; sheets++; }
    if (o.geometry && !geos.has(o.geometry)) { geos.add(o.geometry); for (const a of Object.values(o.geometry.attributes)) geo += a.array?.byteLength ?? 0; if (o.geometry.index) geo += o.geometry.index.array.byteLength; }
    for (const m of [].concat(o.material ?? [])) for (const k of KEYS) {
      const t = m[k]; const id = t && (t.source?.uuid ?? t.uuid); if (!t || seen.has(id)) continue; seen.add(id);
      const src = t.source?.data ?? t.image; if (!src) continue;
      if (!props.get(t).__webglTexture) continue;
      const w = src.width ?? 0, h = src.height ?? 0;
      const b = w * h * 4 * (t.generateMipmaps !== false && t.minFilter !== 1006 ? 1.333 : 1);
      tex += b; if (o.userData.sheet) { sheet += b; sheets++; }      // (the rooms' lettering and pictures, life.js: the part that comes and goes)
    }
  });
  return { texMB: +(tex / 1048576).toFixed(1), sheetMB: +(sheet / 1048576).toFixed(1), sheets, geoMB: +(geo / 1048576).toFixed(1) };
}
