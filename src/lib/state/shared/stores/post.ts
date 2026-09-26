// Layer 2, client state. The one way a store sends a command to an endpoint: a JSON POST carrying
// the page's write token, answered by the endpoint's JSON body.
//
// A fetch that fails and an answer that is not JSON are answered here as what went wrong rather
// than thrown, so a press whose request did not come back says so in its view instead of ending in
// a rejection nobody reads.

import { fields } from '../../../data/helpers/guards.ts';

/**
 * What went wrong before the endpoint's answer could be read: no answer came, or the answer was not
 * JSON. The empty string when the answer was read.
 */
export type PostFailure = '' | 'unreachable' | 'unreadable';

/** The endpoint's answer: whether it took the command, and the fields of its body. */
export type Posted = { ok: boolean; body: Record<string, unknown>; failed: PostFailure };

/** Post one command to an endpoint with the page's write token, and read its answer. */
export async function postCommand(path: string, body: unknown, token: string): Promise<Posted> {
    let response: Response;
    try {
        response = await fetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': token },
            body: JSON.stringify(body)
        });
    } catch {
        return { ok: false, body: {}, failed: 'unreachable' };
    }
    let parsed: unknown;
    try {
        parsed = await response.json();
    } catch {
        return { ok: false, body: {}, failed: 'unreadable' };
    }
    return { ok: response.ok, body: fields(parsed), failed: '' };
}
