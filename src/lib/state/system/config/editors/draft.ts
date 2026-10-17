// Layer 2, client state, pure. The draft a list or family editor holds: the value the file holds at
// a key read into typed fields, the edits a press makes to it, and the value it reads back as.
//
// Every list, multi and family the Settings view edits has one of five forms. A list or parked
// option is `items`, one text per item. A multi option is `multi`, one card holding the picked
// words. A family whose fields are `key` and `value` is `pairs`, a key and a value per entry. Any
// other family is `records`: one card per record with a field per catalog field, the map's key
// being the card's `key` field when the file holds a map. The one family that is a map of lists of
// records (`tab_rollup`) is `rollup`: one group per key, each holding cards.
//
// A field is held as its typed value (fields.ts): a toggle as a boolean, a number as the box's
// text, a choice as its word, a multi as its words, a nested list of records as cards of its own.
// A field the record does not hold is absent from its card and is left out on Save; a nested list
// the record does not hold is an empty list of cards, and Save adds no key for it unless a card was
// added. A field holding a value its control cannot show, and a field the catalog does not name,
// are kept on the card as the file has them and sent back unchanged.
//
// A draft that does not read back is not an error: `draftValue` answers the problems, each with the
// message to word it, and Save waits until there are none. A draft the page held in the form that
// kept every field as one line of YAML flow text (flow.ts) is read into typed fields by
// `typedDraft`. The rail and the page reset, a row the file does not hold, a row flagged mismatch,
// a list holding anything but text and a family whose nested list holds anything but records have
// no draft.

import { isEqual } from 'lodash-es';
import { byKey, isMap, sameInOrder } from '../../../../data/helpers/guards.ts';
import type { FieldSpec } from '../../../../data/sources/config/catalog/options.ts';
import { message, type Message } from '../messages.ts';
import { PAGES_ROW, RAIL_ROW, WORKBENCH_ROW } from '../groups.ts';
import type { ConfigRow } from '../rows.ts';
import {
    cardOf,
    cardsFrom,
    cardsOf,
    controlOf,
    emptyCard,
    readField,
    troubleMessage,
    wordsOf,
    writtenField,
    type Card,
    type FieldValue,
    type Trouble
} from './fields.ts';
import { readFlow } from './flow.ts';
import type { Lists } from './sources.ts';

/** The draft of one row. */
export type Draft =
    | {
          form: 'items' | 'pairs' | 'records' | 'multi';
          keyed: boolean;
          fields: string[];
          cards: Card[];
      }
    | {
          form: 'rollup';
          fields: string[];
          groups: { key: string; cards: Card[] }[];
      };

/** One step down into a nested list: the card of the list above, and the field holding the list. */
export type Step = { index: number; field: string };

/** Where an edit lands: a roll-up's group and the nested lists below the card it starts from. */
type Where = { group?: number; path?: Step[] };

/** What a press does to a draft. */
export type Edit =
    | ({ do: 'add' } & Where)
    | ({ do: 'remove'; index: number } & Where)
    | ({ do: 'move'; index: number; by: number } & Where)
    | ({ do: 'set'; index: number; field: string; value: FieldValue | undefined } & Where)
    | { do: 'addGroup' }
    | { do: 'removeGroup'; group: number }
    | { do: 'moveGroup'; group: number; by: number }
    | { do: 'setGroup'; group: number; key: string };

/**
 * One thing the draft has to mend before it is sent. `index` counts from 0. `where` names the
 * entry and field when `said` does not.
 */
export type Problem = {
    index: number;
    group?: number;
    field?: string;
    said: Message;
    where?: Message;
};

/** The value a draft reads back as, or what stops it. */
export type Made = { ok: true; value: unknown } | { ok: false; problems: Problem[] };

type Plain = Record<string, unknown>;

/** Set an own key of a map, whatever its name: `__proto__` is a key here, not the prototype. */
function put(target: Plain, key: string, value: unknown): void {
    Object.defineProperty(target, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true
    });
}

/** Whether a family is a table of keys and values: its fields are exactly those two. */
function isTable(fields: string[]): boolean {
    return fields.length === 2 && fields.includes('key') && fields.includes('value');
}

