// Layer 2, server tests. The transcript route reads only a file a session record of the last
// published payload names: the session's own transcript, or the transcript of an agent the record
// lists. A Claude agent's is `<session>/subagents/agent-<agent id>.jsonl` beside the session's
// file; a Codex agent's is the rollout of the session record whose id is the agent's thread id. An
// agent the record does not hold, a path given as the agent, an agent whose result named no agent
// id, an agent whose file is not there and a Codex agent whose own record the payload lacks are
// each refused as an unknown session is, and a file planted where a path of the request would lead
// is never what an answer holds. The sessions are a Claude transcript and two Codex rollouts in a
// scratch folder, folded by readSession as the sessions watcher folds them.
//
// A read never holds the server's thread for the whole file: a first read takes the file's end, and
// every read gives the thread back between pieces. The files above the 32 MiB a first read takes
// are sparse, so a case writes only the bytes it asks about. `padded` breaks their zero bytes into
// lines of a MiB; a row that calls `planted` itself places its own lines, and the zero bytes
// between them are one line, which a read decodes and skips as a line that does not parse.
//
// A read of older turns goes on from the `head` the read after it answered, so reads chained to the
// file's head hold every turn once, in the order of a read of the whole file, whichever line a read
// starts on, and an outcome the kept turns cannot carry travels in `results`.

import {
    appendFileSync,
    closeSync,
    ftruncateSync,
    mkdirSync,
    openSync,
    writeFileSync,
    writeSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { handleTranscript } from '../../../src/lib/server/sessions/transcript-routes.ts';
import { agentFile } from '../../../src/lib/server/sessions/stores/background.ts';
import { readSession } from '../../../src/lib/server/sessions/stores/transcripts.ts';
import { readTurns, type TurnsAnswer } from '../../../src/lib/server/sessions/stores/turns.ts';
import type { SessionRecord } from '../../../src/lib/data/model/index.ts';

const SESSION = 'b2c4a7e0-0000-4000-8000-000000000001';
const PARENT = '01a0be4f-0cf4-7a62-9172-5e1a0d9c6f0b';
const CHILD = '01a0be5f-d163-7291-8667-027dcec4bd6f';

const MIB = 1024 * 1024;

/** The bytes a first read takes from a file's end. */
const TAIL_BYTES = 32 * MIB;

/** A file above those bytes, and five of the 8 MiB pieces a read takes at a time. */
const ABOVE = 40 * MIB;

/** Where a first read of a file of `ABOVE` bytes starts. */
const START = ABOVE - TAIL_BYTES;

/** One Claude record of a human turn holding `text`. */
function said(text: string, second: number): string {
    return JSON.stringify({
        type: 'user',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        origin: { kind: 'human' },
        message: { role: 'user', content: text }
    });
}

/** The answer of one Agent call, with the result Claude Code writes beside it. */
function answered(id: string, result: Record<string, unknown>, second: number): string {
    return JSON.stringify({
        type: 'user',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: id, content: 'answered' }]
        },
        toolUseResult: result
    });
}

/** An assistant turn calling the Agent tool once for each id. */
function calls(ids: string[], second: number): string {
    return JSON.stringify({
        type: 'assistant',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        message: {
            role: 'assistant',
            content: ids.map((id) => ({
                type: 'tool_use',
                id,
                name: 'Agent',
                input: {
                    description: id,
                    subagent_type: 'general-purpose',
                    run_in_background: id === 'toolu_bg'
                }
            }))
        }
    });
}

/** An assistant turn saying `text`. */
function assistant(text: string, second: number): string {
    return JSON.stringify({
        type: 'assistant',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        message: { role: 'assistant', content: [{ type: 'text', text }] }
    });
}

/** An assistant turn saying `text` and calling one tool for each id, all on one line. */
function spoken(text: string, ids: string[], second: number): string {
    const content = ids.map((id) => ({ type: 'tool_use', id, name: 'Bash', input: {} }));
    return JSON.stringify({
        type: 'assistant',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        message: { role: 'assistant', content: [{ type: 'text', text }, ...content] }
    });
}

/** One record of a Codex rollout: a completed item of `thread`, at `second`. */
function item(thread: string, value: Record<string, unknown>, second: number): string {
    return JSON.stringify({
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        type: 'event_msg',
        payload: { type: 'item_completed', thread_id: thread, item: value }
    });
}

