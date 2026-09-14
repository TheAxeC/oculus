// Layer 2, client state. The turns of a session, held per session while an instance is showing it.
//
// DESIGN.md's wire model keeps the turn text out of the snapshot, so the conversation is fetched
// rather than selected: turnsFor(id) asks api/transcript the first time a session is wanted and
// holds the answer, the way state/docs.svelte.ts asks api/docs for a document. The fetch is
// scheduled on a microtask rather than run inside the call, so reading this from a $derived never
// writes state while a derived is running.
//
// Nothing polls. The `sessions` payload changes whenever a transcript is written, so the record's
// lastActivity moving is the signal that there are bytes to read, and follow() asks for the tail
// from the offset the last read returned. A tool call whose result arrives in that tail is patched
// in place, since the call's own turn was read before the result existed.

import type { Turn } from '../data/model.ts';

// The views read a turn's shape through this module, as they read a session's through
// state/selectors.svelte.ts: the boundary table of DESIGN.md gives `views/` no import of `data/`.
export type { Turn, TurnTool } from '../data/model.ts';

/** One session's turns as the view reads them. */
export type TurnsState = {
    turns: Turn[];
    offset: number;
    /** True while the first answer for the session is still to come. */
    pending: boolean;
    /** What the request failed with, or the empty string. */
    error: string;
};

/** What a session reads as before its first answer arrives. */
const PENDING: TurnsState = { turns: [], offset: 0, pending: true, error: '' };

/** What no session at all reads as: an empty id asks nothing and waits for nothing. */
const NOTHING: TurnsState = { turns: [], offset: 0, pending: false, error: '' };

/** The turns of each session, held for one client while an instance shows it. */
export type TranscriptsStore = {
    turnsFor: (id: string) => TurnsState;
    follow: (id: string, lastActivity: string | null) => void;
    showing: (id: string) => () => void;
    forget: (id: string) => void;
    hold: (id: string, turns: Turn[], offset?: number) => void;
};

export function createTranscripts(): TranscriptsStore {
    const held: Record<string, TurnsState | undefined> = $state({});

    /** The lastActivity each session was last asked at. Not reactive: only requests read it. */
    const marks: Record<string, string | undefined> = {};

    /** The sessions with a request in flight, so a second render does not send a second request. */
    const inflight = new Set<string>();

    /** The sessions whose tail was wanted while a request was in flight, asked again when it lands. */
    const again = new Set<string>();

    /**
     * The turns of one session. The first call for a session asks the server for the whole file; every
     * later call reads what is held, and follow() is what asks for the rest.
     */
    function turnsFor(id: string): TurnsState {
        if (id === '') return NOTHING;
        const state = held[id];
        if (state === undefined) request(id, 0);
        return state ?? PENDING;
    }

    /**
     * Read what has been appended since the last read, when the record says there is something. Called
     * from the view's effect with the record's lastActivity: the first call for a session only notes the
     * stamp, since the read turnsFor() scheduled already carries everything written up to it.
     */
    function follow(id: string, lastActivity: string | null): void {
        if (id === '') return;
        const mark = lastActivity ?? '';
        const first = marks[id] === undefined;
        if (marks[id] === mark) return;
        marks[id] = mark;
        if (first) return;
        const state = held[id];
        if (state === undefined) return;
        request(id, state.offset);
    }

    /** How many instances are showing each session, so the last one to close is what drops its turns. */
    const viewers: Record<string, number> = {};

    /**
     * Note that one instance is showing the session, and hand back the call that says it stopped. What
     * is held otherwise stays held for the page's life: a session opened once keeps its whole transcript
     * in memory, and a long day's transcript is the larger part of what the page holds. When the last
     * instance showing a session closes, its turns are dropped and the next open reads the tail again.
     * Calling the returned function twice counts once, so an instance that releases on both a teardown
     * and a change of session does not drop turns another instance is still drawing.
     */
    function showing(id: string): () => void {
        if (id === '') {
            return () => {
                // An unnamed instance was never counted, so releasing it drops nothing.
            };
        }
        viewers[id] = (viewers[id] ?? 0) + 1;
        let released = false;
        return () => {
            if (released) return;
            released = true;
            const left = (viewers[id] ?? 1) - 1;
            if (left > 0) {
                viewers[id] = left;
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
            delete viewers[id];
            forget(id);
        };
    }

    /** Drop everything held for one session, so the next call for it fetches from the start again. */
    function forget(id: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete viewers[id];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete held[id];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete marks[id];
        inflight.delete(id);
        again.delete(id);
    }

    /** Schedule one fetch, off the caller's stack so no state is written inside a derived. */
    function request(id: string, from: number): void {
        if (inflight.has(id)) {
            again.add(id);
            return;
        }
        inflight.add(id);
        queueMicrotask(() => {
            void load(id, from);
        });
    }

    async function load(id: string, from: number): Promise<void> {
        try {
            // Nothing is fetched while the page is rendered on the server: there is no window to draw
            // it in, and the browser asks for it on the first client render.
            if (typeof window === 'undefined' || typeof fetch !== 'function') return;
            const url = `/api/transcript?id=${encodeURIComponent(id)}&from=${from}`;
            const response = await fetch(url);
            const body = (await response.json()) as {
                turns?: Turn[];
                offset?: number;
                results?: Record<string, boolean>;
                error?: string;
            };
            if (!response.ok) {
                held[id] = {
                    turns: held[id]?.turns ?? [],
                    offset: held[id]?.offset ?? from,
                    pending: false,
                    error: body.error ?? String(response.status)
                };
                return;
            }
            merge(id, from, body.turns ?? [], body.offset ?? from, body.results ?? {});
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            held[id] = {
                turns: held[id]?.turns ?? [],
                offset: from,
                pending: false,
                error: reason
            };
        } finally {
            inflight.delete(id);
            if (again.delete(id)) request(id, held[id]?.offset ?? 0);
        }
    }

    /** Append what was read and fill in the outcome of every call whose turn is already held. */
    function merge(
        id: string,
        from: number,
        turns: Turn[],
        offset: number,
        results: Record<string, boolean | undefined>
    ): void {
        const base = from === 0 ? [] : (held[id]?.turns ?? []);
        const whole = [...base, ...turns];
        for (const turn of whole) {
            const tool = turn.tool;
            if (tool === null || tool.id === '') continue;
            const ok = results[tool.id];
            if (ok !== undefined) tool.ok = ok;
        }
        held[id] = { turns: whole, offset, pending: false, error: '' };
    }

    /**
     * Put turns in as though they had been fetched. The one caller is tests/views/sessions.test.ts,
     * which renders on the server where no fetch runs; nothing in the application calls it.
     */
    function hold(id: string, turns: Turn[], offset = 0): void {
        held[id] = { turns, offset, pending: false, error: '' };
    }

    return { turnsFor, follow, showing, forget, hold };
}
