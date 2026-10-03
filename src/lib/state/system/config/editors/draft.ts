// Layer 2, client state, pure. The draft a list or family editor holds: the value the file holds at
// a key read into text fields, the edits a press makes to it, and the value it reads back as.
//
// Every list and family the Settings view edits has one of four forms. A list option is `items`,
// one field per item. A family whose fields are `key` and `value` is `pairs`, a key field and a
// value field per entry. Any other family is `records`: one card per record with a field per
// catalog field, the map's key being the card's first field when the file holds a map. The one
// family that is a map of lists of records (`tab_rollup`) is `rollup`: one group per key, each
// holding cards. A value is shown as one line of YAML flow text (flow.ts) and read back on Save, so
// a number stays a number and a list a list. A field a record holds that the catalog does not name
// is kept on its card as it is and sent back unchanged.
//
// A draft that does not read back is not an error: `draftValue` answers the problems, each with the
// message to word it, and Save waits until there are none. The rail and the page reset, a row the
// file does not hold, a row flagged mismatch and a list holding anything but text have no draft.

import { isMap, sameInOrder } from '../../../../data/helpers/guards.ts';
import { message, type Message } from '../messages.ts';
import { PAGES_ROW, RAIL_ROW } from '../groups.ts';
import type { ConfigRow } from '../rows.ts';
import { flowText, readFlow } from './flow.ts';

/** One entry of an editor: the text of each of its fields, and the fields of a record it keeps. */
export type Card = {
    fields: Partial<Record<string, string>>;
    /** The fields the record holds that the catalog does not name, as the file holds them. */
    kept: Record<string, unknown>;
    /** The order the file wrote the record's fields in, so an edit does not reorder them. */
    order: string[];
};

/** The draft of one row. */
export type Draft =
    | { form: 'items' | 'pairs' | 'records'; keyed: boolean; fields: string[]; cards: Card[] }
    | {
          form: 'rollup';
          fields: string[];
          groups: { key: string; cards: Card[] }[];
      };

/** What a press does to a draft. A `group` is given for the cards of a roll-up's group. */
export type Edit =
    | { do: 'add'; group?: number }
    | { do: 'remove'; index: number; group?: number }
    | { do: 'move'; index: number; by: number; group?: number }
    | { do: 'set'; index: number; field: string; text: string; group?: number }
    | { do: 'addGroup' }
    | { do: 'removeGroup'; group: number }
    | { do: 'moveGroup'; group: number; by: number }
    | { do: 'setGroup'; group: number; key: string };

/** One thing the draft has to mend before it is sent. `index` counts from 0. */
export type Problem = { index: number; group?: number; field?: string; said: Message };

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

/** The fields of a record card: the catalog's, without `key` when the file's map supplies it. */
function cardFields(row: ConfigRow, keyed: boolean): string[] {
    const names = Object.keys(row.fields);
    return keyed ? ['key', ...names.filter((name) => name !== 'key')] : names;
}

/** The card of one record: its catalog fields as flow text, the rest kept. */
function cardOf(record: Plain, names: string[], key?: string): Card {
    const fields: Record<string, string> = {};
    const listed = key === undefined ? names : names.slice(1);
    if (key !== undefined) fields.key = key;
    for (const name of listed) {
        fields[name] = Object.hasOwn(record, name) ? flowText(record[name]) : '';
    }
    const kept = Object.fromEntries(
        Object.entries(record).filter(([name]) => !listed.includes(name))
    );
    return { fields, kept, order: Object.keys(record) };
}

/** A card with every field empty. */
function emptyCard(names: string[]): Card {
    return { fields: Object.fromEntries(names.map((name) => [name, ''])), kept: {}, order: [] };
}

/** Whether every item of a list is a record. */
function allPlain(list: unknown[]): list is Plain[] {
    return list.every(isMap);
}

/**
 * The draft of a row, or null when the row has no editor of this kind: it is not a list or a family
 * the file holds as one, it is the rail or the page reset, the file's value is not what its
 * control shows, or an item is not what the editor holds.
 */
export function draftOf(row: ConfigRow): Draft | null {
    if (row.state !== 'set' || row.mismatch) return null;
    if (row.id === RAIL_ROW || row.id === PAGES_ROW) return null;
    const value = row.value;
    if (row.control === 'list') {
        if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return null;
        const cards = value.map((item: string) => ({ fields: { item }, kept: {}, order: [] }));
        return { form: 'items', keyed: false, fields: ['item'], cards };
    }
    if (row.control !== 'family') return null;
    const names = Object.keys(row.fields);
    if (Array.isArray(value)) {
        if (!allPlain(value)) return null;
        return {
            form: 'records',
            keyed: false,
            fields: names,
            cards: value.map((record) => cardOf(record, names))
        };
    }
    if (!isMap(value)) return null;
    const entries = Object.entries(value);
    if (isTable(names)) {
        const cards = entries.map(([key, held]) => ({
            fields: { key, value: flowText(held) },
            kept: {},
            order: []
        }));
        return { form: 'pairs', keyed: true, fields: ['key', 'value'], cards };
    }
    if (row.holds === 'lists') {
        const inner = cardFields(row, false).filter((name) => name !== 'key');
        const groups: { key: string; cards: Card[] }[] = [];
        for (const [key, held] of entries) {
            if (!Array.isArray(held) || !allPlain(held)) return null;
            groups.push({ key, cards: held.map((record) => cardOf(record, inner)) });
        }
        return { form: 'rollup', fields: inner, groups };
    }
    const keyedNames = cardFields(row, true);
    const cards: Card[] = [];
    for (const [key, held] of entries) {
        if (!isMap(held)) return null;
        cards.push(cardOf(held, keyedNames, key));
    }
    return { form: 'records', keyed: true, fields: keyedNames, cards };
}

