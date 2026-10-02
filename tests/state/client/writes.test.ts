// Layer 4, state test. How long a write waits for its answer: the duration config/behavior.yml
// names under `writes`, read at each write, and a write that outlasts it given up with the answer
// saying so, so a form waiting on it is let go.
//
// What this does NOT cover: the form's own line and its Save control, which need a DOM.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import {
    createWrites,
    writeTimeout,
    type WriteAnswer
} from '../../../src/lib/state/client/writes.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => {
    vi.unstubAllGlobals();
});

/** A fetch that never answers, and fails only once its request is given up. */
function silent(): void {
    vi.stubGlobal(
        'fetch',
        (_url: string, init: RequestInit) =>
            new Promise((_done, fail) => {
                init.signal?.addEventListener('abort', () => fail(new Error('aborted')));
            })
    );
}

describe('the time a write waits', () => {
    it('is the positive number of seconds the configuration names, in milliseconds', () => {
        expect(writeTimeout({ writes: { timeout_seconds: 30 } })).toBe(30000);
        expect(writeTimeout({ writes: { timeout_seconds: 0.5 } })).toBe(500);
    });

    it('is none for a configuration that names no positive number', () => {
        expect(writeTimeout(null)).toBeNull();
        expect(writeTimeout({})).toBeNull();
        expect(writeTimeout({ writes: [] })).toBeNull();
        expect(writeTimeout({ writes: { timeout_seconds: 0 } })).toBeNull();
        expect(writeTimeout({ writes: { timeout_seconds: -3 } })).toBeNull();
        expect(writeTimeout({ writes: { timeout_seconds: '30' } })).toBeNull();
    });

    it.each([
        [0, null],
        [-1, null],
        ['5', null],
        [Number('1e999'), null],
        [5, 5000],
        [undefined, null]
    ])('is read from a timeout_seconds of %p as %p', (seconds, wait) => {
        expect(writeTimeout({ writes: { timeout_seconds: seconds } })).toBe(wait);
    });
});

describe('a write that no answer reaches', () => {
    it(
        'is given up once the configured time has passed, and says so',
        { timeout: 5000 },
        async () => {
            silent();
            const writes = createWrites(() => ({ writes: { timeout_seconds: 0.05 } }));
            const answer = writes.send({ action: 'set', collection: 'tasks' });
            expect(writes.pending()).toBe(true);
            expect(await answer).toEqual({
                ok: false,
                changed: [],
                refused: [],
                error: t('app.write_timed_out')
            });
            expect(writes.pending()).toBe(false);
            expect(writes.lastError()).toBe(t('app.write_timed_out'));
        }
    );

    it('reads the time at each write, so a changed configuration holds for the next one', async () => {
        silent();
        let seconds = 60;
        const writes = createWrites(() => ({ writes: { timeout_seconds: seconds } }));
        seconds = 0.05;
        expect((await writes.send({ action: 'set' })).error).toBe(t('app.write_timed_out'));
    });
});

describe('a command posted to an endpoint', () => {
    // Revert: in postCommand of state/client/writes.svelte.ts, answer ok: true whatever the status.
    it('is answered with the body and the status when the endpoint answers JSON', async () => {
        const seen: { url: string; init: RequestInit | undefined }[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            seen.push({ url, init });
            return Promise.resolve(Response.json({ done: true }, { status: 200 }));
        });
        const writes = createWrites();
        writes.setToken('tok');
        const answer = await writes.postCommand('/api/mail', { a: 1 });
        expect(answer).toEqual({ ok: true, body: { done: true }, failed: '' });
        expect(seen[0].url).toBe('/api/mail');
        expect(seen[0].init?.method).toBe('POST');
        expect(new Headers(seen[0].init?.headers).get('x-oculus-token')).toBe('tok');
        expect(seen[0].init?.body).toBe('{"a":1}');
        vi.stubGlobal('fetch', () =>
            Promise.resolve(Response.json({ error: 'no' }, { status: 403 }))
        );
        expect(await writes.postCommand('/api/mail', {})).toEqual({
            ok: false,
            body: { error: 'no' },
            failed: ''
        });
    });

    // Revert: in postCommand, answer a thrown fetch with failed: 'unreadable'.
    it('is answered as unreachable when no answer comes back', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
        expect(await createWrites().postCommand('/api/mail', {})).toEqual({
            ok: false,
            body: {},
            failed: 'unreachable'
        });
    });

    // Revert: in postCommand, answer a body that is not JSON with failed: ''.
    it('is answered as unreadable when the answer is not JSON', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>', { status: 502 })));
        expect(await createWrites().postCommand('/api/mail', {})).toEqual({
            ok: false,
            body: {},
            failed: 'unreadable'
        });
    });
});

describe('a setting written by the page', () => {
    it('is one POST to the write endpoint carrying the file, the key and the value', async () => {
        const seen: { url: string; init: RequestInit | undefined }[] = [];
        vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
            seen.push({ url, init });
            return Promise.resolve(
                Response.json({ ok: true, changed: ['behavior.yml:changes.keep'], refused: [] })
            );
        });
        const writes = createWrites();
        writes.setToken('tok');
        const answer = await writes.writeConfigKey('behavior.yml', 'changes.keep', 300);
        expect(seen).toHaveLength(1);
        expect(seen[0].url).toBe('/api/write');
        expect(seen[0].init?.method).toBe('POST');
        const sent = { kind: 'config-key', file: 'behavior.yml', key: 'changes.keep', value: 300 };
        expect(seen[0].init?.body).toBe(JSON.stringify(sent));
        expect(answer.changed).toEqual(['behavior.yml:changes.keep']);
    });
});

