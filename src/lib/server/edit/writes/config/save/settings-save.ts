// Layer 2, server. The Save of a Settings scope whose file is the open workspace file or a hub's
// `.oculus/config.yml`: every change of the scope written into that one file, through the writer
// of its kind, the one each Settings write of one option goes through (config-key.ts for one
// value, config-value.ts for a list or a family, lists/rail.ts for the rail's list, config-reset.ts
// for a key taken out, the folders writer for the workspace file's `primary` and its folders'
// names, and apps/app-setting.ts for a setting an app declares, which lands in the primary hub's
// file). So each change is checked as a write of it alone is: its control, the lists its value is
// checked against, the rail's rule, the declaration of an app's setting, and the readers of the
// configuration. An undo puts a list or a family back as the file held it.
//
// Each change is placed where the writes place its key (config-place.ts `landing`), the hub named
// by `root` for a key of a hub's file, and the save is refused, with nothing written, when the
// changes do not all land in one file, when that file's text is not the text the page read (its
// digest differs), or when one change is refused; a refusal after the first change wrote puts the
// file back as it was, and takes out a file and folders the save made. The save is one record of
// the change log: the values each key held before and holds after (a key the file did not hold is
// absent), with the workspace file's primary and folder names when the file is the workspace
// file and each app's setting under `@app:<key>`, which its undo (`undoSettings`) writes back as a
// save of its own.

import { isDeepStrictEqual } from 'node:util';
import { parseDocument } from 'yaml';
import { APP_SETTINGS_KEY } from '../../../../../data/helpers/files/apps/settings.ts';
import { fields } from '../../../../../data/helpers/guards.ts';
import {
    isAppChange,
    isKeyChange,
    textDigest,
    type AppChange,
    type KeyChange,
    type SaveChange
} from '../../../../../data/shapes/config-save.ts';
import { catalogOf } from '../../../../../data/sources/config/catalog/options.ts';
import type { ChangeRecord } from '../../../../core/changes.ts';
import { writeTextAtomic } from '../../../../core/json.ts';
import { words } from '../../../../core/words.ts';
import type { WriteTarget } from '../../../writes.ts';
import { writeAppSetting } from '../../apps/app-setting.ts';
import { mergedAt } from '../config-checks.ts';
import { isCollection } from '../config-fit.ts';
import { writeConfigKey } from '../config-key.ts';
import {
    heldText,
    landing,
    layersOf,
    loadLayers,
    machineHubs,
    optionOf,
    placeOf,
    removeMade,
    type ConfigKeyOutcome,
    type Landing
} from '../config-place.ts';
import { resetConfig } from '../config-reset.ts';
import { writeConfigValue } from '../config-value.ts';
import { renameFolder, setPrimary, workspaceNames } from '../lists/folders.ts';
import { RAIL, RAIL_FILE, writeRail } from '../lists/rail.ts';

/** The key of a record's map that holds the workspace file's primary. */
const PRIMARY_AT = '@primary';

/** The key of a record's map that holds the workspace file's folder names, in their order. */
const FOLDERS_AT = '@folders';

/** What the name of an app's setting in a record's maps starts with. */
const APP_AT = '@app:';

/** The defaults file whose place an app's setting lands in, the primary hub's settings file. */
const APP_FILE = 'behavior.yml';

/** The name a key change is held under in a record's maps: `<file>:<key>`. */
function heldAs(change: { file: string; key: string }): string {
    return `${change.file}:${change.key}`;
}

/** Whether a change is one of the workspace file itself: its primary or a folder's name. */
function isWorkspaceChange(change: SaveChange): boolean {
    return !isKeyChange(change) && !isAppChange(change);
}

/** A key change with where it lands: its layers and lists, and its dotted path in the file. */
type Placed = { change: KeyChange; at: Landing; key: string };

/** The changes of a save placed in their one file. */
type Placement = { path: string; placed: Placed[]; apps: AppChange[]; workspace: boolean };

/** What a save refuses with: the one reason, and the field it names. */
function refused(field: string, reason: string): ConfigKeyOutcome {
    return { changed: [], refused: [{ field, reason }] };
}

/** The value a text holds at a dotted key path, or undefined; a text that does not parse is {}. */
function valueIn(text: string | null, at: string): unknown {
    if (text === null) return undefined;
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return undefined;
    return mergedAt(fields(doc.toJS()), at);
}

/** The value an app's setting holds in a file's text, or undefined. */
function appValueIn(text: string | null, key: string): unknown {
    const map = fields(valueIn(text, APP_SETTINGS_KEY));
    return Object.hasOwn(map, key) ? map[key] : undefined;
}

/**
 * The changes placed in the one file they all land in, or the refusal: a change of the workspace
 * file itself with no workspace file open, a key that lands nowhere or in a `local.yml`, an app's
 * setting for another hub than the primary or with no primary, and changes for two files.
 */
