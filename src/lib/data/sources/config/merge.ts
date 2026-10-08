// Layer 1, data. The merge of the engine's config folder: the top-level files, the catalogs and
// schemas folders' and every text fragment under text/, read in name order into one map, a key
// defined twice named as a finding, and the text catalog flattened out of it. A catalog or text
// file is also parsed with its whole-file shape (data/shapes/catalog-files.ts), and each issue of
// the shape is a finding; the merge keeps every key the file holds, as the readers expect.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { z } from 'zod';
import { parse } from 'yaml';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { isMap } from '../../helpers/guards.ts';
import type { Finding } from '../../model/index.ts';
import { issueText, shapeIssues } from '../../shapes/shape-issues.ts';
import { mapOfShape, readAs, textOrNumberOnlyShape } from '../../shapes/shapes.ts';
import { errorLine } from '../yaml-file.ts';
import { configDir } from './folder.ts';
import { LOCAL_NAME } from './local.ts';

/** The folder under config/ holding the vocabulary catalogs, merged like the top-level files. */
export const CATALOGS_DIR = 'catalogs';

/** The folder under config/ holding the schemas of the hub's files, merged the same way. */
export const SCHEMAS_DIR = 'schemas';

/** The one top-level key more than one file may carry. Catalog fragments merge by dotted leaf. */
export const TEXT_KEY = 'text';

/** The top-level keys of one config file, in their order, without an own `__proto__` key. */
const keysShape = mapOfShape(z.unknown());

/** A catalog leaf: a text, or a number or a boolean written out. */
const leafShape = z.union([textOrNumberOnlyShape, z.boolean().transform(String)]);

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
 * Root config files, the catalogs and schemas folders' files and every text fragment, all named
 * relative to config and sorted.
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
    collect(join(dir, SCHEMAS_DIR));
    collect(join(dir, 'text'));
    return names.map((file) => relative(dir, file)).sort();
}

/**
 * One file of the config folder read from this text instead of from the disk, named relative to
 * config/ (`behavior.yml`). A write of one key merges the file as it would be after the edit with
 * it, so precedence and the defined-twice finding are the merge's own.
 */
export type ReplacedFile = { name: string; text: string };

/**
 * Whether the merge dropped a config file (`behavior.yml`): it raised a finding about the whole
 * file, key `''`, which leaves the merged map without any of the file's keys. A finding is read as
 * its file and key, so a reader holding only the config channel's findings can ask.
 */
export function droppedFile(
    findings: readonly Pick<Finding, 'file' | 'key'>[],
    name: string
): boolean {
    return findings.some(
        (finding) =>
            finding.key === '' &&
            (finding.file === name ||
                finding.file.endsWith(`/${name}`) ||
                finding.file.endsWith(`\\${name}`))
    );
}

/**
 * Merge root config files and catalog fragments into one map. Files are read in name order and
 * local.yml is not one of them. A duplicate top-level key or catalog leaf is a finding and the
 * later file wins. Invalid files are findings and contribute nothing; a missing config directory is
 * a finding and an empty map.
 *
 * `instead` replaces what the disk holds of one file for this merge alone.
 *
 * Every finding is worded after the merge, from the catalog the merge produced. A finding key that
 * catalog lacks (config/text/findings.yml itself does not parse, or there is no config directory to
 * hold it) is written as the key followed by its arguments, so the finding still names what broke.
 */
export function loadConfig(
    engine: string,
    instead?: ReplacedFile
): {
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
            const text = instead?.name === name ? instead.text : readFileSync(file, 'utf8');
            parsed = parse(text) ?? {};
        } catch (error) {
            const message = errorLine(error);
            pending.push({
                file,
                key: '',
                words: (catalog) => findingText(catalog, 'findings.file.does_not_parse', message)
            });
            continue;
        }
        const top = readAs(keysShape, parsed);
        if (top === null) {
            pending.push({
                file,
                key: '',
                words: (catalog) => findingText(catalog, 'findings.file.not_a_map')
            });
            continue;
        }
        for (const issue of shapeIssues(name, parsed)) {
            pending.push({
                file,
                key: issue.key,
                words: (catalog) => issueText(catalog, issue)
            });
        }
        for (const [key, value] of Object.entries(top)) {
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
 * Flatten a nested map of strings to dotted keys. Values are strings; anything else is an error. An
 * own `__proto__` key is skipped at every level, because it is no key of the flat map.
 */
export function flattenText(node: unknown, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};
    if (!isMap(node)) throw new TextNotAMap(prefix || 'root');
    for (const [key, value] of Object.entries(node)) {
        if (key === '__proto__') continue;
        const dotted = prefix === '' ? key : `${prefix}.${key}`;
        const leaf = readAs(leafShape, value);
        if (leaf !== null) flat[dotted] = leaf;
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
