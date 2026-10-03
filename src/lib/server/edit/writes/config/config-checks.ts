// Layer 2, server. What every write of a tracked config file checks before it writes: the readers
// of the merged configuration that a config value can make refuse, the read-back of the edited text
// against the original, and the catalog's entry for an option.
//
// Nothing is written until three checks pass. The edited text must parse back to the original with
// exactly the written key changed. The merged configuration built with the edited file in place of
// the old one must give `loadConfig` no finding it did not give before. And every reader in READERS
// and FINDERS below, the readers of the merged configuration that a config value can make refuse,
// must accept it: a reader that throws refuses the write whether or not it threw before, so a block
// that is already wrong takes the write that repairs it and refuses a write that leaves it wrong,
// and a finding is refused only when it is new. The reason a refusal carries is the reader's own
// sentence or the finding's words, so the Settings view shows what to repair.

import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { requirePaintLimit } from '../../../../data/helpers/editor.ts';
import {
    LOCAL_NAME,
    behaviorFindings,
    calendarSettings,
    changesKeep,
    configDir,
    filesSettings,
    iconFindings,
    languageFindings,
    loadConfig,
    loadLocalOrDefaults,
    mailSettings,
    nestingFindings,
    openSettings,
    searchSettings,
    slurmSettings,
    textCatalog,
    themeFindings,
    usageTiers
} from '../../../../data/sources/config.ts';
import {
    catalogOf,
    type Catalog,
    type CatalogEntry
} from '../../../../data/sources/config/catalog/options.ts';
import { railFindings } from '../../../../data/sources/config/rail.ts';
import type { Finding } from '../../../../data/model/index.ts';
import { docFindings, layoutFile } from '../../../content/docs.ts';
import { requireRefreshSettings } from '../../../machine/usage/refresh.ts';
import { requireAutofetch } from '../../../core/fetch-period.ts';
import type { ChangeRecord } from '../../../core/changes.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import type { Refusal } from '../../yaml/yaml-edit.ts';
import { readBack } from '../../list-edit.ts';

/** What a config write answers with: what it changed, or the one refusal and its reason. */
export type ConfigKeyOutcome = {
    changed: string[];
    refused: Refusal[];
    records?: ChangeRecord[];
};

/** The answer of a write refused for one reason, naming the file and key it was asked of. */
export function refusing(file: string, key: string): (reason: string) => ConfigKeyOutcome {
    return (reason) => ({ changed: [], refused: [{ field: `${file}:${key}`, reason }] });
}

/** The value a file holds at one option now, and whether the option is still there. */
export type OptionNow = { found: boolean; value: unknown };

/**
 * What an undo reads of one option: the file's text through `read`, which answers null for an
 * option the text does not hold in the shape wanted. A file the catalog does not track, one that is
 * gone and text that `read` throws on all answer not found.
 */
export function optionNow(
    engine: string,
    file: string,
    key: string,
    read: (text: string) => OptionNow | null
): OptionNow {
    const none = { found: false, value: null };
    const text = optionText(engine, file, key);
    if (text === null) return none;
    try {
        return read(text) ?? none;
    } catch {
        return none;
    }
}

/** The merged configuration, which every reader below takes. */
type Merged = Record<string, unknown>;

/*
 * The readers of the merged configuration are one list in two shapes. A reader in READERS throws on
 * a value it refuses; a reader in FINDERS returns findings, which are the same refusal reported as
 * words. The server's notification reader is in neither, since it falls back to its defaults and
 * refuses nothing, and a catalog reader that drops what it cannot read is in neither either.
 */

/**
 * The readers that throw on a value of the merged configuration: the settings readers, the checks
 * the server makes when it starts, and the text catalog. A reader that throws on the merged
 * configuration holding the edited value refuses the write, whether or not it threw before.
 */
const READERS: ((config: Merged) => unknown)[] = [
    slurmSettings,
    calendarSettings,
    mailSettings,
    searchSettings,
    openSettings,
    filesSettings,
    changesKeep,
    usageTiers,
    requirePaintLimit,
    requireAutofetch,
    (config) =>
        requireRefreshSettings({
            refreshMin: config.usage_refresh_min,
            model: config.usage_refresh_model
        }),
    textCatalog
];

/**
 * The readers that return findings. A finding one gives after the edit that it did not give before,
 * compared by its words, refuses the write, and so does a finder that throws after the edit; a
 * finder that threw before the edit is not compared, since it has no findings to compare with.
 */
