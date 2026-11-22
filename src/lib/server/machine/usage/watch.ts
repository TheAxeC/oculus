// Layer 2, server. Watch usage snapshots and session changes, debounce one rebuild, and publish the
// complete usage channel. Claude status folders are watched here. The owning context injects its
// session watcher signal for Codex rollout changes.
//
// The debounce is lodash's, with a quiet (USAGE_DEBOUNCE) and a maximum wait (USAGE_MAX_WAIT) so a
// source written more often than the quiet is still rebuilt. It is handed a function that starts
// the rebuild and returns at once, since lodash does not wait on a promise. The fold of a rebuild
// runs in a worker thread held here (machine/threads/held.ts), and the accounts are read and the
// payload published on the server's thread when it has answered. At most one rebuild runs and one
// waits, which every refresh in that time joins, so a fold slower than the maximum wait under
// steady writes leaves one rebuild queued, built from what is on disk when it starts, not one per
// maximum wait.

import { mkdirSync, watch } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { debounce as debounced } from 'lodash-es';
import type {
    UsageAccountConfig,
    UsagePayload,
    UsageRefresher
} from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import { ownFolder } from '../lsp/servers.ts';
import { HeldWorker } from '../threads/held.ts';
import { claudeAccountFile, defaultUsageRoot, usageAccounts, type UsageTiers } from './accounts.ts';
import type { FoldAsk, UsageFold } from './transcripts.ts';

/** Milliseconds of quiet after the last change before one rebuild starts. */
export const USAGE_DEBOUNCE = 500;
/**
 * Milliseconds the first change of a burst waits at most for its rebuild, however often changes
 * keep coming. Each change restarts the quiet, so a transcript or a status folder written more
 * often than the quiet would otherwise hold the usage channel back for as long as it is written.
 */
export const USAGE_MAX_WAIT = 2 * USAGE_DEBOUNCE;
/**
 * A quiet hour still moves the reset durations and the live cutoff, so the payload is rebuilt on a
 * clock too.
 */
export const USAGE_INTERVAL = 60_000;

export type UsageWatchOptions = {
    accounts: UsageAccountConfig[];
    tiers: UsageTiers;
    usageRoot?: string;
    debounce?: number;
    now?: () => number;
    /** The hidden Claude session state attached to each Claude account in the payload. */
    refresherFor?: (account: UsageAccountConfig) => UsageRefresher;
    /** Milliseconds between clock-driven rebuilds; the debounce coalesces one with a file event. */
    interval?: number;
    /** Folder watcher override for tests; production uses node:fs watch. */
    watchFolder?: (
        folder: string,
        changed: (filename: string | Buffer | null) => void
    ) => { close(): void };
    /** Subscribe to rescans from the sessions watcher owned by this context. */
    onSessionsChange?: (listener: () => void) => () => void;
};
export type UsageWatcher = {
    refresh(): Promise<void>;
    /** Take new plan labels; a changed map publishes the usage again with them. */
    setTiers(tiers: Record<string, string>): void;
    close(): void;
};

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Whether two maps of plan id to label hold the same labels. */
function sameTiers(one: Record<string, string>, two: Record<string, string>): boolean {
    const ids = Object.keys(one);
    return ids.length === Object.keys(two).length && ids.every((id) => one[id] === two[id]);
}

/**
 * The Usage watcher reads all sources as one snapshot and uses the sessions watcher's change signal
 * for transcripts.
 */
export function watchUsage(hub: Hub, options: UsageWatchOptions): UsageWatcher {
    const debounce = options.debounce ?? USAGE_DEBOUNCE;
    const interval = options.interval ?? USAGE_INTERVAL;
    const now = options.now ?? Date.now;
    const usageRoot = options.usageRoot ?? defaultUsageRoot();
    const watchFolder =
        options.watchFolder ??
        ((folder: string, changed: (filename: string | Buffer | null) => void) =>
            watch(folder, { recursive: false }, (_event, filename) => changed(filename)));
    let tiers = options.tiers;
    const handles: { close(): void }[] = [];
    let closed = false;
    /** The moment of the rebuild that runs. */
    let at = 0;

    const folds = new HeldWorker<'fold', FoldAsk, UsageFold>({
        file: join(ownFolder(), 'src/lib/server/machine/usage/fold-worker.ts'),
        request: () => {
            at = now();
            return { accounts: options.accounts, now: at };
        },
        join: (waiting) => waiting,
        answered: (daily) => {
            const payload: UsagePayload = {
                accounts: usageAccounts(
                    options.accounts,
                    tiers,
                    usageRoot,
                    at,
                    options.refresherFor
                ),
                days: daily.rows,
                builtAt: new Date(at).toISOString()
            };
            hub.publish('usage', payload);
        },
        failed: (why) => console.error(`usage watch: cannot rebuild: ${why}`)
    });

    /**
     * Rebuild now when none runs, else with the one rebuild that waits for it; settles when that
     * rebuild has ended, whichever way.
     */
    const refresh = (): Promise<void> => folds.ask('fold');

    const queued = debounced(
        () => {
            void refresh();
        },
        debounce,
        { maxWait: USAGE_MAX_WAIT }
    );

    const queue = (): void => {
        if (closed) return;
        queued();
    };

    const open = (folder: string, changed: (filename: string | Buffer | null) => boolean): void => {
        try {
            handles.push(
                watchFolder(folder, (filename) => {
                    if (changed(filename)) queue();
                })
            );
        } catch (error) {
            console.error(`usage watch: cannot watch ${folder}: ${reason(error)}`);
        }
    };

    for (const account of options.accounts) {
        if (account.tool === 'claude') {
            const folder = join(usageRoot, basename(account.dir));
            try {
                mkdirSync(folder, { recursive: true });
                open(folder, () => true);
            } catch (error) {
                console.error(`usage watch: cannot create ${folder}: ${reason(error)}`);
            }
            const accountFile = claudeAccountFile(account.dir);
            open(dirname(accountFile), (filename) =>
                filename === null ? true : String(filename) === basename(accountFile)
            );
            continue;
        }
    }

    const offSessions =
        options.onSessionsChange?.(queue) ??
        (() => {
            // Nothing subscribed, so there is nothing to unsubscribe.
        });
    const clock = setInterval(queue, interval);
    clock.unref();
    void refresh();
    return {
        refresh,
        setTiers(next): void {
            if (closed || sameTiers(tiers, next)) return;
            tiers = { ...next };
            void refresh();
        },
        close(): void {
            closed = true;
            offSessions();
            clearInterval(clock);
            queued.cancel();
            folds.close();
            for (const handle of handles) handle.close();
            handles.length = 0;
        }
    };
}
