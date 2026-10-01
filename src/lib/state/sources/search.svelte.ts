// Layer 2, client state. The Search view's end of GET /api/search: what one tab is asking for, what
// the last run answered, and whether a run is in flight.
//
// The query, the root, the three toggles and the last answer are the instance's own state, so a
// saved page draws the results it had without running the search again, and two Search tabs side by
// side are two searches. What is not saved is the running flag: a page restored from storage has no
// request in flight, whatever it held when it was written.
//
// The request carries the write token, since DESIGN.md's "Auth" puts a read of every file of every
// served root behind it, and the query is checked here before it is sent through the same rule the
// server checks it with (data/helpers/search.ts), so a refusal is a sentence rather than a round
// trip.

import { z } from 'zod';
import { readAs, readJson } from '../../data/shapes/shapes.ts';
import { answerOf, parseSearchState, queryOf, type SearchState } from './search.ts';
import {
    refusalFrom,
    refusalOf,
    searchCap,
    searchUrl,
    type SearchQuery,
    type SearchRefusal
} from '../../data/helpers/search.ts';
import type { EntitiesStore, InstanceStates, WritesStore } from '../shared/stores/shapes.ts';
import { t } from '../shared/words/text.ts';

/** A refusal's body: the rule it broke, when it names one, and its sentence. */
const refusalBodyShape = z.object({
    refused: z.unknown().optional(),
    error: z.string().optional().catch(undefined)
});

/** What each refusal is said with. The keys are literals, as every catalog read in the tree is. */
function refusalWords(refused: SearchRefusal): string {
    if (refused === 'empty') return t('search.refused_empty');
    if (refused === 'too_long') return t('search.refused_too_long');
    if (refused === 'outside') return t('search.refused_outside');
    if (refused === 'missing') return t('search.refused_missing');
    return t('search.refused_unknown_root');
}

/** One client's searches, one state per Search tab. */
export type SearchStore = {
    /** What this tab holds: its query, its toggles, its last answer. */
    searchState: (id: string) => SearchState;
    /** Change part of what this tab holds, leaving the rest. */
    setSearchState: (id: string, changes: Partial<SearchState>) => void;
    /** Whether a run is in flight for this tab. */
    searchRunning: (id: string) => boolean;
    /** Run this tab's query and keep the answer. */
    runSearch: (id: string, roots: string[]) => Promise<void>;
};

export function createSearch(
    entities: EntitiesStore,
    writes: WritesStore,
    ui: InstanceStates
): SearchStore {
    const state: { running: string[] } = $state({ running: [] });

    /** The cap the configuration carries, which is also what a fresh tab asks for. */
    function cap(): number {
        return searchCap(entities.config()?.config ?? {});
    }

    function searchState(id: string): SearchState {
        return parseSearchState(ui.instanceState(id), cap());
    }

    /**
     * A search is over the folder it was scoped to only while it is over that root, so a change
     * that names a root and no folder leaves the whole root.
     */
    function setSearchState(id: string, changes: Partial<SearchState>): void {
        const scoped = 'root' in changes && !('under' in changes) ? { under: '' } : {};
        ui.setInstanceState(id, { ...searchState(id), ...scoped, ...changes });
    }

    function searchRunning(id: string): boolean {
        return state.running.includes(id);
    }

    /** One run of one tab's query. A second press while one is in flight is left alone. */
    async function runSearch(id: string, roots: string[]): Promise<void> {
        if (searchRunning(id)) return;
        const query: SearchQuery = queryOf(searchState(id));
        const refused = refusalOf(query, roots);
        if (refused !== null) {
            setSearchState(id, { error: refusalWords(refused), answer: null });
            return;
        }
        state.running = [...state.running, id];
        try {
            const answer = await ask(query, writes.writeToken());
            if (answer.ok) {
                setSearchState(id, { answer: answer.answer, error: '' });
                return;
            }
            setSearchState(id, { error: answer.error, answer: null });
        } finally {
            state.running = state.running.filter((one) => one !== id);
        }
    }

    return { searchState, setSearchState, searchRunning, runSearch };
}

/** One request to the endpoint, with the token the page was given. */
async function ask(
    query: SearchQuery,
    token: string
): Promise<
    { ok: true; answer: NonNullable<SearchState['answer']> } | { ok: false; error: string }
> {
    try {
        const response = await fetch(searchUrl(query), {
            headers: { 'x-oculus-token': token }
        });
        const body = await readJson(response);
        if (!response.ok) {
            const held = readAs(refusalBodyShape, body);
            const refused = refusalFrom(held?.refused);
            if (refused !== null) return { ok: false, error: refusalWords(refused) };
            return { ok: false, error: held?.error ?? `HTTP ${response.status}` };
        }
        if (body === undefined) return { ok: false, error: `HTTP ${response.status}` };
        const answer = answerOf(body);
        if (answer === null) return { ok: false, error: t('search.failed') };
        return { ok: true, answer };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}
