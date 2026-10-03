// Layer 2, server tests. The Live HPC host a server context hands the poller: the `hpc_host` of
// local.yml when it names one, else the ssh alias of the cluster `slurm.resource` names in the
// resources of the latest portfolio snapshot, else no host and the sentence for why. Each case
// builds a whole context over recording doubles and reads what the poller was handed at start, at a
// local.yml written again, at a configuration push and after a portfolio rebuild.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { describe, expect, vi } from 'vitest';
import type { Resource } from '../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import type { HpcOptions } from '../../../../src/lib/server/machine/hpc/poll.ts';
import {
    createServerContext,
    type ContextDependencies
} from '../../../../src/lib/server/root/context.ts';
import type { WatchOptions } from '../../../../src/lib/server/root/watch/portfolio.ts';
import { noop, noopAsync } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import {
    blockWith,
    clusters,
    configWith,
    inertConfig,
    inertDependencies,
    inertHpc,
    portfolioOf
} from '../../root/context-fixture.ts';

type Values = Record<string, unknown>;

/** A case body run over a started context, closed and with its stderr spy restored after. */
async function within<T extends { context: { close(): void }; restore(): void }>(
    run: T,
    body: (run: T) => void | Promise<void>
): Promise<void> {
    try {
        await body(run);
    } finally {
        run.context.close();
        run.restore();
    }
}

/** Let the hub deliver what it held back behind a send. */
async function settle(): Promise<void> {
    for (let turn = 0; turn < 3; turn += 1) await Promise.resolve();
}

describe('the host through a local.yml written again and a portfolio rebuild', () => {
    /** A local.yml with the hub, the port and one account, and the keys a case adds. */
    const localWith = (scratch: string, extra: Values = {}): Values => ({
        hub: join(scratch, 'hub-a'),
        port: 8791,
        accounts: [{ tool: 'claude', dir: join(scratch, 'claude-a'), label: 'claude' }],
        ...extra
    });

    /**
     * A context over a scratch engine whose local.yml the case rewrites. The portfolio watcher
     * double publishes `resources` as the snapshot, or nothing when it is null, and keeps the
     * options it was given so a case can end a rebuild.
     */
    function started(initial: Values, resources: Record<string, Resource> | null = clusters()) {
        const engine = scratchDir('oculus-host-');
        mkdirSync(join(engine, 'config'));
        const file = join(engine, 'config', 'local.yml');
        const setters = { hpc: vi.fn() };
        const hpcOptions: HpcOptions[] = [];
        const portfolioOptions: WatchOptions[] = [];
        const changed: (() => void)[] = [];
        const hub = new Hub();
        const inert = inertDependencies(setters);
        delete inert.loadLocal;
        const dependencies: Partial<ContextDependencies> = {
            ...inert,
            createHub: () => hub,
            watchPortfolio: (_hub, _paths, extra = {}) => {
                portfolioOptions.push(extra);
                if (resources !== null) _hub.publish('portfolio', portfolioOf(resources));
                return { close: noop };
            },
            watchHpc: (_hub, given) => {
                hpcOptions.push(given);
                return { refresh: noopAsync, set: setters.hpc, close: noop };
            },
            watchLocal: (_engine, onChange) => {
                changed.push(onChange);
                return { close: noop };
            }
        };
        const write = (values: Values): void => {
            writeFileSync(file, stringify(values));
        };
        write(initial);
        const context = createServerContext(engine, dependencies);
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        return {
            context,
            hub,
            setters,
            hpcOptions,
            write,
            /** The watch's call, as a write of the file makes it. */
            reload: (): void => {
                changed[0]();
            },
            /** A rebuild that came to hold these resources, as the portfolio watcher ends it. */
            rebuilt: (next: Record<string, Resource>): void => {
                hub.publish('portfolio', portfolioOf(next));
                portfolioOptions.at(-1)?.built?.();
            },
            /** The settings the poller was last handed. */
            last: (): unknown => setters.hpc.mock.lastCall?.[0],
            lines: (): string[] => said.mock.calls.map((call) => String(call[0])),
            restore: (): void => {
                said.mockRestore();
            }
        };
    }

    it('hands the poller the host an hpc_host written names, and the host of the cluster slurm.resource names when it is removed', () => {
        const scratch = scratchDir('oculus-host-local-');
        return within(started(localWith(scratch)), (run) => {
            expect(run.hpcOptions[0]).toMatchObject({
                host: 'cluster',
                days: 2,
                pollMin: 1,
                quotaMin: 5,
                prewarm: false
            });
            expect(run.hpcOptions[0]?.logPaths).toBeInstanceOf(Map);
            run.write(localWith(scratch, { hpc_host: 'login-two' }));
            run.reload();
            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith(inertHpc('login-two'));

            run.write(localWith(scratch));
            run.reload();
            expect(run.setters.hpc).toHaveBeenCalledTimes(2);
            expect(run.setters.hpc).toHaveBeenLastCalledWith(
                expect.objectContaining({ host: 'cluster' })
            );
        });
    });

    it('resolves the host again after each portfolio rebuild, and says why when the cluster has none', () => {
        const scratch = scratchDir('oculus-host-rebuild-');
        return within(started(localWith(scratch)), (run) => {
            run.rebuilt(clusters('cluster2'));
            expect(run.last()).toMatchObject({ host: 'cluster2' });
            run.rebuilt({ cluster: { ...clusters().cluster, host: undefined } });
            expect(run.last()).toMatchObject({
                host: '',
                missing: 'the cluster cluster has no host'
            });
            run.rebuilt(clusters('cluster'));
            expect(run.last()).toMatchObject({ host: 'cluster' });
            expect(run.setters.hpc).toHaveBeenCalledTimes(3);
            run.rebuilt(clusters('cluster'));
            expect(run.setters.hpc).toHaveBeenCalledTimes(3);
        });
    });

    it('keeps the host an hpc_host written names through a rebuild that ends after the write and one after that', () => {
        const scratch = scratchDir('oculus-host-inflight-');
        return within(started(localWith(scratch)), (run) => {
            // The write lands while a rebuild is under way: the snapshot it will replace is held.
            run.write(localWith(scratch, { hpc_host: 'login-two' }));
            run.reload();
            expect(run.last()).toMatchObject({ host: 'login-two' });
            run.rebuilt(clusters('cluster2'));
            run.rebuilt({ cluster: { ...clusters().cluster, host: undefined } });
            expect(run.last()).toMatchObject({ host: 'login-two' });
            expect(run.setters.hpc).toHaveBeenCalledOnce();
        });
    });

    it('hands the poller nothing for a rebuild that ends after the context is closed', () => {
        const scratch = scratchDir('oculus-host-closed-');
        const run = started(localWith(scratch));
        try {
            run.context.close();
            run.rebuilt(clusters('cluster2'));
            run.write(localWith(scratch, { hpc_host: 'login-two' }));
            run.reload();
            expect(run.setters.hpc).not.toHaveBeenCalled();
        } finally {
            run.restore();
        }
    });

    it('starts with no host and the sentence when no snapshot was published, and resolves it at the next rebuild', () => {
        const scratch = scratchDir('oculus-host-nosnapshot-');
        return within(started(localWith(scratch), null), (run) => {
            expect(run.hpcOptions[0]).toMatchObject({ host: '', missing: 'not read yet' });
            run.rebuilt(clusters());
            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ host: 'cluster' })
            );
        });
    });
});

