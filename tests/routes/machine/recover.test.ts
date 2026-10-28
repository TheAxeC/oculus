// Layer 2, route tests. The /api/recover route (G1 and the request checks): a POST without the
// page's write token, or with a wrong one, is refused with 403 before anything is read or run; a
// POST that is no Recover request is refused with 400; a GET is a read of the dataset's plan on its
// target, with the version of the `recover` channel it was read at. The channel is the Recover
// watcher's push: a fetch the POST starts is pushed with its bytes and pushed again when its
// process exits, and the sessions Live HPC's batch lists on the socket are each read back to the
// longest hub name they start with.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { RecoverLive } from '../../../src/lib/data/model/index.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import type { Connection } from '../../../src/lib/server/machine/hpc/ssh.ts';
import { watchRecover } from '../../../src/lib/server/machine/runs/recover/live/watch.ts';
import { localDeps } from '../../../src/lib/server/machine/runs/recover/local.ts';
import {
    handleRecover,
    handleRecoverState
} from '../../../src/lib/server/machine/runs/recover/routes.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    datasetOf,
    loginNode,
    recoverRequest,
    shell,
    standIns,
    targetOf
} from '../../server/machine/runs/recover/harness.ts';
import { answering, ranged } from '../../server/machine/runs/recover/recorded.ts';

const URL_A = 'https://h.example/a.dat';

/** The process a pid names while the fetch runs, as `ps` would report it. */
const LIVE = { start: 'Mon Oct 19 10:00:00 2026', command: 'sh /h/mitdb.fetch.sh' };

/** The latest push of the `recover` channel. */
function liveOf(channels: Hub): RecoverLive {
    const message = channels.latest('recover');
    if (message === undefined) throw new Error('nothing was pushed');
    return message.payload as RecoverLive;
}

/** The route's target over mitdb with one url file, its fetch and the fetch's start recorded. */
function recoverTarget() {
    const startDetached = vi.fn(() => 1);
    const local = { ...localDeps(scratchDir('oculus-recover-home-'), new Map()), startDetached };
    const { fetch, asked } = answering({ [URL_A]: ranged(10) });
    const target = targetOf(datasetOf([{ kind: 'url', urls: [{ url: URL_A }] }]), fetch, local);
    return { target, startDetached, asked };
}

/** A POST to the route with the headers given in place of the page's. */
function posted(headers: Record<string, string>): Request {
    return new Request('http://127.0.0.1:8791/api/recover', {
        method: 'POST',
        headers: { origin: 'http://127.0.0.1:8791', host: '127.0.0.1:8791', ...headers },
        body: JSON.stringify({ action: 'fetch', target: 'mac', hub: 'research-hub', key: 'mitdb' })
    });
}

