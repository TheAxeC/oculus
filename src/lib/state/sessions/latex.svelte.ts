// Layer 2, client state. The LaTeX state of a folder: its main files, what the last build left
// beside each, the errors and warnings of that build, the outline and the word count of a main
// file, the main file a saved `.tex` file builds through, and the build that follows a save.
//
// A folder is a project, whose main files sit in its `manuscript/` folder, or any folder of a
// served root (state/sessions/terminal/latex-target.ts); each is held under its own query key, so a
// project and a folder whose names match never share one. It is state/sources/files.svelte.ts's
// shape over a different endpoint, and for the same reason: the wire model keeps a folder read out
// of the snapshot, so a board of fifty projects carries none of it and an open tab asks api/latex
// for its own. Every path the page holds is against the root: a project's answer, which is against
// the project's folder, is joined onto it when it is read, so the rows, the diagnostics and the PDF
// address all take one form.
//
// The answer is held in the client state's query client (state/client/queries.svelte.ts). What
// makes it stale is a build ending. A build is a task terminal (state/sessions/terminals.svelte.ts)
// that tmux keeps after latexmk ended, with the exit status of the line, so a build has ended when
// its terminal shows an exit status or has left the terminals list of the `sessions` payload.
// watch() is told the terminal one press or one save started (`run` does it) and every held folder
// is marked, and asked for again, on every `sessions` push until that terminal has ended (a tab the
// pane hides asks once when it is shown). The push that finds it ended is the one whose answer
// carries the new PDF, and the watch ends there, so an idle tab asks for nothing. A push that comes
// while a request is out marks the state again once that request lands, so an answer fetched before
// the list moved is never the last one. A folder is marked as a whole, not only the target that was
// watched, because a build of a project's manuscript changes what a view over the same folder holds
// as well.
//
// A PDF whose time moved is bumped in the fs store, which moves the address the file view draws it
// at: an open PDF tab then fetches the new build instead of the bytes the browser cached.
//
// A saved `.tex` file builds its main file when `latex.auto_build` of config/behavior.yml reads as
// `on_save`, which is the catalog's default for a missing or wrong value: `onSaved` asks which main
// the file builds through, starts the build without showing it, and watches it. The folder's state
// is read again when that build ends, held or not, so the problems of a build nobody is looking at
// still reach the editor as diagnostics. A main file is never built twice at once: from the moment
// its build is asked for until the terminal that runs it has ended, a save that arrives asks for
// one more build after it, however many saves came, and a Build press shows the terminal of the
// build under way (once the server has named it) and asks for one more build after it. A start
// whose answer already shows an exit status ends the build at once. A terminal the list has never
// shown running is taken as ended only when the server's own list, read after the answer that named
// it or after a push that shows it ended or lacks it, shows it ended or lacks it too, since a push
// can carry a list read before the terminal started or before a kept terminal ran again. The main
// file's row says `building` for the same span (`LatexMain.building`), whichever folder form the
// row was read by, since the span is kept per main file of a folder of a root and not per form.

import { z } from 'zod';
import type { Message } from '../../data/model/index.ts';
import { PROGRAMS, type Program } from '../../data/prose/latex.ts';
import { joinPath } from '../../data/helpers/files/paths.ts';
import { latexAutoBuild } from '../../data/sources/config/settings.ts';
import { anyNumberShape, readAs, readJson, rowsShape } from '../../data/shapes/shapes.ts';
import { holds } from '../system/docs.svelte.ts';
import { HUB_ROOT, normalisePath } from '../sources/fs.ts';
import { failedAnswer } from '../shared/answers/answers.ts';
import type { EntitiesStore, Queries, WritesStore } from '../shared/stores/shapes.ts';
import type { FsStore } from '../sources/fs.svelte.ts';
import { emptyTarget, targetFields, targetKey, type LatexTarget } from './terminal/latex-target.ts';
import type { LatexStep, TerminalAnswer, TerminalsStore } from './terminals.svelte.ts';
import { readListed } from './terminal/pty/pty-io.ts';

