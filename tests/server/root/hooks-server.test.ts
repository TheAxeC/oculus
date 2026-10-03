// Layer 2, server tests. Kit's handle reads the ServerContext off the raw request and puts it,
// with its token, on the event's locals; the built entry's wrapper is what puts it on the request.
// The configuration is read once a request that asks for it, and not at all by one that does not,
// and a route reads it as the disk holds it at that request. Every request under /api/ passes the
// one origin rule before any route sees it, which refuses a request with neither header outside the
// four paths that admit one, and passes the two OAuth callbacks unchecked.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RequestEvent } from '@sveltejs/kit';
import { afterEach, describe, expect, vi } from 'vitest';
import { handle } from '../../../src/hooks.server.ts';
import * as config from '../../../src/lib/data/sources/config.ts';
import { LOCAL_NAME } from '../../../src/lib/data/sources/config.ts';
import { carryingHandler, type OculusRequest } from '../../../src/lib/server/root/context.ts';
import { GET as mailCallbackGet } from '../../../src/routes/api/(accounts)/mail/callback/+server.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { contextFixture } from './context-fixture.ts';

afterEach(() => {
    vi.restoreAllMocks();
});

type Resolve = Parameters<typeof handle>[0]['resolve'];

/** This checkout, whose tracked config/ the hook reads; nothing here writes to it. */
const ENGINE = fileURLToPath(new URL('../../..', import.meta.url));

/** One request through the hook, answered by `resolve`, over a context the case closes. */
async function through(resolve: Resolve): Promise<App.Locals> {
    const context = contextFixture({ token: 'hook-token', engine: ENGINE });
    const request = {} as OculusRequest;
    carryingHandler(() => undefined, context)(request, {});
    const locals = {} as App.Locals;
    const event = {
        platform: { req: request },
        locals,
        url: new URL('http://127.0.0.1:8791/'),
        route: { id: '/' },
        request: new Request('http://127.0.0.1:8791/')
    } as unknown as Parameters<typeof handle>[0]['event'];
    await handle({ event, resolve });
    context.close();
    return locals;
}

describe('the server hook', () => {
    it('puts the carried context and its token on locals before resolving', async () => {
        const context = contextFixture({ token: 'hook-token' });
        const request = {} as OculusRequest;
        const handler = carryingHandler((held: IncomingMessage) => {
            expect((held as OculusRequest).oculus).toBe(context);
        }, context);
        handler(request, {});

        const locals = {} as App.Locals;
        const resolve = vi.fn(() => Promise.resolve(new Response('<title>%oculus.title%</title>')));
        const event = {
            platform: { req: request },
            locals,
            url: new URL('http://127.0.0.1:8791/'),
            route: { id: '/' },
            request: new Request('http://127.0.0.1:8791/')
        } as unknown as Parameters<typeof handle>[0]['event'];
        await handle({ event, resolve });

        expect(locals.server).toBe(context);
        expect(locals.token).toBe('hook-token');
        expect(resolve).toHaveBeenCalledOnce();
        context.close();
    });

    it('reads the configuration for no request that never asks for it', async () => {
        const read = vi.spyOn(config, 'loadConfig');
        await through(vi.fn(() => Promise.resolve(new Response('{}'))));
        expect(read).not.toHaveBeenCalled();
    });

    it('reads it once for a page, whose title and load function share the read', async () => {
        const read = vi.spyOn(config, 'loadConfig');
        let html: string | undefined;
        await through(async ({ locals }, options) => {
            locals.config();
            locals.config();
            const page = '<title>%oculus.title%</title>';
            html = await options?.transformPageChunk?.({ html: page, done: true });
            return new Response(html);
        });
        expect(read).toHaveBeenCalledOnce();
        expect(html).toMatch(/^<title>[^%]+<\/title>$/);
    });
});

/** What one request through the hook came to: the answer, and whether `resolve` was reached. */
type Guarded = { reached: boolean; response: Response };

/**
 * One request through the hook to a stub `resolve`: the address, the id of the route Kit matched it
 * to, and the headers and method a case names.
 */
async function guarded(
    address: string,
    route: string,
    headers: Record<string, string> = {},
    method = 'GET'
): Promise<Guarded> {
    const context = contextFixture({ token: 'hook-token', engine: ENGINE });
    const request = {} as OculusRequest;
    carryingHandler(() => undefined, context)(request, {});
    let reached = false;
    const event = {
        platform: { req: request },
        locals: {} as App.Locals,
        url: new URL(address),
        route: { id: route },
        request: new Request(address, { method, headers })
    } as unknown as Parameters<typeof handle>[0]['event'];
    const response = await handle({
        event,
        resolve: () => {
            reached = true;
            return Promise.resolve(new Response('resolved'));
        }
    });
    context.close();
    return { reached, response };
}

const SERVER = 'http://127.0.0.1:8791';

/** The id of the file browser's route, whose (files) group is a folder and not a path. */
const FS = '/api/(files)/fs';

