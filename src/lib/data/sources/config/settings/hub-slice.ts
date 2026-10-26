// Layer 1, data. The slice of one hub's merged settings that the Settings view reads of a hub other
// than the primary (server/files/source/hub-settings.ts answers it): the value of each key each
// hub's own `.oculus/config.yml` is read for (data/shapes/hub-keys.ts `OWN_HUB_KEYS`) at its place
// in the merged map, and each one's options entry, under `options` as the merge holds it, with the
// defaults as that hub's merge left them. Laid over the primary's merged config, the slice gives
// the config the rows and the lists of that hub are read from. A key path is walked as the layers
// of the merge walk it (merge/tree.ts).

import { isMap } from '../../../helpers/guards.ts';
import { hubFileOf } from '../../../helpers/hub-names.ts';
import { OWN_HUB_KEYS } from '../../../shapes/hub-keys.ts';
import { setAt, valueAt } from '../merge/tree.ts';

/** The key of the merged config that holds the options catalog's entries, by file and key. */
const OPTIONS = 'options';

/** The options entries of a merged config, by file, or an empty map when it holds none. */
function optionsOf(config: Record<string, unknown>): Record<string, unknown> {
    const options = config[OPTIONS];
    return isMap(options) ? options : {};
}

/**
 * The slice of a hub's merged config the Settings rows of these keys read: each key's value at its
 * place, none for a key the merge gives no value, and each key's options entry under `options`.
 */
export function hubSlice(config: Record<string, unknown>): Record<string, unknown> {
    const slice: Record<string, unknown> = {};
    const options: Record<string, Record<string, unknown>> = {};
    const held = optionsOf(config);
    for (const key of OWN_HUB_KEYS) {
        const value = valueAt(config, key);
        if (value !== undefined) setAt(slice, key, value);
        const file = hubFileOf(key) ?? '';
        const entries = held[file];
        if (!isMap(entries) || !Object.hasOwn(entries, key)) continue;
        options[file] = { ...options[file], [key]: entries[key] };
    }
    return { ...slice, [OPTIONS]: options };
}

/**
 * A merged config with a hub's slice laid over it: each of these keys holds the slice's value, or
 * none where the slice holds none, and its options entry is the slice's. The config given is left
 * as it was.
 */
export function laidHubSlice(
    config: Record<string, unknown>,
    slice: Record<string, unknown>
): Record<string, unknown> {
    const laid: Record<string, unknown> = { ...config };
    const options: Record<string, unknown> = { ...optionsOf(config) };
    const given = optionsOf(slice);
    for (const key of OWN_HUB_KEYS) {
        setAt(laid, key, valueAt(slice, key));
        const file = hubFileOf(key) ?? '';
        const entries = given[file];
        if (!isMap(entries) || !Object.hasOwn(entries, key)) continue;
        const held = options[file];
        options[file] = { ...(isMap(held) ? held : {}), [key]: entries[key] };
    }
    return { ...laid, [OPTIONS]: options };
}
