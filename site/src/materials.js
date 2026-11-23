// Photographic materials. Textures are CC0, from Poly Haven and ambientCG
// (see assets/CREDITS.md). `size` is how many feet one texture tile covers.

import { woodTexture } from './kit/firewood.js';
import * as THREE from 'three';
import { decodedImage } from './engine/load.js';
import { indoorLit } from './lighting.js';

// Each photo is loaded once and shared: materials that use the same photo at different
// scales get clones, which share one copy in GPU memory. On the lower quality tiers some
// or all photos come from assets/tex/512/, half the size (tools/textures.py makes them).
const shared = new Map();
let texTier = 'full';
export function setTextureTier(t) { texTier = t ?? 'full'; }
// Every photo arrives first at half size (a quarter of the bytes: the whole set is 5 MB instead of 20), so the street
// is dressed almost at once; those the quality tier wants at full size are then fetched one at a time once the
// street is up (sharpenTextures, called from main.js) and swapped in, which nobody sees happen.
const ROUGH_FULL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('roughfull');      // (for comparing)
export function sharedTexture(file) {
  // (a roughness map is kept at half size on every tier: it only shades the sheen, which has no edges to lose, and the
  // full ones were 140 MB of the graphics card's memory)
  const wantFull = !(texTier === 'half' || (/_rough$/.test(file) && !ROUGH_FULL) || (texTier === 'detail' && /_normal$/.test(file)));
  const url = `assets/tex/512/${file}.jpg`;
  let e = shared.get(url);
  if (!e) {
    e = { clones: [], loaded: false, full: wantFull ? `assets/tex/${file}.jpg` : null };
    e.base = new THREE.Texture();
    const applyImage = img => {
      e.base.image = img;
      e.loaded = true;
      e.base.needsUpdate = true;
      for (const clone of e.clones) clone.needsUpdate = true;
    };
    decodedImage(url, applyImage, () => {
      e.full = null;
      decodedImage(`assets/tex/${file}.jpg`, applyImage);
    });
    shared.set(url, e);
  }
  // (a clone is born "needing an update"; until the photo has arrived that only made the renderer
  // warn, every frame, that there was nothing to upload)
  const t = e.base.clone(); if (e.loaded) t.needsUpdate = true; else t.version = 0; e.clones.push(t);
  return t;
}
// (the gate the threshold and the streaming share: engine/load.js)
export { dressed, markDressed } from './engine/load.js';
// Fetch the full-size photos, one after another, and swap each in. (The textures are let go of first: a texture's
// size cannot change once it is on the GPU.)
export function sharpenTextures(gap = 220) {
  // These are replacements for already loaded maps. Keep them out of the
  // startup loading manager, whose completion also rebuilds the sun shadow.
  const upgrades = new THREE.LoadingManager();
  const todo = [...shared.values()].filter(e => e.full && e.loaded);
  const next = () => {
    const e = todo.shift(); if (!e) return;
    const url = e.full; e.full = null;
    decodedImage(url, img => {
      if (e.loaded) { for (const t of [e.base, ...e.clones]) t.dispose(); e.base.image = img; e.base.needsUpdate = true; for (const c of e.clones) c.needsUpdate = true; }
      setTimeout(next, gap);
    }, () => setTimeout(next, gap), upgrades);
  };
  next();
}

