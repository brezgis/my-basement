// The research staff: one cohort of eighteen, the same individuals all day and all night (they are robots: they
// do not go home and they do not sleep). Each has a group, a make and a few touches of its own, and the rooms it
// spends its time in, the first being its own desk's room. faculty/researchers.js moves them from one of their
// places to another every few minutes: across a floor they walk (so the halls have people in them going
// somewhere), and between buildings or floors they take the stairs or the path, out of sight.
//
// The places they may sit or stand are the furnish files' f.researcher({ ... }) calls, which now mark SPOTS (a
// chair at a desk with a laptop open on it, a place at a bench, a seat in a lecture room) rather than robots: a
// spot is used when one of the cohort is in that room, and is otherwise an empty chair with work left on the table.
//
//   name, group, make, size       who it is (group: researchers.js GROUPS; make: researcher_looks.js MAKES)
//   wear                          'scarf' | 'satchel' | none
//   role: 'tech'                  one of the technical staff (an apron, a belt, a spanner in the hand at a bench)
//   touches                       glasses: frame colour; pencil: 1 behind the left ear, -1 the right; antenna:
//                                 'none' | 'stub' | 'ball' | 'bent' | 'two', bulb: its colour; visorW, visorH;
//                                 sticker: [angle, height, colour]; patch: [x, height]; cardigan: colour; mug: true
//   places                        [['Room name', weight], ...]: where it goes; the first is its own desk's room
//   seed                          its shell colour, eye colour and shape, and accent, as the old seeds gave
//
// The rooms are named as the buildings name them (campus.js / buildings/): the Museum's café is 'Museum', the
// bullpen under it 'Museum Basement', the library's 'Reading Room', 'Delivery Room', 'Book Room', 'Upper Room',
// 'Cataloguing Room', the Stone Library 'The Stone Library'. A lecture room is a place like any other: there are
// never more than three of the cohort in its audience.

export const COHORT = [
  { name: 'Ada', group: 'mind', make: 'round', seed: 4101, touches: { glasses: '#3a2f28', antenna: 'stub' }, places: [['Room 305', 3], ['Reading Room', 3], ['The Stone Library', 2], ['Museum', 2], ['Room 306', 2], ['Lecture Room', 1]] },
  { name: 'Bruno', group: 'matter', make: 'drum', seed: 4102, touches: { patch: [-0.18, 0.42], antenna: 'ball', bulb: '#e0723c' }, places: [['Room 302', 3], ['Museum Basement', 2], ['Room 102', 2], ['Room 306', 1], ['Museum', 2]] },
  { name: 'Calla', group: 'morpho', make: 'wide', seed: 4103, touches: { cardigan: '#7c8a5a', visorW: 0.9 }, places: [['Botanical Laboratory', 3], ['Room 201', 2], ['Museum Attic', 2], ['Reading Room', 1], ['Museum', 1]] },
  { name: 'Davy', group: 'machine', make: 'box', seed: 4104, touches: { sticker: [0.5, 0.35, '#e0723c'], antenna: 'bent' }, places: [['Museum Basement', 4], ['Room 207', 2], ['Museum', 2]] },
  { name: 'Esme', group: 'neural', make: 'neck', seed: 4105, touches: { pencil: 1 }, places: [['Room 203', 3], ['Room 206', 2], ['Museum Basement', 2], ['Delivery Room', 1]] },
  { name: 'Freya', group: 'collective', make: 'tall', seed: 4106, wear: 'scarf', touches: { antenna: 'none', visorH: 0.9 }, places: [['Room 301 A', 3], ['Delivery Room', 2], ['Museum', 2], ['Room 205', 1]] },
  { name: 'Gil', group: 'systems', make: 'round', seed: 4107, touches: { mug: true, antenna: 'two', bulb: '#c8fff0' }, places: [['Room 303', 3], ['Upper Room', 2], ['Room 202', 2], ['Room 306', 2], ['Museum', 1]] },
  { name: 'Hattie', group: 'mind', make: 'box', seed: 4108, touches: { glasses: '#8a6a3a', cardigan: '#8a3d4b' }, places: [['Reading Room', 3], ['Book Room', 2], ['Room 306', 2], ['Lecture Room', 1]] },
  { name: 'Ivo', group: 'tech', role: 'tech', make: 'drum', seed: 4109, touches: { antenna: 'stub', patch: [0.2, 0.7] }, places: [['Museum Attic', 2], ['Room 203', 2], ['Museum Basement', 2], ['Book Room', 1]] },
  { name: 'Joss', group: 'machine', make: 'wide', seed: 4110, wear: 'satchel', touches: { antenna: 'two', bulb: '#ffd9a0' }, places: [['Museum Basement', 3], ['Room 207', 2], ['Museum', 2], ['Reading Room', 1]] },
  { name: 'Lark', group: 'morpho', make: 'round', seed: 4111, touches: { sticker: [-0.4, 0.5, '#3f7a52'], mug: true, visorW: 1.12 }, places: [['Botanical Laboratory', 2], ['Room 201 A', 2], ['Museum', 2], ['Reading Room', 1]] },
  { name: 'Mina', group: 'neural', make: 'tall', seed: 4112, touches: { pencil: -1, antenna: 'none' }, places: [['Room 203', 2], ['Room 206', 2], ['Reading Room', 2], ['Cataloguing Room', 1]] },
  { name: 'Nils', group: 'matter', make: 'box', seed: 4113, touches: { patch: [-0.2, 0.55], antenna: 'stub', visorH: 0.88 }, places: [['Room 302', 2], ['Room 103', 2], ['Museum Basement', 2], ['Museum', 1]] },
  { name: 'Orla', group: 'collective', make: 'neck', seed: 4114, wear: 'scarf', touches: {}, places: [['Delivery Room', 3], ['Room 301 A', 2], ['The Stone Library', 1], ['Museum', 2]] },
  { name: 'Pearl', group: 'systems', make: 'drum', seed: 4115, touches: { cardigan: '#3d5873', glasses: '#2a2622', antenna: 'none' }, places: [['Room 303', 2], ['Upper Room', 2], ['Room 202', 2], ['Room 306', 2], ['Reading Room', 2]] },
  { name: 'Rufus', group: 'tech', role: 'tech', make: 'box', seed: 4116, touches: { antenna: 'ball', bulb: '#e0723c', pencil: 1 }, places: [['Museum Basement', 2], ['Room 302', 1], ['Museum Attic', 2]] },
  { name: 'Sage', group: 'mind', make: 'tall', seed: 4117, touches: { glasses: '#c9a45c', mug: true }, places: [['The Stone Library', 3], ['Room 304', 2], ['Room 306 A', 2], ['Reading Room', 2], ['Lecture Room', 1]] },
  { name: 'Tess', group: 'machine', make: 'round', seed: 4118, wear: 'satchel', touches: { antenna: 'bent', visorH: 1.1 }, places: [['Room 207', 2], ['Museum Basement', 2], ['Lecture Room', 2], ['Museum', 2]] },
];