describe('the host through a configuration push', () => {
    const KEPT = 'the settings in force are kept';
    const FILE = 'config/behavior.yml';

    /** A context over recording doubles, and what it printed under the `config:` prefix. */
    function started(hpcHost?: string) {
        const hub = new Hub();
        const setters = { hpc: vi.fn() };
        const context = createServerContext('/engine', {
            ...inertDependencies(setters),
            createHub: () => hub,
            loadLocal: () => ({
                ...{ hub: '/hub', port: 8791, claudeBin: 'claude', accounts: [], calendars: [] },
                ...{ mail: [], ...(hpcHost === undefined ? {} : { hpcHost }) }
            })
        });
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        return {
            context,
            setters,
            push: async (config: unknown): Promise<void> => {
                hub.publish('config', { config, findings: [] });
                await settle();
            },
            lines: (): string[] =>
                said.mock.calls
                    .map((call) => String(call[0]))
                    .filter((line) => line.startsWith('config:')),
            restore: (): void => {
                said.mockRestore();
            }
        };
    }

    it('keeps the host the machine names, so a pushed slurm.resource reaches the poller only without one', async () => {
        await within(started('machine-host'), async (run) => {
            await run.push(configWith({ slurm: blockWith('slurm', { resource: 'other' }) }));
            // A pushed resource that the machine's own host overrides changes nothing: no new poll.
            expect(run.setters.hpc).not.toHaveBeenCalled();
            await run.push(
                configWith({ slurm: blockWith('slurm', { resource: 'other', days: 14 }) })
            );
            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ host: 'machine-host', days: 14 })
            );
        });
        await within(started(), async (run) => {
            await run.push(configWith({ slurm: blockWith('slurm', { resource: 'other' }) }));
            expect(run.setters.hpc).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ host: '', missing: 'other names no resource' })
            );
        });
    });

    it('hands the poller a pushed sentence at once while the host stays empty', async () => {
        await within(started(), async (run) => {
            const slurm = blockWith('slurm', { resource: 'nowhere' });
            await run.push(configWith({ slurm }));
            expect(run.setters.hpc).toHaveBeenLastCalledWith(
                expect.objectContaining({ host: '', missing: 'nowhere names no resource' })
            );
            const text = inertConfig().text as Record<string, Record<string, unknown>>;
            const reworded = { ...text, hpc: { ...text.hpc, host_unknown: 'no resource {0}' } };
            await run.push(configWith({ slurm, text: reworded }));
            expect(run.setters.hpc).toHaveBeenCalledTimes(2);
            expect(run.setters.hpc).toHaveBeenLastCalledWith(
                expect.objectContaining({ host: '', missing: 'no resource nowhere' })
            );
        });
    });

    it('keeps the settings in force and logs once for a block with no resource, or with host: and no resource:', () =>
        within(started(), async (run) => {
            const { resource, ...bare } = blockWith('slurm', {});
            expect(resource).toBe('cluster');
            const refused = `config: ${FILE}: slurm.resource must be a non-empty string; ${KEPT}`;
            await run.push(configWith({ slurm: bare }));
            await run.push(configWith({ slurm: { ...bare, host: 'utwente' } }));
            expect(run.lines()).toEqual([refused]);
            expect(run.setters.hpc).not.toHaveBeenCalled();
        }));
});
