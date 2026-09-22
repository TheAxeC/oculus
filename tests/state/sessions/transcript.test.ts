// What the transcript store holds and when it lets go. Nothing is fetched here: the store's own
// guard leaves the network alone when there is no window, so every case puts turns in through
// hold(), the module's test-only door, and reads them back through turnsFor().

import { beforeEach, describe, expect, it } from 'vitest';
import type { Turn } from '../../../src/lib/data/model.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

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
