// The staff of Anna's Basement: ten robots, in one place. Who each is, what it looks like, where it is posted and
// what it does there. Their words are in lines.js, their bodies in bodies.js, their gestures in acts.js, and how
// they behave in ../staff.js.
//
// NOBODY HERE IS PLACED YET. Nothing in the furnish files stands a robot anywhere; ../staff.js is only loaded when
// the address asks for it (?staff=1 puts them at the posts below, ?staff=lineup stands them in a row).
// The posts are Surveyed: they were taken from the STAFF POSTS header of each furnish file (plan X, Y, in feet) and
// checked once against the furniture as it stood on 22 November 2026. A post that turns out to be inside something,
// in a doorway or outside its room is moved to the nearest fair floor when the robot wakes, and said so in the
// console; put it right here when a room is re-fitted.
//
//   id, name, role       role is shown after the name on the card of things to say
//   rest                 the expression at rest; speed (feet a second); chirp (the notes of its voice)
//   look                 bodies.js (hover: the height the house's robots float at, about 3.3 ft, which Anna finds right; the
//                        smallest a little higher than they first were. Behind a counter they rise just enough to
//                        be seen over it: `counter`, below)
//   room, roam           its own room, and the rooms on its floor it may go into
//   home, faces          where it stands when it has nothing else to do, and what it looks at
//   homeActs             what its hands do there (acts.js)
//   counter              { at: [X, Y], r, top }: within r feet of there it is behind a counter of that height, and floats
//                        higher to be seen over it
//   seat                 { at: [X, Y], top, faces, when }: it SITS when at home (its body is drawn on the seat; it stands
//                        beside it). when: only while the visitor is in the seat of that label (the analyst sits when she
//                        lies on the couch, talks to her there, and rises when she gets up)
//   posts                [{ at: [X, Y], faces: [X, Y], acts: [...], secs, w (how often), when: 'empty' (only while the
//                        guest is not in that room) }]: the rounds
//   serve                { machine: [X, Y], pickup: [X, Y, h above the room's floor], from: id, menu: { name: { vessel, liquid,
//                        note, make: act, from: id, at: [X, Y] } } }: what it makes to order and where that is set down.
//                        from: it is made by that one, and collected at their counter; at: fetched from there
//   brings               it carries what was asked for to the guest on its tray, wherever she is in its rooms
//   runner               it answers bells
//   quiet                it says nothing aloud: only what it does, in asterisks
//
// Names already taken by the house, the town and the lab are listed in faculty/roster.js; none is used here.

const CREAM = '#efe4cf', BRASS = '#c9a45c', LINEN = '#f4f1ea';

// ---- what can be ordered, and from whom --------------------------------------------------------------------------
const COFFEE = {
  'brown sugar shaken espresso': { vessel: 'highball', liquid: 0x8a5a33, make: 'shake', note: 'Shaken, not negotiated with.' },
  'espresso': { vessel: 'demitasse', liquid: 0x3b2416, make: 'tamp' },
  'cortado': { vessel: 'demitasse', liquid: 0x6a4024, make: 'tamp' },
  'flat white': { vessel: 'latte', liquid: 0xc9a27a, make: 'pull' },
  'hot chocolate': { vessel: 'mug', liquid: 0x5a3020, make: 'stir' },
};
const BAR = {
  ...COFFEE,
  'espresso martini': { vessel: 'wine', liquid: 0x2a1a12, make: 'shake', note: 'Three beans on top. One for each of your better decisions.' },
  'glass of champagne': { vessel: 'wine', liquid: 0xf1d98a, id: 'sparkling', make: 'pour' },
  'negroni': { vessel: 'rocks', liquid: 0xa8321e, make: 'stir' },
  'sparkling water': { vessel: 'highball', liquid: 0xdfeff2, id: 'sparkling', make: 'pour' },
};
const CELLAR = {
  'glass of the red': { vessel: 'wine', liquid: 0x5a1424, make: 'pour', note: 'It was opened an hour ago for exactly this.' },
  'glass of the white': { vessel: 'wine', liquid: 0xe9d98a, make: 'pour' },
  'cheese board': { carried: 'cheese', food: true, bites: 4, make: 'probe', note: 'The Comté was thirty months in the making. You took four minutes. Both are correct.' },
};
const SAMOVAR = {
  'glass of tea': { vessel: 'tumbler', liquid: 0x6e2a0a, make: 'pourTea' },
  'tea': { vessel: 'teacup', liquid: 0xb8a04a, make: 'pourTea' },
  'Ivan-chai': { vessel: 'teacup', liquid: 0x9a5a2a, make: 'pourTea', note: 'Fireweed. It tastes of a field you once liked.' },
  'kvass': { vessel: 'highball', liquid: 0x5a3212, make: 'pour' },
};
const QUIET = { 'pot of tea': { vessel: 'teacup', liquid: 0xa8903a, make: 'pourTea' }, 'chamomile': { vessel: 'teacup', liquid: 0xd9c46a, make: 'pourTea' } };
export const MENUS = { COFFEE, BAR, CELLAR, SAMOVAR, QUIET };

