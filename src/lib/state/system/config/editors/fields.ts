// Layer 2, client state, pure. The rules of the controls the Settings view draws for an option and
// for a field of a family, in one place: what a held value reads into (what the control shows),
// what an input makes of it (the value a pick, a box or a toggle commits), and what stops a value
// before it is sent (a number outside its range, a text of the wrong form, a path the hub does not
// hold).
//
// A field is held in a draft as its typed value (FieldValue): a boolean for a toggle, the box's
// text for a number, a string for text, long, choice, glyph, hue, colour, folder, file and path, a
// list of words for multi, list and parked, and a list of cards for a nested list of records. A
// field the record does not hold is absent from the card, which is how a field is unset. A held
// value its control cannot show (`tab_size: "4"`) is not read into the card's fields: it stays in
// the card's `kept` as the file has it, and is sent back unchanged.
//
// The sentences are messages (messages.ts) for the view to word; nothing here holds one. The page
// refuses the number, form and path problems here, before the write, by the rule the server's write
// checks with (data/sources/config/catalog/value-rule.ts), so the two cannot disagree on the
// limits; a list that is still loading or could not be read makes no refusal here, and the server's
// check answers.

import { byKey, isMap } from '../../../../data/helpers/guards.ts';
import {
    classOfHex,
    hueHex,
    hueOfClass,
    listedSources,
    pickedSources,
    readsOther,
    type CatalogEntry,
    type Control,
    type FieldSpec,
    type Form
} from '../../../../data/sources/config/catalog/options.ts';
import {
    itemProblem,
    valueProblem,
    type ValueProblem
} from '../../../../data/sources/config/catalog/value-rule.ts';
import { message, type Message } from '../messages.ts';
import type { Lists, SourceItems } from './sources.ts';

export type { CatalogEntry, FieldSpec };

/** What a field holds in a draft; see the head of this file. */
export type FieldValue = boolean | string | string[] | Card[];

/**
 * One entry of an editor: the typed value of each field it holds, the fields of the record the
 * control cannot show or the catalog does not name, as the file holds them, the order the file
 * wrote the record's fields in so an edit does not reorder them, and the text of a field of a
 * draft saved in flow text that did not read as YAML.
 */
export type Card = {
    fields: Record<string, FieldValue>;
    kept: Record<string, unknown>;
    order: string[];
    unread?: Record<string, string>;
};

/** What a spec's control is: the entry's own, `records` for a nested list, else text. */
export function controlOf(spec: CatalogEntry): Control {
    return spec.control ?? (spec.fields === undefined ? 'text' : 'records');
}

/**
 * A decimal number: an optional minus, digits with an optional point or a point and digits, and an
 * optional exponent.
 */
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

/**
 * The number a text is as a decimal, or null when it is not one: the trimmed text must match the
 * pattern above and give a finite number, and `-0` is `0`. The one reading of a number's text,
 * which a config number row, a number field of a card and the terminal text size box of the
 * "This browser" rows share.
 */
export function decimalOf(input: string): number | null {
    const trimmed = input.trim();
    const number = Number(trimmed);
    if (!DECIMAL.test(trimmed) || !Number.isFinite(number)) return null;
    return Object.is(number, -0) ? 0 : number;
}

// ---- reading a held value -------------------------------------------------------------------

/** What a held value reads into: the typed value, a value the control cannot show, or no editor. */
export type Read = { kind: 'value'; value: FieldValue } | { kind: 'stuck' } | { kind: 'broken' };

const STUCK: Read = { kind: 'stuck' };

function value(held: FieldValue): Read {
    return { kind: 'value', value: held };
}

/** The words of a joined text. */
function joinedWords(text: string): string[] {
    return text.split(' ').filter((word) => word !== '');
}

/** A list held in a draft, read as the words it holds; anything else holds none. */
export function wordsOf(held: FieldValue | undefined): string[] {
    if (typeof held === 'string') return held === '' ? [] : [held];
    return Array.isArray(held) ? held.filter((one): one is string => typeof one === 'string') : [];
}

