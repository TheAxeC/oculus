// Layer 2, server (the desktop host). Whether an oculus answers on a port. A port that refused the
// server this app started is asked `GET /api/health`: the answer `{ "app": "oculus" }` within the
// limit is an oculus, and no answer, another status or another body is another program. Node's
// fetch sends neither `Origin` nor `Sec-Fetch-Site`, which the route admits (src/hooks.server.ts).

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
