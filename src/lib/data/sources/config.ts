// Layer 1, data. Resolves the machine-local values and the text catalog from files on disk.
// Server side only: it reads the filesystem and no client module may import it.
// A caller passes the engine directory, and engineDir() derives it from this module's own location
// so dev and the built server agree. One environment variable is read, OCULUS_LOCAL, and only by
// loadLocal(): it names the machine-local file instead of <engine>/local.yml, which is how a test
// server is pointed at a hub in a temporary directory without writing into the checkout.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Finding } from '../model.ts';
import { REGISTRY_KEYS } from '../normalise.ts';

export type LocalConfig = {
    /** Absolute path of the research hub whose YAML the portfolio is built from. */
    hub: string;
    /** Port the oculus server listens on, bound to 127.0.0.1. */
    port: number;
    /** Per-machine ssh alias for the Live HPC view. */
    hpcHost?: string;
    /**
     * Where the session layer keeps its byte-offset cache, `sessions_cache` in the file. Absent
     * unless the machine sets it, and the sessions layer then uses ~/.oculus/transcript-cache.json.
     */
    sessionsCache?: string;
    /**
     * Where the per-session overrides live, `sessions_overrides` in the file. Absent unless the
     * machine sets it, and the sessions layer then uses ~/.oculus/sessions.json.
     */
    sessionsOverrides?: string;
};

/** 8787 belongs to the cockpit and is never used. */
export const DEFAULT_PORT = 8790;

const LOCAL_KEYS = ['hub', 'port', 'hpc_host', 'sessions_cache', 'sessions_overrides'];

/**
 * Walk up from a starting file until a directory holds both package.json and config/.
 * In development that lands on tools/oculus from src/lib/data/sources; in the adapter-node
 * build it lands on the same directory from build/server/chunks.
 */
export function engineDir(from: string = fileURLToPath(import.meta.url)): string {
    let dir = dirname(from);
    for (;;) {
        if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'config'))) return dir;
        const up = dirname(dir);
        if (up === dir) throw new Error(`no oculus engine directory above ${from}`);
        dir = up;
    }
}

/** The defaults: the hub is two directories above tools/oculus, the port is 8790. */
export function localDefaults(engine: string): LocalConfig {
    return { hub: resolve(engine, '..', '..'), port: DEFAULT_PORT };
}

/**
 * Which file loadLocal reads, and the directory a relative path in it resolves against.
 *
 * Without OCULUS_LOCAL that is <engine>/local.yml and the engine, which is the whole of what the
 * machine's own configuration is. With it, the named file and its own folder: the browser specs
 * stand a server up over a hub in a temporary directory, and writing local.yml into the checkout to
 * do that would make a tracked file a test fixture. A relative OCULUS_LOCAL resolves against the
 * engine, so a path typed on the command line means what it looks like from tools/oculus.
 */
function localFile(engine: string): { file: string; base: string; required: boolean } {
    const named = process.env.OCULUS_LOCAL;
    if (named === undefined || named === '') {
        return { file: join(engine, 'local.yml'), base: engine, required: false };
    }
    const file = isAbsolute(named) ? named : resolve(engine, named);
    return { file, base: dirname(file), required: true };
}

/**
 * Read <engine>/local.yml, or the file OCULUS_LOCAL names. A missing file means the defaults,
 * except when OCULUS_LOCAL named it: a run told to read a file that is not there is an error rather
 * than a silent fall back to the machine's own hub. An unknown key is reported once on stderr and
 * ignored. A key of the wrong type is an error naming the file and the key.
 */
