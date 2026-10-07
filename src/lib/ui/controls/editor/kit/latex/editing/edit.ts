// Layer 3, primitive, pure. The shape every LaTeX editing command answers: the changes to the text
// as offsets into the text it read, and where the selections end up as offsets into the changed
// text. The editor applies the changes as one undoable edit and then places the selections, so a
// command holds no Monaco value and is read and checked as plain functions over strings.

/** One replacement: the characters from `start` up to `end` become `text`. */
export type Edit = { start: number; end: number; text: string };

/** One selection as offsets, `anchor` where it began and `active` where the caret is. */
export type Selected = { anchor: number; active: number };

/**
 * What a command does: the edits to make, and the selections to set after them, when it sets any.
 */
export type Change = { edits: Edit[]; select?: Selected[] };
