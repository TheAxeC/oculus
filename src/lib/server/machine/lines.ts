// Layer 2, server. The Status view's line counts: oculus's own tracked files, their blank, comment
// and code lines per folder and language as cloc counts them, and the count of their lines that
// carry a tag the TODO rule below reads.
//
// The files are what git tracks in the engine folder (server/core/git/files.ts, trackedFiles), less
// the plan's ledger under `.scratch/`, the diagrams `npm run diagrams` writes under
// `docs/diagrams/` and the lock file, since none of them is code anyone writes by hand. A folder
// that lies in no repository, as a release app's folder does, has its shipped entries walked
// instead (data/places/shipped.ts), with the same three left out and no `node_modules` folder
// entered; in a repository a git that fails is said as such.
// cloc is a Perl program from the `cloc` package, run as a separate process with list arguments
// and a timeout and never imported: it reads the paths one per line from its standard input and
// answers one JSON object keyed by path. It runs asynchronously, so the server keeps answering
// while it counts, and with `--skip-uniqueness`, since two tracked files with the same bytes are
// two files of the tree and cloc would otherwise count one of them. What stays here is what cloc
// does not know: the file list, the folder a file is counted under, the TODO rule and the sums.
//
// Nothing is held between requests: no cache and no timer. Each GET counts afresh and the page
// store holds the answer for the page's life, so a Count again is always a new count.

import { spawn } from 'node:child_process';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { isMap } from '../../data/helpers/guards.ts';
import type { FolderLines, LanguageLines, LineCount, LineTally } from '../../data/model/index.ts';
import { SHIPPED_SOURCES } from '../../data/places/shipped.ts';
import type { GitCredentials } from '../core/git/credentials.ts';
import { trackedFiles } from '../core/git/files.ts';

/** The folder name of the files no folder holds. */
export const TOP_LEVEL = '';

/** Milliseconds cloc is given before the count is given up on. */
export const CLOC_TIMEOUT_MS = 60000;

/** The perl that runs cloc, found on the PATH. */
const PERL = 'perl';

/** The folders and the file the count leaves out, as path prefixes and a whole path. */
const LEFT_OUT_FOLDERS = ['.scratch/', 'docs/diagrams/'];
const LEFT_OUT_FILES = ['package-lock.json'];

/**
 * A TODO tag: the word in capitals, an optional owner in parentheses, and never the start of a
 * longer word, so prose about todos, a `TODO_LABEL` constant and a lowercase `todo:` are not tags.
 */
const TAG = 'TODO(?!\\w)(?:\\([^)\\n]*\\))?';

/**
 * A line carrying a TODO: the tag after a comment marker (`//`, `/*`, `*`, `#`, `;`, `--`, `<!--`),
 * its colon optional, or the tag opening the line, after an optional list bullet, with a colon.
 */
const TODO_LINE = new RegExp(
    `(?://|/\\*|\\*|#|;|--|<!--)\\s{0,}${TAG}\\s{0,}:?|^\\s{0,}(?:[-*+]\\s+)?${TAG}\\s{0,}:`
);

/** Whether a path is counted: every tracked path but the ledger, the diagrams and the lock file. */
export function counted(path: string): boolean {
    if (LEFT_OUT_FILES.includes(path)) return false;
    return !LEFT_OUT_FOLDERS.some((folder) => path.startsWith(folder));
}

/**
 * The folder a path is counted under: `src/lib/<x>` for a file inside a folder of `src/lib`,
 * `src/routes` for every route, `src` for the rest of `src`, the first segment of any other path,
 * and the top level for a path with no folder.
 */
export function folderOf(path: string): string {
    const parts = path.split('/');
    if (parts.length === 1) return TOP_LEVEL;
    if (parts[0] !== 'src') return parts[0];
    if (parts[1] === 'lib' && parts.length >= 4) return `src/lib/${parts[2]}`;
    if (parts[1] === 'routes') return 'src/routes';
    return 'src';
}

/** Whether one line carries a TODO tag by the rule above. */
export function todoLine(line: string): boolean {
    return TODO_LINE.test(line);
}

/** How many lines of a text carry a TODO tag. */
function todoCount(text: string): number {
    return text.split('\n').filter(todoLine).length;
}

/** One file as cloc reports it. */
type Clocked = { language: string; blank: number; comment: number; code: number };

/** What a count answers: the count, or one sentence saying what failed. */
export type LinesAnswer = LineCount | { error: string };

/**
 * What a count may be pointed at other than the installed cloc and the perl on the PATH, which is
 * what a test does, and the signal of the request it answers: a request closed before the count
 * ends stops cloc, since nobody is left to read the answer. The tracked files are asked of git with
 * the server context's credentials.
 */
export type LinesOptions = {
    cloc?: string;
    perl?: string;
    timeout?: number;
    signal?: AbortSignal;
    credentials: GitCredentials;
};

