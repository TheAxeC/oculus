// Layer 3, client state tests. The tabs of a running subagent over the real transcripts store and
// query client, each made the way a Terminal tab's transcript body makes it
// (transcript-tab.svelte.ts), while the sessions channel hands a new record of the session. A tab
// of a running subagent asks for the agent's file once per sessions message whether one tab or two
// show it, asks nothing while it is hidden and once when it is shown, and never runs its follow
// effect into Svelte's update limit. The server's answer is a stub of `fetch`, and `window` is
// stubbed so the store reads as in a browser.
//
// A read of older turns is held over the same store: its answer goes in at the top of what is held
// when it lands, whichever read lands first, and an answer for turns the store dropped holds
// nothing. There each request waits on a stub the case answers by hand, so the case decides the
// order the reads land in.

import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

it('asks for a transcript whose last viewer left while the first read waited', async () => {
    vi.stubGlobal('window', {});
    const fetched = vi.fn(() =>
        Promise.resolve(
            new Response(JSON.stringify({ turns: [TURN], offset: 10, results: {} }), {
                status: 200
            })
        )
    );
    vi.stubGlobal('fetch', fetched);
    const store = createTranscripts(createQueries());
    const tab = rooted(() => transcriptTab(store, 'a1', message));
    flushSync();
    store.showing('s1', 'a1')();
    flushSync();
    await settle(() => fetched.mock.calls.length);
    tab.stop();
    expect(fetched).toHaveBeenCalledOnce();
});

