// mains, parseLog and buildState over synthetic folders under the system temporary directory: which
// `.tex` files are main files, what a `latexmk -file-line-error` log is read back as, and what one
// main's state says with and without a PDF. Nothing outside that directory is read or written,
// every path written is asserted to be inside it first, and no case runs latexmk.
//
// The log fixtures are the row shapes a real log holds: the `file:line:` error of the file-line
// form, the `!` error with its `l.<n>` context under it, a package warning continued on its own
// name, and a LaTeX warning that names the line it is on.

import { lstatSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    buildState,
    buildStateIn,
    declaresClass,
    mains,
    mainsIn,
    parseLog,
    programOf
} from '../../../src/lib/server/content/latex.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

function scratch(): string {
    const dir = scratchDir('oculus-latex-');
    return dir;
}

/** Write one file under the scratch folder, checked to be inside it before anything is written. */
function write(root: string, rel: string, body: string): string {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return full;
}

/** A five-line article, which is what a main file has to carry to count as one. */
const ARTICLE = '\\documentclass{article}\n\\begin{document}\nx\n\\end{document}\n';

describe('mains', () => {
    it('lists every .tex under manuscript that declares a class, main.tex first', () => {
        const root = scratch();
        write(root, 'manuscript/main.tex', ARTICLE);
        write(root, 'manuscript/supplement.tex', ARTICLE);
        write(root, 'manuscript/highlights.tex', ARTICLE);

        expect(mains(root)).toEqual(['main.tex', 'highlights.tex', 'supplement.tex']);
    });

    it('leaves out a file whose documentclass is commented out', () => {
        const root = scratch();
        write(root, 'manuscript/main.tex', ARTICLE);
        write(root, 'manuscript/notes.tex', '% \\documentclass{article}\nnothing here\n');

        expect(mains(root)).toEqual(['main.tex']);
    });

    it('leaves out an included file that declares no class, and anything not .tex', () => {
        const root = scratch();
        write(root, 'manuscript/main.tex', ARTICLE);
        write(root, 'manuscript/intro.tex', '\\section{Intro}\nwords\n');
        write(root, 'manuscript/main.bbl', ARTICLE);

        expect(mains(root)).toEqual(['main.tex']);
    });

    it('does not descend: a .tex in a folder under manuscript is not a main file', () => {
        const root = scratch();
        write(root, 'manuscript/main.tex', ARTICLE);
        write(root, 'manuscript/sections/one.tex', ARTICLE);

        expect(mains(root)).toEqual(['main.tex']);
    });

    it('counts a main file kept as a symlink, which a directory entry calls a link', () => {
        const root = scratch();
        const real = write(root, 'elsewhere/paper.tex', ARTICLE);
        const link = join(root, 'manuscript', 'main.tex');
        expect(resolve(link).startsWith(resolve(root) + sep)).toBe(true);
        mkdirSync(dirname(link), { recursive: true });
        symlinkSync(real, link);
        expect(lstatSync(link).isSymbolicLink()).toBe(true);

        expect(mains(root)).toEqual(['main.tex']);
    });

    it('answers none for a project with no manuscript folder', () => {
        const root = scratch();
        write(root, 'README.md', 'x');

        expect(mains(root)).toEqual([]);
    });
});

describe('mainsIn', () => {
    it('lists main.tex first and the other mains by name, and leaves out a file with no class', () => {
        const root = scratch();
        write(root, 'main.tex', ARTICLE);
        write(root, 'b.tex', ARTICLE);
        write(root, 'a.tex', ARTICLE);
        write(root, 'chapter.tex', '\\section{One}\n');

        expect(mainsIn(root)).toEqual(['main.tex', 'a.tex', 'b.tex']);
    });

    it('answers none for a folder with no main and for a folder that is not there', () => {
        const root = scratch();
        write(root, 'chapter.tex', '\\section{One}\n');

        expect(mainsIn(root)).toEqual([]);
        expect(mainsIn(join(root, 'missing'))).toEqual([]);
    });
});

describe('programOf', () => {
    it.each([
        ['% !TEX program = xelatex\n', 'xelatex'],
        ['%!TeX program=LuaLaTeX\n', 'lualatex'],
        ['% !TEX program = context\n', 'pdflatex'],
        ['no comment\n', 'pdflatex'],
        ['\\documentclass{article}\n% !TEX program = xelatex\n', 'pdflatex']
    ])('reads %j as %s', (head, program) => {
        const root = scratch();
        const file = write(root, 'm.tex', `${head}${ARTICLE}`);

        expect(programOf(file)).toBe(program);
    });

    it('is carried by the state of a main file', () => {
        const root = scratch();
        write(root, 'm.tex', `% !TEX program = lualatex\n${ARTICLE}`);

        const prefixes = { pdf: '', files: '' };
        expect(buildStateIn(root, 'm.tex', prefixes).program).toBe('lualatex');
    });
});