export type { LatexTarget };

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
export type LatexOutlineEntry = { level: number; title: string; file: string; line: number };

/**
 * The outline of a main file: its sections, the files read only in part (the parser refused them),
 * the files not read at all (too large or unreadable), or an error.
 */
export type LatexOutline = {
    sections: LatexOutlineEntry[];
    partial: string[];
    unread: string[];
    error: string;
    /** True while the first answer for the main file is still to come. */
    loading: boolean;
};

/** What a count came to: the words, or the server's reason it did not count. */
export type LatexCount = { words: number | null; error: string };

/**
 * What the main file a `.tex` file builds through is, or null for a file that builds through none.
 */
export type LatexRoot = { root: string; path: string; main: string } | null;

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

/**
 * One build asked for: the target it was asked through, the request that asks for it, its terminal
 * once the server named one, whether that terminal has been seen running in the terminals list,
 * whether the server's own list is being read for it, and whether one more build is owed after it.
 */
type Build = {
    target: LatexTarget;
    main: string;
    asked: Promise<TerminalAnswer>;
    terminal: string | null;
    running: boolean;
    asking: boolean;
    again: boolean;
};

/** What a target reads as before its answer arrives. */
const PENDING: LatexState = { root: '', dir: '', mains: [], error: '', loading: true };

/** What no target at all reads as: an empty target asks nothing and waits for nothing. */
const NOTHING: LatexState = { root: '', dir: '', mains: [], error: '', loading: false };

/** One folder's LaTeX state per target, and what is asked of a main file of one. */
export type LatexStore = {
    state: (target: LatexTarget) => LatexState;
    /** Watch the terminal one build or clean started, so the state is read again when it ends. */
    watch: (target: LatexTarget, terminal: string) => void;
    /**
     * Start a build or a clean of a main file and watch its terminal; the answer is the terminal's
     * or the server's refusal. A build marks the main file `building` from the call until its
     * terminal has ended or the request failed. A build of a main file whose build is under way
     * starts none: it answers that build's terminal and asks for one more build after it.
     */
    run: (target: LatexTarget, main: string, step: LatexStep) => Promise<TerminalAnswer>;
    invalidate: (target: LatexTarget) => void;
    /**
     * Read a target's state again when it is shown next: a view or a panel opening on a folder
     * calls it, so the files that changed while nothing watched the folder are read. A target with
     * nothing held is read for the first time anyway.
     */
    reread: (target: LatexTarget) => void;
    /**
     * The sections of a main file, followed through its includes. Asked for on the first read and
     * again once a build has changed the main file's log.
     */
    outline: (target: LatexTarget, main: string) => LatexOutline;
    /** Count the words of a main file; the number is held in the state until the next build. */
    count: (target: LatexTarget, main: string) => Promise<LatexCount>;
    /** The main file a `.tex` file builds through. */
    rootOf: (root: string, file: string) => Promise<LatexRoot>;
    /** Build the main file a just-saved file builds through, when the configuration says to. */
    onSaved: (root: string, path: string) => Promise<void>;
    /** The problems of the latest build of every folder held, as one list. */
    latexDiagnostics: () => LatexDiagnostic[];
    /**
     * A text formatted by the formatter `latex.formatter` chooses; the file's path names it to a
     * formatter that reads the name. The text is the page's to apply.
     */
    format: (text: string, file: string) => Promise<LatexFormat>;
};

/** What every folder's query key opens with. */
const KIND = 'latex';

/** What the query key of a main file's outline opens with, apart from the folders' own. */
const OUTLINES = 'latex-outline';

/** What an outline reads as before its first answer, and what an empty target reads as. */
const OUTLINE_PENDING: LatexOutline = {
    sections: [],
    partial: [],
    unread: [],
    error: '',
    loading: true
};
const OUTLINE_NOTHING: LatexOutline = { ...OUTLINE_PENDING, loading: false };

