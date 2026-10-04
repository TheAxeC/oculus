// Layer 2, client-state tests. The workbench's current session, and the pin that lets one view stop
// following it.

import { beforeEach, describe, expect, it } from 'vitest';
import { pinnedSession } from '../../../src/lib/state/workbench/selection.svelte.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let select: ClientState['selection']['select'];
let selected: ClientState['selection']['selected'];

beforeEach(() => {
    client = createClientState();
    ({ select, selected } = client.selection);
});

describe('the selection', () => {
    it('starts on nothing', () => {
        expect(selected()).toBe(null);
    });

    it('holds what it was given, and replaces it', () => {
        select('one');
        expect(selected()).toBe('one');
        select('two');
        expect(selected()).toBe('two');
    });

    it('reads an empty id as none, so nothing is ever selected under a blank name', () => {
        select('one');
        select('');
        expect(selected()).toBe(null);
        select('one');
        select(null);
        expect(selected()).toBe(null);
    });
});

describe('the pin a view instance keeps over the state it saved', () => {
    const rows: [string, () => unknown, unknown][] = [
        ['an array', () => pinnedSession([]), null],
        ['undefined', () => pinnedSession(undefined), null],
        ['a map with no session', () => pinnedSession({ id: 's' }), null],
        ['a session that is a number', () => pinnedSession({ session: 3 }), null],
        ['an empty session', () => pinnedSession({ session: '' }), null],
        ['a session that is a string', () => pinnedSession({ session: 's' }), 's'],
        [
            'a map with an own __proto__ key',
            () => pinnedSession(JSON.parse('{"__proto__":{"session":"p"},"b":1}')),
            null
        ]
    ];

    it.each(rows)('%s', (_name, run, expected) => {
        expect(run()).toStrictEqual(expected);
    });
});