export function loadLocal(engine: string): LocalConfig {
    const { file, base, required } = localFile(engine);
    const config = localDefaults(engine);
    if (!existsSync(file)) {
        if (required) throw new Error(`${file}: OCULUS_LOCAL names a file that does not exist`);
        return config;
    }

    const raw: unknown = parse(readFileSync(file, 'utf8')) ?? {};
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new Error(`${file}: expected a map of keys`);
    }
    const record = raw as Record<string, unknown>;

    const unknown = Object.keys(record).filter((key) => !LOCAL_KEYS.includes(key));
    if (unknown.length > 0) {
        console.warn(`${file}: ignoring unknown key(s) ${unknown.join(', ')}`);
    }

    if (record.hub !== undefined) {
        if (typeof record.hub !== 'string' || record.hub.length === 0) {
            throw new Error(`${file}: hub must be a path`);
        }
        config.hub = isAbsolute(record.hub) ? record.hub : resolve(base, record.hub);
    }
    if (record.port !== undefined) {
        if (!Number.isInteger(record.port)) throw new Error(`${file}: port must be an integer`);
        config.port = record.port as number;
    }
    if (record.hpc_host !== undefined) {
        if (typeof record.hpc_host !== 'string' || record.hpc_host.length === 0) {
            throw new Error(`${file}: hpc_host must be a non-empty string`);
        }
        config.hpcHost = record.hpc_host;
    }
    // The two session paths are absent unless the machine names them, so a config that says
    // nothing about sessions leaves the defaults to the module that owns them.
    for (const [key, field] of [
        ['sessions_cache', 'sessionsCache'],
        ['sessions_overrides', 'sessionsOverrides']
    ] as const) {
        if (record[key] === undefined) continue;
        if (typeof record[key] !== 'string' || record[key] === '') {
            throw new Error(`${file}: ${key} must be a path`);
        }
        const value = record[key] as string;
        config[field] = isAbsolute(value) ? value : resolve(base, value);
    }
    return config;
}

/**
 * Merge every config/*.yml into one map, each file contributing its top-level keys. This is the
 * map O4's validate and O5's catalog read, so a rule can move between files without either of them
 * knowing. Files are merged in name order, so the result does not depend on the directory's order
 * on disk. Two files defining the same top-level key is a finding naming both, and the later file
 * in name order wins. A file that does not parse or is not a map is a finding and contributes
 * nothing; a missing config directory is a finding and an empty map. Nothing here throws.
 */
/**
 * The one top-level key more than one file may carry. The catalog is a map of groups, and every
 * source file under 1000 lines is the rule, so the groups are spread over `text.yml` and
 * `text-oculus.yml`; a group defined in two of them is the finding, and the later file wins it.
 */
export const TEXT_KEY = 'text';

/** Fold one file's `text:` groups into the groups already read, naming any group read twice. */
function mergeText(
    config: Record<string, unknown>,
    value: unknown,
    name: string,
    file: string,
    from: Record<string, string>,
    findings: Finding[]
): void {
    const held = config[TEXT_KEY];
    if (
        typeof held !== 'object' ||
        held === null ||
        Array.isArray(held) ||
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value)
    ) {
        findings.push({
            file,
            key: TEXT_KEY,
            message: `key ${TEXT_KEY} is already defined in ${from[TEXT_KEY]}; ${name} wins`
        });
        config[TEXT_KEY] = value;
        from[TEXT_KEY] = name;
        return;
    }
    const groups = held as Record<string, unknown>;
    for (const [group, entries] of Object.entries(value as Record<string, unknown>)) {
        if (group in groups) {
            findings.push({
                file,
                key: `${TEXT_KEY}.${group}`,
                message: `group ${TEXT_KEY}.${group} is already defined in ${from[TEXT_KEY]}; ${name} wins`
            });
        }
        groups[group] = entries;
    }
}

export function loadConfig(engine: string): {
    config: Record<string, unknown>;
    findings: Finding[];
} {
    const dir = join(engine, 'config');
    const config: Record<string, unknown> = {};
    const findings: Finding[] = [];
    /** Which file each top-level key came from, so a clash can name both sides. */
    const from: Record<string, string> = {};

    let names: string[];
    try {
        names = readdirSync(dir)
            .filter((name) => name.endsWith('.yml'))
            .sort();
    } catch {
        findings.push({ file: dir, key: '', message: 'config directory does not exist' });
        return { config, findings };
    }

    for (const name of names) {
        const file = join(dir, name);
        let parsed: unknown;
        try {
            parsed = parse(readFileSync(file, 'utf8')) ?? {};
        } catch (error) {
            const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
            findings.push({ file, key: '', message: `does not parse: ${message}` });
            continue;
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            findings.push({ file, key: '', message: 'is not a map of keys' });
            continue;
        }
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (key === TEXT_KEY && key in config) {
                mergeText(config, value, name, file, from, findings);
                continue;
            }
            if (key in config) {
                findings.push({
                    file,
                    key,
                    message: `key ${key} is already defined in ${from[key]}; ${name} wins`
                });
            }
            config[key] = value;
            from[key] = name;
        }
    }

    return { config, findings };
}

