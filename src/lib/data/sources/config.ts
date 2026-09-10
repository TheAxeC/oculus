// Layer 1, data. Resolves the machine-local values and the text catalog from files on disk.
// Server side only: it reads the filesystem and no client module may import it.
// No environment variable is consulted anywhere; a caller passes the engine directory, and
// engineDir() derives it from this module's own location so dev and the built server agree.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Finding } from '../model.ts';

export type LocalConfig = {
    /** Absolute path of the research hub whose YAML the portfolio is built from. */
    hub: string;
    /** Port the oculus server listens on, bound to 127.0.0.1. */
    port: number;
};

/** 8787 belongs to the cockpit and is never used. */
export const DEFAULT_PORT = 8790;

const LOCAL_KEYS = ['hub', 'port'];

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
 * Read <engine>/local.yml. A missing file means the defaults. An unknown key is reported
 * once on stderr and ignored. A key of the wrong type is an error naming the file and the key.
 */
export function loadLocal(engine: string): LocalConfig {
    const file = join(engine, 'local.yml');
    const config = localDefaults(engine);
    if (!existsSync(file)) return config;

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
        config.hub = isAbsolute(record.hub) ? record.hub : resolve(engine, record.hub);
    }
    if (record.port !== undefined) {
        if (!Number.isInteger(record.port)) throw new Error(`${file}: port must be an integer`);
        config.port = record.port as number;
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
 * the chip vocabulary state/tones.ts reads, and the UI theme list state/appearance.ts reads.
 * `domains` is the research domains of config/vocab.yml; `themes` is the picker's list in
 * config/appearance.yml, which is a different thing under a name the two files no longer share.
 */
export const VOCAB_KEYS = [
    'palette',
    'status_palette',
    'type_color',
    'status_legend',
    'domains',
    'themes'
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
 * The glyph vocabulary held in the merged config's `glyphs` key: one character per name, flat. It
 * ships with the catalog as the page's data and is pushed on the `config` channel afterwards, so a
 * glyph is edited in config/glyphs.yml and nowhere else. A value that is not a string is dropped
 * rather than thrown on: the map is a vocabulary and one bad entry is not worth losing the rest.
 */
export function glyphCatalog(config: Record<string, unknown>): Record<string, string> {
    const raw = config.glyphs;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
    const glyphs: Record<string, string> = {};
    for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value === 'string') glyphs[name] = value;
    }
    return glyphs;
}
