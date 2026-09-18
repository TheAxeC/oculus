#!/bin/sh
# Layer 4, test. Prove that a run leaves no scratch directory behind.
#
# Each suite runs with TMPDIR pointed at a directory of its own, made empty for this run, and the
# count is taken inside that directory: what another worktree's run is doing in the machine's shared
# temporary directory cannot turn this red, and a leak of this run's own cannot hide among the
# leftovers already there.
#
# The roots are made under /tmp rather than under the machine's own temporary directory because a
# unix socket path is capped near 104 characters, and the terminal suite opens a tmux socket inside
# TMPDIR; a deep private root would fail that suite for a reason that has nothing to do with the
# count.

set -e
cd "$(dirname "$0")/.."

node_root=$(mktemp -d /tmp/oculus-count-XXXXXX)
browser_root=$(mktemp -d /tmp/oculus-count-XXXXXX)
trap 'rm -rf "$node_root" "$browser_root"' EXIT

left() {
    find "$1" -mindepth 1 -maxdepth 1 -type d -name 'oculus-*' | wc -l | tr -d ' '
}

red=0

echo "node before $(left "$node_root")"
if ! TMPDIR="$node_root" npm test >/dev/null 2>&1; then
    echo 'the node suite is red; the count below is still the count'
    red=1
fi
echo "node after $(left "$node_root")"

# The browser layer serves on one port with strictPort, so a second worktree's run holds it: waiting
# for it keeps the count from reading another step's server as this suite being red.
waited=0
while lsof -iTCP:8792 -sTCP:LISTEN >/dev/null 2>&1 && [ "$waited" -lt 1800 ]; do
    sleep 10
    waited=$((waited + 10))
done

echo "browser before $(left "$browser_root")"
if ! TMPDIR="$browser_root" npx playwright test >/dev/null 2>&1; then
    echo 'the browser suite is red; the count below is still the count'
    red=1
fi
echo "browser after $(left "$browser_root")"

# A red suite is a red command: the verification list reads the exit status, and a count taken over a
# suite that did not finish says nothing about what a whole run leaves behind.
if [ "$(left "$node_root")" = 0 ] && [ "$(left "$browser_root")" = 0 ] && [ "$red" = 0 ]; then
    exit 0
fi
exit 1