describe('the recover route', () => {
    it.each<{ name: string; headers: Record<string, string> }>([
        { name: 'no token', headers: {} },
        { name: 'a wrong token', headers: { 'x-oculus-token': 'wrong' } },
        { name: 'an empty token', headers: { 'x-oculus-token': '' } }
    ])(
        'refuses a request with $name with 403, before anything is read or run (G1)',
        async (one) => {
            const { target, startDetached, asked } = recoverTarget();
            const answer = await handleRecover(posted(one.headers), target);
            expect(answer.status).toBe(403);
            expect(asked).toEqual([]);
            expect(startDetached).not.toHaveBeenCalled();
        }
    );

    it.each([
        {
            name: 'an unknown action',
            body: { action: 'delete', target: 'mac', hub: 'research-hub', key: 'mitdb' },
            status: 400,
            refused: 'request'
        },
        {
            name: 'a target that is no key',
            body: { action: 'fetch', target: '../cloud', hub: 'research-hub', key: 'mitdb' },
            status: 400,
            refused: 'request'
        },
        {
            name: 'a target slurm.resource does not list',
            body: { action: 'fetch', target: 'cloud', hub: 'research-hub', key: 'mitdb' },
            status: 400,
            refused: 'target',
            hint: 'cloud is not listed'
        },
        {
            name: 'a file that is no text',
            body: { action: 'fetch', target: 'mac', hub: 'research-hub', key: 'mitdb', file: 3 },
            status: 400,
            refused: 'request'
        },
        {
            name: 'a hub the workspace does not hold',
            body: { action: 'fetch', target: 'mac', hub: 'other', key: 'mitdb' },
            status: 400,
            refused: 'dataset'
        },
        {
            name: 'a key no dataset has',
            body: { action: 'fetch', target: 'mac', hub: 'research-hub', key: 'eicu' },
            status: 404,
            refused: 'dataset'
        },
        {
            name: 'the cluster with no host',
            body: { action: 'fetch', target: 'cluster', hub: 'research-hub', key: 'mitdb' },
            status: 200,
            refused: 'host',
            hint: 'no host'
        }
    ])(
        'refuses $name, and starts nothing',
        async (one: { body: object; status: number; refused: string; hint?: string }) => {
            const { target, startDetached } = recoverTarget();
            const answer = await handleRecover(recoverRequest({ ...one.body }), target);
            expect(answer.status).toBe(one.status);
            expect(await answer.json()).toEqual({
                refused: one.refused,
                ...(one.hint === undefined ? {} : { hint: one.hint })
            });
            expect(startDetached).not.toHaveBeenCalled();
        }
    );

    it('starts a fetch with the token, and refuses a set Recover does not run', async () => {
        const { target, startDetached } = recoverTarget();
        const answer = await handleRecover(
            recoverRequest({ action: 'fetch', target: 'mac', hub: 'research-hub', key: 'mitdb' }),
            target
        );
        expect(await answer.json()).toEqual({ started: 'fetch' });
        expect(startDetached).toHaveBeenCalledTimes(1);
        const stated = targetOf(
            datasetOf([{ kind: 'request', contact: 'the PI' }], { recover: false }),
            target.fetch,
            target.local
        );
        const refused = await handleRecover(
            recoverRequest({ action: 'fetch', target: 'mac', hub: 'research-hub', key: 'mitdb' }),
            stated
        );
        expect(refused.status).toBe(400);
        expect(await refused.json()).toEqual({ refused: 'kind' });
    });

    it('reads the plan of a dataset on this Mac without a token', async () => {
        const { target } = recoverTarget();
        const answer = await handleRecoverState(
            recoverRequest(
                new URLSearchParams({ target: 'mac', hub: 'research-hub', key: 'mitdb' })
            ),
            target
        );
        expect(answer.status).toBe(200);
        expect(answer.headers.get('cache-control')).toBe('no-store');
        const body = (await answer.json()) as {
            folder: string;
            plan: { rows: { name: string; state: string }[] };
        };
        expect(body.folder).toBe('~/data/mitdb');
        expect(body.plan.rows.map((one) => [one.name, one.state])).toEqual([['a.dat', 'missing']]);
    });

    it('answers a cluster that ssh cannot reach as unreachable, with no plan of missing files', async () => {
        const { target } = recoverTarget();
        const commands: string[] = [];
        const cluster = {
            resource: 'cluster',
            connection: { host: 'login' },
            runner: (_connection: Connection, remote: string) => {
                commands.push(remote);
                return Promise.resolve({
                    stdout: '',
                    stderr: 'ssh: connect to host login port 22: Operation timed out',
                    code: 255
                });
            },
            copy: () => Promise.resolve({ stdout: '', stderr: '', code: 0 }),
            home: scratchDir('oculus-recover-mac-'),
            nodeVersion: 'v24.0.0',
            nodeDownload: '',
            sevenZip: () => ''
        };
        const entry = datasetOf([{ kind: 'url', urls: [{ url: URL_A }] }]);
        const answer = await handleRecoverState(
            recoverRequest(
                new URLSearchParams({ target: 'cluster', hub: 'research-hub', key: 'mitdb' })
            ),
            targetOf(entry, target.fetch, target.local, cluster)
        );
        expect(answer.status).toBe(200);
        expect(await answer.json()).toEqual({ refused: 'unreachable' });
        expect(commands).toHaveLength(1);
    });

    it(
        'pushes the sessions on the socket, each read back to the longest hub name it starts with',
        { tags: ['slow'] },
        () => {
            const stand = standIns(['tmux'], { tmux: 'research-hub-two-mitdb' });
            const node = loginNode(stand);
            const channels = new Hub();
            const watcher = watchRecover(channels, {
                home: scratchDir('oculus-recover-home-'),
                places: () => [{ hub: 'research-hub', key: 'mitdb', path: '~/data/mitdb' }],
                hubs: () => ['research-hub', 'research-hub-two'],
                pollCluster: () => undefined,
                readCluster: () => undefined
            });
            try {
                const one = watcher.section('cluster');
                const section = shell(one.command(), stand, node.remoteHome);
                one.take(section.stdout, []);
                expect(liveOf(channels).sessions).toEqual({
                    cluster: [
                        { hub: 'research-hub-two', key: 'mitdb', done: 0, total: null, rate: null }
                    ]
                });
            } finally {
                watcher.close();
            }
        }
    );

    // The route's press is the watcher's start: the push after the answered POST holds the run with
    // the bytes its folder holds, and the exit of the process the fetch started pushes its end. No
    // case waits on a timer: the watcher reads at the press and at the exit.
    it('pushes a fetch the POST started with its bytes, and its end when its process exits', async () => {
        const home = scratchDir('oculus-recover-home-');
        mkdirSync(join(home, 'data', 'mitdb'), { recursive: true });
        writeFileSync(join(home, 'data', 'mitdb', 'a.dat'), '0123');
        let alive = true;
        let exited = (): void => undefined;
        const channels = new Hub();
        const watcher = watchRecover(channels, {
            home,
            places: () => [{ hub: 'research-hub', key: 'mitdb', path: '~/data/mitdb' }],
            hubs: () => ['research-hub'],
            pollCluster: () => undefined,
            readCluster: () => undefined,
            local: {
                startDetached: (_script, exit) => {
                    exited = exit;
                    return 4242;
                },
                processOf: (pid) => (alive && pid === 4242 ? LIVE : null)
            }
        });
        try {
            const { fetch } = answering({ [URL_A]: ranged(10) });
            const entry = datasetOf([{ kind: 'url', urls: [{ url: URL_A }] }]);
            const target = targetOf(entry, fetch, watcher.local, undefined, watcher);
            const read = recoverRequest(
                new URLSearchParams({ target: 'mac', hub: 'research-hub', key: 'mitdb' })
            );
            const before = (await (await handleRecoverState(read, target)).json()) as {
                live: number;
            };
            expect(before.live).toBe(channels.version('recover'));
            const answer = await handleRecover(
                recoverRequest({
                    action: 'fetch',
                    target: 'mac',
                    hub: 'research-hub',
                    key: 'mitdb'
                }),
                target
            );
            expect(await answer.json()).toEqual({ started: 'fetch' });
            const running = liveOf(channels).runs;
            expect(running).toMatchObject([
                {
                    hub: 'research-hub',
                    key: 'mitdb',
                    target: 'mac',
                    state: 'running',
                    run: { action: 'fetch' },
                    bytes: 4,
                    size: 10
                }
            ]);
            expect(running[0].version).toBeGreaterThan(before.live);

            alive = false;
            exited();
            const ended = liveOf(channels).runs;
            expect(ended).toMatchObject([{ state: 'ended', run: null, bytes: 4, size: 10 }]);
            expect(ended[0].log.at(-1)).toMatch(/ fetch: started for 1 files$/);
        } finally {
            watcher.close();
        }
    });
});
