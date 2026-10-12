// Layer 2, server. Read the five safe Claude account fields, Claude status-line snapshots, and
// Codex rollout rate windows.

import {
    closeSync,
    fstatSync,
    openSync,
    readFileSync,
    readdirSync,
    readSync,
    realpathSync,
    statSync
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { z } from 'zod';
import type {
    UsageAccount,
    UsageAccountConfig,
    UsageLiveSession,
    UsageRefresher,
    UsageWindow
} from '../../../data/model/index.ts';
import { hubMark } from '../../../data/accounts/connect.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { mapShape } from '../../../data/shapes/shapes.ts';
import { codexRollouts } from '../../transcripts/stores.ts';
import { USAGE_PREFIX } from '../pty/sessions.ts';

export type UsageTiers = Record<string, string>;
export type ClaudeUsageCache = { fetchedAt: string; windows: UsageWindow[] };
export type ClaudeStatusSnapshot = {
    data: Record<string, unknown> | null;
    observedAt: string;
};

/** The JSON a file holds, or null for a file that is missing or is not JSON. */
function jsonFile(path: string): unknown {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as unknown;
    } catch {
        return null;
    }
}

/** The JSON object a file holds, or null for a file that is missing, not JSON or no object. */
function jsonMap(path: string): Record<string, unknown> | null {
    const value = jsonFile(path);
    return isMap(value) ? value : null;
}

/** A text field: a string as it is, and the empty text for anything else. */
const textShape = z.string().catch('');

/** A number field: a finite number, and null for anything else, `NaN` and infinity included. */
const finiteShape = z.number().nullable().catch(null);

/** A map of any content, answered as it came, and nothing for a value that is no map. */
const heldMapShape = mapShape.optional().catch(undefined);

/**
 * A nested map whose fields all take a default: a value that is no map reads as a map with every
 * field defaulted.
 */
function nested<T extends z.ZodObject>(shape: T) {
    return shape.catch(() => shape.parse({}));
}

function unixSeconds(value: string): number | null {
    const milliseconds = Date.parse(value);
    return Number.isFinite(milliseconds) ? milliseconds / 1000 : null;
}

function tierLabel(tier: string, tiers: UsageTiers): string {
    return tiers[tier] ?? tier;
}

/**
 * Whether a folder is Claude Code's default one, whose account file sits beside it in the home
 * folder.
 */
export function isDefaultClaudeDir(dir: string): boolean {
    try {
        return realpathSync(dir) === realpathSync(join(homedir(), '.claude'));
    } catch {
        // An unresolved folder has no established home-folder identity.
        return false;
    }
}

export function claudeAccountFile(dir: string): string {
    return isDefaultClaudeDir(dir) ? join(homedir(), '.claude.json') : join(dir, '.claude.json');
}

/** The five fields of `oauthAccount` this module reads; nothing else of the account is. */
const oauthShape = z.object({
    emailAddress: textShape,
    organizationName: textShape,
    organizationRateLimitTier: textShape,
    billingType: textShape,
    subscriptionCreatedAt: textShape
});

/**
 * One entry of the cached utilization's limit list. A figure that is no finite number reads as
 * null and a `resets_at` that is no text as the empty text, so the entry is dropped by the window
 * reader; the kind is compared with a word and read as it came.
 */
const cachedLimitShape = z.object({
    kind: z.unknown().optional(),
    percent: finiteShape,
    resets_at: textShape,
    severity: z.enum(['normal', 'warning', 'critical']).optional().catch(undefined),
    is_active: z.boolean().catch(false),
    scope: z
        .object({
            model: z.object({ display_name: textShape }).optional().catch(undefined)
        })
        .optional()
        .catch(undefined)
});

/** `cachedUsageUtilization` of Claude's account file: when it was fetched and its limit list. */
const cachedUsageShape = z.object({
    fetchedAtMs: finiteShape,
    utilization: z
        .object({ limits: z.array(z.unknown()).catch(() => []) })
        .catch(() => ({ limits: [] }))
});

/** The two parts of Claude's account file this module reads, each defaulted when it is odd. */
const claudeFileShape = z.object({
    oauthAccount: nested(oauthShape),
    cachedUsageUtilization: nested(cachedUsageShape)
});

/** Claude's account file read through its shape, and a file with nothing in it for any other. */
function claudeFile(dir: string): z.output<typeof claudeFileShape> {
    const parsed = claudeFileShape.safeParse(jsonFile(claudeAccountFile(dir)));
    return parsed.success ? parsed.data : claudeFileShape.parse({});
}