function placeAll(
    into: WriteTarget,
    root: string | undefined,
    changes: SaveChange[]
): Placement | ConfigKeyOutcome {
    const text = into.config.text;
    const file = into.workspace?.file ?? null;
    const paths = new Set<string>();
    if (changes.some(isWorkspaceChange)) {
        if (file === null) return refused('workspace', words(text, 'server.config_save.unsaved'));
        paths.add(file);
    }
    const apps = changes.filter(isAppChange);
    if (apps.length > 0) {
        const place =
            root === undefined ? placeOf(layersOf(into), APP_FILE, APP_SETTINGS_KEY) : null;
        if (place === null) {
            return refused(`${APP_AT}${apps[0].app}`, words(text, 'server.workspace.no_primary'));
        }
        paths.add(place.path);
    }
    const placed: Placed[] = [];
    for (const change of changes.filter(isKeyChange)) {
        const at = landing(into, change.file, change.key, root);
        if (!('layers' in at)) return at;
        const place = placeOf(at.layers, change.file, change.key);
        if (place === null || place.layer === 'local') {
            return refused(heldAs(change), words(text, 'server.config_save.not_here', change.key));
        }
        placed.push({ change, at, key: place.at });
        paths.add(place.path);
    }
    if (paths.size !== 1) {
        return refused(
            'settings',
            words(text, 'server.config_save.two_files', [...paths].join(', '))
        );
    }
    const [path] = paths;
    return { path, placed, apps, workspace: path === file };
}

/**
 * The values a record holds of one file's text: each key change's, each app setting's, then the
 * workspace's own.
 */
function valuesOf(text: string | null, placement: Placement): Record<string, unknown> {
    const held: Record<string, unknown> = {};
    for (const one of placement.placed) {
        const value = valueIn(text, one.key);
        if (value !== undefined) held[heldAs(one.change)] = value;
    }
    for (const one of placement.apps) {
        const value = appValueIn(text, one.app);
        if (value !== undefined) held[`${APP_AT}${one.app}`] = value;
    }
    const names = placement.workspace && text !== null ? workspaceNames(text) : null;
    if (names !== null) {
        held[FOLDERS_AT] = names.folders;
        if (names.primary !== null) held[PRIMARY_AT] = names.primary;
    }
    return held;
}

/**
 * Run one key change through the writer of its kind. In an undo (`undoing`) a list or a family is
 * the file's own value put back as it was held, whatever its own write checks.
 */
function runKey(into: WriteTarget, path: string, one: Placed, undoing: boolean): ConfigKeyOutcome {
    const { change, at } = one;
    const hubs = machineHubs(into);
    if ('reset' in change) {
        return resetConfig(into.engine, change.file, change.key, at.layers, hubs);
    }
    const catalog = catalogOf(loadLayers(into.engine, at.layers).config);
    const entry = optionOf(catalog, change.file, change.key);
    if (entry !== null && isCollection(entry) && undoing) {
        const held = valueIn(heldText(path), one.key);
        return writeConfigValue(
            into.engine,
            change.file,
            change.key,
            change.value,
            held,
            at.layers,
            {
                hubs,
                stored: true,
                own: true
            }
        );
    }
    if (change.file === RAIL_FILE && change.key === RAIL) {
        const outcome = writeRail(into.engine, at.layers, change.value, into.glyphs, hubs);
        if ('error' in outcome) {
            return refused(heldAs(change), words(into.config.text, 'server.config_save.rail'));
        }
        return outcome;
    }
    if (entry !== null && isCollection(entry)) {
        const base = 'base' in change ? change.base : valueIn(heldText(path), one.key);
        return writeConfigValue(
            into.engine,
            change.file,
            change.key,
            change.value,
            base,
            at.layers,
            {
                inputs: at.inputs,
                hubs
            }
        );
    }
    return writeConfigKey(
        into.engine,
        change.file,
        change.key,
        change.value,
        at.layers,
        at.inputs,
        hubs
    );
}

/** Run one change of the workspace file itself through the folders writer. */
function runWorkspace(into: WriteTarget, change: SaveChange): ConfigKeyOutcome {
    const open = into.workspace;
    const text = into.config.text;
    if (open === undefined) return refused('workspace', words(text, 'server.config_save.unsaved'));
    if ('primary' in change) return setPrimary(open, change.primary, text);
    if ('folder' in change) return renameFolder(open, change.folder, change.name, text);
    return { changed: [], refused: [] };
}

/** Put a file back as it was before a save that was refused part way. */
function putBack(path: string, before: string | null, made: readonly string[]): void {
    if (before === null) removeMade(path, made);
    else writeTextAtomic(path, before);
}

/**
 * Write placed changes, the workspace file's own first, and record the save as one change. An app's
 * setting is judged against the declarations of the apps the server holds, but in an undo
 * (`undoing`), which puts back a value the file held.
 */