/** The opening `session_meta` of a Codex rollout, with the fields a subagent's carries. */
function meta(id: string, extra: Record<string, unknown>): string {
    return JSON.stringify({
        timestamp: new Date(1760000000000).toISOString(),
        type: 'session_meta',
        payload: { id, cwd: '/w', ...extra }
    });
}

/** A sparse file of `size` bytes holding each text at its position. */
function planted(path: string, size: number, parts: [number, string][]): void {
    const handle = openSync(path, 'w');
    try {
        ftruncateSync(handle, size);
        for (const [position, text] of parts) writeSync(handle, text, position);
    } finally {
        closeSync(handle);
    }
}

/** A sparse file of `ABOVE` bytes: `head`, lines of zero bytes, and `tail` as its last bytes. */
function padded(path: string, head: string, tail: string): void {
    const last = ABOVE - Buffer.byteLength(tail);
    const breaks: [number, string][] = [];
    for (let at = MIB; at < last; at += MIB) breaks.push([at, '\n']);
    planted(path, ABOVE, [[0, head], ...breaks, [last - 1, '\n'], [last, tail]]);
}

/** The records of the last published payload, by session id. */
const records = new Map<string, SessionRecord>();

/** A record the payload holds, by its session id. */
function held(id: string): SessionRecord {
    const record = records.get(id);
    if (record === undefined) throw new Error(`the fixture holds no record of ${id}`);
    return record;
}

test.beforeAll(() => {
    const store = scratchDir('oculus-transcript-route-');
    const own = join(store, SESSION);
    const subagents = join(own, 'subagents');
    mkdirSync(subagents, { recursive: true });
    const path = join(store, `${SESSION}.jsonl`);
    writeFileSync(
        path,
        [
            said('the session asks', 0),
            calls(['toolu_bg', 'toolu_done', 'toolu_noid', 'toolu_gone'], 1),
            answered('toolu_bg', { isAsync: true, status: 'async_launched', agentId: 'abg1' }, 2),
            answered('toolu_done', { status: 'completed', agentId: 'adone1', totalTokens: 5 }, 3),
            answered('toolu_noid', { status: 'completed', totalTokens: 5 }, 4),
            answered('toolu_gone', { status: 'completed', agentId: 'agone1' }, 5)
        ].join('\n') + '\n'
    );
    writeFileSync(join(subagents, 'agent-abg1.jsonl'), `${said('the background agent', 0)}\n`);
    writeFileSync(join(subagents, 'agent-adone1.jsonl'), `${said('the finished agent', 0)}\n`);
    // The files a path of the request would lead to, which no answer may hold.
    for (const decoy of [
        join(store, 'x.jsonl'),
        join(own, 'x.jsonl'),
        join(subagents, 'x.jsonl')
    ]) {
        writeFileSync(decoy, `${said('a planted file', 0)}\n`);
    }
    records.set(SESSION, readSession(path));

    const day = join(store, 'codex', '2026', '09', '20');
    mkdirSync(day, { recursive: true });
    const parent = join(day, `rollout-2026-09-20T12-14-06-${PARENT}.jsonl`);
    const child = join(day, `rollout-2026-09-20T12-32-25-${CHILD}.jsonl`);
    const activity = (kind: string, second: number) =>
        item(
            PARENT,
            {
                type: 'SubAgentActivity',
                id: `call_${kind}`,
                kind,
                agent_thread_id: CHILD,
                agent_path: '/root/q36_finish'
            },
            second
        );
    writeFileSync(
        parent,
        [
            meta(PARENT, {}),
            item(
                PARENT,
                { type: 'UserMessage', content: [{ type: 'text', text: 'the parent asks' }] },
                1
            ),
            activity('started', 2),
            activity('completed', 3),
            item(
                PARENT,
                { type: 'SubAgentActivity', kind: 'started', agent_path: '/root/unnamed' },
                4
            )
        ].join('\n') + '\n'
    );
    writeFileSync(
        child,
        [
            meta(CHILD, { parent_thread_id: PARENT, agent_path: '/root/q36_finish' }),
            item(
                CHILD,
                { type: 'UserMessage', content: [{ type: 'text', text: 'the child asks' }] },
                2
            )
        ].join('\n') + '\n'
    );
    records.set(PARENT, readSession(parent, join(store, 'codex')));
    records.set(CHILD, readSession(child, join(store, 'codex')));
});

