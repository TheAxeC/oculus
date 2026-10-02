// Layer 4, server test. Account files and Codex rollouts of the wrong shape are read as holding
// nothing, without a throw.

import { mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    claudeAccount,
    claudeCachedUsage,
    latestWindows,
    newestCodexLimits,
    usageAccounts
} from '../../../../src/lib/server/machine/usage/accounts.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const NOW = Date.parse('2026-09-13T12:00:00Z');

/** Writes the text a reader of a file of the wrong shape is given, modified at NOW. */
function put(path: string, body: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
    utimesSync(path, new Date(NOW), new Date(NOW));
}

function line(value: unknown): string {
    return `${JSON.stringify(value)}\n`;
}

/** An account file whose cached usage holds these limits, fetched at the given time. */
function limitsFile(limits: unknown[]): string {
    return JSON.stringify({
        cachedUsageUtilization: {
            fetchedAtMs: Date.parse('2026-09-13T12:24:05.152Z'),
            utilization: { limits }
        }
    });
}

describe('usage readers over files of the wrong shape', () => {
    const NO_IDENTITY = {
        email: '',
        organisation: '',
        tier: '',
        billing: '',
        subscriptionCreatedAt: ''
    };

    it('reads an account file whose sections are lists as holding nothing', () => {
        const dir = scratchDir('oculus-usage-');
        put(
            join(dir, '.claude.json'),
            JSON.stringify({
                oauthAccount: [],
                cachedUsageUtilization: { utilization: { limits: [3, { scope: [] }] } }
            })
        );
        expect(claudeAccount(dir)).toStrictEqual(NO_IDENTITY);
        expect(claudeCachedUsage(dir)).toStrictEqual({ fetchedAt: '', windows: [] });
    });

    it('keeps the fields of a limit that read and drops the rest of it', () => {
        const dir = scratchDir('oculus-usage-');
        const base = { percent: 5, resets_at: '2026-09-14T00:00:00.000Z' };
        put(
            join(dir, '.claude.json'),
            limitsFile([
                { kind: 'session', ...base, severity: 'bogus', is_active: 'yes' },
                { kind: 'weekly_scoped', ...base, scope: [] },
                { kind: 'weekly_scoped', ...base, scope: { model: [] } },
                { kind: 'weekly_scoped', ...base, scope: { model: { display_name: 3 } } },
                { kind: 'weekly_scoped', ...base, scope: { model: { display_name: 'Opus' } } },
                { kind: 'weekly_all', percent: '5', resets_at: base.resets_at },
                { kind: 'weekly_all', percent: 6, resets_at: 3 }
            ])
        );
        const observedAt = '2026-09-13T12:24:05.152Z';
        const resetsAt = Date.parse(base.resets_at) / 1000;
        expect(claudeCachedUsage(dir).windows).toStrictEqual([
            {
                name: 'five_hour',
                windowMinutes: 300,
                usedPercent: 5,
                resetsAt,
                severity: undefined,
                active: false,
                observedAt
            },
            {
                name: 'weekly_model',
                model: 'Opus',
                windowMinutes: 10080,
                usedPercent: 5,
                resetsAt,
                severity: undefined,
                active: false,
                observedAt
            }
        ]);
    });

    it('reads a status file whose rate_limits is a list, or whose windows are odd, as holding none', () => {
        const at = '2026-09-13T12:00:00.000Z';
        const window = (value: unknown): Record<string, unknown> => ({
            rate_limits: { five_hour: value }
        });
        const snapshots = [
            { data: { rate_limits: [] }, observedAt: at },
            { data: window([]), observedAt: at },
            { data: window({ used_percentage: '5', resets_at: 5 }), observedAt: at },
            { data: window({ used_percentage: 5, resets_at: null }), observedAt: at }
        ];
        expect(latestWindows(snapshots)).toStrictEqual([]);
    });

    it('drops a status window whose percentage is infinite', () => {
        const dir = scratchDir('oculus-usage-');
        const status = join(dir, 'status', '.claude-work');
        put(
            join(status, 'one.json'),
            '{"rate_limits":{"five_hour":{"used_percentage":1e999,"resets_at":5},' +
                '"seven_day":{"used_percentage":7,"resets_at":9}}}'
        );
        const account = usageAccounts(
            [{ tool: 'claude', dir: join(dir, '.claude-work'), label: 'Work' }],
            {},
            join(dir, 'status'),
            NOW
        )[0];
        const names = account.windows.filter((one) => one.usedPercent > 0).map((one) => one.name);
        expect(names).toEqual(['seven_day']);
        expect(account.windows[0]).toStrictEqual({
            name: 'five_hour',
            usedPercent: 0,
            resetsAt: 0,
            windowMinutes: 300,
            observedAt: ''
        });
    });

    it('reads a live status file whose fields are of the wrong type as empty ones', () => {
        const dir = scratchDir('oculus-usage-');
        const status = join(dir, 'status', '.claude-work');
        put(
            join(status, 'x.json'),
            '{"session_id":3,"session_name":3,"model":[],"context_window":{"used_percentage":"5"},' +
                '"cost":{"total_cost_usd":1e999},"cwd":3}'
        );
        const account = usageAccounts(
            [{ tool: 'claude', dir: join(dir, '.claude-work'), label: 'Work' }],
            {},
            join(dir, 'status'),
            NOW
        )[0];
        expect(account.live).toStrictEqual([
            {
                sessionId: 'x',
                model: '',
                contextPercent: null,
                costUsd: null,
                updatedAt: new Date(NOW).toISOString(),
                cwd: ''
            }
        ]);
    });
});

