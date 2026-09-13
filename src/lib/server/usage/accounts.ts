// Layer 2, server. Read the five safe Claude account fields, Claude status-line snapshots, and Codex rollout rate windows.

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
import type {
    UsageAccount,
    UsageAccountConfig,
    UsageLiveSession,
    UsageWindow
} from '../../data/model.ts';
import { isMap } from '../../data/guards.ts';
import { rollouts } from '../sessions/codex.ts';

export type UsageTiers = Record<string, string>;

function json(path: string): Record<string, unknown> | null {
    try {
        const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
        return isMap(value) ? value : null;
    } catch {
        return null;
    }
}

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function number(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function tierLabel(tier: string, tiers: UsageTiers): string {
    return tiers[tier] ?? tier;
}

/** The account file is beside ~/.claude, and inside every other Claude config folder. */
export function claudeAccountFile(dir: string): string {
    try {
        if (realpathSync(dir) === realpathSync(join(homedir(), '.claude'))) {
            return join(homedir(), '.claude.json');
        }
    } catch {
        // An unresolved folder has no established home-folder identity.
    }
    return join(dir, '.claude.json');
}

/** Read only oauthAccount's five approved identity and subscription fields. */
export function claudeAccount(dir: string): Record<string, string> {
    const root = json(claudeAccountFile(dir));
    const oauth = root !== null && isMap(root.oauthAccount) ? root.oauthAccount : {};
    return {
        email: text(oauth.emailAddress),
        organisation: text(oauth.organizationName),
        tier: text(oauth.organizationRateLimitTier),
        billing: text(oauth.billingType),
        subscriptionCreatedAt: text(oauth.subscriptionCreatedAt)
    };
}

export function defaultUsageRoot(): string {
    return join(homedir(), '.oculus', 'usage', 'claude');
}

function claudeWindows(data: Record<string, unknown>): UsageWindow[] {
    const limits = isMap(data.rate_limits) ? data.rate_limits : {};
    const rows: UsageWindow[] = [];
    for (const [key, name, minutes] of [
        ['five_hour', 'five_hour', 300],
        ['seven_day', 'seven_day', 10080]
    ] as const) {
        const value = limits[key];
        if (!isMap(value)) continue;
        const usedPercent = number(value.used_percentage);
        const resetsAt = number(value.resets_at);
        if (usedPercent === null || resetsAt === null) continue;
        rows.push({ name, usedPercent, resetsAt, windowMinutes: minutes });
    }
    return rows;
}

/**
 * Each status file carries the windows as they stood at that session's last response, so the file
 * written last is not the freshest observation: an idle session rewrites its stale snapshot when
 * the settings change. Within one window (the same resets_at) usage only rises, so the highest
 * percentage is the latest observation; a later resets_at is a newer window altogether.
 */
export function latestWindows(snapshots: (Record<string, unknown> | null)[]): UsageWindow[] {
    const best = new Map<UsageWindow['name'], UsageWindow>();
    for (const snapshot of snapshots) {
        if (snapshot === null) continue;
        for (const window of claudeWindows(snapshot)) {
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
    const data = json(path);
    if (data === null) return null;
    const model = isMap(data.model) ? data.model : {};
    const context = isMap(data.context_window) ? data.context_window : {};
    const cost = isMap(data.cost) ? data.cost : {};
    return {
        sessionId: text(data.session_id) || basename(path, '.json'),
        model: text(model.display_name) || text(model.id),
        contextPercent: number(context.used_percentage),
        costUsd: number(cost.total_cost_usd),
        updatedAt: new Date(mtimeMs).toISOString(),
        cwd: text(data.cwd)
    };
}

function claudeUsage(
    account: UsageAccountConfig,
    tiers: UsageTiers,
    usageRoot: string,
    now: number
): UsageAccount {
    const identity = claudeAccount(account.dir);
    const files = statusFiles(join(usageRoot, basename(account.dir)));
    const live = files
        .filter((file) => now - file.mtimeMs <= 60 * 60 * 1000)
        .map((file) => liveClaude(file.path, file.mtimeMs))
        .filter((row): row is UsageLiveSession => row !== null);
    return {
        tool: account.tool,
        label: account.label,
        dir: account.dir,
        email: identity.email,
        organisation: identity.organisation,
        tier: identity.tier,
        tierLabel: tierLabel(identity.tier, tiers),
        billing: identity.billing,
        windows: latestWindows(files.map((file) => json(file.path))),
        live
    };
}

function rateLimits(record: Record<string, unknown>): Record<string, unknown> | null {
    if (isMap(record.rate_limits)) return record.rate_limits;
    const payload = isMap(record.payload) ? record.payload : {};
    if (isMap(payload.rate_limits)) return payload.rate_limits;
    const info = isMap(payload.info) ? payload.info : {};
    return isMap(info.rate_limits) ? info.rate_limits : null;
}

/** How much of the newest rollout's end is read for its last rate-limit event; a tool result can be large. */
export const CODEX_TAIL_BYTES = 4 * 1024 * 1024;

/** Read at most the last tailBytes, retaining only complete JSON records at the leading boundary. */
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

/** The last rate_limits object in the newest rollout's tail; anything further from the end is absent. */
export function newestCodexLimits(
    dir: string,
    tailBytes: number = CODEX_TAIL_BYTES
): Record<string, unknown> | null {
    const newest = rollouts(join(dir, 'sessions'), 0, 1)[0];
    if (newest === undefined) return null;
    try {
        const lines = rolloutTail(newest.path, tailBytes);
        for (let at = lines.length - 1; at >= 0; at -= 1) {
            if (lines[at].trim() === '') continue;
            let record: unknown;
            try {
                record = JSON.parse(lines[at]) as unknown;
            } catch {
                continue;
            }
            if (!isMap(record)) continue;
            const found = rateLimits(record);
            if (found !== null) return found;
        }
    } catch {
        return null;
    }
    return null;
}

function codexWindows(limits: Record<string, unknown>): UsageWindow[] {
    const rows: UsageWindow[] = [];
    for (const name of ['primary', 'secondary'] as const) {
        const value = limits[name];
        if (!isMap(value)) continue;
        const usedPercent = number(value.used_percent);
        const resetsAt = number(value.resets_at);
        const windowMinutes = number(value.window_minutes);
        if (usedPercent === null || resetsAt === null || windowMinutes === null) continue;
        rows.push({ name, usedPercent, resetsAt, windowMinutes });
    }
    return rows;
}

function codexUsage(account: UsageAccountConfig, tiers: UsageTiers): UsageAccount {
    const limits = newestCodexLimits(account.dir) ?? {};
    const tier = text(limits.plan_type);
    return {
        tool: account.tool,
        label: account.label,
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
    now: number = Date.now()
): UsageAccount[] {
    return accounts.map((account) =>
        account.tool === 'claude'
            ? claudeUsage(account, tiers, usageRoot, now)
            : codexUsage(account, tiers)
    );
}
