// Layer 2, server. The subagents a Claude session starts in the background, which the Agent call's
// answer does not end.
//
// An Agent call made with `run_in_background` answers at once with a launch notice naming the
// subagent's agent id, and the subagent works on in a transcript of its own,
// `<session>/subagents/agent-<agent id>.jsonl` beside the session's file. So the answer of such a
// call starts the agent rather than ending it: the agent is running until a later record of the
// session carries its completion notice (a `<task-notification>`, in a user message, or in the
// attachment of a queued command when the session was busy, naming the call's `<tool-use-id>`,
// or its agent id as the `<task-id>`, with the `<status>` it ended in), and without one it is
// running while its own transcript still grows and done once that has been still for
// IDLE_AFTER_SECONDS, the time after which a session reads idle. A subagent whose transcript is not
// found is judged by the session's own file the same way.
//
// A notice fires each time the agent stops, so a subagent resumed after its notice is ended again
// by the next one: the row reads what the latest notice says. `completed` reads done and `killed`,
// an agent stopped before it finished, reads stopped; any other status reads error. Between a
// resume and its next notice the subagent writes its own transcript again, later than the notice
// that ended it, and that write puts the row back to running.

import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { SessionRecord } from '../../../data/model.ts';
import { IDLE_AFTER_SECONDS, type Acc } from '../record.ts';
import { isMap, list } from './json.ts';

/** How a launch notice names the subagent, when the answer carries no structured field for it. */
const AGENT_ID = /agentId:\s*([A-Za-z0-9_-]+)/;

/** One completion notice, and the two ids and the status it carries. */
const NOTICE = /<task-notification>[\s\S]*?<\/task-notification>/g;
const TASK_ID = /<task-id>\s*([^<\s]+)\s*<\/task-id>/;
const TOOL_USE_ID = /<tool-use-id>\s*([^<\s]+)\s*<\/tool-use-id>/;
const STATUS = /<status>\s*([^<\s]+)\s*<\/status>/;
const RESULT = /<result>([\s\S]*?)<\/result>/;

/** The row status each notice status reads as; one not named here reads `error`. */
const ENDED_AS: Record<string, string> = { completed: 'done', killed: 'stopped' };

/** The text of a record's content, a string or its text blocks. */
function textOf(content: unknown): string {
    if (typeof content === 'string') return content;
    return list(content)
        .map((block) => (isMap(block) && typeof block.text === 'string' ? block.text : ''))
        .join('\n');
}

/**
 * Whether an Agent call's answer is a background launch: the call asked for one, or the answer
 * says it is one (`isAsync`, or a status of `async_launched`).
 */
export function isLaunch(acc: Acc, id: string, record: Record<string, unknown>): boolean {
    if (id in acc.background) return true;
    const answer = record.toolUseResult;
    return isMap(answer) && (answer.isAsync === true || answer.status === 'async_launched');
}

/** Take one launch answer: the agent stays running, and the agent id it names is kept. */
export function takeLaunch(
    acc: Acc,
    id: string,
    record: Record<string, unknown>,
    content: unknown
): void {
    const answer = record.toolUseResult;
    const named = isMap(answer) && typeof answer.agentId === 'string' ? answer.agentId : '';
    acc.background[id] = named || (AGENT_ID.exec(textOf(content))?.[1] ?? '');
}

/**
 * End every background subagent a record's completion notices name, by the call's tool-use id or
 * by the agent id its launch answer gave. A notice naming neither changes nothing. The launch stays
 * known, so a later notice for a resumed subagent ends its row again.
 */
export function takeNotices(acc: Acc, content: unknown, stamp: string | null): void {
    const text = textOf(content);
    if (!text.includes('<task-notification>')) return;
    for (const [notice] of text.matchAll(NOTICE)) {
        const call = TOOL_USE_ID.exec(notice)?.[1] ?? '';
        const task = TASK_ID.exec(notice)?.[1] ?? '';
        const id =
            call in acc.background
                ? call
                : Object.keys(acc.background).find((key) => task && acc.background[key] === task);
        const agent = id === undefined ? undefined : acc.agents[id];
        if (agent === undefined) continue;
        const status = STATUS.exec(notice)?.[1] ?? '';
        agent.status = ENDED_AS[status] ?? 'error';
        agent.ended = stamp;
        agent.resultChars = (RESULT.exec(notice)?.[1] ?? '').trim().length;
    }
}

/** A file's modification time in milliseconds, or null when it cannot be read. */
function modified(path: string): number | null {
    try {
        return statSync(path).mtimeMs;
    } catch {
        return null;
    }
}

/**
 * How much later than the notice that ended it a subagent's own transcript must be written to read
 * as resumed: the notice follows the subagent's last write, and a file system's times are coarse.
 */
const RESUMED_AFTER_MS = 5000;

/**
 * Settle, on a finished record, every background subagent: one no completion notice ended is
 * running while its own transcript (or, without one, the session's file) was written within
 * IDLE_AFTER_SECONDS of `now`, done otherwise, ended at that last write; one a notice ended whose
 * own transcript was written after that notice has been resumed, and is running again.
 */
export function settleBackground(
    acc: Acc,
    record: SessionRecord,
    sessionModified: number | null,
    now: number
): void {
    const folder = join(dirname(acc.path), acc.id, 'subagents');
    for (const [id, agentId] of Object.entries(acc.background)) {
        const agent = record.agents.find((one) => one.id === id);
        if (agent === undefined) continue;
        const own = agentId === '' ? null : modified(join(folder, `agent-${agentId}.jsonl`));
        if (agent.status !== 'running') {
            const ended = agent.ended === null ? NaN : Date.parse(agent.ended);
            if (own !== null && own > ended + RESUMED_AFTER_MS) {
                agent.status = 'running';
                agent.ended = null;
            }
            continue;
        }
        const last = own ?? sessionModified;
        if (last === null || now - last <= IDLE_AFTER_SECONDS * 1000) continue;
        agent.status = 'done';
        agent.ended = new Date(last).toISOString();
    }
}
