// Layer 4, route test. POST /api/ops with the `preview` operation (handleOps of
// server/files/fs/ops.ts, the previewReplace of server/files/fs/replace.ts under it): the file as
// it is on the left and with the named matches replaced on the right, which matches it replaces,
// the words it refuses with, and a file with thousands of hits carried over a real HTTP server.
// Nothing is ever written.
//
// ripgrep is the real binary of the `@vscode/ripgrep` dependency.

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { previewRequest } from '../../../src/lib/data/file-ops.ts';
import {
    diffRequest,
    type DiffRequest
} from '../../../src/lib/state/sources/repositories/answers.ts';
import { diffState } from '../../../src/lib/state/sources/repositories/repositories.ts';
import { previewSubject } from '../../../src/lib/state/sources/repositories/replace-preview.ts';
import { handleOps } from '../../../src/lib/server/files/fs/ops.ts';
import { it } from '../../fixtures/scratch.ts';
import { TOKEN as OPS_TOKEN } from '../../server/files/ops-fixture.ts';
import { previewPost, queryOf, replaceWorld, type ReplaceWorld } from './replace-fixture.ts';

const place = { root: 'hub', path: 'a.txt' };

/** The two sides of a preview's one file, or the answer when it was refused. */
function sides(answer: { body: Record<string, unknown> }) {
    const files = answer.body.files as { original: string; modified: string; newPath: string }[];
    return files[0];
}

describe('the preview of a replace in one file', () => {
    it('holds the file as it is on the left and the file with the named matches replaced on the right', async () => {
        const w = replaceWorld({ 'a.txt': 'foo foo\nfoo\n' });
        const answer = await previewPost(w, place, queryOf('foo'), 'bar', [
            { line: 1, at: 0 },
            { line: 1, at: 4 },
            { line: 2, at: 0 }
        ]);
        expect(answer.status).toBe(200);
        expect(sides(answer)).toMatchObject({
            original: 'foo foo\nfoo\n',
            modified: 'bar bar\nbar\n',
            newPath: 'hub:a.txt'
        });
        expect(readFileSync(join(w.hub, 'a.txt'), 'utf8')).toBe('foo foo\nfoo\n');
    });

    it('leaves a match it was not named for unreplaced, which is how a dismissed hit stays', async () => {
        const w = replaceWorld({ 'a.txt': 'foo foo\nfoo\n' });
        const answer = await previewPost(w, place, queryOf('foo'), 'bar', [
            { line: 1, at: 0 },
            { line: 2, at: 0 }
        ]);
        expect(sides(answer).modified).toBe('bar foo\nbar\n');
    });

    it('shows another replace text in a second preview of the same file', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        const first = await previewPost(w, place, queryOf('foo'), 'bar', [{ line: 1, at: 0 }]);
        const second = await previewPost(w, place, queryOf('foo'), 'quux', [{ line: 1, at: 0 }]);
        expect([sides(first).modified, sides(second).modified]).toEqual(['bar\n', 'quux\n']);
    });

    it('leaves a named match that is no longer in the file unreplaced instead of refusing the preview', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        const answer = await previewPost(w, place, queryOf('foo'), 'bar', [
            { line: 1, at: 0 },
            { line: 7, at: 3 }
        ]);
        expect(answer.status).toBe(200);
        expect(sides(answer).modified).toBe('bar\n');
    });

    it('applies the groups, the case and the line ends the write would', async () => {
        const w = replaceWorld({ 'a.txt': 'Foo bar\r\nx\r\n' });
        const answer = await previewPost(
            w,
            place,
            queryOf('(f)oo', { regex: true }),
            '$1\\n!',
            [{ line: 1, at: 0 }],
            true
        );
        expect(sides(answer).modified).toBe('F\r\n! bar\r\nx\r\n');
    });

    it('refuses with the word of the check: binary, missing, outside, protected and bad-query', async () => {
        const w = replaceWorld({ 'bin.dat': Buffer.from([102, 0, 1]) });
        const word = async (root: string, path: string, q = 'foo') =>
            (await previewPost(w, { root, path }, queryOf(q), 'x', [{ line: 1, at: 0 }])).body
                .error;
        expect(await word('hub', 'bin.dat')).toBe('binary');
        expect(await word('hub', 'none.txt')).toBe('missing');
        expect(await word('hub', '../x.txt')).toBe('outside');
        expect(await word('engine', 'local.yml', 'needle')).toBe('protected');
        expect(await word('hub', 'bin.dat', '')).toBe('bad-query');
    });
});

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
    it('previews 2000 hits in one file through the request the pane forms, which an address of the hits could not carry', async () => {
        const count = 2000;
        const w = replaceWorld({ 'a.txt': `${'foo '.repeat(count)}\n` });
        const hits = Array.from({ length: count }, (_, index) => ({ line: 1, at: index * 4 }));
        const settings = {
            query: { q: 'foo', word: false, case: false, regex: false, under: '' },
            replace: 'bar',
            preserve: false
        };
        const pane = diffState(previewSubject({ ...place, hits }, settings, 1), 'a.txt');
        const request = diffRequest(pane, OPS_TOKEN);
        const answer = await sent(w, request);
        expect(answer.status).toBe(200);
        expect(request.init?.method).toBe('POST');
        expect(sides({ body: JSON.parse(answer.text) as Record<string, unknown> }).modified).toBe(
            `${'bar '.repeat(count)}\n`
        );
    });

    it('refuses a preview posted without the write token and reads nothing', async () => {
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
    });

    it('refuses a preview whose hit is no line and place', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        const answer = await overHttp(
            w,
            {
                op: 'preview',
                query: queryOf('foo'),
                replace: 'bar',
                preserveCase: false,
                ...place,
                hits: [{ line: 0, at: 0 }]
            },
            { 'x-oculus-token': OPS_TOKEN }
        );
        expect([answer.status, answer.body.error]).toEqual([400, 'not-an-action']);
    });
});
