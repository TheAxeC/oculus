// Layer 2, client-state tests. The composer's and the Customizations section's reads
// (state/sessions/agents.svelte.ts): an answer is asked for once per key on its first read, a key
// whose answer is out is not asked again, a refresh supersedes the answer still out, and a failed
// answer reads as its error.
//
// Nothing here reaches a server: `fetch` is a stub whose answers the case releases by hand.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createAgents,
    exportUrl,
    scopeQuery,
    type AgentsStore
} from '../../../src/lib/state/sessions/agents.svelte.ts';
import { createQueries } from '../../../src/lib/state/client/queries.svelte.ts';
import type { Held } from '../../../src/lib/state/sessions/agents.svelte.ts';

type Out = { url: string; answer: (status: number, body: unknown) => void; fail: () => void };

let asked: Out[] = [];
let agents: AgentsStore;

const SCOPE = { agent: 'claude' as const, account: 'Uni', workspace: '/w a' };

/** Let the microtask that asks, and the turns that carry the answer into the store, run. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
    asked = [];
    agents = createAgents(createQueries());
    vi.stubGlobal('fetch', (url: string) => {
        return new Promise<Response>((resolve, reject) => {
            asked.push({
                url,
                answer: (status, body) => resolve(new Response(JSON.stringify(body), { status })),
                fail: () => reject(new Error('offline'))
            });
        });
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('a read of the agents answer', () => {
    it('is pending until it lands, and is asked for once however often it is read', async () => {
        expect(agents.agentChoices()).toEqual({ value: null, pending: true, error: '' });
        expect(agents.agentChoices().pending).toBe(true);
        await settle();
        expect(asked.map((one) => one.url)).toEqual(['/api/agents']);
        asked[0].answer(200, { agents: [], accounts: [], findings: [] });
        await settle();
        expect(agents.agentChoices()).toEqual({
            value: { agents: [], accounts: [], findings: [] },
            pending: false,
            error: ''
        });
        expect(asked).toHaveLength(1);
    });

    it('names the account it is for in the query and in its key', async () => {
        agents.agentChoices('Uni');
        agents.agentChoices();
        await settle();
        expect(asked.map((one) => one.url)).toEqual(['/api/agents?account=Uni', '/api/agents']);
    });

    it("reads a refusal as the server's error, a bare one as its status, and a thrown fetch as its message", async () => {
        agents.agentChoices('a');
        agents.agentChoices('b');
        agents.agentChoices('c');
        await settle();
        asked[0].answer(400, { error: 'no such account' });
        asked[1].answer(500, {});
        asked[2].fail();
        await settle();
        expect(agents.agentChoices('a')).toEqual({
            value: null,
            pending: false,
            error: 'no such account'
        });
        expect(agents.agentChoices('b').error).toBe('500');
        expect(agents.agentChoices('c').error).toBe('offline');
    });
});

describe('the Customizations reads', () => {
    it('keep the refreshed answer when the one it superseded lands after it', async () => {
        agents.customizations(SCOPE);
        await settle();
        agents.refreshCustomizations(SCOPE);
        await settle();
        expect(asked).toHaveLength(2);
        const scope = { agent: 'claude', account: 'Uni', workspace: '/w a' };
        asked[1].answer(200, { ...scope, rows: ['new'] });
        await settle();
        asked[0].answer(200, { ...scope, rows: ['old'] });
        await settle();
        expect(agents.customizations(SCOPE).value).toEqual({ ...scope, rows: ['new'] });
    });

    it('ask a file under its scope and its path, apart from the rows', async () => {
        agents.customizations(SCOPE);
        agents.customizationText(SCOPE, '/w a/CLAUDE.md');
        await settle();
        expect(asked.map((one) => one.url)).toEqual([
            '/api/customizations?agent=claude&account=Uni&workspace=%2Fw+a',
            '/api/customizations?agent=claude&account=Uni&workspace=%2Fw+a&file=%2Fw+a%2FCLAUDE.md'
        ]);
    });

    it('key a scope by its agent, account and workspace, and save an export as Markdown', () => {
        expect(scopeQuery({ agent: 'codex', account: '', workspace: '/x' })).toBe(
            'agent=codex&account=&workspace=%2Fx'
        );
        expect(exportUrl('s 1')).toBe('/api/transcript?id=s+1&format=markdown');
    });

    it('save nothing where there is no document to click in', () => {
        expect(agents.exportSession('s1')).toBe(false);
    });
});

describe('an answer whose fields are of the wrong type', () => {
    /** What a fresh store holds for the agents key once the endpoint answered `text`. */
    async function heldAfter(text: string, status = 200): Promise<Held<unknown>> {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
        const fresh = createAgents(createQueries());
        fresh.agentChoices();
        await settle();
        return fresh.agentChoices();
    }

    it.each([
        ['a refusal whose error is a number', '{"error":3}', 500, '500'],
        ['a refusal with a list as its body', '[]', 500, '500'],
        ['a refusal with its sentence', '{"error":"x"}', 500, 'x']
    ])('answers %s as the error it names', async (_name, text, status, error) => {
        expect(await heldAfter(text, status)).toStrictEqual({ value: null, pending: false, error });
    });

    it.each([
        ['none of its lists', '{}'],
        ['no findings', '{"agents":[],"accounts":[]}'],
        ['no accounts', '{"agents":[],"findings":[]}'],
        ['no agents', '{"accounts":[],"findings":[]}']
    ])(
        'answers an agents body that carries %s as the failed read with the status',
        async (_n, text) => {
            expect(await heldAfter(text)).toStrictEqual({
                value: null,
                pending: false,
                error: '200'
            });
        }
    );

    it.each(['rows', 'agent', 'account', 'workspace'])(
        'answers a customizations body without %s as the failed read with the status',
        async (field) => {
            const whole: Record<string, unknown> = {
                agent: 'claude',
                account: 'Uni',
                workspace: '/w',
                rows: []
            };
            const body = Object.fromEntries(
                Object.entries(whole).filter(([name]) => name !== field)
            );
            vi.stubGlobal('fetch', () => Promise.resolve(Response.json(body)));
            const fresh = createAgents(createQueries());
            fresh.customizations(SCOPE);
            await settle();
            expect(fresh.customizations(SCOPE)).toStrictEqual({
                value: null,
                pending: false,
                error: '200'
            });
        }
    );

    it.each(['path', 'text'])(
        'answers a customization file body without %s as the failed read with the status',
        async (field) => {
            const whole: Record<string, unknown> = { path: 'p', text: 't' };
            const body = Object.fromEntries(
                Object.entries(whole).filter(([name]) => name !== field)
            );
            vi.stubGlobal('fetch', () => Promise.resolve(Response.json(body)));
            const fresh = createAgents(createQueries());
            fresh.customizationText(SCOPE, 'p');
            await settle();
            expect(fresh.customizationText(SCOPE, 'p')).toStrictEqual({
                value: null,
                pending: false,
                error: '200'
            });
        }
    );

    it('hands on a body that carries every list, as it came, from the three reads', async () => {
        const body = {
            agents: [],
            accounts: [],
            findings: [],
            agent: 'claude',
            account: 'Uni',
            workspace: '/w',
            rows: [],
            path: 'p',
            text: 't'
        };
        vi.stubGlobal('fetch', () => Promise.resolve(Response.json(body)));
        const fresh = createAgents(createQueries());
        fresh.agentChoices();
        fresh.customizations(SCOPE);
        fresh.customizationText(SCOPE, 'p');
        await settle();
        const expected = { value: body, pending: false, error: '' };
        expect(fresh.agentChoices()).toStrictEqual(expected);
        expect(fresh.customizations(SCOPE)).toStrictEqual(expected);
        expect(fresh.customizationText(SCOPE, 'p')).toStrictEqual(expected);
    });

    it.each([
        ['null on a refusal', 'null', 500, '500'],
        ['text that is not JSON on a refusal', 'nope', 500, '500'],
        ['null', 'null', 200, '200'],
        ['text that is not JSON', 'nope', 200, '200'],
        ['a list', '[]', 200, '200'],
        ['a map whose agents are a string', '{"agents":"x"}', 200, '200'],
        ['a map whose accounts are a map', '{"accounts":{}}', 200, '200']
    ])(
        'answers a body that is %s as the failed read with the status',
        async (_name, text, status, error) => {
            expect(await heldAfter(text, status)).toStrictEqual({
                value: null,
                pending: false,
                error
            });
        }
    );

    it('answers rows that are a string, and a file text that is a number, as the failed read', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ rows: 'x', text: 3 })));
        const fresh = createAgents(createQueries());
        fresh.customizations(SCOPE);
        fresh.customizationText(SCOPE, 'p');
        await settle();
        const failed = { value: null, pending: false, error: '200' };
        expect(fresh.customizations(SCOPE)).toStrictEqual(failed);
        expect(fresh.customizationText(SCOPE, 'p')).toStrictEqual(failed);
    });
});
