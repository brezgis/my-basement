// The faces lettering is painted in (ui.css declares them; boards.js uses them). Anything painted on a canvas
// needs its face to have arrived first; main.js waits here, but never long.
//   goudy     the page's own face: engraved and painted signs, door plates, printed paper
//   caveat    handwriting: chalk on a slate, a note written by hand
//   fraunces  a heavier display face: the title of a poster
// (To add a face: the .woff2 in assets/fonts/ with its licence, an @font-face in ui.css, a line here and in FACES.)
export const F = { goudy: '"Goudy House", Georgia, serif', caveat: 'Caveat, "Bradley Hand", cursive', fraunces: 'Fraunces, Georgia, serif', sans: 'Helvetica, Arial, sans-serif' };
// (a face with a unicode-range is only fetched for text that needs it: give a sample, as Caveat's Cyrillic subset here)
const FACES = ['20px "Goudy House"', 'italic 20px "Goudy House"', '600 20px Caveat', ['600 20px Caveat', 'Жж'], '600 20px Fraunces', 'italic 600 20px Fraunces'];
export function loadFonts(ms = 3500) {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.race([Promise.all(FACES.map(f => document.fonts.load(...[].concat(f)).catch(() => null))), new Promise(r => setTimeout(r, ms))]);
}