/** What cloc is run with: the perl, the script, the timeout and the signal that stops it. */
type ClocRun = { perl: string; script: string; timeout: number; signal?: AbortSignal };

/** Whether the request a count answers has been closed; read afresh at each step of the count. */
function closed(signal: AbortSignal | undefined): boolean {
    return signal?.aborted === true;
}

/** The installed cloc script's path, or null when the package is not installed. */
function installedCloc(): string | null {
    try {
        return createRequire(import.meta.url).resolve('cloc/lib/cloc');
    } catch {
        return null;
    }
}

/** A tally with nothing in it. */
function zero(): LineTally {
    return { files: 0, blank: 0, comment: 0, code: 0, todo: 0 };
}

/** Add one file's lines to a tally. */
function add(into: LineTally, file: Clocked, todo: number): void {
    into.files += 1;
    into.blank += file.blank;
    into.comment += file.comment;
    into.code += file.code;
    into.todo += todo;
}

/** A whole count of lines, as cloc writes each of the three. */
const lineCountShape = z.number().refine((held) => Number.isInteger(held) && held >= 0);

/** One file of cloc's answer: its language and its three counts, and no other key is read. */
const clocFileShape = z.object({
    language: z.string(),
    blank: lineCountShape,
    comment: lineCountShape,
    code: lineCountShape
}) satisfies z.ZodType<Clocked>;

/**
 * The files of cloc's answer, keyed by path, or null when the answer is not cloc's shape. The
 * `header` and `SUM` keys are cloc's run and its own sum, not files, and are never read as one.
 */
function clocked(text: string): Map<string, Clocked> | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return null;
    }
    if (!isMap(parsed)) return null;
    const files = new Map<string, Clocked>();
    for (const [path, value] of Object.entries(parsed)) {
        if (path === 'header' || path === 'SUM') continue;
        const file = clocFileShape.safeParse(value);
        if (!file.success) return null;
        files.set(path, file.data);
    }
    return files;
}

/** What one cloc run came back with: its standard output, or one sentence saying what failed. */
type Run = { text: string } | { error: string };

/**
 * cloc over the paths, run by perl in the engine folder with the paths on its standard input. A
 * list of arguments, never a shell, and a timeout; a perl that will not start, a cloc that exits
 * other than 0 and one that runs past the timeout each answer a sentence naming it. An abort of the
 * signal kills the child and answers that the request was closed.
 */
