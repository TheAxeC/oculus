// Layer 2, server. Reset of one option: the key taken out of the file at its place, so the value in
// force is oculus's own again (config/defaults/). The Settings view's Reset sends it for a single
// value, a list and a family alike.
//
// The place is config-place.ts's: for a key of the hub list the settings file of the hub the reset
// names (config-write.ts), the primary's when it names none, and the open workspace file's
// `settings:` for any other. The key comes out of the map that holds it with its lines
// (block-edit.ts rewrites that map, keeping every other byte), and a map the removal leaves empty
// comes out with it, up to a key at the top of the file, whose lines are cut. A hub's settings file
// that would hold nothing, no text or comments alone, is left as the empty map after its comments,
// since that file is what makes the folder a hub. The edited text must read back as the file with
// that one key out and pass the checks a write passes (config-checks.ts) before anything is
// written. A key the file does not hold writes nothing.
//
// The record carries the text the reset removed, and the undo puts it back where it stood when the
// file still holds the text the reset left there, or else writes the key again with the value it
// held (`restoreReset`).

import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, isScalar, parseDocument } from 'yaml';
import type { Pair, YAMLMap } from 'yaml';
import { fields } from '../../../../data/helpers/guards.ts';
import { LOCAL_NAME } from '../../../../data/sources/config.ts';
import { catalogOf } from '../../../../data/sources/config/catalog/options.ts';
import { words } from '../../../core/words.ts';
import { readBack } from '../../list-edit.ts';
import { setBlock } from '../../block-edit.ts';
import { lineEnd, lineStart } from '../../block-source.ts';
import {
    mergedAt,
    putBack,
    refusedBy,
    replacedShape,
    withoutKey,
    written
} from './config-checks.ts';
import { isCollection } from './config-fit.ts';
import { writeConfigKey } from './config-key.ts';
import { writeConfigValue } from './config-value.ts';
import {
    absentIn,
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
    type OptionNow
} from './config-place.ts';

/** The text a hub's settings file holds when a reset leaves it with no key. */
const EMPTY_MAP = '{}\n';

/**
 * A hub's settings file as a reset leaves it: the text as it is while it holds a key, the empty map
 * for a file left with no text, and the empty map after the comments of a file left with comments
 * alone, which would otherwise read as no map.
 */
function keptAsMap(edited: string): string {
    if (edited.trim() === '') return EMPTY_MAP;
    if (parseDocument(edited).contents !== null) return edited;
    return `${edited}${edited.endsWith('\n') ? '' : '\n'}${EMPTY_MAP}`;
}

/** The pair of a map whose key is the segment, or undefined. */
function pairOf(map: YAMLMap, segment: string): Pair | undefined {
    return map.items.find((item) => isScalar(item.key) && item.key.value === segment);
}

