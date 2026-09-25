// Layer 2, client state. The page's end of the write endpoint: the token it was given, the POST it
// makes, and whether one is in flight. DESIGN.md's decision on live data is that writes are fetch
// POSTs, so nothing here goes over the socket; what the page sees of its own write is the watcher's
// next push of the portfolio, about a fifth of a second later.
//
// A 403 without a field refusal can mean the server minted a new token while the page kept the old
// one. It reloads the page data and retries once. A field refusal, such as an open path outside the
// configured roots, is reported without retrying.
//
// Every write that does not land, refused by the server or given no answer, is also said to
// whatever registered through onUnwritten, which is the notification the status bar's bell counts,
// beside the line the view that sent it draws. It is said once per write, after the one retry a
// stale token gets, and a caller that says it in a notification of its own sends with `said`.

import { tick } from 'svelte';
import { t } from '../words/text.ts';
import type {
    SendOptions,
    SessionFields,
    SubtaskAction,
    SubtaskTarget,
    WriteAnswer,
    WritesStore
} from '../stores/shapes.ts';

export type { SendOptions, SessionFields, SubtaskAction, SubtaskTarget, WriteAnswer, WritesStore };

/** The endpoint that opens a file in its application or reveals a folder, behind the same token. */
export const OPEN_PATH = '/api/open';

/** The endpoint of the git panel: one action on one workspace, behind the same token. */
export const GIT_PATH = '/api/git';

/** The endpoint of the deposit panel: one action on one project, behind the same token. */
export const DEPOSIT_PATH = '/api/deposit';

/** The endpoint of the Memories wall: one picture added to the folder, behind the same token. */
export const MEMORIES_PATH = '/api/memories';

/** One write's answer, and whether the server gave it or the write got none. */
type Exchange = { answer: WriteAnswer; answered: boolean };

/**
 * How long a write waits for its answer before it is given up, in milliseconds, from
 * `writes.timeout_seconds` of config/behavior.yml; null when the configuration names no positive
 * number, and then a write waits as long as the request does.
 */
export function writeTimeout(config: Record<string, unknown> | null): number | null {
    const group = config?.writes;
    if (typeof group !== 'object' || group === null || Array.isArray(group)) return null;
    const seconds = (group as Record<string, unknown>).timeout_seconds;
    return typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
        ? seconds * 1000
        : null;
}

/**
 * The page's writes. `settings` is the merged configuration as the page last received it, read at
 * each write, so a changed timeout applies to the next write without a reload.
 */
