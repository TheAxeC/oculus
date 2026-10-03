// Layer 2, server. The /api/latex endpoint: what a folder holds of LaTeX, answered for a project's
// manuscript folder (`?id=`) or for any folder of a served root (`?root=&path=`), the main file a
// `.tex` file builds through (`?root=&file=`), the outline of a main file (`&outline=<main>`), its
// word count (`&count=<main>`), and the formatting of a text (a POST).
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
import type { Project } from '../../../data/model/index.ts';
import type { Formatter, LatexRefusal } from '../../../data/prose/latex.ts';
import type { LatexFormatting } from '../../../data/sources/config/settings.ts';
import type { OpsRefusal } from '../../../data/file-ops.ts';
import { tokenedBody } from '../../core/auth.ts';
import { realPath } from '../../core/paths.ts';
import { projectDirectory, resolveRootPath, type Root } from '../../files/files.ts';
import {
    MANUSCRIPT,
    buildStateIn,
    isFile,
    isMainOf,
    mainsIn,
    type MainState,
    type Prefixes
} from '../latex.ts';
import { outlineOf, type Outline } from './outline.ts';
import { rootOf } from './root.ts';
import { readCount, run, type Tools } from './tools.ts';

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
    /** How the two programs are run when a caller needs them other than the machine's own. */
    tools?: Tools;
};

/** The state of a project: its folder, and one state per main file. */
export type ProjectAnswer = { folder: string; mains: MainState[] };

/** The outline of a main file of a project, its files against the project's folder. */
export type ProjectOutline = Outline & { folder: string };

/** The state of a folder of a root: the root, the folder against it, and one state per main. */
export type FolderAnswer = { root: string; path: string; mains: MainState[] };

/** A build's files are read again whenever the page asks, so nothing here is ever cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The query of a request: every parameter is text, and a parameter that is absent is undefined. */
const queryShape = z.object({
    id: z.string().optional(),
    root: z.string().optional(),
    path: z.string().optional(),
    file: z.string().optional(),
    outline: z.string().optional(),
    count: z.string().optional()
});
type Query = z.infer<typeof queryShape>;

/** The body of a format request: the text, and the name of its file, which badness reads. */
const formatShape = z.object({
    action: z.literal('format'),
    text: z.string(),
    file: z.string().optional()
});

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
    bound: string;
    named: string;
    prefixes: Prefixes;
    answer: (mains: MainState[]) => unknown;
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
        bound: found.bound,
        named: found.bound,
        prefixes: { pdf: folder, files: folder },
        answer: (mains) => ({ root, path: folder, mains }) satisfies FolderAnswer,
        outlined: (outline) => outline
    };
}

/** The main file a `.tex` file builds through, as the folder and name the page reads it by. */
function rootAnswer(into: LatexTarget, root: string, file: string): Response {
    const found = resolved(into, root, file);
    if (found instanceof Response) return found;
    if (!isFile(found.real)) return refuse(404, 'not-a-file');
    const main = found.real.endsWith('.tex') ? rootOf(found.bound, found.real) : null;
    if (main === null) return json({ main: null }, { headers: NO_STORE });
    const path = relativeTo(found.bound, dirname(main));
    return json({ root, path, main: basename(main) }, { headers: NO_STORE });
}

/** The outline of one main file of the scope's folder. */
function outlineAnswer(into: LatexTarget, scope: Scope, main: string): Response {
    const real = realPath(join(scope.dir, main));
    if (!isMainOf(scope.dir, main) || real === null) {
        return refuse(404, 'not-a-main');
    }
    const outline = outlineOf(scope.bound, scope.dir, real, scope.named);
    return json(scope.outlined(outline), { headers: NO_STORE });
}

/** The word count of one main file of the scope's folder, run in that folder. */
async function countAnswer(into: LatexTarget, scope: Scope, main: string): Promise<Response> {
    if (!isMainOf(scope.dir, main)) {
        return refuse(404, 'not-a-main');
    }
    const args = ['-inc', '-total', '-sum', '-brief', '-utf8', main];
    const ran = await run('texcount', args, { cwd: scope.dir }, into.tools);
    if (ran.kind === 'missing') return refuse(502, 'count-missing');
    if (ran.kind === 'timeout') return refuse(504, 'count-timeout');
    if (ran.kind === 'failed') return refuse(502, 'count-failed');
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
    const { id, root, path, file, outline, count } = query;
    if (id !== undefined && root !== undefined) {
        return refuse(400, 'not-an-action');
    }
    if (id === undefined && root === undefined) {
        return refuse(400, 'not-an-action');
    }
    if (outline !== undefined && count !== undefined) {
        return refuse(400, 'not-an-action');
    }
    if (root !== undefined && file !== undefined) {
        return path === undefined ? rootAnswer(into, root, file) : refuse(400, 'not-an-action');
    }
    if (root !== undefined && path === undefined) {
        return refuse(400, 'not-an-action');
    }
    const scope =
        id !== undefined ? projectScope(into, id) : folderScope(into, root ?? '', path ?? '');
    if (scope instanceof Response) return scope;
    if (outline !== undefined) return outlineAnswer(into, scope, outline);
    if (count !== undefined) return countAnswer(into, scope, count);
    const mains = mainsIn(scope.dir).map((main) => buildStateIn(scope.dir, main, scope.prefixes));
    return json(scope.answer(mains), { headers: NO_STORE });
}

/**
 * POST /api/latex: format a text with the formatter `latex.formatter` chooses, which the write
 * token admits. The program is the one its path key names, or the one found on PATH when that is
 * empty.
 */
export async function handleLatexPost(
    request: Request,
    token: string,
    into: LatexTarget
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE });
    if (read instanceof Response) return read;
    const asked = formatShape.safeParse(read.body);
    if (!asked.success) return refuse(400, 'not-an-action');
    const { formatter, paths } = into.formatting();
    if (formatter === 'none') return refuse(409, 'format-none');
    const program = paths[formatter] === '' ? formatter : paths[formatter];
    const args = formatArgs(formatter, basename(asked.data.file ?? 'main.tex'));
    const ran = await run(program, args, { input: asked.data.text }, into.tools);
    if (ran.kind === 'missing') return refuse(502, MISSING[formatter]);
    if (ran.kind === 'timeout') return refuse(504, 'format-timeout');
    if (ran.kind === 'failed') return refuse(502, 'format-failed');
    return json({ text: ran.stdout }, { headers: NO_STORE });
}