/** The text with the lines of one top-level pair cut, from its key's line to its value's last. */
function cutTopPair(source: string, pair: Pair): string | null {
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
 * The text with the dotted key taken out, with every map the removal leaves empty, or null when the
 * path holds no such key, goes through a value that is no map, or the lines cannot be rewritten in
 * place.
 */
function removeKey(source: string, key: string): string | null {
    const doc = parseDocument(source);
    if (doc.errors.length > 0 || !isYamlMap(doc.contents)) return null;
    const steps = key.split('.');
    const maps: YAMLMap[] = [doc.contents];
    for (const step of steps.slice(0, -1)) {
        const pair = pairOf(maps[maps.length - 1], step);
        if (pair === undefined || !isYamlMap(pair.value)) return null;
        maps.push(pair.value);
    }
    if (pairOf(maps[maps.length - 1], steps[steps.length - 1]) === undefined) return null;
    // The removal goes up while the map that holds the key would be left empty.
    let depth = steps.length - 1;
    while (depth > 0 && maps[depth].items.length === 1) depth -= 1;
    if (depth === 0) {
        const pair = pairOf(doc.contents, steps[0]);
        return pair === undefined ? null : cutTopPair(source, pair);
    }
    const holder = maps[depth].toJS(doc) as Record<string, unknown>;
    Reflect.deleteProperty(holder, steps[depth]);
    return setBlock(source, steps.slice(0, depth), holder);
}

/**
 * Take one option's key out of the file at its place over the layers. A refusal answers the one
 * reason and writes nothing; a key the file does not hold writes nothing and answers with nothing
 * changed. A file that cannot be read or written throws, which the route answers as `unwritable`.
 */
export function resetConfig(
    engine: string,
    file: string,
    key: string,
    layers: ConfigLayers,
    hubs: readonly string[] = []
): ConfigKeyOutcome {
    const { before, text, refuse } = opening(engine, file, key, layers);
    if (file === LOCAL_NAME) return refuse(words(text, 'server.config_key.local'));
    if (optionOf(catalogOf(before.config), file, key) === null) {
        return refuse(words(text, 'server.config_key.no_entry'));
    }
    const place = placeOf(layers, file, key);
    if (place === null) return refuse(placeRefusal(text, file, key));
    if (isMachinePlace(place, hubs)) return refuse(words(text, 'server.config_key.local'));
    const source = placeText(place);
    if (source === null || absentIn(source, place.at)) return { changed: [], refused: [] };
    if (parseDocument(source).errors.length > 0) {
        return refuse(words(text, 'server.config_key.not_parsed'));
    }
    const removed = removeKey(source, place.at);
    if (removed === null) return refuse(words(text, 'server.config_value.unsupported'));
    const edited = place.layer === 'hub' ? keptAsMap(removed) : removed;
    const back = readBack(source, edited);
    if (back === null || !isDeepStrictEqual(back.after, withoutKey(back.before, place.at, true))) {
        return refuse(words(text, 'server.config_key.not_kept'));
    }
    const reason = refusedBy(engine, layers, place, edited, before);
    if (reason !== null) return refuse(reason);
    return written(
        place.path,
        file,
        key,
        edited,
        { before: mergedAt(back.before, place.at), after: null },
        source
    );
}

/**
 * The value the file at the option's place holds at its key now, `null` for a key it does not
 * hold, which is what a reset leaves. An undo reads it; a file it may not read throws.
 */
export function configResetNow(
    engine: string,
    layers: ConfigLayers,
    file: string,
    key: string
): OptionNow {
    return optionNow(engine, layers, file, key, (text, at) => {
        const doc = parseDocument(text);
        if (doc.errors.length > 0) return null;
        const held = mergedAt(fields(doc.toJS()), at);
        return held === undefined ? null : { found: true, value: held };
    });
}

/**
 * Take a reset back: the text it removed goes back where it stood (`putBackReset`), and when the
 * text around it has changed since, the key is written again with the value the record says it
 * held, through the write of its kind.
 */
export function restoreReset(
    engine: string,
    file: string,
    key: string,
    record: { replaced?: unknown; before: unknown },
    layers: ConfigLayers,
    hubs: readonly string[] = []
): ConfigKeyOutcome | null {
    const back = putBackReset(engine, file, key, record, layers, hubs);
    if (back !== null) return back;
    const merged = loadLayers(engine, layers).config;
    const entry = optionOf(catalogOf(merged), file, key);
    if (entry === null) return null;
    if (!isCollection(entry)) {
        return writeConfigKey(engine, file, key, record.before, layers, undefined, hubs);
    }
    return writeConfigValue(engine, file, key, record.before, mergedAt(merged, key), layers, {
        hubs,
        stored: true,
        own: true
    });
}

/**
 * Take a reset back by putting the text it removed where it stood, when the file still holds the
 * text the reset left there and does not hold the key. The result must read back as the file with
 * the key holding the record's earlier value and pass the checks a write passes. Null for a record
 * without the text, a layer that is not there and a file that has moved on.
 */
function putBackReset(
    engine: string,
    file: string,
    key: string,
    record: { replaced?: unknown; before: unknown },
    layers: ConfigLayers,
    hubs: readonly string[] = []
): ConfigKeyOutcome | null {
    const replaced = replacedShape.safeParse(record.replaced);
    if (!replaced.success) return null;
    const place = placeOf(layers, file, key);
    if (place === null || isMachinePlace(place, hubs)) return null;
    const source = placeText(place);
    if (source === null || !absentIn(source, place.at)) return null;
    const edited = putBack(source, replaced.data);
    if (edited === null) return null;
    const back = readBack(source, edited);
    if (back === null || !isDeepStrictEqual(mergedAt(back.after, place.at), record.before)) {
        return null;
    }
    if (!isDeepStrictEqual(withoutKey(back.after, place.at, true), back.before)) return null;
    const loaded = loadLayers(engine, layers);
    const reason = refusedBy(engine, layers, place, edited, loaded);
    if (reason !== null) return { changed: [], refused: [{ field: `${file}:${key}`, reason }] };
    return written(place.path, file, key, edited, { before: null, after: record.before }, source);
}
