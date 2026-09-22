#!/bin/sh
# Layer 4, test. Refuse a source file over the size line, and hold a listed one to the count it was
# recorded at.
#
# The line is 900 for a file and 540 for a component, so a file is caught while it still has room to
# be split, and every source file the tree holds is measured: a script under bin/ as much as a
# module under src/. bin/size-allow.txt names what is over it today, each entry with its count: a
# listed file that grows past its count fails, one that falls back under the line comes off the
# list, and an entry naming a file the tree no longer holds fails. tests/checks/tree/size.test.ts
# holds the same rule over the same list, and its last case runs this script.

set -e
cd "$(dirname "$0")/.."

find src tests bin \( -type f -o -type l \) \( -name '*.ts' -o -name '*.svelte' -o -name '*.mjs' -o -name '*.js' -o -name '*.sh' \) | xargs wc -l | awk -v allow=bin/size-allow.txt '
BEGIN {
    while ((getline line < allow) > 0) {
        if (line ~ /^#/ || line == "") continue
        if (split(line, part, " ") != 2 || part[2] !~ /^[0-9]+$/) {
            print "no count on the allow line: " line
            bad = 1
            continue
        }
        cap[part[1]] = part[2]
    }
}
$2 == "total" { next }
{
    over = ($1 > 900 || ($2 ~ /\.svelte$/ && $1 > 540))
    if ($2 in cap) {
        if ($1 > cap[$2]) {
            print $2 " is " $1 " lines, over the " cap[$2] " it was recorded at"
            bad = 1
        } else if (!over) {
            print $2 " is " $1 " lines, back under the line, so it comes off the list"
            bad = 1
        }
        delete cap[$2]
        next
    }
    if (over) {
        print $2 " is " $1 " lines, over the line and not on the list"
        bad = 1
    }
}
END {
    for (name in cap) {
        print "the list names " name ", which the tree does not hold"
        bad = 1
    }
    exit bad
}
'
