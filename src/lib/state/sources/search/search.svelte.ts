// Layer 2, client state. The Search view's end of GET /api/search and of the replace: what one tab
// is asking for, what the last run answered, whether a run or a replace is in flight, and what the
// last replace said.
//
// The query, the root, the toggles, the replace row and the last answer are the instance's own
// state, so a saved page draws the results it had without running the search again, and two Search
// tabs side by side are two searches. What is not saved is what is in flight: a page restored from
// storage has no request out, whatever it held when it was written.
//
// The request carries the write token, since DESIGN.md's "Auth" puts a read of every file of every
// served root behind it, and the query is checked here before it is sent through the same rule the
// server checks it with (data/helpers/search/query.ts), so a refusal is a sentence rather than a
// round trip. The server answers a refusal as a word and every sentence is worded here.
//
// `names` is the same endpoint asked for the names of every file under the served roots
// (`list=names`), which the palette's file mode matches on the page. It answers the names or the
// sentence for the refusal or failure, and is not tied to a tab: the palette that asked ends it.
// `fileMatcher` hands an answer to a web worker that matches the palette's queries against it
// (file-matcher.svelte.ts), and the palette that made it ends it.
//
// A replace is posted as POST /api/ops `replace` over the hits of the answer, named by the query
// the answer was found by. One replace is out at a time. A file a source tab holds unsaved text of
// is left out of it. The answer carries the hits of every file the replace wrote as they are after
// the write, and they take the place of that file's hits in the tab's answer (hits.ts,
// `applyRereads`), so the hits left in a written file are named by the lines and places they have
// now. An answer of a tab that closed, or of an answer the tab has since replaced by a new run,
// writes nothing into the tab.

import { z } from 'zod';
import { readAs, readJson } from '../../../data/shapes/shapes.ts';
import {
    answerOf,
    namesOf,
    parseSearchState,
    queryOf,
    ranOf,
    remembered,
    rereadsOf,
    type NamesAnswer,
    type SearchFile,
    type SearchMode,
    type SearchState
} from './search.ts';
import {
    refusalFrom,
    namesUrl,
    refusalOf,
    searchCap,
    searchUrl,
    type SearchQuery,
    type SearchRefusal
} from '../../../data/helpers/search/query.ts';
import type { EntitiesStore, InstanceStates, WritesStore } from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { refusedAnswer, unreadableAnswer } from '../../shared/answers/answers.ts';
import type { ExplorerStore } from '../explorer/ops.svelte.ts';
import { nameOf } from '../explorer/file-type.ts';
import type { DiffSubject } from '../repositories/diff/subject.ts';
import { previewSubject } from '../repositories/replace-preview.ts';
import {
    applyRereads,
    dismissedOf,
    focusAfter,
    pickedFiles,
    replaceRequest,
    replaceScope,
    rowAfter,
    rowFor,
    totals,
    without,
    type Chosen,
    type ReplaceScope
} from './hits.ts';
import { replaceDone, replaceQuestion, replaceStopped } from './words.ts';
import { createFileMatcher, type FileMatcher } from './file-matcher.svelte.ts';

/** A refusal's body: the word it answers, and the reason a pattern was refused. */
const refusalBodyShape = z.object({
    error: z.string().optional().catch(undefined),
    reason: z.string().optional().catch(undefined)
});

/** What each refusal is said with. The keys are literals, as every catalog read in the tree is. */
function refusalWords(refused: SearchRefusal, reason: string): string {
    if (refused === 'empty') return t('search.refused_empty');
    if (refused === 'too_long') return t('search.refused_too_long');
    if (refused === 'outside') return t('search.refused_outside');
    if (refused === 'missing') return t('search.refused_missing');
    if (refused === 'token') return t('search.refused_token');
    if (refused === 'timed_out') return t('search.refused_timed_out');
    if (refused === 'pattern') return t('search.refused_pattern', reason);
    return t('search.refused_unknown_root');
}

/** What the last replace of a tab said, and whether it was a refusal. */
type ReplaceSaid = { text: string; refused: boolean };

