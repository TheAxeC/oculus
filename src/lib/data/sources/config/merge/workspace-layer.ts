// Layer 1, data. The open workspace file's `settings:` map, laid over oculus's values after the
// hub's settings file: the reader's own values for the options of oculus's defaults files and of
// oculus's catalogs, kept with the workspace they were set in. The map holds keys as the merged
// config holds them, with no file names, since no key is in two files (`settings: { terminal: {
// font_px: 14 } }`, `settings: { glyphs: { red: R } }`).
//
// A key of `settings:` is applied when it is an option the options folder describes and its value
// is one the option takes (catalog/value-rule.ts). The six catalogs (`agents`, `patterns`,
// `glyphs`, `icons`, `latex_editing` and `latex_unimath`) are laid over oculus's value in oculus's
// place (in-place.ts), a map by its keys and the Unicode math rows by their command; the agents
// keep every `confirm: true` oculus ships, and a value the workspace adds or whose passed words it
// changes is asked about before a start (catalog/agents.ts, `confirmedAgents`). `text` lays the
// workspace's words over the text catalog key by key. Any other list of records whose option names
// a `key:` field, and any other map family, is laid over oculus's value entry by entry with the
// workspace's entries first (keyed.ts); any other value replaces oculus's whole. A key of the hub
// list, a key no option names, a value the option refuses and an entry a merge cannot apply are
// findings that name the workspace file and the key under `settings.`, and oculus's value stands
// for it. `from` names the workspace file for every key it set (and for each word of `text` it
// set), and for a map it set, the file each of oculus's keys left in the map came from.
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
import { confirmedAgents } from '../catalog/agents.ts';
import { CATALOG_SHAPES, layInPlace, problemFinding, wrongKindFinding } from './in-place.ts';
import { mergeFamily, mergeRecords } from './keyed.ts';
import { TEXT_KEY, type PendingFinding } from './text.ts';
import { setAt, valueAt } from './tree.ts';

/** The key of the merged config the agents catalog is held under. */
const AGENTS_KEY = 'agents';

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

/**
 * A catalog the workspace file sets, laid over oculus's by its shape (in-place.ts), with the
 * finding of each part that cannot be applied: a map's under `settings.<key>.<name>`, a keyed
 * list's under `settings.<key>`. The agents keep every `confirm: true` oculus ships and are asked
 * about first where the workspace adds a value or changes what one passes (`confirmedAgents`).
 */
function catalogValue(
    path: string,
    oculus: unknown,
    value: unknown,
    at: { file: string; key: string },
    pending: PendingFinding[]
): { value: unknown } | null {
    const shape = CATALOG_SHAPES[path];
    const laid = layInPlace(shape, oculus, value);
    if ('wrong' in laid) {
        pending.push(wrongKindFinding(at.file, at.key, at.key, laid.wrong));
        return null;
    }
    for (const problem of laid.problems) {
        const key = shape.kind === 'map' ? `${at.key}.${problem.entry}` : at.key;
        pending.push(problemFinding(at.file, key, at.key, problem));
    }
    if (path === AGENTS_KEY) return { value: confirmedAgents(oculus, laid.value) };
    return { value: laid.value };
}

/**
 * The workspace's words laid over the text catalog: each key of oculus's catalog the map names
 * takes its text. A key the catalog lacks and a value that is not a text are findings naming
 * `settings.text.<key>`, and the catalog's word stands. `own` names the keys the workspace set.
 */
function textValue(
    oculus: unknown,
    value: unknown,
    at: { file: string; key: string },
    pending: PendingFinding[]
): { value: unknown; own: string[] } | null {
    if (!isMap(value)) {
        pending.push(wrongKindFinding(at.file, at.key, at.key, 'map'));
        return null;
    }
    const catalog = isMap(oculus) ? oculus : {};
    const merged: Record<string, unknown> = { ...catalog };
    const own: string[] = [];
    for (const [name, word] of Object.entries(value)) {
        const key = `${at.key}.${name}`;
        if (!Object.hasOwn(catalog, name)) {
            pending.push({
                file: at.file,
                key,
                words: (words) => findingText(words, 'findings.config.settings_text_unknown', key)
            });
        } else if (typeof word !== 'string') {
            pending.push({
                file: at.file,
                key,
                words: (words) =>
                    findingText(
                        words,
                        'findings.config.settings_value',
                        key,
                        findingText(words, 'findings.words.text')
                    )
            });
        } else {
            merged[name] = word;
            own.push(name);
        }
    }
    return { value: merged, own };
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
        for (const problem of merged.problems) {
            pending.push(problemFinding(file, key, key, problem));
        }
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
        for (const problem of merged.problems) {
            pending.push(problemFinding(file, key, key, problem));
        }
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
    const applied: [string, { value: unknown; kept?: string[]; own?: string[] }][] = [];
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
            } else if (entry !== undefined && path === TEXT_KEY) {
                const taken = textValue(valueAt(config, path), value, { file, key }, pending);
                if (taken !== null) applied.push([path, taken]);
            } else if (entry !== undefined && Object.hasOwn(CATALOG_SHAPES, path)) {
                const oculus = valueAt(config, path);
                const taken = catalogValue(path, oculus, value, { file, key }, pending);
                if (taken === null) continue;
                const written = isMap(value) ? value : {};
                const kept = isMap(taken.value) ? Object.keys(taken.value) : [];
                const left = kept.filter((one) => !Object.hasOwn(written, one));
                applied.push([path, { ...taken, kept: left }]);
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
        for (const name of taken.own ?? []) from[`${path}.${name}`] = file;
        // The text catalog keeps the files its words were read from; only the words set are named.
        if (path !== TEXT_KEY) from[path] = file;
    }
}
