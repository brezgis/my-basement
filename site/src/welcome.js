// Arriving. Nothing here is a tutorial: on "Go down" the picture of the cliff sinks into the dark under the cellar
// doors (the line of daylight between them shows for a moment, as it did while the place was loading), and the stair
// comes up out of it. (window.__newcomer says whether this is a first visit, for whoever will want to know.)
// Test hooks: ?welcome=new (behave as a first visit), ?welcome=old.

const Q = new URLSearchParams(location.search), W = Q.get('welcome');
const seen = (() => { try { return localStorage.getItem('welcomed') === '1'; } catch { return false; } })();
window.__newcomer = W === 'new' ? true : W === 'old' ? false : !seen;

export function setupWelcome(ctx) {
  dissolve(ctx);
}

// ---- from the picture outside to the stair: the last outside frame fades into the dark, then the stair comes up ---
function dissolve(ctx) {
  const btn = document.getElementById('enter'); if (!btn) return;
  btn.addEventListener('click', () => {
    try { localStorage.setItem('welcomed', '1'); } catch { /* private window */ }
    const R = ctx.renderer, src = R.domElement;
    const veil = document.createElement('div'), snap = document.createElement('canvas'), seam = document.createElement('div');
    veil.style.cssText = 'position:fixed;inset:0;z-index:8;pointer-events:none;background:#0f0c0a;opacity:1;transition:opacity 2.2s cubic-bezier(.3,0,.2,1)';
    seam.style.cssText = 'position:absolute;left:50%;top:22%;bottom:22%;width:3px;margin-left:-1.5px;opacity:0;transition:opacity .6s ease;' +
      'background:linear-gradient(transparent,#fff1d6 18%,#fff1d6 82%,transparent);box-shadow:0 0 18px 4px rgba(255,200,130,.28)';
    snap.width = Math.max(2, src.width >> 1); snap.height = Math.max(2, src.height >> 1);
    snap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:1;transition:opacity .7s ease';
    veil.appendChild(seam);
    try { R.render(ctx.scene, ctx.camera); snap.getContext('2d').drawImage(src, 0, 0, snap.width, snap.height); veil.appendChild(snap); } catch { /* no picture: a plain fade from dark */ }
    document.body.appendChild(veil);
    requestAnimationFrame(() => requestAnimationFrame(() => { snap.style.opacity = '0'; seam.style.opacity = '.85'; }));      // the cliff sinks into the dark under the doors...
    setTimeout(() => { seam.style.opacity = '0'; veil.style.opacity = '0'; }, 900);                                           // ...and the stair comes up out of it
    setTimeout(() => veil.remove(), 3400);
  }, true);      // capture: this runs before the place stands you on the stair, so the last outside frame can be kept
}
