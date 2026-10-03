// Layer 2, server. One short-lived tmux session per Claude account and per refresh asks Claude Code
// for its usage figures: started, sent /usage, read and killed, so nothing stays resident between
// ticks. A serialized queue per account keeps a route request and a scheduled tick from
// overlapping.

import { setTimeout as delay } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util';
import { z } from 'zod';
import type { UsageAccountConfig, UsageRefresher } from '../../../data/model/index.ts';
import { CADENCE_WORDS, cadenceShape, usageAccountLabel } from '../../../data/sources/config.ts';
import { sendKeysArgs, startArgs, USAGE_PREFIX, type Runner } from '../pty/sessions.ts';
import { shellWord } from '../pty/shell-word.ts';
import { run } from '../pty/tmux.ts';
import { claudeUsageFetchedAt, isDefaultClaudeDir } from './accounts.ts';

export const USAGE_WAIT_MS = 15_000;
export const USAGE_POLL_MS = 250;
/**
 * How long after the sheet shows the account file is given to move before the refresh counts as not
 * renewed.
 */
export const USAGE_RENEW_WAIT_MS = 3_000;
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
    /**
     * Take a new period and model, checked as the start checks them. A new period moves the next
     * refresh to the sooner of the one waiting and the new period from now; a new model is used
     * from the next session started, and a session already started keeps its own.
     */
    set(settings: { refreshMin: number; model: string }): void;
    state: (account: UsageAccountConfig) => UsageRefresher;
    close(): void;
};

function iso(now: () => number): string {
    return new Date(now()).toISOString();
}

/**
 * The tmux name of one account's refresh session; the same name every tick, so a leftover is found.
 */
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

/**
 * Claude Code draws its footer under the prompt, so the prompt is one of the last lines, not the
 * last.
 */
export const PROMPT_TAIL_LINES = 8;

export function hasPrompt(screen: string): boolean {
    const tail = stripVTControlCharacters(screen)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-PROMPT_TAIL_LINES);
    return tail.some((line) => /^(?:\u276f|>)(?:\s|$)/.test(line));
}

/**
 * The usage sheet /usage opens. Its words prove the command ran even when the account file stays
 * put: Claude Code rewrites cachedUsageUtilization only once the cached one is five minutes old, so
 * a refresh inside that window changes no file and the figures stay the cached ones.
 */
export function sheetShown(screen: string): boolean {
    return /current week/i.test(stripVTControlCharacters(screen));
}

export function paneReason(screen: string): UsageRefreshReason {
    // A message on the screen names the cause even when a prompt follows it.
    const text = stripVTControlCharacters(screen).toLowerCase();
    if (/log[ -]?in|authenticate|authentication/.test(text)) return 'login_required';
    if (/usage limit|rate limit|limit reached|reached your .*limit/.test(text)) {
        return 'usage_limit';
    }
    if (/offline|no internet|network|connection|connect to/.test(text)) return 'offline';
    return hasPrompt(screen) ? 'refresh_failed' : 'prompt_missing';
}

/**
 * The two settings the refresher cannot run without: a cadence of 1 to 35791 minutes and a model
 * with a name, taken as unknown values from the merged configuration.
 */
const refreshSettingsShape = z.object({
    refreshMin: cadenceShape,
    model: z.string().refine((name) => name.trim() !== '')
}) satisfies z.ZodType<{ refreshMin: number; model: string }>;

/**
 * The two settings, typed, or the throw naming the first that is wrong. It is the one place the
 * two checks are made: the config-key writer hands it what the merged configuration holds, and the
 * server context hands it the configuration it starts the refresher with.
 */
export function requireRefreshSettings(settings: { refreshMin: unknown; model: unknown }): {
    refreshMin: number;
    model: string;
} {
    const refreshMin = refreshSettingsShape.shape.refreshMin.safeParse(settings.refreshMin);
    if (!refreshMin.success) {
        throw new Error(`config/behavior.yml: usage_refresh_min must be ${CADENCE_WORDS}`);
    }
    const model = refreshSettingsShape.shape.model.safeParse(settings.model);
    if (!model.success) throw new Error('usage_refresh_model must not be empty');
    return { refreshMin: refreshMin.data, model: model.data };
}

/**
 * Start the per-account queues and the configured cadence. Every tick starts and kills its own
 * session.
 */
