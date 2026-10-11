// Layer 2, server. Remove a machine app: what the reader is asked first, and what the removal does.
//
// The question names the app's folder, the number of secrets it holds (or that they could not be
// counted) and the enabled apps that depend on it. On yes the dependents are disabled machine-wide,
// the hosts of the dependents are stopped and then the app's own host, its folder and its store
// file go to the system trash (a folder entry that is a link moves the link and never its target),
// its secrets are deleted from the keyring, its approval is revoked and its entries of
// `~/.oculus/apps.json` are dropped. Nothing is changed when the trash refuses, so the app stays
// whole. A root app is never removed here: its folder belongs to its repository.

import { existsSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { revokeApp } from '../../approvals/approvals.ts';
import type { AppHosts } from '../host/manager.ts';
import type { AppsHeld, HeldApp } from '../read/held.ts';
import { changeAppsState, readAppsState } from '../read/state.ts';
import type { AppSecrets } from '../secrets/secrets.ts';
import { dependentsClosure } from './enable.ts';

/** What the question to the reader is made of. */
export type Removal = {
    folder: string;
    /** The number of secrets, or null when the keyring could not be read. */
    secrets: number | null;
    /** The titles of the enabled apps that depend on the app. */
    dependents: string[];
};

/** What a removal needs of the process. */
export type RemoveDeps = {
    held: () => AppsHeld;
    hosts: Pick<AppHosts, 'stop' | 'settled'>;
    secrets: Pick<AppSecrets, 'count' | 'clear'>;
    trash: (path: string) => Promise<void>;
    approvalsFile: string;
    stateFile: string;
    workspace: string;
    unkeep: (id: string) => void;
};

/** What a removal came to. */
export type RemoveOutcome =
    | { ok: true; secretsKept: boolean }
    | {
          ok: false;
          error: 'missing' | 'root_app' | 'dependents' | 'trash' | 'approval' | 'file';
          reason?: string;
      };

/** The entry of the app in the machine's apps folder: the folder, or the link that names it. */
function entryOf(held: AppsHeld, app: HeldApp): string | null {
    for (const folder of held.folders) {
        const entry = join(folder, app.row.name);
        try {
            lstatSync(entry);
        } catch {
            continue;
        }
        if (entry === app.row.folder || existsSync(join(entry, 'app.yml'))) return entry;
    }
    return null;
}

/** What the question shows for a machine app. */
export async function describeRemoval(
    held: AppsHeld,
    app: HeldApp,
    secrets: Pick<AppSecrets, 'count'>
): Promise<Removal> {
    return {
        folder: app.row.folder,
        secrets: app.row.secrets ? await secrets.count(app) : 0,
        dependents: dependentsClosure(held, app)
            .filter((one) => !one.row.disabled)
            .map((one) => one.row.title)
    };
}

/** Remove the app; `cascade` is the reader's yes to disabling the apps that depend on it. */
export async function removeApp(
    app: HeldApp,
    cascade: boolean,
    deps: RemoveDeps
): Promise<RemoveOutcome> {
    if (app.row.root !== '') return { ok: false, error: 'root_app' };
    const problem = readAppsState(deps.stateFile).problem;
    if (problem !== null) return { ok: false, error: 'file', reason: problem };
    const held = deps.held();
    const entry = entryOf(held, app);
    if (entry === null) return { ok: false, error: 'missing' };
    const dependents = dependentsClosure(held, app).filter((one) => !one.row.disabled);
    if (dependents.length > 0) {
        if (!cascade) return { ok: false, error: 'dependents' };
        for (const one of dependents) {
            const done = changeAppsState(deps.stateFile, {
                scope: 'machine',
                id: one.id,
                disabled: true
            });
            if (!done.ok) return { ok: false, error: 'file', reason: done.error };
        }
    }
    await deps.hosts.stop(app.id, { dependentsFirst: true });
    await deps.hosts.settled();
    try {
        await deps.trash(entry);
        if (existsSync(app.row.storeFile)) await deps.trash(app.row.storeFile);
    } catch (error) {
        return { ok: false, error: 'trash', reason: error instanceof Error ? error.message : '' };
    }
    const cleared = app.row.secrets ? await deps.secrets.clear(app) : true;
    const revoked = revokeApp(deps.approvalsFile, app.row.folder);
    if (!revoked.ok) return { ok: false, error: 'approval', reason: revoked.error };
    deps.unkeep(app.id);
    const forgotten = changeAppsState(deps.stateFile, { scope: 'forget', id: app.id });
    if (!forgotten.ok) return { ok: false, error: 'file', reason: forgotten.error };
    return { ok: true, secretsKept: !cleared };
}
