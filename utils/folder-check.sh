#!/bin/sh
# Layer 4, test. Refuse a folder under src, tests, utils or config that holds more than ten items.
#
# An item is a file or a folder directly inside it, counted over what git tracks or would track: a
# file the repository ignores is not counted, and a path the index still names but the disk no
# longer holds is not counted either. A copy of the tree that is no git checkout is counted by the
# files it holds. A folder over the line is split into folders named for what they hold.
# tests/checks/tree/size.test.ts runs this script, and holds its rule on a tree of its own.

set -e
cd "$(dirname "$0")/.."

# The paths to count: what git tracks or would track, or, in a copy that is no git checkout, every
# file on disk under the four folders.
paths() {
    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        git ls-files -co --exclude-standard -- src tests utils config | while IFS= read -r path; do
            if [ -e "$path" ]; then printf '%s\n' "$path"; fi
        done
    else
        find src tests utils config \( -type f -o -type l \) 2> /dev/null
    fi
}

paths | awk -F/ '
{
    parent = ""
    for (i = 1; i < NF; i++) {
        parent = (parent == "" ? $i : parent "/" $i)
        key = parent SUBSEP $(i + 1)
        if (!(key in seen)) {
            seen[key] = 1
            count[parent]++
        }
    }
}
END {
    bad = 0
    for (dir in count) {
        if (count[dir] > 10) {
            print dir " holds " count[dir] " items, over the ten a folder may hold"
            bad = 1
        }
    }
    exit bad
}
'
