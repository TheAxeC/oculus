// Layer 2, server. One list option or one family of a tracked config file set to a value, in place:
// the Settings view's write for the editors of a list, a key/value table and a form of records.
//
// The options catalog (config/catalogs/options.yml) decides what may be written: the file must be
// one of its tracked files, the key one of its entries, and the entry a list (`control: list`) or a
// family (`fields`). A single value goes through config-key.ts, the rail and the arrangements keep
// their own write (rail.ts), and the machine's own file, local.yml, is refused before anything is
// read.
//
// The write is refused, with nothing written, unless the file still holds `base` at the key (the
// value the editor read), the value has the shape the entry describes, the key's lines can be
// rewritten in place (block-edit.ts keeps every byte outside them), the edited text reads back as
// the original with this key changed to the value and in the value's order, and config-checks.ts's
// readers accept the merged configuration. A value equal to the file's, in order, writes nothing.
//
// The function is synchronous from the read of the file to its write, which is what lets two
// writes made at once both land: each reads the file the other has already written.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isAlias, isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document, Pair } from 'yaml';
import { isMap, sameInOrder } from '../../../../data/helpers/guards.ts';
import { LOCAL_NAME, configDir, loadConfig, textCatalog } from '../../../../data/sources/config.ts';
import { catalogOf, type CatalogEntry } from '../../../../data/sources/config/catalog/options.ts';
import { words } from '../../../core/words.ts';
import { setBlock } from '../../block-edit.ts';
import {
    kept,
    optionNow,
    optionOf,
    refusedBy,
    refusing,
    type ConfigKeyOutcome,
    type OptionNow,
    written
} from './config-checks.ts';

/** The keys that name something on every object, which no key or field of a value may be. */
const RESERVED = ['__proto__', 'constructor', 'prototype'];

/** The options with a write of their own: the rail and the arrangements. */
const OWN_WRITE = ['rail', 'arrangements'];

type Plain = Record<string, unknown>;

/** The collection a key names in a file's text: its parsed value, or why there is none. */
type Held =
    { kind: 'unparsed' } | { kind: 'missing' } | { kind: 'found'; seq: boolean; value: unknown };

/** Whether a value is one scalar: text, a number, a boolean or a null. */
function isScalarValue(value: unknown): boolean {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

/**
 * Whether a value of a key/value table is a scalar, or a list of scalars where the table holds
 * lists.
 */
function isTableValue(value: unknown, lists: boolean): boolean {
    return isScalarValue(value) || (lists && Array.isArray(value) && value.every(isScalarValue));
}

/**
 * The collection a dotted key path names. Each segment is a string key of a map, and the node at
 * the end is a bare list or map: a scalar, a null, an alias, an anchored or tagged node, a key
 * that holds a dot and a path through an alias all answer `missing`.
 */
function locate(source: string, key: string): Held {
    const doc: Document = parseDocument(source);
    if (doc.errors.length > 0) return { kind: 'unparsed' };
    let node: unknown = doc.contents;
    for (const segment of key.split('.')) {
        if (!isYamlMap(node) || isAlias(node)) return { kind: 'missing' };
        const pair: Pair | undefined = node.items.find(
            (item) => isScalar(item.key) && item.key.value === segment
        );
        node = pair?.value;
    }
    if (!(isSeq(node) || isYamlMap(node)) || node.anchor !== undefined || node.tag !== undefined) {
        return { kind: 'missing' };
    }
    return { kind: 'found', seq: isSeq(node), value: node.toJS(doc) };
}

/** The first key of a reserved name at any depth of a value, or null. */
function reservedIn(value: unknown): string | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = reservedIn(item);
            if (found !== null) return found;
        }
        return null;
    }
    if (!isMap(value)) return null;
    for (const [name, item] of Object.entries(value)) {
        if (RESERVED.includes(name)) return name;
        const found = reservedIn(item);
        if (found !== null) return found;
    }
    return null;
}

/** The names of the fields a record of a family may hold: the catalog's, and those already held. */
function allowedFields(
    entry: CatalogEntry,
    held: unknown
): { listed: Set<string>; keyed: Set<string> } {
    const names = Object.keys(entry.fields ?? {});
    const extra = new Set<string>();
    const records: unknown[] = [];
    const collect = (value: unknown): void => {
        if (Array.isArray(value)) value.forEach(collect);
        else if (isMap(value)) records.push(value);
    };
    if (Array.isArray(held)) collect(held);
    else if (isMap(held)) Object.values(held).forEach(collect);
    for (const record of records) {
        for (const name of Object.keys(record as Plain)) extra.add(name);
    }
    return {
        listed: new Set([...names, ...extra]),
        keyed: new Set([...names.filter((name) => name !== 'key'), ...extra])
    };
}

/** The sentence for a record that does not fit, or null when it does. */
function recordProblem(
    record: unknown,
    label: string,
    allowed: Set<string>,
    text: Record<string, string>
): string | null {
    if (!isMap(record)) return words(text, 'server.config_value.bad_record', label);
    for (const name of Object.keys(record)) {
        if (!allowed.has(name)) return words(text, 'server.config_value.bad_field', label, name);
    }
    return null;
}

