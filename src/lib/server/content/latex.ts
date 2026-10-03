// Layer 2, server. What the files of one folder say about LaTeX: which of its `.tex` files are main
// files, which program a main file asks for, what the last build of each left beside it, and the
// errors and warnings of that build's log.
//
// content/latex/endpoint.ts answers the requests over this module and routes/api/(sessions)/latex/
// +server.ts is the two lines that join them, since a route module may export only its verbs. What
// a build runs is not here: the two steps are terminals, started through
// lib/server/machine/pty/routes.ts, and this module reads the files those terminals leave behind.
//
// A main file is content, not configuration: every `.tex` directly in a folder whose text carries
// `\documentclass` outside a comment. No manifest key names one, so a folder that gains a
// supplement or a highlights file is found the moment it is written, and nothing has to be kept in
// step with the folder. A project's mains sit in its `manuscript/` folder; any other folder of a
// served root is read the same way.
//
// The program a main asks for is a magic comment of its head (`% !TEX program = xelatex`), read by
// data/prose/latex.ts, the one reader of LaTeX text the page shares, bound to the parser by
// latex/reader.ts.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`).

import { closeSync, openSync, readFileSync, readdirSync, readSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { PROGRAMS, uncommented, type Program } from '../../data/prose/latex.ts';
import { inside } from '../core/paths.ts';
import { magicComments } from './latex/reader.ts';

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
     * The file the log named, relative to the base the answer is read against, or the empty string
     * when it named none.
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
    /** The program its magic comment names, and `pdflatex` for any other value or none. */
    program: Program;
    /** The PDF it builds to, relative to the answer's base, whether or not it is there. */
    pdfPath: string;
    /** When the PDF was last written, in milliseconds, and null when there is no PDF. */
    pdf: number | null;
    /** When the log was last written, in milliseconds, and null when there is no log. */
    log: number | null;
};

/** When a file was last written, and null when it is not there or cannot be read. */
function mtimeOf(path: string): number | null {
    try {
        const stat = statSync(path);
        return stat.isFile() ? stat.mtimeMs : null;
    } catch {
        return null;
    }
}

/** Whether the text declares a document class somewhere outside a comment. */
export function declaresClass(text: string): boolean {
    for (const line of text.split('\n')) {
        if (uncommented(line).includes('\\documentclass')) return true;
    }
    return false;
}

/** A file as text, and the empty string when it cannot be read. */
export function readText(path: string): string {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return '';
    }
}

/** Whether the path is a file, following a link, so a main file kept as a symlink counts as one. */
export function isFile(path: string): boolean {
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
export function head(path: string): string {
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
 * The main files directly in one folder: every `.tex` that declares a document class, `main.tex`
 * first and the rest by name. A folder that is missing or unreadable has none.
 */
export function mainsIn(dir: string): string[] {
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

/**
 * Whether a name is a main file of the folder. A name starting with a dash is refused even when a
 * file of that name is a main, since a program given it would read it as an option.
 */
export function isMainOf(dir: string, name: string): boolean {
    return !name.startsWith('-') && mainsIn(dir).includes(name);
}

/**
 * The main files of one project folder, which are those of its `manuscript/` folder. A folder with
 * no `manuscript/` has none, which is a project the panel is not drawn for rather than an error.
 */
export function mains(folder: string): string[] {
    return mainsIn(join(folder, MANUSCRIPT));
}

/**
 * The program a main file asks for in its magic comment `% !TEX program = <name>`, in any case.
 * Anything else, a program latexmk has no switch for among them, or no comment at all, is
 * `pdflatex`.
 */
export function programOf(path: string): Program {
    const named = magicComments(head(path)).get('program')?.toLowerCase();
    return PROGRAMS.find((one) => one === named) ?? PROGRAMS[0];
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
 * The file the log named, against the prefix of the answer. A log built by a terminal this view
 * starts runs in the folder of the main file and names `./main.tex`; a log built elsewhere names an
 * absolute path, which is made relative to the folder when it is inside it and left as it came when
 * it is not.
 */
function relFile(named: string, dir: string, prefix: string): string {
    const trimmed = named.trim();
    const cut = trimmed.startsWith('./') ? trimmed.slice(2) : trimmed;
    if (!cut.startsWith('/')) return placedUnder(prefix, cut);
    if (dir === '' || !inside(cut, dir)) return cut;
    return placedUnder(prefix, relative(dir, cut).split(sep).join('/'));
}

/** A name under a prefix with its `.` and `..` segments resolved, as a slash-separated path. */
function placedUnder(prefix: string, name: string): string {
    return prefix === '' ? name : posix.normalize(`${prefix}/${name}`);
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
 * `dir` is the folder the build ran in, for the one case a log names an absolute path, and `prefix`
 * is put in front of every file name a row names.
 */
export function parseLog(text: string, dir = '', prefix = ''): LatexLog {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const errors: LatexIssue[] = [];
    const warnings: LatexIssue[] = [];
    for (let at = 0; at < lines.length; at += 1) {
        const line = lines[at];
        const placed = FILE_LINE.exec(line);
        if (placed !== null) {
            errors.push({
                file: relFile(placed[1], dir, prefix),
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

/** What a path in an answer is joined onto: one prefix for the PDF and one for the log's files. */
export type Prefixes = { pdf: string; files: string };

/**
 * What the last build of one main file in `dir` left: its PDF, its log, and what that log held.
 * Each path of the answer is the prefix of its kind joined to the name, so the same read answers
 * for a project, whose paths are against its folder, and for a folder of a root, whose paths are
 * against the root.
 */
export function buildStateIn(dir: string, main: string, prefixes: Prefixes): MainState {
    const base = main.endsWith('.tex') ? main.slice(0, -'.tex'.length) : main;
    const log = mtimeOf(join(dir, `${base}.log`));
    const parsed =
        log === null
            ? { errors: [], warnings: [] }
            : parseLog(readText(join(dir, `${base}.log`)), dir, prefixes.files);
    return {
        main,
        program: programOf(join(dir, main)),
        pdfPath: placedUnder(prefixes.pdf, `${base}.pdf`),
        pdf: mtimeOf(join(dir, `${base}.pdf`)),
        log,
        ...parsed
    };
}

/** The last build of one main file of a project: paths against the project's folder. */
export function buildState(folder: string, main: string): MainState {
    return buildStateIn(join(folder, MANUSCRIPT), main, { pdf: MANUSCRIPT, files: '' });
}
