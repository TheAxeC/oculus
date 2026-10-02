// Layer 4, tree check. The findings of the options catalog, config/catalogs/options.yml, against
// the five tracked config files and the machine-local file's key list: every option of a file has
// one entry, every entry names an option of its file, and every entry is written to the shape for
// an editor of the settings and a write of one key to look an option up (a description, a default
// and a control that fit the value the file holds, a family's fields). A finding names the file and
// the key path it is about. findingsOf runs over any engine directory, so options-catalog.test.ts
// runs the same code over fixture folders and over the shipped tree. The machine's own local.yml is
// never opened: its keys come from the list the caller hands in, which is LOCAL_KEYS for the
// shipped tree.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { LOCAL_NAME, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    CONTROLS,
    catalogOf,
    optionPaths,
    type CatalogEntry
} from '../../../src/lib/data/sources/config/catalog/options.ts';
import { isMap } from '../../../src/lib/data/helpers/guards.ts';

/** The config files whose keys the catalog describes, read from the engine's config folder. */
const TRACKED = ['appearance.yml', 'behavior.yml', 'layout.yml', 'present.yml', 'sources.yml'];

/** The fields of a tracked file's entry, and of a machine-local file's entry. */
const ENTRY_FIELDS = ['description', 'default', 'section', 'control', 'values', 'fields'];
const LOCAL_ENTRY_FIELDS = ['description'];

export type Entries = Record<string, unknown>;

/** Whether a value is one YAML scalar that a control may hold: text, a number or a boolean. */
function isScalar(value: unknown): boolean {
    return ['string', 'number', 'boolean'].includes(typeof value);
}

/** A list whose every item is a scalar, which includes the empty list. */
function scalarList(value: unknown): boolean {
    return Array.isArray(value) && value.every(isScalar);
}

/** Whether `values` is what a `choice` needs: a non-empty list of distinct strings. */
function validValues(values: unknown): values is string[] {
    return (
        Array.isArray(values) &&
        values.length > 0 &&
        values.every((one) => typeof one === 'string') &&
        new Set(values).size === values.length
    );
}

/** Whether a value is one the control accepts; a `choice` accepts what its `values` hold. */
function fits(control: string, value: unknown, values: unknown): boolean {
    if (control === 'toggle') return typeof value === 'boolean';
    if (control === 'number') return typeof value === 'number' && Number.isFinite(value);
    if (control === 'text') return typeof value === 'string';
    if (control === 'choice') {
        return typeof value === 'string' && validValues(values) && values.includes(value);
    }
    return scalarList(value);
}

/** Whether a key path is one a file can hold: no empty segment, so no leading or doubled dot. */
function validPath(path: string): boolean {
    return path !== '' && !path.startsWith('.') && !path.endsWith('.') && !path.includes('..');
}

/** A key path as a finding writes it: an empty one would otherwise read as nothing. */
export function shown(path: string): string {
    return path === '' ? '""' : path;
}

/**
 * The value a file holds at a dotted key path, or null when there is none. A key may itself hold a
 * dot, so each level tries every key the path begins with; the result is boxed to tell a held null
 * from no key.
 */
function valueAt(value: unknown, path: string): { value: unknown } | null {
    if (path === '') return { value };
    if (!isMap(value)) return null;
    for (const key of Object.keys(value)) {
        if (path === key) return { value: value[key] };
        if (path.startsWith(`${key}.`)) {
            const inner = valueAt(value[key], path.slice(key.length + 1));
            if (inner !== null) return inner;
        }
    }
    return null;
}

/** Whether the file's value, where an entry says `fields`, is not a list or a map of records. */
function isNoFamily(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0 && value.every(isScalar);
    return !isMap(value);
}

/**
 * The findings that hold for any entry, tracked or machine-local: the path a file can hold, the
 * entry being a map of the fields allowed, a description, and a section when there is one. Whether
 * it may go on to be read as an option is returned.
 */
function shapeFindings(
    say: (path: string, what: string) => void,
    path: string,
    entry: unknown,
    allowed: string[]
): boolean {
    let readable = true;
    if (!validPath(path)) {
        say(shown(path), 'key path is empty or has a leading, trailing or doubled dot');
        readable = false;
    }
    if (!isMap(entry)) {
        say(shown(path), 'entry is not a map');
        return false;
    }
    for (const field of Object.keys(entry)) {
        if (!allowed.includes(field)) say(shown(path), `field ${field} is not allowed here`);
    }
    const description = entry.description;
    if (typeof description !== 'string' || description.trim() === '') {
        say(shown(path), 'description is missing, empty or not a string');
    }
    const section = entry.section;
    if (Object.hasOwn(entry, 'section') && (typeof section !== 'string' || section.trim() === '')) {
        say(shown(path), 'section is not a non-empty string');
    }
    return readable;
}

/** The findings of a leaf option's entry: its default, control and values against the file. */
function optionFindings(
    say: (path: string, what: string) => void,
    path: string,
    entry: Entries,
    file: unknown
): void {
    const control = entry.control;
    if (!Object.hasOwn(entry, 'default')) say(path, 'no default');
    if (!Object.hasOwn(entry, 'control')) {
        say(path, 'no control');
    } else if (typeof control !== 'string' || !(CONTROLS as readonly string[]).includes(control)) {
        say(path, `control ${String(control)} is not one of ${CONTROLS.join(', ')}`);
    }
    const known = typeof control === 'string' && (CONTROLS as readonly string[]).includes(control);
    let valuesOk = true;
    if (control === 'choice' && !validValues(entry.values)) {
        say(path, 'a choice needs values: a non-empty list of distinct strings');
        valuesOk = false;
    }
    if (control !== 'choice' && Object.hasOwn(entry, 'values')) {
        say(path, 'values belong to a choice and to nothing else');
    }
    if (!known || !valuesOk) return;
    if (Object.hasOwn(entry, 'default') && !fits(control, entry.default, entry.values)) {
        say(path, `default does not fit control ${control}`);
    }
    const held = valueAt(file, path);
    if (held !== null && !fits(control, held.value, entry.values)) {
        say(path, `the value the file holds does not fit control ${control}`);
    }
}

