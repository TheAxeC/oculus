// Layer 2, server. The LaTeX state of one project: which files under its `manuscript/` folder are
// main files, what the last build left beside each, and the errors and warnings of that build's
// log.
//
// routes/api/(sessions)/latex/+server.ts is the endpoint and holds nothing but its GET, since a
// route module may export only its verbs, the pattern lib/server/files/project-files.ts already
// holds. What a build runs is not here: the two steps are terminals, started through
// lib/server/machine/pty/routes.ts, and this module reads the files those terminals leave behind.
//
// A main file is content, not configuration: every `.tex` directly under `manuscript/` whose text
// carries `\documentclass` outside a comment. No manifest key names one, so a manuscript that gains
// a supplement or a highlights file is found the moment it is written, and nothing has to be kept
// in step with the folder.
//
// The folder read is the reader's, never the request's: the id names a project the server already
// holds in its portfolio snapshot, and the folder that project declares is joined to the hub and
// checked against it again before anything is opened.

import { closeSync, openSync, readFileSync, readdirSync, readSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { sameOrigin } from '../core/auth.ts';
import { projectDirectory } from '../machine/pty/chat.ts';
import type { Project } from '../../data/model.ts';

/** The folder a project's main files sit directly under. */
export const MANUSCRIPT = 'manuscript';

/** The main file every manuscript has when it has one, drawn first whatever the rest sort as. */
const FIRST = 'main.tex';

/** How much of a `.tex` file is read to decide whether it declares a document class. */
const HEAD_BYTES = 65536;

/** How many lines of a log a warning's message may be joined from before it is cut. */
const JOIN_MAX = 8;

/** One error or warning of a build: where it is, and what it says, in one line. */
export type LatexIssue = {
    /**
     * The file the log named, relative to `manuscript/`, or the empty string when it named none.
     */
    file: string;
    /** The line the log named, and null when it named none. */
    line: number | null;
    message: string;
};

/** What one build's log held. */
export type LatexLog = { errors: LatexIssue[]; warnings: LatexIssue[] };

/** One main file and what the last build of it left. */
export type MainState = LatexLog & {
    /** The file's own name, such as `main.tex`. */
    main: string;
    /** The PDF it builds to, relative to the project folder, whether or not it is there. */
    pdfPath: string;
    /** When the PDF was last written, in milliseconds, and null when there is no PDF. */
    pdf: number | null;
    /** When the log was last written, in milliseconds, and null when there is no log. */
    log: number | null;
};

/** What the endpoint answers with: the project's folder, and one state per main file. */
export type LatexAnswer = {
    /** The project's folder relative to the hub, which a PDF's own path is built on. */
    folder: string;
    mains: MainState[];
};

/**
 * What a LaTeX read needs: the hub the folder sits in, and the portfolio the id is checked against.
 */
export type LatexTarget = {
    hub: string;
    project: (id: string) => Pick<Project, 'folder'> | null;
};

/** A build's files are read again whenever the panel asks, so nothing here is ever cached. */
const CACHE = 'no-store';

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': CACHE }
    });
}

/** Whether a path the log named is the build folder itself or sits inside it. */
function inside(path: string, folder: string): boolean {
    const full = resolve(path);
    const root = resolve(folder);
    return full === root || full.startsWith(root + sep);
}

/** When a file was last written, and null when it is not there or cannot be read. */
function mtimeOf(path: string): number | null {
    try {
        const stat = statSync(path);
        return stat.isFile() ? stat.mtimeMs : null;
    } catch {
        return null;
    }
}

/**
 * One line with its comment cut off: everything from the first `%` that is not itself escaped. A
 * backslash takes the character after it, which is what makes `\%` a per-cent sign and not a
 * comment, and `\\%` a comment again.
 */
function code(line: string): string {
    for (let at = 0; at < line.length; at += 1) {
        const char = line[at];
        if (char === '\\') {
            at += 1;
            continue;
        }
        if (char === '%') return line.slice(0, at);
    }
    return line;
}

