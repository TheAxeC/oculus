// Layer 1, data. The theme a window starts on, by the one rule the page and the desktop host read
// it by: the theme the `theme` option names when the list holds it, else the one the `app_theme`
// option names when the list holds that, else the first listed (`startTheme`). The page asks it
// over its whole theme list, the themes of the apps it can draw included, for the theme it shows
// and starts on, and over the config's rows for the theme it draws an app's theme in when that
// theme's file does not resolve or its app is not approved and enabled
// (state/shared/words/appearance.ts, `startChoice` and `startClass`). The desktop host asks it over
// the config's `themes:` rows and the app themes the server read for it (`windowStart`,
// desktop/windows/start-colours.ts), for the theme whose colours a window takes before its page
// paints. The class a start name stands for is looked up in one place, `startOf`, which the page's
// `startClass` and the host's `windowStart` both call.

import { isMap } from '../guards.ts';

/**
 * The theme a window starts on given the name it is asked for: that name when `names` lists it,
 * else `start` when `names` lists that, else `fallback`.
 */
export function startTheme(
    saved: unknown,
    names: readonly string[],
    start: unknown,
    fallback: string
): string {
    if (typeof saved === 'string' && names.includes(saved)) return saved;
    return typeof start === 'string' && names.includes(start) ? start : fallback;
}

/** The theme a window starts on: a row of `themes:` by its class, or an app's by its name. */
export type WindowStart = { cls: string } | { app: string };

/** A row of the theme list as the start reads it: its name and its class string. */
export type StartRow = { name: string; class: string };

/**
 * The theme a window starts on over the rows of the theme list (`rows`, the first row of a name the
 * one it stands for) and the saved names of the app themes the window can draw (`drawable`): the
 * theme `saved` names, else the one `start` names, else the first row's, by `startTheme`. A row's
 * answer is its class string and an app theme's is its saved name; with no row the class is empty,
 * the light theme's.
 */
export function startOf(
    rows: readonly StartRow[],
    drawable: readonly string[],
    saved: unknown,
    start: unknown
): WindowStart {
    const names = rows.map((row) => row.name);
    const name = startTheme(saved, [...names, ...drawable], start, names[0] ?? '');
    const row = rows.find((one) => one.name === name);
    if (row === undefined && drawable.includes(name)) return { app: name };
    return { cls: row?.class ?? '' };
}

/**
 * The theme a window of the desktop app starts on, over the merged config and the saved names of
 * the app themes the window can draw (`drawable`, the themes of approved, enabled apps whose file
 * resolves): `startOf` over the rows of `themes:` that carry a name, with the theme `theme` names
 * and the one `app_theme` names. A row whose class is not words has the empty class, the light
 * theme's.
 */
export function windowStart(
    config: Record<string, unknown>,
    drawable: readonly string[]
): WindowStart {
    const rows = (Array.isArray(config.themes) ? config.themes : []).filter(isMap);
    const named = rows.flatMap((row) =>
        typeof row.name === 'string' && row.name !== ''
            ? [{ name: row.name, class: typeof row.class === 'string' ? row.class : '' }]
            : []
    );
    return startOf(named, drawable, config.theme, config.app_theme);
}
