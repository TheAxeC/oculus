// Layer 3, primitive. The actions Editor.svelte adds to Monaco under the parent's labels: the
// actions over the quick diff marks, while the text holds a mark (gutter/gutter.ts
// `changeActions`), and the actions the parent owns, in the right-click menu too when one names a
// group, each bound to its key when it has one; and the rows the palette lists for them and for
// Show Suggestions (keys/suggest.ts).
//
// The marks, the line count and the press on a mark are read when an action runs, so an action
// added once acts on the marks of the moment and is added again only when its label or the mark
// state changes.

import type * as Monaco from 'monaco-editor';
import { keyCode, keysCode, type EditorKit } from '../kit/load';
import { ownListing } from '../chords';
import { changeActions, type EditorMark } from '../gutter/gutter';
import { actOnMarks } from '../gutter/editor-gutter';
import { suggestListing } from './suggest';
import type { EditorAction, EditorChangeWords, EditorOwnAction, EditorSuggest } from '../types';

/** What the added actions are made from, the marks and the line count read when one runs. */
export type ActionSources = {
    /** The labels of the actions over the marks; without them none is added. */
    words: EditorChangeWords | undefined;
    /** Whether the text holds a mark, which is when the actions over the marks are there. */
    marked: boolean;
    marks: () => readonly EditorMark[];
    lines: () => number;
    onmark: (mark: EditorMark) => void;
    actions: readonly EditorOwnAction[];
    suggest: EditorSuggest | undefined;
};

/**
 * Add the actions to the editor: those over the marks, then the parent's own. Answers the actions
 * added, which the caller disposes when it adds them again, and the palette's rows for them and for
 * Show Suggestions, in that order.
 */
export function addActions(
    loaded: EditorKit,
    made: Monaco.editor.IStandaloneCodeEditor,
    from: ActionSources
): { added: Monaco.IDisposable[]; said: EditorAction[] } {
    const listed =
        from.words === undefined ? [] : changeActions(from.words, loaded.mac, from.marked);
    const added = listed.map(({ id, label, press, does }) => {
        const keybindings = press === null ? [] : [keyCode(loaded.monaco, press)];
        return made.addAction({
            id,
            label,
            keybindings,
            run: () => actOnMarks(made, does, from.marks(), from.lines(), from.onmark)
        });
    });
    const said = listed.map(({ id, label, hint }): EditorAction => ({ id, label, hint }));
    for (const { id, label, key, menu, order, disabled, run } of from.actions) {
        const keybindings = key === undefined ? [] : [keysCode(loaded.monaco, key)];
        const at = order === undefined ? {} : { contextMenuOrder: order };
        const group = menu === undefined ? {} : { contextMenuGroupId: menu, ...at };
        const precondition = disabled === true ? { precondition: 'false' } : {};
        added.push(
            made.addAction({
                id,
                label,
                keybindings,
                ...group,
                ...precondition,
                run: () => run()
            })
        );
    }
    said.push(...ownListing(from.actions, loaded.mac), ...suggestListing(from.suggest, loaded.mac));
    return { added, said };
}
