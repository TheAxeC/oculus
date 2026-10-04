// Layer 1, data tests. The shared LaTeX reader: the magic comments at the head of a file, the
// sections and the include commands of a text, what it reads of a text the parser refuses, and the
// lazy binding the page reads through. The server's root and outline and the Files Outline all read
// through it, so each case here is a rule they share.

import { latexParser } from 'latex-utensils';
import { describe, expect, it } from 'vitest';
import {
    lazyReader,
    magicCommentsWith,
    readTexWith,
    scanSections,
    uncommented,
    type Parse,
    type ParserModule
} from '../../../src/lib/data/prose/latex.ts';
import { APPENDIX, FUNDING, MOTOR } from './latex-headings.ts';

const parse: Parse = (text, options) => latexParser.parse(text, options);
const magicComments = (text: string): ReadonlyMap<string, string> => magicCommentsWith(parse, text);
const readTex = (text: string): ReturnType<typeof readTexWith> => readTexWith(parse, text);

describe('magicComments', () => {
    it('reads root and program in any case of TEX, with the spaces free and the value trimmed', () => {
        const text =
            '% !TEX root = ../../thesis.tex \n%!TeX program=LuaLaTeX\n\\documentclass{article}\n';

        expect([...magicComments(text)]).toEqual([
            ['root', '../../thesis.tex'],
            ['program', 'LuaLaTeX']
        ]);
    });

    it('reads the head of a file that starts with a byte order mark', () => {
        const text = '\uFEFF% !TEX program = xelatex\n\\documentclass{article}\n';

        expect([...magicComments(text)]).toEqual([['program', 'xelatex']]);
    });

    it('reads only the block before the first line that is neither blank nor a comment', () => {
        const text = '\\documentclass{article}\n% !TEX program = xelatex\n';

        expect(magicComments(text).size).toBe(0);
    });

    it('keeps the first comment naming a key', () => {
        const text = '% !TEX program = xelatex\n% !TEX program = lualatex\n';

        expect(magicComments(text).get('program')).toBe('xelatex');
    });

    it('is not hidden by a body the parser refuses', () => {
        const text = '% !TEX root = main.tex\n\\section{A\n';

        expect(readTex(text).refused).toBe(true);
        expect(magicComments(text).get('root')).toBe('main.tex');
    });

    it('reads a head of comments alone and a text with no comment as none', () => {
        expect(magicComments('% !TEX root = a.tex').get('root')).toBe('a.tex');
        expect(magicComments('plain text').size).toBe(0);
    });
});

describe('readTex sections', () => {
    it('reads level 0 to 6 for part to subparagraph, starred forms and optional titles included', () => {
        const text = [
            '\\part{P}',
            '\\chapter*{C}',
            '\\section[short]{S}',
            '\\subsection{SS}',
            '\\subsubsection{SSS}',
            '\\paragraph{Pa}',
            '\\subparagraph{Sp}',
            ''
        ].join('\n');

        expect(readTex(text).sections).toEqual([
            { level: 0, title: 'P', line: 1 },
            { level: 1, title: 'C', line: 2 },
            { level: 2, title: 'S', line: 3 },
            { level: 3, title: 'SS', line: 4 },
            { level: 4, title: 'SSS', line: 5 },
            { level: 5, title: 'Pa', line: 6 },
            { level: 6, title: 'Sp', line: 7 }
        ]);
    });

    it('takes the title as written: comments cut off, lines joined, markup kept', () => {
        const text = '\\section{One % note\n  two \\emph{x}}\n';

        expect(readTex(text).sections).toEqual([{ level: 2, title: 'One two \\emph{x}', line: 1 }]);
    });

    it('skips a commented command, a verbatim body and an empty title', () => {
        const text =
            '% \\section{no}\n\\begin{verbatim}\n\\section{no}\n\\end{verbatim}\n\\section{}\n\\section{yes}\n';

        expect(readTex(text).sections).toEqual([{ level: 2, title: 'yes', line: 6 }]);
    });

    it.each([
        [
            'a title whose brace never closes',
            '\\section{B}\n\\section{A\n',
            [{ level: 2, title: 'B', line: 1 }]
        ],
        [
            'a stray dollar sign',
            '\\section{A}\nprice $5\n\\section{B}\n',
            [
                { level: 2, title: 'A', line: 1 },
                { level: 2, title: 'B', line: 3 }
            ]
        ],
        ['an include, which the line scan does not read', '\\input{a}\nprice $5\n', []]
    ])(
        'reads the sections of a text the parser refuses by a line scan: %s',
        (_row, text, sections) => {
            expect(readTex(text)).toEqual({ refused: true, sections, includes: [] });
        }
    );

    it('does not read a section that a per-cent sign comments out, in a refused text', () => {
        const read = readTex('% \\section{no}\n\\section{yes} % \\section{no}\nprice $5\n');

        expect(read.refused).toBe(true);
        expect(read.sections).toEqual([{ level: 2, title: 'yes', line: 2 }]);
    });

    it('does not read a verbatim body in a refused text', () => {
        const text =
            '\\begin{verbatim}\n\\section{no}\n\\end{verbatim}\nprice $5\n\\section{yes}\n';

        expect(readTex(text).sections).toEqual([{ level: 2, title: 'yes', line: 5 }]);
    });

    it('reads the headings of three real files the parser refuses: 20, 18 and 21', () => {
        for (const [fixture, count] of [
            [FUNDING, 20],
            [MOTOR, 18],
            [APPENDIX, 21]
        ] as const) {
            const read = readTex(`${fixture.lines.join('\n')}\n\\enddocument}\n`);

            expect(read.refused).toBe(true);
            expect(read.sections).toHaveLength(count);
            expect(read.sections.map((one) => [one.title, one.level])).toEqual(fixture.headings);
            expect(read.sections.map((one) => one.line)).toEqual(
                fixture.lines.map((_, at) => at + 1)
            );
        }
    });
});

