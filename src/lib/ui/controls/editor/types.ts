// Layer 3, primitive. The values the editor takes and hands back, and what its parent asks of it
// through `perform`, the one method Editor.svelte exports. They live in a module of their own so a
// parent types the editor it binds with `EditorHandle` and imports no Svelte file for a type.

import type * as Monaco from 'monaco-editor';
import type { EditorKit } from './kit/load';

/** Where the caret is, lines and columns counted from one, and how many characters are selected. */
export type EditorCaret = { line: number; column: number; selected: number };

/** One step of indentation: a tab, or a width of spaces. */
export type EditorIndent = { tabs: boolean; size: number };

/** A line ending a text is written with. */
export type EditorEnding = 'LF' | 'CRLF';

/** How a change of the text came about: the reader's typing, or the editor's undo or redo. */
export type EditorEdit = 'type' | 'undo' | 'redo';

/**
 * One of the editor's actions the palette offers: its id, its label, and its keys as the hint (a
 * removed chord's old chord, or a mark action's key), empty for an action with none.
 */
export type EditorAction = { id: string; label: string; hint: string };

/** One key press: Monaco's name for the key, and the modifiers held with it. */
export type KeyPress = {
    code: keyof typeof Monaco.KeyCode;
    /** Cmd on macOS and Ctrl elsewhere, Monaco's CtrlCmd. */
    cmd?: true;
    /** The Ctrl key on macOS, Monaco's WinCtrl. */
    ctrl?: true;
    shift?: true;
    /** The Alt key, Option on macOS, Monaco's Alt. */
    alt?: true;
};

/**
 * An action the parent owns and hands the editor: the editor binds `key` to it, when it has one,
 * and lists it to the palette with the key as its hint. The parent lists the same actions to the
 * palette itself while it draws no editor. An action with a `menu` is also in the editor's
 * right-click menu, in the group of that name.
 */
export type EditorOwnAction = {
    id: string;
    label: string;
    key?: KeyPress;
    menu?: string;
    /** Not runnable: the action is hidden from the editor's menu and left out of the palette. */
    disabled?: boolean;
    run: () => void;
};

/** One text edit in the protocol's positions: zero-based lines and UTF-16 characters. */
type EditorTextEdit = {
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    newText: string;
};

/**
 * The edits a text the parent hands in was reached by, made in the text `from`. The editor makes
 * them in its model as they are, so selections, decorations and folds keep their places.
 */
export type EditorReach = { from: string; edits: EditorTextEdit[] };

/** The labels of the editor's three actions over the quick diff marks, in the parent's words. */
export type EditorChangeWords = { next: string; previous: string; open: string };

/** What the parent asks the editor to do through `perform`. */
export type EditorCommand =
    | { kind: 'goto'; line: number; column?: number }
    | { kind: 'word'; line: number; column: number }
    | { kind: 'indent'; indent: EditorIndent }
    | { kind: 'convert'; tabs: boolean }
    | { kind: 'ending'; ending: EditorEnding }
    | { kind: 'language'; language: string }
    | { kind: 'action'; id: string };

/** The editor as its parent holds it through `bind:this`. */
export type EditorHandle = { perform: (command: EditorCommand) => void };

/** One line change as the diff editor answers it: an empty side ends at 0, after its start. */
export type DiffLineChange = {
    originalStartLineNumber: number;
    originalEndLineNumber: number;
    modifiedStartLineNumber: number;
    modifiedEndLineNumber: number;
};

/** One selection of a diff side, as Monaco holds it. */
export type DiffSelection = {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
};

/** The selections of both sides of a diff. */
export type DiffSelections = { original: DiffSelection[]; modified: DiffSelection[] };

/** The side of a diff a line or a bar is on: the version being changed to, or the one before. */
export type DiffSide = 'modified' | 'original';

/**
 * One bar a parent draws above a line of an editor: its key, and the line it sits after. In a diff
 * editor `side` says which of the two it sits in (the modified side when absent), and `order` puts
 * it below the bars of a lower order after the same line (0 when absent).
 */
export type EditorBar = { id: string; after: number; side?: DiffSide; order?: number };

/** What a parent asks a diff editor to do: run a palette action, or bring a line into view. */
export type DiffCommand = { kind: 'action'; id: string } | { kind: 'reveal'; line: number };

/** The diff editor as its parent holds it through `bind:this`. */
export type DiffHandle = { perform: (command: DiffCommand) => void };

/** One problem to draw as a marker on a line: an error or a warning, with its words. */
export type EditorProblem = { line: number; severity: 'error' | 'warning'; message: string };

/**
 * What a parent adds to the editor once its model exists: it is given the loaded kit, the editor
 * and the model, adds markers, widgets, providers or actions, and answers the call that takes them
 * away again. The editor runs it again when the parent hands in another.
 */
export type EditorExtension = (
    kit: EditorKit,
    editor: Monaco.editor.IStandaloneCodeEditor,
    model: Monaco.editor.ITextModel
) => () => void;
