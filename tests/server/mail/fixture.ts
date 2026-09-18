// Layer 2, server test support for the mail connector: a scratch directory of this run's own, one
// account's credential file in it, and a fetcher that answers from a table of addresses.
//
// Nothing here opens a connection and nothing reads or writes outside the directory the case made,
// which is asserted to be inside the system temporary directory before anything is written.

import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { expect } from 'vitest';
import type { MailAccountConfig } from '../../../src/lib/data/model.ts';
import { credentialFile } from '../../../src/lib/server/connect/store.ts';
import type { Fetcher } from '../../../src/lib/server/connect/oauth.ts';
import { scratchDir } from '../../scratch.ts';

export const GOOGLE: MailAccountConfig = { provider: 'google', label: 'work' };
export const MICROSOFT: MailAccountConfig = { provider: 'microsoft', label: 'uni' };
export const ACCESS = 'the-access-token-no-payload-may-carry';
export const REFRESH = 'the-refresh-token-no-payload-may-carry';

const made: string[] = [];

/** Remove every directory the cases made; called from each file's afterEach. */
export function cleanup(): void {
    while (made.length > 0) rmSync(made.pop() ?? '', { recursive: true, force: true });
}

export function scratch(name = 'oculus-mail-'): string {
    const dir = scratchDir(name);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    return dir;
}

/** One account's file, with the refresh token unless the case asks for the client half alone. */
export function writeAccount(dir: string, account: MailAccountConfig, connected = true): string {
    const file = credentialFile(dir, account);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(
        file,
        JSON.stringify({
            client_id: 'an-id',
            client_secret: 'a-secret',
            ...(connected ? { refresh_token: REFRESH } : {})
        })
    );
    return file;
}

/** The address one fetch call was made to, whichever of the three forms it was given in. */
export function urlOf(input: RequestInfo | URL): string {
    return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

/** One good answer, in the form a fetcher hands it back. */
export function answer(body: unknown, status = 200): Promise<Response> {
    return Promise.resolve(
        new Response(JSON.stringify(body), {
            status,
            headers: { 'content-type': 'application/json' }
        })
    );
}

/** One call a fake fetcher saw: where it went, how, and the body it was given. */
export type Call = { url: string; method: string; body: unknown };

export type Fake = { fetcher: Fetcher; calls: Call[] };

/**
 * A fetcher over a table of matchers: the first whose test matches the address answers. The token
 * endpoint is answered for every case, since every poll and every write exchanges one first. An
 * address nothing matches is a 404, so a call the connector should not make fails loudly.
 */
export function fakeFetcher(
    routes: { when: (url: string) => boolean; body: unknown; status?: number }[]
): Fake {
    const calls: Call[] = [];
    const fetcher: Fetcher = (input, init) => {
        const url = urlOf(input);
        const method = (init?.method ?? 'GET').toUpperCase();
        let body: unknown = init?.body ?? null;
        if (typeof body === 'string' && method === 'POST' && !url.includes('oauth')) {
            try {
                body = JSON.parse(body);
            } catch {
                // A form body stays the string it was; only the JSON writes are read back.
            }
        }
        calls.push({ url, method, body });
        if (url.includes('oauth2') || url.includes('/token')) {
            return answer({ access_token: ACCESS, refresh_token: REFRESH });
        }
        const route = routes.find((one) => one.when(url));
        if (route === undefined) return answer({ error: { status: 'NOT_FOUND' } }, 404);
        return answer(route.body, route.status ?? 200);
    };
    return { fetcher, calls };
}

/** Every address the fake fetcher was asked for, in order. */
export function addresses(fake: Fake): string[] {
    return fake.calls.map((call) => call.url);
}