/** The cards of a nested list held in a draft; a field the card lacks holds none. */
export function cardsOf(held: FieldValue | undefined): Card[] {
    return Array.isArray(held) ? held.filter((one): one is Card => typeof one === 'object') : [];
}

/** The text a box shows for a field's held value; a value that is not text shows none. */
export function textOf(held: FieldValue | undefined): string {
    return typeof held === 'string' ? held : '';
}

/** The state a toggle shows: null when the card does not hold the field. */
export function toggleOf(held: FieldValue | undefined): boolean | null {
    return typeof held === 'boolean' ? held : null;
}

/** The card of one record, or null when a nested list in it holds something that is no record. */
export function cardOf(
    record: Record<string, unknown>,
    specs: Record<string, FieldSpec>,
    key?: string
): Card | null {
    const fields: Record<string, FieldValue> = {};
    const kept: Record<string, unknown> = {};
    if (key !== undefined) fields.key = key;
    for (const [name, held] of Object.entries(record)) {
        const spec = byKey(specs, name);
        if (spec === undefined || (key !== undefined && name === 'key')) {
            kept[name] = held;
            continue;
        }
        const read = readField(spec, held);
        if (read.kind === 'broken') return null;
        if (read.kind === 'stuck') kept[name] = held;
        else fields[name] = read.value;
    }
    return { fields, kept, order: Object.keys(record) };
}

/** A card holding nothing. */
export function emptyCard(): Card {
    return { fields: {}, kept: {}, order: [] };
}

/** The cards of a list of records, or null when one of them cannot be drawn. */
export function cardsFrom(list: unknown[], specs: Record<string, FieldSpec>): Card[] | null {
    const cards: Card[] = [];
    for (const record of list) {
        if (!isMap(record)) return null;
        const card = cardOf(record, specs);
        if (card === null) return null;
        cards.push(card);
    }
    return cards;
}

/** What a value the file holds for a field reads into, by the field's control. */
export function readField(spec: CatalogEntry, held: unknown): Read {
    switch (controlOf(spec)) {
        case 'toggle':
            return typeof held === 'boolean' ? value(held) : STUCK;
        case 'number':
            return typeof held === 'number' && Number.isFinite(held) ? value(String(held)) : STUCK;
        case 'multi':
            if (spec.joined === true) {
                return typeof held === 'string' ? value(joinedWords(held)) : STUCK;
            }
            if (typeof held === 'string') return value(held);
            return Array.isArray(held) && held.every((one) => typeof one === 'string')
                ? value(held.map(String))
                : STUCK;
        case 'list': {
            if (!Array.isArray(held)) return STUCK;
            if (spec.items === 'number') {
                return held.every((one) => typeof one === 'number' && Number.isFinite(one))
                    ? value(held.map(String))
                    : STUCK;
            }
            return held.every((one) => typeof one === 'string') ? value(held.map(String)) : STUCK;
        }
        case 'parked':
            return Array.isArray(held) && held.every((one) => typeof one === 'string')
                ? value(held.map(String))
                : STUCK;
        case 'records': {
            if (!Array.isArray(held)) return STUCK;
            const cards = cardsFrom(held, spec.fields ?? {});
            return cards === null ? { kind: 'broken' } : value(cards);
        }
        default:
            return typeof held === 'string' ? value(held) : STUCK;
    }
}

// ---- what an input makes of a field ---------------------------------------------------------

/**
 * Whether a control's empty text means "not set" (the field is left out) and not the empty value.
 */
function emptyIsValue(spec: CatalogEntry): boolean {
    const control = controlOf(spec);
    return (
        spec.empty !== undefined &&
        (control === 'choice' || control === 'path' || control === 'file' || control === 'folder')
    );
}

/** The field's value for the text of a box: empty text unsets the field, but for an empty value. */
export function fromText(spec: CatalogEntry, text: string): FieldValue | undefined {
    return text === '' && !emptyIsValue(spec) ? undefined : text;
}

