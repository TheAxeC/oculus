// Layer 2, server. One option of a tracked config file set to a value, in place: the Settings
// view's write for a toggle, a number, a text, a choice, a glyph, a hue, a colour, a folder, a file
// or a path.
//
// The edit is over the bytes through yaml-edit.ts's `replaceValue`, so the key's own line keeps its
// comment, its quote style, its line end and every other byte of the file; the file is never
// written whole from a parse. The options catalog (config/catalogs/options.yml) decides what may be
// written: the file must be one of its tracked files, the key one of its entries, the entry a
// single value with a control, and the value one that control takes (config-fit.ts). The machine's
// own file, a local.yml or a link to a hub's `.oculus/local.yml`, is refused before the file is
// read. The checks that stand between the edited text and the file are config-checks.ts's, which
// config-value.ts runs as well.
//
// A key of the hub list is written in the hub's config layer (`<hub>/.oculus/config/<file>`), any
// other key in the engine's file. When the layer's file or the key in it is not there, the write
// adds the key at the end of the file and creates the file and its folders, and the undo takes the
// added text out and removes what the write made (config-checks.ts `takeOutAdded`).
//
// The function is synchronous from the read of the file to its write, which is what lets two
// writes made at once both land: each reads the file the other has already written.

import { isDeepStrictEqual } from 'node:util';
import { isAlias, isMap as isYamlMap, isScalar, parseDocument } from 'yaml';
import type { Scalar } from 'yaml';
import { LOCAL_NAME } from '../../../../data/sources/config.ts';
import { catalogOf, type CatalogEntry } from '../../../../data/sources/config/catalog/options.ts';
import { words } from '../../../core/words.ts';
import { replaceValue } from '../../yaml/yaml-edit.ts';
import { isCollection, leafProblem } from './config-fit.ts';
import { sourcesFor, type SourceInputs } from './config-sources.ts';
import {
    absentIn,
    insertKey,
    isMachinePlace,
    lacksPrimary,
    opening,
    kept,
    mergedAt,
    optionNow,
    optionOf,
    placeOf,
    placeText,
    refusedBy,
    type ConfigKeyOutcome,
    type OptionNow,
    written
} from './config-checks.ts';

export type { ConfigKeyOutcome };

/** Where the key's value sits in a file's text. */
type Found = { kind: 'unparsed' } | { kind: 'missing' } | { kind: 'found'; node: Scalar };

/** The scalar styles a value may be written over: a plain or a quoted one. */
const STYLES = ['PLAIN', 'QUOTE_DOUBLE', 'QUOTE_SINGLE'];

/**
 * The scalar a dotted key path names in a text. Each segment is a string key of a map, so a key
 * that holds a dot, a key that is not a string, an alias, an anchored or tagged node, a block
 * scalar and an empty or null value all answer `missing`: the write would be a guess there.
 */
function locate(source: string, key: string): Found {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return { kind: 'unparsed' };
    let node: unknown = doc.contents;
    for (const segment of key.split('.')) {
        if (!isYamlMap(node)) return { kind: 'missing' };
        const pair = node.items.find((item) => isScalar(item.key) && item.key.value === segment);
        node = pair?.value;
    }
    if (!isScalar(node) || isAlias(node)) return { kind: 'missing' };
    const valued = node.value !== null && node.value !== undefined;
    const bare = node.anchor === undefined && node.tag === undefined;
    if (!valued || !bare || !STYLES.includes(String(node.type))) return { kind: 'missing' };
    return { kind: 'found', node };
}

/** Whether an entry is one value with a control, which is what is set one key at a time. */
function single(entry: CatalogEntry): boolean {
    return entry.control !== undefined && !isCollection(entry);
}

/**
 * The value the file holds at one option now, and whether the option is still there: the file is
 * one the catalog tracks, parses, and holds the key as a plain or quoted value. An undo reads it;
 * a file it may not read throws.
 */
export function configKeyNow(engine: string, file: string, key: string, hub?: string): OptionNow {
    return optionNow(
        engine,
        file,
        key,
        (text) => {
            const found = locate(text, key);
            return found.kind === 'found' ? { found: true, value: found.node.value } : null;
        },
        hub
    );
}

/**
 * Set one option of a tracked config file, in the hub's layer when it is a key of the hub list and
 * a hub is given. A refusal answers the one reason and writes nothing; a value equal to the one in
 * force writes nothing and answers with nothing changed. Given `inputs`, the value is checked
 * against the entry and the lists the server holds (config-fit.ts); without them, as in an undo, no
 * value is checked and the file is put back as it was. A file that cannot be read or written
 * throws, which the route answers as `unwritable`.
 */
export function writeConfigKey(
    engine: string,
    file: string,
    key: string,
    value: unknown,
    inputs?: SourceInputs,
    hub?: string,
    hubs: readonly string[] = []
): ConfigKeyOutcome {
    const { before, text, refuse } = opening(engine, file, key, hub);
    if (file === LOCAL_NAME) return refuse(words(text, 'server.config_key.local'));
    if (lacksPrimary(file, key, hub)) return refuse(words(text, 'server.workspace.no_primary'));
    const entry = optionOf(catalogOf(before.config), file, key);
    if (entry === null) return refuse(words(text, 'server.config_key.no_entry'));
    if (!single(entry)) return refuse(words(text, 'server.config_key.not_single'));
    const wanted = Object.is(value, -0) ? 0 : value;

    const place = placeOf(engine, hub, file, key);
    if (isMachinePlace(place, hubs, engine)) return refuse(words(text, 'server.config_key.local'));
    const onDisk = placeText(place);
    const source = onDisk ?? '';
    const found = locate(source, key);
    if (found.kind === 'unparsed') return refuse(words(text, 'server.config_key.not_parsed'));
    const adding =
        place.layer === 'hub' &&
        found.kind === 'missing' &&
        (onDisk === null || absentIn(source, key));
    if (found.kind === 'missing' && !adding) {
        return refuse(words(text, 'server.config_key.not_in_file'));
    }
    const held = found.kind === 'found' ? found.node.value : mergedAt(before.config, key);
    const sources = inputs === undefined ? null : sourcesFor(inputs, before.config);
    const unfit = leafProblem(entry, held, wanted, { text, sources });
    if (unfit !== null) return refuse(unfit);
    if (isDeepStrictEqual(held, wanted)) return { changed: [], refused: [] };

    const scalar = wanted as string | number | boolean;
    let edited: { text: string } | { reason: string };
    if (found.kind === 'found') {
        edited = replaceValue(source, found.node, scalar);
        // A plain string that would not read back (inside a flow map, a comma or a brace ends it)
        // is written double-quoted, the one style that holds any string on one line.
        if (
            'text' in edited &&
            !kept(source, edited.text, key, wanted) &&
            typeof wanted === 'string'
        ) {
            edited = replaceValue(source, found.node, scalar, 'QUOTE_DOUBLE');
        }
    } else {
        const inserted = insertKey(source, key, wanted);
        edited = inserted === null ? { reason: '' } : { text: inserted };
    }
    if (!('text' in edited) || !kept(source, edited.text, key, wanted)) {
        return refuse(words(text, 'server.config_key.not_kept'));
    }
    const reason = refusedBy(engine, hub, file, edited.text, before, place.layer);
    if (reason !== null) return refuse(reason);

    return written(
        place.path,
        file,
        key,
        edited.text,
        { before: held, after: wanted },
        adding ? source : undefined,
        adding
    );
}
