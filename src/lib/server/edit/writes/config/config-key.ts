// Layer 2, server. One option of a tracked config file set to a value, in place: the Settings
// view's write for a toggle, a number, a text or a choice.
//
// The edit is over the bytes through yaml-edit.ts's `replaceValue`, so the key's own line keeps its
// comment, its quote style, its line end and every other byte of the file; the file is never
// written whole from a parse. The options catalog (config/catalogs/options.yml) decides what may be
// written: the file must be one of its tracked files, the key one of its entries, the entry a
// single value with a control, and the value one that control takes. The machine's own file,
// local.yml, is refused before anything is read. The checks that stand between the edited text and
// the file are config-checks.ts's, which config-value.ts runs as well.
//
// The function is synchronous from the read of the file to its write, which is what lets two
// writes made at once both land: each reads the file the other has already written.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isAlias, isMap as isYamlMap, isScalar, parseDocument } from 'yaml';
import type { Scalar } from 'yaml';
import { LOCAL_NAME, configDir, loadConfig, textCatalog } from '../../../../data/sources/config.ts';
import { catalogOf, type CatalogEntry } from '../../../../data/sources/config/catalog/options.ts';
import { words } from '../../../core/words.ts';
import { replaceValue } from '../../yaml-edit.ts';
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
    return (
        !Object.hasOwn(entry, 'fields') && entry.control !== undefined && entry.control !== 'list'
    );
}

/** The reason a value does not fit the entry's control, or null when it does. */
function misfit(entry: CatalogEntry, value: unknown, text: Record<string, string>): string | null {
    if (entry.control === 'toggle') {
        return typeof value === 'boolean' ? null : words(text, 'server.config_key.not_boolean');
    }
    if (entry.control === 'number') {
        const ok = typeof value === 'number' && Number.isFinite(value);
        return ok ? null : words(text, 'server.config_key.not_number');
    }
    if (entry.control === 'text') {
        return typeof value === 'string' ? null : words(text, 'server.config_key.not_text');
    }
    const values = entry.values ?? [];
    if (typeof value === 'string' && values.includes(value)) return null;
    return words(text, 'server.config_key.not_choice', values.join(', '));
}

/**
 * The value the file holds at one option now, and whether the option is still there: the file is
 * one the catalog tracks, parses, and holds the key as a plain or quoted value. An undo reads it;
 * a file it may not read throws.
 */
export function configKeyNow(engine: string, file: string, key: string): OptionNow {
    return optionNow(engine, file, key, (text) => {
        const found = locate(text, key);
        return found.kind === 'found' ? { found: true, value: found.node.value } : null;
    });
}

/**
 * Set one option of a tracked config file. A refusal answers the one reason and writes nothing; a
 * value equal to the one held writes nothing and answers with nothing changed. A file that cannot
 * be read or written throws, which the route answers as `unwritable`.
 */
export function writeConfigKey(
    engine: string,
    file: string,
    key: string,
    value: unknown
): ConfigKeyOutcome {
    const before = loadConfig(engine);
    const text = textCatalog(before.config);
    const refuse = refusing(file, key);
    if (file === LOCAL_NAME) return refuse(words(text, 'server.config_key.local'));
    const entry = optionOf(catalogOf(before.config), file, key);
    if (entry === null) return refuse(words(text, 'server.config_key.no_entry'));
    if (!single(entry)) return refuse(words(text, 'server.config_key.not_single'));
    const wanted = Object.is(value, -0) ? 0 : value;
    const unfit = misfit(entry, wanted, text);
    if (unfit !== null) return refuse(unfit);

    const path = join(configDir(engine), file);
    const source = readFileSync(path, 'utf8');
    const found = locate(source, key);
    if (found.kind === 'unparsed') return refuse(words(text, 'server.config_key.not_parsed'));
    if (found.kind === 'missing') return refuse(words(text, 'server.config_key.not_in_file'));
    const held = found.node.value;
    if (isDeepStrictEqual(held, wanted)) return { changed: [], refused: [] };

    const scalar = wanted as string | number | boolean;
    let edited = replaceValue(source, found.node, scalar);
    // A plain string that would not read back (inside a flow map, a comma or a brace ends it) is
    // written double-quoted, the one style that holds any string on one line.
    if ('text' in edited && !kept(source, edited.text, key, wanted) && typeof wanted === 'string') {
        edited = replaceValue(source, found.node, scalar, 'QUOTE_DOUBLE');
    }
    if (!('text' in edited) || !kept(source, edited.text, key, wanted)) {
        return refuse(words(text, 'server.config_key.not_kept'));
    }
    const reason = refusedBy(engine, file, edited.text, before);
    if (reason !== null) return refuse(reason);

    return written(path, file, key, edited.text, { before: held, after: wanted });
}
