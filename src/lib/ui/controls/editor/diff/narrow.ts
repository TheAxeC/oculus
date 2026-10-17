// Layer 3, primitive. The widths at which a diff editor (DiffEditor.svelte) changes how it draws.
// At and under NARROW pixels Monaco draws a side by side diff inline. At and under TIGHT pixels the
// diff, inline there, narrows its gutters so its text keeps most of the box: one column of line
// numbers (Monaco's `compactMode`, which hides the original side's numbers), that column two
// characters wide, a narrow decorations column, no folding marks, no overview ruler of the diff and
// none of either side's editor (`overviewRulerLanes` 0, which Monaco draws as nothing; the diff
// editor does not hand that option to its two editors, so each is given it). Over TIGHT every one
// is Monaco's default again.

import type * as Monaco from 'monaco-editor';

/** The width in pixels at and under which Monaco draws a side by side diff inline. */
export const NARROW = 900;

/** The width in pixels at and under which a diff editor narrows its gutters. */
const TIGHT = 400;

/** The options of a diff editor in a box that is narrow or not. */
function gutterOptions(narrow: boolean): Monaco.editor.IDiffEditorOptions {
    return narrow
        ? {
              compactMode: true,
              renderOverviewRuler: false,
              lineNumbersMinChars: 2,
              lineDecorationsWidth: 4,
              folding: false
          }
        : {
              compactMode: false,
              renderOverviewRuler: true,
              lineNumbersMinChars: 5,
              lineDecorationsWidth: 10,
              folding: true
          };
}

/**
 * Give `made` and its two editors the gutter options of `box`'s width, now and whenever the width
 * crosses TIGHT.
 */
export function narrowWatch(
    box: HTMLElement,
    made: Pick<
        Monaco.editor.IStandaloneDiffEditor,
        'updateOptions' | 'getOriginalEditor' | 'getModifiedEditor'
    >
): Monaco.IDisposable {
    let was: boolean | null = null;
    const read = (): void => {
        const narrow = box.clientWidth <= TIGHT;
        if (narrow === was) return;
        was = narrow;
        made.updateOptions(gutterOptions(narrow));
        const lanes = { overviewRulerLanes: narrow ? 0 : 3 };
        made.getOriginalEditor().updateOptions(lanes);
        made.getModifiedEditor().updateOptions(lanes);
    };
    read();
    if (typeof ResizeObserver === 'undefined') return { dispose: () => undefined };
    const watch = new ResizeObserver(read);
    watch.observe(box);
    return { dispose: () => watch.disconnect() };
}