/** Whether the text declares a document class somewhere outside a comment. */
export function declaresClass(text: string): boolean {
    for (const line of text.split('\n')) {
        if (code(line).includes('\\documentclass')) return true;
    }
    return false;
}

/** A file as text, and the empty string when it cannot be read. */
function readText(path: string): string {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return '';
    }
}

/** Whether the path is a file, following a link, so a main file kept as a symlink counts as one. */
function isFile(path: string): boolean {
    try {
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/**
 * The first bytes of a file, and no more of it: a preamble is at the top, and a `.tex` that holds a
 * whole book is not read to decide what it declares. The rule the text is read for is "a
 * `\documentclass` outside a comment" and nothing more, so one inside `\iffalse ... \fi` counts.
 */
function head(path: string): string {
    let handle: number | null = null;
    try {
        handle = openSync(path, 'r');
        const bytes = new Uint8Array(HEAD_BYTES);
        const read = readSync(handle, bytes, 0, HEAD_BYTES, 0);
        return new TextDecoder().decode(bytes.subarray(0, read));
    } catch {
        return '';
    } finally {
        if (handle !== null) closeSync(handle);
    }
}

/**
 * The main files of one project folder: every `.tex` directly under `manuscript/` that declares a
 * document class, `main.tex` first and the rest by name. A folder with no `manuscript/` has none,
 * which is a project the panel is not drawn for rather than an error.
 */
export function mains(folder: string): string[] {
    const dir = join(folder, MANUSCRIPT);
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return [];
    }
    const found: string[] = [];
    for (const entry of entries) {
        if (!entry.name.endsWith('.tex')) continue;
        const path = join(dir, entry.name);
        // The kind comes from a stat rather than the directory entry, which calls a symlink a link
        // and not a file however ordinary the file it points at is.
        if (!isFile(path)) continue;
        if (declaresClass(head(path))) found.push(entry.name);
    }
    found.sort((left, right) => {
        if (left === FIRST) return right === FIRST ? 0 : -1;
        if (right === FIRST) return 1;
        return left.localeCompare(right);
    });
    return found;
}

/** An error row of a `-file-line-error` log: the file, the line, and the rest of the row. */
const FILE_LINE = /^(.+?):(\d+): (.+)$/;

/** The row pdftex prints for an error it attributes to no file. */
const BANG = /^! (.+)$/;

/** The context row that follows such an error, whose number is the line it stopped on. */
const STOPPED = /^l\.(\d+)/;

/** The three warning openers: LaTeX's own, a package's and a class's. */
const WARNING = /^(LaTeX(?: Font)?|Package \S+|Class \S+) Warning: (.*)$/;

/** Where a warning says it happened, when it says so at all. */
const AT_LINE = /on input line (\d+)/;

/** One message with its runs of whitespace collapsed, which is what a wrapped log row leaves. */
function oneLine(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * The file the log named, relative to `manuscript/`. A log built by the terminal this panel starts
 * runs in that folder and names `./main.tex`; a log built elsewhere names an absolute path, which
 * is made relative when it is inside the folder and left as it came when it is not.
 */
function relFile(named: string, dir: string): string {
    const trimmed = named.trim();
    const cut = trimmed.startsWith('./') ? trimmed.slice(2) : trimmed;
    if (dir === '' || !cut.startsWith('/')) return cut;
    if (!inside(cut, dir)) return cut;
    return relative(dir, cut).split(sep).join('/');
}

/**
 * The continuation of a warning: the rows a package writes under its own name, and any row that is
 * indented, up to the blank row that closes the message. A row that opens a new message closes this
 * one, so two warnings in a row never become one.
 */
function continued(lines: string[], from: number, source: string): { text: string; next: number } {
    const parts: string[] = [];
    let at = from;
    const prefix = source === '' ? '' : `(${source})`;
    while (at < lines.length && parts.length < JOIN_MAX) {
        const line = lines[at];
        if (line.trim() === '') break;
        const own = prefix !== '' && line.startsWith(prefix);
        if (!own && !/^\s/.test(line)) break;
        parts.push(own ? line.slice(prefix.length) : line);
        at += 1;
    }
    return { text: parts.join(' '), next: at };
}

/** The line a `!` error stopped on, read from the context rows that follow it. */
function stoppedAt(lines: string[], from: number): number | null {
    for (let at = from; at < lines.length && at < from + JOIN_MAX; at += 1) {
        if (lines[at].trim() === '') break;
        const found = STOPPED.exec(lines[at]);
        if (found !== null) return Number(found[1]);
    }
    return null;
}

/**
 * The errors and warnings of one `latexmk -file-line-error` log. Only what a row itself names is
 * attributed: the `file:line:` rows carry both, a `!` row carries the line of the context under it,
 * and a warning carries the line it says it is on. Nothing is inferred from the file the log
 * happened to have open, since a wrong file and line read worse than none.
 *
 * `dir` is the folder the build ran in, for the one case a log names an absolute path.
 */
export function parseLog(text: string, dir = ''): LatexLog {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const errors: LatexIssue[] = [];
    const warnings: LatexIssue[] = [];
    for (let at = 0; at < lines.length; at += 1) {
        const line = lines[at];
        const placed = FILE_LINE.exec(line);
        if (placed !== null) {
            errors.push({
                file: relFile(placed[1], dir),
                line: Number(placed[2]),
                message: oneLine(placed[3])
            });
            continue;
        }
        const bang = BANG.exec(line);
        if (bang !== null) {
            errors.push({ file: '', line: stoppedAt(lines, at + 1), message: oneLine(bang[1]) });
            continue;
        }
        const warned = WARNING.exec(line);
        if (warned === null) continue;
        // A package and a class continue a long message under their own name in brackets; LaTeX's
        // own warnings continue indented, and both are what `continued` is given the name for.
        const source = warned[1];
        const owner = /^(?:Package|Class) /.test(source)
            ? source.slice(source.indexOf(' ') + 1)
            : '';
        const rest = continued(lines, at + 1, owner);
        const message = oneLine(`${warned[2]} ${rest.text}`);
        const number = AT_LINE.exec(message);
        warnings.push({
            file: '',
            line: number === null ? null : Number(number[1]),
            message: `${source}: ${message}`
        });
        at = rest.next - 1;
    }
    return { errors, warnings };
}

/** What the last build of one main file left: its PDF, its log, and what that log held. */
export function buildState(folder: string, main: string): MainState {
    const dir = join(folder, MANUSCRIPT);
    const base = main.endsWith('.tex') ? main.slice(0, -'.tex'.length) : main;
    const log = mtimeOf(join(dir, `${base}.log`));
    const parsed =
        log === null
            ? { errors: [], warnings: [] }
            : parseLog(readText(join(dir, `${base}.log`)), dir);
    return {
        main,
        pdfPath: `${MANUSCRIPT}/${base}.pdf`,
        pdf: mtimeOf(join(dir, `${base}.pdf`)),
        log,
        ...parsed
    };
}

/**
 * The LaTeX state of the project the request names. Every refusal says what was wrong: a request
 * with no id is a 400, an id the snapshot does not hold is a 404, and so is a folder that would
 * leave the hub. A project with no main file answers with none, which is the panel not being drawn.
 */
export function latexState(into: LatexTarget, id: string): Response {
    if (id === '') return json(400, { error: 'no project id' });
    const project = into.project(id);
    if (project === null) return json(404, { error: `no project with the id ${id}` });
    // One rule for resolving a project's folder beneath the hub, the one the terminal actions run
    // through: a folder that would leave the hub throws there and is a 404 here.
    let folder: string;
    try {
        folder = projectDirectory(into.hub, project.folder);
    } catch {
        return json(404, { error: 'the folder is not inside the hub' });
    }
    const answer: LatexAnswer = {
        folder: project.folder,
        mains: mains(folder).map((main) => buildState(folder, main))
    };
    return json(200, answer);
}

/** The whole endpoint: refuse a request from another origin, or answer for the project it names. */
export function handleLatex(request: Request, into: LatexTarget): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    return latexState(into, new URL(request.url).searchParams.get('id') ?? '');
}
