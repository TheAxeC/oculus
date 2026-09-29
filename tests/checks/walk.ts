// Layer 4, test helper. Every file under a folder, the one walk the checks over the tree share.
//
// fs.globSync leaves out a name that starts with a dot when it expands `**/*`, and has no option to
// keep it, so the dot names, and everything under a folder with one, are asked for by patterns of
// their own. A check that reads a folder's files reads a dot file too: a `.x.ts` under src is code
// like any other. A symbolic link is listed as the file it is and is not followed.

import { globSync } from 'node:fs';
import { join, relative } from 'node:path';

/** The patterns that together reach every path under a folder, dot names included. */
const EVERY = ['**/*', '**/.*', '**/.*/**/*'];

/** Every file under a folder, as a path relative to it, in name order. */
export function treeFiles(root: string): string[] {
    const found = new Set<string>();
    for (const entry of globSync(EVERY, { cwd: root, withFileTypes: true })) {
        if (!entry.isDirectory()) found.add(relative(root, join(entry.parentPath, entry.name)));
    }
    return [...found].sort();
}
