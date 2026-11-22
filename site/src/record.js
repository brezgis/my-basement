// The record player: a turntable that stands on a table or cabinet, with a record on it that turns while music
// plays. E on it lifts the needle and puts the next record on. It is the house's and the town's player (their
// main.js and the listening station of the town's record shop); the music is sound.js's crate, the recordings
// listed in assets/audio/manifest.json (kind: 'music'), shuffled.
//
// A furnish file places it with f.recordPlayer(frame, x, y, z) (src/furnish/README.md): recordPlayerBody (here)
// builds the deck, and the furnishing layer hands setupRecord the place of its platter once the scene exists.
// The music is heard in full in the player's own room and fades with distance outside it (sound.js). There is
// one crate and one needle: only the first player placed is the one that plays.

import * as THREE from 'three';

const WOOD = 'c#4a3324/0.5', DECK = 'c#2b2724/0.45', CHROME = 'c#d4d6d8/0.12/1', BLACK = 'c#17140f/0.45';
// The platter's centre in the deck's own frame (x along, y toward the front), and the record's height above its foot
export const PLATTER = { x: 0.12, y: 0, top: 0.268 };

// The deck: 1.7 wide, 1.3 deep, 0.19 high (the arm stands to 0.41), centred on (x, y) of frame f, its foot at
// height z, its front toward the frame's front. K is the kit.
export function recordPlayerBody(K, f, x = 0, y = 0, z = 0) {
  const s = f.sub(x, y, z), px = PLATTER.x, py = PLATTER.y;
  s.soft(WOOD, -0.85, 0.85, -0.65, 0.65, 0, 0.17, 0.03); s.box(DECK, -0.8, 0.8, -0.6, 0.6, 0.17, 0.19);
  s.cyl(CHROME, px, py, 0.19, 0.255, 0.53, 0.53, 32); s.cyl(CHROME, px, py, 0.255, 0.33, 0.012, 0.012, 6);      // platter, spindle
  s.cyl(CHROME, -0.62, -0.38, 0.19, 0.37, 0.07, 0.06, 12);                                                        // the arm's pillar
  const ax = -0.62, ay = -0.38, tx = -0.28, ty = 0.3, len = Math.hypot(tx - ax, ty - ay), dx = (tx - ax) / len, dy = (ty - ay) / len, ang = Math.atan2(-dx, dy);      // from the pillar to the groove
  K.put(s, CHROME, new THREE.CylinderGeometry(0.014, 0.014, len + 0.2, 6), { rz: ang, at: [ax + dx * (len - 0.2) / 2, ay + dy * (len - 0.2) / 2, 0.385] });      // the arm
  K.put(s, BLACK, new THREE.BoxGeometry(0.09, 0.16, 0.05), { rz: ang, at: [tx, ty, 0.36] });                      // the head, over the record
  K.put(s, CHROME, new THREE.CylinderGeometry(0.045, 0.045, 0.1, 10), { rz: ang, at: [ax - dx * 0.2, ay - dy * 0.2, 0.385] });      // counterweight
  for (const kx of [0.52, 0.68]) s.cyl(CHROME, kx, 0.5, 0.19, 0.225, 0.04, 0.04, 10);                              // two knobs at the front
  return s.map(px, py);                                                                                              // the platter's centre, in the building's plan: [X, Y]
}

// Once the scene exists: the record itself (so that it can turn), and E to change it. spot: { x, y, z } the top of
// the platter in the world; room: the room it stands in ({ name, site }), or null.
export function setupRecord(ctx, spot) {
  const { scene, sound } = ctx;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.02, 40), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35 }));
  // Its label is printed (a pale half, lettering round the rim), so that it can be seen to turn; and the record is a
  // hair out of flat, as pressings are, so its edge rises and falls as it goes round.
  const face = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 256, height: 256 })); face.colorSpace = THREE.SRGBColorSpace; face.anisotropy = 8;
  { const g = face.image.getContext('2d'), R = 128;
    g.fillStyle = '#7a2f2a'; g.beginPath(); g.arc(R, R, R, 0, 7); g.fill();
    g.fillStyle = '#efe4c8'; g.beginPath(); g.arc(R, R, R, -0.5, Math.PI - 0.5); g.fill();                          // the pale half
    g.strokeStyle = '#2a1c13'; g.lineWidth = 3; g.beginPath(); g.arc(R, R, R - 9, 0, 7); g.stroke();
    g.fillStyle = '#2a1c13'; g.font = 'bold 21px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...'THE SCHOOL · SIDE A ·'].forEach((ch, k, all) => { const a = -Math.PI / 2 + (k - (all.length - 1) / 2) * 0.2; g.save(); g.translate(R + Math.cos(a) * 92, R + Math.sin(a) * 92); g.rotate(a + Math.PI / 2); g.fillText(ch, 0, 0); g.restore(); });
    g.font = 'italic 19px Georgia, serif'; g.fillText('33⅓', R, R + 56);
    g.beginPath(); g.arc(R, R, 9, 0, 7); g.fill(); }
  const plain = new THREE.MeshStandardMaterial({ color: 0x7a2f2a, roughness: 0.7 });
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.022, 32), [plain, new THREE.MeshStandardMaterial({ map: face, roughness: 0.7 }), plain]);
  disc.add(lbl); disc.rotation.z = 0.014; disc.position.set(spot.x, spot.y + 0.012, spot.z); disc.userData.cat = 'record'; scene.add(disc);
  ctx.track?.(disc, ctx.zoneAt?.(spot.x, spot.y, spot.z, 0.5) ?? '');
  ctx.interact.push({ x: spot.x, y: spot.y, z: spot.z, reach: 6, size: 1.1,
    label: () => `put on another record${sound.nowPlaying() ? ' (now: ' + sound.nowPlaying() + ')' : ''}`,
    act: () => { sound.start().then(() => { const t = sound.next(); ctx.flash(t ? 'now playing: ' + t : 'the crate is empty'); }); } });
  ctx.animated.push((t, dt) => { if (sound.nowPlaying()) disc.rotation.y -= dt * 3.49; });      // 33 1/3 turns a minute
  return disc;
}
