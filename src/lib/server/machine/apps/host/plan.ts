// Layer 2, server. Whether an app's host may run, as a function of the apps the server holds, and
// which apps' `depends` lists form a cycle.
//
// A host may run while its app names a host, is enabled, has files whose current hash the approvals
// file holds (an app kept approved while it is edited is approved but its changed files are not,
// so its host waits for an approval of them), takes part in no cycle of `depends`, and every app
// it depends on may run itself. A dependency is a machine app by name; one that is absent, refused,
// disabled, unapproved, without a host or itself unable to run leaves the depending host waiting,
// and the verdict names it, saying whether no app of that name exists at all. A verdict is read
// again at every change of the apps, so it never outlives the state it judged.

import { appViewId } from '../../../../data/helpers/files/apps.ts';
import { appById, type AppsHeld, type HeldApp } from '../read/held.ts';
import { findingKey } from '../read/manifest.ts';

/** Why a host may not run. */
export type Verdict =
    | { ok: true }
    | { ok: false; cause: 'nohost' }
    | { ok: false; cause: 'disabled' }
    | { ok: false; cause: 'approval' }
    | { ok: false; cause: 'cycle' }
    | {
          ok: false;
          cause: 'dependency';
          /** The name of the dependency that lacks. */
          dependency: string;
          /** Whether the dependency lacks because its files are not approved. */
          approval: boolean;
          /** Whether no app of that name is held and no folder of that name was refused. */
          absent: boolean;
      };

/** The view ids of the apps that take part in a cycle of `depends`. */
export function cyclesOf(held: AppsHeld): Set<string> {
    const inCycle = new Set<string>();
    const named = (app: HeldApp): HeldApp[] =>
        app.row.depends
            .map((name) => appById(held, appViewId('', name)))
            .filter((one): one is HeldApp => one !== undefined);
    const visit = (app: HeldApp, path: HeldApp[]): void => {
        const at = path.indexOf(app);
        if (at >= 0) {
            for (const member of path.slice(at)) inCycle.add(member.id);
            return;
        }
        if (path.length > held.apps.length) return;
        for (const next of named(app)) visit(next, [...path, app]);
    };
    for (const app of held.apps) visit(app, []);
    return inCycle;
}

/** The verdict on one app's host. */
export function judge(held: AppsHeld, app: HeldApp, cycles: ReadonlySet<string>): Verdict {
    if (app.row.host === '') return { ok: false, cause: 'nohost' };
    if (app.row.disabled) return { ok: false, cause: 'disabled' };
    if (!app.row.hashApproved) return { ok: false, cause: 'approval' };
    if (cycles.has(app.id)) return { ok: false, cause: 'cycle' };
    for (const name of app.row.depends) {
        const dependency = appById(held, appViewId('', name));
        if (dependency === undefined || !judge(held, dependency, cycles).ok) {
            const approval =
                dependency !== undefined &&
                !dependency.row.disabled &&
                dependency.row.host !== '' &&
                !dependency.row.hashApproved;
            const absent =
                dependency === undefined &&
                !held.findings.some((one) => one.key === findingKey('', name));
            return { ok: false, cause: 'dependency', dependency: name, approval, absent };
        }
    }
    return { ok: true };
}
