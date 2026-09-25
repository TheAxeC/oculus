// Layer 1, data. The merge of the engine's config folder: the top-level files, the catalogs
// folder's and every text fragment under text/, read in name order into one map, a key defined
// twice named as a finding, and the text catalog flattened out of it.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { configDir } from './folder.ts';
import { LOCAL_NAME } from './local.ts';

/** The folder under config/ holding the vocabulary catalogs, merged like the top-level files. */
export const CATALOGS_DIR = 'catalogs';

/** The one top-level key more than one file may carry. Catalog fragments merge by dotted leaf. */
export const TEXT_KEY = 'text';

/**
 * A finding of loadConfig before its words are known. The catalog is what loadConfig is reading, so
 * each finding is worded only once every file is merged, from the catalog that merge produced.
 */
type PendingFinding = { file: string; key: string; words: (catalog: TextCatalog) => string };

/** Fold one catalog fragment into the flat dotted map, naming any key read twice. */
function mergeText(
    config: Record<string, unknown>,
    value: unknown,
    name: string,
    file: string,
    from: Record<string, string>,
    pending: PendingFinding[]
): void {
    let flat: Record<string, string>;
    try {
        flat = flattenText(value);
    } catch (error) {
        if (error instanceof TextNotAMap) {
            const path = error.path;
            pending.push({
                file,
                key: TEXT_KEY,
                words: (catalog) => findingText(catalog, 'findings.config.text_not_a_map', path)
            });
            return;
        }
        // Anything else (a fragment whose aliases loop, say) is reported in the parser's own words,
        // so one bad fragment is a finding rather than a failed request.
        const message = error instanceof Error ? error.message : String(error);
        pending.push({ file, key: TEXT_KEY, words: () => message });
        return;
    }
    const held = (config[TEXT_KEY] ??= {}) as Record<string, string>;
    for (const [key, entry] of Object.entries(flat)) {
        const dotted = `${TEXT_KEY}.${key}`;
        if (key in held) {
            const earlier = from[dotted];
            pending.push({
                file,
                key: dotted,
                words: (catalog) =>
                    findingText(catalog, 'findings.config.defined_twice', dotted, earlier, name)
            });
        }
        held[key] = entry;
        from[dotted] = name;
    }
}

/**
 * Root config files, the catalogs folder's files and every text fragment, all named relative to
 * config and sorted.
 *
 * local.yml is left out by name: it is the machine's own and loadLocal reads it, so a key it
 * carries is never merged into the map and never reported as defined in two files.
 */
function configNames(dir: string): string[] {
    const names = readdirSync(dir)
        .filter((name) => name.endsWith('.yml') && name !== LOCAL_NAME)
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
    collect(join(dir, CATALOGS_DIR));
    collect(join(dir, 'text'));
    return names.map((file) => relative(dir, file)).sort();
}

/**
 * Merge root config files and catalog fragments into one map. Files are read in name order and
 * local.yml is not one of them. A duplicate top-level key or catalog leaf is a finding and the
 * later file wins. Invalid files are findings and contribute nothing; a missing config directory is
 * a finding and an empty map.
 *
 * Every finding is worded after the merge, from the catalog the merge produced. A finding key that
 * catalog lacks (config/text/findings.yml itself does not parse, or there is no config directory to
 * hold it) is written as the key followed by its arguments, so the finding still names what broke.
 */
export function loadConfig(engine: string): {
    config: Record<string, unknown>;
    findings: Finding[];
} {
    const dir = configDir(engine);
    const config: Record<string, unknown> = {};
    const pending: PendingFinding[] = [];
    /** Which file each top-level key came from, so a clash can name both sides. */
    const from: Record<string, string> = {};

    let names: string[];
    try {
        names = configNames(dir);
    } catch {
        pending.push({
            file: dir,
            key: '',
            words: (catalog) => findingText(catalog, 'findings.config.directory_missing')
        });
        return { config, findings: worded(pending, config) };
    }

    for (const name of names) {
        const file = join(dir, name);
        let parsed: unknown;
        try {
            parsed = parse(readFileSync(file, 'utf8')) ?? {};
        } catch (error) {
            const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
            pending.push({
                file,
                key: '',
                words: (catalog) => findingText(catalog, 'findings.file.does_not_parse', message)
            });
            continue;
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            pending.push({
                file,
                key: '',
                words: (catalog) => findingText(catalog, 'findings.file.not_a_map')
            });
            continue;
        }
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (key === TEXT_KEY) {
                mergeText(config, value, name, file, from, pending);
                continue;
            }
            if (key in config) {
                const earlier = from[key];
                pending.push({
                    file,
                    key,
                    words: (catalog) =>
                        findingText(catalog, 'findings.config.defined_twice', key, earlier, name)
                });
            }
            config[key] = value;
            from[key] = name;
        }
    }

    return { config, findings: worded(pending, config) };
}

/** loadConfig's findings in the words of the catalog its merge produced, in the order raised. */
function worded(pending: PendingFinding[], config: Record<string, unknown>): Finding[] {
    const catalog = textCatalog(config);
    return pending.map(({ file, key, words }) => ({ file, key, message: words(catalog) }));
}

/**
 * What flattenText throws for a catalog node that is neither a string nor a map, with the node's
 * dotted path (`root` for the whole block), so loadConfig can word the finding from the catalog.
 */
class TextNotAMap extends Error {
    readonly path: string;

    constructor(path: string) {
        super(`text catalog: ${path} is not a map`);
        this.path = path;
    }
}

/**
 * Flatten a nested map of strings to dotted keys. Values are strings; anything else is an error.
 */
export function flattenText(node: unknown, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
        throw new TextNotAMap(prefix || 'root');
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
