// Layer 2, server. The /api/app-theme route: a colour theme an approved, enabled app declares, with
// its `include` chain resolved inside the app's recorded files (read/theme-files/themes.ts). The
// answer is the file, which the page converts into oculus's theme tokens; this module may not
// import the themes folder, so the request hook, which may, converts the file a page's first HTML
// carries.
//
// The request names the theme by the name the page saves it under (`choice`: the app's view id, a
// slash and the percent-encoded label, data/helpers/files/apps/choices.ts), so a page that holds
// only its saved theme, as the find page and the presenter's pages do, can ask. The answer is 200
// with `{ ok: true, theme, uiTheme, label, app }`, or `{ ok: false, word }` with `missing` for a
// choice naming no app or no theme of it or a theme that no longer resolves, and `closed` for an
// app that is not approved and enabled.
//
// The same read serves three readers that cannot wait for the route, all through `appThemeOf`: a
// page's first load carries the themes the `theme` and `app_theme` options name (`firstAppThemes`),
// which the page's first draw is made from; the page's first HTML is sent with the theme it starts
// on (`requestStart`, which hooks.server.ts calls), its body class and the file of an app's theme,
// so the page's first paint is that theme's; and the desktop host fills a new window with such a
// theme's background (desktop/windows/start-colours.ts). A desktop host that opens a window onto an
// oculus it did not start asks this route for those themes instead.

import { json } from '@sveltejs/kit';
import type { AppThemeFile, AppThemeFiles } from '../../../../data/helpers/files/apps/choices.ts';
import { APP_THEME_CLASS, appThemeNames } from '../../../../data/helpers/files/apps/choices.ts';
import {
    bodyClass,
    configLooks,
    startOf,
    startRows
} from '../../../../data/helpers/editor/start-theme.ts';
import type { AppsHeld } from '../read/held.ts';
import { resolveTheme } from '../read/theme-files/themes.ts';
import { heldChoice, refusal } from './choice.ts';
import { NO_STORE, refuse, type AppsRouteOptions } from './routes.ts';

/**
 * The colour theme saved as `saved` of an approved, enabled app of `held`, resolved, or why there
 * is none: `missing` for a name of no app, of no theme of it or of a theme that does not resolve,
 * and `closed` for an app that is not approved and enabled, whose files are not read.
 */
function appThemeOf(held: AppsHeld, saved: string): AppThemeFile | 'missing' | 'closed' {
    const found = heldChoice(held, saved);
    if (typeof found === 'string') return found;
    const { app, name } = found;
    const theme = app.row.contributes.themes.find((one) => one.label === name);
    if (theme === undefined) return 'missing';
    const read = resolveTheme(
        app.row.folder,
        new Set(app.files.map((one) => one.path)),
        theme.path
    );
    if (!read.ok) return 'missing';
    return { theme: read.theme, uiTheme: theme.uiTheme, label: theme.label, app: app.row.title };
}

/**
 * The colour themes of apps a page's first load carries: the ones the `theme` and `app_theme`
 * options name (`appThemeNames`), each as its file or as null when `appThemeOf` gives none.
 */
export function firstAppThemes(held: AppsHeld, config: Record<string, unknown>): AppThemeFiles {
    const files: AppThemeFiles = {};
    for (const name of appThemeNames(config)) {
        const read = appThemeOf(held, name);
        files[name] = typeof read === 'string' ? null : read;
    }
    return files;
}

/** The theme a page is sent with: its body class string, and the file of an app's theme or null. */
type RequestStart = { classes: string; file: AppThemeFile | null };

/**
 * The theme a page starts on, for the page's first HTML, over the held apps and the merged config:
 * `startOf` over the rows of `themes:` and the app themes whose file `firstAppThemes` reads, with
 * the theme `theme` names and, for a request of the desktop app's window (`marked`), the one
 * `app_theme` names, as the page's first draw chooses it. The class string is the body class the
 * page's first `applyTheme` sets: the theme's class, `APP_THEME_CLASS` for an app's theme, joined
 * with the rice toggles' classes and, on a page that draws the CRT overlay (`crt`), the overlay's.
 */
export function requestStart(
    held: AppsHeld,
    config: Record<string, unknown>,
    marked: boolean,
    crt: boolean
): RequestStart {
    const files = firstAppThemes(held, config);
    const drawable = Object.entries(files).flatMap(([name, file]) => (file === null ? [] : [name]));
    const start = startOf(
        startRows(config),
        drawable,
        config.theme,
        marked ? config.app_theme : undefined
    );
    const file = 'app' in start ? (files[start.app] ?? null) : null;
    const theme = file !== null ? APP_THEME_CLASS : 'cls' in start ? start.cls : '';
    const looks = configLooks(config);
    return { classes: bodyClass(theme, { ...looks, crt: crt && looks.crt }), file };
}

/** GET /api/app-theme?choice=<saved name>: the resolved theme file of an app. */
export function handleThemeGet(request: Request, options: AppsRouteOptions): Response {
    const choices = new URL(request.url).searchParams.getAll('choice');
    if (choices.length !== 1 || choices[0] === '') return refuse('choice must be given once', 400);
    const read = appThemeOf(options.apps.held(), choices[0]);
    if (typeof read === 'string') return refusal(read);
    return json({ ok: true, ...read }, { headers: NO_STORE });
}