describe('the origin guard on /api/', () => {
    it('lets a same-origin request through', async () => {
        const out = await guarded(`${SERVER}/api/fs`, FS, { 'sec-fetch-site': 'same-origin' });
        expect(out.reached).toBe(true);
    });

    it('refuses a foreign Origin with 403 before the route is reached', async () => {
        const out = await guarded(`${SERVER}/api/fs`, FS, { origin: 'https://evil.example' });
        expect(out.reached).toBe(false);
        expect(out.response.status).toBe(403);
        expect(await out.response.json()).toEqual({ error: 'forbidden' });
    });

    it('refuses a request with neither header to a route outside the four that admit one', async () => {
        for (const [address, route] of [
            [`${SERVER}/api/file/hub/notes.txt`, '/api/(files)/file/[root]/[...path]'],
            [`${SERVER}/api/lines`, '/api/(machine)/lines']
        ]) {
            const out = await guarded(address, route);
            expect(out.reached, route).toBe(false);
            expect(out.response.status, route).toBe(403);
            expect(await out.response.json()).toEqual({ error: 'forbidden' });
        }
    });

    it("lets the hook's curl through, which sends neither header", async () => {
        const out = await guarded(`${SERVER}/api/hook`, '/api/(sessions)/hook', {}, 'POST');
        expect(out.reached).toBe(true);
    });

    it("lets the command line's request for a picture through, which sends neither header", async () => {
        for (const [address, route] of [
            [`${SERVER}/api/wallpaper`, '/api/(docs)/wallpaper'],
            [`${SERVER}/api/memories?file=a.png`, '/api/(docs)/memories'],
            [`${SERVER}/api/diagrams/writes.svg`, '/api/(docs)/diagrams/[name]']
        ]) {
            const out = await guarded(address, route);
            expect(out.reached, route).toBe(true);
        }
    });

    it('judges a picture request that carries a header by the one rule', async () => {
        const out = await guarded(`${SERVER}/api/wallpaper`, '/api/(docs)/wallpaper', {
            'sec-fetch-site': 'cross-site'
        });
        expect(out.reached).toBe(false);
        expect(out.response.status).toBe(403);
    });

    it("lets a provider's redirect reach each callback", async () => {
        for (const [address, route] of [
            [`${SERVER}/api/calendar/callback?state=x`, '/api/(accounts)/calendar/callback'],
            [`${SERVER}/api/mail/callback?state=x`, '/api/(accounts)/mail/callback']
        ]) {
            const out = await guarded(address, route, { 'sec-fetch-site': 'cross-site' });
            expect(out.reached, route).toBe(true);
        }
    });

    it('judges the route Kit matched, so an encoded address is refused like a plain one', async () => {
        const out = await guarded(`${SERVER}/%61pi/fs`, FS, { origin: 'https://evil.example' });
        expect(out.reached).toBe(false);
        expect(out.response.status).toBe(403);
    });

    it('guards /api/ alone, so the page itself is served to a cross-site request', async () => {
        const out = await guarded(`${SERVER}/`, '/', { 'sec-fetch-site': 'cross-site' });
        expect(out.reached).toBe(true);
    });
});

/**
 * A scratch engine holding a copy of this checkout's tracked config/, the machine's own file left
 * out, and an empty scratch hub.
 */
function scratchEngine(): { engine: string; hub: string } {
    const engine = scratchDir('oculus-hook-engine-');
    cpSync(join(ENGINE, 'config'), join(engine, 'config'), {
        recursive: true,
        filter: (source) => !source.endsWith(LOCAL_NAME)
    });
    const hub = scratchDir('oculus-hook-hub-');
    return { engine, hub };
}

/** Replace one line of a config file in the scratch engine, checking the file is the copy. */
function rewrite(engine: string, relative: string, from: RegExp, to: string): void {
    const file = join(engine, 'config', relative);
    expect(resolve(file).startsWith(resolve(engine) + sep)).toBe(true);
    const text = readFileSync(file, 'utf8');
    expect(text).toMatch(from);
    writeFileSync(file, text.replace(from, to));
}

/** One request through the hook to a real route, over a context on the scratch engine. */
async function routed(
    engine: string,
    hub: string,
    address: string,
    route: string,
    headers: Record<string, string>,
    handler: (event: RequestEvent) => Response | Promise<Response>
): Promise<Response> {
    const context = contextFixture({
        token: 'hook-token',
        engine,
        local: {
            hub,
            port: 8791,
            claudeBin: 'claude',
            accounts: [],
            calendars: [],
            mail: [],
            workspaces: join(hub, 'workspaces.json')
        }
    });
    const request = {} as OculusRequest;
    carryingHandler(() => undefined, context)(request, {});
    const event = {
        platform: { req: request },
        locals: {} as App.Locals,
        url: new URL(address),
        route: { id: route },
        params: {},
        request: new Request(address, { headers })
    } as unknown as Parameters<typeof handle>[0]['event'];
    const response = await handle({
        event,
        resolve: (held) => Promise.resolve(handler(held))
    });
    context.close();
    return response;
}

describe('the configuration a route reads', () => {
    it(
        "is the disk as it is at the request, for the callback's words",
        { tags: ['slow'] },
        async () => {
            const { engine, hub } = scratchEngine();
            const ask = (): Promise<Response> =>
                routed(
                    engine,
                    hub,
                    `${SERVER}/api/mail/callback?state=x`,
                    '/api/(accounts)/mail/callback',
                    { 'sec-fetch-site': 'cross-site' },
                    mailCallbackGet as unknown as (event: RequestEvent) => Promise<Response>
                );
            const before = await ask();
            expect(before.status).toBe(400);
            expect(await before.text()).toContain('That link was not recognised.');
            rewrite(
                engine,
                'text/views/feeds/inbox.yml',
                /callback_bad: .*/,
                'callback_bad: The words were changed on disk.'
            );
            const after = await ask();
            expect(after.status).toBe(400);
            expect(await after.text()).toContain('The words were changed on disk.');
        }
    );
});