/** The field's value for a pick of a word, or of a hue of the colour control. */
export function fromPick(spec: CatalogEntry, picked: string, lists: Lists): FieldValue | undefined {
    if (picked === '') return emptyIsValue(spec) ? '' : undefined;
    if (controlOf(spec) === 'colour') return hueHex(lists.config, picked);
    return picked;
}

/**
 * The field's value for a new list of picked words. A multi the file holds as one string stays one
 * string while it holds one word.
 */
export function fromWords(
    spec: CatalogEntry,
    previous: FieldValue | undefined,
    words: string[]
): FieldValue {
    if (typeof previous === 'string' && spec.joined !== true && words.length === 1) return words[0];
    return words;
}

// ---- the lists a choice draws from ----------------------------------------------------------

/** The words a choice or multi may take, and whether the lists they come from are there yet. */
export type Pool = { items: string[]; state: 'ready' | 'loading' | 'failed'; error: string };

/** Add one source's answer to a pool. */
function addSource(pool: Pool, answer: SourceItems): void {
    if (answer.state === 'ready') pool.items.push(...answer.items);
    else if (answer.state === 'failed') {
        pool.state = 'failed';
        pool.error = answer.error;
    } else if (pool.state === 'ready') pool.state = 'loading';
}

/**
 * The pool of a choice or multi: its fixed words, the items of every source it draws from, and the
 * items of the source another field of the record names. A word of that field the catalog maps to
 * no source gives no items. The first source still loading or failed decides the pool's state.
 */
export function poolOf(spec: CatalogEntry, record: Record<string, FieldValue>, lists: Lists): Pool {
    const pool: Pool = { items: [...(spec.options ?? [])], state: 'ready', error: '' };
    for (const source of listedSources(spec)) addSource(pool, lists.items(source));
    const picked = pickedSources(spec);
    if (picked !== undefined) {
        const word = record[picked.field];
        const source = typeof word === 'string' ? byKey(picked.sources, word) : undefined;
        if (source !== undefined) addSource(pool, lists.items(source));
    }
    pool.items = [...new Set(pool.items)];
    return pool;
}

/** The hue a colour or hue field's held text stands for, or null when it stands for none. */
export function hueOf(spec: CatalogEntry, held: string, lists: Lists): string | null {
    if (controlOf(spec) === 'colour') {
        const name = classOfHex(lists.config, held);
        const hue = name === undefined ? undefined : hueOfClass(name);
        return hue !== undefined && lists.hues.includes(hue) ? hue : null;
    }
    return lists.hues.includes(held) ? held : null;
}

/**
 * Whether a held word is outside the list its control offers, which the view marks: null while the
 * list is not there yet, since nothing is known of it.
 */
export function isStray(
    spec: CatalogEntry,
    held: string,
    record: Record<string, FieldValue>,
    lists: Lists
): boolean | null {
    if (held === '') return false;
    switch (controlOf(spec)) {
        case 'glyph':
            return !lists.glyphs.includes(held);
        case 'hue':
        case 'colour':
            return hueOf(spec, held, lists) === null;
        case 'choice':
        case 'multi': {
            const pool = poolOf(spec, record, lists);
            if (pool.state !== 'ready') return null;
            return !pool.items.includes(held);
        }
        default:
            return false;
    }
}

// ---- checks before the write -----------------------------------------------------------------

/** Why a value is not sent. */
export type Trouble =
    | { is: 'notNumber' }
    | { is: 'notWhole' }
    | { is: 'range'; min: number | undefined; max: number | undefined }
    | { is: 'form'; form: Form }
    | { is: 'hubPath' }
    | { is: 'noFolder'; path: string }
    | { is: 'noFile'; path: string }
    | { is: 'aPath' }
    | { is: 'blank' }
    | { is: 'type' };

/**
 * The trouble a problem of the rule is on the page, or null for a problem the page does not refuse
 * on: a word outside a list is marked by `isStray` and answered by the server, and a value of the
 * wrong type cannot come out of the control.
 */
