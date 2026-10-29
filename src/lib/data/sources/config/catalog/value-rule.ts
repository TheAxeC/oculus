// Layer 1, data, pure. The one rule a value of an option is wrong by: the entry's `control`, `min`,
// `max`, `whole`, `form` and values, checked against nothing but the entry, the value and the lists
// the caller hands in. The Settings view refuses a value by it before the write, the server's write
// refuses it by it after, and the setting readers read a key by it, so the three agree on what is
// wrong.
//
// The rule answers what is wrong as a kind and its arguments and holds no sentence; each caller
// words the kind from its own text catalog. What needs the disk or the value the file held stays
// with its caller: a folder or file that is there, a parked list's items, the fields of a family's
// records. A family field is held to its form (a list of records, a map, or one record). A word
// block (the control `words`) is checked against the list its `from` names for its words and
// against that list's flags (`flagged`) for its flags.

import { BLOCK_LISTS, type WordBlock } from '../../../shapes/boards/words.ts';
import {
    classOfHex,
    familyForm,
    flagSources,
    hueNames,
    hueOfClass,
    listedSources,
    pickedSources,
    takesRecord,
    type CatalogEntry,
    type Form
} from './options.ts';

/** What is wrong with a value, and the arguments its words are filled in with. */
export type ValueProblem =
    | { kind: 'boolean' }
    | { kind: 'number' }
    | { kind: 'whole'; min: number | undefined; max: number | undefined }
    | { kind: 'range'; min: number | undefined; max: number | undefined }
    | { kind: 'text' }
    | { kind: 'empty' }
    | { kind: 'form'; form: Form }
    | { kind: 'words' }
    | { kind: 'numbers' }
    | { kind: 'strings' }
    | { kind: 'records' }
    | { kind: 'pairs' }
    | { kind: 'record' }
    | { kind: 'block' }
    | { kind: 'flag'; sources: string[] }
    | { kind: 'choice'; values: string[] }
    | { kind: 'source'; sources: string[] }
    | { kind: 'glyph' }
    | { kind: 'hue' }
    | { kind: 'colour' }
    | { kind: 'path' }
    | { kind: 'hub_path' }
    | { kind: 'slots'; slots: string[] };

/** The lists a check of a value reads, each absent when the caller does not hold it. */
export type RuleLists = {
    /**
     * The items of every source the entry names in `from`, together; null
     * while one of them is not held, in which case a word is not checked against the list.
     */
    sourced?: string[] | null;
    /**
     * The flags of every source a word block names in `from` that carries flags, together; null
     * while one of them is not held, in which case a flag is not checked against the list.
     */
    flagged?: string[] | null;
    /** Words a multi takes besides the list, because the file already holds them. */
    held?: readonly string[];
    /** The glyph names; the control is not checked without them. */
    glyphs?: readonly string[];
    /**
     * The merged configuration, whose palette says the hues and colours; not checked without it.
     */
    config?: Record<string, unknown>;
};

/**
 * What each form of a text looks like. An `https_address` is an `https://` address whose host is a
 * DNS name, with an optional port and a path holding no white space, quote or backslash, so a
 * placeholder such as `{tenant}` may stand in it; an `https_origin` is the scheme, the host and an
 * optional port and nothing after, so it can name a git credential context with nothing a git
 * config line splits on; a `row_key` is lowercase letters, digits, dashes and underscores, the
 * words a file name may be made of.
 */
