// A card to read: something opened over the view (a book taken down from a shelf, the caption of a framed
// drawing, a label on an object), in the page's own paper and ink. One at a time. E, Esc or a click closes it,
// and so does walking away. Text is set with textContent-safe escaping only: never as HTML from outside.
//
//   showCard({ title, by, year, kicker, text, quote: true, foot, colour })      closeCard()      cardOpen()

const CSS = `
#read-card { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; opacity: 0; pointer-events: none; transition: opacity .25s ease; z-index: 6; background: rgba(12, 8, 5, .32); }
#read-card.on { opacity: 1; pointer-events: auto; }
#read-card .leaf { display: flex; max-width: min(820px, 100%); max-height: 86dvh; filter: drop-shadow(0 22px 40px rgba(0,0,0,.6)); font-family: var(--serif); }
#read-card .cover { flex: 0 0 34%; min-width: 150px; padding: 30px 22px; border-radius: 3px 0 0 3px; display: flex; flex-direction: column; background-image: linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,0) 14%, rgba(0,0,0,0) 90%, rgba(0,0,0,.22)); }
#read-card .cover { overflow: hidden auto; }
#read-card .cover h2 { margin: 18px 0 10px; font-weight: 400; font-size: clamp(20px, 3vw, 27px); line-height: 1.16; letter-spacing: .01em; overflow-wrap: anywhere; }
#read-card .cover h2.long { font-size: clamp(16px, 2.2vw, 21px); }
#read-card .cover .au { font-style: italic; font-size: 16px; opacity: .92; }
#read-card .cover .yr { margin-top: auto; font-size: 13px; letter-spacing: .12em; opacity: .8; }
#read-card .page { flex: 1; overflow: auto; padding: 30px 30px 20px; border-radius: 0 3px 3px 0; background: var(--grain), var(--paper, #f0e5cf); color: var(--ink, #2a1c13); }
#read-card .leaf.plain .page { border-radius: 3px; }
#read-card .page { overflow-wrap: break-word; }
#read-card .page h2 { margin: 0 0 4px; font-weight: 400; font-size: 23px; letter-spacing: .02em; line-height: 1.2; }
#read-card .page h2.long { font-size: 19px; }
#read-card .kicker { margin: 0 0 14px; font-size: 12.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--teak, #7a4b2a); }
#read-card .text p { margin: 0 0 .8em; font-size: 17px; line-height: 1.5; }
#read-card .text.quote p { font-size: 18.5px; line-height: 1.55; }
#read-card .foot { margin-top: 14px; font-size: 13px; font-style: italic; color: var(--ink-soft, #5b4636); }
#read-card .hint { margin-top: 12px; font-size: 12px; font-style: italic; color: var(--ink-soft, #5b4636); opacity: .8; }
@media (max-width: 620px) { #read-card .leaf { flex-direction: column; overflow: auto; } #read-card .cover { flex: none; padding: 20px; border-radius: 3px 3px 0 0; } #read-card .page { border-radius: 0 0 3px 3px; } }
`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let el = null, open = null, openedAt = 0, closedAt = -1e9;
function make() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  el = document.createElement('div'); el.id = 'read-card'; document.body.appendChild(el);
  el.addEventListener('click', () => closeCard());
  addEventListener('keydown', e => {
    if (!open) return;
    if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') { e.stopImmediatePropagation(); e.preventDefault(); if (performance.now() - openedAt > 350) closeCard(); }
  }, true);
}
export function showCard(c) {
  if (performance.now() - closedAt < 300) return;      // (the E that closed a card is not also the E that opens it again)
  if (!el) make();
  const paras = String(c.text ?? '').split(/\n\s*\n|\n/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
  const lum = (() => { const m = /^#([0-9a-f]{6})$/i.exec(c.colour ?? ''); if (!m) return 0; const n = parseInt(m[1], 16); return (0.3 * (n >> 16 & 255) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255)) / 255; })();
  const cover = c.colour ? `<div class="cover" style="background-color:${esc(c.colour)};color:${lum > 0.55 ? '#1c1a17' : '#f1e9d6'}"><h2${String(c.title ?? '').length > 48 ? ' class="long"' : ''}>${esc(c.title)}</h2><div class="au">${esc(c.by)}</div><div class="yr">${esc(c.year)}</div></div>` : '';
  el.innerHTML = `<div class="leaf${cover ? '' : ' plain'}">${cover}<div class="page">${cover ? '' : `<h2${String(c.title ?? '').length > 60 ? ' class="long"' : ''}>${esc(c.title)}</h2>`}${c.kicker ? `<p class="kicker">${esc(c.kicker)}</p>` : ''}<div class="text${c.quote ? ' quote' : ''}">${paras}</div>${c.foot ? `<div class="foot">${esc(c.foot)}</div>` : ''}<div class="hint">E to close</div></div></div>`;
  el.classList.add('on'); open = c; openedAt = performance.now();
}
export function closeCard() { if (!open) return; open = null; closedAt = performance.now(); el?.classList.remove('on'); }
export const cardOpen = () => open;