/** Read only oauthAccount's five approved identity and subscription fields. */
export function claudeAccount(dir: string): Record<string, string> {
    const oauth = claudeFile(dir).oauthAccount;
    return {
        email: oauth.emailAddress,
        organisation: oauth.organizationName,
        tier: oauth.organizationRateLimitTier,
        billing: oauth.billingType,
        subscriptionCreatedAt: oauth.subscriptionCreatedAt
    };
}

/** Read only the fetch timestamp for the refresher's account-file polling. */
export function claudeUsageFetchedAt(dir: string): number | null {
    return claudeFile(dir).cachedUsageUtilization.fetchedAtMs;
}

/** Read Claude Code's cached utilization observation without exposing other account-file data. */
export function claudeCachedUsage(dir: string): ClaudeUsageCache {
    const cache = claudeFile(dir).cachedUsageUtilization;
    const fetchedAtMs = cache.fetchedAtMs;
    // A value outside what Date can hold would throw in toISOString.
    const fetchedAt =
        fetchedAtMs === null || Math.abs(fetchedAtMs) > 8.64e15
            ? ''
            : new Date(fetchedAtMs).toISOString();
    const windows: UsageWindow[] = [];

    for (const entry of cache.utilization.limits) {
        const candidate = cachedLimitShape.safeParse(entry);
        if (!candidate.success) continue;
        const limit = candidate.data;
        const usedPercent = limit.percent;
        const resetsAt = unixSeconds(limit.resets_at);
        if (usedPercent === null || resetsAt === null) continue;
        const common = {
            usedPercent,
            resetsAt,
            severity: limit.severity,
            active: limit.is_active,
            observedAt: fetchedAt
        };
        if (limit.kind === 'session') {
            windows.push({ name: 'five_hour', windowMinutes: 300, ...common });
        } else if (limit.kind === 'weekly_all') {
            windows.push({ name: 'seven_day', windowMinutes: 10080, ...common });
        } else if (limit.kind === 'weekly_scoped') {
            const model = limit.scope?.model?.display_name ?? '';
            if (model !== '') {
                windows.push({
                    name: 'weekly_model',
                    model,
                    windowMinutes: 10080,
                    ...common
                });
            }
        }
    }
    return { fetchedAt, windows };
}

export function defaultUsageRoot(): string {
    return join(homedir(), '.oculus', 'usage', 'claude');
}

/** One window of a status file's `rate_limits`: a window with a figure missing or odd has none. */
const statusWindowShape = z
    .object({ used_percentage: z.number(), resets_at: z.number() })
    .optional()
    .catch(undefined);

/**
 * The parts of a status file this module reads: its two rate-limit windows and the live session it
 * describes. A part of the wrong type reads as absent, and a file that is no map is refused.
 */
const claudeStatusShape = z.object({
    rate_limits: z
        .object({ five_hour: statusWindowShape, seven_day: statusWindowShape })
        .optional()
        .catch(undefined),
    session_name: textShape,
    session_id: textShape,
    model: z.object({ display_name: textShape, id: textShape }).optional().catch(undefined),
    context_window: z.object({ used_percentage: finiteShape }).optional().catch(undefined),
    cost: z.object({ total_cost_usd: finiteShape }).optional().catch(undefined),
    cwd: textShape
});

function claudeWindows(data: Record<string, unknown>, observedAt: string): UsageWindow[] {
    const status = claudeStatusShape.safeParse(data);
    if (!status.success) return [];
    const limits = status.data.rate_limits;
    const rows: UsageWindow[] = [];
    const five = limits?.five_hour;
    if (five !== undefined) {
        rows.push({
            name: 'five_hour',
            usedPercent: five.used_percentage,
            resetsAt: five.resets_at,
            windowMinutes: 300,
            observedAt
        });
    }
    const seven = limits?.seven_day;
    if (seven !== undefined) {
        rows.push({
            name: 'seven_day',
            usedPercent: seven.used_percentage,
            resetsAt: seven.resets_at,
            windowMinutes: 10080,
            observedAt
        });
    }
    return rows;
}

/**
 * Each status file carries the windows as they stood at that session's last response, so the file
 * written last is not the freshest observation: an idle session rewrites its stale snapshot when
 * the settings change. Within one window (the same resets_at) usage only rises, so the highest
 * percentage is the latest observation; a later resets_at is a newer window altogether.
 */
export function latestWindows(snapshots: ClaudeStatusSnapshot[]): UsageWindow[] {
    const best = new Map<UsageWindow['name'], UsageWindow>();
    for (const snapshot of snapshots) {
        if (snapshot.data === null) continue;
        for (const window of claudeWindows(snapshot.data, snapshot.observedAt)) {
            const held = best.get(window.name);
            if (
                held === undefined ||
                window.resetsAt > held.resetsAt ||
                (window.resetsAt === held.resetsAt && window.usedPercent > held.usedPercent)
            ) {
                best.set(window.name, window);
            }
        }
    }
    return [...best.values()];
}

