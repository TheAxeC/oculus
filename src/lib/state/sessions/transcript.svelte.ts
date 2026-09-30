// Layer 2, client state. The turns of a session, held per session while an instance is showing it.
//
// DESIGN.md's wire model keeps the turn text out of the snapshot, so the conversation is fetched
// rather than selected: turnsFor(id) asks api/transcript the first time a session is wanted and
// holds the answer, the way state/system/docs.svelte.ts asks api/docs for a document. The answer is
// held in the client state's query client, and the fetch is scheduled on a microtask by
// state/client/queries.svelte.ts rather than run inside the call, so reading this from a
// $derived never writes state while a derived is running.
//
// Nothing polls. The `sessions` payload changes whenever a transcript is written, so the record's
// lastActivity moving is the signal that there are bytes to read, and follow() asks for the tail
// from the offset the last read returned. The tail is merged into the turns held inside the
// request, which reads what is held first. A tool call whose result arrives in that tail is
// patched on a copy of its turn, since the call's own turn was read before the result existed.

import type { Turn } from '../../data/model/index.ts';
import type { Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';

// The views read a turn's shape through this module, as they read a session's through
// state/client/selectors.svelte.ts: the boundary table of DESIGN.md gives `views/` no import of
// `data/`.
export type { Turn, TurnTool } from '../../data/model/index.ts';

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

/** The query key of one session's turns. */
function keyOf(id: string): string[] {
    return ['transcript', id];
}

/** Append what was read to the turns held and fill in the outcome of every call already held. */
function merged(
    held: TurnsState | undefined,
    from: number,
    turns: Turn[],
    offset: number,
    results: Record<string, boolean | undefined>
): TurnsState {
    const base = from === 0 ? [] : (held?.turns ?? []);
    const whole = [...base, ...turns].map((turn) => {
        const tool = turn.tool;
        if (tool === null || tool.id === '') return turn;
        const ok = results[tool.id];
        return ok === undefined || ok === tool.ok ? turn : { ...turn, tool: { ...tool, ok } };
    });
    return { turns: whole, offset, pending: false, error: '' };
}

/**
 * Ask for the session's bytes from the offset held, or from the start when nothing is held, and
 * answer the turns held with what came back. A failed read keeps the turns and says why.
 */
async function tail(id: string, held: TurnsState | undefined): Promise<TurnsState> {
    const from = held?.offset ?? 0;
    const kept = held?.turns ?? [];
    try {
        const url = `/api/transcript?id=${encodeURIComponent(id)}&from=${from}`;
        const response = await fetch(url);
        const body = (await response.json()) as {
            turns?: Turn[];
            offset?: number;
            results?: Record<string, boolean>;
            error?: string;
        };
        if (!response.ok) {
            return {
                turns: kept,
                offset: from,
                pending: false,
                error: body.error ?? String(response.status)
            };
        }
        return merged(held, from, body.turns ?? [], body.offset ?? from, body.results ?? {});
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { turns: kept, offset: from, pending: false, error: reason };
    }
}

export function createTranscripts(queries: Queries): TranscriptsStore {
    /** The lastActivity each session was last asked at. */
    const marks: Record<string, string | undefined> = {};

    /**
     * The turns of one session. The first call for a session asks the server for the whole file;
     * every later call reads what is held, and follow() is what asks for the rest.
     */
    function turnsFor(id: string): TurnsState {
        if (id === '') return NOTHING;
        // Nothing is fetched while the page is rendered on the server: there is no window to draw
        // it in, and the browser asks for it on the first client render.
        const { data } = queries.read<TurnsState>(keyOf(id), (held) => tail(id, held), {
            enabled: inBrowser()
        });
        return data ?? PENDING;
    }

    /**
     * Read what has been appended since the last read, when the record says there is something.
     * Called from the view's effect with the record's lastActivity: the first call for a session
     * only notes the stamp, since the read turnsFor() scheduled already carries everything written
     * up to it. A stamp that moves while a request is out asks again when it lands.
     */
    function follow(id: string, lastActivity: string | null): void {
        if (id === '') return;
        const mark = lastActivity ?? '';
        const first = marks[id] === undefined;
        if (marks[id] === mark) return;
        marks[id] = mark;
        if (first) return;
        if (queries.peek<TurnsState>(keyOf(id)).data === undefined || !inBrowser()) return;
        queries.refetch<TurnsState>(keyOf(id), (held) => tail(id, held), 'again');
    }

    /**
     * How many instances are showing each session, so the last one to close is what drops its
     * turns.
     */
    const viewers: Record<string, number> = {};

    /**
     * Note that one instance is showing the session, and hand back the call that says it stopped.
     * What is held otherwise stays held for the page's life: a session opened once keeps its whole
     * transcript in memory, and a long day's transcript is the larger part of what the page holds.
     * When the last instance showing a session closes, its turns are dropped and the next open
     * reads the tail again. Calling the returned function twice counts once, so an instance that
     * releases on both a teardown and a change of session does not drop turns another instance is
     * still drawing.
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
            forget(id);
        };
    }

    /**
     * Drop everything held for one session, so the next call for it fetches from the start again.
     * A request still out for it is cancelled, so its answer is not held.
     */
    function forget(id: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete viewers[id];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete marks[id];
        queries.forget(keyOf(id));
    }

    /**
     * Put turns in as though they had been fetched. The one caller is
     * tests/views/sessions/sessions.test.ts, which renders on the server where no fetch runs;
     * nothing in the application calls it.
     */
    function hold(id: string, turns: Turn[], offset = 0): void {
        const held: TurnsState = { turns, offset, pending: false, error: '' };
        queries.hold(keyOf(id), held);
    }

    return { turnsFor, follow, showing, forget, hold };
}