/** The `latex.auto_build` value that stops a save from building. */
const NEVER = 'never';

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
    warnings: issuesShape
});

/**
 * The body of a state answer: its mains, and the project folder a project's answer is against.
 */
const bodyShape = z.object({
    mains: rowsShape(mainShape).catch([]),
    folder: z.string().catch('')
});

/** What a body that is not a map says: no mains and no folder. */
const NO_BODY = bodyShape.parse({});

/** The body of an outline answer; a project's carries the folder its files are against. */
const outlineBodyShape = z.object({
    sections: rowsShape(
        z.object({
            level: anyNumberShape,
            title: z.string().min(1),
            file: z.string(),
            line: anyNumberShape
        })
    ).catch([]),
    partial: rowsShape(z.string()).catch([]),
    unread: rowsShape(z.string()).catch([]),
    folder: z.string().catch('')
});

/** The body of a count answer. */
const countBodyShape = z.object({ words: anyNumberShape.nullable().catch(null) });

/** The body of a root answer: the main's folder and name, or no main. */
const rootBodyShape = z.object({
    root: z.string().catch(''),
    path: z.string().catch(''),
    main: z.string().min(1).nullable().catch(null)
});

/** The body of a format answer. */
const formatBodyShape = z.object({ text: z.string().nullable().catch(null) });

/** A path joined onto a base, resolved; an empty name and an absolute one stay as they are. */
function against(base: string, name: string): string {
    if (name === '' || name.startsWith('/')) return name;
    return normalisePath(joinPath(base, name));
}

/** The folder part of a slash-separated path, the empty string for a name with none. */
function folderOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** The query string that names a target. */
function queryOf(target: LatexTarget): string {
    return Object.entries(targetFields(target))
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
}

