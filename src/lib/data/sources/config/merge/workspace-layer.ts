// Layer 1, data. The open workspace file's `settings:` map, laid over oculus's values after the
// hub's settings file: the reader's own values for the options of oculus's defaults files, kept
// with the workspace they were set in. The map holds keys as the defaults files hold them, with no
// file names, since no key is in two defaults files (`settings: { terminal: { font_px: 14 } }`).
//
// A key of `settings:` is applied when it is an option of a defaults file and its value is one the
// option takes (catalog/value-rule.ts); a list of records whose option names a `key:` field and a
// map family are laid over oculus's value entry by entry (keyed.ts), any other value replaces
// oculus's whole. A key of the hub list, a key no option names, a value the option refuses and an
// entry the entry-by-entry merge cannot apply are findings that name the workspace file and the
// key under `settings.`, and oculus's value stands for it. `from` names the workspace file for
// every key it set, and for a map family it set, the file each of oculus's keys left in the map
// came from.
//
// A workspace file that is not there, does not read, does not parse or is no map adds nothing and
// is no finding here: the workspace's own reader (server/files/workspace/open.ts) words it.

import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { findingText } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import { hubKeys } from '../../../helpers/hub-names.ts';
import { catalogOf, flaggedItems, sourcedItems, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem } from '../catalog/value-rule.ts';
import { mustBe } from '../catalog/value-words.ts';
import { LOCAL_NAME } from '../local.ts';
import { glyphNames } from '../rail.ts';
import { mergeFamily, mergeRecords, type OverrideProblem } from './keyed.ts';
import type { PendingFinding } from './text.ts';
import { setAt, valueAt } from './tree.ts';

/** The key of a workspace file that holds the reader's values of the options. */
export const SETTINGS_KEY = 'settings';

/**
 * The workspace file laid over oculus's values: its path, and the text to read instead of the disk
 * (null for the file removed), which a write gives to check the file as it would be.
 */
export type WorkspaceLayer = { file: string; text?: string | null };

/** How a family option is laid over oculus's value, read from its entry. */
export type FamilyKind =
    { kind: 'records'; field: string } | { kind: 'map' } | { kind: 'whole' } | { kind: 'leaf' };

/**
 * How an option's value is laid over oculus's: a list of records by the field its `key:` names, a
 * map family (a family whose records carry a `key` field, the map's own key) by its keys, any other
 * family whole, and a leaf whole.
 */
export function familyKind(entry: CatalogEntry): FamilyKind {
    if (entry.fields === undefined) return { kind: 'leaf' };
    if (entry.key !== undefined) return { kind: 'records', field: entry.key };
    if (Object.hasOwn(entry.fields, 'key')) return { kind: 'map' };
    return { kind: 'whole' };
}

/** Every option of the defaults files by its key path, the machine's own file left out. */
function optionsByPath(config: Record<string, unknown>): Map<string, CatalogEntry> {
    const byPath = new Map<string, CatalogEntry>();
    for (const [file, entries] of Object.entries(catalogOf(config))) {
        if (file === LOCAL_NAME) continue;
        for (const [path, entry] of Object.entries(entries)) byPath.set(path, entry);
    }
    return byPath;
}

/** The text of the workspace file, or null when there is none to read. */
function layerText(layer: WorkspaceLayer): string | null {
    if (layer.text !== undefined) return layer.text;
    try {
        return readFileSync(layer.file, 'utf8');
    } catch {
        return null;
    }
}

/** The finding of one entry the merge could not apply, under the option's key. */
function overrideFinding(file: string, key: string, problem: OverrideProblem): PendingFinding {
    const entry = problem.entry;
    switch (problem.kind) {
        case 'removed_value':
            return {
                file,
                key,
                words: (catalog) =>
                    findingText(catalog, 'findings.config.settings_removed_value', key, entry)
            };
        case 'removed_unknown':
            return {
                file,
                key,
                words: (catalog) =>
                    findingText(catalog, 'findings.config.settings_removed_unknown', key, entry)
            };
        case 'null_unknown':
            return {
                file,
                key,
                words: (catalog) =>
                    findingText(catalog, 'findings.config.settings_null_unknown', key, entry)
            };
        case 'repeated':
            return {
                file,
                key,
                words: (catalog) =>
                    findingText(catalog, 'findings.config.settings_repeated', key, entry)
            };
    }
}

/**
 * The value an option takes from the workspace file laid over oculus's, or the finding that says
 * why it is not applied. `key` is the finding's key, `settings.<path>`. For a map family, `kept`
 * names the keys of oculus's map the merged value still holds, which `from` goes on naming the
 * earlier file for.
 */
