// Layer 2, server. One option of a tracked config file set to a value, in place: the Settings
// view's write for a toggle, a number, a text or a choice.
//
// The edit is over the bytes through yaml-edit.ts's `replaceValue`, so the key's own line keeps its
// comment, its quote style, its line end and every other byte of the file; the file is never
// written whole from a parse. The options catalog (config/catalogs/options.yml) decides what may be
// written: the file must be one of its tracked files, the key one of its entries, the entry a
// single value with a control, and the value one that control takes. The machine's own file,
// local.yml, is refused before anything is read.
//
// Nothing is written until three checks pass. The edited text must parse back to the original with
// exactly this key changed. The merged configuration built with the edited file in place of the old
// one must give `loadConfig` no finding it did not give before. And every reader in READERS and
// FINDERS below, the readers of the merged configuration that a config value can make refuse, must
// accept it: a reader that throws refuses the write whether or not it threw before, so a block
// that is already wrong takes the write that repairs it and refuses a write that leaves it wrong,
// and a finding is refused only when it is new. The reason a refusal carries is the reader's own
// sentence or the finding's words, so the Settings view shows what to repair.
//
// The function is synchronous from the read of the file to its write, which is what lets two
// writes made at once both land: each reads the file the other has already written.

import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isAlias, isMap as isYamlMap, isScalar, parseDocument } from 'yaml';
import type { Scalar } from 'yaml';
import { requirePaintLimit } from '../../../data/helpers/editor.ts';
import {
    LOCAL_NAME,
    behaviorFindings,
    calendarSettings,
    changesKeep,
    configDir,
    iconFindings,
    loadConfig,
    loadLocalOrDefaults,
    mailSettings,
    openSettings,
    searchSettings,
    slurmSettings,
    textCatalog,
    themeFindings,
    usageTiers
} from '../../../data/sources/config.ts';
import {
    catalogOf,
    type Catalog,
    type CatalogEntry
} from '../../../data/sources/config/options.ts';
import { railFindings } from '../../../data/sources/config/rail.ts';
import type { Finding } from '../../../data/model/index.ts';
import { docFindings, layoutFile } from '../../content/docs.ts';
import { requireRefreshSettings } from '../../machine/usage/refresh.ts';
import { requireAutofetch } from '../../core/fetch-period.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import { readBack } from '../list-edit.ts';
import { replaceValue, type Refusal } from '../yaml-edit.ts';

/** What a config-key write answers with: what it changed, or the one refusal and its reason. */
export type ConfigKeyOutcome = {
    changed: string[];
    refused: Refusal[];
    records?: ChangeRecord[];
};

/** The merged configuration, which every reader below takes. */
type Merged = Record<string, unknown>;

/*
 * The readers of the merged configuration are one list in two shapes. A reader in READERS throws on
 * a value it refuses; a reader in FINDERS returns findings, which are the same refusal reported as
 * words. The server's notification reader is in neither, since it falls back to its defaults and
 * refuses nothing, and a catalog reader that drops what it cannot read is in neither either.
 */

/**
 * The readers that throw on a value of the merged configuration: the settings readers, the checks
 * the server makes when it starts, and the text catalog. A reader that throws on the merged
 * configuration holding the edited value refuses the write, whether or not it threw before.
 */
const READERS: ((config: Merged) => unknown)[] = [
    slurmSettings,
    calendarSettings,
    mailSettings,
    searchSettings,
    openSettings,
    changesKeep,
    usageTiers,
    requirePaintLimit,
    requireAutofetch,
    (config) =>
        requireRefreshSettings({
            refreshMin: config.usage_refresh_min,
            model: config.usage_refresh_model
        }),
    textCatalog
];

/**
 * The readers that return findings. A finding one gives after the edit that it did not give before,
 * compared by its words, refuses the write, and so does a finder that throws after the edit; a
 * finder that threw before the edit is not compared, since it has no findings to compare with.
 */
const FINDERS: ((config: Merged, engine: string, hub: string) => Finding[])[] = [
    (config, engine) => iconFindings(engine, config),
    (config, engine) => behaviorFindings(engine, config),
    (config, engine) => themeFindings(engine, config),
    (config, engine, hub) => docFindings(config, hub, layoutFile(engine)),
    (config, engine) => railFindings(config, layoutFile(engine), textCatalog(config))
];

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

