// Layer 4, test. The shared walk lists every file under a folder, a dot file and the files of a dot
// folder among them, and no folder.

import { expect } from 'vitest';
import { it, plantScratch } from '../fixtures/scratch.ts';
import { treeFiles } from './walk.ts';

// Revert: in tests/checks/walk.ts, keep `**/*` alone in EVERY, and the dot file and the files of
// the dot folder are left out.
it('lists a dot file, the files of a dot folder, and every other file, in name order', () => {
    const dir = plantScratch('oculus-walk-', {
        '.x': 'dot file',
        '.h/y.ts': 'under a dot folder',
        '.h/.z/w.ts': 'under two',
        'a/.b.svelte': 'a dot file down a plain folder',
        'a/c.ts': 'plain'
    });
    expect(treeFiles(dir)).toEqual(['.h/.z/w.ts', '.h/y.ts', '.x', 'a/.b.svelte', 'a/c.ts']);
});
