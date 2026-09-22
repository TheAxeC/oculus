// The workbench's current session, and the pin that lets one view stop following it.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    pinnedSession,
    pinnedTerminal
} from '../../../src/lib/state/workbench/selection.svelte.ts';
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

describe('the pin a view instance keeps', () => {
    it('reads the session a saved state names', () => {
        expect(pinnedSession({ session: 'abc' })).toBe('abc');
    });

    it('reads no pin out of a state that names none, or names it wrongly', () => {
        expect(pinnedSession({})).toBe(null);
        expect(pinnedSession({ session: '' })).toBe(null);
        expect(pinnedSession({ session: 7 })).toBe(null);
        expect(pinnedSession(undefined)).toBe(null);
        expect(pinnedSession(null)).toBe(null);
        expect(pinnedSession(['session'])).toBe(null);
    });

    it('accepts a terminal id as a terminal pin and rejects a session id', () => {
        expect(pinnedTerminal({ session: 'a1b2c3-shell' })).toBe('a1b2c3-shell');
        expect(pinnedTerminal({ session: 'abc' })).toBe(null);
    });
});
