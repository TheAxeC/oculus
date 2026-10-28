// Layer 2, route tests. The Live HPC POST route is tested at its body checks and across each of its
// three injected actions.

import { describe, expect, it, vi } from 'vitest';
import {
    cancel,
    log,
    logPathsOf,
    type ClusterLogPaths
} from '../../../src/lib/server/machine/hpc/actions.ts';
import type { ClusterConnection } from '../../../src/lib/server/machine/hpc/clusters/connections.ts';
import { handleHpc, type HpcTarget } from '../../../src/lib/server/machine/hpc/routes.ts';
import type { Runner } from '../../../src/lib/server/machine/hpc/ssh.ts';
import { submitState } from '../../../src/lib/server/machine/hpc/submit.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';
const target = (over: Partial<HpcTarget> = {}): HpcTarget => {
    const server = contextFixture({ token: 'token' });
    return {
        connection: (resource) =>
            resource === 'fixture'
                ? { connection: { resource, name: 'Fixture', host: 'fixture' } }
                : { missing: `${resource} is not listed`, unlisted: true },
        clusters: () => [{ resource: 'fixture', name: 'Fixture', id: null }],
        token: server.token,
        refresh: vi.fn(() => server.hpc.refresh()),
        refreshAll: vi.fn(() => server.hpc.refresh()),
        cancel: vi.fn(() => Promise.resolve({ status: 'ok' })),
        log: vi.fn(() => Promise.resolve({ status: 'ok', log: 'x', path: '/x' })),
        roots: () => [],
        projects: () => [],
        catalog: () => ({}),
        kept: vi.fn(() => Promise.resolve({ ok: false as const, error: 'unused' })),
        copy: vi.fn(() => Promise.resolve({ stdout: '', stderr: '', code: 0 })),
        ssh: vi.fn(() => Promise.resolve({ stdout: '', stderr: '', code: 0 })),
        submits: submitState(),
        say: vi.fn(),
        ...over
    };
};
const request = (body: unknown) =>
    new Request('http://127.0.0.1:8791/api/hpc', {
        method: 'POST',
        headers: {
            origin: 'http://127.0.0.1:8791',
            host: '127.0.0.1:8791',
            'x-oculus-token': 'token'
        },
        body: JSON.stringify(body)
    });
describe('HPC route', () => {
    it('dispatches refresh, cancel, and log', async () => {
        for (const body of [
            { action: 'refresh' },
            { action: 'refresh', resource: 'fixture' },
            { action: 'cancel', resource: 'fixture', id: '42' },
            { action: 'log', resource: 'fixture', id: '42' }
        ])
            expect((await handleHpc(request(body), target())).status).toBe(200);
    });

    it('refuses a cancel and a log that name no cluster before any runner', async () => {
        const cancelled = vi.fn(() => Promise.resolve({ status: 'ok' }));
        const read = vi.fn(() => Promise.resolve({ status: 'ok', log: 'x', path: '/x' }));
        const answered = target({ cancel: cancelled, log: read });
        const bare = await handleHpc(request({ action: 'cancel', id: '42' }), answered);
        expect(bare.status).toBe(400);
        const other = await handleHpc(
            request({ action: 'log', resource: 'elsewhere', id: '42' }),
            answered
        );
        expect(await other.json()).toEqual({
            status: 'error',
            hint: 'elsewhere is not listed',
            log: '',
            path: ''
        });
        expect(cancelled).not.toHaveBeenCalled();
        expect(read).not.toHaveBeenCalled();
    });

    it('cancels job 123 and reads its log only on the cluster its row names, of two (G34)', async () => {
        const clusters: Record<string, ClusterConnection> = {
            a: { resource: 'a', name: 'A', host: 'a-host' },
            b: { resource: 'b', name: 'B', host: 'b-host' }
        };
        const asked: { host: string; remote: string }[] = [];
        const runner: Runner = (connection, remote) => {
            asked.push({ host: connection.host, remote });
            const found = `@@oculus:logpath=/${connection.host}/log-123.out\nline\n`;
            return Promise.resolve({
                stdout: remote.startsWith('jid=') ? found : '',
                stderr: '',
                code: 0
            });
        };
        const paths: ClusterLogPaths = new Map();
        const answered = target({
            connection: (resource) =>
                Object.hasOwn(clusters, resource)
                    ? { connection: clusters[resource] }
                    : { missing: `${resource} is not listed`, unlisted: true },
            cancel: (connection, id) => cancel(connection, id, runner),
            log: (connection, id) =>
                log(connection, id, logPathsOf(paths, connection.resource), runner)
        });
        await handleHpc(request({ action: 'cancel', resource: 'b', id: '123' }), answered);
        expect(asked).toEqual([{ host: 'b-host', remote: 'scancel 123' }]);
        asked.length = 0;
        await handleHpc(request({ action: 'log', resource: 'b', id: '123' }), answered);
        await handleHpc(request({ action: 'log', resource: 'a', id: '123' }), answered);
        expect(asked.map((one) => one.host)).toEqual(['b-host', 'a-host']);
        expect(asked[1].remote).toContain("p=''");
        expect(asked[1].remote).not.toContain('/b-host/');
        expect(paths.get('b')?.get('123')).toBe('/b-host/log-123.out');
        expect(paths.get('a')?.get('123')).toBe('/a-host/log-123.out');
    });
});
