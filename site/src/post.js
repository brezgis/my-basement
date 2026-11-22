// Drawing small and showing sharp (?post=1). The place is drawn into a picture of its own at `scale` drawing pixels to
// each point of the page (antialiased, tone-mapped and in display colours, as the canvas was), and that picture is then
// brought up to the canvas, which is kept at the screen's own pixels: enlarged with a bicubic (Catmull-Rom) filter, in
// nine samples, and sharpened with AMD's RCAS (FidelityFX FSR 1, the sharpening half: ffx_fsr1.h, MIT licence). Before,
// the canvas itself was the small picture, and the browser stretched it to the screen with a plain bilinear filter:
// that stretch is the softness. Fewer pixels are lit (the dear part: lighting.js), and the two passes here are cheap.
//
//   post.render(scene, camera)   in place of renderer.render      post.setScale(r)   the drawing resolution (main.js's ladder)
//   post.setSize(w, h)           the page's size, in points       ?sharp=0..1        how much sharpening (0.6)
import * as THREE from 'three';

const VERT = `in vec3 position; void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
// (Catmull-Rom in nine bilinear samples: the sixteen taps taken four at a time where their weights allow)
const SRGB = `vec3 toDisplay(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }`;
const UP = `precision highp float; uniform sampler2D t; uniform vec2 size, outSize; out vec4 o;
${SRGB}
void main() {
  vec2 sp = gl_FragCoord.xy / outSize * size, p1 = floor(sp - 0.5) + 0.5, f = sp - p1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f)), w1 = 1.0 + f * f * (-2.5 + 1.5 * f), w2 = f * (0.5 + f * (2.0 - 1.5 * f)), w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2, p0 = (p1 - 1.0) / size, p3 = (p1 + 2.0) / size, p12 = (p1 + w2 / w12) / size;
  vec3 c = texture(t, vec2(p0.x, p0.y)).rgb * w0.x * w0.y + texture(t, vec2(p12.x, p0.y)).rgb * w12.x * w0.y + texture(t, vec2(p3.x, p0.y)).rgb * w3.x * w0.y
         + texture(t, vec2(p0.x, p12.y)).rgb * w0.x * w12.y + texture(t, vec2(p12.x, p12.y)).rgb * w12.x * w12.y + texture(t, vec2(p3.x, p12.y)).rgb * w3.x * w12.y
         + texture(t, vec2(p0.x, p3.y)).rgb * w0.x * w3.y + texture(t, vec2(p12.x, p3.y)).rgb * w12.x * w3.y + texture(t, vec2(p3.x, p3.y)).rgb * w3.x * w3.y;
  o = vec4(toDisplay(c), 1.0);      // (the picture is kept in linear light; from here on, display values)
}`;
// (RCAS: the middle pixel against its four neighbours, as much as can be had without ringing past their range)
const RCAS = `precision highp float; uniform sampler2D t; uniform float sharp, lin; out vec4 o;
${SRGB}
vec3 px(ivec2 p) { vec3 c = texelFetch(t, p, 0).rgb; return lin > 0.5 ? toDisplay(c) : c; }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec3 b = px(p + ivec2(0, -1)), d = px(p + ivec2(-1, 0)), e = px(p), f = px(p + ivec2(1, 0)), h = px(p + ivec2(0, 1));
  vec3 mn = min(min(b, d), min(f, h)), mx = max(max(b, d), max(f, h));
  vec3 hitMin = mn / (4.0 * mx + 1e-5), hitMax = (1.0 - mx) / (4.0 * mn - 4.0 - 1e-5);
  vec3 lobeRGB = max(-hitMin, hitMax);
  float lobe = max(-0.1875, min(max(lobeRGB.r, max(lobeRGB.g, lobeRGB.b)), 0.0)) * sharp;
  o = vec4((lobe * (b + d + f + h) + e) / (4.0 * lobe + 1.0), 1.0);
}`;

export function makePost(renderer, { scale = 1, samples = 4, sharp = 0.6 } = {}) {
  const pass = (frag, uniforms) => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, toneMapped: false });
  // the place's own picture: tone-mapped as the canvas would be (three does that only for the canvas and for a headset's
  // target, so it is marked as one while it is drawn into: r170 WebGLPrograms, WebGLRenderer.setProgram), and kept in
  // linear light in an sRGB store (the antialiasing is then averaged in linear light, and nothing is lost in the darks).
  // It is allocated as an ordinary target (a headset's would get a plain store for its samples, which cannot be resolved
  // into an sRGB one: fit, below).
  const scenePic = new THREE.WebGLRenderTarget(4, 4, { samples, type: THREE.UnsignedByteType, depthBuffer: true, stencilBuffer: false });
  scenePic.texture.generateMipmaps = false;
  const big = new THREE.WebGLRenderTarget(4, 4, { type: THREE.UnsignedByteType, depthBuffer: false, stencilBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const up = pass(UP, { t: { value: scenePic.texture }, size: { value: new THREE.Vector2() }, outSize: { value: new THREE.Vector2() } });
  const rcas = pass(RCAS, { t: { value: big.texture }, sharp: { value: sharp }, lin: { value: 0 } });
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const quad = new THREE.Mesh(tri, up); quad.frustumCulled = false;
  const flat = new THREE.Scene(); flat.add(quad); flat.matrixWorldAutoUpdate = false;
  const cam = new THREE.Camera();
  let W = 1, H = 1;
  const fit = () => {
    const out = renderer.getDrawingBufferSize(new THREE.Vector2());
    scenePic.isXRRenderTarget = false; scenePic.texture.colorSpace = THREE.SRGBColorSpace;
    scenePic.setSize(Math.max(2, Math.round(W * scale)), Math.max(2, Math.round(H * scale)));
    renderer.initRenderTarget(scenePic);
    scenePic.isXRRenderTarget = true; scenePic.texture.colorSpace = THREE.LinearSRGBColorSpace;
    big.setSize(out.x, out.y);
    up.uniforms.size.value.set(scenePic.width, scenePic.height); up.uniforms.outSize.value.set(out.x, out.y);
  };
  renderer.info.autoReset = false;      // (three passes to a frame: the counts are of all of them)
  return {
    targets: { scenePic, big },
    get scale() { return scale; },
    setScale(r) { if (Math.abs(r - scale) > 1e-4) { scale = r; fit(); } },
    setSize(w, h) { W = w; H = h; fit(); },
    render(scene, camera) {
      renderer.info.reset();
      renderer.setRenderTarget(scenePic); renderer.render(scene, camera);
      const exact = scenePic.width === big.width && scenePic.height === big.height;      // nothing to enlarge: sharpen the picture as it is
      if (!exact) { quad.material = up; renderer.setRenderTarget(big); renderer.render(flat, cam); }
      rcas.uniforms.t.value = exact ? scenePic.texture : big.texture; rcas.uniforms.lin.value = exact ? 1 : 0;
      quad.material = rcas; renderer.setRenderTarget(null); renderer.render(flat, cam);
    },
  };
}