/** The catalog fields of a row without the `key` field. */
function withoutKey(fields: Record<string, FieldSpec>): Record<string, FieldSpec> {
    return Object.fromEntries(Object.entries(fields).filter(([name]) => name !== 'key'));
}

/** The fields of a record card: the catalog's, `key` first when the file's map supplies it. */
function cardFields(row: ConfigRow, keyed: boolean): string[] {
    const names = Object.keys(row.fields);
    return keyed ? ['key', ...names.filter((name) => name !== 'key')] : names;
}

/** The specs the fields of a draft's cards are drawn and read by. */
export function specsOf(row: ConfigRow, form: Draft['form']): Record<string, FieldSpec> {
    if (form === 'items') {
        const control = row.entry.items === 'number' ? 'number' : 'text';
        const own = row.entry.form === undefined ? {} : { form: row.entry.form };
        return { item: { help: '', control, ...own } };
    }
    if (form === 'multi') return { value: { ...row.entry, control: 'multi' } };
    if (form === 'rollup') return withoutKey(row.fields);
    return row.fields;
}

/** A card holding one field. */
function single(name: string, value: FieldValue): Card {
    return { fields: { [name]: value }, kept: {}, order: [] };
}

/**
 * The draft of a row, or null when the row has no editor of this kind: it is not a list, a multi
 * or a family the file holds as one, it is the rail or the page reset, the file's value is not
 * what its control shows, or an item is not what the editor holds.
 */
export function draftOf(row: ConfigRow): Draft | null {
    if (row.state !== 'set' || row.mismatch) return null;
    if (row.id === RAIL_ROW || row.id === PAGES_ROW || row.id === WORKBENCH_ROW) return null;
    const value = row.value;
    if (row.control === 'list' || row.control === 'parked') {
        const read = readField(row.entry, value);
        if (read.kind !== 'value') return null;
        const items = wordsOf(read.value);
        if (row.entry.slots !== undefined && items.length !== row.entry.slots.length) return null;
        const cards = items.map((item) => single('item', item));
        return { form: 'items', keyed: false, fields: ['item'], cards };
    }
    if (row.control === 'multi') {
        const read = readField(row.entry, value);
        if (read.kind !== 'value') return null;
        return {
            form: 'multi',
            keyed: false,
            fields: ['value'],
            cards: [single('value', read.value)]
        };
    }
    if (row.control !== 'family') return null;
    const names = Object.keys(row.fields);
    if (Array.isArray(value)) {
        const cards = cardsFrom(value, row.fields);
        return cards === null ? null : { form: 'records', keyed: false, fields: names, cards };
    }
    if (!isMap(value)) return null;
    const entries = Object.entries(value);
    if (isTable(names)) {
        const cards: Card[] = [];
        for (const [key, held] of entries) {
            const read = readField(row.fields.value, held);
            const card: Card = { fields: { key }, kept: {}, order: [] };
            if (read.kind === 'value') card.fields.value = read.value;
            else card.kept.value = held;
            cards.push(card);
        }
        return { form: 'pairs', keyed: true, fields: ['key', 'value'], cards };
    }
    if (row.holds === 'lists') {
        const inner = withoutKey(row.fields);
        const groups: { key: string; cards: Card[] }[] = [];
        for (const [key, held] of entries) {
            if (!Array.isArray(held)) return null;
            const cards = cardsFrom(held, inner);
            if (cards === null) return null;
            groups.push({ key, cards });
        }
        return { form: 'rollup', fields: Object.keys(inner), groups };
    }
    const cards: Card[] = [];
    for (const [key, held] of entries) {
        if (!isMap(held)) return null;
        const card = cardOf(held, row.fields, key);
        if (card === null) return null;
        cards.push(card);
    }
    return { form: 'records', keyed: true, fields: cardFields(row, true), cards };
}

/** The cards of a draft or of one group of a roll-up, or null when `group` names none. */
function topCards(draft: Draft, group: number | undefined): Card[] | null {
    if (draft.form === 'rollup') {
        return group === undefined ? null : (draft.groups[group]?.cards ?? null);
    }
    return group === undefined ? draft.cards : null;
}

