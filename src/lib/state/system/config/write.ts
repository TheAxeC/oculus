// Layer 2, client state. What the Settings view writes. `commit` turns what a control holds (the
// text of a field, the boolean of a toggle, the word of a choice, the hex of a colour) into the
// value to write, or into the message saying why nothing is written; the rules are the control's
// own (editors/fields.ts). `createRowWriter` is the write sequence of the rows of one view: it
// sends a value through the `writeConfigKey` it is given, and a Reset through the `resetConfig`,
// which takes the user's value out of its file; it reads the answer by its shape, and keeps for
// each row the message, the value the control shows while the write is out and the last value
// sent. It is a plain closure with no runes; the view hands it a callback that redraws.
//
// A row with a hub other than the primary chosen (`row.hub`) names that hub in its write and its
// Reset, and what the sequence keeps for it is kept apart from the same key with another hub
// chosen. A row that says why it writes nothing (`row.blocked`) sends nothing.
//
// A value that equals the one in force and equals the last value sent for the key is not sent. A
// later write of a key supersedes an earlier one, so the answer of the earlier, arriving after,
// changes nothing the later set. A view that is closed ignores every answer still on its way.

import { isEqual } from 'lodash-es';
import type { WriteAnswer } from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { commitValue, type Committed } from './editors/fields.ts';
import type { Lists } from './editors/sources.ts';
import { message, type Message } from './messages.ts';
import type { ConfigRow } from './rows.ts';

/**
 * The write of one option: the client writes store's `writeConfigKey`. `root` names the hub whose
 * settings file takes it, and is left out for the primary.
 */
export type WriteConfigKey = (
    file: string,
    key: string,
    value: unknown,
    copy?: boolean,
    root?: string
) => Promise<WriteAnswer>;

/** The reset of one option: the client writes store's `resetConfig`, `root` as for a write. */
export type ResetConfig = (file: string, key: string, root?: string) => Promise<WriteAnswer>;

export { type Committed } from './editors/fields.ts';

/**
 * The name the writes keep a row's state under: the row's id, with the hub its drafts are kept
 * under when there is one (`row.slot`), so one key with two hubs chosen holds two states.
 */
export function heldKey(row: ConfigRow): string {
    return row.slot === undefined ? row.id : JSON.stringify([row.id, row.slot]);
}

/**
 * The value a control's input makes for a row, or why none is: the rules of the row's control
 * (editors/fields.ts), over the lists the page holds.
 */
export function commit(row: ConfigRow, input: string | boolean, lists: Lists): Committed {
    return commitValue(row.entry, input, lists);
}

/** The message an answer earns, or null when it wrote or changed nothing and has nothing to say. */
export function answered(answer: WriteAnswer, row: ConfigRow): Message | null {
    if (answer.refused.length > 0) {
        return message('refused', answer.refused.map((one) => one.reason).join('; '));
    }
    if (answer.ok) return null;
    if (answer.network === true) return message('network');
    if (answer.error === t('app.write_timed_out')) return message('timedOut');
    if (answer.error === 'unwritable') return message('unwritable', row.file);
    return message('failed', answer.error ?? '');
}

/** The write sequence of the rows of one view. */
export type RowWriter = {
    /** Write what a control holds for a row, or say why it is not written. */
    submit: (row: ConfigRow, input: string | boolean) => Promise<void>;
    /** Take the user's value of the row out of its file, so the default is in force. */
    reset: (row: ConfigRow) => Promise<void>;
    /** The value the control shows while a write is out and until the file holds it. */
    shown: (row: ConfigRow) => unknown;
    /**
     * Whether a write of the row is out and the file does not hold it yet, so `shown` stands even
     * when it is undefined, as it is while a reset of a key the defaults leave out is out.
     */
    pending: (row: ConfigRow) => boolean;
    /** The message under the row, or null. */
    said: (row: ConfigRow) => Message | null;
    /** Take the message of a row away. */
    clear: (row: ConfigRow) => void;
    /** End the sequence: nothing is sent, and no answer on its way changes anything. */
    close: () => void;
};

/**
 * Open the write sequence of a view. `changed` is called whenever what a row shows moves, and
 * `lists` answers the lists the controls of a row draw from when a value is checked, which are the
 * chosen hub's for a row with a hub chosen.
 */
export function createRowWriter(
    write: WriteConfigKey,
    reset: ResetConfig,
    changed: () => void,
    lists: (row: ConfigRow) => Lists
): RowWriter {
    const sequence = new Map<string, number>();
    const last = new Map<string, unknown>();
    const showing = new Map<string, { value: unknown; base: unknown }>();
    const saying = new Map<string, Message>();
    let closed = false;
    /** Whether the sequence was closed, read afresh after every wait. */
    const stopped = (): boolean => closed;

    /** The write or the reset of a row, naming the hub chosen on it unless that is the primary. */
    function sendTo(row: ConfigRow, value: unknown, resetting: boolean): Promise<WriteAnswer> {
        if (row.hub === undefined) {
            return resetting ? reset(row.file, row.key) : write(row.file, row.key, value);
        }
        return resetting
            ? reset(row.file, row.key, row.hub)
            : write(row.file, row.key, value, false, row.hub);
    }

    /**
     * Send a value, or with `resetting` the reset, which shows the default while it is out. A
     * reset is sent while the file holds the key, whatever the value in force is.
     */
    async function send(row: ConfigRow, value: unknown, resetting = false): Promise<void> {
        if (closed || row.blocked !== undefined) return;
        const key = heldKey(row);
        const sent = !last.has(key) || isEqual(last.get(key), value);
        if (resetting ? !row.own : isEqual(value, row.value) && sent) return;
        const turn = (sequence.get(key) ?? 0) + 1;
        sequence.set(key, turn);
        last.set(key, value);
        showing.set(key, { value, base: row.value });
        saying.delete(key);
        changed();
        const answer = await sendTo(row, value, resetting);
        if (stopped() || sequence.get(key) !== turn) return;
        const said = answered(answer, row);
        if (said !== null) {
            saying.set(key, said);
            showing.delete(key);
        }
        changed();
    }

    async function submit(row: ConfigRow, input: string | boolean): Promise<void> {
        if (closed || row.blocked !== undefined) return;
        const made = commit(row, input, lists(row));
        if (made.write) return send(row, made.value);
        if (made.said !== undefined) {
            saying.set(heldKey(row), made.said);
            changed();
        }
    }

    function shown(row: ConfigRow): unknown {
        const key = heldKey(row);
        const held = showing.get(key);
        if (held === undefined) return undefined;
        if (!isEqual(held.base, row.value)) {
            showing.delete(key);
            return undefined;
        }
        return held.value;
    }

    function pending(row: ConfigRow): boolean {
        const held = showing.get(heldKey(row));
        return held !== undefined && isEqual(held.base, row.value);
    }

    function clear(row: ConfigRow): void {
        if (saying.delete(heldKey(row))) changed();
    }

    return {
        submit,
        reset: (row) => send(row, row.default, true),
        shown,
        pending,
        said: (row) => saying.get(heldKey(row)) ?? null,
        clear,
        close: () => {
            closed = true;
        }
    };
}