describe('readTex includes', () => {
    it('reads input, include, subfile and import with their paths and lines', () => {
        const text =
            '\\input{sec/b}\n\\include{c}\n\\subfile{d/e}\n\\import{dir/}{f}\n% \\input{no}\n';

        expect(readTex(text).includes).toEqual([
            { command: 'input', path: 'sec/b', line: 1 },
            { command: 'include', path: 'c', line: 2 },
            { command: 'subfile', path: 'd/e', line: 3 },
            { command: 'import', path: 'dir/f', line: 4 }
        ]);
    });
});

describe('uncommented', () => {
    it('cuts at the first per-cent sign that is not escaped', () => {
        expect(uncommented('a 50\\% b % c')).toBe('a 50\\% b ');
        expect(uncommented('plain')).toBe('plain');
    });
});

describe('scanSections', () => {
    it('agrees with the parser on a text the parser accepts', () => {
        const text =
            '\\section{One % note\n  two}\n% \\section{no}\n\\subsection*{T}\n\\paragraph[s]{P}\n';

        expect(scanSections(text)).toEqual(readTex(text).sections);
    });

    it('skips a title whose brace never closes and an empty title', () => {
        expect(scanSections('\\section{A\n\\section{}\n')).toEqual([]);
    });
});

const parserModule: ParserModule = { latexParser };

describe('lazyReader', () => {
    it('does not import until it is called, and the first call waits for the import', async () => {
        let imports = 0;
        let release: (loaded: ParserModule) => void = () => undefined;
        const read = lazyReader(() => {
            imports += 1;
            return new Promise<ParserModule>((resolve) => {
                release = resolve;
            });
        });
        expect(imports).toBe(0);

        let answered = false;
        const first = read('\\section{A}\n').then((one) => {
            answered = true;
            return one;
        });
        await Promise.resolve();
        expect(imports).toBe(1);
        expect(answered).toBe(false);

        release(parserModule);
        expect((await first).sections).toEqual([{ level: 2, title: 'A', line: 1 }]);
    });

    it('imports once for a second call and for a call made while the import is out', async () => {
        let imports = 0;
        const read = lazyReader(() => {
            imports += 1;
            return Promise.resolve(parserModule);
        });

        await Promise.all([read('\\section{A}'), read('\\section{B}')]);
        await read('\\section{C}');

        expect(imports).toBe(1);
    });

    it('reads a CommonJS module that holds the parser under default', async () => {
        const read = lazyReader(() => Promise.resolve({ default: { latexParser } }));

        expect((await read('\\chapter{A}')).sections).toEqual([{ level: 1, title: 'A', line: 1 }]);
    });

    it('rejects while the import fails and imports again on the next call', async () => {
        let imports = 0;
        const read = lazyReader(() => {
            imports += 1;
            return imports === 1
                ? Promise.reject(new Error('offline'))
                : Promise.resolve(parserModule);
        });

        await expect(read('\\section{A}')).rejects.toThrow('offline');
        expect((await read('\\section{A}')).sections).toHaveLength(1);
        expect(imports).toBe(2);
    });
});
