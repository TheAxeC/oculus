// Layer 4, test. Synthetic account, rollout, transcript, cache, window, dedupe, live-hour and watcher coverage.

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsageAccountConfig, UsagePayload } from '../../../src/lib/data/model.ts';
import { Hub } from '../../../src/lib/server/channels.ts';
import {
    claudeAccount,
    claudeCachedUsage,
    latestWindows,
    mergeClaudeWindows,
    CODEX_TAIL_BYTES,
    newestCodexLimits,
    usageAccounts
} from '../../../src/lib/server/usage/accounts.ts';
import { UsageTranscriptFold } from '../../../src/lib/server/usage/transcripts.ts';
import { watchUsage } from '../../../src/lib/server/usage/watch.ts';
import { noop } from '../../doubles.ts';

const NOW = Date.parse('2026-09-13T12:00:00.000Z');
const made: string[] = [];

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-usage-'));
    made.push(dir);
    return dir;
}

function write(path: string, body: string, mtime: number = NOW): void {
    expect(made.some((root) => resolve(path).startsWith(resolve(root) + sep))).toBe(true);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
    const date = new Date(mtime);
    utimesSync(path, date, date);
}

function line(value: unknown): string {
    return `${JSON.stringify(value)}\n`;
}

function cachedUsage(fetchedAtMs: number, limits: unknown[]): string {
    return JSON.stringify({
        cachedUsageUtilization: {
            fetchedAtMs,
            utilization: {
                five_hour: { utilization: 99 },
                limits
            }
        }
    });
}

