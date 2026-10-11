// Layer 2, server. Disable and enable: which apps a change reaches, and the writes of it.
//
// Disable and Enable change the machine-wide list of `~/.oculus/apps.json`; Disable (Workspace) and
// Enable (Workspace) change the lists of the current workspace. Disabling a machine app that other
// enabled apps depend on, directly or through each other, is refused until the caller says
// `cascade`, which disables those apps in the same scope as well; enabling an app enables nothing
// else. The writes are made one app at a time, the app asked for last, so a write that fails leaves
// the apps that depend on it disabled and the app itself as it was.

import type { AppsHeld, HeldApp } from '../read/held.ts';
import { changeAppsState, type StateChange } from '../read/state.ts';
import { appById } from '../read/held.ts';

/** Where a change is kept: for every workspace, or for the current one only. */
type EnableScope = 'machine' | 'workspace';

/** What is asked: one app disabled or enabled in a scope, with its dependents when asked. */
export type EnableRequest = {
    id: string;
    scope: EnableScope;
    enabled: boolean;
    cascade: boolean;
};

/** What a change came to: done, refused for the apps that depend on the app, or not written. */
export type EnableOutcome =
    | { ok: true; changed: string[] }
    | { ok: false; error: 'missing' }
    | { ok: false; error: 'dependents'; apps: string[] }
    | { ok: false; error: 'file'; reason: string };

/** The enabled apps that depend on this app, directly or through each other, nearest first. */
export function dependentsClosure(held: AppsHeld, app: HeldApp): HeldApp[] {
    if (app.row.root !== '') return [];
    const found: HeldApp[] = [];
    const names = [app.row.name];
    for (const name of names) {
        for (const one of held.apps) {
            if (one === app || found.includes(one) || !one.row.depends.includes(name)) continue;
            found.push(one);
            if (one.row.root === '') names.push(one.row.name);
        }
    }
    return found;
}

/** The change a scope makes of one app. */
function changeOf(
    request: EnableRequest,
    workspace: string,
    id: string,
    disabled: boolean
): StateChange {
    return request.scope === 'machine'
        ? { scope: 'machine', id, disabled }
        : { scope: 'workspace', workspace, id, disabled };
}

/** Disable or enable an app in a scope; `file` is `~/.oculus/apps.json`. */
export function changeEnabled(
    held: AppsHeld,
    file: string,
    workspace: string,
    request: EnableRequest
): EnableOutcome {
    const app = appById(held, request.id);
    if (app === undefined) return { ok: false, error: 'missing' };
    const dependents = request.enabled
        ? []
        : dependentsClosure(held, app).filter((one) => !one.row.disabled);
    if (dependents.length > 0 && !request.cascade) {
        return { ok: false, error: 'dependents', apps: dependents.map((one) => one.row.title) };
    }
    const ids = [...dependents.map((one) => one.id).reverse(), app.id];
    for (const id of ids) {
        const done = changeAppsState(file, changeOf(request, workspace, id, !request.enabled));
        if (!done.ok) return { ok: false, error: 'file', reason: done.error };
    }
    return { ok: true, changed: ids };
}
