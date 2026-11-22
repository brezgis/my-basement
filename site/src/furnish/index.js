// Which furnish files fill the building, in order. Each is `export default function (f) { ... }` (README.md here).
//
// The plan was made smaller (three quarters) on 21 November 2026, so every room's furniture is being fitted again.
// A file is only LOADED once it is listed in FITTED; until then `?fit=larder` (or `?fit=larder,banya`, or `?fit=all`)
// loads it, for whoever is fitting it. (They are imported on demand: a file that someone is half way through editing
// used to stop the whole page for everyone, fitted or not.) The nail salon and the dressing room are no longer in the
// plan: the salon's files are kept in shelved/ ("save the room though, we might reuse later").
//
//   stair_hall    The Stair, The Hall
//   larder        The Listening Room, The Cave
//   pool_chapel   The Pool, The Chapel
//   banya         The Tea Room (with the nail corner), The Banya, The Parnaya, The Treatment Room
//   up_west       The Gallery, The Suite, The Bath, The Consulting Room
//   up_east       The Quiet Room
const ALL = ['stair_hall', 'larder', 'pool_chapel', 'banya', 'up_west', 'up_east', 'laundry'];      // laundry: The Laundry, The Linen Closet
const FITTED = ['up_east', 'banya', 'pool_chapel', 'stair_hall', 'larder', 'up_west', 'laundry'];      // (none yet: the ground storey was raised 2 ft after the first re-fits; each file is switched on once its agent has checked it against that)
const asked = (new URLSearchParams(globalThis.location?.search ?? '').get('fit') ?? '').split(',');
const want = ALL.filter(k => FITTED.includes(k) || asked.includes(k) || asked.includes('all'));
const loaded = (await Promise.all(want.map(k => import(`./${k}.js`).then(m => [k, m.default]).catch(e => { console.error('furnish file ' + k + '.js did not load:', e); return null; })))).filter(Boolean);
export const FURNISH = { spanya: loaded.map(l => l[1]) };
// Where each file's run of chance starts
export const START = new Map(loaded.map(([k, f]) => [f, { spanya: 20261121 + ALL.indexOf(k) * 7919 }]));
