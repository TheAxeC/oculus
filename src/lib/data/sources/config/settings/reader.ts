// Layer 1, data. The reader of single settings out of the merged map, which every typed reader of
// this folder reads through. Each reads a key by the rule of its entry in the options catalog
// (catalog/value-rule.ts), the same rule the Settings view and the server's write refuse a value
// by: a key that is missing is the entry's `default`, and a key whose value the rule refuses is the
// `default` too and comes back as a problem naming the key, so a typo costs one setting and the
// server starts. A reader throws only when the catalog holds no rule for a key it reads, or no
// default that reads, since without one no value can be read.

import { byKey } from '../../../helpers/guards.ts';
import { mapShape, readAs } from '../../../shapes/shapes.ts';
import { catalogOf, flaggedItems, sourcedItems, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem, type RuleLists, type ValueProblem } from '../catalog/value-rule.ts';

/**
 * A setting the rule refuses, by the dotted key it was written at. `value` is a key whose default
 * is used, `entry` a member of a family that is not read, `field` a field of a record that is not
 * read; `spec` is the entry or field that holds the rule. `block` is a block that is not a map,
 * whose keys all take their defaults, and `family` a family that is not a map, none of whose
 * entries is read. `repeat` is a row of a list of records whose name an earlier row already took,
 * and `unnamed` a row with no name; neither is read.
 */
export type SettingProblem =
    | { key: string; where: 'block' | 'family' }
    | { key: string; where: 'repeat'; name: string }
    | { key: string; where: 'unnamed' }
    | {
          key: string;
          where: 'value' | 'entry' | 'field';
          problem: ValueProblem;
          spec: CatalogEntry;
      };

/** The value at a key of the merged map, if the file holds one. */
type Held = { present: false } | { present: true; value: unknown };

/** What a setting reader asks of the catalog and the map. */
export type SettingReader = {
    number: (key: string) => number;
    flag: (key: string) => boolean;
    text: (key: string) => string;
    /** The items of a list option, as the file holds them or the entry's default. */
    strings: (key: string) => string[];
    /** The members of a family that the entry's fields accept, as key and value. */
    family: (key: string) => [string, unknown][];
};

/** The file the settings of the merged map are read from unless a reader names another. */
const BEHAVIOR = 'behavior.yml';

/**
 * The throw for a key the catalog gives no rule for, or no default that reads, naming the options
 * file that describes `file`.
 */
export function noRule(key: string, file: string = BEHAVIOR): Error {
    return new Error(
        `config/options/${file} holds no entry, or no default that reads, for ${key}, so ${key} cannot be read`
    );
}

/**
 * The items of the sources the entry names, together, and the flags a word block drawn from them
 * takes; each null while one of its sources is not held.
 */
function listsOf(entry: CatalogEntry, config: Record<string, unknown>): RuleLists {
    return { sourced: sourcedItems(entry, config), flagged: flaggedItems(entry, config) };
}

/**
 * The value a dotted key holds in the merged map. A block that is null or missing holds nothing; a
 * block that is not a map holds nothing and is a problem of its own, named once.
 */
export function heldAt(
    config: Record<string, unknown>,
    key: string,
    problems: SettingProblem[]
): Held {
    const dot = key.indexOf('.');
    const name = dot < 0 ? key : key.slice(0, dot);
    const raw = Object.hasOwn(config, name) ? config[name] : undefined;
    if (dot < 0) return raw === undefined ? { present: false } : { present: true, value: raw };
    if (raw === undefined || raw === null) return { present: false };
    const block = readAs(mapShape, raw);
    if (block === null) {
        if (!problems.some((one) => one.key === name && one.where === 'block')) {
            problems.push({ key: name, where: 'block' });
        }
        return { present: false };
    }
    const rest = key.slice(dot + 1);
    const value = Object.hasOwn(block, rest) ? block[rest] : undefined;
    return value === undefined ? { present: false } : { present: true, value };
}

/** The entry of a key of behavior.yml in the merged map's catalog; throws without one. */
export function settingEntry(config: Record<string, unknown>, key: string): CatalogEntry {
    const entries = byKey(catalogOf(config), BEHAVIOR);
    const entry = entries === undefined ? undefined : byKey(entries, key);
    if (entry === undefined) throw noRule(key);
    return entry;
}

/**
 * A reader over the merged map, pushing what it finds wrong to `problems`. It reads the entries of
 * `file` in the options catalog, behavior.yml unless the caller names another.
 */
export function settingReader(
    config: Record<string, unknown>,
    problems: SettingProblem[] = [],
    file: string = BEHAVIOR
): SettingReader {
    const entries = byKey(catalogOf(config), file);
    const entryOf = (key: string): CatalogEntry => {
        const entry = entries === undefined ? undefined : byKey(entries, key);
        if (entry === undefined) throw noRule(key, file);
        return entry;
    };
    /** The entry's default, which must read by the entry's own rule. */
    const defaultOf = (entry: CatalogEntry, key: string): unknown => {
        if (!Object.hasOwn(entry, 'default')) throw noRule(key, file);
        const wrong = valueProblem(entry, entry.default, listsOf(entry, config));
        if (wrong !== null) throw noRule(key, file);
        return entry.default;
    };
    const leaf = (key: string): unknown => {
        const entry = entryOf(key);
        const held = heldAt(config, key, problems);
        if (!held.present) return defaultOf(entry, key);
        const problem = valueProblem(entry, held.value, listsOf(entry, config));
        if (problem === null) return held.value;
        problems.push({ key, where: 'value', problem, spec: entry });
        return defaultOf(entry, key);
    };
    const family = (key: string): [string, unknown][] => {
        const entry = entryOf(key);
        const keySpec = entry.fields === undefined ? undefined : byKey(entry.fields, 'key');
        const valueSpec = entry.fields === undefined ? undefined : byKey(entry.fields, 'value');
        if (keySpec === undefined || valueSpec === undefined) throw noRule(key, file);
        const held = heldAt(config, key, problems);
        if (!held.present || held.value === null) return [];
        const map = readAs(mapShape, held.value);
        if (map === null) {
            problems.push({ key, where: 'family' });
            return [];
        }
        const members: [string, unknown][] = [];
        for (const [name, value] of Object.entries(map)) {
            const wrongKey = valueProblem(keySpec, name);
            const wrongValue = wrongKey === null ? valueProblem(valueSpec, value) : null;
            const problem = wrongKey ?? wrongValue;
            if (problem === null) {
                members.push([name, value]);
                continue;
            }
            const spec = wrongKey === null ? valueSpec : keySpec;
            problems.push({ key: `${key}.${name}`, where: 'entry', problem, spec });
        }
        return members;
    };
    return {
        number: (key) => {
            const value = leaf(key);
            if (typeof value !== 'number') throw noRule(key, file);
            return value;
        },
        flag: (key) => {
            const value = leaf(key);
            if (typeof value !== 'boolean') throw noRule(key, file);
            return value;
        },
        text: (key) => {
            const value = leaf(key);
            if (typeof value !== 'string') throw noRule(key, file);
            return value;
        },
        strings: (key) => {
            const value = leaf(key);
            if (!Array.isArray(value) || !value.every((one) => typeof one === 'string')) {
                throw noRule(key, file);
            }
            return value;
        },
        family
    };
}
