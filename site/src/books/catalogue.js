// The catalogue: the book list (assets/books.json) put in order. Pure (no three.js, no page), so node can test it,
// and nothing here knows which site it is in: the collections a site shelves are handed in (books/plan.js).
//
// A record is one line of books.json: { title, author, year, shelf, size, colour, spine_title }. Nothing is ever
// made up here: a collection is only a choice and an ordering of records that are in the list.
//
//   const cat = makeCatalogue(list, COLLECTIONS, NAMES);
//   cat.collection('philosophy')            every record on that shelf, by author, then year, then title
//   cat.collection(['classics', 'poetry'])  one after another, nothing twice
//   cat.collection('russian')               a named collection from COLLECTIONS: a list of parts, each a shelf name,
//                                           another collection's name, or { shelf, author: /re/, title: /re/, since,
//                                           until, by: 'author' | 'year' | 'newest' | 'mixed', salt }
//   cat.name('scifi')                       'Science fiction': what a class is called on a label

export const bookKey = rec => rec.title + '|' + (rec.author ?? '');
export function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export const hash01 = s => hash(s) / 4294967296;

// The name a book is filed under: the first author's surname ("Anonymous" and the like file under the title).
export function filing(rec) {
  let a = String(rec.author ?? '').split(/\s*(?:;|&|,| and | with |\(|\bet al)\s*/)[0].trim();
  a = a.replace(/\s+(Jr\.?|Sr\.?|II|III)$/i, '').replace(/\s+of\s+.*$/i, '');
  const strip = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(the|an?)\s+/i, '').toLowerCase();
  if (!a || /^anonymous$/i.test(a)) return strip(rec.title);
  const w = a.split(/\s+/);
  return strip(w[w.length - 1]) + ' ' + strip(w.slice(0, -1).join(' '));
}

export function makeCatalogue(list, collections = {}, names = {}) {
  const byShelf = new Map();
  for (const r of list) { if (!byShelf.has(r.shelf)) byShelf.set(r.shelf, []); byShelf.get(r.shelf).push(r); }
  const file = new Map(list.map(r => [r, filing(r)]));
  const ORDER = {
    author: (a, b) => (file.get(a) < file.get(b) ? -1 : file.get(a) > file.get(b) ? 1 : (a.year ?? 0) - (b.year ?? 0) || (a.title < b.title ? -1 : 1)),
    year: (a, b) => (a.year ?? -1e4) - (b.year ?? -1e4) || (a.title < b.title ? -1 : 1),
    newest: (a, b) => (b.year ?? -1e4) - (a.year ?? -1e4) || (a.title < b.title ? -1 : 1),
  };
  const mixed = salt => (a, b) => hash(salt + bookKey(a)) - hash(salt + bookKey(b));      // (a different shuffle for each salt, so two mixed shelves in one room do not begin with the same books)
  const made = new Map();
  function part(p, trail) {
    if (typeof p === 'string') return collections[p] ? collection(p, trail) : [...(byShelf.get(p) ?? [])].sort(ORDER.author);
    const sorted = s => [...(byShelf.get(s) ?? [])].sort(ORDER.author);
    const from = p.shelf ? [].concat(p.shelf).flatMap(s => (collections[s] ? collection(s, trail) : sorted(s))) : [...list].sort(ORDER.author);
    const out = from.filter(r => (!p.author || p.author.test(r.author ?? '')) && (!p.title || p.title.test(r.title)) && (p.since === undefined || (r.year ?? -1e9) >= p.since) && (p.until === undefined || (r.year ?? 1e9) <= p.until));
    return p.by ? out.sort(p.by === 'mixed' ? mixed(p.salt ?? '') : ORDER[p.by] ?? ORDER.author) : out;      // (unsorted, a part keeps its shelves in the order given, each by author)
  }
  // Every record of a collection, in shelving order, none twice.
  function collection(spec, trail = []) {
    const key = typeof spec === 'string' ? spec : JSON.stringify(spec, (k, v) => (v instanceof RegExp ? String(v) : v));
    if (made.has(key)) return made.get(key);
    if (trail.includes(key)) return [];                      // (a collection that names itself)
    const parts = typeof spec === 'string' ? collections[spec] ?? [spec] : [].concat(spec), seen = new Set(), out = [];
    for (const p of parts) for (const r of part(p, [...trail, key])) if (!seen.has(r)) { seen.add(r); out.push(r); }
    made.set(key, out);
    return out;
  }
  return { list, collection, shelves: [...byShelf.keys()], size: s => byShelf.get(s)?.length ?? 0, name: s => names[s] ?? (s ? s[0].toUpperCase() + s.slice(1) : ''), filing: r => file.get(r) ?? filing(r) };
}

// What a run of shelves holds, said shortly, for a label at the end of a range: the classes in order, each with the
// span of authors' initials when only part of the class is there ("Literature A–F").
export function describe(cat, recs) {
  const groups = [];
  for (const r of recs) { const g = groups[groups.length - 1]; if (g && g.shelf === r.shelf) g.recs.push(r); else groups.push({ shelf: r.shelf, recs: [r] }); }
  const merged = [];
  for (const g of groups) { const m = merged.find(x => x.shelf === g.shelf); if (m) m.recs.push(...g.recs); else merged.push(g); }      // (a class that runs off the end and comes round again is said once)
  return merged.filter(g => g.recs.length >= 3 || merged.length === 1).map(g => {
    const whole = new Set(g.recs).size >= cat.size(g.shelf) * 0.92, ini = r => (cat.filing(r)[0] ?? '').toUpperCase();
    const a = ini(g.recs[0]), z = ini(g.recs[g.recs.length - 1]);
    return { name: cat.name(g.shelf), span: whole || !a || !z ? '' : a === z ? a : a + '–' + z, n: g.recs.length };
  });
}
