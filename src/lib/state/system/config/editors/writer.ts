// Layer 2, client state. The write sequence of the list and family editors of one view. A Save
// sends one `config-value` with the whole value and the row's value as its base; the file then
// answers, and the watcher pushes the file's new text, which the view hands to `pushed`. The draft
// stays on screen until the file holds what was sent: the answer alone ends nothing but a refusal
// or a failure, which keep the draft and say why.
//
// While a write is out the editor shows the draft and a second Save waits. A push carrying the
// value sent ends the draft; a push carrying another value, which means the file changed in the
// meantime, ends it with the sentence that it did. A push that lands before the answer is the same
// push. A push that leaves the row in a form the editor does not draw ends the draft the tab holds
// of it, with the sentence that it was dropped, since a draft with no editor cannot be saved or
// discarded. A closed sequence sends nothing, says nothing and moves no state. It is a plain
// closure with no runes; the view hands it a callback that redraws, one that drops a draft and one
// that says whether the tab holds a draft of a row.

import { sameInOrder } from '../../../../data/helpers/guards.ts';
import type { WriteAnswer } from '../../../shared/stores/shapes.ts';
import { message, type Message } from '../messages.ts';
import type { ConfigRow } from '../rows.ts';
import { answered } from '../write.ts';
import { draftValue, type Draft } from './draft.ts';
import { drawsEditor } from './slots.ts';

/** The write of one list or family: the client writes store's `writeConfigValue`. */
export type WriteConfigValue = (
    file: string,
    key: string,
    value: unknown,
    base: unknown
) => Promise<WriteAnswer>;

/** What the view gives the sequence: a redraw, the end of a row's draft and whether one is held. */
export type EditorHooks = {
    changed: () => void;
    ended: (row: ConfigRow) => void;
    held: (row: ConfigRow) => boolean;
};

/** The write sequence of the editors of a view. */
export type EditorWriter = {
    /** Send the draft of a row, unless it is equal to the file, does not read back or is out. */
    save: (row: ConfigRow, draft: Draft) => Promise<void>;
    /** Write the catalog default of a Modified list. */
    reset: (row: ConfigRow) => Promise<void>;
    /** The row as the file holds it now: ends the draft the file has taken, overtaken or left. */
    pushed: (row: ConfigRow) => void;
    /** Whether a write of the row is out or waiting for the file to hold it. */
    sending: (row: ConfigRow) => boolean;
    /** The sentence under the row, or null. */
    said: (row: ConfigRow) => Message | null;
    /** Take the sentence of a row away. */
    clear: (row: ConfigRow) => void;
    /** End the sequence: nothing is sent, and nothing on its way changes anything. */
    close: () => void;
};

/** One write of a row: what was sent and the value it was based on. */
type Out = { sent: unknown; base: unknown; turn: number };

/** Open the write sequence of a view's editors. */
export function createEditorWriter(write: WriteConfigValue, hooks: EditorHooks): EditorWriter {
    const out = new Map<string, Out>();
    const saying = new Map<string, Message>();
    let turns = 0;
    let closed = false;
    /** Whether the sequence was closed, read afresh after every wait. */
    const stopped = (): boolean => closed;

    async function send(row: ConfigRow, value: unknown): Promise<void> {
        if (closed || out.has(row.id)) return;
        turns += 1;
        const turn = turns;
        out.set(row.id, { sent: value, base: row.value, turn });
        saying.delete(row.id);
        hooks.changed();
        const answer = await write(row.file, row.key, value, row.value);
        if (stopped() || out.get(row.id)?.turn !== turn) return;
        const said = answered(answer, row);
        if (said !== null) {
            saying.set(row.id, said);
            out.delete(row.id);
        } else if (answer.changed.length === 0) {
            out.delete(row.id);
            hooks.ended(row);
        }
        hooks.changed();
    }

    async function save(row: ConfigRow, draft: Draft): Promise<void> {
        const made = draftValue(draft);
        if (!made.ok || sameInOrder(made.value, row.value)) return;
        return send(row, made.value);
    }

    async function reset(row: ConfigRow): Promise<void> {
        if (row.control !== 'list' || row.state !== 'set' || !row.modified) return;
        return send(row, row.default);
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
        const held = out.get(row.id);
        if (held === undefined) return;
        if (sameInOrder(row.value, held.sent)) {
            out.delete(row.id);
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
        said: (row) => saying.get(row.id) ?? null,
        clear: (row) => {
            if (saying.delete(row.id)) hooks.changed();
        },
        close: () => {
            closed = true;
        }
    };
}