/**
 * The route's answer to one request for the session `id`, with `agent` when it is not null, the
 * payload holding every record but those of `absent`.
 */
async function asked(
    id: string,
    agent: string | null,
    absent: string[] = []
): Promise<{ status: number; text: string }> {
    const query = agent === null ? '' : `&agent=${encodeURIComponent(agent)}`;
    const response = await handleTranscript(
        new Request(`http://oculus.test/api/transcript?id=${id}${query}`),
        { recordFor: (asked) => (absent.includes(asked) ? null : (records.get(asked) ?? null)) }
    );
    return { status: response.status, text: await response.text() };
}

/** The catalog lines an export is worded from. */
const CATALOG: Record<string, string> = {
    'server.export.agent': 'Agent: {0}',
    'server.export.assistant': 'Agent',
    'server.export.error': 'error',
    'server.export.folder': 'Folder: {0}',
    'server.export.ok': 'ok',
    'server.export.running': 'running',
    'server.export.session': 'Session: {0}',
    'server.export.started': 'Started: {0}',
    'server.export.tool': '{0}: {1} ({2})',
    'server.export.user': 'You'
};

/** The route's response to one request about `record`, with `query` after its id. */
async function request(record: SessionRecord, query = ''): Promise<Response> {
    return await handleTranscript(
        new Request(`http://oculus.test/api/transcript?id=${record.id}${query}`),
        {
            recordFor: (id) => (id === record.id ? record : null),
            catalogFor: () => CATALOG
        }
    );
}

/** The turns' texts of an answer, its offset and its results. */
function read(answer: TurnsAnswer): Pick<TurnsAnswer, 'offset' | 'results'> & { texts: string[] } {
    return {
        texts: answer.turns.map((turn) => turn.text),
        offset: answer.offset,
        results: answer.results
    };
}

/** The answer of one read of the file `path` as the Claude session's transcript. */
async function turnsOf(path: string, query = ''): Promise<TurnsAnswer> {
    const response = await request({ ...held(SESSION), path }, query);
    return (await response.json()) as TurnsAnswer;
}

/** A new file path in a folder of its own. */
function fresh(): string {
    return join(scratchDir('oculus-transcript-read-'), 'session.jsonl');
}

/** The turn at the head of a file, which a first read of a file above the tail does not reach. */
const MARKED = `${said('the marked turn', 0)}\n`;

/** More turns than a first read keeps, in a file below the tail. */
const MANY = Array.from({ length: 250 }, (_, index) => said(`turn ${index}`, index));

/** The last line of the file `planted` writes for a start around a line. */
const AFTER = `${said('after the cut', 2)}\n`;

/** A file 100 MiB long whose last 40 MiB hold one turn, at their head. */
const FAR = 100 * MIB;

/** Write that file, with `MARKED` at its head, so a first read has to double its distance. */
function doubled(path: string): void {
    const turn = `\n${said('forty from the end', 1)}\n`;
    planted(path, FAR, [
        [0, MARKED],
        [FAR - 40 * MIB - 1, turn],
        [FAR - 1, '\n']
    ]);
}

/** Lines holding one turn each, with the text `turn <n>`, the file's whole text. */
function numbered(count: number): string {
    return `${Array.from({ length: count }, (_, at) => said(`turn ${at}`, at)).join('\n')}\n`;
}

/** The texts `turn <from>` up to but not including `turn <to>`. */
function texts(from: number, to: number): string[] {
    return Array.from({ length: to - from }, (_, at) => `turn ${from + at}`);
}

/** An answer of a read that ends at a byte. */
type EndAnswer = TurnsAnswer & { head: number };

/** The answer of one such read of the file `path` as the Claude session's transcript. */
async function endOf(path: string, query = ''): Promise<EndAnswer> {
    return (await turnsOf(path, query)) as EndAnswer;
}

/** The texts of an answer's turns. */
function textsIn(answer: TurnsAnswer): string[] {
    return answer.turns.map((turn) => turn.text);
}

/** The Codex rollout's turn `text`, one line. */
function rollout(text: string, second: number): string {
    return `${item(CHILD, { type: 'UserMessage', text }, second)}\n`;
}

/** The record and the query that read the file at `path`, and where a subagent's file lies. */
type Source = { path: () => string; record: (path: string) => SessionRecord; query: string };

