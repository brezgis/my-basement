# The lettering audit: open the school in headless Chrome (as tools/drive.py does, and through the same two render
# slots), note every string painted on a canvas from the moment the page starts (signs_audit_init.js), then measure
# every lettered thing on its canvas and in the world (signs_audit.js) and write what it finds.
#   python3 tools/signs_audit.py [out.json] ["<query>"]        (default query: at=green&shot&faculty=0)
# It prints a summary by kind of failure and by file; the JSON has every sign with its place, its viewing position
# and its issues. A failure (fail: 1) wants fixing; a note (fail: 0) wants a look.
import sys, json, time, os, subprocess, fcntl, random, collections
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/signs_audit.json'
q = sys.argv[2] if len(sys.argv) > 2 else 'at=green&shot&faculty=0'
subprocess.call([os.path.join(here, 'clean_cache.sh')])
env = dict(l.strip().split('=', 1) for l in open(os.path.join(here, 'local.env')) if '=' in l and not l.startswith('#')) if os.path.exists(os.path.join(here, 'local.env')) else {}
url = os.environ.get('SCHOOL_URL', env.get('SCHOOL_URL', 'http://localhost:5190/site')) + '/?' + q
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
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.add_init_script(path=os.path.join(here, 'signs_audit_init.js'))
    if os.environ.get('BOARDS'):      # (serve another boards.js to this page only: the lettering helpers as they were, for a before-and-after)
        body = open(os.environ['BOARDS']).read(); pg.route('**/src/boards.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=body))
    pg.goto(url)
    pg.wait_for_function('window.__house && window.house', timeout=120000)
    pg.wait_for_function('window.__ready === true', timeout=120000)
    time.sleep(3)
    views = os.environ.get('VIEWS')      # VIEWS=<file.json>: no audit, only pictures: [[name, x, y, z, nx, nz, feet back, feet across], ...] (a point, the way it faces)
    if views:
        import math
        os.makedirs(os.environ['SHOTS'], exist_ok=True); pg.set_viewport_size({'width': int(os.environ.get('W', 1280)), 'height': int(os.environ.get('H', 760))})
        pg.evaluate("() => { for (const d of window.__house.campus.doors ?? []) if (!d.fixed) { d.isOpen = true; if (d.stop) d.stop.off = true; } }")
        for name, x, y, z, nx, nz, back, across in json.load(open(views)):
            ex, ez = x + nx * back, z + nz * back
            fl = pg.evaluate("([x, z, y]) => { const H = window.__house; let b = -1e9; for (const s of H.surfaces) { if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue; const h = s.ramp ? s.h + (s.h2 - s.h) * (s.ax === 'x' ? (s.x1 - x) / (s.x1 - s.x0) : (s.z1 - z) / (s.z1 - s.z0)) : s.h; if (h <= y && h > b) b = h; } return b > -1e8 ? b : H.groundAt(x, z); }", [ex, ez, y + 1])
            dx, dy, dz = x - ex, y - (fl + 4.85), z - ez; hd = math.hypot(dx, dz); d = math.hypot(hd, dy); fov = max(5, min(60, 2 * math.degrees(math.atan(across / 2 / d / 1.5))))
            pg.evaluate("([x, y, z, yaw, pitch, fov]) => { const H = window.__house; H.setView({ walk: [x, y, z, yaw, pitch] }); H.camera.fov = fov; H.camera.updateProjectionMatrix(); }", [ex, fl, ez, math.atan2(-dx, -dz), math.atan2(dy, hd), fov])
            time.sleep(float(os.environ.get('WAIT', 2.5))); pg.screenshot(path=os.path.join(os.environ['SHOTS'], name + '.jpg'), type='jpeg', quality=88)
            print(name, [round(v, 1) for v in (ex, fl, ez, d, fov)], pg.evaluate("() => [...document.querySelectorAll('.staff-bubble.on')].map(e => { const b = e.getBoundingClientRect(); return [e.className.replace('staff-bubble', '').trim(), e.innerText.slice(0, 70), Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; })"))
        b.close(); sys.exit(0)
    res = pg.evaluate(open(os.path.join(here, 'signs_audit.js')).read())
    # pictures, in the same page (one render slot, held once): SHOTS=<dir> takes a close picture of every thing the
    # audit failed, of every chalkboard and of every card and label in a case (PICK=fails,chalk,cases,all or a
    # regular expression on kind/room/text), each from where the audit found a visitor can stand, with the lens
    # drawn in until the thing fills the frame. The index (name, what, where, issues) is written beside them.
    shots = os.environ.get('SHOTS')
    if shots:
        import math, re
        os.makedirs(shots, exist_ok=True); pick = os.environ.get('PICK', 'fails,chalk,cases').split(','); index = []; seen = []
        def want(g):
            if not g.get('pic') or not g.get('p'): return False
            hay = '%s|%s|%s|%s' % (g['kind'], g['room'], g.get('text'), ' '.join(g['src']))
            for k in pick:
                if k == 'all' or (k == 'fails' and any(i['fail'] for i in g['issues'])) or (k == 'chalk' and g['kind'] == 'chalkboard') or (k == 'cases' and 'exhibits' in ' '.join(g['src'])): return True
                if k not in ('all', 'fails', 'chalk', 'cases') and re.search(k, hay, re.I): return True
            return False
        todo = [g for g in res['signs'] if want(g)][:int(os.environ.get('MAXSHOTS', 400))]
        pg.set_viewport_size({'width': int(os.environ.get('W', 1000)), 'height': int(os.environ.get('H', 640))})
        pg.evaluate("() => { window.house.setHour(13); for (const d of window.__house.campus.doors ?? []) if (!d.fixed) { d.isOpen = true; if (d.stop) d.stop.off = true; } }")
        for n, g in enumerate(todo):
            v, p = g['pic'], g['p']
            ex, ez = v['x'], v['z']; ey = v['fl'] + 4.85; dx, dy, dz = p[0] - ex, p[1] - ey, p[2] - ez; hd = math.hypot(dx, dz); d = math.hypot(hd, dy)
            if any(abs(ex - a) < 0.3 and abs(ez - b) < 0.3 and abs(p[0] - c) < 0.5 and abs(p[1] - e) < 0.5 and abs(p[2] - f) < 0.5 for a, b, c, e, f in seen): continue      # (one picture of things that sit together)
            seen.append((ex, ez, p[0], p[1], p[2]))
            size = max(g['w'], g['h'] * 1.5, 0.9) * float(os.environ.get('ROOM', 2.0)); fov = max(6, min(56, 2 * math.degrees(math.atan(size / 2 / d))))
            pg.evaluate("([x, y, z, yaw, pitch, fov]) => { const H = window.__house; H.setView({ walk: [x, y, z, yaw, pitch] }); H.camera.fov = fov; H.camera.updateProjectionMatrix(); }", [ex, v['fl'], ez, math.atan2(-dx, -dz), math.atan2(dy, hd), fov])
            time.sleep(float(os.environ.get('WAIT', 0.9)))
            name = '%03d_%s.jpg' % (n, re.sub(r'[^a-z0-9]+', '_', (g['kind'] + '_' + g['room'] + '_' + str(g.get('text') or ''))[:60].lower()).strip('_'))
            pg.screenshot(path=os.path.join(shots, name), type='jpeg', quality=82)
            index.append({'file': name, 'kind': g['kind'], 'room': g['room'], 'text': g.get('text'), 'src': g['src'], 'from_ft': v['d'], 'issues': [i['say'] for i in g['issues']]})
        json.dump(index, open(os.path.join(shots, 'index.json'), 'w'), indent=1)
        print('%d pictures in %s' % (len(index), shots))
    b.close()
lock.close()
for e in errs[:8]: print('page:', e[:300])
json.dump(res, open(out, 'w'), indent=1)
signs, labels = res['signs'], res['labels']
print('%d lettered things, %d prompts, %d triangles, %.0f s in the page%s' % (len(signs), len(labels), res['tris'], res['ms'] / 1000, '' if not res['pendingLeft'] else ' (%d things had not arrived)' % res['pendingLeft']))
kinds, files = collections.Counter(), collections.defaultdict(collections.Counter)
for g in signs + labels:
    for i in g['issues']:
        k = i['t'] + ('' if i['fail'] else ' (note)'); kinds[k] += 1
        files[(i.get('at') or ([s for s in g['src'] if 'exhibits_kit' not in s] or g['src'] or ['?'])[0]).split(':')[0]][k] += 1
print('by kind:', ', '.join('%s %d' % kv for kv in kinds.most_common()))
for f, c in sorted(files.items()): print('  %-44s %s' % (f, ', '.join('%s %d' % kv for kv in c.most_common())))
print('helpers warned %d times; %d strings off the edge of other canvases' % (len(res['warnings']), len(res['loose'])))
print(out)
