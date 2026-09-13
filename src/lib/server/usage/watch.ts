// Layer 2, server. Watch usage snapshots and session changes, debounce one rebuild, and publish the complete usage channel.
// Claude status folders are watched here. Codex rollout changes, including new day folders, reach this watcher through the sessions watcher's onSessionsChange signal.

import { mkdirSync, watch } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { UsageAccountConfig, UsagePayload } from '../../data/model.ts';
import type { Hub } from '../channels.ts';
import { onSessionsChange } from '../watch/sessions.ts';
import { claudeAccountFile, defaultUsageRoot, usageAccounts, type UsageTiers } from './accounts.ts';
import { UsageTranscriptFold } from './transcripts.ts';

export const USAGE_DEBOUNCE = 500;
/** A quiet hour still moves the reset durations and the live cutoff, so the payload is rebuilt on a clock too. */
export const USAGE_INTERVAL = 60_000;

export type UsageWatchOptions = {
    accounts: UsageAccountConfig[];
    tiers: UsageTiers;
    usageRoot?: string;
    debounce?: number;
    now?: () => number;
    fold?: UsageTranscriptFold;
    /** Milliseconds between clock-driven rebuilds; the debounce coalesces one with a file event. */
    interval?: number;
    /** Folder watcher override for tests; production uses node:fs watch. */
    watchFolder?: (
        folder: string,
        changed: (filename: string | Buffer | null) => void
    ) => { close(): void };
};
export type UsageWatcher = { refresh(): Promise<void>; close(): void };

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** The Usage watcher reads all sources as one snapshot and uses the sessions watcher's change signal for transcripts. */
export function watchUsage(hub: Hub, options: UsageWatchOptions): UsageWatcher {
    const debounce = options.debounce ?? USAGE_DEBOUNCE;
    const interval = options.interval ?? USAGE_INTERVAL;
    const now = options.now ?? Date.now;
    const usageRoot = options.usageRoot ?? defaultUsageRoot();
    const fold = options.fold ?? new UsageTranscriptFold();
    const watchFolder =
        options.watchFolder ??
        ((folder: string, changed: (filename: string | Buffer | null) => void) =>
            watch(folder, { recursive: false }, (_event, filename) => changed(filename)));
    const handles: { close(): void }[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    let pending = Promise.resolve();

    const build = async (): Promise<void> => {
        if (closed) return;
        const at = now();
        const daily = await fold.fold(options.accounts, at);
        const payload: UsagePayload = {
            accounts: usageAccounts(options.accounts, options.tiers, usageRoot, at),
            days: daily.rows,
            builtAt: new Date(at).toISOString()
        };
        hub.publish('usage', payload);
    };

    const refresh = (): Promise<void> => {
        pending = pending.then(build, build);
        return pending;
    };

    const queue = (): void => {
        if (closed) return;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            void refresh();
        }, debounce);
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

    const offSessions = onSessionsChange(queue);
    const clock = setInterval(queue, interval);
    clock.unref();
    void refresh();
    return {
        refresh,
        close(): void {
            closed = true;
            offSessions();
            clearInterval(clock);
            if (timer !== null) clearTimeout(timer);
            timer = null;
            for (const handle of handles) handle.close();
            handles.length = 0;
        }
    };
}
