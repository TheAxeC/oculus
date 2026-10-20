// Layer 2, server. One value of a setting an app declares, written into the `app_settings:` map of
// the primary hub's settings file (`<hub>/.oculus/config.yml`), and taken back again.
//
// The map's keys are the settings' whole keys: `notes.width` is one key of the map and is never
// split at its dot, which is why this is not `writeConfigKey`, whose keys are the options catalog's
// dotted paths. What may be written is what the apps the server holds declare: the key must be a
// setting of an approved, enabled app and the value must pass its declaration (type, `enum` and
// bounds, data/helpers/files/apps/settings.ts). A write that removes the last setting leaves the
// settings file as an empty map, since a hub's file is what makes the folder a hub.
//
// The edit parses the file, sets the one key and writes the document back with its comments. The
// result is checked before anything is written: it must parse back to the original with exactly
// that key changed, and the merged configuration holding it must give `loadConfig` and the readers
// of the configuration no finding they did not give before (config-checks.ts `refusedBy`). A value
// equal to the one in force writes nothing. A write whose value is `undefined` removes the key,
// which is how an undo gives back a setting that was not stored.

import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, parseDocument } from 'yaml';
import { appActive } from '../../../../data/helpers/files/apps/apps.ts';
import { APP_SETTINGS_KEY, settingFlaw } from '../../../../data/helpers/files/apps/settings.ts';
import { fields, isMap } from '../../../../data/helpers/guards.ts';
import type { AppSetting } from '../../../../data/model/index.ts';
import { textCatalog } from '../../../../data/sources/config.ts';
import type { Change } from '../../../core/changes.ts';
import { words } from '../../../core/words.ts';
import type { AppsHeld } from '../../../machine/apps/read/held.ts';
import type { WriteTarget } from '../../writes.ts';
import { readBack } from '../../list-edit.ts';
import { refusedBy, written } from './config-checks.ts';
import {
    layersOf,
    loadLayers,
    placeOf,
    placeText,
    refusing,
    removeMade,
    type ConfigKeyOutcome,
    type OptionNow
} from './config-place.ts';

/** The file the map lives in. */
const FILE = 'behavior.yml';

/** The declaration of a key among the settings of the approved, enabled apps, or undefined. */
function declared(held: AppsHeld, key: string): AppSetting | undefined {
    for (const app of held.apps) {
        if (!appActive(app.row)) continue;
        const found = app.row.contributes.configuration?.properties.find((one) => one.key === key);
        if (found !== undefined) return found;
    }
    return undefined;
}

/** The sentence of a value of the wrong type, by the type the setting declares. */
function typeText(text: Record<string, string>, type: AppSetting['type']): string {
    switch (type) {
        case 'boolean':
            return words(text, 'server.app_setting.type_boolean');
        case 'number':
            return words(text, 'server.app_setting.type_number');
        case 'integer':
            return words(text, 'server.app_setting.type_integer');
        case 'string':
            return words(text, 'server.app_setting.type_string');
        case 'array':
            return words(text, 'server.app_setting.type_array');
    }
}

/** The sentence a value that breaks its declaration is refused with. */
function flawText(
    text: Record<string, string>,
    setting: AppSetting,
    flaw: NonNullable<ReturnType<typeof settingFlaw>>
): string {
    if (flaw === 'type') return typeText(text, setting.type);
    if (flaw === 'enum') return words(text, 'server.app_setting.enum', setting.enum.join(', '));
    if (flaw === 'minimum') return words(text, 'server.app_setting.minimum', setting.minimum ?? 0);
    return words(text, 'server.app_setting.maximum', setting.maximum ?? 0);
}

/** The value a parsed file holds for a key of the map, or undefined. */
function storedIn(parsed: unknown, key: string): unknown {
    const map = storedMap(parsed);
    return isMap(map) && Object.hasOwn(map, key) ? map[key] : undefined;
}

/**
 * The `app_settings` value of a parsed file, whatever it holds, and none for a file that is no map.
 */
function storedMap(parsed: unknown): unknown {
    return isMap(parsed) ? parsed[APP_SETTINGS_KEY] : undefined;
}

/**
 * The value the primary hub's settings file holds for a key now, and whether the file can be read:
 * an undo compares it with the value the write left. A key the file does not hold is a found option
 * with no value, since there is nothing there for the write to have changed.
 */
