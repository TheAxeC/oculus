// Layer 2, client state test. How the History view names the file of a row: the record holds the
// absolute path, a file under the primary's folder reads as its path inside it, a file under
// another served folder as the folder's name and the path inside it, and a file outside every
// served folder as its absolute path.
//
// What this does NOT cover: the fetch of the log and the filter of its rows.

import { describe, expect, it } from 'vitest';
import { fileShown } from '../../../src/lib/state/sessions/changes.svelte.ts';

const ROOTS = [
    { key: 'research-hub', dir: '/work/research-hub' },
    { key: 'lab', dir: '/work/lab' }
];

describe('the file of a History row', () => {
    it.each([
        [
            'a file of the primary',
            '/work/research-hub/.oculus/data/academic/tasks.yml',
            'research-hub',
            '.oculus/data/academic/tasks.yml'
        ],
        [
            'a file of another served folder',
            '/work/lab/.oculus/data/academic/tasks.yml',
            'research-hub',
            'lab/.oculus/data/academic/tasks.yml'
        ],
        [
            'the same file after the primary moved',
            '/work/research-hub/.oculus/data/academic/tasks.yml',
            'lab',
            'research-hub/.oculus/data/academic/tasks.yml'
        ],
        [
            'a file outside the served folders',
            '/home/me/.oculus/sessions.json',
            'lab',
            '/home/me/.oculus/sessions.json'
        ]
    ])('names %s', (_row, file, primary, shown) => {
        expect(fileShown(file, ROOTS, primary)).toBe(shown);
    });

    it('names a file by its absolute path when the workspace has no primary and no folder holds it', () => {
        expect(fileShown('/work/none/x.yml', ROOTS, null)).toBe('/work/none/x.yml');
    });
});