const claude: Source = {
    path: fresh,
    record: (path) => ({ ...held(SESSION), path }),
    query: ''
};
const codex: Source = {
    path: fresh,
    record: (path) => ({ ...held(PARENT), path }),
    query: ''
};
const subagent: Source = {
    path: () => agentFile(held(SESSION).path, SESSION, 'abig1'),
    record: () => {
        const own = held(SESSION);
        return { ...own, agents: [{ ...own.agents[0], id: 'toolu_big', agentId: 'abig1' }] };
    },
    query: '&agent=toolu_big'
};

describe('a first read of the transcript route', () => {
    it.each([
        {
            name: 'a file above the tail holds the turns of the tail in order',
            source: claude,
            write: (path: string) => {
                const tail = `${said('tail one', 1)}\n${said('tail two', 2)}\n`;
                padded(path, MARKED, tail);
            },
            texts: ['tail one', 'tail two'],
            offset: ABOVE
        },
        {
            name: 'a file below the tail holds its last 200 turns',
            source: claude,
            write: (path: string) => {
                writeFileSync(path, `${MANY.join('\n')}\n`);
            },
            texts: Array.from({ length: 200 }, (_, index) => `turn ${index + 50}`),
            offset: Buffer.byteLength(`${MANY.join('\n')}\n`)
        },
        {
            name: 'a tail with no turn reads the doubled distance and no further',
            source: claude,
            write: doubled,
            texts: ['forty from the end'],
            offset: FAR
        },
        {
            name: 'a start inside a line drops that line',
            source: claude,
            write: (path: string) => {
                planted(path, ABOVE, [
                    [0, MARKED],
                    [START - 10, `\n${said('cut by the start', 1)}\n`],
                    [ABOVE - AFTER.length - 1, `\n${AFTER}`]
                ]);
            },
            texts: ['after the cut'],
            offset: ABOVE
        },
        {
            name: 'a start on the first byte of a line keeps that line',
            source: claude,
            write: (path: string) => {
                planted(path, ABOVE, [
                    [0, MARKED],
                    [START - 1, `\n${said('whole at the start', 1)}\n`],
                    [ABOVE - AFTER.length - 1, `\n${AFTER}`]
                ]);
            },
            texts: ['whole at the start', 'after the cut'],
            offset: ABOVE
        },
        {
            // The line as a whole does not parse, and read from `START - 1` it would: JSON takes
            // the spaces before the record, so only the drop keeps the turn out.
            name: 'a start inside a line drops that line though its end alone parses',
            source: claude,
            write: (path: string) => {
                const line = `x${' '.repeat(20)}${said('the end of a line', 1)}`;
                planted(path, ABOVE, [
                    [0, MARKED],
                    [START - 11, `\n${line}\n`],
                    [ABOVE - AFTER.length - 1, `\n${AFTER}`]
                ]);
            },
            texts: ['after the cut'],
            offset: ABOVE
        },
        {
            name: "a subagent's transcript above the tail holds the tail",
            source: subagent,
            write: (path: string) => {
                padded(path, MARKED, `${said('the agent tail', 1)}\n`);
            },
            texts: ['the agent tail'],
            offset: ABOVE
        },
        {
            name: 'a Codex rollout above the tail holds the tail',
            source: codex,
            write: (path: string) => {
                padded(path, rollout('the marked turn', 0), rollout('the rollout tail', 1));
            },
            texts: ['the rollout tail'],
            offset: ABOVE
        },
        {
            name: 'an empty file holds nothing',
            source: claude,
            write: (path: string) => {
                writeFileSync(path, '');
            },
            texts: [],
            offset: 0
        },
        {
            name: 'a missing file holds nothing',
            source: claude,
            write: () => undefined,
            texts: [],
            offset: 0
        }
    ])('$name', async ({ source, write, texts, offset }) => {
        const path = source.path();
        write(path);
        const response = await request(source.record(path), source.query);
        expect(response.status).toBe(200);
        expect(read((await response.json()) as TurnsAnswer)).toEqual({
            texts,
            offset,
            results: {}
        });
    });

    it('is followed by a next read of only the turn appended', async () => {
        const path = fresh();
        padded(path, MARKED, `${said('the tail', 1)}\n`);
        const first = await turnsOf(path);
        const appended = `${said('appended', 2)}\n`;
        appendFileSync(path, appended);
        const next = await turnsOf(path, `&from=${first.offset}`);
        expect(read(next)).toEqual({
            texts: ['appended'],
            offset: ABOVE + appended.length,
            results: {}
        });
    });

    it('stops at the line feed of a last line being written, and the next read has it whole', async () => {
        const path = fresh();
        const finished = `${said('the finished line', 1)}\n`;
        const writing = said('the line being written', 2);
        const part = 20;
        padded(path, MARKED, finished + writing.slice(0, part));
        const first = await turnsOf(path);
        expect(first.offset).toBe(ABOVE - part);
        appendFileSync(path, `${writing.slice(part)}\n`);
        const next = await turnsOf(path, `&from=${first.offset}`);
        expect(next.turns.map((turn) => turn.text)).toEqual(['the line being written']);
    });

    it.each([
        { name: 'a first read', query: '' },
        { name: 'a read from an offset', query: `&from=${MARKED.length}` }
    ])('renders the Markdown of an assistant turn $name answers', async ({ query }) => {
        const path = fresh();
        writeFileSync(path, `${MARKED}${assistant('the **answer**', 1)}\n`);
        const { turns } = await turnsOf(path, query);
        expect(turns[turns.length - 1].html).toBe('<p>the <strong>answer</strong></p>\n');
    });

    it('keeps the words of a turn the render cannot take, and the turn after it', async () => {
        const path = fresh();
        const nested = `${'> '.repeat(2600)}deep`;
        writeFileSync(path, `${assistant(nested, 1)}\n${assistant('the **next**', 2)}\n`);
        const { turns } = await turnsOf(path);
        expect(turns.map((turn) => turn.html.startsWith('<pre>'))).toEqual([true, false]);
        expect(turns[0].html).toContain('deep');
    });
});

