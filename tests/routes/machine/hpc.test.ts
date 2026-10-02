// The Live HPC POST route is tested at its body checks and across each of its three injected
// actions.
import { describe, expect, it, vi } from 'vitest';
import { handleHpc, type HpcTarget } from '../../../src/lib/server/machine/hpc/routes.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';
const target = (over: Partial<HpcTarget> = {}): HpcTarget => {
    const server = contextFixture({ token: 'token' });
    return {
        where: () => ({ host: 'fixture' }),
        token: server.token,
        refresh: vi.fn(() => server.hpc.refresh()),
        cancel: vi.fn(() => Promise.resolve({ status: 'ok' })),
        log: vi.fn(() => Promise.resolve({ status: 'ok', log: 'x', path: '/x' })),
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
    it('refuses a cancel and a log while there is no host, with the sentence, and runs neither', async () => {
        const none = target({ where: () => ({ host: '', missing: 'nowhere names no resource' }) });
        const hint = 'nowhere names no resource';
        for (const [body, answer] of [
            [
                { action: 'cancel', id: '42' },
                { status: 'error', hint }
            ],
            [
                { action: 'log', id: '42' },
                { status: 'error', hint, log: '', path: '' }
            ]
        ] as const) {
            const response = await handleHpc(request(body), none);
            expect(response.status).toBe(200);
            expect(await response.json()).toEqual(answer);
        }
        expect(none.cancel).not.toHaveBeenCalled();
        expect(none.log).not.toHaveBeenCalled();
    });

    it('refreshes while there is no host', async () => {
        const none = target({ where: () => ({ host: '', missing: 'nowhere names no resource' }) });
        expect((await handleHpc(request({ action: 'refresh' }), none)).status).toBe(200);
        expect(none.refresh).toHaveBeenCalledOnce();
    });

    it('refreshes without reading the host, so a host that cannot be read stops no refresh', async () => {
        const where = vi.fn((): { host: string } => {
            throw new Error('text catalog: hpc.host_unknown must be a string');
        });
        const broken = target({ where });
        expect((await handleHpc(request({ action: 'refresh' }), broken)).status).toBe(200);
        expect(broken.refresh).toHaveBeenCalledOnce();
        expect(where).not.toHaveBeenCalled();
    });
});
