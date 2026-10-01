// What the transcript store holds and when it lets go. Nothing is fetched here: the store's own
// guard leaves the network alone when there is no window, so every case puts turns in through
// hold(), the module's test-only door, and reads them back through turnsFor().

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Turn } from '../../../src/lib/data/model/index.ts';
import type { TurnsState } from '../../../src/lib/state/sessions/transcript.svelte.ts';
import { createClientState, stubHeld, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let forget: ClientState['transcripts']['forget'];
let hold: ClientState['transcripts']['hold'];
let showing: ClientState['transcripts']['showing'];
let turnsFor: ClientState['transcripts']['turnsFor'];

beforeEach(() => {
    client = createClientState();
    ({ forget, hold, showing, turnsFor } = client.transcripts);
});

/** One user turn, which is all these cases need to tell "held" from "dropped" apart. */
function turn(text: string): Turn {
    return { at: null, role: 'user', text, html: text, cut: false, tool: null };
}

describe('what the store lets go of', () => {
    it('drops a session when the last instance showing it closes', () => {
        hold('one', [turn('a question')], 120);
        const first = showing('one');
        const second = showing('one');

        first();
        expect(turnsFor('one').turns.map((held) => held.text)).toEqual(['a question']);
        expect(turnsFor('one').offset).toBe(120);

        second();
        const after = turnsFor('one');
        expect(after.turns).toEqual([]);
        expect(after.offset).toBe(0);
        expect(after.pending).toBe(true);
    });

    it('counts one release per instance however often the release is called', () => {
        hold('two', [turn('another question')], 40);
        const first = showing('two');
        const second = showing('two');

        first();
        first();
        expect(turnsFor('two').turns.length).toBe(1);

        second();
        expect(turnsFor('two').turns).toEqual([]);
    });

    it('asks nothing and holds nothing for the empty id', () => {
        const release = showing('');
        release();
        expect(turnsFor('').pending).toBe(false);
        expect(turnsFor('').turns).toEqual([]);
    });

    it('forgets the instance count with the turns, so a later open starts at one', () => {
        hold('three', [turn('a third question')], 10);
        showing('three');
        forget('three');

        hold('three', [turn('the same session, opened again')], 10);
        const release = showing('three');
        release();
        expect(turnsFor('three').turns).toEqual([]);
    });
});

describe('the tail of a session', () => {
    /** The addresses the stub was asked for, in order. */
    let asked: string[] = [];

    /** What the stub answers next, one answer per call. */
    let answers: { turns: Turn[]; offset: number; results?: Record<string, boolean> }[] = [];

    /** A tool turn whose result has not arrived. */
    function tool(id: string): Turn {
        return {
            at: null,
            role: 'tool',
            text: '',
            html: '',
            cut: false,
            tool: { id, name: 'Bash', summary: 'ls', ok: null }
        };
    }

    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    beforeEach(() => {
        asked = [];
        answers = [];
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            const next = answers.shift() ?? { turns: [], offset: 0 };
            return Promise.resolve(Response.json(next));
        });
        client = createClientState();
        ({ forget, hold, showing, turnsFor } = client.transcripts);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // Revert: in tail of state/sessions/transcript.svelte.ts, ask from 0 instead of the held
    // offset.
    it('asks from the offset when the stamp moved, and appends what it reads', async () => {
        answers = [
            { turns: [turn('first')], offset: 10 },
            { turns: [turn('second')], offset: 25 }
        ];
        turnsFor('one');
        client.transcripts.follow('one', 'a');
        await settle();
        client.transcripts.follow('one', 'b');
        await settle();

        expect(asked).toEqual(['/api/transcript?id=one&from=0', '/api/transcript?id=one&from=10']);
        expect(turnsFor('one').turns.map((held) => held.text)).toEqual(['first', 'second']);
        expect(turnsFor('one').offset).toBe(25);
        client.transcripts.follow('one', 'b');
        await settle();
        expect(asked).toHaveLength(2);
    });

    // Revert: in merged of state/sessions/transcript.svelte.ts, ignore the results of the answer.
    it('shows the result a tail brings for a call it adds no turn to', async () => {
        answers = [
            { turns: [tool('call-1')], offset: 10 },
            { turns: [], offset: 10, results: { 'call-1': true } }
        ];
        turnsFor('one');
        client.transcripts.follow('one', 'a');
        await settle();
        expect(turnsFor('one').turns[0].tool?.ok).toBeNull();
        client.transcripts.follow('one', 'b');
        await settle();

        expect(turnsFor('one').turns[0].tool?.ok).toBe(true);
    });

    // Revert: in follow of state/sessions/transcript.svelte.ts, refetch with 'drop' instead of
    // 'again'.
    it('asks once more when the stamp moves again while its tail is out', async () => {
        answers = [
            { turns: [turn('first')], offset: 10 },
            { turns: [turn('second')], offset: 25 },
            { turns: [turn('third')], offset: 40 }
        ];
        turnsFor('one');
        client.transcripts.follow('one', 'a');
        await settle();
        client.transcripts.follow('one', 'b');
        client.transcripts.follow('one', 'c');
        await settle();
        await settle();

        expect(asked).toEqual([
            '/api/transcript?id=one&from=0',
            '/api/transcript?id=one&from=10',
            '/api/transcript?id=one&from=25'
        ]);
        expect(turnsFor('one').turns.map((held) => held.text)).toEqual([
            'first',
            'second',
            'third'
        ]);
    });

    // Revert: in merged of state/sessions/transcript.svelte.ts, set tool.ok on the held turn
    // instead of copying it.
    it('leaves the turns already handed out as they were when a tail brings a result', async () => {
        answers = [
            { turns: [tool('call-1')], offset: 10 },
            { turns: [], offset: 10, results: { 'call-1': true } }
        ];
        turnsFor('one');
        client.transcripts.follow('one', 'a');
        await settle();
        const before = turnsFor('one').turns[0];
        client.transcripts.follow('one', 'b');
        await settle();

        expect(before.tool?.ok).toBeNull();
        expect(turnsFor('one').turns[0]).not.toBe(before);
    });

    // Revert: in forget of state/client/queries.svelte.ts, take out the loop that drops the
    // scheduled reads of the key.
    it('asks nothing for a session let go of in the tick it was first read', async () => {
        turnsFor('one');
        forget('one');
        await settle();
        expect(asked).toEqual([]);
    });

    // Revert: in forget of state/sessions/transcript.svelte.ts, take out the queries.forget call.
    it('drops the turns when the last viewer lets go, and drops a late answer for them', async () => {
        const { land } = stubHeld(asked);
        const release = showing('one');
        turnsFor('one');
        await settle();
        expect(asked).toEqual(['/api/transcript?id=one&from=0']);

        release();
        land(Response.json({ turns: [turn('late')], offset: 30 }));
        await settle();

        expect(turnsFor('one').pending).toBe(true);
        expect(turnsFor('one').turns).toEqual([]);
    });
});

describe('an answer whose fields are of the wrong type', () => {
    const user: Turn = { at: null, role: 'user', text: 'a', html: 'a', cut: false, tool: null };
    const call: Turn = {
        ...user,
        role: 'tool',
        tool: { id: 't', name: 'Bash', summary: 'ls', ok: null }
    };
    const NOTHING: TurnsState = { turns: [], offset: 0, pending: false, error: '' };

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    /** The turns a fresh store holds for a session once the endpoint answered `text`. */
    async function answeredWith(text: string, status = 200): Promise<TurnsState> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
        const fresh = createClientState();
        fresh.transcripts.turnsFor('one');
        await new Promise((wake) => setTimeout(wake, 0));
        return fresh.transcripts.turnsFor('one');
    }

    it.each([
        ['an offset that is null', { turns: [user], offset: null }, { ...NOTHING, turns: [user] }],
        [
            'results that are a list',
            { turns: [user], offset: 2, results: [] },
            { ...NOTHING, turns: [user], offset: 2 }
        ],
        [
            'results that are a string',
            { turns: [user], offset: 2, results: 'x' },
            { ...NOTHING, turns: [user], offset: 2 }
        ],
        ['turns that are null', { turns: null, offset: 3 }, { ...NOTHING, offset: 3 }],
        ['a list as the body', [], NOTHING],
        ['an empty map as the body', {}, NOTHING]
    ])('answers %s as the turns it names', async (_name, body, expected) => {
        expect(await answeredWith(JSON.stringify(body))).toStrictEqual(expected);
    });

    it('keeps an offset that is infinite, since a number is a number', async () => {
        expect(await answeredWith('{"turns":[],"offset":1e999}')).toStrictEqual({
            ...NOTHING,
            offset: Infinity
        });
    });

    it('answers a refusal as its sentence, and as its status when it names none', async () => {
        expect(await answeredWith('{"error":"x"}', 500)).toStrictEqual({ ...NOTHING, error: 'x' });
        expect(await answeredWith('[]', 500)).toStrictEqual({ ...NOTHING, error: '500' });
    });

    it.each([
        ['turns that are a string', { turns: 'x', offset: 3 }, { ...NOTHING, offset: 3 }],
        ['turns that are a map', { turns: {}, offset: 3 }, { ...NOTHING, offset: 3 }],
        [
            'turns holding a null, a number and a turn',
            { turns: [null, 3, user], offset: 2 },
            { ...NOTHING, turns: [user], offset: 2 }
        ],
        [
            'an offset that is a string',
            { turns: [user], offset: '4' },
            { ...NOTHING, turns: [user] }
        ],
        [
            'turns holding maps without a role, with a text that is a number and with a tool that is a number',
            {
                turns: [{ ...user, role: 'x' }, { ...user, text: 3 }, { ...user, tool: 3 }, user],
                offset: 2
            },
            { ...NOTHING, turns: [user], offset: 2 }
        ],
        [
            'a result that is no boolean',
            { turns: [call], offset: 2, results: { t: 'yes' } },
            { ...NOTHING, turns: [call], offset: 2 }
        ]
    ])(
        'answers %s as the turns that are well-formed, and the offset as a number',
        async (_name, body, expected) => {
            expect(await answeredWith(JSON.stringify(body))).toStrictEqual(expected);
        }
    );

    it('answers a refusal whose error is a number as its status', async () => {
        expect(await answeredWith('{"error":3}', 500)).toStrictEqual({ ...NOTHING, error: '500' });
    });

    it('answers a body that is null or not JSON as the failed read with its status', async () => {
        for (const text of ['null', 'nope']) {
            expect(await answeredWith(text)).toStrictEqual({ ...NOTHING, error: '200' });
            expect(await answeredWith(text, 500)).toStrictEqual({ ...NOTHING, error: '500' });
        }
    });

    it('keeps the turns it holds when a later read answers null or text that is not JSON', async () => {
        vi.stubGlobal('window', {});
        const bodies = [JSON.stringify({ turns: [user], offset: 2 }), 'null', 'nope'];
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(bodies.shift())));
        const fresh = createClientState();
        fresh.transcripts.turnsFor('one');
        await new Promise((wake) => setTimeout(wake, 0));
        fresh.transcripts.follow('one', '0');
        for (const stamp of ['1', '2']) {
            fresh.transcripts.follow('one', stamp);
            await new Promise((wake) => setTimeout(wake, 0));
            expect(fresh.transcripts.turnsFor('one')).toStrictEqual({
                turns: [user],
                offset: 2,
                pending: false,
                error: '200'
            });
        }
    });
});
