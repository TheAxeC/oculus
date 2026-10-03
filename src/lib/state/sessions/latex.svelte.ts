// Layer 2, client state. The LaTeX state of one project: its main files, what the last build left
// beside each, and the errors and warnings of that build.
//
// It is state/sources/files.svelte.ts's shape over a different endpoint, and for the same reason:
// the wire model keeps a folder read out of the snapshot, so a board of fifty projects carries none
// of it and an open project tab asks api/latex for its own.
//
// The answer is held in the client state's query client (state/client/queries.svelte.ts).
// What makes it stale is a build ending. A build is a terminal
// (state/sessions/terminals.svelte.ts), and a terminal that has ended leaves the terminals list of
// the `sessions` payload, so watch() is told the terminal one press started and the state is
// marked, and asked for again, on every `sessions` push until that terminal is gone from the list
// (a tab the pane hides asks once when it is shown). The push that finds it gone is the one whose
// answer carries the new PDF, and the watch ends there, so an idle tab asks for nothing. A push
// that comes while a request is out marks the state again once that request lands, so an answer
// fetched before the list moved is never the last one.
//
// A PDF whose time moved is bumped in the fs store, which moves the address the file view draws it
// at: an open PDF tab then fetches the new build instead of the bytes the browser cached.

import { z } from 'zod';
import { anyNumberShape, readAs, readJson, rowsShape } from '../../data/shapes/shapes.ts';
import { HUB_ROOT } from '../sources/fs.ts';
import { failedAnswer } from '../shared/answers/answers.ts';
import type { EntitiesStore, Queries } from '../shared/stores/shapes.ts';
import type { FsStore } from '../sources/fs.svelte.ts';
import type { TerminalsStore } from './terminals.svelte.ts';

/** One error or warning of a build, as the panel draws it. */
export type LatexIssue = { file: string; line: number | null; message: string };

/** One main file of a manuscript and what the last build of it left. */
export type LatexMain = {
    main: string;
    /** The PDF it builds to, relative to the project folder. */
    pdfPath: string;
    /** When the PDF was last written, in milliseconds, and null when there is no PDF. */
    pdf: number | null;
    /** When the log was last written, in milliseconds, and null when there is no log. */
    log: number | null;
    errors: LatexIssue[];
    warnings: LatexIssue[];
};

/** One project's LaTeX state as the panel reads it. */
export type LatexState = {
    mains: LatexMain[];
    /** The project's folder relative to the hub, which a PDF's own path is built on. */
    folder: string;
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the id is still to come. */
    loading: boolean;
};

/** What an id reads as before its answer arrives. */
const PENDING: LatexState = { mains: [], folder: '', error: '', loading: true };

/** What no id at all reads as: an empty id asks nothing and waits for nothing. */
const NOTHING: LatexState = { mains: [], folder: '', error: '', loading: false };

/** One project's LaTeX state per id, held for one client. */
export type LatexStore = {
    state: (id: string) => LatexState;
    /** Watch the terminal one build or clean started, so the state is read again when it ends. */
    watch: (id: string, terminal: string) => void;
    invalidate: (id: string) => void;
};

/** What every project's query key opens with. */
const KIND = 'latex';

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
    pdfPath: z.string().catch(''),
    pdf: anyNumberShape.nullable().catch(null),
    log: anyNumberShape.nullable().catch(null),
    errors: issuesShape,
    warnings: issuesShape
}) satisfies z.ZodType<LatexMain>;

/** The body of an answer: its mains and folder as typed or at their fallback. */
const bodyShape = z.object({
    mains: rowsShape(mainShape).catch([]),
    folder: z.string().catch('')
});

/** What a body that is not a map says: no mains and no folder. */
const NO_BODY = { mains: [], folder: '' };

export function createLatex(
    entities: EntitiesStore,
    terminals: TerminalsStore,
    fs: FsStore,
    queries: Queries
): LatexStore {
    /** The terminal each project is waiting on, by project id. */
    const waiting = new Map<string, string>();

    /** The version of the last `sessions` message heard, or null before the first. */
    let heard: number | null = null;

    entities.afterReceive((message) => {
        if (message.channel !== 'sessions' || message.version === heard) return;
        heard = message.version;
        for (const id of waiting.keys()) queries.mark([KIND, id], 'wait');
    });

    /** Whether one terminal is still in the list the last `sessions` payload carried. */
    function live(terminal: string): boolean {
        return terminals.terminals().some((one) => one.id === terminal);
    }

    /** One project's LaTeX state. The first call for an id asks the server; later calls read it. */
    function state(id: string): LatexState {
        if (id === '') return NOTHING;
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the id stays pending and the browser asks for it on the first client render.
        const { data } = queries.read<LatexState>([KIND, id], (held) => load(id, held), {
            enabled: typeof fetch === 'function'
        });
        return data ?? PENDING;
    }

    /**
     * Wait on one terminal, and ask again at once so the row says a build is under way; a hidden
     * tab asks when it is shown.
     */
    function watch(id: string, terminal: string): void {
        if (id === '' || terminal === '') return;
        waiting.set(id, terminal);
        queries.mark([KIND, id], 'wait');
    }

    /** Forget what is held for one project, so the next call for it fetches again. */
    function invalidate(id: string): void {
        queries.forget([KIND, id]);
    }

    async function load(id: string, held: LatexState | undefined): Promise<LatexState> {
        try {
            const response = await fetch(`/api/latex?id=${encodeURIComponent(id)}`);
            const raw = await readJson(response);
            if (raw === undefined || !response.ok) {
                return { ...PENDING, error: failedAnswer(response, raw), loading: false };
            }
            const body = readAs(bodyShape, raw) ?? NO_BODY;
            const next: LatexState = {
                mains: body.mains,
                folder: body.folder,
                error: '',
                loading: false
            };
            redraw(held, next);
            return next;
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { ...PENDING, error: reason, loading: false };
        } finally {
            settle(id);
        }
    }

    /**
     * Stop waiting once the terminal has left the list. An answer fetched before the list moved is
     * one build behind, and the push that moved the list marked the state again for when that
     * answer landed, so the next read asks for the build's own.
     */
    function settle(id: string): void {
        const terminal = waiting.get(id);
        if (terminal === undefined || live(terminal)) return;
        waiting.delete(id);
    }

    /** Bump every PDF whose time moved, which is what makes an open PDF tab draw the new build. */
    function redraw(before: LatexState | undefined, next: LatexState): void {
        if (before === undefined || next.folder === '') return;
        for (const main of next.mains) {
            const was = before.mains.find((one) => one.main === main.main);
            if (was === undefined || was.pdf === main.pdf) continue;
            fs.bump(HUB_ROOT, `${next.folder}/${main.pdfPath}`);
        }
    }

    return { state, watch, invalidate };
}
