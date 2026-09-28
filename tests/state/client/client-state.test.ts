// The client object: what one call to createClientState() holds, and that two of them share
// nothing.
//
// It is the whole of what the context provides, so the two things worth checking are that every
// store named in the type is actually built, and that a write through one object is invisible to
// another. What a single store does is its own test file's; this is about the wiring.

import { describe, expect, it } from 'vitest';
import { createClientState, type ClientState } from '../../../src/lib/state/client/context.ts';

/** Every key the type names, so a store added to the type and not to the factory fails here. */
const STORES: (keyof ClientState)[] = [
    'entities',
    'writes',
    'socket',
    'ui',
    'layout',
    'drag',
    'changes',
    'clock',
    'selection',
    'terminals',
    'agents',
    'files',
    'fs',
    'docs',
    'latex',
    'deposit',
    'transcripts',
    'source',
    'formDrafts',
    'manifestDraft',
    'feeds',
    'hpc',
    'calendar',
    'accounts',
    'inbox',
    'audit',
    'memories',
    'present',
    'repositories',
    'search',
    'usageRefresh',
    'selectors',
    'railBadges',
    'paletteSource',
    'editorStatus',
    'notices',
    'registry'
];

describe('the client object', () => {
    it('holds one instance of every store it names', () => {
        const client = createClientState();
        const missing = STORES.filter((name) => typeof client[name] !== 'object');
        expect(missing).toEqual([]);
        expect(Object.keys(client).sort()).toEqual([...STORES].sort());
    });

    it('gives two clients separate stores', () => {
        const one = createClientState();
        const two = createClientState();
        for (const name of STORES) expect(one[name]).not.toBe(two[name]);
    });

    it('keeps a message received by one client out of the other', () => {
        const one = createClientState();
        const two = createClientState();
        one.entities.receive({ channel: 'files', version: 4, payload: { root: '/hub' } });

        expect(one.entities.message('files')?.version).toBe(4);
        expect(two.entities.message('files')).toBeNull();
    });

    it('keeps a saved instance state, a selection and a page out of the other client', () => {
        const one = createClientState();
        const two = createClientState();
        one.ui.setInstanceState('tab', { search: 'held' });
        one.selection.select('session-one');
        one.layout.openPage('Runs');

        expect(one.ui.instanceState('tab')).toEqual({ search: 'held' });
        expect(two.ui.instanceState('tab')).toBeUndefined();
        expect(one.selection.selected()).toBe('session-one');
        expect(two.selection.selected()).toBeNull();
        expect(one.layout.pages()).toHaveLength(2);
        expect(two.layout.pages()).toHaveLength(1);
    });

    it('wires a store that reads another to the same client', () => {
        const client = createClientState();
        client.entities.receive({
            channel: 'hpc',
            version: 1,
            payload: { status: 'ok', total: 3, running: 2, pending: 1 }
        });

        expect(client.hpc.counts()).toEqual({ running: 2, pending: 1 });
        expect(createClientState().hpc.counts()).toEqual({ running: 0, pending: 0 });
    });
});