describe('a read of a file of several pieces', () => {
    /** The lines at the end of the file `several` writes. */
    const TAIL = `${answered('toolu_x', { status: 'completed' }, 3)}\n${said('the tail turn', 4)}\n`;

    /** The byte those lines start at. */
    const TAIL_LINES = ABOVE - Buffer.byteLength(TAIL);

    /** A file of five pieces: two turns at its head, two at its end, a call's result among them. */
    function several(): SessionRecord {
        const path = fresh();
        padded(
            path,
            `${said('the head turn\nits second line', 1)}\n${calls(['toolu_x'], 2)}\n`,
            TAIL
        );
        return { ...held(SESSION), path, title: 'A title', cwd: '/w', started: 'the start' };
    }

    it('exports every turn of the file, a call with its result', async () => {
        const response = await request(several(), '&format=markdown');
        expect(await response.text()).toBe(
            [
                '# A title',
                '',
                `- Session: ${SESSION}`,
                '- Agent: claude',
                '- Folder: /w',
                '- Started: the start',
                '',
                '## You 2025-10-09T08:53:21.000Z',
                '',
                '> the head turn',
                '> its second line',
                '',
                '- Agent: toolu_x (ok)',
                '',
                '## You 2025-10-09T08:53:24.000Z',
                '',
                '> the tail turn',
                ''
            ].join('\n')
        );
    });

    it('sends the heading of an export and only then reads the file', async () => {
        const path = fresh();
        writeFileSync(path, `${said('in the file', 1)}\n`);
        const response = await request({ ...held(SESSION), path }, '&format=markdown');
        const reader = response.body?.getReader();
        const first = await reader?.read();
        expect(new TextDecoder().decode(first?.value).startsWith('# ')).toBe(true);
        appendFileSync(path, `${said('written after the heading', 2)}\n`);
        const rest: Uint8Array[] = [];
        for (;;) {
            const next = await reader?.read();
            if (next === undefined || next.done) break;
            rest.push(next.value);
        }
        const text = rest.map((chunk) => new TextDecoder().decode(chunk)).join('');
        expect(text).toContain('in the file');
        expect(text).toContain('written after the heading');
    });

    it.each([
        { name: 'an export', query: '&format=markdown', turn: 'the head turn' },
        { name: 'a read from an offset', query: `&from=${MARKED.length}`, turn: 'the tail turn' },
        { name: 'a read before a byte', query: `&before=${TAIL_LINES}`, turn: 'the head turn' }
    ])('gives the thread back between the pieces of $name', async ({ query, turn }) => {
        const record = several();
        let macrotasks = 0;
        let counting = true;
        const count = (): void => {
            if (!counting) return;
            macrotasks += 1;
            setImmediate(count);
        };
        setImmediate(count);
        const response = await request(record, query);
        const text = await response.text();
        counting = false;
        expect(macrotasks).toBeGreaterThanOrEqual(4);
        expect(text).toContain(turn);
    });
});