export function makeMaterials(renderer, quality = {}) {
  const aniso = Math.min(quality.aniso ?? 8, renderer.capabilities.getMaxAnisotropy());

  function tex(file, size, srgb) {
    const t = sharedTexture(file);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const [su, sv] = Array.isArray(size) ? size : [size, size];
    t.repeat.set(1 / su, 1 / sv);
    t.anisotropy = aniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function pbr(name, size, o = {}) {
    return new THREE.MeshStandardMaterial({
      map: tex(name + '_color', size, true),
      normalMap: tex(name + '_normal', size),
      roughnessMap: o.flat ? null : tex(name + '_rough', size),
      color: o.color ?? 0xffffff,
      roughness: o.roughness ?? 1,
      metalness: 0,
      normalScale: new THREE.Vector2(o.bump ?? 1, o.bump ?? 1),
      envMapIntensity: o.env ?? 1,
    });
  }

  // Indoor surfaces take less of the open-sky light than outdoor ones. NB: three r170 ignores a
  // material's envMapIntensity when the light comes from scene.environment (it uses
  // scene.environmentIntensity for all), so these numbers do nothing; lighting.js cuts the sky
  // light inside the house's walls instead, by where a surface is rather than what it is.
  const IN = 0.09;

  // Plain painted, upholstered or metal surfaces are made on demand from a
  // name: 'c#rrggbb', optionally '/roughness/metalness'. 'e#rrggbb/strength' glows.
  const made = {};
  function make(name) {
    if (made[name]) return made[name];
    if (typeof name === 'string' && /^[a-z_]+$/.test(name) && Object.prototype.hasOwnProperty.call(defs, name)) return all[name];      // (a plain name asked for through make: it used to come back empty, and a mesh without a material stops the page drawing)
    // 'oak_light@in': the same material as a room's finish, lit as indoors over any room (the boards of an open roof)
    const inn = /^([a-z_]+)@in$/.exec(name);
    if (inn) return inn[1] in all ? (made[name] = indoorLit(all[inn[1]].clone())) : null;
    if (name === 'vc') {
      // Every plain colour in the house: colour, roughness and metalness come from the vertices
      // (attributes 'color' and 'rm', painted by the Builder), so one material draws them all.
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
      m.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 rm;\nvarying vec2 vRM;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRM = rm;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vRM;')
          .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vRM.x;').replace('#include <metalnessmap_fragment>', 'float metalnessFactor = vRM.y;');
      };
      m.customProgramCacheKey = () => 'vc-rm';
      return (made[name] = m);
    }
    const vc = /^vc\/([\d.]+)\/([01])$/.exec(name);
    if (vc) return (made[name] = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: Number(vc[1]), metalness: Number(vc[2]), envMapIntensity: vc[2] === '1' ? 0.9 : 0.1 }));
    const m = /^([ce])#([0-9a-f]{6})(?:\/([\d.]+))?(?:\/([\d.]+))?$/i.exec(name);
    if (!m) {
      // A textured material in another colour: 'linen#8a9a7b', 'velvet#2f3b52', 'painted_wood#66755e' ...
      const t = /^([a-z_]+)#([0-9a-f]{6})$/i.exec(name);
      if (!t || !(t[1] in all)) return null;
      made[name] = all[t[1]].clone(); made[name].color.set(parseInt(t[2], 16)).multiplyScalar(TINT_GAIN[t[1]] ?? 1.5);
      return made[name];
    }
    let color = m[1] === 'e' ? parseInt(m[2], 16) : new THREE.Color(parseInt(m[2], 16)).multiplyScalar(0.78), eK = Number(m[3] ?? 1.5), eBase = color;
    if (m[1] === 'e') {
      // Lamplight is amber, never white. A pale warm glow ('e#ffe2b4/1.8', 'e#fff4e0/3') burns out to paper white on
      // the screen: its hue is pulled to candle amber, its strength held, and the surface under the glow kept dark so
      // that the room's own lamps do not add white on top. (As the house's 'shade' and 'glow' are: lighting.js there.)
      // Glows of any other hue (the neon, the gel lamp, coloured glass) are left as they are.
      const r = (color >> 16) & 255, g = (color >> 8) & 255, bl = color & 255;
      if (r >= g && g >= bl && bl > 0.5 * r && r > 180) { const g2 = Math.min(g, Math.round(r * 0.76)), b2 = Math.min(bl, Math.round(r * 0.42)); color = (r << 16) | (g2 << 8) | b2; eK = Math.min(eK, 1.35); eBase = new THREE.Color(color).multiplyScalar(0.45); }
    }
    made[name] = m[1] === 'e'
      ? new THREE.MeshStandardMaterial({ color: eBase, emissive: color, emissiveIntensity: eK, roughness: 0.7 })
      : new THREE.MeshStandardMaterial({ color, roughness: Number(m[3] ?? 0.85), metalness: Number(m[4] ?? 0), envMapIntensity: Number(m[4] ?? 0) > 0.5 ? 0.9 : 0.1 });
    if (m[1] === 'e') glowing(made[name], m[2].toLowerCase());
    return made[name];
  }

  // Lamp glows (bulbs, shade linings, lit fittings, lanterns, string lights) are turned down by day
  // and up after dark by lighting.js: e0 is the full strength, day the fraction left by day. The
  // fridge's light and the garden's own bulbs (which garden.js dims itself) are left alone.
  const glows = [];
  const DAY_GLOW = { ffd9a0: 0.25, ffcf8a: 0.1, fff4e0: 0.12, ffe2b4: 0.06 };
  function glowing(mat, hex) {
    if (['fff1d0', 'ffd49a', 'ffb866'].includes(hex)) return;
    mat.userData.e0 = mat.emissiveIntensity; mat.userData.day = DAY_GLOW[hex] ?? 0.1; glows.push(mat);
  }

  // How much to lift a tint so that it lands near the colour typed (the base photos are mid-toned)
  const TINT_GAIN = { linen: 1.5, wool: 2.2, velvet: 2.4, curtain: 1.2, leather: 2.2, painted_wood: 1.2, wicker: 1.5, oak_light: 1.4, marble: 1.1 };
  // Speckled surfaces with no photograph: the road and the kerbstones
  function speckle(base, spread, size, o = {}) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    let sd = o.seed ?? 3; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 5200; i++) { const v = Math.round(128 + (r() - 0.5) * spread * 2); g.fillStyle = `rgba(${v},${v},${Math.round(v * 0.97)},${0.1 + r() * 0.3})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2.2, 1 + r() * 2.2); }
    for (let i = 0; i < (o.patches ?? 0); i++) { g.fillStyle = `rgba(20,20,22,${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / size, 1 / size); t.anisotropy = aniso;
    return new THREE.MeshStandardMaterial({ map: t, roughness: o.rough ?? 0.95, metalness: 0, envMapIntensity: o.env ?? 0.5 });
  }
  // Masonry with no photograph: coursed stone, dressed stone and roofing slate, painted on a canvas (colour) with a
  // second canvas for the relief (a normal map made from a painted height field). One tile is `size` feet square.
  function masonry(kind, o = {}) {
    const N = 512, c = document.createElement('canvas'), hc = document.createElement('canvas'); c.width = c.height = hc.width = hc.height = N;
    const g = c.getContext('2d'), hg = hc.getContext('2d');
    let sd = o.seed ?? 7; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const base = new THREE.Color(o.base ?? '#b0a590');
    const shade = k => `rgb(${[base.r, base.g, base.b].map(v => Math.round(255 * Math.min(1, Math.pow(v, 1 / 2.2) * k))).join(',')})`;
    g.fillStyle = shade(1); g.fillRect(0, 0, N, N); hg.fillStyle = '#808080'; hg.fillRect(0, 0, N, N);
    const grain = (n, a, lo = 0.75, hi = 1.2) => { for (let i = 0; i < n; i++) { g.fillStyle = shade(lo + r() * (hi - lo)); g.globalAlpha = a; g.fillRect(r() * N, r() * N, 1 + r() * 3, 1 + r() * 3); } g.globalAlpha = 1; };
    if (kind === 'ashlar') {
      // courses of unequal height (as random ashlar is laid), stones of unequal length, joints raked back, faces left rough
      const rows = [0.16, 0.11, 0.14, 0.09, 0.16, 0.12, 0.13, 0.09]; let y = 0;
      for (const rh of rows) {
        const h = rh * N; let x = -r() * 40;
        while (x < N) {
          const w = (0.6 + r() * 1.1) * h * 1.7, k = 0.86 + r() * 0.26;
          for (const dx of [0, N]) {                                  // (drawn twice so that a stone crossing the edge tiles)
            g.fillStyle = shade(k); g.fillRect(x - dx + 2, y + 2, w - 4, h - 4);
            const gr = hg.createRadialGradient(x - dx + w / 2, y + h / 2, 2, x - dx + w / 2, y + h / 2, Math.max(w, h) * 0.62); gr.addColorStop(0, '#c8c8c8'); gr.addColorStop(0.7, '#a0a0a0'); gr.addColorStop(1, '#5a5a5a');
            hg.fillStyle = gr; hg.fillRect(x - dx + 2, y + 2, w - 4, h - 4);

          }
          x += w;
        }
        g.fillStyle = shade(0.62); g.globalAlpha = 0.5; g.fillRect(0, y - 1.5, N, 3); g.globalAlpha = 1; hg.fillStyle = '#303030'; hg.fillRect(0, y - 2, N, 4);
        y += h;
      }
      // the rock face: pits and bosses, soft-edged, more of them toward the middle of each stone than at its drafted edge
      for (let i = 0; i < 2600; i++) { const px = r() * N, py = r() * N, rad = 2 + r() * 7, gr = hg.createRadialGradient(px, py, 0, px, py, rad), c0 = r() < 0.5 ? '30,30,30' : '235,235,235'; gr.addColorStop(0, `rgba(${c0},${0.1 + r() * 0.14})`); gr.addColorStop(1, `rgba(${c0},0)`); hg.fillStyle = gr; hg.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
      grain(9000, 0.16);
    } else if (kind === 'slate') {
      // 9 courses to the tile, each slate half a slate along from the one below; a shadow under each butt edge
      const rows = 9, h = N / rows, w = N / 6;
      for (let j = 0; j < rows; j++) for (let i = -1; i < 7; i++) {
        const x = i * w + (j % 2) * w / 2, y = j * h, k = 0.82 + r() * 0.34;
        g.fillStyle = shade(k); g.fillRect(x + 0.6, y, w - 1.2, h);
        const gr = hg.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#6a6a6a'); gr.addColorStop(0.86, '#a8a8a8'); gr.addColorStop(1, '#3a3a3a'); hg.fillStyle = gr; hg.fillRect(x + 1, y, w - 2, h);
        hg.fillStyle = '#383838'; hg.fillRect(x - 0.8, y, 1.6, h);
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + h - 2.5, w, 2.5);
      }
      grain(5000, 0.1, 0.8, 1.15);
    } else {                                                            // dressed stone: fine grain, faint bedding, no joints
      grain(14000, 0.18, 0.82, 1.14);
      for (let i = 0; i < 40; i++) { g.fillStyle = shade(0.9 + r() * 0.18); g.globalAlpha = 0.08; g.fillRect(0, r() * N, N, 1 + r() * 5); } g.globalAlpha = 1;
      for (let i = 0; i < 2500; i++) { hg.fillStyle = `rgba(${r() < 0.5 ? '60,60,60' : '200,200,200'},0.12)`; hg.fillRect(r() * N, r() * N, 1 + r() * 2, 1 + r() * 2); }
    }
    // the relief, as a normal map
    const H = hg.getImageData(0, 0, N, N).data, nc = document.createElement('canvas'); nc.width = nc.height = N; const ng = nc.getContext('2d'), out = ng.createImageData(N, N), s = kind === 'dressed' ? 1.2 : 3.2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const at = (xx, yy) => H[(((yy + N) % N) * N + ((xx + N) % N)) * 4] / 255;
      const dx = (at(x + 1, y) - at(x - 1, y)) * s, dy = (at(x, y + 1) - at(x, y - 1)) * s, l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
      out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
    }
    ng.putImageData(out, 0, 0);
    const T = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / (o.size ?? 6), 1 / (o.size ?? 6)); t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
    return new THREE.MeshStandardMaterial({ map: T(c, true), normalMap: T(nc), roughness: o.rough ?? 0.93, metalness: 0, envMapIntensity: o.env ?? 1 });
  }
  const defs = {
    drape: () => { const m = all.curtain.clone(); m.side = THREE.DoubleSide; return m; },
    asphalt: () => speckle('#3a3a3e', 46, 9, { patches: 26, rough: 0.9, env: 0.7 }),
    concrete: () => speckle('#a9a49a', 30, 6, { seed: 11, rough: 0.92 }),
    // Outside
    shake: () => pbr('shake', 7.33, { color: 0xf2d2b6, bump: 1.8, env: 3.2 }),   // 11" to the weather
    roof: () => pbr('roof', 5.5, { color: 0xc4b4a4, bump: 1.4, env: 1.6 }),
    brick: () => pbr('brick', 3.3, { color: 0xdcbcac, env: 2 }),
    clinker: () => pbr('clinker', 3.4, { color: 0xc9b3a6, env: 0.6 }),
    pavers: () => pbr('pavers', 5, { color: new THREE.Color().setRGB(1.32, 1.42, 1.4, THREE.LinearSRGBColorSpace) }),
    tile: () => pbr('tile', 6, { color: 0xe6cdbd, roughness: 0.85 }),
    timber: () => pbr('fir', 2.2, { color: new THREE.Color().setRGB(2.9, 5.2, 9.2, THREE.LinearSRGBColorSpace), roughness: 0.88, flat: true, env: 2.6 }),      // the fir photo is near black-red: lifted to a dark weathered brown // dark-stained outside
    grass: () => pbr('grass', 9, { color: 0xd9dc9c, flat: true, roughness: 1, bump: 0.6 }),
    sash: () => pbr('fir', 2.2, { color: 0xa48a70, roughness: 0.8, flat: true, env: 0.6 }),
    split_grain: () => new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: .93 }),
    bark: () => pbr('bark', 1, { color: 0x9a8f84, bump: 1.5 }),
    hedge: () => pbr('grass', 3, { color: 0x5d7a4a, bump: 2.5, flat: true, roughness: 1 }),
    melon_flesh: () => {
      const size=192, canvas=document.createElement('canvas'); canvas.width=canvas.height=size;
      const ctx=canvas.getContext('2d'), image=ctx.createImageData(size,size);
      let seed=53;
      for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
        const u=2*(x+0.5)/size-1, v=2*(y+0.5)/size-1, r=Math.hypot(u,v);
        const fade=THREE.MathUtils.smoothstep(r,0.76,1);
        const vein=Math.sin(3*Math.atan2(v,u)+r*12+0.6*Math.sin(v*13));
        seed=(seed*16807)%2147483647;
        const grain=14*(seed/2147483647-0.5)+4*vein+2*Math.sin(u*29+v*20), i=(y*size+x)*4;
        image.data.set([209+grain+22*fade,71+grain+57*fade,82+grain+41*fade,255],i);
      }
      ctx.putImageData(image,0,0);
      const map=new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({map,roughness:0.58});
    },
    cheese_rind: () => speckle('#c3ad8e', 95, 0.92, {seed:37,patches:42}),
    salami: () => speckle('#ba9a8f', 110, 0.44, {seed:81,patches:24}),
    soil: () => new THREE.MeshStandardMaterial({ color: 0x3b2a1f, roughness: 1 }),
    water: () => new THREE.MeshStandardMaterial({ color: 0x1f3b3a, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.82, envMapIntensity: 1.6 }),
    pool_surface: () => new THREE.MeshStandardMaterial({ color: 0x488780, roughness: 0.13, transparent: true, opacity: 0.36, depthWrite: false, side: THREE.DoubleSide }),
    pool_glass: () => new THREE.MeshStandardMaterial({ color: 0x8cbfb7, roughness: 0.08, transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide }),
    shade: () => {
      const m = pbr('linen', 0.9, { color: 0xc5ae87, bump: 0.35, flat: true });
      m.emissive.setHex(0xffb46a); m.emissiveMap = m.map; m.side = THREE.DoubleSide;
      return m;
    },
    stone: () => new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 0.95 }),

    // Inside
    floor: () => pbr('floor', [9, 3.2], { color: 0xfff0d8, roughness: 0.62, env: 0.3, bump: 0.5 }),
    fir: () => pbr('fir', 2.2, { color: 0xcdb48e, roughness: 0.78, flat: true, env: IN }),
    plaster: () => indoorLit(pbr('plaster', 7, { color: 0xeadbbb, env: IN, bump: 0.5 })),      // (plaster and ceilings are lit as indoors wherever they stand over a room: lighting.js, indoorLit)
    ceil: () => indoorLit(pbr('plaster', 7, { color: 0xf3ead6, env: IN, bump: 0.35 })),
    door: () => pbr('fir', [2.2, 2.2], { color: 0xcdb48e, roughness: 0.78, flat: true, env: IN }),
    soot: () => new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 1, envMapIntensity: 0.2 }),

    glass: () => new THREE.MeshStandardMaterial({ color: 0x3a4648, transparent: true, opacity: 0.26, roughness: 0.03, metalness: 0, envMapIntensity: 3.0, depthWrite: false, side: THREE.DoubleSide, }),
    screen: () => new THREE.MeshStandardMaterial({ color: 0x2a2622, transparent: true, opacity: 0.2, roughness: 1, depthWrite: false, side: THREE.DoubleSide, }),
    copper: () => new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 0.5, metalness: 0.8 }),
    glow: () => new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffb65c, emissiveIntensity: 2.2, roughness: 0.6 }),

    // Upholstery, cloth and furniture surfaces (tile sizes in feet; see assets/tex/TEXTURES.md)
    linen: () => pbr('linen', 1.3, { color: 0xb9b0a0, env: IN, bump: 1.2 }),
    wool: () => pbr('wool', 0.9, { color: 0xb4b0aa, env: IN, bump: 1.2 }),
    velvet: () => pbr('velvet', 0.9, { color: 0xa8a0a0, env: IN }),
    curtain: () => pbr('curtain', 1.5, { color: 0xb8b2a6, env: IN }),
    leather: () => pbr('leather', 1.3, { color: 0xb09a88, roughness: 0.9, env: 0.3 }),
    marble: () => pbr('marble', 3, { color: 0xc9c6c0, roughness: 0.55, env: 0.5 }),
    tile_hex: () => pbr('tile_hex', 1.5, { color: 0xc4c0b8, env: 0.4 }),
    tile_subway: () => pbr('tile_subway', 2, { color: 0xc4c0b8, env: 0.4 }),
    painted_wood: () => pbr('painted_wood', 3, { color: 0xb8b2a4, env: IN }),
    oak_light: () => pbr('oak_light', 2.5, { color: 0xb8a98e, roughness: 0.8, env: IN }),
    wicker: () => pbr('wicker', 1.5, { color: 0xb8a98e, env: IN }),
    // Ground
    gravel: () => pbr('gravel', 6.6, { color: 0xd0cabc, env: 0.8 }),
    flagstone: () => pbr('flagstone', 6.6, { color: 0xc8c2b6, env: 0.8 }),
    soilbed: () => pbr('soil', 6.6, { color: 0xb0a090, env: 0.6 }),
    mulch: () => pbr('mulch', 6.9, { color: 0xb0a090, env: 0.6 }),
    meadow: () => pbr('meadow', 6.6, { color: 0xc8cc98, flat: true, roughness: 1, env: 0.8 }),

    // Spanya's own (notes/STYLE.md): rough stone, slate, dark wood. Photographs from Poly Haven, CC0 (assets/tex/TEXTURES.md).
    fieldstone: () => pbr('fieldstone', 11, { color: 0xc9c2b4, bump: 0.9, flat: true, roughness: 0.97, env: 0.4 }),          // thin, rough courses of warm grey stone: the courtyard's wall and the cliff
    rubble: () => pbr('rubble', 9, { color: 0xd2c6b2, bump: 1.1, flat: true, roughness: 0.97, env: 0.3 }),                  // irregular warm rubble: the stair, the cave, the chapel
    // The island's earth and stone, as Anna's House draws its cliff (island.js there): the flagstone photograph drawn out
    // flat into courses, warm; and over it, from where a point is in the world: wandering strata of paler and darker
    // stone, bands of brown earth between the beds, greyer weathered patches, and the same photograph again much larger
    // to break the repeat (it showed as a grid of identical tiles from the first view).
    // Continuous rock across overhangs, the crown and the underside. It has no light of its own: the court's lamps
    // (lighting.js, fixedExteriorLight) light it exactly as they light the walls under it. Projection in
    // world feet avoids a stretched strip at the wrap seam or a change of UV chart.
    bedrock: () => {
      const m = new THREE.MeshStandardMaterial({ map: tex('cliffrock_color', 1, true), color: 0xe5d5c1, roughness: 0.96, envMapIntensity: 0.3 });
      m.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRockP, vRockN;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockP = position; vRockN = normal;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRockP, vRockN;')
          .replace('#include <map_fragment>', `
            vec3 p = vRockP;
            p.y += 1.4 * sin(p.x * 0.072 + p.z * 0.046) + 0.14 * p.z;
            vec3 w = pow(abs(normalize(vRockN)), vec3(4.0));
            w /= max(w.x + w.y + w.z, 0.0001);
            vec3 stone = w.x * texture2D(map, p.zy / vec2(19., 14.)).rgb
                       + w.y * texture2D(map, p.xz / 21.).rgb
                       + w.z * texture2D(map, p.xy / vec2(19., 14.)).rgb;
            float bed = smoothstep(-0.7, 0.7, sin(p.y * 0.22 + sin(p.z * 0.04)));
            float weather = sin(dot(p, vec3(.069, .043, .051)) + sin(p.x * .09));
            diffuseColor.rgb *= stone * mix(vec3(0.84, 0.77, 0.70), vec3(1.13, 1.09, 1.03), bed) * (1.0 + .12 * weather);
          `);
      };
      return m;
    },
    cliffrock: () => { const m = pbr('flagstone', [25, 8.3], { color: new THREE.Color().setRGB(1.05, 0.9, 0.72, THREE.LinearSRGBColorSpace), bump: 1.6, flat: true, roughness: 1, env: 0.4 });
      m.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCliffP;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vCliffP = (modelMatrix * vec4(position, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCliffP;').replace('#include <map_fragment>', `#include <map_fragment>
  {
    vec3 cp = vCliffP;
    vec3 big = texture2D(map, vMapUv * 0.23 + vec2(0.37, 0.11)).rgb, mid = texture2D(map, vMapUv.yx * 0.61 + vec2(0.13, 0.57)).rgb;
    diffuseColor.rgb *= mix(vec3(1.0), big * 4.3, 0.5) * mix(vec3(1.0), mid * 4.1, 0.3);
    float st = sin(cp.y * 0.9 + sin(cp.x * 0.045) * 2.5 + sin(cp.z * 0.05 + 1.0) * 2.5);
    float st2 = sin(cp.y * 0.23 + sin(cp.z * 0.02) * 3.0 + sin(cp.x * 0.017 + 2.0) * 2.0);
    diffuseColor.rgb *= (0.9 + 0.1 * st) * (0.9 + 0.14 * st2) * vec3(1.0, 0.985 + 0.02 * st2, 0.95 + 0.06 * st2);
    float earth = smoothstep(0.55, 0.95, sin(cp.y * 0.105 + sin(cp.z * 0.031) * 1.8 + sin(cp.x * 0.027) * 1.6 + 0.8));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.74, 0.62, 0.5) + vec3(0.02, 0.012, 0.005), earth * 0.6);
    float patchy = smoothstep(0.2, 0.9, sin(cp.x * 0.071 + sin(cp.y * 0.11) * 1.5) * sin(cp.z * 0.063 - cp.y * 0.05));
    diffuseColor.rgb *= mix(vec3(1.0), vec3(0.8, 0.82, 0.85), patchy);
  }`);
      };
      m.customProgramCacheKey = () => 'cliffrock-strata'; return m; },
    coursed: () => pbr('fieldstone', [17, 8], { color: new THREE.Color().setRGB(1.42, 1.33, 1.2, THREE.LinearSRGBColorSpace), bump: 0.6, flat: true, roughness: 0.96, env: 0.3 }),      // pale warm stone in long thin courses: the walls of the main rooms, after the pool's and the chapel's own lining
    boards: () => pbr('oak_light', [7, 2.2], { color: 0xd9c4a0, roughness: 0.82, env: IN }),                                                                              // honey boards: ceilings
    hewn: () => pbr('flagstone', [16, 5.3], { color: new THREE.Color().setRGB(1.5, 1.38, 1.2, THREE.LinearSRGBColorSpace), bump: 0.8, flat: true, roughness: 1, env: 0.4 }),      // the same stone cut back and dressed, paler: the courtyard's wall and the fronts
    slate_floor: () => pbr('slate_floor', 8, { color: 0x8f887e, flat: true, roughness: 0.82, env: 0.3 }),   // big dark slate flags: the ground storey's floors
    walnut: () => pbr('walnut', 3.6, { color: 0xa87d58, flat: true, roughness: 0.85, env: IN }),           // dark walnut panelling and joinery
    boards_dark: () => pbr('boards_dark', 6.6, { color: 0xd0b08c, roughness: 0.8, env: IN }),  // dark boards: ceilings
    hinoki: () => pbr('hinoki', 6.6, { color: 0xe6cfa6, roughness: 0.7, env: IN }),            // pale cypress boards: the wet rooms
    tatami: () => pbr('tatami', 6, { color: 0xd8cfa8, roughness: 0.95, env: IN }),             // woven rush mats

    // Masonry and roofing for the school's buildings (building.js). No photographs: painted here (masonry, below).
    limestone: () => masonry('ashlar', { size: 8, base: '#b9ae97', env: 1.4 }),            // rough (rock-faced) limestone ashlar in courses, as Old Snow Hall
    limestone_smooth: () => masonry('dressed', { size: 6, base: '#c9c0ab', env: 1.2 }),    // dressed limestone: sills, lintels, string courses, quoins
    brownstone: () => masonry('dressed', { size: 6, base: '#7d5847', env: 1.0, seed: 23 }),// brownstone trim, as the Cambridge library
    brick_red: () => pbr('brick', 3.3, { color: new THREE.Color().setRGB(1.5, 0.82, 0.68, THREE.LinearSRGBColorSpace), env: 2 }),      // pressed red brick
    slate: () => masonry('slate', { size: 6, base: '#5d6066', env: 1.6, rough: 0.72 }),    // roofing slate in courses, 8 in. to the weather
    slate_red: () => masonry('slate', { size: 6, base: '#7a4f48', env: 1.4, rough: 0.75, seed: 31 }),
    shingle: () => pbr('shake', 7.33, { color: 0xd9c4ae, bump: 1.8, env: 2.6 }),           // wood shingles (the shake photograph, greyer)
  };
  // Materials are made the first time they are asked for, so only the photographs a place uses are fetched.
  const all = { make }, ready = {};
  for (const name of Object.keys(defs)) Object.defineProperty(all, name, { enumerable: true, configurable: true, get() { return (ready[name] ??= defs[name]()); }, set(v) { ready[name] = v; } });
  // The lampshade fabric glows from the bulb after dark and is plain cream linen by day
  all.shade.userData.e0 = 0.42; all.shade.userData.day = 0.03; glows.push(all.shade);          // full strength after dark (was 1.25 always: chalk white at night)
  all.glow.userData.e0 = 0.45; all.glow.userData.day = 0.08; glows.push(all.glow);                // the porch lantern's amber glass (was 2.2: blown white)
  all.glows = glows;
  // The Builder paints tints onto vertices: tint(name, hex) is the colour make('name#hex') would
  // have given the material (or the plain material's own colour), and vc(name) the one shared
  // vertex-coloured copy of the material that all of them are drawn with (vcOf; not 'vc',
  // which is the name of the plain-colour material that make('vc') returns).
  const vcs = {};
  all.tint = (name, hex) => (hex === undefined ? all[name].color.clone() : new THREE.Color(hex).multiplyScalar(TINT_GAIN[name] ?? 1.5));
  all.vcOf = name => (vcs[name] ??= (c => (all[name].userData.indoor ? indoorLit(c) : c))(Object.assign(all[name].clone(), { vertexColors: true, color: new THREE.Color(1, 1, 1) })));      // (a tinted plaster is plaster still: indoors)
  return all;
}
