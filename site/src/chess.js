// The chess set: a real game on a table. Sit down to it (E) and you play White; the other side answers
// (chess_rules.js: the rules and a modest opponent). Look at a piece and click to pick it up, look at a marked
// square and click to move; N starts a new game; any step stands you up. The game is kept in this browser.
// It is the house's chess (toys.js there), given a place by a furnish file: f.chess(frame, x, y, z, { opponent })
// (src/furnish/README.md). The set is the Poly Haven model `chess_set` (CC0), already in assets/models/.
// One set in the school. Test hook: ?toy=chess, ?toy=chess:e2e4 (sits down, and plays a move).

import * as THREE from 'three';
import { start, legal, make, status, reply, inCheck, squareName, NAMES } from './chess_rules.js';

const Q = new URLSearchParams(location.search), TOY = Q.get('toy') ?? '';
const note = t => window.houseUI?.toast?.(t);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window */ } };

// spot: { x, y, z } the middle of the table's top in the world; seat: { x, y, z } where the visitor's eye rests; opponent: a name
export function setupChess(ctx, spot) {
  const modes = [];                       // what may hold the visitor: { active, click(), hint(), leave() }
  ctx.capture = () => { const m = modes.find(m => m.active); if (!m) return false; return m.click?.() ?? false; };      // main.js: a click or E goes to the game
  ctx.hint = () => modes.find(m => m.active)?.hint?.() ?? null;                                                       // main.js: the prompt, while playing
  // Standing up (any step) ends the game for now
  ctx.animated.push(() => { for (const m of modes) if (m.active && !ctx.walker.seated) { m.active = false; m.leave?.(); } });
  const hold = (m, seat, pitch) => { ctx.walker.sit(seat); ctx.walker.pitch = pitch; m.active = true; };
  return chess(ctx, modes, hold, spot).catch(e => console.warn('chess', e));
}

