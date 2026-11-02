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
// from the offset the last read returned. A tool call whose result arrives in that tail is patched
// on a copy of its turn, since the call's own turn was read before the result existed.
//
// A first read answers the end of the file and the byte its oldest turn's line starts at, and
// readOlder() asks for the turns ahead of that byte when the reader nears the top. That read is
// held beside the query rather than as its fetch, through queries.peek and queries.hold, since
// queries.refetch would replace the fetcher a mark asks with. So a tail read and a read of older
// turns can be out together, and each merges into what is held when it lands, never into what was
// held when it started. Every outcome a read gives is kept in `results`, so a call read later than
// its result still draws it.
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
    /** The byte to ask before for older turns, 0 when there is nothing older. */
    head: number;
    /** Every outcome the reads gave, by call id, whichever read saw it. */
    results: Record<string, boolean>;
    /** How many turns reads of older turns have added at the top. */
    above: number;
    /** Whether a read of older turns is out. */
    older: boolean;
    /** What the last read of older turns failed with, or the empty string. */
    olderError: string;
};

/** The older reads of a transcript none has been made for. */
const NO_OLDER = Object.freeze({
    head: 0,
    results: Object.freeze({}),
    above: 0,
    older: false,
    olderError: ''
});

/** What a session reads as before its first answer arrives. */
const PENDING: TurnsState = Object.freeze({
    turns: [],
    offset: 0,
    pending: true,
    error: '',
    ...NO_OLDER
});

/** What no session at all reads as: an empty id asks nothing and waits for nothing. */
const NOTHING: TurnsState = Object.freeze({ ...PENDING, pending: false });

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
 * the offset to ask from next, the byte to ask before for older turns, and the outcome of each tool
 * call by id.
 */
const bodyShape = z.object({
    turns: survivorsShape(turnShape).catch([]),
    offset: anyNumberShape.optional().catch(undefined),
    head: anyNumberShape.optional().catch(undefined),
    results: mapOfShape(z.boolean()).catch({})
});

/** An answer of the transcript route as the store reads it. */
type Body = z.output<typeof bodyShape>;

/** What a body that is not a map says: no turns, no offset, no head and no outcomes. */
const NO_BODY: Body = { turns: [], offset: undefined, head: undefined, results: {} };

/**
 * The turns of each session, held for one client while an instance shows it. `agent` names one
 * subagent of the session by its id in the session's record; empty, the session's own transcript.
 */
export type TranscriptsStore = {
    turnsFor: (id: string, agent?: string) => TurnsState;
    follow: (id: string, mark: unknown, agent?: string) => void;
    readOlder: (id: string, agent?: string) => void;
    showing: (id: string, agent?: string) => () => void;
    forget: (id: string, agent?: string) => void;
    hold: (id: string, turns: Turn[], offset?: number) => void;
};

/** What a tab's mark is read from: the session's record as one sessions message hands it. */
type FollowRecord = {
    lastActivity: string | null;
    agents: readonly Pick<SessionAgent, 'id' | 'status' | 'ended'>[];
};

/**
 * The mark a Terminal tab that draws its transcript hands follow() for one sessions message: the
 * record's lastActivity for the session's own transcript; for a subagent, the record object itself
 * while the agent runs, since its file grows while the session's stamp stands still, and the end it
 * reports once it ended. Every value is one of the message, so the same message gives the same mark
 * in every tab and on every run of the effect.
 */
function followMark(record: FollowRecord | null | undefined, agent: string): unknown {
    if (agent === '') return record?.lastActivity ?? null;
    const row = record?.agents.find((one) => one.id === agent);
    return row?.status === 'running' ? record : `ended ${row?.ended ?? ''}`;
}

/** What one tab follows: its session's id, its agent or the empty text, and its session record. */
type FollowTarget = { id: string; agent: string; record: FollowRecord | null | undefined };

/**
 * The effect a tab's transcript body follows its file with, registered in the calling component,
 * which is mounted only while Transcript shows: it reads the record, so it runs again at each
 * sessions message, and hands follow() the tab's mark.
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

/** Each turn of `turns`, a tool call `results` names patched on a copy with its outcome. */
function withOutcomes(turns: Turn[], results: Record<string, boolean>): Turn[] {
    return turns.map((turn) => {
        const tool = turn.tool;
        if (tool === null || tool.id === '') return turn;
        const ok = byKey(results, tool.id);
        return ok === undefined || ok === tool.ok ? turn : { ...turn, tool: { ...tool, ok } };
    });
}

/**
 * A read from `from` merged into what is held when it lands. A read from the end of the file,
 * `from` 0, replaces everything; any other appends, fills in the outcome of every call already
 * held, and keeps the head and whatever older reads did meanwhile.
 */
function merged(held: TurnsState | undefined, from: number, body: Body): TurnsState {
    const offset = body.offset ?? from;
    const settled = { offset, pending: false, error: '' };
    if (from === 0) {
        const turns = withOutcomes(body.turns, body.results);
        return { ...NO_OLDER, ...settled, turns, head: body.head ?? 0, results: body.results };
    }
    const kept = held ?? NOTHING;
    const turns = withOutcomes([...kept.turns, ...body.turns], body.results);
    return { ...kept, ...settled, turns, results: { ...kept.results, ...body.results } };
}