/** The draft with the cards of one place replaced. */
function withCards(draft: Draft, group: number | undefined, cards: Card[]): Draft {
    if (draft.form === 'rollup') {
        const groups = draft.groups.map((one, at) => (at === group ? { ...one, cards } : one));
        return { ...draft, groups };
    }
    return { ...draft, cards };
}

/** A list with one place changed by `change`, or the list itself when the place is not in it. */
function atIndex<T>(list: T[], index: number, change: (item: T) => T): T[] {
    if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
    return list.map((item, at) => (at === index ? change(item) : item));
}

/** A list with the item at `index` moved by `by` places, or the list itself when it cannot move. */
function moved<T>(list: T[], index: number, by: number): T[] {
    const to = index + by;
    const inside = Number.isInteger(index) && index >= 0 && index < list.length;
    if (!inside || !Number.isInteger(to) || to < 0 || to >= list.length || by === 0) return list;
    const next = [...list];
    const [taken] = next.splice(index, 1);
    next.splice(to, 0, taken);
    return next;
}

/** A list without the item at `index`, or the list itself when it holds none there. */
function without<T>(list: T[], index: number): T[] {
    if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
    return list.filter((_, at) => at !== index);
}

/** The cards with the list below a path changed by `change`. */
function inList(cards: Card[], path: Step[], change: (list: Card[]) => Card[]): Card[] {
    if (path.length === 0) return change(cards);
    const [step, ...rest] = path;
    return atIndex(cards, step.index, (card) => ({
        ...card,
        fields: {
            ...card.fields,
            [step.field]: inList(cardsOf(card.fields[step.field]), rest, change)
        }
    }));
}

/** A card with one field set, or the field taken out when the value is undefined. */
function withField(card: Card, field: string, value: FieldValue | undefined): Card {
    const rest = Object.fromEntries(Object.entries(card.fields).filter(([name]) => name !== field));
    return { ...card, fields: value === undefined ? rest : { ...rest, [field]: value } };
}

/**
 * The draft after one edit. The draft given is not changed; an edit of a place it lacks is none.
 */
export function applyEdit(draft: Draft, edit: Edit): Draft {
    if (edit.do === 'addGroup') {
        return draft.form === 'rollup'
            ? { ...draft, groups: [...draft.groups, { key: '', cards: [] }] }
            : draft;
    }
    if (edit.do === 'removeGroup' || edit.do === 'moveGroup' || edit.do === 'setGroup') {
        if (draft.form !== 'rollup') return draft;
        if (edit.do === 'removeGroup')
            return { ...draft, groups: without(draft.groups, edit.group) };
        if (edit.do === 'moveGroup') {
            return { ...draft, groups: moved(draft.groups, edit.group, edit.by) };
        }
        const key = edit.key;
        return { ...draft, groups: atIndex(draft.groups, edit.group, (one) => ({ ...one, key })) };
    }
    const cards = topCards(draft, edit.group);
    if (cards === null) return draft;
    const path = edit.path ?? [];
    if (edit.do === 'add') {
        if (draft.form === 'rollup' && edit.group === undefined) return draft;
        return withCards(
            draft,
            edit.group,
            inList(cards, path, (list) => [...list, emptyCard()])
        );
    }
    if (edit.do === 'remove') {
        return withCards(
            draft,
            edit.group,
            inList(cards, path, (list) => without(list, edit.index))
        );
    }
    if (edit.do === 'move') {
        return withCards(
            draft,
            edit.group,
            inList(cards, path, (list) => moved(list, edit.index, edit.by))
        );
    }
    if (path.length === 0 && !draft.fields.includes(edit.field)) return draft;
    const { field, value } = edit;
    return withCards(
        draft,
        edit.group,
        inList(cards, path, (list) =>
            atIndex(list, edit.index, (card) => withField(card, field, value))
        )
    );
}

// ---- reading a draft back ---------------------------------------------------------------------

/** What the file held at the fields of the records being written: the page's checks leave it be. */
type Base = {
    /** The records the file holds for the option, wherever they stand. */
    any: Plain[];
    /** The record at the same key of a map, or none. */
    same: Plain[];
};

