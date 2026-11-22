// The staff of the laboratory: twenty-four robots, in one place. A furnish file stands one somewhere with
//
//   f.faculty({ id: 'alder', home: [X, Y, h], faces: [X, Y], posts: [[X, Y], ...], lines: { greet, idle, bye, topics } })
//
// (src/furnish/README.md) and everything that makes it recognisable from across a room comes from here: its
// name, its look, and its field of study. Each robot may be placed once. Nobody here is a student, and nobody
// is a cat.
//
//   field   what they profess: a free string, shown after the name on the card of things to say ("Alder, Botany").
//           Left empty here for whoever furnishes their room to fill in (or give `field` in f.faculty, which wins).
//   look    a FORM (faculty/body.js: the recipe the body is built by, round an object or an idea) and its numbers,
//           then what is laid on it. Every form takes its own proportions (g girth, h height, w, d, lift ...: see
//           the form) and all take size (the whole body scaled), tall, wide (stretched). The rest, as ever:
//           colour, colour2, belly, trim; pattern: 'stripes' | 'speckle' | 'split' | 'band';
//           top (what grows out of the head): 'sprout' | 'flame' | 'coil' | 'quill' | 'dish' | 'pleats' | 'prop' | 'halo' | 'bulb' | 'posy';
//           hat: 'beanie' | 'beret' | 'cap' | 'straw' | 'bun' | 'mortar' | 'toque' | 'peaked', hatColour; antenna; headphones: colour;
//           ears: 'cups' | 'bolts' | 'fins'; buttons, bowtie, scarf, apron: colours;
//           the face: eye (colour), eyeW, eyeH, eyeR (corner radius), gap, lashes, brows (tilt), moustache, freckles,
//           specs, monocle, blush; ring: the colour of the glow underneath;
//           tool (in the right hand), tool2 (in the left): 'book' | 'chalk' | 'pointer' | 'flask' | 'magnifier' | 'cup' | 'can' |
//           'duster' | 'candle' | 'wrench' | 'clipboard' | 'blowpipe' | 'case' | 'pipette' | 'notebook' | 'top' |
//           'trowel' | 'secateurs' | 'rake' | 'trug' | 'logbook' | 'spyglass' | 'thermos'
//   rest    the expression at rest: 'neutral' | 'happy' | 'sass' | 'sleepy' | 'focus'
//   roam    false to stay at home; a number keeps its wandering within that many feet of home
//
// No two share a form, a headpiece, or a colour. ?lineup stands them all in a row at the Landing; ?lineup&seeds
// stands sixteen made from numbers there instead (body.js lookFromSeed).
// Names already taken by the house and the town, and so not used here: Bartholomew (Barty), Mortimer (Mort), Fig,
// Bramble, Thistle, Dandelion, Geneva, Nano, Feynbot, Juniper, Otis, Olive, Folio, Moss, Ember, Bao, Gus, Crumb,
// Hesper, Wren, Sol, Quill, Pascal, Kombu, Frond (and the koi: Admiral, Dot, Marmalade). (Out of doors, besides the three
// below, the night watch is Nightjar, one of the ordinary make: outdoors_cast.js.)

const CREAM = '#efe4cf', BRASS = '#c9a45c';

