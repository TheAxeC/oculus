// Layer 2, route tests. POST /api/ops with the `preview` operation (handleOps of
// server/files/fs/ops.ts, the previewReplace of server/files/fs/replace.ts under it). Nothing is
// ever written.
//
// The cases tagged slow start a real HTTP server. A hook loads the configuration once, since the
// first load costs more than a later one, so no case pays for it.

import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect } from 'vitest';
import { warmConfig } from '../edit/write-fixture.ts';
import { previewRequest } from '../../../src/lib/data/file-ops.ts';
import type { DiffRequest } from '../../../src/lib/state/sources/repositories/answers.ts';
import { handleOps } from '../../../src/lib/server/files/fs/ops.ts';
import { it, test } from '../../fixtures/scratch.ts';
import { TOKEN as OPS_TOKEN } from '../../server/files/ops-fixture.ts';
import { queryOf, replaceWorld, type ReplaceWorld } from './replace-fixture.ts';

const place = { root: 'hub', path: 'a.txt' };

test.beforeAll(warmConfig);

/** POST a message to a real HTTP server that hands it to handleOps, as a running server would. */
async function overHttp(w: ReplaceWorld, message: unknown, headers: Record<string, string>) {
    const answer = await sent(w, {
        url: '/api/ops',
        init: {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify(message)
        }
    });
    return { status: answer.status, body: JSON.parse(answer.text) as Record<string, unknown> };
}

/**
 * Send one request to a real HTTP server that hands what it receives to handleOps, as a running
 * server would; a request node's server refuses (an address over its header limit) never reaches
 * the handler.
 */
async function sent(w: ReplaceWorld, request: DiffRequest) {
    const server = createServer((incoming, outgoing) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
        incoming.on('end', () => {
            const forwarded = new Request('http://localhost/api/ops', {
                method: 'POST',
                headers: incoming.headers as Record<string, string>,
                body: Buffer.concat(chunks)
            });
            void handleOps(forwarded, OPS_TOKEN, w.ops).then(async (response) => {
                outgoing.statusCode = response.status;
                outgoing.end(await response.text());
            });
        });
    });
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    try {
        const { port } = server.address() as AddressInfo;
        const response = await fetch(`http://127.0.0.1:${port}${request.url}`, request.init);
        return { status: response.status, text: await response.text() };
    } finally {
        server.close();
    }
}

describe('the preview request', () => {
    it(
        'refuses a preview posted without the write token and reads nothing',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'foo\n' });
            const message = previewRequest(place, {
                query: queryOf('foo'),
                replace: 'bar',
                preserveCase: false,
                hits: [{ line: 1, at: 0 }]
            });
            const answer = await overHttp(w, message, {});
            expect(answer.status).toBe(403);
            expect(answer.body.error).toBe('token');
        }
    );
});
