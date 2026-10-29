// Layer 2, client state, pure. The rules of the controls the Settings view draws for an option and
// for a field of a family, in one place: what a held value reads into (what the control shows),
// what an input makes of it (the value a pick, a box or a toggle commits), and what stops a value
// before it is sent (a number outside its range, a text of the wrong form, a path the hub does not
// hold). What a control offers (a choice's words, a box's suggestions) is offers.ts.
//
// A field is held in a draft as its typed value (FieldValue): a boolean for a toggle, the box's
// text for a number and for a scalar that is a number or a flag (whose type the card keeps in
// `scalars`), a string for text, scalar, long, choice, glyph, hue, colour, folder, file and path, a
// list of words for multi, list and parked, a word block (its lists `words`, `not_words`, `flags`
// and `not_flags`, each held while it has a word) for words, and a list of cards for a family
// field: a card per record of a nested list, a card of `key` and `value` per key of a map, and the
// one card of a field that holds one record. A text field that takes a record as well (a reader
// row's `fields`, whose values are a path or a `{ path, op }` record) holds its text, or the one
// card of the record it holds. A field the record does not hold is absent from the card, which is
// how a field is unset. A held value its control cannot show (`tab_size: "4"`) is not read into
// the card's fields: it stays in the card's `kept` as the file has it, and is sent back unchanged.
//
// A card of a family marked `sparse` draws only the fields its record holds, and its Add field
// menu offers the others; a field added from the menu is held at once with an empty value, so its
// control is drawn.
//
// The sentences are messages (messages.ts) for the view to word; nothing here holds one. The page
// refuses the number, form and path problems here, before the write, by the rule the server's write
// checks with (data/sources/config/catalog/value-rule.ts), so the two cannot disagree on the
// limits; a list that is still loading or could not be read makes no refusal here, and the server's
// check answers.

