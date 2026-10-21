// Layer 2, client state. The turns of a session, held per session while an instance is showing it.
//
// The wire model keeps the turn text out of the snapshot, so the conversation is fetched
// rather than selected: turnsFor(id) asks api/transcript the first time a session is wanted and
// holds the answer, the way state/system/docs.svelte.ts asks api/docs for a document. The answer is
// held in the client state's query client, and the fetch is scheduled on a microtask by
// state/client/queries/queries.svelte.ts rather than run inside the call, so reading this from a
// $derived never writes state while a derived is running.
//
// Nothing polls. The `sessions` payload changes whenever a transcript is written, so the record's
// lastActivity moving is the signal that there are bytes to read, and follow() asks for the tail
// from the offset the last read returned. The tail is merged into the turns held inside the
// request, which reads what is held first. A tool call whose result arrives in that tail is
// patched on a copy of its turn, since the call's own turn was read before the result existed.
//
// A subagent's own transcript is held the same way, under its session and the agent's id in the
// session's record (`agent`, empty for the session's own transcript), and asked for with that
// `agent` beside the session's id. Its file grows while the parent's lastActivity stands still, so
// while the agent runs its tab's mark is the session's record itself, which the sessions channel
// hands anew with each message and which every tab of the session reads as the same object
// (followMark). A mark is compared by identity, so it moves once per message, whatever the number
// of tabs and of runs of the effect that hands it.