/** What a replace came to for the view: the row to focus once it landed, and what it said. */
type ReplaceResult = { focus: string };

/**
 * What the store needs of the diff panes: to open one beside the Search tab that asks for it, and
 * whether a Replace Preview is open, which is when a replace goes on to the next hit's preview.
 */
type Previews = {
    open: (subject: DiffSubject, label: string, asker: string) => void;
    shown: () => boolean;
};

/** The hits of a tag's search that the tag index holds, from the files a run answered. */
type Tagged = (tag: string, files: SearchFile[]) => SearchFile[];

/** A box of the Search view that a key asks the focus for. */
type FocusTarget = 'query' | 'replace';

/** The box a tab was asked to focus, with a number that changes at every ask. */
type FocusRequest = { target: FocusTarget; seq: number };

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
    /**
     * Turn a toggle of the query over. While results are shown, or while a run is in flight, the
     * search runs again, so the preview and Replace read the answer under the toggles on screen.
     */
    toggleMode: (id: string, mode: SearchMode, roots: string[]) => Promise<void>;
    /**
     * Change what the tab searches, its root or the folder it is scoped to. As a toggle does, the
     * search runs again while results are shown or a run is in flight, so no hit of the last search
     * stands under the new scope.
     */
    rescope: (
        id: string,
        changes: Partial<Pick<SearchState, 'root' | 'under'>>,
        roots: string[]
    ) => Promise<void>;
    /** Whether a replace is in flight for this tab. */
    replaceRunning: (id: string) => boolean;
    /** What the tab's last replace said, or null. */
    replaceSaid: (id: string) => ReplaceSaid | null;
    /**
     * Replace the hits a pick names, leaving out a file with unsaved text in a source tab. The
     * answer is the row to focus once the hits are out of the answer, the empty string for none.
     */
    replaceHits: (id: string, pick: Chosen) => Promise<ReplaceResult>;
    /** Take the hits a pick names out of the tab's answer without writing; the row to focus. */
    dismissHits: (id: string, pick: Chosen) => string;
    /**
     * The question asked before Replace All over a pick, or null when the pick has nothing to
     * send, which a replace then says on its own.
     */
    replaceQuestion: (id: string, pick: Chosen) => string | null;
    /**
     * Open the Replace Preview of the file a hit is in, at the hit's line, while the replace row
     * is shown. False when it is not shown, which is when the hit opens the file itself.
     */
    previewHit: (id: string, row: string) => boolean;
    /** Ask the tab to focus one of its boxes; the replace box asks the replace row open. */
    wantFocus: (id: string, target: FocusTarget) => void;
    /** The last ask to focus a box, or null for none. */
    focusWanted: (id: string) => FocusRequest | null;
    /** The ask was carried out, so a view drawn again later does not carry it out a second time. */
    focusTaken: (id: string) => void;
    /** Forget a tab's in-flight work and what it said, for a tab that closed. */
    forgetSearch: (id: string) => void;
    /**
     * The names of every file under the served roots, for the palette's file mode: the answer, or
     * the sentence that says why there is none. Aborting the signal ends the request.
     */
    names: (signal: AbortSignal) => Promise<NamesRead>;
    /** A matcher in a web worker for a names answer; ending it stops the worker. */
    fileMatcher: (answer: NamesAnswer) => FileMatcher;
};

