// Layer 2, client state, pure. What the LaTeX store holds and reads: the types of a folder's main
// files, their outline, their problems and the answers of the SyncTeX, citation and root reads, the
// zod shape each answer is read through, and the few path and query rules that turn an answer into
// state. The store (latex.svelte.ts), the builds (builds.ts) and the server calls
// (calls.ts) share them.
//
// Every path the page holds is against the root: a project's answer, which is against the
// project's folder, is joined onto it when it is read, so the rows, the diagnostics and the PDF
// address all take one form.

import { z } from 'zod';
import { BUILD_OUTCOMES, type BuildOutcome } from '../../../data/model/index.ts';
import { MANUSCRIPT, PROGRAMS, type Program } from '../../../data/prose/latex.ts';
import { joinPath } from '../../../data/helpers/files/paths.ts';
import { anyNumberShape, rowsShape } from '../../../data/shapes/shapes.ts';
import { HUB_ROOT, normalisePath } from '../../sources/fs.ts';
import { targetFields, type LatexTarget } from '../terminal/latex-target.ts';

/** The tone of a notice. */
export type NoticeTone = 'info' | 'warning' | 'error';

/** One thing a notice offers to do about itself, a button in it. */
export type NoticeAction = { label: string; run: () => void };

/** What the LaTeX state asks of the notices: to say a sentence, with the actions that fix it. */
export type LatexNotices = {
    post: (message: string, options?: { tone?: NoticeTone; actions?: NoticeAction[] }) => unknown;
};

/** The macros a document defines, which the Math Preview view draws its formulas with. */
export { macrosOf } from '../../../data/prose/latex.ts';

/** A group of math symbols the TeX view lists, which the views name by this type. */
export type { SymbolGroup } from '../../../data/sources/config/catalog/latex-tables.ts';

/** One error or warning of a build, as the rows draw it. */
export type LatexIssue = { file: string; line: number | null; message: string };

/** One main file of a folder and what the last build of it left. */
export type LatexMain = {
    main: string;
    /** The program its magic comment names, `pdflatex` when it names none the build knows. */
    program: Program;
    /** The PDF it builds to, against the root, whether or not it is there. */
    pdfPath: string;
    /** When the PDF was last written, in milliseconds, and null when there is no PDF. */
    pdf: number | null;
    /** When the log was last written, in milliseconds, and null when there is no log. */
    log: number | null;
    errors: LatexIssue[];
    warnings: LatexIssue[];
    /**
     * How the server says the last build of it came to: running, ok, failed (a stopped build
     * included), or none when no oculus terminal built it. Every page reads the same answer.
     */
    build: BuildOutcome;
    /** The words of the last count, and null before one or once the main is built again. */
    words: number | null;
    /** True from the moment a build of it is asked for until its terminal has ended. */
    building: boolean;
};

/** One folder's LaTeX state as the rows read it, every path against the root. */
export type LatexState = {
    /** The root the paths are against: a project's is the hub. */
    root: string;
    /** The folder of the main files, against the root; the empty string is the root itself. */
    dir: string;
    mains: LatexMain[];
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the target is still to come. */
    loading: boolean;
};

/** One section of a main file's outline, in reading order, its file against the root. */
type LatexOutlineEntry = { level: number; title: string; file: string; line: number };

/** One label of the document: its name, the number its build gave it, and where it is. */
type LatexLabel = { name: string; number: string; file: string; line: number };

/** One float: its kind, caption, label, the number its build gave it, and where it is. */
type LatexFloat = {
    kind: string;
    caption: string;
    label: string;
    number: string;
    file: string;
    line: number;
};

/**
 * The outline of a main file: its sections, labels and floats, the files read only in part (the
 * parser refused them), the files not read at all (too large or unreadable), or an error.
 */
export type LatexOutline = {
    sections: LatexOutlineEntry[];
    labels: LatexLabel[];
    floats: LatexFloat[];
    partial: string[];
    unread: string[];
    error: string;
    /** True while the first answer for the main file is still to come. */
    loading: boolean;
};

/** What a count came to: the words, or the server's reason it did not count. */
export type LatexCount = { words: number | null; error: string };

/**
 * The rule that found a root: its comment, the file itself, a main that includes it, its folder.
 */
type RootHow = 'magic' | 'self' | 'included' | 'folder';

/**
 * What the main file a LaTeX source file builds through is, or null for a file that builds through
 * none: the root's key, the main's folder against it, the main's name and the rule that found it.
 */
export type LatexRoot = {
    root: string;
    path: string;
    main: string;
    /** The PDF its build writes, against the root. */
    pdf: string;
    /** The log its build writes, against the root. */
    log: string;
    how: RootHow;
} | null;

