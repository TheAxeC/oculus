// Layer 2, route tests. The Live HPC POST route is tested at its body checks and across each of its
// three injected actions.

import { describe, expect, it, vi } from 'vitest';
import { handleHpc, type HpcTarget } from '../../../src/lib/server/machine/hpc/routes.ts';
import { submitState } from '../../../src/lib/server/machine/hpc/submit.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';
const target = (over: Partial<HpcTarget> = {}): HpcTarget => {
    const server = contextFixture({ token: 'token' });
    return {
        where: () => ({ host: 'fixture' }),
        token: server.token,
        refresh: vi.fn(() => server.hpc.refresh()),
        cancel: vi.fn(() => Promise.resolve({ status: 'ok' })),
        log: vi.fn(() => Promise.resolve({ status: 'ok', log: 'x', path: '/x' })),
        roots: () => [],
        projects: () => [],
        primary: 'hub',
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
            { action: 'cancel', id: '42' },
            { action: 'log', id: '42' }
        ])
            expect((await handleHpc(request(body), target())).status).toBe(200);
    });
});
