// outlineOf: the sections of a main file followed through its includes, over synthetic folders
// under the system temporary directory. Each file is read once, a file that is missing or outside
// the root is left out, and a file the parser refuses is named.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { OUTLINE_MAX_BYTES, outlineOf } from '../../../src/lib/server/content/latex/outline.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

/** A scratch root holding the given files, as its real path. */
function planted(files: Record<string, string>): string {
    return realpathSync(plantScratch('oculus-latex-outline-', files));
}

describe('outlineOf', () => {
    it('expands each include where it stands and reads a self include once', () => {
        const dir = planted({
            'main.tex': [
                '\\documentclass{article}',
                '\\section{A}',
                '\\input{sec/b}',
                '\\import{dir/}{c}',
                '\\input{main}',
                '\\section{Z}',
                ''
            ].join('\n'),
            'sec/b.tex': 'text\n\\subsection*{B}\n',
            'dir/c.tex': '\\section{C}\n'
        });

        const found = outlineOf(dir, dir, join(dir, 'main.tex'));

        expect(found.sections).toEqual([
            { level: 2, title: 'A', file: 'main.tex', line: 2 },
            { level: 3, title: 'B', file: 'sec/b.tex', line: 2 },
            { level: 2, title: 'C', file: 'dir/c.tex', line: 1 },
            { level: 2, title: 'Z', file: 'main.tex', line: 6 }
        ]);
        expect(found).toMatchObject({ partial: [], unread: [] });
    });

    it('leaves out a missing include and an include outside the root', () => {
        const outside = planted({ 'x.tex': '\\section{Outside}\n' });
        const dir = planted({
            'main.tex': `\\section{A}\n\\input{gone}\n\\input{${join(outside, 'x')}}\n\\input{../x}\n`
        });

        const found = outlineOf(dir, dir, join(dir, 'main.tex'));

        expect(found.sections.map((one) => one.title)).toEqual(['A']);
        expect(found).toMatchObject({ partial: [], unread: [] });
    });

    // Revert: name a file past the size limit in `partial` in server/content/latex/outline.ts.
    it('names a file the parser refuses as read in part and a file past the size limit as not read', () => {
        const dir = planted({
            'main.tex': '\\section{A}\n\\input{bad}\n\\input{big}\n',
            'bad.tex': '\\section{B\n',
            'big.tex': `\\section{Big}\n${'x'.repeat(OUTLINE_MAX_BYTES)}\n`
        });

        const found = outlineOf(dir, dir, join(dir, 'main.tex'));

        expect(found.sections.map((one) => one.title)).toEqual(['A']);
        expect(found).toMatchObject({ partial: ['bad.tex'], unread: ['big.tex'] });
    });

    it('lists the sections of a file the parser refuses, names it, and follows none of its includes', () => {
        const dir = planted({
            'main.tex': '\\section{A}\n\\input{bad}\n\\section{D}\n',
            'bad.tex': '\\section{B}\nprice $5\n\\input{deep}\n\\section{C}\n',
            'deep.tex': '\\section{Deep}\n'
        });

        const found = outlineOf(dir, dir, join(dir, 'main.tex'));

        expect(found.sections.map((one) => [one.title, one.file])).toEqual([
            ['A', 'main.tex'],
            ['B', 'bad.tex'],
            ['C', 'bad.tex'],
            ['D', 'main.tex']
        ]);
        expect(found).toMatchObject({ partial: ['bad.tex'], unread: [] });
    });
});