/**
 * The catalog's entry for one option of one tracked file, or null. The file is compared as the
 * whole string against the catalog's own keys and the key looked up as an own key, so a path, a
 * reserved name and the machine's own file are none of them an option.
 */
function optionOf(catalog: Catalog, file: string, key: string): CatalogEntry | null {
    if (file === LOCAL_NAME || file !== basename(file)) return null;
    if (!Object.hasOwn(catalog, file)) return null;
    const entries = catalog[file];
    return Object.hasOwn(entries, key) ? entries[key] : null;
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
 * A copy of a parsed value that shares no map or list with it and keeps every scalar as it is,
 * `Infinity`, `NaN` and `-0` included. A copy that kept an alias's shared map shared would set the
 * key in what the alias reads too and hide the change, and a JSON copy would turn those scalars
 * into others.
 */
function copyOf(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(copyOf);
    if (typeof value !== 'object' || value === null) return value;
    const entries = Object.entries(value).map(([key, held]) => [key, copyOf(held)] as const);
    return Object.fromEntries(entries);
}

/**
 * Whether the edited text still says what the original said with this one key changed: it must
 * parse, and read back it must equal the original with the key set to the value, at every depth.
 */
function kept(source: string, edited: string, key: string, wanted: unknown): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    const expected = copyOf(read.before) as Record<string, unknown>;
    const path = key.split('.');
    let holder: Record<string, unknown> = expected;
    for (const segment of path.slice(0, -1)) holder = holder[segment] as Record<string, unknown>;
    holder[path[path.length - 1]] = wanted;
    return isDeepStrictEqual(read.after, expected);
}

/** The words of a thrown value. */
function sentenceOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * The reason the merged configuration holding the edited file is refused, or null when it is not.
 * `before` is the merge over the files as they stand.
 */
function refusedBy(
    engine: string,
    file: string,
    edited: string,
    before: ReturnType<typeof loadConfig>
): string | null {
    const after = loadConfig(engine, { name: file, text: edited });
    const known = new Set(before.findings.map((finding) => finding.message));
    const added = after.findings.find((finding) => !known.has(finding.message));
    if (added !== undefined) return added.message;
    for (const read of READERS) {
        try {
            read(after.config);
        } catch (error) {
            return sentenceOf(error);
        }
    }
    const hub = loadLocalOrDefaults(engine).hub;
    for (const find of FINDERS) {
        let seen: Set<string> | null = null;
        try {
            seen = new Set(find(before.config, engine, hub).map((finding) => finding.message));
        } catch {
            seen = null;
        }
        let given: Finding[];
        try {
            given = find(after.config, engine, hub);
        } catch (error) {
            return sentenceOf(error);
        }
        const fresh = seen === null ? undefined : given.find((one) => !seen.has(one.message));
        if (fresh !== undefined) return fresh.message;
    }
    return null;
}

/**
 * The value the file holds at one option now, and whether the option is still there: the file is
 * one the catalog tracks, parses, and holds the key as a plain or quoted value. An undo reads it;
 * a file it may not read throws.
 */
export function configKeyNow(
    engine: string,
    file: string,
    key: string
): { found: boolean; value: unknown } {
    const none = { found: false, value: null };
    let text: string;
    try {
        if (optionOf(catalogOf(loadConfig(engine).config), file, key) === null) return none;
        text = readFileSync(join(configDir(engine), file), 'utf8');
    } catch (error) {
        // A file that is gone holds no option; one that is there and cannot be read throws, so the
        // undo answers as a write of the same file does.
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return none;
    }
    try {
        const found = locate(text, key);
        return found.kind === 'found' ? { found: true, value: found.node.value } : none;
    } catch {
        return none;
    }
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
    const refuse = (reason: string): ConfigKeyOutcome => ({
        changed: [],
        refused: [{ field: `${file}:${key}`, reason }]
    });
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

    writeTextAtomic(path, edited.text);
    return {
        changed: [`${file}:${key}`],
        refused: [],
        records: [{ file: path, key: file, field: key, before: held, after: wanted, undo: 'field' }]
    };
}