function troubleOf(problem: ValueProblem | null): Trouble | null {
    if (problem === null) return null;
    switch (problem.kind) {
        case 'whole':
            return { is: 'notWhole' };
        case 'range':
            return { is: 'range', min: problem.min, max: problem.max };
        case 'form':
            return { is: 'form', form: problem.form };
        case 'path':
            return { is: 'aPath' };
        case 'hub_path':
            return { is: 'hubPath' };
        default:
            return null;
    }
}

/** The message that names the form a text must have. */
function formMessage(form: Form): Message {
    switch (form) {
        case 'program':
            return message('notProgram');
        case 'extension':
            return message('notExtension');
        case 'bundle_id':
            return message('notBundleId');
    }
}

/** The message that names a trouble without saying where it is. */
export function troubleMessage(trouble: Trouble): Message {
    switch (trouble.is) {
        case 'notNumber':
            return message('notNumber');
        case 'notWhole':
            return message('notWhole');
        case 'form':
            return formMessage(trouble.form);
        case 'range':
            if (trouble.min !== undefined && trouble.max !== undefined) {
                return message('range', trouble.min, trouble.max);
            }
            return trouble.min === undefined
                ? message('rangeMax', trouble.max ?? 0)
                : message('rangeMin', trouble.min);
        case 'hubPath':
            return message('notHubPath');
        case 'noFolder':
            return message('noFolder', trouble.path);
        case 'noFile':
            return message('noFile', trouble.path);
        case 'aPath':
            return message('notAPath');
        case 'blank':
            return message('blank');
        case 'type':
            return message('notThisKind');
    }
}

/**
 * Why a number box's text is refused as it stands, or null: the text reads as a number that is not
 * whole when the entry says whole, or lies outside its range. A text that does not read as a number
 * is not named here; the form names it when the value is written.
 */
export function numberRefusal(spec: CatalogEntry, text: string): Message | null {
    const number = decimalOf(text);
    if (number === null) return null;
    const trouble = troubleOf(valueProblem(spec, number));
    return trouble === null ? null : troubleMessage(trouble);
}

/** The hub folder's name and the folder it is in, for a path typed under the hub. */
function splitPath(text: string): { parent: string; name: string } {
    const trimmed = text.replace(/\/+$/, '');
    const cut = trimmed.lastIndexOf('/');
    return { parent: cut < 0 ? '' : trimmed.slice(0, cut), name: trimmed.slice(cut + 1) };
}

/**
 * Why a folder, file or path box's text is refused before the write, or null. A path is absolute or
 * starts with `~/`. A folder or file is a path inside the hub: not absolute, with no `..` and no
 * backslash, there unless the spec allows it absent, as far as the listing of its parent says;
 * while that listing loads or after it failed nothing is refused, and the server's check answers.
 */
function pathTrouble(
    spec: CatalogEntry,
    text: string,
    record: Record<string, FieldValue>,
    lists: Lists
): Trouble | null {
    const control = controlOf(spec);
    const shape = troubleOf(valueProblem(spec, text));
    if (shape !== null || control === 'path' || text === '') return shape;
    const wantsFolder = control === 'folder';
    const missing: Trouble = wantsFolder
        ? { is: 'noFolder', path: text }
        : { is: 'noFile', path: text };
    const { parent, name } = splitPath(text);
    const folder = lists.folder(parent);
    if (folder.state !== 'ready') return null;
    const found = folder.entries.find((entry) => entry.name === name);
    if (found === undefined) {
        const allowed =
            spec.allow_missing === true ||
            (typeof spec.allow_missing === 'string' && record[spec.allow_missing] === true);
        return allowed ? null : missing;
    }
    return (found.kind === 'dir') === wantsFolder ? null : missing;
}

/**
 * What a field makes when it is written: its value (undefined leaves the field out) or a trouble.
 */
export type Written = { ok: true; value: unknown } | { ok: false; trouble: Trouble };

const OK_NOTHING: Written = { ok: true, value: undefined };

function done(made: unknown): Written {
    return { ok: true, value: made };
}

