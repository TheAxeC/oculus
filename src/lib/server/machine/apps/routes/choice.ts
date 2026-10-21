// Layer 2, server. The part the theme routes share: a request names a colour theme or a file icon
// theme by the name the page saves it under (`choice`: the app's view id, a slash and the
// percent-encoded name, data/helpers/files/apps/choices.ts), and the answer is the held app that
// offers it, or the refusal to send: `missing` for a choice naming no app, and `closed` for an app
// that is not approved and enabled. `heldChoice` is the same lookup over a saved name, which the
// page's first load and the desktop host read an app's colour theme by (theme.ts, `appThemeOf`).

import { json } from '@sveltejs/kit';
import { appActive } from '../../../../data/helpers/files/apps/apps.ts';
import { splitAppChoice } from '../../../../data/helpers/files/apps/choices.ts';
import { appById, type AppsHeld, type HeldApp } from '../read/held.ts';
import { NO_STORE, refuse, type AppsRouteOptions } from './routes.ts';

/** The answer `{ ok: false, word }` of a theme route. */
export const refusal = (word: string): Response => json({ ok: false, word }, { headers: NO_STORE });

/**
 * The acting app of `held` a saved name names and the theme name in it, or why there is none:
 * `missing` for a name of no app, `closed` for an app that is not approved and enabled.
 */
export function heldChoice(
    held: AppsHeld,
    saved: string
): { app: HeldApp; name: string } | 'missing' | 'closed' {
    const split = splitAppChoice(saved);
    if (split === null) return 'missing';
    const app = appById(held, split.view);
    if (app === undefined) return 'missing';
    return appActive(app.row) ? { app, name: split.name } : 'closed';
}

/** The acting app a request's `choice` names and the theme name in it, or the refusal to send. */
export function appOfChoice(
    request: Request,
    options: AppsRouteOptions
): { app: HeldApp; name: string } | Response {
    const choices = new URL(request.url).searchParams.getAll('choice');
    if (choices.length !== 1 || choices[0] === '') return refuse('choice must be given once', 400);
    const found = heldChoice(options.apps.held(), choices[0]);
    return typeof found === 'string' ? refusal(found) : found;
}
