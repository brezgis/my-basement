# Z-fighting search (from Anna's House, tools/zfight.py there). Opens the school in headless Chrome (real time, like tools/stats.py), serving a
# copy of src/builder.js that remembers which code emitted every piece (nothing in the site changes),
# then runs tools/zfight_page.js in the page: pairs of near-coplanar overlapping faces of different
# pieces. Writes the raw report as JSON and prints a summary grouped by the code that made them.
#   python3 tools/zfight.py <out.json> ["<query>"]      (waits for a render slot, as tools/drive.py)   then: python3 tools/zfight_report.py <out.json>
import sys, json, time, os, re, collections, subprocess, fcntl, random
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1]; q = sys.argv[2] if len(sys.argv) > 2 else ''
subprocess.call([os.path.join(here, 'clean_cache.sh')])
env = dict(l.strip().split('=', 1) for l in open(os.path.join(here, 'local.env')) if '=' in l and not l.startswith('#')) if os.path.exists(os.path.join(here, 'local.env')) else {}
base = os.environ.get('SCHOOL_URL', env.get('SCHOOL_URL', 'http://localhost:5190/site'))
# one of the two render slots shared with the house and the town (as tools/drive.py)
lockdir = os.environ.get('SCHOOL_LOCKS', env.get('SCHOOL_LOCKS', '/tmp/claude-1002/my_house_shot_locks')); os.makedirs(lockdir, exist_ok=True)
lock = None
while lock is None:
    for n in (1, 2):
        f = open(os.path.join(lockdir, 'slot%d' % n), 'w')
        try: fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB); lock = f; break
        except OSError: f.close()
    if lock is None: time.sleep(3 + random.random() * 4)
os.nice(19)
url = base + '/?shot&time=13&cull=0&' + q
src = open(os.path.join(here, '..', 'site', 'src', 'builder.js')).read()
tag = """{ const st = new Error().stack.split('\\n').slice(2).map(l => (/src\\/([\\w\\/.]+\\.js):(\\d+)/.exec(l) || [])).filter(m => m[1] && m[1] !== 'builder.js').map(m => m[1] + ':' + m[2]); g.userData.src = st.slice(0, 5).join(' < '); }
    this.batches.get(key).list.push(g);"""
assert 'this.batches.get(key).list.push(g);' in src
src = src.replace('this.batches.get(key).list.push(g);', tag)
mk = 'const mesh = new THREE.Mesh(mergeGeometries(list, false), m);'
assert mk in src
src = src.replace(mk, mk + ' mesh.userData.pieces = list.map(g => [g.userData.src, g.attributes.position.count]);')
src = 'Error.stackTraceLimit = 30;\n' + src
# one of the two render slots shared with the house and the town (as tools/drive.py)
import fcntl, random
lockdir = os.environ.get('SCHOOL_LOCKS', '/tmp/claude-1002/my_house_shot_locks'); os.makedirs(lockdir, exist_ok=True)
lock = None
while lock is None:
    for n in (1, 2):
        f = open(os.path.join(lockdir, 'slot%d' % n), 'w')
        try: fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB); lock = f; break
        except OSError: f.close()
    if lock is None: time.sleep(3 + random.random() * 4)
args = ['--no-sandbox', '--use-gl=angle', '--use-angle=' + os.environ.get('ANGLE', 'gl-egl'), '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=args)
    pg = b.new_page(viewport={'width': 800, 'height': 500})
    pg.route('**/src/builder.js', lambda r: r.fulfill(body=src, content_type='text/javascript'))
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.goto(url)
    pg.wait_for_function('window.__ready === true', timeout=120000)
    time.sleep(float(os.environ.get('SETTLE', 6)))
    pg.evaluate("window.__house.ctx = window.house.ctx")
    fn = open(os.path.join(here, 'zfight_page.js')).read()
    fn = fn[fn.index('(opts) =>'):]
    rep = pg.evaluate(fn, json.loads(os.environ.get('ZOPTS', '{}')))
    b.close()
for e in errs[:5]: print(e[:300])
json.dump(rep, open(out, 'w'))
print({k: rep[k] for k in ('nMesh', 'nTri', 'nPieces', 'nFaces', 'tested')}, 'pairs', len(rep['pairs']), 'skipped', rep['skipped'][:8])
