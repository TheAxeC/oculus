// Layer 3, view helper of views/sources/repositories/diff/Diff.svelte. What a hunk action does
// once a file's section asks for it: the patch is cut from the file's two texts, the drawn line
// changes (git's own for a file the server read a git diff of) and the rows chosen
// (state/sources/repositories/diff/diff-patch.ts) and applied by git; a revert throws work away,
// so it is held in `asking` until the reader confirms or cancels.

import type { ChosenRows, LineChange } from '$lib/state/sources/repositories/diff/diff-hunks';
import { sidesPatch, type PatchMode } from '$lib/state/sources/repositories/diff/diff-patch';
import type { DiffSides } from '$lib/state/sources/repositories/repositories';
import { t } from '$lib/state/shared/words/text';

/** What the pane hands its hunk actions: the files drawn, the diff's repository and path. */
export type ActsSource = {
    files: () => DiffSides[];
    root: () => string;
    path: () => string;
    /** Apply a cut patch to the repository's index or worktree. */
    applyPatch: (root: string, cut: string, mode: PatchMode) => Promise<unknown>;
};

export class HunkActs {
    /** The revert waiting on the reader's answer, with the question it asks. */
    asking: { message: string; act: () => void } | null = $state(null);
    readonly #from: ActsSource;

    constructor(from: ActsSource) {
        this.#from = from;
    }

    async #apply(index: number, cut: string, mode: PatchMode): Promise<void> {
        if (cut === '' || index >= this.#from.files().length) return;
        await this.#from.applyPatch(this.#from.root(), cut, mode);
    }

    /**
     * A section asked to stage, unstage or revert a hunk, or the lines chosen in it. `drawnChanges`
     * are the line changes its editor drew: git's for a file the server read a git diff of, so a
     * whole block's patch is git's hunk, else Monaco's.
     */
    acted(
        index: number,
        drawnChanges: LineChange[],
        rows: ChosenRows,
        mode: PatchMode,
        count: number
    ): void {
        const cut = sidesPatch(this.#from.files()[index], drawnChanges, rows, mode);
        if (mode !== 'revert') {
            void this.#apply(index, cut, mode);
            return;
        }
        const path = this.#from.path();
        this.asking = {
            message:
                count === 0
                    ? t('repositories.hunk_revert_confirm', path)
                    : count === 1
                      ? t('repositories.lines_revert_confirm_one', path)
                      : t('repositories.lines_revert_confirm', count, path),
            act: () => void this.#apply(index, cut, mode)
        };
    }

    /** The reader confirmed: run the revert that was waiting. */
    confirm(): void {
        const was = this.asking;
        this.asking = null;
        was?.act();
    }

    /** The reader cancelled: drop the revert that was waiting. */
    cancel(): void {
        this.asking = null;
    }
}
