// Layer 2, server. The /api/latex endpoint: what a folder holds of LaTeX, answered for a project's
// manuscript folder (`?id=`) or for any folder of a served root (`?root=&path=`), the main file a
// source file builds through, the rule that found it and the PDF and log its build writes
// (`?root=&file=`), the main a PDF is the build of (`?root=&pdf=`, answered the same way), the
// files that main depends on with their modification times (`&deps=1`, which the page polls to
// build on a change on disk) and its citations (`&cites=1`), the outline of a main file
// (`&outline=<main>`), its word count (`&count=<main>`), and, as POST, the formatting of a text,
// the two directions of SyncTeX and texdoc.
//
// routes/api/(sessions)/latex/+server.ts is the few lines that join it to Kit, since a route module
// may export only its verbs. The folder read is the reader's, never the request's: a project's
// folder comes from the portfolio snapshot and is joined to the hub, a root's folder from the roots
// the file browser serves, both checked again before anything is opened. Every `<main>` a request
// carries is checked against the main files of the folder before a file is read or a process
// started, so the only names that reach a program are the ones the folder's own listing offered.
//
// A project's paths are against the project's folder, as the project panel has always read them; a
// folder's paths are against its root, which is what the file routes take.

import { json } from '@sveltejs/kit';
import { statSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { z } from 'zod';
import type { BuildOutcome, Project } from '../../../data/model/index.ts';
import {
    MANUSCRIPT,
    isLatexFile,
    stemOf,
    type Formatter,
    type LatexRefusal
} from '../../../data/prose/latex.ts';
import type { LatexBuilding, LatexFormatting } from '../../../data/sources/config/settings.ts';
import type { OpsRefusal } from '../../../data/file-ops.ts';
import { tokenedBody } from '../../core/auth.ts';
import { realPath } from '../../core/paths.ts';
import { projectDirectory, resolveRootPath, type Root } from '../../files/files.ts';
import {
    buildStateIn,
    isFile,
    isMainOf,
    mainsIn,
    type Folders,
    type MainState,
    type Prefixes
} from '../latex.ts';
import { citationsOf } from './bib.ts';
import { outlineOf, type Outline } from './outline.ts';
import { foldersOf } from './recipes.ts';
import { dependenciesOf, mainOfPdf, rootOf, type RootHow } from './root.ts';
import { forward, inverse, placedIn, placesOf, programFor, sourceOf } from './synctex.ts';
import { packagesOf, texdoc, texdocName } from './texdoc.ts';
import { run, type Run, type Tools } from '../../core/program.ts';
import { readCount } from './tools.ts';

/**
 * What a LaTeX read needs: the hub, the portfolio an id is checked against, and the served roots.
 */
export type LatexTarget = {
    hub: string;
    project: (id: string) => Pick<Project, 'folder'> | null;
    /** The roots the file browser serves, which a root key of a request is looked up in. */
    roots: () => Root[];
    /** The formatter Format Document runs, read from config/behavior.yml at each request. */
    formatting: () => LatexFormatting;
    /** What a build and SyncTeX are set by, read from config/behavior.yml at each request. */
    building: () => LatexBuilding;
    /** How the two programs are run when a caller needs them other than the machine's own. */
    tools?: Tools;
    /**
     * What the last build of a main file came to, by the folder it runs in, the label its terminal
     * is named for the folder by, and the main file: no oculus terminal built it when it is absent.
     */
    outcome?: (dir: string, label: string, main: string) => BuildOutcome;
    /** The text catalog the token refusal is worded from, read when a refusal is made. */
    text: () => Record<string, string>;
};

/** One main file of an answer: what its last build left, and how that build ended. */
type AnsweredMain = MainState & { build: BuildOutcome };

/** The state of a project: its folder, and one state per main file. */
export type ProjectAnswer = { folder: string; mains: AnsweredMain[] };

/** The outline of a main file of a project, its files against the project's folder. */
export type ProjectOutline = Outline & { folder: string };

/** The state of a folder of a root: the root, the folder against it, and one state per main. */
export type FolderAnswer = { root: string; path: string; mains: AnsweredMain[] };

/** A build's files are read again whenever the page asks, so nothing here is ever cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The query of a request: every parameter is text, and a parameter that is absent is undefined. */
const queryShape = z.object({
    id: z.string().optional(),
    root: z.string().optional(),
    path: z.string().optional(),
    file: z.string().optional(),
    outline: z.string().optional(),
    count: z.string().optional(),
    deps: z.string().optional(),
    cites: z.string().optional(),
    packages: z.string().optional(),
    pdf: z.string().optional()
});
type Query = z.infer<typeof queryShape>;

/** The body of a format request: the text, and the name of its file, which badness reads. */
const formatShape = z.object({
    action: z.literal('format'),
    text: z.string(),
    file: z.string().optional()
});

/** The body of a forward search: the place of a source file's line, in a root. */
const forwardShape = z.object({
    action: z.literal('forward'),
    root: z.string().min(1),
    file: z.string().min(1),
    line: z.number().int().min(1),
    column: z.number().int().min(0).optional()
});

/** The body of an inverse search: the place on a page of a PDF of a root, in PDF points. */
const inverseShape = z.object({
    action: z.literal('inverse'),
    root: z.string().min(1),
    pdf: z.string().min(1),
    page: z.number().int().min(1),
    x: z.number(),
    y: z.number()
});

/** The body of a texdoc request: the package whose documentation opens. */
const texdocShape = z.object({ action: z.literal('texdoc'), name: z.string() });

/** The actions a POST carries. */
const actionShape = z.discriminatedUnion('action', [
    formatShape,
    forwardShape,
    inverseShape,
    texdocShape
]);

/** The word a formatter that is not found is refused with. */
const MISSING: Record<Exclude<Formatter, 'none'>, LatexRefusal> = {
    latexindent: 'latexindent-missing',
    'tex-fmt': 'tex-fmt-missing',
    badness: 'badness-missing'
};

/** The arguments each formatter takes to read the text on standard input and write it out. */
function formatArgs(formatter: Exclude<Formatter, 'none'>, file: string): string[] {
    switch (formatter) {
        case 'latexindent':
            return ['-s', '-'];
        case 'tex-fmt':
            return ['--stdin'];
        case 'badness':
            return ['format', '--stdin-filepath', file, '-'];
    }
}

/**
 * Where a request reads: the folder of the mains, what bounds the reads, the folder an outline
 * names its files against, and how it answers.
 */
type Scope = {
    dir: string;
    /** What the folder's terminals are named for it by: a project's id, a folder's path or root. */
    label: string;
    bound: string;
    named: string;
    prefixes: Prefixes;
    answer: (mains: AnsweredMain[]) => unknown;
    outlined: (outline: Outline) => unknown;
};

/** A refusal: the word the page says the catalog's sentence for. */
function refuse(status: number, error: OpsRefusal | LatexRefusal): Response {
    return json({ error }, { status, headers: NO_STORE });
}

/** A path against a folder, as a slash-separated path with no separator of the machine in it. */
function relativeTo(base: string, path: string): string {
    return relative(base, path).split(sep).join('/');
}

/** The scope of a project's manuscript folder, or the refusal. */
function projectScope(into: LatexTarget, id: string): Scope | Response {
    if (id === '') return refuse(400, 'not-an-action');
    const project = into.project(id);
    if (project === null) return refuse(404, 'no-project');
    // One rule for resolving a project's folder beneath the hub, the one the terminal actions run
    // through: a folder that would leave the hub throws there and is a 404 here.
    let folder: string;
    try {
        folder = projectDirectory(into.hub, project.folder);
    } catch {
        return refuse(404, 'outside');
    }
    return {
        dir: join(folder, MANUSCRIPT),
        label: id,
        bound: realPath(into.hub) ?? into.hub,
        named: realPath(folder) ?? folder,
        prefixes: { pdf: MANUSCRIPT, files: '' },
        answer: (mains) => ({ folder: project.folder, mains }) satisfies ProjectAnswer,
        outlined: (outline) => ({ ...outline, folder: project.folder }) satisfies ProjectOutline
    };
}

/** The root and the real path of a file or folder of a served root, or the refusal. */
function resolved(
    into: LatexTarget,
    root: string,
    path: string
): { bound: string; real: string } | Response {
    if (root === '') return refuse(400, 'not-an-action');
    const found = resolveRootPath(into.roots(), root, path);
    if ('error' in found) {
        return refuse(404, found.error);
    }
    const dir = into.roots().find((one) => one.key === root)?.dir ?? '';
    return { bound: realPath(dir) ?? dir, real: found.path };
}

/** Whether the path is a folder, following a link. */
function isFolder(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

/** The scope of a folder of a served root, or the refusal. */
function folderScope(into: LatexTarget, root: string, path: string): Scope | Response {
    const found = resolved(into, root, path);
    if (found instanceof Response) return found;
    if (!isFolder(found.real)) {
        return refuse(404, 'not_a_folder');
    }
    const folder = relativeTo(found.bound, found.real);
    return {
        dir: found.real,
        label: path === '' ? root : path,
        bound: found.bound,
        named: found.bound,
        prefixes: { pdf: folder, files: folder },
        answer: (mains) => ({ root, path: folder, mains }) satisfies FolderAnswer,
        outlined: (outline) => outline
    };
}

/** The folders a main file's build writes to, which its `.fls` may be read from. */
function foldersFor(into: LatexTarget, bound: string, main: string): Folders {
    const found = foldersOf(main, bound, into.building());
    return 'refused' in found ? { out: dirname(main), aux: dirname(main) } : found;
}

/**
 * Where a main file is, as a root answer names it: its folder and name against the root, and the
 * PDF its build writes, which is in the output folder the configuration names.
 */
function placeOf(
    into: LatexTarget,
    bound: string,
    main: string
): { path: string; main: string; pdf: string; log: string } {
    const folders = foldersFor(into, bound, main);
    const stem = stemOf(basename(main));
    return {
        path: relativeTo(bound, dirname(main)),
        main: basename(main),
        pdf: relativeTo(bound, join(folders.out, `${stem}.pdf`)),
        log: relativeTo(bound, join(folders.aux, `${stem}.log`))
    };
}

/** The root of a LaTeX file of a served root, or the refusal. */
function rootFor(
    into: LatexTarget,
    root: string,
    file: string
): { bound: string; real: string; main: string; how: RootHow } | Response | null {
    const found = resolved(into, root, file);
    if (found instanceof Response) return found;
    if (!isFile(found.real)) return refuse(404, 'not-a-file');
    if (!isLatexFile(found.real)) return null;
    const rooted = rootOf(found.bound, found.real, (main) => {
        const folders = foldersFor(into, found.bound, main);
        return [folders.out, folders.aux];
    });
    return rooted === null ? null : { ...found, ...rooted };
}

/** The main file a LaTeX file builds through and the rule that found it, as the page reads it. */
function rootAnswer(into: LatexTarget, root: string, file: string): Response {
    const found = rootFor(into, root, file);
    if (found instanceof Response) return found;
    if (found === null) return json({ main: null }, { headers: NO_STORE });
    return json(
        { root, ...placeOf(into, found.bound, found.main), how: found.how },
        { headers: NO_STORE }
    );
}

/** The main a PDF of a served root is the build of, as the root answer names it. */
function pdfRootAnswer(into: LatexTarget, root: string, pdf: string): Response {
    const found = resolved(into, root, pdf);
    if (found instanceof Response) return found;
    if (!found.real.toLowerCase().endsWith('.pdf') || !isFile(found.real)) {
        return refuse(404, 'synctex-no-pdf');
    }
    const main = mainOfPdf(
        found.bound,
        found.real,
        (one) => foldersFor(into, found.bound, one).out
    );
    if (main === null) return json({ main: null }, { headers: NO_STORE });
    return json(
        { root, ...placeOf(into, found.bound, main), how: 'folder' },
        { headers: NO_STORE }
    );
}

/** When a file was last written, or null when it is not there. */
function timeOf(path: string): number | null {
    try {
        return statSync(path).mtimeMs;
    } catch {
        return null;
    }
}

/**
 * The files a main file depends on, each with the time it was last written. The page asks for it
 * whenever the root's files change and builds when a time is later than the one it holds.
 */
function dependenciesAnswer(into: LatexTarget, root: string, file: string): Response {
    const found = rootFor(into, root, file);
    if (found instanceof Response) return found;
    if (found === null) return json({ main: null }, { headers: NO_STORE });
    const folders = foldersFor(into, found.bound, found.main);
    const files = dependenciesOf(found.bound, found.main, [folders.out, folders.aux])
        .map((path) => ({ path: relativeTo(found.bound, path), time: timeOf(path) }))
        .filter((one) => one.time !== null)
        .sort((left, right) => left.path.localeCompare(right.path));
    const path = relativeTo(found.bound, dirname(found.main));
    return json({ root, path, main: basename(found.main), files }, { headers: NO_STORE });
}

/** The citations of the bibliographies of the main file a LaTeX file builds through. */
function citationsAnswer(into: LatexTarget, root: string, file: string): Response {
    const found = rootFor(into, root, file);
    if (found instanceof Response) return found;
    if (found === null) return json({ entries: [], unread: [] }, { headers: NO_STORE });
    const folders = foldersFor(into, found.bound, found.main);
    const cited = citationsOf(found.bound, found.main, [folders.out, folders.aux]);
    return json(cited, { headers: NO_STORE });
}

/** The packages the documents of the main file a LaTeX file builds through load. */
function packagesAnswer(into: LatexTarget, root: string, file: string): Response {
    const found = rootFor(into, root, file);
    if (found instanceof Response) return found;
    if (found === null) return json({ packages: [] }, { headers: NO_STORE });
    const folders = foldersFor(into, found.bound, found.main);
    const packages = packagesOf(found.bound, found.main, [folders.out, folders.aux]);
    return json({ packages }, { headers: NO_STORE });
}

/** The outline of one main file of the scope's folder. */
function outlineAnswer(into: LatexTarget, scope: Scope, main: string): Response {
    const real = realPath(join(scope.dir, main));
    if (!isMainOf(scope.dir, main) || real === null) {
        return refuse(404, 'not-a-main');
    }
    const folders = foldersFor(into, scope.bound, real);
    const aux = join(folders.aux, `${stemOf(main)}.aux`);
    const outline = outlineOf(scope.bound, scope.dir, real, scope.named, aux);
    return json(scope.outlined(outline), { headers: NO_STORE });
}

/** The word count of one main file of the scope's folder, run in that folder. */
async function countAnswer(into: LatexTarget, scope: Scope, main: string): Promise<Response> {
    if (!isMainOf(scope.dir, main)) {
        return refuse(404, 'not-a-main');
    }
    const args = ['-inc', '-total', '-sum', '-brief', '-utf8', main];
    const ran = await run('texcount', args, { cwd: scope.dir }, into.tools);
    if (ran.kind !== 'done') {
        return failure(ran, {
            missing: 'count-missing',
            timeout: 'count-timeout',
            failed: 'count-failed'
        });
    }
    const counted = readCount(ran.stdout);
    if ('words' in counted) return json(counted, { headers: NO_STORE });
    return refuse(502, 'count-failed');
}

/** The query of a request, with every parameter that is text read and every other left out. */
function queryOf(request: Request): Query {
    return queryShape.parse(Object.fromEntries(new URL(request.url).searchParams));
}

/**
 * GET /api/latex. A project form (`id`) and a folder form (`root`) are exclusive; the folder form
 * takes a `path` for the folder's state or a `file` for the root a file builds through, and either
 * form takes `outline` or `count` with the name of a main file of its folder.
 */
export async function handleLatex(request: Request, into: LatexTarget): Promise<Response> {
    const query = queryOf(request);
    const { id, root, path, file, outline, count, deps, cites, packages, pdf } = query;
    if (id !== undefined && root !== undefined) {
        return refuse(400, 'not-an-action');
    }
    if (id === undefined && root === undefined) {
        return refuse(400, 'not-an-action');
    }
    if (outline !== undefined && count !== undefined) {
        return refuse(400, 'not-an-action');
    }
    if (root !== undefined && pdf !== undefined) {
        const others = [path, file, outline, count, deps, cites, packages];
        if (others.some((one) => one !== undefined)) return refuse(400, 'not-an-action');
        return pdfRootAnswer(into, root, pdf);
    }
    if (root !== undefined && file !== undefined) {
        const extra = [deps, cites, packages].filter((one) => one !== undefined);
        if (path !== undefined || extra.length > 1 || extra.some((one) => one !== '1')) {
            return refuse(400, 'not-an-action');
        }
        if (deps !== undefined) return dependenciesAnswer(into, root, file);
        if (cites !== undefined) return citationsAnswer(into, root, file);
        if (packages !== undefined) return packagesAnswer(into, root, file);
        return rootAnswer(into, root, file);
    }
    if (deps !== undefined || cites !== undefined || packages !== undefined || pdf !== undefined) {
        return refuse(400, 'not-an-action');
    }
    if (root !== undefined && path === undefined) {
        return refuse(400, 'not-an-action');
    }
    const scope =
        id !== undefined ? projectScope(into, id) : folderScope(into, root ?? '', path ?? '');
    if (scope instanceof Response) return scope;
    if (outline !== undefined) return outlineAnswer(into, scope, outline);
    if (count !== undefined) return countAnswer(into, scope, count);
    const mains = mainsIn(scope.dir).map((main) => ({
        ...buildStateIn(
            scope.dir,
            main,
            scope.prefixes,
            foldersFor(into, scope.bound, join(scope.dir, main))
        ),
        build: into.outcome?.(scope.dir, scope.label, main) ?? 'none'
    }));
    return json(scope.answer(mains), { headers: NO_STORE });
}

/** The answer of a program that did not give one: its refusal, by the words of its kind. */
function failure(
    ran: Exclude<Run, { kind: 'done' }>,
    words: { missing: LatexRefusal; timeout: LatexRefusal; failed: LatexRefusal }
): Response {
    if (ran.kind === 'missing') return refuse(502, words.missing);
    if (ran.kind === 'timeout' || ran.kind === 'overflow') return refuse(504, words.timeout);
    return refuse(502, words.failed);
}

/** Format a text with the formatter `latex.formatter` chooses. */
async function formatAnswer(
    into: LatexTarget,
    asked: z.infer<typeof formatShape>
): Promise<Response> {
    const { formatter, paths } = into.formatting();
    if (formatter === 'none') return refuse(409, 'format-none');
    const program = paths[formatter] === '' ? formatter : paths[formatter];
    const args = formatArgs(formatter, basename(asked.file ?? 'main.tex'));
    const ran = await run(program, args, { input: asked.text }, into.tools);
    if (ran.kind !== 'done') {
        return failure(ran, {
            missing: MISSING[formatter],
            timeout: 'format-timeout',
            failed: 'format-failed'
        });
    }
    return json({ text: ran.stdout }, { headers: NO_STORE });
}

/** The words a SyncTeX run is refused with. */
const SYNCTEX_WORDS = {
    missing: 'synctex-missing',
    timeout: 'synctex-timeout',
    failed: 'synctex-failed'
} as const;

/** The PDF a main file's build wrote and whether its SyncTeX file is beside it. */
function builtPdf(into: LatexTarget, bound: string, main: string): { pdf: string } | Response {
    const folders = foldersFor(into, bound, main);
    const base = stemOf(basename(main));
    const pdf = realPath(join(folders.out, `${base}.pdf`));
    if (pdf === null || !isFile(pdf)) return refuse(404, 'synctex-no-pdf');
    const synced = [`${base}.synctex.gz`, `${base}.synctex`].some((name) =>
        isFile(join(folders.out, name))
    );
    return synced ? { pdf } : refuse(404, 'synctex-no-file');
}

/** The places a line of a source file was typeset at, in the PDF of the file's main. */
async function forwardAnswer(
    into: LatexTarget,
    asked: z.infer<typeof forwardShape>
): Promise<Response> {
    const found = rootFor(into, asked.root, asked.file);
    if (found instanceof Response) return found;
    if (found === null) return refuse(404, 'not-a-main');
    const built = builtPdf(into, found.bound, found.main);
    if (built instanceof Response) return built;
    const program = programFor(into.building().synctexPath);
    const ran = await forward(
        program,
        built.pdf,
        found.real,
        asked.line,
        asked.column ?? 0,
        into.tools
    );
    if (ran.kind !== 'done') return failure(ran, SYNCTEX_WORDS);
    return json({ places: placesOf(ran.stdout) }, { headers: NO_STORE });
}

/** The source line a place on a page of a PDF of a root came from. */
async function inverseAnswer(
    into: LatexTarget,
    asked: z.infer<typeof inverseShape>
): Promise<Response> {
    const found = resolved(into, asked.root, asked.pdf);
    if (found instanceof Response) return found;
    if (!found.real.toLowerCase().endsWith('.pdf') || !isFile(found.real)) {
        return refuse(404, 'synctex-no-pdf');
    }
    const program = programFor(into.building().synctexPath);
    const ran = await inverse(program, found.real, asked.page, asked.x, asked.y, into.tools);
    if (ran.kind !== 'done') return failure(ran, SYNCTEX_WORDS);
    const source = sourceOf(ran.stdout);
    if (source === null) return json({ source: null }, { headers: NO_STORE });
    const file = placedIn(found.bound, dirname(found.real), source.input);
    if (file === null) return refuse(403, 'synctex-outside');
    const named = source.column === null ? {} : { column: source.column };
    return json({ source: { file, line: source.line, ...named } }, { headers: NO_STORE });
}

/** Open the documentation of a package in this machine's PDF application. */
async function texdocAnswer(
    into: LatexTarget,
    asked: z.infer<typeof texdocShape>
): Promise<Response> {
    const name = texdocName(asked.name);
    if (name === null) return refuse(400, 'texdoc-name');
    const ran = await texdoc(name, into.tools);
    if (ran.kind !== 'done') {
        return failure(ran, {
            missing: 'texdoc-missing',
            timeout: 'texdoc-timeout',
            failed: 'texdoc-failed'
        });
    }
    return json({ ok: true }, { headers: NO_STORE });
}

/**
 * POST /api/latex: format a text with the formatter `latex.formatter` chooses, look up a source
 * line in the PDF (`forward`) or a place of the PDF in the source (`inverse`), or open a package's
 * documentation (`texdoc`). The write token admits each, and is checked before the action is read.
 */
export async function handleLatexPost(
    request: Request,
    token: string,
    into: LatexTarget
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: into.text });
    if (read instanceof Response) return read;
    const asked = actionShape.safeParse(read.body);
    if (!asked.success) return refuse(400, 'not-an-action');
    switch (asked.data.action) {
        case 'format':
            return formatAnswer(into, asked.data);
        case 'forward':
            return forwardAnswer(into, asked.data);
        case 'inverse':
            return inverseAnswer(into, asked.data);
        case 'texdoc':
            return texdocAnswer(into, asked.data);
    }
}