/** The findings of a family's entry: its fields, and the file holding records where it says so. */
function familyFindings(
    say: (path: string, what: string) => void,
    path: string,
    entry: Entries,
    file: unknown
): void {
    for (const field of ['default', 'control', 'values']) {
        if (Object.hasOwn(entry, field)) say(path, `a family has no ${field}`);
    }
    const fields = entry.fields;
    const named =
        isMap(fields) &&
        Object.keys(fields).length > 0 &&
        Object.values(fields).every((line) => typeof line === 'string');
    if (!named) say(path, 'fields is missing, empty or holds a line that is not a string');
    const held = valueAt(file, path);
    if (held !== null && isNoFamily(held.value)) {
        say(path, 'the file holds a scalar or a list of scalars here, which is not a family');
    }
}

/**
 * The findings of one tracked file: each option with no entry, each entry that is no option of the
 * file, and the shape of every entry. A map holding no entry at or below it is named once, at its
 * own path, rather than once per key inside it.
 */
function fileFindings(name: string, file: unknown, entries: Entries): string[] {
    const out: string[] = [];
    const say = (path: string, what: string): void => {
        out.push(`${name}: ${path}: ${what}`);
    };
    const paths = optionPaths(file, entries as Record<string, CatalogEntry>);
    const options = new Set(paths);
    for (const path of options) {
        if (paths.indexOf(path) !== paths.lastIndexOf(path)) {
            say(path, 'two keys of the file give this path');
        }
    }

    const covered = (prefix: string): boolean =>
        Object.keys(entries).some((key) => key === prefix || key.startsWith(`${prefix}.`));
    const unnamed = new Set<string>();
    for (const path of options) {
        if (Object.hasOwn(entries, path)) continue;
        const parts = path.split('.');
        let where = path;
        for (let length = 1; length < parts.length; length++) {
            const prefix = parts.slice(0, length).join('.');
            if (!covered(prefix)) {
                where = prefix;
                break;
            }
        }
        unnamed.add(where);
    }
    for (const where of unnamed) say(where, 'has no catalog entry');

    const families = Object.keys(entries).filter(
        (path) => isMap(entries[path]) && Object.hasOwn(entries[path], 'fields')
    );
    for (const [path, entry] of Object.entries(entries)) {
        if (!shapeFindings(say, path, entry, ENTRY_FIELDS) || !isMap(entry)) continue;
        const above = families.find((family) => path.startsWith(`${family}.`));
        if (above !== undefined) {
            say(path, `sits under the family ${above}, which is described by its fields`);
        } else if (!options.has(path)) {
            say(path, 'names no option of the file');
        } else if (Object.hasOwn(entry, 'fields')) {
            familyFindings(say, path, entry, file);
        } else {
            optionFindings(say, path, entry, file);
        }
    }
    return out;
}

/** The findings of the machine-local file's entries against the keys its reader accepts. */
function localFindings(entries: Entries, keys: readonly string[]): string[] {
    const out: string[] = [];
    const say = (path: string, what: string): void => {
        out.push(`${LOCAL_NAME}: ${path}: ${what}`);
    };
    for (const [path, entry] of Object.entries(entries)) {
        shapeFindings(say, path, entry, LOCAL_ENTRY_FIELDS);
        if (!keys.includes(path)) say(shown(path), 'is not a key the machine-local file reads');
    }
    for (const key of keys) {
        if (!Object.hasOwn(entries, key)) say(key, 'has no catalog entry');
    }
    return out;
}

/** A tracked file parsed, and undefined when the engine has no such file. */
function readTracked(engine: string, name: string): unknown {
    try {
        return parse(readFileSync(join(engine, 'config', name), 'utf8'));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
        throw error;
    }
}

/**
 * Every finding of the catalog a config folder carries, against that folder's five tracked files
 * and the keys the machine-local file reads. Nothing throws on a malformed catalog: a catalog that
 * is not the map the types say is a finding.
 */
export function findingsOf(engine: string, localKeys: readonly string[]): string[] {
    const { config } = loadConfig(engine);
    if (!isMap(config.options)) return ['options: missing or not a map of config file names'];
    const catalog: Record<string, unknown> = catalogOf(config);
    const out: string[] = [];
    for (const [name, held] of Object.entries(catalog)) {
        if (!TRACKED.includes(name) && name !== LOCAL_NAME) {
            out.push(`${name}: not a config file the catalog describes`);
        } else if (!isMap(held)) {
            out.push(`${name}: not a map of key paths to entries`);
        }
    }
    for (const name of TRACKED) {
        const held = catalog[name];
        out.push(...fileFindings(name, readTracked(engine, name), isMap(held) ? held : {}));
    }
    const local = catalog[LOCAL_NAME];
    out.push(...localFindings(isMap(local) ? local : {}, localKeys));
    return out;
}