/** The records of a held value: a list's, or every record of a map's lists. */
function recordsIn(held: unknown): Plain[] {
    if (Array.isArray(held)) return held.filter(isMap);
    if (!isMap(held)) return [];
    return Object.values(held).flatMap((one) => (Array.isArray(one) ? one.filter(isMap) : []));
}

/** The position of a problem in a draft: the entry, the group of a roll-up and the field. */
type Place = { index: number; group?: number; label: string };

/** A problem for a trouble found in a field of an entry. */
function problemOf(place: Place, name: string, trouble: Trouble): Problem {
    const at =
        place.group === undefined
            ? { index: place.index }
            : { index: place.index, group: place.group };
    if (trouble.is === 'type') {
        return { ...at, field: name, said: message('notYaml', place.label, name) };
    }
    return {
        ...at,
        field: name,
        where: message('where', place.label, name),
        said: troubleMessage(trouble)
    };
}

/** The values the file held at one field, among the records it is compared with. */
function heldAt(records: Plain[], name: string): unknown[] {
    return records.flatMap((one) => (Object.hasOwn(one, name) ? [one[name]] : []));
}

/**
 * The record one card makes: each field written by its spec, empty ones left out, then the fields
 * kept, in the order the file wrote them. `trust` lets the page's own checks pass every value,
 * which is how a record equal to one the file holds is built.
 */
function recordOf(
    card: Card,
    specs: Record<string, FieldSpec>,
    place: Place,
    base: Base,
    lists: Lists,
    trust: boolean,
    problems: Problem[]
): Plain {
    const made: Plain = {};
    for (const [name, spec] of Object.entries(specs)) {
        const held = byKey(card.fields, name);
        if (held === undefined) continue;
        if (controlOf(spec) === 'records') {
            const nested = cardsOf(held);
            const inner: Base = { any: recordsIn(heldAt(base.any, name)), same: [] };
            made[name] = nested.map((one, at) =>
                childOf(
                    one,
                    spec.fields ?? {},
                    { ...place, label: `${place.label}, ${name} ${at + 1}` },
                    inner,
                    lists,
                    trust,
                    problems
                )
            );
            continue;
        }
        const reading = {
            lists,
            record: card.fields,
            held: heldAt(base.same, name),
            trust
        };
        const written = writtenField(spec, held, reading);
        if (!written.ok) problems.push(problemOf(place, name, written.trouble));
        else if (written.value !== undefined) made[name] = written.value;
    }
    for (const name of Object.keys(card.unread ?? {})) {
        problems.push(problemOf(place, name, { is: 'type' }));
    }
    const all: Plain = { ...made, ...card.kept };
    const ordered: Plain = {};
    for (const name of card.order) if (Object.hasOwn(all, name)) put(ordered, name, all[name]);
    for (const name of Object.keys(all))
        if (!Object.hasOwn(ordered, name)) put(ordered, name, all[name]);
    return ordered;
}

/**
 * A record that equals one the file holds passes whole, wherever it stands; any other is written
 * with each of its fields checked, but for the fields whose value the file held at that field.
 */
function childOf(
    card: Card,
    specs: Record<string, FieldSpec>,
    place: Place,
    base: Base,
    lists: Lists,
    trust: boolean,
    problems: Problem[]
): Plain {
    if (!trust) {
        const quiet: Problem[] = [];
        const whole = recordOf(card, specs, place, base, lists, true, quiet);
        if (quiet.length === 0 && base.any.some((one) => isEqual(one, whole))) return whole;
    }
    return recordOf(card, specs, place, base, lists, trust, problems);
}

/** The base of one card: the record at its key when the file holds a map, else every record. */
function baseOf(row: ConfigRow, key: string | undefined, groupKey?: string): Base {
    const any = recordsIn(row.value);
    if (key !== undefined && isMap(row.value)) {
        const held = row.value[key];
        return { any, same: isMap(held) ? [held] : [] };
    }
    if (groupKey !== undefined && isMap(row.value)) {
        const held = row.value[groupKey];
        return { any, same: Array.isArray(held) ? held.filter(isMap) : [] };
    }
    return { any, same: any };
}

