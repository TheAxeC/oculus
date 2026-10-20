// Layer 1, data. The merge of the config, in three layers. First oculus's own folder: the shipped
// values of config/defaults/, the catalogs/ and schemas/ files and every text fragment under text/,
// read in name order into one map (a key defined twice named as a finding), then the descriptions
// of config/options/ (options-folder.ts). Then the hub's own layer, `<hub>/.oculus/config.yml`,
// whose values at the keys of HUB_LIST replace oculus's (hub-layer.ts). Last the open workspace
// file's `settings:`, the reader's own values of the other options (workspace-layer.ts). The text
// catalog is folded out of the fragments (text.ts). A catalog or text file is also parsed with its
// whole-file shape (data/shapes/catalog-files/), and each issue of the shape is a finding; the
// merge keeps every key the file holds, as the readers expect.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import { HUB_FILE, fromHubFile, hubKeys } from '../../../helpers/hub-names.ts';
import type { Finding } from '../../../model/index.ts';
import { DEFAULTS_DIR, configDir, engineFile } from '../folder.ts';
import { mergeHub } from './hub-layer.ts';
import { readOptionsFolder } from './options-folder.ts';
import { TEXT_KEY, mergeText, readConfigFile, worded, type PendingFinding } from './text.ts';
import { mergeWorkspace, type WorkspaceLayer } from './workspace-layer.ts';

/** The folder under config/ holding the vocabulary catalogs, merged like the defaults files. */
export const CATALOGS_DIR = 'catalogs';

/** The folder under config/ holding the schemas of the hub's files, merged the same way. */
export const SCHEMAS_DIR = 'schemas';

/** The folder under config/ holding the text fragments, whose `text` keys are folded together. */
const TEXT_DIR = 'text';

/**
 * The files of oculus's config the first layer reads, named relative to config/ and sorted: every
 * file of defaults/, catalogs/, schemas/ and text/, at any depth. The options folder is read on its
 * own (options-folder.ts). Null when there is no config folder.
 */
function configNames(dir: string): string[] | null {
    if (!existsSync(dir)) return null;
    const names: string[] = [];
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
    for (const folder of [DEFAULTS_DIR, CATALOGS_DIR, SCHEMAS_DIR, TEXT_DIR]) {
        collect(join(dir, folder));
    }
    return names.map((file) => relative(dir, file).replaceAll('\\', '/')).sort();
}

/**
 * The name a file of the first layer is known by in `from` and to the readers: a defaults file by
 * its own name (`behavior.yml`), since its keys are the merged map's top-level keys, and any other
 * by its path relative to config/ (`catalogs/vocab.yml`).
 */
function logicalName(name: string): string {
    return name.startsWith(`${DEFAULTS_DIR}/`) ? name.slice(DEFAULTS_DIR.length + 1) : name;
}

/**
 * One file of the config read from this text instead of from the disk, with the layer it belongs
 * to: a file of oculus's `config/`, named relative to that folder (`defaults/behavior.yml`,
 * `options/behavior.yml`), or the hub's settings file (`.oculus/config.yml`, named so). A write of
 * one key merges the file as it would be after the edit with it, so precedence and the
 * defined-twice finding are the merge's own. A settings file whose text is null stands for the file
 * removed.
 */
export type ReplacedFile =
    | { name: string; text: string; layer: 'engine' }
    | { name: string; text: string | null; layer: 'hub' };

/**
 * What loadConfig takes besides the engine: the hub whose settings file is merged, the open
 * workspace file whose `settings:` is merged last, and a file read from a given text.
 */
