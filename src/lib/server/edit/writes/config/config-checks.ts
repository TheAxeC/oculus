// Layer 2, server. What every write of a tracked config file checks before it writes: the readers
// of the merged configuration that a config value can make refuse, the read-back of the edited text
// against the original, and the catalog's entry for an option.
//
// Nothing is written until three checks pass. The edited text must parse back to the original with
// exactly the written key changed. The merged configuration built with the edited file in place of
// the old one must give `loadConfig` no finding it did not give before. And every reader in READERS
// and FINDERS below, the readers of the merged configuration that a config value can make refuse,
// must accept it: a reader that throws refuses the write whether or not it threw before, and a
// finding is refused only when it is new. The reason a refusal carries is the reader's own sentence
// or the finding's words, so the Settings view shows what to repair.
//
// A key of the hub list (data/helpers/hub-names.ts) is written in the hub's own layer,
// `<hub>/.oculus/config/<file>`, and any other key in the engine's file. The layer's file, or the
// key in it, may not exist yet: the write then adds the key at the end of the file, creating the
// file and its folders, and records what it made (`created`) with the text it added (`replaced`),
// which the undo takes out again (`takeOutAdded`).
//
// The setting readers of behavior.yml are in neither list. A wrong value of a setting is read as
// the entry's default and is a finding of its own (`settingFindings`), and a write is refused for a
// wrong value by the rule at the key it writes (config-fit.ts), so a write of one key is taken
// while another setting is wrong, and an undo puts back a value the file held.

import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { Document, isMap as isYamlMap, isScalar, isSeq, parseDocument, visit } from 'yaml';
import { z } from 'zod';
import { hubKeysOf, hubLayerPath } from '../../../../data/helpers/hub-names.ts';
import {
    LOCAL_NAME,
    behaviorFindings,
    configDir,
    iconFindings,
    languageFindings,
    loadConfig,
    loadLocal,
    latexEditingFindings,
    latexUnimathFindings,
    nestingFindings,
    optionFindings,
    schemaFindings,
    sourceFile,
    textCatalog,
    themeFindings
} from '../../../../data/sources/config.ts';
import {
    catalogOf,
    type Catalog,
    type CatalogEntry
} from '../../../../data/sources/config/catalog/options.ts';
import { railFindings } from '../../../../data/sources/config/rail.ts';
import type { Finding } from '../../../../data/model/index.ts';
import { docFindings, layoutFile } from '../../../content/docs.ts';
import type { ChangeRecord, ReplacedText } from '../../../core/changes.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import type { Refusal } from '../../yaml/yaml-edit.ts';
import { readBack } from '../../list-edit.ts';
import { setFields } from '../../yaml/yaml-edit.ts';

/** What a config write answers with: what it changed, or the one refusal and its reason. */
export type ConfigKeyOutcome = {
    changed: string[];
    refused: Refusal[];
    records?: ChangeRecord[];
};

/** The answer of a write refused for one reason, naming the file and key it was asked of. */
export function refusing(file: string, key: string): (reason: string) => ConfigKeyOutcome {
    return (reason) => ({ changed: [], refused: [{ field: `${file}:${key}`, reason }] });
}

/** The value a file holds at one option now, and whether the option is still there. */
export type OptionNow = { found: boolean; value: unknown };

/** Where a write of one option lands: the engine's file, or the hub layer's. */
export type Place = { layer: 'engine' | 'hub'; path: string };

/**
 * The file a write of one key lands in: the hub layer's file when a hub is given and the key is one
 * of the hub list, else the engine's.
 */
export function placeOf(engine: string, hub: string | undefined, file: string, key: string): Place {
    if (hub !== undefined && (hubKeysOf(file)?.includes(key) ?? false)) {
        return { layer: 'hub', path: join(hub, hubLayerPath(file)) };
    }
    return { layer: 'engine', path: join(configDir(engine), file) };
}

/**
 * The text of the file at a place. A file of the hub layer that is not there answers null, since a
 * hub without the layer is a hub that sets nothing; an engine file that is not there throws.
 */