/** What a format request came to: the formatted text, or the server's reason it did not. */
export type LatexFormat = { text: string | null; error: string };

/** One problem of the latest build; its file is against the root, not the main file's folder. */
export type LatexDiagnostic = {
    root: string;
    file: string;
    line?: number;
    severity: 'error' | 'warning';
    message: string;
    source: 'latex';
};

/** How a main file's last build ended, or `idle` when none ran since the page opened. */
export type BuildStatus = 'idle' | 'building' | 'succeeded' | 'failed' | 'stopped';

/** What a step is: the latex action's steps that run a program on a main file. */
type BuildStep = 'build' | 'clean' | 'checkcites';

/** What the page knows of the build of one root: its status, the recipe, the step, when, why. */
export type RootBuild = {
    status: BuildStatus;
    /** The recipe the build ran, or the empty string before the server named one. */
    recipe: string;
    step: BuildStep;
    /** When the status last changed, in milliseconds, and null for `idle`. */
    at: number | null;
    /** The sentence a failure ended with, or the empty string. */
    reason: string;
    /** The terminal the last build ran in, the compiler log, or the empty string before one. */
    terminal: string;
};

/** A root no build has run in. */
export const IDLE_BUILD: RootBuild = {
    status: 'idle',
    recipe: '',
    step: 'build',
    at: null,
    reason: '',
    terminal: ''
};

/** One place a source line was typeset at in a PDF: the page and the box, in PDF points. */
export type SyncPlace = {
    page: number;
    x: number;
    y: number;
    left: number;
    top: number;
    w: number;
    h: number;
};

/** The source line a place in a PDF came from, against the served root. */
type SyncSource = { file: string; line: number; column?: number };

/**
 * What a forward search came to: the places, or the server's reason it gave none; `unbuilt` is set
 * when the reason is that the build left no SyncTeX file.
 */
export type SyncForward = { places: SyncPlace[]; error: string; unbuilt: boolean };

/** What an inverse search came to: the source line, or the server's reason it gave none. */
export type SyncInverse = { source: SyncSource | null; error: string };

/** One citation of a root's bibliographies, with the `.bib` file it is in. */
type LatexCite = {
    key: string;
    type: string;
    title: string;
    author: string;
    year: string;
    line: number;
    file: string;
};

/** The citations of a root and the bibliographies that gave none, or the reason there are none. */
export type LatexCites = { entries: LatexCite[]; unread: string[]; error: string };

/** The packages a root loads, or the reason there are none. */
export type LatexPackages = { names: string[]; error: string };

/** What a request answered that carries no data: ok, or the server's reason it did not. */
export type LatexAnswer = { ok: boolean; error: string };

/** What a target reads as before its answer arrives. */
export const PENDING: LatexState = { root: '', dir: '', mains: [], error: '', loading: true };

/** What no target at all reads as: an empty target asks nothing and waits for nothing. */
export const NOTHING: LatexState = { root: '', dir: '', mains: [], error: '', loading: false };

/** What an outline reads as before its first answer, and what an empty target reads as. */
export const OUTLINE_PENDING: LatexOutline = {
    sections: [],
    labels: [],
    floats: [],
    partial: [],
    unread: [],
    error: '',
    loading: true
};
export const OUTLINE_NOTHING: LatexOutline = { ...OUTLINE_PENDING, loading: false };

/** One issue of a build: a number is a number, and a row without a message draws nothing. */
const issueShape = z.object({
    file: z.string().catch(''),
    line: anyNumberShape.nullable().catch(null),
    message: z.string().min(1)
}) satisfies z.ZodType<LatexIssue>;

/** The issues of one main: those that carry a message, and none for anything but a list. */
const issuesShape = rowsShape(issueShape).catch([]);

/** One main of an answer: a row without a name draws nothing. */
const mainShape = z.object({
    main: z.string().min(1),
    program: z.enum(PROGRAMS).catch(PROGRAMS[0]),
    pdfPath: z.string().catch(''),
    pdf: anyNumberShape.nullable().catch(null),
    log: anyNumberShape.nullable().catch(null),
    errors: issuesShape,
    warnings: issuesShape,
    build: z.enum(BUILD_OUTCOMES).catch('none')
});

/**
 * The body of a state answer: its mains, and the project folder a project's answer is against.
 */
export const bodyShape = z.object({
    mains: rowsShape(mainShape).catch([]),
    folder: z.string().catch('')
});

/** What a body that is not a map says: no mains and no folder. */
export const NO_BODY = bodyShape.parse({});

