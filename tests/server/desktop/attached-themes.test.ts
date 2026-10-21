// Layer 4, server test. A window the desktop app opens onto an oculus it did not start takes the
// app themes it may start on from that oculus: the host asks `GET /api/app-theme` for each before
// the window opens (`fetchAppThemes` of src/desktop/server/health.ts). The request carries the
// oculus's own address as its `Origin`, which the origin guard's rule (`sameOrigin` of
// lib/server/core/auth.ts) admits, so the stub here answers only a request that rule passes. A
// refusal, an answer of another shape and no answer in time each give null for that theme.

import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { fetchAppThemes } from '../../../src/desktop/server/health.ts';
import { sameOrigin } from '../../../src/lib/server/core/auth.ts';

/** The saved name of the theme the stub serves, and of one it refuses as missing. */
const GOOD = 'app:rice-pack/Paper';
const GONE = 'app:rice-pack/Gone';

/** The answer the stub gives for GOOD. */
const ANSWER = {
    ok: true,
    theme: { colors: { 'editor.background': '#101010', bad: 5 }, tokenColors: [] },
    uiTheme: 'vs-dark',
    label: 'Paper',
    app: 'Rice Pack'
};

let running: Server | null = null;

afterEach(async () => {
    const server = running;
    running = null;
    if (server !== null) await new Promise((done) => server.close(done));
});

/** The request's headers as the guard reads them. */
function headersOf(request: IncomingMessage): Headers {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
        if (typeof value === 'string') headers.set(name, value);
    }
    return headers;
}

/** A stub oculus on a free port: `answer` gives the body of a request the guard admits. */
async function stub(answer: (choice: string) => unknown, silent = false): Promise<number> {
    const server = createServer((request, response) => {
        if (silent) return;
        const url = new URL(request.url ?? '', 'http://stub');
        const admitted = sameOrigin(headersOf(request), request.headers.host ?? '');
        const body = admitted ? answer(url.searchParams.get('choice') ?? '') : { error: 'origin' };
        response.writeHead(admitted ? 200 : 403, { 'content-type': 'application/json' });
        response.end(JSON.stringify(body));
    });
    running = server;
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    return (server.address() as AddressInfo).port;
}

describe('the app themes a window onto another oculus starts on', () => {
    it('reads each theme the oculus serves, and null for one it refuses', async () => {
        const port = await stub((choice) =>
            choice === GOOD ? ANSWER : { ok: false, word: 'missing' }
        );
        expect(await fetchAppThemes(port, [GOOD, GONE], 5_000)).toEqual({
            [GOOD]: {
                theme: { colors: { 'editor.background': '#101010' }, tokenColors: [] },
                uiTheme: 'vs-dark',
                label: 'Paper',
                app: 'Rice Pack'
            },
            [GONE]: null
        });
    });

    it('gives null for an answer of another shape and for no answer in time', async () => {
        const shaped = await stub(() => ({ ok: true, theme: {}, uiTheme: 'dark' }));
        expect(await fetchAppThemes(shaped, [GOOD], 5_000)).toEqual({ [GOOD]: null });
        await new Promise((done) => running?.close(done));
        const silent = await stub(() => ANSWER, true);
        expect(await fetchAppThemes(silent, [GOOD], 200)).toEqual({ [GOOD]: null });
        running?.closeAllConnections();
    });

    it('asks nothing when no app theme is named', async () => {
        expect(await fetchAppThemes(1, [], 200)).toEqual({});
    });
});