function appliedValue(
    entry: CatalogEntry,
    oculus: unknown,
    value: unknown,
    config: Record<string, unknown>,
    at: { file: string; key: string },
    pending: PendingFinding[]
): { value: unknown; kept?: string[] } | null {
    const { file, key } = at;
    const kind = familyKind(entry);
    if (kind.kind === 'records' || (kind.kind === 'whole' && Array.isArray(oculus))) {
        if (!Array.isArray(value)) {
            pending.push({
                file,
                key,
                words: (catalog) =>
                    findingText(
                        catalog,
                        'findings.config.settings_value',
                        key,
                        findingText(catalog, 'findings.words.records')
                    )
            });
            return null;
        }
        if (kind.kind === 'whole') return { value };
        const merged = mergeRecords(Array.isArray(oculus) ? oculus : [], value, kind.field);
        for (const problem of merged.problems) pending.push(overrideFinding(file, key, problem));
        return { value: merged.value };
    }
    if (kind.kind === 'map' || kind.kind === 'whole') {
        if (!isMap(value)) {
            pending.push({
                file,
                key,
                words: (catalog) =>
                    findingText(
                        catalog,
                        'findings.config.settings_value',
                        key,
                        findingText(catalog, 'findings.shape.is_map')
                    )
            });
            return null;
        }
        if (kind.kind === 'whole') return { value };
        const merged = mergeFamily(isMap(oculus) ? oculus : {}, value);
        for (const problem of merged.problems) pending.push(overrideFinding(file, key, problem));
        const kept = Object.keys(merged.value).filter((name) => !Object.hasOwn(value, name));
        return { value: merged.value, kept };
    }
    const lists = {
        sourced: sourcedItems(entry, config),
        flagged: flaggedItems(entry, config),
        glyphs: glyphNames(config),
        config
    };
    const problem = valueProblem(entry, value, lists);
    if (problem === null) return { value };
    if (problem.kind === 'empty') {
        pending.push({
            file,
            key,
            words: (catalog) => findingText(catalog, 'findings.config.settings_empty', key)
        });
    } else {
        pending.push({
            file,
            key,
            words: (catalog) =>
                findingText(
                    catalog,
                    'findings.config.settings_value',
                    key,
                    mustBe(catalog, entry, problem)
                )
        });
    }
    return null;
}

/**
 * Lay the workspace file's `settings:` over the merged map, after oculus's files and the hub's
 * settings file. A map is walked while its path is a strict prefix of an option's or a hub key's,
 * so `wallpaper: { dim: 0.5, image: x }` applies `wallpaper.dim` and names `wallpaper.image`.
 */
export function mergeWorkspace(
    layer: WorkspaceLayer,
    config: Record<string, unknown>,
    from: Record<string, string>,
    pending: PendingFinding[]
): void {
    const text = layerText(layer);
    if (text === null) return;
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch {
        return;
    }
    if (!isMap(parsed) || !Object.hasOwn(parsed, SETTINGS_KEY)) return;
    const file = layer.file;
    const settings = parsed[SETTINGS_KEY];
    if (settings === null) return;
    if (!isMap(settings)) {
        pending.push({
            file,
            key: SETTINGS_KEY,
            words: (catalog) => findingText(catalog, 'findings.config.settings_not_a_map')
        });
        return;
    }
    const options = optionsByPath(config);
    const hub = hubKeys();
    const applied: [string, { value: unknown; kept?: string[] }][] = [];
    const walk = (node: Record<string, unknown>, prefix: string): void => {
        for (const [name, value] of Object.entries(node)) {
            const path = prefix === '' ? name : `${prefix}.${name}`;
            const key = `${SETTINGS_KEY}.${path}`;
            const entry = options.get(path);
            if (hub.includes(path)) {
                pending.push({
                    file,
                    key,
                    words: (catalog) =>
                        findingText(catalog, 'findings.config.settings_hub_key', path)
                });
            } else if (entry !== undefined) {
                const at = { file, key };
                const taken = appliedValue(
                    entry,
                    valueAt(config, path),
                    value,
                    config,
                    at,
                    pending
                );
                if (taken !== null) applied.push([path, taken]);
            } else if ([...options.keys(), ...hub].some((one) => one.startsWith(`${path}.`))) {
                if (isMap(value)) walk(value, path);
                else {
                    pending.push({
                        file,
                        key,
                        words: (catalog) =>
                            findingText(catalog, 'findings.config.settings_not_map', path)
                    });
                }
            } else {
                pending.push({
                    file,
                    key,
                    words: (catalog) =>
                        findingText(catalog, 'findings.config.settings_unknown', path)
                });
            }
        }
    };
    walk(settings, '');
    const fromOf = (path: string): string | undefined =>
        Object.hasOwn(from, path) ? from[path] : undefined;
    for (const [path, taken] of applied) {
        setAt(config, path, taken.value);
        const earlier = fromOf(path) ?? fromOf(path.split('.')[0]);
        for (const name of taken.kept ?? []) {
            if (earlier !== undefined) from[`${path}.${name}`] = earlier;
        }
        from[path] = file;
    }
}
