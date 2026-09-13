// Layer 2, server. One hidden tmux session per Claude account asks Claude Code to refresh its
// cached usage figures. Stable names let a restarted oculus process find the same sessions, while
// a serialized queue per account prevents a route request and a scheduled tick from duplicating it.

import type { UsageAccountConfig, UsageRefresher } from '../../data/model.ts';
import { usageAccountLabel } from '../../data/sources/config.ts';
import { sendKeysArgs, startArgs, USAGE_PREFIX, type Runner } from '../pty/sessions.ts';
import { run } from '../pty/tmux.ts';
import { claudeUsageFetchedAt, isDefaultClaudeDir } from './accounts.ts';

export const USAGE_WAIT_MS = 15_000;
export const USAGE_POLL_MS = 250;
/** How long a freshly started Claude Code may take to show its prompt before /usage is typed. */
export const USAGE_START_WAIT_MS = 30_000;
const COLS = 80;
const ROWS = 24;

export type UsageRefreshReason =
    | 'login_required'
    | 'usage_limit'
    | 'offline'
    | 'prompt_missing'
    | 'start_failed'
    | 'refresh_failed';

type HeldState = UsageRefresher & { restart: boolean };

export type UsageRefreshOptions = {
    accounts: UsageAccountConfig[];
    hub: string;
    claudeBin: string;
    model: string;
    refreshMin: number;
    run?: Runner;
    now?: () => number;
    pause?: (milliseconds: number) => Promise<void>;
    onChange?: () => void;
};

export type UsageRefreshWatcher = {
    ready: Promise<void>;
    refresh(label: string): Promise<boolean>;
    refreshAll(): Promise<void>;
    state(account: UsageAccountConfig): UsageRefresher;
    close(): void;
};

function iso(now: () => number): string {
    return new Date(now()).toISOString();
}

function shellWord(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}

/** The stable tmux name for one account's hidden refresher. */
export function usageSessionName(account: UsageAccountConfig): string {
    return `${USAGE_PREFIX}${usageAccountLabel(account.label)}`;
}

/** The exact detached tmux command that starts one account's Claude process. */
export function usageStartArgs(
    account: UsageAccountConfig,
    hub: string,
    claudeBin: string,
    model: string
): string[] {
    const id = `usage-${usageAccountLabel(account.label)}`;
    // Claude Code reads the default folder's account file from the home folder only when the
    // variable is unset; naming that folder through it starts first-run onboarding instead.
    const environment = isDefaultClaudeDir(account.dir)
        ? ['env', '-u', 'CLAUDE_CONFIG_DIR']
        : ['env', `CLAUDE_CONFIG_DIR=${account.dir}`];
    const command = [
        ...environment,
        claudeBin,
        '--model',
        model,
        '--name',
        usageSessionName(account)
    ]
        .map(shellWord)
        .join(' ');
    return startArgs(id, { kind: 'claude', cwd: hub, cols: COLS, rows: ROWS }, command);
}

function visibleCaptureArgs(account: UsageAccountConfig): string[] {
    return ['capture-pane', '-p', '-t', usageSessionName(account)];
}

function plain(screen: string): string {
    // eslint-disable-next-line no-control-regex
    return screen.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
}

/** Claude Code draws its footer under the prompt, so the prompt is one of the last lines, not the last. */
export const PROMPT_TAIL_LINES = 8;

export function hasPrompt(screen: string): boolean {
    const tail = plain(screen)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-PROMPT_TAIL_LINES);
    return tail.some((line) => /^(?:\u276f|>)(?:\s|$)/.test(line));
}

/**
 * The usage sheet /usage opens. Its words prove the command ran even when the account file stays
 * put: Claude Code 2.1.270 rewrites cachedUsageUtilization only once the cached one is five minutes
 * old (its constant zAs=300000 beside the writer), so a refresh inside that window changes no file.
 */
export function sheetShown(screen: string): boolean {
    return /current week/i.test(plain(screen));
}