function observedTime(window: UsageWindow): number {
    const milliseconds = Date.parse(window.observedAt);
    return Number.isFinite(milliseconds) ? milliseconds : Number.NEGATIVE_INFINITY;
}

/** Merge cached bars with status-line fallbacks, choosing the cache when observations tie. */
export function mergeClaudeWindows(cached: UsageWindow[], status: UsageWindow[]): UsageWindow[] {
    const merged: UsageWindow[] = [];
    for (const name of ['five_hour', 'seven_day'] as const) {
        const fromCache = cached.find((window) => window.name === name);
        const fromStatus = status.find((window) => window.name === name);
        if (fromCache !== undefined && fromStatus !== undefined) {
            merged.push(
                observedTime(fromCache) >= observedTime(fromStatus) ? fromCache : fromStatus
            );
        } else if (fromCache !== undefined) {
            merged.push(fromCache);
        } else if (fromStatus !== undefined) {
            merged.push(fromStatus);
        } else if (name === 'five_hour') {
            merged.push({
                name: 'five_hour',
                usedPercent: 0,
                resetsAt: 0,
                windowMinutes: 300,
                observedAt: ''
            });
        }
    }
    return [...merged, ...cached.filter((window) => window.name === 'weekly_model')];
}

function statusFiles(dir: string): { path: string; mtimeMs: number }[] {
    try {
        return readdirSync(dir)
            .filter((name) => name.endsWith('.json'))
            .flatMap((name) => {
                const path = join(dir, name);
                try {
                    return [{ path, mtimeMs: statSync(path).mtimeMs }];
                } catch {
                    return [];
                }
            })
            .sort((left, right) => right.mtimeMs - left.mtimeMs);
    } catch {
        return [];
    }
}

function liveClaude(path: string, mtimeMs: number): UsageLiveSession | null {
    const parsed = claudeStatusShape.safeParse(jsonFile(path));
    if (!parsed.success) return null;
    const data = parsed.data;
    if (data.session_name.startsWith(USAGE_PREFIX)) return null;
    const model = data.model === undefined ? '' : data.model.display_name || data.model.id;
    return {
        sessionId: data.session_id || basename(path, '.json'),
        model,
        contextPercent: data.context_window?.used_percentage ?? null,
        costUsd: data.cost?.total_cost_usd ?? null,
        updatedAt: new Date(mtimeMs).toISOString(),
        cwd: data.cwd
    };
}

function claudeUsage(
    account: UsageAccountConfig,
    tiers: UsageTiers,
    usageRoot: string,
    now: number,
    refresherFor?: (account: UsageAccountConfig) => UsageRefresher
): UsageAccount {
    const identity = claudeAccount(account.dir);
    const cached = claudeCachedUsage(account.dir);
    const files = statusFiles(join(usageRoot, basename(account.dir)));
    const live = files
        .filter((file) => now - file.mtimeMs <= 60 * 60 * 1000)
        .map((file) => liveClaude(file.path, file.mtimeMs))
        .filter((row): row is UsageLiveSession => row !== null);
    const refresher = refresherFor?.(account);
    return {
        tool: account.tool,
        label: account.label,
        ...hubMark(account),
        dir: account.dir,
        email: identity.email,
        organisation: identity.organisation,
        tier: identity.tier,
        tierLabel: tierLabel(identity.tier, tiers),
        billing: identity.billing,
        fetchedAt: cached.fetchedAt,
        windows: mergeClaudeWindows(
            cached.windows,
            latestWindows(
                files.map((file) => ({
                    data: jsonMap(file.path),
                    observedAt: new Date(file.mtimeMs).toISOString()
                }))
            )
        ),
        live,
        ...(refresher === undefined ? {} : { refresher })
    };
}

/**
 * The three places a rollout record may carry `rate_limits`: at its top, under `payload`, and under
 * `payload.info`. Each is answered as the record holds it, and one that is no map reads as absent.
 */
const rolloutRecordShape = z.object({
    rate_limits: heldMapShape,
    payload: z
        .object({
            rate_limits: heldMapShape,
            info: z.object({ rate_limits: heldMapShape }).optional().catch(undefined)
        })
        .optional()
        .catch(undefined)
});

/** The rate limits of one rollout record, nearest the top first, or null when it holds none. */
function rateLimits(record: unknown): Record<string, unknown> | null {
    const parsed = rolloutRecordShape.safeParse(record);
    if (!parsed.success) return null;
    const { rate_limits: top, payload } = parsed.data;
    return top ?? payload?.rate_limits ?? payload?.info?.rate_limits ?? null;
}