describe('the reads of older turns', () => {
    /** A said turn holding `text`. */
    const said = (text: string) => ({ ...TURN, text });

    /** A tool turn of the call `id` with no outcome. */
    const call = (id: string) => ({
        ...TURN,
        role: 'tool',
        text: '',
        tool: { id, name: 'Bash', summary: '', ok: null }
    });

    /** One request the stub of `fetch` holds until a case answers it. */
    type Asked = { query: URLSearchParams; answer: (body: unknown, status?: number) => void };

    /** Stub `fetch` and answer the list of the requests that wait on an answer. */
    function holdRequests(): Asked[] {
        const asked: Asked[] = [];
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => {
            return new Promise<Response>((done) => {
                asked.push({
                    query: new URL(url, 'http://oculus.test').searchParams,
                    answer: (body, status = 200) => {
                        done(new Response(JSON.stringify(body), { status }));
                    }
                });
            });
        });
        return asked;
    }

    /** One tab of the session `s1`, over a store whose first read answered `first`. */
    async function opened(asked: Asked[], first: Record<string, unknown>) {
        const queries = createQueries();
        const store = createTranscripts(queries);
        const record = cell<TabRecord | null>(message());
        const tab = rooted(() => {
            transcriptTab(store, '', () => record.get());
        });
        const count = (): number => asked.length;
        flushSync();
        await settle(count);
        asked[0].answer(first);
        await settle(count);
        const texts = (): string[] => store.turnsFor('s1').turns.map((turn) => turn.text);
        /** The sessions message that says the file grew, which asks for a tail read. */
        const grown = (): void => {
            record.set({ ...message(), lastActivity: 't1' });
            flushSync();
        };
        return { queries, store, stop: tab.stop, count, texts, grown };
    }

    /** The requests that ask for older turns. */
    const older = (asked: Asked[]) => asked.filter((one) => one.query.has('before'));

    it('gives a call the outcome an earlier read saw, its turn arriving in an older read', async () => {
        const asked = holdRequests();
        const { store, stop, count } = await opened(asked, {
            turns: [said('kept')],
            offset: 500,
            head: 100,
            results: { toolu_far: false }
        });
        store.readOlder('s1');
        await settle(count);
        older(asked)[0].answer({ turns: [call('toolu_far')], head: 0, results: {} });
        await settle(count);
        const state = store.turnsFor('s1');
        stop();
        expect(state.turns.map((turn) => turn.tool?.ok ?? null)).toEqual([false, null]);
        expect(state.above).toBe(1);
    });

    it('asks once while a read is out, and nothing at head 0', async () => {
        const asked = holdRequests();
        const { store, stop, count } = await opened(asked, {
            turns: [said('kept')],
            offset: 500,
            head: 100,
            results: {}
        });
        store.readOlder('s1');
        store.readOlder('s1');
        await settle(count);
        expect(older(asked)).toHaveLength(1);
        expect(store.turnsFor('s1').older).toBe(true);
        older(asked)[0].answer({ turns: [said('older')], head: 0, results: {} });
        await settle(count);
        store.readOlder('s1');
        await settle(count);
        stop();
        expect(older(asked)).toHaveLength(1);
        expect(store.turnsFor('s1').older).toBe(false);
    });

    it.each([
        { name: 'the tail read first', order: ['tail', 'older'] },
        { name: 'the older read first', order: ['older', 'tail'] }
    ])('holds the turns of two reads out together, $name landing', async ({ order }) => {
        const asked = holdRequests();
        const { store, stop, count, texts, grown } = await opened(asked, {
            turns: [said('kept')],
            offset: 500,
            head: 100,
            results: {}
        });
        store.readOlder('s1');
        grown();
        await settle(count);
        const reads: Record<string, () => void> = {
            older: () => {
                older(asked)[0].answer({ turns: [said('older')], head: 40, results: {} });
            },
            tail: () => {
                const read = asked.find((one) => one.query.get('from') === '500');
                read?.answer({ turns: [said('appended')], offset: 600, results: {} });
            }
        };
        for (const read of order) {
            reads[read]();
            await settle(count);
        }
        const state = store.turnsFor('s1');
        stop();
        expect(texts()).toEqual(['older', 'kept', 'appended']);
        expect({ offset: state.offset, head: state.head }).toEqual({ offset: 600, head: 40 });
    });

    it('holds nothing of an answer that lands after forget', async () => {
        const asked = holdRequests();
        const { queries, store, stop, count } = await opened(asked, {
            turns: [said('kept')],
            offset: 500,
            head: 100,
            results: {}
        });
        store.readOlder('s1');
        await settle(count);
        store.forget('s1');
        older(asked)[0].answer({ turns: [said('older')], head: 0, results: {} });
        await settle(count);
        const held = queries.peek(['transcript', 's1']).data;
        stop();
        expect(held).toBeUndefined();
    });

    it('keeps the turns of a failed read, says why, and asks again at the next call', async () => {
        const asked = holdRequests();
        const { store, stop, count, texts } = await opened(asked, {
            turns: [said('kept')],
            offset: 500,
            head: 100,
            results: {}
        });
        store.readOlder('s1');
        await settle(count);
        older(asked)[0].answer({ error: 'no such file' }, 500);
        await settle(count);
        const failed = store.turnsFor('s1');
        store.readOlder('s1');
        await settle(count);
        stop();
        expect(texts()).toEqual(['kept']);
        expect(failed.olderError).not.toBe('');
        expect(failed.older).toBe(false);
        expect(older(asked)).toHaveLength(2);
    });

    it('holds every turn once, in order, through reads chained to the head', async () => {
        const asked = holdRequests();
        const { store, stop, count, texts } = await opened(asked, {
            turns: [said('five'), said('six')],
            offset: 600,
            head: 400,
            results: {}
        });
        const chain = [
            { turns: [said('three'), said('four')], head: 200, results: {} },
            { turns: [said('one'), said('two')], head: 0, results: {} }
        ];
        for (const [at, body] of chain.entries()) {
            store.readOlder('s1');
            await settle(count);
            older(asked)[at].answer(body);
            await settle(count);
        }
        const state = store.turnsFor('s1');
        stop();
        expect(texts()).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
        expect({ head: state.head, above: state.above }).toEqual({ head: 0, above: 4 });
    });

    it.each([
        { name: 'another head', head: 150 },
        { name: 'the head it asked with', head: 100 }
    ])('applies no old answer over a new first read of $name', async ({ head }) => {
        const asked = holdRequests();
        const { store, stop, count, texts } = await opened(asked, {
            turns: [said('kept')],
            offset: 500,
            head: 100,
            results: {}
        });
        store.readOlder('s1');
        await settle(count);
        const out = older(asked)[0];
        store.forget('s1');
        store.turnsFor('s1');
        await settle(count);
        const again = asked[asked.length - 1];
        again.answer({ turns: [said('read anew')], offset: 700, head, results: {} });
        await settle(count);
        out.answer({ turns: [said('older')], head: 0, results: {} });
        await settle(count);
        const state = store.turnsFor('s1');
        stop();
        expect(texts()).toEqual(['read anew']);
        expect(state.head).toBe(head);
    });
});
