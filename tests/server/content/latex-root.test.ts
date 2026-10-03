// rootOf: the main file a `.tex` file builds through, over synthetic folders under the system
// temporary directory. A file that is a main answers itself; a `% !TEX root` comment is followed
// inside the root; a folder with one main answers it; anything else answers none.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { rootOf } from '../../../src/lib/server/content/latex/root.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const ARTICLE = '\\documentclass{article}\n\\begin{document}\nx\n\\end{document}\n';

/**
 * A scratch root holding the given files, and its real path, which is what rootOf is bounded by.
 */
function planted(files: Record<string, string>): string {
    return realpathSync(plantScratch('oculus-latex-root-', files));
}

describe('rootOf', () => {
    it('answers a main file itself', () => {
        const dir = planted({ 'thesis.tex': ARTICLE, 'other.tex': ARTICLE });

        expect(rootOf(dir, join(dir, 'other.tex'))).toBe(join(dir, 'other.tex'));
    });

    it('follows a root comment with a trailing space two folders up', () => {
        const dir = planted({
            'thesis.tex': ARTICLE,
            'chapters/c6/c6.tex': '% !TeX root = ../../thesis.tex \n\\section{Six}\n'
        });

        expect(rootOf(dir, join(dir, 'chapters/c6/c6.tex'))).toBe(join(dir, 'thesis.tex'));
    });

    it('falls through to the folder rule for a root comment naming a missing file', () => {
        const dir = planted({
            'sec/only.tex': ARTICLE,
            'sec/c.tex': '% !TEX root = gone.tex\n\\section{C}\n'
        });

        expect(rootOf(dir, join(dir, 'sec/c.tex'))).toBe(join(dir, 'sec/only.tex'));
    });

    // Revert: answer null instead of the folder rule when the root comment names a file outside.
    it('falls through to the folder rule for a root comment naming a file outside the root', () => {
        const outside = planted({ 'main.tex': ARTICLE });
        const dir = planted({
            'main.tex': ARTICLE,
            'c.tex': `% !TEX root = ${join(outside, 'main.tex')}\n\\section{C}\n`
        });

        expect(rootOf(dir, join(dir, 'c.tex'))).toBe(join(dir, 'main.tex'));
    });

    it('answers none for a root comment naming a file outside the root when the folder holds no main', () => {
        const outside = planted({ 'main.tex': ARTICLE });
        const dir = planted({
            'c.tex': `% !TEX root = ${join(outside, 'main.tex')}\n\\section{C}\n`
        });

        expect(rootOf(dir, join(dir, 'c.tex'))).toBeNull();
    });

    it('answers the only main of the folder, and none when the folder holds two', () => {
        const one = planted({ 'main.tex': ARTICLE, 'c.tex': '\\section{C}\n' });
        const two = planted({ 'a.tex': ARTICLE, 'b.tex': ARTICLE, 'c.tex': '\\section{C}\n' });

        expect(rootOf(one, join(one, 'c.tex'))).toBe(join(one, 'main.tex'));
        expect(rootOf(two, join(two, 'c.tex'))).toBeNull();
    });

    it('answers none for a cycle of root comments, neither file being a main', () => {
        const dir = planted({
            'only.tex': ARTICLE,
            'a.tex': '% !TEX root = b.tex\n\\section{A}\n',
            'b.tex': '% !TEX root = a.tex\n\\section{B}\n'
        });

        expect(rootOf(dir, join(dir, 'a.tex'))).toBeNull();
    });
});