/** The turns of a read of older turns put in at the top of what is held when it lands. */
function prepended(held: TurnsState, body: Body): TurnsState {
    const results = { ...held.results, ...body.results };
    return {
        ...held,
        turns: [...withOutcomes(body.turns, results), ...held.turns],
        head: body.head ?? 0,
        results,
        above: held.above + body.turns.length,
        older: false,
        olderError: ''
    };
}

/** The route's answer to `asked` about one transcript: its body, or why it could not be read. */
async function ask(
    id: string,
    agent: string,
    asked: Record<string, string>
): Promise<Body | string> {
    try {
        const query = new URLSearchParams({ id, ...asked });
        if (agent !== '') query.set('agent', agent);
        const response = await fetch(`/api/transcript?${query.toString()}`);
        const raw = await readJson(response);
        if (raw === undefined || !response.ok) return failedAnswer(response, raw);
        return readAs(bodyShape, raw) ?? NO_BODY;
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
}

/**
 * Ask for the session's bytes from the offset held, or for its first read when nothing is held,
 * which the server answers from the end of the file, and answer what `current` holds when the
 * answer lands, merged with it. A failed read keeps the turns and says why.
 */
async function tail(
    id: string,
    agent: string,
    held: TurnsState | undefined,
    current: () => TurnsState | undefined
): Promise<TurnsState> {
    const from = held?.offset ?? 0;
    const body = await ask(id, agent, { from: String(from) });
    if (typeof body !== 'string') return merged(current(), from, body);
    return { ...(current() ?? NOTHING), pending: false, error: body };
}

export function createTranscripts(queries: Queries): TranscriptsStore {
    /** The mark each transcript was last asked at. */
    const marks: Record<string, unknown> = {};

    /** What is held for one transcript at this moment. */
    const heldNow = (key: string[]): TurnsState | undefined => queries.peek<TurnsState>(key).data;

    /** The fetcher of one transcript: a tail read that merges into what is held as it lands. */
    function tailOf(
        id: string,
        agent: string
    ): (held: TurnsState | undefined) => Promise<TurnsState> {
        return (held) => tail(id, agent, held, () => heldNow(keyOf(id, agent)));
    }

    /**
     * The turns of one session. The first call for a session asks the server for a first read, the
     * last turns of the end of the file; every later call reads what is held, and follow() and
     * readOlder() are what ask for the rest.
     */
    function turnsFor(id: string, agent = ''): TurnsState {
        if (id === '') return NOTHING;
        // Nothing is fetched while the page is rendered on the server: there is no window to draw
        // it in, and the browser asks for it on the first client render.
        const { data } = queries.read<TurnsState>(keyOf(id, agent), tailOf(id, agent), {
            enabled: inBrowser()
        });
        return data ?? PENDING;
    }

    /**
     * Ask once for the turns ahead of the held `head`: a call while one is out, or with nothing
     * older, does nothing. The answer is applied only while that read is still the one out, on the
     * same `head`, so one that lands after forget() or a new first read holds nothing, and a failed
     * read keeps the turns and says why. Called from a handler or inside `untrack`, since it reads
     * and writes what the caller draws.
     */
    function readOlder(id: string, agent = ''): void {
        const key = keyOf(id, agent);
        const held = heldNow(key);
        if (held === undefined || held.head === 0 || held.older) return;
        const before = held.head;
        queries.hold(key, { ...held, older: true, olderError: '' });
        void ask(id, agent, { before: String(before) }).then((body) => {
            const now = heldNow(key);
            if (now === undefined || !now.older || now.head !== before) return;
            if (typeof body === 'string') {
                queries.hold(key, { ...now, older: false, olderError: body });
            } else {
                queries.hold(key, prepended(now, body));
            }
        });
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
        if (heldNow(key) === undefined || !inBrowser()) return;
        queries.refetch<TurnsState>(key, tailOf(id, agent), 'again');
    }

    /**
     * How many instances are showing each session, so the last one to close is what drops its
     * turns.
     */
    const viewers: Record<string, number> = {};

    /**
     * Note that one instance is showing the session, and hand back the call that says it stopped.
     * What is held otherwise stays held for the page's life: a session opened once keeps every turn
     * read of it in memory, as far up as a reader scrolled, and a long day's transcript is the
     * larger part of what the page holds. When the last instance showing a session closes, its
     * turns are dropped and the next open reads the tail again. Calling the returned function twice
     * counts once, so an instance that releases on both a teardown and a change of session does not
     * drop turns another instance is still drawing.
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
     * Drop everything held for one session, so the next call for it makes a first read again. A
     * request still out for it is cancelled, so its answer is not held, and a read of older turns
     * still out finds nothing to apply to.
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
        queries.hold(keyOf(id, ''), { ...NOTHING, turns, offset });
    }

    return { turnsFor, follow, readOlder, showing, forget, hold };
}
