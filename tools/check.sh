#!/bin/bash
# Syntax-check every module (node 22 from nvm; the system node is too old for this code), then check that every
# relative import names a file that exists. Run from anywhere.
cd "$(dirname "$0")/.."
N=~/.nvm/versions/node/v22.22.0/bin/node; T=$(mktemp -d); ok=1
for f in $(find site/src -name '*.js'); do
  cp "$f" "$T/x.mjs"
  if ! $N --check "$T/x.mjs" >/dev/null 2>&1; then ok=0; $N --check "$T/x.mjs" 2>&1 | grep -v "^$" | sed "s#$T/x.mjs#$f#" | head -6; fi
  for imp in $(grep -oE "(from|import\() *'\.{1,2}/[^']+'" "$f" | grep -oE "\.{1,2}/[^']+"); do
    [ -f "$(dirname "$f")/$imp" ] || { ok=0; echo "$f: imports $imp, which does not exist"; }
  done
done
python3 "$(dirname "$0")/preload.py" --check || ok=0      # (the module list in index.html: tools/preload.py)
rm -rf "$T"; [ $ok = 1 ] && echo "all modules parse, all imports resolve" || exit 1