function written(
    into: WriteTarget,
    root: string | undefined,
    placement: Placement,
    changes: SaveChange[],
    undoing = false
): ConfigKeyOutcome {
    const { path } = placement;
    const before = heldText(path);
    const made: string[] = [];
    const declarations = undoing ? undefined : into.apps?.held();
    const runs: (() => ConfigKeyOutcome)[] = [
        ...changes.filter(isWorkspaceChange).map((one) => () => runWorkspace(into, one)),
        ...placement.placed.map((one) => () => runKey(into, path, one, undoing)),
        ...placement.apps.map(
            (one) => () =>
                writeAppSetting(into, one.app, 'reset' in one ? undefined : one.value, declarations)
        )
    ];
    for (const run of runs) {
        const outcome = run();
        for (const record of outcome.records ?? []) made.push(...(record.created ?? []));
        if (outcome.refused.length > 0) {
            if (heldText(path) !== before) putBack(path, before, made);
            return { changed: [], refused: outcome.refused };
        }
    }
    const after = heldText(path);
    const values = { before: valuesOf(before, placement), after: valuesOf(after, placement) };
    if (after === before || isDeepStrictEqual(values.before, values.after)) {
        return { changed: [], refused: [] };
    }
    const record: ChangeRecord = {
        file: path,
        key: 'settings',
        field: root ?? '',
        ...values,
        undo: 'field',
        ...(before === null && made.length > 0 ? { created: made } : {})
    };
    return { changed: [path], refused: [], records: [record] };
}

/**
 * Write the changes of one Settings scope into its one file. `root` names the hub of a key of a
 * hub's file; `digest` is the digest of the text the page read the file as.
 */
export function saveSettings(
    into: WriteTarget,
    root: string | undefined,
    digest: string,
    changes: SaveChange[]
): ConfigKeyOutcome {
    const placement = placeAll(into, root, changes);
    if (!('path' in placement)) return placement;
    if (textDigest(heldText(placement.path)) !== digest) {
        const reason = words(into.config.text, 'server.config_save.changed', placement.path);
        return refused('settings', reason);
    }
    return written(into, root, placement, changes);
}

/** The changes that write a record's `before` back over its `after`. */
function inverse(record: { before: unknown; after: unknown }): SaveChange[] {
    const before = fields(record.before);
    const after = fields(record.after);
    const changes: SaveChange[] = [];
    const was = Array.isArray(before[FOLDERS_AT]) ? (before[FOLDERS_AT] as unknown[]) : [];
    const now = Array.isArray(after[FOLDERS_AT]) ? (after[FOLDERS_AT] as unknown[]) : [];
    if (was.length === now.length) {
        now.forEach((name, at) => {
            const old = was[at];
            if (typeof name === 'string' && typeof old === 'string' && name !== old) {
                changes.push({ folder: name, name: old });
            }
        });
    }
    const primary = typeof before[PRIMARY_AT] === 'string' ? before[PRIMARY_AT] : '';
    if (primary !== (typeof after[PRIMARY_AT] === 'string' ? after[PRIMARY_AT] : '')) {
        changes.push({ primary });
    }
    const names = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const name of names) {
        if (name === FOLDERS_AT || name === PRIMARY_AT) continue;
        if (name.startsWith(APP_AT)) {
            const app = name.slice(APP_AT.length);
            changes.push(
                Object.hasOwn(before, name) ? { app, value: before[name] } : { app, reset: true }
            );
            continue;
        }
        const cut = name.indexOf(':');
        const file = name.slice(0, cut);
        const key = name.slice(cut + 1);
        changes.push(
            Object.hasOwn(before, name)
                ? { file, key, value: before[name], base: after[name] }
                : { file, key, reset: true }
        );
    }
    return changes;
}

/**
 * What the file of a Settings save record holds now at the record's keys, as the save recorded
 * them, or not found when the changes no longer land in that file (a hub that left the workspace,
 * another workspace file open).
 */
export function settingsNow(
    into: WriteTarget,
    change: ChangeRecord
): { found: boolean; value: unknown } {
    const changes = inverse(change);
    const root = change.field === '' ? undefined : change.field;
    const placement = changes.length === 0 ? null : placeAll(into, root, changes);
    if (placement === null || !('path' in placement) || placement.path !== change.file) {
        return { found: false, value: null };
    }
    return { found: true, value: valuesOf(heldText(placement.path), placement) };
}

/** Take a Settings save back: its `before` written as a save of its own, recorded like one. */
export function undoSettings(into: WriteTarget, change: ChangeRecord): ConfigKeyOutcome | null {
    const changes = inverse(change);
    const root = change.field === '' ? undefined : change.field;
    const placement = changes.length === 0 ? null : placeAll(into, root, changes);
    if (placement === null || !('path' in placement)) return null;
    const outcome = written(into, root, placement, changes, true);
    const made = change.created ?? [];
    if (outcome.changed.length > 0 && made.length > 0 && emptyText(heldText(change.file))) {
        removeMade(change.file, made);
    }
    return outcome;
}

/** Whether a text holds nothing: no key, or nothing at all. */
function emptyText(text: string | null): boolean {
    if (text === null) return true;
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return false;
    const held = doc.toJS() as unknown;
    return held === null || held === undefined || Object.keys(fields(held)).length === 0;
}
