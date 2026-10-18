// Layer 3, view state. The three versions of a conflicted path a merge tab draws (Merge.svelte),
// read from the index (stages 1, 2 and 3 of the path, through GET /api/git) and cut into regions,
// with the Result's pieces and each region's choice. They are read when the tab opens, again
// whenever the repository's git state moves, and on Retry: a read that brings the same versions
// keeps the reader's choices and typing, a read after the tab's own Complete Merge or Accept
// Deletion keeps the done note, and any other draws what git holds now, new conflicts or the answer
// that the path is no longer in conflict. Each read takes the next number, and only the newest may
// write what it read. It registers an effect, so it is made while a component starts.

import { untrack } from 'svelte';
import { readJson } from '$lib/data/shapes/shapes';
import { mergeSidesOf } from '$lib/state/sources/repositories/answers';
import {
    historyOf,
    initialPieces,
    regionsOf,
    type Choice,
    type MergeHistory,
    type Region
} from '$lib/state/sources/repositories/diff/merge-regions';
import { sidesUrl, type GitMergeSides } from '$lib/state/sources/repositories/repositories';
import { t } from '$lib/state/shared/words/text';

/** What the reads follow: the tab's repository and path, its git state, and the GET they make. */
export type MergeReadDeps = {
    root: () => string;
    path: () => string;
    git: () => unknown;
    get: (url: string) => Promise<Response>;
};

/** Whether two reads brought the same three versions. */
function sameSides(held: GitMergeSides, read: GitMergeSides): boolean {
    return (
        held.base === read.base &&
        held.ours === read.ours &&
        held.theirs === read.theirs &&
        held.deleted === read.deleted
    );
}

export class MergeReads {
    sides: GitMergeSides | null = $state(null);
    failure = $state('');
    regions: Region[] = $state([]);
    /** The Result's pieces and each region's choice, with the choices undo and redo can move. */
    history: MergeHistory = $state.raw(historyOf({ pieces: [], choices: [] }));
    done = $state(false);
    /** The newest read, which a caller may wait on. */
    latest: Promise<void> = Promise.resolve();
    readonly #deps: MergeReadDeps;
    /** What the last read was over, so a redraw does not read again. */
    #taken = '';
    /** The repository's git state the last read followed. */
    #seen: unknown = null;
    #reads = 0;

    constructor(deps: MergeReadDeps) {
        this.#deps = deps;
        $effect(() => {
            const [root, path] = [deps.root(), deps.path()];
            const wanted = `${root}\n${path}`;
            const state = deps.git();
            if (root === '' || path === '' || (wanted === this.#taken && state === this.#seen)) {
                return;
            }
            const fresh = wanted !== this.#taken;
            [this.#taken, this.#seen] = [wanted, state];
            untrack(() => {
                this.latest = this.#load(root, path, fresh);
            });
        });
    }

    /** Read the three versions again, as Retry does. */
    again(): Promise<void> {
        this.latest = this.#load(this.#deps.root(), this.#deps.path(), false);
        return this.latest;
    }

    /** The tab's own Complete Merge or Accept Deletion went through. */
    finished(): void {
        [this.done, this.failure] = [true, ''];
    }

    /** Read the three versions; `fresh` is a read of another path, which starts the tab over. */
    async #load(root: string, path: string, fresh: boolean): Promise<void> {
        this.#reads += 1;
        const mine = this.#reads;
        if (fresh) [this.failure, this.done] = ['', false];
        try {
            const response = await this.#deps.get(sidesUrl(root, path));
            const answer = mergeSidesOf(response.ok, await readJson(response));
            if (mine !== this.#reads) return;
            if (answer.sides === null) {
                // After this tab's own Complete Merge or Accept Deletion the path is out of
                // conflict, which the done note already says.
                if (!this.done) this.failure = answer.failure;
                return;
            }
            this.failure = '';
            if (!fresh && this.sides !== null && sameSides(this.sides, answer.sides)) return;
            this.done = false;
            this.sides = answer.sides;
            this.regions = regionsOf(answer.sides.base, answer.sides.ours, answer.sides.theirs);
            this.history = historyOf({
                pieces: initialPieces(this.regions),
                choices: this.regions.map((): Choice => 'open')
            });
        } catch {
            if (mine === this.#reads && !this.done) this.failure = t('repositories.merge_failed');
        }
    }
}
