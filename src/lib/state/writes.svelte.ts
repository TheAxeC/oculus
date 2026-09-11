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
    /** What the endpoint had to say: git's own output, or the suggested commit message. */
    output?: string;
    /** The branch rows of a deposit `branches` action. Absent on every other write. */
    branches?: { name: string; upstream: string; current: boolean }[];
};

const state: { pending: number; error: string | null } = $state({ pending: 0, error: null });

let token = '';

/** Install the token the page was given. Called from the page's load, on every load. */
export function setToken(next: string): void {
    token = typeof next === 'string' ? next : '';
}

/**
 * The token, for the one reader that is not a fetch: the socket sends it with its subscription, so
 * that a page which may write a manifest may also type into a terminal (O17).
 */
export function writeToken(): string {
    return token;
}

/** Whether a write is in flight. */
export function pending(): boolean {
    return state.pending > 0;
}

/** What the last write failed with, or null when the last one was answered. */
export function lastError(): string | null {
    return state.error;
}

async function post(body: unknown, path = '/api/write'): Promise<Response> {
    return fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-oculus-token': token },
        body: JSON.stringify(body)
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
    return send({ kind: 'manifest', id, fields });
}

/** What one session write may set. A field left out is left as the overrides file has it. */
export type SessionFields = {
    /** True dismisses the session from the rail, false brings it back. */
    hidden?: boolean;
    /** An absolute directory to pin the session to, or the empty string to unpin it. */
    area?: string;
    /** A title to show instead of the transcript's own, or the empty string to clear it. */
    title?: string;
};

/**
 * Dismiss one session or bring it back, pin it to an area or unpin it, rename it or clear the name.
 * It is the same endpoint and the same token as a manifest write; what it writes is the per-session
 * overrides file rather than a project.yml, and the answer's `refused` names a field the server
 * would not write, an area that is not an absolute path above all.
 */
export async function writeSession(id: string, fields: SessionFields): Promise<WriteAnswer> {
    return send({ kind: 'session', id, ...fields });
}

/** What a subtask write hangs under: one project by its id, or one entry of one collection. */
export type SubtaskTarget = { id: string; collection?: string };

/** What one subtask button does to its line. */
export type SubtaskAction = 'done' | 'reopen' | 'snooze' | 'delete';

/**
 * Set fields of one collection entry, found by the id the reader gave it. The same endpoint and the
 * same token as a manifest write; what it writes is one entry's lines inside its collection file.
 */
export async function writeEntry(
    collection: string,
    id: string,
    fields: Record<string, unknown>
): Promise<WriteAnswer> {
    return send({ kind: 'entry', collection, id, fields });
}

/**
 * Tick one subtask line, reopen it, snooze it until a date, or delete it. `key` is what the reader
 * addressed the line by: the key of the map the file writes, or the position in the list.
 */
export async function writeSubtask(
    target: SubtaskTarget,
    key: string,
    action: SubtaskAction,
    value?: string
): Promise<WriteAnswer> {
    return send({
        kind: 'subtask',
        target,
        key,
        action,
        ...(value === undefined ? {} : { value })
    });
}

/** Add one subtask line to a project or to a collection entry, making the block when it has none. */
export async function addSubtask(
    target: SubtaskTarget,
    fields: { do: string; deadline?: string }
): Promise<WriteAnswer> {
    return send({ kind: 'subtask-add', target, fields });
}

/** Move one host of CAREER.yml along the pipeline. A status outside the vocabulary is refused. */
export async function writeHost(name: string, status: string): Promise<WriteAnswer> {
    return send({ kind: 'host', name, status });
}

/**
 * Put one collection's entries in the order a drag left them. `order` is every entry's identity
 * value, the file's own schema's first field, in the new order; an order that does not name every
 * entry exactly once is refused by the server and the file is left alone.
 */
export async function reorderEntries(collection: string, order: string[]): Promise<WriteAnswer> {
    return send({ kind: 'reorder', collection, order });
}

/** Take one entry out of its collection file, by the id the reader gave it. */
export async function deleteEntry(collection: string, id: string): Promise<WriteAnswer> {
    return send({ kind: 'delete-entry', collection, id });
}

/** Add one entry to a collection, rendered from that file's own schema. */
export async function newEntry(
    collection: string,
    fields: Record<string, unknown>
): Promise<WriteAnswer> {
    return send({ kind: 'new-entry', collection, fields });
}

/** Scaffold one idea project: a manifest and a README under projects/ideas/<id>. */
export async function newIdea(fields: {
    id: string;
    title?: string;
    short?: string;
    domain?: string;
    eli5?: string;
}): Promise<WriteAnswer> {
    return send({ kind: 'new-idea', fields });
}

/** The endpoint of the git panel: one action on one workspace, behind the same token. */
export const GIT_PATH = '/api/git';

/**
 * One git action on one workspace: staging, a commit, a push, a branch, or the suggested message.
 * The endpoint is /api/git rather than /api/write, and the answer's `output` is what git said or the
 * message that was suggested; everything else, the token and the one retry above all, is the same.
 * An action that can lose work carries `confirm: true`, which the panel sets only from its dialog.
 */
export async function writeGit(
    action: string,
    root: string,
    fields: Record<string, unknown> = {}
): Promise<WriteAnswer> {
    return send({ action, root, ...fields }, GIT_PATH);
}

/** The endpoint of the deposit panel: one action on one project, behind the same token. */
export const DEPOSIT_PATH = '/api/deposit';

/**
 * One deposit action on one project: adopt, plan, commit, push, snapshot, or a branch. The endpoint
 * is /api/deposit, and what the action did to the mirror is read back by state/deposit.svelte.ts's
 * own GET rather than carried here. An action that can lose work carries `confirm: true`, which the
 * panel sets only from its dialog.
 */
export async function writeDeposit(
    action: string,
    id: string,
    fields: Record<string, unknown> = {}
): Promise<WriteAnswer> {
    return send({ action, id, ...fields }, DEPOSIT_PATH);
}

/** One write, with the one retry a stale token gets. */
async function send(request: unknown, path = '/api/write'): Promise<WriteAnswer> {
    state.pending += 1;
    state.error = null;
    try {
        let response = await post(request, path);
        if (response.status === 403) {
            // The import is here rather than at the top so nothing but a stale token pulls Kit's
            // navigation module in, and a server-rendered page never touches it.
            const { invalidateAll } = await import('$app/navigation');
            await invalidateAll();
            response = await post(request, path);
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
            refused: Array.isArray(body.refused) ? body.refused : [],
            output: typeof body.output === 'string' ? body.output : undefined,
            branches: Array.isArray(body.branches) ? body.branches : undefined
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        state.error = message;
        return { ok: false, changed: [], refused: [], error: message };
    } finally {
        state.pending -= 1;
    }
}
