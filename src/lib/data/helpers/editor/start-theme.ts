// Layer 1, data. The theme a window starts on, by the one rule the page, the server and the desktop
// host read it by: the theme the `theme` option names when the list holds it, else the one the
// `app_theme` option names when the list holds that, else the first listed (`startTheme`). The
// page asks it over its whole theme list, the themes of the apps it can draw included, for the
// theme it shows and starts on, and over the config's rows for the theme it draws an app's theme in
// when that theme's file does not resolve or its app is not approved and enabled
// (state/shared/words/appearance.ts, `startChoice` and `startClass`). The server asks it over the
// config's `themes:` rows and the app themes a page's first load carries, for the theme the page's
// first HTML is sent with (server/machine/apps/routes/theme.ts, `requestStart`), and the desktop
// host over the same rows and the app themes the server read for it (`windowStart`,
// desktop/windows/start-colours.ts), for the theme whose colours a window takes before its page
// paints. The class a start name stands for is looked up in one place, `startOf`, which the page's
// `startClass`, the server's `requestStart` and the host's `windowStart` all call.
//
// The body class string a theme lands on the document as is joined here too (`bodyClass`): the
// theme's own classes with the CRT overlay's class and the classes of the two rice toggles, which
// the page's `applyTheme` (ui/theme/theme.ts) sets and the server writes into the first HTML, so
// the two are one string. The desktop host marks its windows' requests with `DESKTOP_MARK` in the
// user agent of its session, which is how the server tells a page in the app's window, which starts
// on `app_theme`, from a page in a browser, which starts on the first row.

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
 * The rows of the merged config's `themes:` that carry a name, each with its class string. A row
 * whose class is not words has the empty class, the light theme's.
 */
export function startRows(config: Record<string, unknown>): StartRow[] {
    const rows = (Array.isArray(config.themes) ? config.themes : []).filter(isMap);
    return rows.flatMap((row) =>
        typeof row.name === 'string' && row.name !== ''
            ? [{ name: row.name, class: typeof row.class === 'string' ? row.class : '' }]
            : []
    );
}

/**
 * The theme a window of the desktop app starts on, over the merged config and the saved names of
 * the app themes the window can draw (`drawable`, the themes of approved, enabled apps whose file
 * resolves): `startOf` over the rows of `startRows`, with the theme `theme` names and the one
 * `app_theme` names.
 */
export function windowStart(
    config: Record<string, unknown>,
    drawable: readonly string[]
): WindowStart {
    return startOf(startRows(config), drawable, config.theme, config.app_theme);
}

/**
 * The word the desktop host appends to the user agent of its session, so every request of every
 * window of the app carries it and a browser's never does.
 */
export const DESKTOP_MARK = 'oculus-desktop';

/** Whether a request's user agent carries `DESKTOP_MARK` as one of its words. */
export function desktopMarked(agent: string | null): boolean {
    return (agent ?? '').split(/\s+/).includes(DESKTOP_MARK);
}

/** The body class the CRT overlay is switched on by; themes.css draws it on top of any theme. */
export const CRT_CLASS = 'crt';

/**
 * The body class a rice theme draws its buttons, chips and tags without brackets under: the
 * option `rice.brackets` off. The rules that draw the brackets select `body.rice` without it.
 */
const RICE_PLAIN_CLASS = 'rice-plain';

/**
 * The body class a rice theme draws its interface in the default sans font under: the option
 * `rice.monospace` off. The rules that set the monospace font select `body.rice` without it.
 */
const RICE_SANS_CLASS = 'rice-sans';

/**
 * The looks the options set beside a theme's own classes: the CRT overlay (`crt.on`), and the two
 * rice toggles (`rice.brackets`, `rice.monospace`), whose classes are put on only when the option
 * is off, so a config that sets neither draws the rice look whole.
 */
export type BodyLooks = { crt: boolean; brackets: boolean; monospace: boolean };

/**
 * The looks of the merged config, the one reader of `crt.on`, `rice.brackets` and
 * `rice.monospace`: the page's look (state/shared/words/appearance.ts, `lookShape`) and the class
 * the server sends the page with both take them from here. An option that is not a boolean, or
 * sits under a key that is not a map, has its default, the overlay off and both rice toggles on.
 */
export function configLooks(config: Record<string, unknown>): BodyLooks {
    const crt = isMap(config.crt) ? config.crt : {};
    const rice = isMap(config.rice) ? config.rice : {};
    return {
        crt: typeof crt.on === 'boolean' ? crt.on : false,
        brackets: typeof rice.brackets === 'boolean' ? rice.brackets : true,
        monospace: typeof rice.monospace === 'boolean' ? rice.monospace : true
    };
}

/**
 * The body class string of a theme's own classes and the looks: the CRT class when the overlay is
 * on and the class of each rice toggle that is off, joined with single spaces and no empty word.
 */
export function bodyClass(classes: string, looks: BodyLooks): string {
    return [
        classes,
        looks.crt ? CRT_CLASS : '',
        looks.brackets ? '' : RICE_PLAIN_CLASS,
        looks.monospace ? '' : RICE_SANS_CLASS
    ]
        .join(' ')
        .split(/\s+/)
        .filter((name) => name.length > 0)
        .join(' ');
}