import { byKey, isMap } from '../../../../data/helpers/guards.ts';
import {
    BLOCK_LISTS,
    type BlockList,
    type WordBlock
} from '../../../../data/shapes/boards/words.ts';
import {
    familyForm,
    hueHex,
    readsOther,
    takesRecord,
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
import type { Lists } from './sources.ts';

export { BLOCK_LISTS, familyForm };
export type { BlockList, CatalogEntry, FieldSpec };

/** What a field holds in a draft; see the head of this file. */
export type FieldValue = boolean | string | string[] | Card[] | WordBlock;

/**
 * One entry of an editor: the typed value of each field it holds, the fields of the record the
 * control cannot show or the catalog does not name, as the file holds them, the order the file
 * wrote the record's fields in so an edit does not reorder them, the text of a field of a draft
 * saved in flow text that did not read as YAML, and the type of each scalar field the file held
 * as a boolean or a number, which its text is written back in (`scalarOf`).
 */
export type Card = {
    fields: Record<string, FieldValue>;
    kept: Record<string, unknown>;
    order: string[];
    unread?: Record<string, string>;
    scalars?: Record<string, Scalar>;
};

/** The type of a value other than text that a scalar's text box shows as its text. */
type Scalar = 'boolean' | 'number';

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
 * which a config number row and a number field of a card share.
 */
function decimalOf(input: string): number | null {
    const trimmed = input.trim();
    const number = Number(trimmed);
    if (!DECIMAL.test(trimmed) || !Number.isFinite(number)) return null;
    return Object.is(number, -0) ? 0 : number;
}

// ---- reading a held value -------------------------------------------------------------------

/**
 * What a held value reads into: the typed value, with the type of a boolean or a number a scalar's
 * box shows as its text; a value the control cannot show; or no editor.
 */
export type Read =
    { kind: 'value'; value: FieldValue; scalar?: Scalar } | { kind: 'stuck' } | { kind: 'broken' };

const STUCK: Read = { kind: 'stuck' };

function value(held: FieldValue): Read {
    return { kind: 'value', value: held };
}

/** A boolean or a number read into a scalar's box: its text, and its type. */
function scalarText(held: boolean | number): Read {
    return { kind: 'value', value: String(held), scalar: scalarType(held) };
}

/**
 * A field's read put on its card: the value it reads into, else the value kept as the file has it.
 */
export function putRead(card: Card, name: string, read: Read, held: unknown): void {
    if (read.kind !== 'value') {
        card.kept[name] = held;
        return;
    }
    card.fields[name] = read.value;
    if (read.scalar !== undefined) card.scalars = { ...card.scalars, [name]: read.scalar };
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

/** The word block held in a draft; a value that is no block holds no list. */
export function blockIn(held: FieldValue | undefined): WordBlock {
    return typeof held === 'object' && !Array.isArray(held) ? held : {};
}

/** Whether a value the file holds is a word block: a map of the four lists, each of texts. */
function isBlock(held: unknown): held is WordBlock {
    return (
        isMap(held) &&
        Object.entries(held).every(
            ([name, list]) =>
                BLOCK_LISTS.some((one) => one === name) &&
                Array.isArray(list) &&
                list.every((one) => typeof one === 'string')
        )
    );
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
    const card: Card = { fields: {}, kept: {}, order: Object.keys(record) };
    if (key !== undefined) card.fields.key = key;
    for (const [name, held] of Object.entries(record)) {
        const spec = byKey(specs, name);
        if (spec === undefined || (key !== undefined && name === 'key')) {
            card.kept[name] = held;
            continue;
        }
        const read = readField(spec, held);
        if (read.kind === 'broken') return null;
        putRead(card, name, read, held);
    }
    return card;
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

/**
 * The spec a value of a map field is drawn and read by: its `value` field, a list of texts where
 * the field holds lists and its value is one text, so one box per item holds either.
 */
export function pairValueSpec(spec: CatalogEntry): FieldSpec {
    const value = spec.fields?.value ?? { help: '', control: 'text' };
    const single = value.control !== 'list' && value.control !== 'multi';
    return spec.holds === 'lists' && single ? { ...value, control: 'list' } : value;
}

/**
 * What the value of a family field reads into, by its form (familyForm): the cards of a list of
 * records; one card per key of a map, its `key` and `value` fields; or the one card of a record.
 * A value of another shape is not shown; a record of a list that cannot be drawn breaks the card.
 */
function readFamily(spec: CatalogEntry, held: unknown): Read {
    const fields = spec.fields ?? {};
    switch (familyForm(spec)) {
        case 'record': {
            if (!isMap(held)) return STUCK;
            const card = cardOf(held, fields);
            return card === null ? { kind: 'broken' } : value([card]);
        }
        case 'pairs': {
            if (!isMap(held)) return STUCK;
            // A map that holds lists holds one value at a key as that value, which its own spec
            // reads, and a list by the list of its items.
            const inner = pairValueSpec(spec);
            const one = spec.holds === 'lists' ? (spec.fields?.value ?? inner) : inner;
            const cards = Object.entries(held).map(([key, at]): Card => {
                const read = readField(Array.isArray(at) ? inner : one, at);
                const card: Card = { fields: { key }, kept: {}, order: [] };
                putRead(card, 'value', read, at);
                return card;
            });
            return value(cards);
        }
        default: {
            if (!Array.isArray(held)) return STUCK;
            const cards = cardsFrom(held, fields);
            return cards === null ? { kind: 'broken' } : value(cards);
        }
    }
}

/**
 * What a value the file holds for a field reads into, by the field's control. A scalar's box shows
 * a boolean or a number as its text, which `scalarOf` writes back in that type; a boolean or a
 * number a text field holds does not read, so the card keeps it as the file has it.
 */
export function readField(spec: CatalogEntry, held: unknown): Read {
    switch (controlOf(spec)) {
        case 'toggle':
            return typeof held === 'boolean' ? value(held) : STUCK;
        case 'secret':
            return held === true ? value(true) : STUCK;
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
        case 'records':
            return readFamily(spec, held);
        case 'words':
            return isBlock(held)
                ? value(Object.fromEntries(Object.entries(held).map(([k, v]) => [k, [...v]])))
                : STUCK;
        case 'scalar':
            if (typeof held === 'boolean') return scalarText(held);
            if (typeof held === 'number' && Number.isFinite(held)) return scalarText(held);
            return typeof held === 'string' ? value(held) : STUCK;
        default:
            if (takesRecord(spec) && isMap(held)) return readFamily(spec, held);
            return typeof held === 'string' ? value(held) : STUCK;
    }
}

/**
 * The value a scalar's text is written as: a boolean or a number when the file held one at the
 * field (the card's `scalars`, or the option's value) and the text reads as one of that type
 * (`true` or `false`, a decimal), else the text.
 */
function scalarOf(text: string, scalar: Scalar | undefined): string | number | boolean {
    if (scalar === 'boolean' && (text === 'true' || text === 'false')) return text === 'true';
    if (scalar === 'number') return decimalOf(text) ?? text;
    return text;
}

/** The type of a value a scalar's box shows as its text, or undefined for a text. */
function scalarType(held: unknown): Scalar | undefined {
    if (typeof held === 'boolean') return 'boolean';
    return typeof held === 'number' && Number.isFinite(held) ? 'number' : undefined;
}

// ---- the fields a sparse card draws ------------------------------------------------------------

/**
 * The fields a card draws of the names its list gives: every name the card does not keep as the
 * file has it, and on a family marked `sparse` only the names the card holds.
 */
export function shownFields(card: Card, names: readonly string[], sparse: boolean): string[] {
    return names.filter(
        (name) => !Object.hasOwn(card.kept, name) && (!sparse || Object.hasOwn(card.fields, name))
    );
}

/** The fields a sparse card's Add field menu offers: the names it neither holds nor keeps. */
export function addableFields(card: Card, names: readonly string[]): string[] {
    return names.filter(
        (name) => !Object.hasOwn(card.fields, name) && !Object.hasOwn(card.kept, name)
    );
}

/**
 * The value a field is added with from the Add field menu: no cards for a family, no words for a
 * list, a multi or a parked list, no lists for a word block, true for a toggle, and an empty text
 * for any other control, so the card draws the field's control at once.
 */
export function addedValue(spec: CatalogEntry): FieldValue {
    switch (controlOf(spec)) {
        case 'records':
        case 'list':
        case 'multi':
        case 'parked':
            return [];
        case 'words':
            return {};
        case 'toggle':
            return true;
        default:
            return '';
    }
}

/**
 * Whether a field draws cards of its own: a family field, and a text that takes a record while it
 * holds one.
 */
export function drawsCards(spec: CatalogEntry, held: FieldValue | undefined): boolean {
    return controlOf(spec) === 'records' || (takesRecord(spec) && Array.isArray(held));
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

/**
 * The field's value for a new list of words of one list of a word block: a list left with no word
 * is taken out of the block, and a block left with no list unsets the field.
 */
export function fromBlock(
    held: FieldValue | undefined,
    list: BlockList,
    words: string[]
): FieldValue | undefined {
    const others = Object.entries(blockIn(held)).filter(([name]) => name !== list);
    const block: WordBlock = Object.fromEntries(
        words.length === 0 ? others : [...others, [list, words]]
    );
    return Object.keys(block).length === 0 ? undefined : block;
}

// ---- checks before the write -----------------------------------------------------------------

/** Why a value is not sent. */
export type Trouble =
    | { is: 'notNumber' }
    | { is: 'notWhole' }
    | { is: 'range'; min: number | undefined; max: number | undefined; whole: boolean }
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
 * wrong type cannot come out of the control. A range of an entry that takes whole numbers says so.
 */
function troubleOf(problem: ValueProblem | null, spec: CatalogEntry): Trouble | null {
    if (problem === null) return null;
    switch (problem.kind) {
        case 'whole':
            return { is: 'notWhole' };
        case 'range':
            return { is: 'range', min: problem.min, max: problem.max, whole: spec.whole === true };
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
        case 'https_address':
            return message('notHttpsAddress');
        case 'https_origin':
            return message('notHttpsOrigin');
        case 'row_key':
            return message('notRowKey');
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
                return trouble.whole
                    ? message('rangeWhole', trouble.min, trouble.max)
                    : message('range', trouble.min, trouble.max);
            }
            if (trouble.min === undefined) {
                return trouble.whole
                    ? message('rangeWholeMax', trouble.max ?? 0)
                    : message('rangeMax', trouble.max ?? 0);
            }
            return trouble.whole
                ? message('rangeWholeMin', trouble.min)
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
    const trouble = troubleOf(valueProblem(spec, number), spec);
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
    const shape = troubleOf(valueProblem(spec, text), spec);
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
    /** The type the file held a scalar's value in, when it was no text. */
    scalar?: Scalar;
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
        const trouble = troubleOf(itemProblem(spec, item), spec);
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
        case 'secret':
            // The page holds a secret only as set; the Save sends the typed one in its place.
            return held === true ? done(true) : OK_NOTHING;
        case 'number': {
            if (typeof held !== 'string') return failed({ is: 'type' });
            if (held.trim() === '') return OK_NOTHING;
            const number = decimalOf(held);
            if (number === null) return failed({ is: 'notNumber' });
            const trouble = heldAlready(spec, number, reading)
                ? null
                : troubleOf(valueProblem(spec, number), spec);
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
        case 'words': {
            if (typeof held !== 'object' || Array.isArray(held)) return failed({ is: 'type' });
            return Object.keys(held).length === 0 ? OK_NOTHING : done(held);
        }
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
                : troubleOf(valueProblem(spec, held), spec);
            return trouble === null ? done(held) : failed(trouble);
        }
        case 'scalar': {
            if (typeof held !== 'string') return failed({ is: 'type' });
            const made = scalarOf(held, reading.scalar);
            const trouble = heldAlready(spec, made, reading)
                ? null
                : troubleOf(valueProblem(spec, made), spec);
            return trouble === null ? done(made) : failed(trouble);
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
 * or path is written once it passes the page's check. A scalar's text is written in the type of
 * the value the option holds (`held`) when it reads as one, and as a text otherwise, once it
 * passes the rule.
 */
export function commitValue(
    spec: CatalogEntry,
    input: string | boolean,
    lists: Lists,
    held?: unknown
): Committed {
    const control = controlOf(spec);
    if (control === 'toggle') {
        return typeof input === 'boolean' ? { write: true, value: input } : { write: false };
    }
    if (typeof input !== 'string') return { write: false };
    switch (control) {
        case 'text':
        case 'long': {
            const trouble = troubleOf(valueProblem(spec, input), spec);
            return trouble === null
                ? { write: true, value: input }
                : { write: false, said: troubleMessage(trouble) };
        }
        case 'scalar': {
            const made = scalarOf(input, scalarType(held));
            const trouble = troubleOf(valueProblem(spec, made), spec);
            return trouble === null
                ? { write: true, value: made }
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
            const trouble = troubleOf(valueProblem(spec, number), spec);
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
