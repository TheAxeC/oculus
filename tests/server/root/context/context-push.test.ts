// Layer 2, server tests. A configuration pushed on the hub's `config` channel is read group by
// group by the context: each group's reader gives the settings its poller takes, a group that does
// not read keeps the settings in force and is logged once, and a push that repeats the ones in
// force changes nothing.

import { describe, expect, vi } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { createServerContext } from '../../../../src/lib/server/root/context.ts';
import { it } from '../../../fixtures/scratch.ts';
import { blockWith, configWith, inertConfig, inertDependencies } from '../context-fixture.ts';

describe('ServerContext on a configuration push', () => {
    const KEPT = 'the settings in force are kept';
    const FILE = 'config/behavior.yml';

    /** Run a case over a started context, closed and its stderr spy restored after it. */
    async function inRun(
        body: (run: ReturnType<typeof started>) => void | Promise<void>
    ): Promise<void> {
        const run = started();
        try {
            await body(run);
        } finally {
            run.context.close();
            run.said.mockRestore();
        }
    }

    /**
     * A context over recording watchers on a hub of the case's own, and what it printed on stderr
     * under the `config:` prefix since it was built.
     */
    function started() {
        const hub = new Hub();
        const setters = {
            hpc: vi.fn(),
            calendar: vi.fn(),
            calendarWords: vi.fn(),
            mail: vi.fn(),
            mailWords: vi.fn(),
            refresh: vi.fn(),
            tiers: vi.fn(),
            processes: vi.fn(),
            processesText: vi.fn()
        };
        const context = createServerContext('/engine', {
            ...inertDependencies(setters),
            createHub: () => hub,
            loadLocal: () => ({
                ...{ hub: '/hub', port: 8791, claudeBin: 'claude', accounts: [], calendars: [] },
                mail: []
            })
        });
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const lines = (): string[] =>
            said.mock.calls
                .map((call) => String(call[0]))
                .filter((line) => line.startsWith('config:'));
        /** Publish a configuration and let the hub deliver what it held back behind the send. */
        const push = async (config: unknown, findings: unknown[] = []): Promise<void> => {
            hub.publish('config', { config, findings });
            for (let turn = 0; turn < 3; turn += 1) await Promise.resolve();
        };
        return { hub, context, setters, push, lines, said };
    }

    it('hands each group the settings its reader gives the pushed configuration', () =>
        inRun(async (run) => {
            await run.push(
                configWith({
                    slurm: blockWith('slurm', {
                        days: 14,
                        poll_min: 5,
                        quota_min: 30,
                        prewarm: true
                    }),
                    calendar: blockWith('calendar', { poll_min: 5, days_back: 7, days_ahead: 30 }),
                    mail: blockWith('mail', { poll_min: 4, per_signal: 10 }),
                    usage_refresh_min: 3,
                    usage_refresh_model: 'sonnet',
                    usage_tiers: { max: 'Max' }
                })
            );

            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith({
                host: 'cluster',
                days: 14,
                pollMin: 5,
                quotaMin: 30,
                prewarm: true
            });
            expect(run.setters.calendar).toHaveBeenCalledExactlyOnceWith({
                pollMin: 5,
                daysBack: 7,
                daysAhead: 30
            });
            expect(run.setters.mail).toHaveBeenCalledExactlyOnceWith({ pollMin: 4, perSignal: 10 });
            expect(run.setters.refresh).toHaveBeenCalledExactlyOnceWith({
                refreshMin: 3,
                model: 'sonnet'
            });
            expect(run.setters.tiers).toHaveBeenCalledExactlyOnceWith({ max: 'Max' });
            expect(run.lines()).toEqual([]);
        }));

    it('hands the Processes watcher the pattern list of the pushed configuration, once for a list that changed', () =>
        inRun(async (run) => {
            await run.push(
                configWith({ processes: { patterns: ['claude', 'claude', 'latexmk'] } })
            );
            expect(run.setters.processes).toHaveBeenCalledExactlyOnceWith({
                patterns: ['claude', 'latexmk']
            });
            await run.push(configWith({ processes: { patterns: ['claude', 'latexmk'] } }));
            expect(run.setters.processes).toHaveBeenCalledTimes(1);
            await run.push(configWith({ processes: { patterns: [] } }));
            expect(run.setters.processes).toHaveBeenLastCalledWith({ patterns: [] });
            expect(run.lines()).toEqual([]);
        }));

    it('keeps the pattern list in force and says why, once, for a processes block that is not names', () =>
        inRun(async (run) => {
            const refused = `config: ${FILE}: processes.patterns must be a list of program names, each without a slash or a space; ${KEPT}`;
            for (const patterns of [[''], ['a/b'], ['a b'], [3], 'node']) {
                await run.push(configWith({ processes: { patterns } }));
                await run.push(configWith({ processes: { patterns } }));
            }
            expect(run.setters.processes).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([refused]);
            await run.push(configWith({ processes: 3 }));
            expect(run.lines()).toEqual([
                refused,
                `config: ${FILE}: processes must be a map; ${KEPT}`
            ]);
            expect(run.setters.processes).not.toHaveBeenCalled();
        }));

    it('hands the three sentences, each kept when the push lacks it, and says the lack once', () =>
        inRun(async (run) => {
            const hostSentences = (inertConfig().text as Record<string, unknown>).hpc;
            await run.push(
                configWith({
                    text: {
                        calendar: { ics_no_link: 'new link', ics_failed: 'new failed {0}' },
                        accounts: { timed_out: 'new timed out {0}' },
                        hpc: hostSentences
                    }
                })
            );
            expect(run.setters.calendarWords).toHaveBeenCalledExactlyOnceWith({
                icsNoLink: 'new link',
                icsFailed: 'new failed {0}',
                timedOut: 'new timed out {0}'
            });
            expect(run.setters.mailWords).toHaveBeenCalledExactlyOnceWith({
                timedOut: 'new timed out {0}'
            });

            const text = {
                calendar: { ics_no_link: 'newer link' },
                accounts: { timed_out: 'new timed out {0}' },
                hpc: hostSentences
            };
            await run.push(configWith({ text }));
            await run.push(configWith({ text }));

            expect(run.setters.calendarWords).toHaveBeenLastCalledWith({
                icsNoLink: 'newer link',
                icsFailed: 'new failed {0}',
                timedOut: 'new timed out {0}'
            });
            // The Processes watcher takes the whole catalog each time the text changes, and not
            // again for a push that repeats it.
            expect(run.setters.processesText).toHaveBeenCalledTimes(2);
            expect(run.setters.processesText).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ 'calendar.ics_no_link': 'new link' })
            );
            expect(run.lines()).toEqual([
                `config: text catalog: calendar.ics_failed must be a string; ${KEPT}`
            ]);
        }));

    it('keeps a refused group and logs it once, again after a read that took, and clears on a push back', () =>
        inRun(async (run) => {
            const refused = `config: ${FILE}: slurm.poll_min must be a number from 1 to 35791; ${KEPT}`;
            const zero = configWith({ slurm: blockWith('slurm', { poll_min: 0 }) });
            await run.push(zero);
            await run.push(zero);
            expect(run.setters.hpc).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([refused]);

            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 15 }) }));
            expect(run.setters.hpc).toHaveBeenLastCalledWith(
                expect.objectContaining({ pollMin: 15 })
            );

            await run.push(zero);
            expect(run.lines()).toEqual([refused, refused]);

            // A push back to the value in force reads without a throw, so the next refusal is new.
            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 15 }) }));
            await run.push(zero);
            expect(run.lines()).toEqual([refused, refused, refused]);

            // A different message on the same group logs its own line.
            await run.push(configWith({ slurm: blockWith('slurm', { days: -1 }) }));
            expect(run.lines()).toHaveLength(4);
        }));

    it('refuses each group on its own, with its reader message, and lets the others take theirs', () =>
        inRun(async (run) => {
            const first = { slurm: blockWith('slurm', { poll_min: 0 }) };
            await run.push(
                configWith({ ...first, calendar: blockWith('calendar', { poll_min: 5 }) })
            );
            expect(run.setters.hpc).not.toHaveBeenCalled();
            expect(run.setters.calendar).toHaveBeenCalledExactlyOnceWith({
                pollMin: 5,
                daysBack: 1,
                daysAhead: 14
            });

            await run.push(
                configWith({
                    calendar: blockWith('calendar', { poll_min: 0 }),
                    mail: blockWith('mail', { per_signal: 0 }),
                    usage_refresh_min: 0,
                    usage_tiers: { a: 5 }
                })
            );
            expect(run.lines().slice(1)).toEqual([
                `config: ${FILE}: calendar.poll_min must be a number from 1 to 35791; ${KEPT}`,
                `config: ${FILE}: mail.per_signal must be a whole number from 1 to 500; ${KEPT}`,
                `config: ${FILE}: usage_refresh_min must be a number from 1 to 35791; ${KEPT}`,
                `config: ${FILE}: usage_tiers.a must be a string; ${KEPT}`
            ]);
            expect(run.setters.refresh).not.toHaveBeenCalled();
            expect(run.setters.tiers).not.toHaveBeenCalled();
        }));

    it('hands nothing on for a push whose values equal the ones in force (an audit)', () =>
        inRun(async (run) => {
            await run.push(inertConfig());
            await run.push(inertConfig());
            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([]);
        }));

    it('keeps every group and says so once for a push whose configuration is not a map', () =>
        inRun(async (run) => {
            for (const config of ['text', 3, null, [], undefined]) await run.push(config);
            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([`config: the pushed configuration is not a map; ${KEPT}`]);
        }));

    it('keeps the six groups, each logged once, when the merge dropped an unparseable behavior.yml', () =>
        inRun(async (run) => {
            // The shipped options catalog holds the default list of the Processes view, as it does
            // when only behavior.yml is lost; the whole-file finding is what refuses the default.
            const shipped = loadConfig(engineDir()).config;
            const unreadable = { text: inertConfig().text, options: shipped.options };
            const dropped = [{ file: '/hub/config/behavior.yml', key: '' }];
            await run.push(unreadable, dropped);
            await run.push(unreadable, dropped);

            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([
                `config: ${FILE}: slurm must be a map; ${KEPT}`,
                `config: ${FILE}: calendar must be a map; ${KEPT}`,
                `config: ${FILE}: mail must be a map; ${KEPT}`,
                `config: ${FILE}: usage_refresh_min must be a number from 1 to 35791; ${KEPT}`,
                `config: ${FILE}: usage_tiers must be a map; ${KEPT}`,
                `config: ${FILE}: processes must be a map; ${KEPT}`
            ]);

            // The same map without the finding is a behavior.yml that holds no processes: block,
            // and the Processes view takes the default the catalog holds.
            await run.push(unreadable);
            expect(run.setters.processes).toHaveBeenCalledExactlyOnceWith({
                patterns: ['python3', 'codex', 'claude', 'node', 'latexmk']
            });
        }));

    it('holds the settings of the last of two pushes made in quick succession', () =>
        inRun(async (run) => {
            // The second publish lands while the hub is still sending the first, so it is held and
            // delivered after it.
            for (const pollMin of [5, 7, 7]) {
                const config = configWith({ slurm: blockWith('slurm', { poll_min: pollMin }) });
                run.hub.publish('config', { config, findings: [] });
            }
            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 7 }) }));

            expect(
                run.setters.hpc.mock.calls.map((call) => (call[0] as { pollMin: number }).pollMin)
            ).toEqual([5, 7]);
        }));

    it('takes the sink off the hub on close, after which a push changes nothing and logs nothing', () =>
        inRun(async (run) => {
            const during = run.hub.size;
            run.context.close();
            expect(run.hub.size).toBe(during - 1);
            await run.push(configWith({ slurm: blockWith('slurm', { poll_min: 0, days: 14 }) }));
            for (const setter of Object.values(run.setters)) expect(setter).not.toHaveBeenCalled();
            expect(run.lines()).toEqual([]);
        }));

    it('builds a hook target without the notification settings, which the hook route reads at each request', () =>
        inRun((run) => {
            const keys = Object.keys(run.context.hooks).sort();
            expect(keys).toEqual(['hub', 'limiter', 'logged', 'recordFor', 'store']);
        }));

    it('logs a setter that throws once as its group failing, and the next push reaches the others', () =>
        inRun(async (run) => {
            run.setters.hpc.mockImplementation(() => {
                throw new Error('the poller broke');
            });
            const subscribed = run.hub.size;

            await run.push(
                configWith({
                    slurm: blockWith('slurm', { poll_min: 5 }),
                    calendar: blockWith('calendar', { poll_min: 5 })
                })
            );
            await run.push(
                configWith({
                    slurm: blockWith('slurm', { poll_min: 5 }),
                    calendar: blockWith('calendar', { poll_min: 7 })
                })
            );

            expect(run.lines()).toEqual([`config: the poller broke; ${KEPT}`]);
            expect(run.setters.hpc).toHaveBeenCalledTimes(2);
            expect(run.setters.calendar).toHaveBeenCalledTimes(2);
            expect(run.hub.size).toBe(subscribed);
        }));

    it('logs each other group whose setter throws, and the next push reaches the poller', async () => {
        const text = inertConfig().text as Record<string, Record<string, unknown>>;
        const pushes: [keyof ReturnType<typeof started>['setters'], Record<string, unknown>][] = [
            ['calendar', { calendar: blockWith('calendar', { poll_min: 5 }) }],
            ['mail', { mail: blockWith('mail', { poll_min: 4 }) }],
            ['refresh', { usage_refresh_min: 3 }],
            ['tiers', { usage_tiers: { max: 'Max' } }],
            ['processes', { processes: { patterns: ['claude'] } }],
            ['processesText', { text: { ...text, processes: { failed_empty: 'new empty' } } }],
            [
                'calendarWords',
                { text: { ...text, calendar: { ...text.calendar, ics_no_link: 'new link' } } }
            ],
            [
                'mailWords',
                {
                    text: {
                        ...text,
                        accounts: { ...text.accounts, timed_out: 'new timed out {0}' }
                    }
                }
            ]
        ];
        for (const [group, changes] of pushes) {
            await inRun(async (run) => {
                run.setters[group].mockImplementation(() => {
                    throw new Error(`the ${group} setter broke`);
                });
                const subscribed = run.hub.size;

                await run.push(
                    configWith({ ...changes, slurm: blockWith('slurm', { poll_min: 5 }) })
                );
                await run.push(
                    configWith({ ...changes, slurm: blockWith('slurm', { poll_min: 7 }) })
                );

                expect(run.setters[group]).toHaveBeenCalled();
                expect(
                    run
                        .lines()
                        .filter((line) => line === `config: the ${group} setter broke; ${KEPT}`)
                ).toHaveLength(1);
                expect(run.setters.hpc).toHaveBeenCalledTimes(2);
                expect(run.hub.size).toBe(subscribed);
            });
        }
    });

    it('stops at start-up naming the key for a cadence of 0, a day window of -1 and a count of 501', () => {
        const cases: [string, string, number | string, string][] = [
            ['slurm', 'poll_min', 0, 'a number from 1 to 35791'],
            ['slurm', 'days', -1, 'a whole number from 0 to 3650'],
            ['slurm', 'resource', '', 'a non-empty string'],
            ['mail', 'per_signal', 501, 'a whole number from 1 to 500']
        ];
        for (const [block, key, value, words] of cases) {
            expect(() =>
                createServerContext('/engine', {
                    ...inertDependencies(),
                    loadConfig: () => ({
                        config: configWith({ [block]: blockWith(block, { [key]: value }) }),
                        findings: []
                    })
                })
            ).toThrow(`${block}.${key} must be ${words}`);
        }
    });
});