async function chess(ctx, modes, hold, spot) {
  const C = new THREE.Vector3(spot.x, spot.y, spot.z), WHO = spot.opponent || 'The other side';      // the middle of the table's top; who plays Black
  const set = await ctx.loadModel('chess_set');
  set.scale.multiplyScalar(0.95); set.position.copy(C);
  const centre = n => new THREE.Box3().setFromObject(n).getCenter(new THREE.Vector3());
  const find = name => { let f = null; set.traverse(n => { if (n.name === name) f = n; }); return f; };
  // Turn the board so that White sits on the visitor's side
  set.updateMatrixWorld(true);
  { const d = centre(find('piece_king_black')).sub(centre(find('piece_king_white'))); set.rotation.y = Math.atan2(d.z, d.x) - Math.atan2(C.z - spot.seat.z, C.x - spot.seat.x); }
  set.updateMatrixWorld(true);
  { const b = new THREE.Box3().setFromObject(set), c = b.getCenter(new THREE.Vector3()); set.position.x += C.x - c.x; set.position.z += C.z - c.z; set.position.y += C.y - b.min.y; }
  set.updateMatrixWorld(true);
  set.traverse(n => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = true; } });
  set.userData.cat = 'model:chess_set'; ctx.scene.add(set); ctx.track?.(set, ctx.zoneAt?.(C.x, C.y, C.z, 1));

  // The squares, measured from the pieces as they stand in the model
  const wk = centre(find('piece_king_white')), wq = centre(find('piece_queen_white')), bk = centre(find('piece_king_black'));
  const fileV = wk.clone().sub(wq).setY(0), rankV = bk.clone().sub(wk).setY(0).multiplyScalar(1 / 7);
  const a1 = wq.clone().addScaledVector(fileV, -3); a1.y = 0;
  const SQ = fileV.length(), fileH = fileV.clone().normalize(), rankH = rankV.clone().normalize();
  const sqPos = sq => a1.clone().addScaledVector(fileV, sq & 7).addScaledVector(rankV, sq >> 3);
  const sqAt = p => { const d = p.clone().sub(a1), f = Math.round(d.dot(fileH) / SQ), r = Math.round(d.dot(rankH) / rankV.length()); return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : r * 8 + f; };

  // Every piece: its node, what it is, where it stood in the model, and where it is now
  const LETTER = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k' };
  const pieces = [];
  let top = Infinity;
  set.traverse(n => {
    const m = /^piece_([a-z]+)_(white|black)/.exec(n.name); if (!m) return;
    const box = new THREE.Box3().setFromObject(n), home = box.getCenter(new THREE.Vector3()); home.y = 0; top = Math.min(top, box.min.y);
    const letter = m[2] === 'white' ? LETTER[m[1]].toUpperCase() : LETTER[m[1]];
    pieces.push({ node: n, letter, home, base: n.position.clone(), inv: new THREE.Matrix3().setFromMatrix4(n.parent.matrixWorld).invert(), off: new THREE.Vector3(), goal: new THREE.Vector3(), sq: -1, spare: false });
  });
  // check the model really is a set standing at the start
  { const s0 = start(); for (const p of pieces) { const sq = sqAt(p.home); if (sq < 0 || s0.b[sq] !== p.letter) throw new Error('chess model is not at the starting position: ' + p.node.name); } }
  const spawnQueen = white => {            // a promoted pawn becomes a copy of that side's queen
    const src = pieces.find(p => p.letter === (white ? 'Q' : 'q') && !p.clone), node = src.node.clone(); src.node.parent.add(node);
    const p = { ...src, node, off: new THREE.Vector3(), goal: new THREE.Vector3(), sq: -1, clone: true }; pieces.push(p); return p;
  };

  // The game. Kept between visits; a fresh house finds a game left a few moves in.
  const opening = () => { let s = start(); for (const mv of ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5']) s = make(s, legal(s).find(m => squareName(m.from) + squareName(m.to) === mv)); return s; };
  let game = load('school.chess', null); if (!game?.b || game.b.length !== 64) game = opening();
  let selected = -1, thinking = false, over = '';
  // Stand every piece where the position says (used at the start and for a new game)
  function layout(snap) {
    const free = pieces.filter(p => !p.clone); for (const p of pieces) { p.sq = -1; if (p.clone) p.node.visible = false; }
    for (let sq = 0; sq < 64; sq++) {
      const L = game.b[sq]; if (!L) continue;
      let i = free.findIndex(p => p.letter === L && sqAt(p.home) === sq); if (i < 0) i = free.findIndex(p => p.letter === L);
      const p = i >= 0 ? free.splice(i, 1)[0] : (pieces.find(q => q.clone && q.letter === L && q.sq < 0) ?? spawnQueen(L === 'Q'));
      p.sq = sq; p.node.visible = true; p.goal.copy(sqPos(sq)).sub(p.home); if (snap) p.off.copy(p.goal);
    }
    for (const p of pieces) if (p.sq < 0) p.node.visible = false;
    const st = status(game); over = st === 'mate' || st === 'stalemate' ? st : '';
  }
  layout(true);
  const at = sq => pieces.find(p => p.sq === sq && p.node.visible);
  function play(m) {
    const p = at(m.from), white = game.turn === 'w', takenSq = m.ep ? m.to + (white ? -8 : 8) : m.to, taken = at(takenSq);
    if (taken) { taken.sq = -1; taken.fade = 1; }
    p.sq = m.to; p.goal.copy(sqPos(m.to)).sub(p.home); p.hop = 1;
    if (m.castle) { const r = at(m.castle === 'k' ? m.to + 1 : m.to - 2), to = m.castle === 'k' ? m.to - 1 : m.to + 1; r.sq = to; r.goal.copy(sqPos(to)).sub(r.home); r.hop = 1; }
    if (m.promo) p.promote = white ? 'Q' : 'q';
    game = make(game, m); save('school.chess', game);
    const st = status(game); over = st === 'mate' || st === 'stalemate' ? st : '';
    return { piece: NAMES[p.letter.toUpperCase()], taken: taken ? NAMES[taken.letter.toUpperCase()] : '', to: squareName(m.to), st, promo: !!m.promo, castle: m.castle };
  }
  const say = (who, r) => {
    const what = r.castle ? `${who} castle${who === 'You' ? '' : 's'}` : `${who} ${r.taken ? (who === 'You' ? 'take' : 'takes') + ` the ${r.taken} on` : (who === 'You' ? 'move' : 'plays') + ` ${r.piece} to`} ${r.to}`;
    const tail = r.st === 'mate' ? (who === 'You' ? `. Checkmate! ${WHO} bows.` : '. Checkmate.') : r.st === 'stalemate' ? '. Stalemate: a draw.' : r.st === 'check' ? '. Check.' : r.promo ? ', and the pawn becomes a queen.' : '.';
    note(what + tail);
  };
  function figMoves() {
    if (over || game.turn !== 'b') return;
    thinking = true;
    setTimeout(() => { const m = reply(game, 3); thinking = false; if (m && game.turn === 'b') say(WHO, play(m)); }, TOY ? 0 : 900);
  }
  const newGame = () => { game = start(); save('school.chess', game); selected = -1; layout(false); note('A new game. You are White.'); };

  // Markers: the square you are looking at, the piece you hold, and where it may go
  const flat = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const mk = (color, opacity) => { const m = new THREE.Mesh(flat, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false })); m.scale.setScalar(SQ * 0.96); m.rotation.y = Math.atan2(-fileH.z, fileH.x); m.visible = false; m.renderOrder = 3; ctx.scene.add(m); return m; };
  const aimMark = mk(0xffd98a, 0.38), selMark = mk(0xe8a030, 0.55);
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(SQ * 0.17, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2f6a4a, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }), 32);
  dots.count = 0; dots.frustumCulled = false; dots.renderOrder = 4; dots.visible = false; ctx.scene.add(dots);
  let targets = [];
  const mtx = new THREE.Matrix4();
  function select(sq) {
    selected = sq; targets = sq < 0 ? [] : legal(game).filter(m => m.from === sq);
    dots.count = targets.length; targets.forEach((m, i) => { const p = sqPos(m.to); dots.setMatrixAt(i, mtx.makeTranslation(p.x, top + 0.006, p.z)); }); dots.instanceMatrix.needsUpdate = true;
    selMark.visible = sq >= 0; if (sq >= 0) { const p = sqPos(sq); selMark.position.set(p.x, top + 0.004, p.z); }
  }

  // Where you are looking on the board
  const ray = new THREE.Raycaster(), mid = new THREE.Vector2(0, 0), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  let aim = -1;
  const mode = {
    active: false,
    click() {
      if (over) { newGame(); return true; }
      if (thinking || game.turn !== 'w' || aim < 0) return true;
      const mv = targets.find(m => m.to === aim);
      if (mv) { select(-1); say('You', play(mv)); figMoves(); }
      else if (game.b[aim] && game.b[aim] <= 'Z' && aim !== selected) select(aim);
      else select(-1);
      return true;
    },
    hint() {
      if (over) return over === 'mate' ? `checkmate: ${game.turn === 'w' ? WHO + ' wins' : 'you win'} · click for a new game` : 'stalemate · click for a new game';
      if (thinking || game.turn !== 'w') return WHO + ' is thinking…';
      return (selected >= 0 ? 'look at a marked square and click to move' : `your move${inCheck(game) ? ' (you are in check)' : ''}: look at a white piece and click`) + ' · N new game · step away to stand';
    },
    leave() { select(-1); aimMark.visible = false; dots.visible = false; },
  };
  modes.push(mode);
  const seat = { x: spot.seat.x, y: spot.seat.y, z: spot.seat.z, yaw: Math.atan2(-(C.x - spot.seat.x), -(C.z - spot.seat.z)), label: 'chess' };
  const sit = () => { hold(mode, seat, -Math.atan2(seat.y - C.y, Math.hypot(seat.x - C.x, seat.z - C.z)) + 0.03); ctx.walker.yaw = seat.yaw; dots.visible = true; if (game.turn === 'b') figMoves(); };
  ctx.interact.push({ x: C.x, y: C.y + 0.2, z: C.z, reach: 6.5, label: () => 'sit down to the chess game (you are White)', act: sit });
  addEventListener('keydown', e => { if (e.code === 'KeyN' && mode.active) newGame(); });

  ctx.animated.push((t, dt) => {
    // pieces glide to their squares, with a little hop; taken ones sink away
    for (const p of pieces) {
      if (p.fade) { p.fade -= dt * 2.2; if (p.fade <= 0) { p.fade = 0; p.node.visible = false; } }
      const d = p.goal.distanceTo(p.off);
      if (d > 1e-4 || p.hop || p.lift !== (p.sq === selected && selected >= 0 ? 1 : 0) || p.fade) {
        p.off.lerp(p.goal, Math.min(1, dt * 9));
        if (d < 0.004 && p.hop) { p.hop = 0; if (p.promote) { const q = spawnQueen(p.promote === 'Q'); q.sq = p.sq; q.node.visible = true; q.goal.copy(sqPos(q.sq)).sub(q.home); q.off.copy(q.goal); p.sq = -1; p.node.visible = false; p.promote = null; } }
        p.lift = (p.lift ?? 0) + ((p.sq === selected && selected >= 0 ? 1 : 0) - (p.lift ?? 0)) * Math.min(1, dt * 12); if (Math.abs(p.lift) < 0.002) p.lift = 0; else if (p.lift > 0.998) p.lift = 1;
        const up = p.lift * 0.07 + (p.hop ? Math.min(0.09, d * 0.6) : 0) - (p.fade ? 0 : 0);
        const v = new THREE.Vector3(p.off.x, up, p.off.z).applyMatrix3(p.inv);
        p.node.position.copy(p.base).add(v);
        if (p.fade) p.node.scale.setScalar(Math.max(0.01, p.fade)); else if (p.node.scale.x !== 1 && !p.clone) p.node.scale.setScalar(1);
      }
    }
    if (!mode.active) return;
    ray.setFromCamera(mid, ctx.camera); plane.constant = -top;
    aim = ray.ray.intersectPlane(plane, hit) ? sqAt(hit) : -1;
    aimMark.visible = aim >= 0 && !thinking && !over;
    if (aim >= 0) { const p = sqPos(aim); aimMark.position.set(p.x, top + 0.005, p.z); }
  });

  if (TOY.startsWith('chess')) setTimeout(() => {
    sit(); const mv = TOY.split(':')[1];
    if (mv === 'select') select(sqAt(sqPos(11)) >= 0 ? 11 : -1);
    else if (mv) { const m = legal(game).find(m => squareName(m.from) + squareName(m.to) === mv); if (m) { say('You', play(m)); figMoves(); } }
  }, 300);
}
