// Layer 4, test helper. The answers the Recover source readers are handed in place of the web: the
// recorded answers under `answers/<service>/` (a `.body` and, for an answer recorded from the
// service, the `.headers` curl wrote with its status line), and a fetch that answers each address
// from a table of routes and records every request, its headers and its body.
//
// An answer written for this test from a service's published API reference has no `.headers` file
// and answers 200. The size probe of a file (a GET of its first byte) is answered by `ranged`, a
// 206 whose `Content-Range` states the size.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Fetcher } from '../../../../../src/lib/server/machine/runs/recover/files.ts';

const ANSWERS = join(dirname(fileURLToPath(import.meta.url)), 'answers');

/** The text of a recorded answer's body, by its path below `answers/` without the extension. */
export function bodyOf(name: string): string {
    return readFileSync(join(ANSWERS, `${name}.body`), 'utf8');
}

/** A body's JSON, for a row that changes a recorded answer. */
export function jsonOf(name: string): unknown {
    return JSON.parse(bodyOf(name)) as unknown;
}

/** A response with a status, a body and headers, and the address it says it came from. */
export function reply(
    status: number,
    body: string | null,
    headers: Record<string, string> = {},
    url = ''
): Response {
    const response = new Response(body, { status, headers });
    if (url !== '') Object.defineProperty(response, 'url', { value: url });
    return response;
}

/** A recorded answer as the service sent it: the status and headers of `.headers`, when held. */
export function recorded(name: string, url = ''): Response {
    const file = join(ANSWERS, `${name}.headers`);
    if (!existsSync(file)) return reply(200, bodyOf(name), {}, url);
    const [status, ...lines] = readFileSync(file, 'utf8').split('\n');
    const headers: Record<string, string> = {};
    for (const line of lines) {
        const at = line.indexOf(':');
        if (at <= 0) continue;
        const key = line.slice(0, at).trim().toLowerCase();
        if (key === 'content-encoding' || key === 'transfer-encoding') continue;
        headers[key] = line.slice(at + 1).trim();
    }
    return reply(Number(status.split(' ')[1]), bodyOf(name), headers, url);
}

/** The answer to a size probe of a file of `size` bytes. */
export function ranged(size: number, url = ''): Response {
    return reply(206, 'x', { 'content-range': `bytes 0-0/${size}` }, url);
}

/** One request the fetch was handed; a header it did not carry reads as undefined. */
export type Asked = { url: string; headers: Partial<Record<string, string>>; body: unknown };

/** A route: the answer to an address, or a function of the address and the request. */
export type Routes = Record<string, Response | ((asked: Asked) => Response)>;

/**
 * A fetch that answers each address from the routes, a route whose key ends with `*` answering
 * every address it starts, and 404 to any other; and the requests it was handed, in order.
 */
export function answering(routes: Routes): { fetch: Fetcher; asked: Asked[] } {
    const asked: Asked[] = [];
    const fetch: Fetcher = (url, init) => {
        const headers = Object.fromEntries(new Headers(init?.headers).entries());
        const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
        const one: Asked = { url, headers, body };
        asked.push(one);
        const key =
            url in routes
                ? url
                : Object.keys(routes).find(
                      (route) => route.endsWith('*') && url.startsWith(route.slice(0, -1))
                  );
        const route = key === undefined ? undefined : routes[key];
        if (route === undefined) return Promise.resolve(reply(404, 'not found'));
        return typeof route === 'function' ? Promise.resolve(route(one)) : afresh(route);
    };
    return { fetch, asked };
}

/**
 * A new response with a route's status, headers, body and address, so each request gets one of
 * its own: a clone shares its body with the route, and a reader that cancels the body it was given
 * would wait for the route's body to be cancelled too.
 */
async function afresh(route: Response): Promise<Response> {
    const text = await route.clone().text();
    return reply(route.status, text, Object.fromEntries(route.headers.entries()), route.url);
}