export const ROSTER = [
  // a card catalogue: tall and narrow, drawers of cards, on a pair of wheels
  { id: 'alder', name: 'Alder', field: '', rest: 'neutral',
    look: { form: 'cabinet', w: 0.5, d: 0.4, h: 4.5, colour: '#3f5a44', colour2: '#4d6b52', belly: CREAM, trim: BRASS, top: 'sprout', specs: true, eyeW: 30, eyeH: 40, gap: 42, eye: '#e9f2c8', ring: 0xb8f0a0, tool: 'book' } },
  // a stack of six-sided cells that holds a shape, a flock of loose ones circling under him
  { id: 'cedric', name: 'Cedric', field: '', rest: 'sass',
    look: { form: 'cells', g: 0.74, size: 1.04, colour: '#6e2b2a', colour2: '#7c3534', belly: CREAM, trim: BRASS, top: 'bulb', buttons: BRASS, bowtie: BRASS, moustache: '#ffe9c0', ears: 'bolts', eyeW: 24, eyeH: 24, eyeR: 12, gap: 40, eye: '#ffe2b0', ring: 0xffd9a0, tool: 'pointer' } },
  // a spinning top on its point, leaning slowly round; a little one in her other hand, started a hair differently
  { id: 'delphine', name: 'Delphine', field: '', rest: 'happy',
    look: { form: 'top', g: 0.95, h: 3.3, colour: '#3d5873', belly: CREAM, trim: '#d9d2c2', colour2: CREAM, hat: 'beret', hatColour: '#232c3e', lashes: true, blush: true, eyeW: 34, eyeH: 44, gap: 44, eye: '#dfeaff', ring: 0xa9c8f0, tool: 'chalk', tool2: 'top' } },
  // a cube inside the turning frame of an octahedron: small
  { id: 'euclid', name: 'Euclid', field: '', rest: 'focus',
    look: { form: 'solid', a: 0.4, colour: '#d9d2c2', belly: '#f4eee2', trim: '#2c2c34', pattern: 'split', colour2: '#2c2c34', top: 'coil', specs: true, monocle: true, eyeW: 30, eyeH: 30, eyeR: 4, gap: 44, eye: '#cfe3ff', ring: 0xcfe3ff } },
  // a plant pot on a stand, her hat on what grows in it, ants going round the rim: wide and low
  { id: 'greta', name: 'Greta', field: '', rest: 'happy',
    look: { form: 'pot', g: 0.84, h: 1.6, colour: '#b48530', belly: CREAM, trim: '#5b4630', pattern: 'stripes', colour2: '#8f6a24', hat: 'straw', hatColour: '#55634c', ears: 'cups', freckles: 'rgba(255,200,150,.7)', eyeW: 40, eyeH: 34, gap: 48, eye: '#fff0c0', ring: 0xf2d16b, tool: 'can' } },
  // a herm: a square pillar with a head on it and a mortarboard on that: tall
  { id: 'horatio', name: 'Horatio', field: '', rest: 'neutral',
    look: { form: 'herm', w: 0.42, h: 3.6, colour: '#26314a', belly: CREAM, trim: BRASS, hat: 'mortar', hatColour: '#17140f', buttons: BRASS, brows: 0.5, eyeW: 22, eyeH: 30, eyeR: 10, gap: 38, eye: '#ffe9c0', ring: 0xffe0a0 } },
  // a lantern: six panes in a plum frame, a ring to carry it by, a halo over that
  { id: 'isolde', name: 'Isolde', field: '', rest: 'sleepy',
    look: { form: 'lantern', g: 0.52, h: 1.25, size: 1.02, colour: '#5d3a5a', belly: '#eadfe6', trim: '#d9a77c', pattern: 'speckle', colour2: '#8a6a88', top: 'halo', lashes: true, eyeW: 38, eyeH: 30, gap: 46, eye: '#ffd0dc', ring: 0xffb3c7, tool: 'candle' } },
  // a toolbox with a round lid, on two short legs, with arms: low and wide
  { id: 'jasper', name: 'Jasper', field: '', rest: 'happy',
    look: { form: 'toolbox', w: 0.86, d: 0.5, h: 0.95, colour: '#96492f', belly: CREAM, trim: '#5b4630', colour2: CREAM, hat: 'cap', hatColour: '#3a342e', freckles: 'rgba(255,210,170,.7)', eyeW: 42, eyeH: 22, eyeR: 8, gap: 48, eye: '#ffd9a0', ring: 0xffb07a, tool: 'wrench' } },
  // a book standing up in the air, her quill in it for a marker: very small
  { id: 'linnet', name: 'Linnet', field: '', rest: 'happy',
    look: { form: 'book', w: 0.48, h: 1.25, colour: '#8fb3c9', belly: '#f4eee2', trim: '#f4eee2', pattern: 'speckle', colour2: '#f4eee2', top: 'quill', ears: 'fins', eyeW: 44, eyeH: 44, eyeR: 22, gap: 50, eye: '#f4fbff', ring: 0xcfe9ff, tool: 'book' } },
  // a teapot: spout, handle, her hair in a bun for the knob of the lid, an apron: wide
  { id: 'mabel', name: 'Mabel', field: '', rest: 'happy',
    look: { form: 'teapot', g: 0.92, h: 1.7, colour: '#efe6d2', belly: '#f6efe0', trim: '#7a8f6a', pattern: 'band', colour2: '#7a8f6a', hat: 'bun', hatColour: '#6b4a3a', apron: '#4a5a48', specs: true, blush: true, eyeW: 30, eyeH: 30, eyeR: 15, gap: 56, eye: '#ffe2b0', ring: 0x9fe0c0, tool: 'cup' } },
  // a metronome: a tall severe spire, its pendulum ticking on the front
  { id: 'odette', name: 'Odette', field: '', rest: 'sass',
    look: { form: 'metronome', w: 0.62, h: 5.0, colour: '#2f5a5a', belly: CREAM, trim: BRASS, pattern: 'split', colour2: '#1f3f40', top: 'dish', scarf: BRASS, eyeW: 40, eyeH: 16, eyeR: 8, gap: 46, brows: -0.5, eye: '#c8fff0', ring: 0x8fe3d1 } },
  // a striped egg on a brass surveyor's tripod, a propeller turning on top
  { id: 'percival', name: 'Percival', field: '', rest: 'neutral',
    look: { form: 'instrument', g: 0.56, h: 1.5, shoulder: 2.2, size: 1.05, colour: '#3a3a40', belly: '#e4dccb', trim: '#b9a05c', pattern: 'stripes', colour2: '#55555e', top: 'prop', bowtie: '#b8452e', moustache: '#f4eee2', eyeW: 26, eyeH: 34, gap: 42, eye: '#f4eee2', ring: 0xe0e4ea, tool: 'magnifier' } },
  // a nerve cell: a round body, a crown of branching dendrites, an axon trailing behind
  { id: 'quince', name: 'Quince', field: '', rest: 'happy',
    look: { form: 'neuron', g: 0.6, size: 0.95, colour: '#a8a34a', belly: '#f3ecdc', trim: '#6c7a60', top: 'pleats', ears: 'cups', blush: true, eyeW: 30, eyeH: 30, eyeR: 15, gap: 54, eye: '#fff6c8', ring: 0xe6e08a } },
  // a bucket in a beanie, riding a floor polisher whose brush goes round: wide and low
  { id: 'rowan', name: 'Rowan', field: '', rest: 'sleepy',
    look: { form: 'bucket', g: 0.78, h: 1.6, size: 1.05, colour: '#8a4a3a', belly: CREAM, trim: BRASS, hat: 'beanie', hatColour: '#2f4a40', scarf: '#2f4a40', eyeW: 40, eyeH: 30, gap: 46, brows: 0.6, eye: '#ffe2b0', ring: 0xffc890, tool: 'duster' } },
  // a horseshoe magnet, poles down, held up by nothing, a flame on the bend: small
  { id: 'sorrel', name: 'Sorrel', field: '', rest: 'neutral',
    look: { form: 'magnet', w: 0.48, t: 0.2, h: 0.8, size: 0.94, colour: '#6c7a60', belly: CREAM, trim: '#3a2a20', colour2: CREAM, top: 'flame', eyeW: 22, eyeH: 52, eyeR: 11, gap: 34, eye: '#ffb060', ring: 0xffb347, tool: 'flask' } },
  // a rack of lamps wired layer to layer, on tracks, in headphones
  { id: 'tobias', name: 'Tobias', field: '', rest: 'happy',
    look: { form: 'rack', w: 0.62, d: 0.3, h: 3.4, colour: '#5a6a7a', belly: CREAM, trim: '#e0723c', pattern: 'band', colour2: '#e0723c', antenna: true, headphones: '#e0723c', eyeW: 44, eyeH: 20, eyeR: 6, gap: 50, eye: '#ffe9c0', ring: 0xffb07a } },

  // ---- the researchers: two postdoctoral, three doctoral, the laboratory's manager, a visiting fellow, a glassblower ----
  // postdoctoral: an hourglass in its frame, the sand half run (there is always less time than there was)
  { id: 'ansel', name: 'Ansel', field: '', rest: 'focus',
    look: { form: 'hourglass', g: 0.5, h: 2.1, colour: '#6a4a2c', belly: CREAM, trim: BRASS, sand: '#d9a05a', antenna: true, eyeW: 28, eyeH: 34, eyeR: 6, gap: 40, brows: 0.3, eye: '#ffe2b0', ring: 0xf2c078, tool: 'notebook' } },
  // postdoctoral: an oscilloscope on a trolley; the screen is her face
  { id: 'ottoline', name: 'Ottoline', field: '', rest: 'happy',
    look: { form: 'scope', w: 0.62, d: 0.5, h: 1.1, colour: '#59666b', colour2: '#d9d2c2', belly: CREAM, trim: '#2c2c34', hat: 'toque', eyeW: 34, eyeH: 34, eyeR: 17, gap: 46, lashes: true, eye: '#9dffb0', faceBg: '#0c1a10', ring: 0x9dffb0, tool: 'pipette' } },
  // doctoral: a pencil, point down, a little off the floor: thin, and keen
  { id: 'pim', name: 'Pim', field: '', rest: 'happy',
    look: { form: 'pencil', g: 0.42, h: 3.5, colour: '#d9a520', colour2: '#c4911a', pattern: 'stripes', belly: CREAM, trim: '#b9bcc0', eyeW: 40, eyeH: 46, eyeR: 20, gap: 46, blush: true, eye: '#fff6d8', ring: 0xffe08a, tool: 'clipboard' } },
  // doctoral: a straw skep with its bees: small, and busy
  { id: 'tansy', name: 'Tansy', field: '', rest: 'happy',
    look: { form: 'skep', g: 0.56, h: 1.15, colour: '#d2b068', colour2: '#b89248', belly: CREAM, trim: '#5b4630', freckles: 'rgba(255,220,170,.7)', eyeW: 36, eyeH: 40, gap: 44, eye: '#fff0c0', ring: 0xf2d16b, tool: 'pipette' } },
  // doctoral: a mug of something hot, speckled, steaming: small, and tired
  { id: 'nettle', name: 'Nettle', field: '', rest: 'sleepy',
    look: { form: 'mug', g: 0.48, h: 1.1, colour: '#4f7a78', colour2: '#e9e2d0', pattern: 'speckle', belly: CREAM, trim: '#d9d2c2', eyeW: 38, eyeH: 26, gap: 46, brows: 0.4, eye: '#d8fff4', ring: 0x9fe0d6, tool: 'notebook' } },
  // the laboratory's manager: a pressure vessel on casters, clamps round the lid, a gauge: large
  { id: 'winifred', name: 'Winifred', field: '', rest: 'sass',
    look: { form: 'drum', g: 0.92, h: 2.5, colour: '#8d9aa0', colour2: '#6f7c82', belly: CREAM, trim: '#a8763e', buttons: '#a8763e', specs: true, eyeW: 32, eyeH: 26, eyeR: 6, gap: 48, brows: -0.3, eye: '#ffe9c0', ring: 0xd9e4ea, tool: 'clipboard' } },
  // a visiting fellow, from another maker altogether: a cut stone in white and vermilion, a five-sided ring under it, a suitcase
  { id: 'caspian', name: 'Caspian', field: '', rest: 'neutral',
    look: { form: 'gem', g: 0.66, h: 2.0, colour: '#f1eee6', colour2: '#d8452c', pattern: 'band', belly: '#f1eee6', trim: '#2c2c34', eyeW: 46, eyeH: 12, eyeR: 6, gap: 40, eye: '#ff7a5c', faceBg: '#161219', ring: 0xff7a5c, glove: '#2c2c34', tool: 'case' } },
  // the glassblower: a retort on a stand, copper green below, its long beak bent down to one side
  { id: 'barnaby', name: 'Barnaby', field: '', rest: 'happy',
    look: { form: 'retort', g: 0.6, colour: '#9fc4b8', colour2: '#c97a3a', pattern: 'split', belly: CREAM, trim: '#a8763e', moustache: '#fff1d8', eyeW: 30, eyeH: 36, gap: 44, eye: '#fff1d8', ring: 0xffb469, tool: 'blowpipe' } },

  // ---- out of doors (src/outdoors_cast.js places them; no furnish file may) ----
  // the gardener: a rose-pink enamel watering can with a bunch of cut flowers standing in her, who waters from her own spout
  { id: 'yarrow', name: 'Yarrow', field: 'the grounds', rest: 'happy', outdoors: true,
    look: { form: 'can', size: 1.3, g: 0.56, h: 1.15, colour: '#cf8690', colour2: CREAM, pattern: 'band', belly: CREAM, trim: BRASS, top: 'posy', freckles: 'rgba(255,225,200,.7)', eyeW: 34, eyeH: 38, gap: 44, eye: '#fff0e4', tool: 'trowel', tool2: 'trug' } },
  // the groundskeeper: an orange cylinder mower who pushes himself by his own handles, and is proud of his stripes
  { id: 'fescue', name: 'Fescue', field: 'the lawns', rest: 'focus', outdoors: true,
    look: { form: 'mower', size: 1.15, w: 0.8, colour: '#d9772b', colour2: '#2f4a40', belly: CREAM, trim: '#b9bcc0', antenna: true, eyeW: 40, eyeH: 24, eyeR: 8, gap: 50, brows: -0.2, eye: '#fff3d0', glove: '#3a342e' } },
  // the harbour master: a small lighthouse in black and white bands on its rock, a peaked cap on the lamp room, the logbook, a spyglass
  { id: 'halyard', name: 'Halyard', field: 'harbour master', rest: 'neutral', outdoors: true,
    look: { form: 'lighthouse', size: 1.15, w: 0.56, h: 2.4, colour: '#f1f0ea', colour2: '#23252b', belly: CREAM, trim: BRASS, hat: 'peaked', hatColour: '#1f2a44', buttons: BRASS, moustache: '#f4eee2', eyeW: 26, eyeH: 30, eyeR: 9, gap: 36, eye: '#ffe9b8', tool: 'logbook', tool2: 'spyglass' } },
];
export const byId = id => ROSTER.find(r => r.id === id) ?? null;
