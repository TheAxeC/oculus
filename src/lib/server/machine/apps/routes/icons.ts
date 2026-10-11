// Layer 2, server. The /api/app-icons route: a file icon theme an approved, enabled app declares,
// with the paths of its pictures and fonts turned into the addresses of the app's files
// (read/theme-files/icons.ts). The page draws the icons from the answer.
//
// The request names the theme by the name the page saves it under (`choice`: the app's view id, a
// slash and the percent-encoded id of the icon theme, data/helpers/files/apps/choices.ts), which is
// the value of `file_icons`. The answer is 200 with `{ ok: true, theme, label, app }`, or
// `{ ok: false, word }` with `missing` for a choice naming no app or no icon theme of it or a
// theme file that does not read, and `closed` for an app that is not approved and enabled.

import { json } from '@sveltejs/kit';
import { appAddress } from '../../../../data/helpers/files/apps/apps.ts';
import { resolveIconTheme } from '../read/theme-files/icons.ts';
import { appOfChoice, refusal } from './choice.ts';
import { NO_STORE, type AppsRouteOptions } from './routes.ts';

/** GET /api/app-icons?choice=<saved name>: the icon theme file of an app. */
export function handleIconsGet(request: Request, options: AppsRouteOptions): Response {
    const found = appOfChoice(request, options);
    if (found instanceof Response) return found;
    const { app, name } = found;
    const icons = app.row.contributes.iconThemes.find((one) => one.id === name);
    if (icons === undefined) return refusal('missing');
    const read = resolveIconTheme(
        app.row.folder,
        new Set(app.files.map((one) => one.path)),
        icons.path,
        appAddress(app.row.root, app.row.name, app.row.key)
    );
    if (!read.ok) return refusal('missing');
    return json(
        { ok: true, theme: read.theme, label: icons.label, app: app.row.title },
        { headers: NO_STORE }
    );
}