/** The cards of a draft or of one group of a roll-up, or null when `group` names none. */
function cardsOf(draft: Draft, group: number | undefined): Card[] | null {
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
    const cards = cardsOf(draft, edit.group);
    if (cards === null) return draft;
    if (edit.do === 'add') {
        if (draft.form === 'rollup' && edit.group === undefined) return draft;
        return withCards(draft, edit.group, [...cards, emptyCard(draft.fields)]);
    }
    if (edit.do === 'remove') return withCards(draft, edit.group, without(cards, edit.index));
    if (edit.do === 'move') return withCards(draft, edit.group, moved(cards, edit.index, edit.by));
    if (!draft.fields.includes(edit.field)) return draft;
    const next = atIndex(cards, edit.index, (card) => ({
        ...card,
        fields: { ...card.fields, [edit.field]: edit.text }
    }));
    return withCards(draft, edit.group, next);
}

/**
 * The record one card makes: its fields read as flow text, empty ones left out, its kept fields.
 */
function recordOf(
    card: Card,
    names: string[],
    index: number,
    group: number | undefined,
    problems: Problem[]
): Plain {
    const made: Plain = {};
    for (const name of names) {
        const read = readFlow(card.fields[name] ?? '');
        if (!read.ok) {
            const said = message('notYaml', index + 1, name);
            problems.push(
                group === undefined
                    ? { index, field: name, said }
                    : { index, group, field: name, said }
            );
        } else if (read.value !== undefined) {
            made[name] = read.value;
        }
    }
    const all: Plain = { ...made, ...card.kept };
    const ordered: Plain = {};
    for (const name of card.order) if (Object.hasOwn(all, name)) ordered[name] = all[name];
    for (const name of Object.keys(all))
        if (!Object.hasOwn(ordered, name)) ordered[name] = all[name];
    return ordered;
}

/** The names of the keys of a list of cards, with the problems of an empty or a repeated one. */
function keysOf(cards: Card[], group: number | undefined, problems: Problem[]): string[] {
    const seen = new Set<string>();
    return cards.map((card, index) => {
        const key = (card.fields.key ?? '').trim();
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

/** The value a draft reads back as, or the problems that stop it. */
export function draftValue(draft: Draft): Made {
    const problems: Problem[] = [];
    if (draft.form === 'rollup') {
        const seen = new Set<string>();
        const value: Plain = {};
        draft.groups.forEach((group, at) => {
            const key = group.key.trim();
            if (key === '') {
                problems.push({ index: at, field: 'key', said: message('emptyKey', at + 1) });
            } else if (seen.has(key)) {
                problems.push({ index: at, field: 'key', said: message('duplicateKey', key) });
            }
            seen.add(key);
            put(
                value,
                key,
                group.cards.map((card, index) => recordOf(card, draft.fields, index, at, problems))
            );
        });
        return problems.length > 0 ? { ok: false, problems } : { ok: true, value };
    }
    if (draft.form === 'items') {
        const items = draft.cards.map((card, index) => {
            const item = card.fields.item ?? '';
            if (item.trim() === '') {
                problems.push({ index, said: message('emptyItem', index + 1) });
            }
            return item;
        });
        return problems.length > 0 ? { ok: false, problems } : { ok: true, value: items };
    }
    if (draft.form === 'pairs') {
        const keys = keysOf(draft.cards, undefined, problems);
        const value: Plain = {};
        draft.cards.forEach((card, index) => {
            const read = readFlow(card.fields.value ?? '');
            if (!read.ok) {
                const said = message('notYaml', index + 1, 'value');
                problems.push({ index, field: 'value', said });
                return;
            }
            put(value, keys[index], read.value === undefined ? '' : read.value);
        });
        return problems.length > 0 ? { ok: false, problems } : { ok: true, value };
    }
    if (!draft.keyed) {
        const list = draft.cards.map((card, index) =>
            recordOf(card, draft.fields, index, undefined, problems)
        );
        return problems.length > 0 ? { ok: false, problems } : { ok: true, value: list };
    }
    const keys = keysOf(draft.cards, undefined, problems);
    const listed = draft.fields.filter((name) => name !== 'key');
    const value: Plain = {};
    draft.cards.forEach((card, index) => {
        put(value, keys[index], recordOf(card, listed, index, undefined, problems));
    });
    return problems.length > 0 ? { ok: false, problems } : { ok: true, value };
}

/** Whether the file now holds another value than `base`, the one a draft was started over. */
export function movedFrom(base: unknown, row: ConfigRow): boolean {
    return !sameInOrder(base, row.value);
}

/** Whether the draft differs from what the row holds: a draft that does not read back does. */
export function isEdited(draft: Draft, row: ConfigRow): boolean {
    const made = draftValue(draft);
    return !made.ok || !sameInOrder(made.value, row.value);
}
