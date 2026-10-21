// Layer 2, server (the desktop host). Whether an oculus answers on a port. A port that refused the
// server this app started is asked `GET /api/health`: the answer `{ "app": "oculus" }` within the
// limit is an oculus, and no answer, another status or another body is another program. Node's
// fetch sends neither `Origin` nor `Sec-Fetch-Site`, which the route admits (src/hooks.server.ts).
// A window opened onto such an oculus asks it for the files of the app themes its window may start
// on (`fetchAppThemes`), since no server of this app tells the host them.

import {
    themeAnswer,
    type AppThemeFile,
    type AppThemeFiles
} from '../../lib/data/helpers/files/apps/choices.ts';
import { LISTEN_HOST } from '../../lib/server/root/mover.ts';
import { HEALTH_BODY } from '../../lib/server/root/process/parent.ts';

/** Whether the body read is the one an oculus answers. */
function isHealth(body: unknown): boolean {
    return JSON.stringify(body) === JSON.stringify(HEALTH_BODY);
}

/** Whether an oculus answers `GET /api/health` on `port` within `limitMs`. */
export async function oculusAnswers(port: number, limitMs: number): Promise<boolean> {
    try {
        const response = await fetch(`http://${LISTEN_HOST}:${port}/api/health`, {
            signal: AbortSignal.timeout(limitMs)
        });
        return response.status === 200 && isHealth(await response.json());
    } catch {
        return false;
    }
}

/**
 * The files of the app themes `names` holds as the oculus on `port` serves them at
 * `GET /api/app-theme`, within `limitMs` in all, by saved name: a theme's file, or null for a
 * refusal, another body or no answer in time. The request carries the oculus's own address as its
 * `Origin`, as a request of its page does, so the route's origin guard admits it.
 */
export async function fetchAppThemes(
    port: number,
    names: readonly string[],
    limitMs: number
): Promise<AppThemeFiles> {
    const origin = `http://${LISTEN_HOST}:${port}`;
    const signal = AbortSignal.timeout(limitMs);
    const read = async (name: string): Promise<[string, AppThemeFile | null]> => {
        try {
            const response = await fetch(
                `${origin}/api/app-theme?choice=${encodeURIComponent(name)}`,
                { headers: { origin }, signal }
            );
            return [name, themeAnswer(await response.json(), name)];
        } catch {
            return [name, null];
        }
    };
    return Object.fromEntries(await Promise.all(names.map(read)));
}
