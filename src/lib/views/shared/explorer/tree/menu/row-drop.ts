// Layer 3, view partial. What a drop on the Files tree does once the tree has decided where it
// landed: rows dragged from the tree move or copy into a folder, a move asking first, and files
// dragged in from Finder upload into it, a folder among them refused with a line. The decision of
// where a drop lands and whether it moves or copies is state/sources/explorer/acts/drop.ts's; this
// carries it out over the explorer store, so a test hands in fakes and the question is a call that
// answers yes or no.

import {
    dropInto,
    dropVerdict,
    outsideVerdict,
    type DropRow,
    type OutsideItem
} from '$lib/state/sources/explorer/acts/drop';
import { nameOf, type RowRef } from '$lib/state/sources/fs';
import type { Confirm, ExplorerStore } from '$lib/state/sources/explorer/ops.svelte';
import { refusalLine, uploader, type AskedQuestion } from './row-ops';

type Words = (key: string, ...args: (string | number)[]) => string;

/** What a drop needs: the store's move and upload, the tree's line, and its questions. */
export type RowDropDeps = {
    explorer: Pick<ExplorerStore, 'drop' | 'upload'>;
    /** Say a refusal or a result on the tree's line, `told` true for a whole upload. */
    say: (note: string, told?: boolean) => void;
    /** Ask a question and answer whether it was confirmed. */
    confirm: (question: AskedQuestion) => Promise<boolean>;
};

/** The name a folder is called in a question: its own, or its root's key for the root. */
function folderName(folder: RowRef): string {
    return folder.path === '' ? folder.root : nameOf(folder.path);
}

/** The two drops of the tree, over the calls handed in. */
export function rowDropper(deps: RowDropDeps, t: Words) {
    const asked: Confirm = (question) => deps.confirm(question);
    const uploading = uploader(deps, t);

    /**
     * Rows dragged from the tree onto a row: a move after the question, a copy at once, and nothing
     * where the drop would put a folder into itself, a row where it already is, or onto a name
     * being typed.
     */
    async function rows(
        dragged: readonly DropRow[],
        target: DropRow,
        copy: boolean,
        typing: boolean
    ): Promise<void> {
        const verdict = dropVerdict(dragged, target, copy, typing);
        if (verdict.kind === 'nothing') return;
        if (verdict.kind === 'move') {
            const sure = await deps.confirm({
                kind: 'move',
                names: verdict.items.map((one) => nameOf(one.path)),
                into: folderName(verdict.into)
            });
            if (!sure) return;
        }
        const outcome = await deps.explorer.drop(
            verdict.items,
            verdict.into,
            verdict.kind === 'copy',
            asked
        );
        deps.say(refusalLine(outcome, t));
    }

    /**
     * Things dropped from Finder onto a row: the files upload into the folder the row stands for,
     * the folders among them are refused with their names, and the line says both.
     */
    async function outside(
        things: readonly (OutsideItem & { file: File | null })[],
        target: DropRow,
        typing: boolean
    ): Promise<void> {
        if (typing) return;
        const verdict = outsideVerdict(things);
        const files = verdict.upload.flatMap((at) => {
            const file = things[at]?.file ?? null;
            return file === null ? [] : [file];
        });
        const refused =
            verdict.refused.length === 0
                ? ''
                : t('files.drop_folder_refused', verdict.refused.join(', '));
        const sent = files.length === 0 ? null : await uploading(dropInto(target), files);
        const text = [refused, sent?.text ?? ''].filter((one) => one !== '').join(' ');
        deps.say(text, refused === '' && sent?.told === true);
    }

    return { rows, outside };
}
