// Layer 2, server. What every Settings write checks before it writes: the readers of the merged
// configuration that a config value can make refuse, and the read-back of the edited text against
// the original; and the edits of a file's text a write makes, adding a key or recording what it
// replaced.
//
// Nothing is written until three checks pass. The edited text must parse back to the original with
// exactly the written key changed. The merged configuration built with the edited file in place of
// the old one must give `loadConfig` no finding it did not give before. And every reader in READERS
// and FINDERS below, the readers of the merged configuration that a config value can make refuse,
// must accept it: a reader that throws refuses the write whether or not it threw before, and a
// finding is refused only when it is new. The reason a refusal carries is the reader's own sentence
// or the finding's words, so the Settings view shows what to repair.
//
// A write lands in the hub's settings file or in the workspace file's `settings:`
// (config-place.ts), or for the user's key in the primary hub's `local.yml`, which no loadConfig
// reads: an edit of it is refused when the machine's reader (data/sources/config/local.ts) gives a
// problem with the edited text that it did not give with the file as it is, with the reader's
// sentence naming that key (`localProblemAdded`). The file, or the key in it, may not exist yet:
// the write then adds the key under the deepest map of its path the file holds, or at the end of
// the file, creating a hub's settings file and its folder, and records what it made (`created`)
// with the text it added (`replaced`), which the undo takes out again (`takeOutAdded`).
//
// The setting readers of behavior.yml are in neither list. A wrong value of a setting is read as
// oculus's value and is a finding of its own (`settingFindings`), and a write is refused for a
// wrong value by the rule at the key it writes (config-fit.ts), so a write of one key is taken
// while another setting is wrong, and an undo puts back a value the file held.

import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { Document, isMap as isYamlMap, isScalar, isSeq, parseDocument, visit } from 'yaml';
import type { Pair, YAMLMap, YAMLSeq } from 'yaml';
import { z } from 'zod';
import { HUB_FILE } from '../../../../data/helpers/hub-names.ts';
import {
    LOCAL_NAME,
    loadConfig,
    localSentence,
    textCatalog,
    type ConfigWhere
} from '../../../../data/sources/config.ts';
import { readLocalText, type LocalProblem } from '../../../../data/sources/config/local.ts';
import { READER_FINDINGS } from '../../../../data/sources/config/sections/findings.ts';
import type { Finding } from '../../../../data/model/index.ts';
import { docsFindings } from '../../../content/docs.ts';
import { helperFindings } from '../../../core/git/credentials.ts';
import type { ReplacedText } from '../../../core/changes.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import { readBack } from '../../list-edit.ts';
import { setBlock } from '../../block-edit.ts';
import { lineEnd, lineStart } from '../../block-source.ts';
import {
    loadLayers,
    placeOf,
    placeText,
    removeMade,
    type ConfigKeyOutcome,
    type ConfigLayers,
    type Place
} from './config-place.ts';

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
 * The readers that return findings: every reader of the merged configuration
 * (data/sources/config/sections/findings.ts), the documents of `docs:` checked against the disk,
 * and the credential helper's paths checked against the git hosts of `sign_in`.
 * A finding one gives after the edit that it did not give before, compared by its words, refuses
 * the write, and so does a finder that throws after the edit; a finder that threw before the edit
 * is not compared, since it has no findings to compare with.
 */
const FINDERS: ((where: ConfigWhere, config: Merged) => Finding[])[] = [
    ...READER_FINDINGS,
    docsFindings,
    (where, config) => helperFindings(where, config)
];

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
 * The merged configuration over the layers with the file at a place read from the edited text: the
 * hub's settings file, where an empty text stands for the file removed, or the workspace file.
 */
function editedLoad(
    engine: string,
    layers: ConfigLayers,
    place: Place,
    edited: string
): ReturnType<typeof loadConfig> {
    if (place.layer === 'workspace') return loadLayers(engine, layers, { workspaceText: edited });
    const gone = edited.trim() === '';
    return loadLayers(engine, layers, {
        instead: { name: HUB_FILE, text: gone ? null : edited, layer: 'hub' }
    });
}