/** The state an answer's body makes for a target: every path against the root. */
function stateOf(target: LatexTarget, body: z.output<typeof bodyShape>): LatexState {
    if ('root' in target) {
        const mains = body.mains.map((main) => ({ ...main, words: null, building: false }));
        return { root: target.root, dir: target.path, mains, error: '', loading: false };
    }
    const mains = body.mains.map((main) => {
        const base = joinPath(body.folder, folderOf(main.pdfPath));
        const placed = (issue: LatexIssue): LatexIssue => ({
            ...issue,
            file: against(base, issue.file)
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
    const dir = mains.length > 0 ? folderOf(mains[0].pdfPath) : joinPath(body.folder, '');
    return { root: HUB_ROOT, dir, mains, error: '', loading: false };
}

export function createLatex(
    entities: EntitiesStore,
    terminals: TerminalsStore,
    fs: FsStore,
    queries: Queries,
    writes: WritesStore
): LatexStore {
    /** The terminal each target is waiting on, by the target's key. */
    const waiting = new Map<string, { target: LatexTarget; terminal: string }>();

    /**
     * The build asked for each main file, by the main file's place (placeOf). A build is here from
     * the moment its request is sent: its terminal is null while the request is out, and it leaves
     * when the request fails, when the answer shows the terminal ended, or when the terminal has
     * been seen running and has since ended.
     */
    const building = new Map<string, Build>();

    /** The newest save of each file, so an answer to an older one is dropped. */
    const saves = new Map<string, number>();

    /** The newest count asked for each main file, so an answer to an older one is dropped. */
    const counts = new Map<string, number>();

    /** The version of the last `sessions` message heard, or null before the first. */
    let heard: number | null = null;

    /** The version of the last `files` message heard, or null before the first. */
    let filesHeard: number | null = null;

    /** Moves whenever a state lands or goes, which is what makes the diagnostics redraw. */
    let landed = $state(0);

    /** The count of states that landed or went; reading it makes the reader depend on it. */
    function landings(): number {
        return landed;
    }

    entities.afterReceive((message) => {
        if (message.channel === 'files') {
            filesMoved(message);
            return;
        }
        if (message.channel !== 'sessions' || message.version === heard) return;
        heard = message.version;
        if (waiting.size > 0) queries.mark([KIND], 'wait');
        for (const [key, one] of building) {
            if (one.terminal === null) continue;
            if (live(one.terminal)) {
                one.running = true;
                continue;
            }
            if (one.running) finish(key, one);
            else void confirm(key, one);
        }
    });

    /**
     * Whether a `files` message can concern a held folder: its folder, which is the directory of
     * its root joined with its own, lies under the root the message names. A folder of a root the
     * page has no directory for yet cannot be placed, so it is concerned.
     */
    function concerns(data: LatexState, root: string): boolean {
        const base = fs.roots().find((one) => one.key === data.root);
        if (base === undefined) return true;
        return holds(root, joinPath(base.dir, data.dir));
    }

    /**
     * Mark every held folder state a `files` message concerns, so a shown one is read again: a gap
     * in the versions concerns every state, a message that names no root (the bookmarks') none.
     */
    function filesMoved(message: Message): void {
        if (filesHeard === message.version) return;
        const gap = filesHeard === null || message.version !== filesHeard + 1;
        filesHeard = message.version;
        const root = entities.payloadOf(message, 'files')?.root ?? '';
        if (root === '' && !gap) return;
        for (const one of queries.entries<LatexState>([KIND])) {
            if (gap || one.data === undefined || concerns(one.data, root)) {
                queries.mark(one.key, 'again');
            }
        }
    }

    /** End one build: the mark goes, its folder is read again, and a build owed after it starts. */
    function finish(key: string, one: Build): void {
        building.delete(key);
        landed += 1;
        queries.refetch<LatexState>(
            [KIND, ...targetKey(one.target)],
            (held) => load(one.target, held),
            'again'
        );
        if (one.again) void build(one.target, one.main);
    }

    /**
     * Ask the server whether a terminal the list has never shown running is running, after a push
     * that shows it ended or lacks it: a list that shows it ended or lacks it ends the build, and a
     * list that shows it running, or a read that failed, leaves the build for the next push.
     */
    async function confirm(key: string, one: Build): Promise<void> {
        if (one.asking || one.terminal === null) return;
        const terminal = one.terminal;
        one.asking = true;
        const listed = await readListed();
        one.asking = false;
        if (building.get(key) !== one || listed === null || one.running) return;
        if (listed.some((held) => held.id === terminal && held.exit === null)) return;
        finish(key, one);
    }

    /** Whether one terminal is in the last `sessions` payload's list, its line running. */
    function live(terminal: string): boolean {
        return terminals.terminals().some((one) => one.id === terminal && one.exit === null);
    }

    /**
     * One target's LaTeX state. The first call for a target asks the server; later calls read it.
     */
    function state(target: LatexTarget): LatexState {
        if (emptyTarget(target)) return NOTHING;
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the target stays pending and the browser asks for it on the first client render.
        const { data } = queries.read<LatexState>(
            [KIND, ...targetKey(target)],
            (held) => load(target, held),
            { enabled: typeof fetch === 'function' }
        );
        return data === undefined ? PENDING : withBuilding(data);
    }

    /** The place a main file is built in, which is one for every form of target that reaches it. */
    function placeOf(root: string, dir: string, main: string): string {
        return [root, normalisePath(dir), main].join('\n');
    }

    /** The place of a main file as the target names it, through the state held for a project. */
    function placeOfTarget(target: LatexTarget, main: string): string {
        if ('root' in target) return placeOf(target.root, target.path, main);
        const held = queries.peek<LatexState>([KIND, ...targetKey(target)]).data;
        return placeOf(held?.root ?? HUB_ROOT, held?.dir ?? '', main);
    }

    /** A state with each main file marked `building` while a build of it is asked for or runs. */
    function withBuilding(data: LatexState): LatexState {
        // Read first so the caller redraws when a build starts or ends.
        void landings();
        if (building.size === 0) return data;
        const mains = data.mains.map((main) => {
            const on = building.has(placeOf(data.root, data.dir, main.main));
            return on === main.building ? main : { ...main, building: on };
        });
        return mains.some((main, at) => main !== data.mains[at]) ? { ...data, mains } : data;
    }

    /**
     * Wait on one terminal, and ask again at once so the row says a build is under way; a hidden
     * tab asks when it is shown.
     */
    function watch(target: LatexTarget, terminal: string): void {
        if (emptyTarget(target) || terminal === '') return;
        waiting.set(targetKey(target).join('\n'), { target, terminal });
        queries.mark([KIND, ...targetKey(target)], 'wait');
    }

    function reread(target: LatexTarget): void {
        if (emptyTarget(target)) return;
        const key = [KIND, ...targetKey(target)];
        if (queries.peek<LatexState>(key).data !== undefined) queries.mark(key, 'again');
    }

    /** Forget what is held for one target, so the next call for it fetches again. */
    function invalidate(target: LatexTarget): void {
        queries.forget([KIND, ...targetKey(target)]);
        queries.forget([OUTLINES, ...targetKey(target)]);
        landed += 1;
    }

    async function load(target: LatexTarget, held: LatexState | undefined): Promise<LatexState> {
        try {
            const response = await fetch(`/api/latex?${queryOf(target)}`);
            const raw = await readJson(response);
            if (raw === undefined || !response.ok) {
                return { ...PENDING, error: failedAnswer(response, raw), loading: false };
            }
            const body = readAs(bodyShape, raw) ?? NO_BODY;
            const next = carried(held, stateOf(target, body));
            redraw(held, next);
            builtAgain(target, held, next);
            return next;
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { ...PENDING, error: reason, loading: false };
        } finally {
            settle(target);
            landed += 1;
        }
    }

    /** The counts of the state held before, for the mains the new answer shows unbuilt since. */
    function carried(before: LatexState | undefined, next: LatexState): LatexState {
        if (before === undefined) return next;
        const mains = next.mains.map((main) => {
            const was = before.mains.find((one) => one.main === main.main);
            return was?.log === main.log ? { ...main, words: was.words } : main;
        });
        return { ...next, mains };
    }

    /** Mark the outline of every main file whose log moved, so its next read asks again. */
    function builtAgain(
        target: LatexTarget,
        before: LatexState | undefined,
        next: LatexState
    ): void {
        if (before === undefined) return;
        for (const main of next.mains) {
            const was = before.mains.find((one) => one.main === main.main);
            if (was === undefined || was.log === main.log) continue;
            queries.mark([OUTLINES, ...targetKey(target), main.main], 'again');
        }
    }

    /**
     * Stop waiting once the terminal has ended. An answer fetched before the list moved is one
     * build behind, and the push that moved the list marked the state again for when that answer
     * landed, so the next read asks for the build's own.
     */
    function settle(target: LatexTarget): void {
        const key = targetKey(target).join('\n');
        const one = waiting.get(key);
        if (one === undefined || live(one.terminal)) return;
        waiting.delete(key);
    }

    /** Bump every PDF whose time moved, which is what makes an open PDF tab draw the new build. */
    function redraw(before: LatexState | undefined, next: LatexState): void {
        if (before === undefined || next.root === '') return;
        for (const main of next.mains) {
            const was = before.mains.find((one) => one.main === main.main);
            if (was === undefined || was.pdf === main.pdf) continue;
            fs.bump(next.root, main.pdfPath);
        }
    }

    /**
     * The answer of a GET over a target with one more parameter: its body when it succeeded, else
     * the reason it did not, the sentence `failedAnswer` tells a failed read in or what the request
     * threw.
     */
    async function ask(
        target: LatexTarget,
        extra: string
    ): Promise<{ body: unknown } | { reason: string }> {
        try {
            const response = await fetch(`/api/latex?${queryOf(target)}&${extra}`);
            const raw = await readJson(response);
            if (response.ok) return { body: raw };
            return { reason: failedAnswer(response, raw) };
        } catch (error) {
            return { reason: error instanceof Error ? error.message : String(error) };
        }
    }

    function outline(target: LatexTarget, main: string): LatexOutline {
        if (emptyTarget(target)) return OUTLINE_NOTHING;
        const { data } = queries.read<LatexOutline>(
            [OUTLINES, ...targetKey(target), main],
            () => loadOutline(target, main),
            { enabled: typeof fetch === 'function' }
        );
        return data ?? OUTLINE_PENDING;
    }

    async function loadOutline(target: LatexTarget, main: string): Promise<LatexOutline> {
        const answer = await ask(target, `outline=${encodeURIComponent(main)}`);
        const body = 'body' in answer ? readAs(outlineBodyShape, answer.body) : null;
        if (body === null) {
            const error = 'reason' in answer ? answer.reason : '';
            return { sections: [], partial: [], unread: [], error, loading: false };
        }
        // A project's files are against its folder, a folder's against its root.
        const placed = (file: string): string =>
            'id' in target ? against(body.folder, file) : file;
        return {
            sections: body.sections.map((one) => ({ ...one, file: placed(one.file) })),
            partial: body.partial.map(placed),
            unread: body.unread.map(placed),
            error: '',
            loading: false
        };
    }

    async function count(target: LatexTarget, main: string): Promise<LatexCount> {
        const key = [...targetKey(target), main].join('\n');
        const mine = (counts.get(key) ?? 0) + 1;
        counts.set(key, mine);
        const answer = await ask(target, `count=${encodeURIComponent(main)}`);
        const body = 'body' in answer ? readAs(countBodyShape, answer.body) : null;
        const counted: LatexCount = {
            words: body?.words ?? null,
            error: 'reason' in answer ? answer.reason : ''
        };
        if (counts.get(key) !== mine || counted.words === null) return counted;
        const queryKey = [KIND, ...targetKey(target)];
        const held = queries.peek<LatexState>(queryKey).data;
        if (held === undefined) return counted;
        const mains = held.mains.map((one) =>
            one.main === main ? { ...one, words: counted.words } : one
        );
        queries.hold(queryKey, { ...held, mains });
        landed += 1;
        return counted;
    }

    async function rootOf(root: string, file: string): Promise<LatexRoot> {
        try {
            const query = `root=${encodeURIComponent(root)}&file=${encodeURIComponent(file)}`;
            const found = readAs(rootBodyShape, await readJson(await fetch(`/api/latex?${query}`)));
            if (found === null) return null;
            if (found.main === null) return null;
            return {
                root: found.root === '' ? root : found.root,
                path: found.path,
                main: found.main
            };
        } catch {
            return null;
        }
    }

    /**
     * Whether a save builds: the value `latex.auto_build` reads as, by the options catalog's rule,
     * is not `never`. A page that holds no catalog yet builds nothing.
     */
    function buildsOnSave(): boolean {
        try {
            return latexAutoBuild(entities.config()?.config ?? {}) !== NEVER;
        } catch {
            return false;
        }
    }

    /**
     * Start a build or a clean and watch the terminal it runs in. A build is marked from the
     * moment the request is sent, so a save that arrives before the answer finds it; a request that
     * fails takes the mark off.
     */
    async function run(
        target: LatexTarget,
        main: string,
        step: LatexStep
    ): Promise<TerminalAnswer> {
        if (step !== 'build') {
            const answer = await terminals.latex(target, main, step);
            if (answer.ok) watch(target, answer.id);
            return answer;
        }
        const key = placeOfTarget(target, main);
        const running = building.get(key);
        if (running !== undefined && underway(running)) {
            running.again = true;
            if (running.terminal === null) return running.asked;
            return { ok: true, id: running.terminal, error: '' };
        }
        const asked = terminals
            .latex(target, main, 'build')
            .catch((error: unknown): TerminalAnswer => ({
                ok: false,
                id: '',
                error: error instanceof Error ? error.message : String(error)
            }));
        const mine: Build = {
            target,
            main,
            asked,
            terminal: null,
            running: false,
            asking: false,
            again: false
        };
        building.set(key, mine);
        landed += 1;
        const answer = await asked;
        if (!answer.ok || answer.id === '') {
            if (building.get(key) === mine) {
                building.delete(key);
                landed += 1;
            }
            return answer;
        }
        mine.terminal = answer.id;
        mine.running = live(answer.id);
        watch(target, answer.id);
        // The answer names the terminal as the server listed it just now. A build that already
        // ended ends here, through the path a later push takes; any other is read once more, since
        // a push that came while the request was out was passed over for want of the terminal.
        if (typeof answer.terminal?.exit === 'number') {
            if (building.get(key) === mine) finish(key, mine);
        } else if (!mine.running) {
            void confirm(key, mine);
        }
        return answer;
    }

    /**
     * Start a build of one main file, not shown, and watch it. A main file whose build is out or
     * running is built once more after it, since that build may have read the text a later save
     * replaced.
     */
    async function build(target: LatexTarget, main: string): Promise<void> {
        const running = building.get(placeOfTarget(target, main));
        if (running !== undefined && underway(running)) {
            running.again = true;
            return;
        }
        await run(target, main, 'build');
    }

    /** Whether a build is asked for or runs: its request is out, or its terminal has not ended. */
    function underway(one: Build): boolean {
        return one.terminal === null || !one.running || live(one.terminal);
    }

    async function onSaved(root: string, path: string): Promise<void> {
        if (!path.endsWith('.tex') || !buildsOnSave()) return;
        const key = `${root}\n${path}`;
        const mine = (saves.get(key) ?? 0) + 1;
        saves.set(key, mine);
        const found = await rootOf(root, path);
        if (found === null || saves.get(key) !== mine) return;
        await build({ root: found.root, path: found.path }, found.main);
    }

    function latexDiagnostics(): LatexDiagnostic[] {
        // Read first so the caller redraws when a state lands or goes.
        void landings();
        const found: LatexDiagnostic[] = [];
        const seen = new Set<string>();
        for (const { data } of queries.entries<LatexState>([KIND])) {
            if (data === undefined || data.root === '') continue;
            for (const main of data.mains) {
                const issues = [
                    ...main.errors.map((one) => ({ one, severity: 'error' as const })),
                    ...main.warnings.map((one) => ({ one, severity: 'warning' as const }))
                ];
                for (const { one, severity } of issues) {
                    const file = one.file === '' ? against(data.dir, main.main) : one.file;
                    const key = [data.root, file, one.line, severity, one.message].join('\n');
                    if (seen.has(key)) continue;
                    seen.add(key);
                    const base = { root: data.root, file, severity, message: one.message };
                    const line = one.line === null ? {} : { line: one.line };
                    found.push({ ...base, ...line, source: 'latex' });
                }
            }
        }
        return found;
    }

    async function format(text: string, file: string): Promise<LatexFormat> {
        if (typeof fetch !== 'function') return { text: null, error: '' };
        try {
            const response = await fetch('/api/latex', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-oculus-token': writes.writeToken()
                },
                body: JSON.stringify({ action: 'format', text, file })
            });
            const raw = await readJson(response);
            const body = readAs(formatBodyShape, raw);
            if (!response.ok || body === null)
                return { text: null, error: failedAnswer(response, raw) };
            return { text: body.text, error: '' };
        } catch (error) {
            return { text: null, error: error instanceof Error ? error.message : String(error) };
        }
    }

    return {
        state,
        watch,
        run,
        invalidate,
        reread,
        outline,
        count,
        rootOf,
        onSaved,
        latexDiagnostics,
        format
    };
}
