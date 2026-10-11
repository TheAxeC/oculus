// Layer 2, server. The part the theme routes share: a request names a colour theme or a file icon
// theme by the name the page saves it under (`choice`: the app's view id, a slash and the
// percent-encoded name, data/helpers/files/apps/choices.ts), and the answer is the held app that
// offers it, or the refusal to send: `missing` for a choice naming no app, and `closed` for an app
// that is not approved and enabled.

import { json } from '@sveltejs/kit';
import { appActive } from '../../../../data/helpers/files/apps/apps.ts';
import { splitAppChoice } from '../../../../data/helpers/files/apps/choices.ts';
import { appById, type HeldApp } from '../read/held.ts';
import { NO_STORE, refuse, type AppsRouteOptions } from './routes.ts';

/** The answer `{ ok: false, word }` of a theme route. */
export const refusal = (word: string): Response => json({ ok: false, word }, { headers: NO_STORE });

/** The acting app a request's `choice` names and the theme name in it, or the refusal to send. */
export function appOfChoice(
    request: Request,
    options: AppsRouteOptions
): { app: HeldApp; name: string } | Response {
    const choices = new URL(request.url).searchParams.getAll('choice');
    if (choices.length !== 1 || choices[0] === '') return refuse('choice must be given once', 400);
    const split = splitAppChoice(choices[0]);
    if (split === null) return refusal('missing');
    const app = appById(options.apps.held(), split.view);
    if (app === undefined) return refusal('missing');
    return appActive(app.row) ? { app, name: split.name } : refusal('closed');
}
