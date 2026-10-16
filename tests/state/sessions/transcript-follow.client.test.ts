// Layer 3, client state tests. The tabs of a running subagent over the real transcripts store and
// query client, each made the way the Transcript view makes it (transcript-tab.svelte.ts), while
// the sessions channel hands a new record of the session. A tab of a running subagent asks for the
// agent's file once per sessions message whether one tab or two show it, asks nothing while it is
// hidden and once when it is shown, and never runs its follow effect into Svelte's update limit.
// The server's answer is a stub of `fetch`, and `window` is stubbed so the store reads as in a
// browser.

import { flushSync } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import {
    createQueries,
    scopedStore
} from '../../../src/lib/state/client/queries/queries.svelte.ts';
import {
    createTranscripts,
    type TranscriptsStore
} from '../../../src/lib/state/sessions/transcript.svelte.ts';
import { cell, rooted } from '../../ui/frame/rooted.svelte.ts';
import { transcriptTab, type TabRecord } from './transcript-tab.svelte.ts';

afterEach(() => vi.unstubAllGlobals());

const TURN = {
    at: '2026-10-15T10:00:00Z',
    role: 'user',
    text: 'hi',
    html: '',
    cut: false,
    tool: null
};

/** Past this many requests the stub never answers, so a chain of requests that never ends stops. */
const CAP = 50;

/** A record of the session as one sessions message hands it: a new object each time. */
function message(): TabRecord {
    return {
        id: 's1',
        lastActivity: 't0',
        agents: [{ id: 'a1', status: 'running', ended: null }]
    };
}

/** How each tab of a row stands at the write: shown, hidden, or hidden and shown after it. */
type Stand = 'shown' | 'hidden' | 'shown after';

type Row = { name: string; tabs: Stand[]; late: boolean; before: number; after: number };

// `before` is the requests made before the measured message, `after` those it makes. A tab opened
// late is opened after one more message, so its tab and the first have seen different counts of
// messages.
const ROWS: Row[] = [
    { name: 'one tab, hidden', tabs: ['hidden'], late: false, before: 1, after: 0 },
    { name: 'one tab, shown', tabs: ['shown'], late: false, before: 1, after: 1 },
    {
        name: 'one tab, hidden, then shown',
        tabs: ['shown after'],
        late: false,
        before: 1,
        after: 1
    },
    { name: 'two tabs, both shown', tabs: ['shown', 'shown'], late: false, before: 1, after: 1 },
    { name: 'two tabs, one hidden', tabs: ['hidden', 'shown'], late: false, before: 1, after: 1 },
    {
        name: 'a tab opened late, both shown',
        tabs: ['shown', 'shown'],
        late: true,
        before: 2,
        after: 1
    },
    {
        name: 'a tab opened late, both hidden',
        tabs: ['hidden', 'hidden'],
        late: true,
        before: 2,
        after: 0
    }
];

/** Yield to the event loop until the request count stands still for ten turns. */
async function settle(count: () => number): Promise<void> {
    let still = 0;
    let last = count();
    while (still < 10) {
        await new Promise((done) => setTimeout(done, 0));
        flushSync();
        still = count() === last ? still + 1 : 0;
        last = count();
    }
}

it.each(ROWS)('a running agent tab: $name', async ({ tabs, late, before, after }) => {
    vi.stubGlobal('window', {});
    let offset = 10;
    const fetched = vi.fn(async (): Promise<Response> => {
        if (fetched.mock.calls.length > CAP) return new Promise<Response>(() => undefined);
        offset += 10;
        return new Response(JSON.stringify({ turns: [TURN], offset, results: {} }), {
            status: 200
        });
    });
    vi.stubGlobal('fetch', fetched);
    const loops: string[] = [];
    const logged = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        const text = args
            .map((one) => (one instanceof Error ? one.message : String(one)))
            .join(' ');
        if (text.includes('effect_update_depth_exceeded')) loops.push(text.split('\n')[0]);
    });
    const queries = createQueries();
    const store = createTranscripts(queries);
    const record = cell<TabRecord | null>(message());
    const open = (stand: Stand) => {
        const shown = cell(true);
        const scoped = scopedStore(queries, store, () => shown.get()) as TranscriptsStore;
        const tab = rooted(() => transcriptTab(scoped, 'a1', () => record.get()));
        return { stop: tab.stop, shown, stand };
    };
    const write = (): void => {
        try {
            record.set(message());
            flushSync();
        } catch (error) {
            loops.push(error instanceof Error ? error.message.split('\n')[0] : String(error));
        }
    };
    const count = (): number => fetched.mock.calls.length;
    const opened = tabs.slice(0, late ? 1 : tabs.length).map(open);
    flushSync();
    await settle(count);
    if (late) {
        write();
        await settle(count);
        opened.push(open(tabs[1]));
        flushSync();
        await settle(count);
    }
    const made = count();
    for (const tab of opened) tab.shown.set(tab.stand === 'shown');
    flushSync();
    write();
    for (const tab of opened) if (tab.stand === 'shown after') tab.shown.set(true);
    flushSync();
    await settle(count);
    logged.mockRestore();
    for (const tab of opened) tab.stop();
    expect(loops).toEqual([]);
    expect({ before: made, after: count() - made }).toEqual({ before, after });
});
