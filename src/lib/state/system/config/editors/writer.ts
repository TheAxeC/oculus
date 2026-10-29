// Layer 2, client state. The writes of the list, multi and family editors of one view. Each edit
// of an editor's draft that reads back holds the draft's whole value as an unsaved change of the
// scope on screen, through the `Stage` the view gives it (scopes/write.ts), and a draft equal to
// the row's value drops the change; the scope's Save writes it. A draft that does not read back
// holds nothing new and keeps the change it held. Discard drops the draft and the change, and a
// Reset holds the taking out of the user's value and ends the draft.
//
// A push ends a draft the tab holds once the row's value is the draft's and no change is held,
// which is what a Save of the scope leaves; a draft that reads back and differs from the row with
// no change held, as one the tab kept over a reload, holds its change again. A push ends a draft
// whose row it leaves in a form the editor does not draw, with the sentence that it was dropped,
// since a draft with no editor cannot be held or discarded. A closed writer holds nothing and
// moves no state. It is a plain closure with no runes; the view hands it a callback that redraws,
// one that drops a draft, one that says whether the tab holds a draft of a row, and the lists the
// draft's fields are checked against.
//
// What it keeps for a row of a hub other than the primary or of a repository (`row.slot`) is kept
// apart from the same key of another file. A row that says why it writes nothing (`row.blocked`)
// holds nothing.

import { message, type Message } from '../messages.ts';
import { writtenWhole, type ConfigRow } from '../rows.ts';
import { heldKey, heldValue, type Stage } from '../scopes/write.ts';
import { draftValue, holdsValue, type Draft } from './draft.ts';
import type { Lists } from './sources.ts';
import { drawsEditor } from './slots.ts';

/**
 * What the view gives the writer: the stage of the scope on screen, a redraw, the end of a row's
 * draft, the draft held and whether the file moved under it, and the lists the controls of a row
 * draw from.
 */
export type EditorHooks = {
    stage: Stage;
    changed: () => void;
    ended: (row: ConfigRow) => void;
    held: (row: ConfigRow) => Draft | undefined;
    /** Whether the file has moved from the value the row's draft was started over. */
    stale: (row: ConfigRow) => boolean;
    lists: (row: ConfigRow) => Lists;
};

/** The writes of the editors of a view. */
export type EditorWriter = {
    /** Hold the draft of a row as its change, or drop the change for a draft equal to the row. */
    save: (row: ConfigRow, draft: Draft) => void;
    /** Drop the draft of a row and the change it held. */
    discard: (row: ConfigRow) => void;
    /** Hold the taking out of the user's value of a list, multi, parked list or family. */
    reset: (row: ConfigRow) => void;
    /** The row as the file holds it now: ends a draft the file holds or the editor cannot draw. */
    pushed: (row: ConfigRow) => void;
    /** The value held for the row, which the editor shows in place of the row's value. */
    shown: (row: ConfigRow) => unknown;
    /** The sentence under the row, or null. */
    said: (row: ConfigRow) => Message | null;
    /** Whether the row holds an unsaved change, which the editor marks. */
    unsaved: (row: ConfigRow) => boolean;
    /** Take the sentence of a row away. */
    clear: (row: ConfigRow) => void;
    /** End the writer: nothing is held, and nothing changes any more. */
    close: () => void;
};

/** Open the writes of a view's editors. */
export function createEditorWriter(hooks: EditorHooks): EditorWriter {
    const saying = new Map<string, Message>();
    let closed = false;

    function save(row: ConfigRow, draft: Draft): void {
        if (closed || row.blocked !== undefined) return;
        const made = draftValue(draft, row, hooks.lists(row));
        if (!made.ok) return;
        saying.delete(heldKey(row));
        if (!holdsValue(made.value, row)) hooks.stage.set(row, made.value);
        else if (hooks.stage.held(row) !== undefined) hooks.stage.drop(row);
        hooks.changed();
    }

    function discard(row: ConfigRow): void {
        if (closed) return;
        saying.delete(heldKey(row));
        if (hooks.stage.held(row) !== undefined) hooks.stage.drop(row);
        hooks.ended(row);
        hooks.changed();
    }

    function reset(row: ConfigRow): void {
        if (closed || row.blocked !== undefined || !writtenWhole(row.control)) return;
        if (row.own) hooks.stage.reset(row);
        else hooks.stage.drop(row);
        hooks.ended(row);
        hooks.changed();
    }

    function pushed(row: ConfigRow): void {
        const draft = hooks.held(row);
        if (closed || draft === undefined) return;
        if (!drawsEditor(row)) {
            saying.set(heldKey(row), message('draftDropped'));
        } else {
            const made = draftValue(draft, row, hooks.lists(row));
            const unheld = hooks.stage.held(row) === undefined;
            if (made.ok && !holdsValue(made.value, row)) {
                // A draft the tab kept over a reload holds its change again, unless the file has
                // moved from the value it was started over.
                if (unheld && !hooks.stale(row)) {
                    hooks.stage.set(row, made.value);
                    hooks.changed();
                }
                return;
            }
            if (!made.ok || !unheld) return;
        }
        hooks.ended(row);
        hooks.changed();
    }

    return {
        save,
        discard,
        reset,
        pushed,
        shown: (row) => heldValue(row, hooks.stage.held(row)),
        said: (row) => saying.get(heldKey(row)) ?? null,
        unsaved: (row) => hooks.stage.held(row) !== undefined,
        clear: (row) => {
            if (saying.delete(heldKey(row))) hooks.changed();
        },
        close: () => {
            closed = true;
        }
    };
}
