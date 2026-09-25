// Layer 2, client state. The LaTeX state of one project: its main files, what the last build left
// beside each, and the errors and warnings of that build.
//
// It is state/sources/files.svelte.ts's shape over a different endpoint, and for the same reason:
// the wire model keeps a folder read out of the snapshot, so a board of fifty projects carries none
// of it and an open project tab asks api/latex for its own.
//
// What makes the answer stale is a build ending. A build is a terminal
// (state/sessions/terminals.svelte.ts), and a terminal that has ended leaves the terminals list of
// the `sessions` payload, so watch() is told the terminal one press started and the state is asked
// for again on every `sessions` push until that terminal is gone from the list. The push that finds
// it gone is the one whose answer carries the new PDF, and the watch ends there, so an idle tab
// asks for nothing.
//
// A PDF whose time moved is bumped in the fs store, which moves the address the file view draws it
// at: an open PDF tab then fetches the new build instead of the bytes the browser cached.

import { HUB_ROOT } from '../sources/fs.ts';
import type { EntitiesStore } from '../shared/stores/shapes.ts';
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

export function createLatex(
    entities: EntitiesStore,
    terminals: TerminalsStore,
    fs: FsStore
): LatexStore {
    const held: Record<string, LatexState | undefined> = $state({});

    /**
     * The terminal each project is waiting on, by project id. A rune: the ask is derived from it.
     */
    const waiting: Record<string, string | undefined> = $state({});

    /** What each held id was fetched at. Not reactive: only requests read it. */
    const asked: Record<string, string | undefined> = {};

    /** The ids with a request in flight, so a second render does not send a second request. */
    const inflight = new Set<string>();

    /** The version of the `sessions` channel, which moves whenever a terminal starts or ends. */
    function version(): number {
        return entities.message('sessions')?.version ?? 0;
    }

    /** Whether one terminal is still in the list the last `sessions` payload carried. */
    function live(terminal: string): boolean {
        return terminals.terminals().some((one) => one.id === terminal);
    }

    /**
     * What the held answer belongs to. A project waiting on no terminal has one answer, whatever
     * the sessions payload does; one waiting on a build asks again on every push until it has gone.
     */
    function signature(id: string): string {
        const terminal = waiting[id];
        return terminal === undefined ? '' : `${terminal}:${version()}`;
    }

    /** One project's LaTeX state. The first call for an id asks the server; later calls read it. */
    function state(id: string): LatexState {
        if (id === '') return NOTHING;
        const found = held[id];
        const at = signature(id);
        if (found === undefined || asked[id] !== at) request(id, at);
        return found ?? PENDING;
    }

    /** Wait on one terminal, and ask again at once so the row says a build is under way. */
    function watch(id: string, terminal: string): void {
        if (id === '' || terminal === '') return;
        waiting[id] = terminal;
    }

    /** Forget what is held for one project, so the next call for it fetches again. */
    function invalidate(id: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete held[id];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete asked[id];
    }

    /** Schedule one fetch, off the caller's stack so no state is written inside a derived. */
    function request(id: string, at: string): void {
        if (inflight.has(id)) return;
        inflight.add(id);
        queueMicrotask(() => {
            void load(id, at);
        });
    }

    async function load(id: string, at: string): Promise<void> {
        try {
            asked[id] = at;
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the id stays pending and the browser asks for it on the first client render.
            if (typeof fetch !== 'function') return;
            const response = await fetch(`/api/latex?id=${encodeURIComponent(id)}`);
            const body = (await response.json()) as {
                mains?: unknown;
                folder?: unknown;
                error?: string;
            };
            if (!response.ok) {
                held[id] = {
                    ...PENDING,
                    error: body.error ?? String(response.status),
                    loading: false
                };
                return;
            }
            const next: LatexState = {
                mains: readMains(body.mains),
                folder: typeof body.folder === 'string' ? body.folder : '',
                error: '',
                loading: false
            };
            redraw(held[id], next);
            held[id] = next;
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            held[id] = { ...PENDING, error: reason, loading: false };
        } finally {
            settle(id, at);
            inflight.delete(id);
        }
    }

    /**
     * Stop waiting once the terminal has left the list, deciding from the signature the answer was
     * fetched at rather than from the list as it stands now. An answer fetched before the list
     * moved is one build behind: the read that would have asked again while it was out was dropped
     * by the in-flight guard, so the signature it was asked at is cleared and the next read asks
     * again. The answer fetched at the signature that no longer holds the terminal is the one that
     * settles, and clearing the signature with the wait is what stops the next read asking a third
     * time.
     */
    function settle(id: string, at: string): void {
        const terminal = waiting[id];
        if (terminal === undefined) return;
        if (at !== signature(id)) {
            asked[id] = '';
            return;
        }
        if (live(terminal)) return;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete waiting[id];
        asked[id] = '';
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