describe('the reads of older turns', () => {
    it('joins three chained reads of 500 turns into the whole file, none lost or repeated', async () => {
        const path = fresh();
        writeFileSync(path, numbered(500));
        const first = await endOf(path);
        expect(textsIn(first)).toEqual(texts(300, 500));
        expect(first.head).toBeGreaterThan(0);
        const second = await endOf(path, `&before=${first.head}`);
        expect(textsIn(second)).toEqual(texts(100, 300));
        expect(second.head).toBeGreaterThan(0);
        const third = await endOf(path, `&before=${second.head}`);
        expect(textsIn(third)).toEqual(texts(0, 100));
        expect(third.head).toBe(0);
        const whole = await readTurns(path, 'claude', 0);
        const shape = ({ role, text }: { role: string; text: string }) => ({ role, text });
        expect([...third.turns, ...second.turns, ...first.turns].map(shape)).toEqual(
            whole.turns.map(shape)
        );
    });

    it('keeps the turns of one line in one answer when the seam falls inside that line', async () => {
        const path = fresh();
        const line = spoken('three turns on a line', ['toolu_a', 'toolu_b'], 1);
        const rest = Array.from({ length: 199 }, (_, at) => said(`turn ${at}`, at + 2));
        writeFileSync(path, `${[said('the older turn', 0), line, ...rest].join('\n')}\n`);
        const first = await endOf(path);
        expect(first.turns).toHaveLength(202);
        expect(first.turns.slice(0, 3).map((turn) => turn.role)).toEqual([
            'assistant',
            'tool',
            'tool'
        ]);
        const older = await endOf(path, `&before=${first.head}`);
        expect(textsIn(older)).toEqual(['the older turn']);
        expect(older.head).toBe(0);
    });

    it('answers the outcome of a call among the turns it drops', async () => {
        const path = fresh();
        const rest = Array.from({ length: 250 }, (_, at) => said(`turn ${at}`, at + 1));
        const result = answered('toolu_far', { status: 'completed' }, 300);
        writeFileSync(path, `${[calls(['toolu_far'], 0), ...rest, result].join('\n')}\n`);
        expect((await endOf(path)).results).toEqual({ toolu_far: true });
    });

    it('answers no turn and head 0 at byte 0', async () => {
        const path = fresh();
        writeFileSync(path, numbered(3));
        const answer = await endOf(path, '&before=0');
        expect(answer.turns).toEqual([]);
        expect(answer.head).toBe(0);
    });

    it.each(['abc', '-1'])('refuses the byte %s with 400', async (byte) => {
        const path = fresh();
        writeFileSync(path, numbered(3));
        const response = await request({ ...held(SESSION), path }, `&before=${byte}`);
        expect(response.status).toBe(400);
    });

    it('answers as a first read does for a byte past the size', async () => {
        const path = fresh();
        writeFileSync(path, numbered(250));
        const first = await endOf(path);
        const past = await endOf(path, `&before=${first.offset + 1000}`);
        const end = ({ turns, head, results }: EndAnswer) => ({ turns, head, results });
        expect(end(past)).toEqual(end(first));
    });

    it('answers a turn 40 MiB ahead of the byte when the 32 MiB there hold none', async () => {
        const path = fresh();
        const before = 96 * MIB;
        planted(path, FAR, [
            [0, MARKED],
            [before - 40 * MIB - 1, `\n${said('forty ahead', 1)}\n`],
            [before - 1, `\n${said('at the byte', 2)}\n`],
            [FAR - 1, '\n']
        ]);
        expect(textsIn(await endOf(path, `&before=${before}`))).toEqual(['forty ahead']);
    });

    it.each([
        {
            name: "a subagent's transcript",
            source: subagent,
            lines: [`${said('the agent asks', 1)}\n`, `${said('the agent goes on', 2)}\n`],
            turn: 'the agent asks'
        },
        {
            name: 'a Codex rollout',
            source: codex,
            lines: [rollout('the rollout asks', 1), rollout('the rollout goes on', 2)],
            turn: 'the rollout asks'
        }
    ])('reads $name up to the byte', async ({ source, lines, turn }) => {
        const path = source.path();
        writeFileSync(path, lines.join(''));
        const before = Buffer.byteLength(lines[0]);
        const response = await request(source.record(path), `${source.query}&before=${before}`);
        const answer = (await response.json()) as EndAnswer;
        expect(textsIn(answer)).toEqual([turn]);
        expect(answer.head).toBe(0);
    });

    it('refuses an agent the record does not list', async () => {
        const response = await request(held(SESSION), '&agent=toolu_other&before=10');
        expect(response.status).toBe(404);
    });

    it('answers the first byte of a kept line that spans two pieces', async () => {
        const path = fresh();
        const older = `${said('the older turn', 0)}\n`;
        const long = said('x'.repeat(9 * MIB), 1);
        const rest = Array.from({ length: 199 }, (_, at) => said(`turn ${at}`, at + 2));
        writeFileSync(path, `${older}${[long, ...rest].join('\n')}\n`);
        const first = await endOf(path);
        expect(first.head).toBe(Buffer.byteLength(older));
        expect(textsIn(await endOf(path, `&before=${first.head}`))).toEqual(['the older turn']);
    });

    it('goes on from the line of a first read that doubled its distance', async () => {
        const path = fresh();
        doubled(path);
        const first = await endOf(path);
        expect(first.head).toBe(FAR - 40 * MIB);
        const next = await endOf(path, `&before=${first.head}`);
        expect(textsIn(next)).toEqual(['the marked turn']);
        expect(next.head).toBe(0);
    });

    it('names exactly the fields of each kind of answer', async () => {
        const path = fresh();
        writeFileSync(path, numbered(250));
        const first = await endOf(path);
        const keys = (answer: TurnsAnswer) => Object.keys(answer).sort();
        expect(keys(first)).toEqual(['head', 'offset', 'results', 'turns']);
        expect(keys(await endOf(path, `&from=${first.offset}`))).toEqual([
            'offset',
            'results',
            'turns'
        ]);
        expect(keys(await endOf(path, `&before=${first.head}`))).toEqual([
            'head',
            'results',
            'turns'
        ]);
    });

    it('takes the byte over an offset, and an empty byte as none', async () => {
        const path = fresh();
        writeFileSync(path, numbered(250));
        const first = await endOf(path);
        const both = await endOf(path, `&from=10&before=${first.head}`);
        expect(textsIn(both)).toEqual(texts(0, 50));
        const empty = await endOf(path, '&before=');
        expect(textsIn(empty)).toEqual(texts(50, 250));
        expect(empty.head).toBe(first.head);
        expect(empty.head).toBeGreaterThan(0);
    });
});

