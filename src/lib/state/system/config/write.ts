// Layer 2, client state. What the Settings view writes. `commit` turns what a control holds (the
// text of a field, the boolean of a toggle, the word of a choice) into the value to write, or into
// the message saying why nothing is written. `createRowWriter` is the write sequence of the rows of
// one view: it sends a value through the `writeConfigKey` it is given, reads the answer by its
// shape, and keeps for each row the message, the value the control shows while the write is out and
// the last value sent. It is a plain closure with no runes; the view hands it a callback that
// redraws.
//
// A value that equals the file's and equals the last value sent for the key is not sent. A later
// write of a key supersedes an earlier one, so the answer of the earlier, arriving after, changes
// nothing the later set. A view that is closed ignores every answer still on its way.

import { isEqual } from 'lodash-es';
import type { WriteAnswer } from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { message, type Message } from './messages.ts';
import type { ConfigRow } from './rows.ts';

/** The write of one option: the client writes store's `writeConfigKey`. */
export type WriteConfigKey = (file: string, key: string, value: unknown) => Promise<WriteAnswer>;

/**
 * A decimal number: an optional minus, digits with an optional point or a point and digits, and an
 * optional exponent.
 */
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

/**
 * The number a text is as a decimal, or null when it is not one: the trimmed text must match the
 * pattern above and give a finite number, and `-0` is `0`. The one reading of a number's text,
 * which a config number row and the terminal text size box of the "This browser" rows share.
 */
export function decimalOf(input: string): number | null {
    const trimmed = input.trim();
    const number = Number(trimmed);
    if (!DECIMAL.test(trimmed) || !Number.isFinite(number)) return null;
    return Object.is(number, -0) ? 0 : number;
}

/** The value to write, or why none is. */
export type Committed =
    { write: true; value: string | number | boolean } | { write: false; said?: Message };

/**
 * The value a control's input makes for a row. A number's trimmed text must be a decimal that gives
 * a finite number, and `-0` is written as `0`; empty text writes nothing and says so. A text is
 * written as it is. A toggle gives its boolean. A choice gives one of its words, and the empty
 * choice writes nothing.
 */
export function commit(row: ConfigRow, input: string | boolean): Committed {
    if (row.control === 'toggle') {
        return typeof input === 'boolean' ? { write: true, value: input } : { write: false };
    }
    if (typeof input !== 'string') return { write: false };
    if (row.control === 'text') return { write: true, value: input };
    if (row.control === 'choice') {
        return row.values.includes(input) ? { write: true, value: input } : { write: false };
    }
    if (row.control !== 'number') return { write: false };
    if (input.trim() === '') return { write: false, said: message('empty') };
    const number = decimalOf(input);
    return number === null
        ? { write: false, said: message('notNumber') }
        : { write: true, value: number };
}

/** The message an answer earns, or null when it wrote or changed nothing and has nothing to say. */
function answered(answer: WriteAnswer, row: ConfigRow): Message | null {
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
    /** Write the row's default. */
    reset: (row: ConfigRow) => Promise<void>;
    /** The value the control shows while a write is out and until the file holds it. */
    shown: (row: ConfigRow) => unknown;
    /** The message under the row, or null. */
    said: (row: ConfigRow) => Message | null;
    /** Take the message of a row away. */
    clear: (row: ConfigRow) => void;
    /** End the sequence: nothing is sent, and no answer on its way changes anything. */
    close: () => void;
};

/** Open the write sequence of a view. `changed` is called whenever what a row shows moves. */
export function createRowWriter(write: WriteConfigKey, changed: () => void): RowWriter {
    const sequence = new Map<string, number>();
    const last = new Map<string, unknown>();
    const showing = new Map<string, { value: unknown; base: unknown }>();
    const saying = new Map<string, Message>();
    let closed = false;
    /** Whether the sequence was closed, read afresh after every wait. */
    const stopped = (): boolean => closed;

    async function send(row: ConfigRow, value: unknown): Promise<void> {
        if (closed || row.state === 'missing') return;
        const key = row.id;
        const sent = !last.has(key) || isEqual(last.get(key), value);
        if (isEqual(value, row.value) && sent) return;
        const turn = (sequence.get(key) ?? 0) + 1;
        sequence.set(key, turn);
        last.set(key, value);
        showing.set(key, { value, base: row.value });
        saying.delete(key);
        changed();
        const answer = await write(row.file, row.key, value);
        if (stopped() || sequence.get(key) !== turn) return;
        const said = answered(answer, row);
        if (said !== null) {
            saying.set(key, said);
            showing.delete(key);
        }
        changed();
    }

    async function submit(row: ConfigRow, input: string | boolean): Promise<void> {
        if (closed) return;
        const made = commit(row, input);
        if (made.write) return send(row, made.value);
        if (made.said !== undefined) {
            saying.set(row.id, made.said);
            changed();
        }
    }

    function shown(row: ConfigRow): unknown {
        const held = showing.get(row.id);
        if (held === undefined) return undefined;
        if (!isEqual(held.base, row.value)) {
            showing.delete(row.id);
            return undefined;
        }
        return held.value;
    }

    function clear(row: ConfigRow): void {
        if (saying.delete(row.id)) changed();
    }

    return {
        submit,
        reset: (row) => send(row, row.default),
        shown,
        said: (row) => saying.get(row.id) ?? null,
        clear,
        close: () => {
            closed = true;
        }
    };
}