function runCloc(engine: string, paths: string[], run: ClocRun): Promise<Run> {
    const { perl, script, timeout, signal } = run;
    return new Promise((resolve) => {
        const argv = [
            script,
            '--list-file=-',
            '--by-file',
            '--json',
            '--quiet',
            '--skip-uniqueness'
        ];
        const child = spawn(perl, argv, {
            cwd: engine,
            timeout,
            signal,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        const out: Buffer[] = [];
        let started = true;
        child.stdout.on('data', (chunk: Buffer) => out.push(chunk));
        // cloc says what it could not read on standard error; an unread pipe would fill and stall.
        child.stderr.resume();
        // A cloc that exits before it has read every path closes the pipe under the write.
        child.stdin.on('error', () => undefined);
        child.on('error', (error: NodeJS.ErrnoException) => {
            started = false;
            if (error.name === 'AbortError') {
                resolve({ error: 'The request was closed, so cloc was stopped.' });
                return;
            }
            resolve({
                error: `perl could not be started to run cloc (${error.code ?? error.message}).`
            });
        });
        child.on('close', (code, signal) => {
            if (!started) return;
            if (signal !== null) {
                resolve({
                    error: `cloc was stopped by ${signal} before it answered; it is given ${timeout / 1000} s.`
                });
            } else if (code !== 0) {
                resolve({ error: `cloc exited with code ${code}.` });
            } else {
                resolve({ text: Buffer.concat(out).toString('utf8') });
            }
        });
        child.stdin.end(paths.map((path) => `${path}\n`).join(''));
    });
}

/** The folders of the count in path order, each with its languages in descending code lines. */
function folders(byFolder: Map<string, Map<string, LineTally>>): FolderLines[] {
    const rows: FolderLines[] = [];
    for (const [folder, byLanguage] of byFolder) {
        const row: FolderLines = { folder, ...zero(), languages: [] };
        for (const [language, tally] of byLanguage) {
            const one: LanguageLines = { language, ...tally };
            row.languages.push(one);
            row.files += tally.files;
            row.blank += tally.blank;
            row.comment += tally.comment;
            row.code += tally.code;
            row.todo += tally.todo;
        }
        row.languages.sort(
            (a, b) =>
                b.code - a.code || (a.language < b.language ? -1 : a.language > b.language ? 1 : 0)
        );
        rows.push(row);
    }
    return rows.sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
}

/** The folder a walk of the shipped entries never enters: the installed packages. */
const PACKAGES = 'node_modules';

/** The regular files under a folder of the engine, as paths from the engine; links are skipped. */
async function filesUnder(engine: string, folder: string, into: string[]): Promise<void> {
    const entries = await readdir(join(engine, folder), { withFileTypes: true });
    for (const entry of entries) {
        const path = `${folder}/${entry.name}`;
        if (entry.isDirectory() && entry.name !== PACKAGES) await filesUnder(engine, path, into);
        else if (entry.isFile()) into.push(path);
    }
}

/**
 * The files of the engine's shipped entries (data/places/shipped.ts), as paths from the engine in
 * path order, for a folder git gives no list of. An entry the folder does not hold is passed over,
 * and a link is never followed.
 */
async function shippedFiles(engine: string): Promise<string[]> {
    const paths: string[] = [];
    for (const entry of SHIPPED_SOURCES) {
        let info;
        try {
            info = await lstat(join(engine, entry));
        } catch {
            continue;
        }
        if (info.isDirectory()) await filesUnder(engine, entry, paths);
        else if (info.isFile()) paths.push(entry);
    }
    return paths.sort();
}

/**
 * Whether the engine folder lies in a repository: it, or a folder above it, holds a `.git`, as a
 * checkout does and a release app's folder does not.
 */
function inRepository(engine: string): boolean {
    for (let dir = engine; ; dir = dirname(dir)) {
        if (existsSync(join(dir, '.git'))) return true;
        if (dirname(dir) === dir) return false;
    }
}

/**
 * The files the count reads: what git tracks in the engine folder when it lies in a repository,
 * so a git that fails there is said as such, and the shipped entries walked when it lies in none,
 * as a release app's folder does.
 */
async function countedFrom(
    credentials: GitCredentials,
    engine: string,
    text: Record<string, string>
): Promise<string[]> {
    if (!inRepository(engine)) return shippedFiles(engine);
    const tracked = await trackedFiles(credentials, engine, text);
    if (!tracked.ok) throw new Error(`git could not list the tracked files: ${tracked.error}`);
    return tracked.value;
}

/**
 * Count oculus's own lines in the engine folder. Never throws: a folder whose files cannot be
 * listed, a cloc that fails, an answer that is not cloc's and a file that cannot be read for its
 * TODOs each answer one sentence naming what failed.
 */
export async function countLines(
    engine: string,
    text: Record<string, string>,
    options: LinesOptions
): Promise<LinesAnswer> {
    try {
        let listed: string[];
        try {
            listed = await countedFrom(options.credentials, engine, text);
        } catch (error) {
            const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
            return { error: `The files to count could not be listed: ${reason}.` };
        }
        // cloc reads one path per line, so a path holding a line break cannot be handed to it.
        const paths = listed.filter((path) => counted(path) && !path.includes('\n'));
        const script = options.cloc ?? installedCloc();
        if (script === null) return { error: 'cloc is not installed; run npm install.' };
        if (closed(options.signal)) return { error: 'The request was closed.' };
        const ran = await runCloc(engine, paths, {
            perl: options.perl ?? PERL,
            script,
            timeout: options.timeout ?? CLOC_TIMEOUT_MS,
            signal: options.signal
        });
        if ('error' in ran) return ran;
        const files = clocked(ran.text);
        if (files === null) return { error: "cloc's answer is not the JSON it writes." };
        const byFolder = new Map<string, Map<string, LineTally>>();
        const total = zero();
        // One file at a time, so a tree of thousands never holds thousands of files open at once.
        for (const path of paths) {
            if (closed(options.signal)) return { error: 'The request was closed.' };
            const file = files.get(path);
            if (file === undefined) continue;
            let todo: number;
            try {
                todo = todoCount(await readFile(join(engine, path), 'utf8'));
            } catch {
                return { error: `${path} could not be read for its TODO count.` };
            }
            const folder = folderOf(path);
            const languages = byFolder.get(folder) ?? new Map<string, LineTally>();
            byFolder.set(folder, languages);
            const tally = languages.get(file.language) ?? zero();
            languages.set(file.language, tally);
            add(tally, file, todo);
            add(total, file, todo);
        }
        return { rows: folders(byFolder), total, counted: new Date().toISOString() };
    } catch (error) {
        const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
        return { error: `The count failed: ${reason}.` };
    }
}

/**
 * GET /api/lines: the count, 200 when it counted and 500 with its sentence when it failed. The
 * count is handed the request's signal, so a closed request stops it.
 */
export async function handleLines(
    request: Request,
    count: (signal: AbortSignal) => Promise<LinesAnswer>
): Promise<Response> {
    const said = await count(request.signal);
    return json(said, { status: 'error' in said ? 500 : 200 });
}
