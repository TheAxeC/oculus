// Layer 2, client-state tests. What the board knows of a project's documents: whether its README
// is there to open, the Markdown its tab can draw, the documents it has not got, and the day the
// newest was written.

import { describe, expect, it } from 'vitest';

import {
    absentDocs,
    hasReadme,
    markdownDocNames,
    newestDocDate
} from '../../../../src/lib/state/boards/board/index.ts';
import type { Project } from '../../../../src/lib/data/model/index.ts';

/** A project holding the given documents and nothing else of note. */
function withDocs(
    docs: { name: string; present: boolean; mtime?: number }[],
    present = 0
): Project {
    return { docs, present: Array.from({ length: present }, () => ({})) } as unknown as Project;
}

describe('the documents of a project', () => {
    // revert: src/lib/state/boards/board/items.ts:171 => return project.docs.some((doc) => doc.name === 'README.md');
    it('have a README to open only when it is there', () => {
        expect(hasReadme(withDocs([{ name: 'README.md', present: true }]))).toBe(true);
        expect(hasReadme(withDocs([{ name: 'README.md', present: false }]))).toBe(false);
    });

    // revert: src/lib/state/boards/board/items.ts:180 => .filter((doc) => doc.name.endsWith('.md'))
    it('draw the Markdown that is there, then the narrative when the project has one', () => {
        const docs = [
            { name: 'README.md', present: true },
            { name: 'NOTES.md', present: false },
            { name: 'data.csv', present: true }
        ];
        expect(markdownDocNames(withDocs(docs), 'PRESENT.md')).toEqual(['README.md']);
        expect(markdownDocNames(withDocs(docs, 1), 'PRESENT.md')).toEqual([
            'README.md',
            'PRESENT.md'
        ]);
        expect(absentDocs(withDocs(docs)).map((one) => one.name)).toEqual(['NOTES.md']);
    });

    // revert: src/lib/state/boards/board/items.ts:193 => return new Date(newest).toISOString().slice(0, 10);
    it('were last written on the day of the newest, and on no day when none says when', () => {
        const day = Date.UTC(2026, 8, 20, 12);
        expect(
            newestDocDate(
                withDocs([
                    { name: 'a', present: true, mtime: day },
                    { name: 'b', present: false }
                ])
            )
        ).toBe('2026-09-20');
        expect(newestDocDate(withDocs([{ name: 'a', present: false }]))).toBe('');
    });
});