function failed(trouble: Trouble): Written {
    return { ok: false, trouble };
}

/**
 * The context a field is written in: the lists, its record's other fields and what the file held.
 */
export type Reading = {
    lists: Lists;
    record: Record<string, FieldValue>;
    /** The values the file held at this field, which pass the checks of the page as they stand. */
    held: unknown[];
    /** Every value passes the checks of the page, as in a record equal to one the file holds. */
    trust?: boolean;
};

/** Whether the file held this very value at the field, so the page's own checks leave it be. */
function heldAlready(spec: CatalogEntry, made: unknown, reading: Reading): boolean {
    if (reading.trust === true) return true;
    return (
        !readsOther(spec) &&
        reading.held.some((one) => JSON.stringify(one) === JSON.stringify(made))
    );
}

/**
 * The value of a list of items: each text a number or a non-blank string, and each item whole, in
 * range or of the form the entry gives unless the file held this very list.
 */
function listValue(spec: CatalogEntry, items: string[], reading: Reading): Written {
    const numbers = spec.items === 'number';
    const made: (string | number)[] = [];
    for (const item of items) {
        if (item.trim() === '') return failed({ is: 'blank' });
        if (numbers) {
            const number = decimalOf(item);
            if (number === null) return failed({ is: 'notNumber' });
            made.push(number);
        } else {
            made.push(item);
        }
    }
    if (heldAlready(spec, made, reading)) return done(made);
    for (const item of made) {
        const trouble = troubleOf(itemProblem(spec, item));
        if (trouble !== null) return failed(trouble);
    }
    return done(made);
}

/**
 * The value a field is written as, or why it is not. A field of nested records is written by the
 * draft, which owns the positions its troubles are named by.
 */
export function writtenField(
    spec: CatalogEntry,
    held: FieldValue | undefined,
    reading: Reading
): Written {
    if (held === undefined) return OK_NOTHING;
    const control = controlOf(spec);
    switch (control) {
        case 'toggle':
            return typeof held === 'boolean' ? done(held) : failed({ is: 'type' });
        case 'number': {
            if (typeof held !== 'string') return failed({ is: 'type' });
            if (held.trim() === '') return OK_NOTHING;
            const number = decimalOf(held);
            if (number === null) return failed({ is: 'notNumber' });
            const trouble = heldAlready(spec, number, reading)
                ? null
                : troubleOf(valueProblem(spec, number));
            return trouble === null ? done(number) : failed(trouble);
        }
        case 'multi':
            if (spec.joined === true) {
                return Array.isArray(held) ? done(wordsOf(held).join(' ')) : failed({ is: 'type' });
            }
            return typeof held === 'string' || Array.isArray(held)
                ? done(held)
                : failed({ is: 'type' });
        case 'list':
            return Array.isArray(held)
                ? listValue(spec, wordsOf(held), reading)
                : failed({ is: 'type' });
        case 'parked':
            return Array.isArray(held) ? done(wordsOf(held)) : failed({ is: 'type' });
        case 'records':
            return failed({ is: 'type' });
        case 'folder':
        case 'file':
        case 'path': {
            if (typeof held !== 'string') return failed({ is: 'type' });
            if (heldAlready(spec, held, reading)) return done(held);
            const trouble = pathTrouble(spec, held, reading.record, reading.lists);
            return trouble === null ? done(held) : failed(trouble);
        }
        case 'text':
        case 'long': {
            if (typeof held !== 'string') return failed({ is: 'type' });
            const trouble = heldAlready(spec, held, reading)
                ? null
                : troubleOf(valueProblem(spec, held));
            return trouble === null ? done(held) : failed(trouble);
        }
        default:
            return typeof held === 'string' ? done(held) : failed({ is: 'type' });
    }
}

// ---- one value of an option written straight away -------------------------------------------

/** The value to write, or why none is. */
export type Committed =
    { write: true; value: string | number | boolean } | { write: false; said?: Message };

