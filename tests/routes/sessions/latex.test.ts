// GET and POST /api/latex: the project form checked against the snapshot, the folder form checked
// against the served roots, the main file a `.tex` file builds through, the outline and the word
// count of a main file, and the formatting of a text. The hub and the roots are synthetic folders
// under the system temporary directory and the snapshot is the case's own, so nothing of the real
// hub is read and nothing at all is written outside it. texcount and the formatters are shell
// scripts the case puts in a folder of its own and is the only PATH the endpoint runs them under.
//
// Every refusal is a word (data/prose/latex.ts and data/file-ops.ts), never a sentence.

import { chmodSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    handleLatex,
    handleLatexPost,
    type FolderAnswer,
    type LatexTarget,
    type ProjectAnswer
} from '../../../src/lib/server/content/latex/endpoint.ts';
import { OUTLINE_MAX_BYTES } from '../../../src/lib/server/content/latex/outline.ts';
import type { Formatter } from '../../../src/lib/data/prose/latex.ts';
import type { LatexFormatting } from '../../../src/lib/data/sources/config/settings.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

const HOST = '127.0.0.1:8791';
const TOKEN = 'token-of-the-case';

// The synthetic hub, made and planted before the file's first case, so a run that skips every case
// makes none.
let HUB = '';

const FOLDER = 'projects/manuscripts/alpha';
const OUTLINED = 'projects/manuscripts/gamma';

/** The formatter setting a case runs under: one formatter, each program found on PATH. */
function formatting(formatter: Formatter, paths: Partial<LatexFormatting['paths']> = {}) {
    return (): LatexFormatting => ({
        formatter,
        paths: { latexindent: '', 'tex-fmt': '', badness: '', ...paths }
    });
}