/** The body of an outline answer; a project's carries the folder its files are against. */
export const outlineBodyShape = z.object({
    sections: rowsShape(
        z.object({
            level: anyNumberShape,
            title: z.string().min(1),
            file: z.string(),
            line: anyNumberShape
        })
    ).catch([]),
    labels: rowsShape(
        z.object({
            name: z.string().min(1),
            number: z.string().catch(''),
            file: z.string(),
            line: anyNumberShape
        })
    ).catch([]),
    floats: rowsShape(
        z.object({
            kind: z.string().catch('figure'),
            caption: z.string().catch(''),
            label: z.string().catch(''),
            number: z.string().catch(''),
            file: z.string(),
            line: anyNumberShape
        })
    ).catch([]),
    partial: rowsShape(z.string()).catch([]),
    unread: rowsShape(z.string()).catch([]),
    folder: z.string().catch('')
});

/** The body of a count answer. */
export const countBodyShape = z.object({ words: anyNumberShape.nullable().catch(null) });

/** The body of a root answer: the main's folder, name and PDF and the rule, or no main. */
export const rootBodyShape = z.object({
    root: z.string().catch(''),
    path: z.string().catch(''),
    main: z.string().min(1).nullable().catch(null),
    pdf: z.string().catch(''),
    log: z.string().catch(''),
    how: z.enum(['magic', 'self', 'included', 'folder']).catch('folder')
});

/** The body of a dependencies answer: each file the main depends on and when it was written. */
export const dependenciesBodyShape = z.object({
    path: z.string().catch(''),
    main: z.string().min(1).nullable().catch(null),
    files: rowsShape(z.object({ path: z.string(), time: anyNumberShape })).catch([])
});

/** The body of a format answer. */
export const formatBodyShape = z.object({ text: z.string().nullable().catch(null) });

/** The body of a forward search answer. */
export const forwardBodyShape = z.object({
    places: rowsShape(
        z.object({
            page: anyNumberShape,
            x: anyNumberShape,
            y: anyNumberShape,
            left: anyNumberShape,
            top: anyNumberShape,
            w: anyNumberShape,
            h: anyNumberShape
        })
    ).catch([])
});

/** The body of an inverse search answer. */
export const inverseBodyShape = z.object({
    source: z
        .object({
            file: z.string().min(1),
            line: anyNumberShape,
            column: anyNumberShape.optional().catch(undefined)
        })
        .nullable()
        .catch(null)
});

/** The body of a citations answer. */
export const citesBodyShape = z.object({
    entries: rowsShape(
        z.object({
            key: z.string().min(1),
            type: z.string().catch(''),
            title: z.string().catch(''),
            author: z.string().catch(''),
            year: z.string().catch(''),
            line: anyNumberShape.catch(1),
            file: z.string().catch('')
        })
    ).catch([]),
    unread: rowsShape(z.string()).catch([])
});

/** The body of a packages answer. */
export const packagesBodyShape = z.object({ packages: rowsShape(z.string()).catch([]) });

/** A path joined onto a base, resolved; an empty name and an absolute one stay as they are. */
export function against(base: string, name: string): string {
    if (name === '' || name.startsWith('/')) return name;
    return normalisePath(joinPath(base, name));
}

/** The query string that names a target. */
export function queryOf(target: LatexTarget): string {
    return Object.entries(targetFields(target))
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
}

/** The state an answer's body makes for a target: every path against the root. */
export function stateOf(target: LatexTarget, body: z.output<typeof bodyShape>): LatexState {
    if ('root' in target) {
        const mains = body.mains.map((main) => ({ ...main, words: null, building: false }));
        return { root: target.root, dir: target.path, mains, error: '', loading: false };
    }
    // The files of a log are against the folder the main file is in, which is the manuscript folder
    // of the project and not the folder the PDF is written to, and the state's `dir` is that
    // folder.
    const dir = joinPath(body.folder, MANUSCRIPT);
    const mains = body.mains.map((main) => {
        const placed = (issue: LatexIssue): LatexIssue => ({
            ...issue,
            file: against(dir, issue.file)
        });
        return {
            ...main,
            pdfPath: against(body.folder, main.pdfPath),
            errors: main.errors.map(placed),
            warnings: main.warnings.map(placed),
            words: null,
            building: false
        };
    });
    return { root: HUB_ROOT, dir, mains, error: '', loading: false };
}

/** The place a main file is built in, which is one for every form of target that reaches it. */
export function placeOf(root: string, dir: string, main: string): string {
    return [root, normalisePath(dir), main].join('\n');
}