describe('Codex rollouts of the wrong shape', () => {
    /** The limits the newest rollout of a folder holding these lines answers. */
    function limitsOf(...lines: string[]): ReturnType<typeof newestCodexLimits> {
        const dir = scratchDir('oculus-usage-');
        const path = join(
            dir,
            'sessions',
            '2026',
            '09',
            '13',
            'rollout-2026-09-13T10-00-00-x.jsonl'
        );
        put(path, lines.join(''));
        return newestCodexLimits(dir);
    }

    it('finds rate_limits at the top, under payload, and under payload.info', () => {
        expect(limitsOf(line({ rate_limits: { plan_type: 'top' } }))).toStrictEqual({
            plan_type: 'top'
        });
        expect(
            limitsOf(line({ payload: { rate_limits: { plan_type: 'payload' } } }))
        ).toStrictEqual({
            plan_type: 'payload'
        });
        expect(
            limitsOf(line({ payload: { info: { rate_limits: { plan_type: 'info' } } } }))
        ).toStrictEqual({ plan_type: 'info' });
    });

    it('skips a record that is a list or holds rate_limits as a list, and reads the one before', () => {
        const good = line({ rate_limits: { plan_type: 'good', extra: { deep: [1] } } });
        const found = { plan_type: 'good', extra: { deep: [1] } };
        expect(limitsOf(good, line([{ rate_limits: { plan_type: 'listed' } }]))).toStrictEqual(
            found
        );
        expect(limitsOf(good, line({ rate_limits: [], payload: [] }))).toStrictEqual(found);
        expect(
            limitsOf(good, line({ payload: { rate_limits: 3, info: { rate_limits: [] } } }))
        ).toStrictEqual(found);
        expect(
            limitsOf(line({ rate_limits: [], payload: { rate_limits: { plan_type: 'p' } } }))
        ).toStrictEqual({ plan_type: 'p' });
    });

    it('answers the rate limits whole, an own __proto__ key included', () => {
        const record =
            '{"payload":{"rate_limits":{"__proto__":{"a":1},"plan_type":"x","n":null}}}\n';
        const found = limitsOf(record);
        expect(Object.keys(found ?? {})).toEqual(['__proto__', 'plan_type', 'n']);
        expect(found?.plan_type).toBe('x');
    });

    it('takes a limit id of null or absent as the account bucket and another as a stand-in', () => {
        expect(limitsOf(line({ rate_limits: { limit_id: null, plan_type: 'a' } }))).toStrictEqual({
            limit_id: null,
            plan_type: 'a'
        });
        expect(limitsOf(line({ rate_limits: { limit_id: 3, plan_type: 'b' } }))).toStrictEqual({
            limit_id: 3,
            plan_type: 'b'
        });
    });

    it('reads the Codex windows of an account, dropping a window with a field of the wrong type', () => {
        const dir = scratchDir('oculus-usage-');
        const path = join(
            dir,
            'sessions',
            '2026',
            '09',
            '13',
            'rollout-2026-09-13T10-00-00-y.jsonl'
        );
        put(
            path,
            line({
                rate_limits: {
                    plan_type: 3,
                    primary: { used_percent: 4, window_minutes: 300, resets_at: 8 },
                    secondary: { used_percent: '4', window_minutes: 300, resets_at: 8 }
                }
            })
        );
        const account = usageAccounts(
            [{ tool: 'codex', dir, label: 'C' }],
            {},
            join(dir, 'u'),
            NOW
        )[0];
        expect(account.tier).toBe('');
        expect(account.windows).toStrictEqual([
            { name: 'primary', usedPercent: 4, resetsAt: 8, windowMinutes: 300, observedAt: '' }
        ]);
    });
});
