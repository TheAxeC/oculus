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

import { json } from '@sveltejs/kit';
import { resolveTheme } from '../read/theme-files/themes.ts';
import { appOfChoice, refusal } from './choice.ts';
import { NO_STORE, type AppsRouteOptions } from './routes.ts';

/** GET /api/app-theme?choice=<saved name>: the resolved theme file of an app. */
export function handleThemeGet(request: Request, options: AppsRouteOptions): Response {
    const found = appOfChoice(request, options);
    if (found instanceof Response) return found;
    const { app, name } = found;
    const theme = app.row.contributes.themes.find((one) => one.label === name);
    if (theme === undefined) return refusal('missing');
    const read = resolveTheme(
        app.row.folder,
        new Set(app.files.map((one) => one.path)),
        theme.path
    );
    if (!read.ok) return refusal('missing');
    return json(
        {
            ok: true,
            theme: read.theme,
            uiTheme: theme.uiTheme,
            label: theme.label,
            app: app.row.title
        },
        { headers: NO_STORE }
    );
}
