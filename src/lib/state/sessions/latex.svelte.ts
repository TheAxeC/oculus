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
// marked, and asked for again, on every `sessions` push until that terminal is gone from the list.
// The push that finds it gone is the one whose answer carries the new PDF, and the watch ends
// there, so an idle tab asks for nothing. A push that comes while a request is out marks the state
// again once that request lands, so an answer fetched before the list moved is never the last one.
//
// A PDF whose time moved is bumped in the fs store, which moves the address the file view draws it
// at: an open PDF tab then fetches the new build instead of the bytes the browser cached.

import { HUB_ROOT } from '../sources/fs.ts';
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

    /** Wait on one terminal, and ask again at once so the row says a build is under way. */
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
            const body = (await response.json()) as {
                mains?: unknown;
                folder?: unknown;
                error?: string;
            };
            if (!response.ok) {
                return {
                    ...PENDING,
                    error: body.error ?? String(response.status),
                    loading: false
                };
            }
            const next: LatexState = {
                mains: readMains(body.mains),
                folder: typeof body.folder === 'string' ? body.folder : '',
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

    /** The mains of an answer, keeping only what carries a name: a nameless row draws nothing. */
    function readMains(value: unknown): LatexMain[] {
        if (!Array.isArray(value)) return [];
        const rows: LatexMain[] = [];
        for (const one of value) {
            if (typeof one !== 'object' || one === null) continue;
            const row = one as Record<string, unknown>;
            if (typeof row.main !== 'string' || row.main === '') continue;
            rows.push({
                main: row.main,
                pdfPath: typeof row.pdfPath === 'string' ? row.pdfPath : '',
                pdf: typeof row.pdf === 'number' ? row.pdf : null,
                log: typeof row.log === 'number' ? row.log : null,
                errors: readIssues(row.errors),
                warnings: readIssues(row.warnings)
            });
        }
        return rows;
    }

    /** The issues of one main, keeping only what carries a message. */
    function readIssues(value: unknown): LatexIssue[] {
        if (!Array.isArray(value)) return [];
        const rows: LatexIssue[] = [];
        for (const one of value) {
            if (typeof one !== 'object' || one === null) continue;
            const row = one as Record<string, unknown>;
            if (typeof row.message !== 'string' || row.message === '') continue;
            rows.push({
                file: typeof row.file === 'string' ? row.file : '',
                line: typeof row.line === 'number' ? row.line : null,
                message: row.message
            });
        }
        return rows;
    }

    return { state, watch, invalidate };
}
