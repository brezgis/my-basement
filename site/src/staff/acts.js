// What the staff do with their hands. After Vesper Street's clerks/acts.js (the same poses, where a job is the
// same: wiping, polishing, restocking, reading), with the work of a bath-house added: folding towels, skimming
// the pool, plumping cushions, turning a bed down, whisking with a venik, throwing water on the stones, pouring
// tea, filing a nail, tasting a wine, writing a note nobody else will read. Calm, as ever: slow hands, small
// movements, a pause between strokes.
//
//   pose(name, t, D) -> { L, R, lean, rise, side, twist, ly, pour, tipR, tipL, rollR, calm }
//     t   seconds into the job; D: the body's measures { x, y, f, lo, mid, hi } (bodies.js)
//     L, R   where the other hand and the working hand go (the bob's frame); lean: tip forward (radians); rise:
//     up or down (feet); side: tip sideways; twist: turn the upper body; ly: where the eyes look, -1 up to 1 down;
//     pour / tipR / tipL: tip a hand forward; rollR: roll the working hand
//   HOLDS[name] = [what hands[0] holds, what hands[1] holds] while it does that (null: an empty glove)
//   SECS[name]  how long the job lasts, about

const TAU = Math.PI * 2;
const ease = x => x * x * (3 - 2 * x);
const wave = (t, p) => 0.5 - 0.5 * Math.cos(t * TAU / p);
const pulse = (t, p, on) => { const k = (t % p) / p; return k < on ? Math.sin(Math.PI * k / on) : 0; };

export const HOLDS = {
  wipe: [null, 'cloth'], polish: ['coupe', 'cloth'], shake: [null, 'shaker'], pour: ['wineglass', 'bottle'], taste: [null, 'wineglass'], probe: [null, 'iron'],
  note: ['notebook', 'pen'], ponder: ['notebook', null], readNotes: ['notebook', null],
  ledger: ['ledger', null], ring: [null, 'handbell'], toast: [null, 'flute'], robe: [null, 'robe'],
  whisk: [null, 'venik'], shakeVenik: [null, 'venik'], steam: ['ladle', null], tea: [null, 'glass'],
  fold: [null, null], stack: [null, 'towels'], skim: [null, 'net'], water: [null, 'carafe'], roll: [null, 'towel'],
  file: [null, 'file'], paint: ['polish', 'brush'], admire: [null, null],
  pourTea: ['cup', 'teapot'], light: [null, 'taper'], dust: [null, 'duster'], plump: [null, null], turnDown: [null, null],
  cloche: [null, 'silver'],
};
export const SECS = { wipe: 10, polish: 11, tamp: 5, pull: 8, restock: 12, straighten: 11, read: 30, listen: 22, stir: 12, shake: 6, pour: 7, taste: 12, probe: 10, note: 14, ponder: 12, readNotes: 16,
  ledger: 12, ring: 3, toast: 8, robe: 9, bow: 3, present: 5, whisk: 9, shakeVenik: 6, steam: 7, tea: 9, fold: 13, stack: 8, skim: 16, water: 8, roll: 8, file: 10, paint: 12, admire: 6, gossip: 8,
  pourTea: 8, light: 8, dust: 11, plump: 8, turnDown: 10, cloche: 6, rest: 22, breathe: 12, idle: 5, salute: 2.5, tend: 10 };