export function paneReason(screen: string): UsageRefreshReason {
    // A message on the screen names the cause even when a prompt follows it.
    const text = plain(screen).toLowerCase();
    if (/log[ -]?in|authenticate|authentication/.test(text)) return 'login_required';
    if (/usage limit|rate limit|limit reached|reached your .*limit/.test(text)) {
        return 'usage_limit';
    }
    if (/offline|no internet|network|connection|connect to/.test(text)) return 'offline';
    return hasPrompt(screen) ? 'refresh_failed' : 'prompt_missing';
}

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Start the per-account queues and the configured cadence. Closing leaves tmux sessions alive. */
export function watchUsageRefresh(options: UsageRefreshOptions): UsageRefreshWatcher {
    if (!Number.isFinite(options.refreshMin) || options.refreshMin <= 0) {
        throw new Error('usage_refresh_min must be a positive number');
    }
    if (options.model.trim() === '') throw new Error('usage_refresh_model must not be empty');
    const accounts = options.accounts.filter((account) => account.tool === 'claude');
    const exec = options.run ?? run;
    const now = options.now ?? Date.now;
    const pause = options.pause ?? wait;
    const onChange = options.onChange ?? (() => {});
    const held = new Map<string, HeldState>();
    const down = new Map<string, { reason: string; since: string }>();
    const queues = new Map<string, Promise<void>>();
    let closed = false;

    for (const account of accounts) {
        held.set(account.dir, {
            state: 'restarting',
            since: iso(now),
            reason: '',
            lastRefresh: '',
            restart: false
        });
    }

    const publish = (
        account: UsageAccountConfig,
        state: UsageRefresher['state'],
        reason: string,
        restart: boolean,
        lastRefresh?: string
    ): void => {
        const previous = held.get(account.dir);
        const changed = previous?.state !== state || previous.reason !== reason;
        let since = changed || previous === undefined ? iso(now) : previous.since;
        if (state === 'down') {
            const outage = down.get(account.dir);
            if (outage?.reason === reason) since = outage.since;
            down.set(account.dir, { reason, since });
        } else if (state === 'running') {
            down.delete(account.dir);
        }
        held.set(account.dir, {
            state,
            reason,
            restart,
            since,
            lastRefresh: lastRefresh ?? previous?.lastRefresh ?? ''
        });
        onChange();
    };

    const exists = async (account: UsageAccountConfig): Promise<boolean> => {
        try {
            await exec(['has-session', '-t', usageSessionName(account)]);
            return true;
        } catch {
            return false;
        }
    };

    const stop = async (account: UsageAccountConfig): Promise<void> => {
        try {
            await exec(['kill-session', '-t', usageSessionName(account)]);
        } catch {
            // A session that disappeared between capture and kill is already stopped.
        }
    };

    const start = async (account: UsageAccountConfig): Promise<boolean> => {
        publish(account, 'restarting', '', false);
        try {
            await exec(usageStartArgs(account, options.hub, options.claudeBin, options.model));
            return true;
        } catch {
            publish(account, 'down', 'start_failed', true);
            return false;
        }
    };

    let lastScreen = '';
    const promptShown = async (account: UsageAccountConfig): Promise<boolean | null> => {
        const deadline = now() + USAGE_START_WAIT_MS;
        while (!closed) {
            lastScreen = await exec(visibleCaptureArgs(account));
            if (hasPrompt(lastScreen)) return true;
            const remaining = deadline - now();
            if (remaining <= 0) return false;
            await pause(Math.min(USAGE_POLL_MS, remaining));
        }
        return null;
    };

    const refreshed = async (account: UsageAccountConfig, sent: number): Promise<boolean> => {
        const deadline = now() + USAGE_WAIT_MS;
        while (!closed) {
            const fetched = claudeUsageFetchedAt(account.dir);
            if (fetched !== null && fetched > sent) return true;
            lastScreen = await exec(visibleCaptureArgs(account));
            if (sheetShown(lastScreen)) return true;
            const remaining = deadline - now();
            if (remaining <= 0) return false;
            await pause(Math.min(USAGE_POLL_MS, remaining));
        }
        return false;
    };

    const one = async (account: UsageAccountConfig): Promise<void> => {
        if (closed) return;
        const previous = held.get(account.dir);
        let present = await exists(account);
        if (present) {
            let dead = false;
            try {
                const screen = await exec(visibleCaptureArgs(account));
                dead = /(?:dead pane|pane (?:is )?dead)/i.test(plain(screen));
                // A retained dead pane may still show its old screen. Read tmux's own flag too.
                const flag = await exec([
                    'display-message',
                    '-p',
                    '-t',
                    usageSessionName(account),
                    '#{pane_dead}'
                ]);
                dead ||= flag.trim() === '1';
            } catch {
                dead = true;
            }
            if (previous?.restart === true || dead) {
                await stop(account);
                present = false;
            }
        }
        if (!present && !(await start(account))) return;
        try {
            const id = `usage-${usageAccountLabel(account.label)}`;
            // Keys typed before the prompt is up are lost, so a session is given time to show it.
            const ready = await promptShown(account);
            if (!ready) {
                await stop(account);
                publish(account, 'down', paneReason(ready === null ? '' : lastScreen), true);
                return;
            }
            const sent = now();
            await exec(sendKeysArgs(id, { literal: '/usage' }));
            await exec(sendKeysArgs(id, { key: 'Enter' }));
            const fresh = await refreshed(account, sent);
            await exec(sendKeysArgs(id, { key: 'Escape' }));
            if (closed) return;
            if (!fresh) {
                await stop(account);
                publish(account, 'down', paneReason(lastScreen), true);
                return;
            }
            // Escape closes the sheet; a prompt that does not come back is a session to replace.
            const back = await promptShown(account);
            if (back === null) return;
            if (!back) {
                await stop(account);
                publish(account, 'down', paneReason(lastScreen), true);
                return;
            }
            publish(account, 'running', '', false, iso(now));
        } catch {
            await stop(account);
            publish(account, 'down', 'refresh_failed', true);
        }
    };

    const enqueue = (account: UsageAccountConfig): Promise<void> => {
        const previous = queues.get(account.dir) ?? Promise.resolve();
        const next = previous.then(
            () => one(account),
            () => one(account)
        );
        queues.set(account.dir, next);
        return next;
    };

    const refreshAll = async (): Promise<void> => {
        await Promise.all(accounts.map(enqueue));
    };

    const milliseconds = options.refreshMin * 60_000;
    const clock = setInterval(() => void refreshAll(), milliseconds);
    clock.unref();
    const ready = refreshAll();

    return {
        ready,
        async refresh(label: string): Promise<boolean> {
            const matches = accounts.filter((account) => account.label === label);
            if (matches.length !== 1) return false;
            await enqueue(matches[0]);
            return true;
        },
        refreshAll,
        state(account: UsageAccountConfig): UsageRefresher {
            const state = held.get(account.dir);
            if (state === undefined) {
                return { state: 'down', since: iso(now), reason: 'start_failed', lastRefresh: '' };
            }
            return {
                state: state.state,
                since: state.since,
                reason: state.reason,
                lastRefresh: state.lastRefresh
            };
        },
        close(): void {
            closed = true;
            clearInterval(clock);
        }
    };
}

// The route is bundled separately from src/server.ts and the Vite plugin. The active refresher
// crosses those module graphs through one process-wide bridge, as the existing watcher bridges do.
type RefreshBridge = { watcher: UsageRefreshWatcher | null };

declare global {
    var __oculusUsageRefreshBridge: RefreshBridge | undefined;
}

function bridge(): RefreshBridge {
    globalThis.__oculusUsageRefreshBridge ??= { watcher: null };
    return globalThis.__oculusUsageRefreshBridge;
}

export function bindUsageRefresh(watcher: UsageRefreshWatcher | null): void {
    bridge().watcher = watcher;
}

export async function refreshUsage(label: string): Promise<boolean> {
    const watcher = bridge().watcher;
    return watcher === null ? false : watcher.refresh(label);
}
