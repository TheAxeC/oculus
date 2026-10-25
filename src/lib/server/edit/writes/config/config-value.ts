// Layer 2, server. One list option or one family of oculus's defaults files set to a value: the
// Settings view's write for the editors of a list, a multi, a parked list, a key/value table and a
// form of records, and the write the rail's list and the audit's mute list go through.
//
// The options files (config/options/) decide what may be written: the file must be one of the
// files they describe (a defaults file, or a catalog or schema file of their subfolders, such as
// `catalogs/vocab.yml`), the key one of their entries, and the entry a list-valued control (`list`,
// `multi`, `parked`), a word block (`words`) or a family (`fields`). A single value goes through
// config-key.ts, the rail and the audit's mute list have a write of their own that checks the value
// by its own rule and then comes here (`own`), the workbench layout is edited in the file, and the
// machine's own file, a hub's `.oculus/local.yml` or a link to one, is refused before the file is
// read.
//
// The value lands where config-place.ts places the key: a key of the hub list in the primary hub's
// settings file and any other in the `settings:` map of the open workspace file. There the value
// the reader sees is written as what makes the merge give it back. A key laid over oculus's value
// in oculus's place (data/sources/config/merge/in-place.ts), a vocab key of the hub's file and a
// catalog of the workspace file, is written as the inverse of that merge: the words or rows the
// reader changed or added, `<word>: null` or `{ <field>: x, removed: true }` for each of oculus's
// the reader took out, and nothing for one left as oculus ships it. Any other key of the hub's
// file is written whole. In the workspace file a list of records whose option names a `key:` field
// is written as every entry of it then one `{ <key>: x, removed: true }` for each of oculus's
// entries it does not hold, a map family as every key of it then `x: null` for each of oculus's
// keys it does not hold (data/sources/config/merge/keyed.ts), and any other value whole.
//
// The write is refused, with nothing written, unless the merged configuration still holds `base`
// at the key (the value the editor read), the value fits the entry (config-fit.ts: its shape, and
// every field against its control and its list), the key's lines can be rewritten in place
// (block-edit.ts keeps every byte outside them) or added, the edited text reads back as the
// original with this key changed to the written value and in its order, and config-checks.ts's
// readers accept the merged configuration. A value equal to the one in force, in order, writes
// nothing. The lists a field is checked against come from the write target (`inputs`); without
// them a field is checked for its type alone.
//
// An undo writes the value the file held back (`stored`): `base` is then the value the file holds
// at the key's place, the value is written as it is, and no value is checked against the entry.
//
// The function is synchronous from the read of the file to its write, which is what lets two
// writes made at once both land: each reads the file the other has already written.
//
// The record of a write carries the text it replaced. An undo puts that text back over what the
// write left (`putBackConfigValue`) when the file still holds it there, so the file comes back
// byte for byte; any other undo is this write again with the earlier value.

import { isDeepStrictEqual } from 'node:util';
import { isAlias, isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document, Pair } from 'yaml';
import { isMap, sameInOrder } from '../../../../data/helpers/guards.ts';
import { LOCAL_NAME } from '../../../../data/sources/config.ts';
import { catalogOf, type CatalogEntry } from '../../../../data/sources/config/catalog/options.ts';
import { inPlaceOf, inPlaceOverride } from '../../../../data/sources/config/merge/in-place.ts';
import { familyOverride, recordsOverride } from '../../../../data/sources/config/merge/keyed.ts';
import { familyKind } from '../../../../data/sources/config/merge/workspace-layer.ts';
import { words } from '../../../core/words.ts';
import { setBlock } from '../../block-edit.ts';
import { isCollection, valueProblem } from './config-fit.ts';
import { sourcesFor, type SourceInputs } from './config-sources.ts';
import { insertKey, kept, mergedAt, refusedBy, replacedShape, written } from './config-checks.ts';
import {
    absentIn,
    blockLevels,
    isMachinePlace,
    loadLayers,
    opening,
    optionNow,
    optionOf,
    placeOf,
    placeRefusal,
    placeText,
    type ConfigKeyOutcome,
    type ConfigLayers,
    type OptionNow,
    type Place
} from './config-place.ts';

/** The keys that name something on every object, which no key or field of a value may be. */
const RESERVED = ['__proto__', 'constructor', 'prototype'];

