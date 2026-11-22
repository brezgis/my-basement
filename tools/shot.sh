#!/bin/bash
"$(dirname "$0")/clean_cache.sh"
# Take a screenshot of the school with headless Chrome on the GPU.
#   tools/shot.sh <out.png> "<query string>" [width height]
#   view=x,feetY,z,yaw,pitch   stand at world x, z (x north, z east) with your feet at feetY; yaw 0 looks west (-z),
#                              1.5708 south (-x), -1.5708 north (+x), 3.14159 east (+z); pitch in radians, up is +
#   at=landing|green|air|above|snow|library|stone   a named viewpoint (a site's id stands you at its door)
#   only=stone   build only that building     sites   peg out the sites     open   doors stand open
#   time=17.9 or time=dusk (the school follows the clock otherwise)     fps   draw calls and triangles in the caption
# It prints the page's console errors, then the size and name of the picture. Runs in virtual time: only about a
# dozen frames are drawn, so nothing that moves can be tested this way (use tools/drive.py).
[ -f "$(dirname "$0")/local.env" ] && . "$(dirname "$0")/local.env"      # SCHOOL_URL, SCHOOL_LOCKS for this machine
BASE=${SCHOOL_URL:-http://localhost:5190/site}
OUT=$1; W=${3:-1280}; H=${4:-760}
URL="$BASE/?$2"
LOCKDIR=${SCHOOL_LOCKS:-/tmp/claude-1002/my_house_shot_locks}; mkdir -p "$LOCKDIR"      # shared with the house and the town: two renders at a time
while :; do
  for n in 1 2; do exec 9>"$LOCKDIR/slot$n"; if flock -n 9; then break 2; fi; done
  sleep $((3 + RANDOM % 5))
done
nice -n 19 timeout ${TO:-240} google-chrome --headless=new --no-sandbox --password-store=basic --use-gl=angle --use-angle=${ANGLE:-gl-egl} --enable-unsafe-swiftshader --ignore-gpu-blocklist --window-size=$W,$H --virtual-time-budget=${VT:-25000} --enable-logging=stderr --v=0 --screenshot="$OUT" "$URL" 2>&1 | grep -E "CONSOLE|Uncaught|rror" | grep -v -E "dbus|gcm|GCM|registration|sandbox|DEPRECATED|Vulkan|vaapi|udev|radv|renderD" | head -${LINES_MAX:-12}
ls -la "$OUT" | awk '{print $5, $9}'
