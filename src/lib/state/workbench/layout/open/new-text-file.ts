// Layer 2, client state. New Text File's opener over the layout's openInPane: a source tab on an
// untitled text, named "Untitled-N" for the lowest N no open tab holds, as VS Code names one. The
// tab holds an empty draft and no file; its first Save asks where the file goes.

import { t } from '../../../shared/words/text.ts';

/** The lowest "Untitled-N" none of these labels is, the word before N being the catalog's. */
export function untitledLabel(taken: readonly string[]): string {
    const word = t('ui.untitled_word');
    const numbers = new Set(
        taken
            .filter(
                (label) => label.startsWith(word) && /^[1-9]\d*$/.test(label.slice(word.length))
            )
            .map((label) => Number(label.slice(word.length)))
    );
    let next = 1;
    while (numbers.has(next)) next += 1;
    return `${word}${String(next)}`;
}

/**
 * The opener of an untitled text in the pane at `path` of `page`. `taken` answers the labels of the
 * tabs open now, read when the opener runs.
 */
export function newTextFileOpener(
    openInPane: (view: string, state: unknown, page: string, path: number[]) => string,
    taken: () => readonly string[]
): (page: string, path: number[]) => void {
    return (page, path) => {
        openInPane('source', { untitled: true, label: untitledLabel(taken()) }, page, path);
    };
}
