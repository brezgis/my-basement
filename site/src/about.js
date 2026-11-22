// "About this place": what it is, how it belongs to the house, and where its parts come from. Opened with the I key,
// the link on the invitation and in the help card. Set as at Anna's House: a sheet of paper, Goudy, a drop capital,
// sections with citations, a colophon.

const css = `
#about .paper { width: min(700px, 100%); padding: 34px 44px 30px; font-size: 16.5px; line-height: 1.6; }
#about .paper:focus { outline: none; }
#about .lede { margin: 0 0 8px; font-size: 17.5px; line-height: 1.6; max-width: 36em; }
#about .lede::first-letter { float: left; font-size: 3.5em; line-height: .82; padding: 6px 8px 0 0; color: var(--teak); }
#about section { margin-top: 26px; }
#about h3 { margin: 0 0 8px; font-size: 21px; }
#about p { margin: 0 0 10px; max-width: 38em; }
#about ul { list-style: none; margin: 0; padding: 0; }
#about .cite li { margin: 0 0 8px; padding-left: 1.4em; text-indent: -1.4em; font-size: 15.5px; line-height: 1.5; }
#about .cite li::before { content: ''; display: inline-block; width: 4px; height: 4px; margin: 0 calc(1.4em - 4px) .2em 0; background: var(--ink); vertical-align: middle; text-indent: 0; }
#about code { font-size: .88em; }
#about .colophon { margin-top: 28px; padding-top: 14px; border-top: 1px solid rgba(122, 75, 42, .22); font-size: 14px; font-style: italic; color: var(--ink-soft); }
@media (max-width: 560px) {
  #about .paper { padding: 26px 22px calc(26px + env(safe-area-inset-bottom)); font-size: 16px; }
  #about .lede { font-size: 16.5px; }
}
`;

export let aboutPanel = null;

export function makeAbout() {
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const wrap = document.createElement('div'); wrap.id = 'about'; wrap.className = 'sheet';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'about-title');
  wrap.innerHTML = `<article class="paper" tabindex="-1">
    <button class="close" type="button" aria-label="Close">×</button>
    <h2 id="about-title">About this place</h2>
    <svg class="rule" aria-hidden="true"><use href="#cloudlift"/></svg>
    <p class="lede">Rooms cut into the rock of a floating island, round a courtyard in a grotto that is open on one side to the clouds: a hall with a fire, a listening room, a cheese cave, a warm pool, a chapel, a banya with its steam room, and upstairs a suite and a few quiet rooms. The staff are robots, and they know it is their house really.</p>

    <section><h3>How you get here</h3>
    <p>It lies under the garden of Anna’s House. In the angle where two of the house’s walls meet there is a slanted steel cellar door; nothing says what is under it. Open it and go down, and you come out on the stair here. Go back up the stair and you are beside the doors in the garden again.</p></section>

    <section><h3>Where it comes from</h3>
    <ul class="cite">
      <li>SeARCH and Christian Müller Architects, <i>Villa Vals</i>, Vals, Switzerland, 2005–2009: a plain door somewhere else, a tunnel of stairs with daylight at its end, and one round cut that every room looks into. The plan here follows it; the sizes are guessed from the architects’ published drawings.</li>
      <li>The rooms are in a warm Scandinavian brutalism of Anna’s choosing: rough rock, pale concrete and slate, dark and honey timber, mid-century furniture, and the outside brought in.</li>
    </ul></section>

    <section><h3>How it is made</h3>
    <p>Drawn in the browser with three.js, on the engine of Anna’s House, Vesper Street and Cloud Spring Harbor Laboratory. The rooms and the rock are built in code; the photographic textures and the furniture models are public-domain (CC0) pieces from Poly Haven, ambientCG and ShareTextures, listed in <code>assets/tex/TEXTURES.md</code> and <code>assets/credits/</code>. Built by Anna with Claude.</p></section>

    <p class="colophon">Set in Sorts Mill Goudy, Barry Schwartz’s revival of Frederic Goudy’s Oldstyle of 1915, under the SIL Open Font License.</p>
  </article>`;
  document.body.appendChild(wrap);
  const article = wrap.querySelector('article');

  let back = null;
  const api = {
    get open() { return wrap.classList.contains('on'); },
    show() {
      if (!api.open) back = document.activeElement;
      for (const s of document.querySelectorAll('.sheet.on')) if (s !== wrap) s.classList.remove('on');
      wrap.classList.add('on'); document.exitPointerLock?.();
      article.scrollTop = 0; wrap.querySelector('.close').focus({ preventScroll: true });
    },
    hide() {
      if (!api.open) return;
      wrap.classList.remove('on');
      if (back?.isConnected && back !== document.body && back.offsetParent) back.focus({ preventScroll: true }); else document.activeElement?.blur?.();
    },
    toggle() { api.open ? api.hide() : api.show(); },
  };
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('.close')) api.hide(); });
  wrap.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.hide(); return; }
    if (e.code !== 'KeyI') e.stopPropagation();                         // the place does not walk while you read (I still closes)
    if (e.key !== 'Tab') return;                                         // keep Tab inside the panel
    const f = [...wrap.querySelectorAll('button, a[href]')].filter(x => x.offsetParent);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });
  document.getElementById('aboutBtn')?.addEventListener('click', () => api.show());
  aboutPanel = api; return api;
}