export function createWrites(
    settings: () => Record<string, unknown> | null = () => null
): WritesStore {
    const state: { pending: number; error: string | null } = $state({ pending: 0, error: null });

    let token = '';

    /** What registered to hear a write that did not land. */
    const unwrittenListeners: ((reason: string, refused: boolean) => void)[] = [];

    function onUnwritten(listener: (reason: string, refused: boolean) => void): void {
        unwrittenListeners.push(listener);
    }

    /**
     * Say a write that did not land to every listener: one the server refused, in whole or a field
     * of it, or one that got no answer. A listener that fails leaves the caller the answer it
     * already has, which is what the caller acts on.
     */
    function tell(sent: Exchange, options: SendOptions): WriteAnswer {
        const { answer, answered } = sent;
        if (options.said === true || (answer.ok && answer.refused.length === 0)) return answer;
        const fields = answer.refused.map((one) => one.reason).filter((one) => one !== '');
        const reason = fields.length > 0 ? fields.join('; ') : (answer.error ?? '');
        for (const listener of unwrittenListeners) {
            try {
                listener(reason, answered);
            } catch {
                continue;
            }
        }
        return answer;
    }

    /** Install the token the page was given. Called from the page's load, on every load. */
    function setToken(next: string): void {
        token = typeof next === 'string' ? next : '';
    }

    /**
     * The token, for the one reader that is not a fetch: the socket sends it with its subscription,
     * so that a page which may write a manifest may also type into a terminal.
     */
    function writeToken(): string {
        return token;
    }

    /** Whether a write is in flight. */
    function pending(): boolean {
        return state.pending > 0;
    }

    /** What the last write failed with, or null when the last one was answered. */
    function lastError(): string | null {
        return state.error;
    }

    async function post(body: unknown, path: string, signal: AbortSignal): Promise<Response> {
        return fetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': token },
            body: JSON.stringify(body),
            signal
        });
    }

    /**
     * Set fields of one project's manifest. The answer says what changed and what was refused; a
     * request the server would not answer at all comes back as `ok: false` with the error it gave.
     */
    async function writeManifest(
        id: string,
        fields: Record<string, unknown>
    ): Promise<WriteAnswer> {
        return send({ kind: 'manifest', id, fields });
    }

    /** Ask the local server to reveal one project folder, under the hub or another root. */
    async function openFolder(path: string): Promise<WriteAnswer> {
        return send({ path }, OPEN_PATH);
    }

    /**
     * Ask the local server to open one file in the application `open.program_ext` names for it, or
     * reveal one folder, addressed the way the file browser addresses it: the key of a served root
     * and the path under that root.
     */
    async function openFile(root: string, path: string): Promise<WriteAnswer> {
        return send({ root, path }, OPEN_PATH);
    }

    /**
     * Dismiss one session or bring it back, pin it to an area or unpin it, rename it or clear the
     * name. It is the same endpoint and the same token as a manifest write; what it writes is the
     * per-session overrides file rather than a project.yml, and the answer's `refused` names a
     * field the server would not write, an area that is not an absolute path above all.
     */
    async function writeSession(id: string, fields: SessionFields): Promise<WriteAnswer> {
        return send({ kind: 'session', id, ...fields });
    }

    /**
     * Set fields of one collection entry, found by the id the reader gave it. The same endpoint and
     * the same token as a manifest write; what it writes is one entry's lines inside its collection
     * file.
     */
    async function writeEntry(
        collection: string,
        id: string,
        fields: Record<string, unknown>
    ): Promise<WriteAnswer> {
        return send({ kind: 'entry', collection, id, fields });
    }

    /**
     * Tick one subtask line, reopen it, snooze it until a date, or delete it. `key` is what the
     * reader addressed the line by: the key of the map the file writes, or the position in the
     * list.
     */
    async function writeSubtask(
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

    /**
     * Add one subtask line to a project or to a collection entry, making the block when it has
     * none.
     */
    async function addSubtask(
        target: SubtaskTarget,
        fields: { do: string; deadline?: string }
    ): Promise<WriteAnswer> {
        return send({ kind: 'subtask-add', target, fields });
    }

    /**
     * Move one host of CAREER.yml along the pipeline. A status outside the vocabulary is refused.
     */
    async function writeHost(name: string, status: string): Promise<WriteAnswer> {
        return send({ kind: 'host', name, status });
    }

    /**
     * Put one collection's entries in the order a drag left them. `order` is every entry's identity
     * value, the file's own schema's first field, in the new order; an order that does not name
     * every entry exactly once is refused by the server and the file is left alone.
     */
    async function reorderEntries(collection: string, order: string[]): Promise<WriteAnswer> {
        return send({ kind: 'reorder', collection, order });
    }

    /** Take one entry out of its collection file, by the id the reader gave it. */
    async function deleteEntry(collection: string, id: string): Promise<WriteAnswer> {
        return send({ kind: 'delete-entry', collection, id });
    }

    /** Set or clear one field allowed by a generated feed. */
    async function writeFeedField(
        feed: string,
        id: string,
        field: string,
        value: string | number | boolean | null
    ): Promise<WriteAnswer> {
        return send({ kind: 'feed-field', feed, id, field, value });
    }

    /** Delete one entry from a generated feed that permits deletion. */
    async function deleteFeedEntry(feed: string, id: string): Promise<WriteAnswer> {
        return send({ kind: 'feed-delete', feed, id });
    }

    /** Add one position lead through the feed file's own schema. */
    async function addLead(fields: Record<string, unknown>): Promise<WriteAnswer> {
        return send({ kind: 'lead-add', fields });
    }

    /** Add one LinkedIn idea stub through the configured folder. */
    async function addLinkedinIdea(fields: Record<string, unknown>): Promise<WriteAnswer> {
        return send({
            kind: 'linkedin-idea',
            title: typeof fields.title === 'string' ? fields.title : '',
            category: typeof fields.category === 'string' ? fields.category : ''
        });
    }

    /** Rename one LinkedIn idea and its same-basename sidecars as the next numbered post. */
    async function markPosted(file: string): Promise<WriteAnswer> {
        return send({ kind: 'linkedin-post', file });
    }

    /** Add one entry to a collection, rendered from that file's own schema. */
    async function newEntry(
        collection: string,
        fields: Record<string, unknown>
    ): Promise<WriteAnswer> {
        return send({ kind: 'new-entry', collection, fields });
    }

    /**
     * Save the public deck's slide selection and its order. `order` is every slide of the catalog,
     * shown or not, and `selection` the ones the deck shows; an empty selection, a key outside the
     * catalog and an order that is not the whole catalog are each refused and the file is
     * untouched.
     */
    async function writeDeck(selection: string[], order: string[]): Promise<WriteAnswer> {
        return send({ kind: 'deck', selection, order });
    }

    /**
     * Save the rail list: the endpoint rewrites the `rail:` list of config/layout.yml and the
     * watcher pushes the config, which is what redraws the rail.
     */
    async function writeRail(
        rail: { label: string; glyph: string; page: string }[],
        said = false
    ): Promise<WriteAnswer> {
        return send({ kind: 'rail', rail }, '/api/write', { said });
    }

    /**
     * Park one audit finding, or bring it back. The signature is the scan's own; the endpoint
     * writes it into the `audit_ignore:` list of config/behavior.yml and the watcher pushes the
     * scan again.
     */
    async function muteFinding(signature: string, muted: boolean): Promise<WriteAnswer> {
        return send({ kind: 'audit-mute', signature, muted });
    }

    /**
     * Add one picture to the Memories wall. `data` is the file as base64, which is what the
     * browser's own FileReader gives; the endpoint is the wall's own rather than /api/write, since
     * what it writes is bytes into a folder and not a field of a YAML file.
     */
    async function addMemory(name: string, data: string): Promise<WriteAnswer> {
        return send({ name, data }, MEMORIES_PATH);
    }

    /** Scaffold one idea project: a manifest and a README under projects/ideas/<id>. */
    async function newIdea(fields: {
        id: string;
        title?: string;
        short?: string;
        domain?: string;
        eli5?: string;
    }): Promise<WriteAnswer> {
        return send({ kind: 'new-idea', fields });
    }

    /**
     * Take one recorded change back. The server checks that the file still holds what the change
     * wrote before it writes the earlier value, and answers `moved` when it does not, so an undo
     * never writes over an edit made since.
     */
    async function undoWrite(at: string): Promise<WriteAnswer> {
        return send({ kind: 'undo', at });
    }

    /**
     * One git action on one workspace: staging, a commit, a push, a branch, or the suggested
     * message. The endpoint is /api/git rather than /api/write, and the answer's `output` is what
     * git said or the message that was suggested; everything else, the token and the one retry
     * above all, is the same. An action that can lose work carries `confirm: true`, which the panel
     * sets only from its dialog.
     */
    async function writeGit(
        action: string,
        root: string,
        fields: Record<string, unknown> = {}
    ): Promise<WriteAnswer> {
        return send({ action, root, ...fields }, GIT_PATH);
    }

    /**
     * One deposit action on one project: adopt, plan, commit, push, snapshot, or a branch. The
     * endpoint is /api/deposit, and what the action did to the mirror is read back by
     * state/system/deposit.svelte.ts's own GET rather than carried here. An action that can lose
     * work carries `confirm: true`, which the panel sets only from its dialog.
     */
    async function writeDeposit(
        action: string,
        id: string,
        fields: Record<string, unknown> = {}
    ): Promise<WriteAnswer> {
        return send({ action, id, ...fields }, DEPOSIT_PATH);
    }

    /** One write, said to the listeners when it does not land. */
    async function send(
        request: unknown,
        path = '/api/write',
        options: SendOptions = {}
    ): Promise<WriteAnswer> {
        return tell(await exchange(request, path), options);
    }

    /**
     * One write, with the one retry a stale token gets. The whole of it, the retry and the reading
     * of each answer included, is given up once the configured time has passed with no answer, so a
     * request that never answers leaves no form waiting on it.
     */
    async function exchange(request: unknown, path: string): Promise<Exchange> {
        state.pending += 1;
        state.error = null;
        const gate = new AbortController();
        const wait = writeTimeout(settings());
        const timer = wait === null ? null : setTimeout(() => gate.abort(), wait);
        try {
            let response = await post(request, path, gate.signal);
            let body = (await response.json()) as Partial<WriteAnswer>;
            if (
                response.status === 403 &&
                !(Array.isArray(body.refused) && body.refused.length > 0)
            ) {
                // The import is here rather than at the top so nothing but a stale token pulls
                // Kit's navigation module in, and a server-rendered page never touches it.
                const { invalidateAll } = await import('$app/navigation');
                await invalidateAll();
                // The load hands the token to the page rather than installing it, and the page's
                // effect is what puts it in this store; the tick flushes that effect, so the retry
                // below carries the token the reload minted and not the stale one.
                await tick();
                response = await post(request, path, gate.signal);
                body = (await response.json()) as Partial<WriteAnswer>;
            }
            if (!response.ok) {
                const error =
                    typeof body.error === 'string' ? body.error : `HTTP ${response.status}`;
                state.error = error;
                const refused = Array.isArray(body.refused) ? body.refused : [];
                return { answered: true, answer: { ok: false, changed: [], refused, error } };
            }
            return {
                answered: true,
                answer: {
                    ok: true,
                    changed: Array.isArray(body.changed) ? body.changed : [],
                    refused: Array.isArray(body.refused) ? body.refused : [],
                    output: typeof body.output === 'string' ? body.output : undefined,
                    branches: Array.isArray(body.branches) ? body.branches : undefined,
                    id: typeof body.id === 'string' ? body.id : undefined
                }
            };
        } catch (error) {
            if (gate.signal.aborted) {
                const words = t('app.write_timed_out');
                state.error = words;
                return {
                    answered: false,
                    answer: { ok: false, changed: [], refused: [], error: words }
                };
            }
            const message = error instanceof Error ? error.message : String(error);
            state.error = message;
            const answer = { ok: false, changed: [], refused: [], error: message, network: true };
            return { answered: false, answer };
        } finally {
            if (timer !== null) clearTimeout(timer);
            state.pending -= 1;
        }
    }

    return {
        setToken,
        writeToken,
        pending,
        lastError,
        writeManifest,
        openFolder,
        openFile,
        writeSession,
        writeEntry,
        writeSubtask,
        addSubtask,
        writeHost,
        reorderEntries,
        deleteEntry,
        writeFeedField,
        deleteFeedEntry,
        addLead,
        addLinkedinIdea,
        markPosted,
        newEntry,
        writeDeck,
        writeRail,
        muteFinding,
        addMemory,
        newIdea,
        undoWrite,
        writeGit,
        writeDeposit,
        send,
        onUnwritten
    };
}