/** Flatten a nested map of strings to dotted keys. Values are strings; anything else is an error. */
export function flattenText(node: unknown, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
        throw new Error(`text catalog: ${prefix || 'root'} is not a map`);
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        const dotted = prefix === '' ? key : `${prefix}.${key}`;
        if (typeof value === 'string') flat[dotted] = value;
        else if (typeof value === 'number' || typeof value === 'boolean')
            flat[dotted] = String(value);
        else Object.assign(flat, flattenText(value, dotted));
    }
    return flat;
}

/**
 * The flat catalog held in the merged config's `text` key. The catalog is one of the nine config
 * files and is read like the others, so a string can move between files without this knowing.
 * Called per request until O6's watcher keeps an in-memory copy and pushes it, so editing the file
 * and reloading the browser shows the change.
 */
export function textCatalog(config: Record<string, unknown>): Record<string, string> {
    return flattenText(config.text ?? {});
}

/**
 * The keys of the merged config the client state installs before the page renders: the colours and
 * the chip vocabulary state/tones.ts reads, and the theme list, the wallpaper and the CRT default
 * state/appearance.ts reads. `domains` is the research domains of config/vocab.yml; `themes`,
 * `wallpaper` and `crt` are config/appearance.yml's.
 */
export const VOCAB_KEYS = [
    'palette',
    'status_palette',
    'type_color',
    'status_legend',
    'data_access',
    'domains',
    'themes',
    'wallpaper',
    'crt'
];

/**
 * The slice of the merged config the tone lookups and the theme picker need, shipped as the page's
 * data beside the catalog and the glyphs. The whole merged config goes over the `config` channel
 * afterwards and setVocab and setAppearance read the same keys out of it, so this is the first load
 * only and carries no more than those keys.
 */
export function vocabCatalog(config: Record<string, unknown>): Record<string, unknown> {
    const vocab: Record<string, unknown> = {};
    for (const key of VOCAB_KEYS) if (config[key] !== undefined) vocab[key] = config[key];
    return vocab;
}

/**
 * The keys of the `collections:` list of config/sources.yml, in the file's order, minus the four
 * that name a registry with a dedicated view. They ship as the page's data and the page registers
 * the collection view once per key, so a collection is added to the tool by adding a line to
 * sources.yml, a label and a glyph to text.yml, and its key to a group of nav_groups.
 */
export function collectionKeys(config: Record<string, unknown>): string[] {
    const raw = config.collections;
    if (!Array.isArray(raw)) return [];
    const keys: string[] = [];
    for (const item of raw) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
        const key = (item as Record<string, unknown>).key;
        if (typeof key !== 'string' || key === '' || REGISTRY_KEYS.includes(key)) continue;
        if (!keys.includes(key)) keys.push(key);
    }
    return keys;
}

/**
 * The glyph vocabulary held in the merged config's `glyphs` key: one character per name, flat. It
 * ships with the catalog as the page's data and is pushed on the `config` channel afterwards, so a
 * glyph is edited in config/glyphs.yml and nowhere else. A value that is not a string is dropped
 * rather than thrown on: the map is a vocabulary and one bad entry is not worth losing the rest.
 */
export function glyphCatalog(config: Record<string, unknown>): Record<string, string> {
    return stringMap(config.glyphs);
}

/**
 * The ASCII stand-ins held in the merged config's `ascii` key: one short string per character, flat.
 * It rides with the glyphs, since it is the other half of the same vocabulary and lives in the same
 * file. Keyed by the character rather than by a glyph's name, so it reaches an icon that came from
 * data as well as one that came from a name.
 */
export function asciiCatalog(config: Record<string, unknown>): Record<string, string> {
    return stringMap(config.ascii);
}

/** A map of strings out of a config key, dropping anything that is not one. */
function stringMap(raw: unknown): Record<string, string> {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
    const map: Record<string, string> = {};
    for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value === 'string') map[name] = value;
    }
    return map;
}