export function appSettingNow(hub: string | undefined, key: string): OptionNow {
    const place = placeOf(hub === undefined ? {} : { hub }, FILE, APP_SETTINGS_KEY);
    if (place === null) return { found: false, value: null };
    try {
        const text = placeText(place) ?? '';
        const doc = parseDocument(text);
        if (doc.errors.length > 0) return { found: false, value: null };
        return { found: true, value: storedIn(doc.toJS(), key) ?? null };
    } catch {
        return { found: false, value: null };
    }
}

/**
 * Set one setting's stored value, or remove it when `value` is `undefined`. `declarations` is the
 * held apps the key and value are judged against; an undo gives none and puts back a value the file
 * held.
 */
export function writeAppSetting(
    into: WriteTarget,
    key: string,
    value: unknown,
    declarations?: AppsHeld
): ConfigKeyOutcome {
    const layers = layersOf(into);
    const before = loadLayers(into.engine, layers);
    const text = textCatalog(before.config);
    const refuse = refusing(FILE, `${APP_SETTINGS_KEY}.${key}`);
    if (declarations !== undefined) {
        const setting = declared(declarations, key);
        if (setting === undefined)
            return refuse(words(text, 'server.app_setting.not_declared', key));
        const flaw = settingFlaw(setting, value);
        if (flaw !== null) return refuse(flawText(text, setting, flaw));
    }
    const place = placeOf(layers, FILE, APP_SETTINGS_KEY);
    if (place === null) return refuse(words(text, 'server.workspace.no_primary'));
    const onDisk = placeText(place);
    const source = onDisk ?? '';
    const doc = parseDocument(source);
    if (doc.errors.length > 0 || (doc.contents !== null && !isMap(doc.toJS()))) {
        return refuse(words(text, 'server.config_key.not_parsed'));
    }
    const held = storedIn(doc.toJS(), key);
    if (isDeepStrictEqual(held, value)) return { changed: [], refused: [] };
    if (value === undefined) {
        doc.deleteIn([APP_SETTINGS_KEY, key]);
        const map = fields(storedMap(doc.toJS()));
        if (Object.keys(map).length === 0) doc.delete(APP_SETTINGS_KEY);
        if (Object.keys(fields(doc.toJS())).length === 0) doc.contents = null;
    } else {
        // A file that is the empty map `{}` takes the key as a block map.
        if (isYamlMap(doc.contents) && doc.contents.items.length === 0) doc.contents.flow = false;
        doc.setIn([APP_SETTINGS_KEY, key], value);
    }
    // A document with no content prints as the text `null`; it is written as an empty map.
    const edited = doc.contents === null ? '{}\n' : doc.toString({ lineWidth: 0 });
    const read = readBack(source, edited);
    const expected = { ...(read?.before ?? {}) };
    if (value === undefined) {
        const map = { ...fields(read?.before[APP_SETTINGS_KEY]) };
        Reflect.deleteProperty(map, key);
        if (Object.keys(map).length === 0) Reflect.deleteProperty(expected, APP_SETTINGS_KEY);
        else expected[APP_SETTINGS_KEY] = map;
    } else {
        expected[APP_SETTINGS_KEY] = { ...fields(read?.before[APP_SETTINGS_KEY]), [key]: value };
    }
    if (read === null || !isDeepStrictEqual(read.after, expected)) {
        return refuse(words(text, 'server.config_key.not_kept'));
    }
    const reason = refusedBy(into.engine, layers, place, edited, before);
    if (reason !== null) return refuse(reason);
    return written(
        place.path,
        FILE,
        key,
        edited,
        { before: held ?? null, after: value ?? null },
        undefined,
        onDisk === null
    );
}

/**
 * Take a write back: the value the file held before goes back, and the file and folders the write
 * made (`made`, as absolute paths) are removed again once the file holds nothing else.
 */
export function undoAppSetting(
    into: WriteTarget,
    change: Change,
    made: readonly string[]
): ConfigKeyOutcome {
    const earlier = change.before === null ? undefined : change.before;
    const outcome = writeAppSetting(into, change.field, earlier);
    const place = placeOf(layersOf(into), FILE, APP_SETTINGS_KEY);
    if (outcome.refused.length > 0 || place === null || !made.includes(place.path)) return outcome;
    const left = placeText(place);
    if (left === null || Object.keys(fields(parseDocument(left).toJS())).length > 0) return outcome;
    removeMade(place.path, made);
    return outcome;
}
