// Layer 2, client state. The order a collection's cards are drawn in (`cardOrder`): the pinned
// entries first, then by the `sort:` of the collection's `collections:` entry, then in the file's
// order. Each field of a sort compares by its line in the file's `schema:`: the status field in the
// order of its options, a `date` field oldest first, a `period` field newest first by the period
// reader of data/helpers/dates.ts, and any other field by its text. No rune and no store here, so
// the order is checked without a browser.

import { periodValueOrder } from '../../../data/helpers/dates.ts';
import { optionKeys, type Entry, type SchemaField } from '../../../data/model/index.ts';
import { entryWords } from '../../shared/page/idents.ts';
import { stageRank } from '../board/presets.ts';
import { STATUS_FIELD, isPinned } from './index.ts';

/**
 * The one comparison of the texts a card list is sorted by: English, so the order is the same in
 * every reader's locale, with case and accents ignored and the digits of a text read as a number,
 * so `2` sorts before `10`.
 */
const CARD_COLLATOR = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * The text a field's value sorts by: a text, a number as its text, a list by its first item's text;
 * undefined for no value, an empty text, a map, an empty list and anything else, which sorts after
 * every value.
 */
function sortText(value: unknown): string | undefined {
    const one: unknown = Array.isArray(value) ? value[0] : value;
    const text =
        typeof one === 'number' && Number.isFinite(one)
            ? String(one)
            : typeof one === 'string'
              ? one
              : '';
    return text.trim() === '' ? undefined : text;
}

/** How two entries compare on one sort; 0 leaves them to the next. */
type CardCompare = (left: Entry, right: Entry) => number;

/** Two texts compared by `compare`, a missing one after the other. */
function filledFirst(
    left: string | undefined,
    right: string | undefined,
    compare: (left: string, right: string) => number
): number {
    if (left === undefined || right === undefined) {
        return left === right ? 0 : left === undefined ? 1 : -1;
    }
    return compare(left, right);
}

/**
 * How one field of a sort compares two entries, by the field's line in the schema: the status field
 * in the order of its options, a value they do not hold after the ones they hold; a field of the
 * type `date` by its text, oldest first; a field of the type `period` by the period reader's order,
 * newest first, a value the reader refuses after the periods and no value last; and any other
 * field, and a status field with no options, by `CARD_COLLATOR`.
 */
function fieldCompare(field: string, schema: SchemaField[] | undefined): CardCompare {
    const declared = schema?.find((one) => one.field === field);
    if (declared?.type === 'period') {
        return (left, right) => periodValueOrder(left.fields[field], right.fields[field]);
    }
    const options = field === STATUS_FIELD ? optionKeys(declared) : [];
    const texts =
        declared?.type === 'date'
            ? (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0)
            : (left: string, right: string): number =>
                  stageRank(left, options) - stageRank(right, options) ||
                  CARD_COLLATOR.compare(left, right);
    return (left, right) =>
        filledFirst(sortText(left.fields[field]), sortText(right.fields[field]), texts);
}

/**
 * The order a collection's cards are drawn in: the pinned entries first, then the others, each
 * group by the fields of `sort` (its `collections:` entry's `sort:`) read left to right, then in
 * the file's order. A field the schema does not name is left out, which the schema check reports
 * (data/snapshot/schema/run.ts); a file with no schema reads every field. With no field left, the
 * cards go by the words they are headed by (`entryWords`), by `CARD_COLLATOR`. An entry that holds
 * no value of a field goes after those that hold one. The sort is stable, so the file's order
 * breaks every tie.
 */
export function cardOrder(
    entries: readonly Entry[],
    sort: readonly string[] | undefined,
    schema: SchemaField[] | undefined
): Entry[] {
    const named = schema === undefined ? null : new Set(schema.map((one) => one.field));
    const fields = (sort ?? []).filter((field) => named === null || named.has(field));
    const words: CardCompare = (left, right) =>
        filledFirst(sortText(entryWords(left)), sortText(entryWords(right)), (one, other) =>
            CARD_COLLATOR.compare(one, other)
        );
    const compares = fields.length === 0 ? [words] : fields.map((one) => fieldCompare(one, schema));
    const pinned = (entry: Entry): number => (isPinned(entry) ? 0 : 1);
    return [...entries].sort((left, right) => {
        let order = pinned(left) - pinned(right);
        for (const compare of compares) order ||= compare(left, right);
        return order;
    });
}
