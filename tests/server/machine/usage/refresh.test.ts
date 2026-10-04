// Layer 4, server test. Route authorization without starting processes.

import { describe, expect } from 'vitest';
import {
    handleUsageRefresh,
    type UsageRefreshTarget
} from '../../../../src/lib/server/machine/usage/routes.ts';
import { contextFixture } from '../../root/context-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';

function request(body: unknown, token = 'write-token'): Request {
    return new Request('http://127.0.0.1:8791/api/usage/refresh', {
        method: 'POST',
        headers: {
            host: '127.0.0.1:8791',
            origin: 'http://127.0.0.1:8791',
            'content-type': 'application/json',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

describe('usage refresh route', () => {
    it('refreshes exactly the requested account behind the write token', async () => {
        const labels: string[] = [];
        const server = contextFixture({ token: 'write-token' });
        const target: UsageRefreshTarget = {
            token: server.token,
            refresh: (label) => {
                labels.push(label);
                return Promise.resolve(label === 'University');
            }
        };
        const response = await handleUsageRefresh(request({ account: 'University' }), target);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: 'ok' });
        expect(labels).toEqual(['University']);
        expect(
            (await handleUsageRefresh(request({ account: 'University' }, 'bad'), target)).status
        ).toBe(403);
        expect(labels).toEqual(['University']);
        expect((await handleUsageRefresh(request({ account: 'Missing' }), target)).status).toBe(
            404
        );
    });
});