describe('the transcript route', () => {
    it.each([
        {
            name: "the session's own transcript",
            agent: null,
            status: 200,
            turn: 'the session asks'
        },
        {
            name: 'a background agent',
            agent: 'toolu_bg',
            status: 200,
            turn: 'the background agent'
        },
        { name: 'a finished agent', agent: 'toolu_done', status: 200, turn: 'the finished agent' },
        { name: 'an agent the record does not list', agent: 'toolu_other', status: 404, turn: '' },
        { name: 'a path given as the agent', agent: '../../x', status: 404, turn: '' },
        {
            name: 'an agent whose result named no agent id',
            agent: 'toolu_noid',
            status: 404,
            turn: ''
        },
        { name: 'an agent whose file is not there', agent: 'toolu_gone', status: 404, turn: '' },
        {
            name: 'a Codex agent, read from its own record',
            id: PARENT,
            agent: '/root/q36_finish',
            status: 200,
            turn: 'the child asks'
        },
        {
            name: 'a Codex agent whose own record the payload lacks',
            id: PARENT,
            agent: '/root/q36_finish',
            absent: [CHILD],
            status: 404,
            turn: ''
        },
        {
            name: 'a Codex agent no item named a thread id for',
            id: PARENT,
            agent: '/root/unnamed',
            status: 404,
            turn: ''
        }
    ])('answers $status for $name, and never a planted file', async (row) => {
        const { agent, status, turn } = row;
        const answer = await asked(row.id ?? SESSION, agent, row.absent ?? []);
        expect(answer.status).toBe(status);
        expect(answer.text).not.toContain('a planted file');
        if (turn !== '') expect(answer.text).toContain(turn);
    });
});
