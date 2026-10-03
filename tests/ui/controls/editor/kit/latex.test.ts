// The editor's reading of a LaTeX text: the math span under an offset and the picture a call names
// and which file that is. Pure functions, so every case is a string and an offset.

import { describe, expect, it } from 'vitest';
import {
    mathSpanAt,
    pictureAt,
    pictureFile
} from '../../../../../src/lib/ui/controls/editor/kit/latex.ts';

/** The span at the offset of the first `|` in the text, with that bar taken out. */
function at(marked: string): ReturnType<typeof mathSpanAt> {
    const offset = marked.indexOf('|');
    return mathSpanAt(marked.replace('|', ''), offset);
}

describe('mathSpanAt', () => {
    it('finds inline math between single dollars, inline', () => {
        expect(at('so $x|^2$ here')).toEqual({ start: 3, end: 8, source: 'x^2', display: false });
    });

    it('finds display math between double dollars', () => {
        expect(at('$$a |= b$$')).toMatchObject({ source: 'a = b', display: true });
    });

    it('finds the bracket forms, inline for parentheses and display for square brackets', () => {
        expect(at('\\(a| + b\\)')).toMatchObject({ source: 'a + b', display: false });
        expect(at('\\[ a| \\]')).toMatchObject({ source: ' a ', display: true });
    });

    it.each([
        ['equation', 'equation', 'a'],
        ['equation*', 'equation', 'a'],
        ['align', 'aligned', 'a &= b'],
        ['align*', 'aligned', 'a &= b'],
        ['gather', 'gathered', 'a \\\\ b'],
        ['multline*', 'gathered', 'a \\\\ b']
    ])('finds \\begin{%s} as display math typeset as %s', (name, kind, body) => {
        const text = `x\n\\begin{${name}}\n${body}|\n\\end{${name}}\ny`;

        const span = at(text);

        expect(span?.display).toBe(true);
        const typeset = name.startsWith('equation')
            ? `\n${body}\n`
            : `\\begin{${kind}}\n${body}\n\\end{${kind}}`;
        expect(span?.source).toBe(typeset);
    });

    it('finds nothing on an escaped dollar sign', () => {
        expect(at('costs \\$|5 and \\$6')).toBeNull();
    });

    it('skips an escaped dollar sign and finds the formula after it', () => {
        expect(at('costs \\$5 and $x|$')).toEqual({
            start: 14,
            end: 17,
            source: 'x',
            display: false
        });
    });

    it('finds nothing outside any math', () => {
        expect(at('plain | text with $x$ later')).toBeNull();
    });

    it('does not let a lone dollar sign reach across a blank line', () => {
        expect(at('price $5|\n\nnext $x$')).toBeNull();
    });

    it('does not read math inside a comment', () => {
        expect(at('% $x|$\n$y$')).toBeNull();
    });

    it('takes the second formula when the offset is in the second', () => {
        expect(at('$a$ and $b|$')).toMatchObject({ source: 'b' });
    });

    it('finds nothing for an opening delimiter that never closes', () => {
        expect(at('text $|x without end')).toBeNull();
    });
});

describe('pictureAt', () => {
    it('reads the braced path of an includegraphics call, with or without options', () => {
        expect(pictureAt('\\includegraphics{fig/a}', 5)).toEqual({
            start: 0,
            end: 23,
            path: 'fig/a'
        });
        expect(pictureAt('x \\includegraphics[width=3cm]{ fig/b.png }', 10)?.path).toBe(
            'fig/b.png'
        );
        expect(pictureAt('\\includegraphics*{c}', 3)?.path).toBe('c');
    });

    it('answers none away from a call', () => {
        expect(pictureAt('words \\includegraphics{a} words', 1)).toBeNull();
    });
});

describe('pictureFile', () => {
    /** The files that exist, as a lookup of the callback the resolver is handed. */
    const exists =
        (...files: string[]) =>
        (path: string) =>
            Promise.resolve(files.includes(path));

    it('finds the file a path without an extension names, trying pdf, png, jpg, jpeg in that order', async () => {
        expect(await pictureFile('fig/a', 'ms', exists('ms/fig/a.png'))).toBe('ms/fig/a.png');
        expect(await pictureFile('fig/a', 'ms', exists('ms/fig/a.pdf', 'ms/fig/a.png'))).toBe(
            'ms/fig/a.pdf'
        );
        expect(await pictureFile('a', '', exists('a.jpeg', 'a.jpg'))).toBe('a.jpg');
    });

    it('takes a path that names an extension as it is', async () => {
        expect(await pictureFile('fig/a.png', 'ms', exists('ms/fig/a.png', 'ms/fig/a.pdf'))).toBe(
            'ms/fig/a.png'
        );
    });

    it('answers nothing for a path that leaves the root', async () => {
        expect(await pictureFile('../../etc/x.png', 'ms', exists('x.png', 'etc/x.png'))).toBeNull();
    });

    it('resolves a path with dot segments that stay inside the root', async () => {
        expect(await pictureFile('../fig/a.png', 'ms/sub', exists('ms/fig/a.png'))).toBe(
            'ms/fig/a.png'
        );
    });

    it('refuses an absolute path and a home path even when every file exists', async () => {
        const everything = (): Promise<boolean> => Promise.resolve(true);

        expect(await pictureFile('/x.png', 'ms', everything)).toBeNull();
        expect(await pictureFile('~/x.png', 'ms', everything)).toBeNull();
    });

    it('answers nothing for an absolute path, a missing file and an empty path', async () => {
        expect(await pictureFile('/etc/x.png', 'ms', exists('/etc/x.png', 'etc/x.png'))).toBeNull();
        expect(await pictureFile('~/x.png', 'ms', exists('~/x.png'))).toBeNull();
        expect(await pictureFile('gone', 'ms', exists())).toBeNull();
        expect(await pictureFile('', 'ms', exists('ms'))).toBeNull();
    });
});