type ConfigOptions = { hub?: string; workspace?: WorkspaceLayer; instead?: ReplacedFile };

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
 * Merge oculus's config files, then the hub's settings file and the workspace file's `settings:`,
 * into one map. Oculus's files are read in name order; a duplicate top-level key or catalog leaf is
 * a finding and the later file wins. Invalid files are findings and contribute nothing; a missing
 * config directory is a finding and an empty map.
 *
 * When `hub` is given, the hub's settings file `<hub>/.oculus/config.yml` is merged after oculus's
 * files (hub-layer.ts), and when `workspace` is given, its `settings:` after that
 * (workspace-layer.ts). `instead` replaces what the disk holds of one file of oculus's folder or of
 * the hub's settings file for this merge alone.
 *
 * `from` names the file each value came from, keyed by dotted path: a top-level key and a text key
 * by oculus's file (`sources.yml` for config/defaults/sources.yml, `catalogs/vocab.yml`), every key
 * of HUB_LIST by the hub's settings file (`.oculus/config.yml`) when the hub sets it, and every
 * option the workspace file sets by the workspace file's own path.
 *
 * Every finding is worded after the merge, from the catalog the merge produced. A finding key that
 * catalog lacks (config/text/findings.yml itself does not parse, or there is no config directory to
 * hold it) is written as the key followed by its arguments, so the finding still names what broke.
 */
export function loadConfig(
    engine: string,
    opts: ConfigOptions = {}
): {
    config: Record<string, unknown>;
    findings: Finding[];
    from: Record<string, string>;
} {
    const instead = opts.instead?.layer === 'engine' ? opts.instead : undefined;
    const dir = configDir(engine);
    const config: Record<string, unknown> = {};
    const pending: PendingFinding[] = [];
    /** Which file each top-level key came from, so a clash can name both sides. */
    const from: Record<string, string> = {};

    const names = configNames(dir);
    if (names === null) {
        pending.push({
            file: dir,
            key: '',
            words: (catalog) => findingText(catalog, 'findings.config.directory_missing')
        });
        return { config, findings: worded(pending, config), from };
    }

    for (const path of names) {
        const file = join(dir, path);
        const name = logicalName(path);
        const text = (): string =>
            instead?.name === path ? instead.text : readFileSync(file, 'utf8');
        const top = readConfigFile(file, name, text, pending, {});
        if (top === null) continue;
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
    readOptionsFolder(dir, instead, config, from, pending);

    for (const key of hubKeys()) {
        const top = key.split('.')[0];
        if (key !== top && top in from) from[key] = from[top];
    }
    if (opts.hub !== undefined) {
        const replaced = opts.instead?.layer === 'hub' ? opts.instead.text : undefined;
        mergeHub(opts.hub, replaced, config, from, pending);
    }
    if (opts.workspace !== undefined) mergeWorkspace(opts.workspace, config, from, pending);

    return { config, findings: worded(pending, config), from };
}

/**
 * The path of the file a key of the merged map was read from, by the `from` loadConfig returned:
 * the workspace file for a key it set, the hub's settings file under `hub` when `from` names it
 * (there is none without a hub), else oculus's file in its config folder. A key `from` does not
 * hold is looked up by its longest dotted prefix that `from` holds, a row index (`[2]`) left out,
 * and one with no such prefix names the config folder.
 */
export function sourceFile(
    engine: string,
    hub: string | null,
    from: Readonly<Partial<Record<string, string>>>,
    key: string
): string {
    const steps = key.replace(/\[\d+\]/g, '').split('.');
    let name: string | undefined;
    for (let size = steps.length; size > 0 && name === undefined; size--) {
        name = from[steps.slice(0, size).join('.')];
    }
    if (name === undefined) return configDir(engine);
    if (isAbsolute(name)) return name;
    return fromHubFile(name) && hub !== null ? join(hub, HUB_FILE) : engineFile(engine, name);
}

/**
 * Where the values of one merged config were read from: the engine, the hub whose settings file was
 * merged (null for none) and the `from` loadConfig returned. A finding about a value names the file
 * `keyFile` gives for its key.
 */
export type ConfigWhere = {
    engine: string;
    hub: string | null;
    from: Readonly<Partial<Record<string, string>>>;
};

/** The file one key of a merged config was read from (sourceFile). */
export function keyFile(where: ConfigWhere, key: string): string {
    return sourceFile(where.engine, where.hub, where.from, key);
}
