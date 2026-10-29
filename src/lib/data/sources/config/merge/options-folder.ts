// Layer 1, data. The options folder, config/options/: one file per file of oculus's config it
// describes, each holding `options:`, the description of every option of that file by its dotted
// key path, and `groups:`, the help line of each group of its dotted options. A file at the top
// describes the defaults file of its name (and local.yml, a hub's machine file); `catalogs/` and
// `schemas/` describe the catalog and schema files of their name (`catalogs/vocab.yml`, whose words
// a hub lays over oculus's by shape, and `schemas/manifest-schema.yml`); `text.yml` describes the
// workspace's words, `text`. The folder is read on its own, after oculus's other files, into three
// keys of the merged map: `options`, which maps each described file's name (the file's path under
// config/options/) to its entries, `option_groups`, which maps it to what its `groups:` holds, and
// `option_descriptions`, which maps it to its `descriptions:`, the field records its fields name.
// Each entry is given oculus's own value at its path as its `default`, since the shipped file is
// the one place a shipped value is written; local.yml has no shipped file and its entries carry
// none, and neither does `text`, whose default would be the whole text catalog sent twice.
//
// Each file is parsed with its whole-file shape (data/shapes/catalog-files/), and every issue the
// shape finds is a finding; what the options reader words itself is left to it
// (catalog/option-findings.ts).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import { OPTIONS_DIR } from '../folder.ts';
import { LOCAL_NAME } from '../local.ts';
import { inPlaceOf } from './in-place.ts';
import { readConfigFile, type PendingFinding } from './text.ts';
import { valueAt } from './tree.ts';

/** The key of the merged map that holds every options file's entries, by the file they describe. */
const OPTIONS_KEY = 'options';

/** The key of the merged map that holds every options file's group help lines, by file. */
const GROUPS_KEY = 'option_groups';

/**
 * The key of the merged map that holds every options file's named field records, by file: the
 * records its fields name by `described_by` (catalog/options.ts).
 */
const DESCRIPTIONS_KEY = 'option_descriptions';

/** A file of the folder read from this text instead of from the disk, named relative to config/. */
type Instead = { name: string; text: string } | undefined;

/** The described file whose entries carry no default: the workspace's words. */
const NO_DEFAULTS = 'text.yml';

/** The subfolders of the options folder: those of the catalog and schema files. */
const SUBFOLDERS = ['catalogs', 'schemas'];

/** The `.yml` files of one folder, in name order; none for a folder that cannot be listed. */
function ymlNames(dir: string): string[] {
    try {
        return readdirSync(dir)
            .filter((name) => name.endsWith('.yml') && statSync(join(dir, name)).isFile())
            .sort();
    } catch {
        return [];
    }
}

/**
 * The names of the folder's files, relative to config/: the files at its top in name order, then
 * those of each subfolder of SUBFOLDERS in that order; none without the folder.
 */
function optionNames(dir: string): string[] {
    const top = join(dir, OPTIONS_DIR);
    const names = ymlNames(top).map((name) => `${OPTIONS_DIR}/${name}`);
    for (const sub of SUBFOLDERS) {
        names.push(...ymlNames(join(top, sub)).map((name) => `${OPTIONS_DIR}/${sub}/${name}`));
    }
    return names;
}

/**
 * An options file's entries with each one's default: oculus's value at the entry's path, copied so
 * a later layer of the merge cannot change it, and `in_place` on an entry whose value a hub or a
 * workspace lays over oculus's in oculus's place (`inPlaceOf`). An entry that is not a map, and
 * every entry of local.yml and of text.yml, is kept as it is written.
 */
function withDefaults(
    entries: Record<string, unknown>,
    file: string,
    config: Record<string, unknown>
): Record<string, unknown> {
    if (file === LOCAL_NAME || file === NO_DEFAULTS) return entries;
    const read: Record<string, unknown> = {};
    for (const [path, entry] of Object.entries(entries)) {
        const shipped = valueAt(config, path);
        const placed = (inPlaceOf(path)?.kind ?? 'whole') === 'whole' ? {} : { in_place: true };
        read[path] =
            isMap(entry) && shipped !== undefined
                ? { ...entry, default: structuredClone(shipped), ...placed }
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
    const descriptions: Record<string, unknown> = {};
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
        if (isMap(parsed.descriptions)) descriptions[described] = parsed.descriptions;
    }
    // The folder is named as a path relative to config/, as a catalog file is, for sourceFile.
    const folder = `${OPTIONS_DIR}/`;
    for (const key of [OPTIONS_KEY, GROUPS_KEY, DESCRIPTIONS_KEY]) {
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
    config[DESCRIPTIONS_KEY] = descriptions;
    from[OPTIONS_KEY] = folder;
    from[GROUPS_KEY] = folder;
    from[DESCRIPTIONS_KEY] = folder;
}
