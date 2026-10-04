// Layer 2, route tests. What the /api/deposit route answers. The route itself is two lines handing
// the request to lib/server/git/deposit-routes.ts with the token ServerContext minted, which is
// what this calls.
//
// Nothing here runs git or `gh`: the handler takes the operations and the known ids as options, and
// every case hands it a stub the test owns, so no repository is opened and no file is written
// anywhere. What a well-formed request does to a mirror is tests/server/git/deposit.test.ts.
//
// What this does NOT cover: the token reaching the page and Kit putting it on the event.

import { describe, expect } from 'vitest';
import { handleDeposit } from '../../../src/lib/server/git/deposit-routes.ts';
import type { DepositOptions } from '../../../src/lib/server/git/deposit-routes.ts';
import { it } from '../../fixtures/scratch.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';

const SERVER = contextFixture({ token: mintToken() });
const TOKEN = SERVER.token;
const HOST = '127.0.0.1:8791';
const URL_ = `http://${HOST}/api/deposit`;

/** The one project every case is allowed to name. It is a name: nothing opens it. */
const ID = 'alpha';

/** What ran, so a case can assert that a refusal refused before the operation. */
let ran: { action: string; id: string; fields: Record<string, unknown> }[] = [];

function options(extra: DepositOptions = {}): DepositOptions {
    ran = [];
    return {
        idsFor: () => [ID],
        run: (action, id, fields) => {
            ran.push({ action, id, fields });
            return Promise.resolve({ ok: true, output: 'done', error: '', plan: null });
        },
        ...extra
    };
}

/** A request as the page makes it, with whatever headers and body a case wants instead. */
function request(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request(URL_, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}

describe('the deposit endpoint', () => {
    it('refuses a request with no token', async () => {
        const into = options();
        const response = await handleDeposit(
            request({ action: 'plan', id: ID }, { 'x-oculus-token': '' }),
            TOKEN,
            into
        );
        expect(response.status).toBe(403);
        expect(ran).toEqual([]);
    });

    it('refuses a push that the page did not confirm', async () => {
        const into = options();
        const response = await handleDeposit(request({ action: 'push', id: ID }), TOKEN, into);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'this action needs the page to confirm it'
        });
        expect(ran).toEqual([]);
    });
});
