# Make a picture for framing from a scan or photograph: a modest JPEG in site/assets/art/ and a line in its manifest.
#   python3 tools/art.py <image> <slug> "<title>" "<source: who made it, where it is kept, its URL>" "<licence>" [max_px]
# e.g. python3 tools/art.py research/stone/sheet3.jpg stone_habs_sheet3 "Stone Library: south elevation" \
#        "Historic American Buildings Survey, HABS MA-435, sheet 3; Library of Congress, https://www.loc.gov/item/ma0435/" "Public domain (U.S. Government work)"
# It prints the picture's proportions (give f.framed a width and height in that ratio) and the line to add to
# site/assets/CREDITS.md. Only pictures whose source and licence you can name go in: research/ holds each building's.
import sys, os, json
from PIL import Image
if len(sys.argv) < 6: sys.exit(__doc__ or 'usage: tools/art.py <image> <slug> "<title>" "<source>" "<licence>" [max_px]')
src, slug, title, source, licence = sys.argv[1:6]; mx = int(sys.argv[6]) if len(sys.argv) > 6 else 1200
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'assets', 'art'); os.makedirs(root, exist_ok=True)
im = Image.open(src).convert('RGB'); k = min(1, mx / max(im.size))
if k < 1: im = im.resize((round(im.size[0] * k), round(im.size[1] * k)), Image.LANCZOS)
im.save(os.path.join(root, slug + '.jpg'), quality=86, optimize=True)
mf = os.path.join(root, 'manifest.json'); m = json.load(open(mf)) if os.path.exists(mf) else []
old = next((e for e in m if e.get('slug') == slug), {})      # (re-making a picture keeps its artist and year: engine/picinfo.js shows them)
m = [e for e in m if e.get('slug') != slug] + [{'slug': slug, 'title': title, **{k: old[k] for k in ('short', 'artist', 'year') if k in old}, 'source': source, 'licence': licence, 'width_px': im.size[0], 'height_px': im.size[1]}]
json.dump(m, open(mf, 'w'), indent=1, ensure_ascii=False)
print('site/assets/art/%s.jpg  %d x %d px  (width : height = %.3f : 1; e.g. f.framed(wall, x, z, %.2f, %.2f, %r))' % (slug, im.size[0], im.size[1], im.size[0] / im.size[1], 2.4, 2.4 * im.size[1] / im.size[0], slug))
print('CREDITS line:  - `%s`: %s. %s. %s.' % (slug, title, source, licence))