const FINDERS: ((config: Merged, engine: string, hub: string) => Finding[])[] = [
    (config, engine) => iconFindings(engine, config),
    (config, engine) => behaviorFindings(engine, config),
    (config, engine) => languageFindings(engine, config),
    (config, engine) => nestingFindings(engine, config),
    (config, engine) => themeFindings(engine, config),
    (config, engine, hub) => docFindings(config, hub, layoutFile(engine)),
    (config, engine) => railFindings(config, layoutFile(engine), textCatalog(config))
];

/**
 * The catalog's entry for one option of one tracked file, or null. The file is compared as the
 * whole string against the catalog's own keys and the key looked up as an own key, so a path, a
 * reserved name and the machine's own file are none of them an option.
 */
export function optionOf(catalog: Catalog, file: string, key: string): CatalogEntry | null {
    if (file === LOCAL_NAME || file !== basename(file)) return null;
    if (!Object.hasOwn(catalog, file)) return null;
    const entries = catalog[file];
    return Object.hasOwn(entries, key) ? entries[key] : null;
}

/**
 * The text of the file one option lives in, or null when the catalog tracks no such option or the
 * file is gone. A file that is there and cannot be read throws, so an undo answers as a write of
 * the same file does.
 */
export function optionText(engine: string, file: string, key: string): string | null {
    try {
        if (optionOf(catalogOf(loadConfig(engine).config), file, key) === null) return null;
        return readFileSync(join(configDir(engine), file), 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return null;
    }
}

/**
 * A copy of a parsed value that shares no map or list with it and keeps every scalar as it is,
 * `Infinity`, `NaN` and `-0` included. A copy that kept an alias's shared map shared would set the
 * key in what the alias reads too and hide the change, and a JSON copy would turn those scalars
 * into others.
 */
function copyOf(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(copyOf);
    if (typeof value !== 'object' || value === null) return value;
    const entries = Object.entries(value).map(([key, held]) => [key, copyOf(held)] as const);
    return Object.fromEntries(entries);
}

/**
 * Whether the edited text still says what the original said with this one key changed: it must
 * parse, and read back it must equal the original with the key set to the value, at every depth.
 */
export function kept(source: string, edited: string, key: string, wanted: unknown): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    const expected = copyOf(read.before) as Record<string, unknown>;
    const path = key.split('.');
    let holder: Record<string, unknown> = expected;
    for (const segment of path.slice(0, -1)) holder = holder[segment] as Record<string, unknown>;
    holder[path[path.length - 1]] = wanted;
    return isDeepStrictEqual(read.after, expected);
}

/** The words of a thrown value. */
function sentenceOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * The reason the merged configuration holding the edited file is refused, or null when it is not.
 * `before` is the merge over the files as they stand.
 */
export function refusedBy(
    engine: string,
    file: string,
    edited: string,
    before: ReturnType<typeof loadConfig>
): string | null {
    const after = loadConfig(engine, { name: file, text: edited });
    const known = new Set(before.findings.map((finding) => finding.message));
    const added = after.findings.find((finding) => !known.has(finding.message));
    if (added !== undefined) return added.message;
    for (const read of READERS) {
        try {
            read(after.config);
        } catch (error) {
            return sentenceOf(error);
        }
    }
    const hub = loadLocalOrDefaults(engine).hub;
    for (const find of FINDERS) {
        let seen: Set<string> | null = null;
        try {
            seen = new Set(find(before.config, engine, hub).map((finding) => finding.message));
        } catch {
            seen = null;
        }
        let given: Finding[];
        try {
            given = find(after.config, engine, hub);
        } catch (error) {
            return sentenceOf(error);
        }
        const fresh = seen === null ? undefined : given.find((one) => !seen.has(one.message));
        if (fresh !== undefined) return fresh.message;
    }
    return null;
}

/**
 * Write the edited text of a file and answer with the one option it changed: the last step of a
 * config write, after every check has passed. `before` and `after` are the option's value in the
 * file as it was and as it is now, which an undo restores.
 */
export function written(
    path: string,
    file: string,
    key: string,
    edited: string,
    values: { before: unknown; after: unknown }
): ConfigKeyOutcome {
    writeTextAtomic(path, edited);
    return {
        changed: [`${file}:${key}`],
        refused: [],
        records: [{ file: path, key: file, field: key, ...values, undo: 'field' }]
    };
}