/** The names of the keys of a list of cards, with the problems of an empty or a repeated one. */
function keysOf(cards: Card[], group: number | undefined, problems: Problem[]): string[] {
    const seen = new Set<string>();
    return cards.map((card, index) => {
        const raw = card.fields.key;
        const key = (typeof raw === 'string' ? raw : '').trim();
        const at = group === undefined ? { index } : { index, group };
        if (key === '') {
            problems.push({ ...at, field: 'key', said: message('emptyKey', index + 1) });
        } else if (seen.has(key)) {
            problems.push({ ...at, field: 'key', said: message('duplicateKey', key) });
        }
        seen.add(key);
        return key;
    });
}

/**
 * The problems of the keys whose text has not the form the key's spec gives (`open.program_ext`'s
 * extension with its dot), named by the entry and the field as a value's are. An empty key is
 * keysOf's problem.
 */
function keyForms(
    keys: string[],
    spec: FieldSpec | undefined,
    lists: Lists,
    problems: Problem[],
    group?: number
): void {
    if (spec === undefined) return;
    keys.forEach((key, index) => {
        if (key === '') return;
        const written = writtenField(spec, key, { lists, record: {}, held: [] });
        if (!written.ok) {
            problems.push(
                problemOf({ index, group, label: String(index + 1) }, 'key', written.trouble)
            );
        }
    });
}

/** The value a draft reads back as, or the problems that stop it. */
export function draftValue(draft: Draft, row: ConfigRow, lists: Lists): Made {
    const problems: Problem[] = [];
    const specs = specsOf(row, draft.form);
    const result = (value: unknown): Made =>
        problems.length > 0 ? { ok: false, problems } : { ok: true, value };
    if (draft.form === 'rollup') {
        const seen = new Set<string>();
        const value: Plain = {};
        const keyed = Object.hasOwn(row.fields, 'key') ? row.fields.key : undefined;
        keyForms(
            draft.groups.map((group) => group.key.trim()),
            keyed,
            lists,
            problems
        );
        draft.groups.forEach((group, at) => {
            const key = group.key.trim();
            if (key === '') {
                problems.push({ index: at, field: 'key', said: message('emptyKey', at + 1) });
            } else if (seen.has(key)) {
                problems.push({ index: at, field: 'key', said: message('duplicateKey', key) });
            }
            seen.add(key);
            const base = baseOf(row, undefined, key);
            put(
                value,
                key,
                group.cards.map((card, index) =>
                    childOf(
                        card,
                        specs,
                        { index, group: at, label: String(index + 1) },
                        base,
                        lists,
                        false,
                        problems
                    )
                )
            );
        });
        return result(value);
    }
    if (draft.form === 'items') {
        const numbers = row.entry.items === 'number';
        const items: (string | number)[] = [];
        // An item is checked as its box is: a number by its range, a text by the list's form.
        draft.cards.forEach((card, index) => {
            const text = wordsOf(card.fields.item)[0] ?? '';
            if (text.trim() === '') {
                problems.push({ index, said: message('emptyItem', index + 1) });
                return;
            }
            const written = writtenField(specs.item, text, { lists, record: {}, held: [] });
            if (!written.ok) {
                problems.push(
                    problemOf({ index, label: String(index + 1) }, 'item', written.trouble)
                );
            } else items.push(numbers ? Number(written.value) : text);
        });
        return result(items);
    }
    if (draft.form === 'multi') {
        const reading = { lists, record: {}, held: [row.value] };
        const written = writtenField(row.entry, draft.cards[0]?.fields.value, reading);
        if (!written.ok)
            problems.push(problemOf({ index: 0, label: '1' }, 'value', written.trouble));
        return result(written.ok ? written.value : undefined);
    }
    if (draft.form === 'pairs') {
        const keys = keysOf(draft.cards, undefined, problems);
        keyForms(keys, specs.key, lists, problems);
        const value: Plain = {};
        draft.cards.forEach((card, index) => {
            const spec = specs.value;
            if (Object.hasOwn(card.kept, 'value')) {
                put(value, keys[index], card.kept.value);
                return;
            }
            const held = card.fields.value;
            const reading = { lists, record: card.fields, held: [] };
            const written = writtenField(spec, held, reading);
            if (!written.ok) {
                problems.push(
                    problemOf({ index, label: String(index + 1) }, 'value', written.trouble)
                );
                return;
            }
            const empty = controlOf(spec) === 'list' || controlOf(spec) === 'multi' ? [] : '';
            put(value, keys[index], written.value === undefined ? empty : written.value);
        });
        return result(value);
    }
    if (!draft.keyed) {
        const list = draft.cards.map((card, index) =>
            childOf(
                card,
                specs,
                { index, label: String(index + 1) },
                baseOf(row, undefined),
                lists,
                false,
                problems
            )
        );
        return result(list);
    }
    const keys = keysOf(draft.cards, undefined, problems);
    keyForms(keys, specs.key, lists, problems);
    const listed = withoutKey(specs);
    const value: Plain = {};
    draft.cards.forEach((card, index) => {
        put(
            value,
            keys[index],
            childOf(
                card,
                listed,
                { index, label: String(index + 1) },
                baseOf(row, keys[index]),
                lists,
                false,
                problems
            )
        );
    });
    return result(value);
}