/** A response object whose `json()` answers `body` itself, so a case can compare identity. */
function answering(body: unknown, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body)
    } as Response;
}

/** What the page makes of one write answered with `response`. */
async function answered(response: Response): Promise<WriteAnswer> {
    vi.stubGlobal('fetch', () => Promise.resolve(response));
    return createWrites().send({ kind: 'manifest' });
}

const NOTHING = { output: undefined, branches: undefined, id: undefined };

describe("a write's answer", () => {
    it('hands on the lists and the strings of a body that has them', async () => {
        const body = {
            ok: true as const,
            changed: ['a'],
            refused: [{ field: 'f', reason: 'r' }],
            output: 'o',
            branches: [{ name: 'main', upstream: 'origin/main', current: true }],
            id: 'x'
        };
        const answer = await answered(answering(body));
        expect(answer).toStrictEqual(body);
        expect(answer.changed).toBe(body.changed);
        expect(answer.refused).toBe(body.refused);
        expect(answer.branches).toBe(body.branches);
    });

    it.each([
        ['a changed that is a string', { ok: true, changed: 'a' }],
        ['a body that is a list', []],
        ['an error that is a number on a 200', { ok: false, error: 3 }]
    ])('is the empty success for %s', async (_name, body) => {
        const answer = await answered(answering(body, 200));
        expect(answer).toStrictEqual({ ok: true, changed: [], refused: [], ...NOTHING });
    });

    it.each([
        ['an error that is a number', { ok: false, error: 3 }],
        ['a body that is a list', []],
        ['a refused that is a string', { refused: 'x' }]
    ])('is HTTP 500 for %s on a 500', async (_name, body) => {
        const answer = await answered(answering(body, 500));
        expect(answer).toStrictEqual({ ok: false, changed: [], refused: [], error: 'HTTP 500' });
    });

    it('says the error text a failing answer carries', async () => {
        const answer = await answered(answering({ error: 'no' }, 400));
        expect(answer).toStrictEqual({ ok: false, changed: [], refused: [], error: 'no' });
    });

    it.each([
        ['JSON null', () => answering(null, 200)],
        ['text that is not JSON', () => new Response('<html>', { status: 200 })]
    ])('is a failed read with the status text for %s on a 200', async (_name, make) => {
        const answer = await answered(make());
        expect(answer).toStrictEqual({
            ok: false,
            changed: [],
            refused: [],
            error: 'HTTP 200',
            network: true
        });
    });

    it.each([
        ['JSON null', () => answering(null, 500)],
        ['text that is not JSON', () => new Response('<html>', { status: 500 })]
    ])('is the refusal with the status text for %s on a 500', async (_name, make) => {
        const answer = await answered(make());
        expect(answer).toStrictEqual({ ok: false, changed: [], refused: [], error: 'HTTP 500' });
    });

    it('leaves out the items of a list that are not what the list holds', async () => {
        const good = { field: 'f', reason: 'r' };
        const branch = { name: 'main', upstream: 'origin/main', current: false };
        const answer = await answered(
            answering({
                changed: ['a', 3],
                refused: [3, good, { field: 'g' }],
                branches: [{}, branch]
            })
        );
        expect(answer.changed).toStrictEqual(['a']);
        expect(answer.refused).toStrictEqual([good]);
        expect(answer.refused[0]).toBe(good);
        expect(answer.branches).toStrictEqual([branch]);
        expect(answer.branches?.[0]).toBe(branch);
    });
});

describe('a refusal that carries a code', () => {
    /** The writes with a listener, the messages it heard, and a fetch answering a coded 400. */
    function coded() {
        vi.stubGlobal('fetch', () =>
            Promise.resolve(answering({ error: 'kept', code: 'not-merged' }, 400))
        );
        const writes = createWrites();
        const heard: string[] = [];
        writes.onUnwritten((reason) => heard.push(reason));
        return { writes, heard };
    }

    it('hands the code on with the error', async () => {
        const { writes } = coded();
        const answer = await writes.writeGit('deleteBranch', '/hub', { name: 'x' });
        expect(answer).toStrictEqual({
            ok: false,
            changed: [],
            refused: [],
            error: 'kept',
            code: 'not-merged'
        });
    });

    it('is told to the listeners as any failure is', async () => {
        const { writes, heard } = coded();
        await writes.writeGit('deleteBranch', '/hub', { name: 'x' });
        expect(heard).toEqual(['kept']);
    });

    it('is not told when the caller answers that code with a question', async () => {
        const { writes, heard } = coded();
        await writes.writeGit('deleteBranch', '/hub', { name: 'x' }, { asked: ['not-merged'] });
        expect(heard).toEqual([]);
    });

    it('is told when the caller asks about another code', async () => {
        const { writes, heard } = coded();
        await writes.writeGit('deleteBranch', '/hub', { name: 'x' }, { asked: ['other'] });
        expect(heard).toEqual(['kept']);
    });
});
