// What the transcript store holds and when it lets go. Nothing is fetched here: the store's own
// guard leaves the network alone when there is no window, so every case puts turns in through
// hold(), the module's test-only door, and reads them back through turnsFor().

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Turn } from '../../../src/lib/data/model/index.ts';
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