import { z } from 'zod';
import { byKey } from '../../data/helpers/guards.ts';
import type { SessionAgent, Turn } from '../../data/model/index.ts';
import {
    anyNumberShape,
    filledTextShape,
    mapOfShape,
    readAs,
    readJson,
    survivorsShape
} from '../../data/shapes/shapes.ts';
import { failedAnswer } from '../shared/answers/answers.ts';
import type { Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';

// The views read a turn's shape through this module, as they read a session's through
// state/client/selectors.svelte.ts: the boundary table gives `views/` no import of
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

/** One turn as the server writes it: a turn missing a field the view draws is left out. */
const turnShape = z.object({
    at: z.string().nullable(),
    role: z.enum(['user', 'assistant', 'tool']),
    text: z.string(),
    html: z.string(),
    cut: z.boolean(),
    tool: z
        .object({
            id: z.string(),
            name: z.string(),
            summary: z.string(),
            ok: z.boolean().nullable()
        })
        .nullable()
}) satisfies z.ZodType<Turn>;

/**
 * An answer of the transcript route, each field as typed or absent: the turns that read as turns,
 * the offset to ask from next, and the outcome of each tool call by id.
 */
const bodyShape = z.object({
    turns: survivorsShape(turnShape).catch([]),
    offset: anyNumberShape.optional().catch(undefined),
    results: mapOfShape(z.boolean()).catch({})
});

/** What a body that is not a map says: no turns, no offset and no outcomes. */
const NO_BODY = { turns: [], offset: undefined, results: {} };

/**
 * The turns of each session, held for one client while an instance shows it. `agent` names one
 * subagent of the session by its id in the session's record; empty, the session's own transcript.
 */
export type TranscriptsStore = {
    turnsFor: (id: string, agent?: string) => TurnsState;
    follow: (id: string, mark: unknown, agent?: string) => void;
    showing: (id: string, agent?: string) => () => void;
    forget: (id: string, agent?: string) => void;
    hold: (id: string, turns: Turn[], offset?: number) => void;
};

/** The agent a Transcript tab's saved state pins, or the empty text for the session's own. */
const agentPinShape = z.object({ agent: filledTextShape });

/** The agent a Transcript instance shows, from its saved state: empty for the session's own. */
export function pinnedAgent(state: unknown): string {
    return readAs(agentPinShape, state)?.agent ?? '';
}

/** What a tab's mark is read from: the session's record as one sessions message hands it. */
type FollowRecord = {
    lastActivity: string | null;
    agents: readonly Pick<SessionAgent, 'id' | 'status' | 'ended'>[];
};

/**
 * The mark a Transcript tab hands follow() for one sessions message: the record's lastActivity for
 * the session's own transcript; for a subagent, the record object itself while the agent runs,
 * since its file grows while the session's stamp stands still, and the end it reports once it
 * ended. Every value is one of the message, so the same message gives the same mark in every tab
 * and on every run of the effect.
 */
function followMark(record: FollowRecord | null | undefined, agent: string): unknown {
    if (agent === '') return record?.lastActivity ?? null;
    const row = record?.agents.find((one) => one.id === agent);
    return row?.status === 'running' ? record : `ended ${row?.ended ?? ''}`;
}

/** What one tab follows: its session's id, its agent or the empty text, and its session record. */
type FollowTarget = { id: string; agent: string; record: FollowRecord | null | undefined };

/**
 * The effect a Transcript tab follows its file with, registered in the calling component: it reads
 * the record, so it runs again at each sessions message, and hands follow() the tab's mark.
 */
export function followTab(follow: TranscriptsStore['follow'], target: () => FollowTarget): void {
    $effect(() => {
        const { id, agent, record } = target();
        if (id === '') return;
        follow(id, followMark(record, agent), agent);
    });
}

/** The query key of one transcript: the session's, or one of its agents'. */
function keyOf(id: string, agent: string): string[] {
    return agent === '' ? ['transcript', id] : ['transcript', id, agent];
}

/** The key a transcript is counted and marked under in the store's own records. */
function slotOf(id: string, agent: string): string {
    return agent === '' ? id : JSON.stringify([id, agent]);
}

/** Append what was read to the turns held and fill in the outcome of every call already held. */
function merged(
    held: TurnsState | undefined,
    from: number,
    turns: Turn[],
    offset: number,
    results: Record<string, boolean>
): TurnsState {
    const base = from === 0 ? [] : (held?.turns ?? []);
    const whole = [...base, ...turns].map((turn) => {
        const tool = turn.tool;
        if (tool === null || tool.id === '') return turn;
        const ok = byKey(results, tool.id);
        return ok === undefined || ok === tool.ok ? turn : { ...turn, tool: { ...tool, ok } };
    });
    return { turns: whole, offset, pending: false, error: '' };
}

/**
 * Ask for the session's bytes from the offset held, or from the start when nothing is held, and
 * answer the turns held with what came back. A failed read keeps the turns and says why.
 */
async function tail(id: string, agent: string, held: TurnsState | undefined): Promise<TurnsState> {
    const from = held?.offset ?? 0;
    const kept = held?.turns ?? [];
    try {
        const query = new URLSearchParams({ id, from: String(from) });
        if (agent !== '') query.set('agent', agent);
        const url = `/api/transcript?${query.toString()}`;
        const response = await fetch(url);
        const raw = await readJson(response);
        if (raw === undefined || !response.ok) {
            return {
                turns: kept,
                offset: from,
                pending: false,
                error: failedAnswer(response, raw)
            };
        }
        const body = readAs(bodyShape, raw) ?? NO_BODY;
        return merged(held, from, body.turns, body.offset ?? from, body.results);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { turns: kept, offset: from, pending: false, error: reason };
    }
}

export function createTranscripts(queries: Queries): TranscriptsStore {
    /** The mark each transcript was last asked at. */
    const marks: Record<string, unknown> = {};

    /**
     * The turns of one session. The first call for a session asks the server for the whole file;
     * every later call reads what is held, and follow() is what asks for the rest.
     */
    function turnsFor(id: string, agent = ''): TurnsState {
        if (id === '') return NOTHING;
        // Nothing is fetched while the page is rendered on the server: there is no window to draw
        // it in, and the browser asks for it on the first client render.
        const { data } = queries.read<TurnsState>(
            keyOf(id, agent),
            (held) => tail(id, agent, held),
            { enabled: inBrowser() }
        );
        return data ?? PENDING;
    }

    /**
     * Read what has been appended since the last read, when the record says there is something.
     * Called from a tab's effect (followTab) with a mark of the sessions message, compared by
     * identity: the first call for a transcript only notes the mark, since the read turnsFor()
     * scheduled already carries everything written up to it. A mark that moves while a request is
     * out asks again when it lands. A hidden tab only marks the turns, and asks once when it is
     * shown.
     */
    function follow(id: string, given: unknown, agent = ''): void {
        if (id === '') return;
        const slot = slotOf(id, agent);
        const key = keyOf(id, agent);
        const mark = given ?? '';
        const first = marks[slot] === undefined;
        if (marks[slot] === mark) return;
        marks[slot] = mark;
        if (first) return;
        if (queries.peek<TurnsState>(key).data === undefined || !inBrowser()) return;
        queries.refetch<TurnsState>(key, (held) => tail(id, agent, held), 'again');
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
    function showing(id: string, agent = ''): () => void {
        if (id === '') {
            return () => {
                // An unnamed instance was never counted, so releasing it drops nothing.
            };
        }
        const slot = slotOf(id, agent);
        viewers[slot] = (viewers[slot] ?? 0) + 1;
        let released = false;
        return () => {
            if (released) return;
            released = true;
            const left = (viewers[slot] ?? 1) - 1;
            if (left > 0) {
                viewers[slot] = left;
                return;
            }
            forget(id, agent);
        };
    }

    /**
     * Drop everything held for one session, so the next call for it fetches from the start again.
     * A request still out for it is cancelled, so its answer is not held.
     */
    function forget(id: string, agent = ''): void {
        const slot = slotOf(id, agent);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete viewers[slot];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete marks[slot];
        queries.forget(keyOf(id, agent));
    }

    /**
     * Put turns in as though they had been fetched. Nothing in the application calls it.
     */
    function hold(id: string, turns: Turn[], offset = 0): void {
        const held: TurnsState = { turns, offset, pending: false, error: '' };
        queries.hold(keyOf(id, ''), held);
    }

    return { turnsFor, follow, showing, forget, hold };
}