/**
 * The sentence `checkLocal` gives for the first problem the machine's reader gives with the edited
 * text of a hub's `local.yml`, by its key and kind, that it does not give with `source`, so the
 * sentence names that key; null when the edit adds no problem.
 */
export function localProblemAdded(source: string, edited: string): string | null {
    const named = (one: LocalProblem): string => `${one.key} ${one.kind}`;
    const held = new Set(readLocalText(source, '').problems.map(named));
    const added = readLocalText(edited, '').problems.find((one) => !held.has(named(one)));
    return added === undefined ? null : localSentence(added, LOCAL_NAME);
}

/**
 * The reason the merged configuration holding the edited file at a place is refused, or null when
 * it is not. `before` is the merge over the layers as the files stand. The primary's `local.yml`
 * is no layer of the merge, and is checked by `localProblemAdded` against the file as it is.
 */
export function refusedBy(
    engine: string,
    layers: ConfigLayers,
    place: Place,
    edited: string,
    before: ReturnType<typeof loadConfig>
): string | null {
    if (place.layer === 'local') return localProblemAdded(placeText(place) ?? '', edited);
    const after = editedLoad(engine, layers, place, edited);
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
    const hub = layers.hub ?? null;
    for (const find of FINDERS) {
        let seen: Set<string> | null = null;
        try {
            const where = { engine, hub, from: before.from };
            seen = new Set(find(where, before.config).map((finding) => finding.message));
        } catch {
            seen = null;
        }
        let given: Finding[];
        try {
            given = find({ engine, hub, from: after.from }, after.config);
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
 * The text that differs between a file and its edit (replacedText) widened to whole lines, and by
 * one more line on each side where there is one, so that `after` holds the lines around a removal
 * and an undo finds it again only where the edit left it. Null for two equal texts.
 */
export function replacedLines(source: string, edited: string): ReplacedText | null {
    const found = replacedText(source, edited);
    if (found === null) return null;
    const lineStart = (at: number): number => (at === 0 ? 0 : source.lastIndexOf('\n', at - 1) + 1);
    const lineEndAt = (at: number): number => {
        const next = source.indexOf('\n', at);
        return next < 0 ? source.length : next + 1;
    };
    let start = lineStart(found.offset);
    if (start > 0) start = lineStart(start - 1);
    const changedEnd = found.offset + found.before.length;
    let end =
        changedEnd === 0 || source[changedEnd - 1] === '\n' ? changedEnd : lineEndAt(changedEnd);
    if (end < source.length) end = lineEndAt(end);
    const keptAfter = source.length - end;
    return {
        offset: start,
        before: source.slice(start, end),
        after: edited.slice(start, edited.length - keptAfter)
    };
}

/** The text with the lines of one top-level pair cut, from its key's line to its value's last. */
export function cutTopPair(source: string, pair: Pair): string | null {
    const key = (pair.key as { range?: [number, number, number] }).range;
    if (key === undefined) return null;
    const value = (pair.value as { range?: [number, number, number] } | null)?.range;
    const last = value === undefined ? key[1] : Math.max(key[1], value[1] - 1);
    const from = lineStart(source, key[0]);
    const end = lineEnd(source, last);
    const to = source[end] === '\r' ? end + 2 : source[end] === '\n' ? end + 1 : end;
    return `${source.slice(0, from)}${source.slice(to)}`;
}

/**
 * A file's text with a record's replaced text put back over what the write left, or null when the
 * file does not hold that text at the record's place.
 */
export function putBack(source: string, replaced: ReplacedText): string | null {
    const { offset, before, after } = replaced;
    if (!source.startsWith(after, offset)) return null;
    return `${source.slice(0, offset)}${before}${source.slice(offset + after.length)}`;
}

/** A record's replaced text as the log holds it: a whole offset and two texts. */
export const replacedShape = z.object({
    offset: z.int().min(0),
    before: z.string(),
    after: z.string()
});

/**
 * The directories and the file a write at `path` makes, outermost first: the folders above it that
 * are not there and the file when it is not there.
 */
function madeAt(path: string): string[] {
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
 * config write, after every check has passed. `before` and `after` are the value at the option's
 * place in the file as it was and as it is now, which an undo restores. Given the `source` the edit
 * was made from, the record also carries the text the edit replaced, which an undo puts back as it
 * was.
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

/** The value at a dotted key path of a parsed map, or undefined. */
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

/** The most characters the scalars of a node written on one line hold together. */
const ONE_LINE = 80;

/** Whether a node of scalars is short enough to be written on one line. */
function shortNode(node: unknown): boolean {
    if (!flatNode(node)) return false;
    const parts = isYamlMap(node)
        ? node.items.flatMap((item) => [item.key, item.value])
        : (node as YAMLSeq).items;
    const length = parts.reduce<number>(
        (sum, part) => sum + String(isScalar(part) ? part.value : '').length + 2,
        0
    );
    return length <= ONE_LINE;
}

/**
 * The block a key and its value are written as, in the style oculus's files use: a short map or
 * list of scalars below the key's first segment on one line (`slurm: { resource: x }`), a longer
 * one a key or an item a line. The first `block` segments stay block maps, one key a line, which is
 * how a workspace file's `settings:` holds its options.
 */
function renderKey(key: string, value: unknown, block = 0): string {
    const steps = key.split('.');
    const tree = steps.reduceRight<unknown>((inner, step) => ({ [step]: inner }), value);
    const doc = new Document(tree);
    // A map's visit path holds the document and, for each map above it, the map and its pair.
    const deepest = Math.max(steps.length, 2 * block + 1);
    visit(doc, {
        Seq(_key, seq, path) {
            if (path.length > 1 && shortNode(seq)) seq.flow = true;
            else if (seq.items.every((one) => shortNode(one) || isScalar(one))) {
                for (const one of seq.items) if (isYamlMap(one)) one.flow = true;
            }
        },
        Map(_key, map, path) {
            if (path.length > deepest && shortNode(map)) map.flow = true;
        }
    });
    return doc.toString({ lineWidth: 0, indent: 2 });
}

/** The value `steps` names below a map, as the nested maps that hold it. */
function nested(steps: readonly string[], value: unknown): unknown {
    return steps.reduceRight<unknown>((inner, step) => ({ [step]: inner }), value);
}

/** The pair of a map whose key is the segment, or undefined. */
function pairOf(map: YAMLMap, segment: string): Pair | undefined {
    return map.items.find((item) => isScalar(item.key) && item.key.value === segment);
}

/**
 * The text with the pair of a key that holds an empty value (`settings:` with nothing after it)
 * given the rest of the path under it, written as a block map indented two columns under the key.
 * Null when anything but blanks follows the empty value on its line.
 */
function fillEmpty(
    source: string,
    pair: Pair,
    rest: readonly string[],
    value: unknown
): string | null {
    const keyRange = (pair.key as { range?: [number, number, number] }).range;
    if (keyRange === undefined) return null;
    const end = lineEnd(source, keyRange[1]);
    if (!/^\s*:\s*(~|null)?\s*$/.test(source.slice(keyRange[1], end))) return null;
    const column = keyRange[0] - (source.lastIndexOf('\n', keyRange[0] - 1) + 1);
    const lines = renderKey(rest.join('.'), value).replace(/\n$/, '').split('\n');
    const newline = source.includes('\r\n') ? '\r\n' : '\n';
    const block = lines.map((line) => `${' '.repeat(column + 2)}${line}`).join(newline);
    return `${source.slice(0, keyRange[1])}:${newline}${block}${source.slice(end)}`;
}

/**
 * The text with a key it does not hold added: under the deepest map of the key's path the text
 * holds (block-edit.ts rewrites that map's lines with the new item, keeping every other byte),
 * under a key that holds an empty value, in place of a file that is the empty map `{}`, or at the
 * end of the file. Null when the text does not parse as a map of keys or the path holds a value
 * that is no map. The first `block` segments of a key written whole stay block maps (`renderKey`).
 */
export function insertKey(source: string, key: string, value: unknown, block = 0): string | null {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return null;
    if (doc.contents !== null && !isYamlMap(doc.contents)) return null;
    const steps = key.split('.');
    let depth = 0;
    let holder: unknown = doc.contents;
    while (depth < steps.length - 1 && isYamlMap(holder)) {
        const pair = pairOf(holder, steps[depth]);
        if (pair === undefined) break;
        if (isScalar(pair.value) && pair.value.value === null) {
            return fillEmpty(source, pair, steps.slice(depth + 1), value);
        }
        if (!isYamlMap(pair.value)) return null;
        holder = pair.value;
        depth += 1;
    }
    if (depth > 0 && isYamlMap(holder)) {
        const map = holder.toJS(doc) as Record<string, unknown>;
        const rest = steps.slice(depth);
        const widened = { ...map, [rest[0]]: nested(rest.slice(1), value) };
        return setBlock(source, steps.slice(0, depth), widened);
    }
    const emptyMap = isYamlMap(doc.contents) && doc.contents.items.length === 0;
    if (emptyMap && doc.contents?.range) {
        const [start, end] = doc.contents.range;
        const after = source.slice(end).replace(/^[ \t]*\n?/, '');
        return `${source.slice(0, start)}${renderKey(key, value, block)}${after}`;
    }
    const lead = source === '' || source.endsWith('\n') ? source : `${source}\n`;
    return `${lead}${renderKey(key, value, block)}`;
}

/**
 * A copy of a parsed file with the dotted key removed. With `prune`, the maps on the way that the
 * removal leaves empty are removed too, as a write that made them leaves the file without them.
 */
export function withoutKey(parsed: unknown, key: string, prune: boolean): unknown {
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
 * Take back a write that added a key to the file at its place: the text it added is taken out again
 * where it stands, and a hub's settings file or `local.yml` and the folders the write made are
 * removed once they hold nothing else. It applies only when the file still holds the added text at
 * the offset the record names; the result must read as the file with that one key out, and pass the
 * checks a write passes. Null for a record without the text, a layer that is not there and a file
 * that has moved on. The outcome records the removal like a write, with the value taken out as
 * `before` and no value as `after`, so the removal is itself taken back by writing the value in.
 *
 * `made` is the paths the record says the write made, as absolute paths.
 */
export function takeOutAdded(
    engine: string,
    layers: ConfigLayers,
    file: string,
    key: string,
    record: { replaced?: unknown; after: unknown },
    made: string[]
): ConfigKeyOutcome | null {
    const text = addedShape.safeParse(record.replaced);
    if (!text.success) return null;
    const place = placeOf(layers, file, key);
    if (place === null) return null;
    const source = placeText(place);
    if (source === null) return null;
    const { offset, before: earlier, after: later } = text.data;
    if (offset > source.length || !source.startsWith(later, offset)) return null;
    const edited = `${source.slice(0, offset)}${earlier}${source.slice(offset + later.length)}`;
    const reread = readBack(source, edited);
    const taken = (prune: boolean): boolean =>
        isDeepStrictEqual(reread?.after, withoutKey(reread?.before, place.at, prune));
    if (reread === null || !(taken(false) || taken(true))) return null;
    const loaded = loadLayers(engine, layers);
    const reason = refusedBy(engine, layers, place, edited, loaded);
    if (reason !== null) return { changed: [], refused: [{ field: `${file}:${key}`, reason }] };
    const gone = place.layer !== 'workspace' && edited.trim() === '' && made.includes(place.path);
    if (gone) removeMade(place.path, made);
    else writeTextAtomic(place.path, edited);
    return {
        changed: [`${file}:${key}`],
        refused: [],
        records: [
            {
                file: place.path,
                key: file,
                field: key,
                before: record.after,
                after: null,
                undo: 'field'
            }
        ]
    };
}
