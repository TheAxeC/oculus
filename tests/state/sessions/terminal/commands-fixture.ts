// Layer 4, test helper. What the commands store suites share: a task terminal as the list carries
// it, a `sessions` message that lists terminals, and a `fetch` that records each request.

import { afterEach, beforeEach, vi } from 'vitest';
import type { Terminal } from '../../../../src/lib/data/model/index.ts';
import { createClientState, json, type ClientState } from '../../../fixtures/client.ts';

export const REPO = '/work/repo';

/** A task terminal as the list carries it. */
export function task(over: Partial<Terminal> = {}): Terminal {
    return {
        id: 'a1b2c3-shell',
        name: 'build',
        title: '',
        icon: '',
        color: '',
        kind: 'shell',
        cwd: REPO,
        command: 'make',
        pid: 1,
        created: '2026-10-02T08:00:00.000Z',
        attached: false,
        resumes: null,
        task: true,
        exit: null,
        job: { repo: REPO, name: 'build' },
        foreign: false,
        ...over
    };
}

/** Tell the client the terminals the server lists, as one `sessions` message. */
export function listTasks(client: ClientState, list: Terminal[], version = 1): void {
    client.entities.receive({
        channel: 'sessions',
        version,
        payload: { records: [], workspaces: [], terminals: list }
    });
}

/** One request the stubbed `fetch` was handed. */
export type Asked = { url: string; method: string; body: Record<string, unknown> | null };

/** Replace `fetch` with a stub that records each request in `asked` and answers as `answer`. */
export function serveInto(
    asked: Asked[],
    answer: (call: Asked) => Response | Promise<Response>
): void {
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        const call = {
            url,
            method: init?.method ?? 'GET',
            body:
                typeof init?.body === 'string'
                    ? (JSON.parse(init.body) as Record<string, unknown>)
                    : null
        };
        asked.push(call);
        return Promise.resolve(answer(call));
    });
}

/** The answer of a capture that read this text. */
export const captured = (output: string): Response => json({ ok: true, id: '', output });

/** The answer of `/api/fs`: one workspace serving `/work` as the root `hub`. */
export const servedRoots = (): Response =>
    json({
        current: 'w',
        workspaces: [{ name: 'w', roots: [{ key: 'hub', dir: '/work', fixed: true }] }],
        dropped: []
    });

/** The client and the request log of the running case, fresh for each case. */
export type Case = { client: ClientState; asked: Asked[] };

/**
 * Hold a case's client and request log, built again before each case; what a case stubbed on the
 * globals goes after it.
 */
export function freshCase(): Case {
    const held: Case = { client: createClientState(), asked: [] };
    beforeEach(() => {
        held.client = createClientState();
        held.asked = [];
    });
    afterEach(() => vi.unstubAllGlobals());
    return held;
}
