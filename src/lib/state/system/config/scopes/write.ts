// Layer 2, client state. What the Settings view does with a value a control holds: `commit` turns
// it (the text of a field, the boolean of a toggle, the word of a choice, the hex of a colour) into
// the value of the row, or into the message saying why it is not one, by the control's own rules
// (editors/fields.ts); `createRowWriter` holds the value as an unsaved change of the scope on
// screen, through the `Stage` the view gives it, so nothing is written until the scope is saved.
// A Reset holds the taking out of the user's value, which a Save then takes out of its file.
//
// A value equal to the one the file gives the row, with no change held for it, holds nothing; one
// equal to it with a change held drops the change. The row shows the value held (`shown`), and is
// marked unsaved (`pending`) while one is held. A row that says why it writes nothing
// (`row.blocked`) holds nothing. It is a plain closure with no runes; the view hands it a callback
// that redraws. `answered` words the answer of a Save.

import { isEqual } from 'lodash-es';
import type { WriteAnswer } from '../../../shared/stores/shapes.ts';
import { t } from '../../../shared/words/text.ts';
import { commitValue, type Committed } from '../editors/fields.ts';
import type { Lists } from '../editors/sources.ts';
import { message, type Message } from '../messages.ts';
import type { ConfigRow } from '../rows.ts';

/**
 * The name the writers keep a row's state under: the row's id, with the hub it is kept under when
 * there is one (`row.slot`), so one key of two hubs holds two states.
 */
export function heldKey(row: ConfigRow): string {
    return row.slot === undefined ? row.id : JSON.stringify([row.id, row.slot]);
}

/**
 * The value a control's input makes for a row, or why none is: the rules of the row's control
 * (editors/fields.ts), over the lists the page holds.
 */
function commit(row: ConfigRow, input: string | boolean, lists: Lists): Committed {
    return commitValue(row.entry, input, lists, row.value);
}

/** The message an answer earns, or null when it wrote or changed nothing and has nothing to say. */
export function answered(answer: WriteAnswer, file: string): Message | null {
    if (answer.refused.length > 0) {
        return message('refused', answer.refused.map((one) => one.reason).join('; '));
    }
    if (answer.ok) return null;
    if (answer.network === true) return message('network');
    if (answer.error === t('app.write_timed_out')) return message('timedOut');
    if (answer.error === 'unwritable') return message('unwritable', file);
    return message('failed', answer.error ?? '');
}

/** What a row holds of its scope's unsaved changes. */
export type Held = { value: unknown } | { reset: true };

/** How the writers hold a row's change in the unsaved changes of the scope on screen. */
export type Stage = {
    /** Hold the row's value, with the value it replaces for a list or a family. */
    set: (row: ConfigRow, value: unknown) => void;
    /** Hold the taking out of the row's user value. */
    reset: (row: ConfigRow) => void;
    /** Drop the change the row holds. */
    drop: (row: ConfigRow) => void;
    /** The change the row holds, or undefined. */
    held: (row: ConfigRow) => Held | undefined;
};

/** The value a row shows for the change it holds: the value held, or the default for a reset. */
export function heldValue(row: ConfigRow, held: Held | undefined): unknown {
    if (held === undefined) return undefined;
    return 'reset' in held ? row.default : held.value;
}

/** The writes of the rows of one view. */
export type RowWriter = {
    /** Hold what a control holds for a row as a change, or say why it is not one. */
    submit: (row: ConfigRow, input: string | boolean) => void;
    /**
     * Hold the taking out of the user's value of the row, so the default is in force once saved.
     */
    reset: (row: ConfigRow) => void;
    /** The value the control shows while a change is held for the row. */
    shown: (row: ConfigRow) => unknown;
    /**
     * Whether a change is held for the row, so `shown` stands even when it is undefined, as it is
     * for a reset of a key the defaults leave out.
     */
    pending: (row: ConfigRow) => boolean;
    /** The message under the row, or null. */
    said: (row: ConfigRow) => Message | null;
    /** Take the message of a row away. */
    clear: (row: ConfigRow) => void;
    /** End the writer: nothing is held any more. */
    close: () => void;
};

/**
 * Open the writer of a view. `stage` holds a row's change in the scope on screen, `changed` is
 * called whenever what a row shows moves, and `lists` answers the lists the controls of a row draw
 * from when a value is checked.
 */
export function createRowWriter(
    stage: Stage,
    changed: () => void,
    lists: (row: ConfigRow) => Lists
): RowWriter {
    const saying = new Map<string, Message>();
    let closed = false;

    /** Hold a value, or drop the change when the value is the one the file gives the row. */
    function hold(row: ConfigRow, value: unknown): void {
        saying.delete(heldKey(row));
        if (!isEqual(value, row.value)) stage.set(row, value);
        else if (stage.held(row) !== undefined) stage.drop(row);
        changed();
    }

    function submit(row: ConfigRow, input: string | boolean): void {
        if (closed || row.blocked !== undefined) return;
        const made = commit(row, input, lists(row));
        if (made.write) {
            hold(row, made.value);
            return;
        }
        if (made.said !== undefined) {
            saying.set(heldKey(row), made.said);
            changed();
        }
    }

    function reset(row: ConfigRow): void {
        if (closed || row.blocked !== undefined) return;
        saying.delete(heldKey(row));
        if (row.own) stage.reset(row);
        else stage.drop(row);
        changed();
    }

    return {
        submit,
        reset,
        shown: (row) => heldValue(row, stage.held(row)),
        pending: (row) => stage.held(row) !== undefined,
        said: (row) => saying.get(heldKey(row)) ?? null,
        clear: (row) => {
            if (saying.delete(heldKey(row))) changed();
        },
        close: () => {
            closed = true;
        }
    };
}
