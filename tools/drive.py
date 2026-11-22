# Open the school in headless Chrome on the GPU in REAL time (tools/shot.sh uses virtual time, in which only a
# dozen frames are ever drawn), optionally press keys, then evaluate some JavaScript and take a picture.
# This is how to walk: through a door, up a stair. window.__house.walker.pos is where your feet are.
#   python3 tools/drive.py "<query>" ["<js expression or async function>"]
#   KEYS="hold:w:2500,e,wait:1500,hold:w:4000"   keys in order: a key name presses it, hold:key:ms holds it, wait:ms waits
#   (the walker needs the page in walking mode: give at=<name> or view=..., which start it there)
#   SHOT=out.png   SETTLE=4 (seconds after loading)   W, H (window size)
import sys, json, time, os, subprocess, fcntl, random
from playwright.sync_api import sync_playwright
q = sys.argv[1] if len(sys.argv) > 1 else ''
js = sys.argv[2] if len(sys.argv) > 2 else '(() => { const h = window.__house, r = h.renderer.info; return { stages: h.stages, firstFrameMs: h.firstFrameMs, calls: h.lastCalls, tris: h.lastTris, textures: r.memory.textures, geometries: r.memory.geometries, programs: r.programs.length }; })()'
here = os.path.dirname(os.path.abspath(__file__))
subprocess.call([os.path.join(here, 'clean_cache.sh')])      # (headless Chrome leaves 70 MB behind on every launch)
env = dict(l.strip().split('=', 1) for l in open(os.path.join(here, 'local.env')) if '=' in l and not l.startswith('#')) if os.path.exists(os.path.join(here, 'local.env')) else {}
url = os.environ.get('SCHOOL_URL', env.get('SCHOOL_URL', 'http://localhost:5190/site')) + '/?' + q
# one of the two render slots shared with the house and the town
lockdir = os.environ.get('SCHOOL_LOCKS', env.get('SCHOOL_LOCKS', '/tmp/claude-1002/my_house_shot_locks')); os.makedirs(lockdir, exist_ok=True)
lock = None
while lock is None:
    for n in (1, 2):
        f = open(os.path.join(lockdir, 'slot%d' % n), 'w')
        try: fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB); lock = f; break
        except OSError: f.close()
    if lock is None: time.sleep(3 + random.random() * 4)
os.nice(19)
args = ['--no-sandbox', '--use-gl=angle', '--use-angle=' + os.environ.get('ANGLE', 'gl-egl'), '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--password-store=basic']
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=args)
    pg = b.new_page(viewport={'width': int(os.environ.get('W', 1280)), 'height': int(os.environ.get('H', 760))})
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' or m.text.startswith('Q:') else None)
    t0 = time.time(); pg.goto(url)
    pg.wait_for_function('window.__house && window.house', timeout=120000); t1 = time.time()
    pg.wait_for_function('window.__ready === true', timeout=120000); t2 = time.time()
    time.sleep(float(os.environ.get('SETTLE', 4)))
    for k in [k for k in os.environ.get('KEYS', '').split(',') if k]:
        a = k.split(':')
        if a[0] == 'wait': time.sleep(int(a[1]) / 1000)
        elif a[0] == 'hold': pg.keyboard.down(a[1]); time.sleep(int(a[2]) / 1000); pg.keyboard.up(a[1])
        else: pg.keyboard.press(a[0])
    res = pg.evaluate(js)
    if os.environ.get('SHOT'): pg.screenshot(path=os.environ['SHOT'])
    b.close()
for e in errs[:12]: print('page:', e[:400])
print('built in %.1fs, textures in after %.1fs' % (t1 - t0, t2 - t0))
print(res if isinstance(res, str) else json.dumps(res))
