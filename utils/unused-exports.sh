#!/bin/sh
# Layer 4, test. Print the exports and exported types that nothing in the production code imports.
#
# This runs the knip the project pins (a devDependency) over the production entry points, reading
# SvelteKit routes and components as it does, and prints what knip finds. Whether an export should
# go is a reader's call, so the exit status is 0 whether or not knip found any (knip itself exits 1
# for findings), and 2, with the message of the shell or of knip, when knip did not run: no
# node_modules, no knip in it, or a configuration knip refuses. Run from anywhere; it works in
# oculus's folder.

cd "$(dirname "$0")/.." || exit 2

if [ ! -d node_modules ]; then
    echo "node_modules is not here; run npm install in $(pwd)" >&2
    exit 2
fi
if [ ! -x node_modules/.bin/knip ]; then
    echo "knip is not installed in $(pwd)/node_modules; run npm install" >&2
    exit 2
fi

node_modules/.bin/knip --production --include exports,types --reporter compact --no-progress
status=$?
if [ "$status" -gt 1 ]; then
    echo "knip stopped with status $status" >&2
    exit 2
fi
exit 0
