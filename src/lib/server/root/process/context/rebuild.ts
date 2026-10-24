// Layer 2, server. How the context builds again the watchers a changed key of the machine's values,
// or a move of the open workspace's primary hub, is the input of. Each start function reads the
// machine's values and the settings in force when it is called, so the same code builds a watcher
// at start and again after a change; this module closes the old watcher before its new one starts
// and, when a watcher cannot be built from a new value, puts the key back to the value in force.

import { isDeepStrictEqual } from 'node:util';
import type { LocalConfig } from '../../../../data/sources/config.ts';
import type { GitWatcher } from '../../watch/git.ts';
import type { AutofetchWatcher } from '../../watch/autofetch.ts';
import {
    WATCHERS,
    isLocalKey,
    keysBuilding,
    rebuiltBy,
    type WatcherName
} from '../../watch/local.ts';
import type { PortfolioWatcher, Watcher } from '../../watch/portfolio/portfolio.ts';
import type { SessionsWatcher } from '../../watch/sessions.ts';
import type { SchedulesWatcher } from '../../../machine/runs/schedules/watch.ts';
import type { UsageRefreshWatcher } from '../../../machine/usage/refresh.ts';
import type { UsageWatcher } from '../../../machine/usage/watch.ts';

/** What the context holds of the watchers that a changed key builds again. */
export type Parts = {
    portfolio: PortfolioWatcher;
    sessions: SessionsWatcher;
    usageRefresh: UsageRefreshWatcher;
    usage: UsageWatcher;
    git: GitWatcher;
    autofetch: AutofetchWatcher;
    bookmarks: Watcher;
    schedules: SchedulesWatcher;
};

/** The words a thrown value gives a log line. */
export function reasonOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** The inputs of the rebuilder: the parts, how each is started, and the machine's values. */
export type RebuildDeps = {
    owned: () => Parts;
    starters: Record<WatcherName, (held: Parts) => void>;
    local: LocalConfig;
};

/**
 * The function that builds again the watchers `plan` names, each old one closed before its new one
 * starts. `previous` is the values the keys held before the change. A watcher that cannot be built
 * from the new value of a key says so once, naming the key, and the key goes back to the value in
 * force: every watcher built from it is built again from that value, and the watchers of the other
 * keys go on.
 */
export function createRebuild(
    deps: RebuildDeps
): (plan: Record<WatcherName, boolean>, previous?: LocalConfig) => void {
    const { local } = deps;

    /** Build one watcher; the reason it could not be built, or null after it was. */
    function tryStart(name: WatcherName): string | null {
        try {
            deps.starters[name](deps.owned());
            return null;
        } catch (error) {
            return reasonOf(error);
        }
    }

    return (plan, previous) => {
        const held = deps.owned();
        const closeAll = (names: Record<WatcherName, boolean>): void => {
            if (names.autofetch) held.autofetch.close();
            if (names.git) held.git.close();
            if (names.usage) held.usage.close();
            if (names.usageRefresh) held.usageRefresh.close();
            if (names.sessions) held.sessions.close();
            if (names.portfolio) held.portfolio.close();
            if (names.bookmarks) held.bookmarks.close();
            if (names.schedules) held.schedules.close();
        };
        closeAll(plan);
        const kept = new Set<keyof LocalConfig>();
        for (const name of WATCHERS) {
            if (!plan[name]) continue;
            const reason = tryStart(name);
            if (reason === null) continue;
            const keys = keysBuilding(name)
                .filter(isLocalKey)
                .filter(
                    (key) => previous !== undefined && !isDeepStrictEqual(local[key], previous[key])
                );
            console.error(
                `local.yml: ${keys.join(', ') || name} cannot be applied, the ${name} watcher cannot be built from it (${reason}); the value in force stays`
            );
            for (const key of keys) kept.add(key);
        }
        if (previous === undefined || kept.size === 0) return;
        for (const key of kept) {
            if (previous[key] === undefined) Reflect.deleteProperty(local, key);
            else Reflect.set(local, key, previous[key]);
        }
        const again = rebuiltBy([...kept]);
        closeAll(again);
        for (const name of WATCHERS) {
            if (!again[name]) continue;
            const reason = tryStart(name);
            if (reason !== null) {
                console.error(`local.yml: the ${name} watcher cannot be built (${reason})`);
            }
        }
    };
}
