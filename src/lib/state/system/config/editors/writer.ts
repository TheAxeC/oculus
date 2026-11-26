// Layer 2, client state. The writes of the list, multi and family editors of one view. Each edit
// of an editor's draft that reads back holds the draft's whole value as an unsaved change of the
// scope on screen, through the `Stage` the view gives it (scopes/write.ts), and a draft equal to
// the row's value withdraws the change, so the row's value is held again once a Save already out
// with that change lands; the scope's Save writes it. A draft that does not read back, as a field
// that breaks its form, withdraws the change it held the same way, so a Save writes nothing the
// editor does not show, and its next edit that reads back holds the change again. Discard drops
// the draft and the change, and a Reset holds the taking out of the user's value, or withdraws
// the change of a row the file holds no key for, and ends the draft.
//
// A push ends a draft the tab holds once the row's value is the draft's and no change is held; a
// draft that reads back and differs from the row with no change held, as one the tab kept over a
// reload, holds its change again. A Save that lands tells the writer the slots of the rows it
// wrote (`saved`): the draft of such a row is not held again while the file holds the value it
// replaced, and it ends at the push that brings the value written, or at once when the last push
// brought that value, so the order of the pushes and the answer does not matter. A push ends a
// draft whose row it leaves in a form the editor does not draw, with the sentence that it was
// dropped, since a draft with no editor cannot be held or discarded. A closed writer holds nothing
// and moves no state. It is a plain closure with no runes; the view hands it a callback that
// redraws, one that drops a draft, one that says whether the tab holds a draft of a row, and the
// lists the draft's fields are checked against.
//
// What it keeps for a row of a hub other than the primary or of a repository (`row.slot`) is kept
// apart from the same key of another file. A row that says why it writes nothing (`row.blocked`)
// holds nothing.

import { message, type Message } from '../messages.ts';
import { writtenWhole, type ConfigRow } from '../rows.ts';
import { heldKey, heldValue, type Stage } from '../scopes/write.ts';
import { draftValue, holdsValue, type Draft } from './draft.ts';
import type { Lists } from './sources.ts';
import { drawsEditor, inSlot, slotOf, type Slot } from './slots.ts';

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
    /**
     * Hold the draft of a row as its change, or withdraw the change for a draft equal to the row
     * or one that does not read back.
     */
    save: (row: ConfigRow, draft: Draft) => void;
    /** Drop the draft of a row and the change it held. */
    discard: (row: ConfigRow) => void;
    /** Hold the taking out of the user's value of a list, multi, parked list or family. */
    reset: (row: ConfigRow) => void;
    /** The row as the file holds it now: ends a draft the file holds or the editor cannot draw. */
    pushed: (row: ConfigRow) => void;
    /**
     * The slots of the rows a Save that landed wrote, whose drafts end once the file holds them.
     */
    saved: (slots: readonly Slot[]) => void;
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
    /** The slots of the rows a landed Save wrote whose drafts have not ended yet. */
    const written: Slot[] = [];
    /** The row each draft was last edited or pushed with, by the key the row is kept under. */
    const seen = new Map<string, ConfigRow>();
    let closed = false;

    /** Whether a landed Save wrote the row's draft. */
    function wrote(row: ConfigRow): boolean {
        const slot = slotOf(row);
        return written.some((one) => inSlot(one, slot));
    }

    /** Forget what the writer kept of a row whose draft ends. */
    function forget(row: ConfigRow): void {
        const slot = slotOf(row);
        const at = written.findIndex((one) => inSlot(one, slot));
        if (at >= 0) written.splice(at, 1);
        seen.delete(heldKey(row));
    }

    function save(row: ConfigRow, draft: Draft): void {
        if (closed || row.blocked !== undefined) return;
        seen.set(heldKey(row), row);
        const made = draftValue(draft, row, hooks.lists(row));
        if (made.ok) saying.delete(heldKey(row));
        if (made.ok && !holdsValue(made.value, row)) hooks.stage.set(row, made.value);
        else if (hooks.stage.held(row) !== undefined) hooks.stage.withdraw(row);
        else if (!made.ok) return;
        hooks.changed();
    }

    function discard(row: ConfigRow): void {
        if (closed) return;
        saying.delete(heldKey(row));
        forget(row);
        if (hooks.stage.held(row) !== undefined) hooks.stage.drop(row);
        hooks.ended(row);
        hooks.changed();
    }

    function reset(row: ConfigRow): void {
        if (closed || row.blocked !== undefined || !writtenWhole(row.control)) return;
        if (row.own) hooks.stage.reset(row);
        else hooks.stage.withdraw(row);
        forget(row);
        hooks.ended(row);
        hooks.changed();
    }

    function pushed(row: ConfigRow): void {
        const draft = hooks.held(row);
        if (closed || draft === undefined) return;
        seen.set(heldKey(row), row);
        if (!drawsEditor(row)) {
            saying.set(heldKey(row), message('draftDropped'));
        } else {
            const made = draftValue(draft, row, hooks.lists(row));
            const unheld = hooks.stage.held(row) === undefined;
            if (made.ok && !holdsValue(made.value, row)) {
                // A draft the tab kept over a reload holds its change again, unless the file has
                // moved from the value it was started over or a landed Save wrote it, the file
                // then holding the value the Save replaced until the push of the value written.
                if (unheld && !hooks.stale(row) && !wrote(row)) {
                    hooks.stage.set(row, made.value);
                    hooks.changed();
                }
                return;
            }
            if (!made.ok || !unheld) return;
        }
        forget(row);
        hooks.ended(row);
        hooks.changed();
    }

    function saved(slots: readonly Slot[]): void {
        if (closed) return;
        for (const slot of slots) {
            if (!written.some((one) => inSlot(one, slot))) written.push(slot);
        }
        // Each row written is pushed again as it was last edited or pushed: a push that brought
        // the value written ahead of the answer found the change held and kept the draft.
        const rows = [...seen.values()].filter((row) => {
            const slot = slotOf(row);
            return slots.some((one) => inSlot(one, slot));
        });
        for (const row of rows) pushed(row);
    }

    return {
        save,
        discard,
        reset,
        pushed,
        saved,
        shown: (row) => heldValue(row, hooks.stage.held(row)),
        said: (row) => saying.get(heldKey(row)) ?? null,
        unsaved: (row) => hooks.stage.held(row) !== undefined,
        clear: (row) => {
            if (saying.delete(heldKey(row))) hooks.changed();
        },
        close: () => {
            closed = true;
            written.length = 0;
            seen.clear();
        }
    };
}