/**
 * The value a control's input makes for an option set one key at a time. A number's trimmed text
 * must be a decimal that is whole when the entry says so and inside its range, and `-0` is written
 * as `0`; empty text writes nothing and says so. A text is written once it has the form the entry
 * gives. A toggle gives its boolean. A choice, glyph, hue or colour gives its word, and the empty
 * choice writes `''` for an option that takes it and nothing for one that does not. A folder, file
 * or path is written once it passes the page's check.
 */
export function commitValue(spec: CatalogEntry, input: string | boolean, lists: Lists): Committed {
    const control = controlOf(spec);
    if (control === 'toggle') {
        return typeof input === 'boolean' ? { write: true, value: input } : { write: false };
    }
    if (typeof input !== 'string') return { write: false };
    switch (control) {
        case 'text':
        case 'long': {
            const trouble = troubleOf(valueProblem(spec, input));
            return trouble === null
                ? { write: true, value: input }
                : { write: false, said: troubleMessage(trouble) };
        }
        case 'choice':
        case 'glyph':
        case 'hue':
        case 'colour':
            if (input !== '') return { write: true, value: input };
            return emptyIsValue(spec) ? { write: true, value: '' } : { write: false };
        case 'number': {
            if (input.trim() === '') return { write: false, said: message('empty') };
            const number = decimalOf(input);
            if (number === null) return { write: false, said: message('notNumber') };
            const trouble = troubleOf(valueProblem(spec, number));
            if (trouble !== null) return { write: false, said: troubleMessage(trouble) };
            return { write: true, value: number };
        }
        case 'folder':
        case 'file':
        case 'path': {
            const trouble = pathTrouble(spec, input, {}, lists);
            return trouble === null
                ? { write: true, value: input }
                : { write: false, said: troubleMessage(trouble) };
        }
        default:
            return { write: false };
    }
}

// ---- suggestions for a folder, file or text box ----------------------------------------------

/** What a box offers: the suggestions, and a note while the list is not there. */
export type Offer = {
    items: string[];
    note: 'loading' | 'failed' | null;
    /** The reason, for a failed list. */
    error: string;
};

/** Whether a text box suggests from a source: its `from` names one and no value is held to it. */
export function suggests(spec: CatalogEntry): boolean {
    return controlOf(spec) === 'text' && listedSources(spec).length > 0;
}

/** The offer of a text box whose spec names a source. */
function sourceOffer(spec: CatalogEntry, lists: Lists): Offer {
    if (!suggests(spec)) return { items: [], note: null, error: '' };
    const [suggested] = listedSources(spec);
    const answer = lists.items(suggested);
    if (answer.state === 'ready') return { items: answer.items, note: null, error: '' };
    return {
        items: [],
        note: answer.state === 'failed' ? 'failed' : 'loading',
        error: answer.state === 'failed' ? answer.error : ''
    };
}

/**
 * What a text, folder or file box offers for the text typed: the items of its source, or for a
 * folder or file the entries of the hub folder typed so far (folders only for a folder), each as
 * the path that would be written.
 */
export function offerFor(spec: CatalogEntry, text: string, lists: Lists): Offer {
    const control = controlOf(spec);
    if (control !== 'folder' && control !== 'file') return sourceOffer(spec, lists);
    if (text.startsWith('/') || text.includes('\\')) return { items: [], note: null, error: '' };
    const cut = text.lastIndexOf('/');
    const parent = cut < 0 ? '' : text.slice(0, cut);
    const folder = lists.folder(parent);
    if (folder.state === 'loading') return { items: [], note: 'loading', error: '' };
    if (folder.state === 'failed') return { items: [], note: 'failed', error: folder.error };
    const base = cut < 0 ? '' : `${text.slice(0, cut)}/`;
    const items = folder.entries
        .filter((entry) => control === 'file' || entry.kind === 'dir')
        .map(
            (entry) =>
                `${base}${entry.name}${control === 'file' && entry.kind === 'dir' ? '/' : ''}`
        )
        .sort((left, right) => left.localeCompare(right));
    return { items, note: null, error: '' };
}
