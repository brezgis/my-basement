// The books. Every book on the school's shelves is a real one (assets/books.json, the list from Anna's House):
// look at a spine and the prompt names it; E takes it down and opens it (card.js). The rule about what is inside
// is the house's, and is about honesty: a book shows a passage of its own text only if books/quotes.js has one
// for it, cut word for word from a public-domain text and marked verified. Every other book shows its cover and
// where it is shelved, and nothing else. Nothing is invented.
//
// Nothing to call: wherever a furnish file puts books (K.bookcase, K.bookRow, K.bookStack, K.shelf), they are
// shelved, drawn and can be read. The parts, none of which knows this is a school except the plan:
//   books/plan.js       what this site shelves where (collections by subject, rooms -> collections)
//   books/catalogue.js  the list in order: collections, filing by author                       (pure)
//   books/shelves.js    shelf rows recorded by the kit; filling them from the catalogue        (pure)
//   books/spines.js     one painted spine per title, in shared sheets
//   books/draw.js       a face per spine for every book; heads and sides near the eye; range-end cards
//   books/aim.js        which book is under the centre of view                                 (pure)
//   books/quotes.js     the checked passages
//
// window.house.ctx.books: { count, titles, taken, aimed(), takeDown(rec), find(title), stats(), laid, draw }.

import { makeBookIndex } from './books/aim.js';
import { QUOTES } from './books/quotes.js';
import { makeCatalogue } from './books/catalogue.js';
import { SETS, layout } from './books/shelves.js';
import { makeSpineSheets } from './books/spines.js';
import { drawShelves } from './books/draw.js';
import { COLLECTIONS, ROOMS, NAMES } from './books/plan.js';
import { showCard, cardOpen, closeCard } from './card.js';

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export function contentFor(rec) {
  const q = QUOTES[rec.title];
  if (q && q.verified === true && q.source && q.author === (rec.author ?? '')) return { kind: 'quote', text: q.text, where: q.where, source: q.source };
  return { kind: 'title' };
}

let started = null;
export function setupBooks(ctx) { return (started ??= start(ctx).catch(e => { console.warn('books', e); return null; })); }

async function start(ctx) {
  if (new URLSearchParams(globalThis.location?.search ?? '').get('books') === '0') return null;      // ?books=0: bare shelves (for measuring what the books cost)
  let list = [];
  try { list = await (await fetch('assets/books.json')).json(); } catch { /* the shelves stay bare */ }
  if (!list.length) return null;
  const THREE = ctx.THREE, cat = makeCatalogue(list, COLLECTIONS, NAMES), rooms = ctx.house?.rooms ?? [];
  const roomOf = (x, y, z) => { let best = null; for (const r of rooms) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y >= r.y0 - 0.5 && y <= r.y1 && (!best || (r.x1 - r.x0) * (r.z1 - r.z0) < (best.x1 - best.x0) * (best.z1 - best.z0))) best = r; return best?.name ?? null; };
  const laid = layout(SETS, cat, { roomOf, rooms: ROOMS }), books = laid.books;
  if (!books.length) return null;
  const sheets = makeSpineSheets(THREE, books.map(b => b.rec), { anisotropy: Math.min(8, ctx.renderer?.capabilities?.getMaxAnisotropy?.() ?? 8), maxSize: ctx.renderer?.capabilities?.maxTextureSize });
  const draw = drawShelves(ctx, laid, sheets), index = makeBookIndex(books);

  const FAR = 1e9, dir = new THREE.Vector3();
  let aimed = -1, clock = 0, from = null;
  const api = { count: books.length, titles: laid.stats.titles.size, taken: [], laid, draw, sheets, aimed: () => books[aimed]?.rec ?? null };
  const ent = { x: FAR, y: 0, z: 0, reach: 5.6, size: 0.35,
    label: () => { const r = books[aimed]?.rec; return r ? `take down <i>${esc(r.title)}</i>${r.author ? ', ' + esc(r.author) : ''}` : ''; },
    act: () => takeDown(books[aimed]?.rec) };
  ctx.interact.push(ent);
  function takeDown(rec) {
    if (!rec) return false;
    const c = contentFor(rec), year = rec.year ? (rec.year < 0 ? -rec.year + ' BC' : String(rec.year)) : '';
    showCard(c.kind === 'quote'
      ? { title: rec.title, by: rec.author ?? '', year, colour: rec.colour ?? '#6b2a25', kicker: 'From the book itself · ' + c.where, text: c.text, quote: true, foot: 'Public domain. Checked, word for word, against the Project Gutenberg text.' }
      : { title: rec.title, by: rec.author ?? '', year, colour: rec.colour ?? '#6b2a25', kicker: rec.shelf ? 'Shelved under ' + cat.name(rec.shelf).toLowerCase() : 'On the shelf', text: '', foot: 'No passage of this book has been checked against its text, so none is shown here.' });
    if (!api.taken.some(b => b.title === rec.title)) api.taken.push({ title: rec.title, author: rec.author ?? '', held: c.kind });
    from = ctx.camera.position.clone();
    return true;
  }
  api.takeDown = takeDown;
  // where the copies of a title stand (for tests, and for anyone who wants to send a visitor to a book)
  api.find = title => books.filter(b => b.rec.title === title).map(b => ({ x: +b.x.toFixed(2), y: +b.y.toFixed(2), z: +b.z.toFixed(2), room: b.row.room }));
  // how many spines and distinct titles each building shows, and how near two copies of one title ever come
  api.stats = () => {
    const out = {};
    for (const b of books) {
      const s = (out[b.row.set] ??= { spines: 0, titles: new Map(), rooms: {} });
      s.spines++; (s.rooms[b.row.room ?? '?'] ??= { spines: 0, titles: new Set() }).spines++; s.rooms[b.row.room ?? '?'].titles.add(b.rec);
      if (!s.titles.has(b.rec)) s.titles.set(b.rec, []); s.titles.get(b.rec).push(b);
    }
    return Object.values(out).map(s => {
      const gaps = []; for (const l of s.titles.values()) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (l[i].row.room === l[j].row.room && l[i].row.src.run && l[j].row.src.run) gaps.push(Math.hypot(l[i].x - l[j].x, l[i].y - l[j].y, l[i].z - l[j].z));
      gaps.sort((a, b) => a - b);
      return { spines: s.spines, titles: s.titles.size, nearestCopies: gaps.length ? +gaps[0].toFixed(1) : null, medianCopies: gaps.length ? +gaps[gaps.length >> 1].toFixed(1) : null,
        rooms: Object.fromEntries(Object.entries(s.rooms).map(([k, v]) => [k, [v.spines, v.titles.size]])) };
    });
  };
  ctx.animated.push((t, dt) => {
    draw.update(ctx.camera);
    if (from && cardOpen() && ctx.camera.position.distanceTo(from) > 3) { closeCard(); from = null; }      // walking away puts it back
    if ((clock += dt) < 0.14) return; clock = 0;
    if (ctx.mode !== 'walk' || cardOpen()) { aimed = -1; ent.x = FAR; return; }
    ctx.camera.getWorldDirection(dir); const p = ctx.camera.position;
    aimed = index.pick(p.x, p.y, p.z, dir.x, dir.y, dir.z, 5.5);
    const b = aimed >= 0 ? books[aimed] : null;
    if (b) { ent.x = b.x; ent.y = b.y; ent.z = b.z; } else { aimed = -1; ent.x = FAR; }
  });
  ctx.books = api;
  ctx.onChange?.();
  return api;
}