/**
 * The sentence for a value that is not the entry's shape, or null when it is. A list option is a
 * list of strings. A family is the collection kind the file holds: a list of records, a map of
 * entries (a key/value table when its fields are `key` and `value`, which takes a list of values
 * only where the catalog entry says `holds: lists`, whatever the file holds now, so an emptied
 * table keeps its kind), a map of records, or a map of lists of records.
 */
function misfit(
    entry: CatalogEntry,
    held: unknown,
    value: unknown,
    text: Record<string, string>
): string | null {
    if (entry.fields === undefined) {
        const ok = Array.isArray(value) && value.every((item) => typeof item === 'string');
        return ok ? null : words(text, 'server.config_value.not_strings');
    }
    const allowed = allowedFields(entry, held);
    if (Array.isArray(held)) {
        if (!Array.isArray(value)) return words(text, 'server.config_value.wrong_list');
        for (const [at, record] of value.entries()) {
            const problem = recordProblem(record, String(at + 1), allowed.listed, text);
            if (problem !== null) return problem;
        }
        return null;
    }
    if (!isMap(value)) return words(text, 'server.config_value.wrong_map');
    const names = Object.keys(entry.fields);
    const table = names.length === 2 && names.includes('key') && names.includes('value');
    const lists = entry.holds === 'lists';
    const listValues = table && lists;
    for (const [name, item] of Object.entries(value)) {
        if (table) {
            if (!isTableValue(item, listValues)) {
                return listValues
                    ? words(text, 'server.config_value.wants_scalar', name)
                    : words(text, 'server.config_value.wants_value', name);
            }
        } else if (lists) {
            if (!Array.isArray(item)) return words(text, 'server.config_value.wants_list', name);
            for (const [at, record] of item.entries()) {
                const problem = recordProblem(record, `${name} ${at + 1}`, allowed.keyed, text);
                if (problem !== null) return problem;
            }
        } else {
            if (Array.isArray(item)) return words(text, 'server.config_value.wants_record', name);
            const problem = recordProblem(item, name, allowed.keyed, text);
            if (problem !== null) return problem;
        }
    }
    return null;
}

/** The value at a dotted key path of a parsed file, or undefined. */
function valueAt(parsed: unknown, key: string): unknown {
    let node = parsed;
    for (const segment of key.split('.')) {
        if (!isMap(node)) return undefined;
        node = node[segment];
    }
    return node;
}

/**
 * The value the file holds at one list or family now, and whether it is still there as a list or
 * a map: the file is one the catalog tracks, parses, and holds the key as a bare collection. An
 * undo reads it; a file it may not read throws.
 */
export function configValueNow(engine: string, file: string, key: string): OptionNow {
    return optionNow(engine, file, key, (text) => {
        const held = locate(text, key);
        return held.kind === 'found' ? { found: true, value: held.value } : null;
    });
}

/**
 * Set one list option or family of a tracked config file. A refusal answers the one reason and
 * writes nothing; a value equal to the one held writes nothing and answers with nothing changed.
 * A file that cannot be read or written throws, which the route answers as `unwritable`.
 */
export function writeConfigValue(
    engine: string,
    file: string,
    key: string,
    value: unknown,
    base: unknown
): ConfigKeyOutcome {
    const before = loadConfig(engine);
    const text = textCatalog(before.config);
    const refuse = refusing(file, key);
    if (file === LOCAL_NAME) return refuse(words(text, 'server.config_value.local'));
    const entry = optionOf(catalogOf(before.config), file, key);
    if (entry === null) return refuse(words(text, 'server.config_value.no_entry'));
    if (OWN_WRITE.includes(key) && file === 'layout.yml')
        return refuse(words(text, 'server.config_value.own_write'));
    const collection = entry.fields !== undefined || entry.control === 'list';
    if (!collection) return refuse(words(text, 'server.config_value.single'));

    const path = join(configDir(engine), file);
    const source = readFileSync(path, 'utf8');
    const found = locate(source, key);
    if (found.kind === 'unparsed') return refuse(words(text, 'server.config_value.not_parsed'));
    if (found.kind === 'missing') return refuse(words(text, 'server.config_value.not_in_file'));
    const held = found.value;
    if (!isDeepStrictEqual(held, base)) return refuse(words(text, 'server.config_value.changed'));
    if (sameInOrder(held, value)) return { changed: [], refused: [] };
    const reserved = reservedIn(value);
    if (reserved !== null) return refuse(words(text, 'server.config_value.reserved', reserved));
    const unfit = misfit(entry, held, value, text);
    if (unfit !== null)
        return { changed: [], refused: [{ field: `${file}:${key}`, reason: unfit }] };

    const edited = setBlock(source, key.split('.'), value);
    if (edited === null) return refuse(words(text, 'server.config_value.unsupported'));
    const reread = parseDocument(edited);
    const returned = reread.errors.length === 0 ? valueAt(reread.toJS(), key) : undefined;
    if (!kept(source, edited, key, value) || !sameInOrder(returned, value))
        return refuse(words(text, 'server.config_value.not_kept'));
    const reason = refusedBy(engine, file, edited, before);
    if (reason !== null) return { changed: [], refused: [{ field: `${file}:${key}`, reason }] };

    return written(path, file, key, edited, { before: held, after: value });
}
