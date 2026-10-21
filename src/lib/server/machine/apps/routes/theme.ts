// Layer 2, server. The /api/app-theme route: a colour theme an approved, enabled app declares, with
// its `include` chain resolved inside the app's recorded files (read/theme-files/themes.ts). The
// page converts the answer into oculus's theme tokens, since the server may not import the themes
// folder.
//
// The request names the theme by the name the page saves it under (`choice`: the app's view id, a
// slash and the percent-encoded label, data/helpers/files/apps/choices.ts), so a page that holds
// only its saved theme, as the find page and the presenter's pages do, can ask. The answer is 200
// with `{ ok: true, theme, uiTheme, label, app }`, or `{ ok: false, word }` with `missing` for a
// choice naming no app or no theme of it or a theme that no longer resolves, and `closed` for an
// app that is not approved and enabled.
//
// The same read serves two readers that cannot wait for the route: a page's first load carries
// the themes the `theme` and `app_theme` options name (`firstAppThemes`), so a page whose theme is
// an app's draws it from its first paint, and the desktop host fills a new window with such a
// theme's background (desktop/windows/start-colours.ts), both through `appThemeOf`. A desktop host
// that opens a window onto an oculus it did not start asks this route for those themes instead.

import { json } from '@sveltejs/kit';
import type { AppThemeFile, AppThemeFiles } from '../../../../data/helpers/files/apps/choices.ts';
import { appThemeNames } from '../../../../data/helpers/files/apps/choices.ts';
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

/** GET /api/app-theme?choice=<saved name>: the resolved theme file of an app. */
export function handleThemeGet(request: Request, options: AppsRouteOptions): Response {
    const choices = new URL(request.url).searchParams.getAll('choice');
    if (choices.length !== 1 || choices[0] === '') return refuse('choice must be given once', 400);
    const read = appThemeOf(options.apps.held(), choices[0]);
    if (typeof read === 'string') return refusal(read);
    return json({ ok: true, ...read }, { headers: NO_STORE });
}
