// The client object: what one call to createClientState() holds, and that two of them share
// nothing.
//
// It is the whole of what the context provides, so the two things worth checking are that every
// store named in the type is actually built, and that a write through one object is invisible to
// another. What a single store does is its own test file's; this is about the wiring.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, type ClientState } from '../../../src/lib/state/client/context.ts';
import { stubFetch } from '../../fixtures/client.ts';

/** Every key the type names, so a store added to the type and not to the factory fails here. */
const STORES: (keyof ClientState)[] = [
    'graphviz',
    'entities',
    'writes',
    'socket',
    'ui',
    'layout',
    'drag',
    'changes',
    'clock',
    'commands',
    'selection',
    'terminals',
    'agents',
    'files',
    'fs',
    'docs',
    'latex',
    'latexReader',
    'deposit',
    'transcripts',
    'source',
    'formDrafts',
    'manifestDraft',
    'feeds',
    'hpc',
    'processes',
    'calendar',
    'accounts',
    'inbox',
    'audit',
    'memories',
    'lines',
    'present',
    'repositories',
    'search',
    'explorer',
    'usageRefresh',
    'selectors',
    'railBadges',
    'paletteSource',
    'editorStatus',
    'notices',
    'registry',
    'tabScope'
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

describe('the copy of the stores a tab provides', () => {
    /** The stores that read through the query client, in the order STORES lists them. */
    const RECORDED: (keyof ClientState)[] = [
        'changes',
        'commands',
        'agents',
        'files',
        'fs',
        'docs',
        'latex',
        'deposit',
        'transcripts',
        'memories',
        'lines'
    ];

    /** The addresses the stub was asked for, in order. */
    let asked: string[] = [];

    /** Let a scheduled request run and its answer land. */
    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    beforeEach(() => {
        vi.stubGlobal('window', {});
        asked = [];
        stubFetch(
            asked,
            () =>
                new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
        );
    });

    afterEach(() => vi.unstubAllGlobals());

    // Revert: in wrap of the tabScope member of state/client/context.ts, answer the original store
    // for one of the ten, or copy a store the list does not hold.
    it('audit: replaces exactly the eleven stores handed the query client and no other', () => {
        const client = createClientState();
        const copy = client.tabScope.wrap(client, () => false);
        const replaced = STORES.filter((name) => copy[name] !== client[name]);
        expect(replaced).toEqual(RECORDED);
        for (const name of STORES.filter((one) => !RECORDED.includes(one))) {
            expect(copy[name]).toBe(client[name]);
        }
    });

    // Revert: in wrap of the tabScope member of state/client/context.ts, call each function member
    // of a store outside queries.scoped.
    it('asks nothing from a hidden copy for a listing or a transcript, and once each from the original', async () => {
        const client = createClientState();
        const copy = client.tabScope.wrap(client, () => false);
        copy.fs.listing('hub', 'notes');
        copy.transcripts.turnsFor('s1');
        await settle();
        expect(asked).toEqual([]);

        client.fs.listing('hub', 'notes');
        client.transcripts.turnsFor('s1');
        await settle();
        expect(asked.filter((url) => url.startsWith('/api/fs'))).toHaveLength(1);
        expect(asked.filter((url) => url.startsWith('/api/transcript'))).toHaveLength(1);
    });

    // Revert: in wrap of the tabScope member of state/client/context.ts, answer the shown flag as
    // it was when the copy was made rather than calling it at each call.
    it('follows the flag it was given: asks when shown, and only marks once it answers false for good', async () => {
        const client = createClientState();
        let shown = true;
        const copy = client.tabScope.wrap(client, () => shown);
        copy.memories.wall();
        await settle();
        expect(asked).toEqual(['/api/memories']);

        shown = false;
        copy.memories.reload();
        await settle();
        expect(asked).toEqual(['/api/memories']);

        client.memories.wall();
        await settle();
        expect(asked).toEqual(['/api/memories', '/api/memories']);
    });
});
