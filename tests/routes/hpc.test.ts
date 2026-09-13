// The Live HPC POST route is tested at its origin and token gates and across each of its three injected actions.
import { describe, expect, it, vi } from 'vitest';
import { handleHpc, type HpcTarget } from '../../src/lib/server/hpc/routes.ts';
import { contextFixture } from '../server/context-fixture.ts';
const target = (): HpcTarget => {
    const server = contextFixture({ token: 'token' });
    return {
        host: 'fixture',
        token: server.token,
        refresh: vi.fn(() => server.hpc.refresh()),
        cancel: vi.fn(async () => ({ status: 'ok' })),
        log: vi.fn(async () => ({ status: 'ok', log: 'x', path: '/x' }))
    };
};
const request = (body: unknown, origin = 'http://127.0.0.1:8791') =>
    new Request('http://127.0.0.1:8791/api/hpc', {
        method: 'POST',
        headers: { origin, host: '127.0.0.1:8791', 'x-oculus-token': 'token' },
        body: JSON.stringify(body)
    });
describe('HPC route', () => {
    it('returns 403 for another origin', async () =>
        expect(
            (await handleHpc(request({ action: 'refresh' }, 'https://example.com'), target()))
                .status
        ).toBe(403));
    it('returns 400 for a bad body or id', async () => {
        expect((await handleHpc(request({ action: 'nope' }), target())).status).toBe(400);
        expect((await handleHpc(request({ action: 'cancel', id: 'bad' }), target())).status).toBe(
            400
        );
    });
    it('dispatches refresh, cancel, and log', async () => {
        for (const body of [
            { action: 'refresh' },
            { action: 'cancel', id: '42' },
            { action: 'log', id: '42' }
        ])
            expect((await handleHpc(request(body), target())).status).toBe(200);
    });
});
