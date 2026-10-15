// Layer 2, server tests. The transcript route reads only a file a session record of the last
// published payload names: the session's own transcript, or the transcript of an agent the record
// lists. A Claude agent's is `<session>/subagents/agent-<agent id>.jsonl` beside the session's
// file; a Codex agent's is the rollout of the session record whose id is the agent's thread id. An
// agent the record does not hold, a path given as the agent, an agent whose result named no agent
// id, an agent whose file is not there and a Codex agent whose own record the payload lacks are
// each refused as an unknown session is, and a file planted where a path of the request would lead
// is never what an answer holds. The sessions are a Claude transcript and two Codex rollouts in a
// scratch folder, folded by readSession as the sessions watcher folds them.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { handleTranscript } from '../../../src/lib/server/sessions/transcript-routes.ts';
import { readSession } from '../../../src/lib/server/sessions/stores/transcripts.ts';
import type { SessionRecord } from '../../../src/lib/data/model/index.ts';

const SESSION = 'b2c4a7e0-0000-4000-8000-000000000001';
const PARENT = '01a0be4f-0cf4-7a62-9172-5e1a0d9c6f0b';
const CHILD = '01a0be5f-d163-7291-8667-027dcec4bd6f';

/** One Claude record of a human turn holding `text`. */
function said(text: string, second: number): string {
    return JSON.stringify({
        type: 'user',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        origin: { kind: 'human' },
        message: { role: 'user', content: text }
    });
}

/** The answer of one Agent call, with the result Claude Code writes beside it. */
function answered(id: string, result: Record<string, unknown>, second: number): string {
    return JSON.stringify({
        type: 'user',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: id, content: 'answered' }]
        },
        toolUseResult: result
    });
}

/** An assistant turn calling the Agent tool once for each id. */
function calls(ids: string[], second: number): string {
    return JSON.stringify({
        type: 'assistant',
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        message: {
            role: 'assistant',
            content: ids.map((id) => ({
                type: 'tool_use',
                id,
                name: 'Agent',
                input: {
                    description: id,
                    subagent_type: 'general-purpose',
                    run_in_background: id === 'toolu_bg'
                }
            }))
        }
    });
}

/** One record of a Codex rollout: a completed item of `thread`, at `second`. */
function item(thread: string, value: Record<string, unknown>, second: number): string {
    return JSON.stringify({
        timestamp: new Date(1760000000000 + second * 1000).toISOString(),
        type: 'event_msg',
        payload: { type: 'item_completed', thread_id: thread, item: value }
    });
}

/** The opening `session_meta` of a Codex rollout, with the fields a subagent's carries. */
function meta(id: string, extra: Record<string, unknown>): string {
    return JSON.stringify({
        timestamp: new Date(1760000000000).toISOString(),
        type: 'session_meta',
        payload: { id, cwd: '/w', ...extra }
    });
}

/** The records of the last published payload, by session id. */
const records = new Map<string, SessionRecord>();

