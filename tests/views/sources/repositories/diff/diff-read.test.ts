// Layer 4, view tests. The key a diff pane's read is made under (readKeyOf in diff-read.ts) moves
// with the hash of the file on disk for the comparison of a save conflict and for no other pane.
// The pane reads again when its key changes, so a key that missed a move of the file would leave
// the left side of the conflict showing the text the disk held before, and a reader who then
// presses Overwrite would write over a change they never saw. A key that moved for any other pane
// would read a working-tree diff or a Replace Preview again at every change of its file.

import { describe, expect, it } from 'vitest';
import type { ReplacePreview } from '../../../../../src/lib/data/file-ops.ts';
import { readKeyOf } from '../../../../../src/lib/views/sources/repositories/diff/diff-read.ts';

const PREVIEW: ReplacePreview = {
    query: { q: 'old', word: false, case: false, regex: false, under: '' },
    replace: 'new',
    preserveCase: false,
    hits: [{ line: 3, at: 4 }]
};

/** The hash the disk answers for the one file, read again by a later call of the key. */
function disk(hash: string): (root: string, path: string) => string {
    return () => hash;
}

describe('the read key of a diff pane', () => {
    const pane = { id: 'diff:hub:notes.md', root: 'hub', path: 'notes.md' };

    it('changes with the disk hash for the compare of a save conflict', () => {
        const held = { ...pane, unsaved: 'source:hub:notes.md' };
        expect(readKeyOf(held, disk('aaaa'))).not.toBe(readKeyOf(held, disk('bbbb')));
        expect(readKeyOf(held, disk('aaaa'))).toBe(readKeyOf(held, disk('aaaa')));
    });

    it('stays the same for a working-tree compare when the file changes', () => {
        expect(readKeyOf(pane, disk('aaaa'))).toBe(readKeyOf(pane, disk('bbbb')));
    });

    it('stays the same for a Replace Preview when the file changes', () => {
        const held = { ...pane, replace: PREVIEW };
        expect(readKeyOf(held, disk('aaaa'))).toBe(readKeyOf(held, disk('bbbb')));
        expect(readKeyOf(held, disk('aaaa'))).not.toBe(readKeyOf(pane, disk('aaaa')));
    });
});