export function pose(name, t, D) {
  const { x, y, f, lo, mid, hi } = D, o = { L: [-x, y, 0.1], R: [x, y, 0.1], lean: 0, rise: 0, ly: 0, pour: 0 };
  const at = (side, px, py, pz) => { o[side] = [px, py, pz]; };
  switch (name) {
    // ---- the town's, as they were ------------------------------------------------------------------------------
    case 'wipe': { const k = t * 1.6; at('R', x * 0.4 + 0.16 * Math.cos(k), lo, f + 0.12 + 0.1 * Math.sin(k)); at('L', -x * 0.55, lo + 0.04, f); o.lean = 0.16; o.ly = 0.7; break; }
    case 'polish': { const k = t * 2.2; at('L', -0.1, mid + 0.06, f + 0.06); at('R', 0.08 + 0.05 * Math.cos(k), mid + 0.08 + 0.04 * Math.sin(k), f + 0.1); o.ly = 0.35; break; }
    case 'tamp': { const p = pulse(t, 1.6, 0.5); at('L', -0.12, mid - 0.02, f + 0.04); at('R', 0.04, mid + 0.1 - 0.12 * p, f + 0.06); o.lean = 0.12 + 0.05 * p; o.ly = 0.8; break; }
    case 'pull': { const k = Math.min(1, t / 1.2); at('R', x * 0.5, mid + 0.35 * (1 - ease(k)) + 0.15, f + 0.1); at('L', -x * 0.5, lo + 0.1, f + 0.1); o.ly = 0.5 + 0.3 * k; o.lean = 0.06; break; }
    case 'restock': { const up = ease(wave(t, 3.4)), hy = lo + (hi - lo) * up; at('R', x * 0.4, hy, f + 0.18 + 0.1 * up); at('L', -x * 0.5, lo + (hi - lo) * ease(wave(t + 0.5, 3.4)) * 0.85, f + 0.1); o.ly = 0.6 - 1.4 * up; o.lean = 0.04 - 0.08 * up; o.rise = 0.12 * up; break; }
    case 'straighten': { const s = Math.sin(t * 0.9), p = pulse(t, 1.4, 0.4); at('R', x * 0.3 + 0.2 * s, lo + 0.06 - 0.06 * p, f + 0.16); at('L', -x * 0.3 + 0.2 * s, lo + 0.06 - 0.05 * pulse(t + 0.7, 1.4, 0.4), f + 0.16); o.lean = 0.14; o.ly = 0.8; break; }
    case 'read': { const turn = pulse(t, 7, 0.12); at('L', -0.2, mid - 0.05, f + 0.18); at('R', 0.2 - 0.32 * turn, mid - 0.05 + 0.08 * turn, f + 0.18); o.lean = 0.1; o.ly = 0.7; break; }
    case 'listen': { at('L', -x, y + 0.04 * Math.sin(t * 4), 0.1); at('R', x, y + 0.04 * Math.sin(t * 4 + 1), 0.1); o.lean = 0.05 * Math.sin(t * 4.2); o.ly = -0.2; break; }
    case 'stir': { const k = t * 1.3; at('R', x * 0.3 + 0.12 * Math.cos(k), lo + 0.05, f + 0.22 + 0.1 * Math.sin(k)); at('L', -x * 0.6, lo + 0.1, f + 0.05); o.pour = 0.3; o.lean = 0.14; o.ly = 0.8; break; }
    case 'shake': { const s = Math.sin(t * 9) * 0.06; at('R', x * 0.6, mid + 0.35 + s, 0.1); at('L', x * 0.3, mid + 0.25 + s, 0.16); o.ly = -0.1; o.tipR = 0.5; o.side = 0.03 * Math.sin(t * 9); break; }
    case 'tend': { const k = wave(t, 5); at('R', x * 0.3, mid + 0.1 + 0.15 * k, f + 0.25); at('L', -x * 0.3, mid - 0.05, f + 0.12); o.ly = 0.4 - 0.3 * k; o.lean = 0.08; break; }
    case 'breathe': { const k = wave(t, 5); at('R', 0.1, mid - 0.1 + 0.1 * k, f + 0.08); at('L', -0.1, mid - 0.1 + 0.1 * k, f + 0.08); o.rise = 0.06 * k; o.ly = 0.3; o.calm = true; break; }
    case 'rest': { at('R', 0.18, lo, f + 0.05); at('L', -0.18, lo, f + 0.05); o.ly = 0.1; o.calm = true; break; }
    // ---- hosts ---------------------------------------------------------------------------------------------------
    case 'bow': { const k = ease(wave(t, 3)); at('R', 0.12, mid - 0.1, f + 0.06); at('L', -x * 0.9, y - 0.05, -0.12); o.lean = 0.34 * k; o.ly = 0.5 * k; o.calm = true; break; }      // a hand to the chest, the other behind
    case 'present': { const k = ease(Math.min(1, t / 0.8)); at('R', x + 0.3 * k, mid + 0.2 * k, 0.1 + 0.25 * k); at('L', -0.14, mid - 0.12, f + 0.04); o.rollR = -0.5 * k; o.side = -0.05 * k; o.ly = -0.1; break; }      // this way, darling
    case 'salute': { const k = ease(Math.min(1, t / 0.4)); at('R', x * 0.55, hi - 0.1, f * 0.7 * k + 0.1); at('L', -x, y, 0.1); o.rise = 0.06 * k; o.ly = -0.2; break; }
    case 'ledger': { const w = pulse(t, 2.6, 0.5); at('L', -0.16, mid - 0.06, f + 0.16); at('R', 0.1 + 0.08 * w, mid + 0.02 - 0.03 * w, f + 0.2); o.lean = 0.08; o.ly = 0.75; break; }      // a finger down the page
    case 'ring': { const s = Math.sin(t * 16) * (t < 1.4 ? 1 : 0); at('R', x * 0.7, mid + 0.42, f + 0.1); at('L', -x, y, 0.1); o.rollR = 0.5 * s; o.ly = -0.2; break; }
    case 'toast': { const k = ease(wave(t, 4)); at('R', x * 0.6, mid + 0.3 + 0.2 * k, f + 0.15 + 0.1 * k); at('L', -x * 0.9, y - 0.05, -0.1); o.ly = -0.3 * k; o.rise = 0.04 * k; break; }      // a flute held up to the light
    case 'robe': { const k = ease(Math.min(1, t / 1.2)); at('R', 0.2, lo + 0.25 * k, f + 0.2 + 0.2 * k); at('L', -0.34, lo + 0.22 * k, f + 0.34 * k); o.lean = 0.1 * k; o.ly = 0.2; break; }      // a folded robe, offered in both hands
    case 'cloche': { const k = ease(wave(t, 3)); at('R', x * 0.3, lo + 0.1 + 0.35 * k, f + 0.2); at('L', -x * 0.4, lo + 0.05, f + 0.2); o.ly = 0.6 - 0.5 * k; o.lean = 0.08; break; }      // the lid lifted with a flourish
    // ---- the bar and the cave ------------------------------------------------------------------------------------
    case 'pour': { const k = ease(Math.min(1, t / 1.4)) * (0.8 + 0.1 * Math.sin(t * 1.1)); at('R', x * 0.7, mid + 0.12, f + 0.24); at('L', -x * 0.12, lo + 0.12, f + 0.24); o.rollR = 1.2 * k; o.ly = 0.7; o.lean = 0.06; break; }      // the bottle tipped (toward the middle) over a glass in the other hand
    case 'taste': {      // a swirl, a long look at the colour, a sniff, a sip, a thought
      const c = t % 12, sw = c < 4 ? 1 : 0, up = c >= 4 && c < 6.5 ? ease(Math.min(1, (c - 4) / 0.8)) : 0, sip = c >= 6.5 && c < 9 ? ease(Math.min(1, (c - 6.5) / 0.6)) : 0;
      at('R', x * 0.4 + 0.04 * Math.cos(t * 7) * sw - 0.25 * sip, mid + 0.1 + 0.42 * up + 0.3 * sip, f + 0.14 + 0.04 * Math.sin(t * 7) * sw - 0.1 * sip); at('L', -x * 0.9, y - 0.06, -0.1);
      o.tipR = -0.5 * sip; o.ly = sw ? 0.5 : up ? -0.6 : 0; o.lean = -0.06 * sip; o.calm = true; break;
    }
    case 'probe': { const k = ease(wave(t, 5)); at('R', x * 0.25, mid, f + 0.12 + 0.3 * k); at('L', -x * 0.3, mid - 0.1, f + 0.2); o.rollR = 0.9 * wave(t, 2.5) * k; o.lean = 0.2 * k; o.ly = 0.5; break; }      // the iron pushed into a wheel, turned, drawn
    // ---- the consulting room -------------------------------------------------------------------------------------
    case 'note': { const w = t % 9 < 5.5 ? 1 : 0; at('L', -0.12, mid - 0.14, f + 0.12); at('R', 0.1 + 0.05 * Math.sin(t * 6) * w, mid - 0.06 + 0.012 * Math.sin(t * 13) * w, f + 0.16); o.lean = 0.08; o.ly = w ? 0.85 : 0; o.calm = true; break; }      // a few words, a look up, a few more
    case 'ponder': { const k = ease(Math.min(1, t / 1.2)); at('R', 0.12, mid + 0.18 * k + 0.2, f + 0.06); at('L', -0.14, mid - 0.2, f + 0.08); o.side = 0.05 * k; o.ly = -0.5 * k; o.calm = true; break; }      // a hand to the chin, eyes to the ceiling
    case 'readNotes': { const turn = pulse(t, 8, 0.1); at('L', -0.1, mid - 0.04, f + 0.16); at('R', 0.16 - 0.2 * turn, mid - 0.1 + 0.06 * turn, f + 0.12); o.lean = 0.1; o.ly = 0.75; o.calm = true; break; }
    // ---- the banya -----------------------------------------------------------------------------------------------
    case 'whisk': {      // the venik: three light strokes down, a press, a shake of steam off it
      const c = t % 4.2, p = c < 3 ? pulse(c, 1, 0.6) : 0, press = c >= 3 ? ease(Math.min(1, (c - 3) / 0.5)) : 0;
      at('R', x * 0.3, mid + 0.55 - 0.6 * p - 0.5 * press, f + 0.3 + 0.1 * p); at('L', -x * 0.8, y + 0.1, 0.2); o.tipR = 1.2 + 0.4 * p; o.lean = 0.12 + 0.06 * p + 0.08 * press; o.ly = 0.6; break;
    }
    case 'shakeVenik': { const s = Math.sin(t * 11); at('R', x * 0.7, hi - 0.1 + 0.05 * s, f + 0.1); at('L', -x, y, 0.1); o.rollR = 0.35 * s; o.ly = -0.5; o.rise = 0.08; break; }      // held high, shaken out in the hot air
    case 'steam': {      // a ladle of water: dipped, swung, thrown on the stones; a step back from what comes off them
      const c = t % 5, dip = c < 1.4 ? ease(Math.min(1, c / 0.7)) : 0, th = c >= 1.4 && c < 2.2 ? Math.sin(Math.PI * (c - 1.4) / 0.8) : 0, back = c >= 2.2 ? ease(Math.min(1, (c - 2.2) / 0.6)) * (1 - ease(Math.max(0, (c - 4) / 1))) : 0;
      at('L', -x * 0.4, lo + 0.2 - 0.3 * dip + 0.45 * th, f + 0.1 + 0.25 * th); at('R', x, y + 0.25 * back, 0.1 + 0.2 * back); o.tipL = 0.3 * dip - 0.9 * th; o.lean = 0.14 * dip - 0.14 * back; o.rise = 0.05 * back; o.ly = 0.6 - 1.1 * back; break;
    }
    case 'tea': { const sip = pulse(t, 6, 0.3); at('R', x * 0.5 - 0.28 * sip, mid + 0.02 + 0.36 * sip, f + 0.1 - 0.08 * sip); at('L', -x * 0.9, y, 0.1); o.tipR = -0.45 * sip; o.ly = 0.2; o.calm = true; break; }      // a glass of tea of his own
    // ---- the pool ------------------------------------------------------------------------------------------------
    case 'fold': {      // a towel: shaken out wide, brought together, halved, patted flat
      const c = t % 5.2, open = c < 1.2 ? ease(c / 1.2) : c < 2.4 ? 1 - ease((c - 1.2) / 1.2) : 0, pat = c > 3.4 ? pulse(c - 3.4, 0.9, 0.5) : 0, dn = c > 2.4 ? ease(Math.min(1, (c - 2.4) / 0.8)) : 0;
      at('R', 0.14 + 0.5 * open, mid + 0.2 * open - (mid - lo) * dn - 0.05 * pat, f + 0.2); at('L', -0.14 - 0.5 * open, mid + 0.2 * open - (mid - lo) * dn - 0.05 * pulse(c - 3.0, 0.9, 0.5) * (c > 3.4 ? 1 : 0), f + 0.2); o.lean = 0.1 + 0.08 * dn; o.ly = 0.3 + 0.5 * dn; break;
    }
    case 'stack': { const k = wave(t, 4); at('R', 0.22, lo + 0.05 + 0.22 * k, f + 0.12); at('L', -0.34, lo + 0.05 + 0.22 * k, f + 0.3); o.lean = 0.12 * (1 - k); o.ly = 0.6; break; }      // the pile squared, lifted, set down
    case 'skim': {      // the net drawn slowly across the water, lifted, tapped out, again
      const c = t % 8, sweep = c < 5.4 ? Math.sin((c / 5.4) * Math.PI - Math.PI / 2) : -1 + 2 * ease(Math.min(1, (c - 6.6) / 1.4 + 0.0)) * 0, lift = c >= 5.4 && c < 6.6 ? Math.sin(Math.PI * (c - 5.4) / 1.2) : 0;
      at('R', x * 0.35, mid + 0.25 + 0.3 * lift, f + 0.05); at('L', -x * 0.2, mid + 0.6 + 0.2 * lift, f - 0.1); o.twist = 0.42 * sweep; o.tipR = -0.3 * lift; o.lean = 0.2 - 0.12 * lift; o.ly = 0.8 - 0.4 * lift; break;
    }
    case 'water': { const k = ease(Math.min(1, t / 1.5)) * (0.75 + 0.08 * Math.sin(t * 1.3)); at('R', x * 0.6, lo + 0.34, f + 0.24); at('L', -x * 0.15, lo + 0.05, f + 0.22); o.rollR = 1.0 * k; o.lean = 0.1; o.ly = 0.8; break; }      // the carafe tipped over a glass
    case 'roll': { const k = t * 2.6; at('R', 0.2 + 0.03 * Math.cos(k), lo + 0.08 + 0.05 * Math.sin(k), f + 0.2 + 0.1 * wave(t, 4)); at('L', -0.2, lo + 0.08 - 0.05 * Math.sin(k), f + 0.2 + 0.1 * wave(t, 4)); o.lean = 0.16; o.ly = 0.8; break; }      // a towel rolled tight
    // ---- the nail corner -----------------------------------------------------------------------------------------
    case 'file': { const s = Math.sin(t * 9) * (t % 3.2 < 2.3 ? 1 : 0); at('L', -0.1, lo + 0.14, f + 0.2); at('R', 0.1 + 0.07 * s, lo + 0.18, f + 0.18); o.lean = 0.2; o.ly = 0.9; break; }      // quick strokes, a blow on it, more
    case 'paint': { const p = pulse(t, 1.5, 0.55); at('L', -0.16, lo + 0.12, f + 0.14); at('R', 0.06, lo + 0.2 - 0.02 * p, f + 0.16 + 0.07 * p); o.lean = 0.24; o.ly = 0.95; o.calm = true; break; }      // one slow stroke to a nail
    case 'admire': { const k = ease(wave(t, 3)); at('R', x * 0.5, mid + 0.25, f + 0.22 + 0.1 * k); at('L', -x * 0.5, mid + 0.25, f + 0.22 + 0.1 * k); o.rollR = 0.4 * Math.sin(t * 2); o.side = 0.08 * Math.sin(t * 1.2); o.ly = 0.2; break; }      // her own, at arm's length
    case 'gossip': { const k = ease(Math.min(1, t / 0.6)); at('R', 0.16, mid + 0.42, f + 0.02); at('L', -x * 0.7, mid, f + 0.3 * k); o.lean = 0.2 * k; o.side = -0.1 * k; o.ly = -0.1; break; }      // a hand to the side of the mouth, leaning in
    // ---- the quiet rooms, and the runner --------------------------------------------------------------------------
    case 'pourTea': { const k = ease(Math.min(1, t / 1.6)) * (t < 5.5 ? 1 : Math.max(0, 1 - (t - 5.5) / 0.8)); at('R', 0.2, lo + 0.34, f + 0.12); at('L', -0.16, lo + 0.08, f + 0.3); o.pour = 0.75 * k; o.lean = 0.1; o.ly = 0.85; o.calm = true; break; }
    case 'light': { const k = ease(wave(t, 4.5)); at('R', x * 0.3, mid + 0.1 + 0.35 * k, f + 0.2 + 0.12 * k); at('L', -x * 0.5, mid + 0.25 * k, f + 0.28 * k); o.ly = 0.2 - 0.5 * k; o.rise = 0.08 * k; o.calm = true; break; }      // the taper up to a wick, the other hand cupped round it
    case 'dust': { at('R', x * 0.3 + 0.28 * Math.sin(t * 1.5), mid + 0.2 + 0.1 * Math.sin(t * 3), f + 0.22); at('L', -x * 0.7, y, 0.1); o.tipR = 0.5; o.ly = 0.1; o.lean = 0.04; break; }
    case 'plump': {      // a cushion: taken by its sides, two good pats, a karate chop in the top, set back
      const c = t % 4, p = c < 2.2 ? pulse(c, 0.55, 0.5) : 0, chop = c >= 2.6 && c < 3.2 ? Math.sin(Math.PI * (c - 2.6) / 0.6) : 0;
      at('R', 0.34 - 0.12 * p, lo + 0.12 + 0.3 * chop, f + 0.22); at('L', -0.34 + 0.12 * p, lo + 0.12, f + 0.22); if (chop) o.R[0] = 0.02; o.lean = 0.22; o.ly = 0.85; break;
    }
    case 'turnDown': { const k = ease(wave(t, 5)); at('R', 0.3 - 0.5 * k, lo + 0.05 + 0.1 * Math.sin(k * Math.PI), f + 0.25 + 0.2 * k); at('L', -0.3 - 0.1 * k, lo + 0.05, f + 0.25); o.lean = 0.26; o.twist = -0.15 * k; o.ly = 0.9; break; }      // the corner of the duvet folded back, smoothed
    default: break;
  }
  return o;
}