/**
 * How much of the newest rollout's end is read for its last rate-limit event; a tool result can be
 * large.
 */
export const CODEX_TAIL_BYTES = 4 * 1024 * 1024;

/**
 * Read at most the last tailBytes, retaining only complete JSON records at the leading boundary.
 */
function rolloutTail(path: string, tailBytes: number): string[] {
    const handle = openSync(path, 'r');
    try {
        const size = fstatSync(handle).size;
        const start = Math.max(0, size - tailBytes);
        const buffer = Buffer.alloc(size - start);
        let read = 0;
        while (read < buffer.length) {
            const got = readSync(handle, buffer, read, buffer.length - read, start + read);
            if (got === 0) break;
            read += got;
        }
        return buffer.subarray(0, read).toString('utf8').split('\n');
    } finally {
        closeSync(handle);
    }
}

/**
 * The limit id Codex gives the account's own bucket; a model family with a bucket of its own
 * carries another id.
 */
export const CODEX_ACCOUNT_LIMIT = 'codex';

/** How many of the newest rollouts are read for a rate-limit event before the search gives up. */
export const CODEX_ROLLOUTS_READ = 12;

/** The last rate_limits object in one rollout's tail, or null when the tail holds none. */
function lastRateLimits(path: string, tailBytes: number): Record<string, unknown> | null {
    try {
        const lines = rolloutTail(path, tailBytes);
        for (let at = lines.length - 1; at >= 0; at -= 1) {
            if (lines[at].trim() === '') continue;
            let record: unknown;
            try {
                record = JSON.parse(lines[at]) as unknown;
            } catch {
                continue;
            }
            const found = rateLimits(record);
            if (found !== null) return found;
        }
    } catch {
        return null;
    }
    return null;
}

/**
 * The account's freshest rate limits: the newest rollouts are read newest first, and the first
 * rate_limits whose id is the account's own bucket wins. A session on a model family with a bucket
 * of its own (its limit id names the family) reports that bucket, not the account's, so the newest
 * file alone is the wrong answer whenever such a session was the last to write. When no rollout
 * names the account's bucket, the newest rate limits of any kind stand in.
 */
export function newestCodexLimits(
    dir: string,
    tailBytes: number = CODEX_TAIL_BYTES,
    maxFiles: number = CODEX_ROLLOUTS_READ
): Record<string, unknown> | null {
    let fallback: Record<string, unknown> | null = null;
    for (const rollout of codexRollouts(join(dir, 'sessions'), 0, maxFiles)) {
        const found = lastRateLimits(rollout.path, tailBytes);
        if (found === null) continue;
        const id = found.limit_id;
        if (id === CODEX_ACCOUNT_LIMIT || id === undefined || id === null) return found;
        fallback ??= found;
    }
    return fallback;
}

/** One window of a rollout's rate limits: a window with a figure missing or odd has none. */
const codexWindowShape = z
    .object({ used_percent: z.number(), resets_at: z.number(), window_minutes: z.number() })
    .optional()
    .catch(undefined);

/** The plan and the two windows of a rollout's rate limits. */
const codexLimitsShape = z.object({
    plan_type: textShape,
    primary: codexWindowShape,
    secondary: codexWindowShape
});

function codexWindows(limits: z.output<typeof codexLimitsShape>): UsageWindow[] {
    const rows: UsageWindow[] = [];
    for (const name of ['primary', 'secondary'] as const) {
        const value = limits[name];
        if (value === undefined) continue;
        rows.push({
            name,
            usedPercent: value.used_percent,
            resetsAt: value.resets_at,
            windowMinutes: value.window_minutes,
            observedAt: ''
        });
    }
    return rows;
}

function codexUsage(account: UsageAccountConfig, tiers: UsageTiers): UsageAccount {
    const parsed = codexLimitsShape.safeParse(newestCodexLimits(account.dir));
    const limits = parsed.success ? parsed.data : codexLimitsShape.parse({});
    const tier = limits.plan_type;
    return {
        tool: account.tool,
        label: account.label,
        ...hubMark(account),
        dir: account.dir,
        email: '',
        organisation: '',
        tier,
        tierLabel: tierLabel(tier, tiers),
        billing: '',
        windows: codexWindows(limits),
        live: []
    };
}

export function usageAccounts(
    accounts: UsageAccountConfig[],
    tiers: UsageTiers,
    usageRoot: string = defaultUsageRoot(),
    now: number = Date.now(),
    refresherFor?: (account: UsageAccountConfig) => UsageRefresher
): UsageAccount[] {
    return accounts.map((account) =>
        account.tool === 'claude'
            ? claudeUsage(account, tiers, usageRoot, now, refresherFor)
            : codexUsage(account, tiers)
    );
}