export const FORM_PATTERNS: Record<Form, RegExp> = {
    program: /^[^/\s]+$/,
    extension: /^\.[^./\s]+$/,
    bundle_id: /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/,
    https_address: /^https:\/\/[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(:[0-9]{1,5})?(\/[^\s'"\\]*)?$/,
    https_origin: /^https:\/\/[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(:[0-9]{1,5})?$/,
    row_key: /^[a-z0-9_-]+$/
};

/** Whether a text has a form: `program` (no slash or white space), `extension` or `bundle_id`. */
export function hasForm(form: Form, text: string): boolean {
    return FORM_PATTERNS[form].test(text);
}

/** Whether a value is a finite number. */
function finite(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/** Whether a value is a list of texts. */
function stringList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((one) => typeof one === 'string');
}

/** Whether a value is a map. */
function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** What is wrong with a number: not whole when `whole` holds, or outside `min` and `max`. */
function numberProblem(spec: CatalogEntry, value: number): ValueProblem | null {
    const { min, max } = spec;
    if (spec.whole === true && !Number.isInteger(value)) return { kind: 'whole', min, max };
    if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
        return { kind: 'range', min, max };
    }
    return null;
}

/**
 * What is wrong with a text that must have the entry's form, if it names one. The empty text is
 * the value of an entry that sets `empty`, such as an address the hub leaves out.
 */
function formProblem(spec: CatalogEntry, text: string): ValueProblem | null {
    if (text === '' && spec.empty !== undefined) return null;
    if (spec.form === undefined || hasForm(spec.form, text)) return null;
    return { kind: 'form', form: spec.form };
}

/** The words a choice may take, or null while a list the entry names is not held. */
function itemsOf(spec: CatalogEntry, lists: RuleLists): string[] | null {
    const named = listedSources(spec).length > 0 || pickedSources(spec) !== undefined;
    if (!named) return spec.options ?? [];
    if (lists.sourced === undefined || lists.sourced === null) return null;
    return [...(spec.options ?? []), ...lists.sourced];
}

/** The problem a word outside the list is: the sources the entry names, else its own words. */
function notListed(spec: CatalogEntry): ValueProblem {
    const sources = [...listedSources(spec), ...Object.values(pickedSources(spec)?.sources ?? {})];
    return sources.length === 0
        ? { kind: 'choice', values: spec.options ?? [] }
        : { kind: 'source', sources };
}

/** What is wrong with a choice: the empty word without `empty`, or a word outside the list. */
function choiceProblem(spec: CatalogEntry, word: string, lists: RuleLists): ValueProblem | null {
    if (word === '') return spec.empty === undefined ? { kind: 'empty' } : null;
    const items = itemsOf(spec, lists);
    return items === null || items.includes(word) ? null : notListed(spec);
}

/**
 * What is wrong with a multi: not words, or a word outside the list that the file does not hold.
 */
function multiProblem(spec: CatalogEntry, value: unknown, lists: RuleLists): ValueProblem | null {
    let picked: string[] | null = null;
    if (spec.joined === true) {
        if (
            typeof value === 'string' &&
            (value === '' || value.split(' ').every((w) => w !== ''))
        ) {
            picked = value.split(' ').filter((word) => word !== '');
        }
    } else if (stringList(value)) {
        picked = value;
    } else if (typeof value === 'string') {
        picked = [value];
    }
    if (picked === null) return { kind: 'words' };
    const items = itemsOf(spec, lists);
    if (items === null) return null;
    const held = lists.held ?? [];
    const stray = picked.find((word) => !items.includes(word) && !held.includes(word));
    return stray === undefined ? null : notListed(spec);
}

/**
 * What is wrong with a word block: not a map of the four lists, each a list of texts, a word
 * outside the list `from` names, or a flag outside that list's flags.
 */
function blockProblem(spec: CatalogEntry, value: unknown, lists: RuleLists): ValueProblem | null {
    if (!isMap(value)) return { kind: 'block' };
    const held = Object.entries(value);
    if (held.some(([key, one]) => !BLOCK_LISTS.some((list) => list === key) || !stringList(one))) {
        return { kind: 'block' };
    }
    const block = value as WordBlock;
    const words = [...(block.words ?? []), ...(block.not_words ?? [])];
    const flags = [...(block.flags ?? []), ...(block.not_flags ?? [])];
    const items = itemsOf(spec, lists);
    if (items !== null && words.some((word) => !items.includes(word))) return notListed(spec);
    const flagged = lists.flagged;
    if (flagged === undefined || flagged === null) return null;
    return flags.every((flag) => flagged.includes(flag))
        ? null
        : { kind: 'flag', sources: flagSources(spec) };
}

/**
 * What is wrong with a path: the form of a hub path, or an absolute or `~/` path. The empty text is
 * the value of an entry that sets `empty`, such as a file the hub leaves out.
 */
function pathProblem(spec: CatalogEntry, text: string): ValueProblem | null {
    if (text === '' && spec.empty !== undefined) return null;
    if (spec.control === 'path') {
        return text.startsWith('~/') || text.startsWith('/') ? null : { kind: 'path' };
    }
    const unfit = text === '' || text.startsWith('/') || text.includes('\\');
    return unfit || text.split('/').includes('..') ? { kind: 'hub_path' } : null;
}

/** What is wrong with the items of a list, each checked by the entry's `items`, bounds and form. */
function listProblem(spec: CatalogEntry, value: unknown): ValueProblem | null {
    if (spec.items === 'number') {
        if (!Array.isArray(value) || !value.every(finite)) return { kind: 'numbers' };
        for (const item of value) {
            const problem = numberProblem(spec, item);
            if (problem !== null) return problem;
        }
    } else {
        if (!stringList(value)) return { kind: 'strings' };
        for (const item of value) {
            const problem = formProblem(spec, item);
            if (problem !== null) return problem;
        }
    }
    const slots = spec.slots;
    if (slots !== undefined && value.length !== slots.length) return { kind: 'slots', slots };
    return null;
}

/**
 * What is wrong with the shape of a family field's value, by its form: a list of records, a map
 * whose every value is one text, number or flag (or a list of them where the field holds lists or
 * its value is a list, a record where its value is a family of one record, and a text or a record
 * where its value takes either), or one record. Each field of a record, a key and a value are the
 * caller's to check, against the lists of their own sources.
 */
function familyProblem(spec: CatalogEntry, value: unknown): ValueProblem | null {
    switch (familyForm(spec)) {
        case 'record':
            return isMap(value) ? null : { kind: 'record' };
        case 'pairs': {
            if (!isMap(value)) return { kind: 'pairs' };
            const inner = spec.fields?.value;
            const control = inner?.control;
            const lists =
                spec.holds === 'lists' ||
                control === 'list' ||
                control === 'multi' ||
                control === 'parked';
            const records = control === 'records' && inner?.holds === 'record';
            const either = inner !== undefined && takesRecord(inner);
            const fits = (one: unknown): boolean =>
                (records && isMap(one)) ||
                (either && isMap(one)) ||
                (!records && scalar(one)) ||
                (lists && Array.isArray(one) && one.every(scalar));
            return Object.values(value).every(fits) ? null : { kind: 'pairs' };
        }
        default:
            return Array.isArray(value) && value.every(isMap) ? null : { kind: 'records' };
    }
}

/** Whether a value is one text, number or flag. */
function scalar(value: unknown): boolean {
    return ['string', 'number', 'boolean'].includes(typeof value);
}

/** What is wrong with a glyph, a hue or a colour, checked against the lists handed in. */
function paletteProblem(spec: CatalogEntry, text: string, lists: RuleLists): ValueProblem | null {
    switch (spec.control) {
        case 'glyph':
            return lists.glyphs === undefined || lists.glyphs.includes(text)
                ? null
                : { kind: 'glyph' };
        case 'hue':
            return lists.config === undefined || hueNames(lists.config).includes(text)
                ? null
                : { kind: 'hue' };
        default: {
            if (lists.config === undefined) return null;
            const name = classOfHex(lists.config, text);
            return name !== undefined && hueOfClass(name) !== undefined ? null : { kind: 'colour' };
        }
    }
}

/**
 * What is wrong with a value for an entry or a field, or null when it fits. A record given to a
 * text that takes one (takesRecord) fits here, its fields the caller's to check. The type comes
 * first, then a whole number, then the range, then the lists; a list the caller does not hold is
 * not checked against, so a word is taken while its list is not there.
 */
export function valueProblem(
    spec: CatalogEntry,
    value: unknown,
    lists: RuleLists = {}
): ValueProblem | null {
    if (takesRecord(spec) && isMap(value)) return null;
    switch (spec.control) {
        case 'toggle':
            return typeof value === 'boolean' ? null : { kind: 'boolean' };
        case 'number':
            return finite(value) ? numberProblem(spec, value) : { kind: 'number' };
        case 'multi':
            return multiProblem(spec, value, lists);
        case 'list':
            return listProblem(spec, value);
        case 'parked':
            return stringList(value) ? null : { kind: 'strings' };
        case 'records':
            return familyProblem(spec, value);
        case 'words':
            return blockProblem(spec, value, lists);
        case 'text':
        case 'long':
        case 'choice':
        case 'glyph':
        case 'hue':
        case 'colour':
        case 'folder':
        case 'file':
        case 'path':
            break;
        default:
            return null;
    }
    if (typeof value !== 'string') return { kind: 'text' };
    switch (spec.control) {
        case 'choice':
            return choiceProblem(spec, value, lists);
        case 'glyph':
        case 'hue':
        case 'colour':
            return paletteProblem(spec, value, lists);
        case 'folder':
        case 'file':
        case 'path':
            return pathProblem(spec, value);
        default:
            return formProblem(spec, value);
    }
}

/**
 * What is wrong with one item of a list of numbers or texts, by the list's `items`, bounds and
 * form: the check the Settings view makes of the box an item is typed in.
 */
export function itemProblem(spec: CatalogEntry, item: number | string): ValueProblem | null {
    if (typeof item === 'number') return numberProblem(spec, item);
    return formProblem(spec, item);
}