/** Write one file under a base folder, checked to be inside it before anything is written. */
function put(base: string, rel: string, body: string): void {
    const full = join(base, rel);
    expect(resolve(full).startsWith(resolve(base) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

const write = (rel: string, body: string): void => put(HUB, rel, body);

/** A bin folder of the case's own, which is the whole of the PATH its programs are found on. */
function newBin(): string {
    return realpathSync(scratchDir('oculus-latex-bin-'));
}

/** Put a script named `program` in a case's bin folder. */
function stub(bin: string, program: string, script: string): void {
    put(bin, program, `#!/bin/sh\n${script}\n`);
    chmodSync(join(bin, program), 0o755);
}

const ARTICLE = '\\documentclass{article}\n';

const TARGET: LatexTarget = {
    hub: '',
    project: (id) => {
        if (id === 'alpha') return { folder: FOLDER };
        return id === 'gamma' ? { folder: OUTLINED } : null;
    },
    roots: () => [{ key: 'docs', dir: join(HUB, 'docs') }],
    formatting: formatting('tex-fmt')
};

/** The target with a bin folder as the whole of the PATH, and a time limit when given. */
function withTools(bin: string, timeoutMs = 20000): LatexTarget {
    return { ...TARGET, tools: { env: { PATH: `${bin}:/usr/bin:/bin` }, timeoutMs } };
}

test.beforeAll(() => {
    HUB = realpathSync(scratchDir('oculus-latex-route-'));
    TARGET.hub = HUB;
    write(`${FOLDER}/manuscript/main.tex`, ARTICLE);
    write(`${FOLDER}/manuscript/supplement.tex`, ARTICLE);
    write(`${FOLDER}/manuscript/main.log`, './main.tex:5: Undefined control sequence.\n');
    write('docs/proposal/main.tex', '% !TEX program = xelatex\n\\documentclass{article}\n');
    write('docs/proposal/response.tex', ARTICLE);
    write('docs/proposal/chapter.tex', '\\section{One}\n');
    write('docs/proposal/main.pdf', '%PDF-1.5');
    write('docs/proposal/main.log', './sec/b.tex:12: Missing $ inserted.\nLaTeX Warning: x.\n');
    write('docs/proposal/sec/b.tex', '\\subsection{B}\n');
    write('docs/notes.md', 'x');
    write('docs/only/solo.tex', ARTICLE);
    write('docs/only/part.tex', '\\section{Part}\n');
    write('docs/only/readme.md', 'x');
    write('docs/dash/-v.tex', ARTICLE);
    write('docs/dash/main.tex', ARTICLE);
    write('docs/rootless.tex', ARTICLE);
    write('docs/outline/main.tex', `${ARTICLE}\\section{A}\n\\input{sec/b}\n`);
    write('docs/outline/sec/b.tex', '\\subsection*{B}\n');
    write(`${OUTLINED}/manuscript/main.tex`, `${ARTICLE}\\section{A}\n\\input{sec/b}\n`);
    write(`${OUTLINED}/manuscript/sec/b.tex`, '\\subsection*{B}\n');
    write(`${OUTLINED}/manuscript/big.tex`, `${ARTICLE}\\input{huge}\n`);
    write(`${OUTLINED}/manuscript/huge.tex`, `\\section{Huge}\n${'x'.repeat(OUTLINE_MAX_BYTES)}`);
});

function request(query: string): Request {
    return new Request(`http://${HOST}/api/latex${query}`, {
        headers: { host: HOST, 'sec-fetch-site': 'same-origin' }
    });
}

async function answer(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

describe('GET /api/latex for a project', () => {
    it('refuses a request naming no project or root', async () => {
        const response = await handleLatex(request(''), TARGET);

        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe('not-an-action');
    });

    it('refuses an id the snapshot does not hold', async () => {
        const response = await handleLatex(request('?id=nobody'), TARGET);

        expect(response.status).toBe(404);
        expect((await answer(response)).error).toBe('no-project');
    });

    it('answers one row per main file, with the folder and the errors of the last build', async () => {
        const response = await handleLatex(request('?id=alpha'), TARGET);

        expect(response.status).toBe(200);
        const body = (await response.json()) as ProjectAnswer;
        expect(body.folder).toBe(FOLDER);
        expect(body.mains.map((one) => one.main)).toEqual(['main.tex', 'supplement.tex']);
        expect(body.mains[0].errors).toEqual([
            { file: 'main.tex', line: 5, message: 'Undefined control sequence.' }
        ]);
        expect(body.mains[0].pdfPath).toBe('manuscript/main.pdf');
        expect(body.mains[0].pdf).toBeNull();
        expect(body.mains[1].log).toBeNull();
    });

    it('answers no rows for a project whose folder holds no manuscript', async () => {
        const target: LatexTarget = {
            ...TARGET,
            project: () => ({ folder: 'projects/ideas/beta' })
        };
        const response = await handleLatex(request('?id=beta'), target);

        expect(response.status).toBe(200);
        expect((await answer(response)).mains).toEqual([]);
    });

    it('refuses a folder that would leave the hub', async () => {
        const target: LatexTarget = { ...TARGET, project: () => ({ folder: '../elsewhere' }) };
        const response = await handleLatex(request('?id=away'), target);

        expect(response.status).toBe(404);
        expect((await answer(response)).error).toBe('outside');
    });
});

describe('GET /api/latex for a folder of a root', () => {
    it('answers both mains of a folder with every path against the root', async () => {
        const response = await handleLatex(request('?root=docs&path=proposal'), TARGET);

        expect(response.status).toBe(200);
        const body = (await response.json()) as FolderAnswer;
        expect(body.root).toBe('docs');
        expect(body.path).toBe('proposal');
        expect(body.mains.map((one) => [one.main, one.program, one.pdfPath])).toEqual([
            ['main.tex', 'xelatex', 'proposal/main.pdf'],
            ['response.tex', 'pdflatex', 'proposal/response.pdf']
        ]);
        expect(body.mains[0].errors).toEqual([
            { file: 'proposal/sec/b.tex', line: 12, message: 'Missing $ inserted.' }
        ]);
        expect(body.mains[0].warnings).toEqual([{ file: '', line: null, message: 'LaTeX: x.' }]);
    });

    it('reads the root itself when the path is empty', async () => {
        const response = await handleLatex(request('?root=docs&path='), TARGET);

        expect(response.status).toBe(200);
        const body = (await response.json()) as FolderAnswer;
        expect(body.path).toBe('');
        expect(body.mains.map((one) => [one.main, one.pdfPath])).toEqual([
            ['rootless.tex', 'rootless.pdf']
        ]);
    });

    it.each([
        ['a path that leaves the root', '?root=docs&path=..'],
        ['a path that is a file', '?root=docs&path=notes.md'],
        ['a folder that is missing', '?root=docs&path=removed'],
        ['a root key that is unknown', '?root=nowhere&path=proposal']
    ])('refuses %s with 404', async (_name, query) => {
        const response = await handleLatex(request(query), TARGET);

        expect(response.status).toBe(404);
    });

    it.each([
        ['a root without a path', '?root=docs'],
        ['both an id and a root', '?id=alpha&root=docs&path=proposal'],
        ['neither', '?path=proposal'],
        ['a path with a file', '?root=docs&path=proposal&file=proposal/main.tex']
    ])('refuses %s with 400', async (_name, query) => {
        const response = await handleLatex(request(query), TARGET);

        expect(response.status).toBe(400);
    });
});

describe('GET /api/latex for the root a file builds through', () => {
    it('answers the main of a main file, the only main of a folder, and none otherwise', async () => {
        const own = await answer(
            await handleLatex(request('?root=docs&file=proposal/main.tex'), TARGET)
        );
        const only = await answer(
            await handleLatex(request('?root=docs&file=only/part.tex'), TARGET)
        );
        const many = await answer(
            await handleLatex(request('?root=docs&file=proposal/chapter.tex'), TARGET)
        );
        // A Markdown file is no source of a build, although its folder holds exactly one main.
        const markdown = await answer(
            await handleLatex(request('?root=docs&file=only/readme.md'), TARGET)
        );

        expect(own).toEqual({ root: 'docs', path: 'proposal', main: 'main.tex' });
        expect(only).toEqual({ root: 'docs', path: 'only', main: 'solo.tex' });
        expect(many).toEqual({ main: null });
        expect(markdown).toEqual({ main: null });
    });

    it('refuses a file that is missing and a file outside the root', async () => {
        const missing = await handleLatex(request('?root=docs&file=gone.tex'), TARGET);
        const outside = await handleLatex(request('?root=docs&file=../notes.md'), TARGET);

        expect(missing.status).toBe(404);
        expect(outside.status).toBe(404);
    });
});

describe('GET /api/latex outline', () => {
    it('answers the sections of a main followed through its includes', async () => {
        const response = await handleLatex(
            request('?root=docs&path=outline&outline=main.tex'),
            TARGET
        );

        expect(await answer(response)).toEqual({
            sections: [
                { level: 2, title: 'A', file: 'outline/main.tex', line: 2 },
                { level: 3, title: 'B', file: 'outline/sec/b.tex', line: 1 }
            ],
            partial: [],
            unread: []
        });
    });
});

describe('GET /api/latex outline of a project', () => {
    it('names the files against the project folder and carries that folder', async () => {
        const response = await handleLatex(request('?id=gamma&outline=main.tex'), TARGET);

        expect(await answer(response)).toEqual({
            sections: [
                { level: 2, title: 'A', file: 'manuscript/main.tex', line: 2 },
                { level: 3, title: 'B', file: 'manuscript/sec/b.tex', line: 1 }
            ],
            partial: [],
            unread: [],
            folder: OUTLINED
        });
    });

    it('names a file past the size limit as not read and lists none of its sections', async () => {
        const response = await handleLatex(request('?id=gamma&outline=big.tex'), TARGET);

        expect(await answer(response)).toEqual({
            sections: [],
            partial: [],
            unread: ['manuscript/huge.tex'],
            folder: OUTLINED
        });
    });
});

describe('every refusal is a word the page says the sentence of', () => {
    it.each([
        ['no project or root', '', 400, 'not-an-action'],
        ['an empty project id', '?id=', 400, 'not-an-action'],
        ['both forms', '?id=alpha&root=docs', 400, 'not-an-action'],
        ['a root with no path', '?root=docs', 400, 'not-an-action'],
        ['an empty root', '?root=&path=x', 400, 'not-an-action'],
        ['a path and a file', '?root=docs&path=a&file=b.tex', 400, 'not-an-action'],
        ['an outline and a count', '?id=alpha&outline=a&count=a', 400, 'not-an-action'],
        ['a folder that is a file', '?root=docs&path=notes.md', 404, 'not_a_folder'],
        ['a file that is a folder', '?root=docs&file=proposal', 404, 'not-a-file'],
        ['a count of a chapter', '?id=alpha&count=chapter.tex', 404, 'not-a-main'],
        [
            'an outline of a chapter',
            '?root=docs&path=proposal&outline=chapter.tex',
            404,
            'not-a-main'
        ],
        ['a path the root does not hold', '?root=docs&path=nope', 404, 'missing'],
        ['a path that leaves the root', '?root=docs&path=../x', 404, 'outside'],
        ['a root that is not served', '?root=nowhere&path=x', 404, 'outside']
    ])('answers %s with its word', async (_name, query, status, word) => {
        const response = await handleLatex(request(query), TARGET);

        expect(response.status).toBe(status);
        expect((await answer(response)).error).toBe(word);
    });
});

describe('every main parameter is checked before a file is read or a program started', () => {
    it.each(['../x.tex', '/etc/passwd', '-v.tex', 'chapter.tex', 'missing.tex'])(
        'answers 404 for %s and runs nothing',
        async (main) => {
            const bin = newBin();
            const calls = join(bin, 'calls');
            stub(bin, 'texcount', `echo "$@" >> '${calls}'\necho 1`);
            const named = encodeURIComponent(main);
            const target = withTools(bin);
            const counted = await handleLatex(
                request(`?root=docs&path=proposal&count=${named}`),
                target
            );
            const outlined = await handleLatex(
                request(`?root=docs&path=proposal&outline=${named}`),
                target
            );
            const project = await handleLatex(request(`?id=alpha&count=${named}`), target);

            expect([counted.status, outlined.status, project.status]).toEqual([404, 404, 404]);
            expect(() => readFileSync(calls, 'utf8')).toThrow();
        }
    );

    it('refuses a name starting with a dash even when a main file has that name', async () => {
        const bin = newBin();
        const calls = join(bin, 'calls');
        stub(bin, 'texcount', `echo "$@" >> '${calls}'\necho 1`);
        const target = withTools(bin);

        const counted = await handleLatex(request('?root=docs&path=dash&count=-v.tex'), target);
        const outlined = await handleLatex(request('?root=docs&path=dash&outline=-v.tex'), target);
        const named = await handleLatex(request('?root=docs&path=dash&count=main.tex'), target);

        expect([counted.status, outlined.status, named.status]).toEqual([404, 404, 200]);
        expect(readFileSync(calls, 'utf8').trim().split('\n')).toHaveLength(1);
    });

    it('refuses an outline and a count asked together', async () => {
        const response = await handleLatex(
            request('?root=docs&path=proposal&outline=main.tex&count=main.tex'),
            TARGET
        );

        expect(response.status).toBe(400);
    });
});

describe('GET /api/latex word count', () => {
    const count = '?root=docs&path=proposal&count=main.tex';

    it('answers the number the program printed, run in the folder with the words as arguments', async () => {
        const bin = newBin();
        stub(
            bin,
            'texcount',
            `echo "$PWD" > '${join(bin, 'cwd')}'\necho "$@" > '${join(bin, 'args')}'\necho 123`
        );

        const response = await handleLatex(request(count), withTools(bin));

        expect(await answer(response)).toEqual({ words: 123 });
        expect(readFileSync(join(bin, 'args'), 'utf8').trim()).toBe(
            '-inc -total -sum -brief -utf8 main.tex'
        );
        expect(realpathSync(readFileSync(join(bin, 'cwd'), 'utf8').trim())).toBe(
            join(HUB, 'docs/proposal')
        );
    });

    it('answers 502 count-failed when the program reports a failure between its marks', async () => {
        const bin = newBin();
        stub(
            bin,
            'texcount',
            "printf '!!! File nothere not found in path [./]. !!!\\n1\\n (errors:1)\\n'"
        );

        const response = await handleLatex(request(count), withTools(bin));

        expect(response.status).toBe(502);
        expect((await answer(response)).error).toBe('count-failed');
    });

    it('does not read a digit in the main file name as the count', async () => {
        write('docs/proposal/chapter2.tex', ARTICLE);
        const bin = newBin();
        stub(
            bin,
            'texcount',
            "printf '!!! File nothere not found in path [./]. !!!\\n1\\n (errors:1)\\n'"
        );

        const response = await handleLatex(
            request('?root=docs&path=proposal&count=chapter2.tex'),
            withTools(bin)
        );

        expect(response.status).toBe(502);
        expect(await answer(response)).not.toHaveProperty('words');
    });

    it('answers 502 count-missing when the program is not found', async () => {
        const target = { ...TARGET, tools: { env: { PATH: join(newBin(), 'nothing') } } };

        const response = await handleLatex(request(count), target);

        expect(response.status).toBe(502);
        expect((await answer(response)).error).toBe('count-missing');
    });

    it('answers 504 when the program runs past the time limit', async () => {
        const bin = newBin();
        stub(bin, 'texcount', 'sleep 5');

        const response = await handleLatex(request(count), withTools(bin, 100));

        expect(response.status).toBe(504);
        expect((await answer(response)).error).toBe('count-timeout');
    });
});

describe('POST /api/latex format', () => {
    function post(body: unknown, token = TOKEN): Request {
        return new Request(`http://${HOST}/api/latex`, {
            method: 'POST',
            headers: { host: HOST, 'x-oculus-token': token, 'content-type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    it('answers the text the program printed from the text it was given on standard input', async () => {
        const bin = newBin();
        stub(bin, 'tex-fmt', 'test "$1" = --stdin || exit 3\nsed \'s/^/  /\'');

        const response = await handleLatexPost(
            post({ action: 'format', text: 'a\nb\n' }),
            TOKEN,
            withTools(bin)
        );

        expect(await answer(response)).toEqual({ text: '  a\n  b\n' });
    });

    it('answers 502 with the missing word of the chosen program when it is not found', async () => {
        const target = { ...TARGET, tools: { env: { PATH: join(newBin(), 'nothing') } } };

        const response = await handleLatexPost(
            post({ action: 'format', text: 'a' }),
            TOKEN,
            target
        );

        expect(response.status).toBe(502);
        expect((await answer(response)).error).toBe('tex-fmt-missing');
    });

    it('answers 502 format-failed when the program exits 1, its standard error never shown', async () => {
        const bin = newBin();
        stub(bin, 'tex-fmt', 'echo "error: x" >&2\necho "second" >&2\nexit 1');

        const response = await handleLatexPost(
            post({ action: 'format', text: 'a' }),
            TOKEN,
            withTools(bin)
        );

        expect(response.status).toBe(502);
        expect((await answer(response)).error).toBe('format-failed');
    });

    it('answers 504 past the time limit', async () => {
        const bin = newBin();
        stub(bin, 'tex-fmt', 'sleep 5');

        const response = await handleLatexPost(
            post({ action: 'format', text: 'a' }),
            TOKEN,
            withTools(bin, 100)
        );

        expect(response.status).toBe(504);
    });

    it.each([
        ['latexindent', '-s -'],
        ['tex-fmt', '--stdin'],
        ['badness', 'format --stdin-filepath chapter.tex -']
    ] as const)(
        'runs %s with its arguments, the text on standard input',
        async (formatter, args) => {
            const bin = newBin();
            stub(bin, formatter, `test "$*" = "${args}" || exit 3\nsed 's/^/> /'`);
            const target = { ...withTools(bin), formatting: formatting(formatter) };

            const response = await handleLatexPost(
                post({ action: 'format', text: 'a\n', file: 'sec/chapter.tex' }),
                TOKEN,
                target
            );

            expect(response.status).toBe(200);
            expect(await answer(response)).toEqual({ text: '> a\n' });
        }
    );

    it('runs the program its path key names instead of the one on PATH', async () => {
        const bin = newBin();
        const other = newBin();
        stub(bin, 'tex-fmt', 'echo on-path');
        stub(other, 'my-fmt', 'echo named');
        const target = {
            ...withTools(bin),
            formatting: formatting('tex-fmt', { 'tex-fmt': join(other, 'my-fmt') })
        };

        const response = await handleLatexPost(
            post({ action: 'format', text: 'a' }),
            TOKEN,
            target
        );

        expect(await answer(response)).toEqual({ text: 'named\n' });
    });

    it('refuses format-none and runs nothing when the choice is none', async () => {
        const bin = newBin();
        const calls = join(bin, 'calls');
        for (const program of ['latexindent', 'tex-fmt', 'badness']) {
            stub(bin, program, `echo ran >> '${calls}'`);
        }
        const target = { ...withTools(bin), formatting: formatting('none') };

        const response = await handleLatexPost(
            post({ action: 'format', text: 'a' }),
            TOKEN,
            target
        );

        expect(response.status).toBe(409);
        expect((await answer(response)).error).toBe('format-none');
        expect(() => readFileSync(calls, 'utf8')).toThrow();
    });

    it.each(['latexindent', 'tex-fmt', 'badness'] as const)(
        'refuses %s-missing when the chosen program is not found',
        async (formatter) => {
            const target = {
                ...TARGET,
                tools: { env: { PATH: join(newBin(), 'nothing') } },
                formatting: formatting(formatter)
            };

            const response = await handleLatexPost(
                post({ action: 'format', text: 'a' }),
                TOKEN,
                target
            );

            expect(response.status).toBe(502);
            expect((await answer(response)).error).toBe(`${formatter}-missing`);
        }
    );

    it('refuses a request without the write token and a body that is no format request', async () => {
        const bin = newBin();
        const stale = await handleLatexPost(
            post({ action: 'format', text: 'a' }, 'stale'),
            TOKEN,
            withTools(bin)
        );
        const wrong = await handleLatexPost(post({ action: 'other' }), TOKEN, withTools(bin));

        expect(stale.status).toBe(403);
        expect(wrong.status).toBe(400);
        expect((await answer(wrong)).error).toBe('not-an-action');
    });
});
