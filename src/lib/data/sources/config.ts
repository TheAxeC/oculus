// Layer 1, data. Resolves the machine-local values and the text catalog from files on disk.
// Server side only: it reads the filesystem and no client module may import it.
// A caller passes the engine directory, and engineDir() derives it from this module's own location
// so dev and the built server agree. One environment variable is read, OCULUS_LOCAL, and only by
// loadLocal(): it names the machine-local file instead of <engine>/local.yml, which is how a test
// server is pointed at a hub in a temporary directory without writing into the checkout.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Finding, UsageAccountConfig } from '../model.ts';

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
    /**
     * Where the file browser's saved workspaces live, `workspaces` in the file. Absent unless the
     * machine sets it, and the file browser then uses ~/.oculus/workspaces.json.
     */
    workspaces?: string;
    /**
     * Where the reader's own bookmarks live, `bookmarks` in the file. Absent unless the machine sets
     * it, and the file browser then uses ~/.oculus/bookmarks.yml.
     */
    bookmarks?: string;
    /**
     * Where the scratch notes live, `notes` in the file. Absent unless the machine sets it, and the
     * file browser then uses ~/.oculus/notes.
     */
    notes?: string;
    /**
     * Where the change log lives, `changes` in the file. Absent unless the machine sets it, and the
     * write path then uses ~/.oculus/changes.jsonl.
     */
    changes?: string;
    /** Absolute or PATH-resolved Claude CLI used by unattended update-task terminals. */
    claudeBin: string;
    /** Claude and Codex config folders shown by the Usage view. */
    accounts: UsageAccountConfig[];
};

/** The default development port; the reserved port 8787 is never used. */
export const DEFAULT_PORT = 8790;

const LOCAL_KEYS = [
    'hub',
    'port',
    'hpc_host',
    'sessions_cache',
    'sessions_overrides',
    'workspaces',
    'bookmarks',
    'notes',
    'changes',
    'claude_bin',
    'accounts'
];

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

/** The defaults: the hub is two directories above tools/oculus, the port is 8790, and Claude is resolved on PATH. */
export function localDefaults(engine: string): LocalConfig {
    return {
        hub: resolve(engine, '..', '..'),
        port: DEFAULT_PORT,
        claudeBin: 'claude',
        accounts: [
            { tool: 'claude', dir: join(homedir(), '.claude'), label: 'claude' },
            { tool: 'codex', dir: join(homedir(), '.codex'), label: 'codex' }
        ]
    };
}

function accountDir(value: string, base: string): string {
    if (value === '~') return homedir();
    if (value.startsWith('~/')) return join(homedir(), value.slice(2));
    return isAbsolute(value) ? value : resolve(base, value);
}

/** The label fragment shared by config validation and hidden usage session names. */
export function usageAccountLabel(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

function usageAccounts(value: unknown, file: string, base: string): UsageAccountConfig[] {
    if (!Array.isArray(value)) throw new Error(`${file}: accounts must be a list`);
    const claudeLabels = new Set<string>();
    return value.map((item, index) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            throw new Error(`${file}: accounts[${index}] must be a map`);
        }
        const row = item as Record<string, unknown>;
        const tool = row.tool;
        if (tool !== 'claude' && tool !== 'codex') {
            throw new Error(`${file}: accounts[${index}].tool must be claude or codex`);
        }
        if (typeof row.dir !== 'string' || row.dir.length === 0) {
            throw new Error(`${file}: accounts[${index}].dir must be a path`);
        }
        if (typeof row.label !== 'string' || row.label.length === 0) {
            throw new Error(`${file}: accounts[${index}].label must be words`);
        }
        if (tool === 'claude') {
            const reduced = usageAccountLabel(row.label);
            if (claudeLabels.has(reduced)) {
                throw new Error(
                    `${file}: accounts[${index}].label duplicates a Claude label or reduced label: ${reduced}`
                );
            }
            claudeLabels.add(reduced);
        }
        return { tool: tool, dir: accountDir(row.dir, base), label: row.label };
    });
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
    if (record.claude_bin !== undefined) {
        if (typeof record.claude_bin !== 'string' || record.claude_bin.length === 0) {
            throw new Error(`${file}: claude_bin must be a non-empty string`);
        }
        config.claudeBin = record.claude_bin;
    }
    if (record.accounts !== undefined) config.accounts = usageAccounts(record.accounts, file, base);
    // The machine-local state paths are absent unless the machine names them, so a config that says
    // nothing about them leaves the defaults to the modules that own them.
    for (const [key, field] of [
        ['sessions_cache', 'sessionsCache'],
        ['sessions_overrides', 'sessionsOverrides'],
        ['workspaces', 'workspaces'],
        ['bookmarks', 'bookmarks'],
        ['notes', 'notes'],
        ['changes', 'changes']
    ] as const) {
        if (record[key] === undefined) continue;
        if (typeof record[key] !== 'string' || record[key] === '') {
            throw new Error(`${file}: ${key} must be a path`);
        }
        const value = record[key];
        config[field] = isAbsolute(value) ? value : resolve(base, value);
    }
    return config;
}

