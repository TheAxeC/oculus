// Layer 1, data. The options folder, config/options/: one file per defaults file (and local.yml),
// each holding `options:`, the description of every option of that file by its dotted key path,
// and `groups:`, the help line of each group of its dotted options. The folder is read on its own,
// after oculus's other files, into two keys of the merged map: `options`, which maps each file's
// name to its entries, and `option_groups`, which maps it to what its `groups:` holds. Each entry
// of a defaults file is given that file's own value at its path as its `default`, since the
// defaults file is the one place a shipped value is written; local.yml has no defaults file and
// its entries carry none.
//
// Each file is parsed with its whole-file shape (data/shapes/catalog-files/), and every issue the
// shape finds is a finding; what the options reader words itself is left to it
// (catalog/option-findings.ts).

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import { OPTIONS_DIR } from '../folder.ts';
import { LOCAL_NAME } from '../local.ts';
import { readConfigFile, type PendingFinding } from './text.ts';
import { valueAt } from './tree.ts';

/** The key of the merged map that holds every options file's entries, by the file they describe. */
const OPTIONS_KEY = 'options';

/** The key of the merged map that holds every options file's group help lines, by file. */
const GROUPS_KEY = 'option_groups';

/** A file of the folder read from this text instead of from the disk, named relative to config/. */
type Instead = { name: string; text: string } | undefined;

/** The names of the folder's files, relative to config/, in name order; none without the folder. */
function optionNames(dir: string): string[] {
    let names: string[];
    try {
        names = readdirSync(join(dir, OPTIONS_DIR));
    } catch {
        return [];
    }
    return names
        .filter((name) => name.endsWith('.yml'))
        .sort()
        .map((name) => `${OPTIONS_DIR}/${name}`);
}

/**
 * An options file's entries with each one's default: the defaults file's value at the entry's path,
 * copied so a later layer of the merge cannot change it. An entry that is not a map, and every
 * entry of local.yml, is kept as it is written.
 */
function withDefaults(
    entries: Record<string, unknown>,
    file: string,
    config: Record<string, unknown>
): Record<string, unknown> {
    if (file === LOCAL_NAME) return entries;
    const read: Record<string, unknown> = {};
    for (const [path, entry] of Object.entries(entries)) {
        const shipped = valueAt(config, path);
        read[path] =
            isMap(entry) && shipped !== undefined
                ? { ...entry, default: structuredClone(shipped) }
                : entry;
    }
    return read;
}

/**
 * Read every file of config/options/ into the merged map's `options` and `option_groups`, with the
 * findings of a file that does not read or whose shape refuses a key. A file the shape refuses
 * whole contributes nothing, and the folder missing contributes nothing.
 */
export function readOptionsFolder(
    dir: string,
    instead: Instead,
    config: Record<string, unknown>,
    from: Record<string, string>,
    pending: PendingFinding[]
): void {
    const names = optionNames(dir);
    if (names.length === 0) return;
    const options: Record<string, unknown> = {};
    const groups: Record<string, unknown> = {};
    for (const name of names) {
        const file = join(dir, name);
        const text = (): string =>
            instead?.name === name ? instead.text : readFileSync(file, 'utf8');
        const parsed = readConfigFile(file, name, text, pending, null);
        if (parsed === null) continue;
        const described = name.slice(OPTIONS_DIR.length + 1);
        if (isMap(parsed.options)) {
            options[described] = withDefaults(parsed.options, described, config);
        }
        if (Object.hasOwn(parsed, 'groups')) groups[described] = parsed.groups;
    }
    // The folder is named as a path relative to config/, as a catalog file is, for sourceFile.
    const folder = `${OPTIONS_DIR}/`;
    for (const key of [OPTIONS_KEY, GROUPS_KEY]) {
        if (!(key in config)) continue;
        const earlier = from[key];
        pending.push({
            file: join(dir, OPTIONS_DIR),
            key,
            words: (catalog) =>
                findingText(catalog, 'findings.config.defined_twice', key, earlier, folder)
        });
    }
    config[OPTIONS_KEY] = options;
    config[GROUPS_KEY] = groups;
    from[OPTIONS_KEY] = folder;
    from[GROUPS_KEY] = folder;
}
