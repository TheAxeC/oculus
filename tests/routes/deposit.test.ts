// What the /api/deposit route answers. The route itself is two lines handing the request to
// lib/server/deposit-routes.ts with the token ServerContext minted, which is what this calls.
//
// Nothing here runs git or `gh`: the handler takes the operations and the known ids as options, and
// every case hands it a stub the test owns, so no repository is opened and no file is written
// anywhere. What a well-formed request does to a mirror is tests/server/deposit.test.ts.
//
// What this does NOT cover: the token reaching the page and Kit putting it on the event, which is
// exercised by the curl in the package's verification.

import { describe, expect, it } from 'vitest';
import { handleDeposit, handleDepositState } from '../../src/lib/server/deposit-routes.ts';
import type { DepositOptions } from '../../src/lib/server/deposit-routes.ts';
import { mintToken } from '../../src/lib/server/auth.ts';
import { contextFixture } from '../server/context-fixture.ts';

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
        stateFor: (id) =>
            Promise.resolve({
                id,
                repo: 'alpha-code',
                mirror: '/mirrors/alpha-code',
                exists: false,
                branch: '',
                remote: '',
                ahead: 0,
                plan: null
            }),
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

function read(url: string): Request {
    return new Request(url, {
        headers: { host: HOST, origin: `http://${HOST}`, 'sec-fetch-site': 'same-origin' }
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

    it('answers 404 for a project the portfolio does not hold', async () => {
        const into = options();
        const response = await handleDeposit(
            request({ action: 'plan', id: 'nothing' }),
            TOKEN,
            into
        );
        expect(response.status).toBe(404);
        expect(ran).toEqual([]);
    });

    it('runs a plan and answers what it said', async () => {
        const into = options();
        const response = await handleDeposit(request({ action: 'plan', id: ID }), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            output: 'done',
            plan: null,
            branches: []
        });
        expect(ran).toEqual([{ action: 'plan', id: ID, fields: { action: 'plan', id: ID } }]);
    });

    it('runs a push the page confirmed', async () => {
        const into = options();
        const response = await handleDeposit(
            request({ action: 'push', id: ID, confirm: true }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(ran.map((one) => one.action)).toEqual(['push']);
    });

    it('answers the mirror state to a read, and 404 to an id it does not hold', async () => {
        const into = options();
        const answered = await handleDepositState(read(`${URL_}?id=${ID}`), into);
        expect(answered.status).toBe(200);
        expect(((await answered.json()) as { state: { repo: string } }).state.repo).toBe(
            'alpha-code'
        );
        const refused = await handleDepositState(read(`${URL_}?id=nothing`), into);
        expect(refused.status).toBe(404);
    });
});
