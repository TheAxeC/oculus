// Layer 3, primitive. The options a parent hands the editors (word wrap, rulers, the minimap,
// whitespace and sticky scroll) as Monaco names them, the call that applies a change to a live
// editor, the indentation of a model, and the editor action that toggles word wrap on Alt+Z.
// Monaco is only a type here: the editor passes in the editor, the model and the key codes it
// holds.

import type * as Monaco from 'monaco-editor';
import type { EditorAction, EditorIndent } from './types';

/**
 * The options a parent hands an editor, each left to Monaco's own while absent: a diff editor is
 * handed no minimap, and a parent that has not yet read the configuration hands no option at all.
 */
export type EditorOptions = {
    wordWrap?: Monaco.editor.IEditorOptions['wordWrap'];
    rulers?: number[];
    minimap?: boolean;
    renderWhitespace?: Monaco.editor.IEditorOptions['renderWhitespace'];
    stickyScroll?: boolean;
};

/** An editor that takes options: the code editor and the diff editor both do. */
type Updatable = { updateOptions(options: Monaco.editor.IEditorOptions): void };

/** The options as Monaco's option names, leaving out each one that is not handed. */
export function monacoOptions(options: EditorOptions): Monaco.editor.IEditorOptions {
    const named: Monaco.editor.IEditorOptions = {};
    if (options.wordWrap !== undefined) named.wordWrap = options.wordWrap;
    if (options.rulers !== undefined) named.rulers = options.rulers;
    if (options.minimap !== undefined) named.minimap = { enabled: options.minimap };
    if (options.renderWhitespace !== undefined) named.renderWhitespace = options.renderWhitespace;
    if (options.stickyScroll !== undefined) named.stickyScroll = { enabled: options.stickyScroll };
    return named;
}

/** Put the options on a live editor in one update. */
export function applyOptions(editor: Updatable, options: EditorOptions): void {
    editor.updateOptions(monacoOptions(options));
}

/** Give a model its indentation: the width of a step, and a tab or spaces. */
export function applyIndent(
    model: Pick<Monaco.editor.ITextModel, 'updateOptions'>,
    indent: EditorIndent
): void {
    model.updateOptions({
        tabSize: indent.size,
        indentSize: indent.size,
        insertSpaces: !indent.tabs
    });
}

/** The id of the action that toggles word wrap. */
export const WRAP_ACTION = 'oculus.toggleWordWrap';

/** The key codes Alt+Z is made of, which Monaco's `KeyMod` and `KeyCode` hold. */
type WrapKeys = { KeyMod: { Alt: number }; KeyCode: { KeyZ: number } };

/**
 * The action that toggles word wrap on Alt+Z, bound to the key's code so that macOS's Option+Z
 * character does not stop it, and running `toggle`.
 */
export function wrapAction(
    keys: WrapKeys,
    label: string,
    toggle: () => void
): Monaco.editor.IActionDescriptor {
    return {
        id: WRAP_ACTION,
        label,
        keybindings: [keys.KeyMod.Alt | keys.KeyCode.KeyZ],
        run: () => {
            toggle();
        }
    };
}

/** The action as the palette lists it, with its key as the hint. */
export function wrapListing(label: string): EditorAction {
    return { id: WRAP_ACTION, label, hint: 'Alt+Z' };
}