describe('declaresClass', () => {
    it('reads a class behind an escaped per-cent sign, and not one behind a comment', () => {
        expect(declaresClass('100\\% done \\documentclass{article}')).toBe(true);
        expect(declaresClass('% \\documentclass{article}')).toBe(false);
    });
});

describe('parseLog', () => {
    it('reads a file:line: row as an error with its file, line and message', () => {
        const log = './main.tex:12: Undefined control sequence.\nl.12 \\nosuch\n';

        expect(parseLog(log).errors).toEqual([
            { file: 'main.tex', line: 12, message: 'Undefined control sequence.' }
        ]);
    });

    it('reads a bang row as an error and takes its line from the context under it', () => {
        const log = '! Emergency stop.\n<*> main\nl.40 \\end{document}\n';

        expect(parseLog(log).errors).toEqual([{ file: '', line: 40, message: 'Emergency stop.' }]);
    });

    it('leaves the line null for a bang row with no context under it', () => {
        expect(
            parseLog('! ==> Fatal error occurred, no output PDF file produced!\n').errors
        ).toEqual([
            {
                file: '',
                line: null,
                message: '==> Fatal error occurred, no output PDF file produced!'
            }
        ]);
    });

    it('joins a package warning continued under its own name and reads its line', () => {
        const log = [
            'Package hyperref Warning: Token not allowed in a PDF string (Unicode):',
            "(hyperref)                removing `math shift' on input line 261.",
            '',
            ''
        ].join('\n');

        expect(parseLog(log).warnings).toEqual([
            {
                file: '',
                line: 261,
                message:
                    "Package hyperref: Token not allowed in a PDF string (Unicode): removing `math shift' on input line 261."
            }
        ]);
    });

    it('reads a LaTeX warning that names no line', () => {
        const log = "LaTeX Warning: `h' float specifier changed to `ht'.\n\n";

        expect(parseLog(log).warnings).toEqual([
            { file: '', line: null, message: "LaTeX: `h' float specifier changed to `ht'." }
        ]);
    });

    it('keeps two warnings in a row apart', () => {
        const log = [
            'LaTeX Warning: There were undefined references.',
            'LaTeX Warning: Label(s) may have changed.',
            ''
        ].join('\n');

        expect(parseLog(log).warnings.map((one) => one.message)).toEqual([
            'LaTeX: There were undefined references.',
            'LaTeX: Label(s) may have changed.'
        ]);
    });

    it('makes an absolute path relative to the folder the build ran in', () => {
        const dir = join(scratch(), 'manuscript');
        const log = `${join(dir, 'main.tex')}:7: Missing $ inserted.\n`;

        expect(parseLog(log, dir).errors).toEqual([
            { file: 'main.tex', line: 7, message: 'Missing $ inserted.' }
        ]);
    });

    it('finds nothing in a log that compiled clean', () => {
        const log = [
            'This is pdfTeX, Version 3.141592653-2.6-1.40.27 (TeX Live 2025)',
            ' file:line:error style messages enabled.',
            'Output written on main.pdf (16 pages, 400000 bytes).',
            ''
        ].join('\n');

        expect(parseLog(log)).toEqual({ errors: [], warnings: [] });
    });
});

describe('buildState', () => {
    it('answers the PDF and log times and what the log held', () => {
        const root = scratch();
        write(root, 'manuscript/main.tex', ARTICLE);
        write(root, 'manuscript/main.pdf', '%PDF-1.5');
        write(root, 'manuscript/main.log', './main.tex:3: Undefined control sequence.\n');

        const state = buildState(root, 'main.tex');

        expect(state.main).toBe('main.tex');
        expect(state.pdfPath).toBe('manuscript/main.pdf');
        expect(state.pdf).toBeGreaterThan(0);
        expect(state.log).toBeGreaterThan(0);
        expect(state.errors).toEqual([
            { file: 'main.tex', line: 3, message: 'Undefined control sequence.' }
        ]);
    });

    it('answers null times and no errors for a file nothing has built', () => {
        const root = scratch();
        write(root, 'manuscript/supplement.tex', ARTICLE);

        expect(buildState(root, 'supplement.tex')).toEqual({
            main: 'supplement.tex',
            program: 'pdflatex',
            pdfPath: 'manuscript/supplement.pdf',
            pdf: null,
            log: null,
            errors: [],
            warnings: []
        });
    });
});