beforeEach(() => {
    const home = scratch();
    vi.stubEnv('HOME', home);
    vi.stubEnv('CLAUDE_CONFIG_DIR', join(home, '.claude'));
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('usage readers', () => {
    it('uses the adjacent account file only for the real home Claude folder and its aliases', () => {
        const home = process.env.HOME!;
        const own = join(home, '.claude');
        const team = join(home, 'team', '.claude');
        const alias = join(home, 'alias');
        const identity = (email: string): string =>
            JSON.stringify({ oauthAccount: { emailAddress: email } });
        write(join(home, '.claude.json'), identity('home@example.test'));
        write(join(own, '.claude.json'), identity('wrong-inside@example.test'));
        write(join(home, 'team', '.claude.json'), identity('wrong-adjacent@example.test'));
        write(join(team, '.claude.json'), identity('team@example.test'));
        symlinkSync(own, alias);
        expect(claudeAccount(own).email).toBe('home@example.test');
        expect(claudeAccount(alias).email).toBe('home@example.test');
        expect(claudeAccount(team).email).toBe('team@example.test');
    });

    it('reads only the five approved Claude oauth account fields', () => {
        const dir = scratch();
        write(
            join(dir, '.claude.json'),
            JSON.stringify({
                oauthAccount: {
                    emailAddress: 'a@example.test',
                    organizationName: 'Lab',
                    organizationRateLimitTier: 'default_claude_max_20x',
                    billingType: 'stripe',
                    subscriptionCreatedAt: '2026-01-01',
                    secret: 'not returned'
                },
                sessionState: { ignored: true }
            })
        );
        expect(claudeAccount(dir)).toEqual({
            email: 'a@example.test',
            organisation: 'Lab',
            tier: 'default_claude_max_20x',
            billing: 'stripe',
            subscriptionCreatedAt: '2026-01-01'
        });
    });

    it('reads the cached Claude limits and ignores the utilization summaries and other kinds', () => {
        const dir = scratch();
        write(
            join(dir, '.claude.json'),
            cachedUsage(Date.parse('2026-09-13T12:24:05.152Z'), [
                {
                    kind: 'session',
                    percent: 26,
                    severity: 'normal',
                    resets_at: '2026-09-13T17:00:00.000Z',
                    scope: null,
                    is_active: true,
                    ignored: 'secret'
                },
                {
                    kind: 'weekly_all',
                    percent: 3,
                    severity: 'warning',
                    resets_at: '2026-09-14T20:00:00.000Z',
                    scope: null,
                    is_active: false
                },
                {
                    kind: 'weekly_scoped',
                    percent: 6,
                    severity: 'critical',
                    resets_at: '2026-09-14T20:00:00.000Z',
                    scope: { model: { id: 'ignored', display_name: 'Fable' }, surface: 'ignored' },
                    is_active: false
                },
                { kind: 'monthly', percent: 100, resets_at: '2026-10-01T00:00:00Z' }
            ])
        );
        expect(claudeCachedUsage(dir)).toEqual({
            fetchedAt: '2026-09-13T12:24:05.152Z',
            windows: [
                {
                    name: 'five_hour',
                    usedPercent: 26,
                    resetsAt: Date.parse('2026-09-13T17:00:00.000Z') / 1000,
                    windowMinutes: 300,
                    severity: 'normal',
                    active: true,
                    observedAt: '2026-09-13T12:24:05.152Z'
                },
                {
                    name: 'seven_day',
                    usedPercent: 3,
                    resetsAt: Date.parse('2026-09-14T20:00:00.000Z') / 1000,
                    windowMinutes: 10080,
                    severity: 'warning',
                    active: false,
                    observedAt: '2026-09-13T12:24:05.152Z'
                },
                {
                    name: 'weekly_model',
                    model: 'Fable',
                    usedPercent: 6,
                    resetsAt: Date.parse('2026-09-14T20:00:00.000Z') / 1000,
                    windowMinutes: 10080,
                    severity: 'critical',
                    active: false,
                    observedAt: '2026-09-13T12:24:05.152Z'
                }
            ]
        });
    });

    it('treats a timestamp Date cannot hold as no observation, and carries a real one to the account', () => {
        const dir = scratch();
        write(join(dir, '.claude.json'), cachedUsage(1e20, []));
        expect(claudeCachedUsage(dir).fetchedAt).toBe('');
        write(join(dir, '.claude.json'), cachedUsage(Date.parse('2026-09-13T12:24:05.152Z'), []));
        const [account] = usageAccounts(
            [{ tool: 'claude', dir, label: 'Claude' }],
            {},
            join(dir, 'status'),
            NOW
        );
        expect(account.fetchedAt).toBe('2026-09-13T12:24:05.152Z');
    });

    it('returns no cached bars when cachedUsageUtilization is absent', () => {
        const dir = scratch();
        write(join(dir, '.claude.json'), JSON.stringify({ oauthAccount: { emailAddress: 'a' } }));
        expect(claudeCachedUsage(dir)).toEqual({ fetchedAt: '', windows: [] });
    });

    it('merges each shared window by observation time and always supplies the five-hour window', () => {
        const cache = [
            {
                name: 'five_hour' as const,
                usedPercent: 20,
                resetsAt: 200,
                windowMinutes: 300,
                observedAt: '2026-09-13T12:00:00Z'
            },
            {
                name: 'seven_day' as const,
                usedPercent: 30,
                resetsAt: 300,
                windowMinutes: 10080,
                observedAt: '2026-09-13T14:00:00Z'
            }
        ];
        const status = [
            {
                name: 'five_hour' as const,
                usedPercent: 40,
                resetsAt: 400,
                windowMinutes: 300,
                observedAt: '2026-09-13T13:00:00Z'
            },
            {
                name: 'seven_day' as const,
                usedPercent: 50,
                resetsAt: 500,
                windowMinutes: 10080,
                observedAt: '2026-09-13T13:00:00Z'
            }
        ];
        expect(mergeClaudeWindows(cache, status).map((window) => window.usedPercent)).toEqual([
            40, 30
        ]);
        expect(mergeClaudeWindows([], [])).toEqual([
            {
                name: 'five_hour',
                usedPercent: 0,
                resetsAt: 0,
                windowMinutes: 300,
                observedAt: ''
            }
        ]);
    });

    it('takes the newest rate_limits object from the newest Codex rollout', () => {
        const dir = scratch();
        write(
            join(dir, 'sessions', '2026', '09', '12', 'rollout-2026-09-12T10-00-00-old.jsonl'),
            line({ payload: { rate_limits: { plan_type: 'old' } } }),
            NOW - 1000
        );
        write(
            join(dir, 'sessions', '2026', '09', '13', 'rollout-2026-09-13T10-00-00-new.jsonl'),
            line({ payload: { rate_limits: { plan_type: 'first' } } }) +
                line({ payload: { info: { rate_limits: { plan_type: 'prolite' } } } })
        );
        expect(newestCodexLimits(dir)).toEqual({ plan_type: 'prolite' });
    });

    it('prefers the account bucket over a model family bucket a newer session reports', () => {
        // A session on a model family with a bucket of its own writes that bucket's figures, which
        // say nothing about the account's; the account's bucket carries the id `codex`.
        const dir = scratch();
        write(
            join(dir, 'sessions', '2026', '09', '14', 'rollout-2026-09-14T05-00-00-account.jsonl'),
            line({
                payload: {
                    rate_limits: {
                        limit_id: 'codex',
                        plan_type: 'prolite',
                        primary: { used_percent: 77, window_minutes: 10080, resets_at: 1789810732 }
                    }
                }
            }),
            NOW - 1000
        );
        write(
            join(dir, 'sessions', '2026', '09', '08', 'rollout-2026-09-08T10-00-00-spark.jsonl'),
            line({
                payload: {
                    rate_limits: {
                        limit_id: 'codex_bengalfox',
                        limit_name: 'GPT-5.3-Codex-Spark',
                        primary: { used_percent: 0, window_minutes: 300, resets_at: 1789404836 }
                    }
                }
            })
        );
        expect(newestCodexLimits(dir)?.limit_id).toBe('codex');
        expect(newestCodexLimits(dir, CODEX_TAIL_BYTES, 1)?.limit_id).toBe('codex_bengalfox');
    });

    it('reads the last event of a large rollout, and only within the tail it is given', () => {
        const dir = scratch();
        const path = join(dir, 'sessions', '2026', '09', '13', 'rollout-large.jsonl');
        const padding = line({ payload: { text: 'x'.repeat(300 * 1024) } });
        const older = line({ payload: { rate_limits: { plan_type: 'older' } } });
        write(path, older + padding);
        expect(newestCodexLimits(dir)).toEqual({ plan_type: 'older' });
        expect(newestCodexLimits(dir, 64 * 1024)).toBeNull();
        write(path, older + padding + line({ payload: { rate_limits: { plan_type: 'latest' } } }));
        expect(newestCodexLimits(dir)).toEqual({ plan_type: 'latest' });
    });

    it('keeps status files from the live hour and uses the newest windows', () => {
        const root = scratch();
        const config = join(root, '.claude-work');
        const status = join(root, 'status');
        write(
            join(config, '.claude.json'),
            JSON.stringify({
                oauthAccount: {
                    emailAddress: 'work@example.test',
                    organizationName: 'Work',
                    organizationRateLimitTier: 'default_claude_max_5x',
                    billingType: 'invoice',
                    subscriptionCreatedAt: '2026-01-01'
                }
            })
        );
        const payload = {
            session_id: 'fresh-session',
            model: { display_name: 'Opus' },
            context_window: { used_percentage: 12 },
            rate_limits: {
                five_hour: { used_percentage: 34, resets_at: NOW / 1000 + 60 },
                seven_day: { used_percentage: 56, resets_at: NOW / 1000 + 120 }
            },
            cost: { total_cost_usd: 1.25 },
            cwd: '/tmp/project'
        };
        write(join(status, '.claude-work', 'old.json'), JSON.stringify(payload), NOW - 3600001);
        write(join(status, '.claude-work', 'fresh.json'), JSON.stringify(payload), NOW);
        const account = usageAccounts(
            [{ tool: 'claude', dir: config, label: 'Work' }],
            { default_claude_max_5x: 'Max 5x' },
            status,
            NOW
        )[0];
        expect(account.tierLabel).toBe('Max 5x');
        write(
            join(config, '.claude.json'),
            JSON.stringify({ oauthAccount: { organizationRateLimitTier: 'future-tier' } })
        );
        expect(
            usageAccounts(
                [{ tool: 'claude', dir: config, label: 'Work' }],
                { default_claude_max_5x: 'Max 5x' },
                status,
                NOW
            )[0].tierLabel
        ).toBe('future-tier');
        expect(account.windows.map((window) => window.name)).toEqual(['five_hour', 'seven_day']);
        expect(account.live.map((session) => session.sessionId)).toEqual(['fresh-session']);
    });
});

describe('usage transcript fold', () => {
    it('folds both tools, excludes the eighth day, caches unchanged files and reads a symlinked project store once under both labels', async () => {
        const root = scratch();
        const claude = join(root, 'claude');
        const alias = join(root, 'claude-alias');
        const codex = join(root, 'codex');
        const transcript = join(claude, 'projects', 'p', 'one.jsonl');
        write(
            transcript,
            line({
                type: 'assistant',
                timestamp: '2026-09-13T10:00:00Z',
                message: {
                    model: 'claude-opus',
                    usage: {
                        input_tokens: 10,
                        output_tokens: 2,
                        cache_read_input_tokens: 3,
                        cache_creation_input_tokens: 4
                    }
                }
            }) +
                line({
                    type: 'assistant',
                    timestamp: '2026-09-06T10:00:00Z',
                    message: { model: 'claude-opus', usage: { input_tokens: 999 } }
                })
        );
        mkdirSync(alias);
        symlinkSync(join(claude, 'projects'), join(alias, 'projects'));
        write(
            join(codex, 'sessions', '2026', '09', '13', 'rollout-2026-09-13T11-00-00-id.jsonl'),
            line({
                type: 'turn_context',
                timestamp: '2026-09-13T11:00:00Z',
                payload: { model: 'gpt-5' }
            }) +
                line({
                    type: 'event_msg',
                    timestamp: '2026-09-13T11:01:00Z',
                    payload: {
                        type: 'token_count',
                        info: {
                            last_token_usage: {
                                input_tokens: 20,
                                output_tokens: 5,
                                cached_input_tokens: 6,
                                cache_write_input_tokens: 7
                            },
                            total_token_usage: {
                                input_tokens: 200,
                                output_tokens: 50,
                                cached_input_tokens: 60,
                                cache_write_input_tokens: 70
                            }
                        }
                    }
                })
        );
        const accounts: UsageAccountConfig[] = [
            { tool: 'claude', dir: claude, label: 'Personal' },
            { tool: 'claude', dir: alias, label: 'Duplicate' },
            { tool: 'codex', dir: codex, label: 'Codex' }
        ];
        const fold = new UsageTranscriptFold();
        const first = await fold.fold(accounts, NOW);
        expect(first.files).toBe(2);
        expect(first.readFiles).toBe(2);
        expect(first.rows).toEqual([
            {
                tool: 'claude',
                account: 'Personal + Duplicate',
                day: '2026-09-13',
                model: 'claude-opus',
                input: 10,
                output: 2,
                cacheRead: 3,
                cacheCreation: 4
            },
            {
                tool: 'codex',
                account: 'Codex',
                day: '2026-09-13',
                model: 'gpt-5',
                input: 200,
                output: 50,
                cacheRead: 60,
                cacheCreation: 70
            }
        ]);
        const second = await fold.fold(accounts, NOW);
        expect(second.readFiles).toBe(0);
        expect(second.readBytes).toBe(0);
    });

    it('keeps two stores of their own apart, each under its own label', async () => {
        const root = scratch();
        const one = join(root, 'one');
        const two = join(root, 'two');
        for (const [dir, model] of [
            [one, 'claude-opus'],
            [two, 'claude-sonnet']
        ]) {
            write(
                join(dir, 'projects', 'p', 'one.jsonl'),
                line({
                    type: 'assistant',
                    timestamp: '2026-09-13T10:00:00Z',
                    message: { model, usage: { input_tokens: 10 } }
                })
            );
        }
        const accounts: UsageAccountConfig[] = [
            { tool: 'claude', dir: one, label: 'Personal' },
            { tool: 'claude', dir: two, label: 'Work' }
        ];
        const fold = await new UsageTranscriptFold().fold(accounts, NOW);
        expect(fold.files).toBe(2);
        expect(fold.rows.map((row) => `${row.account} ${row.model}`)).toEqual([
            'Personal claude-opus',
            'Work claude-sonnet'
        ]);
    });

    it('includes a nested Claude sub-agent transcript in the usage rows', async () => {
        const dir = scratch();
        write(
            join(dir, 'projects', 'p', 'session-one', 'subagents', 'agent-one.jsonl'),
            line({
                type: 'assistant',
                timestamp: '2026-09-13T10:00:00Z',
                message: {
                    model: 'claude-subagent',
                    usage: {
                        input_tokens: 11,
                        output_tokens: 12,
                        cache_read_input_tokens: 13,
                        cache_creation_input_tokens: 14
                    }
                }
            })
        );
        const result = await new UsageTranscriptFold().fold(
            [{ tool: 'claude', dir, label: 'Personal' }],
            NOW
        );
        expect(result.files).toBe(1);
        expect(result.rows).toEqual([
            {
                tool: 'claude',
                account: 'Personal',
                day: '2026-09-13',
                model: 'claude-subagent',
                input: 11,
                output: 12,
                cacheRead: 13,
                cacheCreation: 14
            }
        ]);
    });

    it('leaves the Codex baseline intact when a token-count event has no totals', async () => {
        const dir = scratch();
        const event = (total: number): string =>
            line({
                type: 'event_msg',
                timestamp: '2026-09-13T12:00:00Z',
                payload: {
                    type: 'token_count',
                    info: { total_token_usage: { input_tokens: total } }
                }
            });
        write(
            join(dir, 'sessions', '2026', '09', '13', 'rollout-baseline.jsonl'),
            line({ type: 'turn_context', payload: { model: 'gpt-5' } }) +
                event(100) +
                line({
                    type: 'event_msg',
                    timestamp: '2026-09-13T12:01:00Z',
                    payload: { type: 'token_count', info: {} }
                }) +
                event(150)
        );
        const result = await new UsageTranscriptFold().fold(
            [{ tool: 'codex', dir, label: 'Codex' }],
            NOW
        );
        expect(result.rows).toEqual([
            {
                tool: 'codex',
                account: 'Codex',
                day: '2026-09-13',
                model: 'gpt-5',
                input: 150,
                output: 0,
                cacheRead: 0,
                cacheCreation: 0
            }
        ]);
    });

    it('counts cumulative deltas across days and models, repeated totals, resets and separate files', async () => {
        const dir = scratch();
        const context = (model: string): string =>
            line({ type: 'turn_context', payload: { model } });
        const event = (day: string, total: number, last: number): string =>
            line({
                type: 'event_msg',
                timestamp: `${day}T12:00:00Z`,
                payload: {
                    type: 'token_count',
                    info: {
                        total_token_usage: {
                            input_tokens: total,
                            output_tokens: total * 2,
                            cached_input_tokens: total * 3,
                            cache_write_input_tokens: total * 4
                        },
                        last_token_usage: { input_tokens: last }
                    }
                }
            });
        const file = join(dir, 'sessions', '2026', '09', '13', 'rollout-one.jsonl');
        write(
            file,
            context('first') +
                event('2026-09-12', 100, 100) +
                context('second') +
                event('2026-09-13', 17911, 2000)
        );
        const accounts: UsageAccountConfig[] = [{ tool: 'codex', dir, label: 'Codex' }];
        const fold = new UsageTranscriptFold();
        const first = await fold.fold(accounts, NOW);
        expect(first.rows.reduce((total, row) => total + row.input, 0)).toBe(17911);
        expect(first.rows).toEqual([
            {
                tool: 'codex',
                account: 'Codex',
                day: '2026-09-13',
                model: 'second',
                input: 17811,
                output: 35622,
                cacheRead: 53433,
                cacheCreation: 71244
            },
            {
                tool: 'codex',
                account: 'Codex',
                day: '2026-09-12',
                model: 'first',
                input: 100,
                output: 200,
                cacheRead: 300,
                cacheCreation: 400
            }
        ]);
        write(
            file,
            context('first') +
                event('2026-09-12', 100, 100) +
                context('second') +
                event('2026-09-13', 17911, 2000) +
                event('2026-09-13', 17911, 2000) +
                event('2026-09-13', 10, 10)
        );
        write(
            join(dir, 'sessions', '2026', '09', '13', 'rollout-two.jsonl'),
            context('second') + event('2026-09-13', 20, 20)
        );
        const next = await fold.fold(accounts, NOW);
        expect(next.rows[0]).toMatchObject({
            input: 17841,
            output: 35682,
            cacheRead: 53523,
            cacheCreation: 71364
        });
        expect(next.readFiles).toBe(2);
    });
});

describe('usage watcher', () => {
    it('refreshes Codex windows through the session signal when a new day folder appears', async () => {
        vi.useFakeTimers();
        let changed = noop;
        const off = vi.fn();
        const dir = scratch();
        const hub = new Hub();
        const watcher = watchUsage(hub, {
            accounts: [{ tool: 'codex', dir, label: 'Codex' }],
            tiers: {},
            usageRoot: join(dir, 'usage'),
            debounce: 1,
            now: () => NOW,
            onSessionsChange: (listener) => {
                changed = listener;
                return off;
            }
        });
        try {
            await watcher.refresh();
            expect((hub.latest('usage')?.payload as UsagePayload).accounts[0].windows).toEqual([]);
            write(
                join(dir, 'sessions', '2026', '09', '14', 'rollout-new-day.jsonl'),
                line({
                    payload: {
                        rate_limits: {
                            primary: {
                                used_percent: 47,
                                resets_at: NOW / 1000 + 3600,
                                window_minutes: 10080
                            }
                        }
                    }
                })
            );
            const published = new Promise<void>((resolve) => {
                hub.subscribe(
                    {
                        send: () => {
                            resolve();
                            return Promise.resolve();
                        },
                        close: noop
                    },
                    ['usage'],
                    false
                );
            });
            changed();
            await vi.advanceTimersByTimeAsync(1);
            await published;
            expect((hub.latest('usage')?.payload as UsagePayload).accounts[0].windows).toEqual([
                {
                    name: 'primary',
                    usedPercent: 47,
                    resetsAt: NOW / 1000 + 3600,
                    windowMinutes: 10080,
                    observedAt: ''
                }
            ]);
        } finally {
            watcher.close();
        }
        expect(off).toHaveBeenCalledOnce();
    });

    it('takes each window from its freshest observation across every status file', () => {
        const older = {
            rate_limits: {
                five_hour: { used_percentage: 60, resets_at: 100 },
                seven_day: { used_percentage: 47, resets_at: 5000 }
            }
        };
        const fresher = { rate_limits: { seven_day: { used_percentage: 91, resets_at: 5000 } } };
        const nextWindow = { rate_limits: { five_hour: { used_percentage: 2, resets_at: 200 } } };
        expect(
            latestWindows([
                { data: older, observedAt: '2026-09-13T10:00:00Z' },
                { data: fresher, observedAt: '2026-09-13T11:00:00Z' },
                { data: nextWindow, observedAt: '2026-09-13T12:00:00Z' },
                { data: null, observedAt: '2026-09-13T13:00:00Z' }
            ])
        ).toEqual([
            {
                name: 'five_hour',
                usedPercent: 2,
                resetsAt: 200,
                windowMinutes: 300,
                observedAt: '2026-09-13T12:00:00Z'
            },
            {
                name: 'seven_day',
                usedPercent: 91,
                resetsAt: 5000,
                windowMinutes: 10080,
                observedAt: '2026-09-13T11:00:00Z'
            }
        ]);
    });

    it('rebuilds when Claude Code rewrites an account file', async () => {
        const root = scratch();
        const claude = join(root, 'claude');
        const watched = new Map<string, (filename: string | Buffer | null) => void>();
        mkdirSync(join(claude, 'projects'), { recursive: true });
        write(join(claude, '.claude.json'), JSON.stringify({ oauthAccount: {} }));
        const hub = new Hub();
        const watcher = watchUsage(hub, {
            accounts: [{ tool: 'claude', dir: claude, label: 'Claude' }],
            tiers: {},
            usageRoot: join(root, 'status'),
            debounce: 1,
            interval: 60_000,
            now: () => NOW,
            watchFolder: (folder, changed) => {
                watched.set(folder, changed);
                return { close: noop };
            }
        });
        try {
            await watcher.refresh();
            const published = new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(
                    () => reject(new Error('account-file refresh timed out')),
                    2000
                );
                hub.subscribe(
                    {
                        send: () => {
                            const windows = (hub.latest('usage')?.payload as UsagePayload)
                                .accounts[0].windows;
                            if (windows.some((window) => window.name === 'weekly_model')) {
                                clearTimeout(timeout);
                                resolve();
                            }
                            return Promise.resolve();
                        },
                        close: noop
                    },
                    ['usage'],
                    false
                );
            });
            write(
                join(claude, '.claude.json'),
                cachedUsage(NOW, [
                    {
                        kind: 'weekly_scoped',
                        percent: 42,
                        severity: 'normal',
                        resets_at: '2026-09-14T20:00:00Z',
                        scope: { model: { display_name: 'Fable' } },
                        is_active: true
                    }
                ])
            );
            watched.get(claude)?.('.claude.json');
            await published;
            expect(
                (hub.latest('usage')?.payload as UsagePayload).accounts[0].windows
            ).toContainEqual(
                expect.objectContaining({ name: 'weekly_model', model: 'Fable', usedPercent: 42 })
            );
        } finally {
            watcher.close();
        }
    });

    it('rebuilds on its clock when nothing changes on disk', async () => {
        const root = scratch();
        const claude = join(root, 'claude');
        mkdirSync(join(claude, 'projects'), { recursive: true });
        const hub = new Hub();
        let ticks = 0;
        const watcher = watchUsage(hub, {
            accounts: [{ tool: 'claude', dir: claude, label: 'Claude' }],
            tiers: {},
            usageRoot: join(root, 'status'),
            debounce: 1,
            interval: 5,
            now: () => NOW + ticks++ * 1000,
            watchFolder: () => ({ close: noop })
        });
        await watcher.refresh();
        const first = hub.latest('usage')?.version;
        await new Promise((resolve) => setTimeout(resolve, 60));
        watcher.close();
        expect(hub.latest('usage')?.version).toBeGreaterThan(first ?? 0);
    });

    it('drops a record whose usage is all zeros, such as a synthetic message', async () => {
        const root = scratch();
        const claude = join(root, 'claude');
        write(
            join(claude, 'projects', 'p', 's.jsonl'),
            line({
                type: 'assistant',
                timestamp: '2026-09-13T11:30:00Z',
                message: {
                    model: '<synthetic>',
                    usage: { input_tokens: 0, output_tokens: 0 }
                }
            })
        );
        const fold = new UsageTranscriptFold();
        const result = await fold.fold([{ tool: 'claude', dir: claude, label: 'Claude' }], NOW);
        expect(result.rows).toEqual([]);
    });

    it('publishes the complete usage payload from temporary stores', async () => {
        const root = scratch();
        const claude = join(root, 'claude');
        const status = join(root, 'status');
        mkdirSync(join(claude, 'projects'), { recursive: true });
        write(join(claude, '.claude.json'), JSON.stringify({ oauthAccount: {} }));
        const hub = new Hub();
        const watcher = watchUsage(hub, {
            accounts: [{ tool: 'claude', dir: claude, label: 'Claude' }],
            tiers: {},
            usageRoot: status,
            debounce: 1,
            now: () => NOW,
            watchFolder: () => ({ close: noop })
        });
        await watcher.refresh();
        const payload = hub.latest('usage')?.payload as UsagePayload;
        expect(payload).toEqual({
            accounts: [
                {
                    tool: 'claude',
                    label: 'Claude',
                    dir: claude,
                    email: '',
                    organisation: '',
                    tier: '',
                    tierLabel: '',
                    billing: '',
                    fetchedAt: '',
                    windows: [
                        {
                            name: 'five_hour',
                            usedPercent: 0,
                            resetsAt: 0,
                            windowMinutes: 300,
                            observedAt: ''
                        }
                    ],
                    live: []
                }
            ],
            days: [],
            builtAt: '2026-09-13T12:00:00.000Z'
        });
        watcher.close();
    });
});
