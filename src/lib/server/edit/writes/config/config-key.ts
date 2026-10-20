// Layer 2, server. One option of oculus's defaults files set to a value: the Settings view's write
// for a toggle, a number, a text, a choice, a glyph, a hue, a colour, a folder, a file or a path,
// and the write every control of the shell that sets an option sends.
//
// The value lands where config-place.ts places the key: a key of the hub list in the primary hub's
// settings file, any other in the `settings:` map of the open workspace file; oculus's own files
// are never written. When the file holds the key as a plain or quoted value, the edit is over the
// bytes through yaml-edit.ts's `replaceValue`, so the key's own line keeps its comment, its quote
// style, its line end and every other byte of the file. When it does not hold the key, the write
// adds it (config-checks.ts `insertKey`), creating a hub's settings file and its folder when they
// are not there, and the undo takes the added text out and removes what the write made
// (`takeOutAdded`).
//
// The options files (config/options/) decide what may be written: the file must be one of their
// defaults files, the key one of their entries, the entry a single value with a control, and the
// value one that control takes (config-fit.ts). The machine's own file, a hub's `.oculus/local.yml`
// or a link to one, is refused before the file is read. The checks that stand between the edited
// text and the file are config-checks.ts's, which config-value.ts runs as well.
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
import { REFUSALS, why } from '../../yaml/why.ts';
import type { Why } from '../../yaml/why.ts';
import { isCollection, leafProblem } from './config-fit.ts';
import { sourcesFor, type SourceInputs } from './config-sources.ts';
import { insertKey, kept, mergedAt, refusedBy, written } from './config-checks.ts';
import {
    absentIn,
    blockLevels,
    isMachinePlace,
    opening,
    optionNow,
    optionOf,
    placeOf,
    placeRefusal,
    placeText,
    type ConfigKeyOutcome,
    type ConfigLayers,
    type OptionNow
} from './config-place.ts';

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
 * The value the file at the option's place holds now, and whether the option is still there: the
 * option is one the options files name, the file parses, and it holds the key as a plain or quoted
 * value. An undo reads it; a file it may not read throws.
 */
export function configKeyNow(
    engine: string,
    layers: ConfigLayers,
    file: string,
    key: string
): OptionNow {
    return optionNow(engine, layers, file, key, (text, at) => {
        const found = locate(text, at);
        return found.kind === 'found' ? { found: true, value: found.node.value } : null;
    });
}

/**
 * Set one option of a defaults file at its place over the layers. A refusal answers the one reason
 * and writes nothing; a value equal to the one held writes nothing and answers with nothing
 * changed, unless `copy` asks for the key the file does not hold to be added with that value, which
 * is how Edit in a file shows a key at its line. Given `inputs`, the value is checked against the
 * entry and the lists the server holds (config-fit.ts); without them, as in an undo, no value is
 * checked and the file is put back as it was. A file that cannot be read or written throws, which
 * the route answers as `unwritable`.
 */
export function writeConfigKey(
    engine: string,
    file: string,
    key: string,
    value: unknown,
    layers: ConfigLayers,
    inputs?: SourceInputs,
    hubs: readonly string[] = [],
    copy = false
): ConfigKeyOutcome {
    const { before, text, refuse } = opening(engine, file, key, layers);
    if (file === LOCAL_NAME) return refuse(words(text, 'server.config_key.local'));
    const entry = optionOf(catalogOf(before.config), file, key);
    if (entry === null) return refuse(words(text, 'server.config_key.no_entry'));
    if (!single(entry)) return refuse(words(text, 'server.config_key.not_single'));
    const place = placeOf(layers, file, key);
    if (place === null) return refuse(placeRefusal(text, file, key));
    const wanted = Object.is(value, -0) ? 0 : value;

    if (isMachinePlace(place, hubs)) return refuse(words(text, 'server.config_key.local'));
    const onDisk = placeText(place);
    const source = onDisk ?? '';
    const found = locate(source, place.at);
    if (found.kind === 'unparsed') return refuse(words(text, 'server.config_key.not_parsed'));
    const adding = found.kind === 'missing' && (onDisk === null || absentIn(source, place.at));
    if (found.kind === 'missing' && !adding) {
        return refuse(words(text, 'server.config_key.not_in_file'));
    }
    const held = found.kind === 'found' ? found.node.value : mergedAt(before.config, key);
    const sources = inputs === undefined ? null : sourcesFor(inputs, before.config);
    const unfit = leafProblem(entry, held, wanted, { text, sources });
    if (unfit !== null) return refuse(unfit);
    if (isDeepStrictEqual(held, wanted) && !(copy && adding)) return { changed: [], refused: [] };

    const scalar = wanted as string | number | boolean;
    let edited: { text: string } | { why: Why };
    if (found.kind === 'found') {
        edited = replaceValue(source, found.node, scalar);
        // A plain string that would not read back (inside a flow map, a comma or a brace ends it)
        // is written double-quoted, the one style that holds any string on one line.
        if (
            'text' in edited &&
            !kept(source, edited.text, place.at, wanted) &&
            typeof wanted === 'string'
        ) {
            edited = replaceValue(source, found.node, scalar, 'QUOTE_DOUBLE');
        }
    } else {
        const inserted = insertKey(source, place.at, wanted, blockLevels(place));
        edited = inserted === null ? { why: why(REFUSALS.keyNoPlace) } : { text: inserted };
    }
    if (!('text' in edited) || !kept(source, edited.text, place.at, wanted)) {
        return refuse(words(text, 'server.config_key.not_kept'));
    }
    const reason = refusedBy(engine, layers, place, edited.text, before);
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