export function placeText(place: Place): string | null {
    try {
        return readFileSync(place.path, 'utf8');
    } catch (error) {
        if (place.layer === 'hub' && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/** Whether a text, read as a map, holds nothing at the dotted key path. */
export function absentIn(source: string, key: string): boolean {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return false;
    let node: unknown = doc.contents;
    for (const segment of key.split('.')) {
        if (node === null) return true;
        if (!isYamlMap(node)) return false;
        const pair = node.items.find((item) => isScalar(item.key) && item.key.value === segment);
        if (pair === undefined) return true;
        node = pair.value;
    }
    return false;
}

/**
 * What an undo reads of one option: the file's text through `read`, which answers null for an
 * option the text does not hold in the shape wanted. A file the catalog does not track, one that is
 * gone and text that `read` throws on all answer not found. A key the hub layer does not hold, or a
 * hub layer that is not there, is a found option with no value (`null`), since the layer holds
 * nothing there for a write to have changed.
 */
export function optionNow(
    engine: string,
    file: string,
    key: string,
    read: (text: string) => OptionNow | null,
    hub?: string
): OptionNow {
    const none = { found: false, value: null };
    const place = placeOf(engine, hub, file, key);
    const text = optionText(engine, file, key, place);
    if (text === null) return none;
    try {
        const held = read(text);
        if (held !== null) return held;
        return place.layer === 'hub' && absentIn(text, key) ? { found: true, value: null } : none;
    } catch {
        return none;
    }
}

/** The merged configuration, which every reader below takes. */
type Merged = Record<string, unknown>;

/*
 * The readers of the merged configuration are one list in two shapes. A reader in READERS throws on
 * a value it refuses; a reader in FINDERS returns findings, which are the same refusal reported as
 * words. The server's notification reader is in neither, since it falls back to its defaults and
 * refuses nothing, and a catalog reader that drops what it cannot read is in neither either.
 */

/**
 * The readers that throw on a value of the merged configuration: the text catalog. A reader that
 * throws on the merged configuration holding the edited value refuses the write, whether or not it
 * threw before.
 */
const READERS: ((config: Merged) => unknown)[] = [textCatalog];

/**
 * The readers that return findings. A finding one gives after the edit that it did not give before,
 * compared by its words, refuses the write, and so does a finder that throws after the edit; a
 * finder that threw before the edit is not compared, since it has no findings to compare with.
 */
const FINDERS: ((
    config: Merged,
    engine: string,
    hub: string,
    from: Record<string, string>
) => Finding[])[] = [
    (config, engine) => iconFindings(engine, config),
    (config, engine) => behaviorFindings(engine, config),
    (config, engine) => languageFindings(engine, config),
    (config, engine) => latexEditingFindings(engine, config),
    (config, engine) => latexUnimathFindings(engine, config),
    (config, engine) => nestingFindings(engine, config),
    (config, engine) => optionFindings(engine, config),
    (config, engine) => schemaFindings(engine, config),
    (config, engine) => themeFindings(engine, config),
    (config, engine, hub, from) => docFindings(config, hub, sourceFile(engine, hub, from, 'docs')),
    (config, engine) => railFindings(config, layoutFile(engine), textCatalog(config))
];

/**
 * The catalog's entry for one option of one tracked file, or null. The file is compared as the
 * whole string against the catalog's own keys and the key looked up as an own key, so a path, a
 * reserved name and the machine's own file are none of them an option.
 */
export function optionOf(catalog: Catalog, file: string, key: string): CatalogEntry | null {
    if (file === LOCAL_NAME || file !== basename(file)) return null;
    if (!Object.hasOwn(catalog, file)) return null;
    const entries = catalog[file];
    return Object.hasOwn(entries, key) ? entries[key] : null;
}

/**
 * The text of the file one option lives in at a place, or null when the catalog tracks no such
 * option or the file is gone. A hub layer that is not there is the empty text. A file that is there
 * and cannot be read throws, so an undo answers as a write of the same file does.
 */
export function optionText(engine: string, file: string, key: string, place: Place): string | null {
    try {
        if (optionOf(catalogOf(loadConfig(engine).config), file, key) === null) return null;
        return placeText(place) ?? '';
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return null;
    }
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
export function kept(source: string, edited: string, key: string, wanted: unknown): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    const expected = copyOf(read.before) as Record<string, unknown>;
    const path = key.split('.');
    let holder: Record<string, unknown> = expected;
    for (const segment of path.slice(0, -1)) {
        const next = holder[segment];
        if (typeof next !== 'object' || next === null || Array.isArray(next)) holder[segment] = {};
        holder = holder[segment] as Record<string, unknown>;
    }
    holder[path[path.length - 1]] = wanted;
    return isDeepStrictEqual(read.after, expected);
}

/** The words of a thrown value. */
function sentenceOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * The reason the merged configuration holding the edited file is refused, or null when it is not.
 * `before` is the merge over the files as they stand; `layer` says whether the edited file is the
 * engine's or the hub's, and `hub` is the hub the layer is merged for (absent for the engine
 * alone).
 */
export function refusedBy(
    engine: string,
    hub: string | undefined,
    file: string,
    edited: string,
    before: ReturnType<typeof loadConfig>,
    layer: Place['layer'] = 'engine'
): string | null {
    const after = loadConfig(engine, { hub, instead: { name: file, text: edited, layer } });
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
    const hubDir = hub ?? loadLocal(engine).hub;
    for (const find of FINDERS) {
        let seen: Set<string> | null = null;
        try {
            seen = new Set(
                find(before.config, engine, hubDir, before.from).map((finding) => finding.message)
            );
        } catch {
            seen = null;
        }
        let given: Finding[];
        try {
            given = find(after.config, engine, hubDir, after.from);
        } catch (error) {
            return sentenceOf(error);
        }
        const fresh = seen === null ? undefined : given.find((one) => !seen.has(one.message));
        if (fresh !== undefined) return fresh.message;
    }
    return null;
}

/**
 * The text that differs between a file and its edit: what lies between their common prefix and
 * their common suffix, with the offset where it starts. Null for two equal texts.
 */
export function replacedText(source: string, edited: string): ReplacedText | null {
    if (source === edited) return null;
    const room = Math.min(source.length, edited.length);
    let offset = 0;
    while (offset < room && source[offset] === edited[offset]) offset += 1;
    let tail = 0;
    while (
        tail < room - offset &&
        source[source.length - 1 - tail] === edited[edited.length - 1 - tail]
    ) {
        tail += 1;
    }
    return {
        offset,
        before: source.slice(offset, source.length - tail),
        after: edited.slice(offset, edited.length - tail)
    };
}

/**
 * The directories and the file a write at `path` makes, outermost first: the folders above it that
 * are not there and the file when it is not there.
 */
export function madeAt(path: string): string[] {
    const made: string[] = [];
    let at = path;
    while (!existsSync(at)) {
        made.unshift(at);
        const up = dirname(at);
        if (up === at) break;
        at = up;
    }
    return made;
}

/**
 * Write the edited text of a file and answer with the one option it changed: the last step of a
 * config write, after every check has passed. `before` and `after` are the option's value in the
 * file as it was and as it is now, which an undo restores. Given the `source` the edit was made
 * from, the record also carries the text the edit replaced, which an undo puts back as it was.
 *
 * A write that `added` the key the file did not hold also makes the file and its folders when they
 * are not there, and its record carries the paths it made in `created` (none when the key went into
 * a file that was there). Its undo takes the added text out and removes the paths again.
 */
export function written(
    path: string,
    file: string,
    key: string,
    edited: string,
    values: { before: unknown; after: unknown },
    source?: string,
    added = false
): ConfigKeyOutcome {
    const made = added ? madeAt(path) : [];
    if (made.length > 0) mkdirSync(dirname(path), { recursive: true });
    writeTextAtomic(path, edited);
    const replaced = source === undefined ? null : replacedText(source, edited);
    return {
        changed: [`${file}:${key}`],
        refused: [],
        records: [
            {
                file: path,
                key: file,
                field: key,
                ...values,
                undo: 'field',
                ...(replaced === null ? {} : { replaced }),
                ...(added ? { created: made } : {})
            }
        ]
    };
}

/** The value at a dotted key path of the merged configuration, or undefined. */
export function mergedAt(config: Merged, key: string): unknown {
    let node: unknown = config;
    for (const segment of key.split('.')) {
        if (typeof node !== 'object' || node === null || !Object.hasOwn(node, segment)) {
            return undefined;
        }
        node = (node as Record<string, unknown>)[segment];
    }
    return node;
}

/**
 * Whether a node holds only scalars, which a map or a list of them is written on one line as: a
 * flow map `{ key: a, dir: b }` or a flow list `[a, b]`.
 */
function flatNode(node: unknown): boolean {
    const items = isYamlMap(node)
        ? node.items.map((item) => item.value)
        : isSeq(node)
          ? node.items
          : null;
    return items?.every((one) => isScalar(one)) ?? false;
}

/** The block a key and its value are written as, in the style the engine's files use. */
function renderKey(key: string, value: unknown): string {
    const steps = key.split('.');
    const tree = steps.reduceRight<unknown>((inner, step) => ({ [step]: inner }), value);
    const doc = new Document(tree);
    visit(doc, {
        Seq(_key, seq, path) {
            if (path.length > 1 && flatNode(seq)) seq.flow = true;
            else if (seq.items.every((one) => flatNode(one) || isScalar(one))) {
                for (const one of seq.items) if (isYamlMap(one)) one.flow = true;
            }
        },
        Map(_key, map, path) {
            if (path.length > steps.length && flatNode(map)) map.flow = true;
        }
    });
    return doc.toString({ lineWidth: 0, indent: 2 });
}

/**
 * The text with a key it does not hold added: at the end of the file, or under the map the key's
 * parent already is. Null when the text does not parse as a map of keys or cannot take the key.
 */
export function insertKey(source: string, key: string, value: unknown): string | null {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return null;
    if (doc.contents !== null && !isYamlMap(doc.contents)) return null;
    const steps = key.split('.');
    if (steps.length > 1 && !absentIn(source, steps[0])) {
        const edit = setFields(source, { [key]: value });
        return edit.changed.length === 1 ? edit.text : null;
    }
    const lead = source === '' || source.endsWith('\n') ? source : `${source}\n`;
    return `${lead}${renderKey(key, value)}`;
}

/**
 * A copy of a parsed file with the dotted key removed. With `prune`, the maps on the way that the
 * removal leaves empty are removed too, as a write that made them leaves the file without them.
 */
function withoutKey(parsed: unknown, key: string, prune: boolean): unknown {
    const copy = copyOf(parsed ?? {}) as Record<string, unknown>;
    const steps = key.split('.');
    const trail: Record<string, unknown>[] = [copy];
    for (const step of steps.slice(0, -1)) {
        const next: unknown = trail[trail.length - 1][step];
        if (typeof next !== 'object' || next === null) return copy;
        trail.push(next as Record<string, unknown>);
    }
    Reflect.deleteProperty(trail[trail.length - 1], steps[steps.length - 1]);
    for (let at = trail.length - 1; prune && at > 0; at--) {
        if (Object.keys(trail[at]).length > 0) break;
        Reflect.deleteProperty(trail[at - 1], steps[at - 1]);
    }
    return copy;
}

/** What the log holds of the text a write added: where, and the characters. */
const addedShape = z.object({ offset: z.int().min(0), before: z.string(), after: z.string() });

/**
 * Take back a write that added a key to the hub layer: the text it added is taken out again where
 * it stands, and the file and the folders the write made are removed once they hold nothing else.
 * It applies only when the file still holds the added text at the offset the record names; the
 * result must read as the file with that one key out, and pass the checks a write passes. Null for
 * a record without the text, a file that has moved on and a key that is still read from a file the
 * layer does not hold. The outcome records the removal like a write, with the value taken out as
 * `before` and no value as `after`, so the removal is itself taken back by writing the value in.
 *
 * `made` is the paths the record says the write made, as absolute paths.
 */
export function takeOutAdded(
    engine: string,
    hub: string,
    file: string,
    key: string,
    record: { replaced?: unknown; after: unknown },
    made: string[],
    recordKey: string = file
): ConfigKeyOutcome | null {
    const text = addedShape.safeParse(record.replaced);
    if (!text.success) return null;
    const place = placeOf(engine, hub, file, key);
    if (place.layer !== 'hub') return null;
    const source = placeText(place);
    if (source === null) return null;
    const { offset, before: earlier, after: later } = text.data;
    if (offset > source.length || !source.startsWith(later, offset)) return null;
    const edited = `${source.slice(0, offset)}${earlier}${source.slice(offset + later.length)}`;
    const reread = readBack(source, edited);
    const taken = (prune: boolean): boolean =>
        isDeepStrictEqual(reread?.after, withoutKey(reread?.before, key, prune));
    if (reread === null || !(taken(false) || taken(true))) return null;
    const loaded = loadConfig(engine, { hub });
    const reason = refusedBy(engine, hub, file, edited, loaded, 'hub');
    if (reason !== null) return { changed: [], refused: [{ field: `${file}:${key}`, reason }] };
    const gone = edited.trim() === '' && made.includes(place.path);
    if (gone) {
        rmSync(place.path, { force: true });
        for (const folder of made.filter((one) => one !== place.path).reverse()) {
            try {
                rmdirSync(folder);
            } catch {
                break;
            }
        }
    } else {
        writeTextAtomic(place.path, edited);
    }
    return {
        changed: [`${file}:${key}`],
        refused: [],
        records: [
            {
                file: place.path,
                key: recordKey,
                field: key,
                before: record.after,
                after: null,
                undo: 'field'
            }
        ]
    };
}
