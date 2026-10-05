// Layer 2, server. One list option or one family of a tracked config file set to a value, in place:
// the Settings view's write for the editors of a list, a multi, a parked list, a key/value table
// and a form of records.
//
// The options catalog (config/catalogs/options.yml) decides what may be written: the file must be
// one of its tracked files, the key one of its entries, and the entry a list-valued control
// (`list`, `multi`, `parked`) or a family (`fields`). A single value goes through config-key.ts,
// the rail and the arrangements keep their own write (rail.ts), and the machine's own file,
// local.yml, is refused before anything is read.
//
// The write is refused, with nothing written, unless the file still holds `base` at the key (the
// value the editor read), the value fits the entry (config-fit.ts: its shape, and every field
// against its control and its list), the key's lines can be rewritten in place (block-edit.ts
// keeps every byte outside them), the edited text reads back as the original with this key changed
// to the value and in the value's order, and config-checks.ts's readers accept the merged
// configuration. A value equal to the file's, in order, writes nothing. The lists a field is
// checked against come from the write target (`inputs`); without them, as in an undo, no value is
// checked against the entry and the file is put back as it was.
//
// The function is synchronous from the read of the file to its write, which is what lets two
// writes made at once both land: each reads the file the other has already written.
//
// The record of a write carries the text it replaced. An undo puts that text back over what the
// write left (`putBackConfigValue`) when the file still holds it there, so the file comes back
// byte for byte; any other undo is this write again with the earlier value.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isAlias, isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document, Pair } from 'yaml';
import { z } from 'zod';
import { isMap, sameInOrder } from '../../../../data/helpers/guards.ts';
import { LOCAL_NAME, configDir, loadConfig, textCatalog } from '../../../../data/sources/config.ts';
import { catalogOf } from '../../../../data/sources/config/catalog/options.ts';
import { words } from '../../../core/words.ts';
import { setBlock } from '../../block-edit.ts';
import { isCollection, valueProblem } from './config-fit.ts';
import { sourcesFor, type SourceInputs } from './config-sources.ts';
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

/** The collection a key names in a file's text: its parsed value, or why there is none. */
type Held =
    { kind: 'unparsed' } | { kind: 'missing' } | { kind: 'found'; seq: boolean; value: unknown };

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
    base: unknown,
    inputs?: SourceInputs
): ConfigKeyOutcome {
    const before = loadConfig(engine);
    const text = textCatalog(before.config);
    const refuse = refusing(file, key);
    if (file === LOCAL_NAME) return refuse(words(text, 'server.config_value.local'));
    const entry = optionOf(catalogOf(before.config), file, key);
    if (entry === null) return refuse(words(text, 'server.config_value.no_entry'));
    if (OWN_WRITE.includes(key) && file === 'layout.yml')
        return refuse(words(text, 'server.config_value.own_write'));
    if (!isCollection(entry)) return refuse(words(text, 'server.config_value.single'));

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
    const sources = inputs === undefined ? null : sourcesFor(inputs, before.config);
    const unfit = valueProblem(entry, held, value, { text, sources });
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

    return written(path, file, key, edited, { before: held, after: value }, source);
}

/** A record's replaced text as the log holds it: a whole offset and two texts, else none. */
const replacedShape = z.object({ offset: z.int().min(0), before: z.string(), after: z.string() });

/**
 * Take a config-value write back by putting the text it replaced over the text it left, so the
 * file comes back byte for byte, its alignment and line ends included. It applies only when the
 * file holds exactly the text the write left at the offset the record names and the value at the
 * key is the one the write set; the result must read back as the file with that one key at the
 * record's earlier value, and pass the config checks a write passes. A record without the text,
 * one whose text is malformed, and a file that has moved on answer null, and the undo goes through
 * the value write, which takes the key back to the record's earlier value. The file the undo
 * writes is recorded with its own replaced text.
 */
export function putBackConfigValue(
    engine: string,
    file: string,
    key: string,
    values: { replaced?: unknown; before: unknown; after: unknown }
): ConfigKeyOutcome | null {
    const text = replacedShape.safeParse(values.replaced);
    if (!text.success) return null;
    const { offset, before: earlier, after: later } = text.data;
    const loaded = loadConfig(engine);
    if (optionOf(catalogOf(loaded.config), file, key) === null) return null;
    const path = join(configDir(engine), file);
    const source = readFileSync(path, 'utf8');
    if (offset > source.length || !source.startsWith(later, offset)) return null;
    const found = locate(source, key);
    if (found.kind !== 'found' || !isDeepStrictEqual(found.value, values.after)) return null;
    const edited = `${source.slice(0, offset)}${earlier}${source.slice(offset + later.length)}`;
    if (edited === source) return null;
    const reread = parseDocument(edited);
    const returned = reread.errors.length === 0 ? valueAt(reread.toJS(), key) : undefined;
    if (!kept(source, edited, key, values.before) || !sameInOrder(returned, values.before)) {
        return null;
    }
    const reason = refusedBy(engine, file, edited, loaded);
    if (reason !== null) return { changed: [], refused: [{ field: `${file}:${key}`, reason }] };
    return written(path, file, key, edited, { before: found.value, after: values.before }, source);
}