export function createSearch(
    entities: EntitiesStore,
    writes: WritesStore,
    ui: InstanceStates,
    explorer: Pick<ExplorerStore, 'replace' | 'unsaved'>,
    previews: Previews,
    tagged: Tagged
): SearchStore {
    const state: {
        running: string[];
        replacing: string[];
        said: Record<string, ReplaceSaid>;
        wanted: Record<string, FocusRequest | undefined>;
    } = $state({ running: [], replacing: [], said: {}, wanted: {} });
    // Counts the runs a tab has started, so a replace that lands after a new run finds the answer
    // is not the one it was made over, and the answer of a run a later one replaced writes nothing.
    const runs = new Map<string, number>();
    // The request of each tab's run in flight, aborted when a toggle starts a run in its place.
    const inFlight = new Map<string, AbortController>();

    /** The cap the configuration carries, which is also what a fresh tab asks for. */
    function cap(): number {
        return searchCap(entities.config()?.config ?? {});
    }

    function searchState(id: string): SearchState {
        return parseSearchState(ui.instanceState(id), cap());
    }

    /** Whether the tab is still open: a closed tab has no instance state left. */
    function open(id: string): boolean {
        return ui.instanceState(id) !== undefined;
    }

    /**
     * A search is over the folder it was scoped to only while it is over that root, so a change
     * that names a root and no folder leaves the whole root. What a replace said stays until the
     * results next change: the query edited or run again, a Replace or a Dismiss. A change to the
     * query, a toggle, the root or the scope that names no tag drops the tag the tab was opened
     * for.
     */
    function setSearchState(id: string, changes: Partial<SearchState>): void {
        const scoped = 'root' in changes && !('under' in changes) ? { under: '' } : {};
        const held = searchState(id);
        const edited = (['q', 'word', 'case', 'regex'] as const).some(
            (key) => key in changes && changes[key] !== held[key]
        );
        if (edited) unsay(id);
        const moved = (['q', 'word', 'case', 'regex', 'root', 'under'] as const).some(
            (key) => key in changes && changes[key] !== held[key]
        );
        const untagged = moved && !('tag' in changes) ? { tag: '' } : {};
        ui.setInstanceState(id, { ...held, ...scoped, ...untagged, ...changes });
    }

    /** Make a change that alters the answer, and run again when an answer is shown or due. */
    async function changeAndRun(
        id: string,
        changes: Partial<SearchState>,
        roots: string[]
    ): Promise<void> {
        const held = searchState(id);
        setSearchState(id, changes);
        if (held.answer !== null || searchRunning(id)) await runSearch(id, roots, true);
    }

    async function toggleMode(id: string, mode: SearchMode, roots: string[]): Promise<void> {
        await changeAndRun(id, { [mode]: !searchState(id)[mode] }, roots);
    }

    function searchRunning(id: string): boolean {
        return state.running.includes(id);
    }

    function replaceRunning(id: string): boolean {
        return state.replacing.includes(id);
    }

    function replaceSaid(id: string): ReplaceSaid | null {
        return state.said[id] ?? null;
    }

    function say(id: string, text: string, refused: boolean): void {
        state.said = { ...state.said, [id]: { text, refused } };
    }

    function unsay(id: string): void {
        const { [id]: _gone, ...rest } = state.said;
        state.said = rest;
    }

    function forgetSearch(id: string): void {
        state.running = state.running.filter((one) => one !== id);
        state.replacing = state.replacing.filter((one) => one !== id);
        unsay(id);
        runs.delete(id);
        inFlight.get(id)?.abort();
        inFlight.delete(id);
        focusTaken(id);
    }

    /**
     * One run of one tab's query. A second press while one is in flight is left alone; with
     * `replacing`, the run in flight is aborted and this one takes its place, so no answer lands
     * under toggles the tab no longer shows.
     */
    async function runSearch(id: string, roots: string[], replacing = false): Promise<void> {
        if (searchRunning(id)) {
            if (!replacing) return;
            inFlight.get(id)?.abort();
            runs.set(id, (runs.get(id) ?? 0) + 1);
            state.running = state.running.filter((one) => one !== id);
        }
        const held = searchState(id);
        const query: SearchQuery = queryOf(held);
        const refused = refusalOf(query, roots);
        if (refused !== null) {
            setSearchState(id, {
                error: refusalWords(refused, ''),
                answer: null,
                ran: null,
                dismissed: []
            });
            return;
        }
        runs.set(id, (runs.get(id) ?? 0) + 1);
        const run = runs.get(id);
        const gate = new AbortController();
        inFlight.set(id, gate);
        unsay(id);
        state.running = [...state.running, id];
        try {
            const answer = await request(
                searchUrl(query),
                writes.writeToken(),
                gate.signal,
                answerOf
            );
            if (!open(id) || runs.get(id) !== run) return;
            const remember = {
                queries: remembered(held.queries, query.q),
                replaces: held.replacing ? remembered(held.replaces, held.replace) : held.replaces
            };
            if (answer.ok) {
                const found = answer.answer.files;
                const kept = held.tag === '' ? found : tagged(held.tag, found);
                setSearchState(id, {
                    answer:
                        held.tag === ''
                            ? answer.answer
                            : { ...answer.answer, files: kept, total: totals(kept).hits },
                    error: '',
                    ran: ranOf(query),
                    dismissed: held.tag === '' ? [] : dismissedOf(without(found, kept)),
                    ...remember
                });
                return;
            }
            setSearchState(id, {
                error: answer.error,
                answer: null,
                ran: null,
                dismissed: [],
                ...remember
            });
        } finally {
            if (runs.get(id) === run) {
                state.running = state.running.filter((one) => one !== id);
                inFlight.delete(id);
            }
        }
    }

    /** A pick split into the files a replace sends and those a source tab holds unsaved text of. */
    function scopeOf(files: SearchFile[], pick: Chosen): ReplaceScope {
        return replaceScope(files, pick, (file) =>
            explorer.unsaved({ root: file.root, path: file.path }, false)
        );
    }

    function replaceAsk(id: string, pick: Chosen): string | null {
        const held = searchState(id);
        if (held.answer === null) return null;
        const { sendable } = scopeOf(held.answer.files, pick);
        if (sendable.length === 0) return null;
        const count = totals(sendable);
        return replaceQuestion(
            { hits: count.hits, files: count.files, text: held.replace },
            held.answer.truncated ? held.max : null
        );
    }

    function previewHit(id: string, row: string): boolean {
        const held = searchState(id);
        if (!held.replacing || held.answer === null || held.ran === null) return false;
        const found = rowFor(held.answer.files, row);
        if (!found?.hit) return false;
        const name = nameOf(found.file.path);
        previews.open(
            previewSubject(
                found.file,
                { query: held.ran, replace: held.replace, preserve: held.preserve },
                found.hit.line
            ),
            t('search.preview_title', name, name),
            id
        );
        return true;
    }

    function wantFocus(id: string, target: FocusTarget): void {
        if (target === 'replace' && !searchState(id).replacing) {
            setSearchState(id, { replacing: true });
        }
        state.wanted = {
            ...state.wanted,
            [id]: { target, seq: (state.wanted[id]?.seq ?? 0) + 1 }
        };
    }

    function focusWanted(id: string): FocusRequest | null {
        return state.wanted[id] ?? null;
    }

    function focusTaken(id: string): void {
        const { [id]: _asked, ...rest } = state.wanted;
        state.wanted = rest;
    }

    /**
     * Replace the hits a pick names. The files a source tab holds unsaved text of are left out and
     * named; a replace that leaves nothing to write says so and sends nothing.
     */
    async function replaceHits(id: string, pick: Chosen): Promise<ReplaceResult> {
        const none: ReplaceResult = { focus: '' };
        if (replaceRunning(id)) return none;
        const held = searchState(id);
        if (held.answer === null || held.ran === null) return none;
        const { sendable, left: unsaved } = scopeOf(held.answer.files, pick);
        const names = unsaved.map((file) => file.path).join(', ');
        if (sendable.length === 0) {
            say(
                id,
                unsaved.length > 0
                    ? t('search.replace_unsaved_all', names)
                    : t('search.replace_none'),
                true
            );
            return none;
        }
        const generation = runs.get(id) ?? 0;
        state.replacing = [...state.replacing, id];
        unsay(id);
        try {
            const outcome = await explorer.replace(replaceRequest(held.ran, held, sendable));
            if (!open(id)) return none;
            const done = outcome.ok ? outcome.paths : (outcome.done ?? []);
            const written = sendable.filter((file) => done.includes(`${file.root}/${file.path}`));
            // A new run since the request was sent made another answer, which this one is not
            // about.
            const current = (runs.get(id) ?? 0) === generation;
            const mine = searchState(id);
            let focus = '';
            if (current && mine.answer !== null) {
                const rereads = rereadsOf(outcome.rereads);
                const applied = applyRereads(mine.answer.files, rereads, mine.dismissed);
                // A file the answer did not read again loses the hits it was sent, as it would if
                // it had been written and read.
                const unread = written.filter(
                    (file) =>
                        !rereads.some((one) => one.root === file.root && one.path === file.path)
                );
                const files = without(applied.files, unread);
                focus =
                    unread.length === 0
                        ? focusAfter(mine.answer.files, written, applied)
                        : rowAfter(mine.answer.files, written);
                setSearchState(id, {
                    answer: { ...mine.answer, files },
                    dismissed: applied.dismissed,
                    replaces: remembered(mine.replaces, mine.replace)
                });
                // A Replace Preview that is open goes on to the hit the focus moved to.
                if (previews.shown()) previewHit(id, focus);
            }
            // As VS Code's, only a Replace All over the whole answer is said in the count line's
            // place; a Replace of a hit or of a file that went through leaves the count line.
            if (outcome.ok && pick.kind !== 'all') return { focus };
            const count = totals(written);
            const lead = outcome.ok
                ? replaceDone({ hits: count.hits, files: count.files, text: held.replace })
                : replaceStopped(outcome.failed ?? '', done.length, outcome.error);
            say(
                id,
                unsaved.length > 0 ? `${lead} ${t('search.replace_unsaved', names)}` : lead,
                !outcome.ok
            );
            return { focus };
        } finally {
            state.replacing = state.replacing.filter((one) => one !== id);
        }
    }

    function dismissHits(id: string, pick: Chosen): string {
        const held = searchState(id);
        if (held.answer === null) return '';
        const taken = pickedFiles(held.answer.files, pick);
        const focus = rowAfter(held.answer.files, taken);
        unsay(id);
        setSearchState(id, {
            answer: { ...held.answer, files: without(held.answer.files, taken) },
            dismissed: [...held.dismissed, ...dismissedOf(taken)]
        });
        return focus;
    }

    return {
        searchState,
        setSearchState,
        searchRunning,
        runSearch,
        toggleMode,
        rescope: changeAndRun,
        replaceRunning,
        replaceSaid,
        replaceHits,
        dismissHits,
        replaceQuestion: replaceAsk,
        previewHit,
        wantFocus,
        focusWanted,
        focusTaken,
        forgetSearch,
        names: (signal) => request(namesUrl(), writes.writeToken(), signal, namesOf),
        fileMatcher: (answer) => createFileMatcher(answer)
    };
}

/** What a request to the endpoint answered: the answer read from the body, or why there is none. */
type Read<T> = { ok: true; answer: T } | { ok: false; error: string };

/** What a names request answered: the names, or the sentence that says why there are none. */
type NamesRead = Read<NamesAnswer>;

/**
 * One request to the endpoint, with the token the page was given. `read` takes the answer out of
 * the body and gives null for a body that is not one, so a refusal, an unreadable body and a
 * failed request are worded here for a search and for a names request alike.
 */
async function request<T>(
    url: string,
    token: string,
    signal: AbortSignal,
    read: (body: unknown) => T | null
): Promise<Read<T>> {
    try {
        const response = await fetch(url, { headers: { 'x-oculus-token': token }, signal });
        const body = await readJson(response);
        if (!response.ok) {
            const held = readAs(refusalBodyShape, body);
            const word = refusalFrom(held?.error);
            if (word !== null) {
                return { ok: false, error: refusalWords(word, held?.reason ?? '') };
            }
            return { ok: false, error: refusedAnswer(response.status, held?.error) };
        }
        if (body === undefined) return { ok: false, error: unreadableAnswer(response.status) };
        const answer = read(body);
        if (answer === null) return { ok: false, error: t('search.failed') };
        return { ok: true, answer };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}
