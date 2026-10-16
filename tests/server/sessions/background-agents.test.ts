// Layer 2, server tests. When a background subagent last worked is read from the timestamps its
// records carry, never from a file's modification time, so a transcript whose file was copied,
// restored or synced (its modification time now, its records days old) folds by its records. A
// Claude session in a scratch folder is folded by readSession as the sessions watcher folds it,
// with each file's modification time set as the row says after it is written.

import { mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { readSession } from '../../../src/lib/server/sessions/stores/transcripts.ts';

const SESSION = 'b2c4a7e0-0000-4000-8000-0000000000ad';
const MINUTE = 60 * 1000;
/** The session started fifteen and a half days before the fold, in minutes. */
const AGE = 15.6 * 24 * 60;
/** A record's text over 64 KiB in UTF-8, of two-byte letters, so the tail reader cuts in one. */
const LONG = String.fromCharCode(0xe9).repeat(40 * 1024);

type Row = {
    name: string;
    /** Whether the session's transcript carries the agent's completion notice, at minute 20. */
    notice: boolean;
    /** The minutes of the agent's own records; none for an agent with no own transcript. */
    agent: number[];
    /** The minute of the session's last record. */
    last: number;
    /** The minute each file's modification time is set to; null sets it to the fold's moment. */
    touched: number | null;
    /** Whether each of the agent's records holds LONG. */
    long: boolean;
    /** The status the row reads, and the minute it reads as ended at (null while it runs). */
    status: string;
    ended: number | null;
};

const ROWS: Row[] = [
    {
        name: 'a notice, its own transcript copied after it',
        notice: true,
        agent: [1, 19],
        last: 20,
        touched: null,
        long: false,
        status: 'done',
        ended: 20
    },
    {
        name: 'a notice, then a record of the agent after it',
        notice: true,
        agent: [1, 19, 40],
        last: 20,
        touched: 40,
        long: false,
        status: 'running',
        ended: null
    },
    {
        name: 'a notice, its own transcript untouched since its last record',
        notice: true,
        agent: [1, 19],
        last: 20,
        touched: 19,
        long: false,
        status: 'done',
        ended: 20
    },
    {
        name: 'no notice, its own transcript copied',
        notice: false,
        agent: [1, 19],
        last: 2,
        touched: null,
        long: false,
        status: 'done',
        ended: 19
    },
    {
        name: 'no notice, its own transcript written a minute ago',
        notice: false,
        agent: [1, AGE - 1],
        last: 2,
        touched: null,
        long: false,
        status: 'running',
        ended: null
    },
    {
        name: 'no notice and no own transcript, the session copied',
        notice: false,
        agent: [],
        last: 19,
        touched: null,
        long: false,
        status: 'done',
        ended: 19
    },
    {
        name: 'no notice and no own transcript, the session written a minute ago',
        notice: false,
        agent: [],
        last: AGE - 1,
        touched: null,
        long: false,
        status: 'running',
        ended: null
    },
    {
        name: 'no notice, its own transcript copied, each record over 64 KiB of two-byte letters',
        notice: false,
        agent: [1, 19],
        last: 2,
        touched: null,
        long: true,
        status: 'done',
        ended: 19
    }
];

it.each(ROWS)("reads a background agent's status and end from its records: $name", (row) => {
    const t0 = Date.now() - AGE * MINUTE;
    const at = (minute: number) => new Date(t0 + minute * MINUTE).toISOString();
    const user = (content: unknown, minute: number, extra: Record<string, unknown> = {}) =>
        JSON.stringify({
            type: 'user',
            timestamp: at(minute),
            message: { role: 'user', content },
            ...extra
        });
    const store = scratchDir('oculus-background-agents-');
    const subagents = join(store, SESSION, 'subagents');
    mkdirSync(subagents, { recursive: true });
    const path = join(store, `${SESSION}.jsonl`);
    const notice =
        '<task-notification>\n<task-id>abg1</task-id>\n<tool-use-id>toolu_bg</tool-use-id>\n' +
        '<status>completed</status>\n<result>done</result>\n</task-notification>';
    const lines = [
        JSON.stringify({
            type: 'assistant',
            timestamp: at(1),
            message: {
                role: 'assistant',
                content: [
                    {
                        type: 'tool_use',
                        id: 'toolu_bg',
                        name: 'Agent',
                        input: { description: 'probe', run_in_background: true }
                    }
                ]
            }
        }),
        user([{ type: 'tool_result', tool_use_id: 'toolu_bg', content: 'launched' }], 1, {
            toolUseResult: { isAsync: true, status: 'async_launched', agentId: 'abg1' }
        }),
        ...(row.notice ? [user(notice, 20)] : []),
        user('the session goes on', row.last)
    ];
    writeFileSync(path, `${lines.join('\n')}\n`);
    const file = join(subagents, 'agent-abg1.jsonl');
    if (row.agent.length > 0) {
        const text = row.long ? LONG : 'the agent works';
        writeFileSync(file, `${row.agent.map((minute) => user(text, minute)).join('\n')}\n`);
    }
    const time = (row.touched === null ? Date.now() : t0 + row.touched * MINUTE) / 1000;
    utimesSync(path, time, time);
    if (row.agent.length > 0) utimesSync(file, time, time);
    const agent = readSession(path).agents.find((one) => one.id === 'toolu_bg');
    expect({ status: agent?.status, ended: agent?.ended }).toEqual({
        status: row.status,
        ended: row.ended === null ? null : at(row.ended)
    });
});
