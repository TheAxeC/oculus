// Layer 2, client state. The calls the page makes to manage apps and their hosts: disable and
// enable, what a removal will do, remove, add from a folder, and Stop and Restart of a host. Each
// is one POST of the write token to the server (POST /api/app-manage, /api/app-add and
// /api/app-host); the server answers after its watcher has read the new state, so the rows the page
// holds next carry it.
//
// A refusal is a word and, for the cases that need it, the titles of the enabled apps that depend
// on the app, which a view names to the reader before it sends the request again with `cascade`.
//
// The output of a host as the Processes view shows it is read here too (`createOutputReader`): a
// row of the `app-hosts` channel carries the size of a host's output and not its text, so the text
// is asked of the server when the reader opens an output and again each time the size in the row
// changes while the output stays open. A reply that arrives after a newer ask is dropped, so the
// lines shown are those of the last ask.

import type { AppHostRow } from '../../../data/model/index.ts';
import type { Posted } from '../../shared/stores/shapes.ts';

type Post = (path: string, body: unknown) => Promise<Posted>;

/** What a disable, an enable or a removal came to. */
export type ManageOutcome =
    | { ok: true; secretsKept: boolean }
    | { ok: false; error: string; reason: string; dependents: string[] };

/** What a removal will do, for the question the reader is asked. */
type Inspection =
    | { ok: true; folder: string; secrets: number | null; dependents: string[] }
    | { ok: false; error: string };

/** What an addition came to: the app's name, or the word it was refused with. */
type AddOutcome = { ok: true; name: string } | { ok: false; error: string };

/** The calls that manage apps. */
export type ManageStore = {
    setEnabled: (
        id: string,
        enabled: boolean,
        workspace: boolean,
        cascade: boolean
    ) => Promise<ManageOutcome>;
    inspect: (id: string) => Promise<Inspection>;
    remove: (id: string, cascade: boolean) => Promise<ManageOutcome>;
    add: (path: string) => Promise<AddOutcome>;
    stopHost: (id: string) => Promise<boolean>;
    restartHost: (id: string) => Promise<boolean>;
    /** The kept output of a host, or null when the server did not answer. */
    hostOutput: (id: string) => Promise<string[] | null>;
};

const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

/** The strings of a list the server sent: the titles a refusal names, the lines of an output. */
function stringsOf(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((one): one is string => typeof one === 'string')
        : [];
}

/** The calls over the page's `postCommand`. */
export function createManage(post: Post): ManageStore {
    /** A disable, an enable or a remove as the page reads its answer. */
    async function change(path: string, body: unknown): Promise<ManageOutcome> {
        const posted = await post(path, body);
        if (posted.ok) return { ok: true, secretsKept: posted.body.secretsKept === true };
        return {
            ok: false,
            error: textOf(posted.body.error) || posted.failed,
            reason: textOf(posted.body.reason),
            dependents: stringsOf(posted.body.dependents)
        };
    }

    return {
        setEnabled: (id, enabled, workspace, cascade) =>
            change('/api/app-manage', {
                action: enabled ? 'enable' : 'disable',
                view: id,
                ...(workspace ? { workspace: true } : {}),
                ...(cascade ? { cascade: true } : {})
            }),
        async inspect(id) {
            const posted = await post('/api/app-manage', { action: 'inspect', view: id });
            if (!posted.ok) return { ok: false, error: textOf(posted.body.error) || posted.failed };
            const secrets = posted.body.secrets;
            return {
                ok: true,
                folder: textOf(posted.body.folder),
                secrets: typeof secrets === 'number' ? secrets : null,
                dependents: stringsOf(posted.body.dependents)
            };
        },
        remove: (id, cascade) =>
            change('/api/app-manage', {
                action: 'remove',
                view: id,
                ...(cascade ? { cascade: true } : {})
            }),
        async add(path) {
            const posted = await post('/api/app-add', { path });
            if (posted.ok) return { ok: true, name: textOf(posted.body.name) };
            return { ok: false, error: textOf(posted.body.error) || posted.failed };
        },
        stopHost: async (id) => (await post('/api/app-host', { action: 'stop', view: id })).ok,
        restartHost: async (id) =>
            (await post('/api/app-host', { action: 'restart', view: id })).ok,
        async hostOutput(id) {
            const posted = await post('/api/app-host', { action: 'output', view: id });
            return posted.ok ? stringsOf(posted.body.output) : null;
        }
    };
}

/** What the reader needs of a host's output. */
export type OutputReader = {
    /** The reader opened the output of this row: ask for it now. */
    open: (row: AppHostRow) => void;
    /** The reader closed the output of this app: ask no more for it. */
    close: (app: string) => void;
    /** The rows changed: ask again for each open output whose size is not the one last asked at. */
    update: (rows: readonly AppHostRow[]) => void;
};

/**
 * A reader that asks `ask` for the lines of a host and tells `told` the lines of the newest ask.
 * `ask` answers null when the server did not answer, which leaves the lines as they are.
 */
export function createOutputReader(
    ask: (app: string) => Promise<string[] | null>,
    told: (app: string, lines: string[]) => void
): OutputReader {
    const open = new Set<string>();
    const asked = new Map<string, { size: number; turn: number }>();

    async function read(row: AppHostRow): Promise<void> {
        const last = asked.get(row.app) ?? { size: -1, turn: 0 };
        if (last.size === row.outputBytes) return;
        const turn = last.turn + 1;
        asked.set(row.app, { size: row.outputBytes, turn });
        const lines = await ask(row.app);
        if (lines !== null && asked.get(row.app)?.turn === turn) told(row.app, lines);
    }

    return {
        open(row) {
            open.add(row.app);
            asked.delete(row.app);
            void read(row);
        },
        close(app) {
            open.delete(app);
            asked.delete(app);
        },
        update(rows) {
            for (const row of rows) if (open.has(row.app)) void read(row);
        }
    };
}
