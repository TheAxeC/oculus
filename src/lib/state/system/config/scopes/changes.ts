// Layer 2, client state. The unsaved changes of the Settings view, kept per file under the name
// scope.ts `fileOf` gives it, so each scope has its own and two scopes of one file share one set.
// A change is what its Save sends (data/shapes/config-save.ts): a key of a defaults file set or
// taken out, held under `<file>:<key>`, in the workspace file its primary (`@primary`) and a
// folder's name (`@folder:<name>`), and in the primary hub's file a setting an app declares
// (`@app:<key>`). A later change of a name replaces the earlier one. The changes of the unsaved
// workspace move to the workspace file it is saved as (`move`).
//
// A secret typed into a `downloads` row is held apart, by the file and the row's service, and
// only here: it is never part of a draft, the tab's state or a row's value, so nothing saved with
// the layout holds it, and it goes into the Save's `downloads` rows alone. A row with no secret
// held keeps the file's (`secret` left out), a secret held as null takes it out.
//
// The store is a plain closure with no runes; the view hands it a callback that redraws. It holds
// the changes until a Save of their file lands or the reader discards them, whatever the workspace
// does meanwhile, so a change made for a hub that has since left the workspace stays, unsaved.

import {
    SAVE_KIND,
    isKeyChange,
    type SaveBody,
    type SaveChange,
    type SaveScope
} from '../../../../data/shapes/config-save.ts';
import { isMap } from '../../../../data/helpers/guards.ts';

/** The body of a scope's Save and one change it holds, as the Settings view reads them. */
export type { SaveBody, SaveChange };

/** The key of the machine's file whose rows carry a secret, and the field that holds it. */
const DOWNLOADS = 'downloads';
const SECRET = 'secret';

/** The name a change of a key is held under. */
export function keyName(file: string, key: string): string {
    return `${file}:${key}`;
}

/** The name the change of the workspace file's primary is held under. */
export const PRIMARY_NAME = '@primary';

/** The name the change of a folder's name is held under. */
export function folderName(folder: string): string {
    return `@folder:${folder}`;
}

/** The name the change of a setting an app declares is held under. */
export function appName(key: string): string {
    return `@app:${key}`;
}

/** The unsaved changes of the Settings view. */
export type Changes = {
    /** Hold a change of a file under a name, in place of the one held under it. */
    stage: (file: string, name: string, change: SaveChange) => void;
    /** Hold a secret typed for a `downloads` row of a file, or null to take the secret out. */
    stageSecret: (file: string, service: string, secret: string | null) => void;
    /** Drop the change held under a name, or every change of the file with no name given. */
    drop: (file: string, name?: string) => void;
    /** Drop the secret held for a row. */
    dropSecret: (file: string, service: string) => void;
    /** The change held under a name. */
    get: (file: string, name: string) => SaveChange | undefined;
    /** Whether a secret is held for a row, and which: a text, or null to take it out. */
    secret: (file: string, service: string) => string | null | undefined;
    /** How many changes and secrets a file holds. */
    count: (file: string) => number;
    /** The files that hold a change, in the order their first change was made. */
    files: () => string[];
    /** The changes of a file in the order they were made. */
    of: (file: string) => SaveChange[];
    /** The secrets held for a file's rows, by service. */
    secretsOf: (file: string) => ReadonlyMap<string, string | null>;
    /** Keep the changes and secrets of one file's name under another, after those it holds. */
    move: (from: string, to: string) => void;
};

/** Open the store. `changed` is called whenever what it holds moves. */
export function createChanges(changed: () => void): Changes {
    const held = new Map<string, Map<string, SaveChange>>();
    const secrets = new Map<string, Map<string, string | null>>();

    function stage(file: string, name: string, change: SaveChange): void {
        const set = held.get(file) ?? new Map<string, SaveChange>();
        set.delete(name);
        set.set(name, change);
        held.set(file, set);
        changed();
    }

    function stageSecret(file: string, service: string, secret: string | null): void {
        const set = secrets.get(file) ?? new Map<string, string | null>();
        set.set(service, secret);
        secrets.set(file, set);
        changed();
    }

    function drop(file: string, name?: string): void {
        if (name === undefined) {
            held.delete(file);
            secrets.delete(file);
        } else {
            held.get(file)?.delete(name);
            if (held.get(file)?.size === 0) held.delete(file);
        }
        changed();
    }

    function dropSecret(file: string, service: string): void {
        secrets.get(file)?.delete(service);
        if (secrets.get(file)?.size === 0) secrets.delete(file);
        changed();
    }

    function move(from: string, to: string): void {
        if (from === to) return;
        for (const store of [held, secrets] as Map<string, Map<string, unknown>>[]) {
            const moving = store.get(from);
            if (moving === undefined) continue;
            const kept = store.get(to) ?? new Map<string, unknown>();
            for (const [name, one] of moving) kept.set(name, one);
            store.set(to, kept);
            store.delete(from);
        }
        changed();
    }

    return {
        stage,
        stageSecret,
        drop,
        dropSecret,
        get: (file, name) => held.get(file)?.get(name),
        secret: (file, service) => secrets.get(file)?.get(service),
        count: (file) => (held.get(file)?.size ?? 0) + (secrets.get(file)?.size ?? 0),
        files: () => [...new Set([...held.keys(), ...secrets.keys()])],
        of: (file) => [...(held.get(file)?.values() ?? [])],
        secretsOf: (file) => secrets.get(file) ?? new Map(),
        move
    };
}

/**
 * The `downloads` rows a Save sends: each row's secret left out unless one is held for its
 * service, which is then sent as typed, or as null to take it out. A row of the file shows its
 * secret as `true` (set), which is never sent.
 */
function downloadRows(rows: unknown, typed: ReadonlyMap<string, string | null>): unknown {
    if (!Array.isArray(rows)) return rows;
    return (rows as unknown[]).map((row) => {
        if (!isMap(row)) return row;
        const { [SECRET]: _shown, ...rest } = row;
        const service = typeof row.service === 'string' ? row.service : '';
        const secret = typed.get(service);
        return secret === undefined ? rest : { ...rest, [SECRET]: secret };
    });
}

/**
 * The Save of a file's changes, or null when it holds none: `scope` and `root` name the file's kind
 * and its hub or folder, `digest` the text the page read it as, and `downloads` the rows of the
 * file's `downloads` as the page holds them, which a secret held with no change of the rows is
 * sent over.
 */
export function saveOf(
    changes: Changes,
    file: string,
    target: { scope: SaveScope; root?: string; digest: string; downloads: () => unknown }
): SaveBody | null {
    const typed = changes.secretsOf(file);
    const made = changes.of(file).map((change): SaveChange => {
        if (!isKeyChange(change) || change.key !== DOWNLOADS || 'reset' in change) return change;
        return { ...change, value: downloadRows(change.value, typed) };
    });
    const rows = made.some((one) => isKeyChange(one) && one.key === DOWNLOADS);
    if (typed.size > 0 && !rows) {
        made.push({
            file: 'local.yml',
            key: DOWNLOADS,
            value: downloadRows(target.downloads(), typed)
        });
    }
    if (made.length === 0) return null;
    return {
        kind: SAVE_KIND,
        scope: target.scope,
        ...(target.root === undefined ? {} : { root: target.root }),
        digest: target.digest,
        changes: made
    };
}
