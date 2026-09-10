// Layer 2, client state. The page's end of the write endpoint: the token it was given, the POST it
// makes, and whether one is in flight. DESIGN.md's decision on live data is that writes are fetch
// POSTs, so nothing here goes over the socket; what the page sees of its own write is the watcher's
// next push of the portfolio, about a fifth of a second later.
//
// A 403 has one ordinary cause: the dev server restarted and minted a new token while the page kept
// the old one. So a 403 reloads the page's data once, which runs +page.ts again and installs the new
// token, and retries the write once. A second 403 is reported rather than retried.

/** What the endpoint answers with when it wrote, or refused what it was asked to write. */
export type WriteAnswer = {
    ok: boolean;
    changed: string[];
    refused: { field: string; reason: string }[];
    /** Set when the request itself was refused, rather than a field of it. */
    error?: string;
};

const state: { pending: number; error: string | null } = $state({ pending: 0, error: null });

let token = '';

/** Install the token the page was given. Called from the page's load, on every load. */
export function setToken(next: string): void {
    token = typeof next === 'string' ? next : '';
}

/** Whether a write is in flight. */
export function pending(): boolean {
    return state.pending > 0;
}

/** What the last write failed with, or null when the last one was answered. */
export function lastError(): string | null {
    return state.error;
}

async function post(id: string, fields: Record<string, unknown>): Promise<Response> {
    return fetch('/api/write', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-oculus-token': token },
        body: JSON.stringify({ kind: 'manifest', id, fields })
    });
}

/**
 * Set fields of one project's manifest. The answer says what changed and what was refused; a
 * request the server would not answer at all comes back as `ok: false` with the error it gave.
 */
export async function writeManifest(
    id: string,
    fields: Record<string, unknown>
): Promise<WriteAnswer> {
    state.pending += 1;
    state.error = null;
    try {
        let response = await post(id, fields);
        if (response.status === 403) {
            // The import is here rather than at the top so nothing but a stale token pulls Kit's
            // navigation module in, and a server-rendered page never touches it.
            const { invalidateAll } = await import('$app/navigation');
            await invalidateAll();
            response = await post(id, fields);
        }
        const body = (await response.json()) as Partial<WriteAnswer>;
        if (!response.ok) {
            const error = typeof body.error === 'string' ? body.error : `HTTP ${response.status}`;
            state.error = error;
            return { ok: false, changed: [], refused: [], error };
        }
        return {
            ok: true,
            changed: Array.isArray(body.changed) ? body.changed : [],
            refused: Array.isArray(body.refused) ? body.refused : []
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        state.error = message;
        return { ok: false, changed: [], refused: [], error: message };
    } finally {
        state.pending -= 1;
    }
}
