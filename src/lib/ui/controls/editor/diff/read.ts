// Layer 3, primitive, partial of DiffEditor.svelte. What the diff editor reads off Monaco's: the
// layout it draws, the line changes of the diff it drew (git's where the editor was handed them,
// diff/git-provider.ts, else Monaco's own), the selections of its two sides and the height of its
// content. Monaco is only a type here: the editor passes in the diff editor it made.

import type * as Monaco from 'monaco-editor';
import type { DiffLineChange, DiffSelection, DiffSelections } from '../types';

/** The layout a diff editor draws: the two sides side by side, or one column. */
export type DiffLayout = 'side' | 'inline';

/** Tell `then` the layout the diff draws now and whenever Monaco switches it. */
export function layoutWatch(
    box: HTMLElement,
    then: (layout: DiffLayout) => void
): Monaco.IDisposable {
    const root = box.querySelector('.monaco-diff-editor');
    if (root === null) return { dispose: () => undefined };
    const read = () => then(root.classList.contains('side-by-side') ? 'side' : 'inline');
    const watch = new MutationObserver(read);
    watch.observe(root, { attributes: true, attributeFilter: ['class'] });
    read();
    return { dispose: () => watch.disconnect() };
}

/** The line changes of the diff drawn, as plain numbers; null while Monaco has drawn none yet. */
export function lineChangesOf(
    made: Pick<Monaco.editor.IStandaloneDiffEditor, 'getLineChanges'>
): DiffLineChange[] | null {
    return (
        made.getLineChanges()?.map((change) => ({
            originalStartLineNumber: change.originalStartLineNumber,
            originalEndLineNumber: change.originalEndLineNumber,
            modifiedStartLineNumber: change.modifiedStartLineNumber,
            modifiedEndLineNumber: change.modifiedEndLineNumber
        })) ?? null
    );
}

function selectionsOf(side: Monaco.editor.ICodeEditor): DiffSelection[] {
    return (side.getSelections() ?? []).map((one) => ({
        startLineNumber: one.selectionStartLineNumber,
        startColumn: one.selectionStartColumn,
        endLineNumber: one.positionLineNumber,
        endColumn: one.positionColumn
    }));
}

/** The selections of both sides. */
export function bothSelections(
    made: Pick<Monaco.editor.IStandaloneDiffEditor, 'getOriginalEditor' | 'getModifiedEditor'>
): DiffSelections {
    return {
        original: selectionsOf(made.getOriginalEditor()),
        modified: selectionsOf(made.getModifiedEditor())
    };
}

/** The height of the content: the taller side drawn, the original counting only side by side. */
export function contentHeight(
    made: Pick<Monaco.editor.IStandaloneDiffEditor, 'getOriginalEditor' | 'getModifiedEditor'>,
    drawn: DiffLayout
): number {
    const sides = [made.getModifiedEditor()];
    if (drawn === 'side') sides.push(made.getOriginalEditor());
    return Math.max(...sides.map((side) => side.getContentHeight()));
}