/** The options with a write of their own: the rail, the arrangements and the workbench. */
const OWN_WRITE = ['rail', 'arrangements', 'workbench'];

/** The collection a key names in a file's text: its parsed value, or why there is none. */
type Held =
    { kind: 'unparsed' } | { kind: 'missing' } | { kind: 'found'; seq: boolean; value: unknown };

/**
 * How a value write is made beyond its value: the lists a field is checked against (`inputs`), the
 * hubs whose `local.yml` no write reaches, whether the value is the one the file held (`stored`, an
 * undo) rather than the one the reader sees, whether the caller checked the value by a rule of its
 * own (`own`, the rail and the audit's mute list), and whether a key the file does not hold is
 * added with a value equal to the one in force (`copy`, Edit in a file).
 */
export type ValueWriteOptions = {
    inputs?: SourceInputs;
    hubs?: readonly string[];
    stored?: boolean;
    own?: boolean;
    copy?: boolean;
};

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
 * What the file at a place holds for the value the reader sees, so the merge reads it back: a key
 * merged in oculus's place as the inverse of that merge over oculus's value (oculus's alone for a
 * key of the hub's file, oculus's with the hub's file for a catalog of the workspace file), any
 * other key of the hub's file whole, and any other key of the workspace file over the hub's value
 * (a keyed list or a map family entry by entry, any other value whole).
 */
function storedForm(
    engine: string,
    layers: ConfigLayers,
    place: Place,
    entry: CatalogEntry,
    key: string,
    seen: unknown
): unknown {
    const shape = inPlaceOf(key);
    if (shape !== undefined) {
        const under = place.layer === 'hub' ? {} : { hub: layers.hub };
        return inPlaceOverride(shape, mergedAt(loadLayers(engine, under).config, key), seen);
    }
    if (place.layer === 'hub') return seen;
    const kind = familyKind(entry);
    if (kind.kind !== 'records' && kind.kind !== 'map') return seen;
    const oculus = mergedAt(loadLayers(engine, { hub: layers.hub }).config, key);
    if (kind.kind === 'records') {
        if (!Array.isArray(seen)) return seen;
        return recordsOverride(Array.isArray(oculus) ? oculus : [], seen, kind.field);
    }
    if (!isMap(seen)) return seen;
    return familyOverride(isMap(oculus) ? oculus : {}, seen);
}

/**
 * The value the file at the option's place holds now, and whether it is still there as a list or a
 * map: the option is one the options files name, the file parses, and it holds the key as a bare
 * collection. An undo reads it; a file it may not read throws.
 */
export function configValueNow(
    engine: string,
    layers: ConfigLayers,
    file: string,
    key: string
): OptionNow {
    return optionNow(engine, layers, file, key, (text, at) => {
        const held = locate(text, at);
        return held.kind === 'found' ? { found: true, value: held.value } : null;
    });
}

/**
 * Set one list option or family of a defaults file at its place over the layers. A refusal answers
 * the one reason and writes nothing; a value equal to the one in force writes nothing and answers
 * with nothing changed. A file that cannot be read or written throws, which the route answers as
 * `unwritable`.
 */
export function writeConfigValue(
    engine: string,
    file: string,
    key: string,
    value: unknown,
    base: unknown,
    layers: ConfigLayers,
    options: ValueWriteOptions = {}
): ConfigKeyOutcome {
    const { before, text, refuse } = opening(engine, file, key, layers);
    if (file === LOCAL_NAME) return refuse(words(text, 'server.config_value.local'));
    const entry = optionOf(catalogOf(before.config), file, key);
    if (entry === null) return refuse(words(text, 'server.config_value.no_entry'));
    if (options.own !== true && OWN_WRITE.includes(key) && file === 'layout.yml')
        return refuse(words(text, 'server.config_value.own_write'));
    if (!isCollection(entry)) return refuse(words(text, 'server.config_value.single'));
    const place = placeOf(layers, file, key);
    if (place === null) return refuse(placeRefusal(text, file, key));

    if (isMachinePlace(place, options.hubs ?? []))
        return refuse(words(text, 'server.config_value.local'));
    const onDisk = placeText(place);
    const source = onDisk ?? '';
    const found = locate(source, place.at);
    if (found.kind === 'unparsed') return refuse(words(text, 'server.config_value.not_parsed'));
    const adding = found.kind === 'missing' && (onDisk === null || absentIn(source, place.at));
    if (found.kind === 'missing' && !adding) {
        return refuse(words(text, 'server.config_value.not_in_file'));
    }
    const fileHeld = found.kind === 'found' ? found.value : mergedAt(before.config, key);
    const shown = options.stored === true ? fileHeld : mergedAt(before.config, key);
    if (!isDeepStrictEqual(shown, base)) return refuse(words(text, 'server.config_value.changed'));
    const copying = options.copy === true && adding;
    if (sameInOrder(shown, value) && !copying) return { changed: [], refused: [] };
    const reserved = reservedIn(value);
    if (reserved !== null) return refuse(words(text, 'server.config_value.reserved', reserved));
    if (options.stored !== true && options.own !== true) {
        const { inputs } = options;
        const sources = inputs === undefined ? null : sourcesFor(inputs, before.config);
        const unfit = valueProblem(entry, shown, value, { text, sources });
        if (unfit !== null) return refuse(unfit);
    }
    const stored =
        options.stored === true ? value : storedForm(engine, layers, place, entry, key, value);
    if (sameInOrder(fileHeld, stored) && !adding) return { changed: [], refused: [] };

    const edited = adding
        ? insertKey(source, place.at, stored, blockLevels(place))
        : setBlock(source, place.at.split('.'), stored);
    if (edited === null) return refuse(words(text, 'server.config_value.unsupported'));
    const reread = parseDocument(edited);
    const returned = reread.errors.length === 0 ? valueAt(reread.toJS(), place.at) : undefined;
    if (!kept(source, edited, place.at, stored) || !sameInOrder(returned, stored))
        return refuse(words(text, 'server.config_value.not_kept'));
    const reason = refusedBy(engine, layers, place, edited, before);
    if (reason !== null) return refuse(reason);

    return written(
        place.path,
        file,
        key,
        edited,
        { before: fileHeld, after: stored },
        source,
        adding
    );
}

/**
 * Take a config-value write back by putting the text it replaced over the text it left, so the
 * file comes back byte for byte, its alignment and line ends included. It applies only when the
 * file holds exactly the text the write left at the offset the record names and the value at the
 * key's place is the one the write set; the result must read back as the file with that one key at
 * the record's earlier value, and pass the config checks a write passes. A record without the text,
 * one whose text is malformed, a layer that is not there and a file that has moved on answer null,
 * and the undo goes through the value write, which takes the key back to the record's earlier
 * value. The file the undo writes is recorded with its own replaced text.
 */
export function putBackConfigValue(
    engine: string,
    file: string,
    key: string,
    values: { replaced?: unknown; before: unknown; after: unknown },
    layers: ConfigLayers,
    hubs: readonly string[] = []
): ConfigKeyOutcome | null {
    const text = replacedShape.safeParse(values.replaced);
    if (!text.success) return null;
    const { offset, before: earlier, after: later } = text.data;
    const loaded = loadLayers(engine, layers);
    if (optionOf(catalogOf(loaded.config), file, key) === null) return null;
    const place = placeOf(layers, file, key);
    if (place === null || isMachinePlace(place, hubs)) return null;
    const source = placeText(place);
    if (source === null) return null;
    if (offset > source.length || !source.startsWith(later, offset)) return null;
    const found = locate(source, place.at);
    if (found.kind !== 'found' || !isDeepStrictEqual(found.value, values.after)) return null;
    const edited = `${source.slice(0, offset)}${earlier}${source.slice(offset + later.length)}`;
    if (edited === source) return null;
    const reread = parseDocument(edited);
    const returned = reread.errors.length === 0 ? valueAt(reread.toJS(), place.at) : undefined;
    if (!kept(source, edited, place.at, values.before) || !sameInOrder(returned, values.before)) {
        return null;
    }
    const reason = refusedBy(engine, layers, place, edited, loaded);
    if (reason !== null) return { changed: [], refused: [{ field: `${file}:${key}`, reason }] };
    return written(
        place.path,
        file,
        key,
        edited,
        { before: found.value, after: values.before },
        source
    );
}