test.beforeAll(() => {
    const store = scratchDir('oculus-transcript-route-');
    const own = join(store, SESSION);
    const subagents = join(own, 'subagents');
    mkdirSync(subagents, { recursive: true });
    const path = join(store, `${SESSION}.jsonl`);
    writeFileSync(
        path,
        [
            said('the session asks', 0),
            calls(['toolu_bg', 'toolu_done', 'toolu_noid', 'toolu_gone'], 1),
            answered('toolu_bg', { isAsync: true, status: 'async_launched', agentId: 'abg1' }, 2),
            answered('toolu_done', { status: 'completed', agentId: 'adone1', totalTokens: 5 }, 3),
            answered('toolu_noid', { status: 'completed', totalTokens: 5 }, 4),
            answered('toolu_gone', { status: 'completed', agentId: 'agone1' }, 5)
        ].join('\n') + '\n'
    );
    writeFileSync(join(subagents, 'agent-abg1.jsonl'), `${said('the background agent', 0)}\n`);
    writeFileSync(join(subagents, 'agent-adone1.jsonl'), `${said('the finished agent', 0)}\n`);
    // The files a path of the request would lead to, which no answer may hold.
    for (const decoy of [
        join(store, 'x.jsonl'),
        join(own, 'x.jsonl'),
        join(subagents, 'x.jsonl')
    ]) {
        writeFileSync(decoy, `${said('a planted file', 0)}\n`);
    }
    records.set(SESSION, readSession(path));

    const day = join(store, 'codex', '2026', '09', '20');
    mkdirSync(day, { recursive: true });
    const parent = join(day, `rollout-2026-09-20T12-14-06-${PARENT}.jsonl`);
    const child = join(day, `rollout-2026-09-20T12-32-25-${CHILD}.jsonl`);
    const activity = (kind: string, second: number) =>
        item(
            PARENT,
            {
                type: 'SubAgentActivity',
                id: `call_${kind}`,
                kind,
                agent_thread_id: CHILD,
                agent_path: '/root/q36_finish'
            },
            second
        );
    writeFileSync(
        parent,
        [
            meta(PARENT, {}),
            item(
                PARENT,
                { type: 'UserMessage', content: [{ type: 'text', text: 'the parent asks' }] },
                1
            ),
            activity('started', 2),
            activity('completed', 3),
            item(
                PARENT,
                { type: 'SubAgentActivity', kind: 'started', agent_path: '/root/unnamed' },
                4
            )
        ].join('\n') + '\n'
    );
    writeFileSync(
        child,
        [
            meta(CHILD, { parent_thread_id: PARENT, agent_path: '/root/q36_finish' }),
            item(
                CHILD,
                { type: 'UserMessage', content: [{ type: 'text', text: 'the child asks' }] },
                2
            )
        ].join('\n') + '\n'
    );
    records.set(PARENT, readSession(parent, join(store, 'codex')));
    records.set(CHILD, readSession(child, join(store, 'codex')));
});

/**
 * The route's answer to one request for the session `id`, with `agent` when it is not null, the
 * payload holding every record but those of `absent`.
 */
async function asked(
    id: string,
    agent: string | null,
    absent: string[] = []
): Promise<{ status: number; text: string }> {
    const query = agent === null ? '' : `&agent=${encodeURIComponent(agent)}`;
    const response = handleTranscript(
        new Request(`http://oculus.test/api/transcript?id=${id}${query}`),
        { recordFor: (asked) => (absent.includes(asked) ? null : (records.get(asked) ?? null)) }
    );
    return { status: response.status, text: await response.text() };
}

describe('the transcript route', () => {
    it.each([
        {
            name: "the session's own transcript",
            agent: null,
            status: 200,
            turn: 'the session asks'
        },
        {
            name: 'a background agent',
            agent: 'toolu_bg',
            status: 200,
            turn: 'the background agent'
        },
        { name: 'a finished agent', agent: 'toolu_done', status: 200, turn: 'the finished agent' },
        { name: 'an agent the record does not list', agent: 'toolu_other', status: 404, turn: '' },
        { name: 'a path given as the agent', agent: '../../x', status: 404, turn: '' },
        {
            name: 'an agent whose result named no agent id',
            agent: 'toolu_noid',
            status: 404,
            turn: ''
        },
        { name: 'an agent whose file is not there', agent: 'toolu_gone', status: 404, turn: '' },
        {
            name: 'a Codex agent, read from its own record',
            id: PARENT,
            agent: '/root/q36_finish',
            status: 200,
            turn: 'the child asks'
        },
        {
            name: 'a Codex agent whose own record the payload lacks',
            id: PARENT,
            agent: '/root/q36_finish',
            absent: [CHILD],
            status: 404,
            turn: ''
        },
        {
            name: 'a Codex agent no item named a thread id for',
            id: PARENT,
            agent: '/root/unnamed',
            status: 404,
            turn: ''
        }
    ])('answers $status for $name, and never a planted file', async (row) => {
        const { agent, status, turn } = row;
        const answer = await asked(row.id ?? SESSION, agent, row.absent ?? []);
        expect(answer.status).toBe(status);
        expect(answer.text).not.toContain('a planted file');
        if (turn !== '') expect(answer.text).toContain(turn);
    });
});
