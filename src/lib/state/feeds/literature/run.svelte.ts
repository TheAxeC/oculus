// Layer 2, client state. One Literature search tab's searches in flight and what they answered.
//
// A search asks every source that is on, one request each, all at once, and each source's answer is
// kept as it arrives, so a slow source never holds a fast one. A new search aborts the requests of
// the one before it, and an answer that lands after its search was replaced draws nothing. `More`
// asks the next page of every source that holds one, with the parameters the search was made with
// and not the form as it has been edited since. A source whose next page fails keeps the hits of
// the pages before it and keeps its `More`, with the state of the page that failed on its chip.
//
// The run holds no saved state: the tab's form is its instance state (form.ts), and a tab drawn
// again runs its held query once more, which the server's cache answers within `cache_min`. The run
// is made by the view that draws it and is dropped with it, so nothing here outlives the tab.

import type {
    LiteratureHit,
    LiteratureRefusal,
    LiteratureSource,
    SourceState
} from '../../../data/model/index.ts';
import { readJson } from '../../../data/shapes/shapes.ts';
import { answerOf, refusalOf, searchUrl } from './answers.ts';
import { formRefusal, searchParams, type LiteratureForm } from './form.ts';

/** What one source's chip reports. */
export type SourceRun = {
    /** Whether a request of this source is out. */
    asking: boolean;
    /** The state of its latest answer, null before the first. */
    state: SourceState | null;
    status?: number;
    /** Seconds to wait, when a rate limited source said. */
    wait?: number;
    /** The count the source reports, null when it reports none. */
    total: number | null;
    more: boolean;
    cursor: string | null;
    cached: boolean;
    /** Every hit of every page that answered. */
    hits: LiteratureHit[];
};

/** The search the tab last made: its form and the sources it was sent to. */
type Asked = { form: LiteratureForm; sources: LiteratureSource[] };

/** One tab's run. */
export type LiteratureRun = {
    /** Each asked source's state, in the order they were asked. */
    sources: () => Record<LiteratureSource, SourceRun>;
    /** The form the answers were asked with, or null before a search. */
    asked: () => LiteratureForm | null;
    /** The word the last search was refused with, before or by the route. */
    refused: () => LiteratureRefusal | null;
    /** Whether the last search was sent to no source, every one being off. */
    noneOn: () => boolean;
    /** Whether any request is out. */
    running: () => boolean;
    /** Every hit that answered, source by source. */
    hits: () => LiteratureHit[];
    /** Whether any source holds a next page. */
    hasMore: () => boolean;
    /** Search the sources that are on; the one in flight is aborted. */
    search: (form: LiteratureForm, sources: LiteratureSource[]) => void;
    /** Ask the next page of every source that has one. */
    more: () => void;
    /** Turn one source off, dropping its hits, or on, asking it with the search made. */
    toggle: (source: LiteratureSource, on: boolean) => void;
    /** Abort everything out, for a tab that closes. */
    stop: () => void;
};

/** What the run needs of the page: the write token, the clock and `fetch`. */
export type RunOptions = {
    token: () => string;
    now?: () => number;
    fetcher?: typeof fetch;
};

export function createRun(options: RunOptions): LiteratureRun {
    const fetcher = options.fetcher ?? fetch;
    const now = options.now ?? Date.now;
    const state: {
        sources: Record<LiteratureSource, SourceRun>;
        refused: LiteratureRefusal | null;
        noneOn: boolean;
        asked: Asked | null;
    } = $state({ sources: {}, refused: null, noneOn: false, asked: null });
    // The searches started so far, so an answer of a replaced search is not drawn.
    let generation = 0;
    const gates = new Map<LiteratureSource, AbortController>();

    function fresh(): SourceRun {
        return {
            asking: true,
            state: null,
            total: null,
            more: false,
            cursor: null,
            cached: false,
            hits: []
        };
    }

    function abortAll(): void {
        for (const gate of gates.values()) gate.abort();
        gates.clear();
    }

    /** One request of one source: its answer is kept when its search is still the latest. */
    async function ask(
        source: LiteratureSource,
        form: LiteratureForm,
        cursor: string | null
    ): Promise<void> {
        const mine = generation;
        const gate = new AbortController();
        gates.get(source)?.abort();
        gates.set(source, gate);
        const params = searchParams(form, source);
        if (cursor !== null) params.set('page', cursor);
        const before = state.sources[source] ?? fresh();
        state.sources[source] = { ...before, asking: true };
        const keep = (change: Partial<SourceRun>): void => {
            if (mine !== generation || gates.get(source) !== gate) return;
            state.sources[source] = {
                ...(state.sources[source] ?? before),
                asking: false,
                ...change
            };
            gates.delete(source);
        };
        try {
            const response = await fetcher(searchUrl(params), {
                headers: { 'x-oculus-token': options.token() },
                signal: gate.signal
            });
            const body = await readJson(response);
            if (!response.ok) {
                const word = refusalOf(body);
                if (word !== null && mine === generation) state.refused = word;
                keep({ state: 'failed', status: response.status });
                return;
            }
            const answer = answerOf(body);
            if (answer === null) {
                keep({ state: 'failed', status: response.status });
                return;
            }
            if (answer.state !== 'ok') {
                keep({ state: answer.state, status: answer.status, wait: answer.wait });
                return;
            }
            keep({
                state: 'ok',
                status: undefined,
                wait: undefined,
                total: answer.total,
                more: answer.more,
                cursor: answer.cursor,
                cached: answer.cached,
                hits: cursor === null ? answer.hits : [...before.hits, ...answer.hits]
            });
        } catch {
            if (gate.signal.aborted) return;
            keep({ state: 'failed' });
        }
    }

    function search(form: LiteratureForm, sources: LiteratureSource[]): void {
        generation += 1;
        abortAll();
        state.refused = formRefusal(form, now());
        state.noneOn = false;
        state.sources = {};
        if (state.refused !== null) {
            state.asked = null;
            return;
        }
        state.asked = { form, sources };
        if (sources.length === 0) {
            state.noneOn = true;
            return;
        }
        for (const source of sources) {
            state.sources[source] = fresh();
        }
        for (const source of sources) void ask(source, form, null);
    }

    function more(): void {
        const asked = state.asked;
        if (asked === null) return;
        for (const [source, held] of Object.entries(state.sources)) {
            if (held.more && !held.asking && held.cursor !== null)
                void ask(source, asked.form, held.cursor);
        }
    }

    function toggle(source: LiteratureSource, on: boolean): void {
        const asked = state.asked;
        if (asked === null) return;
        if (!on) {
            gates.get(source)?.abort();
            gates.delete(source);
            const { [source]: _gone, ...rest } = state.sources;
            state.sources = rest;
            state.asked = { ...asked, sources: asked.sources.filter((one) => one !== source) };
            return;
        }
        if (asked.sources.includes(source)) return;
        state.noneOn = false;
        state.asked = { ...asked, sources: [...asked.sources, source] };
        state.sources[source] = fresh();
        void ask(source, asked.form, null);
    }

    return {
        sources: () => state.sources,
        asked: () => state.asked?.form ?? null,
        refused: () => state.refused,
        noneOn: () => state.noneOn,
        running: () => Object.values(state.sources).some((held) => held.asking),
        hits: () => Object.values(state.sources).flatMap((held) => held.hits),
        hasMore: () => Object.values(state.sources).some((held) => held.more),
        search,
        more,
        toggle,
        stop() {
            generation += 1;
            abortAll();
            for (const held of Object.values(state.sources)) held.asking = false;
        }
    };
}