/** The one top-level key more than one file may carry. Catalog fragments merge by dotted leaf. */
export const TEXT_KEY = 'text';

/** Fold one catalog fragment into the flat dotted map, naming any key read twice. */
function mergeText(
    config: Record<string, unknown>,
    value: unknown,
    name: string,
    file: string,
    from: Record<string, string>,
    findings: Finding[]
): void {
    let flat: Record<string, string>;
    try {
        flat = flattenText(value);
    } catch (error) {
        findings.push({
            file,
            key: TEXT_KEY,
            message: error instanceof Error ? error.message : String(error)
        });
        return;
    }
    const held = (config[TEXT_KEY] ??= {}) as Record<string, string>;
    for (const [key, entry] of Object.entries(flat)) {
        const dotted = `${TEXT_KEY}.${key}`;
        if (key in held) {
            findings.push({
                file,
                key: dotted,
                message: `key ${dotted} is already defined in ${from[dotted]}; ${name} wins`
            });
        }
        held[key] = entry;
        from[dotted] = name;
    }
}

/** Root config files plus every catalog fragment, all named relative to config and sorted. */
function configNames(dir: string): string[] {
    const names = readdirSync(dir)
        .filter((name) => name.endsWith('.yml'))
        .map((name) => join(dir, name));
    const collect = (folder: string): void => {
        let entries;
        try {
            entries = readdirSync(folder, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const path = join(folder, entry.name);
            if (entry.isDirectory()) collect(path);
            else if (entry.name.endsWith('.yml')) names.push(path);
        }
    };
    collect(join(dir, 'text'));
    return names.map((file) => relative(dir, file)).sort();
}

/**
 * Merge root config files and catalog fragments into one map. Files are read in name order. A
 * duplicate top-level key or catalog leaf is a finding and the later file wins. Invalid files are
 * findings and contribute nothing; a missing config directory is a finding and an empty map.
 */

/** The pure reader of the `collections:` keys lives with the registry keys it excludes, client-safe. */
export { collectionKeys } from '../normalise.ts';

/**
 * The directory the engine's YAML is read from and written to: `<engine>/config`, or the directory
 * OCULUS_CONFIG names.
 *
 * The override is the companion of OCULUS_LOCAL and is there for the same reason: the browser layer
 * stands a server up and presses controls that write, the Slides view's Save among them, and the
 * file that save edits is `config/present.yml`. Pointing the run at a copy keeps a tracked file from
 * being a test fixture. A relative value resolves against the engine, so a path typed on the command
 * line means what it looks like from tools/oculus.
 */
export function configDir(engine: string): string {
    const named = process.env.OCULUS_CONFIG;
    if (named === undefined || named === '') return join(engine, 'config');
    return isAbsolute(named) ? named : resolve(engine, named);
}

export function loadConfig(engine: string): {
    config: Record<string, unknown>;
    findings: Finding[];
} {
    const dir = configDir(engine);
    const config: Record<string, unknown> = {};
    const findings: Finding[] = [];
    /** Which file each top-level key came from, so a clash can name both sides. */
    const from: Record<string, string> = {};

    let names: string[];
    try {
        names = configNames(dir);
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
            if (key === TEXT_KEY) {
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
 * The flat catalog held in the merged config's `text` key. Owner files may move without changing
 * readers because their dotted keys are the public vocabulary.
 */
export function textCatalog(config: Record<string, unknown>): Record<string, string> {
    return flattenText(config.text ?? {});
}

/**
 * The keys of the merged config the client state installs before the page renders: the colours and
 * the chip vocabulary state/tones.ts reads, and the theme list, the wallpaper and the CRT default
 * state/appearance.ts reads. `domains` is the research domains of config/vocab.yml; `themes`,
 * `wallpaper`, `crt` and `terminal` are config/appearance.yml's.
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
    'crt',
    'terminal'
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
    return stringMap(config.glyphs);
}

/**
 * The ASCII stand-ins held in the merged config's `ascii` key: one short string per character, flat.
 * It rides with the glyphs, since it is the other half of the same vocabulary and lives in the same
 * file. It is keyed by character so glyph names that share a character share one stand-in.
 */
export function asciiCatalog(config: Record<string, unknown>): Record<string, string> {
    return stringMap(config.ascii);
}

/**
 * The icon map held in the merged config's `icons` key: one icon name per glyph name, flat. It is
 * the names alone; iconSet() is what turns them into the drawing the page is given.
 */
export function iconCatalog(config: Record<string, unknown>): Record<string, string> {
    return stringMap(config.icons);
}

/**
 * The file the icon package ships for one icon name, or nothing when it ships none. The package is
 * resolved the way an import of it would be, so a hoisted install and a nested one both answer and
 * no path into node_modules is written here.
 */
const resolver = createRequire(import.meta.url);

/** The shape of an icon name in the package: lowercase words joined by hyphens, and no path. */
const ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function iconFile(icon: string): string | null {
    if (!ICON_NAME.test(icon)) return null;
    try {
        return resolver.resolve(`lucide-static/icons/${icon}.svg`);
    } catch {
        return null;
    }
}

/**
 * Every way the icon map and the glyph vocabulary can drift apart, as findings: a glyph name with
 * no row, a row naming something that is not a glyph name, and a row naming an icon the package
 * does not ship. The package is a fact about this machine's install rather than about the merged
 * files, which is why this is separate from loadConfig and takes the engine directory.
 */
export function iconFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'icons.yml');
    const map = iconCatalog(config);
    const glyphs = glyphCatalog(config);
    const findings: Finding[] = [];
    for (const name of Object.keys(glyphs)) {
        if (name in map) continue;
        findings.push({ file, key: name, message: `glyph ${name} has no icon` });
    }
    for (const [name, icon] of Object.entries(map)) {
        if (!(name in glyphs)) {
            findings.push({
                file,
                key: name,
                message: `${name} is not a name in config/glyphs.yml`
            });
        } else if (iconFile(icon) === null) {
            findings.push({ file, key: name, message: `the icon package ships no ${icon}.svg` });
        }
    }
    return findings;
}

/** The icon drawings in force, in a holder whose contents the config watcher replaces. */
export type IconMemory = { set: Record<string, string> };

/**
 * The drawing of every mapped icon, by glyph name, read once per config load and shipped with the
 * glyph vocabulary so the page never fetches an icon file of its own. A row the findings above
 * report is left out, and the primitive draws the glyph character for a name that is not here.
 */
export function iconSet(config: Record<string, unknown>): Record<string, string> {
    const glyphs = glyphCatalog(config);
    const icons: Record<string, string> = {};
    for (const [name, icon] of Object.entries(iconCatalog(config))) {
        if (!(name in glyphs)) continue;
        const file = iconFile(icon);
        if (file === null) continue;
        icons[name] = readFileSync(file, 'utf8').trim();
    }
    return icons;
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

/** The Live HPC settings of config/behavior.yml, every key required. */
export type SlurmSettings = {
    host: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
};

/** Read `slurm:` with its five keys, or throw naming the key that is missing or mistyped. */
export function slurmSettings(config: Record<string, unknown>): SlurmSettings {
    const held = config.slurm;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: slurm must be a map');
    }
    const slurm = held as Record<string, unknown>;
    const number = (key: string): number => {
        const value = slurm[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(`config/behavior.yml: slurm.${key} must be a number`);
        }
        return value;
    };
    if (typeof slurm.host !== 'string' || slurm.host === '') {
        throw new Error('config/behavior.yml: slurm.host must be a non-empty string');
    }
    if (typeof slurm.prewarm !== 'boolean') {
        throw new Error('config/behavior.yml: slurm.prewarm must be true or false');
    }
    return {
        host: slurm.host,
        days: number('days'),
        pollMin: number('poll_min'),
        quotaMin: number('quota_min'),
        prewarm: slurm.prewarm
    };
}

/** Read `changes.keep`, how many change-log lines are kept, or throw naming what is wrong. */
export function changesKeep(config: Record<string, unknown>): number {
    const held = config.changes;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: changes must be a map');
    }
    const keep = (held as Record<string, unknown>).keep;
    if (typeof keep !== 'number' || !Number.isInteger(keep) || keep <= 0) {
        throw new Error('config/behavior.yml: changes.keep must be a whole number above zero');
    }
    return keep;
}

/** Read `usage_tiers:`, a map of plan id to label, or throw. */
export function usageTiers(config: Record<string, unknown>): Record<string, string> {
    const held = config.usage_tiers;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) {
        throw new Error('config/behavior.yml: usage_tiers must be a map');
    }
    for (const [key, value] of Object.entries(held)) {
        if (typeof value !== 'string') {
            throw new Error(`config/behavior.yml: usage_tiers.${key} must be a string`);
        }
    }
    return held as Record<string, string>;
}
