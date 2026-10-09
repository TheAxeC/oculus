// Layer 3, shell, partial of shell/keys/Palette.svelte. The names the palette's file mode matches:
// asked of the search route when the palette opens in the file mode, handed to a matcher
// (state/sources/search/file-matcher.svelte.ts) when the answer arrives so that no keystroke pays
// for preparing them, and dropped when the palette closes. An opening that is closed, or replaced
// by a later one, ends its request and its matcher, and its answer is not kept. The list stays
// empty while the answer is out; the palette says so, and says the sentence of a refusal.
//
// The query the file mode holds is posted to the matcher as it changes; the rows are those of the
// newest query the matcher has answered, and `started` says whether it has answered one.

import { untrack } from 'svelte';
import type { FileMatch } from '$lib/state/workbench/palette';
import type { ClientState } from '$lib/state/client/context';
import { t } from '$lib/state/shared/words/text';

/** The two calls of the search store the file mode uses. */
type NamesSearch = Pick<ClientState['search'], 'names' | 'fileMatcher'>;

/** The matcher the search store makes for an answer. */
type Matcher = ReturnType<NamesSearch['fileMatcher']>;

/** Where the names are: none asked for, on their way, refused, or here. */
type Names =
    | { phase: 'idle' }
    | { phase: 'loading' }
    | { phase: 'refused'; error: string }
    | { phase: 'ready'; summary: Matcher['summary']; matcher: Matcher };

export type FileNames = {
    /** Where the names are. */
    names: () => Names;
    /** The rows of the newest query answered, none while the names are not here. */
    rows: () => FileMatch[];
    /** Whether the matcher has answered a query, so that the rows are those of an answer. */
    started: () => boolean;
    /** Ask for the names; the function it answers ends the request and forgets the answer. */
    ask: () => () => void;
};

/**
 * The names of the served roots, asked through the search store's `names` and matched through its
 * `fileMatcher`. `typed` is the query to match, empty when the file mode has nothing to match.
 */
export function createFileNames(search: NamesSearch, typed: () => string): FileNames {
    let held = $state.raw<Names>({ phase: 'idle' });
    let turn = 0;

    /** Put `next` in place of the names held, ending the matcher they hold. */
    function replace(next: Names): void {
        if (held.phase === 'ready') held.matcher.end();
        held = next;
    }

    function ask(): () => void {
        turn += 1;
        const mine = turn;
        const gate = new AbortController();
        replace({ phase: 'loading' });
        void search.names(gate.signal).then((read) => {
            if (mine !== turn) return;
            if (!read.ok) {
                replace({ phase: 'refused', error: read.error });
                return;
            }
            const matcher = search.fileMatcher(read.answer);
            replace({ phase: 'ready', summary: matcher.summary, matcher });
        });
        return () => {
            if (mine !== turn) return;
            turn += 1;
            gate.abort();
            replace({ phase: 'idle' });
        };
    }

    // The query goes to the matcher whenever it changes or the matcher arrives.
    $effect(() => {
        const text = typed();
        if (held.phase !== 'ready' || text.trim() === '') return;
        const { matcher } = held;
        untrack(() => matcher.ask(text));
    });

    // A matcher whose worker did not start is a refusal the palette words.
    $effect(() => {
        if (held.phase !== 'ready' || !held.matcher.failed()) return;
        const error = t('app.palette.files_matcher_failed');
        untrack(() => replace({ phase: 'refused', error }));
    });

    return {
        names: () => held,
        rows: () => (held.phase === 'ready' ? held.matcher.rows() : []),
        started: () => held.phase === 'ready' && held.matcher.answered() !== null,
        ask
    };
}