export const CAST = [
  // ---- WINNICBOTT, the analyst. A soft tall pear in tweed and an open cardigan, round spectacles, a watch chain
  // it consults and never mentions. Sits behind the head of the couch, facing past the patient, never at them.
  { id: 'winnicbott', name: 'Winnicbott', role: 'the analyst', rest: 'neutral', speed: 1.4, chirp: [57, 60],
    look: { shape: 'pear', hover: 3.3, colour: '#8a7460', colour2: '#75614f', pattern: 'tweed', belly: '#ece3d0', cardigan: '#4f5d4a', cardiganRib: '#414d3d', bowtie: '#7a2f2a', chain: 'watch',
      specs: 'rgba(255,236,200,.7)', brows: 0.35, eyeW: 22, eyeH: 26, eyeR: 11, gap: 44, eye: '#ffe9c8', ring: 0xffd9a0, glove: '#ece3d0', tools: [['notebook'], ['pen']], tray: 'oak' },
    room: 'The Consulting Room', roam: [],
    home: [28.7, 48], faces: [34.5, 46.5], seat: { at: [27.8, 51.2], top: 1.45, faces: [34.5, 46.5], when: 'lie on the couch' }, homeActs: ['note', 'ponder', 'readNotes', 'note', 'rest'],
    // (it keeps to its place by the chair: the room is too small to walk about in with a patient in it, and stepping
    // aside for her only took it out of the door)
    stays: true, posts: [],
    serve: { machine: [28.7, 48], faces: [31.5, 49.4], pickup: [31.5, 49.4, 1.5], menu: { 'glass of water': { vessel: 'tumbler', liquid: 0xdfeff2, id: 'sparkling', make: 'water' } } } },

  // ---- COSIMA, the concierge. Tall, lacquered the dark green of a good hotel's door, brass buttons and epaulettes,
  // a pillbox cap cocked over one eye, the key to everything on a chain. She runs the place and has never once
  // pretended otherwise.
  { id: 'cosima', name: 'Cosima', role: 'the concierge', rest: 'sass', speed: 1.9, chirp: [72, 76, 79],
    look: { shape: 'tall', scale: 1.06, hover: 3.5, colour: '#14433f', belly: CREAM, buttons: BRASS, collar: BRASS, chain: 'key', hat: 'pillbox', hatColour: '#14433f', hatTrim: BRASS,
      lashes: true, brows: -0.4, eyeW: 34, eyeH: 24, eyeR: 9, gap: 46, eye: '#ffe2b0', ring: 0xffd27a, tools: [['ledger'], ['handbell', 'flute', 'robe']], tray: 'brass' },
    room: 'The Hall', roam: ['The Listening Room'], brings: true, counter: { at: [18.6, 38.0], r: 3.6, top: 3.55 },
    home: [18.6, 38.0], faces: [18.6, 30], homeActs: ['ledger', 'ledger', 'straighten', 'polish', 'rest'],
    posts: [
      { at: [18.6, 38.4], faces: [18.6, 40.2], acts: ['restock', 'straighten'], w: 1 },        // the key niche
      { at: [16.6, 21.4], faces: [16.6, 17.5], acts: ['robe', 'straighten'], w: 1 },            // the robes
      { at: [28.2, 21.5], faces: [31, 19], acts: ['tend', 'breathe'], w: 0.8 },                 // the fire
    ],
    // (coffee and champagne she pours at her own desk: a pot and a bottle on ice are kept there; the robe from the pegs)
    serve: { machine: [19.75, 37.75], pickup: [20.7, 34.8, 3.55], menu: { 'coffee': { vessel: 'latte', liquid: 0xc9a27a, make: 'pull' }, 'glass of champagne': { ...BAR['glass of champagne'], make: 'toast' },
      'robe': { carried: 'robe', wear: 'You put on the robe. It has been warming by the fire since before you thought of it.', make: 'robe', at: [16.6, 21.4] } } } },

  // ---- SAZ (Sazerac), behind the bar. A cushion in a black waistcoat over a cream shirt front, a waxed moustache,
  // copper headphones for the records, a cocktail cherry on a pick where another robot would have an antenna.
  { id: 'saz', name: 'Saz', role: 'the bar', rest: 'happy', speed: 2.0, chirp: [62, 65, 69],
    look: { shape: 'cushion', scale: 1.0, hover: 3.35, colour: '#2a2226', belly: CREAM, pattern: 'vest', bowtie: '#b3202e', belt: '#c0703a', headphones: '#c0703a', top: 'cherry', trim: '#c0703a',
      moustache: '#ffe2b0', brows: -0.2, eyeW: 30, eyeH: 34, gap: 48, eye: '#ffe2b0', ring: 0xff9a6a, tools: [['coupe'], ['cloth', 'shaker', 'bottle']], tray: 'brass' },
    room: 'The Listening Room', roam: [], counter: { at: [17.5, 64.3], r: 4.6, top: 3.45 },
    home: [17.5, 64.6], faces: [24, 64.6], homeActs: ['polish', 'wipe', 'polish', 'listen', 'straighten'],
    posts: [
      { at: [17.6, 66.35], faces: [19.6, 66.35], acts: ['tamp', 'pull', 'wipe'], w: 1.2 },      // the copper machine
      { at: [16.75, 65], faces: [13.5, 67.5], acts: ['restock', 'straighten'], w: 1 },          // the back counter, the grinder
      { at: [20.1, 44.4], faces: [20.1, 40.8], acts: ['listen', 'straighten'], w: 0.5, when: 'empty' },      // the turntable
    ],
    serve: { machine: [17.6, 66.35], pickup: [21.0, 64.6, 3.45], menu: BAR } },

  // ---- TOMME, the affineur and sommelier of the Cave. A wheel of cheese: a low, wide drum with a washed rind, a
  // black beret, a tastevin on a chain. Speaks low, because the cheese is asleep.
  { id: 'tomme', name: 'Tomme', role: 'the cave', rest: 'sleepy', speed: 1.4, chirp: [50, 53],
    look: { lathe: [[0, -0.38], [0.5, -0.38], [0.6, -0.32], [0.64, -0.18], [0.64, 0.2], [0.6, 0.33], [0.5, 0.4], [0, 0.4]], hover: 3.3, colour: '#d8c594', colour2: '#ece2c2', pattern: 'rind', shirt: false,
      faceY: 0.03, faceH: 0.19, faceW: 0.62, chain: 'tastevin', hat: 'beret', hatColour: '#1f1b1d', capColour: '#b9a36e', handY: -0.12,
      moustache: '#ffe9c0', eyeW: 26, eyeH: 26, eyeR: 13, gap: 50, eye: '#ffe9c0', ring: 0xfff1b8, glove: '#ece2c2', tools: [['wineglass'], ['iron', 'bottle']], tray: 'slate' },
    room: 'The Cave', roam: ['The Listening Room'], brings: true,
    home: [8.5, 60.5], faces: [5, 61.5], homeActs: ['probe', 'taste', 'straighten', 'rest'],
    posts: [
      { at: [3.6, 59.5], faces: [3.6, 62], acts: ['probe', 'straighten'], w: 1.2 },             // the Comté rack
      { at: [3.6, 52.6], faces: [3.6, 50], acts: ['restock', 'taste'], w: 1 },                   // the bottles
      { at: [4.6, 55.0], faces: [2, 55], acts: ['straighten', 'pour'], w: 0.7 },                 // the table laid for two
      { at: [35.0, 53.0], faces: [39.4, 53.0], acts: ['pour', 'present'], w: 0.5, room: 'The Listening Room' },      // the banquette, where the tasting is served
    ],
    serve: { machine: [3.6, 59.5], pickup: [4.6, 55.0, 2.6], menu: CELLAR } },

  // ---- PASHA, the banshchik. A birch log: white bark with its dark lenticels, the grey felt hat of the steam room,
  // a moustache, cheeks that are always a little red. Loud in the wash room, reverent in the steam.
  { id: 'pasha', name: 'Pasha', role: 'the banya', rest: 'happy', speed: 1.7, chirp: [53, 57, 60],
    look: { shape: 'barrel', scale: 1.03, hover: 3.4, colour: '#ebe6da', colour2: '#3a3430', pattern: 'bark', shirt: false, belt: '#a33b2e', hat: 'banya', hatColour: '#aaa294', hatTrim: '#a33b2e', capColour: '#8a6a44',
      moustache: '#ffe2b0', blush: 'rgba(255,110,90,.6)', brows: 0.5, eyeW: 36, eyeH: 40, gap: 46, eye: '#ffe2b0', ring: 0xff8a4a, glove: '#d9cbb2', tools: [['ladle'], ['venik', 'glass']], tray: 'oak' },
    room: 'The Banya', roam: ['The Tea Room', 'The Parnaya', 'The Treatment Room'], brings: true,
    home: [95.5, 48.0], faces: [95.5, 42], homeActs: ['shakeVenik', 'straighten', 'tea', 'rest'],
    posts: [
      { at: [90.0, 62.0], faces: [90, 70], acts: ['steam', 'whisk', 'shakeVenik'], w: 1.2, room: 'The Parnaya' },      // the stones
      { at: [99, 61.75], faces: [101, 66], acts: ['whisk', 'fold'], w: 0.7, room: 'The Treatment Room' },         // the table
      { at: [94.5, 31.75], faces: [96.3, 32], acts: ['pourTea', 'tea'], w: 1, room: 'The Tea Room' },            // the samovar
      { at: [94.5, 35.75], faces: [98, 40], acts: ['plump', 'straighten'], w: 0.6, room: 'The Tea Room' },           // the north daybed
    ],
    serve: { machine: [94.5, 31.75], pickup: [96.1, 32.8, 2.52], menu: SAMOVAR } },

  // ---- TERRY, of the water: the pool, the edge pool, towels, robes. A drop of sea-glass green
  // with a towel wound round its head and another round its neck. Cannot see a wet guest without producing a towel.
  { id: 'terry', name: 'Terry', role: 'the pool', rest: 'happy', speed: 1.9, chirp: [74, 77, 81],
    look: { shape: 'drop', hover: 3.4, colour: '#9cc5bd', belly: LINEN, scarf: LINEN, hat: 'turban', hatColour: LINEN, hatTrim: '#e2dccd', trim: '#d9cbb2',
      lashes: true, blush: true, eyeW: 38, eyeH: 44, gap: 44, eye: '#e8fbff', ring: 0x8fe3ff, tools: [[], ['towels', 'net', 'carafe', 'towel']], tray: 'oak' },
    room: 'The Pool', roam: [], brings: true,
    home: [73.6, 69.2], faces: [76.7, 69.2], homeActs: ['fold', 'stack', 'roll', 'fold'],
    posts: [
      { at: [46.5, 69.0], faces: [44, 69.3], acts: ['water', 'straighten'], w: 0.9 },          // the robes' bench and the carafe
      { at: [48.0, 62.5], faces: [60, 62.5], acts: ['skim'], secs: 18, w: 1.3, when: 'dry' },   // the pool's west edge: the net
      { at: [60.0, 55.3], faces: [60, 62.5], acts: ['skim'], secs: 18, w: 1.0, when: 'dry' },   // its south edge
      { at: [72.0, 62.5], faces: [60, 62.5], acts: ['skim', 'breathe'], secs: 16, w: 0.8, when: 'dry' },      // its east edge
    ],
    // (the edge pool and the tub in the courtyard are hers too: outdoor posts connected by the glazed doors)
    outdoor: [{ at: [60, 14.8], faces: [60, 10], acts: ['skim'] }, { at: [51.5, 19.4], faces: [46.8, 22.2], acts: ['fold', 'straighten'] }],
    serve: { machine: [73.6, 69.2], pickup: [74.9, 69.2, 3.0], menu: { 'towel': { carried: 'towel', wear: 'A warm towel, round your shoulders. It smells of sun, which is strange, down here.', make: 'roll' }, 'glass of water': { vessel: 'tumbler', liquid: 0xdfeff2, id: 'sparkling', make: 'water' } } } },

  // ---- BIJOU, of the nail corner. Small, hot pink with glitter in the lacquer, a beehive with a nail file through
  // it, gold hoops, lashes. Calls every guest "honey", always. Knows everything about everyone and will tell you.
  { id: 'bijou', name: 'Bijou', role: 'nails', rest: 'happy', speed: 1.8, chirp: [81, 84, 88],
    look: { shape: 'pip', scale: 0.95, hover: 3.3, colour: '#d6457f', colour2: '#ffd1e6', pattern: 'glitter', belly: '#ffe9f1', apron: '#f4e0ea', apronTrim: '#e9a8c6', hat: 'beehive', hatColour: '#f0dcb4', hatTrim: '#e03a7c', ears: 'hoops',
      lashes: true, blush: 'rgba(255,120,170,.6)', eyeW: 30, eyeH: 40, gap: 42, eye: '#ffd0e6', ring: 0xff9ad0, tools: [['polish'], ['file', 'brush']], tray: 'brass', trayScale: 0.8 },
    room: 'The Tea Room', roam: [],
    home: [97.95, 18.75], faces: [96.5, 22.65], homeActs: ['file', 'admire', 'paint', 'file'],
    posts: [
      { at: [99.7, 21.2], faces: [99.7, 22.6], acts: ['paint', 'straighten', 'admire'], w: 1 },     // the manicure table
      { at: [103.0, 19.9], faces: [103.0, 17.5], acts: ['restock', 'admire'], w: 0.8 },              // the polish shelf
    ] },

  // ---- HUSH, of the quiet rooms: the Quiet Room, the Suite, the candles. A small grey ball in a knitted tea cosy.
  // Says nothing. Brings tea before it is wanted, feeds the fire, turns the bed down, lights what should be lit.
  { id: 'hush', name: 'Hush', role: 'the quiet rooms', rest: 'sleepy', speed: 1.3, quiet: true, chirp: [48],
    look: { shape: 'round', scale: 0.86, hover: 3.2, colour: '#b9b2a4', colour2: '#a8a092', pattern: 'knit', belly: '#d9d2c2', hat: 'cosy', hatColour: '#8a9a8c', hatTrim: '#d9d2c2', trim: '#8a8478', capColour: '#8a8478',
      eyeW: 26, eyeH: 22, eyeR: 11, gap: 44, eye: '#f2e6cf', ring: 0xf2d9b0, glove: '#d9d2c2', tools: [['cup'], ['teapot', 'taper', 'duster']], tray: 'oak', trayScale: 0.9 },
    room: 'The Quiet Room', roam: ['The Gallery', 'The Suite'], brings: true, offers: 'pot of tea',
    home: [63.7, 69.6], faces: [63.7, 72.5], homeActs: ['pourTea', 'rest', 'straighten', 'breathe'],
    posts: [
      { at: [72.8, 59.4], faces: [75, 61], acts: ['tend', 'breathe'], w: 1 },                   // the fire
      { at: [47.9, 58.9], faces: [47.9, 56.8], acts: ['plump', 'light'], w: 0.8 },               // the daybeds' tables
      { at: [53.0, 59.4], faces: [53.0, 57.3], acts: ['plump', 'dust'], w: 0.8 },
      { at: [72.0, 59.1], faces: [72.0, 57.0], acts: ['light', 'straighten'], w: 0.6 },
      { at: [34.75, 30.75], faces: [30, 33.5], acts: ['turnDown', 'plump'], w: 0.7, room: 'The Suite', when: 'empty' },      // the bed's foot
      { at: [18.25, 37.25], faces: [16.5, 37.8], acts: ['tend'], w: 0.4, room: 'The Suite', when: 'empty' },                  // the stove
    ],
    serve: { machine: [63.7, 70.3], pickup: [63.7, 71.7, 2.7], menu: QUIET } },

  // ---- LUNA, who keeps the Chapel: a cousin of Moth (the chapel in the house's garden) and of Wren (Vesper Street's).
  // A luna moth: pale green, feathery antennae, wings folded down its back with an eye-spot and a tail on each, a
  // bookbinder's apron, a lamplighter's pole. Small, quiet, a little dry. Keeps the candles and the bowl of still
  // water under the shaft, looks up at the light, and offers a question rather than an answer.
  { id: 'luna', name: 'Luna', role: 'the chapel', rest: 'neutral', speed: 1.1, chirp: [64, 71],
    look: { shape: 'pip', scale: 0.92, hover: 3.0, colour: '#b9cfa6', belly: '#e6ebd2', apron: '#5a4030', apronTrim: '#4b3427', top: 'antennae', frond: '#e9dfb0', wings: ['#c9dcae', '#7d5a6a', '#e9d68a'], capColour: '#b8954f',
      eyeW: 28, eyeH: 30, gap: 38, eye: '#ffd28e', faceBg: '#120c08', ring: 0xd9f0a8, glove: '#ece0c8', tools: [[], ['pole']], tray: 'oak', trayScale: 0.8 },
    room: 'The Chapel', roam: [],
    home: [65.0, 91.0], faces: [60, 87.5], homeActs: ['gaze', 'breathe', 'gaze', 'rest'],
    posts: [
      { at: [57.0, 84.5], faces: [60, 87.5], acts: ['lightPole', 'bowl'], w: 1.3 },            // the table under the shaft: the candles, the water
      { at: [63.0, 84.5], faces: [60, 87.5], acts: ['lightPole', 'gaze'], w: 1 },
      { at: [60.0, 97.0], faces: [60, 101], acts: ['gaze', 'lightPole'], w: 0.8 },               // the glass in the far wall
      { at: [50.0, 80.0], faces: [46, 80], acts: ['gaze', 'straighten'], w: 0.6 },               // a niche in the west wall
    ] },

  // ---- DING, the bellhop. A brass bell with a turned wooden handle and a red collar, the glow under it where the
  // clapper would be. Ring any bell in the place and it is Ding who comes, at speed, delighted. Between calls:
  // dusting, plumping, squaring things that were already square.
  { id: 'ding', name: 'Ding', role: 'the bell', rest: 'happy', speed: 2.0, chirp: [88, 93],
    look: { lathe: [[0, -0.5], [0.6, -0.5], [0.66, -0.45], [0.63, -0.38], [0.52, -0.2], [0.44, 0.08], [0.38, 0.3], [0.28, 0.46], [0.14, 0.55], [0, 0.57]], scale: 0.82, hover: 3.3, colour: '#c9a45c', colour2: '#a8843f', pattern: 'band', bandAt: -0.78, shirt: false,
      faceY: 0.03, faceH: 0.2, faceW: 0.86, collar: '#a3312b', top: 'knob', topColour: '#5a3a26', capColour: '#8a6a2e', handY: -0.2, trim: '#f1d98a',
      blush: 'rgba(255,150,120,.5)', eyeW: 34, eyeH: 34, eyeR: 17, gap: 46, eye: '#fff1c8', ring: 0xffe9a0, glove: LINEN, tools: [[], ['duster', 'cushion', 'silver']], tray: 'brass' },
    room: 'The Hall', roam: ['The Listening Room', 'The Pool', 'The Banya', 'The Tea Room', 'The Cave'], brings: true, runner: true,
    home: [24.5, 38.0], faces: [24.5, 30], homeActs: ['rest', 'salute', 'breathe'],
    posts: [
      { at: [29.75, 25.25], faces: [31, 21], acts: ['plump', 'dust'], w: 1 },                     // the Hall's chairs by the fire
      { at: [22.0, 46.0], faces: [20, 43], acts: ['plump', 'straighten'], w: 1, room: 'The Listening Room' },      // the lounge
      { at: [33.0, 55.0], faces: [39, 55], acts: ['wipe', 'straighten'], w: 0.8, room: 'The Listening Room' },     // the banquette's tables
      { at: [47.75, 57.75], faces: [45, 56], acts: ['plump', 'straighten'], w: 0.6, room: 'The Pool', when: 'empty' },      // the loungers
      { at: [92.0, 30.0], faces: [92, 36], acts: ['plump', 'dust'], w: 0.6, room: 'The Tea Room', when: 'empty' },        // the daybeds
    ],
    serve: { from: 'saz' } },      // (everything it brings is Saz's: collected at the bar)
];

export const byId = id => CAST.find(c => c.id === id) ?? null;
// Who makes a thing: the first of the cast with it on its own menu
export const makerOf = name => CAST.find(c => c.serve?.menu?.[name] && !c.serve.from) ?? null;
