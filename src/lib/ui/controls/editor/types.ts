// Layer 3, primitive. The values the editor takes and hands back, and what its parent asks of it
// through `perform`, the one method Editor.svelte exports. They live in a module of their own so a
// parent types the editor it binds with `EditorHandle` and imports no Svelte file for a type.

/** Where the caret is, lines and columns counted from one, and how many characters are selected. */
export type EditorCaret = { line: number; column: number; selected: number };

/** One step of indentation: a tab, or a width of spaces. */
export type EditorIndent = { tabs: boolean; size: number };

/** A line ending a text is written with. */
export type EditorEnding = 'LF' | 'CRLF';

/**
 * One of the editor's actions the palette offers: its id, its label, and its keys as the hint (a
 * removed chord's old chord, or a mark action's key), empty for an action with none.
 */
export type EditorAction = { id: string; label: string; hint: string };

/** The labels of the editor's three actions over the quick diff marks, in the parent's words. */
export type EditorChangeWords = { next: string; previous: string; open: string };

/** What the parent asks the editor to do through `perform`. */
export type EditorCommand =
    | { kind: 'goto'; line: number }
    | { kind: 'indent'; indent: EditorIndent }
    | { kind: 'convert'; tabs: boolean }
    | { kind: 'ending'; ending: EditorEnding }
    | { kind: 'language'; language: string }
    | { kind: 'action'; id: string };

/** The editor as its parent holds it through `bind:this`. */
export type EditorHandle = { perform: (command: EditorCommand) => void };
