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

type Out = { url: string; answer: (status: number, body: unknown) => void; fail: () => void };

let asked: Out[] = [];
let agents: AgentsStore;

const SCOPE = { agent: 'claude' as const, account: 'Uni', workspace: '/w a' };

/** Let the microtask that asks, and the one that reads the answer, run. */
async function settle(): Promise<void> {
    for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
}

beforeEach(() => {
    asked = [];
    agents = createAgents();
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
        asked[0].answer(200, { agents: [], accounts: [] });
        await settle();
        expect(agents.agentChoices()).toEqual({
            value: { agents: [], accounts: [] },
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
        asked[1].answer(200, { rows: ['new'] });
        await settle();
        asked[0].answer(200, { rows: ['old'] });
        await settle();
        expect(agents.customizations(SCOPE).value).toEqual({ rows: ['new'] });
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
