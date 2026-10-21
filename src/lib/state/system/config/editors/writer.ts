// Layer 2, client state. The write sequence of the list and family editors of one view. A Save
// sends one `config-value` with the whole value and the row's value in force as its base, and a
// Reset one `config-reset`, which takes the user's value out of its file so the default is in
// force; the server then answers, and the config channel pushes the new value in force, which the
// view hands to `pushed`. An answer that the value sent is in force ends the draft and marks the
// row saved, which the editor says until the row is edited or sent again, as the rail list's Save
// says it; the editor shows the value sent (`shown`, the default for a Reset) until the push brings
// it. A refusal or a failure keeps the draft and says why.
//
// While a write is out the editor shows the draft and a second Save waits. A push that lands before
// the answer carrying the value sent ends the draft and marks the row saved as the answer does. A
// push carrying another value than the one sent and the one it was based on, which means the file
// changed in the meantime, ends the draft, or the value shown, with the sentence that it did. A
// push that leaves the row in a form the editor does not draw ends the draft the tab holds of it,
// with the sentence that it was dropped, since a draft with no editor cannot be saved or discarded.
// A closed sequence sends nothing, says nothing and moves no state. It is a plain closure with no
// runes; the view hands it a callback that redraws, one that drops a draft, one that says whether
// the tab holds a draft of a row, and the lists the draft's fields are checked against before it is
// sent.

import { sameInOrder } from '../../../../data/helpers/guards.ts';
import type { WriteAnswer } from '../../../shared/stores/shapes.ts';
import { message, type Message } from '../messages.ts';
import { writtenWhole, type ConfigRow } from '../rows.ts';
import { answered, type ResetConfig } from '../write.ts';
import { draftValue, type Draft } from './draft.ts';
import type { Lists } from './sources.ts';
import { drawsEditor } from './slots.ts';

/** The write of one list or family: the client writes store's `writeConfigValue`. */
export type WriteConfigValue = (
    file: string,
    key: string,
    value: unknown,
    base: unknown
) => Promise<WriteAnswer>;

/**
 * What the view gives the sequence: the reset, a redraw, the end of a row's draft, whether one is
 * held and the lists the controls draw from.
 */
export type EditorHooks = {
    reset: ResetConfig;
    changed: () => void;
    ended: (row: ConfigRow) => void;
    held: (row: ConfigRow) => boolean;
    lists: () => Lists;
};

/** The write sequence of the editors of a view. */
export type EditorWriter = {
    /** Send the draft of a row, unless it is equal to the file, does not read back or is out. */
    save: (row: ConfigRow, draft: Draft) => Promise<void>;
    /** Take the user's value of a list, multi, parked list or family out of its file. */
    reset: (row: ConfigRow) => Promise<void>;
    /** The row as the file holds it now: ends the draft the file has taken, overtaken or left. */
    pushed: (row: ConfigRow) => void;
    /** Whether a write of the row is out and not answered. */
    sending: (row: ConfigRow) => boolean;
    /**
     * The value the file answered it holds for the row, while the push has not brought it yet, and
     * undefined otherwise: what the editor shows in place of the row's value.
     */
    shown: (row: ConfigRow) => unknown;
    /** The sentence under the row, or null. */
    said: (row: ConfigRow) => Message | null;
    /** Whether the file took the row's last write, until the row is edited or sent again. */
    saved: (row: ConfigRow) => boolean;
    /** Take the sentence of a row, and its saved mark, away. */
    clear: (row: ConfigRow) => void;
    /** End the sequence: nothing is sent, and nothing on its way changes anything. */
    close: () => void;
};

/** One write of a row: what was sent and the value it was based on. */
type Out = { sent: unknown; base: unknown; turn: number };

/** Open the write sequence of a view's editors. */
export function createEditorWriter(write: WriteConfigValue, hooks: EditorHooks): EditorWriter {
    const out = new Map<string, Out>();
    /** The writes the file has answered for and the push has not brought yet. */
    const landed = new Map<string, Out>();
    const saying = new Map<string, Message>();
    const taken = new Set<string>();
    let turns = 0;
    let closed = false;
    /** Whether the sequence was closed, read afresh after every wait. */
    const stopped = (): boolean => closed;

    /** Send a whole value, or with `resetting` the reset, whose value in force is the default. */
    async function send(row: ConfigRow, value: unknown, resetting = false): Promise<void> {
        if (closed || out.has(row.id)) return;
        turns += 1;
        const turn = turns;
        out.set(row.id, { sent: value, base: row.value, turn });
        landed.delete(row.id);
        saying.delete(row.id);
        taken.delete(row.id);
        hooks.changed();
        const answer = resetting
            ? await hooks.reset(row.file, row.key)
            : await write(row.file, row.key, value, row.value);
        if (stopped() || out.get(row.id)?.turn !== turn) return;
        const said = answered(answer, row);
        if (said !== null) {
            saying.set(row.id, said);
            out.delete(row.id);
        } else {
            const held = out.get(row.id);
            out.delete(row.id);
            if (held !== undefined && answer.changed.length > 0) {
                landed.set(row.id, held);
                taken.add(row.id);
            }
            hooks.ended(row);
        }
        hooks.changed();
    }

    async function save(row: ConfigRow, draft: Draft): Promise<void> {
        const made = draftValue(draft, row, hooks.lists());
        if (!made.ok || sameInOrder(made.value, row.value)) return;
        return send(row, made.value);
    }

    async function reset(row: ConfigRow): Promise<void> {
        if (!writtenWhole(row.control) || !row.own) return;
        return send(row, row.default, true);
    }

    function pushed(row: ConfigRow): void {
        if (closed) return;
        if (hooks.held(row) && !drawsEditor(row)) {
            out.delete(row.id);
            saying.set(row.id, message('draftDropped'));
            hooks.ended(row);
            hooks.changed();
            return;
        }
        const answeredFor = landed.get(row.id);
        if (answeredFor !== undefined) {
            if (sameInOrder(row.value, answeredFor.base)) return;
            landed.delete(row.id);
            if (!sameInOrder(row.value, answeredFor.sent)) {
                taken.delete(row.id);
                saying.set(row.id, message('changedSince', row.file));
            }
            hooks.changed();
            return;
        }
        const held = out.get(row.id);
        if (held === undefined) return;
        if (sameInOrder(row.value, held.sent)) {
            out.delete(row.id);
            taken.add(row.id);
            hooks.ended(row);
        } else if (sameInOrder(row.value, held.base)) {
            return;
        } else {
            out.delete(row.id);
            saying.set(row.id, message('changedSince', row.file));
            hooks.ended(row);
        }
        hooks.changed();
    }

    return {
        save,
        reset,
        pushed,
        sending: (row) => out.has(row.id),
        shown: (row) => landed.get(row.id)?.sent,
        said: (row) => saying.get(row.id) ?? null,
        saved: (row) => taken.has(row.id),
        clear: (row) => {
            const said = saying.delete(row.id);
            if (taken.delete(row.id) || said) hooks.changed();
        },
        close: () => {
            closed = true;
        }
    };
}