/** Whether the file now holds another value than `base`, the one a draft was started over. */
export function movedFrom(base: unknown, row: ConfigRow): boolean {
    return !sameInOrder(base, row.value);
}

/** Whether the draft differs from what the row holds: a draft that does not read back does. */
export function isEdited(draft: Draft, row: ConfigRow, lists: Lists): boolean {
    const made = draftValue(draft, row, lists);
    return !made.ok || !sameInOrder(made.value, row.value);
}

// ---- a draft held in the form of flow text ----------------------------------------------------

/**
 * A card as a draft saved in flow text holds it: the text of each field, every field but a key or
 * an item as one line of YAML flow text.
 */
type TextCard = {
    fields: Record<string, string>;
    kept: Record<string, unknown>;
    order: string[];
};

/** A draft saved in flow text, which `typedDraft` reads into a typed draft. */
export type TextDraft =
    | {
          form: 'items' | 'pairs' | 'records';
          keyed: boolean;
          fields: string[];
          cards: TextCard[];
      }
    | {
          form: 'rollup';
          fields: string[];
          groups: { key: string; cards: TextCard[] }[];
      };

/** Whether a field's text is read as it is and not as flow text. */
function raw(name: string): boolean {
    return name === 'key' || name === 'item';
}

/**
 * The controls that cannot show a text that did not read as YAML: a toggle, a picker and a
 * collection. A box (a number, a text, a folder, a file, a path) holds the text as typed.
 */
const NOT_A_BOX = [
    'toggle',
    'choice',
    'glyph',
    'hue',
    'colour',
    'multi',
    'list',
    'parked',
    'records'
];

/** One field's text read into the card's typed value, or kept as typed text that did not read. */
function readText(card: Card, name: string, spec: FieldSpec, text: string): void {
    if (raw(name)) {
        card.fields[name] = text;
        return;
    }
    const flow = readFlow(text);
    if (!flow.ok) {
        if (NOT_A_BOX.includes(controlOf(spec))) card.unread = { ...card.unread, [name]: text };
        else card.fields[name] = text;
        return;
    }
    if (flow.value === undefined) return;
    const read = readField(spec, flow.value);
    if (read.kind === 'value') card.fields[name] = read.value;
    else card.kept[name] = flow.value;
}

/** A card of text read into typed fields. */
function typedCard(from: TextCard, specs: Record<string, FieldSpec>): Card {
    const card: Card = { fields: {}, kept: { ...from.kept }, order: from.order };
    for (const [name, text] of Object.entries(from.fields)) {
        const spec = byKey(specs, name);
        if (spec === undefined) card.fields[name] = text;
        else readText(card, name, spec, text);
    }
    return card;
}

/**
 * The draft a page held as text, read into typed fields by the specs of the row it is for. A text
 * that does not read stays in a text field as typed, and in any other field is kept as text for
 * Save to name.
 */
export function typedDraft(held: TextDraft, row: ConfigRow): Draft {
    const specs = specsOf(row, held.form);
    const read = (cards: TextCard[]): Card[] => cards.map((card) => typedCard(card, specs));
    if (held.form === 'rollup') {
        return {
            ...held,
            groups: held.groups.map((group) => ({ ...group, cards: read(group.cards) }))
        };
    }
    return { ...held, cards: read(held.cards) };
}