export function watchUsageRefresh(options: UsageRefreshOptions): UsageRefreshWatcher {
    let settings = requireRefreshSettings(options);
    const accounts = options.accounts.filter((account) => account.tool === 'claude');
    const exec = options.run ?? run;
    const now = options.now ?? Date.now;
    const pause = options.pause ?? delay;
    const onChange =
        options.onChange ??
        (() => {
            // A caller that wants no notice of a state change passes no onChange.
        });
    const held = new Map<string, UsageRefresher>();
    const down = new Map<string, { reason: string; since: string }>();
    const queues = new Map<string, Promise<void>>();
    let closed = false;

    for (const account of accounts) {
        held.set(account.dir, {
            state: 'refreshing',
            since: iso(now),
            reason: '',
            lastRefresh: '',
            renewed: false
        });
    }

    const publish = (
        account: UsageAccountConfig,
        state: UsageRefresher['state'],
        reason: string,
        lastRefresh?: string,
        renewed?: boolean
    ): void => {
        const previous = held.get(account.dir);
        let since =
            previous?.state === state && previous.reason === reason ? previous.since : iso(now);
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
            since,
            lastRefresh: lastRefresh ?? previous?.lastRefresh ?? '',
            renewed: renewed ?? previous?.renewed ?? false
        });
        onChange();
    };

    const stop = async (account: UsageAccountConfig): Promise<void> => {
        try {
            await exec(['kill-session', '-t', usageSessionName(account)]);
        } catch {
            // No session of that name is the usual case; a tick leaves none behind.
        }
    };

    const start = async (account: UsageAccountConfig): Promise<boolean> => {
        publish(account, 'refreshing', '');
        try {
            await exec(usageStartArgs(account, options.hub, options.claudeBin, settings.model));
            return true;
        } catch {
            publish(account, 'down', 'start_failed');
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

    /**
     * One refresh: a session started, the prompt awaited, /usage sent, the result read, the session
     * killed.
     */
    const one = async (account: UsageAccountConfig): Promise<void> => {
        if (closed) return;
        // A session of this name left by a crash or an earlier server is never reused.
        await stop(account);
        if (!(await start(account))) return;
        try {
            const id = `usage-${usageAccountLabel(account.label)}`;
            // Keys typed before the prompt is up are lost, so a session is given time to show it.
            const ready = await promptShown(account);
            if (ready !== true) {
                await stop(account);
                if (ready === false) publish(account, 'down', paneReason(lastScreen));
                return;
            }
            const sent = now();
            await exec(sendKeysArgs(id, { literal: '/usage' }));
            await exec(sendKeysArgs(id, { key: 'Enter' }));
            const fresh = await refreshed(account, sent);
            await stop(account);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- close() sets the flag from another closure, which the checker's flow analysis of this one does not see
            if (closed) return;
            if (!fresh) {
                publish(account, 'down', paneReason(lastScreen));
                return;
            }
            // The sheet shows a moment before Claude Code writes the file, so the file is given a
            // short grace before the refresh is called one that renewed nothing.
            const moved = (): boolean => {
                const fetched = claudeUsageFetchedAt(account.dir);
                return fetched !== null && fetched > sent;
            };
            let renewed = moved();
            const grace = now() + USAGE_RENEW_WAIT_MS;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- close() sets the flag from another closure, which the checker's flow analysis of this one does not see
            while (!renewed && !closed && now() < grace) {
                await pause(Math.min(USAGE_POLL_MS, grace - now()));
                renewed = moved();
            }
            publish(account, 'running', '', iso(now), renewed);
        } catch {
            await stop(account);
            publish(account, 'down', 'refresh_failed');
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

    /** The refresh waiting, one at a time, and when it runs. */
    let clock: ReturnType<typeof setTimeout> | null = null;
    let clockAt = 0;
    const arm = (at: number): void => {
        if (clock !== null) clearTimeout(clock);
        clockAt = at;
        clock = setTimeout(
            () => {
                arm(Date.now() + settings.refreshMin * 60_000);
                void refreshAll();
            },
            Math.max(0, at - Date.now())
        );
        clock.unref();
    };
    arm(Date.now() + settings.refreshMin * 60_000);
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
        set(next): void {
            if (closed) return;
            const checked = requireRefreshSettings(next);
            const changed = checked.refreshMin !== settings.refreshMin;
            settings = checked;
            if (changed) arm(Math.min(clockAt, Date.now() + checked.refreshMin * 60_000));
        },
        state(account: UsageAccountConfig): UsageRefresher {
            const state = held.get(account.dir);
            if (state === undefined) {
                return {
                    state: 'down',
                    since: iso(now),
                    reason: 'start_failed',
                    lastRefresh: '',
                    renewed: false
                };
            }
            return { ...state };
        },
        close(): void {
            closed = true;
            if (clock !== null) clearTimeout(clock);
            clock = null;
        }
    };
}
